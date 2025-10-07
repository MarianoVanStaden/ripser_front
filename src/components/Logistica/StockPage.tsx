import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { productApi } from '../../api/services/productApi';
import { movimientoStockApi } from '../../api/services/movimientoStockApi';
import type { Producto, MovimientoStock } from '../../types';

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
  const [products, setProducts] = useState<Producto[]>([]);
  const [stockMovements, setStockMovements] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, movementsData] = await Promise.all([
        productApi.getAll(),
        movimientoStockApi.getAll(),
      ]);

      setProducts(productsData);
      setStockMovements(movementsData);
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

  const lowStockCount = products.filter(p => p.stockActual <= 5 && p.stockActual > 0).length;
  const outOfStockCount = products.filter(p => p.stockActual === 0).length;

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
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Estado</TableCell>
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
                      <TableCell>${product.precio.toLocaleString()}</TableCell>
                      <TableCell>{getStockChip(product.stockActual)}</TableCell>
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
                    const product = products.find(p => p.id === movement.productoId);

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.fecha).toLocaleString()}
                        </TableCell>
                        <TableCell>{product?.nombre || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={movement.tipo === 'ENTRADA' ? 'Entrada' : movement.tipo === 'SALIDA' ? 'Salida' : 'Ajuste'}
                            color={movement.tipo === 'ENTRADA' ? 'success' : movement.tipo === 'SALIDA' ? 'error' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold">
                            {movement.tipo === 'ENTRADA' ? '+' : '-'}{movement.cantidad}
                          </Typography>
                        </TableCell>
                        <TableCell>{movement.concepto}</TableCell>
                        <TableCell>{movement.numeroComprobante}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default StockPage;
