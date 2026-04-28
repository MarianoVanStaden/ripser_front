import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControlLabel, Switch,
  Box, Typography, Alert, CircularProgress, Paper, Stack, Chip,
} from '@mui/material';
import { Brush, Colorize } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type {
  EquipoFabricadoListDTO,
  EquipoFabricadoDTO,
  TipoTerminacion,
} from '../../types';
import { useColores } from '../../context/ColoresContext';

interface AplicarTerminacionDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onSuccess: (equipoActualizado: EquipoFabricadoDTO) => void;
}

const TIPOS_TERMINACION: { value: TipoTerminacion; label: string }[] = [
  { value: 'COLOR_PINTURA', label: 'Color / Pintura' },
  { value: 'GALVANIZADO', label: 'Galvanizado' },
  { value: 'TAPIZADO', label: 'Tapizado' },
  { value: 'PLASTIFICADO', label: 'Plastificado' },
  { value: 'OTRO', label: 'Otro' },
];

/** Extracts the expected color from observaciones like "Color previsto: PLATA (detalle #354)" */
const parsearColorPrevisto = (obs?: string): string | null => {
  if (!obs) return null;
  const match = obs.match(/Color previsto:\s*([A-Z][A-Z0-9_]*)/i);
  return match ? match[1].toUpperCase() : null;
};

