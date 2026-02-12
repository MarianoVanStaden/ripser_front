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
  InputAdornment,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { puestoApi } from '../../api/services/puestoApi';
import type { CreatePuestoDTO, UpdatePuestoDTO } from '../../types';

interface Props {
  open: boolean;
  puestoId: number | null;
  onClose: () => void;
  onSave: () => void;
}

interface PuestoFormData {
  nombre: string;
  descripcion: string;
  departamento: string;
  salarioBase: number;
  requisitos: string;
  objetivoGeneral: string;
  motivoCambio: string;
}

const validationSchema = yup.object({
  nombre: yup.string().required('El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: yup.string().max(5000, 'Máximo 5000 caracteres'),
  departamento: yup.string().max(200, 'Máximo 200 caracteres'),
  salarioBase: yup.number().min(0, 'No puede ser negativo').typeError('Debe ser un número'),
  requisitos: yup.string().max(5000, 'Máximo 5000 caracteres'),
  objetivoGeneral: yup.string().max(5000, 'Máximo 5000 caracteres'),
  motivoCambio: yup.string().max(500, 'Máximo 500 caracteres'),
});

const PuestoFormDialog: React.FC<Props> = ({ open, puestoId, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = puestoId !== null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PuestoFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      nombre: '',
      descripcion: '',
      departamento: '',
      salarioBase: 0,
      requisitos: '',
      objetivoGeneral: '',
      motivoCambio: '',
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (puestoId) {
        loadPuesto(puestoId);
      } else {
        reset({
          nombre: '',
          descripcion: '',
          departamento: '',
          salarioBase: 0,
          requisitos: '',
          objetivoGeneral: '',
          motivoCambio: '',
        });
      }
    }
  }, [open, puestoId, reset]);

  const loadPuesto = async (id: number) => {
    try {
      setLoadingData(true);
      const data = await puestoApi.getById(id);
      reset({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        departamento: data.departamento || '',
        salarioBase: data.salarioBase || 0,
        requisitos: data.requisitos || '',
        objetivoGeneral: data.objetivoGeneral || '',
        motivoCambio: '',
      });
    } catch (err) {
      console.error('Error loading puesto:', err);
      setError('Error al cargar los datos del puesto');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: PuestoFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (isEditing) {
        const updateData: UpdatePuestoDTO = {
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          departamento: data.departamento || undefined,
          salarioBase: data.salarioBase,
          requisitos: data.requisitos || undefined,
          objetivoGeneral: data.objetivoGeneral || undefined,
          motivoCambio: data.motivoCambio || undefined,
        };
        await puestoApi.update(puestoId!, updateData);
      } else {
        const createData: CreatePuestoDTO = {
          nombre: data.nombre,
          descripcion: data.descripcion || undefined,
          departamento: data.departamento || undefined,
          salarioBase: data.salarioBase,
          requisitos: data.requisitos || undefined,
          objetivoGeneral: data.objetivoGeneral || undefined,
        };
        await puestoApi.create(createData);
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving puesto:', err);
      setError(err.response?.data?.message || 'Error al guardar el puesto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Puesto' : 'Nuevo Puesto'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {loadingData ? (
            <Alert severity="info">Cargando datos...</Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="nombre"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nombre del Puesto"
                      required
                      error={!!errors.nombre}
                      helperText={errors.nombre?.message}
                      placeholder="Ej: Desarrollador Senior"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="departamento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Departamento"
                      error={!!errors.departamento}
                      helperText={errors.departamento?.message}
                      placeholder="Ej: Tecnología"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="salarioBase"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Salario Base"
                      type="number"
                      error={!!errors.salarioBase}
                      helperText={errors.salarioBase?.message}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
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
                  name="objetivoGeneral"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Objetivo General"
                      multiline
                      rows={2}
                      error={!!errors.objetivoGeneral}
                      helperText={errors.objetivoGeneral?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="requisitos"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Requisitos"
                      multiline
                      rows={2}
                      error={!!errors.requisitos}
                      helperText={errors.requisitos?.message}
                    />
                  )}
                />
              </Grid>
              {isEditing && (
                <Grid item xs={12}>
                  <Controller
                    name="motivoCambio"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Motivo del Cambio"
                        error={!!errors.motivoCambio}
                        helperText={errors.motivoCambio?.message || 'Se registrará en el historial de versiones'}
                        placeholder="Ej: Actualización salarial"
                      />
                    )}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading || loadingData}>
            {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Puesto'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PuestoFormDialog;
