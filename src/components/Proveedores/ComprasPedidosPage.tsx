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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { supplierApiWithFallback as supplierApi } from '../../api/services/apiWithFallback';
import type { Supplier } from '../../types';

dayjs.locale('es');

// Purchase Order interface
interface OrdenCompra {
  id: number;
  numero: string;
  supplierId: number;
  supplier?: Supplier;
  fechaCreacion: string;
  fechaEntregaEstimada: string;
  fechaEntregaReal?: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'EN_TRANSITO' | 'ENTREGADA' | 'CANCELADA';
  total: number;
  observaciones?: string;
  items: OrdenCompraItem[];
  createdBy: string;
}

interface OrdenCompraItem {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

const ComprasPedidosPage: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(30, 'day'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());
  const [openOrdenDialog, setOpenOrdenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Mock data for purchase orders
  const mockOrdenes: OrdenCompra[] = [
    {
      id: 1,
      numero: 'OC-2024-001',
      supplierId: 1,
      fechaCreacion: '2024-01-15',
      fechaEntregaEstimada: '2024-01-25',
      fechaEntregaReal: '2024-01-24',
      estado: 'ENTREGADA',
      total: 125000,
      observaciones: 'Entrega urgente',
      createdBy: 'María González',
      items: [
        {
          id: 1,
          descripcion: 'Laptop HP ProBook 450',
          cantidad: 5,
          precioUnitario: 20000,
          subtotal: 100000
        },
        {
          id: 2,
          descripcion: 'Mouse óptico inalámbrico',
          cantidad: 10,
          precioUnitario: 2500,
          subtotal: 25000
        }
      ]
    },
    {
      id: 2,
      numero: 'OC-2024-002',
      supplierId: 2,
      fechaCreacion: '2024-02-01',
      fechaEntregaEstimada: '2024-02-15',
      estado: 'EN_TRANSITO',
      total: 85000,
      observaciones: 'Material para obra nueva',
      createdBy: 'Carlos López',
      items: [
        {
          id: 3,
          descripcion: 'Cemento Portland',
          cantidad: 20,
          precioUnitario: 3500,
          subtotal: 70000
        },
        {
          id: 4,
          descripcion: 'Arena gruesa m³',
          cantidad: 5,
          precioUnitario: 3000,
          subtotal: 15000
        }
      ]
    },
    {
      id: 3,
      numero: 'OC-2024-003',
      supplierId: 4,
      fechaCreacion: '2024-02-10',
      fechaEntregaEstimada: '2024-02-20',
      estado: 'CONFIRMADA',
      total: 450000,
      observaciones: 'Equipos para nueva sucursal',
      createdBy: 'Ana Rodríguez',
      items: [
        {
          id: 5,
          descripcion: 'Servidor Dell PowerEdge',
          cantidad: 2,
          precioUnitario: 180000,
          subtotal: 360000
        },
        {
          id: 6,
          descripcion: 'Switch Cisco 24 puertos',
          cantidad: 3,
          precioUnitario: 30000,
          subtotal: 90000
        }
      ]
    },
    {
      id: 4,
      numero: 'OC-2024-004',
      supplierId: 3,
      fechaCreacion: '2024-02-12',
      fechaEntregaEstimada: '2024-02-25',
      estado: 'PENDIENTE',
      total: 95000,
      createdBy: 'Roberto Silva',
      items: [
        {
          id: 7,
          descripcion: 'Herramientas industriales',
          cantidad: 1,
          precioUnitario: 95000,
          subtotal: 95000
        }
      ]
    }
  ];

  const [newOrden, setNewOrden] = useState({
    supplierId: '',
    fechaEntregaEstimada: dayjs().add(15, 'day'),
    observaciones: '',
    items: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const suppliersData = await supplierApi.getAll();
      setSuppliers(suppliersData);
      
      // Add supplier data to orders
      const ordenesWithSuppliers = mockOrdenes.map(orden => ({
        ...orden,
        supplier: suppliersData.find(s => s.id === orden.supplierId)
      }));
      setOrdenes(ordenesWithSuppliers);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrden = (orden: OrdenCompra) => {
    setSelectedOrden(orden);
    setOpenViewDialog(true);
  };

  const handleEditOrden = (orden: OrdenCompra) => {
    setSelectedOrden(orden);
    setIsEditMode(true);
    setNewOrden({
      supplierId: orden.supplierId.toString(),
      fechaEntregaEstimada: dayjs(orden.fechaEntregaEstimada),
      observaciones: orden.observaciones || '',
      items: orden.items.map(item => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      }))
    });
    setOpenOrdenDialog(true);
  };

  const handleSaveOrden = () => {
    try {
      const supplier = suppliers.find(s => s.id === parseInt(newOrden.supplierId));
      if (!supplier) return;

      const items = newOrden.items.map((item, index) => ({
        id: Date.now() + index,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario
      }));

      const total = items.reduce((sum, item) => sum + item.subtotal, 0);

      const ordenData: OrdenCompra = {
        id: isEditMode ? selectedOrden!.id : Date.now(),
        numero: isEditMode ? selectedOrden!.numero : `OC-2024-${String(ordenes.length + 1).padStart(3, '0')}`,
        supplierId: parseInt(newOrden.supplierId),
        supplier,
        fechaCreacion: isEditMode ? selectedOrden!.fechaCreacion : new Date().toISOString().split('T')[0],
        fechaEntregaEstimada: newOrden.fechaEntregaEstimada.format('YYYY-MM-DD'),
        estado: isEditMode ? selectedOrden!.estado : 'PENDIENTE',
        total,
        observaciones: newOrden.observaciones,
        items,
        createdBy: 'Usuario Actual'
      };

      if (isEditMode) {
        setOrdenes(ordenes.map(o => o.id === selectedOrden!.id ? ordenData : o));
      } else {
        setOrdenes([ordenData, ...ordenes]);
      }

      setOpenOrdenDialog(false);
      setIsEditMode(false);
      setSelectedOrden(null);
      setNewOrden({
        supplierId: '',
        fechaEntregaEstimada: dayjs().add(15, 'day'),
        observaciones: '',
        items: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
      });
    } catch (err) {
      setError('Error al guardar la orden');
      console.error('Error saving order:', err);
    }
  };

  const handleAddItem = () => {
    setNewOrden({
      ...newOrden,
      items: [...newOrden.items, { descripcion: '', cantidad: 1, precioUnitario: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setNewOrden({
      ...newOrden,
      items: newOrden.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newOrden.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewOrden({ ...newOrden, items: updatedItems });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'warning';
      case 'CONFIRMADA': return 'info';
      case 'EN_TRANSITO': return 'primary';
      case 'ENTREGADA': return 'success';
      case 'CANCELADA': return 'error';
      default: return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <ScheduleIcon />;
      case 'CONFIRMADA': return <CheckIcon />;
      case 'EN_TRANSITO': return <ShippingIcon />;
      case 'ENTREGADA': return <CheckIcon />;
      case 'CANCELADA': return <CancelIcon />;
      default: return <ReceiptIcon />;
    }
  };

  const filteredOrdenes = ordenes.filter(orden => {
    const matchesSearch = 
      orden.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orden.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesEstado = !estadoFilter || orden.estado === estadoFilter;
    const matchesSupplier = !supplierFilter || orden.supplierId.toString() === supplierFilter;
    
    const fechaOrden = dayjs(orden.fechaCreacion);
    const matchesFecha = 
      (!fechaDesde || fechaOrden.isAfter(fechaDesde.subtract(1, 'day'))) &&
      (!fechaHasta || fechaOrden.isBefore(fechaHasta.add(1, 'day')));

    return matchesSearch && matchesEstado && matchesSupplier && matchesFecha;
  });

  const getTotalAmount = () => {
    return filteredOrdenes.reduce((sum, orden) => sum + orden.total, 0);
  };

  const getOrderCountByStatus = (status: string) => {
    return ordenes.filter(orden => orden.estado === status).length;
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
            <ShoppingCartIcon sx={{ mr: 2 }} />
            Compras y Pedidos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setIsEditMode(false);
              setSelectedOrden(null);
              setOpenOrdenDialog(true);
            }}
          >
            Nueva Orden de Compra
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pendientes</Typography>
              </Box>
              <Typography variant="h4">
                {getOrderCountByStatus('PENDIENTE')}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ShippingIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">En Tránsito</Typography>
              </Box>
              <Typography variant="h4">
                {getOrderCountByStatus('EN_TRANSITO')}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Entregadas</Typography>
              </Box>
              <Typography variant="h4">
                {getOrderCountByStatus('ENTREGADA')}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Filtrado</Typography>
              </Box>
              <Typography variant="h4">
                ${getTotalAmount().toLocaleString()}
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
              label="Estado"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
              <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
              <MenuItem value="ENTREGADA">Entregada</MenuItem>
              <MenuItem value="CANCELADA">Cancelada</MenuItem>
            </TextField>

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

        {/* Orders Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Proveedor</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Entrega Estimada</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrdenes.map((orden) => (
                <TableRow key={orden.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {orden.numero}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {orden.supplier?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {orden.supplier?.contactPerson}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(orden.fechaCreacion).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(orden.fechaEntregaEstimada).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getEstadoIcon(orden.estado)}
                      label={orden.estado}
                      color={getEstadoColor(orden.estado) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">
                      ${orden.total.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewOrden(orden)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditOrden(orden)}
                      color="default"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredOrdenes.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron órdenes de compra
            </Typography>
          </Box>
        )}

        {/* New/Edit Order Dialog */}
        <Dialog open={openOrdenDialog} onClose={() => setOpenOrdenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {isEditMode ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
          </DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <TextField
                fullWidth
                select
                label="Proveedor"
                value={newOrden.supplierId}
                onChange={(e) => setNewOrden({ ...newOrden, supplierId: e.target.value })}
                margin="normal"
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>

              <DatePicker
                label="Fecha de Entrega Estimada"
                value={newOrden.fechaEntregaEstimada}
                onChange={(date) => setNewOrden({ ...newOrden, fechaEntregaEstimada: date || dayjs() })}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />

              <TextField
                fullWidth
                label="Observaciones"
                value={newOrden.observaciones}
                onChange={(e) => setNewOrden({ ...newOrden, observaciones: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Items de la Orden
              </Typography>

              {newOrden.items.map((item, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="Descripción"
                      value={item.descripcion}
                      onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      label="Precio Unit."
                      type="number"
                      value={item.precioUnitario}
                      onChange={(e) => handleItemChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ width: 120 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 80 }}>
                      ${(item.cantidad * item.precioUnitario).toLocaleString()}
                    </Typography>
                    <IconButton 
                      onClick={() => handleRemoveItem(index)}
                      disabled={newOrden.items.length === 1}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              ))}

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ mb: 2 }}
              >
                Agregar Item
              </Button>

              <Box sx={{ textAlign: 'right', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6">
                  Total: ${newOrden.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOrdenDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveOrden}
              disabled={!newOrden.supplierId || newOrden.items.some(item => !item.descripcion)}
            >
              {isEditMode ? 'Actualizar' : 'Crear'} Orden
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Order Dialog */}
        <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Orden de Compra {selectedOrden?.numero}
          </DialogTitle>
          <DialogContent>
            {selectedOrden && (
              <Box pt={2}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Información General
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Proveedor</Typography>
                      <Typography variant="body1">{selectedOrden.supplier?.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Estado</Typography>
                      <Chip
                        icon={getEstadoIcon(selectedOrden.estado)}
                        label={selectedOrden.estado}
                        color={getEstadoColor(selectedOrden.estado) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Fecha Creación</Typography>
                      <Typography variant="body1">{new Date(selectedOrden.fechaCreacion).toLocaleDateString()}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Entrega Estimada</Typography>
                      <Typography variant="body1">{new Date(selectedOrden.fechaEntregaEstimada).toLocaleDateString()}</Typography>
                    </Box>
                    {selectedOrden.fechaEntregaReal && (
                      <>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Entrega Real</Typography>
                          <Typography variant="body1">{new Date(selectedOrden.fechaEntregaReal).toLocaleDateString()}</Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                  {selectedOrden.observaciones && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Observaciones</Typography>
                      <Typography variant="body1">{selectedOrden.observaciones}</Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Items de la Orden
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
                      {selectedOrden.items.map((item) => (
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
                          ${selectedOrden.total.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenViewDialog(false)}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ComprasPedidosPage;
