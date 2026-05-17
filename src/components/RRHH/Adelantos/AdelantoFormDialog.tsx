import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  TextField, Grid, Autocomplete, InputAdornment, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Payments as PaymentsIcon } from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import type { Adelanto, AdelantoCreateDTO, Empleado } from '../../../types';

interface Props {
  open: boolean;
  empleados: Empleado[];
  editing: Adelanto | null;
  onClose: () => void;
  onSubmit: (dto: AdelantoCreateDTO) => Promise<void>;
}

interface FormValues {
  empleadoId: number | null;
  periodo: string;       // YYYY-MM
  fecha: string;         // YYYY-MM-DD
  monto: number | '';
  observaciones: string;
}

const schema = yup.object({
  empleadoId: yup.number().required('Empleado obligatorio').nullable(),
  periodo: yup.string().required('Período obligatorio').matches(/^\d{4}-\d{2}$/, 'Formato YYYY-MM'),
  fecha: yup.string().required('Fecha obligatoria'),
  monto: yup.number().required('Monto obligatorio').positive('Debe ser positivo').typeError('Numérico'),
  observaciones: yup.string().nullable().defined(),
});

const AdelantoFormDialog: React.FC<Props> = ({ open, empleados, editing, onClose, onSubmit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      empleadoId: null,
      periodo: dayjs().format('YYYY-MM'),
      fecha: dayjs().format('YYYY-MM-DD'),
      monto: '',
      observaciones: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(editing
        ? {
            empleadoId: editing.empleadoId,
            periodo: editing.periodo,
            fecha: editing.fecha,
            monto: editing.monto,
            observaciones: editing.observaciones ?? '',
          }
        : {
            empleadoId: null,
            periodo: dayjs().format('YYYY-MM'),
            fecha: dayjs().format('YYYY-MM-DD'),
            monto: '',
            observaciones: '',
          },
      );
    }
  }, [open, editing, reset]);

  const submit = handleSubmit(async (values) => {
    if (values.empleadoId == null) return;
    await onSubmit({
      empleadoId: values.empleadoId,
      periodo: values.periodo,
      fecha: values.fecha,
      monto: Number(values.monto),
      observaciones: values.observaciones?.trim() || null,
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <PaymentsIcon />
          <Typography variant="h6" fontWeight={600}>
            {editing ? 'Editar Adelanto' : 'Nuevo Adelanto'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Controller
              name="empleadoId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={empleados}
                  value={empleados.find(e => e.id === field.value) ?? null}
                  onChange={(_, v) => field.onChange(v?.id ?? null)}
                  getOptionLabel={(e) => `${e.nombre} ${e.apellido}`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Empleado *"
                      error={!!errors.empleadoId}
                      helperText={errors.empleadoId?.message}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="periodo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="month"
                  label="Período a imputar *"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.periodo}
                  helperText={errors.periodo?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="fecha"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  label="Fecha de entrega *"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fecha}
                  helperText={errors.fecha?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="monto"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Monto *"
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  error={!!errors.monto}
                  helperText={errors.monto?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={2}
                  label="Observaciones"
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancelar</Button>
        <Button onClick={submit} variant="contained" disabled={isSubmitting} startIcon={<PaymentsIcon />}>
          {editing ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdelantoFormDialog;
