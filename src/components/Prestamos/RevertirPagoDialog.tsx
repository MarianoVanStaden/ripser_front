import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Alert, TextField, CircularProgress, Typography,
} from '@mui/material';
import { Undo } from '@mui/icons-material';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import type { CuotaPrestamoDTO } from '../../types/prestamo.types';

interface RevertirPagoDialogProps {
  open: boolean;
  onClose: () => void;
  onReverted: () => void;
  cuota: CuotaPrestamoDTO | null;
  cantidadCuotas: number;
  prestamoId: number;
}

export const RevertirPagoDialog: React.FC<RevertirPagoDialogProps> = ({
  open, onClose, onReverted, cuota, cantidadCuotas, prestamoId,
}) => {
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMotivo('');
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!cuota) return;
    try {
      setSaving(true);
      setError(null);
      await cuotaPrestamoApi.revertirPago({ cuotaId: cuota.id, motivo: motivo.trim() || undefined });
      onReverted();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al revertir el pago');
    } finally {
      setSaving(false);
    }
  };

  if (!cuota) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Revertir Pago — Cuota N.{cuota.numeroCuota}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Esta acción revertirá el pago de la cuota <strong>{cuota.numeroCuota}/{cantidadCuotas}</strong> del
            Crédito Personal <strong>#{prestamoId}</strong> y generará un movimiento inverso en la cuenta corriente del
            cliente. <strong>No se puede deshacer.</strong>
          </Typography>
        </Alert>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Motivo (opcional)"
          multiline
          rows={3}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          inputProps={{ maxLength: 200 }}
          helperText={`${motivo.length}/200`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Undo />}
        >
          Confirmar reversión
        </Button>
      </DialogActions>
    </Dialog>
  );
};
