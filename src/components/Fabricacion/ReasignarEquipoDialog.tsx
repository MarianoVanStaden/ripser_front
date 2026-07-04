import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
  Box, Alert, CircularProgress, RadioGroup, FormControlLabel, Radio, Chip, Stack,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { EquipoFabricadoDTO } from '../../types';

interface ReasignarEquipoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoDTO | null;
  onClose: () => void;
  onSuccess: (nuevo: EquipoFabricadoDTO) => void;
}

/**
 * Reasignación (swap) del pedido de un equipo a otro compatible.
 * Lista solo equipos COMPLETADO + DISPONIBLE con mismo tipo/modelo/color/medida,
 * de modo que la línea del pedido/factura nunca queda huérfana.
 */
const ReasignarEquipoDialog: React.FC<ReasignarEquipoDialogProps> = ({
  open, equipo, onClose, onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reemplazos, setReemplazos] = useState<EquipoFabricadoDTO[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && equipo?.id) {
      cargarReemplazos(equipo.id);
    } else {
      setReemplazos([]);
      setSeleccionado(null);
      setError(null);
    }
  }, [open, equipo?.id]);

  const cargarReemplazos = async (equipoId: number) => {
    setLoading(true);
    setError(null);
    setSeleccionado(null);
    try {
      const data = await equipoFabricadoApi.getReemplazosDisponibles(equipoId);
      setReemplazos(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Error al buscar equipos de reemplazo'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!equipo?.id || !seleccionado) return;
    setSaving(true);
    setError(null);
    try {
      const nuevo = await equipoFabricadoApi.reasignarEquipo(equipo.id, seleccionado);
      onSuccess(nuevo);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Error al reasignar el equipo'
      );
    } finally {
      setSaving(false);
    }
  };

  const specLabel = (e: EquipoFabricadoDTO) =>
    [e.modelo, e.medida?.nombre, e.color?.nombre].filter(Boolean).join(' · ');

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SwapHoriz color="primary" />
          <span>Reasignar equipo</span>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {equipo && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Equipo actual</Typography>
            <Typography variant="body1" fontWeight={600}>{equipo.numeroHeladera}</Typography>
            <Typography variant="body2">{specLabel(equipo)}</Typography>
            {equipo.clienteNombre && (
              <Typography variant="body2" color="text.secondary">
                Cliente: {equipo.clienteNombre}
              </Typography>
            )}
            <Chip
              size="small"
              label={equipo.estadoAsignacion}
              sx={{ mt: 0.5 }}
            />
          </Box>
        )}

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Equipo de reemplazo (mismo modelo · medida · color)
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box display="flex" justifyContent="center" py={3}><CircularProgress size={28} /></Box>
        ) : reemplazos.length === 0 ? (
          <Alert severity="info">
            No hay equipos DISPONIBLES del mismo modelo, medida y color para reemplazar.
          </Alert>
        ) : (
          <RadioGroup
            value={seleccionado ?? ''}
            onChange={(e) => setSeleccionado(Number(e.target.value))}
          >
            {reemplazos.map((r) => (
              <FormControlLabel
                key={r.id}
                value={r.id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{r.numeroHeladera}</Typography>
                    <Typography variant="caption" color="text.secondary">{specLabel(r)}</Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={<SwapHoriz />}
          onClick={handleConfirm}
          disabled={saving || !seleccionado}
        >
          {saving ? 'Reasignando…' : 'Reasignar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReasignarEquipoDialog;
