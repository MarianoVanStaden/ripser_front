import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Alert, CircularProgress,
  Paper, Chip, Stack, Divider, MenuItem, Select,
  FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import { Brush, ColorLens, Warning } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { DetalleDocumento, EquipoFabricadoListDTO } from '../../types';

interface ReservarBaseDialogProps {
  open: boolean;
  /** Detalles with tipoItem === 'EQUIPO' and no color assigned */
  detalles: DetalleDocumento[];
  onClose: () => void;
  /** Called after reservations are confirmed (or skipped). reservadas = count of successful reservations. */
  onSuccess: (reservadas: number) => void;
}

interface DetalleReservacion {
  detalle: DetalleDocumento;
  bases: EquipoFabricadoListDTO[];
  loadingBases: boolean;
  errorBases: string | null;
  /** One selected equipo ID per unit (length = detalle.cantidad) */
  selectedIds: (number | '')[];
}

const ReservarBaseDialog: React.FC<ReservarBaseDialogProps> = ({
  open,
  detalles,
  onClose,
  onSuccess,
}) => {
  const [reservaciones, setReservaciones] = useState<DetalleReservacion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load available bases when dialog opens
  useEffect(() => {
    if (!open || detalles.length === 0) return;

    const initial: DetalleReservacion[] = detalles.map(d => ({
      detalle: d,
      bases: [],
      loadingBases: true,
      errorBases: null,
      selectedIds: Array(d.cantidad || 1).fill(''),
    }));
    setReservaciones(initial);
    setSubmitError(null);

    // Load bases for each detalle
    detalles.forEach((detalle, idx) => {
      if (!detalle.recetaId) {
        setReservaciones(prev => {
          const next = [...prev];
          next[idx] = { ...next[idx], loadingBases: false, errorBases: 'Sin receta asociada' };
          return next;
        });
        return;
      }

      equipoFabricadoApi.findSinTerminacionByReceta(Number(detalle.recetaId))
        .then(async (rawBases) => {
          // Backend limitation: list DTOs may return id: null and may omit medida.
          // Resolve real IDs (and medida) via findByNumeroHeladera BEFORE filtering by medida,
          // since the list DTO may not include the medida field.
          const resolved = await Promise.all(
            rawBases.map(async (b) => {
              // If we already have id and (medida or no medida filter needed), skip fetch
              if (b.id && (b.medida !== undefined || !detalle.medida)) return b;
              if (!b.numeroHeladera) return b.id ? b : null;
              try {
                const full = await equipoFabricadoApi.findByNumeroHeladera(b.numeroHeladera);
                return { ...b, id: full.id ?? b.id, medida: full.medida ?? b.medida };
              } catch {
                return b.id ? b : null;
              }
            })
          );
          // Apply medida filter now that all DTOs have complete data
          const filtered = (resolved.filter(Boolean) as EquipoFabricadoListDTO[])
            .filter((b): b is EquipoFabricadoListDTO => Boolean(b?.id))
            .filter(b => !detalle.medida || b.medida === detalle.medida);

          setReservaciones(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], bases: filtered, loadingBases: false };
            return next;
          });
        })
        .catch(() => {
          setReservaciones(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], loadingBases: false, errorBases: 'Error al cargar bases disponibles' };
            return next;
          });
        });
    });
  }, [open, detalles]);

  const handleSelect = (detIdx: number, unitIdx: number, value: number | '') => {
    setReservaciones(prev => {
      const next = [...prev];
      const ids = [...next[detIdx].selectedIds];
      ids[unitIdx] = value;
      next[detIdx] = { ...next[detIdx], selectedIds: ids };
      return next;
    });
  };

  /** IDs already selected in this detalle (to prevent duplicates) */
  const usedIds = (det: DetalleReservacion, excludeUnitIdx: number): Set<number> => {
    const s = new Set<number>();
    det.selectedIds.forEach((id, i) => {
      if (i !== excludeUnitIdx && id !== '') s.add(id as number);
    });
    return s;
  };

  const handleConfirmar = async () => {
    setSubmitting(true);
    setSubmitError(null);
    let reservadas = 0;
    const errores: string[] = [];

    for (const res of reservaciones) {
      if (!res.detalle.id) {
        // Detalle ID is missing — backend may not have returned it; report and skip
        const nombre = res.detalle.recetaNombre || res.detalle.descripcion || 'Ítem sin nombre';
        errores.push(`${nombre}: No se pudo reservar (ID de detalle no disponible — contacte al administrador)`);
        continue;
      }
      for (const equipoId of res.selectedIds) {
        if (!equipoId) continue;
        try {
          await equipoFabricadoApi.reservarParaNota({
            equipoFabricadoId: equipoId as number,
            detalleNotaPedidoId: res.detalle.id,
          });
          reservadas++;
        } catch (err: any) {
          const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
          const equipo = res.bases.find(b => b.id === equipoId);
          errores.push(`${equipo?.numeroHeladera ?? `ID ${equipoId}`}: ${msg}`);
        }
      }
    }

    setSubmitting(false);

    if (errores.length > 0) {
      setSubmitError(`Algunos equipos no se pudieron reservar:\n• ${errores.join('\n• ')}`);
      // Still call onSuccess with partial count so page refreshes
      if (reservadas > 0) onSuccess(reservadas);
    } else {
      onSuccess(reservadas);
    }
  };

  const handleOmitir = () => {
    onSuccess(0);
  };

  const anySelected = reservaciones.some(r => r.selectedIds.some(id => id !== ''));
  const totalSeleccionadas = reservaciones.reduce(
    (acc, r) => acc + r.selectedIds.filter(id => id !== '').length,
    0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ColorLens color="secondary" />
        Reservar Equipos Base
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" icon={<Brush />} sx={{ mb: 2.5 }}>
          Los siguientes ítems no tienen color asignado. Seleccioná un equipo base disponible
          (Sin Terminación) para cada uno. Podrás omitir esta selección y hacerla luego.
        </Alert>

        <Stack spacing={2.5}>
          {reservaciones.map((res, detIdx) => {
            const { detalle, bases, loadingBases, errorBases, selectedIds } = res;
            const cantUnidades = selectedIds.length;

            return (
              <Paper key={detalle.id ?? detIdx} variant="outlined" sx={{ p: 2 }}>
                {/* Detalle header */}
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Chip
                    label={detalle.recetaNombre || detalle.descripcionEquipo || `Ítem ${detIdx + 1}`}
                    color="secondary"
                    size="small"
                  />
                  {detalle.medida && (
                    <Chip label={detalle.medida} variant="outlined" size="small" />
                  )}
                  <Chip
                    label={`Cant: ${cantUnidades}`}
                    variant="outlined"
                    size="small"
                    color="default"
                  />
                </Box>

                {loadingBases ? (
                  <Box display="flex" alignItems="center" gap={1} py={1}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando bases disponibles...
                    </Typography>
                  </Box>
                ) : errorBases ? (
                  <Alert severity="error" sx={{ py: 0.5 }}>{errorBases}</Alert>
                ) : bases.length === 0 ? (
                  <Alert severity="warning" icon={<Warning />} sx={{ py: 0.5 }}>
                    No hay equipos sin terminación disponibles para esta receta
                    {detalle.medida ? ` (medida ${detalle.medida})` : ''}.
                    Deberás fabricar uno primero.
                  </Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {selectedIds.map((selectedId, unitIdx) => {
                      const taken = usedIds(res, unitIdx);
                      const options = bases.filter(b => b.id === selectedId || !taken.has(b.id!));
                      return (
                        <Box key={unitIdx}>
                          {cantUnidades > 1 && (
                            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
                              Unidad {unitIdx + 1}
                            </Typography>
                          )}
                          <FormControl fullWidth size="small">
                            <InputLabel>
                              {cantUnidades > 1
                                ? `Base para unidad ${unitIdx + 1}`
                                : 'Equipo base'}
                            </InputLabel>
                            <Select
                              value={selectedId}
                              label={cantUnidades > 1 ? `Base para unidad ${unitIdx + 1}` : 'Equipo base'}
                              onChange={e => {
                                const val = e.target.value;
                                // e.target.value is always a string from the native event;
                                // convert to number so it matches the MenuItem value type.
                                handleSelect(detIdx, unitIdx, val === '' ? '' : Number(val));
                              }}
                            >
                              <MenuItem value=""><em>— Sin seleccionar —</em></MenuItem>
                              {options.map(b => (
                                <MenuItem key={b.id} value={b.id!}>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="body2" fontWeight="500">
                                      {b.numeroHeladera}
                                    </Typography>
                                    {b.medida && (
                                      <Chip label={b.medida} size="small" variant="outlined" />
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {b.modelo}
                                    </Typography>
                                  </Stack>
                                </MenuItem>
                              ))}
                            </Select>
                            {!selectedId && (
                              <FormHelperText>Opcional — podés reservar luego</FormHelperText>
                            )}
                          </FormControl>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {detIdx < reservaciones.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Paper>
            );
          })}
        </Stack>

        {submitError && (
          <Alert severity="error" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
            {submitError}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleOmitir} disabled={submitting} color="inherit">
          Omitir por ahora
        </Button>
        <Button
          onClick={handleConfirmar}
          variant="contained"
          color="secondary"
          disabled={submitting || !anySelected}
          startIcon={submitting ? <CircularProgress size={18} /> : <Brush />}
        >
          {submitting
            ? 'Reservando...'
            : `Reservar ${totalSeleccionadas > 0 ? `(${totalSeleccionadas})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReservarBaseDialog;
