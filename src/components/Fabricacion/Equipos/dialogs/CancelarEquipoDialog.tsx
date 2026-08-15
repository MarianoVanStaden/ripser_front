import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import type { EquipoFabricadoListDTO } from '../../../../types';

interface CancelarEquipoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmación de cancelar fabricación (Etapa 6.4: extraído de EquiposList). */
export default function CancelarEquipoDialog({ open, equipo, onClose, onConfirm }: CancelarEquipoDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Cancel color="warning" />
        Cancelar Fabricación
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          ¿Está seguro de que desea cancelar la fabricación de este equipo?
        </DialogContentText>
        {equipo && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Equipo a cancelar:
            </Typography>
            <Typography variant="body2">
              <strong>Número:</strong> {equipo.numeroHeladera}
            </Typography>
            <Typography variant="body2">
              <strong>Tipo:</strong> {equipo.tipo}
            </Typography>
            <Typography variant="body2">
              <strong>Modelo:</strong> {equipo.modelo}
            </Typography>
            <Typography variant="body2">
              <strong>Estado actual:</strong> {equipo.estado.replace('_', ' ')}
            </Typography>
          </Alert>
        )}
        <Alert severity="error">
          <Typography variant="body2">
            <strong>Advertencia:</strong> Esta acción marcará el equipo como cancelado.
            Los materiales utilizados no se devolverán al stock automáticamente.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>No Cancelar</Button>
        <Button onClick={onConfirm} color="warning" variant="contained" startIcon={<Cancel />}>
          Sí, Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
