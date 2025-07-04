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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import type { Product, Supplier, Category, StockMovement, MovementType } from '../../types';
import { productApi, supplierApi, categoryApi, stockMovementApi } from '../../api/services';

// Mock data for development
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Laptop HP Pavilion',
    description: 'Laptop HP Pavilion 15.6" Intel Core i5',
    price: 85000,
    stock: 5,
    categoryId: 1,
    supplierId: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'Mouse Logitech',
    description: 'Mouse óptico USB Logitech',
    price: 2500,
    stock: 2,
    categoryId: 2,
    supplierId: 2,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
  },
  {
    id: 3,
    name: 'Teclado Mecánico',
    description: 'Teclado mecánico RGB gaming',
    price: 8500,
    stock: 0,
    categoryId: 2,
    supplierId: 1,
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-25T09:45:00Z',
  },
];

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Tech Supplies S.A.',
    contactPerson: 'María González',
    email: 'contacto@techsupplies.com',
    phone: '+54 11 4567-8901',
    address: 'Av. Tecnología 123, Buenos Aires',
    paymentTerms: '30 días',
    rating: 4.5,
    isActive: true,
    observations: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'Distribuidora Central',
    contactPerson: 'Carlos Rodríguez',
    email: 'ventas@distribuidoracentral.com',
    phone: '+54 11 2345-6789',
    address: 'Calle Industrial 456, Buenos Aires',
    paymentTerms: '15 días',
    rating: 4.0,
    isActive: true,
    observations: '',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
  },
];

const mockCategories: Category[] = [
  { id: 1, name: 'Computadoras', description: 'Equipos de computación', isActive: true, createdAt: '', updatedAt: '' },
  { id: 2, name: 'Periféricos', description: 'Accesorios y periféricos', isActive: true, createdAt: '', updatedAt: '' },
];

