// Pago masivo de adelantos pendientes: selecciona N adelantos del período
// filtrado y los paga todos desde UNA caja en pesos (con el método
// autoseleccionado por la caja). Cada adelanto se paga con un único
// MovimientoExtra (SUELDOS_SALARIOS); si necesitás distribución multi-caja
// por adelanto, hacé pago individual desde la grilla de Adelantos.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress,
  FormControl, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payments as PaymentsIcon,
  AccountBalance as AccountBalanceIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { adelantoApi } from '../../../api/services/adelantoApi';
import { employeeApi } from '../../../api/services/employeeApi';
import { cajasPesosApi } from '../../../api/services/cajasPesosApi';
import type { Adelanto, CajaPesos, Empleado } from '../../../types';
import type { MetodoPago } from '../../../types/prestamo.types';
import LoadingOverlay from '../../common/LoadingOverlay';

const metodoDefaultDeCaja = (caja: CajaPesos | undefined): MetodoPago => {
  if (!caja) return 'EFECTIVO';
  if (caja.metodoPagoPrincipal) return caja.metodoPagoPrincipal;
  return caja.metodosAceptados?.[0]?.metodoPago ?? 'EFECTIVO';
};
const metodosDeCaja = (caja: CajaPesos | undefined): MetodoPago[] => {
  if (!caja || !caja.metodosAceptados || caja.metodosAceptados.length === 0) return ['EFECTIVO'];
  return caja.metodosAceptados.map(m => m.metodoPago);
};

interface PagoMasivoAdelantosPageProps {
  /** Si true, oculta el header propio porque está embebido en un Tabs. */
  embedded?: boolean;
}

