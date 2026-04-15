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
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import type { CajaAhorroDolares } from '../../../../types';
import { extractError } from '../utils';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  caja?: CajaAhorroDolares | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  sucursalId: string;
}

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  sucursalId: yup.string(),
});

const CajaFormDialog: React.FC<Props> = ({ open, mode, caja, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { nombre: '', descripcion: '', sucursalId: '' },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (mode === 'edit' && caja) {
        reset({
          nombre: caja.nombre,
          descripcion: caja.descripcion ?? '',
          sucursalId: caja.sucursalId != null ? String(caja.sucursalId) : '',
        });
      } else {
        reset({ nombre: '', descripcion: '', sucursalId: '' });
      }
    }
  }, [open, mode, caja, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      const dto = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        sucursalId: data.sucursalId ? Number(data.sucursalId) : undefined,
      };
      if (mode === 'edit' && caja) {
        await cajasAhorroApi.update(caja.id, dto);
      } else {
        await cajasAhorroApi.create(dto);
      }
      onSaved();
    } catch (err) {
      setApiError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Editar caja de ahorro' : 'Nueva caja de ahorro'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={12}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre *"
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                    autoFocus
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
                    rows={3}
                    error={!!errors.descripcion}
                    helperText={errors.descripcion?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Controller
                name="sucursalId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="ID de sucursal (opcional)"
                    type="number"
                    inputProps={{ min: 1 }}
                    error={!!errors.sucursalId}
                    helperText={errors.sucursalId?.message ?? 'Dejar vacío si no aplica'}
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
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CajaFormDialog;
