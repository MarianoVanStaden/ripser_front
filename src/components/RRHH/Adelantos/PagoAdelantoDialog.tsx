// Pago de un adelanto distribuido entre N cajas en pesos (multi-cuenta).
// Cada renglón especifica qué caja paga qué monto. Al confirmar, el backend
// genera un MovimientoExtra (CategoriaGastoExtra.SUELDOS_SALARIOS) por cada
// renglón y marca el Adelanto como pagado. Las cajas pueden quedar en negativo.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { cajasPesosApi } from '../../../api/services/cajasPesosApi';
import { adelantoApi } from '../../../api/services/adelantoApi';
import type { Adelanto, CajaPesos } from '../../../types';
import type { MetodoPago } from '../../../types/prestamo.types';

interface Props {
  open: boolean;
  adelanto: Adelanto | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface PayRow {
  cajaPesosId: number | null;
  monto: number;
  metodoPago: MetodoPago | '';
  observaciones: string;
}

const metodosDeCaja = (caja: CajaPesos | undefined): MetodoPago[] => {
  if (!caja || !caja.metodosAceptados || caja.metodosAceptados.length === 0) {
    return ['EFECTIVO'];
  }
  return caja.metodosAceptados.map(m => m.metodoPago);
};

const metodoDefaultDeCaja = (caja: CajaPesos | undefined): MetodoPago => {
  if (!caja) return 'EFECTIVO';
  if (caja.metodoPagoPrincipal) return caja.metodoPagoPrincipal;
  return metodosDeCaja(caja)[0];
};

const nombreEmpleado = (a: Adelanto | null): string => {
  if (!a) return '';
  if (a.empleadoApellido || a.empleadoNombre) {
    return `${a.empleadoApellido ?? ''}, ${a.empleadoNombre ?? ''}`.replace(/^,\s*/, '').trim();
  }
  return `Empleado #${a.empleadoId}`;
};

const PagoAdelantoDialog: React.FC<Props> = ({ open, adelanto, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cajas, setCajas] = useState<CajaPesos[]>([]);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [fecha, setFecha] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [rows, setRows] = useState<PayRow[]>([]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setObservaciones('');
    setFecha(dayjs().format('YYYY-MM-DD'));
    setLoadingCajas(true);
    cajasPesosApi.getAll()
      .then(list => {
        const activas = (Array.isArray(list) ? list : []).filter(c => c.estado === 'ACTIVA');
        setCajas(activas);
        const cajaDefault = activas[0];
        setRows([{
          cajaPesosId: cajaDefault?.id ?? null,
          monto: Number(adelanto?.monto ?? 0),
          metodoPago: metodoDefaultDeCaja(cajaDefault),
          observaciones: '',
        }]);
      })
      .catch(() => setError('Error al cargar cajas en pesos'))
      .finally(() => setLoadingCajas(false));
  }, [open, adelanto]);

  const montoAdelanto = Number(adelanto?.monto ?? 0);

