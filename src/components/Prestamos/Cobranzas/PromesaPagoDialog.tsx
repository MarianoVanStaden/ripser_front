import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography, Alert, Chip,
  FormHelperText, CircularProgress, Divider, Checkbox,
  List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import { cuotaPrestamoApi } from '../../../api/services/cuotaPrestamoApi';
import type { CuotaPrestamoDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';

interface PromesaPagoDialogProps {
  open: boolean;
  gestionId: number;
  prestamoId: number;
  clienteNombre: string;
  onClose: () => void;
  onSaved: () => void;
}

export const PromesaPagoDialog: React.FC<PromesaPagoDialogProps> = ({
  open, gestionId, prestamoId, clienteNombre, onClose, onSaved,
}) => {
  const [cuotas, setCuotas] = useState<CuotaPrestamoDTO[]>([]);
  const [selectedCuotaIds, setSelectedCuotaIds] = useState<number[]>([]);
  const [fechaPromesa, setFechaPromesa] = useState<Dayjs | null>(
    dayjs().add(7, 'day')
  );
  const [monto, setMonto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingCuotas(true);
    cuotaPrestamoApi.getByPrestamo(prestamoId)
      .then((data: CuotaPrestamoDTO[]) => {
        const enMora = data.filter(
          (c) => c.estado === 'VENCIDA' || c.estado === 'PARCIAL'
        );
        setCuotas(enMora);
        setSelectedCuotaIds(enMora.map((c) => c.id));
        const totalSaldo = enMora.reduce(
          (acc, c) => acc + (c.montoCuota - c.montoPagado),
          0
        );
        setMonto(totalSaldo.toFixed(2));
      })
      .catch(() => setError('Error al cargar cuotas del préstamo'))
      .finally(() => setLoadingCuotas(false));
  }, [open, prestamoId]);

  const saldoSeleccionado = cuotas
    .filter((c) => selectedCuotaIds.includes(c.id))
    .reduce((acc, c) => acc + (c.montoCuota - c.montoPagado), 0);

  const montoNum = parseFloat(monto || '0');
  const montoInsuficiente = montoNum > 0 && montoNum < saldoSeleccionado;

  const toggleCuota = (id: number) => {
    setSelectedCuotaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setError(null);

    if (!fechaPromesa || fechaPromesa.isBefore(dayjs(), 'day')) {
      setError('La fecha de promesa debe ser posterior a hoy.');
      return;
    }
    if (selectedCuotaIds.length === 0) {
      setError('Seleccioná al menos una cuota.');
      return;
    }
    if (montoInsuficiente) {
      setError(`El monto debe ser al menos ${formatPrice(saldoSeleccionado)}.`);
      return;
    }

    setLoading(true);
    try {
      await gestionCobranzaApi.registrarPromesa(gestionId, {
        fechaPromesa: fechaPromesa.format('YYYY-MM-DD'),
        montoPrometido: montoNum,
        cuotaIds: selectedCuotaIds,
        observaciones: observaciones || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Error al registrar la promesa.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setObservaciones('');
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Registrar Promesa de Pago
        <Typography variant="body2" color="text.secondary">
          {clienteNombre}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="subtitle2" gutterBottom>
          Cuotas en mora ({cuotas.length})
        </Typography>

        {loadingCuotas ? (
          <CircularProgress size={24} />
        ) : cuotas.length === 0 ? (
          <Alert severity="info">No hay cuotas en mora para este préstamo.</Alert>
        ) : (
          <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            {cuotas.map((c) => {
              const saldo = c.montoCuota - c.montoPagado;
              return (
                <ListItem
                  key={c.id}
                  dense
                  onClick={() => toggleCuota(c.id)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={selectedCuotaIds.includes(c.id)}
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Cuota #${c.numeroCuota} — ${formatPrice(saldo)}`}
                    secondary={
                      <>
                        Vence: {dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}
                        {(c.diasMora ?? 0) > 0 && (
                          <Chip
                            label={`${c.diasMora} días mora`}
                            size="small"
                            color="error"
                            sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                          />
                        )}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        {selectedCuotaIds.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Saldo mínimo para las cuotas seleccionadas:{' '}
            <strong>{formatPrice(saldoSeleccionado)}</strong>
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack spacing={2}>
          <DatePicker
            label="Fecha de promesa *"
            value={fechaPromesa}
            onChange={(value) => setFechaPromesa(value as any)}
            minDate={dayjs().add(1, 'day')}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                helperText: 'Debe ser una fecha futura',
              },
            }}
          />

          <div>
            <TextField
              label="Monto prometido *"
              type="number"
              fullWidth
              size="small"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              error={montoInsuficiente}
            />
            {montoInsuficiente && (
              <FormHelperText error>
                El monto es menor al saldo de las cuotas seleccionadas (
                {formatPrice(saldoSeleccionado)})
              </FormHelperText>
            )}
          </div>

          <TextField
            label="Observaciones"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || selectedCuotaIds.length === 0 || montoInsuficiente}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          Registrar Promesa
        </Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );
};
