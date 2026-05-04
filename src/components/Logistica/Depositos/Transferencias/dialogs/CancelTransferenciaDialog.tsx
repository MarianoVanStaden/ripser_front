// FRONT-003: extracted from TransferenciasPage.tsx — confirmar cancelación
// con motivo obligatorio.  El padre maneja la mutación.
import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { Cancel as CancelIcon } from '@mui/icons-material';
import type { TransferenciaDepositoDTO } from '../../../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  transferencia: TransferenciaDepositoDTO | null;
  motivo: string;
  setMotivo: (value: string) => void;
}

const CancelTransferenciaDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  loading,
  transferencia,
  motivo,
  setMotivo,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CancelIcon color="error" />
          <Typography variant="h6">Cancelar Transferencia</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          {transferencia && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Está a punto de cancelar la transferencia <strong>{transferencia.numero}</strong>
              {' '}de <strong>{transferencia.depositoOrigenNombre}</strong> hacia{' '}
              <strong>{transferencia.depositoDestinoNombre}</strong>.
              Esta acción no se puede deshacer.
            </Alert>
          )}
          <TextField
            label="Motivo de cancelación"
            multiline
            rows={3}
            fullWidth
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ingrese el motivo por el cual se cancela esta transferencia..."
            helperText="Este campo es obligatorio"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Volver</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading || !motivo.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <CancelIcon />}
        >
          Confirmar Cancelación
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelTransferenciaDialog;
