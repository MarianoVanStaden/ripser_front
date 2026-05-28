import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Alert, Box, Grid, TextField, Typography, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Paper,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { pagoInformadoApi } from '../../../api/services/pagoInformadoApi';
import { bancoApi } from '../../../api/services/bancoApi';
import type { Banco } from '../../../types';
import type { PagoInformadoDTO, ChequeCobroData } from '../../../types/prestamo.types';
import { metodoPagoRequiereCaja, type CajaRef } from '../../../types/caja.types';
import { CajaSelector } from '../../common/CajaSelector';
import { formatPrice } from '../../../utils/priceCalculations';
import dayjs from 'dayjs';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirmado: () => void;
  pago: PagoInformadoDTO | null;
}

export const ConfirmarPagoInformadoDialog: React.FC<Props> = ({
  open, onClose, onConfirmado, pago,
}) => {
  const [montoConfirmado, setMontoConfirmado] = useState<number>(0);
  const [cajaRef, setCajaRef] = useState<CajaRef | null>(null);
  const [chequeData, setChequeData] = useState<ChequeCobroData>(blankCheque());
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loadingBancos, setLoadingBancos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function blankCheque(): ChequeCobroData {
    return {
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
    };
  }

  useEffect(() => {
    if (open && pago) {
      setMontoConfirmado(pago.montoInformado);
      setCajaRef(null);
      setChequeData(blankCheque());
      setError(null);
    }
  }, [open, pago]);

  useEffect(() => {
    if (open && pago?.metodoPago === 'CHEQUE' && bancos.length === 0 && !loadingBancos) {
      setLoadingBancos(true);
      bancoApi.getActivos()
        .then(setBancos)
        .catch(() => setError('No se pudieron cargar los bancos'))
        .finally(() => setLoadingBancos(false));
    }
  }, [open, pago?.metodoPago, bancos.length, loadingBancos]);

  if (!pago) return null;

  const requiereCaja = metodoPagoRequiereCaja(pago.metodoPago);
  const cajaFaltante = requiereCaja && !cajaRef;
  const chequeInvalido = pago.metodoPago === 'CHEQUE' && (
    !chequeData.numeroCheque.trim() ||
    !chequeData.bancoId ||
    !chequeData.titular.trim() ||
    !chequeData.fechaEmision ||
    !chequeData.fechaCobro
  );

  const handleConfirm = async () => {
    if (montoConfirmado <= 0) {
      setError('El monto confirmado debe ser mayor a 0.');
      return;
    }
    if (cajaFaltante) {
      setError('Seleccioná la caja donde ingresa el pago.');
      return;
    }
    if (chequeInvalido) {
      setError('Completá los datos obligatorios del cheque.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await pagoInformadoApi.confirmar(pago.id, {
        montoConfirmado,
        cajaPesosId: cajaRef?.tipo === 'PESOS' ? cajaRef.id : null,
        cajaAhorroId: cajaRef?.tipo === 'AHORRO' ? cajaRef.id : null,
        ...(pago.metodoPago === 'CHEQUE' && {
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
      onConfirmado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al confirmar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar Pago Informado</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Alert severity="info" sx={{ mb: 2 }}>
            Cobranzas ({pago.usuarioCobranzasNombre}) informó este pago. Al confirmar se ingresa formalmente
            a caja y se aplica al préstamo.
          </Alert>
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Cliente</Typography>
                <Typography variant="body2" fontWeight="medium">{pago.clienteNombre}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Préstamo / Cuota</Typography>
                <Typography variant="body2" fontWeight="medium">#{pago.prestamoId} — Cuota {pago.numeroCuota}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Comprobante</Typography>
                <Typography variant="body2" fontWeight="medium">{pago.numeroComprobante}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Método</Typography>
                <Typography variant="body2" fontWeight="medium">{pago.metodoPago}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Fecha informada</Typography>
                <Typography variant="body2" fontWeight="medium">{pago.fechaPagoInformada}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Monto informado</Typography>
                <Typography variant="body2" fontWeight="bold">{formatPrice(pago.montoInformado)}</Typography>
              </Grid>
              {pago.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Observaciones de cobranzas</Typography>
                  <Typography variant="body2">{pago.observaciones}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required type="number"
                label="Monto que ingresa a caja"
                value={montoConfirmado || ''}
                onChange={(e) => setMontoConfirmado(parseFloat(e.target.value) || 0)}
                helperText="Editá si el monto real difiere de lo informado"
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            {requiereCaja && (
              <Grid item xs={12}>
                <CajaSelector
                  metodoPago={pago.metodoPago}
                  value={cajaRef}
                  onChange={setCajaRef}
                  direccion="ingreso"
                />
              </Grid>
            )}

            {pago.metodoPago === 'CHEQUE' && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Datos del cheque</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth required label="Número de cheque"
                        value={chequeData.numeroCheque}
                        onChange={(e) => setChequeData({ ...chequeData, numeroCheque: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Banco</InputLabel>
                        <Select value={chequeData.bancoId || ''} label="Banco" disabled={loadingBancos}
                          onChange={(e) => setChequeData({ ...chequeData, bancoId: Number(e.target.value) })}>
                          {bancos.map(b => <MenuItem key={b.id} value={b.id}>{b.nombre}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth required label="Titular"
                        value={chequeData.titular}
                        onChange={(e) => setChequeData({ ...chequeData, titular: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="CUIT titular"
                        value={chequeData.cuitTitular}
                        onChange={(e) => setChequeData({ ...chequeData, cuitTitular: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth required type="date" label="Fecha emisión"
                        InputLabelProps={{ shrink: true }}
                        value={chequeData.fechaEmision}
                        onChange={(e) => setChequeData({ ...chequeData, fechaEmision: e.target.value })} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth required type="date" label="Fecha cobro"
                        InputLabelProps={{ shrink: true }}
                        value={chequeData.fechaCobro}
                        onChange={(e) => setChequeData({ ...chequeData, fechaCobro: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Checkbox checked={!!chequeData.esEcheq}
                          onChange={(e) => setChequeData({ ...chequeData, esEcheq: e.target.checked })} />}
                        label="Es eCheq"
                      />
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
        <Button onClick={handleConfirm} color="success" variant="contained"
          disabled={saving || cajaFaltante || chequeInvalido}
          startIcon={saving ? <CircularProgress size={18} /> : <CheckCircle />}
        >
          Confirmar Ingreso
        </Button>
      </DialogActions>
    </Dialog>
  );
};
