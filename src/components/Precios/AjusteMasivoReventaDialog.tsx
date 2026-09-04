import { useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  precioProductoTerminadoApi,
  type AjusteMasivoReventaPreviewRequest,
  type AjusteMasivoReventaPreviewRow,
  type AlcanceAjusteReventa,
  type ModoRedondeo,
  type TipoAjuste,
} from '../../api/services/precioProductoTerminadoApi';
import type { CategoriaProducto, ProductoTerminado } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';

const PASOS = [1000, 5000, 10000, 50000, 100000];

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

interface Props {
  open: boolean;
  onClose: () => void;
  productos: ProductoTerminado[];
  categorias: CategoriaProducto[];
}

export default function AjusteMasivoReventaDialog({ open, onClose, productos, categorias }: Props) {
  const queryClient = useQueryClient();

  // Paso 1: parámetros del ajuste
  const [alcance, setAlcance] = useState<AlcanceAjusteReventa>('TODOS');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [productosSel, setProductosSel] = useState<ProductoTerminado[]>([]);
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('PCT');
  const [valor, setValor] = useState<string>('');
  const [paso, setPaso] = useState<number>(10000);
  const [modo, setModo] = useState<ModoRedondeo>('CEIL');
  const [margenMin, setMargenMin] = useState<string>('');

  // Paso 2: preview + selección de filas
  const [rows, setRows] = useState<AjusteMasivoReventaPreviewRow[] | null>(null);
  const [seleccion, setSeleccion] = useState<Record<number, boolean>>({});
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const parametrosAjuste = useMemo(() => {
    const signo = Number(valor) >= 0 ? '+' : '';
    return `${signo}${valor}${tipoAjuste === 'PCT' ? '%' : ' $ fijo'} redondeo ${modo} ${paso}`;
  }, [valor, tipoAjuste, modo, paso]);

  const previewMutation = useMutation({
    mutationFn: (req: AjusteMasivoReventaPreviewRequest) => precioProductoTerminadoApi.previewAjusteMasivo(req),
    onSuccess: (data) => {
      setRows(data);
      setSeleccion(Object.fromEntries(data.map((r) => [r.productoId, true])));
      setError(data.length === 0 ? 'Ningún producto de reventa con precio en el alcance elegido' : null);
    },
    onError: (e: any) => setError(e.response?.data?.message || e.message),
  });

  const aplicarMutation = useMutation({
    mutationFn: () =>
      precioProductoTerminadoApi.aplicarAjusteMasivo({
        motivo,
        tipoCambio: tipoAjuste === 'PCT' ? 'MASIVO_PCT' : 'MASIVO_MONTO',
        parametrosAjuste,
        lineas: (rows ?? [])
          .filter((r) => seleccion[r.productoId])
          .map((r) => ({ productoId: r.productoId, precioNuevo: r.precioNuevo, version: r.version })),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRECIOS_REVENTA() });
      queryClient.invalidateQueries({ queryKey: ['historialPreciosReventa'] });
      setSuccessMsg(`Ajuste aplicado a ${res.cantidadAplicada} productos`);
      setRows(null);
      setMotivo('');
    },
    onError: (e: any) => setError(e.response?.data?.message || e.message),
  });

  const handleClose = () => {
    setRows(null);
    setSeleccion({});
    setMotivo('');
    setError(null);
    setSuccessMsg(null);
    onClose();
  };

  const handlePreview = () => {
    setError(null);
    previewMutation.mutate({
      alcance,
      categoriaId: alcance === 'CATEGORIA' ? Number(categoriaId) : undefined,
      productoIds: alcance === 'IDS' ? productosSel.map((p) => p.id) : undefined,
      tipoAjuste,
      valor: Number(valor),
      pasoRedondeo: paso,
      modoRedondeo: modo,
      margenMinimoPct: margenMin ? Number(margenMin) : undefined,
    });
  };

  const seleccionadas = (rows ?? []).filter((r) => seleccion[r.productoId]);
  const todasSeleccionadas = rows != null && rows.length > 0 && seleccionadas.length === rows.length;
  const conAlerta = seleccionadas.filter((r) => r.alertaMargen).length;
  const valorInvalido = valor === '' || Number.isNaN(Number(valor)) || Number(valor) === 0;

  return (
    <Dialog open={open} onClose={() => handleClose()} maxWidth="lg" fullWidth>
      <DialogTitle>Ajuste masivo de precios</DialogTitle>
      <DialogContent>
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {rows == null ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Alcance</InputLabel>
              <Select value={alcance} label="Alcance" onChange={(e) => setAlcance(e.target.value as AlcanceAjusteReventa)}>
                <MenuItem value="TODOS">Todos los productos de reventa activos</MenuItem>
                <MenuItem value="CATEGORIA">Por categoría</MenuItem>
                <MenuItem value="IDS">Selección manual</MenuItem>
              </Select>
            </FormControl>

            {alcance === 'CATEGORIA' && (
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select value={categoriaId} label="Categoría" onChange={(e) => setCategoriaId(Number(e.target.value))}>
                  {categorias.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {alcance === 'IDS' && (
              <Autocomplete
                multiple
                options={productos}
                value={productosSel}
                onChange={(_, v) => setProductosSel(v)}
                getOptionLabel={(p) => `${p.codigo || '—'} · ${p.nombre}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => <TextField {...params} label="Productos" />}
              />
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Tipo de ajuste</InputLabel>
                <Select value={tipoAjuste} label="Tipo de ajuste" onChange={(e) => setTipoAjuste(e.target.value as TipoAjuste)}>
                  <MenuItem value="PCT">Porcentaje (%)</MenuItem>
                  <MenuItem value="MONTO">Monto fijo ($)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={tipoAjuste === 'PCT' ? 'Porcentaje (ej. 10 = +10%)' : 'Monto (puede ser negativo)'}
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Paso de redondeo</InputLabel>
                <Select value={paso} label="Paso de redondeo" onChange={(e) => setPaso(Number(e.target.value))}>
                  {PASOS.map((p) => <MenuItem key={p} value={p}>${p.toLocaleString('es-AR')}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Modo de redondeo</InputLabel>
                <Select value={modo} label="Modo de redondeo" onChange={(e) => setModo(e.target.value as ModoRedondeo)}>
                  <MenuItem value="CEIL">Hacia arriba (CEIL)</MenuItem>
                  <MenuItem value="HALF_UP">Al más cercano (HALF_UP)</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Margen mínimo % (alerta)"
                type="number"
                value={margenMin}
                onChange={(e) => setMargenMin(e.target.value)}
                helperText="Vacío = alerta solo si queda bajo el costo"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        ) : (
          <>
            <Alert severity={conAlerta > 0 ? 'warning' : 'info'} sx={{ mb: 2 }}>
              {seleccionadas.length} de {rows.length} productos seleccionados · {parametrosAjuste}
              {conAlerta > 0 && ` · ${conAlerta} con alerta de margen`}
            </Alert>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={todasSeleccionadas}
                        indeterminate={seleccionadas.length > 0 && !todasSeleccionadas}
                        onChange={(e) =>
                          setSeleccion(Object.fromEntries(rows.map((r) => [r.productoId, e.target.checked])))
                        }
                      />
                    </TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="right">Precio actual</TableCell>
                    <TableCell align="right">Precio nuevo</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell align="right">Margen nuevo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.productoId}
                      hover
                      sx={r.alertaMargen ? { bgcolor: 'error.lighter', '& td': { color: 'error.main' } } : undefined}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={!!seleccion[r.productoId]}
                          onChange={(e) => setSeleccion((s) => ({ ...s, [r.productoId]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell>{r.codigo}</TableCell>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.categoriaNombre ?? '—'}</TableCell>
                      <TableCell align="right">{fmt(r.precioActual)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {r.alertaMargen && <WarningAmberIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }} />}
                        {fmt(r.precioNuevo)}
                      </TableCell>
                      <TableCell align="right">{fmt(r.costo)}</TableCell>
                      <TableCell align="right">
                        {r.margenNuevoPct == null ? '—' : `${r.margenNuevoPct.toFixed(1)}%`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TextField
              label="Motivo (obligatorio)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              fullWidth
              required
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 500 }}
            />
            <Typography variant="caption" color="text.secondary">
              Se aplican exactamente los precios de esta tabla. Si algún precio cambió desde el preview,
              el ajuste completo se rechaza y hay que rehacer el preview.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {rows == null ? (
          <>
            <Button onClick={() => handleClose()}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handlePreview}
              disabled={
                valorInvalido || previewMutation.isPending ||
                (alcance === 'IDS' && productosSel.length === 0) ||
                (alcance === 'CATEGORIA' && categoriaId === '')
              }
              startIcon={previewMutation.isPending ? <CircularProgress size={16} /> : undefined}
            >
              Ver preview
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => { setRows(null); setError(null); }}>Volver</Button>
            <Button onClick={() => handleClose()}>Cancelar</Button>
            <Button
              variant="contained"
              color={conAlerta > 0 ? 'warning' : 'primary'}
              onClick={() => aplicarMutation.mutate()}
              disabled={seleccionadas.length === 0 || !motivo.trim() || aplicarMutation.isPending}
              startIcon={aplicarMutation.isPending ? <CircularProgress size={16} /> : undefined}
            >
              Aplicar a {seleccionadas.length} productos
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
