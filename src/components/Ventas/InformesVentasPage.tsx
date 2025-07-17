import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  DateRange as DateRangeIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { saleApi, clienteApi, usuarioApi } from '../../api/services';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const InformeVentasPage = () => {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState(null);
  const [dateToFilter, setDateToFilter] = useState(null);
  const [reportType, setReportType] = useState('summary');
  const [groupBy, setGroupBy] = useState('day');
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [salesData, clientsData, usuariosData] = await Promise.all([
        saleApi.getAll(),
        clienteApi.getAll(),
        usuarioApi.getAll(),
      ]);
      const clientsMap = new Map(clientsData.map(client => [client.id, client]));
      const usuariosMap = new Map(usuariosData.map(usuario => [usuario.id, usuario]));
      const enrichedSales = salesData.map(sale => {
        let cliente = sale.cliente || null;
        if (sale.clienteId && !cliente) {
          cliente = clientsMap.get(sale.clienteId) || null;
        }
        let usuario = sale.usuario || null;
        if (sale.usuarioId && !usuario) {
          usuario = usuariosMap.get(sale.usuarioId) || null;
        }
        return {
          ...sale,
          cliente,
          usuario,
          metodoPago: sale.metodoPago || 'CASH',
        };
      });
      setSales(enrichedSales);
      setClients(clientsData);
      setUsuarios(usuariosData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSale = (sale) => {
    setViewingSale(sale);
    setViewDialogOpen(true);
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      PENDIENTE: 'Pendiente',
      ENVIADA: 'Enviada',
      CANCELADA: 'Cancelada',
      ENTREGADA: 'Entregada',
      CONFIRMADA: 'Confirmada',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      PENDIENTE: 'warning',
      ENVIADA: 'info',
      CANCELADA: 'error',
      ENTREGADA: 'success',
      CONFIRMADA: 'success',
    };
    return statusColors[status] || 'default';
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      BANK_TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
    };
    return methods[method] || method;
  };

  const getClientFullName = (cliente) => {
    if (!cliente) return 'Cliente no disponible';
    if (cliente.razonSocial && cliente.razonSocial.trim()) {
      return cliente.razonSocial;
    }
    const parts = [cliente.nombre, cliente.apellido].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Cliente no disponible';
  };

  const getUsuarioFullName = (usuario) => {
    if (!usuario) return 'Vendedor no disponible';
    const parts = [usuario.nombre, usuario.apellido].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Vendedor no disponible';
  };

  const safeParseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const filteredSales = sales.filter(sale => {
    const clientName = sale.cliente ? getClientFullName(sale.cliente) : '';
    const usuarioName = sale.usuario ? getUsuarioFullName(sale.usuario) : '';
    const matchesSearch =
      searchTerm === '' ||
      (sale.numeroVenta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       usuarioName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || sale.estado === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || sale.metodoPago === paymentMethodFilter;
    const matchesClient = clientFilter === 'all' || (sale.cliente?.id?.toString() === clientFilter);
    const saleDate = safeParseDate(sale.fechaVenta);
    if (!saleDate) return false;
    const toDateEndOfDay = dateToFilter ? new Date(dateToFilter) : null;
    if (toDateEndOfDay) {
      toDateEndOfDay.setHours(23, 59, 59, 999);
    }
    const matchesDateFrom = !dateFromFilter || saleDate >= dateFromFilter;
    const matchesDateTo = !toDateEndOfDay || saleDate <= toDateEndOfDay;
    return matchesSearch && matchesStatus && matchesPaymentMethod &&
           matchesClient && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setClientFilter('all');
    setDateFromFilter(null);
    setDateToFilter(null);
  };

  const calculateTotals = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalTransactions = filteredSales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    return { totalRevenue, totalTransactions, averageOrderValue };
  };

  const { totalRevenue, totalTransactions, averageOrderValue } = calculateTotals();

  const generateSalesReport = () => {
    const groupedSales = {};
    filteredSales.forEach(sale => {
      const saleDate = safeParseDate(sale.fechaVenta) || new Date();
      let key = '';
      switch (groupBy) {
        case 'day':
          key = saleDate.toLocaleDateString();
          break;
        case 'week':
          key = `Semana ${Math.ceil(saleDate.getDate() / 7)}`;
          break;
        case 'month':
          key = saleDate.toLocaleString('default', { month: 'long' });
          break;
        case 'year':
          key = saleDate.getFullYear().toString();
          break;
        case 'status':
          key = getStatusLabel(sale.estado);
          break;
        case 'payment':
          key = getPaymentMethodLabel(sale.metodoPago);
          break;
        case 'client':
          key = getClientFullName(sale.cliente);
          break;
        case 'seller':
          key = getUsuarioFullName(sale.usuario);
          break;
        default:
          key = 'Todos';
      }
      if (!groupedSales[key]) {
        groupedSales[key] = { count: 0, total: 0 };
      }
      groupedSales[key].count += 1;
      groupedSales[key].total += sale.total || 0;
    });
    return groupedSales;
  };

  const salesReport = generateSalesReport();

  // Prepare chart data
  const chartData = {
    labels: Object.keys(salesReport),
    datasets: [
      {
        label: 'Total Ventas ($)',
        data: Object.values(salesReport).map(item => item.total),
        backgroundColor: chartType === 'pie' ? [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        ] : 'rgba(75, 192, 192, 0.6)',
        borderColor: chartType === 'pie' ? [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        ] : 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: chartType === 'line' ? false : true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Ventas por ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`,
      },
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total ($)',
        },
      },
      x: {
        title: {
          display: true,
          text: groupBy.charAt(0).toUpperCase() + groupBy.slice(1),
        },
      },
    } : {},
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <BarChartIcon />
          Informe de Ventas
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => alert('Función de exportación en desarrollo')}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuración del Informe
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Informe</InputLabel>
                <Select
                  value={reportType}
                  label="Tipo de Informe"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="summary">Resumen</MenuItem>
                  <MenuItem value="detailed">Detallado</MenuItem>
                  <MenuItem value="comparative">Comparativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Agrupar por</InputLabel>
                <Select
                  value={groupBy}
                  label="Agrupar por"
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <MenuItem value="day">Día</MenuItem>
                  <MenuItem value="week">Semana</MenuItem>
                  <MenuItem value="month">Mes</MenuItem>
                  <MenuItem value="year">Año</MenuItem>
                  <MenuItem value="status">Estado</MenuItem>
                  <MenuItem value="payment">Método de Pago</MenuItem>
                  <MenuItem value="client">Cliente</MenuItem>
                  <MenuItem value="seller">Vendedor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Gráfico</InputLabel>
                <Select
                  value={chartType}
                  label="Tipo de Gráfico"
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <MenuItem value="bar">Barras</MenuItem>
                  <MenuItem value="pie">Torta</MenuItem>
                  <MenuItem value="line">Líneas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoneyIcon color="primary" />
                <Box>
                  <Typography variant="h6">${totalRevenue.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ingresos Totales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ShoppingCartIcon color="success" />
                <Box>
                  <Typography variant="h6">{totalTransactions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Ventas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="warning" />
                <Box>
                  <Typography variant="h6">${averageOrderValue.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor Promedio
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterListIcon />
            <Typography variant="h6">Filtros</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número, cliente..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="ENVIADA">Enviada</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  <MenuItem value="ENTREGADA">Entregada</MenuItem>
                  <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  label="Método de Pago"
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="CASH">Efectivo</MenuItem>
                  <MenuItem value="CREDIT_CARD">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="DEBIT_CARD">Tarjeta de Débito</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Transferencia</MenuItem>
                  <MenuItem value="CHECK">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={clientFilter}
                  label="Cliente"
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {getClientFullName(client)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Desde"
                  value={dateFromFilter}
                  onChange={(newValue) => setDateFromFilter(newValue)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Hasta"
                  value={dateToFilter}
                  onChange={(newValue) => setDateToFilter(newValue)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
          <Box mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Visualización del Informe
          </Typography>
          <Box sx={{ height: 400, mb: 3 }}>
            {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
            {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
            {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</TableCell>
                  <TableCell align="right">Cantidad de Ventas</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Porcentaje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(salesReport).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell align="right">{value.count}</TableCell>
                    <TableCell align="right">${value.total.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {totalRevenue > 0 ? ((value.total / totalRevenue) * 100).toFixed(2) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>{totalTransactions}</strong></TableCell>
                  <TableCell align="right"><strong>${totalRevenue.toLocaleString()}</strong></TableCell>
                  <TableCell align="right"><strong>100%</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detalle de Ventas ({filteredSales.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Método de Pago</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{sale.id}
                      </Typography>
                      {sale.numeroVenta && (
                        <Typography variant="caption" color="text.secondary">
                          {sale.numeroVenta}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getClientFullName(sale.cliente)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getUsuarioFullName(sale.usuario)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(sale.estado)}
                        color={getStatusColor(sale.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${(sale.total || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentMethodLabel(sale.metodoPago)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSale(sale)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No se encontraron ventas que coincidan con los filtros aplicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de la Venta #{viewingSale?.id}
        </DialogTitle>
        <DialogContent>
          {viewingSale && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Información General
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography><strong>Número:</strong> {viewingSale.numeroVenta || 'N/A'}</Typography>
                    <Typography><strong>Fecha:</strong> {new Date(viewingSale.fechaVenta).toLocaleDateString()}</Typography>
                    <Typography><strong>Estado:</strong> {getStatusLabel(viewingSale.estado)}</Typography>
                    <Typography><strong>Método de Pago:</strong> {getPaymentMethodLabel(viewingSale.metodoPago)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cliente y Vendedor
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <strong>Cliente:</strong> {getClientFullName(viewingSale.cliente)}
                    </Typography>
                    {viewingSale.cliente?.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {viewingSale.cliente.email}
                      </Typography>
                    )}
                    <Typography sx={{ mt: 2 }}>
                      <strong>Vendedor:</strong> {getUsuarioFullName(viewingSale.usuario)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {viewingSale.detalleVentas && viewingSale.detalleVentas.length > 0 ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    Productos ({viewingSale.detalleVentas.length} artículos)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Precio Unit.</TableCell>
                          <TableCell align="right">Descuento</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingSale.detalleVentas.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell>
                              <Typography variant="body2">
                                {item.producto?.nombre || 'Producto no disponible'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">{item.cantidad}</TableCell>
                            <TableCell align="right">${item.precioUnitario?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell align="right">{item.descuento || 0}%</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                ${item.subtotal?.toFixed(2) || '0.00'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Alert severity="info">
                  No hay productos asociados a esta venta
                </Alert>
              )}

              <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  {viewingSale.notas && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notas
                      </Typography>
                      <Typography variant="body2">
                        {viewingSale.notas}
                      </Typography>
                    </>
                  )}
                </Box>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  Total: ${(viewingSale.total || 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => alert('Función de impresión en desarrollo')}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InformeVentasPage;