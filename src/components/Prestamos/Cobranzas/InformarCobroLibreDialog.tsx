import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Stack, Alert, CircularProgress,
} from '@mui/material';
import { pagoInformadoApi } from '../../../api/services/pagoInformadoApi';
import { MetodoPago, METODO_PAGO_LABELS } from '../../../types/prestamo.types';
import type { MetodoPago as MetodoPagoType } from '../../../types/venta.types';

interface InformarCobroLibreDialogProps {
  open: boolean;
  gestionId: number;
  clienteNombre: string;
  /** Monto pendiente actual de la gestión — prellenado, editable. */
  montoSugerido: number | null;
  onClose: () => void;
  onSaved: () => void;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

/**
 * Informe de cobro de una gestión libre (sin crédito): mismo circuito que
 * "Pagos Informados por Cobranzas" — queda pendiente en la bandeja de
 * administración, que confirma eligiendo la caja de destino.
 */
export const InformarCobroLibreDialog: React.FC<InformarCobroLibreDialogProps> = ({
  open, gestionId, clienteNombre, montoSugerido, onClose, onSaved,
}) => {
  const [monto, setMonto] = useState<number | ''>(montoSugerido ?? '');
  const [metodoPago, setMetodoPago] = useState<MetodoPagoType>('TRANSFERENCIA');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [fechaPago, setFechaPago] = useState(getTodayStr());
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setMonto(montoSugerido ?? '');
    setNumeroComprobante('');
    setObservaciones('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (monto === '' || Number(monto) <= 0) {
      setError('Ingrese un monto mayor a 0.');
      return;
    }
    if (!numeroComprobante.trim()) {
      setError('El número de comprobante es obligatorio.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await pagoInformadoApi.informar({
        gestionCobranzaId: gestionId,
        montoInformado: Number(monto),
        numeroComprobante: numeroComprobante.trim(),
        metodoPago,
        fechaPagoInformada: fechaPago,
        observaciones: observaciones || undefined,
      });
      onSaved();
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error
        || 'Error al informar el cobro. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Informar cobro — {clienteNombre}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">
            El cobro queda pendiente hasta que administración lo confirme y elija la caja de destino.
          </Alert>
          <TextField
            label="Monto cobrado *"
            type="number"
            fullWidth size="small"
            value={monto}
            onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
            inputProps={{ min: 0 }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Método de pago</InputLabel>
            <Select
              value={metodoPago}
              label="Método de pago"
              onChange={(e) => setMetodoPago(e.target.value as MetodoPagoType)}
            >
              {(Object.keys(MetodoPago) as (keyof typeof MetodoPago)[]).map((k) => (
                <MenuItem key={k} value={MetodoPago[k]}>
                  {METODO_PAGO_LABELS[MetodoPago[k]]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="N° de comprobante *"
            fullWidth size="small"
            value={numeroComprobante}
            onChange={(e) => setNumeroComprobante(e.target.value)}
          />
          <TextField
            label="Fecha del cobro"
            type="date"
            fullWidth size="small"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Observaciones"
            multiline rows={2}
            fullWidth size="small"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : undefined}
        >
          Informar cobro
        </Button>
      </DialogActions>
    </Dialog>
  );
};
