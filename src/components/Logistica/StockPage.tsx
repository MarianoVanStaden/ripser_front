import React, { useState, useEffect } from "react";
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
} from "@mui/material";
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
} from "@mui/icons-material";
import type {
  Product,
  Supplier,
  Category,
  StockMovement,
  MovementType,
} from "../../types";
import {
  productApi,
  supplierApi,
  categoryApi,
  stockMovementApi,
} from "../../api/services";

// Mock data for development
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Laptop HP Pavilion",
    description: 'Laptop HP Pavilion 15.6" Intel Core i5',
    price: 85000,
    stock: 5,
    categoryId: 1,
    supplierId: 1,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    name: "Mouse Logitech",
    description: "Mouse óptico USB Logitech",
    price: 2500,
    stock: 2,
    categoryId: 2,
    supplierId: 2,
    isActive: true,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-20T14:15:00Z",
  },
  {
    id: 3,
    name: "Teclado Mecánico",
    description: "Teclado mecánico RGB gaming",
    price: 8500,
    stock: 0,
    categoryId: 2,
    supplierId: 1,
    isActive: true,
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-25T09:45:00Z",
  },
];

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "Tech Supplies S.A.",
    contactPerson: "María González",
    email: "contacto@techsupplies.com",
    phone: "+54 11 4567-8901",
    address: "Av. Tecnología 123, Buenos Aires",
    paymentTerms: "30 días",
    rating: 4.5,
    isActive: true,
    observations: "",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    name: "Distribuidora Central",
    contactPerson: "Carlos Rodríguez",
    email: "ventas@distribuidoracentral.com",
    phone: "+54 11 2345-6789",
    address: "Calle Industrial 456, Buenos Aires",
    paymentTerms: "15 días",
    rating: 4.0,
    isActive: true,
    observations: "",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-20T14:15:00Z",
  },
];