const AplicarTerminacionDialog: React.FC<AplicarTerminacionDialogProps> = ({
  open,
  equipo,
  onClose,
  onSuccess,
}) => {
  const [tipoTerminacion, setTipoTerminacion] = useState<TipoTerminacion>('COLOR_PINTURA');
  const [valor, setValor] = useState('');
  const [completarAlTerminar, setCompletarAlTerminar] = useState(true);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Full equipo DTO fetched from detail endpoint (list DTO may omit observaciones / clienteId)
  const [fullEquipo, setFullEquipo] = useState<EquipoFabricadoDTO | null>(null);
  const autoFilledRef = useRef(false);
  const { colores } = useColores();

  // When dialog opens, fetch the full equipo to ensure observaciones and clienteId are available
  useEffect(() => {
    if (!open || !equipo?.numeroHeladera) {
      setFullEquipo(null);
      autoFilledRef.current = false;
      return;
    }
    equipoFabricadoApi.findByNumeroHeladera(equipo.numeroHeladera)
      .then(full => setFullEquipo(full))
      .catch(() => setFullEquipo(null));
  }, [open, equipo?.numeroHeladera]);

  // Resolve color from fetched observaciones, with fallback to list DTO observaciones
  const colorPrevisto = parsearColorPrevisto(fullEquipo?.observaciones ?? equipo?.observaciones);

  // Pre-fill color when dialog opens if there's an expected color in observaciones
  useEffect(() => {
    if (open && colorPrevisto && colores.some((c) => c.nombre.toUpperCase() === colorPrevisto.toUpperCase()) && !autoFilledRef.current) {
      autoFilledRef.current = true;
      setTipoTerminacion('COLOR_PINTURA');
      // Match a known color by case-insensitive name and store its canonical name.
      const matched = colores.find((c) => c.nombre.toUpperCase() === colorPrevisto.toUpperCase());
      setValor(matched?.nombre ?? colorPrevisto);
    }
  }, [open, colorPrevisto, colores]);

  const handleClose = () => {
    setTipoTerminacion('COLOR_PINTURA');
    setValor('');
    setCompletarAlTerminar(true);
    setObservaciones('');
    setError(null);
    setFullEquipo(null);
    autoFilledRef.current = false;
    onClose();
  };

  const handleConfirmar = async () => {
    if (!equipo?.numeroHeladera) return;
    if (!valor.trim()) {
      setError('El campo de detalle es obligatorio.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resultado = await equipoFabricadoApi.aplicarTerminacionPorNumero(equipo.numeroHeladera, {
        tipoTerminacion,
        valor: valor.trim(),
        completarAlTerminar,
        observaciones: observaciones.trim() || undefined,
      });

      // The backend resets estadoAsignacion → DISPONIBLE when completing terminación.
      // If the equipo was reserved (PENDIENTE_TERMINACION or RESERVADO), restore RESERVADO state.
      // We use estadoAsignacion (not the asignado boolean) as the reliable indicator.
      const preTerminacionEstado =
        fullEquipo?.estadoAsignacion ?? equipo?.estadoAsignacion;
      const wasReserved =
        preTerminacionEstado === 'PENDIENTE_TERMINACION' ||
        preTerminacionEstado === 'RESERVADO';
      if (completarAlTerminar && wasReserved && resultado.id) {
        try {
          await equipoFabricadoApi.updateEstadoAsignacion(resultado.id, 'RESERVADO');
        } catch {
          // Non-fatal: terminación was applied, but state restore failed
        }
      }

      onSuccess(resultado);
      handleClose();
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message || err?.response?.data;
      const msg =
        status === 409
          ? 'El equipo no se encuentra en estado "Sin Terminación". Verifique el estado actual del equipo.'
          : typeof backendMsg === 'string'
          ? backendMsg
          : err?.message || 'Error al aplicar terminación';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Brush color="secondary" />
        Aplicar Terminación
      </DialogTitle>

      <DialogContent>
        {equipo && (
          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 3, bgcolor: 'secondary.50', borderColor: 'secondary.200' }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Equipo a terminar
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="caption" color="text.secondary">Número</Typography>
                <Typography variant="body2" fontWeight="600">{equipo.numeroHeladera}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Modelo</Typography>
                <Typography variant="body2" fontWeight="600">{equipo.modelo}</Typography>
              </Box>
              {equipo.color && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Color actual</Typography>
                  <Typography variant="body2" fontWeight="600">{equipo.color.nombre}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        )}

        {colorPrevisto && (
          <Alert
            severity="info"
            icon={<Colorize />}
            sx={{ mb: 2 }}
            action={
              <Chip
                label={colorPrevisto.replace(/_/g, ' ')}
                color="secondary"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            }
          >
            Color de terminación previsto para este pedido:
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            select
            label="Tipo de Terminación *"
            value={tipoTerminacion}
            onChange={(e) => { setTipoTerminacion(e.target.value as TipoTerminacion); setValor(''); }}
            fullWidth
          >
            {TIPOS_TERMINACION.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          {tipoTerminacion === 'COLOR_PINTURA' ? (
            <TextField
              select
              label="Color *"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              fullWidth
            >
              {colores.map((c) => (
                <MenuItem key={c.id} value={c.nombre}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              label="Detalle *"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              fullWidth
              placeholder="Especifique el detalle"
            />
          )}

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={completarAlTerminar}
                onChange={(e) => setCompletarAlTerminar(e.target.checked)}
                color="success"
              />
            }
            label={
              <Box>
                <Typography variant="body2">Marcar como completado al aplicar</Typography>
                <Typography variant="caption" color="text.secondary">
                  {completarAlTerminar
                    ? (['PENDIENTE_TERMINACION', 'RESERVADO'].includes(
                        (fullEquipo?.estadoAsignacion ?? equipo?.estadoAsignacion) ?? ''
                      ))
                      ? 'El equipo quedará completado y mantendrá su reserva actual'
                      : 'El equipo quedará disponible para venta/asignación'
                    : 'El equipo quedará en estado "Sin Terminación" para aplicar más etapas'}
                </Typography>
              </Box>
            }
          />

          {error && (
            <Alert severity="error">{error}</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmar}
          variant="contained"
          color="secondary"
          disabled={loading || !valor.trim()}
          startIcon={loading ? <CircularProgress size={18} /> : <Brush />}
        >
          {loading ? 'Aplicando...' : 'Aplicar Terminación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AplicarTerminacionDialog;
