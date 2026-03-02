import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TablePagination,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { proveedorApi } from '../../api/services/proveedorApi';
import { cuentaCorrienteProveedorApi } from '../../api/services/cuentaCorrienteProveedorApi';
import type { CuentaCorrienteProveedor, TipoMovimiento, MetodoPago } from '../../types';
import { generateCuentaCorrienteProveedorPDF } from '../../utils/pdfExportUtils';

dayjs.locale('es');

interface Proveedor {
  id: number;
  nombre: string;
  razonSocial?: string;
  saldoActual?: number;
}

const CuentaCorrienteProveedoresPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [movimientos, setMovimientos] = useState<CuentaCorrienteProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoMovimiento | ''>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(null);
  const [openMovimientoDialog, setOpenMovimientoDialog] = useState(false);
  const [newMovimiento, setNewMovimiento] = useState({
    tipo: 'DEBITO' as TipoMovimiento,
    importe: 0,
    concepto: '',
    numeroComprobante: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const proveedoresData = await proveedorApi.getAll({ size: 1000 });
      setProveedores(proveedoresData.content);
    } catch (err) {
      setError('Error al cargar los proveedores.');
      console.error('Error loading proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!selectedProveedor) return;
    try {
      setLoading(true);
      setError(null);
      const movimientosData = await cuentaCorrienteProveedorApi.getByProveedorId(selectedProveedor.id);
      setMovimientos(movimientosData);
    } catch (err) {
      setError('Error al cargar los movimientos del proveedor.');
      console.error('Error loading movements:', err);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProveedorChange = async (proveedorId: number) => {
    const proveedor = proveedores.find(p => p.id === proveedorId) || null;
    setSelectedProveedor(proveedor);

    if (proveedor) {
      try {
        setLoading(true);
        const data = await cuentaCorrienteProveedorApi.getByProveedorId(proveedor.id);
        setMovimientos(data);
      } catch (err) {
        setError('Error al cargar los movimientos del proveedor.');
        console.error('Error loading movimientos:', err);
        setMovimientos([]);
      } finally {
        setLoading(false);
      }
    } else {
      setMovimientos([]);
    }
  };

  const handleSaveMovimiento = async () => {
    if (!selectedProveedor) {
      setError("Debe seleccionar un proveedor para registrar un movimiento.");
      return;
    }

    try {
      setLoading(true);
      // Send date in local time format (without timezone suffix)
      // Backend is configured to use Argentina timezone
      const localDateTime = dayjs().format('YYYY-MM-DDTHH:mm:ss');

      const payload = {
        proveedorId: selectedProveedor.id,
        fecha: localDateTime,
        tipo: newMovimiento.tipo,
        importe: newMovimiento.importe,
        concepto: newMovimiento.concepto,
        numeroComprobante: newMovimiento.numeroComprobante || undefined,
        metodoPago: newMovimiento.metodoPago,
      };

      await cuentaCorrienteProveedorApi.create(payload);

      setNewMovimiento({
        tipo: 'DEBITO',
        importe: 0,
        concepto: '',
        numeroComprobante: '',
        metodoPago: 'EFECTIVO',
      });
      setOpenMovimientoDialog(false);

      // Refresh data
      const [movimientosData, proveedorActualizado] = await Promise.all([
        cuentaCorrienteProveedorApi.getByProveedorId(selectedProveedor.id),
        proveedorApi.getById(selectedProveedor.id)
      ]);

      setMovimientos(movimientosData);
      setSelectedProveedor(proveedorActualizado);

      setProveedores(prevProveedores =>
        prevProveedores.map(p => p.id === proveedorActualizado.id ? proveedorActualizado : p)
      );
    } catch (err) {
      setError('Error al guardar el movimiento.');
      console.error('Error saving movement:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMovimientos = movimientos.filter(mov => {
    const matchesSearch =
      mov.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.numeroComprobante?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesTipo = !tipoFilter || mov.tipo === tipoFilter;

    const fechaMovimiento = dayjs(mov.fecha);
    const matchesFecha =
      (!fechaDesde || fechaMovimiento.isAfter(fechaDesde.subtract(1, 'day'))) &&
      (!fechaHasta || fechaMovimiento.isBefore(fechaHasta.add(1, 'day')));

    return matchesSearch && matchesTipo && matchesFecha;
  });

  const getSaldoTotal = () => {
    // Calculate saldo from all movements:
    // DEBITO = Compra/deuda (increases what we owe)
    // CREDITO = Payment to supplier (decreases what we owe)
    // Positive balance = we owe the supplier
    // Negative balance = supplier owes us (rare, but possible with returns/credits)
    const totalDebitos = movimientos
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);

    const totalCreditos = movimientos
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);

    return totalDebitos - totalCreditos;
  };

  const getTotalDebitos = () => {
    return filteredMovimientos
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);
  };

  const getTotalCreditos = () => {
    return filteredMovimientos
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);
  };

  const handleExportarPDF = async (): Promise<void> => {
    if (!selectedProveedor) {
      setError('Debe seleccionar un proveedor para exportar el PDF.');
      return;
    }

    try {
      const saldoTotal = getSaldoTotal();
      await generateCuentaCorrienteProveedorPDF(
        selectedProveedor,
        filteredMovimientos,
        {
          searchTerm,
          tipoFilter: tipoFilter || '',
          fechaDesde: fechaDesde ? fechaDesde.format('YYYY-MM-DD') : '',
          fechaHasta: fechaHasta ? fechaHasta.format('YYYY-MM-DD') : '',
        },
        saldoTotal
      );
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

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
    setPage(0); // Reset to first page when changing rows per page
  };

  if (loading && !selectedProveedor) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box p={{ xs: 2, sm: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" component="h1" display="flex" alignItems="center" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
            <AccountBalanceIcon sx={{ mr: 1 }} />
            Cuenta Corriente Proveedores
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportarPDF}
              disabled={!selectedProveedor}
              fullWidth={isMobile}
            >
              Exportar PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenMovimientoDialog(true)}
              disabled={!selectedProveedor}
              fullWidth={isMobile}
            >
              Nuevo Movimiento
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(200px, 1fr))' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Saldo Actual</Typography>
              </Box>
              <Typography variant="h4" color={getSaldoTotal() > 0 ? 'error.main' : 'success.main'} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                ${Math.abs(getSaldoTotal()).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getSaldoTotal() > 0 ? 'Deuda pendiente' : getSaldoTotal() < 0 ? 'A favor nuestro' : 'Sin deuda'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Total Débitos</Typography>
              </Box>
              <Typography variant="h4" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                ${getTotalDebitos().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Total Créditos</Typography>
              </Box>
              <Typography variant="h4" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                ${getTotalCreditos().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              select
              label="Proveedor"
              value={selectedProveedor?.id || ''}
              onChange={(e) => handleProveedorChange(Number(e.target.value))}
              sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              size={isMobile ? 'small' : 'medium'}
            >
              <MenuItem value="">Todos los proveedores</MenuItem>
              {proveedores.map((proveedor) => (
                <MenuItem key={proveedor.id} value={proveedor.id}>
                  {proveedor.razonSocial || proveedor.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoMovimiento | '')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="DEBITO">Débito</MenuItem>
              <MenuItem value="CREDITO">Crédito</MenuItem>
            </TextField>

            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(newValue) => setFechaDesde(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(newValue) => setFechaHasta(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small' } }}
            />

            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Movements Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Comprobante</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell align="right">Saldo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovimientos.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell>
                    {dayjs(movimiento.fecha).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={movimiento.tipo}
                      color={movimiento.tipo === 'DEBITO' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{movimiento.concepto}</TableCell>
                  <TableCell>{movimiento.numeroComprobante || '-'}</TableCell>
                  <TableCell align="right">
                    ${(movimiento.importe ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${(movimiento.saldo ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedMovimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={4}>
                      No se encontraron movimientos
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

        {/* New Movement Dialog */}
        <Dialog open={openMovimientoDialog} onClose={() => setOpenMovimientoDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>
            Nuevo Movimiento - {selectedProveedor?.razonSocial || selectedProveedor?.nombre}
          </DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <TextField
                fullWidth
                select
                label="Tipo de Movimiento"
                value={newMovimiento.tipo}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, tipo: e.target.value as TipoMovimiento })}
                margin="normal"
                helperText="Débito: Compra/deuda (+). Crédito: Pago al proveedor (-)"
              >
                <MenuItem value="DEBITO">Débito - Compra/Deuda (+)</MenuItem>
                <MenuItem value="CREDITO">Crédito - Pago al proveedor (-)</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Importe"
                type="number"
                value={newMovimiento.importe}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, importe: Number(e.target.value) })}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Concepto"
                value={newMovimiento.concepto}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, concepto: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="Número de Comprobante"
                value={newMovimiento.numeroComprobante}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, numeroComprobante: e.target.value })}
                margin="normal"
              />

              <TextField
                fullWidth
                select
                label="Método de Pago"
                value={newMovimiento.metodoPago}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, metodoPago: e.target.value as MetodoPago })}
                margin="normal"
                required
              >
                <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
                <MenuItem value="TRANSFERENCIA_BANCARIA">🏦 Transferencia Bancaria</MenuItem>
                <MenuItem value="CHEQUE">📝 Cheque</MenuItem>
                <MenuItem value="TARJETA_CREDITO">💳 Tarjeta de Crédito</MenuItem>
                <MenuItem value="TARJETA_DEBITO">💳 Tarjeta de Débito</MenuItem>
                <MenuItem value="MERCADO_PAGO">📱 Mercado Pago</MenuItem>
                <MenuItem value="FINANCIACION_PROPIA">📋 Financiación Propia</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMovimientoDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveMovimiento}
              disabled={!newMovimiento.concepto || newMovimiento.importe <= 0}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CuentaCorrienteProveedoresPage;
