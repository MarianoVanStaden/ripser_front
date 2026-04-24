import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
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
import dayjs from 'dayjs';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import { liquidacionesTarjetaApi } from '../../../../api/services/liquidacionesTarjetaApi';
import type { CajaPesos } from '../../../../types';
import { formatPrice } from '../../../../utils/priceCalculations';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type MetodoTarjeta = 'TARJETA_CREDITO' | 'TARJETA_DEBITO';

const NuevaLiquidacionDialog: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const [cajas, setCajas] = useState<CajaPesos[]>([]);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cajaOrigenId, setCajaOrigenId] = useState<number | ''>('');
  const [cajaDestinoId, setCajaDestinoId] = useState<number | ''>('');
  const [fechaLiquidacion, setFechaLiquidacion] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [montoBruto, setMontoBruto] = useState<number>(0);
  const [comision, setComision] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    setCajaOrigenId('');
    setCajaDestinoId('');
    setFechaLiquidacion(dayjs().format('YYYY-MM-DD'));
    setMontoBruto(0);
    setComision(0);
    setObservaciones('');

    setLoadingCajas(true);
    cajasPesosApi
      .getAll()
      .then((data) => setCajas(data))
      .catch(() => setApiError('No se pudieron cargar las cajas'))
      .finally(() => setLoadingCajas(false));
  }, [open]);

  // Modelo N:M: una caja puede aceptar varios métodos. Filtramos por cualquier
  // caja que acepte el método buscado (sea o no default).
  const aceptaMetodo = (c: CajaPesos, metodo: MetodoTarjeta | 'TRANSFERENCIA_BANCARIA') =>
    c.metodosAceptados?.some((m) => m.metodoPago === metodo) ?? false;

  const cajasOrigen = useMemo(
    () =>
      cajas.filter(
        (c) =>
          c.estado === 'ACTIVA' &&
          (aceptaMetodo(c, 'TARJETA_CREDITO') || aceptaMetodo(c, 'TARJETA_DEBITO')),
      ),
    [cajas],
  );

  const cajasDestino = useMemo(
    () => cajas.filter((c) => c.estado === 'ACTIVA' && aceptaMetodo(c, 'TRANSFERENCIA_BANCARIA')),
    [cajas],
  );

  const cajaOrigen = cajas.find((c) => c.id === cajaOrigenId) ?? null;
  const cajaDestino = cajas.find((c) => c.id === cajaDestinoId) ?? null;

  const montoNeto = Number((montoBruto - comision).toFixed(2));

  const errores: string[] = [];
  if (cajaOrigenId === '' || !cajaOrigen) errores.push('Elegí la caja origen (tarjeta)');
  if (cajaDestinoId === '' || !cajaDestino) errores.push('Elegí la caja destino (banco)');
  if (cajaOrigenId !== '' && cajaOrigenId === cajaDestinoId)
    errores.push('La caja origen y destino no pueden ser la misma');
  if (montoBruto <= 0) errores.push('El monto bruto debe ser positivo');
  if (comision < 0) errores.push('La comisión no puede ser negativa');
  if (comision > montoBruto) errores.push('La comisión no puede superar al bruto');

  const puedeGuardar = errores.length === 0 && !saving;

  const handleSubmit = async () => {
    if (!puedeGuardar) return;
    setSaving(true);
    setApiError(null);
    try {
      await liquidacionesTarjetaApi.liquidar({
        cajaOrigenId: cajaOrigenId as number,
        cajaDestinoId: cajaDestinoId as number,
        fechaLiquidacion,
        montoBruto,
        comision,
        observaciones: observaciones || undefined,
      });
      onSaved();
    } catch (err: any) {
      setApiError(err?.response?.data?.message ?? err?.message ?? 'Error al liquidar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva liquidación de tarjeta</DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        {loadingCajas ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Caja origen (tarjeta)</InputLabel>
                <Select
                  value={cajaOrigenId}
                  label="Caja origen (tarjeta)"
                  onChange={(e) =>
                    setCajaOrigenId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  {cajasOrigen.length === 0 && (
                    <MenuItem disabled value="">
                      <em>No hay cajas tarjeta activas</em>
                    </MenuItem>
                  )}
                  {cajasOrigen.map((c) => {
                    // Mostrar el método principal de tarjeta que acepta (puede aceptar ambos).
                    const metodoMostrar: MetodoTarjeta = aceptaMetodo(c, 'TARJETA_CREDITO')
                      ? 'TARJETA_CREDITO' : 'TARJETA_DEBITO';
                    return (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre} ({metodoMostrar}) · saldo {formatPrice(c.saldoActual)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <FormControl fullWidth required>
                <InputLabel>Caja destino (banco)</InputLabel>
                <Select
                  value={cajaDestinoId}
                  label="Caja destino (banco)"
                  onChange={(e) =>
                    setCajaDestinoId(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  {cajasDestino.length === 0 && (
                    <MenuItem disabled value="">
                      <em>No hay cajas TRANSFERENCIA_BANCARIA activas</em>
                    </MenuItem>
                  )}
                  {cajasDestino.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre} · saldo {formatPrice(c.saldoActual)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={6}>
              <TextField
                fullWidth
                label="Fecha de liquidación"
                type="date"
                value={fechaLiquidacion}
                onChange={(e) => setFechaLiquidacion(e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid size={6}>
              <TextField
                fullWidth
                label="Monto bruto"
                type="number"
                value={montoBruto || ''}
                onChange={(e) => setMontoBruto(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.01, step: 0.01 }}
                required
              />
            </Grid>

            <Grid size={6}>
              <TextField
                fullWidth
                label="Comisión"
                type="number"
                value={comision || ''}
                onChange={(e) => setComision(parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
                helperText="Cargo del banco/procesador"
              />
            </Grid>

            <Grid size={6}>
              <TextField
                fullWidth
                label="Neto a depositar"
                value={formatPrice(Math.max(0, montoNeto))}
                InputProps={{ readOnly: true }}
                helperText="Bruto − Comisión"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </Grid>

            {errores.length > 0 && (
              <Grid size={12}>
                <Alert severity="info">
                  {errores.map((er) => (
                    <Typography key={er} variant="body2">
                      • {er}
                    </Typography>
                  ))}
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!puedeGuardar}>
          {saving ? <CircularProgress size={20} /> : 'Liquidar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuevaLiquidacionDialog;
