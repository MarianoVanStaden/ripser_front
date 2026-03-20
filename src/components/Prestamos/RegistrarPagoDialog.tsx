import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, Box, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Payment } from '@mui/icons-material';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import type { CuotaPrestamoDTO, MetodoPago } from '../../types/prestamo.types';
import { METODO_PAGO_LABELS } from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';
import dayjs from 'dayjs';

interface RegistrarPagoDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  cuota: CuotaPrestamoDTO | null;
}

export const RegistrarPagoDialog: React.FC<RegistrarPagoDialogProps> = ({
  open, onClose, onSaved, cuota,
}) => {
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [fechaPago, setFechaPago] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [metodoPago, setMetodoPago] = useState<MetodoPago | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && cuota) {
      const saldoRestante = cuota.montoCuota - cuota.montoPagado;
      setMontoPagado(saldoRestante > 0 ? saldoRestante : cuota.montoCuota);
      setFechaPago(dayjs().format('YYYY-MM-DD'));
      setMetodoPago('');
      setError(null);
    }
  }, [open, cuota]);

  const handleSave = async () => {
    if (!cuota) return;
    if (montoPagado <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await cuotaPrestamoApi.registrarPago({
        cuotaId: cuota.id,
        montoPagado,
        fechaPago,
        ...(metodoPago ? { metodoPago } : {}),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  if (!cuota) return null;

  const saldoRestante = cuota.montoCuota - cuota.montoPagado;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Pago - Cuota N.{cuota.numeroCuota}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Monto Cuota</Typography>
                <Typography variant="body2" fontWeight="medium">{formatPrice(cuota.montoCuota)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Ya Pagado</Typography>
                <Typography variant="body2" fontWeight="medium">{formatPrice(cuota.montoPagado)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Saldo Restante</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {formatPrice(saldoRestante)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto a Pagar"
                type="number"
                required
                value={montoPagado || ''}
                onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Pago"
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={metodoPago}
                  label="Método de Pago"
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago | '')}
                >
                  <MenuItem value=""><em>Sin especificar</em></MenuItem>
                  {(Object.keys(METODO_PAGO_LABELS) as MetodoPago[]).map(key => (
                    <MenuItem key={key} value={key}>{METODO_PAGO_LABELS[key]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Payment />}
        >
          Registrar Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};
