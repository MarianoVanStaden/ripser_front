import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import type { EquipoFabricadoListDTO } from '../../../../types';

interface IniciarFabricacionDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmación de inicio de fabricación (Etapa 6.4: extraído de EquiposList). */
export default function IniciarFabricacionDialog({ open, equipo, onClose, onConfirm }: IniciarFabricacionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <PlayArrow sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6">¿Iniciar Fabricación?</Typography>
      </DialogTitle>
      <DialogContent>
        {equipo && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Número:</strong> {equipo.numeroHeladera}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Tipo:</strong> {equipo.tipo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Modelo:</strong> {equipo.modelo}
              </Typography>
              {equipo.responsableNombre && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Responsable:</strong> {equipo.responsableNombre}
                </Typography>
              )}
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              Al iniciar la fabricación, se descontará el stock de los componentes necesarios.
              Si no hay stock suficiente, se descontará igual y el stock quedará en negativo.
              El estado cambiará a EN_PROCESO.
            </Alert>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary" startIcon={<PlayArrow />}>
          Iniciar Fabricación
        </Button>
      </DialogActions>
    </Dialog>
  );
}
