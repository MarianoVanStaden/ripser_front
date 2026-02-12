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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { bancoApi } from '../../api/services/bancoApi';
import type { Banco, BancoCreateDTO } from '../../types';

interface Props {
  open: boolean;
  banco: Banco | null;
  onClose: () => void;
  onSave: () => void;
}

interface BancoFormData {
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  activo: boolean;
}

const validationSchema = yup.object({
  codigo: yup.string().required('El código es requerido').max(10, 'Máximo 10 caracteres'),
  nombre: yup.string().required('El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  nombreCorto: yup.string().max(100, 'Máximo 100 caracteres').nullable(),
  activo: yup.boolean().required(),
});

const BancoFormDialog: React.FC<Props> = ({ open, banco, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BancoFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      codigo: '',
      nombre: '',
      nombreCorto: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (banco) {
        reset({
          codigo: banco.codigo,
          nombre: banco.nombre,
          nombreCorto: banco.nombreCorto || '',
          activo: banco.activo,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          nombreCorto: '',
          activo: true,
        });
      }
      setError(null);
    }
  }, [open, banco, reset]);

  const onSubmit = async (data: BancoFormData) => {
    try {
      setLoading(true);
      setError(null);

      const bancoData: BancoCreateDTO = {
        codigo: data.codigo,
        nombre: data.nombre,
        nombreCorto: data.nombreCorto || undefined,
        activo: data.activo,
      };

      if (banco) {
        await bancoApi.update(banco.id, bancoData);
      } else {
        await bancoApi.create(bancoData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving banco:', err);
      setError(err.response?.data?.message || 'Error al guardar el banco');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{banco ? 'Editar Banco' : 'Nuevo Banco'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Controller
                name="codigo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Código"
                    error={!!errors.codigo}
                    helperText={errors.codigo?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre"
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                    required
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="nombreCorto"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre Corto"
                    error={!!errors.nombreCorto}
                    helperText={errors.nombreCorto?.message}
                  />
                )}
              />
            </Grid>

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
                    label="Banco Activo"
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

export default BancoFormDialog;
