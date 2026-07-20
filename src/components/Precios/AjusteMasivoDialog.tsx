import { useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  precioRecetaApi,
  type AjusteMasivoPreviewRequest,
  type AjusteMasivoPreviewRow,
  type AlcanceAjuste,
  type ModoRedondeo,
  type TipoAjuste,
} from '../../api/services/precioRecetaApi';
import type { RecetaFabricacionListDTO, TipoEquipo } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';

const TIPOS_EQUIPO: TipoEquipo[] = ['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'];
const PASOS = [1000, 5000, 10000, 50000, 100000];

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

interface Props {
  open: boolean;
  onClose: () => void;
  recetas: RecetaFabricacionListDTO[];
}

export default function AjusteMasivoDialog({ open, onClose, recetas }: Props) {
  const queryClient = useQueryClient();

  // Paso 1: parámetros del ajuste
  const [alcance, setAlcance] = useState<AlcanceAjuste>('TODOS');
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo>('HELADERA');
  const [recetasSel, setRecetasSel] = useState<RecetaFabricacionListDTO[]>([]);
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('PCT');
  const [valor, setValor] = useState<string>('');
  const [paso, setPaso] = useState<number>(10000);
  const [modo, setModo] = useState<ModoRedondeo>('CEIL');
  const [margenMin, setMargenMin] = useState<string>('');

  // Paso 2: preview + selección de filas
  const [rows, setRows] = useState<AjusteMasivoPreviewRow[] | null>(null);
  const [seleccion, setSeleccion] = useState<Record<number, boolean>>({});
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parametrosAjuste = useMemo(() => {
    const signo = Number(valor) >= 0 ? '+' : '';
    const unidad = tipoAjuste === 'PCT' ? '%' : ' $';
    return `${signo}${valor}${unidad === ' $' ? ' $ fijo' : '%'} redondeo ${modo} ${paso}`;
  }, [valor, tipoAjuste, modo, paso]);

  const previewMutation = useMutation({
    mutationFn: (req: AjusteMasivoPreviewRequest) => precioRecetaApi.previewAjusteMasivo(req),
    onSuccess: (data) => {
      setRows(data);
      setSeleccion(Object.fromEntries(data.map((r) => [r.recetaId, true])));
      setError(data.length === 0 ? 'Ningún equipo con precio de lista en el alcance elegido' : null);
    },
    onError: (e: any) => setError(e.response?.data?.message || e.message),
  });

  const aplicarMutation = useMutation({
    mutationFn: () =>
      precioRecetaApi.aplicarAjusteMasivo({
        motivo,
        tipoCambio: tipoAjuste === 'PCT' ? 'MASIVO_PCT' : 'MASIVO_MONTO',
        parametrosAjuste,
        lineas: (rows ?? [])
          .filter((r) => seleccion[r.recetaId])
          .map((r) => ({ recetaId: r.recetaId, precioNuevo: r.precioNuevo, version: r.version })),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRECIOS_RECETAS() });
      queryClient.invalidateQueries({ queryKey: ['historialPreciosRecetas'] });
      setSuccessMsg(`Ajuste aplicado a ${res.cantidadAplicada} equipos`);
      setRows(null);
      setMotivo('');
    },
    onError: (e: any) => setError(e.response?.data?.message || e.message),
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      tipoEquipo: alcance === 'TIPO_EQUIPO' ? tipoEquipo : undefined,
      recetaIds: alcance === 'IDS' ? recetasSel.map((r) => r.id) : undefined,
      tipoAjuste,
      valor: Number(valor),
      pasoRedondeo: paso,
      modoRedondeo: modo,
      margenMinimoPct: margenMin ? Number(margenMin) : undefined,
    });
  };

  const seleccionadas = (rows ?? []).filter((r) => seleccion[r.recetaId]);
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
              <Select value={alcance} label="Alcance" onChange={(e) => setAlcance(e.target.value as AlcanceAjuste)}>
                <MenuItem value="TODOS">Todos los equipos activos</MenuItem>
                <MenuItem value="TIPO_EQUIPO">Por tipo de equipo</MenuItem>
                <MenuItem value="IDS">Selección manual</MenuItem>
              </Select>
            </FormControl>

            {alcance === 'TIPO_EQUIPO' && (
              <FormControl fullWidth>
                <InputLabel>Tipo de equipo</InputLabel>
                <Select value={tipoEquipo} label="Tipo de equipo" onChange={(e) => setTipoEquipo(e.target.value as TipoEquipo)}>
                  {TIPOS_EQUIPO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {alcance === 'IDS' && (
              <Autocomplete
                multiple
                options={recetas}
                value={recetasSel}
                onChange={(_, v) => setRecetasSel(v)}
                getOptionLabel={(r) => `${r.codigo || '—'} · ${r.nombre}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => <TextField {...params} label="Equipos" />}
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
              {seleccionadas.length} de {rows.length} equipos seleccionados · {parametrosAjuste}
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
                          setSeleccion(Object.fromEntries(rows.map((r) => [r.recetaId, e.target.checked])))
                        }
                      />
                    </TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Precio actual</TableCell>
                    <TableCell align="right">Precio nuevo</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell align="right">Margen nuevo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.recetaId}
                      hover
                      sx={r.alertaMargen ? { bgcolor: 'error.lighter', '& td': { color: 'error.main' } } : undefined}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={!!seleccion[r.recetaId]}
                          onChange={(e) => setSeleccion((s) => ({ ...s, [r.recetaId]: e.target.checked }))}
                        />
                      </TableCell>
                      <TableCell>{r.codigo}</TableCell>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.tipoEquipo}</TableCell>
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
              disabled={valorInvalido || previewMutation.isPending || (alcance === 'IDS' && recetasSel.length === 0)}
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
              Aplicar a {seleccionadas.length} equipos
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