  const totalRows = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.monto) || 0), 0),
    [rows],
  );
  const diff = totalRows - montoAdelanto;

  const updateRow = (idx: number, patch: Partial<PayRow>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const addRow = () => {
    const faltante = Math.max(0, montoAdelanto - totalRows);
    const cajaDefault = cajas[0];
    setRows(prev => [...prev, {
      cajaPesosId: cajaDefault?.id ?? null,
      monto: faltante,
      metodoPago: metodoDefaultDeCaja(cajaDefault),
      observaciones: '',
    }]);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const ajustarAlMonto = (idx: number) => {
    const otros = rows.reduce((s, r, i) => (i === idx ? s : s + (Number(r.monto) || 0)), 0);
    const restante = Math.max(0, montoAdelanto - otros);
    updateRow(idx, { monto: restante });
  };

  const handlePagar = async () => {
    if (!adelanto) return;
    setError(null);

    const items = rows
      .filter(r => r.cajaPesosId && (Number(r.monto) || 0) > 0)
      .map(r => ({
        cajaPesosId: r.cajaPesosId as number,
        monto: Number(r.monto),
        metodoPago: r.metodoPago || undefined,
        observaciones: r.observaciones?.trim() || undefined,
      }));

    if (items.length === 0) {
      setError('Agregá al menos un renglón con caja y monto > 0');
      return;
    }
    if (!fecha) {
      setError('Indicá la fecha de pago');
      return;
    }

    try {
      setSubmitting(true);
      await adelantoApi.pagar(adelanto.id, {
        fecha,
        items,
        observaciones: observaciones?.trim() || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al registrar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <PaymentIcon />
          <Typography variant="h6" fontWeight={600}>
            Pagar adelanto{adelanto ? ` — ${nombreEmpleado(adelanto)}` : ''}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField
            size="small" type="date" label="Fecha de pago"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <Box flex={1}>
            <Typography variant="caption" color="textSecondary" display="block">Monto a pagar</Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">
              ${montoAdelanto.toLocaleString('es-AR')}
            </Typography>
            {adelanto?.periodo && (
              <Typography variant="caption" color="textSecondary">
                Período {dayjs(adelanto.periodo).format('MMMM YYYY')}
              </Typography>
            )}
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="textSecondary" display="block">Total ingresado</Typography>
            <Typography variant="h6" fontWeight={700} color={diff === 0 ? 'success.main' : diff > 0 ? 'warning.main' : 'error.main'}>
              ${totalRows.toLocaleString('es-AR')}
            </Typography>
            <Typography variant="caption" color={diff === 0 ? 'success.main' : diff > 0 ? 'warning.main' : 'error.main'}>
              {diff === 0
                ? 'Coincide exacto'
                : diff > 0
                  ? `Sobra $${Math.abs(diff).toLocaleString('es-AR')}`
                  : `Falta $${Math.abs(diff).toLocaleString('es-AR')}`}
            </Typography>
          </Box>
        </Stack>

        {loadingCajas ? (
          <Box display="flex" justifyContent="center" py={3}><CircularProgress /></Box>
        ) : cajas.length === 0 ? (
          <Alert severity="warning">
            No hay cajas en pesos activas. Cargá al menos una en <strong>Administración → Cajas en Pesos</strong>.
          </Alert>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Caja en pesos</TableCell>
                  <TableCell sx={{ minWidth: 170 }}>Método</TableCell>
                  <TableCell align="right" sx={{ minWidth: 200 }}>Monto</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>Observación</TableCell>
                  <TableCell align="right" sx={{ minWidth: 180 }}>Saldo actual</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => {
                  const caja = cajas.find(c => c.id === r.cajaPesosId);
                  const saldoFinal = caja ? Number(caja.saldoActual) - (Number(r.monto) || 0) : null;
                  const metodosCaja = metodosDeCaja(caja);
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField
                          select size="small" fullWidth
                          value={r.cajaPesosId ?? ''}
                          onChange={(e) => {
                            const nuevoId = e.target.value === '' ? null : Number(e.target.value);
                            const nuevaCaja = cajas.find(c => c.id === nuevoId);
                            updateRow(idx, {
                              cajaPesosId: nuevoId,
                              metodoPago: metodoDefaultDeCaja(nuevaCaja),
                            });
                          }}
                        >
                          {cajas.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          select size="small" sx={{ minWidth: 160 }}
                          value={r.metodoPago}
                          onChange={(e) => updateRow(idx, { metodoPago: e.target.value as MetodoPago })}
                          helperText={metodosCaja.length === 1 ? 'único método de la caja' : undefined}
                        >
                          {metodosCaja.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small" type="number" sx={{ width: 180 }}
                          value={r.monto}
                          onChange={(e) => updateRow(idx, { monto: Number(e.target.value) || 0 })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Ajustar al monto faltante">
                                  <IconButton size="small" onClick={() => ajustarAlMonto(idx)}>
                                    <AutoFixHighIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" placeholder="—"
                          value={r.observaciones}
                          onChange={(e) => updateRow(idx, { observaciones: e.target.value })}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {caja ? (
                          <Stack alignItems="flex-end" spacing={0}>
                            <Typography variant="caption" color="textSecondary">
                              ${Number(caja.saldoActual).toLocaleString('es-AR')}
                            </Typography>
                            {saldoFinal !== null && (
                              <Chip
                                label={`→ $${saldoFinal.toLocaleString('es-AR')}`}
                                size="small"
                                color={saldoFinal < 0 ? 'error' : 'default'}
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        ) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Quitar renglón">
                          <span>
                            <IconButton
                              size="small" color="error"
                              disabled={rows.length === 1}
                              onClick={() => removeRow(idx)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        <Box mt={1}>
          <Button size="small" startIcon={<AddIcon />} onClick={addRow} disabled={loadingCajas || cajas.length === 0}>
            Agregar caja
          </Button>
        </Box>

        <Box mt={3}>
          <TextField
            fullWidth size="small" label="Observaciones del pago"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline rows={2}
            helperText="Si dejás vacío, queda 'Adelanto {período} — {empleado}'"
          />
        </Box>

        {diff < 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Vas a pagar menos que el monto del adelanto. Se marca como pagado igual; si querés podés cargar el resto después como otro pago.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={submitting}>Cancelar</Button>
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
          onClick={handlePagar}
          disabled={submitting || rows.length === 0 || cajas.length === 0}
        >
          {submitting ? 'Registrando...' : `Pagar $${totalRows.toLocaleString('es-AR')}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PagoAdelantoDialog;
