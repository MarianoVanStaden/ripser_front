import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type { CajaPesos } from '../../../../types';
import { MetodoPago, METODO_PAGO_LABELS } from '../../../../types/prestamo.types';
import { extractError } from '../../CajasAhorro/utils';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  caja?: CajaPesos | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  sucursalId: string;
  metodoPagoDefault: string;
}

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  sucursalId: yup.string(),
  metodoPagoDefault: yup.string(),
});

const CajaPesosFormDialog: React.FC<Props> = ({ open, mode, caja, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: { nombre: '', descripcion: '', sucursalId: '', metodoPagoDefault: '' },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (mode === 'edit' && caja) {
        reset({
          nombre: caja.nombre,
          descripcion: caja.descripcion ?? '',
          sucursalId: caja.sucursalId != null ? String(caja.sucursalId) : '',
          metodoPagoDefault: caja.metodoPagoDefault ?? '',
        });
      } else {
        reset({ nombre: '', descripcion: '', sucursalId: '', metodoPagoDefault: '' });
      }
    }
  }, [open, mode, caja, reset]);

  const mpWatch = watch('metodoPagoDefault');
  const showNoReportarWarning = mode === 'create' && (!mpWatch || mpWatch === '');

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      const dto = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        sucursalId: data.sucursalId ? Number(data.sucursalId) : undefined,
        metodoPagoDefault:
          data.metodoPagoDefault && data.metodoPagoDefault !== ''
            ? (data.metodoPagoDefault as any)
            : null,
      };
      if (mode === 'edit' && caja) {
        await cajasPesosApi.update(caja.id, dto);
      } else {
        await cajasPesosApi.create(dto);
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
      <DialogTitle>
        {mode === 'edit' ? 'Editar caja en pesos' : 'Nueva caja en pesos'}
      </DialogTitle>
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
                    placeholder="Caja efectivo / Mercado Pago / Banco Galicia"
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
            <Grid size={12}>
              <Controller
                name="metodoPagoDefault"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Método de pago para reportes de Flujo de Caja</InputLabel>
                    <Select
                      {...field}
                      label="Método de pago para reportes de Flujo de Caja"
                    >
                      <MenuItem value="">
                        <em>— No reportar en Flujo de Caja legacy —</em>
                      </MenuItem>
                      {Object.values(MetodoPago).map((v) => (
                        <MenuItem key={v} value={v}>
                          {METODO_PAGO_LABELS[v]}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, ml: 1.5 }}
                    >
                      Al transferir o mover dinero, se genera un MovimientoExtra
                      con este método. Si lo dejás vacío, la caja no aparecerá en
                      el reporte legacy de Flujo de Caja — pero sus movimientos
                      reales siguen registrándose normalmente.
                    </Typography>
                  </FormControl>
                )}
              />
              {showNoReportarWarning && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Sin método de pago configurado, esta caja no aparecerá en el reporte
                  legacy de Flujo de Caja. Podés asignarlo ahora o más tarde.
                </Alert>
              )}
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

export default CajaPesosFormDialog;
