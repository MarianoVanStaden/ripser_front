import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Divider, Paper, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../../../api/services/equipoFabricadoApi';
import type { EquipoFabricadoListDTO } from '../../../../types';

interface AprobarQCDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onNotify: (message: string, severity: 'success' | 'error') => void;
  onRefetch: () => void;
}

/** Aprobación de control de calidad (Etapa 6.4: extraído de EquiposList). */
export default function AprobarQCDialog({ open, equipo, onClose, onNotify, onRefetch }: AprobarQCDialogProps) {
  const handleAprobar = async () => {
    if (!equipo) return;
    try {
      await equipoFabricadoApi.completarFabricacionPorNumero(equipo.numeroHeladera);
      onNotify('Equipo aprobado en control de calidad', 'success');
      onClose();
      onRefetch();
    } catch (error) {
      const msg = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as Error).message ||
        'Error al aprobar control de calidad';
      onNotify(msg, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ pt: 4, pb: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: (theme) => theme.palette.success.main + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <CheckCircle sx={{ fontSize: 50, color: 'success.main' }} />
          </Box>
          <Typography variant="h5" fontWeight="600" gutterBottom>
            Aprobar Control de Calidad
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ¿Está seguro de que desea aprobar este equipo?
          </Typography>
          {equipo && (
            <Paper
              variant="outlined"
              sx={{
                width: '100%',
                p: 2,
                bgcolor: (theme) => theme.palette.primary.main + '08',
                borderColor: (theme) => theme.palette.primary.main + '30',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Número:
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {equipo.numeroHeladera}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Tipo:
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {equipo.tipo}
                </Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                <Typography variant="body2" color="text.secondary">
                  Modelo:
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {equipo.modelo}
                </Typography>
              </Box>
            </Paper>
          )}
          <Alert severity="success" sx={{ mt: 3, width: '100%' }}>
            <Typography variant="caption">
              {equipo?.color
                ? 'El equipo estará disponible para asignación o venta.'
                : 'El equipo quedará como base genérica (Sin Terminación), lista para aplicar terminación a demanda.'}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleAprobar} color="success" variant="contained" startIcon={<CheckCircle />}>
          Aprobar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
