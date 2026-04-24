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
  Tooltip,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type { CajaPesos, CajaMetodoPagoConfig } from '../../../../types';
import { MetodoPago, METODO_PAGO_LABELS } from '../../../../types/prestamo.types';
import { metodoPagoRequiereCaja } from '../../../../types/caja.types';
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
  /**
   * Matriz de métodos. Por cada método del enum, un flag "acepta" y otro
   * "esDefault". La UI mantiene esto como record plano para edición cómoda,
   * y en submit se convierte a {@code CajaMetodoPagoConfig[]}.
   */
  metodos: Record<MetodoPago, { acepta: boolean; esDefault: boolean }>;
}

const METODOS_ORDEN: MetodoPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA_BANCARIA',
  'MERCADO_PAGO',
  'TARJETA_CREDITO',
  'TARJETA_DEBITO',
  'CHEQUE',
  'CUENTA_CORRIENTE',
  'FINANCIACION_PROPIA',
];

const emptyMatrix = (): FormData['metodos'] =>
  METODOS_ORDEN.reduce((acc, m) => {
    acc[m] = { acepta: false, esDefault: false };
    return acc;
  }, {} as FormData['metodos']);

const schema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  descripcion: yup.string().max(500, 'Máximo 500 caracteres'),
  sucursalId: yup.string(),
});

const CajaPesosFormDialog: React.FC<Props> = ({ open, mode, caja, cajas = [], onClose, onSaved }) => {
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
    const metodosBase = emptyMatrix();
    if (mode === 'edit' && caja) {
      (caja.metodosAceptados ?? []).forEach((cfg) => {
        metodosBase[cfg.metodoPago] = { acepta: true, esDefault: cfg.esDefault };
      });
    }
    reset({
      nombre: mode === 'edit' && caja ? caja.nombre : '',
      descripcion: mode === 'edit' && caja ? (caja.descripcion ?? '') : '',
      sucursalId: mode === 'edit' && caja && caja.sucursalId != null ? String(caja.sucursalId) : '',
      metodos: metodosBase,
    });
  }, [open, mode, caja, reset]);

  const metodosWatch = watch('metodos');

  // Detectar conflictos de default contra otras cajas existentes.
  const conflictosDefault = useMemo(() => {
    const list: Array<{ metodo: MetodoPago; otraCaja: string }> = [];
    if (!metodosWatch) return list;
    for (const m of METODOS_ORDEN) {
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
    () => !metodosWatch || !METODOS_ORDEN.some((m) => metodosWatch[m]?.acepta),
    [metodosWatch],
  );

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setApiError(null);
    try {
      const metodosAceptados: CajaMetodoPagoConfig[] = METODOS_ORDEN
        .filter((m) => data.metodos[m]?.acepta)
        .map((m) => ({ metodoPago: m, esDefault: !!data.metodos[m]?.esDefault }));

      const dto = {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        sucursalId: data.sucursalId ? Number(data.sucursalId) : undefined,
        metodosAceptados,
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

  const tieneDefault = (m: MetodoPago) => !!metodosWatch?.[m]?.esDefault;
  const aplicaMetodo = (m: MetodoPago) => metodoPagoRequiereCaja(m);

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Editar caja en pesos' : 'Nueva caja en pesos'}</DialogTitle>
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
                    rows={2}
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
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Métodos que esta caja acepta</Typography>
              <Typography variant="caption" color="text.secondary">
                Marcá "default" en el método para el que esta caja será la predeterminada —
                una sola caja puede ser default por método en la empresa.
              </Typography>
            </Grid>

            {METODOS_ORDEN.map((m) => {
              const aplica = aplicaMetodo(m);
              const acepta = !!metodosWatch?.[m]?.acepta;
              const esDefault = tieneDefault(m);
              const row = (
                <Grid size={12} key={m}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Checkbox
                      checked={acepta}
                      disabled={!aplica}
                      onChange={(e) => {
                        setValue(`metodos.${m}.acepta`, e.target.checked);
                        if (!e.target.checked) {
                          setValue(`metodos.${m}.esDefault`, false);
                        }
                      }}
                    />
                    <Typography sx={{ flex: 1 }}>{METODO_PAGO_LABELS[m]}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Radio
                        size="small"
                        checked={esDefault}
                        disabled={!aplica || !acepta}
                        onClick={() => {
                          // Toggle independiente (radio con comportamiento de switch por fila).
                          setValue(`metodos.${m}.esDefault`, !esDefault);
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">default</Typography>
                    </Stack>
                  </Stack>
                </Grid>
              );
              return !aplica ? (
                <Tooltip key={m} title="Este método no impacta caja (no-caja)">
                  <span>{row}</span>
                </Tooltip>
              ) : row;
            })}

            {sinNingunMetodo && (
              <Grid size={12}>
                <Alert severity="info">
                  Una caja sin métodos aceptados no aparecerá al registrar cobros/pagos.
                  Sirve solo para movimientos manuales o transferencias internas.
                </Alert>
              </Grid>
            )}

            {conflictosDefault.length > 0 && (
              <Grid size={12}>
                <Alert severity="warning">
                  Al guardar, el servidor rechazará los default en conflicto:
                  {conflictosDefault.map((c) => (
                    <div key={c.metodo}>
                      • <strong>{METODO_PAGO_LABELS[c.metodo]}</strong>: ya es default en "{c.otraCaja}"
                    </div>
                  ))}
                  Desmarcá el default en la otra caja primero.
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

export default CajaPesosFormDialog;
