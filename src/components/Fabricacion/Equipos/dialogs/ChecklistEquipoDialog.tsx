import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Typography,
} from '@mui/material';
import ChecklistProduccionPanel from '../../ChecklistProduccionPanel';
import { equipoFabricadoApi } from '../../../../api/services/equipoFabricadoApi';
import type { EquipoFabricadoListDTO, EtapaFabricacionDTO } from '../../../../types';

interface ChecklistEquipoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  esControlCalidad: boolean;
  onClose: () => void;
  onNotify: (message: string, severity: 'success' | 'error') => void;
  onRefetch: () => void;
}

/**
 * Checklist de producción de un equipo (Etapa 6.4: extraído de EquiposList).
 * Carga las etapas al abrir; permite enviar a control de calidad (EN_PROCESO)
 * o rechazar etapas (PENDIENTE_CONTROL_CALIDAD, solo roles de QC).
 */
export default function ChecklistEquipoDialog({
  open, equipo, esControlCalidad, onClose, onNotify, onRefetch,
}: ChecklistEquipoDialogProps) {
  // Etapas bajo ['equipos', id, 'etapas'] — el invalidate de la página las
  // refresca. Copia local porque el panel las actualiza optimistamente al
  // marcar cada etapa.
  const [etapas, setEtapas] = useState<EtapaFabricacionDTO[]>([]);
  const [modoRechazo, setModoRechazo] = useState(false);

  const etapasQuery = useQuery({
    queryKey: ['equipos', equipo?.id, 'etapas'],
    queryFn: () => equipoFabricadoApi.getEtapasProduccion(equipo!.id),
    enabled: open && !!equipo?.id,
  });
  useEffect(() => {
    setEtapas(etapasQuery.data ?? []);
  }, [etapasQuery.data]);
  useEffect(() => {
    if (!open) setModoRechazo(false);
  }, [open]);

  const loading = etapasQuery.isPending && open && !!equipo?.id;
  const queryErr = etapasQuery.error as any;
  const error = queryErr
    ? (queryErr.response?.data?.message ?? queryErr.message ?? 'Error al cargar el checklist')
    : null;

  const handleEtapaActualizada = (etapa: EtapaFabricacionDTO) => {
    setEtapas((prev) => prev.map((e) => (e.id === etapa.id ? etapa : e)));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Checklist de producción
        {equipo && (
          <Typography variant="body2" color="text.secondary">
            {equipo.numeroHeladera} — {equipo.modelo}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : equipo?.id != null && etapas.length > 0 ? (
          <ChecklistProduccionPanel
            equipoId={equipo.id}
            etapas={etapas}
            progreso={Math.round(
              (etapas.filter((e) => e.completado).length / (etapas.length || 1)) * 100
            )}
            onEtapaActualizada={handleEtapaActualizada}
            onEnviarControlCalidad={
              equipo?.estado === 'EN_PROCESO'
                ? async () => {
                    if (!equipo) return;
                    try {
                      await equipoFabricadoApi.enviarAControlCalidadPorNumero(equipo.numeroHeladera);
                      onNotify('Equipo enviado a control de calidad', 'success');
                      onClose();
                      onRefetch();
                    } catch (err) {
                      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
                        (err as Error).message ||
                        'Error al enviar a control de calidad';
                      onNotify(msg, 'error');
                    }
                  }
                : undefined
            }
            modoRechazo={modoRechazo}
            onRechazarEtapas={
              equipo?.estado === 'PENDIENTE_CONTROL_CALIDAD'
                ? async (etapasRechazadas) => {
                    if (!equipo) return;
                    try {
                      await equipoFabricadoApi.rechazarEtapasEnControlCalidadPorNumero(
                        equipo.numeroHeladera,
                        etapasRechazadas
                      );
                      onNotify('Etapas rechazadas correctamente', 'success');
                      onClose();
                      onRefetch();
                    } catch (err) {
                      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
                        (err as Error).message ||
                        'Error al rechazar etapas';
                      onNotify(msg, 'error');
                    }
                  }
                : undefined
            }
            readOnly={equipo?.estado === 'PENDIENTE_CONTROL_CALIDAD' && !modoRechazo}
          />
        ) : (
          <Alert severity="info">No hay etapas de producción registradas.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        {equipo?.estado === 'PENDIENTE_CONTROL_CALIDAD' && esControlCalidad && (
          <Button
            variant={modoRechazo ? 'contained' : 'outlined'}
            color={modoRechazo ? 'error' : 'primary'}
            onClick={() => setModoRechazo((prev) => !prev)}
          >
            {modoRechazo ? 'Cancelar Rechazo' : 'Rechazar Etapas'}
          </Button>
        )}
        <Button
          onClick={() => {
            onClose();
            onRefetch();
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