const mockStockMovements: StockMovement[] = [
  {
    id: 1,
    productId: 1,
    type: 'ENTRY' as MovementType,
    quantity: 10,
    reason: 'Compra a proveedor',
    reference: 'PO-2024-001',
    employeeId: 1,
    date: '2024-01-15T10:00:00Z',
    notes: 'Recepción de mercadería',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    productId: 1,
    type: 'EXIT' as MovementType,
    quantity: 5,
    reason: 'Venta',
    reference: 'VT-2024-001',
    employeeId: 1,
    date: '2024-01-16T14:30:00Z',
    notes: 'Venta a cliente',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
  },
];

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
      id={`stock-tabpanel-${index}`}
      aria-labelledby={`stock-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialogs
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Forms
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: '',
    supplierId: '',
    minStock: 5,
  });
  
  const [movementFormData, setMovementFormData] = useState({
    productId: '',
    type: 'ENTRY' as MovementType,
    quantity: 0,
    reason: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load data from APIs - fallback to mock data if API fails
      try {
        const [productsData, suppliersData, categoriesData, movementsData] = await Promise.all([
          productApi.getAll(),
          supplierApi.getAll(),
          categoryApi.getAll(),
          stockMovementApi.getAll(),
        ]);
        
        setProducts(productsData);
        setSuppliers(suppliersData);
        setCategories(categoriesData);
        setStockMovements(movementsData);
        setError(null);
      } catch (apiError) {
        console.warn('API failed, using mock data:', apiError);
        // Fallback to mock data if API is not available
        await new Promise(resolve => setTimeout(resolve, 500));
        setProducts(mockProducts);
        setSuppliers(mockSuppliers);
        setCategories(mockCategories);
        setStockMovements(mockStockMovements);
        setError('Conectado con datos de prueba. Verifique la conexión del backend.');
      }
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.stock <= 5 && product.stock > 0) ||
                        (stockFilter === 'out' && product.stock === 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      categoryId: '',
      supplierId: '',
      minStock: 5,
    });
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId.toString(),
      supplierId: product.supplierId.toString(),
      minStock: 5, // This would come from product.minStock if it existed
    });
    setProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      console.log('Saving product:', productFormData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingProduct) {
        setProducts(products.map(product => 
          product.id === editingProduct.id 
            ? { 
                ...product, 
                ...productFormData,
                categoryId: parseInt(productFormData.categoryId),
                supplierId: parseInt(productFormData.supplierId),
                updatedAt: new Date().toISOString() 
              }
            : product
        ));
      } else {
        const newProduct: Product = {
          id: Math.max(...products.map(p => p.id)) + 1,
          ...productFormData,
          categoryId: parseInt(productFormData.categoryId),
          supplierId: parseInt(productFormData.supplierId),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProducts([...products, newProduct]);
      }
      
      setProductDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el producto');
      console.error('Error saving product:', err);
    }
  };

  const handleAddMovement = () => {
    setMovementFormData({
      productId: '',
      type: 'ENTRY',
      quantity: 0,
      reason: '',
      reference: '',
      notes: '',
    });
    setMovementDialogOpen(true);
  };

  const handleSaveMovement = async () => {
    try {
      console.log('Saving movement:', movementFormData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMovement: StockMovement = {
        id: Math.max(...stockMovements.map(m => m.id)) + 1,
        ...movementFormData,
        productId: parseInt(movementFormData.productId),
        employeeId: 1, // This would come from current user
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setStockMovements([newMovement, ...stockMovements]);
      
      // Update product stock
      setProducts(products.map(product => 
        product.id === parseInt(movementFormData.productId)
          ? {
              ...product,
              stock: movementFormData.type === 'ENTRY' 
                ? product.stock + movementFormData.quantity
                : product.stock - movementFormData.quantity
            }
          : product
      ));
      
      setMovementDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el movimiento');
      console.error('Error saving movement:', err);
    }
  };

  const getStockChip = (stock: number) => {
    if (stock === 0) {
      return <Chip label="Sin Stock" color="error" size="small" />;
    } else if (stock <= 5) {
      return <Chip label="Stock Bajo" color="warning" size="small" />;
    } else {
      return <Chip label="Disponible" color="success" size="small" />;
    }
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
          <InventoryIcon />
          Gestión de Stock
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => console.log('Export inventory')}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
          >
            Agregar Producto
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <InventoryIcon color="primary" />
              <Box>
                <Typography variant="h4">{products.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Productos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={lowStockCount} color="warning">
                <WarningIcon color="warning" />
              </Badge>
              <Box>
                <Typography variant="h4">{lowStockCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Stock Bajo
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={outOfStockCount} color="error">
                <TrendingDownIcon color="error" />
              </Badge>
              <Box>
                <Typography variant="h4">{outOfStockCount}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sin Stock
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <QrCodeIcon color="info" />
              <Box>
                <Typography variant="h4">
                  ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor Total
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Inventario" />
          <Tab label="Movimientos" />
          <Tab label="Reportes" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Inventory */}
      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
          <TextField
            label="Buscar productos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value as number || null)}
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Stock</InputLabel>
            <Select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="low">Stock Bajo</MenuItem>
              <MenuItem value="out">Sin Stock</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Products Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.categoryId);
                    const supplier = suppliers.find(s => s.id === product.supplierId);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{category?.name || 'N/A'}</TableCell>
                        <TableCell>{supplier?.name || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" fontWeight="bold">
                            {product.stock}
                          </Typography>
                        </TableCell>
                        <TableCell>${product.price.toLocaleString()}</TableCell>
                        <TableCell>{getStockChip(product.stock)}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleEditProduct(product)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Movements */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Movimientos de Stock</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMovement}
          >
            Nuevo Movimiento
          </Button>
        </Box>

        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Referencia</TableCell>
                    <TableCell>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockMovements.map((movement) => {
                    const product = products.find(p => p.id === movement.productId);
                    
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.date).toLocaleString()}
                        </TableCell>
                        <TableCell>{product?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={movement.type === 'ENTRY' ? 'Entrada' : 'Salida'}
                            color={movement.type === 'ENTRY' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold">
                            {movement.type === 'ENTRY' ? '+' : '-'}{movement.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell>{movement.reason}</TableCell>
                        <TableCell>{movement.reference}</TableCell>
                        <TableCell>{movement.notes}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 2: Reports */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Reportes de Inventario
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Los reportes estarán disponibles próximamente.
        </Typography>
      </TabPanel>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre del Producto"
              value={productFormData.name}
              onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Descripción"
              value={productFormData.description}
              onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Precio"
                type="number"
                value={productFormData.price}
                onChange={(e) => setProductFormData({ ...productFormData, price: parseFloat(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Stock Actual"
                type="number"
                value={productFormData.stock}
                onChange={(e) => setProductFormData({ ...productFormData, stock: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Stock Mínimo"
                type="number"
                value={productFormData.minStock}
                onChange={(e) => setProductFormData({ ...productFormData, minStock: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <Autocomplete
                options={categories}
                getOptionLabel={(category) => category.name}
                value={categories.find(c => c.id.toString() === productFormData.categoryId) || null}
                onChange={(_, value) => setProductFormData({ ...productFormData, categoryId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Categoría" required fullWidth />
                )}
                sx={{ flex: 1 }}
              />
              
              <Autocomplete
                options={suppliers}
                getOptionLabel={(supplier) => supplier.name}
                value={suppliers.find(s => s.id.toString() === productFormData.supplierId) || null}
                onChange={(_, value) => setProductFormData({ ...productFormData, supplierId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Proveedor" required fullWidth />
                )}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveProduct} variant="contained">
            {editingProduct ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onClose={() => setMovementDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Movimiento de Stock</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Autocomplete
              options={products}
              getOptionLabel={(product) => `${product.name} (Stock: ${product.stock})`}
              value={products.find(p => p.id.toString() === movementFormData.productId) || null}
              onChange={(_, value) => setMovementFormData({ ...movementFormData, productId: value?.id.toString() || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Producto" required fullWidth />
              )}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select
                value={movementFormData.type}
                onChange={(e) => setMovementFormData({ ...movementFormData, type: e.target.value as MovementType })}
              >
                <MenuItem value="ENTRY">Entrada</MenuItem>
                <MenuItem value="EXIT">Salida</MenuItem>
                <MenuItem value="ADJUSTMENT">Ajuste</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Cantidad"
              type="number"
              value={movementFormData.quantity}
              onChange={(e) => setMovementFormData({ ...movementFormData, quantity: parseInt(e.target.value) || 0 })}
              fullWidth
              required
            />
            
            <TextField
              label="Motivo"
              value={movementFormData.reason}
              onChange={(e) => setMovementFormData({ ...movementFormData, reason: e.target.value })}
              fullWidth
              required
              placeholder="ej: Compra, Venta, Devolución, Ajuste"
            />
            
            <TextField
              label="Referencia"
              value={movementFormData.reference}
              onChange={(e) => setMovementFormData({ ...movementFormData, reference: e.target.value })}
              fullWidth
              placeholder="ej: PO-2024-001, VT-2024-001"
            />
            
            <TextField
              label="Notas"
              value={movementFormData.notes}
              onChange={(e) => setMovementFormData({ ...movementFormData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveMovement} variant="contained">
            Guardar Movimiento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockPage;
