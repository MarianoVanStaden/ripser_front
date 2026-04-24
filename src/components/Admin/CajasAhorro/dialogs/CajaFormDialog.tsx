import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2 as Grid,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import type { CajaAhorroDolares, CajaMetodoPagoConfig } from '../../../../types';
import { MetodoPago, METODO_PAGO_LABELS } from '../../../../types/prestamo.types';
import { MONEDAS_POR_METODO_PAGO } from '../../../../types/caja.types';
import { extractError } from '../utils';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  caja?: CajaAhorroDolares | null;
  cajas?: CajaAhorroDolares[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  sucursalId: string;
  metodos: Record<MetodoPago, { acepta: boolean; esDefault: boolean }>;
}

// Solo los métodos que aceptan USD pueden marcarse en una caja de ahorro.
// Se deriva dinámicamente de MONEDAS_POR_METODO_PAGO para no repetir la regla.
const METODOS_ORDEN_USD: MetodoPago[] = (Object.values(MetodoPago) as MetodoPago[])
  .filter((v) => MONEDAS_POR_METODO_PAGO[v].includes('USD'));

const emptyMatrix = (): FormData['metodos'] =>
  (Object.values(MetodoPago) as MetodoPago[]).reduce((acc, m) => {
    acc[m] = { acepta: false, esDefault: false };
    return acc;
  }, {} as FormData['metodos']);

const schema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  sucursalId: yup.string(),
});

const CajaFormDialog: React.FC<Props> = ({ open, mode, caja, cajas = [], onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } =
    useForm<FormData>({
      resolver: yupResolver(schema) as any,
      defaultValues: {
        nombre: '',
        descripcion: '',
        sucursalId: '',
        metodos: emptyMatrix(),
      },
    });

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    const base = emptyMatrix();
    if (mode === 'edit' && caja) {
      (caja.metodosAceptados ?? []).forEach((cfg) => {
        base[cfg.metodoPago] = { acepta: true, esDefault: cfg.esDefault };
      });
    }
    reset({
      nombre: mode === 'edit' && caja ? caja.nombre : '',
      descripcion: mode === 'edit' && caja ? (caja.descripcion ?? '') : '',
      sucursalId: mode === 'edit' && caja && caja.sucursalId != null ? String(caja.sucursalId) : '',
      metodos: base,
    });
  }, [open, mode, caja, reset]);

  const metodosWatch = watch('metodos');

  const conflictosDefault = useMemo(() => {
    const list: Array<{ metodo: MetodoPago; otraCaja: string }> = [];
    if (!metodosWatch) return list;
    for (const m of METODOS_ORDEN_USD) {
      if (!metodosWatch[m]?.esDefault) continue;
      const otra = cajas.find(
        (c) =>
          c.id !== caja?.id &&
          c.metodosAceptados?.some((cfg) => cfg.metodoPago === m && cfg.esDefault),
      );
      if (otra) list.push({ metodo: m, otraCaja: otra.nombre });
    }
    return list;
  }, [metodosWatch, cajas, caja?.id]);

  const sinNingunMetodo = useMemo(
    () => !metodosWatch || !METODOS_ORDEN_USD.some((m) => metodosWatch[m]?.acepta),
    [metodosWatch],
  );

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      const metodosAceptados: CajaMetodoPagoConfig[] = METODOS_ORDEN_USD
        .filter((m) => data.metodos[m]?.acepta)
        .map((m) => ({ metodoPago: m, esDefault: !!data.metodos[m]?.esDefault }));

      const dto = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        sucursalId: data.sucursalId ? Number(data.sucursalId) : undefined,
        metodosAceptados,
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
                    rows={2}
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
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Métodos que esta caja acepta (USD)</Typography>
              <Typography variant="caption" color="text.secondary">
                Solo se listan los métodos que operan en dólares. Marcá "default" para
                definir esta caja como predeterminada del método.
              </Typography>
            </Grid>

            {METODOS_ORDEN_USD.map((m) => {
              const acepta = !!metodosWatch?.[m]?.acepta;
              const esDefault = !!metodosWatch?.[m]?.esDefault;
              return (
                <Grid size={12} key={m}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Checkbox
                      checked={acepta}
                      onChange={(e) => {
                        setValue(`metodos.${m}.acepta`, e.target.checked);
                        if (!e.target.checked) setValue(`metodos.${m}.esDefault`, false);
                      }}
                    />
                    <Typography sx={{ flex: 1 }}>{METODO_PAGO_LABELS[m]}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Radio
                        size="small"
                        checked={esDefault}
                        disabled={!acepta}
                        onClick={() =>
                          setValue(`metodos.${m}.esDefault`, !esDefault)
                        }
                      />
                      <Typography variant="caption" color="text.secondary">default</Typography>
                    </Stack>
                  </Stack>
                </Grid>
              );
            })}

            {sinNingunMetodo && (
              <Grid size={12}>
                <Alert severity="info">
                  Una caja USD sin métodos marcados solo se usa para movimientos manuales
                  o conversiones desde amortizaciones.
                </Alert>
              </Grid>
            )}

            {conflictosDefault.length > 0 && (
              <Grid size={12}>
                <Alert severity="warning">
                  Conflictos de default:
                  {conflictosDefault.map((c) => (
                    <div key={c.metodo}>
                      • <strong>{METODO_PAGO_LABELS[c.metodo]}</strong> ya es default en "{c.otraCaja}"
                    </div>
                  ))}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CajaFormDialog;
