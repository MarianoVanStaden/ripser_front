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
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { provisionApi } from '../../../../api/services/provisionApi';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import { balanceAnualApi } from '../../../../api/services/balanceAnualApi';
import type { CajaPesos, CajaAhorroDolares } from '../../../../types';

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const fmtNum = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    // Prellenar cotización desde dolarapi (editable; null si la API no responde).
    balanceAnualApi.getCotizacionDolar()
      .then((tc) => { if (tc != null) setValorDolar(String(tc)); })
      .catch(() => { /* fallback: campo vacío para tipear a mano */ });
  }, [open, reset]);

  const tcNum = parseFloat(valorDolar);
  const tcValido = !Number.isNaN(tcNum) && tcNum > 0;
  const equivalenteUsd = tcValido && montoPagadoValue > 0 ? montoPagadoValue / tcNum : 0;
  const incompleto = !origenPesosId || !destinoUsdId || !tcValido;

  const onSubmit = async (data: FormData) => {
    if (incompleto) {
      setApiError('Completá caja origen (pesos), caja destino (dólares) y una cotización válida.');
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      await provisionApi.registrarPago(tipoId, anio, mes, {
        montoPagado: data.montoPagado,
        cajaPesosId: Number(origenPesosId),
        cajaDestinoAhorroId: Number(destinoUsdId),
        valorDolar: tcNum,
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
                Transferencia de una caja en pesos a una caja en dólares (convertido por la cotización).
              </Typography>
            </Grid>

            <Grid size={12}>
              <Controller
                name="montoPagado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Monto a pagar ($) *"
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
                    : 'Se prellena con el dólar oficial (editable)'
                }
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
          <Button type="submit" variant="contained" color="success" disabled={saving || incompleto}>
            {saving ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
