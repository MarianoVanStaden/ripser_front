import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, Typography, Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import type { CuotaPrestamoDTO } from '../../types/prestamo.types';

interface Props {
  open: boolean;
  cuota: CuotaPrestamoDTO;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export const EditarFechaPagoDialog: React.FC<Props> = ({
  open, cuota, onClose, onSaved,
}) => {
  const fechaActual = cuota.fechaPago ? dayjs(cuota.fechaPago) : dayjs();
  const [nuevaFecha, setNuevaFecha] = useState<Dayjs | null>(fechaActual);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motivoValido = motivo.trim().length >= 5;
  const fechaValida = !!nuevaFecha && nuevaFecha.isValid();
  const cambioReal = fechaValida && !nuevaFecha.isSame(fechaActual, 'day');
  const submitDisabled = !fechaValida || !motivoValido || !cambioReal || submitting;

  const handleClose = () => {
    if (submitting) return;
    setMotivo('');
    setError(null);
    setNuevaFecha(fechaActual);
    onClose();
  };

  const handleSubmit = async () => {
    if (!nuevaFecha) return;
    setSubmitting(true);
    setError(null);
    try {
      await cuotaPrestamoApi.editarFechaPago(
        cuota.id,
        nuevaFecha.format('YYYY-MM-DD'),
        motivo.trim()
      );
      onSaved(`Fecha de pago de cuota N° ${cuota.numeroCuota} actualizada correctamente.`);
      handleClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al actualizar la fecha de pago.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Editar Fecha de Pago</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Cuota N° <strong>{cuota.numeroCuota}</strong> — Estado:{' '}
              <strong>{cuota.estado}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fecha de pago actual:{' '}
              <strong>
                {cuota.fechaPago ? dayjs(cuota.fechaPago).format('DD/MM/YYYY') : '—'}
              </strong>
            </Typography>

            <DatePicker
              label="Nueva fecha de pago"
              value={nuevaFecha}
              onChange={setNuevaFecha}
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Motivo del cambio *"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              error={motivo.length > 0 && !motivoValido}
              helperText={
                motivo.length > 0 && !motivoValido
                  ? 'El motivo debe tener al menos 5 caracteres'
                  : `${motivo.length} / 500`
              }
              inputProps={{ maxLength: 500 }}
            />

            <Alert severity="info" sx={{ borderRadius: 1 }}>
              <Typography variant="body2">
                También se actualizará la fecha del movimiento correspondiente en la cuenta
                corriente del cliente.
              </Typography>
            </Alert>

            {error && <Alert severity="error" sx={{ borderRadius: 1 }}>{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitDisabled}
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditarFechaPagoDialog;
