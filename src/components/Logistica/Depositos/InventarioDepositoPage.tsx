import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  InputAdornment,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory as InventoryIcon,
  SwapHoriz as SwapHorizIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { stockDepositoApi } from '../../../api/services/stockDepositoApi';
import { depositoApi } from '../../../api/services/depositoApi';
import { productApi } from '../../../api/services/productApi';
import { movimientoStockDepositoApi } from '../../../api/services/movimientosApi';
import { usePermisos } from '../../../hooks/usePermisos';
import type { StockDeposito, Deposito, Producto, MovimientoStockDeposito, StockDepositoCreateDTO } from '../../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const InventarioDepositoPage: React.FC = () => {
  const { tienePermiso } = usePermisos();

  // State management
  const [stockItems, setStockItems] = useState<StockDeposito[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [depositoFilter, setDepositoFilter] = useState<string>('all');
  const [productoFilter, setProductoFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all'); // all, bajo, sobre

  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockDeposito | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStockDeposito[]>([]);

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    depositoDestinoId: 0,
    cantidad: 0,
  });

  // Ajuste form
  const [ajusteForm, setAjusteForm] = useState({
    cantidad: 0,
  });

  // Create form
  const [createForm, setCreateForm] = useState<StockDepositoCreateDTO>({
    productoId: 0,
    depositoId: 0,
    cantidad: 0,
    stockMinimo: 0,
    stockMaximo: 0,
  });

  useEffect(() => {
    if (tienePermiso('LOGISTICA')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stockResponse, depositosResponse, productosData] = await Promise.all([
        stockDepositoApi.getAll(),
        depositoApi.getActivos(),
        productApi.getAll(0, 10000),
      ]);
      // Handle paginated responses
      const stockData = Array.isArray(stockResponse) 
        ? stockResponse 
        : (stockResponse as any)?.content || [];
      const depositosData = Array.isArray(depositosResponse) 
        ? depositosResponse 
        : (depositosResponse as any)?.content || [];
      setStockItems(stockData);
      setDepositos(depositosData);
      setProductos(productosData || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filter by view (tab)
  const filteredByView = useMemo(() => {
    if (tabValue === 0) {
      // Por Depósito: filter by selected warehouse
      if (depositoFilter === 'all') return stockItems;
      return stockItems.filter((item) => item.depositoId.toString() === depositoFilter);
    } else {
      // Por Producto: filter by selected product
      if (productoFilter === 'all') return stockItems;
      return stockItems.filter((item) => item.productoId.toString() === productoFilter);
    }
  }, [stockItems, tabValue, depositoFilter, productoFilter]);

  // Apply additional filters
  const filteredStockItems = useMemo(() => {
    return filteredByView.filter((item) => {
      const matchesSearch =
        item.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productoCodigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.depositoNombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAlert =
        alertFilter === 'all' ||
        (alertFilter === 'bajo' && item.bajoMinimo) ||
        (alertFilter === 'sobre' && item.sobreMaximo);

      return matchesSearch && matchesAlert;
    });
  }, [filteredByView, searchTerm, alertFilter]);

  // Statistics
  const stats = useMemo(() => {
    const alertasBajo = stockItems.filter((item) => item.bajoMinimo).length;
    const alertasSobre = stockItems.filter((item) => item.sobreMaximo).length;
    const depositosConStock = new Set(stockItems.map((item) => item.depositoId)).size;
    const productosConStock = new Set(stockItems.map((item) => item.productoId)).size;

    return {
      totalItems: stockItems.length,
      alertasBajo,
      alertasSobre,
      depositosConStock,
      productosConStock,
    };
  }, [stockItems]);

  // Get stock distribution for a product
  const getStockDistribution = (productoId: number) => {
    return stockItems.filter((item) => item.productoId === productoId);
  };

  // Get total stock for a product
  const getTotalStock = (productoId: number) => {
    return stockItems
      .filter((item) => item.productoId === productoId)
      .reduce((sum, item) => sum + item.cantidad, 0);
  };

  // Handlers
  const handleOpenTransferDialog = (stock: StockDeposito) => {
    setSelectedStock(stock);
    setTransferForm({
      depositoDestinoId: 0,
      cantidad: 0,
    });
    setTransferDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!selectedStock) return;

    if (transferForm.cantidad <= 0 || transferForm.cantidad > selectedStock.cantidad) {
      setError('Cantidad inválida');
      return;
    }

    if (transferForm.depositoDestinoId === selectedStock.depositoId) {
      setError('Debe seleccionar un depósito diferente');
      return;
    }

    try {
      setLoading(true);
      await stockDepositoApi.transferir(
        selectedStock.productoId,
        selectedStock.depositoId,
        transferForm.depositoDestinoId,
        transferForm.cantidad
      );
      setSuccess('Transferencia realizada correctamente');
      await loadData();
      setTransferDialogOpen(false);
    } catch (err: any) {
      console.error('Error transferring stock:', err);
      setError('Error al realizar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAjusteDialog = (stock: StockDeposito) => {
    setSelectedStock(stock);
    setAjusteForm({ cantidad: stock.cantidad });
    setAjusteDialogOpen(true);
  };

  const handleAjuste = async () => {
    if (!selectedStock) return;

    try {
      setLoading(true);
      await stockDepositoApi.ajustar(selectedStock.id, ajusteForm.cantidad);
      setSuccess('Ajuste realizado correctamente');
      await loadData();
      setAjusteDialogOpen(false);
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      setError('Error al realizar el ajuste');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateForm({
      productoId: 0,
      depositoId: 0,
      cantidad: 0,
      stockMinimo: 0,
      stockMaximo: 0,
    });
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.productoId || !createForm.depositoId) {
      setError('Debe seleccionar producto y depósito');
      return;
    }

    try {
      setLoading(true);
      await stockDepositoApi.create(createForm);
      setSuccess('Stock creado correctamente');
      await loadData();
      setCreateDialogOpen(false);
    } catch (err: any) {
      console.error('Error creating stock:', err);
      if (err.response?.status === 409) {
        setError('Ya existe stock para este producto en el depósito seleccionado');
      } else {
        setError('Error al crear el stock');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistorial = async (stock: StockDeposito) => {
    setSelectedStock(stock);
    try {
      const movimientosData = await movimientoStockDepositoApi.getByProducto(stock.productoId);
      setMovimientos(
        movimientosData.filter(
          (m) => m.depositoOrigenId === stock.depositoId || m.depositoDestinoId === stock.depositoId
        )
      );
      setHistorialDialogOpen(true);
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Error al cargar el historial');
    }
  };

  const getStockChip = (stock: StockDeposito) => {
    if (stock.bajoMinimo) {
      return <Chip label="Bajo Mínimo" size="small" color="error" icon={<WarningIcon />} />;
    }
    if (stock.sobreMaximo) {
      return <Chip label="Sobre Máximo" size="small" color="warning" icon={<TrendingUpIcon />} />;
    }
    return <Chip label="Normal" size="small" color="success" />;
  };

  if (!tienePermiso('LOGISTICA')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Inventario por Depósito
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          Asignar Stock a Depósito
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Items en Stock
              </Typography>
              <Typography variant="h4">{stats.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Productos con Stock
              </Typography>
              <Typography variant="h4">{stats.productosConStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Depósitos con Stock
              </Typography>
              <Typography variant="h4">{stats.depositosConStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Alertas Bajo Mínimo
              </Typography>
              <Typography variant="h4" color="error.main">
                <Badge badgeContent={stats.alertasBajo} color="error">
                  <WarningIcon fontSize="large" />
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Alertas Sobre Máximo
              </Typography>
              <Typography variant="h4" color="warning.main">
                <Badge badgeContent={stats.alertasSobre} color="warning">
                  <TrendingUpIcon fontSize="large" />
                </Badge>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Vista por Depósito" />
          <Tab label="Vista por Producto" />
        </Tabs>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Producto, código o depósito..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            {tabValue === 0 ? (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Depósito</InputLabel>
                  <Select
                    value={depositoFilter}
                    onChange={(e) => setDepositoFilter(e.target.value)}
                    label="Depósito"
                  >
                    <MenuItem value="all">Todos los depósitos</MenuItem>
                    {depositos.map((deposito) => (
                      <MenuItem key={deposito.id} value={deposito.id.toString()}>
                        {deposito.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={productoFilter}
                    onChange={(e) => setProductoFilter(e.target.value)}
                    label="Producto"
                  >
                    <MenuItem value="all">Todos los productos</MenuItem>
                    {productos.map((producto) => (
                      <MenuItem key={producto.id} value={producto.id.toString()}>
                        {producto.nombre} {producto.codigo && `(${producto.codigo})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar Alertas</InputLabel>
                <Select
                  value={alertFilter}
                  onChange={(e) => setAlertFilter(e.target.value)}
                  label="Filtrar Alertas"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="bajo">Solo Bajo Mínimo</MenuItem>
                  <MenuItem value="sobre">Solo Sobre Máximo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Por Depósito View */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Depósito</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Mínimo</TableCell>
                  <TableCell align="right">Máximo</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStockItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No se encontraron items en stock
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStockItems.map((stock) => (
                    <TableRow key={stock.id} hover>
                      <TableCell>{stock.productoNombre}</TableCell>
                      <TableCell>{stock.productoCodigo || '-'}</TableCell>
                      <TableCell>
                        <Chip label={stock.depositoNombre} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {stock.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{stock.stockMinimo}</TableCell>
                      <TableCell align="right">{stock.stockMaximo || '-'}</TableCell>
                      <TableCell align="center">{getStockChip(stock)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ajustar cantidad">
                          <IconButton size="small" onClick={() => handleOpenAjusteDialog(stock)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Transferir a otro depósito">
                          <IconButton size="small" onClick={() => handleOpenTransferDialog(stock)}>
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver historial">
                          <IconButton size="small" onClick={() => handleOpenHistorial(stock)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Por Producto View */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : productoFilter !== 'all' ? (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribución de Stock
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Producto:{' '}
                  {productos.find((p) => p.id.toString() === productoFilter)?.nombre || 'Seleccione un producto'}
                </Typography>
                <Typography variant="h4" sx={{ mt: 2 }}>
                  Stock Total: {getTotalStock(parseInt(productoFilter))}
                </Typography>
              </CardContent>
            </Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Depósito</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Mínimo</TableCell>
                    <TableCell align="right">Máximo</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStockItems.map((stock) => (
                    <TableRow key={stock.id} hover>
                      <TableCell>
                        <Chip label={stock.depositoNombre} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {stock.cantidad}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{stock.stockMinimo}</TableCell>
                      <TableCell align="right">{stock.stockMaximo || '-'}</TableCell>
                      <TableCell align="center">{getStockChip(stock)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Ajustar cantidad">
                          <IconButton size="small" onClick={() => handleOpenAjusteDialog(stock)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Transferir a otro depósito">
                          <IconButton size="small" onClick={() => handleOpenTransferDialog(stock)}>
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Alert severity="info">Seleccione un producto para ver su distribución en depósitos</Alert>
        )}
      </TabPanel>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transferir Stock</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedStock && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Producto:</strong> {selectedStock.productoNombre}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                <strong>Depósito Origen:</strong> {selectedStock.depositoNombre} (Disponible:{' '}
                {selectedStock.cantidad})
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Depósito Destino</InputLabel>
                    <Select
                      value={transferForm.depositoDestinoId}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, depositoDestinoId: Number(e.target.value) })
                      }
                      label="Depósito Destino"
                    >
                      {depositos
                        .filter((d) => d.id !== selectedStock.depositoId)
                        .map((deposito) => (
                          <MenuItem key={deposito.id} value={deposito.id}>
                            {deposito.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad a Transferir"
                    value={transferForm.cantidad}
                    onChange={(e) => setTransferForm({ ...transferForm, cantidad: Number(e.target.value) })}
                    inputProps={{ min: 1, max: selectedStock.cantidad }}
                    helperText={`Máximo: ${selectedStock.cantidad}`}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleTransfer}
            variant="contained"
            disabled={!transferForm.depositoDestinoId || transferForm.cantidad <= 0}
          >
            Transferir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ajuste Dialog */}
      <Dialog open={ajusteDialogOpen} onClose={() => setAjusteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajustar Stock</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedStock && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Producto:</strong> {selectedStock.productoNombre}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                <strong>Depósito:</strong> {selectedStock.depositoNombre}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                <strong>Cantidad Actual:</strong> {selectedStock.cantidad}
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Nueva Cantidad"
                value={ajusteForm.cantidad}
                onChange={(e) => setAjusteForm({ cantidad: Number(e.target.value) })}
                inputProps={{ min: 0 }}
                helperText="Ingrese la cantidad correcta después del ajuste"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAjusteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleAjuste} variant="contained">
            Ajustar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Stock Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Stock a Depósito</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={createForm.productoId}
                  onChange={(e) => setCreateForm({ ...createForm, productoId: Number(e.target.value) })}
                  label="Producto"
                >
                  {productos.map((producto) => (
                    <MenuItem key={producto.id} value={producto.id}>
                      {producto.nombre} {producto.codigo && `(${producto.codigo})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Depósito</InputLabel>
                <Select
                  value={createForm.depositoId}
                  onChange={(e) => setCreateForm({ ...createForm, depositoId: Number(e.target.value) })}
                  label="Depósito"
                >
                  {depositos.map((deposito) => (
                    <MenuItem key={deposito.id} value={deposito.id}>
                      {deposito.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad Inicial"
                value={createForm.cantidad}
                onChange={(e) => setCreateForm({ ...createForm, cantidad: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Stock Mínimo"
                value={createForm.stockMinimo}
                onChange={(e) => setCreateForm({ ...createForm, stockMinimo: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Stock Máximo"
                value={createForm.stockMaximo}
                onChange={(e) => setCreateForm({ ...createForm, stockMaximo: Number(e.target.value) })}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!createForm.productoId || !createForm.depositoId}
          >
            Crear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historial Dialog */}
      <Dialog
        open={historialDialogOpen}
        onClose={() => setHistorialDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Historial de Movimientos</DialogTitle>
        <DialogContent>
          {selectedStock && (
            <>
              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                <strong>Producto:</strong> {selectedStock.productoNombre} | <strong>Depósito:</strong>{' '}
                {selectedStock.depositoNombre}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Origen</TableCell>
                      <TableCell>Destino</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell>Usuario</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No hay movimientos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientos.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>{new Date(mov.fechaMovimiento).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={mov.tipoMovimiento} size="small" />
                          </TableCell>
                          <TableCell>{mov.depositoOrigenNombre || '-'}</TableCell>
                          <TableCell>{mov.depositoDestinoNombre || '-'}</TableCell>
                          <TableCell align="right">{mov.cantidad}</TableCell>
                          <TableCell>{mov.usuarioNombre || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistorialDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventarioDepositoPage;
