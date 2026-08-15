import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Alert, TextField, CircularProgress, Typography,
} from '@mui/material';
import { Block } from '@mui/icons-material';
import { pagoInformadoApi } from '../../../api/services/pagoInformadoApi';
import type { PagoInformadoDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';

interface Props {
  open: boolean;
  onClose: () => void;
  onRechazado: () => void;
  pago: PagoInformadoDTO | null;
}

export const RechazarPagoInformadoDialog: React.FC<Props> = ({
  open, onClose, onRechazado, pago,
}) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMotivo('');
      setError(null);
    }
  }, [open]);

  const rechazarMutation = useMutation({
    mutationFn: () => pagoInformadoApi.rechazar(pago!.id, { motivoRechazo: motivo.trim() }),
    onSuccess: () => { onRechazado(); onClose(); },
    onError: (err: any) => setError(err.response?.data?.message || err.response?.data?.error || 'Error al rechazar el informe'),
  });
  const saving = rechazarMutation.isPending;

  const handleConfirm = () => {
    if (!pago) return;
    if (!motivo.trim()) {
      setError('Indicá el motivo del rechazo.');
      return;
    }
    setError(null);
    rechazarMutation.mutate();
  };

  if (!pago) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Rechazar Pago Informado</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Vas a rechazar el pago informado de <strong>{formatPrice(pago.montoInformado)}</strong> sobre
            la cuota <strong>#{pago.numeroCuota}</strong> del préstamo <strong>#{pago.prestamoId}</strong>.
            La cuota volverá a su estado previo (<strong>{pago.estadoCuotaPrevio}</strong>).
          </Typography>
        </Alert>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth required multiline rows={3}
          label="Motivo del rechazo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleConfirm} color="error" variant="contained"
          disabled={saving || !motivo.trim()}
          startIcon={saving ? <CircularProgress size={18} /> : <Block />}
        >
          Rechazar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
