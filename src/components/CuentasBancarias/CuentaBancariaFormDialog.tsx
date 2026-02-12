import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cuentaBancariaApi } from '../../api/services/cuentaBancariaApi';
import { bancoApi } from '../../api/services/bancoApi';
import type { CuentaBancaria, CuentaBancariaCreateDTO, Banco } from '../../types';

interface Props {
  open: boolean;
  cuenta: CuentaBancaria | null;
  onClose: () => void;
  onSave: () => void;
}

interface CuentaBancariaFormData {
  bancoId: number | null;
  cbu?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  alias?: string;
  observaciones?: string;
  activo: boolean;
}

const validationSchema = yup.object({
  bancoId: yup.number().required('El banco es requerido').min(1, 'Debe seleccionar un banco'),
  cbu: yup.string().matches(/^(\d{22})?$/, 'El CBU debe tener exactamente 22 dígitos').nullable(),
  numeroCuenta: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  tipoCuenta: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  alias: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  observaciones: yup.string().max(5000, 'Máximo 5000 caracteres').nullable(),
  activo: yup.boolean().required(),
});

const CuentaBancariaFormDialog: React.FC<Props> = ({ open, cuenta, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bancos, setBancos] = useState<Banco[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CuentaBancariaFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      bancoId: null,
      cbu: '',
      numeroCuenta: '',
      tipoCuenta: '',
      alias: '',
      observaciones: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (open) {
      loadBancos();
      if (cuenta) {
        reset({
          bancoId: cuenta.bancoId,
          cbu: cuenta.cbu || '',
          numeroCuenta: cuenta.numeroCuenta || '',
          tipoCuenta: cuenta.tipoCuenta || '',
          alias: cuenta.alias || '',
          observaciones: cuenta.observaciones || '',
          activo: cuenta.activo,
        });
      } else {
        reset({
          bancoId: null,
          cbu: '',
          numeroCuenta: '',
          tipoCuenta: '',
          alias: '',
          observaciones: '',
          activo: true,
        });
      }
      setError(null);
    }
  }, [open, cuenta, reset]);

  const loadBancos = async () => {
    try {
      const data = await bancoApi.getActivos();
      setBancos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading bancos:', err);
    }
  };

  const onSubmit = async (data: CuentaBancariaFormData) => {
    try {
      setLoading(true);
      setError(null);

      const cuentaData: CuentaBancariaCreateDTO = {
        bancoId: data.bancoId!,
        cbu: data.cbu || undefined,
        numeroCuenta: data.numeroCuenta || undefined,
        tipoCuenta: data.tipoCuenta || undefined,
        alias: data.alias || undefined,
        observaciones: data.observaciones || undefined,
        activo: data.activo,
      };

      if (cuenta) {
        await cuentaBancariaApi.update(cuenta.id, cuentaData);
      } else {
        await cuentaBancariaApi.create(cuentaData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving cuenta bancaria:', err);
      setError(err.response?.data?.message || 'Error al guardar la cuenta bancaria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{cuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Banco */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="bancoId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={bancos}
                    getOptionLabel={(option) =>
                      `${option.nombre}${option.nombreCorto ? ` (${option.nombreCorto})` : ''}`
                    }
                    value={bancos.find((b) => b.id === value) || null}
                    onChange={(_, newValue) => onChange(newValue?.id || null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Banco"
                        required
                        error={!!errors.bancoId}
                        helperText={errors.bancoId?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Tipo de Cuenta */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="tipoCuenta"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tipo de Cuenta"
                    error={!!errors.tipoCuenta}
                    helperText={errors.tipoCuenta?.message}
                    placeholder="Ej: Cuenta Corriente, Caja de Ahorro"
                  />
                )}
              />
            </Grid>

            {/* CBU */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="cbu"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="CBU"
                    error={!!errors.cbu}
                    helperText={errors.cbu?.message || '22 dígitos'}
                  />
                )}
              />
            </Grid>

            {/* Número de Cuenta */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="numeroCuenta"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Número de Cuenta"
                    error={!!errors.numeroCuenta}
                    helperText={errors.numeroCuenta?.message}
                  />
                )}
              />
            </Grid>

            {/* Alias */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="alias"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Alias"
                    error={!!errors.alias}
                    helperText={errors.alias?.message}
                  />
                )}
              />
            </Grid>

            {/* Activo */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Cuenta Activa"
                  />
                )}
              />
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <Controller
                name="observaciones"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={3}
                    error={!!errors.observaciones}
                    helperText={errors.observaciones?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CuentaBancariaFormDialog;
