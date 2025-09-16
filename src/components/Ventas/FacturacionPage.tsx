import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
// Real API services
import { clienteApi, productApi, usuarioApi, documentoApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import type {
  Cliente,
  Usuario,
  Producto,
  DocumentoComercial,
  DetalleDocumento,
  MetodoPago,
} from '../../types';

// Types
// Only include methods supported by current backend enum
const PAYMENT_METHODS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
];

type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';
const IVA_OPTIONS: { value: TipoIva; label: string; rate: number }[] = [
  { value: 'IVA_21', label: 'IVA 21%', rate: 0.21 },
  { value: 'IVA_10_5', label: 'IVA 10.5%', rate: 0.105 },
  { value: 'EXENTO', label: 'Exento 0%', rate: 0 },
];

const ESTADO_OPTIONS: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning' },
  APROBADO: { label: 'Aprobado', color: 'success' },
  RECHAZADO: { label: 'Rechazado', color: 'secondary' },
  PAGADA: { label: 'Pagada', color: 'primary' },
  VENCIDA: { label: 'Vencida', color: 'error' },
  ANULADA: { label: 'Anulada', color: 'default' },
};

type CartItem = {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioManualmenteModificado?: boolean;
};

type NotaCartItem = Omit<CartItem, 'precioManualmenteModificado'>;

const FacturacionPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data
  const [clients, setClients] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [notasPedido, setNotasPedido] = useState<DocumentoComercial[]>([]);
  
  // Manual invoice form
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | ''>(user?.id ?? '');
  const [paymentMethod, setPaymentMethod] = useState<MetodoPago>('EFECTIVO');
  const [invoiceDate, setInvoiceDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [dueDate, setDueDate] = useState(dayjs().add(30, 'days').format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedIva, setSelectedIva] = useState<TipoIva>('IVA_21');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  // const [autoCalculateTotal, setAutoCalculateTotal] = useState(true);
  
  // From Nota de Pedido
  const [selectedNotaPedido, setSelectedNotaPedido] = useState<DocumentoComercial | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editingNotaItems, setEditingNotaItems] = useState(false);
  const [notaCart, setNotaCart] = useState<NotaCartItem[]>([]);
  
  // Estado management dialog
  const [estadoDialogOpen, setEstadoDialogOpen] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<DocumentoComercial | null>(null);
  const [newEstado, setNewEstado] = useState<DocumentoComercial['estado']>('PENDIENTE');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsData, usuariosResponse, productsData, notasData] = await Promise.all([
        clienteApi.getAll().catch(() => []),
        usuarioApi.getAll().catch((err: any) => {
          if (err?.response?.status === 403) {
            // Sin permisos para listar usuarios; seguimos con el usuario actual
            return [];
          }
          return [];
        }),
        productApi.getAll().catch(() => []),
        documentoApi.getByTipo('NOTA_PEDIDO').catch(() => []),
      ]);
      
  setClients(Array.isArray(clientsData) ? clientsData : []);
  setUsuarios(Array.isArray(usuariosResponse) ? usuariosResponse : []);
  setProducts(Array.isArray(productsData) ? (productsData as Producto[]).filter(p => p && (p as any).id) : []);
      
      // Filter notas de pedido that can be invoiced
      const invoiceableNotas = Array.isArray(notasData) 
        ? notasData.filter(n => n.estado === 'APROBADO' || n.estado === 'PENDIENTE')
        : [];
      setNotasPedido(invoiceableNotas);
      
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      setError('No se pudieron cargar los datos necesarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ensure current user is preselected if available
  useEffect(() => {
    if (user?.id && !selectedUsuarioId) {
      setSelectedUsuarioId(user.id);
    }
  }, [user?.id]);

  // Calculate totals for manual invoice
  const subtotalVenta = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      const discountAmount = itemSubtotal * (item.descuento / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);
  }, [cart]);

  const ivaAmount = useMemo(() => {
    const ivaRate = IVA_OPTIONS.find((option) => option.value === selectedIva)?.rate || 0;
    return subtotalVenta * ivaRate;
  }, [subtotalVenta, selectedIva]);

  const totalVenta = useMemo(() => {
    return subtotalVenta + ivaAmount;
  }, [subtotalVenta, ivaAmount]);

  // Calculate totals for nota conversion
  const notaSubtotal = useMemo(() => {
    return notaCart.reduce((sum, item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario;
      const discountAmount = itemSubtotal * (item.descuento / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);
  }, [notaCart]);

  const notaIvaAmount = useMemo(() => {
    if (!selectedNotaPedido) return 0;
    const ivaRate = IVA_OPTIONS.find((option) => option.value === selectedNotaPedido.tipoIva)?.rate || 0;
    return notaSubtotal * ivaRate;
  }, [notaSubtotal, selectedNotaPedido]);

  const notaTotalVenta = useMemo(() => {
    return notaSubtotal + notaIvaAmount;
  }, [notaSubtotal, notaIvaAmount]);

  const clearForm = () => {
    setSelectedClientId('');
    setSelectedUsuarioId('');
    setPaymentMethod('EFECTIVO');
    setInvoiceDate(dayjs().format('YYYY-MM-DD'));
    setDueDate(dayjs().add(30, 'days').format('YYYY-MM-DD'));
    setNotes('');
    setCart([]);
    setSelectedIva('IVA_21');
    setInvoiceNumber('');
    setError(null);
    setSuccess(null);
  };

  const addItemToCart = () => {
    if (products.length === 0) {
      setError('No hay productos disponibles para agregar al carrito.');
      return;
    }
    
    const defaultProduct = products[0];
    setCart((prev) => [
      ...prev,
      {
        productoId: defaultProduct.id,
        productoNombre: defaultProduct.nombre || 'Producto sin nombre',
        cantidad: 1,
        precioUnitario: defaultProduct.precio || 0,
        descuento: 0,
        precioManualmenteModificado: false,
      },
    ]);
  };

  const updateCartItem = (index: number, field: 'productoId'|'cantidad'|'precioUnitario'|'descuento', value: any) => {
    const newCart = [...cart];
    const item = { ...newCart[index] };

    if (field === 'productoId') {
      const product = products.find((p) => p && p.id === Number(value));
      if (product) {
        item.productoId = product.id;
        item.productoNombre = product.nombre || 'Producto sin nombre';
        if (!item.precioManualmenteModificado) {
          item.precioUnitario = product.precio || 0;
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

  const handleSubmitManualInvoice = async () => {
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1) Crear Presupuesto mínimo
      const presupuesto = await documentoApi.createPresupuesto({
        clienteId: Number(selectedClientId),
        usuarioId: Number(selectedUsuarioId),
        observaciones: notes || undefined,
        detalles: cart.map((item) => ({
          productoId: Number(item.productoId),
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario),
          descuento: Number(item.descuento) || 0,
          subtotal: Number(
            (item.cantidad * item.precioUnitario) * (1 - (item.descuento || 0) / 100)
          ),
          descripcion: item.productoNombre || undefined,
        })),
      });

      // 2) Convertir a Nota de Pedido con método de pago e IVA
      const nota = await documentoApi.convertToNotaPedido({
        presupuestoId: presupuesto.id,
        metodoPago: paymentMethod,
        tipoIva: selectedIva,
      });

      // 3) Convertir Nota de Pedido a Factura
      const factura = await documentoApi.convertToFactura({
        notaPedidoId: nota.id,
      });

      setSuccess(`Factura creada exitosamente (Doc #${factura.numeroDocumento}).`);
      clearForm();
      await loadData();
    } catch (err: any) {
      console.error('Error creando factura manual:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      setError(`No se pudo crear la factura: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConvertDialog = (nota: DocumentoComercial) => {
    setSelectedNotaPedido(nota);
    setNotaCart(
      nota.detalles
        ? (nota.detalles as DetalleDocumento[]).map((d) => ({
            productoId: d.productoId,
            productoNombre: d.productoNombre,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            descuento: d.descuento || 0,
          }))
        : []
    );
    setEditingNotaItems(false);
    setConvertDialogOpen(true);
  };

  const handleCloseConvertDialog = () => {
    setConvertDialogOpen(false);
    setSelectedNotaPedido(null);
    setNotaCart([]);
    setEditingNotaItems(false);
  };

  const handleConvertNotaToFactura = async () => {
    if (!selectedNotaPedido) return;

    setLoading(true);
    setError(null);

    try {
  const notaId = selectedNotaPedido.id;
  await documentoApi.convertToFactura({ notaPedidoId: notaId });
  // Optimistically remove the converted nota from the local list so it disappears immediately
  setNotasPedido((prev) => prev.filter((n) => n.id !== notaId));
      setSuccess(`Nota de Pedido #${selectedNotaPedido.numeroDocumento} convertida a Factura exitosamente.`);
      handleCloseConvertDialog();
  // Refresh data in the background to stay in sync with backend state
  loadData();
    } catch (err: any) {
      console.error('Error converting to factura:', err);
        setError(`Error al convertir a factura: ${err?.message || 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

    const handleOpenEstadoDialog = (documento: DocumentoComercial) => {
    setSelectedDocumento(documento);
    setNewEstado(documento.estado);
    setEstadoDialogOpen(true);
  };

  const handleUpdateEstado = async () => {
    if (!selectedDocumento || !newEstado) return;

    setLoading(true);
    setError(null);

    try {
      await documentoApi.updateEstado(selectedDocumento.id, newEstado);
      setSuccess(`Estado actualizado exitosamente.`);
      setEstadoDialogOpen(false);
      // Optimistically reflect the change in the list
      setNotasPedido((prev) => {
        const isInvoiceable = newEstado === 'APROBADO' || newEstado === 'PENDIENTE';
        if (!isInvoiceable) {
          return prev.filter((n) => n.id !== selectedDocumento.id);
        }
        return prev.map((n) => (n.id === selectedDocumento.id ? { ...n, estado: newEstado } : n));
      });
      // Refresh data to stay in sync
      loadData();
    } catch (err: any) {
      console.error('Error updating estado:', err);
        setError(`Error al actualizar el estado: ${err?.message || 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateNotaCartItem = (index: number, field: 'cantidad'|'precioUnitario'|'descuento', value: any) => {
    const newCart = [...notaCart];
    const item = { ...newCart[index] };

    if (field === 'cantidad') {
      item.cantidad = Math.max(1, Number(value) || 1);
    } else if (field === 'precioUnitario') {
      item.precioUnitario = Math.max(0, Number(value) || 0);
    } else if (field === 'descuento') {
      item.descuento = Math.min(100, Math.max(0, Number(value) || 0));
    }

    newCart[index] = item;
    setNotaCart(newCart);
  };

  const ProductsTable = ({ items, onUpdate, onRemove, editable = true }: {
    items: CartItem[] | NotaCartItem[];
    onUpdate: (index: number, field: any, value: any) => void;
    onRemove: (index: number) => void;
    editable?: boolean;
  }) => (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 200 }}>Producto</TableCell>
            <TableCell align="center">Cantidad</TableCell>
            <TableCell align="right">Precio Unit.</TableCell>
            <TableCell align="right">Desc. %</TableCell>
            <TableCell align="right">Subtotal</TableCell>
            {editable && <TableCell align="center">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => {
            const subtotal = item.cantidad * item.precioUnitario * (1 - item.descuento / 100);
            return (
              <TableRow key={index}>
                <TableCell>
                  {editable ? (
                    <Select
                      fullWidth
                      size="small"
                      value={item.productoId}
                      onChange={(e) => onUpdate(index, 'productoId', e.target.value)}
                    >
                      {products.filter(p => p && p.id).map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.nombre || 'Producto sin nombre'}</MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <Typography>{item.productoNombre}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={item.cantidad}
                      onChange={(e) => onUpdate(index, 'cantidad', e.target.value)}
                      inputProps={{ min: 1 }}
                      sx={{ width: 80 }}
                    />
                  ) : (
                    <Typography align="center">{item.cantidad}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={item.precioUnitario}
                      onChange={(e) => onUpdate(index, 'precioUnitario', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 120 }}
                    />
                  ) : (
                    <Typography align="right">${item.precioUnitario.toFixed(2)}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <TextField
                      type="number"
                      size="small"
                      value={item.descuento}
                      onChange={(e) => onUpdate(index, 'descuento', e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                      sx={{ width: 80 }}
                    />
                  ) : (
                    <Typography align="right">{item.descuento}%</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    ${subtotal.toFixed(2)}
                  </Typography>
                </TableCell>
                {editable && (
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => onRemove(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading && !products.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Cargando datos iniciales...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <ReceiptIcon />
          Sistema de Facturación
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={loadData}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper sx={{ mb: 3 }}>
  <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Factura Manual" icon={<EditIcon />} iconPosition="start" />
          <Tab label="Desde Nota de Pedido" icon={<DescriptionIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
  <Grid container spacing={3}>
  <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Nueva Factura Manual
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Número de Factura (opcional)"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Se generará automáticamente si no se especifica"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Cliente</InputLabel>
                      <Select
        value={selectedClientId}
                        label="Cliente"
        onChange={(e) => setSelectedClientId(Number(e.target.value))}
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
        onChange={(e) => setSelectedUsuarioId(Number(e.target.value))}
                        disabled={loading}
                      >
                        {user && (
                          <MenuItem key={`me-${user.id}`} value={user.id}>
                            @{user.username}
                          </MenuItem>
                        )}
                        {usuarios
                          .filter((u) => (user ? u.id !== user.id : true))
                          .map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                              {u.nombre} {u.apellido ?? ''}
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
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Fecha de Emisión"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Fecha de Vencimiento"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Tipo de IVA</InputLabel>
                      <Select
                        value={selectedIva}
                        label="Tipo de IVA"
        onChange={(e) => setSelectedIva(e.target.value as TipoIva)}
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
                      label="Observaciones"
                      multiline
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas adicionales sobre la factura..."
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
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={addItemToCart} 
                    disabled={products.length === 0 || loading}
                  >
                    Agregar Producto
                  </Button>
                </Box>

                {cart.length > 0 ? (
                  <>
                    <ProductsTable 
                      items={cart}
                      onUpdate={updateCartItem}
                      onRemove={removeItemFromCart}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" justifyContent="flex-end">
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography sx={{ mr: 4 }}>Subtotal:</Typography>
                          <Typography fontWeight="bold">${subtotalVenta.toFixed(2)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography sx={{ mr: 4 }}>
                            {IVA_OPTIONS.find(o => o.value === selectedIva)?.label}:
                          </Typography>
                          <Typography fontWeight="bold">${ivaAmount.toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="h6" sx={{ mr: 4 }}>Total:</Typography>
                          <Typography variant="h5" color="primary" fontWeight="bold">
                            ${totalVenta.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box textAlign="center" py={4} sx={{ border: '1px dashed grey', borderRadius: 1 }}>
                    <ShoppingCartIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                    <Typography>El carrito está vacío</Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <Button 
                    variant="outlined" 
                    startIcon={<ClearIcon />} 
                    onClick={clearForm} 
                    disabled={loading}
                  >
                    Limpiar
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />} 
                    onClick={handleSubmitManualInvoice} 
                    disabled={loading || cart.length === 0}
                  >
                    {loading ? 'Guardando...' : 'Crear Factura'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

  {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Notas de Pedido Disponibles para Facturar
            </Typography>
            
            {notasPedido.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Número</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notasPedido.map((nota) => (
                      <TableRow key={nota.id}>
                        <TableCell>{nota.numeroDocumento}</TableCell>
                        <TableCell>{nota.clienteNombre}</TableCell>
                        <TableCell>
                          {new Date(nota.fechaEmision).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell>
                          ${nota.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ESTADO_OPTIONS[nota.estado as keyof typeof ESTADO_OPTIONS]?.label || nota.estado}
                            color={ESTADO_OPTIONS[nota.estado as keyof typeof ESTADO_OPTIONS]?.color || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Convertir a Factura">
                            <IconButton 
                              color="primary"
                              // Continuación del código desde la línea 434 (después del IconButton)
                              onClick={() => handleOpenConvertDialog(nota)}
                              disabled={loading}
                            >
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cambiar Estado">
                            <IconButton 
                              color="secondary"
                              onClick={() => handleOpenEstadoDialog(nota)}
                              disabled={loading}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={4} sx={{ border: '1px dashed grey', borderRadius: 1 }}>
                <DescriptionIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
                <Typography>No hay notas de pedido disponibles para facturar</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog for converting Nota de Pedido to Factura */}
      <Dialog 
        open={convertDialogOpen} 
        onClose={handleCloseConvertDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Convertir a Factura - Nota #{selectedNotaPedido?.numeroDocumento}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={editingNotaItems}
                  onChange={(e) => setEditingNotaItems(e.target.checked)}
                />
              }
              label="Editar productos"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotaPedido && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Cliente:</strong> {selectedNotaPedido.clienteNombre}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Fecha:</strong> {new Date(selectedNotaPedido.fechaEmision).toLocaleDateString('es-AR')}</Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" mb={2}>Productos</Typography>
              
              <ProductsTable 
                items={notaCart}
                onUpdate={updateNotaCartItem}
                onRemove={(index) => setNotaCart(prev => prev.filter((_, i) => i !== index))}
                editable={editingNotaItems}
              />

              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="flex-end">
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography sx={{ mr: 4 }}>Subtotal:</Typography>
                    <Typography fontWeight="bold">${notaSubtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography sx={{ mr: 4 }}>
                      {IVA_OPTIONS.find(o => o.value === selectedNotaPedido.tipoIva)?.label || 'IVA'}:
                    </Typography>
                    <Typography fontWeight="bold">${notaIvaAmount.toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6" sx={{ mr: 4 }}>Total:</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      ${notaTotalVenta.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConvertDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConvertNotaToFactura} 
            variant="contained" 
            disabled={loading || notaCart.length === 0}
            startIcon={<ReceiptIcon />}
          >
            {loading ? 'Convirtiendo...' : 'Crear Factura'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for changing document status */}
      <Dialog open={estadoDialogOpen} onClose={() => setEstadoDialogOpen(false)}>
        <DialogTitle>
          Cambiar Estado del Documento
        </DialogTitle>
        <DialogContent>
          {selectedDocumento && (
            <Box pt={1}>
              <Typography mb={2}>
                Documento: <strong>#{selectedDocumento.numeroDocumento}</strong>
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Nuevo Estado</InputLabel>
                <Select
                  value={newEstado}
                  label="Nuevo Estado"
                  onChange={(e) => setNewEstado(e.target.value)}
                >
                  {Object.entries(ESTADO_OPTIONS).map(([key, option]) => (
                    <MenuItem key={key} value={key}>
                      <Chip
                        label={option.label}
                        color={option.color}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEstadoDialogOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateEstado} 
            variant="contained" 
            disabled={loading || !newEstado || newEstado === selectedDocumento?.estado}
            startIcon={<CheckCircleIcon />}
          >
            {loading ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacturacionPage;