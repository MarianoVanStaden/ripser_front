import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type {
  StockObjetivoResponseDTO,
  CreateStockObjetivoDTO,
} from '../../../../types';
import { MEDIDAS_EQUIPO, COLORES_EQUIPO } from '../../../../types';

const TIPOS_EQUIPO = ['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'] as const;

const schema = yup.object({
  tipo: yup.string().required('El tipo es obligatorio'),
  modelo: yup.string().trim().required('El modelo es obligatorio'),
  medida: yup.string().required('La medida es obligatoria'),
  color: yup.string().nullable().optional(),
  cantidadObjetivo: yup
    .number()
    .typeError('Debe ser un número')
    .min(1, 'Debe ser mayor a 0')
    .required('La cantidad objetivo es obligatoria'),
  activo: yup.boolean().required(),
});

type FormData = {
  tipo: string;
  modelo: string;
  medida: string;
  color?: string | null;
  cantidadObjetivo: number;
  activo: boolean;
};

interface StockObjetivoFormProps {
  open: boolean;
  editing: StockObjetivoResponseDTO | null;
  saving: boolean;
  onClose: () => void;
  onSave: (dto: CreateStockObjetivoDTO) => Promise<void>;
}

export const StockObjetivoForm: React.FC<StockObjetivoFormProps> = ({
  open,
  editing,
  saving,
  onClose,
  onSave,
}) => {
  const isEdit = editing !== null;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      tipo: '',
      modelo: '',
      medida: '',
      color: '',
      cantidadObjetivo: 1,
      activo: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          tipo: editing.tipo,
          modelo: editing.modelo,
          medida: editing.medida,
          color: editing.color ?? '',
          cantidadObjetivo: editing.cantidadObjetivo,
          activo: editing.activo,
        });
      } else {
        reset({
          tipo: '',
          modelo: '',
          medida: '',
          color: '',
          cantidadObjetivo: 1,
          activo: true,
        });
      }
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: FormData) => {
    await onSave({
      tipo: data.tipo as CreateStockObjetivoDTO['tipo'],
      modelo: data.modelo.trim(),
      medida: data.medida as CreateStockObjetivoDTO['medida'],
      color: data.color || null,
      cantidadObjetivo: data.cantidadObjetivo,
      activo: data.activo,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Editar objetivo de stock' : 'Nuevo objetivo de stock'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Tipo *"
                    fullWidth
                    error={!!errors.tipo}
                    helperText={errors.tipo?.message}
                  >
                    {TIPOS_EQUIPO.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="modelo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Modelo *"
                    fullWidth
                    error={!!errors.modelo}
                    helperText={errors.modelo?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="medida"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Medida *"
                    fullWidth
                    error={!!errors.medida}
                    helperText={errors.medida?.message}
                  >
                    {MEDIDAS_EQUIPO.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Color (opcional)"
                    fullWidth
                    error={!!errors.color}
                    helperText={errors.color?.message}
                  >
                    <MenuItem value="">
                      <em>Sin color específico</em>
                    </MenuItem>
                    {COLORES_EQUIPO.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="cantidadObjetivo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cantidad objetivo *"
                    type="number"
                    fullWidth
                    inputProps={{ min: 1 }}
                    error={!!errors.cantidadObjetivo}
                    helperText={errors.cantidadObjetivo?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <Controller
                name="activo"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                    }
                    label="Activo"
                  />
                )}
              />
            </Grid>

            {Object.keys(errors).length > 0 && (
              <Grid item xs={12}>
                <Alert severity="error">Corregí los errores antes de continuar.</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
