import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { clienteApi, employeeApi, productApi, saleApi, usuarioApi } from '../../api/services';
import type { Cliente, Employee, Producto, PaymentMethod, Usuario } from '../../types';
import dayjs from 'dayjs';

interface SaleItem {
  productId: number | '';
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface SaleFormData {
  clientId: number | '';
  usuarioId: number | '';  // Changed from employeeId to usuarioId
  saleDate: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
  items: SaleItem[];
}

const FacturacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);  // Changed from employees to usuarios
  const [products, setProducts] = useState<Producto[]>([]);

  const [formData, setFormData] = useState<SaleFormData>({
    clientId: '',
    usuarioId: '',  // Changed from employeeId to usuarioId
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    notes: '',
    items: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    // Always try to fetch products first (since it's critical for selling)
    let productosData: Producto[] = [];
    try {
      productosData = await productApi.getAll();
      setProducts(productosData);
    } catch (err) {
      setProducts([]);
      setError('No se pudieron cargar los productos. Verifique el backend.');
    }

    // Try to fetch clients, but don't block UI if it fails
    try {
      const clientsData = await clienteApi.getAll();
      setClients(clientsData);
    } catch (err) {
      setClients([]);
      setError(prev => prev ? prev + ' | No se pudieron cargar los clientes.' : 'No se pudieron cargar los clientes.');
    }

    // Try to fetch usuarios instead of employees
    try {
      const usuariosData = await usuarioApi.getAll();
      setUsuarios(usuariosData);
    } catch (err) {
      setUsuarios([]);
      setError(prev => prev ? prev + ' | No se pudieron cargar los usuarios.' : 'No se pudieron cargar los usuarios.');
    }

    setLoading(false);
  };

  const handleInputChange = (field: keyof SaleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          total: 0,
        }
      ]
    }));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // If productId changes, update unitPrice from products
    if (field === 'productId' && value) {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        updatedItems[index].unitPrice = prod.precio || 0;
        updatedItems[index].total = (updatedItems[index].quantity || 1) * (prod.precio || 0);
      }
    }

    // Calculate total for the item
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const item = updatedItems[index];
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = subtotal * (item.discount / 100);
      item.total = subtotal - discountAmount;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const clearForm = () => {
    setFormData({
      clientId: '',
      usuarioId: '',  // Changed from employeeId to usuarioId
      saleDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      notes: '',
      items: [],
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation checks
      if (!formData.clientId) {
        throw new Error('Cliente es requerido');
      }
      if (!formData.usuarioId) {  // Changed from employeeId to usuarioId
        throw new Error('Usuario es requerido');
      }
      if (!formData.paymentMethod) {
        throw new Error('Método de pago es requerido');
      }
      if (formData.items.length === 0) {
        throw new Error('Debe agregar al menos un producto');
      }

      // Validate all items have products selected
      const invalidItems = formData.items.filter(item => !item.productId);
      if (invalidItems.length > 0) {
        throw new Error('Todos los productos deben estar seleccionados');
      }

      // Find the full objects for cliente and usuario
      const cliente = clients.find(c => c.id === formData.clientId);
      const usuario = usuarios.find(u => u.id === formData.usuarioId);

      if (!cliente) throw new Error('Cliente no encontrado');
      if (!usuario) throw new Error('Usuario no encontrado');

      // Build detalleVentas with nested producto objects
      const detalleVentas = formData.items.map(item => {
        const producto = products.find(p => p.id === item.productId);
        if (!producto) throw new Error(`Producto con ID ${item.productId} no encontrado`);
        return {
          producto,
          cantidad: item.quantity,
          precioUnitario: item.unitPrice,
          subtotal: item.total,
          descuento: item.discount || 0,
        };
      });

      // Convert saleDate to ISO datetime
      const fechaVentaIso = dayjs(formData.saleDate)
        .hour(dayjs().hour())
        .minute(dayjs().minute())
        .second(dayjs().second())
        .format('YYYY-MM-DDTHH:mm:ss');

      const payload = {
        numeroVenta: `V-${Date.now()}`,
        cliente, // full object
        usuario, // full object - this should now reference a valid usuario
        fechaVenta: fechaVentaIso,
        total: calculateTotal(),
        estado: "PENDIENTE",
        metodoPago: formData.paymentMethod,
        detalleVentas,
        notas: formData.notes,
      };

      console.log('Payload being sent:', payload);

      const response = await saleApi.create(payload);
      setSuccess('Venta guardada correctamente');
      clearForm();
    } catch (err: any) {
      console.error('Error creating sale:', err);
      
      // Enhanced error handling
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        console.error('Backend validation errors:', errorData);
        
        if (errorData?.message) {
          setError(`Error de validación: ${errorData.message}`);
        } else if (errorData?.errors) {
          // Handle field-specific errors
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setError(`Errores de validación: ${fieldErrors}`);
        } else {
          setError('Error de validación en el servidor. Verifique los datos enviados.');
        }
      } else if (err.response?.status === 500) {
        setError('Error interno del servidor. Contacte al administrador.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error desconocido al guardar la venta');
      }
    } finally {
      setLoading(false);
    }
  };

  // Validation function
  const validateForm = (): string | null => {
    if (!formData.clientId) return 'Debe seleccionar un cliente';
    if (!formData.usuarioId) return 'Debe seleccionar un usuario';  // Changed from employeeId to usuarioId
    if (!formData.paymentMethod) return 'Debe seleccionar un método de pago';
    if (formData.items.length === 0) return 'Debe agregar al menos un producto';
    
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.productId) return `Producto ${i + 1}: Debe seleccionar un producto`;
      if (item.quantity <= 0) return `Producto ${i + 1}: La cantidad debe ser mayor a 0`;
      if (item.unitPrice <= 0) return `Producto ${i + 1}: El precio debe ser mayor a 0`;
    }
    
    return null;
  };

  // Modified submit button with validation
  const handleSubmitWithValidation = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    await handleSubmit();
  };

  if (loading && clients.length === 0) {
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
          <ReceiptIcon />
          Facturación - Nueva Venta
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearForm}
          >
            Limpiar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSubmitWithValidation}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Venta'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Sale Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Información de la Venta</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.clientId}
                  label="Cliente"
                  onChange={(e) => handleInputChange('clientId', e.target.value)}
                  disabled={clients.length === 0}
                >
                  <MenuItem value="">Seleccionar cliente</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Usuario</InputLabel>
                <Select
                  value={formData.usuarioId}
                  label="Usuario"
                  onChange={(e) => handleInputChange('usuarioId', e.target.value)}
                  disabled={usuarios.length === 0}
                >
                  <MenuItem value="">Seleccionar usuario</MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      {usuario.nombre} {usuario.apellido}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha de Venta"
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleInputChange('saleDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  label="Método de Pago"
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                >
                  <MenuItem value="CASH">Efectivo</MenuItem>
                  <MenuItem value="CREDIT_CARD">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="DEBIT_CARD">Tarjeta de Débito</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Transferencia</MenuItem>
                  <MenuItem value="CHECK">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Notas"
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales sobre la venta..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sale Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Productos</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addItem}
            >
              Agregar Producto
            </Button>
          </Box>

          {formData.items.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Descuento %</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">Seleccionar producto...</MenuItem>
                            {products.map((product) => (
                              <MenuItem key={product.id} value={product.id}>
                                {product.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${item.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => removeItem(index)}
                          color="error"
                          aria-label="Eliminar producto"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <ShoppingCartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No hay productos agregados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Haga clic en "Agregar Producto" para comenzar
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2}>
            <Typography variant="h6" color="primary">
              Total:
            </Typography>
            <Typography variant="h4" color="primary">
              ${calculateTotal().toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Information */}
      <Box mt={3}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Información importante:</strong>
          </Typography>
          <Typography variant="body2" component="div" mt={1}>
            • Todos los campos marcados con * son obligatorios<br />
            • El total se calcula automáticamente al agregar productos<br />
            • Los descuentos se aplican por producto individualmente<br />
            • La venta se registrará en el sistema una vez guardada
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
};

export default FacturacionPage;