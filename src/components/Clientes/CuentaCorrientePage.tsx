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
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import { cuentaCorrienteApiWithFallback as cuentaCorrienteApi } from '../../api/services/apiWithFallback';
import type { Cliente, CuentaCorriente, TipoMovimiento } from '../../types';

dayjs.locale('es');

const CuentaCorrientePage: React.FC = () => {
  const navigate = useNavigate();
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

  // Mock data for demonstration
  const mockMovimientos: CuentaCorriente[] = [
    {
      id: 1,
      clienteId: 1,
      fecha: '2024-01-15',
      tipo: 'DEBITO',
      importe: 15000,
      concepto: 'Factura 001-00001234',
      numeroComprobante: '001-00001234',
      saldo: 15000
    },
    {
      id: 2,
      clienteId: 1,
      fecha: '2024-01-20',
      tipo: 'CREDITO',
      importe: 10000,
      concepto: 'Pago en efectivo',
      numeroComprobante: 'REC-0001',
      saldo: 5000
    },
    {
      id: 3,
      clienteId: 1,
      fecha: '2024-02-01',
      tipo: 'DEBITO',
      importe: 8500,
      concepto: 'Factura 001-00001235',
      numeroComprobante: '001-00001235',
      saldo: 13500
    },
    {
      id: 4,
      clienteId: 2,
      fecha: '2024-02-10',
      tipo: 'CREDITO',
      importe: 5000,
      concepto: 'Transferencia bancaria',
      numeroComprobante: 'TRANSF-001',
      saldo: 8500
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientesData = await clienteApi.getAll();
      setClientes(clientesData);
      setMovimientos(mockMovimientos);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = async (clienteId: number) => {
    const cliente = clientes.find(c => c.id === clienteId) || null;
    setSelectedCliente(cliente);
    
    if (cliente) {
      try {
        setLoading(true);
        // Filter movements for selected client
        const clienteMovimientos = mockMovimientos.filter(m => m.clienteId === clienteId);
        setMovimientos(clienteMovimientos);
      } catch (err) {
        setError('Error al cargar los movimientos del cliente');
        console.error('Error loading client movements:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setMovimientos(mockMovimientos);
    }
  };

  const handleSaveMovimiento = async () => {
    if (!selectedCliente) return;

    try {
      const nuevoMovimiento: CuentaCorriente = {
        id: Date.now(),
        clienteId: selectedCliente.id,
        fecha: new Date().toISOString().split('T')[0],
        tipo: newMovimiento.tipo,
        importe: newMovimiento.importe,
        concepto: newMovimiento.concepto,
        numeroComprobante: newMovimiento.numeroComprobante,
        saldo: calculateNewSaldo(newMovimiento.tipo, newMovimiento.importe)
      };

      setMovimientos([nuevoMovimiento, ...movimientos]);
      setNewMovimiento({
        tipo: 'CREDITO',
        importe: 0,
        concepto: '',
        numeroComprobante: ''
      });
      setOpenMovimientoDialog(false);
    } catch (err) {
      setError('Error al guardar el movimiento');
      console.error('Error saving movement:', err);
    }
  };

  const calculateNewSaldo = (tipo: TipoMovimiento, importe: number): number => {
    const saldoActual = movimientos.length > 0 ? movimientos[0].saldo : 0;
    return tipo === 'DEBITO' ? saldoActual + importe : saldoActual - importe;
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
    return filteredMovimientos.length > 0 ? filteredMovimientos[0].saldo : 0;
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
            >
              Exportar
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
              <Typography variant="h4" color={getSaldoTotal() >= 0 ? 'success.main' : 'error.main'}>
                ${getSaldoTotal().toLocaleString()}
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
              {filteredMovimientos.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell>
                    {new Date(movimiento.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={movimiento.tipo}
                      color={movimiento.tipo === 'DEBITO' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{movimiento.concepto}</TableCell>
                  <TableCell>{movimiento.numeroComprobante}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={movimiento.tipo === 'DEBITO' ? 'error.main' : 'success.main'}
                    >
                      ${movimiento.importe.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      color={movimiento.saldo >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      ${movimiento.saldo.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredMovimientos.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron movimientos
            </Typography>
          </Box>
        )}

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
              >
                <MenuItem value="DEBITO">Débito (+)</MenuItem>
                <MenuItem value="CREDITO">Crédito (-)</MenuItem>
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
