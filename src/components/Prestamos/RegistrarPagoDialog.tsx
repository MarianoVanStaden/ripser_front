import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, Box, Typography, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  Paper,
} from '@mui/material';
import { Payment } from '@mui/icons-material';
import { cuotaPrestamoApi } from '../../api/services/cuotaPrestamoApi';
import { clientApi } from '../../api/services/clientApi';
import { bancoApi } from '../../api/services/bancoApi';
import type { Banco } from '../../types';
import type { CuotaPrestamoDTO, MetodoPago, ChequeCobroData } from '../../types/prestamo.types';
import { METODO_PAGO_LABELS } from '../../types/prestamo.types';
import { metodoPagoRequiereCaja, type CajaRef } from '../../types/caja.types';
import { CajaSelector } from '../common/CajaSelector';
import { formatPrice } from '../../utils/priceCalculations';
import dayjs from 'dayjs';

// Exclude FINANCIACION_PROPIA from cuota payment selector
const METODOS_PAGO_CUOTA = (Object.keys(METODO_PAGO_LABELS) as MetodoPago[]).filter(
  k => k !== 'FINANCIACION_PROPIA'
);

// Methods that require saldo a favor validation
const METODOS_CON_VALIDACION_SALDO: MetodoPago[] = ['CUENTA_CORRIENTE'];

interface RegistrarPagoDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (changedCuotas: CuotaPrestamoDTO[]) => void;
  cuota: CuotaPrestamoDTO | null;
  clienteId: number;
  prestamoId: number;
  allCuotas: CuotaPrestamoDTO[];
}

