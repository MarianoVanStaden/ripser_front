import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid2 as Grid,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { provisionApi } from '../../../../api/services/provisionApi';
import { MetodoPago, METODO_PAGO_LABELS, type MetodoPago as MetodoPagoType } from '../../../../types/prestamo.types';
import { metodoPagoRequiereCaja, type CajaRef } from '../../../../types/caja.types';
import { CajaSelector } from '../../../common/CajaSelector';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const schema = yup.object({
  montoPagado: yup
    .number()
    .typeError('Ingrese un monto válido')
    .required('El monto es obligatorio')
    .min(0, 'Debe ser ≥ 0'),
});

type FormData = { montoPagado: number };

interface Props {
  open: boolean;
  tipoId: number;
  tipoNombre: string;
  anio: number;
  mes: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function RegistrarPagoDialog({ open, tipoId, tipoNombre, anio, mes, onClose, onSaved }: Props) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoType>('EFECTIVO');
  const [cajaRef, setCajaRef] = useState<CajaRef | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: { montoPagado: 0 },
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    setMetodoPago('EFECTIVO');
    setCajaRef(null);
    reset({ montoPagado: 0 });
  }, [open, reset]);

  const requiereCaja = metodoPagoRequiereCaja(metodoPago);
  const cajaFaltante = requiereCaja && !cajaRef;

  const onSubmit = async (data: FormData) => {
    if (cajaFaltante) {
      setApiError('Seleccioná la caja de donde sale el pago.');
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      await provisionApi.registrarPago(tipoId, anio, mes, {
        montoPagado: data.montoPagado,
        metodoPago,
        cajaPesosId: cajaRef?.tipo === 'PESOS' ? cajaRef.id : null,
        cajaAhorroId: cajaRef?.tipo === 'AHORRO' ? cajaRef.id : null,
      });
      onSaved();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404) {
        setApiError('Primero registre la provisión del mes antes de registrar un pago.');
      } else {
        setApiError(msg ?? 'Error al registrar el pago');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>
        Registrar pago — {tipoNombre} {MONTH_NAMES[mes]} {anio}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Tipo: <strong>{tipoNombre}</strong> · Período: <strong>{MONTH_NAMES[mes]} {anio}</strong>
              </Typography>
            </Grid>

            <Grid size={12}>
              <Controller
                name="montoPagado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Monto pagado ($) *"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: '0.01', min: '0' }}
                    error={!!errors.montoPagado}
                    helperText={errors.montoPagado?.message}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    autoFocus
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Método de pago</InputLabel>
                <Select
                  value={metodoPago}
                  label="Método de pago"
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPagoType)}
                >
                  {Object.values(MetodoPago)
                    .filter((m) => m !== 'CUENTA_CORRIENTE' && m !== 'FINANCIACION_PROPIA')
                    .map((m) => (
                      <MenuItem key={m} value={m}>
                        {METODO_PAGO_LABELS[m]}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {requiereCaja && (
              <Grid size={12}>
                <CajaSelector
                  metodoPago={metodoPago}
                  value={cajaRef}
                  onChange={setCajaRef}
                  direccion="egreso"
                />
              </Grid>
            )}

            {apiError && (
              <Grid size={12}>
                <Alert severity="error">{apiError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" color="success" disabled={saving || cajaFaltante}>
            {saving ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
