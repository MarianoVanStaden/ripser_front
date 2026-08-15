import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import type { EquipoFabricadoListDTO } from '../../../../types';

interface EliminarEquipoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmación de eliminación de un equipo (Etapa 6.4: extraído de EquiposList). */
export default function EliminarEquipoDialog({ open, equipo, onClose, onConfirm }: EliminarEquipoDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Delete color="error" />
        Confirmar Eliminación
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          ¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer.
        </DialogContentText>
        {equipo && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Equipo a eliminar:
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
            {equipo.clienteNombre && (
              <Typography variant="body2">
                <strong>Cliente:</strong> {equipo.clienteNombre}
              </Typography>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} color="error" variant="contained" startIcon={<Delete />}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
