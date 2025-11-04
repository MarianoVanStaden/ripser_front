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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { clienteApi } from '../../api/services/clienteApi';
import { cuentaCorrienteApi } from '../../api/services/cuentaCorrienteApi';
import type { Cliente, CuentaCorriente, TipoMovimiento } from '../../types';
import { generateCuentaCorrienteClientePDF } from '../../utils/pdfExportUtils';

dayjs.locale('es');

const CuentaCorrientePage: React.FC = () => {
  const location = useLocation(); // Use the useLocation hook
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [movimientos, setMovimientos] = useState<CuentaCorriente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoMovimiento | ''>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());
  const [openMovimientoDialog, setOpenMovimientoDialog] = useState(false);
  const [newMovimiento, setNewMovimiento] = useState({
    tipo: 'CREDITO' as TipoMovimiento,
    importe: 0,
    concepto: '',
    numeroComprobante: ''
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const clientesData = await clienteApi.getAll();
        setClientes(clientesData);

        // Check for a client ID passed via navigation state
        const initialClienteId = location.state?.clienteId;
        if (initialClienteId) {
          const initialCliente = clientesData.find(c => c.id === initialClienteId);
          if (initialCliente) {
            setSelectedCliente(initialCliente);
            // Fetch movements for the pre-selected client
            const movimientosData = await cuentaCorrienteApi.getByClienteId(initialCliente.id);
            setMovimientos(movimientosData);
          }
        }
      } catch (err) {
        setError('Error al cargar los datos iniciales.');
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [location.state]); // Re-run effect if navigation state changes

  const loadData = async () => {
    if (!selectedCliente) return;
    try {
      setLoading(true);
      setError(null);
      const movimientosData = await cuentaCorrienteApi.getByClienteId(selectedCliente.id);
      setMovimientos(movimientosData);
    } catch (err) {
      setError('Error al cargar los movimientos del cliente.');
      console.error('Error loading movements:', err);
      setMovimientos([]); // Clear movements on error
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = (clienteId: number) => {
    const cliente = clientes.find(c => c.id === clienteId) || null;
    setSelectedCliente(cliente);
    
    if (cliente) {
      // Fetch movements for the newly selected client
      const fetchMovimientos = async () => {
        try {
          setLoading(true);
          const data = await cuentaCorrienteApi.getByClienteId(cliente.id);
          setMovimientos(data);
        } catch (err) {
          setError('Error al cargar los movimientos del cliente.');
          console.error('Error loading client movements:', err);
          setMovimientos([]);
        } finally {
          setLoading(false);
        }
      };
      fetchMovimientos();
    } else {
      // If "Todos los clientes" is selected, clear the movements
      setMovimientos([]);
    }
  };

  const handleSaveMovimiento = async () => {
    if (!selectedCliente) {
      setError("Debe seleccionar un cliente para registrar un movimiento.");
      return;
    }

    try {
      setLoading(true);
      // Create payload matching CreateMovimientoPayload interface
      const payload = {
        clienteId: selectedCliente.id,
        fecha: new Date().toISOString(),
        tipo: newMovimiento.tipo,
        importe: newMovimiento.importe,
        concepto: newMovimiento.concepto,
        numeroComprobante: newMovimiento.numeroComprobante || undefined,
      };

      await cuentaCorrienteApi.create(payload);

      // Reset form and close dialog
      setNewMovimiento({
        tipo: 'CREDITO',
        importe: 0,
        concepto: '',
        numeroComprobante: ''
      });
      setOpenMovimientoDialog(false);

      // Refresh both the movements AND the client data to get updated saldoActual
      const [movimientosData, clienteActualizado] = await Promise.all([
        cuentaCorrienteApi.getByClienteId(selectedCliente.id),
        clienteApi.getById(selectedCliente.id)
      ]);

      setMovimientos(movimientosData);
      setSelectedCliente(clienteActualizado);

      // Also update the cliente in the clientes array
      setClientes(prevClientes =>
        prevClientes.map(c => c.id === clienteActualizado.id ? clienteActualizado : c)
      );
    } catch (err) {
      setError('Error al guardar el movimiento. Verifique los datos e intente de nuevo.');
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
      setError('Debe seleccionar un cliente para exportar el PDF.');
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
            Cuenta Corriente
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportarPDF}
              disabled={!selectedCliente}
            >
              Exportar PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenMovimientoDialog(true)}
              disabled={!selectedCliente}
            >
              Nuevo Movimiento
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Saldo Actual</Typography>
              </Box>
              <Typography variant="h4" color={getSaldoTotal() > 0 ? 'error.main' : 'success.main'}>
                ${Math.abs(getSaldoTotal()).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getSaldoTotal() > 0 ? 'Deuda del cliente' : getSaldoTotal() < 0 ? 'A favor del cliente' : 'Sin deuda'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Débitos</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                ${getTotalDebitos().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Créditos</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
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
              label="Cliente"
              value={selectedCliente?.id || ''}
              onChange={(e) => handleClienteChange(Number(e.target.value))}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todos los clientes</MenuItem>
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido}
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
              onChange={setFechaDesde}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={setFechaHasta}
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
                    {/* Defensive check for importe */}
                    ${(movimiento.importe ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {/* This is the fix: provide a fallback for null saldo */}
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
        <Dialog open={openMovimientoDialog} onClose={() => setOpenMovimientoDialog(false)} maxWidth="sm" fullWidth>
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
