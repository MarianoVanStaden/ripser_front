import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { clienteApi, productApi, saleApi, usuarioApi } from '../../api/services';
import type { Cliente, Producto, Usuario, MetodoPago } from '../../types';
import dayjs from 'dayjs';

// Define available payment methods
const PAYMENT_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'CUENTA_CORRIENTE', label: 'Cuenta Corriente' },
  { value: 'CHEQUE', label: 'Cheque' },
];



// Define IVA options based on TipoIva enum
const IVA_OPTIONS = [
  { value: 'IVA_21', label: 'IVA 21% (21%)', rate: 0.21 },
  { value: 'IVA_10_5', label: 'IVA 10.5% (10.5%)', rate: 0.105 },
  { value: 'EXENTO', label: 'Exento (0%)', rate: 0 },
];

interface CartItem {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioManualmenteModificado: boolean;
}

const FacturacionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('EFECTIVO');
  const [saleDate, setSaleDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedIva, setSelectedIva] = useState<string>('IVA_21'); // Default to IVA_21

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsData, usuariosData, productsData] = await Promise.all([
        clienteApi.getAll(),
        usuarioApi.getAll(),
        productApi.getAll(),
      ]);
      setClients(clientsData);
      setUsuarios(usuariosData);
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError('No se pudieron cargar los datos necesarios. Verifique la conexión con el backend e intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate subtotal (before IVA)
  const subtotalVenta = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      const discountAmount = itemSubtotal * (item.descuento / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);
  }, [cart]);

  // Calculate IVA amount
  const ivaAmount = useMemo(() => {
    const ivaRate = IVA_OPTIONS.find((option) => option.value === selectedIva)?.rate || 0;
    return subtotalVenta * ivaRate;
  }, [subtotalVenta, selectedIva]);

  // Calculate total (subtotal + IVA)
  const totalVenta = useMemo(() => {
    return subtotalVenta + ivaAmount;
  }, [subtotalVenta, ivaAmount]);

  const clearForm = () => {
    setSelectedClientId('');
    setSelectedUsuarioId('');
    setPaymentMethod('EFECTIVO');
    setSaleDate(dayjs().format('YYYY-MM-DD'));
    setNotes('');
    setCart([]);
    setSelectedIva('IVA_21'); // Reset to default IVA
    setError(null);
    setSuccess(null);
  };

  const addItemToCart = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setCart((prev) => [
      ...prev,
      {
        productoId: defaultProduct.id,
        productoNombre: defaultProduct.nombre,
        cantidad: 1,
        precioUnitario: defaultProduct.precio,
        descuento: 0,
        precioManualmenteModificado: false,
      },
    ]);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    const newCart = [...cart];
    const item = { ...newCart[index] };

    if (field === 'productoId') {
      const product = products.find((p) => p.id === Number(value));
      if (product) {
        item.productoId = product.id;
        item.productoNombre = product.nombre;
        if (!item.precioManualmenteModificado) {
          item.precioUnitario = product.precio;
        }
      }
    } else if (field === 'cantidad') {
      item.cantidad = Math.max(1, Number(value) || 1);
    } else if (field === 'precioUnitario') {
      item.precioUnitario = Math.max(0, Number(value) || 0);
      item.precioManualmenteModificado = true;
    } else if (field === 'descuento') {
      item.descuento = Math.min(100, Math.max(0, Number(value) || 0));
    }

    newCart[index] = item;
    setCart(newCart);
  };

  const removeItemFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      setError('Debe seleccionar un cliente.');
      return;
    }
    if (!selectedUsuarioId) {
      setError('Debe seleccionar un usuario.');
      return;
    }
    if (cart.length === 0) {
      setError('Debe agregar al menos un producto al carrito.');
      return;
    }
    if (cart.some((item) => !item.productoId)) {
      setError('Todos los productos en el carrito deben ser válidos.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload: CreateVentaPayload = {
      clienteId: selectedClientId,
      usuarioId: selectedUsuarioId,
      metodoPago: paymentMethod,
      observaciones: notes,
      tipoIva: selectedIva as 'IVA_21' | 'IVA_10_5' | 'EXENTO', // Add tipoIva to payload
      detalleVentas: cart.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        descuento: item.descuento,
      })),
    };

    try {
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      const newSale = await saleApi.create(payload);
      setSuccess(`Venta #${newSale.numeroVenta} creada exitosamente.`);
      clearForm();
    } catch (err: any) {
      console.error('Error creating sale:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Ocurrió un error desconocido.';
      setError(`No se pudo crear la venta: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !products.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Cargando datos iniciales...</Typography>
      </Box>
    );
  }

  if (error && !products.length) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={loadData}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <ReceiptIcon />
          Facturación - Nueva Venta
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearForm} disabled={loading}>
            Limpiar
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Venta'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Información de la Venta
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cliente</InputLabel>
                    <Select
                      value={selectedClientId}
                      label="Cliente"
                      onChange={(e) => setSelectedClientId(e.target.value as number)}
                      disabled={loading}
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.nombre} {client.apellido || ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Usuario</InputLabel>
                    <Select
                      value={selectedUsuarioId}
                      label="Usuario"
                      onChange={(e) => setSelectedUsuarioId(e.target.value as number)}
                      disabled={loading}
                    >
                      {usuarios.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.nombre} {user.apellido}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={paymentMethod}
                      label="Método de Pago"
                      onChange={(e) => setPaymentMethod(e.target.value as MetodoPago)}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Venta"
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Tipo de IVA</InputLabel>
                    <Select
                      value={selectedIva}
                      label="Tipo de IVA"
                      onChange={(e) => setSelectedIva(e.target.value)}
                    >
                      {IVA_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas"
                    multiline
                    rows={4} // Fixed typo from 'rows7111' to 'rows={4}'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales sobre la venta..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Productos</Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addItemToCart} disabled={products.length === 0}>
                  Agregar Producto
                </Button>
              </Box>

              {cart.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200 }}>Producto</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Desc. %</TableCell>
                        <TableCell align="right">Subtotal</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item, index) => {
                        const subtotal = item.cantidad * item.precioUnitario * (1 - item.descuento / 100);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                fullWidth
                                size="small"
                                value={item.productoId}
                                onChange={(e) => updateCartItem(index, 'productoId', e.target.value)}
                              >
                                {products.map((p) => (
                                  <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={item.cantidad}
                                onChange={(e) => updateCartItem(index, 'cantidad', e.target.value)}
                                inputProps={{ min: 1 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={item.precioUnitario}
                                onChange={(e) => updateCartItem(index, 'precioUnitario', e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: 120, bgcolor: item.precioManualmenteModificado ? 'warning.light' : 'transparent' }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={item.descuento}
                                onChange={(e) => updateCartItem(index, 'descuento', e.target.value)}
                                inputProps={{ min: 0, max: 100 }}
                                sx={{ width: 80 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                ${subtotal.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => removeItemFromCart(index)} color="error">
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign="center" py={4} sx={{ border: '1px dashed grey', borderRadius: 1 }}>
                  <ShoppingCartIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography>El carrito está vacío</Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                <Typography variant="h6">Subtotal:</Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${subtotalVenta.toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                <Typography variant="h6">IVA ({IVA_OPTIONS.find((option) => option.value === selectedIva)?.label || 'N/A'}):</Typography>
                <Typography variant="h6" fontWeight="bold">
                  ${ivaAmount.toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  ${totalVenta.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FacturacionPage;