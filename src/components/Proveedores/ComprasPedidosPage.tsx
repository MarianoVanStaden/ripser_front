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
import { supplierApi } from '../../api/services/supplierApi';
import { compraApi} from '../../api/services/compraApi';
import type { ProveedorDTO, CompraDTO, CreateCompraDTO } from '../../types';
import Autocomplete from '@mui/material/Autocomplete';
import { productApi } from '../../api/services/productApi';
import type { OrdenCompra, ProductoDTO} from '../../types';
dayjs.locale('es');
class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Alert severity="error">Algo salió mal. Por favor, intenta de nuevo.</Alert>;
    }
    return this.props.children;
  }
}
const ComprasPedidosPage: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [compras, setCompras] = useState<CompraDTO[]>([]);
  const [productos, setProductos] = useState<ProductDTO[]>([]);
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

const [newOrden, setNewOrden] = useState({
  supplierId: '',
  fechaEntregaEstimada: dayjs().add(15, 'day'),
  observaciones: '',
  items: [{
    productoId: '',
    nombreProductoTemporal: '',
    descripcionProductoTemporal: '',
    codigoProductoTemporal: '',
    esProductoNuevo: false,
    cantidad: 1,
    precioUnitario: 0,
  }],
});

  useEffect(() => {
    loadProveedores();
    loadCompras();
    loadProductos();
  }, []);

