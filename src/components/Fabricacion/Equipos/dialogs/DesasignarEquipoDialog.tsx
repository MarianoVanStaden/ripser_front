import { Box, Button, Dialog, DialogActions, DialogContent, Divider, Paper, Typography } from '@mui/material';
import { LinkOff } from '@mui/icons-material';
import type { EquipoFabricadoListDTO } from '../../../../types';

interface DesasignarEquipoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmación de desasignar un equipo del cliente (Etapa 6.4: extraído de EquiposList). */
export default function DesasignarEquipoDialog({ open, equipo, onClose, onConfirm }: DesasignarEquipoDialogProps) {
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
              bgcolor: (theme) => theme.palette.warning.main + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <LinkOff sx={{ fontSize: 50, color: 'warning.main' }} />
          </Box>

          <Typography variant="h5" fontWeight="600" gutterBottom>
            Desasignar Equipo
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ¿Está seguro de que desea desasignar este equipo del cliente?
          </Typography>

          {equipo && (
            <Paper
              variant="outlined"
              sx={{
                width: '100%',
                p: 2,
                bgcolor: (theme) => theme.palette.warning.main + '08',
                borderColor: (theme) => theme.palette.warning.main + '30',
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
                  Modelo:
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {equipo.modelo}
                </Typography>
              </Box>
              {equipo.clienteNombre && (
                <>
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                    <Typography variant="body2" color="text.secondary">
                      Cliente Actual:
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {equipo.clienteNombre}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
        <Button onClick={onClose} variant="outlined" size="large" sx={{ minWidth: 120 }}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          color="warning"
          variant="contained"
          startIcon={<LinkOff />}
          size="large"
          sx={{ minWidth: 120 }}
        >
          Desasignar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
