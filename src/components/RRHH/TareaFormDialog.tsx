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
import { puestoApi } from '../../api/services/puestoApi';
import type { TareaPuestoDTO } from '../../types';

interface Props {
  open: boolean;
  puestoId: number;
  tarea: TareaPuestoDTO | null;
  onClose: () => void;
  onSave: () => void;
}

interface TareaFormData {
  nombre: string;
  descripcion: string;
  obligatoria: boolean;
}

const validationSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido').max(300, 'Máximo 300 caracteres'),
  descripcion: yup.string().max(5000, 'Máximo 5000 caracteres'),
  obligatoria: yup.boolean().required(),
});

const TareaFormDialog: React.FC<Props> = ({ open, puestoId, tarea, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = tarea !== null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TareaFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      nombre: '',
      descripcion: '',
      obligatoria: false,
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (tarea) {
        reset({
          nombre: tarea.nombre,
          descripcion: tarea.descripcion || '',
          obligatoria: tarea.obligatoria,
        });
      } else {
        reset({ nombre: '', descripcion: '', obligatoria: false });
      }
    }
  }, [open, tarea, reset]);

  const onSubmit = async (data: TareaFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing) {
        await puestoApi.updateTarea(puestoId, tarea!.id, {
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          obligatoria: data.obligatoria,
        });
      } else {
        await puestoApi.addTarea(puestoId, {
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          obligatoria: data.obligatoria,
        });
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving tarea:', err);
      setError(err.response?.data?.message || 'Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre de la Tarea"
                    required
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
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
            <Grid item xs={12}>
              <Controller
                name="obligatoria"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Tarea Obligatoria"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TareaFormDialog;
