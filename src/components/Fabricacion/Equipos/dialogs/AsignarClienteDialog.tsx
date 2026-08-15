import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import ClienteAutocomplete from '../../../common/ClienteAutocomplete';

interface AsignarClienteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (cliente: { id: number }) => void;
}

/** Asignación de un equipo a un cliente (Etapa 6.4: extraído de EquiposList). */
export default function AsignarClienteDialog({ open, onClose, onConfirm }: AsignarClienteDialogProps) {
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  const handleClose = () => {
    setSelectedCliente(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Cliente</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <ClienteAutocomplete
            size="medium"
            label="Cliente *"
            value={selectedCliente}
            onChange={(newValue) => setSelectedCliente(newValue)}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (!selectedCliente) return;
            const cliente = selectedCliente;
            setSelectedCliente(null);
            onConfirm(cliente);
          }}
          disabled={!selectedCliente}
        >
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
