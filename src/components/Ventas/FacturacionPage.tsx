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
import { saleApi, clientApi, employeeApi, productApi } from '../../api/services';
import type { Sale, Client, Employee, Product, PaymentMethod, CreateSaleRequest, CreateSaleItemRequest } from '../../types';

interface SaleFormData {
  clientId: number | '';
  employeeId: number | '';
  saleDate: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
  items: SaleItem[];
}

interface SaleItem {
  productId: number | '';
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

const FacturacionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [formData, setFormData] = useState<SaleFormData>({
    clientId: '',
    employeeId: '',
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    notes: '',
    items: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, employeesData, productsData] = await Promise.all([
        clientApi.getAll(),
        employeeApi.getAll(),
        productApi.getAll(),
      ]);
      
      setClients(clientsData);
      setEmployees(employeesData);
      setProducts(productsData);
    } catch (err) {
      setError('Error al cargar los datos necesarios');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SaleFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    const newItem: SaleItem = {
      productId: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

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

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    const methods = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      BANK_TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
    };
    return methods[method] || method;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validation
      if (!formData.clientId || !formData.employeeId || !formData.paymentMethod) {
        setError('Por favor, complete todos los campos obligatorios');
        return;
      }

      if (formData.items.length === 0) {
        setError('Debe agregar al menos un producto a la venta');
        return;
      }

      const saleData: CreateSaleRequest = {
        clientId: Number(formData.clientId),
        employeeId: Number(formData.employeeId),
        saleDate: formData.saleDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        saleItems: formData.items.map(item => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await saleApi.create(saleData);
      setSuccess('Venta creada exitosamente');
      
      // Reset form
      setFormData({
        clientId: '',
        employeeId: '',
        saleDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        notes: '',
        items: [],
      });

    } catch (err) {
      setError('Error al crear la venta');
      console.error('Error creating sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      clientId: '',
      employeeId: '',
      saleDate: new Date().toISOString().split('T')[0],
      paymentMethod: '',
      notes: '',
      items: [],
    });
    setError(null);
    setSuccess(null);
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
            onClick={handleSubmit}
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
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={formData.employeeId}
                  label="Vendedor"
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
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
                                {product.name}
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
        </CardContent>
      </Card>

      {/* Total */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Total de la Venta:</Typography>
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
