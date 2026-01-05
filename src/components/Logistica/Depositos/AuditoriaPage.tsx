import React, { useState, useEffect, useMemo } from 'react';
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
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
  ButtonGroup,
} from '@mui/material';
import {
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { movimientoStockDepositoApi, movimientoEquipoApi } from '../../../api/services/movimientosApi';
import { depositoApi } from '../../../api/services/depositoApi';
import { productApi } from '../../../api/services/productApi';
import { usePermisos } from '../../../hooks/usePermisos';
import { useAuth } from '../../../context/AuthContext';
import type {
  MovimientoEquipo,
  Deposito,
  Producto,
  TipoMovimientoStockDeposito,
  TipoMovimientoEquipo,
} from '../../../types';
import { exportToExcel, prepareTableDataForExport } from '../../../utils/exportExcel';
import { exportToPDF, prepareTableDataForPDF } from '../../../utils/exportPDF';
import dayjs from 'dayjs';

// Extended interface to handle both backend response formats
interface MovimientoStockAuditoria {
  id: number;
  productoId: number;
  productoNombre?: string;
  productoCodigo?: string;
  depositoOrigenId?: number;
  depositoOrigenNombre?: string;
  depositoDestinoId?: number;
  depositoDestinoNombre?: string;
  cantidad: number;
  // Handle both field names from backend
  tipoMovimiento?: TipoMovimientoStockDeposito;
  tipo?: string;
  motivo?: string;
  observaciones?: string;
  concepto?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  // Handle both date field names
  fechaMovimiento?: string;
  fecha?: string;
  documentoReferencia?: string;
  numeroComprobante?: string;
}

// Helper functions to get values from either field name
const getMovFecha = (mov: MovimientoStockAuditoria): string => {
  return mov.fechaMovimiento || mov.fecha || '';
};

const getMovTipo = (mov: MovimientoStockAuditoria): string => {
  return mov.tipoMovimiento || mov.tipo || '-';
};

const getMovReferencia = (mov: MovimientoStockAuditoria): string => {
  return mov.documentoReferencia || mov.numeroComprobante || mov.concepto || '-';
};

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

const AuditoriaPage: React.FC = () => {
  const { tienePermiso } = usePermisos();
  const { user } = useAuth();

  // State management - use the flexible type for stock movements
  const [movimientosStock, setMovimientosStock] = useState<MovimientoStockAuditoria[]>([]);
  const [movimientosEquipo, setMovimientosEquipo] = useState<MovimientoEquipo[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Filter states
  const [fechaInicio, setFechaInicio] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
  const [tipoMovimientoStockFilter, setTipoMovimientoStockFilter] = useState<string>('all');
  const [tipoMovimientoEquipoFilter, setTipoMovimientoEquipoFilter] = useState<string>('all');
  const [productoFilter, setProductoFilter] = useState<string>('all');
  const [depositoOrigenFilter, setDepositoOrigenFilter] = useState<string>('all');
  const [depositoDestinoFilter, setDepositoDestinoFilter] = useState<string>('all');
  const [numeroHeladeraFilter, setNumeroHeladeraFilter] = useState<string>('');

  // Dialog state
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false);
  const [selectedEquipoNumero, setSelectedEquipoNumero] = useState<string>('');
  const [timelineMovimientos, setTimelineMovimientos] = useState<MovimientoEquipo[]>([]);

  // Export menu state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);

  useEffect(() => {
    if (tienePermiso('LOGISTICA')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Use getAll instead of getRecientes (backend may not support recientes endpoint)
      const [movStockResponse, movEquipoResponse, depositosResponse, productosData] = await Promise.all([
        movimientoStockDepositoApi.getAll(),
        movimientoEquipoApi.getAll(),
        depositoApi.getAll(),
        productApi.getAll(0, 10000),
      ]);
      // Handle paginated responses
      const movStockData = Array.isArray(movStockResponse) 
        ? movStockResponse 
        : (movStockResponse as any)?.content || [];
      const movEquipoData = Array.isArray(movEquipoResponse) 
        ? movEquipoResponse 
        : (movEquipoResponse as any)?.content || [];
      const depositosData = Array.isArray(depositosResponse) 
        ? depositosResponse 
        : (depositosResponse as any)?.content || [];
      setMovimientosStock(movStockData);
      setMovimientosEquipo(movEquipoData);
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

  // Predefined date ranges
  const setDateRange = (range: 'today' | 'week' | 'month' | 'quarter') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        setFechaInicio(today);
        setFechaFin(now);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        setFechaInicio(weekStart);
        setFechaFin(now);
        break;
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        setFechaInicio(monthStart);
        setFechaFin(now);
        break;
      case 'quarter':
        const quarterStart = new Date(today);
        quarterStart.setDate(today.getDate() - 90);
        setFechaInicio(quarterStart);
        setFechaFin(now);
        break;
    }
  };

  const handleApplyFilters = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Debe seleccionar fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      const [movStockData, movEquipoData] = await Promise.all([
        movimientoStockDepositoApi.getByFechaRange(fechaInicio.toISOString(), fechaFin.toISOString()),
        movimientoEquipoApi.getByFechaRange(fechaInicio.toISOString(), fechaFin.toISOString()),
      ]);
      setMovimientosStock(movStockData);
      setMovimientosEquipo(movEquipoData);
      setError(null);
    } catch (err: any) {
      console.error('Error applying filters:', err);
      setError('Error al aplicar filtros');
    } finally {
      setLoading(false);
    }
  };

  // Filtered movements - Stock
  const filteredMovimientosStock = useMemo(() => {
    return movimientosStock.filter((mov) => {
      const movTipo = getMovTipo(mov);
      const matchesTipo =
        tipoMovimientoStockFilter === 'all' || movTipo === tipoMovimientoStockFilter;

      const matchesProducto =
        productoFilter === 'all' || mov.productoId.toString() === productoFilter;

      const matchesOrigen =
        depositoOrigenFilter === 'all' ||
        (mov.depositoOrigenId && mov.depositoOrigenId.toString() === depositoOrigenFilter);

      const matchesDestino =
        depositoDestinoFilter === 'all' ||
        (mov.depositoDestinoId && mov.depositoDestinoId.toString() === depositoDestinoFilter);

      return matchesTipo && matchesProducto && matchesOrigen && matchesDestino;
    });
  }, [movimientosStock, tipoMovimientoStockFilter, productoFilter, depositoOrigenFilter, depositoDestinoFilter]);

  // Filtered movements - Equipment
  const filteredMovimientosEquipo = useMemo(() => {
    return movimientosEquipo.filter((mov) => {
      const matchesTipo =
        tipoMovimientoEquipoFilter === 'all' || mov.tipoMovimiento === tipoMovimientoEquipoFilter;

      const matchesOrigen =
        depositoOrigenFilter === 'all' ||
        (mov.depositoOrigenId && mov.depositoOrigenId.toString() === depositoOrigenFilter);

      const matchesDestino =
        depositoDestinoFilter === 'all' ||
        (mov.depositoDestinoId && mov.depositoDestinoId.toString() === depositoDestinoFilter);

      const matchesNumero =
        numeroHeladeraFilter === '' ||
        mov.equipoNumeroHeladera.toLowerCase().includes(numeroHeladeraFilter.toLowerCase());

      return matchesTipo && matchesOrigen && matchesDestino && matchesNumero;
    });
  }, [movimientosEquipo, tipoMovimientoEquipoFilter, depositoOrigenFilter, depositoDestinoFilter, numeroHeladeraFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalMovStock = movimientosStock.length;
    const totalMovEquipo = movimientosEquipo.length;
    const transferenciasStock = movimientosStock.filter((m) => getMovTipo(m) === 'TRANSFERENCIA').length;
    const trasladosEquipo = movimientosEquipo.filter((m) => m.tipoMovimiento === 'TRASLADO').length;

    return {
      totalMovStock,
      totalMovEquipo,
      transferenciasStock,
      trasladosEquipo,
    };
  }, [movimientosStock, movimientosEquipo]);

  const handleOpenTimeline = async (numeroHeladera: string) => {
    try {
      setSelectedEquipoNumero(numeroHeladera);
      const movimientos = await movimientoEquipoApi.getByNumeroHeladera(numeroHeladera);
      setTimelineMovimientos(movimientos);
      setTimelineDialogOpen(true);
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError('Error al cargar el historial');
    }
  };

  const getTipoChipColor = (tipo: TipoMovimientoStockDeposito | TipoMovimientoEquipo) => {
    switch (tipo) {
      case 'INGRESO':
      case 'INGRESO_INICIAL':
        return 'success';
      case 'EGRESO':
      case 'SALIDA_ENTREGA':
      case 'SALIDA_BAJA':
        return 'error';
      case 'TRANSFERENCIA':
      case 'TRASLADO':
        return 'info';
      case 'AJUSTE':
        return 'warning';
      case 'RETORNO':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Export functions
  const handleExportExcel = () => {
    try {
      const filtrosAplicados: Record<string, any> = {};

      if (fechaInicio) {
        filtrosAplicados['Fecha Inicio'] = dayjs(fechaInicio).format('DD/MM/YYYY');
      }
      if (fechaFin) {
        filtrosAplicados['Fecha Fin'] = dayjs(fechaFin).format('DD/MM/YYYY');
      }

      if (depositoOrigenFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoOrigenFilter);
        filtrosAplicados['Depósito Origen'] = deposito?.nombre || depositoOrigenFilter;
      }

      if (depositoDestinoFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoDestinoFilter);
        filtrosAplicados['Depósito Destino'] = deposito?.nombre || depositoDestinoFilter;
      }

      if (tabValue === 0) {
        // Exportar movimientos de stock
        if (tipoMovimientoStockFilter !== 'all') {
          filtrosAplicados['Tipo de Movimiento'] = tipoMovimientoStockFilter;
        }
        if (productoFilter !== 'all') {
          const producto = productos.find(p => p.id.toString() === productoFilter);
          filtrosAplicados['Producto'] = producto?.nombre || productoFilter;
        }

        const dataParaExportar = prepareTableDataForExport(filteredMovimientosStock, [
          {
            key: 'fechaMovimiento',
            header: 'Fecha',
            format: 'datetime',
            transform: (_, row) => getMovFecha(row)
          },
          { key: 'productoNombre', header: 'Producto' },
          { key: 'productoCodigo', header: 'Código' },
          {
            key: 'tipoMovimiento',
            header: 'Tipo',
            transform: (_, row) => getMovTipo(row)
          },
          { key: 'depositoOrigenNombre', header: 'Origen' },
          { key: 'depositoDestinoNombre', header: 'Destino' },
          { key: 'cantidad', header: 'Cantidad', format: 'number' },
          { key: 'usuarioNombre', header: 'Usuario' },
          {
            key: 'documentoReferencia',
            header: 'Referencia',
            transform: (_, row) => getMovReferencia(row)
          },
        ]);

        exportToExcel({
          fileName: `auditoria-movimientos-stock-${dayjs().format('YYYY-MM-DD')}`,
          metadata: {
            title: 'Auditoría de Movimientos de Stock',
            generatedBy: user?.nombre || 'Usuario',
            generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            filters: filtrosAplicados,
          },
          sheets: [
            {
              name: 'Movimientos',
              data: dataParaExportar,
            },
          ],
        });
      } else {
        // Exportar movimientos de equipos
        if (tipoMovimientoEquipoFilter !== 'all') {
          filtrosAplicados['Tipo de Movimiento'] = tipoMovimientoEquipoFilter;
        }
        if (numeroHeladeraFilter) {
          filtrosAplicados['Número de Heladera'] = numeroHeladeraFilter;
        }

        const dataParaExportar = prepareTableDataForExport(filteredMovimientosEquipo, [
          { key: 'fechaMovimiento', header: 'Fecha', format: 'datetime' },
          { key: 'equipoNumeroHeladera', header: 'Nº Heladera' },
          { key: 'equipoModelo', header: 'Modelo' },
          { key: 'tipoMovimiento', header: 'Tipo' },
          { key: 'depositoOrigenNombre', header: 'Origen' },
          { key: 'depositoDestinoNombre', header: 'Destino' },
          { key: 'ubicacionInterna', header: 'Ubicación Interna' },
          { key: 'usuarioNombre', header: 'Usuario' },
          { key: 'observaciones', header: 'Observaciones' },
        ]);

        exportToExcel({
          fileName: `auditoria-movimientos-equipos-${dayjs().format('YYYY-MM-DD')}`,
          metadata: {
            title: 'Auditoría de Movimientos de Equipos',
            generatedBy: user?.nombre || 'Usuario',
            generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            filters: filtrosAplicados,
          },
          sheets: [
            {
              name: 'Movimientos',
              data: dataParaExportar,
            },
          ],
        });
      }

      setSuccess('Archivo Excel exportado correctamente');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setError('Error al exportar a Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      const filtrosAplicados: Record<string, any> = {};

      if (fechaInicio) {
        filtrosAplicados['Fecha Inicio'] = dayjs(fechaInicio).format('DD/MM/YYYY');
      }
      if (fechaFin) {
        filtrosAplicados['Fecha Fin'] = dayjs(fechaFin).format('DD/MM/YYYY');
      }

      if (depositoOrigenFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoOrigenFilter);
        filtrosAplicados['Depósito Origen'] = deposito?.nombre || depositoOrigenFilter;
      }

      if (depositoDestinoFilter !== 'all') {
        const deposito = depositos.find(d => d.id.toString() === depositoDestinoFilter);
        filtrosAplicados['Depósito Destino'] = deposito?.nombre || depositoDestinoFilter;
      }

      if (tabValue === 0) {
        // Exportar movimientos de stock
        if (tipoMovimientoStockFilter !== 'all') {
          filtrosAplicados['Tipo de Movimiento'] = tipoMovimientoStockFilter;
        }
        if (productoFilter !== 'all') {
          const producto = productos.find(p => p.id.toString() === productoFilter);
          filtrosAplicados['Producto'] = producto?.nombre || productoFilter;
        }

        const { headers, rows } = prepareTableDataForPDF(filteredMovimientosStock, [
          {
            key: 'fechaMovimiento',
            header: 'Fecha',
            format: 'datetime',
            transform: (_, row) => getMovFecha(row)
          },
          { key: 'productoNombre', header: 'Producto' },
          {
            key: 'tipoMovimiento',
            header: 'Tipo',
            transform: (_, row) => getMovTipo(row)
          },
          { key: 'depositoOrigenNombre', header: 'Origen' },
          { key: 'depositoDestinoNombre', header: 'Destino' },
          { key: 'cantidad', header: 'Cant.', format: 'number' },
          { key: 'usuarioNombre', header: 'Usuario' },
        ]);

        exportToPDF({
          fileName: `auditoria-movimientos-stock-${dayjs().format('YYYY-MM-DD')}`,
          title: 'Auditoría de Movimientos de Stock',
          orientation: 'landscape',
          metadata: {
            generatedBy: user?.nombre || 'Usuario',
            generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            filters: filtrosAplicados,
          },
          tables: [
            {
              headers,
              rows,
              showFooter: true,
              footerText: `Total de registros: ${filteredMovimientosStock.length}`,
            },
          ],
        });
      } else {
        // Exportar movimientos de equipos
        if (tipoMovimientoEquipoFilter !== 'all') {
          filtrosAplicados['Tipo de Movimiento'] = tipoMovimientoEquipoFilter;
        }
        if (numeroHeladeraFilter) {
          filtrosAplicados['Número de Heladera'] = numeroHeladeraFilter;
        }

        const { headers, rows } = prepareTableDataForPDF(filteredMovimientosEquipo, [
          { key: 'fechaMovimiento', header: 'Fecha', format: 'datetime' },
          { key: 'equipoNumeroHeladera', header: 'Nº Heladera' },
          { key: 'equipoModelo', header: 'Modelo' },
          { key: 'tipoMovimiento', header: 'Tipo' },
          { key: 'depositoOrigenNombre', header: 'Origen' },
          { key: 'depositoDestinoNombre', header: 'Destino' },
          { key: 'usuarioNombre', header: 'Usuario' },
        ]);

        exportToPDF({
          fileName: `auditoria-movimientos-equipos-${dayjs().format('YYYY-MM-DD')}`,
          title: 'Auditoría de Movimientos de Equipos',
          orientation: 'landscape',
          metadata: {
            generatedBy: user?.nombre || 'Usuario',
            generatedAt: dayjs().format('DD/MM/YYYY HH:mm:ss'),
            filters: filtrosAplicados,
          },
          tables: [
            {
              headers,
              rows,
              showFooter: true,
              footerText: `Total de registros: ${filteredMovimientosEquipo.length}`,
            },
          ],
        });
      }

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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HistoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Auditoría de Movimientos
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
          >
            Exportar
          </Button>
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

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Movimientos de Stock
                </Typography>
                <Typography variant="h4">{stats.totalMovStock}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Transferencias de Stock
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.transferenciasStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Movimientos de Equipos
                </Typography>
                <Typography variant="h4">{stats.totalMovEquipo}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Traslados de Equipos
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.trasladosEquipo}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Movimientos de Stock" />
            <Tab label="Movimientos de Equipos" />
          </Tabs>
        </Card>

        {/* Filters */}
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon />
              <Typography>Filtros Avanzados</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Fecha Inicio"
                  value={fechaInicio}
                  onChange={(newValue) => setFechaInicio(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Fecha Fin"
                  value={fechaFin}
                  onChange={(newValue) => setFechaFin(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" display="block" gutterBottom>
                  Rangos Predefinidos:
                </Typography>
                <ButtonGroup variant="outlined" size="small">
                  <Button onClick={() => setDateRange('today')}>Hoy</Button>
                  <Button onClick={() => setDateRange('week')}>Última Semana</Button>
                  <Button onClick={() => setDateRange('month')}>Último Mes</Button>
                  <Button onClick={() => setDateRange('quarter')}>Último Trimestre</Button>
                </ButtonGroup>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Depósito Origen</InputLabel>
                  <Select
                    value={depositoOrigenFilter}
                    onChange={(e) => setDepositoOrigenFilter(e.target.value)}
                    label="Depósito Origen"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {depositos.map((deposito) => (
                      <MenuItem key={deposito.id} value={deposito.id.toString()}>
                        {deposito.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Depósito Destino</InputLabel>
                  <Select
                    value={depositoDestinoFilter}
                    onChange={(e) => setDepositoDestinoFilter(e.target.value)}
                    label="Depósito Destino"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {depositos.map((deposito) => (
                      <MenuItem key={deposito.id} value={deposito.id.toString()}>
                        {deposito.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {tabValue === 0 ? (
                <>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Movimiento</InputLabel>
                      <Select
                        value={tipoMovimientoStockFilter}
                        onChange={(e) => setTipoMovimientoStockFilter(e.target.value)}
                        label="Tipo de Movimiento"
                      >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="INGRESO">Ingreso</MenuItem>
                        <MenuItem value="EGRESO">Egreso</MenuItem>
                        <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                        <MenuItem value="AJUSTE">Ajuste</MenuItem>
                        <MenuItem value="CONSUMO">Consumo</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Producto</InputLabel>
                      <Select
                        value={productoFilter}
                        onChange={(e) => setProductoFilter(e.target.value)}
                        label="Producto"
                      >
                        <MenuItem value="all">Todos</MenuItem>
                        {productos.map((producto) => (
                          <MenuItem key={producto.id} value={producto.id.toString()}>
                            {producto.nombre} {producto.codigo && `(${producto.codigo})`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Movimiento</InputLabel>
                      <Select
                        value={tipoMovimientoEquipoFilter}
                        onChange={(e) => setTipoMovimientoEquipoFilter(e.target.value)}
                        label="Tipo de Movimiento"
                      >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="INGRESO_INICIAL">Ingreso Inicial</MenuItem>
                        <MenuItem value="TRASLADO">Traslado</MenuItem>
                        <MenuItem value="SALIDA_ENTREGA">Salida/Entrega</MenuItem>
                        <MenuItem value="SALIDA_BAJA">Salida/Baja</MenuItem>
                        <MenuItem value="RETORNO">Retorno</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Número de Heladera"
                      value={numeroHeladeraFilter}
                      onChange={(e) => setNumeroHeladeraFilter(e.target.value)}
                      placeholder="Buscar por número..."
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={4}>
                <Button fullWidth variant="contained" onClick={handleApplyFilters} sx={{ height: '56px' }}>
                  Aplicar Filtros de Fecha
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Content */}
        <TabPanel value={tabValue} index={0}>
          {/* Stock Movements */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Destino</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Referencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovimientosStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                          No se encontraron movimientos
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovimientosStock.map((mov) => {
                      const fecha = getMovFecha(mov);
                      const fechaDate = fecha ? new Date(fecha) : null;
                      const fechaValida = fechaDate && !isNaN(fechaDate.getTime());
                      const tipo = getMovTipo(mov);
                      const referencia = getMovReferencia(mov);
                      
                      return (
                        <TableRow key={mov.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {fechaValida ? fechaDate.toLocaleDateString() : '-'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {fechaValida ? fechaDate.toLocaleTimeString() : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{mov.productoNombre || '-'}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {mov.productoCodigo || ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tipo}
                              size="small"
                              color={getTipoChipColor(tipo as any) as any}
                            />
                          </TableCell>
                          <TableCell>{mov.depositoOrigenNombre || '-'}</TableCell>
                          <TableCell>{mov.depositoDestinoNombre || '-'}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {mov.cantidad}
                            </Typography>
                          </TableCell>
                          <TableCell>{mov.usuarioNombre || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="caption">{referencia}</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Equipment Movements */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Nº Heladera</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Destino</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovimientosEquipo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                          No se encontraron movimientos
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovimientosEquipo.map((mov) => (
                      <TableRow key={mov.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(mov.fechaMovimiento).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(mov.fechaMovimiento).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {mov.equipoNumeroHeladera}
                          </Typography>
                        </TableCell>
                        <TableCell>{mov.equipoModelo}</TableCell>
                        <TableCell>
                          <Chip
                            label={mov.tipoMovimiento}
                            size="small"
                            color={getTipoChipColor(mov.tipoMovimiento) as any}
                          />
                        </TableCell>
                        <TableCell>{mov.depositoOrigenNombre || '-'}</TableCell>
                        <TableCell>{mov.depositoDestinoNombre || '-'}</TableCell>
                        <TableCell>{mov.usuarioNombre || '-'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver línea de tiempo completa">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenTimeline(mov.equipoNumeroHeladera)}
                            >
                              <TimelineIcon fontSize="small" />
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

        {/* Timeline Dialog */}
        <Dialog
          open={timelineDialogOpen}
          onClose={() => setTimelineDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimelineIcon />
              <Typography>Historial Completo - {selectedEquipoNumero}</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ position: 'relative', pl: 4 }}>
              {timelineMovimientos.length === 0 ? (
                <Alert severity="info">No hay movimientos registrados para este equipo</Alert>
              ) : (
                timelineMovimientos.map((mov, index) => (
                  <Box
                    key={mov.id}
                    sx={{
                      position: 'relative',
                      pb: 3,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: -20,
                        top: 0,
                        bottom: index === timelineMovimientos.length - 1 ? '100%' : 0,
                        width: 2,
                        bgcolor: 'primary.main',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -26,
                        top: 0,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        border: '3px solid white',
                        boxShadow: 1,
                      }}
                    />
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Chip
                            label={mov.tipoMovimiento}
                            size="small"
                            color={getTipoChipColor(mov.tipoMovimiento) as any}
                          />
                          <Typography variant="caption" color="textSecondary">
                            {new Date(mov.fechaMovimiento).toLocaleString()}
                          </Typography>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Origen:
                            </Typography>
                            <Typography variant="body2">{mov.depositoOrigenNombre || '-'}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Destino:
                            </Typography>
                            <Typography variant="body2">{mov.depositoDestinoNombre || '-'}</Typography>
                          </Grid>
                          {mov.ubicacionInterna && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="textSecondary">
                                Ubicación Interna:
                              </Typography>
                              <Typography variant="body2">{mov.ubicacionInterna}</Typography>
                            </Grid>
                          )}
                          {mov.observaciones && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="textSecondary">
                                Observaciones:
                              </Typography>
                              <Typography variant="body2">{mov.observaciones}</Typography>
                            </Grid>
                          )}
                          {mov.usuarioNombre && (
                            <Grid item xs={12}>
                              <Typography variant="caption" color="textSecondary">
                                Usuario: {mov.usuarioNombre}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Box>
                ))
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTimelineDialogOpen(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditoriaPage;
