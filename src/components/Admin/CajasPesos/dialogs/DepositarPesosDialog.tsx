import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  TextField,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type { CajaPesos } from '../../../../types';
import { extractError, todayString } from '../../CajasAhorro/utils';

interface Props {
  open: boolean;
  caja: CajaPesos | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  monto: string;
  fecha: string;
  descripcion: string;
}

const max2dec = (v: unknown) =>
  v == null || v === '' || /^\d+(\.\d{1,2})?$/.test(String(v));

const schema = yup.object({
  monto: yup
    .string()
    .required('Requerido')
    .test('pos', 'Debe ser mayor a 0', (v) => parseFloat(v ?? '') > 0)
    .test('dec', 'Máximo 2 decimales', max2dec),
  fecha: yup.string().required('La fecha es obligatoria'),
  descripcion: yup.string(),
});

const DepositarPesosDialog: React.FC<Props> = ({ open, caja, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { monto: '', fecha: todayString(), descripcion: '' },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({ monto: '', fecha: todayString(), descripcion: '' });
    }
  }, [open, reset]);

  const onSubmit = async (data: FormData) => {
    if (!caja) return;
    setSaving(true);
    setApiError(null);
    try {
      await cajasPesosApi.depositar(caja.id, {
        monto: parseFloat(data.monto),
        fecha: data.fecha,
        descripcion: data.descripcion || undefined,
      });
      onSuccess();
    } catch (err) {
      setApiError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Depositar en {caja?.nombre}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={6}>
              <Controller
                name="monto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Monto $ *"
                    type="number"
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.monto}
                    helperText={errors.monto?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={6}>
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Fecha *"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.fecha}
                    helperText={errors.fecha?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Descripción"
                    multiline
                    rows={2}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="success" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Confirmar depósito'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepositarPesosDialog;
