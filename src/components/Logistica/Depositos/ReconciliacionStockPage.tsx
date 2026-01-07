import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { stockDepositoApi } from '../../../api/services/stockDepositoApi';
import { productApi } from '../../../api/services/productApi';
import { usePermisos } from '../../../hooks/usePermisos';
import { useAuth } from '../../../context/AuthContext';
import type { StockDeposito, Producto } from '../../../types';
import { calcularStockAsignado, detectarDesincronizacion, formatearErrorBackend } from '../../../utils/stockCalculations';

interface ProductoDesincronizado {
  producto: Producto;
  stockTotal: number;
  stockAsignado: number;
  diferencia: number;
}

const ReconciliacionStockPage: React.FC = () => {
  const { tienePermiso } = usePermisos();
  const { user } = useAuth();

  // State management
  const [stockItems, setStockItems] = useState<StockDeposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosDesincronizados, setProductosDesincronizados] = useState<ProductoDesincronizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stockData, productosData] = await Promise.all([
        stockDepositoApi.getAll(),
        productApi.getAll(),
      ]);

      setStockItems(stockData);
      setProductos(productosData);

      // Detect products with synchronization issues
      const desincronizados: ProductoDesincronizado[] = [];

      productosData.forEach(producto => {
        const result = detectarDesincronizacion(producto, stockData);
        if (!result.sincronizado) {
          const stockAsignado = calcularStockAsignado(producto.id, stockData);
          desincronizados.push({
            producto,
            stockTotal: producto.stockActual || 0,
            stockAsignado,
            diferencia: result.diferencia,
          });
        }
      });

      setProductosDesincronizados(desincronizados);
    } catch (err: any) {
      console.error('Error loading data:', err);
      const errorMsg = formatearErrorBackend(err);
      setError(`Error al cargar los datos: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-hide notifications
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Synchronization handler
  const handleSincronizar = async (productoId: number) => {
    try {
      setSyncingId(productoId);
      setError(null);

      // Call reconciliation endpoint if it exists
      // If not, this would need to be implemented in the backend
      await stockDepositoApi.reconciliar(productoId);

      setSuccess('Stock sincronizado correctamente');
      await loadData();
    } catch (err: any) {
      console.error('Error synchronizing stock:', err);
      const errorMsg = formatearErrorBackend(err);

      if (err.response?.status === 404) {
        setError('La funcionalidad de reconciliación no está disponible en el backend. Contacte al administrador.');
      } else {
        setError(`Error al sincronizar: ${errorMsg}`);
      }
    } finally {
      setSyncingId(null);
    }
  };

  // Filter products
  const filteredProducts = productosDesincronizados.filter(item =>
    item.producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <SyncIcon />
          Reconciliación de Stock
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

      {/* Notifications */}
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

      {/* Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            ¿Qué es la Reconciliación de Stock?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            La reconciliación detecta productos donde el <strong>stock total</strong> no coincide
            con la suma del stock en todos los depósitos. Esto puede ocurrir por:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Movimientos directos en el stock total sin actualizar depósitos
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Errores en transferencias o ajustes manuales
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Fallos en la sincronización automática del backend
            </Typography>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Importante:</strong> La función de sincronización automática requiere
              que el backend tenga implementado el endpoint de reconciliación. Si no está disponible,
              deberá corregirse manualmente ajustando el stock en cada depósito.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Summary */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Total de Productos
            </Typography>
            <Typography variant="h4">{productos.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: productosDesincronizados.length > 0 ? 'error.light' : 'success.light' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Productos Desincronizados
            </Typography>
            <Typography variant="h4" color={productosDesincronizados.length > 0 ? 'error.main' : 'success.main'}>
              {productosDesincronizados.length}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: productosDesincronizados.length === 0 ? 'success.light' : 'grey.100' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              Productos Sincronizados
            </Typography>
            <Typography variant="h4" color="success.main">
              {productos.length - productosDesincronizados.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* No issues message */}
      {productosDesincronizados.length === 0 ? (
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                ¡Todo en orden!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No se detectaron problemas de sincronización en el inventario.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <Box mb={2}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o código de producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell align="right">Stock Total</TableCell>
                  <TableCell align="right">Stock en Depósitos</TableCell>
                  <TableCell align="right">Diferencia</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={2}>
                        No se encontraron productos con los filtros aplicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((item) => (
                    <TableRow key={item.producto.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.producto.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.producto.codigo || '-'}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.stockTotal}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.stockAsignado}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={item.diferencia < 0 ? `${item.diferencia}` : `+${item.diferencia}`}
                          color={item.diferencia < 0 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<WarningIcon />}
                          label={item.diferencia < 0 ? 'Sobre-asignado' : 'Sub-asignado'}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Sincronizar stock (requiere endpoint en backend)">
                          <span>
                            <IconButton
                              color="primary"
                              onClick={() => handleSincronizar(item.producto.id)}
                              disabled={syncingId === item.producto.id || !tienePermiso('admin')}
                              size="small"
                            >
                              {syncingId === item.producto.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SyncIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Help text */}
          {!tienePermiso('admin') && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Solo los administradores pueden sincronizar el stock. Si encuentra problemas,
              contacte a su administrador.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default ReconciliacionStockPage;
