import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
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
  cajas?: CajaPesos[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  sucursalId: string;
  metodoPago: string;
  esDefault: boolean;
}

const schema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  sucursalId: yup.string(),
  metodoPago: yup.string(),
  esDefault: yup.boolean(),
});

const CajaPesosFormDialog: React.FC<Props> = ({ open, mode, caja, cajas = [], onClose, onSaved }) => {
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
    defaultValues: { nombre: '', descripcion: '', sucursalId: '', metodoPago: '', esDefault: false },
  });

  useEffect(() => {
    if (open) {
      setApiError(null);
      if (mode === 'edit' && caja) {
        reset({
          nombre: caja.nombre,
          descripcion: caja.descripcion ?? '',
          sucursalId: caja.sucursalId != null ? String(caja.sucursalId) : '',
          metodoPago: caja.metodoPago ?? '',
          esDefault: caja.esDefault ?? false,
        });
      } else {
        reset({ nombre: '', descripcion: '', sucursalId: '', metodoPago: '', esDefault: false });
      }
    }
  }, [open, mode, caja, reset]);

  const mpWatch = watch('metodoPago');
  const esDefaultWatch = watch('esDefault');
  const sinMetodo = !mpWatch || mpWatch === '';

  const cajaConflicto = (!sinMetodo && esDefaultWatch)
    ? cajas.find(
        (c) => c.metodoPago === mpWatch && c.esDefault && c.id !== caja?.id
      ) ?? null
    : null;

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      const dto = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        sucursalId: data.sucursalId ? Number(data.sucursalId) : undefined,
        metodoPago:
          data.metodoPago && data.metodoPago !== ''
            ? (data.metodoPago as any)
            : null,
        esDefault: !!data.esDefault && !!data.metodoPago,
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
                name="metodoPago"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Método de pago asociado</InputLabel>
                    <Select {...field} label="Método de pago asociado">
                      <MenuItem value="">
                        <em>— Sin método asociado —</em>
                      </MenuItem>
                      {Object.values(MetodoPago).map((v) => (
                        <MenuItem key={v} value={v}>
                          {METODO_PAGO_LABELS[v]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              {sinMetodo && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Una caja sin método de pago no aparecerá como opción al registrar cobros/pagos.
                  Usala solo para movimientos manuales o transferencias internas.
                </Alert>
              )}
            </Grid>
            <Grid size={12}>
              <Controller
                name="esDefault"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={sinMetodo}
                      />
                    }
                    label="Marcar como caja predeterminada para este método de pago"
                  />
                )}
              />
              {cajaConflicto && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  La caja <strong>"{cajaConflicto.nombre}"</strong> ya es la predeterminada
                  para este método de pago. Editá esa caja primero y desactivá su opción
                  de predeterminada antes de asignársela a esta.
                </Alert>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !!cajaConflicto}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CajaPesosFormDialog;
