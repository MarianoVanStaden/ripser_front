import React, { useState, useEffect, useMemo } from 'react';
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
  TablePagination,
  Menu,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Receipt as ReceiptIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { supplierApi } from '../../api/services/supplierApi';
import { compraApi } from '../../api/services/compraApi';
import { productApi } from '../../api/services/productApi';
import type { ProveedorDTO, CompraDTO, Producto } from '../../types';
import { exportToPDF } from '../../utils/exportPDF';
import { exportToExcel } from '../../utils/exportExcel';
import LoadingOverlay from '../common/LoadingOverlay';

dayjs.locale('es');

interface CompraHistorial {
  id: number;
  numero: string;
  supplierId: number;
  supplier?: ProveedorDTO;
  fecha: string;
  total: number;
  estado: string;
  metodoPago: string;
  observaciones?: string;
  items: CompraItem[];
}

interface CompraItem {
  id: number;
  productoId?: number;
  descripcion: string;
  codigo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface EstadisticasCompra {
  totalCompras: number;
  montoTotal: number;
  promedioMensual: number;
  proveedorTop: ProveedorDTO | null;
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
  const [suppliers, setSuppliers] = useState<ProveedorDTO[]>([]);
  const [_productos, setProductos] = useState<Producto[]>([]);
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

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Export menu states
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [suppliersData, productosPage, comprasResponse] = await Promise.all([
        supplierApi.getAll(),
        productApi.getAll({ size: 10000 }),
        compraApi.getAll({ size: 1000 }),
      ]);

      const suppliersList = Array.isArray(suppliersData) ? suppliersData : [];
      setSuppliers(suppliersList);

      const productosList: Producto[] = Array.isArray(productosPage)
        ? productosPage
        : (productosPage?.content ?? []);
      setProductos(productosList);

      const comprasData = (comprasResponse.content ?? []) as unknown as CompraDTO[];

      // Map API data to CompraHistorial, ordenado de más nuevo a más viejo
      const comprasWithSuppliers: CompraHistorial[] = comprasData
        .slice()
        .sort((a, b) => {
          const fa = (a as any).fechaCreacion || a.fechaEntrega || '';
          const fb = (b as any).fechaCreacion || b.fechaEntrega || '';
          return dayjs(fb).diff(dayjs(fa));
        })
        .map(compra => {
          const detalles = compra.detalles || [];
          return {
            id: compra.id,
            numero: compra.numero || `COMP-${compra.id}`,
            supplierId: compra.proveedorId,
            supplier: suppliersList.find(s => s.id === compra.proveedorId) as unknown as ProveedorDTO,
            fecha: (compra as any).fechaCreacion || compra.fechaEntrega || '',
            total: detalles.reduce((sum, item) => sum + (item.cantidad || 0) * (item.costoUnitario || 0), 0),
            estado: compra.estado,
            metodoPago: compra.metodoPago || 'Sin método',
            observaciones: compra.observaciones,
            items: detalles.map(item => {
              const producto = (item as any).productoId
                ? productosList.find(p => p.id === (item as any).productoId)
                : null;
              return {
                id: item.id || 0,
                productoId: (item as any).productoId || undefined,
                descripcion: item.nombreProductoTemporal || item.descripcionProductoTemporal || producto?.nombre || 'Sin descripción',
                codigo: item.codigoProductoTemporal || producto?.codigo || '',
                cantidad: item.cantidad || 0,
                precioUnitario: item.costoUnitario || 0,
                subtotal: (item.cantidad || 0) * (item.costoUnitario || 0),
              };
            }),
          };
        });

      setCompras(comprasWithSuppliers);

      // Calculate statistics
      calculateEstadisticas(comprasWithSuppliers, suppliersList);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstadisticas = (comprasData: CompraHistorial[], suppliersData: ProveedorDTO[]) => {
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
      case 'PAGADA':
      case 'RECIBIDA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'CONFIRMADA': return 'info';
      case 'EN_TRANSITO': return 'primary';
      case 'VENCIDA':
      case 'CANCELADA': return 'error';
      default: return 'default';
    }
  };