const PagoMasivoAdelantosPage: React.FC<PagoMasivoAdelantosPageProps> = ({ embedded = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [adelantos, setAdelantos] = useState<Adelanto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cajas, setCajas] = useState<CajaPesos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtros / parámetros del lote
  const [periodo, setPeriodo] = useState<string>(dayjs().format('YYYY-MM'));
  const [fecha, setFecha] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [cajaId, setCajaId] = useState<number | ''>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [observaciones, setObservaciones] = useState<string>('');

  // Selección de adelantos a pagar
  const [seleccion, setSeleccion] = useState<Record<number, boolean>>({});

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [adelantosData, empleadosData, cajasData] = await Promise.all([
        adelantoApi.getAll(),
        employeeApi.getAllList(),
        cajasPesosApi.getAll(),
      ]);
      setAdelantos(Array.isArray(adelantosData) ? adelantosData : []);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      const activas = (Array.isArray(cajasData) ? cajasData : []).filter(c => c.estado === 'ACTIVA');
      setCajas(activas);
      if (activas.length > 0 && cajaId === '') {
        setCajaId(activas[0].id);
        setMetodoPago(metodoDefaultDeCaja(activas[0]));
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  // Adelantos del período + pendientes (fechaPago == null)
  const pendientes = useMemo(() => {
    return adelantos.filter(a => !a.fechaPago && (!periodo || a.periodo === periodo));
  }, [adelantos, periodo]);

  // Por default, todos los pendientes del período seleccionados.
  useEffect(() => {
    const next: Record<number, boolean> = {};
    pendientes.forEach(a => { next[a.id] = true; });
    setSeleccion(next);
  }, [pendientes.length, periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  const seleccionados = useMemo(
    () => pendientes.filter(a => seleccion[a.id]),
    [pendientes, seleccion],
  );

  const totalSeleccionado = useMemo(
    () => seleccionados.reduce((sum, a) => sum + Number(a.monto || 0), 0),
    [seleccionados],
  );

  const cajaSeleccionada = cajas.find(c => c.id === cajaId);
  const saldoActualCaja = cajaSeleccionada ? Number(cajaSeleccionada.saldoActual) : 0;
  const saldoFinalCaja = saldoActualCaja - totalSeleccionado;
  const metodosCaja = metodosDeCaja(cajaSeleccionada);

  const getEmpleadoNombre = (a: Adelanto) => {
    if (a.empleadoApellido || a.empleadoNombre) {
      return `${a.empleadoApellido ?? ''}, ${a.empleadoNombre ?? ''}`.replace(/^,\s*/, '').trim();
    }
    const e = empleados.find(emp => emp.id === a.empleadoId);
    return e ? `${e.apellido}, ${e.nombre}` : `Empleado #${a.empleadoId}`;
  };

  const toggleSeleccion = (id: number) => setSeleccion(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSeleccionAll = (checked: boolean) => {
    const next: Record<number, boolean> = {};
    pendientes.forEach(a => { next[a.id] = checked; });
    setSeleccion(next);
  };

  const handlePagarMasivo = async () => {
    setError(null);
    setSuccess(null);
    if (seleccionados.length === 0) {
      setError('Seleccioná al menos un adelanto');
      return;
    }
    if (!cajaId) {
      setError('Elegí una caja en pesos');
      return;
    }
    if (!fecha) {
      setError('Indicá la fecha de pago');
      return;
    }

    try {
      setSubmitting(true);
      const result = await adelantoApi.pagarMasivo({
        adelantoIds: seleccionados.map(a => a.id),
        fecha,
        cajaPesosId: Number(cajaId),
        metodoPago,
        observaciones: observaciones?.trim() || undefined,
      });
      setSuccess(`${result.length} adelanto(s) pagado(s) correctamente desde "${cajaSeleccionada?.nombre}".`);
      await loadInitial();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al pagar adelantos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={embedded ? 0 : { xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando datos..." />

      {!embedded && (
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <IconButton onClick={() => navigate('/rrhh/adelantos')}><ArrowBackIcon /></IconButton>
          <Typography variant="h4" fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
            Pago masivo de adelantos
          </Typography>
        </Stack>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Parámetros del lote */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
            Parámetros del pago
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth size="small" type="month" label="Período"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Vacío = todos los pendientes"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth size="small" type="date" label="Fecha de pago *"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Caja en pesos *</InputLabel>
                <Select
                  label="Caja en pesos *"
                  value={cajaId}
                  onChange={(e) => {
                    const nuevoId = e.target.value as number | '';
                    setCajaId(nuevoId);
                    const nuevaCaja = cajas.find(c => c.id === nuevoId);
                    setMetodoPago(metodoDefaultDeCaja(nuevaCaja));
                  }}
                >
                  {cajas.length === 0 && <MenuItem value="" disabled>Sin cajas activas</MenuItem>}
                  {cajas.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre} (saldo: ${Number(c.saldoActual).toLocaleString('es-AR')})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Método de pago</InputLabel>
                <Select
                  label="Método de pago"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                >
                  {metodosCaja.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Observaciones (opcional, aplica a todos los pagos)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPIs del lote */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {seleccionados.length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Adelantos a pagar</Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 36, color: 'success.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    ${totalSeleccionado.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Total a pagar</Typography>
                </Box>
                <PaymentsIcon sx={{ fontSize: 36, color: 'warning.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    ${saldoActualCaja.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Saldo actual caja</Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{
            borderLeft: 4,
            borderColor: saldoFinalCaja < 0 ? 'error.main' : 'success.main',
            boxShadow: 1,
          }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color={saldoFinalCaja < 0 ? 'error.main' : 'success.main'}>
                    ${saldoFinalCaja.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Saldo final estimado</Typography>
                </Box>
                {saldoFinalCaja < 0 && <WarningIcon sx={{ fontSize: 36, color: 'error.main', opacity: 0.5 }} />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {saldoFinalCaja < 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La caja quedará en saldo negativo (${saldoFinalCaja.toLocaleString('es-AR')}). El sistema lo permite, pero confirmá que es lo que querés.
        </Alert>
      )}

      {/* Tabla de adelantos pendientes */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box px={2} py={1.5} display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="subtitle1" fontWeight={600}>
              Adelantos pendientes
            </Typography>
            <Chip label={`${pendientes.length} pendiente(s)`} size="small" color={pendientes.length > 0 ? 'warning' : 'default'} />
            <Box flex={1} />
            <Button size="small" onClick={() => toggleSeleccionAll(true)}>Seleccionar todos</Button>
            <Button size="small" onClick={() => toggleSeleccionAll(false)}>Limpiar</Button>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white' }} padding="checkbox">
                    <Checkbox
                      sx={{ color: 'white' }}
                      indeterminate={pendientes.some(a => seleccion[a.id]) && pendientes.some(a => !seleccion[a.id])}
                      checked={pendientes.length > 0 && pendientes.every(a => seleccion[a.id])}
                      onChange={(e) => toggleSeleccionAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Empleado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Período</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Fecha carga</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Monto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        No hay adelantos pendientes {periodo ? `en ${dayjs(periodo).format('MMMM YYYY')}` : ''}.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : pendientes.map(a => (
                  <TableRow key={a.id} hover sx={{ opacity: seleccion[a.id] ? 1 : 0.55 }}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={!!seleccion[a.id]} onChange={() => toggleSeleccion(a.id)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{getEmpleadoNombre(a)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={<CalendarIcon />}
                        label={dayjs(a.periodo).format('MMMM YYYY')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">{dayjs(a.fecha).format('DD/MM/YYYY')}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="warning.main">
                        ${Number(a.monto || 0).toLocaleString('es-AR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 220 }}>
                        {a.observaciones ?? '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} flexWrap="wrap" gap={2}>
        <Typography variant="caption" color="textSecondary">
          Cada adelanto se paga con un movimiento único en la caja seleccionada (categoría SUELDOS_SALARIOS).
          Para repartir un adelanto entre varias cajas, usá el pago individual desde la grilla de Adelantos.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size={isMobile ? 'medium' : 'large'}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PaymentsIcon />}
          disabled={submitting || seleccionados.length === 0 || !cajaId}
          onClick={handlePagarMasivo}
        >
          {submitting
            ? `Pagando ${seleccionados.length}...`
            : `Pagar ${seleccionados.length} adelanto(s) ($${totalSeleccionado.toLocaleString('es-AR')})`}
        </Button>
      </Box>
    </Box>
  );
};

export default PagoMasivoAdelantosPage;
