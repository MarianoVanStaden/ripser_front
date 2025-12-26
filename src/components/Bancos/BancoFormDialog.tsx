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

// Form data interface
interface BancoFormData {
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  cbu?: string;
  alias?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  swift?: string;
  sitioWeb?: string;
  telefono?: string;
  direccion?: string;
  observaciones?: string;
  activo: boolean;
}

// Schema de validación Yup
const validationSchema = yup.object({
  codigo: yup.string().required('El código es requerido').max(10, 'Máximo 10 caracteres'),
  nombre: yup.string().required('El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  nombreCorto: yup.string().max(100, 'Máximo 100 caracteres').nullable(),
  cbu: yup
    .string()
    .matches(/^(\d{22})?$/, 'El CBU debe tener exactamente 22 dígitos')
    .nullable(),
  alias: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  numeroCuenta: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  tipoCuenta: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  swift: yup.string().max(11, 'El código SWIFT debe tener máximo 11 caracteres').nullable(),
  sitioWeb: yup.string().max(200, 'Máximo 200 caracteres').url('URL inválida').nullable(),
  telefono: yup.string().max(50, 'Máximo 50 caracteres').nullable(),
  direccion: yup.string().max(5000, 'Máximo 5000 caracteres').nullable(),
  observaciones: yup.string().max(5000, 'Máximo 5000 caracteres').nullable(),
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
      cbu: '',
      alias: '',
      numeroCuenta: '',
      tipoCuenta: '',
      swift: '',
      sitioWeb: '',
      telefono: '',
      direccion: '',
      observaciones: '',
      activo: true,
    },
  });

  // Reset form cuando cambia el banco o se abre/cierra el modal
  useEffect(() => {
    if (open) {
      if (banco) {
        reset({
          codigo: banco.codigo,
          nombre: banco.nombre,
          nombreCorto: banco.nombreCorto || '',
          cbu: banco.cbu || '',
          alias: banco.alias || '',
          numeroCuenta: banco.numeroCuenta || '',
          tipoCuenta: banco.tipoCuenta || '',
          swift: banco.swift || '',
          sitioWeb: banco.sitioWeb || '',
          telefono: banco.telefono || '',
          direccion: banco.direccion || '',
          observaciones: banco.observaciones || '',
          activo: banco.activo,
        });
      } else {
        reset({
          codigo: '',
          nombre: '',
          nombreCorto: '',
          cbu: '',
          alias: '',
          numeroCuenta: '',
          tipoCuenta: '',
          swift: '',
          sitioWeb: '',
          telefono: '',
          direccion: '',
          observaciones: '',
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
        cbu: data.cbu || undefined,
        alias: data.alias || undefined,
        numeroCuenta: data.numeroCuenta || undefined,
        tipoCuenta: data.tipoCuenta || undefined,
        swift: data.swift || undefined,
        sitioWeb: data.sitioWeb || undefined,
        telefono: data.telefono || undefined,
        direccion: data.direccion || undefined,
        observaciones: data.observaciones || undefined,
        activo: data.activo,
      };

      if (banco) {
        // Actualizar banco existente
        await bancoApi.update(banco.id, bancoData);
      } else {
        // Crear nuevo banco
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{banco ? 'Editar Banco' : 'Nuevo Banco'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Código */}
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

            {/* Nombre */}
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

            {/* Nombre Corto */}
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
                    label="Banco Activo"
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

            {/* SWIFT */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="swift"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Código SWIFT"
                    error={!!errors.swift}
                    helperText={errors.swift?.message}
                  />
                )}
              />
            </Grid>

            {/* Sitio Web */}
            <Grid item xs={12} sm={8}>
              <Controller
                name="sitioWeb"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Sitio Web"
                    error={!!errors.sitioWeb}
                    helperText={errors.sitioWeb?.message}
                    placeholder="https://www.ejemplo.com"
                  />
                )}
              />
            </Grid>

            {/* Teléfono */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Teléfono"
                    error={!!errors.telefono}
                    helperText={errors.telefono?.message}
                  />
                )}
              />
            </Grid>

            {/* Dirección */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="direccion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Dirección"
                    error={!!errors.direccion}
                    helperText={errors.direccion?.message}
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

export default BancoFormDialog;
