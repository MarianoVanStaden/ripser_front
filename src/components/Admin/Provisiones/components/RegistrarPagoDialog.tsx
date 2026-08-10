import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid2 as Grid,
  Alert,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { provisionApi } from '../../../../api/services/provisionApi';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import { MetodoPago, METODO_PAGO_LABELS, type MetodoPago as MetodoPagoType } from '../../../../types/prestamo.types';
import { metodoPagoRequiereCaja, type CajaRef } from '../../../../types/caja.types';
import type { CajaPesos, CajaAhorroDolares } from '../../../../types';
import { CajaSelector } from '../../../common/CajaSelector';

const fmtNum = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const schema = yup.object({
  montoPagado: yup
    .number()
    .typeError('Ingrese un monto válido')
    .required('El monto es obligatorio')
    .min(0, 'Debe ser ≥ 0'),
});

type FormData = { montoPagado: number };

interface Props {
  open: boolean;
  tipoId: number;
  tipoNombre: string;
  anio: number;
  mes: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function RegistrarPagoDialog({ open, tipoId, tipoNombre, anio, mes, onClose, onSaved }: Props) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [metodoPago, setMetodoPago] = useState<MetodoPagoType>('EFECTIVO');
  const [cajaRef, setCajaRef] = useState<CajaRef | null>(null);

  // Modo conversión pesos→dólares (mismo sistema que "Ejecutar amortización").
  const [convertir, setConvertir] = useState(false);
  const [cajasPesos, setCajasPesos] = useState<CajaPesos[]>([]);
  const [cajasUsd, setCajasUsd] = useState<CajaAhorroDolares[]>([]);
  const [origenPesosId, setOrigenPesosId] = useState('');
  const [destinoUsdId, setDestinoUsdId] = useState('');
  const [valorDolar, setValorDolar] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: { montoPagado: 0 },
  });

  const montoPagadoValue = watch('montoPagado');

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    setMetodoPago('EFECTIVO');
    setCajaRef(null);
    setConvertir(false);
    setOrigenPesosId('');
    setDestinoUsdId('');
    setValorDolar('');
    reset({ montoPagado: 0 });

    Promise.all([cajasPesosApi.getAll(), cajasAhorroApi.getAll()])
      .then(([pesos, usd]) => {
        setCajasPesos(pesos.filter((c) => c.estado === 'ACTIVA'));
        setCajasUsd(usd.filter((c) => c.estado === 'ACTIVA'));
      })
      .catch(() => {
        setCajasPesos([]);
        setCajasUsd([]);
      });
  }, [open, reset]);

  const requiereCaja = metodoPagoRequiereCaja(metodoPago);
  const cajaFaltante = !convertir && requiereCaja && !cajaRef;

  const tcNum = parseFloat(valorDolar);
  const tcValido = !Number.isNaN(tcNum) && tcNum > 0;
  const equivalenteUsd = tcValido && montoPagadoValue > 0 ? montoPagadoValue / tcNum : 0;
  const conversionIncompleta = convertir && (!origenPesosId || !destinoUsdId || !tcValido);

  const onSubmit = async (data: FormData) => {
    if (cajaFaltante) {
      setApiError('Seleccioná la caja de donde sale el pago.');
      return;
    }
    if (conversionIncompleta) {
      setApiError('Completá caja origen (pesos), caja destino (dólares) y una cotización válida.');
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      await provisionApi.registrarPago(tipoId, anio, mes, convertir
        ? {
            montoPagado: data.montoPagado,
            metodoPago,
            cajaPesosId: Number(origenPesosId),
            cajaAhorroId: null,
            cajaDestinoAhorroId: Number(destinoUsdId),
            valorDolar: tcNum,
          }
        : {
            montoPagado: data.montoPagado,
            metodoPago,
            cajaPesosId: cajaRef?.tipo === 'PESOS' ? cajaRef.id : null,
            cajaAhorroId: cajaRef?.tipo === 'AHORRO' ? cajaRef.id : null,
          });
      onSaved();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 404) {
        setApiError('Primero registre la provisión del mes antes de registrar un pago.');
      } else {
        setApiError(msg ?? 'Error al registrar el pago');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>
        Registrar pago — {tipoNombre} {MONTH_NAMES[mes]} {anio}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Tipo: <strong>{tipoNombre}</strong> · Período: <strong>{MONTH_NAMES[mes]} {anio}</strong>
              </Typography>
            </Grid>

            <Grid size={12}>
              <Controller
                name="montoPagado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Monto pagado ($) *"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: '0.01', min: '0' }}
                    error={!!errors.montoPagado}
                    helperText={errors.montoPagado?.message}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    autoFocus
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Método de pago</InputLabel>
                <Select
                  value={metodoPago}
                  label="Método de pago"
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPagoType)}
                >
                  {Object.values(MetodoPago)
                    .filter((m) =>
                      m !== 'CUENTA_CORRIENTE' &&
                      m !== 'FINANCIACION_PROPIA' &&
                      // 'TRANSFERENCIA' y 'FINANCIAMIENTO' son aliases legacy:
                      // el backend sólo acepta TRANSFERENCIA_BANCARIA y FINANCIACION_PROPIA
                      // (ver com.ripser_back.enums.MetodoPago). Mostrarlos rompe el POST.
                      m !== 'TRANSFERENCIA' &&
                      m !== 'FINANCIAMIENTO'
                    )
                    .map((m) => (
                      <MenuItem key={m} value={m}>
                        {METODO_PAGO_LABELS[m]}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={convertir}
                    onChange={(e) => setConvertir(e.target.checked)}
                    disabled={saving}
                  />
                }
                label="Pagar convirtiendo a dólares"
              />
            </Grid>

            {!convertir && requiereCaja && (
              <Grid size={12}>
                <CajaSelector
                  metodoPago={metodoPago}
                  value={cajaRef}
                  onChange={setCajaRef}
                  direccion="egreso"
                />
              </Grid>
            )}

            {convertir && (
              <>
                <Grid size={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Caja origen (pesos)</InputLabel>
                    <Select
                      value={origenPesosId}
                      label="Caja origen (pesos)"
                      onChange={(e) => setOrigenPesosId(String(e.target.value))}
                      disabled={saving}
                    >
                      <MenuItem value="">— Seleccionar —</MenuItem>
                      {cajasPesos.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.nombre} (saldo $ {fmtNum(c.saldoActual)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Caja destino (dólares)</InputLabel>
                    <Select
                      value={destinoUsdId}
                      label="Caja destino (dólares)"
                      onChange={(e) => setDestinoUsdId(String(e.target.value))}
                      disabled={saving}
                    >
                      <MenuItem value="">— Seleccionar —</MenuItem>
                      {cajasUsd.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.nombre} (saldo USD {fmtNum(c.saldoActual)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={12}>
                  <TextField
                    label="Cotización (valor dólar) *"
                    type="number"
                    fullWidth
                    size="small"
                    value={valorDolar}
                    onChange={(e) => setValorDolar(e.target.value)}
                    inputProps={{ step: '0.01', min: '0.01' }}
                    disabled={saving}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    helperText={
                      equivalenteUsd > 0
                        ? `≈ USD ${fmtNum(equivalenteUsd)} @ TC $ ${fmtNum(tcNum)}`
                        : 'Ingresá la cotización para convertir el monto a dólares'
                    }
                  />
                </Grid>
              </>
            )}

            {apiError && (
              <Grid size={12}>
                <Alert severity="error">{apiError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" color="success" disabled={saving || cajaFaltante || conversionIncompleta}>
            {saving ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
