import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, Box, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Payment } from '@mui/icons-material';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import { cuentaCorrienteApi } from '../../api/services/cuentaCorrienteApi';
import type { CuotaPrestamoDTO, MetodoPago } from '../../types/prestamo.types';
import { METODO_PAGO_LABELS } from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';
import dayjs from 'dayjs';

// Exclude FINANCIACION_PROPIA from cuota payment selector
const METODOS_PAGO_CUOTA = (Object.keys(METODO_PAGO_LABELS) as MetodoPago[]).filter(
  k => k !== 'FINANCIACION_PROPIA'
);

interface RegistrarPagoDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (changedCuotas: CuotaPrestamoDTO[]) => void;
  cuota: CuotaPrestamoDTO | null;
  clienteId: number;
  prestamoId: number;
  allCuotas: CuotaPrestamoDTO[];
}

export const RegistrarPagoDialog: React.FC<RegistrarPagoDialogProps> = ({
  open, onClose, onSaved, cuota, clienteId, prestamoId, allCuotas,
}) => {
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [fechaPago, setFechaPago] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saldoDisponible, setSaldoDisponible] = useState<number | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  useEffect(() => {
    if (open && cuota) {
      const saldoRestante = cuota.montoCuota - cuota.montoPagado;
      setMontoPagado(saldoRestante > 0 ? saldoRestante : cuota.montoCuota);
      setFechaPago(dayjs().format('YYYY-MM-DD'));
      setMetodoPago('EFECTIVO');
      setError(null);
      setSaldoDisponible(null);
    }
  }, [open, cuota]);

  useEffect(() => {
    if (metodoPago === 'CUENTA_CORRIENTE' && clienteId) {
      setLoadingSaldo(true);
      cuentaCorrienteApi.getByClienteId(clienteId)
        .then(res => {
          const movimientos = res.content;
          const creditos = movimientos.filter(m => m.tipo === 'CREDITO').reduce((s, m) => s + m.importe, 0);
          const debitos = movimientos.filter(m => m.tipo === 'DEBITO').reduce((s, m) => s + m.importe, 0);
          setSaldoDisponible(creditos - debitos);
        })
        .catch(() => setSaldoDisponible(null))
        .finally(() => setLoadingSaldo(false));
    } else {
      setSaldoDisponible(null);
    }
  }, [metodoPago, clienteId]);

  const saldoInsuficiente = metodoPago === 'CUENTA_CORRIENTE'
    && saldoDisponible !== null
    && saldoDisponible < montoPagado;

  const handleSave = async () => {
    if (!cuota) return;
    if (montoPagado <= 0) { setError('El monto debe ser mayor a 0'); return; }
    if (saldoInsuficiente) {
      setError(`Saldo insuficiente. Disponible: ${formatPrice(saldoDisponible!)}`);
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await cuotaPrestamoApi.registrarPago({ cuotaId: cuota.id, montoPagado, fechaPago, metodoPago });

      // Task 2: refetch cuotas to detect cascade changes
      const newCuotas = await cuotaPrestamoApi.getByPrestamo(prestamoId);
      const changed = newCuotas.filter(c => {
        const prev = allCuotas.find(p => p.id === c.id);
        return prev && prev.estado !== c.estado;
      });

      onSaved(changed);
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
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={metodoPago}
                  label="Método de Pago"
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                >
                  {METODOS_PAGO_CUOTA.map(key => (
                    <MenuItem key={key} value={key}>{METODO_PAGO_LABELS[key]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {metodoPago === 'CUENTA_CORRIENTE' && (
              <Grid item xs={12}>
                {loadingSaldo ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">Consultando saldo...</Typography>
                  </Box>
                ) : (
                  <Alert severity={saldoInsuficiente ? 'error' : 'info'}>
                    {saldoDisponible !== null
                      ? <>Saldo a favor disponible: <strong>{formatPrice(saldoDisponible)}</strong></>
                      : 'No se pudo obtener el saldo disponible'}
                    {saldoInsuficiente && ` — insuficiente para cubrir ${formatPrice(montoPagado)}`}
                  </Alert>
                )}
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || saldoInsuficiente || loadingSaldo}
          startIcon={saving ? <CircularProgress size={20} /> : <Payment />}
        >
          Registrar Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};
