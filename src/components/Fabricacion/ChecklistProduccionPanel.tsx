import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Undo as UndoIcon,
  TaskAlt,
} from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import { employeeApi } from '../../api/services/employeeApi';
import type {
  Empleado,
  EtapaFabricacionDTO,
  TipoEtapaFabricacion,
} from '../../types';

interface Props {
  equipoId: number;
  etapas: EtapaFabricacionDTO[];
  progreso: number;
  onEtapaActualizada: (etapa: EtapaFabricacionDTO) => void;
  readOnly?: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatFecha = (iso?: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
};

const extractErrorMessage = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message ?? err?.message ?? 'Error desconocido';
};

const ChecklistProduccionPanel: React.FC<Props> = ({
  equipoId,
  etapas,
  progreso,
  onEtapaActualizada,
  readOnly = false,
}) => {
  const [completarDialog, setCompletarDialog] = useState<{
    open: boolean;
    etapa: EtapaFabricacionDTO | null;
  }>({ open: false, etapa: null });
  const [responsable, setResponsable] = useState<Empleado | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadosLoading, setEmpleadosLoading] = useState(false);
  const empleadosLoadedRef = useRef(false);

  const [loadingTipo, setLoadingTipo] = useState<TipoEtapaFabricacion | null>(null);
  const [confirmUndoTipo, setConfirmUndoTipo] = useState<TipoEtapaFabricacion | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current !== null) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const completadas = useMemo(
    () => etapas.filter((e) => e.completado).length,
    [etapas],
  );
  const todasCompletas = etapas.length > 0 && completadas === etapas.length;

  const ensureEmpleadosLoaded = async () => {
    if (empleadosLoadedRef.current) return;
    try {
      setEmpleadosLoading(true);
      const data = await employeeApi.getAllList();
      setEmpleados(data);
      empleadosLoadedRef.current = true;
    } catch (error) {
      setDialogError(extractErrorMessage(error));
    } finally {
      setEmpleadosLoading(false);
    }
  };

  const openCompletarDialog = (etapa: EtapaFabricacionDTO) => {
    setCompletarDialog({ open: true, etapa });
    setResponsable(null);
    setObservaciones('');
    setDialogError(null);
    void ensureEmpleadosLoaded();
  };

  const closeCompletarDialog = () => {
    if (submitting) return;
    setCompletarDialog({ open: false, etapa: null });
    setDialogError(null);
  };

  const handleConfirmCompletar = async () => {
    if (!completarDialog.etapa) return;
    const etapa = completarDialog.etapa;
    setSubmitting(true);
    setDialogError(null);
    try {
      const actualizada = await equipoFabricadoApi.actualizarEtapaProduccion(
        equipoId,
        etapa.tipoEtapa,
        {
          completado: true,
          responsableId: responsable?.id,
          observaciones: observaciones.trim() || undefined,
        },
      );
      onEtapaActualizada(actualizada);
      setCompletarDialog({ open: false, etapa: null });
    } catch (error) {
      setDialogError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const clearUndoTimer = () => {
    if (undoTimerRef.current !== null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const handleStartUndo = (tipo: TipoEtapaFabricacion) => {
    clearUndoTimer();
    setConfirmUndoTipo(tipo);
    undoTimerRef.current = window.setTimeout(() => {
      setConfirmUndoTipo((current) => (current === tipo ? null : current));
      undoTimerRef.current = null;
    }, 3000);
  };

  const handleCancelUndo = () => {
    clearUndoTimer();
    setConfirmUndoTipo(null);
  };

  const handleConfirmUndo = async (etapa: EtapaFabricacionDTO) => {
    clearUndoTimer();
    setConfirmUndoTipo(null);
    setLoadingTipo(etapa.tipoEtapa);
    try {
      const actualizada = await equipoFabricadoApi.actualizarEtapaProduccion(
        equipoId,
        etapa.tipoEtapa,
        { completado: false },
      );
      onEtapaActualizada(actualizada);
    } catch {
      // Error swallowed here: the user-facing pattern is to keep state and surface
      // errors on the dialog flow. A quick undo failure leaves the row visually unchanged.
    } finally {
      setLoadingTipo(null);
    }
  };

  const anyLoading = loadingTipo !== null || submitting;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Checklist de producción
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {completadas} / {etapas.length || 4} etapas
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, progreso))}
          sx={{ height: 8, borderRadius: 4 }}
        />

        <Stack spacing={1.25}>
          {etapas.map((etapa) => {
            const isLoading = loadingTipo === etapa.tipoEtapa;
            const isUndoConfirm = confirmUndoTipo === etapa.tipoEtapa;
            return (
              <Paper
                key={etapa.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  bgcolor: etapa.completado ? 'success.lighter' : 'background.default',
                  borderColor: etapa.completado ? 'success.light' : 'divider',
                  transition: 'background-color 200ms ease, border-color 200ms ease',
                }}
              >
                <Fade in key={etapa.completado ? 'done' : 'pending'} timeout={300}>
                  {etapa.completado ? (
                    <CheckCircle sx={{ color: 'success.main', fontSize: 28, mt: 0.25 }} />
                  ) : (
                    <RadioButtonUnchecked sx={{ color: 'text.disabled', fontSize: 28, mt: 0.25 }} />
                  )}
                </Fade>

                <Box flex={1} minWidth={0}>
                  <Typography variant="body1" fontWeight={600}>
                    {etapa.tipoEtapaLabel}
                  </Typography>
                  {etapa.completado && (etapa.responsableNombre || etapa.fechaCompletado) && (
                    <Stack direction="row" spacing={0.75} mt={0.5} flexWrap="wrap" useFlexGap>
                      {etapa.responsableNombre && (
                        <Chip
                          size="small"
                          label={etapa.responsableNombre}
                          variant="outlined"
                          color="success"
                        />
                      )}
                      {etapa.fechaCompletado && (
                        <Chip
                          size="small"
                          label={formatFecha(etapa.fechaCompletado)}
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  )}
                  {etapa.observaciones && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.75,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        borderLeft: 2,
                        borderColor: etapa.completado ? 'success.light' : 'divider',
                        pl: 1,
                      }}
                    >
                      {etapa.observaciones}
                    </Typography>
                  )}
                </Box>

                {!readOnly && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {isLoading ? (
                      <CircularProgress size={20} />
                    ) : !etapa.completado ? (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={anyLoading}
                        onClick={() => openCompletarDialog(etapa)}
                      >
                        Completar
                      </Button>
                    ) : isUndoConfirm ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          ¿Deshacer?
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          disabled={anyLoading}
                          onClick={() => handleConfirmUndo(etapa)}
                          sx={{ minWidth: 40, px: 1.25 }}
                        >
                          Sí
                        </Button>
                        <Button
                          size="small"
                          variant="text"
                          disabled={anyLoading}
                          onClick={handleCancelUndo}
                          sx={{ minWidth: 40, px: 1.25 }}
                        >
                          No
                        </Button>
                      </Stack>
                    ) : (
                      <Tooltip title="Deshacer" enterDelay={300}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Deshacer ${etapa.tipoEtapaLabel}`}
                            disabled={anyLoading}
                            onClick={() => handleStartUndo(etapa.tipoEtapa)}
                          >
                            <UndoIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Paper>
            );
          })}
        </Stack>

        {todasCompletas && (
          <Alert icon={<TaskAlt fontSize="inherit" />} severity="success">
            ¡Listo para completar fabricación!
          </Alert>
        )}
      </Stack>

      <Dialog
        open={completarDialog.open}
        onClose={closeCompletarDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Completar — {completarDialog.etapa?.tipoEtapaLabel ?? ''}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
            <Autocomplete
              options={empleados}
              loading={empleadosLoading}
              value={responsable}
              onChange={(_, value) => setResponsable(value)}
              getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable"
                  placeholder="Opcional"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {empleadosLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <TextField
              label="Observaciones"
              placeholder="Opcional"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              multiline
              minRows={2}
              maxRows={4}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCompletarDialog} variant="outlined" disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmCompletar}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ChecklistProduccionPanel;
