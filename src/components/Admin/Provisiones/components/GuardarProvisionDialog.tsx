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
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { provisionApi } from '../../../../api/services/provisionApi';
import type { ProvisionMensualDTO } from '../../../../types';

const schema = yup.object({
  montoProvisionado: yup
    .number()
    .typeError('Ingrese un monto válido')
    .required('El monto es obligatorio')
    .min(0, 'Debe ser ≥ 0'),
  observaciones: yup.string().nullable().optional(),
});

type FormData = {
  montoProvisionado: number;
  observaciones?: string | null;
};

interface Props {
  open: boolean;
  tipoId: number;
  tipoNombre: string;
  anio: number;
  mes: number;
  existing: ProvisionMensualDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function GuardarProvisionDialog({ open, tipoId, tipoNombre, anio, mes, existing, onClose, onSaved }: Props) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      montoProvisionado: 0,
      observaciones: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    reset({
      montoProvisionado: existing?.montoProvisionado ?? 0,
      observaciones: existing?.observaciones ?? '',
    });
  }, [open, existing, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      await provisionApi.guardar(tipoId, anio, mes, {
        montoProvisionado: data.montoProvisionado,
        observaciones: data.observaciones || null,
      });
      onSaved();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Error al guardar la provisión');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = existing !== null;

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Editar' : 'Registrar'} provisión — {tipoNombre} {MONTH_NAMES[mes]} {anio}
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
                name="montoProvisionado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Monto provisionado ($) *"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: '0.01', min: '0' }}
                    error={!!errors.montoProvisionado}
                    helperText={errors.montoProvisionado?.message}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label="Observaciones"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    placeholder="Opcional"
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
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
