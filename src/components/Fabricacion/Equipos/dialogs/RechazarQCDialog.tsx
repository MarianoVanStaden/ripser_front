import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../../../api/services/equipoFabricadoApi';
import type { EquipoFabricadoListDTO, EtapaFabricacionDTO } from '../../../../types';

interface RechazarQCDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onNotify: (message: string, severity: 'success' | 'error') => void;
  onRefetch: () => void;
}

/**
 * Rechazo de control de calidad por etapas (Etapa 6.4: extraído de EquiposList).
 * Carga las etapas del equipo al abrir; las seleccionadas vuelven a PENDIENTE.
 */
export default function RechazarQCDialog({ open, equipo, onClose, onNotify, onRefetch }: RechazarQCDialogProps) {
  const [etapasRechazadas, setEtapasRechazadas] = useState<Map<string, string>>(new Map());

  // Etapas bajo el namespace ['equipos']: el invalidate de la página tras
  // cada mutación las refresca también acá.
  const etapasQuery = useQuery({
    queryKey: ['equipos', equipo?.id, 'etapas'],
    queryFn: () => equipoFabricadoApi.getEtapasProduccion(equipo!.id),
    enabled: open && !!equipo?.id,
  });
  const etapas: EtapaFabricacionDTO[] = etapasQuery.data ?? [];
  const loading = etapasQuery.isPending && open && !!equipo?.id;
  const queryErr = etapasQuery.error as any;
  const error = queryErr
    ? (queryErr.response?.data?.message ?? queryErr.message ?? 'Error al cargar las etapas')
    : null;

  // Reset de la selección al (re)abrir.
  useEffect(() => {
    if (open) setEtapasRechazadas(new Map());
  }, [open, equipo?.id]);

  const toggleEtapaRechazada = (tipoEtapa: string) => {
    setEtapasRechazadas((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(tipoEtapa)) {
        newMap.delete(tipoEtapa);
      } else {
        newMap.set(tipoEtapa, '');
      }
      return newMap;
    });
  };

  const setMotivoRechazada = (tipoEtapa: string, motivo: string) => {
    setEtapasRechazadas((prev) => {
      const newMap = new Map(prev);
      newMap.set(tipoEtapa, motivo);
      return newMap;
    });
  };

  const handleRechazar = async () => {
    if (!equipo || etapasRechazadas.size === 0) return;
    try {
      const etapasArray = Array.from(etapasRechazadas.entries()).map(
        ([tipoEtapa, motivo]) => ({
          tipoEtapa: tipoEtapa as any,
          motivo: motivo.trim() || undefined,
        })
      );
      await equipoFabricadoApi.rechazarEtapasEnControlCalidadPorNumero(
        equipo.numeroHeladera,
        etapasArray
      );
      onNotify('Etapas rechazadas correctamente', 'success');
      onClose();
      onRefetch();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as Error).message ||
        'Error al rechazar etapas';
      onNotify(msg, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rechazar Control de Calidad</DialogTitle>
      <DialogContent>
        {equipo && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                <strong>Número:</strong> {equipo.numeroHeladera}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Tipo:</strong> {equipo.tipo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Modelo:</strong> {equipo.modelo}
              </Typography>
            </Box>

            {loading && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={32} />
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {!loading && etapas.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600}>
                  Selecciona las etapas a rechazar
                </Typography>
                <Stack spacing={1.5}>
                  {etapas
                    .filter((e) => e.estado === 'COMPLETADO' || e.completado)
                    .map((etapa) => (
                      <Box key={etapa.id} display="flex" alignItems="flex-start" gap={1}>
                        <Checkbox
                          checked={etapasRechazadas.has(etapa.tipoEtapa)}
                          onChange={() => toggleEtapaRechazada(etapa.tipoEtapa)}
                          size="small"
                        />
                        <Box flex={1} minWidth={0}>
                          <Typography variant="body2" fontWeight={500}>
                            {etapa.tipoEtapaLabel}
                          </Typography>
                          {etapasRechazadas.has(etapa.tipoEtapa) && (
                            <TextField
                              size="small"
                              placeholder="Motivo del rechazo"
                              value={etapasRechazadas.get(etapa.tipoEtapa) || ''}
                              onChange={(e) =>
                                setMotivoRechazada(etapa.tipoEtapa, e.target.value)
                              }
                              multiline
                              minRows={1}
                              maxRows={2}
                              fullWidth
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                </Stack>
              </>
            )}

            <Alert severity="warning">
              Las etapas seleccionadas volverán a PENDIENTE para que el encargado de taller pueda corregirlas.
            </Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleRechazar}
          color="error"
          variant="contained"
          disabled={etapasRechazadas.size === 0 || loading}
          startIcon={<Cancel />}
        >
          Rechazar Seleccionadas
        </Button>
      </DialogActions>
    </Dialog>
  );
}
