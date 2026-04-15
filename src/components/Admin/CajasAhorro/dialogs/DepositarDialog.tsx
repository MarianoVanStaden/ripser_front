import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import type { CajaAhorroDolares } from '../../../../types';
import { extractError, formatPesos, formatUSD, todayString } from '../utils';

interface Props {
  open: boolean;
  caja: CajaAhorroDolares | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  montoUsd: string;
  valorDolar: string;
  fecha: string;
  descripcion: string;
}

const max2dec = (v: unknown) =>
  v == null || v === '' || /^\d+(\.\d{1,2})?$/.test(String(v));

const schema = yup.object({
  montoUsd: yup
    .string()
    .required('Requerido')
    .test('pos', 'Debe ser mayor a 0', (v) => parseFloat(v ?? '') > 0)
    .test('dec', 'Máximo 2 decimales', max2dec),
  valorDolar: yup
    .string()
    .required('Requerido')
    .test('pos', 'Debe ser mayor a 0', (v) => parseFloat(v ?? '') > 0)
    .test('dec', 'Máximo 2 decimales', max2dec),
  fecha: yup.string().required('La fecha es obligatoria'),
  descripcion: yup.string(),
});

const DepositarDialog: React.FC<Props> = ({ open, caja, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { montoUsd: '', valorDolar: '', fecha: todayString(), descripcion: '' },
  });

  const montoUsdVal = useWatch({ control, name: 'montoUsd' });
  const valorDolarVal = useWatch({ control, name: 'valorDolar' });

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({ montoUsd: '', valorDolar: '', fecha: todayString(), descripcion: '' });
    }
  }, [open, reset]);

  const monto = parseFloat(montoUsdVal);
  const tc = parseFloat(valorDolarVal);
  const showPreview = !isNaN(monto) && monto > 0 && !isNaN(tc) && tc > 0;

  const onSubmit = async (data: FormData) => {
    if (!caja) return;
    setSaving(true);
    setApiError(null);
    try {
      await cajasAhorroApi.depositar(caja.id, {
        montoUsd: parseFloat(data.montoUsd),
        valorDolar: parseFloat(data.valorDolar),
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
                name="montoUsd"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Monto USD *"
                    type="number"
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.montoUsd}
                    helperText={errors.montoUsd?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={6}>
              <Controller
                name="valorDolar"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tipo de cambio *"
                    type="number"
                    inputProps={{ step: '0.01', min: '0.01' }}
                    error={!!errors.valorDolar}
                    helperText={
                      errors.valorDolar?.message ??
                      (tc > 0 ? `1 USD = ${formatPesos(tc)}` : 'Pesos por dólar')
                    }
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

          {showPreview && (
            <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'success.50' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Resumen del depósito
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                {formatUSD(monto)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TC: {formatPesos(tc)} &nbsp;·&nbsp; Equiv. pesos: {formatPesos(monto * tc)}
              </Typography>
            </Paper>
          )}
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

export default DepositarDialog;
