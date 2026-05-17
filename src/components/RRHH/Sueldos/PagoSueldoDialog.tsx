// Pago de un sueldo distribuido entre N cajas en pesos (multi-cuenta).
// Cada renglón especifica qué caja paga qué monto. Al confirmar, el backend
// genera un MovimientoExtra (CategoriaGastoExtra.SUELDOS_SALARIOS) por cada
// renglón y marca el Sueldo como pagado. Las cajas pueden quedar en negativo.

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
import { sueldoApi } from '../../../api/services/sueldoApi';
import type { CajaPesos, Sueldo } from '../../../types';

interface Props {
  open: boolean;
  sueldo: Sueldo | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface PayRow {
  cajaPesosId: number | null;
  monto: number;
  metodoPago: string;
  observaciones: string;
}

const METODOS_PAGO = [
  'EFECTIVO', 'TRANSFERENCIA', 'DEPOSITO', 'CHEQUE', 'TARJETA_DEBITO',
] as const;

const PagoSueldoDialog: React.FC<Props> = ({ open, sueldo, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cajas, setCajas] = useState<CajaPesos[]>([]);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [fecha, setFecha] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [rows, setRows] = useState<PayRow[]>([]);
  const [observaciones, setObservaciones] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar cajas al abrir.
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
        // Arrancar con un renglón vacío con la caja default (primera activa).
        setRows([{
          cajaPesosId: activas[0]?.id ?? null,
          monto: Number(sueldo?.sueldoNeto ?? 0),
          metodoPago: 'EFECTIVO',
          observaciones: '',
        }]);
      })
      .catch(() => setError('Error al cargar cajas en pesos'))
      .finally(() => setLoadingCajas(false));
  }, [open, sueldo]);

  const sueldoNeto = Number(sueldo?.sueldoNeto ?? 0);

  const totalRows = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.monto) || 0), 0),
    [rows],
  );
  const diff = totalRows - sueldoNeto;

  const updateRow = (idx: number, patch: Partial<PayRow>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const addRow = () => {
    // Pre-llenar el monto del nuevo renglón con la diferencia faltante.
    const faltante = Math.max(0, sueldoNeto - totalRows);
    setRows(prev => [...prev, {
      cajaPesosId: cajas[0]?.id ?? null,
      monto: faltante,
      metodoPago: 'EFECTIVO',
      observaciones: '',
    }]);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const ajustarAlNeto = (idx: number) => {
    const otros = rows.reduce((s, r, i) => (i === idx ? s : s + (Number(r.monto) || 0)), 0);
    const restante = Math.max(0, sueldoNeto - otros);
    updateRow(idx, { monto: restante });
  };

  const handlePagar = async () => {
    if (!sueldo) return;
    setError(null);

    const items = rows
      .filter(r => r.cajaPesosId && (Number(r.monto) || 0) > 0)
      .map(r => ({
        cajaPesosId: r.cajaPesosId as number,
        monto: Number(r.monto),
        metodoPago: r.metodoPago,
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
      await sueldoApi.pagarSueldo(sueldo.id, {
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
            Registrar pago de sueldo{sueldo?.empleado ? ` — ${sueldo.empleado.apellido}, ${sueldo.empleado.nombre}` : ''}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

        {/* Resumen */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <TextField
            size="small" type="date" label="Fecha de pago"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />
          <Box flex={1}>
            <Typography variant="caption" color="textSecondary" display="block">Sueldo Neto a pagar</Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">
              ${sueldoNeto.toLocaleString('es-AR')}
            </Typography>
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Caja en pesos</TableCell>
                <TableCell>Método</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Observación</TableCell>
                <TableCell align="right">Saldo actual</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => {
                const caja = cajas.find(c => c.id === r.cajaPesosId);
                const saldoFinal = caja ? Number(caja.saldoActual) - (Number(r.monto) || 0) : null;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        select size="small" fullWidth
                        value={r.cajaPesosId ?? ''}
                        onChange={(e) => updateRow(idx, { cajaPesosId: e.target.value === '' ? null : Number(e.target.value) })}
                      >
                        {cajas.map(c => (
                          <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select size="small" sx={{ minWidth: 130 }}
                        value={r.metodoPago}
                        onChange={(e) => updateRow(idx, { metodoPago: e.target.value })}
                      >
                        {METODOS_PAGO.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small" type="number" sx={{ width: 130 }}
                        value={r.monto}
                        onChange={(e) => updateRow(idx, { monto: Number(e.target.value) || 0 })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title="Ajustar al neto faltante">
                                <IconButton size="small" onClick={() => ajustarAlNeto(idx)}>
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
            helperText="Si dejás vacío, queda 'Pago sueldo {período} — {empleado}'"
          />
        </Box>

        {diff < 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Vas a pagar menos que el neto. El sueldo se marca como pagado igual; si querés podés cargar el resto después como otro pago.
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

export default PagoSueldoDialog;
