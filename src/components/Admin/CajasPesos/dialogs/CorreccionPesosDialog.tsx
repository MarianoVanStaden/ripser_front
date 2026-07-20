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
  Typography,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type { CajaPesos } from '../../../../types';
import { extractError, formatPesos } from '../../CajasAhorro/utils';

interface Props {
  open: boolean;
  caja: CajaPesos | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  saldoObjetivo: string;
  motivo: string;
}

const max2dec = (v: unknown) =>
  v == null || v === '' || /^-?\d+(\.\d{1,2})?$/.test(String(v));

const schema = yup.object({
  saldoObjetivo: yup
    .string()
    .required('Requerido')
    .test('num', 'Número inválido', (v) => v != null && !isNaN(parseFloat(v)))
    .test('dec', 'Máximo 2 decimales', max2dec),
  motivo: yup.string().trim().required('El motivo es obligatorio'),
});

const CorreccionPesosDialog: React.FC<Props> = ({ open, caja, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const saldo = caja?.saldoActual ?? 0;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { saldoObjetivo: '', motivo: '' },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      reset({ saldoObjetivo: '', motivo: '' });
    }
  }, [open, reset]);

  const saldoObjetivoRaw = useWatch({ control, name: 'saldoObjetivo' });
  const objetivoNum = parseFloat(saldoObjetivoRaw ?? '');
  const delta = !isNaN(objetivoNum) ? objetivoNum - saldo : null;

  const onSubmit = async (data: FormData) => {
    if (!caja) return;
    setSaving(true);
    setApiError(null);
    try {
      await cajasPesosApi.corregir(caja.id, {
        saldoObjetivo: parseFloat(data.saldoObjetivo),
        motivo: data.motivo.trim(),
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
      <DialogTitle>Corrección de saldo — {caja?.nombre}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Ajusta el saldo de la caja al valor que indiques <strong>sin generar un
            ingreso ni egreso real de dinero</strong>. Queda registrado como un movimiento
            de tipo <strong>Ajuste</strong>. Herramienta exclusiva de SuperAdmin.
          </Alert>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Typography
            variant="body2"
            color={saldo < 0 ? 'error.main' : 'text.secondary'}
            mb={2}
          >
            Saldo actual: <strong>{formatPesos(saldo)}</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Controller
                name="saldoObjetivo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Saldo correcto $ *"
                    type="number"
                    inputProps={{ step: '0.01' }}
                    error={!!errors.saldoObjetivo}
                    helperText={errors.saldoObjetivo?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name="motivo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Motivo *"
                    multiline
                    rows={2}
                    error={!!errors.motivo}
                    helperText={errors.motivo?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
          {delta != null && delta !== 0 && (
            <Typography variant="body2" mt={2}>
              Se registrará un ajuste de{' '}
              <strong style={{ color: delta > 0 ? '#2e7d32' : '#d32f2f' }}>
                {delta > 0 ? '+' : '−'} {formatPesos(Math.abs(delta))}
              </strong>{' '}
              → nuevo saldo {formatPesos(objetivoNum)}.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="warning"
            startIcon={<BuildIcon />}
            disabled={saving || delta === 0}
          >
            {saving ? <CircularProgress size={20} /> : 'Aplicar corrección'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CorreccionPesosDialog;
