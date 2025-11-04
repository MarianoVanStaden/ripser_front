import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TablePagination,
  Divider,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { cuentaCorrienteApi } from '../../api/services/cuentaCorrienteApi';
import { cuentaCorrienteProveedorApi } from '../../api/services/cuentaCorrienteProveedorApi';
import type { CuentaCorriente, CuentaCorrienteProveedor } from '../../types';

dayjs.locale('es');

interface MovimientoFlujoCaja {
  id: number;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  origen: 'CLIENTE' | 'PROVEEDOR';
  entidad: string;
  concepto: string;
  importe: number;
  numeroComprobante?: string;
}

const FlujoCajaPage: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovimientoFlujoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch movimientos from both clientes and proveedores
      const [movimientosClientes, movimientosProveedores] = await Promise.all([
        cuentaCorrienteApi.getAll(),
        cuentaCorrienteProveedorApi.getAll(),
      ]);

      // Process cliente movimientos
      const ingresosClientes: MovimientoFlujoCaja[] = (movimientosClientes as CuentaCorriente[])
        .filter(m => m.tipo === 'CREDITO') // Crédito del cliente = pago = ingreso
        .map(m => ({
          id: m.id,
          fecha: m.fecha,
          tipo: 'INGRESO' as const,
          origen: 'CLIENTE' as const,
          entidad: m.clienteNombre || `Cliente ID: ${m.clienteId}`,
          concepto: m.concepto,
          importe: m.importe,
          numeroComprobante: m.numeroComprobante,
        }));

      // Process proveedor movimientos
      const egresosProveedores: MovimientoFlujoCaja[] = (movimientosProveedores as CuentaCorrienteProveedor[])
        .filter(m => m.tipo === 'CREDITO') // Crédito a proveedor = pago = egreso
        .map(m => ({
          id: m.id,
          fecha: m.fecha,
          tipo: 'EGRESO' as const,
          origen: 'PROVEEDOR' as const,
          entidad: m.proveedorNombre || `Proveedor ID: ${m.proveedorId}`,
          concepto: m.concepto,
          importe: m.importe,
          numeroComprobante: m.numeroComprobante,
        }));

      // Combine and sort by date
      const allMovimientos = [...ingresosClientes, ...egresosProveedores]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setMovimientos(allMovimientos);
    } catch (err) {
      console.error('Error loading flujo de caja:', err);
      setError('Error al cargar el flujo de caja. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Filter movimientos by date
  const filteredMovimientos = movimientos.filter(mov => {
    const fechaMovimiento = dayjs(mov.fecha);
    const matchesFecha =
      (!fechaDesde || fechaMovimiento.isAfter(fechaDesde.subtract(1, 'day'))) &&
      (!fechaHasta || fechaMovimiento.isBefore(fechaHasta.add(1, 'day')));
    return matchesFecha;
  });

  // Calculate totals
  const totalIngresos = filteredMovimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + m.importe, 0);

  const totalEgresos = filteredMovimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + m.importe, 0);

  const flujoNeto = totalIngresos - totalEgresos;

  // Paginate filtered movimientos
  const paginatedMovimientos = filteredMovimientos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" display="flex" alignItems="center">
            <AccountBalanceIcon sx={{ mr: 2 }} />
            Flujo de Caja
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'success.lighter',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingUpIcon color="success" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      ${totalIngresos.toLocaleString('es-AR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Ingresos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'error.lighter',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrendingDownIcon color="error" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                      ${totalEgresos.toLocaleString('es-AR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Egresos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: flujoNeto >= 0 ? 'primary.lighter' : 'warning.lighter',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AttachMoneyIcon
                      color={flujoNeto >= 0 ? 'primary' : 'warning'}
                      fontSize="large"
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color={flujoNeto >= 0 ? 'primary.main' : 'warning.main'}
                    >
                      ${flujoNeto.toLocaleString('es-AR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Flujo Neto
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'info.lighter',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AccountBalanceIcon color="info" fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {filteredMovimientos.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Movimientos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" mb={2}>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={setFechaDesde}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={setFechaHasta}
              slotProps={{ textField: { size: 'small' } }}
            />

            <Button
              variant="outlined"
              onClick={() => {
                setFechaDesde(dayjs().subtract(30, 'day'));
                setFechaHasta(dayjs());
                setPage(0);
              }}
            >
              Últimos 30 días
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                setFechaDesde(dayjs().startOf('month'));
                setFechaHasta(dayjs().endOf('month'));
                setPage(0);
              }}
            >
              Este mes
            </Button>
          </Box>
        </Paper>

        {/* Movimientos Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Entidad</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Comprobante</TableCell>
                <TableCell align="right">Importe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovimientos.map((movimiento) => (
                <TableRow
                  key={`${movimiento.origen}-${movimiento.id}`}
                  sx={{
                    bgcolor: movimiento.tipo === 'INGRESO'
                      ? 'success.lighter'
                      : 'error.lighter',
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1,
                    }
                  }}
                >
                  <TableCell>
                    {dayjs(movimiento.fecha).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={movimiento.tipo}
                      color={movimiento.tipo === 'INGRESO' ? 'success' : 'error'}
                      size="small"
                      icon={movimiento.tipo === 'INGRESO' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={movimiento.origen}
                      color={movimiento.origen === 'CLIENTE' ? 'primary' : 'secondary'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {movimiento.entidad}
                    </Typography>
                  </TableCell>
                  <TableCell>{movimiento.concepto}</TableCell>
                  <TableCell>{movimiento.numeroComprobante || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={movimiento.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                    >
                      {movimiento.tipo === 'INGRESO' ? '+' : '-'}
                      ${movimiento.importe.toLocaleString('es-AR')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedMovimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={4}>
                      No se encontraron movimientos en el período seleccionado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredMovimientos.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>

        {/* Summary Section */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" mb={2}>
            Resumen del Período
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ingresos (Pagos de Clientes)
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ${totalIngresos.toLocaleString('es-AR')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredMovimientos.filter(m => m.tipo === 'INGRESO').length} movimientos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Egresos (Pagos a Proveedores)
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ${totalEgresos.toLocaleString('es-AR')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredMovimientos.filter(m => m.tipo === 'EGRESO').length} movimientos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: flujoNeto >= 0 ? 'primary.lighter' : 'warning.lighter',
                  borderRadius: 1,
                  border: 2,
                  borderColor: flujoNeto >= 0 ? 'primary.main' : 'warning.main',
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Flujo Neto de Caja
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={flujoNeto >= 0 ? 'primary.main' : 'warning.main'}
                >
                  {flujoNeto >= 0 ? '+' : ''}${flujoNeto.toLocaleString('es-AR')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {flujoNeto >= 0 ? 'Superávit' : 'Déficit'} en el período
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Nota:</strong> El flujo de caja muestra únicamente los movimientos de efectivo reales:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0 }}>
              <Typography component="li" variant="body2">
                <strong>Ingresos:</strong> Pagos recibidos de clientes (créditos en cuenta corriente de clientes)
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Egresos:</strong> Pagos realizados a proveedores (créditos en cuenta corriente de proveedores)
              </Typography>
            </Box>
          </Alert>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default FlujoCajaPage;
