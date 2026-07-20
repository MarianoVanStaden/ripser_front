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
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import { precioRecetaApi } from '../../api/services/precioRecetaApi';
import type { RecetaFabricacionListDTO } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';
import AjusteMasivoDialog from '../../components/Precios/AjusteMasivoDialog';
import HistorialPreciosSection from '../../components/Precios/HistorialPreciosSection';

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

function margenPct(precio?: number | null, costo?: number | null): number | null {
  if (precio == null || !costo || costo <= 0) return null;
  return ((precio - costo) / costo) * 100;
}

export default function PreciosEquiposPage() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'precios' | 'historial'>('precios');
  const [busqueda, setBusqueda] = useState('');
  const [masivoOpen, setMasivoOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecetaFabricacionListDTO | null>(null);
  const [precioNuevo, setPrecioNuevo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: recetas = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.PRECIOS_RECETAS(),
    queryFn: () => recetaFabricacionApi.findAllActive(),
  });

  const cambioMutation = useMutation({
    mutationFn: () =>
      precioRecetaApi.cambiarPrecio(editTarget!.id, {
        precioNuevo: Number(precioNuevo),
        motivo,
        version: editTarget!.version ?? 0,
      }),
    onSuccess: (h) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRECIOS_RECETAS() });
      queryClient.invalidateQueries({ queryKey: ['historialPreciosRecetas'] });
      setSuccess(`Precio de ${h.recetaCodigo} actualizado a ${fmt(h.precioNuevo)}`);
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

  const openEdit = (r: RecetaFabricacionListDTO) => {
    setEditTarget(r);
    setPrecioNuevo(r.precioVenta != null ? String(r.precioVenta) : '');
    setMotivo('');
    setError(null);
    setSuccess(null);
  };

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return recetas;
    return recetas.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        (r.codigo || '').toLowerCase().includes(q) ||
        (r.modelo || '').toLowerCase().includes(q)
    );
  }, [recetas, busqueda]);

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="precios" label="Precios" />
        <Tab value="historial" label="Historial de cambios" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {subTab === 'historial' ? (
        <HistorialPreciosSection recetas={recetas} />
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Buscar equipo"
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
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Costo fabricación</TableCell>
                    <TableCell align="right">Precio de venta</TableCell>
                    <TableCell align="right">Margen</TableCell>
                    <TableCell align="center">Editar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtradas.map((r) => {
                    const margen = margenPct(r.precioVenta, r.costoFabricacion);
                    const bajoCosto =
                      r.precioVenta != null && r.costoFabricacion > 0 && r.precioVenta < r.costoFabricacion;
                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.codigo}</TableCell>
                        <TableCell>{r.nombre}</TableCell>
                        <TableCell><Chip size="small" label={r.tipoEquipo} /></TableCell>
                        <TableCell align="right">{fmt(r.costoFabricacion)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: bajoCosto ? 'error.main' : undefined }}>
                          {bajoCosto && (
                            <Tooltip title="Precio por debajo del costo de fabricación">
                              <WarningAmberIcon fontSize="inherit" color="error" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            </Tooltip>
                          )}
                          {fmt(r.precioVenta)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: bajoCosto ? 'error.main' : undefined }}>
                          {margen == null ? '—' : `${margen.toFixed(1)}%`}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => openEdit(r)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          Sin equipos activos
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
                Precio actual: <b>{fmt(editTarget.precioVenta)}</b> · Costo: {fmt(editTarget.costoFabricacion)}
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
              {Number(precioNuevo) > 0 && editTarget.costoFabricacion > 0 &&
                Number(precioNuevo) < editTarget.costoFabricacion && (
                  <Alert severity="warning">El precio nuevo queda por debajo del costo de fabricación.</Alert>
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

      <AjusteMasivoDialog open={masivoOpen} onClose={() => setMasivoOpen(false)} recetas={recetas} />
    </Box>
  );
}
