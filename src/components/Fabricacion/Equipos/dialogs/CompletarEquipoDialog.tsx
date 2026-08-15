import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Divider, Paper, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { EquipoFabricadoListDTO } from '../../../../types';

interface CompletarEquipoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmación de completar fabricación (Etapa 6.4: extraído de EquiposList). */
export default function CompletarEquipoDialog({ open, equipo, onClose, onConfirm }: CompletarEquipoDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'visible',
        },
      }}
    >
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
            Completar Fabricación
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ¿Está seguro de que desea marcar este equipo como completado?
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
              {equipo.responsableNombre && (
                <>
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                    <Typography variant="body2" color="text.secondary">
                      Responsable:
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {equipo.responsableNombre}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          )}

          <Alert
            severity={equipo?.color ? 'success' : 'info'}
            sx={{ mt: 2, width: '100%' }}
          >
            <Typography variant="caption">
              {equipo?.color
                ? 'Al completar, el equipo estará disponible para asignación o venta.'
                : 'Este equipo no tiene color asignado. Al completar quedará como base genérica (Sin Terminación), lista para aplicar terminación a demanda.'}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="success" variant="contained" startIcon={<CheckCircle />}>
          Confirmar Completado
        </Button>
      </DialogActions>
    </Dialog>
  );
}
