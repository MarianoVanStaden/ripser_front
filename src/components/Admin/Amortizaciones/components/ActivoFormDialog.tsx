import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid2 as Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { amortizacionApi } from '../../../../api/services/amortizacionApi';
import { vehiculoApi } from '../../../../api/services/vehiculoApi';
import type {
  ActivoAmortizableDTO,
  CreateActivoAmortizableDTO,
  TipoActivoAmortizable,
  MetodoAmortizacion,
} from '../../../../types';
import type { Vehiculo } from '../../../../types';

const TIPOS: TipoActivoAmortizable[] = [
  'VEHICULO', 'HERRAMIENTAS', 'INFRAESTRUCTURA', 'MATERIA_PRIMA', 'AGUINALDOS', 'DESEMPLEO', 'OTRO',
];

const TIPO_LABEL: Record<TipoActivoAmortizable, string> = {
  VEHICULO: 'Vehículo',
  HERRAMIENTAS: 'Herramientas',
  INFRAESTRUCTURA: 'Infraestructura',
  MATERIA_PRIMA: 'Materia prima',
  AGUINALDOS: 'Aguinaldos',
  DESEMPLEO: 'Desempleo',
  OTRO: 'Otro',
};

const METODOS: MetodoAmortizacion[] = [
  'PORCENTAJE_FIJO', 'POR_KILOMETROS', 'MONTO_FIJO_MENSUAL',
];

const METODO_LABEL: Record<MetodoAmortizacion, string> = {
  PORCENTAJE_FIJO: 'Porcentaje fijo mensual',
  POR_KILOMETROS: 'Por kilómetros (vehículos)',
  MONTO_FIJO_MENSUAL: 'Monto fijo mensual',
};

const schema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio'),
  tipo: yup.string().required('El tipo es obligatorio') as yup.StringSchema<TipoActivoAmortizable>,
  metodo: yup.string().required('El método es obligatorio') as yup.StringSchema<MetodoAmortizacion>,
  valorInicial: yup.number().required('El valor inicial es obligatorio').min(0, 'Debe ser >= 0'),
  fechaAdquisicion: yup.string().required('La fecha de adquisición es obligatoria'),
  tasaMensual: yup.number().nullable().optional(),
  montoFijoMensual: yup.number().nullable().optional(),
  vidaUtilKm: yup.number().nullable().optional().min(1, 'Debe ser > 0'),
  vehiculoId: yup.number().nullable().optional(),
});

