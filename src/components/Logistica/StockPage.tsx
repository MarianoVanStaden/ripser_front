import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  TablePagination,
  Link,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { productApi } from '../../api/services/productApi';
import { movimientoStockApi } from '../../api/services/movimientoStockApi';
import { categoriaProductoApi } from '../../api/services/categoriaProductoApi';
import type { Producto, MovimientoStock, CategoriaProducto } from '../../types';
import { generateStockInventoryPDF } from '../../utils/pdfExportUtils';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StockPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Producto[]>([]);
  const [stockMovements, setStockMovements] = useState<MovimientoStock[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    precio: 0,
    stockMinimo: 0,
    categoriaProductoId: 1,
    activo: true,
  });

  // Filter states for Inventory tab
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  // Pagination states for Inventory tab
  const [pageInventory, setPageInventory] = useState(0);
  const [rowsPerPageInventory, setRowsPerPageInventory] = useState(10);

  // Filter states for Movements tab
  const [searchMovements, setSearchMovements] = useState('');
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState<string>('all');

  // Pagination states for Movements tab
  const [pageMovements, setPageMovements] = useState(0);
  const [rowsPerPageMovements, setRowsPerPageMovements] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Request all products with a large page size to avoid pagination issues
      const [productsData, movementsData, categoriasData] = await Promise.all([
        productApi.getAll(0, 10000), // Request up to 10000 products
        movimientoStockApi.getAll(),
        categoriaProductoApi.getAll(),
      ]);

      console.log('📦 Productos cargados desde el backend:', productsData.length, productsData);
      console.log('📂 Categorías cargadas:', categoriasData);
      console.log('🔍 Muestra de productos:', productsData.slice(0, 5));

      setProducts(productsData);
      setStockMovements(movementsData);
      setCategorias(categoriasData);
      setError(null);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.');
      } else {
        setError('Error al cargar los datos');
      }
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Producto) => {
    setSelectedProduct(product);
    setEditForm({
      nombre: product.nombre,
      codigo: product.codigo || '',
      descripcion: product.descripcion || '',
      precio: product.precio,
      stockMinimo: product.stockMinimo,
      categoriaProductoId: product.categoriaProducto?.id || product.categoriaProductoId || 1,
      activo: product.activo,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await productApi.update(selectedProduct.id, {
        nombre: editForm.nombre,
        codigo: editForm.codigo,
        descripcion: editForm.descripcion,
        precio: editForm.precio,
        stockMinimo: editForm.stockMinimo,
        categoriaProductoId: editForm.categoriaProductoId,
        activo: editForm.activo,
      });

      await loadData();
      setEditDialogOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Error al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const lowStockCount = products.filter(p => p.stockActual <= p.stockMinimo && p.stockActual > 0).length;
  const outOfStockCount = products.filter(p => p.stockActual === 0).length;

  // Filter products for Inventory tab
  const filteredProducts = useMemo(() => {
    console.log('🔍 Filtrando productos...');
    console.log('Total productos:', products.length);
    console.log('Filtros activos:', { searchTerm, categoriaFilter, estadoFilter });

    // Debug: Log category data for first few products
    console.log('🏷️ Muestra de categorías en productos:');
    products.slice(0, 3).forEach(p => {
      console.log(`  - ${p.nombre}:`, {
        categoriaProductoId: p.categoriaProductoId,
        categoriaProducto: p.categoriaProducto,
        categoriaProductoNombre: p.categoriaProductoNombre
      });
    });

    const filtered = products.filter((product) => {
      const matchesSearch = searchTerm === '' ||
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      // More robust category matching - check all possible category fields
      let matchesCategoria = categoriaFilter === 'all';
      if (!matchesCategoria && categoriaFilter !== 'all') {
        const productCategoryId =
          product.categoriaProductoId?.toString() ||
          product.categoriaProducto?.id?.toString();

        matchesCategoria = productCategoryId === categoriaFilter;
      }

      let matchesEstado = true;
      if (estadoFilter === 'sin-stock') {
        matchesEstado = product.stockActual === 0;
      } else if (estadoFilter === 'stock-bajo') {
        matchesEstado = product.stockActual > 0 && product.stockActual <= product.stockMinimo;
      } else if (estadoFilter === 'disponible') {
        matchesEstado = product.stockActual > product.stockMinimo;
      } else if (estadoFilter === 'inactivo') {
        matchesEstado = !product.activo;
      } else if (estadoFilter === 'activo') {
        matchesEstado = product.activo;
      }

      const passes = matchesSearch && matchesCategoria && matchesEstado;

      if (!passes && categoriaFilter !== 'all') {
        console.log(`❌ Producto filtrado: ${product.nombre}`, {
          matchesSearch,
          matchesCategoria,
          matchesEstado,
          categoriaFilter,
          categoriaProductoId: product.categoriaProductoId,
          categoriaProducto: product.categoriaProducto,
          activo: product.activo,
          stockActual: product.stockActual,
        });
      }

      return passes;
    });

    console.log('✅ Productos después del filtro:', filtered.length);
    return filtered;
  }, [products, searchTerm, categoriaFilter, estadoFilter]);

  // Paginate filtered products
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      pageInventory * rowsPerPageInventory,
      pageInventory * rowsPerPageInventory + rowsPerPageInventory
    );
  }, [filteredProducts, pageInventory, rowsPerPageInventory]);

  const handleChangePageInventory = (_event: unknown, newPage: number) => {
    setPageInventory(newPage);
  };

  const handleChangeRowsPerPageInventory = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageInventory(parseInt(event.target.value, 10));
    setPageInventory(0);
  };

  // Filter movements and sort by date descending (newest first)
  const filteredMovements = useMemo(() => {
    const filtered = stockMovements.filter((movement) => {
      const matchesSearch = searchMovements === '' ||
        movement.productoNombre?.toLowerCase().includes(searchMovements.toLowerCase()) ||
        movement.concepto?.toLowerCase().includes(searchMovements.toLowerCase()) ||
        movement.numeroComprobante?.toLowerCase().includes(searchMovements.toLowerCase());

      const matchesTipo = tipoMovimientoFilter === 'all' || movement.tipo === tipoMovimientoFilter;

      return matchesSearch && matchesTipo;
    });

    // Sort by date descending (newest first)
    return filtered.sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [stockMovements, searchMovements, tipoMovimientoFilter]);

  // Paginate filtered movements
  const paginatedMovements = useMemo(() => {
    return filteredMovements.slice(
      pageMovements * rowsPerPageMovements,
      pageMovements * rowsPerPageMovements + rowsPerPageMovements
    );
  }, [filteredMovements, pageMovements, rowsPerPageMovements]);

  const handleChangePageMovements = (_event: unknown, newPage: number) => {
    setPageMovements(newPage);
  };

  const handleChangeRowsPerPageMovements = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageMovements(parseInt(event.target.value, 10));
    setPageMovements(0);
  };

  // Handler para exportar inventario a PDF
  const handleExportInventoryPDF = async (): Promise<void> => {
    try {
      const categoriaNombre = categoriaFilter !== 'all'
        ? categorias.find(c => c.id.toString() === categoriaFilter)?.nombre || ''
        : '';

      await generateStockInventoryPDF(
        filteredProducts,
        {
          searchTerm,
          categoriaFilter: categoriaNombre,
          estadoFilter,
        },
        {
          totalProducts: products.length,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          totalValue: products.reduce((sum, p) => sum + (p.precio * p.stockActual), 0),
        }
      );
    } catch (error) {
      console.error('Error al generar PDF de inventario:', error);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  const getStockChip = (stock: number, stockMinimo: number, activo: boolean) => {
    if (!activo) {
      return <Chip label="Inactivo" color="default" size="small" />;
    } else if (stock === 0) {
      return <Chip label="Sin Stock" color="error" size="small" />;
    } else if (stock <= stockMinimo) {
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
        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={handleExportInventoryPDF}
        >
          Exportar PDF
        </Button>
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
              <InventoryIcon color="info" />
              <Box>
                <Typography variant="h4">
                  ${products.reduce((sum, p) => sum + (p.precio * p.stockActual), 0).toLocaleString()}
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
        </Tabs>
      </Box>

      {/* Tab Panel 0: Inventory */}
      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Filtros</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código, descripción..."
              />
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoriaFilter}
                  label="Categoría"
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {categorias.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  label="Estado"
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="disponible">Disponible</MenuItem>
                  <MenuItem value="stock-bajo">Stock Bajo</MenuItem>
                  <MenuItem value="sin-stock">Sin Stock</MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 100 }}>Código</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Producto</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Stock Actual</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Stock Mínimo</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Categoría</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Precio</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.codigo}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {product.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.descripcion}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="h6" fontWeight="bold">
                          {product.stockActual}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {product.stockMinimo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.categoriaProductoNombre || product.categoriaProducto?.nombre || 'Sin categoría'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>${product.precio.toLocaleString()}</TableCell>
                      <TableCell>
                        {getStockChip(product.stockActual, product.stockMinimo, product.activo)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditProduct(product)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box textAlign="center" py={4}>
                          <Typography variant="body1" color="text.secondary">
                            No se encontraron productos con los filtros aplicados
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
              count={filteredProducts.length}
              page={pageInventory}
              onPageChange={handleChangePageInventory}
              rowsPerPage={rowsPerPageInventory}
              onRowsPerPageChange={handleChangeRowsPerPageInventory}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Movements */}
      <TabPanel value={tabValue} index={1}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Filtros</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchMovements}
                onChange={(e) => setSearchMovements(e.target.value)}
                placeholder="Buscar por producto, concepto, comprobante..."
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  value={tipoMovimientoFilter}
                  label="Tipo de Movimiento"
                  onChange={(e) => setTipoMovimientoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="ENTRADA">Entrada</MenuItem>
                  <MenuItem value="SALIDA">Salida</MenuItem>
                  <MenuItem value="SALIDA_FABRICACION">Salida Fabricación</MenuItem>
                  <MenuItem value="REINGRESO_CANCELACION_FABRICACION">Reingreso</MenuItem>
                  <MenuItem value="RECUENTO">Recuento</MenuItem>
                  <MenuItem value="AJUSTE">Ajuste</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150 }}>Fecha</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Producto</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Tipo</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Cantidad</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Concepto</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Comprobante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMovements.map((movement) => {
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.fecha).toLocaleString()}
                        </TableCell>
                        <TableCell>{movement.productoNombre || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              movement.tipo === 'ENTRADA' ? 'Entrada' :
                              movement.tipo === 'SALIDA' ? 'Salida' :
                              movement.tipo === 'SALIDA_FABRICACION' ? 'Salida Fab.' :
                              movement.tipo === 'REINGRESO_CANCELACION_FABRICACION' ? 'Reingreso' :
                              movement.tipo === 'RECUENTO' ? 'Recuento' :
                              'Ajuste'
                            }
                            color={
                              movement.tipo === 'ENTRADA' || movement.tipo === 'REINGRESO_CANCELACION_FABRICACION' ? 'success' :
                              movement.tipo === 'SALIDA' || movement.tipo === 'SALIDA_FABRICACION' ? 'error' :
                              'info'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            fontWeight="bold"
                            color={
                              movement.tipo === 'ENTRADA' ||
                              movement.tipo === 'REINGRESO_CANCELACION_FABRICACION' ||
                              (movement.tipo === 'AJUSTE' && movement.cantidad > 0)
                                ? 'success.main'
                                : movement.tipo === 'SALIDA' ||
                                  movement.tipo === 'SALIDA_FABRICACION' ||
                                  (movement.tipo === 'AJUSTE' && movement.cantidad < 0)
                                ? 'error.main'
                                : 'text.primary'
                            }
                          >
                            {movement.tipo === 'AJUSTE'
                              ? (movement.cantidad >= 0 ? '+' : '') + movement.cantidad
                              : movement.tipo === 'ENTRADA' || movement.tipo === 'REINGRESO_CANCELACION_FABRICACION'
                              ? '+' + Math.abs(movement.cantidad)
                              : '-' + Math.abs(movement.cantidad)
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>{movement.concepto}</TableCell>
                        <TableCell>{movement.numeroComprobante}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredMovements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box textAlign="center" py={4}>
                          <Typography variant="body1" color="text.secondary">
                            No se encontraron movimientos con los filtros aplicados
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
              count={filteredMovements.length}
              page={pageMovements}
              onPageChange={handleChangePageMovements}
              rowsPerPage={rowsPerPageMovements}
              onRowsPerPageChange={handleChangeRowsPerPageMovements}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Producto: {selectedProduct?.nombre}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Código"
              value={editForm.codigo}
              onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
              fullWidth
              helperText="Código único del producto"
            />

            <TextField
              label="Descripción"
              value={editForm.descripcion}
              onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Precio"
              type="number"
              value={editForm.precio}
              onChange={(e) => setEditForm({ ...editForm, precio: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
            />

            <TextField
              label="Stock Mínimo"
              type="number"
              value={editForm.stockMinimo}
              onChange={(e) => setEditForm({ ...editForm, stockMinimo: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Define el umbral para 'Stock Bajo'"
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={editForm.categoriaProductoId}
                label="Categoría"
                onChange={(e) => setEditForm({ ...editForm, categoriaProductoId: e.target.value as number })}
              >
                {categorias.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={editForm.activo}
                  onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
                />
              }
              label="Producto Activo"
            />

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Stock Actual: <strong>{selectedProduct?.stockActual}</strong>
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Stock se actualiza automáticamente desde Compras
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockPage;
