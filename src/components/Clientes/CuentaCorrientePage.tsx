import React, { useState, useEffect, useReducer } from 'react';
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
  Tooltip,
  useMediaQuery,
  useTheme,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { clienteApi } from '../../api/services/clienteApi';
import { cuentaCorrienteApi } from '../../api/services/cuentaCorrienteApi';
import type { Cliente, TipoMovimiento, MetodoPago } from '../../types';
import { useCuentaCorrienteCliente } from '../../hooks/useCuentaCorrienteCliente';
import { useSmartRefresh, formatLastUpdated } from '../../hooks/useSmartRefresh';
import { generateCuentaCorrienteClientePDF } from '../../utils/pdfExportUtils';

dayjs.locale('es');

const CuentaCorrientePage: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clientesLoading, setClientesLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoMovimiento | ''>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());
  const [openMovimientoDialog, setOpenMovimientoDialog] = useState(false);
  const [newMovimiento, setNewMovimiento] = useState({
    tipo: 'CREDITO' as TipoMovimiento,
    importe: 0,
    concepto: '',
    numeroComprobante: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // React Query — movimientos del cliente seleccionado
  const {
    data: movimientos = [],
    isFetching,
    refetch,
    invalidate,
    dataUpdatedAt,
  } = useCuentaCorrienteCliente(selectedCliente?.id);

  // Auto-refresh inteligente
  useSmartRefresh({ onRefetch: refetch, hasOpenModal: openMovimientoDialog });

  // Re-render periódico para "Última actualización"
  const [, tickLastUpdated] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const interval = setInterval(tickLastUpdated, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setClientesLoading(true);
        setLocalError(null);
        const clientesData = await clienteApi.getAll({ page: 0, size: 500 });
        setClientes(clientesData.content);

        // Pre-seleccionar cliente si viene por navigation state
        const initialClienteId = location.state?.clienteId;
        if (initialClienteId) {
          const initialCliente = clientesData.content.find(c => c.id === initialClienteId);
          if (initialCliente) setSelectedCliente(initialCliente);
          // React Query se encarga de fetchear los movimientos cuando selectedCliente cambia
        }
      } catch (err) {
        setLocalError('Error al cargar los datos iniciales.');
        console.error('Error loading initial data:', err);
      } finally {
        setClientesLoading(false);
      }
    };

    loadInitialData();
  }, [location.state]);

  const handleClienteChange = (clienteId: number) => {
    const cliente = clientes.find(c => c.id === clienteId) || null;
    setSelectedCliente(cliente);
    setPage(0);
    // React Query hace el fetch automáticamente cuando cambia selectedCliente
  };

  const handleSaveMovimiento = async () => {
    if (!selectedCliente) {
      setLocalError('Debe seleccionar un cliente para registrar un movimiento.');
      return;
    }

    try {
      const payload = {
        clienteId: selectedCliente.id,
        fecha: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        tipo: newMovimiento.tipo,
        importe: newMovimiento.importe,
        concepto: newMovimiento.concepto,
        numeroComprobante: newMovimiento.numeroComprobante || undefined,
        metodoPago: newMovimiento.metodoPago,
      };

      await cuentaCorrienteApi.create(payload);

      setNewMovimiento({ tipo: 'CREDITO', importe: 0, concepto: '', numeroComprobante: '', metodoPago: 'EFECTIVO' });
      setOpenMovimientoDialog(false);

      // Invalidar movimientos (React Query refetchea automáticamente)
      // + actualizar saldoActual del cliente seleccionado
      const [, clienteActualizado] = await Promise.all([
        invalidate(),
        clienteApi.getById(selectedCliente.id),
      ]);
      setSelectedCliente(clienteActualizado);
      setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? clienteActualizado : c));
    } catch (err) {
      setLocalError('Error al guardar el movimiento. Verifique los datos e intente de nuevo.');
      console.error('Error saving movement:', err);
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
    // Calculate saldo from all movements: Total Debitos - Total Creditos
    // DEBITO = Cliente debe dinero (aumenta deuda)
    // CREDITO = Cliente paga (disminuye deuda)
    const totalDebitos = movimientos
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + m.importe, 0);
    
    const totalCreditos = movimientos
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + m.importe, 0);
    
    return totalDebitos - totalCreditos;
  };

  const getTotalDebitos = () => {
    return filteredMovimientos
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + m.importe, 0);
  };

  const getTotalCreditos = () => {
    return filteredMovimientos
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + m.importe, 0);
  };

  const handleExportarPDF = async (): Promise<void> => {
    if (!selectedCliente) {
      setLocalError('Debe seleccionar un cliente para exportar el PDF.');
      return;
    }

    try {
      const saldoTotal = getSaldoTotal();
      await generateCuentaCorrienteClientePDF(
        selectedCliente,
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
      setLocalError('Error al generar el PDF. Por favor, intente nuevamente.');
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

  if (clientesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={{ xs: 2, sm: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" component="h1" display="flex" alignItems="center" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
              <AccountBalanceIcon sx={{ mr: 1 }} />
              Cuenta Corriente
              {isFetching && <CircularProgress size={16} sx={{ ml: 1.5, color: 'text.secondary' }} />}
            </Typography>
            {dataUpdatedAt > 0 && (
              <Typography variant="caption" color="text.secondary">
                Actualizado: {formatLastUpdated(dataUpdatedAt)}
              </Typography>
            )}
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportarPDF}
              disabled={!selectedCliente}
              fullWidth={isMobile}
            >
              Exportar PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenMovimientoDialog(true)}
              disabled={!selectedCliente}
              fullWidth={isMobile}
            >
              Nuevo Movimiento
            </Button>
          </Stack>
        </Box>

        {localError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLocalError(null)}>
            {localError}
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
                {getSaldoTotal() > 0 ? 'Deuda del cliente' : getSaldoTotal() < 0 ? 'A favor del cliente' : 'Sin deuda'}
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
            <Autocomplete
              options={clientes}
              getOptionLabel={(c) => `${c.nombre}${c.apellido ? ' ' + c.apellido : ''}`}
              value={selectedCliente}
              onChange={(_, value) => {
                setSelectedCliente(value);
                setPage(0);
              }}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              sx={{ minWidth: { xs: '100%', sm: 220 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              size={isMobile ? 'small' : 'medium'}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={option.id} {...otherProps}>
                    {`${option.nombre}${option.apellido ? ' ' + option.apellido : ''}`}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Cliente" placeholder="Buscar cliente..." />
              )}
            />

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
              sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              size={isMobile ? 'small' : 'medium'}
            />

            <TextField
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoMovimiento | '')}
              sx={{ minWidth: { xs: '48%', sm: 150 }, flex: { xs: '1 1 48%', sm: '0 0 auto' } }}
              size={isMobile ? 'small' : 'medium'}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="DEBITO">Débito</MenuItem>
              <MenuItem value="CREDITO">Crédito</MenuItem>
            </TextField>

            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(newValue) => setFechaDesde(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small', sx: { minWidth: { xs: '48%', sm: 150 }, flex: { xs: '1 1 48%', sm: '0 0 auto' } } } }}
            />

            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(newValue) => setFechaHasta(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small', sx: { minWidth: { xs: '48%', sm: 150 }, flex: { xs: '1 1 48%', sm: '0 0 auto' } } } }}
            />

            <IconButton onClick={() => refetch()} disabled={isFetching || !selectedCliente}>
              {isFetching ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Box>
        </Paper>

        {/* Movements Table */}
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 650, md: 'auto' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 100 }}>Fecha</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Tipo</TableCell>
                <TableCell sx={{ minWidth: 150 }}>Concepto</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Comprobante</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Importe</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Saldo</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Registrado por</TableCell>
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
                    {/* Defensive check for importe */}
                    ${(movimiento.importe ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {/* This is the fix: provide a fallback for null saldo */}
                    ${(movimiento.saldo ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell>
                    {movimiento.usuarioNombre ? (
                      <Tooltip title={movimiento.usuarioNombre}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                            {movimiento.usuarioNombre}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedMovimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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
            Nuevo Movimiento - {selectedCliente?.nombre} {selectedCliente?.apellido}
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
                helperText="Débito: Cliente debe (ej: venta). Crédito: Cliente paga (ej: pago recibido)"
              >
                <MenuItem value="DEBITO">Débito - Cliente debe (+)</MenuItem>
                <MenuItem value="CREDITO">Crédito - Cliente paga (-)</MenuItem>
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
                <MenuItem value="TRANSFERENCIA">🏦 Transferencia Bancaria</MenuItem>
                <MenuItem value="CHEQUE">📝 Cheque</MenuItem>
                <MenuItem value="TARJETA_CREDITO">💳 Tarjeta de Crédito</MenuItem>
                <MenuItem value="TARJETA_DEBITO">💳 Tarjeta de Débito</MenuItem>
                <MenuItem value="FINANCIAMIENTO">📋 Financiamiento</MenuItem>
                <MenuItem value="CUENTA_CORRIENTE">🏦 Cuenta Corriente</MenuItem>
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

export default CuentaCorrientePage;
