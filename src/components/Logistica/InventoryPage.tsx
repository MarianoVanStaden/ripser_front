import React, { useState, useEffect, useMemo } from 'react';
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
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  QrCode as QrCodeIcon,
  Assignment as AssignmentIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { Producto, CategoriaProducto, InventoryAdjustment, MovimientoStock } from '../../types';
import { productApi, movimientoStockApi, categoriaProductoApi } from '../../api/services';

const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [categories, setCategories] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [recountDialogOpen, setRecountDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{ title: string; content: string }>({
    title: '',
    content: ''
  });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [adjustmentFilter, setAdjustmentFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Pagination for adjustments
  const [adjustmentPage, setAdjustmentPage] = useState(0);
  const [adjustmentRowsPerPage, setAdjustmentRowsPerPage] = useState(10);
  
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
      
      // Load data from backend APIs
      const [productsData, categoriesData, movimientosData] = await Promise.all([
        productApi.getAll(0, 10000),
        categoriaProductoApi.getAll(),
        movimientoStockApi.getAll()
      ]);
      
      console.log('Products loaded:', productsData.length);
      console.log('Categories loaded:', categoriesData.length, categoriesData);
      console.log('Sample product:', productsData[0]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Filter movements to get only adjustments (AJUSTE type)
      const inventoryAdjustments: InventoryAdjustment[] = movimientosData
        .filter((movement: MovimientoStock) => movement.tipo === 'AJUSTE')
        .map((movement: MovimientoStock) => {
          // Backend returns producto as an object, extract the ID
          const productId = typeof movement.producto === 'object' 
            ? movement.producto.id 
            : movement.productoId || 0;
          
          return {
            id: movement.id || 0,
            productId: productId,
            type: 'ADJUSTMENT' as const,
            expectedQuantity: movement.stockAnterior || 0,
            actualQuantity: movement.stockActual || 0,
            difference: movement.cantidad,
            reason: movement.concepto || 'Ajuste de inventario',
            employeeId: movement.usuarioId || 1,
            date: movement.fecha,
            notes: movement.numeroComprobante || '',
            status: 'APPROVED' as const, // Historical movements are approved
          };
        });
      
      setAdjustments(inventoryAdjustments);
      
    } catch (err) {
      setError('Error al cargar los datos de inventario');
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    return !selectedCategory || product.categoriaProductoId === selectedCategory;
  });

  // Filter and sort adjustments by date descending (newest first)
  const filteredAdjustments = useMemo(() => {
    const filtered = adjustments.filter(adjustment => {
      return adjustmentFilter === 'all' || adjustment.status.toLowerCase() === adjustmentFilter;
    });

    // Sort by date descending (newest first)
    return filtered.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [adjustments, adjustmentFilter]);

  // Paginate adjustments
  const paginatedAdjustments = useMemo(() => {
    const startIndex = adjustmentPage * adjustmentRowsPerPage;
    const endIndex = startIndex + adjustmentRowsPerPage;
    return filteredAdjustments.slice(startIndex, endIndex);
  }, [filteredAdjustments, adjustmentPage, adjustmentRowsPerPage]);

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
      
      // Get current product stock
      const product = products.find(p => p.id === parseInt(adjustmentFormData.productId));
      if (!product) {
        setError('Producto no encontrado');
        setLoading(false);
        return;
      }

      const newStockActual = product.stockActual + difference;
      
      // The backend expects the full producto object (ManyToOne relationship)
      const movementData = {
        producto: {
          id: parseInt(adjustmentFormData.productId)
        },
        tipo: 'AJUSTE' as const,
        cantidad: difference,
        stockAnterior: product.stockActual,
        stockActual: newStockActual,
        concepto: adjustmentFormData.reason,
        numeroComprobante: `ADJ-${Date.now()}`,
        fecha: new Date().toISOString(),
      };
      
      console.log('Creating stock movement:', movementData);
      const newMovement = await movimientoStockApi.create(movementData);
      
      console.log('Movement created successfully:', newMovement);
      
      // Convert the stock movement to an inventory adjustment
      // Backend returns producto as an object, extract the ID
      const productId = typeof newMovement.producto === 'object' 
        ? newMovement.producto.id 
        : newMovement.productoId || parseInt(adjustmentFormData.productId);
      
      const newAdjustment: InventoryAdjustment = {
        id: newMovement.id || 0,
        productId: productId,
        type: adjustmentFormData.type,
        expectedQuantity: adjustmentFormData.expectedQuantity,
        actualQuantity: adjustmentFormData.actualQuantity,
        difference,
        reason: newMovement.concepto || adjustmentFormData.reason,
        employeeId: newMovement.usuarioId || 1,
        date: newMovement.fecha,
        notes: adjustmentFormData.notes,
        status: 'APPROVED' as const,
      };
      
      setAdjustments([newAdjustment, ...adjustments]);
      
      // Update product stock locally
      const updatedProducts = products.map(p => 
        p.id === parseInt(adjustmentFormData.productId)
          ? { ...p, stockActual: newStockActual }
          : p
      );
      setProducts(updatedProducts);
      
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
      setError(null);
      
      const request = {
        categoriaId: recountFormData.categoryId ? parseInt(recountFormData.categoryId) : null,
        notas: recountFormData.notes || undefined,
        // usuarioId would come from AuthContext in a real app
        usuarioId: 1, // TODO: Get from logged-in user
      };

      console.log('Starting recount with request:', request);
      
      // Call the real backend API
      const response = await movimientoStockApi.iniciarRecuento(request);
      
      console.log('Recount initiated:', response);
      
      setRecountDialogOpen(false);

      // Show detailed success message
      setSuccessMessage({
        title: 'Recuento Iniciado Exitosamente',
        content: `• Total de productos: ${response.totalProductos}\n• Categoría: ${response.categoriaSeleccionada}\n• Fecha: ${new Date(response.fechaInicio).toLocaleString()}\n\nLos movimientos de recuento han sido creados. Dirígete a la página de "Tareas de Recuento" para completar el conteo físico.`
      });
      setSuccessDialogOpen(true);

      // Reload data to show new recount movements
      await loadData();
      
    } catch (err) {
      setError('Error al iniciar el recuento. Verifica que el backend esté activo.');
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
          ? { ...product, stockActual: product.stockActual + adjustment.difference }
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
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
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
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
          }}
        >
          <AssignmentIcon sx={{ fontSize: { xs: 28, md: 35 } }} />
          Inventario y Reposiciones
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={handleStartRecount}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Iniciar Recuento
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddAdjustment}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
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
                    {category.nombre}
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
                  <TableCell align="center">Stock Actual</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Valor Inventario</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoriaProductoId);
                  const inventoryValue = product.precio * product.stockActual;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {product.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.descripcion || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={category?.nombre || product.categoriaProductoNombre || 'Sin categoría'} 
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {product.stockActual}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${product.precio.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${inventoryValue.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {product.stockActual === 0 ? (
                          <Chip label="Sin Stock" color="error" size="small" />
                        ) : product.stockActual <= product.stockMinimo ? (
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
                {paginatedAdjustments.map((adjustment) => {
                  const product = products.find(p => p.id === adjustment.productId);

                  return (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        {new Date(adjustment.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{product?.nombre || 'N/A'}</TableCell>
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
          <TablePagination
            component="div"
            count={filteredAdjustments.length}
            page={adjustmentPage}
            onPageChange={(_, newPage) => setAdjustmentPage(newPage)}
            rowsPerPage={adjustmentRowsPerPage}
            onRowsPerPageChange={(e) => {
              setAdjustmentRowsPerPage(parseInt(e.target.value, 10));
              setAdjustmentPage(0);
            }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onClose={() => setAdjustmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajuste Manual de Inventario</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Autocomplete
              options={products}
              getOptionLabel={(product) => `${product.nombre} (Stock: ${product.stockActual})`}
              value={products.find(p => p.id.toString() === adjustmentFormData.productId) || null}
              onChange={(_, value) => {
                setAdjustmentFormData({ 
                  ...adjustmentFormData, 
                  productId: value?.id.toString() || '',
                  expectedQuantity: value?.stockActual || 0
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
                    {category.nombre}
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

      {/* Success Result Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {successMessage.title}
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mt: 1 }}>
            {successMessage.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < successMessage.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialogOpen(false)} variant="contained">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;
