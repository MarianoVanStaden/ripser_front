import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert, Typography, Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { documentoApi } from '../../api/services';
import type { DocumentoComercial } from '../../types';

interface Props {
  open: boolean;
  documento: DocumentoComercial;
  onClose: () => void;
  onSaved: (updated: DocumentoComercial) => void;
}

export const EditarFechaVentaDialog: React.FC<Props> = ({
  open, documento, onClose, onSaved,
}) => {
  const [nuevaFecha, setNuevaFecha] = useState<Dayjs | null>(
    dayjs(documento.fechaEmision)
  );
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const motivoValido = motivo.trim().length >= 5;
  const fechaValida = !!nuevaFecha && nuevaFecha.isValid() && !nuevaFecha.isAfter(dayjs());
  const cambioReal = fechaValida && !nuevaFecha.isSame(dayjs(documento.fechaEmision), 'minute');
  const submitDisabled = !fechaValida || !motivoValido || !cambioReal || submitting;

  const tieneNC = !!documento.documentoSiguienteId;

  const handleClose = () => {
    if (submitting) return;
    setMotivo('');
    setError(null);
    setNuevaFecha(dayjs(documento.fechaEmision));
    onClose();
  };

  const handleSubmit = async () => {
    if (!nuevaFecha) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await documentoApi.updateFechaEmision(
        documento.id,
        nuevaFecha.toISOString(),
        motivo.trim()
      );
      onSaved(updated);
      handleClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al actualizar la fecha.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Fecha de Emisión</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Documento: <strong>{documento.numeroDocumento}</strong> — {documento.clienteNombre}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fecha actual: <strong>{dayjs(documento.fechaEmision).format('DD/MM/YYYY HH:mm')}</strong>
            </Typography>

            <DateTimePicker
              label="Nueva fecha de emisión"
              value={nuevaFecha}
              onChange={setNuevaFecha}
              maxDateTime={dayjs()}
              format="DD/MM/YYYY HH:mm"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!nuevaFecha && !fechaValida,
                  helperText: nuevaFecha && nuevaFecha.isAfter(dayjs()) ? 'No se puede seleccionar una fecha futura' : undefined,
                },
              }}
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

            <Alert severity="warning" sx={{ borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Importante:</strong> También se actualizará la fecha del movimiento en la
                cuenta corriente del cliente. El cronograma de cuotas del préstamo asociado{' '}
                <strong>NO</strong> se modifica automáticamente.
              </Typography>
            </Alert>

            {tieneNC && (
              <Alert severity="info" sx={{ borderRadius: 1 }}>
                <Typography variant="body2">
                  Este documento tiene una Nota de Crédito asociada (
                  {documento.documentoSiguienteNumero}). La fecha de la NC no se modifica.
                </Typography>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: 1 }}>
                {error}
              </Alert>
            )}
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

export default EditarFechaVentaDialog;