const mockCategories: Category[] = [
  {
    id: 1,
    name: "Computadoras",
    description: "Equipos de computación",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: 2,
    name: "Periféricos",
    description: "Accesorios y periféricos",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

const mockStockMovements: StockMovement[] = [
  {
    id: 1,
    productId: 1,
    type: "ENTRY" as MovementType,
    quantity: 10,
    reason: "Compra a proveedor",
    reference: "PO-2024-001",
    employeeId: 1,
    date: "2024-01-15T10:00:00Z",
    notes: "Recepción de mercadería",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    productId: 1,
    type: "EXIT" as MovementType,
    quantity: 5,
    reason: "Venta",
    reference: "VT-2024-001",
    employeeId: 1,
    date: "2024-01-16T14:30:00Z",
    notes: "Venta a cliente",
    createdAt: "2024-01-16T14:30:00Z",
    updatedAt: "2024-01-16T14:30:00Z",
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    stockMinimo: 0,
    categoriaProductoId: 1,
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load data from APIs - fallback to mock data if API fails
      try {
        const [productsData, suppliersData, categoriesData, movementsData] =
          await Promise.all([
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
        console.warn("API failed, using mock data:", apiError);
        // Fallback to mock data if API is not available
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProducts(mockProducts);
        setSuppliers(mockSuppliers);
        setCategories(mockCategories);
        setStockMovements(mockStockMovements);
        setError(
          "Conectado con datos de prueba. Verifique la conexión del backend."
        );
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
      setError("Error al cargar los datos");
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const productName = product.name ?? "";
    const productDescription = product.description ?? "";

  const getStockChip = (stock: number, stockMinimo: number, activo: boolean) => {
    if (!activo) {
      return <Chip label="Inactivo" color="default" size="small" />;
    } else if (stock === 0) {
      return <Chip label="Sin Stock" color="error" size="small" />;
    } else if (stock <= 5) {
      return <Chip label="Stock Bajo" color="warning" size="small" />;
    } else {
      return <Chip label="Disponible" color="success" size="small" />;
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <InventoryIcon />
          Gestión de Stock
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => console.log("Export inventory")}
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
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
        gap={3}
        sx={{ mb: 3 }}
      >
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
                  $
                  {products
                    .reduce(
                      (sum, p) => sum + (p.price ?? 0) * (p.stock ?? 0),
                      0
                    )
                    .toLocaleString()}
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
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
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
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={selectedCategory || ""}
              onChange={(e) =>
                setSelectedCategory((e.target.value as number) || null)
              }
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
              onChange={(e) =>
                setStockFilter(e.target.value as "all" | "low" | "out")
              }
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
                  {products.map((product) => (
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
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Movements */}
      <TabPanel value={tabValue} index={1}>
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
                    <TableCell>Concepto</TableCell>
                    <TableCell>Comprobante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockMovements.map((movement) => {
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {new Date(movement.fecha).toLocaleString()}
                        </TableCell>
                        <TableCell>{movement.productoNombre || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={movement.tipo === 'ENTRADA' ? 'Entrada' : movement.tipo === 'SALIDA' ? 'Salida' : 'Ajuste'}
                            color={movement.tipo === 'ENTRADA' ? 'success' : movement.tipo === 'SALIDA' ? 'error' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{category?.name || "N/A"}</TableCell>
                        <TableCell>{supplier?.name || "N/A"}</TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" fontWeight="bold">
                            {product.stock}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {`$${(product.price ?? 0).toLocaleString()}`}
                        </TableCell>
                        <TableCell>{getStockChip(product.stock)}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => handleEditProduct(product)}
                            size="small"
                          >
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
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
                    const product = products.find(
                      (p) => p.id === movement.productId
                    );

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {
                            movement.date
                              ? new Date(movement.date).toLocaleString()
                              : "N/A" // O la representación que prefieras
                          }
                        </TableCell>
                        <TableCell>{product?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              movement.type === "ENTRY" ? "Entrada" : "Salida"
                            }
                            color={
                              movement.type === "ENTRY" ? "success" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold">
                            {movement.type === "ENTRY" ? "+" : "-"}
                            {movement.quantity}
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
      <Dialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProduct ? "Editar Producto" : "Agregar Producto"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre"
              value={editForm.nombre}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              fullWidth
              required
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
              fullWidth
              required
            />

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Código: <strong>{selectedProduct?.codigo}</strong>
              </Typography>
              <br />
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
          <Button onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveProduct} variant="contained">
            {editingProduct ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog
        open={movementDialogOpen}
        onClose={() => setMovementDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo Movimiento de Stock</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Autocomplete
              options={products}
              getOptionLabel={(product) =>
                `${product.name} (Stock: ${product.stock})`
              }
              value={
                products.find(
                  (p) => p.id.toString() === movementFormData.productId
                ) || null
              }
              onChange={(_, value) =>
                setMovementFormData({
                  ...movementFormData,
                  productId: value?.id.toString() || "",
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Producto" required fullWidth />
              )}
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select
                value={movementFormData.type}
                onChange={(e) =>
                  setMovementFormData({
                    ...movementFormData,
                    type: e.target.value as MovementType,
                  })
                }
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
              onChange={(e) =>
                setMovementFormData({
                  ...movementFormData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              fullWidth
              required
            />

            <TextField
              label="Motivo"
              value={movementFormData.reason}
              onChange={(e) =>
                setMovementFormData({
                  ...movementFormData,
                  reason: e.target.value,
                })
              }
              fullWidth
              required
              placeholder="ej: Compra, Venta, Devolución, Ajuste"
            />

            <TextField
              label="Referencia"
              value={movementFormData.reference}
              onChange={(e) =>
                setMovementFormData({
                  ...movementFormData,
                  reference: e.target.value,
                })
              }
              fullWidth
              placeholder="ej: PO-2024-001, VT-2024-001"
            />

            <TextField
              label="Notas"
              value={movementFormData.notes}
              onChange={(e) =>
                setMovementFormData({
                  ...movementFormData,
                  notes: e.target.value,
                })
              }
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
