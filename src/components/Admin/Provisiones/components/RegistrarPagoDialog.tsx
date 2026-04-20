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
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { provisionApi } from '../../../../api/services/provisionApi';
import type { TipoProvision } from '../../../../types';

const TIPO_LABELS: Record<TipoProvision, string> = {
  AGUINALDO: 'Aguinaldo',
  VACACIONES: 'Vacaciones',
  SAC: 'SAC',
  OTRO: 'Otro',
};

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
  tipo: TipoProvision;
  anio: number;
  mes: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function RegistrarPagoDialog({ open, tipo, anio, mes, onClose, onSaved }: Props) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { montoPagado: 0 },
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    reset({ montoPagado: 0 });
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      await provisionApi.registrarPago(tipo, anio, mes, { montoPagado: data.montoPagado });
      onSaved();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setApiError('Primero registre la provisión del mes antes de registrar un pago.');
      } else {
        setApiError(err?.response?.data?.message ?? 'Error al registrar el pago');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>
        Registrar pago — {TIPO_LABELS[tipo]} {MONTH_NAMES[mes]} {anio}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Tipo: <strong>{TIPO_LABELS[tipo]}</strong> · Período: <strong>{MONTH_NAMES[mes]} {anio}</strong>
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

            {apiError && (
              <Grid size={12}>
                <Alert severity="error">{apiError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" color="success" disabled={saving}>
            {saving ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
