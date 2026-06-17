import { useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, Typography, Box, Stack, Chip,
  InputAdornment,
} from '@mui/material';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { ESTADO_CUOTA_LABELS } from '../../types/prestamo.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';

interface Props {
  open: boolean;
  prestamo: PrestamoPersonalDTO;
  cuota: CuotaPrestamoDTO;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onConflict?: () => void;
}

/** Porcentajes de recargo de acceso rápido (ej. mora). */
const RECARGOS_RAPIDOS = [3, 5, 10];

export const EditarMontoCuotaDialog: React.FC<Props> = ({
  open, prestamo, cuota, onClose, onSaved, onConflict,
}) => {
  const montoActual = Number(cuota.montoCuota) || 0;
  const montoPagado = Number(cuota.montoPagado) || 0;

  const [nuevoMonto, setNuevoMonto] = useState<string>(montoActual ? String(montoActual) : '');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNum = useMemo(() => {
    const n = parseFloat(nuevoMonto.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [nuevoMonto]);

  const montoValido = Number.isFinite(montoNum) && montoNum > 0;
  const menorAlPagado = montoValido && montoNum < montoPagado;
  const delta = montoValido ? montoNum - montoActual : 0;
  const cambioReal = montoValido && Math.abs(delta) > 0.009;

  const aplicarRecargo = (pct: number) => {
    const valor = montoActual * (1 + pct / 100);
    // Redondeo a 2 decimales
    setNuevoMonto((Math.round(valor * 100) / 100).toString());
    if (!motivo.trim()) setMotivo(`Recargo del ${pct}% por mora`);
  };

  const submitDisabled = !montoValido || menorAlPagado || !cambioReal || submitting;

  const handleSubmit = async () => {
    if (!montoValido) return;
    setSubmitting(true);
    setError(null);
    try {
      await prestamoPersonalApi.actualizarMontoCuota(
        prestamo.id, cuota.id,
        {
          nuevoMonto: montoNum,
          motivo: motivo.trim(),
          prestamoVersion: prestamo.version ?? 0,
        },
      );
      onSaved(`Monto de la cuota #${cuota.numeroCuota} actualizado correctamente.`);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string; code?: string } } };
      if (err.response?.status === 409 && err.response?.data?.code === 'VERSION_CONFLICT') {
        if (onConflict) onConflict();
        setError('Otro usuario modificó este préstamo. Recargue la página e intente nuevamente.');
      } else {
        setError(err.response?.data?.message || 'Error al actualizar el monto de la cuota.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar monto — Cuota #{cuota.numeroCuota}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Monto actual: <strong>{formatPrice(montoActual)}</strong> &middot;{' '}
            Pagado: <strong>{formatPrice(montoPagado)}</strong> &middot;{' '}
            Estado: {ESTADO_CUOTA_LABELS[cuota.estado]}
          </Typography>

          <TextField
            label="Nuevo monto de la cuota"
            value={nuevoMonto}
            onChange={e => setNuevoMonto(e.target.value)}
            type="number"
            fullWidth
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: '0.01' }}
            error={menorAlPagado}
            helperText={menorAlPagado
              ? `No puede ser menor a lo ya cobrado (${formatPrice(montoPagado)}).`
              : 'Solo se modifica esta cuota; el resto del cronograma no cambia.'}
          />

          <Box>
            <Typography variant="caption" color="text.secondary">Recargo rápido:</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              {RECARGOS_RAPIDOS.map(pct => (
                <Chip
                  key={pct}
                  label={`+${pct}%`}
                  variant="outlined"
                  onClick={() => aplicarRecargo(pct)}
                  clickable
                />
              ))}
            </Stack>
          </Box>

          <TextField
            label="Motivo del cambio"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            helperText="Quedará registrado en el historial del préstamo"
          />

          {cambioReal && !menorAlPagado && (
            <Alert severity={delta > 0 ? 'warning' : 'info'}>
              {delta > 0 ? 'Recargo' : 'Reducción'} de{' '}
              <strong>{formatPrice(Math.abs(delta))}</strong>
              {' '}({delta > 0 ? '+' : ''}{((delta / (montoActual || 1)) * 100).toFixed(1)}%).{' '}
              Nuevo saldo de la cuota: <strong>{formatPrice(Math.max(0, montoNum - montoPagado))}</strong>.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitDisabled}>
          {submitting ? 'Guardando...' : 'Confirmar cambio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
