import { Alert, Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';

interface DesasignarErrorDialogProps {
  open: boolean;
  errorMessage: string;
  onClose: () => void;
}

/** Error al intentar desasignar un equipo (Etapa 6.4: extraído de EquiposList). */
export default function DesasignarErrorDialog({ open, errorMessage, onClose }: DesasignarErrorDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
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
              bgcolor: (theme) => theme.palette.error.main + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Cancel sx={{ fontSize: 50, color: 'error.main' }} />
          </Box>

          <Typography variant="h5" fontWeight="600" gutterBottom color="error">
            No se puede desasignar
          </Typography>

          <Alert severity="error" sx={{ width: '100%', mt: 2, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {errorMessage}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        <Button onClick={onClose} variant="contained" size="large" sx={{ minWidth: 120 }}>
          Entendido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
