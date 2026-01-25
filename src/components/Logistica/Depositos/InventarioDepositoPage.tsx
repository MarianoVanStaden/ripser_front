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
  Menu,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon,
  PictureAsPdf as PictureAsPdfIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { stockDepositoApi } from '../../../api/services/stockDepositoApi';
import { depositoApi } from '../../../api/services/depositoApi';
import { productApi } from '../../../api/services/productApi';
import { movimientoStockDepositoApi } from '../../../api/services/movimientosApi';
import { usePermisos } from '../../../hooks/usePermisos';
import { useAuth } from '../../../context/AuthContext';
import type { StockDeposito, Deposito, Producto, ProductoDTO, MovimientoStockDeposito, StockDepositoCreateDTO } from '../../../types';
import { exportToExcel, prepareTableDataForExport } from '../../../utils/exportExcel';
import { exportToPDF, prepareTableDataForPDF } from '../../../utils/exportPDF';
import { calcularStockDisponible, calcularStockAsignado, validarAsignacionStock, formatearErrorBackend, detectarDesincronizacion } from '../../../utils/stockCalculations';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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
  const { user } = useAuth();

  // State management
  const [stockItems, setStockItems] = useState<StockDeposito[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Synchronization detection state
  const [desincronizados, setDesincronizados] = useState<Array<{
    producto: Producto;
    diferencia: number;
  }>>([]);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [depositoFilter, setDepositoFilter] = useState<string>('all');
  const [productoFilter, setProductoFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all'); // all, bajo, sobre

  // Advanced filters
  const [cantidadMin, setCantidadMin] = useState<number | ''>('');
  const [cantidadMax, setCantidadMax] = useState<number | ''>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockDeposito | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStockDeposito[]>([]);

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

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

  // Stock insuficiente modal
  const [stockInsuficienteDialogOpen, setStockInsuficienteDialogOpen] = useState(false);
  const [stockDisponibleInfo, setStockDisponibleInfo] = useState<{
    producto: Producto | null;
    stockTotal: number;
    stockAsignado: number;
    stockDisponible: number;
  }>({ producto: null, stockTotal: 0, stockAsignado: 0, stockDisponible: 0 });

  // Para saber si se quiere mantener la configuración existente
  const [usarConfigExistente, setUsarConfigExistente] = useState(true);
  const [configExistente, setConfigExistente] = useState<{ stockMinimo: number; stockMaximo: number } | null>(null);

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

  // Verificar sincronización entre stock total y depósitos
  const verificarSincronizacion = () => {
    const problemas: typeof desincronizados = [];

    productos.forEach(producto => {
      const result = detectarDesincronizacion(producto as ProductoDTO, stockItems);
      if (!result.sincronizado) {
        problemas.push({ producto, diferencia: result.diferencia });
      }
    });

    setDesincronizados(problemas);
  };

  // Effect to verify synchronization after data loads
  useEffect(() => {
    if (productos.length > 0 && stockItems.length > 0) {
      verificarSincronizacion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, stockItems]);

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

      // Advanced filters
      const matchesCantidadMin = cantidadMin === '' || item.cantidad >= cantidadMin;
      const matchesCantidadMax = cantidadMax === '' || item.cantidad <= cantidadMax;

      return matchesSearch && matchesAlert && matchesCantidadMin && matchesCantidadMax;
    });
  }, [filteredByView, searchTerm, alertFilter, cantidadMin, cantidadMax]);

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

  // Chart data
  const stockPorDeposito = useMemo(() => {
    const depositoMap = new Map<number, { nombre: string; cantidad: number }>();

    stockItems.forEach((item) => {
      const existing = depositoMap.get(item.depositoId);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        depositoMap.set(item.depositoId, {
          nombre: item.depositoNombre,
          cantidad: item.cantidad,
        });
      }
    });

    return Array.from(depositoMap.values());
  }, [stockItems]);

  const top10Productos = useMemo(() => {
    const productoMap = new Map<number, { nombre: string; cantidad: number }>();

    stockItems.forEach((item) => {
      const existing = productoMap.get(item.productoId);
      if (existing) {
        existing.cantidad += item.cantidad;
      } else {
        productoMap.set(item.productoId, {
          nombre: item.productoNombre,
          cantidad: item.cantidad,
        });
      }
    });

    return Array.from(productoMap.values())
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);
  }, [stockItems]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

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
      const errorMsg = formatearErrorBackend(err);
      switch (err.response?.status) {
        case 400:
          setError(`Validación fallida: ${errorMsg}`);
          break;
        case 403:
          setError('No tiene permisos para esta operación. Verifique que esté en la empresa correcta.');
          break;
        case 404:
          setError(`Recurso no encontrado: ${errorMsg}`);
          break;
        case 409:
          setError(`Conflicto: ${errorMsg}`);
          break;
        default:
          setError(errorMsg);
      }
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
      const errorMsg = formatearErrorBackend(err);
      switch (err.response?.status) {
        case 400:
          setError(`Validación fallida: ${errorMsg}`);
          break;
        case 403:
          setError('No tiene permisos para esta operación. Verifique que esté en la empresa correcta.');
          break;
        case 404:
          setError(`Recurso no encontrado: ${errorMsg}`);
          break;
        case 409:
          setError(`Conflicto: ${errorMsg}`);
          break;
        default:
          setError(errorMsg);
      }
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
    setStockDisponibleInfo({ producto: null, stockTotal: 0, stockAsignado: 0, stockDisponible: 0 });
    setConfigExistente(null);
    setUsarConfigExistente(true);
    setCreateDialogOpen(true);
  };

  const handleProductoChange = (productoId: number) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const stockTotal = producto.stockActual || 0;
    const stockAsignado = calcularStockAsignado(producto.id, stockItems);
    const stockDisponible = calcularStockDisponible(producto as ProductoDTO, stockItems);

    setStockDisponibleInfo({ producto, stockTotal, stockAsignado, stockDisponible });

    // Buscar si el producto ya tiene configuración de min/max en algún depósito
    const stockExistente = stockItems.find(s => s.productoId === productoId);
    if (stockExistente && (stockExistente.stockMinimo > 0 || (stockExistente.stockMaximo && stockExistente.stockMaximo > 0))) {
      setConfigExistente({
        stockMinimo: stockExistente.stockMinimo || 0,
        stockMaximo: stockExistente.stockMaximo || 0
      });
      setUsarConfigExistente(true);
      // Pre-cargar los valores existentes
      setCreateForm(prev => ({
        ...prev,
        productoId,
        stockMinimo: stockExistente.stockMinimo || 0,
        stockMaximo: stockExistente.stockMaximo || 0
      }));
    } else {
      setConfigExistente(null);
      setCreateForm(prev => ({ ...prev, productoId, stockMinimo: 0, stockMaximo: 0 }));
    }

    // Si no hay stock disponible, mostrar modal informativo
    if (stockDisponible <= 0) {
      setStockInsuficienteDialogOpen(true);
    }
  };

  const handleCreate = async () => {
    if (!createForm.productoId || !createForm.depositoId) {
      setError('Debe seleccionar producto y depósito');
      return;
    }

    // Validar stock disponible
    const producto = (productos as ProductoDTO[]).find(p => p.id === createForm.productoId);
    if (!producto) {
      setError('Producto no encontrado');
      return;
    }

    const stockDisponible = calcularStockDisponible(producto, stockItems);
    const validation = validarAsignacionStock(createForm.cantidad, stockDisponible);

    if (!validation.valid) {
      setError(validation.error || 'Cantidad inválida');
      return;
    }

    try {
      setLoading(true);
      
      // Verificar si ya existe stock de este producto en este depósito
      const stockExistente = stockItems.find(
        s => s.productoId === createForm.productoId && s.depositoId === createForm.depositoId
      );

      if (stockExistente) {
        // Ya existe: actualizar sumando la cantidad nueva
        const nuevaCantidad = stockExistente.cantidad + createForm.cantidad;
        await stockDepositoApi.ajustar(stockExistente.id, nuevaCantidad);
        
        // Si se cambiaron los límites, actualizar también
        if (createForm.stockMinimo !== stockExistente.stockMinimo || 
            createForm.stockMaximo !== stockExistente.stockMaximo) {
          await stockDepositoApi.update(stockExistente.id, {
            stockMinimo: createForm.stockMinimo,
            stockMaximo: createForm.stockMaximo
          });
        }
        
        setSuccess(`Stock actualizado: +${createForm.cantidad} unidades agregadas (Total: ${nuevaCantidad})`);
      } else {
        // No existe: crear nuevo registro
        await stockDepositoApi.create(createForm);
        setSuccess('Stock asignado correctamente');
      }
      
      await loadData();
      setCreateDialogOpen(false);
    } catch (err: any) {
      console.error('Error creating/updating stock:', err);
      const errorMsg = formatearErrorBackend(err);
      setError(`Error al asignar el stock: ${errorMsg}`);
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

  // Export functions
  const handleExportExcel = () => {
    try {
      // Preparar filtros aplicados
      const filtrosAplicados: Record<string, any> = {};

      if (tabValue === 0 && depositoFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoFilter);
        filtrosAplicados['Depósito'] = deposito?.nombre || depositoFilter;
      }

      if (tabValue === 1 && productoFilter !== 'all') {
        const producto = productos.find(p => p.id.toString() === productoFilter);
        filtrosAplicados['Producto'] = producto?.nombre || productoFilter;
      }

      if (searchTerm) {
        filtrosAplicados['Búsqueda'] = searchTerm;
      }

      if (alertFilter !== 'all') {
        filtrosAplicados['Filtro de Alertas'] =
          alertFilter === 'bajo' ? 'Solo Bajo Mínimo' : 'Solo Sobre Máximo';
      }

      // Preparar datos para exportación
      const dataParaExportar = prepareTableDataForExport(filteredStockItems, [
        { key: 'productoNombre', header: 'Producto' },
        { key: 'productoCodigo', header: 'Código' },
        { key: 'depositoNombre', header: 'Depósito' },
        { key: 'cantidad', header: 'Cantidad', format: 'number' },
        { key: 'stockMinimo', header: 'Stock Mínimo', format: 'number' },
        { key: 'stockMaximo', header: 'Stock Máximo', format: 'number' },
        {
          key: 'bajoMinimo',
          header: 'Estado',
          transform: (_, row) =>
            row.bajoMinimo ? 'Bajo Mínimo' :
            row.sobreMaximo ? 'Sobre Máximo' : 'Normal'
        },
      ]);

      // Preparar estadísticas
      const estadisticas = [
        { 'Métrica': 'Total Items', 'Valor': stats.totalItems },
        { 'Métrica': 'Productos con Stock', 'Valor': stats.productosConStock },
        { 'Métrica': 'Depósitos con Stock', 'Valor': stats.depositosConStock },
        { 'Métrica': 'Alertas Bajo Mínimo', 'Valor': stats.alertasBajo },
        { 'Métrica': 'Alertas Sobre Máximo', 'Valor': stats.alertasSobre },
      ];

      exportToExcel({
        fileName: `inventario-depositos-${dayjs().format('YYYY-MM-DD')}`,
        metadata: {
          title: 'Inventario por Depósito',
          generatedBy: user?.nombre || 'Usuario',
          generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
          filters: filtrosAplicados,
        },
        sheets: [
          {
            name: 'Estadísticas',
            data: estadisticas,
          },
          {
            name: 'Inventario',
            data: dataParaExportar,
          },
        ],
      });

      setSuccess('Archivo Excel exportado correctamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setError('Error al exportar a Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      // Preparar filtros aplicados
      const filtrosAplicados: Record<string, any> = {};

      if (tabValue === 0 && depositoFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoFilter);
        filtrosAplicados['Depósito'] = deposito?.nombre || depositoFilter;
      }

      if (tabValue === 1 && productoFilter !== 'all') {
        const producto = productos.find(p => p.id.toString() === productoFilter);
        filtrosAplicados['Producto'] = producto?.nombre || productoFilter;
      }

      if (searchTerm) {
        filtrosAplicados['Búsqueda'] = searchTerm;
      }

      if (alertFilter !== 'all') {
        filtrosAplicados['Filtro de Alertas'] =
          alertFilter === 'bajo' ? 'Solo Bajo Mínimo' : 'Solo Sobre Máximo';
      }

      // Preparar datos para exportación
      const { headers, rows } = prepareTableDataForPDF(filteredStockItems, [
        { key: 'productoNombre', header: 'Producto' },
        { key: 'productoCodigo', header: 'Código' },
        { key: 'depositoNombre', header: 'Depósito' },
        { key: 'cantidad', header: 'Cantidad', format: 'number' },
        { key: 'stockMinimo', header: 'Mínimo', format: 'number' },
        { key: 'stockMaximo', header: 'Máximo', format: 'number' },
        {
          key: 'bajoMinimo',
          header: 'Estado',
          transform: (_, row) =>
            row.bajoMinimo ? 'Bajo Mínimo' :
            row.sobreMaximo ? 'Sobre Máximo' : 'Normal'
        },
      ]);

      // Preparar estadísticas
      const statsRows = [
        ['Total Items', stats.totalItems.toString()],
        ['Productos con Stock', stats.productosConStock.toString()],
        ['Depósitos con Stock', stats.depositosConStock.toString()],
        ['Alertas Bajo Mínimo', stats.alertasBajo.toString()],
        ['Alertas Sobre Máximo', stats.alertasSobre.toString()],
      ];

      exportToPDF({
        fileName: `inventario-depositos-${dayjs().format('YYYY-MM-DD')}`,
        title: 'Inventario por Depósito',
        orientation: 'landscape',
        metadata: {
          generatedBy: user?.nombre || 'Usuario',
          generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
          filters: filtrosAplicados,
        },
        tables: [
          {
            headers: ['Métrica', 'Valor'],
            rows: statsRows,
            title: 'Estadísticas Generales',
          },
          {
            headers,
            rows,
            title: 'Detalle de Inventario',
            showFooter: true,
            footerText: `Total de registros: ${filteredStockItems.length}`,
          },
        ],
      });

      setSuccess('Archivo PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      setError('Error al exportar a PDF');
    }
  };

  if (!tienePermiso('LOGISTICA')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <InventoryIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main' }} />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            Inventario por Depósito
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Exportar
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenCreateDialog}
            fullWidth
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Asignar Stock
          </Button>
        </Box>
      </Box>

      {/* Export Menu */}
      <Menu
        anchorEl={exportAnchorEl}
        open={exportMenuOpen}
        onClose={() => setExportAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            handleExportExcel();
            setExportAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportar a Excel</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleExportPDF();
            setExportAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Exportar a PDF</ListItemText>
        </MenuItem>
      </Menu>

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

      {/* Desynchronization Alert */}
      {desincronizados.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ⚠️ {desincronizados.length} producto(s) con problemas de sincronización
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            El stock total no coincide con la suma de los depósitos. Esto puede causar errores al asignar stock.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
            Se recomienda usar la herramienta de Reconciliación para corregir estas inconsistencias.
          </Typography>
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

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución de Stock por Depósito
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stockPorDeposito}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cantidad"
                  >
                    {stockPorDeposito.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 10 Productos con Más Stock
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10Productos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="cantidad" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
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

      {/* Advanced Filters */}
      <Accordion sx={{ mb: 3 }} expanded={showAdvancedFilters} onChange={() => setShowAdvancedFilters(!showAdvancedFilters)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon />
            <Typography>Filtros Avanzados</Typography>
            {(cantidadMin !== '' || cantidadMax !== '') && (
              <Chip label="Activo" size="small" color="primary" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad Mínima"
                value={cantidadMin}
                onChange={(e) => setCantidadMin(e.target.value === '' ? '' : parseInt(e.target.value))}
                inputProps={{ min: 0 }}
                helperText="Mostrar productos con cantidad mayor o igual"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad Máxima"
                value={cantidadMax}
                onChange={(e) => setCantidadMax(e.target.value === '' ? '' : parseInt(e.target.value))}
                inputProps={{ min: 0 }}
                helperText="Mostrar productos con cantidad menor o igual"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setCantidadMin('');
                  setCantidadMax('');
                }}
              >
                Limpiar Filtros Avanzados
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

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
                  onChange={(e) => handleProductoChange(Number(e.target.value))}
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

            {/* Mostrar información de stock disponible */}
            {createForm.productoId > 0 && stockDisponibleInfo.producto && (
              <Grid item xs={12}>
                <Alert 
                  severity={stockDisponibleInfo.stockDisponible > 0 ? 'info' : 'warning'}
                  sx={{ py: 1 }}
                >
                  <Box>
                    <Typography variant="body2">
                      <strong>Stock Total:</strong> {stockDisponibleInfo.stockTotal} | 
                      <strong> Ya Asignado:</strong> {stockDisponibleInfo.stockAsignado} | 
                      <strong> Disponible para asignar:</strong>{' '}
                      <Chip 
                        label={stockDisponibleInfo.stockDisponible} 
                        size="small" 
                        color={stockDisponibleInfo.stockDisponible > 0 ? 'success' : 'error'}
                        sx={{ ml: 0.5 }}
                      />
                    </Typography>
                  </Box>
                </Alert>
              </Grid>
            )}

            {/* Mostrar configuración existente si la hay */}
            {configExistente && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      Este producto ya tiene configuración de límites: 
                      <strong> Mín: {configExistente.stockMinimo}</strong> | 
                      <strong> Máx: {configExistente.stockMaximo}</strong>
                    </Typography>
                    <Button 
                      size="small" 
                      variant={usarConfigExistente ? 'contained' : 'outlined'}
                      onClick={() => {
                        if (!usarConfigExistente) {
                          // Restaurar configuración existente
                          setCreateForm(prev => ({
                            ...prev,
                            stockMinimo: configExistente.stockMinimo,
                            stockMaximo: configExistente.stockMaximo
                          }));
                        }
                        setUsarConfigExistente(!usarConfigExistente);
                      }}
                      sx={{ ml: 2, minWidth: 120 }}
                    >
                      {usarConfigExistente ? 'Usar existente' : 'Personalizar'}
                    </Button>
                  </Box>
                </Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Depósito</InputLabel>
                <Select
                  value={createForm.depositoId}
                  onChange={(e) => setCreateForm({ ...createForm, depositoId: Number(e.target.value) })}
                  label="Depósito"
                  disabled={stockDisponibleInfo.stockDisponible <= 0}
                >
                  {depositos.map((deposito) => {
                    const stockEnDeposito = stockItems.find(
                      s => s.productoId === createForm.productoId && s.depositoId === deposito.id
                    );
                    return (
                      <MenuItem key={deposito.id} value={deposito.id}>
                        {deposito.nombre}
                        {stockEnDeposito && (
                          <Chip 
                            label={`Ya tiene: ${stockEnDeposito.cantidad}`} 
                            size="small" 
                            color="info" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Mostrar aviso si el depósito ya tiene stock (se sumará) */}
            {createForm.productoId > 0 && createForm.depositoId > 0 && (() => {
              const stockEnDeposito = stockItems.find(
                s => s.productoId === createForm.productoId && s.depositoId === createForm.depositoId
              );
              if (stockEnDeposito) {
                return (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={<AddIcon />}>
                      <Typography variant="body2">
                        Este depósito ya tiene <strong>{stockEnDeposito.cantidad}</strong> unidades. 
                        Se agregarán <strong>{createForm.cantidad}</strong> más.
                        <br />
                        <strong>Nuevo total: {stockEnDeposito.cantidad + createForm.cantidad}</strong>
                      </Typography>
                    </Alert>
                  </Grid>
                );
              }
              return null;
            })()}

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label={stockItems.find(
                  s => s.productoId === createForm.productoId && s.depositoId === createForm.depositoId
                ) ? "Cantidad a Agregar" : "Cantidad Inicial"}
                value={createForm.cantidad}
                onChange={(e) => {
                  const value = Math.min(
                    Math.max(0, Number(e.target.value)),
                    stockDisponibleInfo.stockDisponible
                  );
                  setCreateForm({ ...createForm, cantidad: value });
                }}
                inputProps={{ min: 0, max: stockDisponibleInfo.stockDisponible }}
                disabled={stockDisponibleInfo.stockDisponible <= 0}
                error={createForm.cantidad > stockDisponibleInfo.stockDisponible}
                helperText={
                  stockDisponibleInfo.stockDisponible > 0
                    ? `Máximo disponible: ${stockDisponibleInfo.stockDisponible}`
                    : 'No hay stock disponible para asignar'
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Stock Mínimo"
                value={createForm.stockMinimo}
                onChange={(e) => {
                  setCreateForm({ ...createForm, stockMinimo: Number(e.target.value) });
                  if (configExistente) setUsarConfigExistente(false);
                }}
                inputProps={{ min: 0 }}
                disabled={usarConfigExistente && configExistente !== null}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Stock Máximo"
                value={createForm.stockMaximo}
                onChange={(e) => {
                  setCreateForm({ ...createForm, stockMaximo: Number(e.target.value) });
                  if (configExistente) setUsarConfigExistente(false);
                }}
                inputProps={{ min: 0 }}
                disabled={usarConfigExistente && configExistente !== null}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!createForm.productoId || !createForm.depositoId || stockDisponibleInfo.stockDisponible <= 0 || createForm.cantidad <= 0}
          >
            {stockItems.find(
              s => s.productoId === createForm.productoId && s.depositoId === createForm.depositoId
            ) ? 'Agregar al Stock Existente' : 'Asignar Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Stock Insuficiente */}
      <Dialog
        open={stockInsuficienteDialogOpen}
        onClose={() => setStockInsuficienteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Stock No Disponible para Asignación
        </DialogTitle>
        <DialogContent>
          {stockDisponibleInfo.producto && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  No hay unidades disponibles de <strong>{stockDisponibleInfo.producto.nombre}</strong> para asignar a depósitos.
                </Typography>
              </Alert>
              
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detalle del Stock:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="primary">
                        {stockDisponibleInfo.stockTotal}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stock Total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="error">
                        {stockDisponibleInfo.stockAsignado}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ya Asignado
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" color={stockDisponibleInfo.stockDisponible > 0 ? 'success.main' : 'text.disabled'}>
                        {stockDisponibleInfo.stockDisponible}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Disponible
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="body2" color="text.secondary">
                Para asignar stock a un depósito, primero debe:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Registrar compras o ingresos del producto en <strong>Gestión de Stock</strong>
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    O transferir unidades desde otro depósito que tenga excedentes
                  </Typography>
                </li>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockInsuficienteDialogOpen(false)} variant="contained">
            Entendido
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
