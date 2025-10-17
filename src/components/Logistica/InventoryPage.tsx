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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  QrCode as QrCodeIcon,
  Assignment as AssignmentIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { Product, Supplier, Category, InventoryAdjustment, MovementType } from '../../types';
import { productApi, supplierApi, categoryApi, stockMovementApi } from '../../api/services';

// Helper function to map inventory adjustment types to movement types
const mapAdjustmentTypeToMovementType = (adjustmentType: 'RECOUNT' | 'DAMAGE' | 'THEFT' | 'ADJUSTMENT'): MovementType => {
  switch (adjustmentType) {
    case 'RECOUNT':
    case 'ADJUSTMENT':
      return 'ADJUSTMENT';
    case 'DAMAGE':
      return 'DAMAGED';
    case 'THEFT':
      return 'LOST';
    default:
      return 'ADJUSTMENT';
  }
};

// Helper function to map movement types back to adjustment types
const mapMovementTypeToAdjustmentType = (movementType: MovementType): 'RECOUNT' | 'DAMAGE' | 'THEFT' | 'ADJUSTMENT' => {
  switch (movementType) {
    case 'ADJUSTMENT':
      return 'ADJUSTMENT';
    case 'DAMAGED':
      return 'DAMAGE';
    case 'LOST':
      return 'THEFT';
    default:
      return 'ADJUSTMENT';
  }
};