type FormData = {
  nombre: string;
  tipo: TipoActivoAmortizable;
  metodo: MetodoAmortizacion;
  valorInicial: number;
  fechaAdquisicion: string;
  tasaMensual?: number | null;
  montoFijoMensual?: number | null;
  vidaUtilKm?: number | null;
  vehiculoId?: number | null;
};

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  activo?: ActivoAmortizableDTO | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ActivoFormDialog({ open, mode, activo, onClose, onSaved }: Props) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      nombre: '',
      tipo: 'HERRAMIENTAS',
      metodo: 'PORCENTAJE_FIJO',
      valorInicial: 0,
      fechaAdquisicion: new Date().toISOString().split('T')[0],
      tasaMensual: null,
      montoFijoMensual: null,
      vidaUtilKm: null,
      vehiculoId: null,
    },
  });

  const tipoVal = watch('tipo');
  const metodoVal = watch('metodo');

  useEffect(() => {
    if (!open) return;
    setApiError(null);

    if (mode === 'edit' && activo) {
      reset({
        nombre: activo.nombre,
        tipo: activo.tipo,
        metodo: activo.metodo,
        valorInicial: activo.valorInicial,
        fechaAdquisicion: activo.fechaAdquisicion,
        tasaMensual: activo.tasaMensual,
        montoFijoMensual: activo.montoFijoMensual,
        vidaUtilKm: activo.vidaUtilKm,
        vehiculoId: activo.vehiculoId,
      });
    } else {
      reset({
        nombre: '',
        tipo: 'HERRAMIENTAS',
        metodo: 'PORCENTAJE_FIJO',
        valorInicial: 0,
        fechaAdquisicion: new Date().toISOString().split('T')[0],
        tasaMensual: null,
        montoFijoMensual: null,
        vidaUtilKm: null,
        vehiculoId: null,
      });
    }
  }, [open, mode, activo, reset]);

  useEffect(() => {
    if (!open || tipoVal !== 'VEHICULO') return;
    setLoadingVehiculos(true);
    vehiculoApi.getAll({ size: 200 })
      .then((page) => setVehiculos(page.content))
      .catch(() => setVehiculos([]))
      .finally(() => setLoadingVehiculos(false));
  }, [open, tipoVal]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      const dto: CreateActivoAmortizableDTO = {
        nombre: data.nombre,
        tipo: data.tipo,
        metodo: data.metodo,
        valorInicial: data.valorInicial,
        fechaAdquisicion: data.fechaAdquisicion,
        tasaMensual: data.metodo === 'PORCENTAJE_FIJO' ? (data.tasaMensual ?? null) : null,
        montoFijoMensual: data.metodo === 'MONTO_FIJO_MENSUAL' ? (data.montoFijoMensual ?? null) : null,
        vidaUtilKm: data.metodo === 'POR_KILOMETROS' ? (data.vidaUtilKm ?? null) : null,
        vehiculoId: data.tipo === 'VEHICULO' ? (data.vehiculoId ?? null) : null,
      };

      if (mode === 'edit' && activo) {
        await amortizacionApi.updateActivo(activo.id, dto);
      } else {
        await amortizacionApi.createActivo(dto);
      }
      onSaved();
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? 'Error al guardar el activo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Nuevo activo amortizable' : 'Editar activo'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Controller
                name="nombre"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre *"
                    fullWidth
                    size="small"
                    error={!!errors.nombre}
                    helperText={errors.nombre?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Tipo *"
                    fullWidth
                    size="small"
                    error={!!errors.tipo}
                    helperText={errors.tipo?.message}
                  >
                    {TIPOS.map((t) => (
                      <MenuItem key={t} value={t}>{TIPO_LABEL[t]}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="metodo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Método *"
                    fullWidth
                    size="small"
                    error={!!errors.metodo}
                    helperText={errors.metodo?.message}
                  >
                    {METODOS.map((m) => (
                      <MenuItem key={m} value={m}>{METODO_LABEL[m]}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {tipoVal === 'VEHICULO' && (
              <Grid size={12}>
                <Controller
                  name="vehiculoId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Vehículo"
                      fullWidth
                      size="small"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      disabled={loadingVehiculos}
                      InputProps={loadingVehiculos ? { endAdornment: <CircularProgress size={16} /> } : undefined}
                    >
                      <MenuItem value=""><em>Sin asignar</em></MenuItem>
                      {vehiculos.map((v) => (
                        <MenuItem key={v.id} value={v.id}>
                          {v.patente} — {v.marca}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}

            {metodoVal === 'POR_KILOMETROS' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="vidaUtilKm"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Vida útil estimada (km) *"
                      type="number"
                      fullWidth
                      size="small"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      inputProps={{ step: '1', min: '1' }}
                      helperText="Kilometraje total de vida del vehículo (ej: 300000)"
                      error={!!errors.vidaUtilKm}
                    />
                  )}
                />
              </Grid>
            )}

            {metodoVal === 'PORCENTAJE_FIJO' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="tasaMensual"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Tasa mensual (%)"
                      type="number"
                      fullWidth
                      size="small"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      inputProps={{ step: '0.01', min: '0' }}
                    />
                  )}
                />
              </Grid>
            )}

            {metodoVal === 'MONTO_FIJO_MENSUAL' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="montoFijoMensual"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Monto fijo mensual ($)"
                      type="number"
                      fullWidth
                      size="small"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                      inputProps={{ step: '0.01', min: '0' }}
                    />
                  )}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="valorInicial"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Valor inicial ($) *"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: '0.01', min: '0' }}
                    error={!!errors.valorInicial}
                    helperText={errors.valorInicial?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="fechaAdquisicion"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fecha adquisición *"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.fechaAdquisicion}
                    helperText={errors.fechaAdquisicion?.message}
                  />
                )}
              />
            </Grid>

            {apiError && (
              <Grid size={12}>
                <Alert severity="error">{apiError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : mode === 'create' ? 'Crear activo' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