  const filteredCompras = useMemo(() => {
    return compras.filter(compra => {
      const matchesSearch =
        compra.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (compra.supplier?.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesSupplier = !supplierFilter || compra.supplierId.toString() === supplierFilter;
      const matchesEstado = !estadoFilter || compra.estado === estadoFilter;

      const fechaCompra = dayjs(compra.fecha);
      const matchesFecha =
        (!fechaDesde || fechaCompra.isAfter(fechaDesde.subtract(1, 'day'))) &&
        (!fechaHasta || fechaCompra.isBefore(fechaHasta.add(1, 'day')));

      return matchesSearch && matchesSupplier && matchesEstado && matchesFecha;
    });
  }, [compras, searchTerm, supplierFilter, estadoFilter, fechaDesde, fechaHasta]);

  // Paginate filtered compras
  const paginatedCompras = useMemo(() => {
    return filteredCompras.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredCompras, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTotalFilteredAmount = () => {
    return filteredCompras.reduce((sum, compra) => sum + compra.total, 0);
  };

  const getComprasPorEstado = (estado: string) => {
    return filteredCompras.filter(compra => compra.estado === estado).length;
  };

  const getTopSuppliersByAmount = () => {
    const supplierTotals = filteredCompras.reduce((acc, compra) => {
      const supplierId = compra.supplierId;
      const supplierName = compra.supplier?.razonSocial || 'Sin nombre';
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

  // Export handlers
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportPDF = () => {
    const columns = ['Fecha', 'Proveedor', 'Items', 'Total', 'Estado'];
    const rows = filteredCompras.map(compra => [
      dayjs(compra.fecha).format('DD/MM/YYYY'),
      compra.supplier?.razonSocial || 'Sin nombre',
      compra.items.length > 0 
        ? `${compra.items.length} item(s): ${compra.items.map(i => i.descripcion || 'Sin descripción').join(', ')}`
        : 'Sin items',
      `$${compra.total.toLocaleString('es-AR')}`,
      compra.estado
    ]);

    exportToPDF({
      title: 'Historial de Compras',
      subtitle: `Período: ${fechaDesde?.format('DD/MM/YYYY') || 'Inicio'} - ${fechaHasta?.format('DD/MM/YYYY') || 'Fin'}`,
      fileName: `historial_compras_${dayjs().format('YYYY-MM-DD')}`,
      tables: [{
        headers: columns,
        rows: rows,
        footerText: `Total de compras: ${filteredCompras.length} | Monto total: $${getTotalFilteredAmount().toLocaleString('es-AR')}`
      }]
    });
    handleExportClose();
  };

  const handleExportExcel = async () => {
    const excelData = filteredCompras.map(compra => ({
      'Fecha': dayjs(compra.fecha).format('DD/MM/YYYY'),
      'Proveedor': compra.supplier?.razonSocial || 'Sin nombre',
      'Cantidad Items': compra.items.length,
      'Detalle Items': compra.items.map(i => `${i.descripcion || 'Sin descripción'} x${i.cantidad}`).join('; '),
      'Total': compra.total,
      'Estado': compra.estado
    }));

    await exportToExcel({
      fileName: `historial_compras_${dayjs().format('YYYY-MM-DD')}`,
      sheets: [{
        name: 'Historial de Compras',
        data: excelData
      }],
      metadata: {
        title: 'Historial de Compras',
        filters: {
          'Proveedor': supplierFilter ? suppliers.find(s => s.id?.toString() === supplierFilter)?.razonSocial || 'Todos' : 'Todos'
        }
      }
    });
    handleExportClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={{ xs: 1.5, sm: 2, md: 3 }}>
        <LoadingOverlay open={loading} message="Cargando historial..." />
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 3 
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            <TimelineIcon sx={{ mr: 1.5, fontSize: { xs: 28, md: 35 } }} />
            Historial de Compras
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportClick}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Exportar
            </Button>
            <Menu
              anchorEl={exportAnchorEl}
              open={exportMenuOpen}
              onClose={handleExportClose}
            >
              <MenuItem onClick={handleExportPDF}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                Exportar a PDF
              </MenuItem>
              <MenuItem onClick={handleExportExcel}>
                <ListItemIcon>
                  <DownloadIcon fontSize="small" />
                </ListItemIcon>
                Exportar a Excel
              </MenuItem>
            </Menu>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                    {filteredCompras.length}
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
                    {getComprasPorEstado('PAGADA') + getComprasPorEstado('RECIBIDA')}
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
                    {getComprasPorEstado('PENDIENTE') + getComprasPorEstado('CONFIRMADA') + getComprasPorEstado('EN_TRANSITO')}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Filters */}
            <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filtros
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2, 
                  flexWrap: 'wrap', 
                  alignItems: { xs: 'stretch', sm: 'center' } 
                }}
              >
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
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                  fullWidth
                />

                <TextField
                  select
                  label="Proveedor"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                  fullWidth
                >
                  <MenuItem value="">Todos</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.razonSocial}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  sx={{ minWidth: { xs: '100%', sm: 150 } }}
                  fullWidth
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                  <MenuItem value="EN_TRANSITO">En tránsito</MenuItem>
                  <MenuItem value="RECIBIDA">Recibida</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                  <DatePicker
                    label="Desde"
                    value={fechaDesde}
                    onChange={(newValue) => setFechaDesde(newValue as Dayjs | null)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />

                  <DatePicker
                    label="Hasta"
                    value={fechaHasta}
                    onChange={(newValue) => setFechaHasta(newValue as Dayjs | null)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Box>
              </Box>
            </Paper>

            {/* Purchases Table */}
            <Card>
              <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 }, overflowX: 'auto' }}>
                <TableContainer component={Paper} sx={{ width: '100%' }}>
                  <Table sx={{ minWidth: 650 }} size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 120 }}>Número</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>Proveedor</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Fecha</TableCell>
                        <TableCell sx={{ minWidth: 140 }}>Método de Pago</TableCell>
                        <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                        <TableCell sx={{ minWidth: 120 }} align="right">Total</TableCell>
                        <TableCell sx={{ minWidth: 100 }} align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCompras.map((compra) => (
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
                                {compra.supplier?.razonSocial || 'Sin nombre'}
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
                      {filteredCompras.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Box textAlign="center" py={4}>
                              <Typography variant="body1" color="text.secondary">
                                No se encontraron compras en el período seleccionado
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={filteredCompras.length}
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
              </CardContent>
            </Card>
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
                              {estadisticas.proveedorTop.razonSocial}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {estadisticas.proveedorTop.email}
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
                      <Typography variant="body1">{selectedCompra.supplier?.razonSocial || 'Sin nombre'}</Typography>
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
                      <Typography variant="body1">
                        {selectedCompra.metodoPago === 'EFECTIVO' ? 'Efectivo'
                          : selectedCompra.metodoPago === 'TARJETA_CREDITO' ? 'Tarjeta de Crédito'
                          : selectedCompra.metodoPago === 'TARJETA_DEBITO' ? 'Tarjeta de Débito'
                          : selectedCompra.metodoPago === 'TRANSFERENCIA_BANCARIA' ? 'Transferencia Bancaria'
                          : selectedCompra.metodoPago === 'CHEQUE' ? 'Cheque'
                          : selectedCompra.metodoPago === 'FINANCIACION_PROPIA' ? 'Financiación Propia'
                          : selectedCompra.metodoPago || 'Sin método'}
                      </Typography>
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
                {selectedCompra.items.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No hay items detallados para esta compra.
                  </Alert>
                ) : (
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
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.descripcion}
                              </Typography>
                              {item.codigo && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Código: {item.codigo}
                                </Typography>
                              )}
                            </TableCell>
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
                )}
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