export const RegistrarPagoDialog: React.FC<RegistrarPagoDialogProps> = ({
  open, onClose, onSaved, cuota, clienteId, prestamoId, allCuotas,
}) => {
  const [montoPagado, setMontoPagado] = useState<number>(0);
  const [fechaPago, setFechaPago] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [cajaRef, setCajaRef] = useState<CajaRef | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saldoDisponible, setSaldoDisponible] = useState<number | null>(null);
  const [loadingSaldo, setLoadingSaldo] = useState(false);

  // Estado del formulario de cheque (solo visible cuando metodoPago === 'CHEQUE').
  const blankCheque = (): ChequeCobroData => ({
    numeroCheque: '',
    bancoId: 0,
    titular: '',
    cuitTitular: '',
    fechaEmision: dayjs().format('YYYY-MM-DD'),
    fechaCobro: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    numeroCuenta: '',
    cbu: '',
    esEcheq: false,
    observaciones: '',
  });
  const [chequeData, setChequeData] = useState<ChequeCobroData>(blankCheque());
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(false);

  useEffect(() => {
    if (open && cuota) {
      const saldoRestante = cuota.montoCuota - cuota.montoPagado;
      setMontoPagado(saldoRestante > 0 ? saldoRestante : cuota.montoCuota);
      setFechaPago(dayjs().format('YYYY-MM-DD'));
      setMetodoPago('EFECTIVO');
      setCajaRef(null);
      setChequeData(blankCheque());
      setError(null);
      setSaldoDisponible(null);
    }
  }, [open, cuota]);

  // Carga lazy de bancos — solo cuando el usuario efectivamente elige CHEQUE.
  useEffect(() => {
    if (metodoPago === 'CHEQUE' && bancos.length === 0 && !loadingBancos) {
      setLoadingBancos(true);
      bancoApi
        .getActivos()
        .then((data) => setBancos(data))
        .catch(() => setError('No se pudieron cargar los bancos'))
        .finally(() => setLoadingBancos(false));
    }
  }, [metodoPago, bancos.length, loadingBancos]);

  useEffect(() => {
    setError(null);
    if (METODOS_CON_VALIDACION_SALDO.includes(metodoPago) && clienteId) {
      setLoadingSaldo(true);
      // saldoActual = debitos - creditos: negative means client has credit (saldo a favor)
      clientApi.getById(clienteId)
        .then(cliente => setSaldoDisponible(-(cliente.saldoActual ?? 0)))
        .catch(() => setSaldoDisponible(null))
        .finally(() => setLoadingSaldo(false));
    } else {
      setSaldoDisponible(null);
    }
  }, [metodoPago, clienteId]);

  const saldoInsuficiente = METODOS_CON_VALIDACION_SALDO.includes(metodoPago)
    && saldoDisponible !== null
    && saldoDisponible < montoPagado;

  const requiereCaja = metodoPagoRequiereCaja(metodoPago);
  const cajaFaltante = requiereCaja && !cajaRef;

  // Validación de los datos del cheque (solo cuando aplica).
  const chequeInvalido = metodoPago === 'CHEQUE' && (
    !chequeData.numeroCheque.trim() ||
    !chequeData.bancoId ||
    !chequeData.titular.trim() ||
    !chequeData.fechaEmision ||
    !chequeData.fechaCobro ||
    dayjs(chequeData.fechaEmision).isAfter(dayjs(), 'day')
  );

  const handleSave = async () => {
    if (!cuota) return;
    if (montoPagado <= 0) { setError('El monto debe ser mayor a 0'); return; }
    if (saldoInsuficiente) {
      setError(`Saldo insuficiente. Disponible: ${formatPrice(saldoDisponible!)}`);
      return;
    }
    if (cajaFaltante) {
      setError('Seleccioná la caja donde ingresa el pago.');
      return;
    }
    if (chequeInvalido) {
      setError('Completá los datos obligatorios del cheque: número, banco, titular, fechas.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await cuotaPrestamoApi.registrarPago({
        cuotaId: cuota.id,
        montoPagado,
        fechaPago,
        metodoPago,
        cajaPesosId: cajaRef?.tipo === 'PESOS' ? cajaRef.id : null,
        cajaAhorroId: cajaRef?.tipo === 'AHORRO' ? cajaRef.id : null,
        ...(metodoPago === 'CHEQUE' && {
          cheque: {
            numeroCheque: chequeData.numeroCheque.trim(),
            bancoId: chequeData.bancoId,
            titular: chequeData.titular.trim(),
            cuitTitular: chequeData.cuitTitular?.trim() || undefined,
            fechaEmision: chequeData.fechaEmision,
            fechaCobro: chequeData.fechaCobro,
            numeroCuenta: chequeData.numeroCuenta?.trim() || undefined,
            cbu: chequeData.cbu?.trim() || undefined,
            esEcheq: !!chequeData.esEcheq,
            observaciones: chequeData.observaciones?.trim() || undefined,
          },
        }),
      });

      // Task 2: refetch cuotas to detect cascade changes
      const newCuotas = await cuotaPrestamoApi.getByPrestamo(prestamoId);
      const changed = newCuotas.filter(c => {
        const prev = allCuotas.find(p => p.id === c.id);
        return prev && prev.estado !== c.estado;
      });

      onSaved(changed);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  if (!cuota) return null;

  const saldoRestante = cuota.montoCuota - cuota.montoPagado;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Pago - Cuota N.{cuota.numeroCuota}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Monto Cuota</Typography>
                <Typography variant="body2" fontWeight="medium">{formatPrice(cuota.montoCuota)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Ya Pagado</Typography>
                <Typography variant="body2" fontWeight="medium">{formatPrice(cuota.montoPagado)}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Saldo Restante</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {formatPrice(saldoRestante)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto a Pagar"
                type="number"
                required
                value={montoPagado || ''}
                onChange={(e) => setMontoPagado(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Pago"
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={metodoPago}
                  label="Método de Pago"
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                >
                  {METODOS_PAGO_CUOTA.map(key => (
                    <MenuItem key={key} value={key}>{METODO_PAGO_LABELS[key]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {requiereCaja && (
              <Grid item xs={12}>
                <CajaSelector
                  metodoPago={metodoPago}
                  value={cajaRef}
                  onChange={setCajaRef}
                  direccion="ingreso"
                />
              </Grid>
            )}
            {METODOS_CON_VALIDACION_SALDO.includes(metodoPago) && (
              <Grid item xs={12}>
                {loadingSaldo ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">Consultando saldo...</Typography>
                  </Box>
                ) : (
                  <Alert severity={saldoInsuficiente ? 'error' : 'info'}>
                    {saldoDisponible !== null
                      ? <>Saldo a favor disponible: <strong>{formatPrice(saldoDisponible)}</strong></>
                      : 'No se pudo obtener el saldo disponible'}
                    {saldoInsuficiente && ` — insuficiente para cubrir ${formatPrice(montoPagado)}`}
                  </Alert>
                )}
              </Grid>
            )}

            {metodoPago === 'CHEQUE' && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Datos del cheque recibido
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth required
                        label="Número de cheque"
                        value={chequeData.numeroCheque}
                        onChange={(e) => setChequeData({ ...chequeData, numeroCheque: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Banco</InputLabel>
                        <Select
                          value={chequeData.bancoId || ''}
                          label="Banco"
                          onChange={(e) => setChequeData({ ...chequeData, bancoId: Number(e.target.value) })}
                          disabled={loadingBancos}
                        >
                          {bancos.map(b => (
                            <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth required
                        label="Titular"
                        value={chequeData.titular}
                        onChange={(e) => setChequeData({ ...chequeData, titular: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="CUIT titular"
                        value={chequeData.cuitTitular}
                        onChange={(e) => setChequeData({ ...chequeData, cuitTitular: e.target.value })}
                        placeholder="20-12345678-9"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth required
                        label="Fecha de emisión"
                        type="date"
                        value={chequeData.fechaEmision}
                        onChange={(e) => setChequeData({ ...chequeData, fechaEmision: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ max: dayjs().format('YYYY-MM-DD') }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth required
                        label="Fecha de cobro"
                        type="date"
                        value={chequeData.fechaCobro}
                        onChange={(e) => setChequeData({ ...chequeData, fechaCobro: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Número de cuenta"
                        value={chequeData.numeroCuenta}
                        onChange={(e) => setChequeData({ ...chequeData, numeroCuenta: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="CBU (22 dígitos)"
                        value={chequeData.cbu}
                        onChange={(e) => setChequeData({ ...chequeData, cbu: e.target.value })}
                        inputProps={{ maxLength: 22 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!chequeData.esEcheq}
                            onChange={(e) => setChequeData({ ...chequeData, esEcheq: e.target.checked })}
                          />
                        }
                        label="Es eCheq"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth multiline rows={2}
                        label="Observaciones"
                        value={chequeData.observaciones}
                        onChange={(e) => setChequeData({ ...chequeData, observaciones: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        El monto del cheque será {formatPrice(montoPagado)} — lo toma del monto a pagar.
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || saldoInsuficiente || loadingSaldo || cajaFaltante || chequeInvalido}
          startIcon={saving ? <CircularProgress size={20} /> : <Payment />}
        >
          Registrar Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};
