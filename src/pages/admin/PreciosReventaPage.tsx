import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productoTerminadoApi } from '../../api/services/productoTerminadoApi';
import { categoriaProductoApi } from '../../api/services/categoriaProductoApi';
import { precioProductoTerminadoApi } from '../../api/services/precioProductoTerminadoApi';
import type { ProductoTerminado } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';
import AjusteMasivoReventaDialog from '../../components/Precios/AjusteMasivoReventaDialog';
import HistorialPreciosReventaSection from '../../components/Precios/HistorialPreciosReventaSection';

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

function margenPct(precio?: number | null, costo?: number | null): number | null {
  if (precio == null || !costo || costo <= 0) return null;
  return ((precio - costo) / costo) * 100;
}

export default function PreciosReventaPage() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'precios' | 'historial'>('precios');
  const [busqueda, setBusqueda] = useState('');
  const [masivoOpen, setMasivoOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductoTerminado | null>(null);
  const [precioNuevo, setPrecioNuevo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: productos = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.PRECIOS_REVENTA(),
    queryFn: () => productoTerminadoApi.getActivos(),
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categoriasProducto'],
    queryFn: () => categoriaProductoApi.getAll(),
  });
  const categoriasReventa = useMemo(() => categorias.filter((c) => c.esReventa), [categorias]);

  const cambioMutation = useMutation({
    mutationFn: () =>
      precioProductoTerminadoApi.cambiarPrecio(editTarget!.id, {
        precioNuevo: Number(precioNuevo),
        motivo,
        version: editTarget!.version ?? 0,
      }),
    onSuccess: (h) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRECIOS_REVENTA() });
      queryClient.invalidateQueries({ queryKey: ['historialPreciosReventa'] });
      setSuccess(`Precio de ${h.productoCodigo} actualizado a ${fmt(h.precioNuevo)}`);
      setError(null);
      closeEdit();
    },
    onError: (e: any) => setError(e.response?.data?.message || e.message),
  });

  const closeEdit = () => {
    setEditTarget(null);
    setPrecioNuevo('');
    setMotivo('');
  };

  const openEdit = (p: ProductoTerminado) => {
    setEditTarget(p);
    setPrecioNuevo(p.precio != null ? String(p.precio) : '');
    setMotivo('');
    setError(null);
    setSuccess(null);
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo || '').toLowerCase().includes(q) ||
        (p.categoriaProducto?.nombre || '').toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="precios" label="Precios" />
        <Tab value="historial" label="Historial de cambios" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {subTab === 'historial' ? (
        <HistorialPreciosReventaSection productos={productos} />
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Buscar producto"
              size="small"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={{ minWidth: 280 }}
            />
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" startIcon={<TrendingUpIcon />} onClick={() => setMasivoOpen(true)}>
              Ajuste masivo
            </Button>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell align="right">Precio de venta</TableCell>
                    <TableCell align="right">Margen</TableCell>
                    <TableCell align="center">Editar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtrados.map((p) => {
                    const margen = margenPct(p.precio, p.costo);
                    const bajoCosto = p.precio != null && (p.costo ?? 0) > 0 && p.precio < (p.costo ?? 0);
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.codigo}</TableCell>
                        <TableCell>{p.nombre}</TableCell>
                        <TableCell>
                          {p.categoriaProducto?.nombre
                            ? <Chip size="small" label={p.categoriaProducto.nombre} />
                            : '—'}
                        </TableCell>
                        <TableCell align="right">{fmt(p.costo)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: bajoCosto ? 'error.main' : undefined }}>
                          {bajoCosto && (
                            <Tooltip title="Precio por debajo del costo">
                              <WarningAmberIcon fontSize="inherit" color="error" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            </Tooltip>
                          )}
                          {fmt(p.precio)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: bajoCosto ? 'error.main' : undefined }}>
                          {margen == null ? '—' : `${margen.toFixed(1)}%`}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => openEdit(p)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Sin productos de reventa activos
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Dialog de cambio manual */}
      <Dialog open={editTarget != null} onClose={closeEdit} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar precio</DialogTitle>
        <DialogContent>
          {editTarget && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="body2">
                {editTarget.codigo} · {editTarget.nombre}
                <br />
                Precio actual: <b>{fmt(editTarget.precio)}</b> · Costo: {fmt(editTarget.costo)}
              </Typography>
              <TextField
                label="Precio nuevo"
                type="number"
                value={precioNuevo}
                onChange={(e) => setPrecioNuevo(e.target.value)}
                autoFocus
                fullWidth
                inputProps={{ min: 0.01, step: 1000 }}
              />
              {Number(precioNuevo) > 0 && (editTarget.costo ?? 0) > 0 &&
                Number(precioNuevo) < (editTarget.costo ?? 0) && (
                  <Alert severity="warning">El precio nuevo queda por debajo del costo.</Alert>
                )}
              <TextField
                label="Motivo (obligatorio)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                fullWidth
                required
                multiline
                rows={2}
                inputProps={{ maxLength: 500 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!motivo.trim() || !(Number(precioNuevo) > 0) || cambioMutation.isPending}
            onClick={() => cambioMutation.mutate()}
            startIcon={cambioMutation.isPending ? <CircularProgress size={16} /> : undefined}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <AjusteMasivoReventaDialog
        open={masivoOpen}
        onClose={() => setMasivoOpen(false)}
        productos={productos}
        categorias={categoriasReventa}
      />
    </Box>
  );
}