// Mock data for development
const mockInventoryAdjustments: InventoryAdjustment[] = [
  {
    id: 1,
    productId: 1,
    type: 'RECOUNT',
    expectedQuantity: 10,
    actualQuantity: 8,
    difference: -2,
    reason: 'Discrepancia en inventario físico',
    employeeId: 1,
    date: '2024-01-20T10:00:00Z',
    notes: 'Productos dañados encontrados durante recuento',
    status: 'APPROVED',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 2,
    productId: 2,
    type: 'DAMAGE',
    expectedQuantity: 15,
    actualQuantity: 12,
    difference: -3,
    reason: 'Productos dañados durante transporte',
    employeeId: 1,
    date: '2024-01-22T14:30:00Z',
    notes: 'Embalaje defectuoso',
    status: 'PENDING',
    createdAt: '2024-01-22T14:30:00Z',
    updatedAt: '2024-01-22T14:30:00Z',
  },
];

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [recountDialogOpen, setRecountDialogOpen] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [adjustmentFilter, setAdjustmentFilter] = useState<'all' | 'pending' | 'approved'>('all');
  
  // Forms
  const [adjustmentFormData, setAdjustmentFormData] = useState({
    productId: '',
    type: 'ADJUSTMENT' as 'RECOUNT' | 'DAMAGE' | 'THEFT' | 'ADJUSTMENT',
    expectedQuantity: 0,
    actualQuantity: 0,
    reason: '',
    notes: '',
  });
  
  const [recountFormData, setRecountFormData] = useState({
    categoryId: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load data from backend APIs
      try {
        const [productsData, suppliersData, categoriesData, adjustmentsData] = await Promise.all([
          productApi.getAll(),
          supplierApi.getAll(),
          categoryApi.getAll(),
          stockMovementApi.getAll()
        ]);
        
        setProducts(productsData);
        setSuppliers(suppliersData);
        setCategories(categoriesData);
        
        // Filter movements to get only adjustments
        const inventoryAdjustments = adjustmentsData
          .filter(movement => ['ADJUSTMENT', 'DAMAGED', 'LOST'].includes(movement.type))
          .map(movement => ({
            id: movement.id,
            productId: movement.productId,
            type: mapMovementTypeToAdjustmentType(movement.type),
            expectedQuantity: 0, // This would need to be calculated or stored separately
            actualQuantity: Math.abs(movement.quantity),
            difference: movement.quantity,
            reason: movement.reason || 'No especificado',
            employeeId: movement.employeeId,
            date: movement.date,
            notes: movement.notes || '',
            status: 'APPROVED' as const, // Assume all historical movements are approved
            createdAt: movement.createdAt,
            updatedAt: movement.updatedAt,
          }));
        
        setAdjustments(inventoryAdjustments);
        
      } catch (apiError) {
        console.warn('Backend API not available, using mock data:', apiError);
        
        // Fallback to mock data if backend is not available
        setProducts([
          {
            id: 1,
            name: 'Laptop HP Pavilion',
            description: 'Laptop HP Pavilion 15.6" Intel Core i5',
            price: 85000,
            stock: 8,
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
            stock: 12,
            categoryId: 2,
            supplierId: 2,
            isActive: true,
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-20T14:15:00Z',
          },
        ]);
        
        setSuppliers([
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
        ]);
        
        setCategories([
          { id: 1, name: 'Computadoras', description: 'Equipos de computación', isActive: true, createdAt: '', updatedAt: '' },
          { id: 2, name: 'Periféricos', description: 'Accesorios y periféricos', isActive: true, createdAt: '', updatedAt: '' },
        ]);
        
        setAdjustments(mockInventoryAdjustments);
      }
      
    } catch (err) {
      setError('Error al cargar los datos de inventario');
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    return !selectedCategory || product.categoryId === selectedCategory;
  });

  const filteredAdjustments = adjustments.filter(adjustment => {
    return adjustmentFilter === 'all' || adjustment.status.toLowerCase() === adjustmentFilter;
  });

  const handleAddAdjustment = () => {
    setAdjustmentFormData({
      productId: '',
      type: 'ADJUSTMENT',
      expectedQuantity: 0,
      actualQuantity: 0,
      reason: '',
      notes: '',
    });
    setAdjustmentDialogOpen(true);
  };

  const handleSaveAdjustment = async () => {
    try {
      setLoading(true);
      const difference = adjustmentFormData.actualQuantity - adjustmentFormData.expectedQuantity;
      
      // Try to create adjustment via API
      try {
        const movementData = {
          productId: parseInt(adjustmentFormData.productId),
          type: mapAdjustmentTypeToMovementType(adjustmentFormData.type),
          quantity: difference,
          reason: adjustmentFormData.reason,
          notes: adjustmentFormData.notes,
          employeeId: 1, // This would come from current user context
          date: new Date().toISOString(),
          reference: `ADJ-${Date.now()}`
        };
        
        const newMovement = await stockMovementApi.create(movementData);
        
        // Convert the stock movement to an inventory adjustment
        const newAdjustment: InventoryAdjustment = {
          id: newMovement.id,
          productId: newMovement.productId,
          type: newMovement.type as 'RECOUNT' | 'DAMAGE' | 'THEFT' | 'ADJUSTMENT',
          expectedQuantity: adjustmentFormData.expectedQuantity,
          actualQuantity: adjustmentFormData.actualQuantity,
          difference,
          reason: newMovement.reason,
          employeeId: newMovement.employeeId,
          date: newMovement.date,
          notes: newMovement.notes || '',
          status: 'APPROVED' as const,
          createdAt: newMovement.createdAt,
          updatedAt: newMovement.updatedAt,
        };
        
        setAdjustments([newAdjustment, ...adjustments]);
        
        // Update product stock locally
        const updatedProducts = products.map(product => 
          product.id === parseInt(adjustmentFormData.productId)
            ? { ...product, stock: product.stock + difference }
            : product
        );
        setProducts(updatedProducts);
        
      } catch (apiError) {
        console.warn('API not available, creating adjustment locally:', apiError);
        
        // Fallback to local creation if API is not available
        const newAdjustment: InventoryAdjustment = {
          id: Math.max(...adjustments.map(a => a.id)) + 1,
          ...adjustmentFormData,
          productId: parseInt(adjustmentFormData.productId),
          difference,
          employeeId: 1, // This would come from current user
          date: new Date().toISOString(),
          status: 'PENDING' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setAdjustments([newAdjustment, ...adjustments]);
      }
      
      setAdjustmentDialogOpen(false);
      
    } catch (err) {
      setError('Error al guardar el ajuste de inventario');
      console.error('Error saving adjustment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecount = () => {
    setRecountFormData({
      categoryId: '',
      notes: '',
    });
    setRecountDialogOpen(true);
  };

  const handleSaveRecount = async () => {
    try {
      setLoading(true);
      console.log('Starting recount:', recountFormData);
      
      // Get products for the selected category (or all if no category)
      const productsToRecount = recountFormData.categoryId 
        ? products.filter(p => p.categoryId === parseInt(recountFormData.categoryId))
        : products;
      
      // In a real app, this would create recount tasks/movements for all products
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRecountDialogOpen(false);
      
      // Show success message
      alert(`Recuento iniciado exitosamente para ${productsToRecount.length} productos`);
      
    } catch (err) {
      setError('Error al iniciar el recuento');
      console.error('Error starting recount:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveAdjustment = async (id: number) => {
    try {
      const adjustment = adjustments.find(a => a.id === id);
      if (!adjustment) return;
      
      console.log('Approving adjustment:', id);
      
      // In a real backend, this would likely be handled by updating the stock movement status
      // For now, we'll just update the local state since the movement was already created
      
      // Update product stock locally
      setProducts(products.map(product => 
        product.id === adjustment.productId
          ? { ...product, stock: product.stock + adjustment.difference }
          : product
      ));
      
      // Update adjustment status
      setAdjustments(adjustments.map(adj => 
        adj.id === id 
          ? { ...adj, status: 'APPROVED' as const, updatedAt: new Date().toISOString() }
          : adj
      ));
      
    } catch (err) {
      setError('Error al aprobar el ajuste');
      console.error('Error approving adjustment:', err);
    }
  };

  const getAdjustmentTypeChip = (type: string) => {
    const typeConfig = {
      RECOUNT: { label: 'Recuento', color: 'info' as const },
      DAMAGE: { label: 'Daño', color: 'warning' as const },
      THEFT: { label: 'Robo', color: 'error' as const },
      ADJUSTMENT: { label: 'Ajuste', color: 'default' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.ADJUSTMENT;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendiente', color: 'warning' as const },
      APPROVED: { label: 'Aprobado', color: 'success' as const },
      REJECTED: { label: 'Rechazado', color: 'error' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Chip label={config.label} color={config.color} size="small" />;
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
          <AssignmentIcon />
          Inventario y Reposiciones
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={handleStartRecount}
          >
            Iniciar Recuento
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddAdjustment}
          >
            Ajuste Manual
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Products Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Estado del Inventario</Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Categoría</InputLabel>
              <Select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value as number || null)}
              >
                <MenuItem value="">Todas las categorías</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Proveedor</TableCell>
                  <TableCell align="center">Stock Actual</TableCell>
                  <TableCell>Valor Inventario</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const supplier = suppliers.find(s => s.id === product.supplierId);
                  const inventoryValue = product.price * product.stock;
                  
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
                      <TableCell>${inventoryValue.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        {product.stock === 0 ? (
                          <Chip label="Sin Stock" color="error" size="small" />
                        ) : product.stock <= 5 ? (
                          <Chip label="Stock Bajo" color="warning" size="small" />
                        ) : (
                          <Chip label="OK" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="Generar código QR">
                          <QrCodeIcon />
                        </IconButton>
                        <IconButton size="small" title="Imprimir etiqueta">
                          <PrintIcon />
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

      {/* Adjustments Section */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Ajustes de Inventario</Typography>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={adjustmentFilter}
                onChange={(e) => setAdjustmentFilter(e.target.value as 'all' | 'pending' | 'approved')}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendientes</MenuItem>
                <MenuItem value="approved">Aprobados</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="center">Esperado</TableCell>
                  <TableCell align="center">Real</TableCell>
                  <TableCell align="center">Diferencia</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAdjustments.map((adjustment) => {
                  const product = products.find(p => p.id === adjustment.productId);
                  
                  return (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        {new Date(adjustment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{product?.name || 'N/A'}</TableCell>
                      <TableCell>{getAdjustmentTypeChip(adjustment.type)}</TableCell>
                      <TableCell align="center">{adjustment.expectedQuantity}</TableCell>
                      <TableCell align="center">{adjustment.actualQuantity}</TableCell>
                      <TableCell align="center">
                        <Typography 
                          fontWeight="bold"
                          color={adjustment.difference >= 0 ? 'success.main' : 'error.main'}
                        >
                          {adjustment.difference >= 0 ? '+' : ''}{adjustment.difference}
                        </Typography>
                      </TableCell>
                      <TableCell>{adjustment.reason}</TableCell>
                      <TableCell>{getStatusChip(adjustment.status)}</TableCell>
                      <TableCell align="center">
                        {adjustment.status === 'PENDING' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => approveAdjustment(adjustment.id)}
                          >
                            Aprobar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onClose={() => setAdjustmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajuste Manual de Inventario</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Autocomplete
              options={products}
              getOptionLabel={(product) => `${product.name} (Stock: ${product.stock})`}
              value={products.find(p => p.id.toString() === adjustmentFormData.productId) || null}
              onChange={(_, value) => {
                setAdjustmentFormData({ 
                  ...adjustmentFormData, 
                  productId: value?.id.toString() || '',
                  expectedQuantity: value?.stock || 0
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Producto" required fullWidth />
              )}
            />
            
            <FormControl fullWidth required>
              <InputLabel>Tipo de Ajuste</InputLabel>
              <Select
                value={adjustmentFormData.type}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, type: e.target.value as any })}
              >
                <MenuItem value="RECOUNT">Recuento</MenuItem>
                <MenuItem value="DAMAGE">Daño</MenuItem>
                <MenuItem value="THEFT">Robo/Pérdida</MenuItem>
                <MenuItem value="ADJUSTMENT">Ajuste General</MenuItem>
              </Select>
            </FormControl>
            
            <Box display="flex" gap={2}>
              <TextField
                label="Cantidad Esperada"
                type="number"
                value={adjustmentFormData.expectedQuantity}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, expectedQuantity: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Cantidad Real"
                type="number"
                value={adjustmentFormData.actualQuantity}
                onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, actualQuantity: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
            </Box>
            
            <Box display="flex" alignItems="center" gap={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">Diferencia:</Typography>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                color={adjustmentFormData.actualQuantity - adjustmentFormData.expectedQuantity >= 0 ? 'success.main' : 'error.main'}
              >
                {adjustmentFormData.actualQuantity - adjustmentFormData.expectedQuantity >= 0 ? '+' : ''}
                {adjustmentFormData.actualQuantity - adjustmentFormData.expectedQuantity}
              </Typography>
            </Box>
            
            <TextField
              label="Motivo del Ajuste"
              value={adjustmentFormData.reason}
              onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, reason: e.target.value })}
              fullWidth
              required
              placeholder="ej: Productos dañados, Error de inventario, etc."
            />
            
            <TextField
              label="Notas Adicionales"
              value={adjustmentFormData.notes}
              onChange={(e) => setAdjustmentFormData({ ...adjustmentFormData, notes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustmentDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveAdjustment} variant="contained">
            Crear Ajuste
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recount Dialog */}
      <Dialog open={recountDialogOpen} onClose={() => setRecountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <QrCodeIcon />
            Iniciar Recuento de Inventario
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Alert severity="info">
              El recuento creará tareas de verificación para todos los productos de la categoría seleccionada.
            </Alert>
            
            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={recountFormData.categoryId}
                onChange={(e) => setRecountFormData({ ...recountFormData, categoryId: e.target.value })}
              >
                <MenuItem value="">Toda la bodega</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Notas del Recuento"
              value={recountFormData.notes}
              onChange={(e) => setRecountFormData({ ...recountFormData, notes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Motivo del recuento, instrucciones especiales, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecountDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveRecount} variant="contained">
            Iniciar Recuento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