const loadProveedores = async () => {
  try {
    setLoading(true);
    const data = await supplierApi.getAll();
    console.log('Proveedores:', data); // Debug log
    setProveedores(data);
    setError(null);
  } catch (err) {
    setError('Error al cargar los proveedores');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const loadCompras = async () => {
  try {
    setLoading(true);
    const data = await compraApi.getAll();
    console.log('Compras data:', JSON.stringify(data, null, 2));
    setCompras(data);
    setOrdenes(
      data.map((compra) => {
        console.log(`Compra ID: ${compra.id}, proveedorId: ${compra.proveedorId}, proveedor: ${JSON.stringify(compra.proveedor, null, 2)}`);
        const orden = {
          id: compra.id,
          numero: compra.numero || `COMPRA-${compra.id}`,
          proveedor: compra.proveedor,
          supplierId: compra.proveedorId
            ? compra.proveedorId.toString()
            : compra.proveedor?.id
              ? compra.proveedor.id.toString()
              : '',
          fechaCreacion: compra.fechaCreacion && dayjs(compra.fechaCreacion).isValid()
            ? compra.fechaCreacion
            : new Date().toISOString(),
          fechaEntregaEstimada: compra.fechaEntrega && dayjs(compra.fechaEntrega).isValid()
            ? compra.fechaEntrega
            : new Date().toISOString(),
          estado: compra.estado,
          total: compra.detalles.reduce((sum, item) => sum + item.cantidad * item.costoUnitario, 0),
          items: compra.detalles.map((detalle) => ({
            id: detalle.id,
            productoId: detalle.productoId ? detalle.productoId.toString() : '',
            descripcion: detalle.nombreProductoTemporal || detalle.descripcionProductoTemporal || '',
            cantidad: detalle.cantidad,
            precioUnitario: detalle.costoUnitario,
            subtotal: detalle.cantidad * detalle.costoUnitario,
          })),
          observaciones: compra.observaciones,
        };
        return orden;
      })
    );
    setError(null);
  } catch (err) {
    console.error('Error loading compras:', err);
    setError('Error al cargar las compras');
  } finally {
    setLoading(false);
  }
};

const loadProductos = async () => {
  try {
    setLoading(true);
    const data = await productApi.getAll();
    console.log('Productos response:', data); // Log the full response
    setProductos(data.content || data); // Fallback to data if content is not present
    setError(null);
  } catch (err) {
    setError('Error al cargar los productos');
    console.error(err);
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
    supplierId: orden.supplierId ? orden.supplierId.toString() : '', // Safe conversion
    fechaEntregaEstimada: dayjs(orden.fechaEntregaEstimada),
    observaciones: orden.observaciones || '',
    items: orden.items.map(item => ({
      productoId: item.productoId ? item.productoId.toString() : '', // Safe conversion
      descripcion: item.descripcion,
      nombreProductoTemporal: item.descripcion || '', // Use descripcion as fallback
      descripcionProductoTemporal: item.descripcion || '',
      codigoProductoTemporal: '',
      esProductoNuevo: !item.productoId, // Mark as new if no productoId
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }))
  });
  setOpenOrdenDialog(true);
};

const validateOrder = (orden) => {
  // Check if there are items
  if (!orden.items || orden.items.length === 0) {
    return { isValid: false, message: 'La orden debe tener al menos un item' };
  }

  // Validate each item
  for (let i = 0; i < orden.items.length; i++) {
    const item = orden.items[i];
    
    // Check if item has a product (either existing or new)
    const hasExistingProduct = item.productoId && item.productoId.trim() !== '';
    const hasNewProduct = item.esProductoNuevo && item.nombreProductoTemporal && item.nombreProductoTemporal.trim() !== '';
    
    if (!hasExistingProduct && !hasNewProduct) {
      return { 
        isValid: false, 
        message: `El item ${i + 1} debe tener un producto seleccionado o un nombre de producto nuevo` 
      };
    }
    
    // Check if item has quantity
    if (!item.cantidad || item.cantidad <= 0) {
      return { 
        isValid: false, 
        message: `El item ${i + 1} debe tener una cantidad válida` 
      };
    }
    
    // Check if item has price (important for new products)
    if (!item.precio || item.precio <= 0) {
      return { 
        isValid: false, 
        message: `El item ${i + 1} debe tener un precio válido` 
      };
    }
  }
  
  return { isValid: true };
};
const handleCrearOrden = async () => {
  try {
    // Validate the order
    const validation = validateOrder(newOrden);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    // Prepare the order data
    const orderData = {
      ...newOrden,
      items: newOrden.items.map(item => ({
        ...item,
        // Ensure we have the right product identifier
        productoId: item.esProductoNuevo ? null : item.productoId,
        nombreProducto: item.esProductoNuevo ? item.nombreProductoTemporal : item.descripcionProductoTemporal,
        esProductoNuevo: item.esProductoNuevo || false,
        cantidad: parseFloat(item.cantidad) || 0,
        precio: parseFloat(item.precio) || 0,
        subtotal: (parseFloat(item.cantidad) || 0) * (parseFloat(item.precio) || 0)
      }))
    };

    console.log('Order data to send:', orderData);

    // Send to your API
    const response = await fetch('/api/ordenes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      alert('Orden creada exitosamente');
      // Reset form or redirect
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.message || 'No se pudo crear la orden'}`);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    alert('Error al crear la orden');
  }
};
const handleSaveOrden = async () => {
  try {
    setLoading(true);

    if (!newOrden.supplierId) {
      setError('Debe seleccionar un proveedor');
      return;
    }
    if (
      newOrden.items.length === 0 ||
      newOrden.items.some(
        (item) =>
          (!item.productoId && !item.nombreProductoTemporal) ||
          item.cantidad <= 0 ||
          item.precioUnitario <= 0
      )
    ) {
      setError('Todos los items deben tener un producto (existente o nuevo), cantidad y precio unitario válidos');
      return;
    }

    const compraPayload: CreateCompraDTO = {
      proveedorId: parseInt(newOrden.supplierId),
      fechaEntrega: newOrden.fechaEntregaEstimada.format('YYYY-MM-DDTHH:mm:ss'),
      observaciones: newOrden.observaciones,
      detalles: newOrden.items.map((item) => {
        const detalle = {
          productoId: item.productoId ? parseInt(item.productoId) : undefined,
          nombreProductoTemporal: item.nombreProductoTemporal || undefined,
          descripcionProductoTemporal: item.descripcionProductoTemporal || item.nombreProductoTemporal || undefined,
          codigoProductoTemporal: item.codigoProductoTemporal || undefined,
          esProductoNuevo: !!item.nombreProductoTemporal,
          cantidad: item.cantidad,
          costoUnitario: item.precioUnitario,
        };
        console.log('Detalle:', detalle); // Debug log
        return detalle;
      }),
    };

    console.log('Compra Payload:', JSON.stringify(compraPayload, null, 2)); // Debug log

    let createdOrUpdatedCompra;
    if (isEditMode && selectedOrden?.id) {
      createdOrUpdatedCompra = await compraApi.update(selectedOrden.id, compraPayload);
      setCompras(compras.map((c) => (c.id === selectedOrden.id ? createdOrUpdatedCompra : c)));
    } else {
      createdOrUpdatedCompra = await compraApi.create(compraPayload);
      setCompras([createdOrUpdatedCompra, ...compras]);
    }

    await loadCompras();
    setOpenOrdenDialog(false);
    setIsEditMode(false);
    setSelectedOrden(null);
    setNewOrden({
      supplierId: '',
      fechaEntregaEstimada: dayjs().add(15, 'day'),
      observaciones: '',
      items: [{
        productoId: '',
        nombreProductoTemporal: '',
        descripcionProductoTemporal: '',
        codigoProductoTemporal: '',
        esProductoNuevo: false,
        cantidad: 1,
        precioUnitario: 0,
      }],
    });
    setError(null);
  } catch (err) {
    setError(`Error al guardar la compra: ${err.message}`);
    console.error('Error saving compra:', err);
  } finally {
    setLoading(false);
  }
};

  const handleAddItem = () => {
    setNewOrden({
      ...newOrden,
      items: [
        ...newOrden.items,
        { productoId: '', nombreProductoTemporal: '', cantidad: 1, precioUnitario: 0 },
      ],
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
  // If changing the product name for a new product, update descripcionProductoTemporal
  if (field === 'nombreProductoTemporal') {
    updatedItems[index].descripcionProductoTemporal = value;
    updatedItems[index].esProductoNuevo = !!value; // Mark as new product if nombreProductoTemporal is set
  }
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

const filteredOrdenes = ordenes.filter((orden) => {
  const matchesSearch =
    orden.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (orden.proveedor?.razonSocial.toLowerCase()?.includes(searchTerm.toLowerCase()) || false);

  const matchesEstado = !estadoFilter || orden.estado === estadoFilter;

  const ordenSupplierId = orden.supplierId ? orden.supplierId.toString() : '';
  const matchesSupplier = !supplierFilter || ordenSupplierId === supplierFilter;

  const fechaOrden = dayjs(orden.fechaCreacion);
  const matchesFecha =
    (!fechaDesde || fechaOrden.isAfter(fechaDesde.subtract(1, 'day'))) &&
    (!fechaHasta || fechaOrden.isBefore(fechaHasta.add(1, 'day')));

  if (!matchesSupplier && supplierFilter) {
    console.log(`Supplier mismatch: orden.supplierId=${ordenSupplierId}, supplierFilter=${supplierFilter}`);
  }

  return matchesSearch && matchesEstado && matchesSupplier && matchesFecha;
});
  const getTotalAmount = () => {
    return filteredOrdenes.reduce((sum, orden) => sum + orden.total, 0);
  };

  const getOrderCountByStatus = (status: string) => {
    return ordenes.filter(orden => orden.estado === status).length;
  };

  const handleSaveCompra = async (compraData: CreateCompraDTO) => {
    try {
      setLoading(true);
      const created = await compraApi.create(compraData);
      setCompras([created, ...compras]);
      setOpenOrdenDialog(false);
      setError(null);
    } catch (err) {
      setError('Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  };

const [openDeleteDialog, setOpenDeleteDialog] = useState<number | null>(null);

const handleDeleteCompra = async (id: number) => {
  try {
    setLoading(true);
    await compraApi.delete(id);
    setCompras(compras.filter(c => c.id !== id));
    setOpenDeleteDialog(null);
  } catch (err) {
    setError('Error al eliminar la compra');
  } finally {
    setLoading(false);
  }
};

  // Reemplaza el uso de loadData por una función que recargue proveedores y compras:
  const reloadData = async () => {
    await Promise.all([loadProveedores(), loadCompras()]);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
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
  {proveedores.map((proveedor) => (
    <MenuItem key={proveedor.id} value={proveedor.id.toString()}>
      {proveedor.razonSocial}
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

            <IconButton onClick={reloadData}>
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
                          {orden.proveedor?.razonSocial}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {orden.proveedor?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                 <TableCell>
  {orden.fechaCreacion && dayjs(orden.fechaCreacion).isValid()
    ? dayjs(orden.fechaCreacion).format('DD/MM/YYYY')
    : 'Sin fecha'}
</TableCell>
<TableCell>
  {orden.fechaEntregaEstimada && dayjs(orden.fechaEntregaEstimada).isValid()
    ? dayjs(orden.fechaEntregaEstimada).format('DD/MM/YYYY')
    : 'Sin fecha'}
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
                      ${orden.total.toLocaleString()
                      }
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
<Dialog
  open={openOrdenDialog}
  onClose={() => setOpenOrdenDialog(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>{isEditMode ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}</DialogTitle>
  <DialogContent>
    <Box pt={2}>
      <TextField
        fullWidth
        select
        label="Proveedor"
        value={newOrden.supplierId}
        onChange={(e) => setNewOrden({ ...newOrden, supplierId: e.target.value })}
        margin="normal"
        required
      >
        {proveedores.map((proveedor) => (
          <MenuItem key={proveedor.id} value={proveedor.id.toString()}>
            {proveedor.razonSocial}
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

      <Typography variant="h6" sx={{ mt: 2 }}>
        Items de la Orden
      </Typography>
      {newOrden.items.map((item, index) => (
  <Box key={index} display="flex" gap={2} alignItems="center" mb={2}>
   <Autocomplete
  freeSolo
  options={productos}
  getOptionLabel={(option) =>
    typeof option === 'string' ? option : option.nombre || ''
  }
  value={item.nombreProductoTemporal || productos.find((p) => p.id.toString() === item.productoId)?.nombre || ''}
  onChange={(_, newValue) => {
    const updatedItems = [...newOrden.items];
    if (typeof newValue === 'string') {
      updatedItems[index] = {
        ...updatedItems[index],
        productoId: '',
        nombreProductoTemporal: newValue,
        descripcionProductoTemporal: newValue,
        esProductoNuevo: true,
        precioUnitario: updatedItems[index].precioUnitario || 0, // Preserve existing price
      };
    } else if (newValue && newValue.id) {
      updatedItems[index] = {
        ...updatedItems[index],
        productoId: newValue.id.toString(),
        nombreProductoTemporal: '',
        descripcionProductoTemporal: newValue.nombre,
        esProductoNuevo: false,
        precioUnitario: newValue.precio || updatedItems[index].precioUnitario || 0, // Use product price or preserve existing
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        productoId: '',
        nombreProductoTemporal: '',
        descripcionProductoTemporal: '',
        esProductoNuevo: false,
        precioUnitario: updatedItems[index].precioUnitario || 0, // Preserve existing price
      };
    }
    setNewOrden({ ...newOrden, items: updatedItems });
  }}
  onInputChange={(_, newInputValue, reason) => {
    if (reason === 'input') {
      const updatedItems = [...newOrden.items];
      updatedItems[index] = {
        ...updatedItems[index],
        nombreProductoTemporal: newInputValue,
        descripcionProductoTemporal: newInputValue,
        esProductoNuevo: !!newInputValue && newInputValue.trim() !== '',
        productoId: '',
        precioUnitario: updatedItems[index].precioUnitario || 0, // Preserve existing price
      };
      setNewOrden({ ...newOrden, items: updatedItems });
    }
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Producto"
      required
      sx={{ flex: 2, minWidth: 200 }}
    />
  )}
/>
    <TextField
      type="number"
      label="Cantidad"
      value={item.cantidad}
      onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)}
      sx={{ width: 100 }}
      required
    />
    <TextField
      type="number"
      label="Precio Unitario"
      value={item.precioUnitario}
      onChange={(e) => handleItemChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      }}
      sx={{ width: 120 }}
      required
    />
    <TextField
      label="Total"
      value={(item.cantidad * item.precioUnitario).toFixed(2)}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
        readOnly: true,
      }}
      sx={{ width: 120 }}
    />
    <IconButton
      onClick={() => handleRemoveItem(index)}
      disabled={newOrden.items.length === 1}
      color="error"
    >
      <DeleteIcon />
    </IconButton>
  </Box>
))}
      <Button onClick={handleAddItem} sx={{ mb: 2 }} startIcon={<AddIcon />}>
        Agregar Item
      </Button>
      <Typography>
        Total: $
        {newOrden.items
          .reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
          .toLocaleString()}
      </Typography>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenOrdenDialog(false)}>Cancelar</Button>
    <Button
      variant="contained"
      onClick={handleSaveOrden}
      disabled={
  !newOrden.supplierId ||
  newOrden.items.length === 0 ||
  newOrden.items.some(
    (item) =>
      (!item.productoId && !item.nombreProductoTemporal) ||
      item.cantidad <= 0 ||
      item.precioUnitario <= 0
  )
}
    >
      {isEditMode ? 'Actualizar' : 'Crear'} Orden
    </Button>
  </DialogActions>
</Dialog>
        <Dialog
  open={openDeleteDialog !== null}
  onClose={() => setOpenDeleteDialog(null)}
>
  <DialogTitle>Confirmar Eliminación</DialogTitle>
  <DialogContent>
    <Typography>¿Está seguro de que desea eliminar esta compra?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeleteDialog(null)}>Cancelar</Button>
    <Button
      variant="contained"
      color="error"
      onClick={() => handleDeleteCompra(openDeleteDialog!)}
    >
      Eliminar
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
    </ErrorBoundary>
  );
};
export default ComprasPedidosPage;
