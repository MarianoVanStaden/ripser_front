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
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { supplierApiWithFallback as supplierApi } from '../../api/services/apiWithFallback';
import { compraApi } from '../../api/services/compraApi';
import type { Supplier, CompraDTO } from '../../types';

dayjs.locale('es');

interface CompraHistorial {
  id: number;
  numero: string;
  supplierId: number;
  supplier?: Supplier;
  fecha: string;
  total: number;
  estado: string;
  metodoPago: string;
  observaciones?: string;
  items: CompraItem[];
}

interface CompraItem {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface EstadisticasCompra {
  totalCompras: number;
  montoTotal: number;
  promedioMensual: number;
  proveedorTop: Supplier | null;
  categoriaTop: string;
  tendencia: 'subiendo' | 'bajando' | 'estable';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`historial-tabpanel-${index}`}
      aria-labelledby={`historial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const HistorialComprasPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [compras, setCompras] = useState<CompraHistorial[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(6, 'month'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());
  const [tabValue, setTabValue] = useState(0);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<CompraHistorial | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const suppliersData = await supplierApi.getAll();
      setSuppliers(suppliersData);

      // Get compras from API
      const comprasData: CompraDTO[] = await compraApi.getAll();

      // Map API data to CompraHistorial
      const comprasWithSuppliers: CompraHistorial[] = comprasData.map(compra => ({
        id: compra.id,
        numero: compra.numero || `COMP-${compra.id}`,
        supplierId: compra.proveedorId,
        supplier: suppliersData.find(s => s.id === compra.proveedorId),
        fecha: compra.fechaCreacion || compra.fechaEntrega || '',
        total: compra.detalles.reduce((sum, item) => sum + item.cantidad * item.costoUnitario, 0),
        estado: compra.estado,
        metodoPago: compra.metodoPago || 'Sin método',
        observaciones: compra.observaciones,
        items: compra.detalles.map(item => ({
          id: item.id,
          descripcion: item.nombreProductoTemporal || item.descripcionProductoTemporal || '',
          cantidad: item.cantidad,
          precioUnitario: item.costoUnitario,
          subtotal: item.cantidad * item.costoUnitario,
        })),
      }));

      setCompras(comprasWithSuppliers);

      // Calculate statistics
      calculateEstadisticas(comprasWithSuppliers, suppliersData);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstadisticas = (comprasData: CompraHistorial[], suppliersData: Supplier[]) => {
    const totalCompras = comprasData.length;
    const montoTotal = comprasData.reduce((sum, compra) => sum + compra.total, 0);
    const promedioMensual = montoTotal / 6; // Assuming 6 months of data

    // Find top supplier by total purchases
    const supplierTotals = comprasData.reduce((acc, compra) => {
      acc[compra.supplierId] = (acc[compra.supplierId] || 0) + compra.total;
      return acc;
    }, {} as Record<number, number>);

    const topSupplierId = Object.entries(supplierTotals).reduce((a, b) =>
      supplierTotals[parseInt(a[0])] > supplierTotals[parseInt(b[0])] ? a : b
    )[0];

    const proveedorTop = suppliersData.find(s => s.id === parseInt(topSupplierId)) || null;

    setEstadisticas({
      totalCompras,
      montoTotal,
      promedioMensual,
      proveedorTop,
      categoriaTop: 'Tecnología',
      tendencia: 'subiendo'
    });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetail = (compra: CompraHistorial) => {
    setSelectedCompra(compra);
    setOpenDetailDialog(true);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PAGADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'VENCIDA': return 'error';
      default: return 'default';
    }
  };

  const filteredCompras = compras.filter(compra => {
    const matchesSearch =
      compra.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (compra.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesSupplier = !supplierFilter || compra.supplierId.toString() === supplierFilter;
    const matchesEstado = !estadoFilter || compra.estado === estadoFilter;

    const fechaCompra = dayjs(compra.fecha);
    const matchesFecha =
      (!fechaDesde || fechaCompra.isAfter(fechaDesde.subtract(1, 'day'))) &&
      (!fechaHasta || fechaCompra.isBefore(fechaHasta.add(1, 'day')));

    return matchesSearch && matchesSupplier && matchesEstado && matchesFecha;
  });

  const getTotalFilteredAmount = () => {
    return filteredCompras.reduce((sum, compra) => sum + compra.total, 0);
  };

  const getComprasPorEstado = (estado: string) => {
    return filteredCompras.filter(compra => compra.estado === estado).length;
  };

  const getTopSuppliersByAmount = () => {
    const supplierTotals = filteredCompras.reduce((acc, compra) => {
      const supplierId = compra.supplierId;
      const supplierName = compra.supplier?.name || 'Sin nombre';
      if (!acc[supplierId]) {
        acc[supplierId] = { name: supplierName, total: 0, compras: 0 };
      }
      acc[supplierId].total += compra.total;
      acc[supplierId].compras += 1;
      return acc;
    }, {} as Record<number, { name: string; total: number; compras: number }>);

    return Object.entries(supplierTotals)
      .map(([id, data]) => ({ id: parseInt(id), ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
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
            <TimelineIcon sx={{ mr: 2 }} />
            Historial de Compras
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Exportar
            </Button>
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={2}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Historial de Compras" />
            <Tab label="Estadísticas" />
            <Tab label="Análisis por Proveedor" />
          </Tabs>

          {/* Purchase History Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Summary Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ReceiptIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Compras</Typography>
                  </Box>
                  <Typography variant="h4">
                    {getComprasPorEstado('PAGADA') + getComprasPorEstado('PENDIENTE') + getComprasPorEstado('VENCIDA')}
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <MoneyIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Monto Total</Typography>
                  </Box>
                  <Typography variant="h4">
                    ${getTotalFilteredAmount().toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Pagadas</Typography>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {getComprasPorEstado('PAGADA')}
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6">Pendientes</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {getComprasPorEstado('PENDIENTE') + getComprasPorEstado('VENCIDA')}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Filters */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
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
                  label="Proveedor"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PAGADA">Pagada</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="VENCIDA">Vencida</MenuItem>
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
              </Box>
            </Paper>

            {/* Purchases Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Método de Pago</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCompras.map((compra) => (
                    <TableRow key={compra.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {compra.numero}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Typography variant="body2">
                            {compra.supplier?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(compra.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{compra.metodoPago}</TableCell>
                      <TableCell>
                        <Chip
                          label={compra.estado}
                          color={getEstadoColor(compra.estado) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          ${compra.total.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetail(compra)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredCompras.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No se encontraron compras en el período seleccionado
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Statistics Tab */}
          <TabPanel value={tabValue} index={1}>
            {estadisticas && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Estadísticas Generales
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Resumen de Compras
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total de Compras
                        </Typography>
                        <Typography variant="h4">
                          {estadisticas.totalCompras}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Monto Total
                        </Typography>
                        <Typography variant="h4">
                          ${estadisticas.montoTotal.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Promedio Mensual
                        </Typography>
                        <Typography variant="h4">
                          ${estadisticas.promedioMensual.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Proveedor Principal
                      </Typography>
                      {estadisticas.proveedorTop && (
                        <Box display="flex" alignItems="center" mb={2}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {estadisticas.proveedorTop.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {estadisticas.proveedorTop.contactPerson}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Categoría más comprada
                        </Typography>
                        <Typography variant="h6">
                          {estadisticas.categoriaTop}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* Monthly trend visualization would go here */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tendencia de Compras
                    </Typography>
                    <Box display="flex" alignItems="center" mb={2}>
                      {estadisticas.tendencia === 'subiendo' ? (
                        <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                      ) : estadisticas.tendencia === 'bajando' ? (
                        <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                      ) : (
                        <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="body1">
                        Las compras están {estadisticas.tendencia === 'subiendo' ? 'aumentando' : estadisticas.tendencia === 'bajando' ? 'disminuyendo' : 'estables'} respecto al período anterior
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={estadisticas.tendencia === 'subiendo' ? 75 : estadisticas.tendencia === 'bajando' ? 25 : 50}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </CardContent>
                </Card>
              </Box>
            )}
          </TabPanel>

          {/* Supplier Analysis Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Análisis por Proveedor
            </Typography>

            <List>
              {getTopSuppliersByAmount().map((supplier, index) => (
                <React.Fragment key={supplier.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={supplier.name}
                      secondary={`${supplier.compras} compras realizadas`}
                    />
                    <ListItemSecondaryAction>
                      <Box textAlign="right">
                        <Typography variant="h6">
                          ${supplier.total.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Promedio: ${Math.round(supplier.total / supplier.compras).toLocaleString()}
                        </Typography>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < getTopSuppliersByAmount().length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>
        </Paper>

        {/* Purchase Detail Dialog */}
        <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Detalle de Compra {selectedCompra?.numero}
          </DialogTitle>
          <DialogContent>
            {selectedCompra && (
              <Box pt={2}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Información General
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Proveedor</Typography>
                      <Typography variant="body1">{selectedCompra.supplier?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Estado</Typography>
                      <Chip
                        label={selectedCompra.estado}
                        color={getEstadoColor(selectedCompra.estado) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fecha</Typography>
                      <Typography variant="body1">{new Date(selectedCompra.fecha).toLocaleDateString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Método de Pago</Typography>
                      <Typography variant="body1">{selectedCompra.metodoPago}</Typography>
                    </Box>
                  </Box>
                  {selectedCompra.observaciones && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Observaciones</Typography>
                      <Typography variant="body1">{selectedCompra.observaciones}</Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Items Comprados
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="right">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedCompra.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.descripcion}</TableCell>
                          <TableCell align="right">{item.cantidad}</TableCell>
                          <TableCell align="right">${item.precioUnitario.toLocaleString()}</TableCell>
                          <TableCell align="right">${item.subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${selectedCompra.total.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default HistorialComprasPage;
