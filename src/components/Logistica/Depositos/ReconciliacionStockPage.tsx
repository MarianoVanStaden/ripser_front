import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Collapse,
  List,
  ListItemText,
  Tab,
  Tabs,
  ListItemButton,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  PlayArrow as PlayArrowIcon,
  DoneAll as DoneAllIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { reconciliacionApi } from '../../../api/services/reconciliacionApi';
import { depositoApi } from '../../../api/services/depositoApi';
import { productApi } from '../../../api/services/productApi';
import type {
  ReconciliacionStockDTO,
  ReconciliacionDetalladaDTO,
  ReconciliacionDiferenciasDTO,
  Deposito,
  Producto,
  EstadoReconciliacionType,
} from '../../../types';
import dayjs from 'dayjs';

// Helper function
const formatearErrorBackend = (err: any): string => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (err.message) return err.message;
  return 'Error desconocido';
};

const getEstadoColor = (estado: EstadoReconciliacionType): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  switch (estado) {
    case 'EN_PROCESO': return 'primary';
    case 'PENDIENTE_APROBACION': return 'warning';
    case 'APROBADA': return 'success';
    case 'CANCELADA': return 'error';
    default: return 'default';
  }
};

const getEstadoLabel = (estado: EstadoReconciliacionType): string => {
  switch (estado) {
    case 'EN_PROCESO': return 'En Proceso';
    case 'PENDIENTE_APROBACION': return 'Pendiente Aprobación';
    case 'APROBADA': return 'Aprobada';
    case 'CANCELADA': return 'Cancelada';
    default: return estado;
  }
};

const ReconciliacionStockPage: React.FC = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // State management
  const [reconciliacionActiva, setReconciliacionActiva] = useState<ReconciliacionDetalladaDTO | null>(null);
  const [diferencias, setDiferencias] = useState<ReconciliacionDiferenciasDTO | null>(null);
  const [historial, setHistorial] = useState<ReconciliacionStockDTO[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openIniciarDialog, setOpenIniciarDialog] = useState(false);
  const [openAjusteDialog, setOpenAjusteDialog] = useState(false);
  const [openAprobarDialog, setOpenAprobarDialog] = useState(false);
  const [openCancelarDialog, setOpenCancelarDialog] = useState(false);
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [selectedReconciliacion, setSelectedReconciliacion] = useState<ReconciliacionStockDTO | null>(null);
  const [selectedReconciliacionDetalle, setSelectedReconciliacionDetalle] = useState<ReconciliacionDetalladaDTO | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [detalleTabValue, setDetalleTabValue] = useState(0);

  // Form states
  const [periodo, setPeriodo] = useState(dayjs().format('MMMM YYYY'));
  const [observaciones, setObservaciones] = useState('');
  const [ajusteForm, setAjusteForm] = useState<{
    depositoId: number | '';
    productoId: number | '';
    cantidadFisicaContada: number | '';
    observaciones: string;
  }>({
    depositoId: '',
    productoId: '',
    cantidadFisicaContada: '',
    observaciones: '',
  });
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [aplicarAjustes, setAplicarAjustes] = useState(true);
  const [observacionesAprobacion, setObservacionesAprobacion] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProducto, setExpandedProducto] = useState<number | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load deposits
      const depositosResponse = await depositoApi.getAll();
      const depositosData = Array.isArray(depositosResponse) 
        ? depositosResponse 
        : (depositosResponse as any)?.content || [];
      setDepositos(depositosData);

      // Load products
      const productosResponse = await productApi.getAll(0, 10000);
      const productosData = Array.isArray(productosResponse)
        ? productosResponse
        : (productosResponse as any)?.content || [];
      setProductos(productosData);

      // Check for active reconciliation
      try {
        const activa = await reconciliacionApi.getActiva();
        setReconciliacionActiva(activa);
        
        // If active, load differences
        if (activa?.id) {
          try {
            const difs = await reconciliacionApi.getDiferencias(activa.id);
            console.log('Diferencias response:', difs);
            setDiferencias(difs);
          } catch (err) {
            console.error('Error loading diferencias:', err);
          }
        }
      } catch {
        setReconciliacionActiva(null);
      }

      // Load history
      try {
        const hist = await reconciliacionApi.getHistorial();
        const histData = Array.isArray(hist) ? hist : (hist as any)?.content || [];
        setHistorial(histData);
      } catch {
        setHistorial([]);
      }

    } catch (err: any) {
      setError(formatearErrorBackend(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Actions
  const handleIniciarReconciliacion = async () => {
    try {
      setLoadingAction(true);
      setError(null);

      await reconciliacionApi.iniciar({
        periodo,
        observaciones: observaciones || undefined,
      });

      setSuccess('Reconciliación iniciada correctamente');
      setOpenIniciarDialog(false);
      setPeriodo(dayjs().format('MMMM YYYY'));
      setObservaciones('');
      await loadData();
    } catch (err: any) {
      setError(formatearErrorBackend(err));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRegistrarAjuste = async () => {
    if (!reconciliacionActiva?.id) return;
    if (ajusteForm.depositoId === '' || ajusteForm.productoId === '' || ajusteForm.cantidadFisicaContada === '') {
      setError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setLoadingAction(true);
      setError(null);

      const requestData = {
        productoId: ajusteForm.productoId as number,
        depositoId: ajusteForm.depositoId as number,
        cantidadFisicaContada: ajusteForm.cantidadFisicaContada as number,
        observaciones: ajusteForm.observaciones || undefined,
      };
      console.log('Sending ajuste request:', requestData);

      await reconciliacionApi.ajustarDeposito(reconciliacionActiva.id, requestData);

      setSuccess('Ajuste registrado correctamente');
      setOpenAjusteDialog(false);
      setAjusteForm({ depositoId: '', productoId: '', cantidadFisicaContada: '', observaciones: '' });
      await loadData();
    } catch (err: any) {
      setError(formatearErrorBackend(err));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAprobarReconciliacion = async () => {
    if (!reconciliacionActiva?.id) return;

    try {
      setLoadingAction(true);
      setError(null);

      const requestData = {
        aplicarAjustes,
        observaciones: observacionesAprobacion || undefined,
      };
      console.log('Sending aprobar request:', requestData);

      const resultado = await reconciliacionApi.aprobar(reconciliacionActiva.id, requestData);

      // Mostrar mensaje del backend
      setSuccess(resultado.mensaje || 'Reconciliación aprobada correctamente');
      setOpenAprobarDialog(false);
      setAplicarAjustes(true);
      setObservacionesAprobacion('');
      await loadData();
    } catch (err: any) {
      setError(formatearErrorBackend(err));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelarReconciliacion = async () => {
    if (!reconciliacionActiva?.id) return;

    try {
      setLoadingAction(true);
      setError(null);

      await reconciliacionApi.cancelar(reconciliacionActiva.id, {
        motivo: motivoCancelacion,
      });

      setSuccess('Reconciliación cancelada');
      setOpenCancelarDialog(false);
      setMotivoCancelacion('');
      await loadData();
    } catch (err: any) {
      setError(formatearErrorBackend(err));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerDetalle = async (rec: ReconciliacionStockDTO) => {
    setSelectedReconciliacion(rec);
    setSelectedReconciliacionDetalle(null);
    setDetalleTabValue(0);
    setOpenDetalleDialog(true);
    
    // Cargar detalle completo con ajustes
    try {
      setLoadingDetalle(true);
      const detalle = await reconciliacionApi.getById(rec.id);
      console.log('Detalle reconciliación cargado:', detalle);
      console.log('Ajustes en detalle:', detalle?.ajustes);
      
      // Normalizar: el backend devuelve ajustesDepositos, no ajustes
      if (detalle.ajustesDepositos && detalle.ajustesDepositos.length > 0) {
        console.log('Usando ajustesDepositos del backend:', detalle.ajustesDepositos);
      }
      
      setSelectedReconciliacionDetalle(detalle);
    } catch (err) {
      console.error('Error cargando detalle:', err);
      // Si falla, al menos tenemos los datos básicos
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Filter differences
  const filteredDiferencias = diferencias?.diferencias?.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.productoNombre.toLowerCase().includes(term) ||
      (item.productoCodigo && item.productoCodigo.toLowerCase().includes(term))
    );
  }) || [];

  // Get step index based on state
  const getStepIndex = (estado?: EstadoReconciliacionType): number => {
    switch (estado) {
      case 'EN_PROCESO': return 1;
      case 'PENDIENTE_APROBACION': return 2;
      case 'APROBADA': return 3;
      default: return 0;
    }
  };

  const steps = ['Sin iniciar', 'En proceso', 'Revisión', 'Aprobada'];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
          <SyncIcon sx={{ fontSize: { xs: 28, md: 32 }, color: 'primary.main' }} />
          <Typography 
            variant="h4"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            Reconciliación de Stock
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: 'stretch' }}>
          <Tooltip title="Actualizar">
            <Button
              variant="outlined"
              onClick={loadData}
              disabled={loading}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              <RefreshIcon />
            </Button>
          </Tooltip>
          {!reconciliacionActiva && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenIniciarDialog(true)}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Iniciar Reconciliación
            </Button>
          )}
        </Box>
      </Box>

      {/* Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Reconciliación Activa" icon={<PlayArrowIcon />} iconPosition="start" />
          <Tab label="Historial" icon={<HistoryIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab: Active Reconciliation */}
      {tabValue === 0 && (
        <>
          {!reconciliacionActiva ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <SyncIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay reconciliación activa
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Inicia una nueva reconciliación para comparar el stock del sistema con el inventario físico
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenIniciarDialog(true)}
                  >
                    Iniciar Reconciliación
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Progress Stepper */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Stepper activeStep={getStepIndex(reconciliacionActiva.estado)} alternativeLabel>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>

              {/* Active Reconciliation Info */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {reconciliacionActiva.codigoReconciliacion || `Reconciliación #${reconciliacionActiva.id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Período: {reconciliacionActiva.periodo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Iniciada: {dayjs(reconciliacionActiva.fechaInicio).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                      {reconciliacionActiva.observaciones && (
                        <Typography variant="body2" color="text.secondary">
                          Observaciones: {reconciliacionActiva.observaciones}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                      <Chip
                        label={getEstadoLabel(reconciliacionActiva.estado)}
                        color={getEstadoColor(reconciliacionActiva.estado)}
                      />
                      {reconciliacionActiva.estado === 'EN_PROCESO' && (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setOpenAjusteDialog(true)}
                            size="small"
                          >
                            Registrar Ajuste
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<DoneAllIcon />}
                            onClick={() => setOpenAprobarDialog(true)}
                            size="small"
                          >
                            Aprobar
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => setOpenCancelarDialog(true)}
                            size="small"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {reconciliacionActiva.estado === 'PENDIENTE_APROBACION' && (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setOpenAjusteDialog(true)}
                            size="small"
                          >
                            Registrar Ajuste
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<DoneAllIcon />}
                            onClick={() => setOpenAprobarDialog(true)}
                            size="small"
                          >
                            Aprobar
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => setOpenCancelarDialog(true)}
                            size="small"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Summary Cards - Colores suaves */}
              {diferencias && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Productos
                        </Typography>
                        <Typography variant="h4">
                          {diferencias.totalProductos}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'action.hover', border: '1px solid', borderColor: 'primary.light' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="primary.main">
                          Con Diferencias
                        </Typography>
                        <Typography variant="h4" color="primary.main">
                          {diferencias.productosConDiferencias}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'rgba(237, 108, 2, 0.08)', border: '1px solid', borderColor: 'warning.light' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="warning.dark">
                          Sobrante Total
                        </Typography>
                        <Typography variant="h4" color="warning.dark">
                          +{diferencias.totalDiferenciaPositiva}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'rgba(211, 47, 47, 0.08)', border: '1px solid', borderColor: 'error.light' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="error.main">
                          Faltante Total
                        </Typography>
                        <Typography variant="h4" color="error.main">
                          -{diferencias.totalDiferenciaNegativa}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Differences List */}
              {diferencias && diferencias.diferencias && diferencias.diferencias.length > 0 && (
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Diferencias Detectadas
                      </Typography>
                    </Box>

                    {/* Search */}
                    <TextField
                      fullWidth
                      placeholder="Buscar por nombre o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Differences list with expandable details */}
                    <List disablePadding>
                      {filteredDiferencias.map((item) => (
                        <React.Fragment key={item.productoId}>
                          <ListItemButton
                            onClick={() => setExpandedProducto(
                              expandedProducto === item.productoId ? null : item.productoId
                            )}
                            sx={{
                              bgcolor: item.tipoDiferencia === 'FALTANTE' 
                                ? 'rgba(211, 47, 47, 0.04)' 
                                : item.tipoDiferencia === 'SOBRANTE' 
                                  ? 'rgba(237, 108, 2, 0.04)' 
                                  : 'rgba(46, 125, 50, 0.04)',
                              '&:hover': {
                                bgcolor: item.tipoDiferencia === 'FALTANTE' 
                                  ? 'rgba(211, 47, 47, 0.08)' 
                                  : item.tipoDiferencia === 'SOBRANTE' 
                                    ? 'rgba(237, 108, 2, 0.08)' 
                                    : 'rgba(46, 125, 50, 0.08)',
                              },
                              borderRadius: 1,
                              mb: 0.5,
                              border: '1px solid',
                              borderColor: item.tipoDiferencia === 'FALTANTE' 
                                ? 'rgba(211, 47, 47, 0.2)' 
                                : item.tipoDiferencia === 'SOBRANTE' 
                                  ? 'rgba(237, 108, 2, 0.2)' 
                                  : 'rgba(46, 125, 50, 0.2)',
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle2">
                                    {item.productoNombre}
                                  </Typography>
                                  {item.productoCodigo && (
                                    <Typography variant="caption" color="text.secondary">
                                      ({item.productoCodigo})
                                    </Typography>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box display="flex" gap={2} mt={0.5} alignItems="center">
                                  <Typography variant="body2" color="text.secondary">
                                    Stock General: <strong>{item.stockGeneralInicial}</strong>
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Suma Depósitos: <strong>{item.sumaDepositosAjustada}</strong>
                                  </Typography>
                                  <Chip
                                    label={`Dif: ${item.diferencia > 0 ? '+' : ''}${item.diferencia}`}
                                    color={
                                      item.tipoDiferencia === 'FALTANTE' ? 'error' : 
                                      item.tipoDiferencia === 'SOBRANTE' ? 'warning' : 'success'
                                    }
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={
                                      item.tipoDiferencia === 'FALTANTE' ? 'Faltante' : 
                                      item.tipoDiferencia === 'SOBRANTE' ? 'Sobrante' : 'OK'
                                    }
                                    color={
                                      item.tipoDiferencia === 'FALTANTE' ? 'error' : 
                                      item.tipoDiferencia === 'SOBRANTE' ? 'warning' : 'success'
                                    }
                                    size="small"
                                  />
                                </Box>
                              }
                            />
                            {expandedProducto === item.productoId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </ListItemButton>
                          <Collapse in={expandedProducto === item.productoId}>
                            <Box sx={{ pl: 2, pr: 2, pb: 2, pt: 1, bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
                              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                                Detalle por Depósito:
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                      <TableCell>Depósito</TableCell>
                                      <TableCell align="right">Stock Sistema</TableCell>
                                      <TableCell align="right">Contado</TableCell>
                                      <TableCell align="right">Diferencia</TableCell>
                                      <TableCell>Estado</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {item.detallesPorDeposito && item.detallesPorDeposito.length > 0 ? (
                                      item.detallesPorDeposito.map((detalle) => (
                                        <TableRow key={detalle.depositoId}>
                                          <TableCell>{detalle.depositoNombre}</TableCell>
                                          <TableCell align="right">{detalle.stockSistema}</TableCell>
                                          <TableCell align="right">
                                            {detalle.cantidadContada !== null ? detalle.cantidadContada : '-'}
                                          </TableCell>
                                          <TableCell align="right">
                                            {detalle.diferencia !== null ? (
                                              <Chip
                                                label={detalle.diferencia > 0 ? `+${detalle.diferencia}` : detalle.diferencia}
                                                color={
                                                  detalle.diferencia === 0 ? 'success' : 
                                                  detalle.diferencia > 0 ? 'warning' : 'error'
                                                }
                                                size="small"
                                                variant="outlined"
                                              />
                                            ) : '-'}
                                          </TableCell>
                                          <TableCell>
                                            {detalle.ajusteRegistrado ? (
                                              <Chip label="Ajustado" color="success" size="small" variant="outlined" />
                                            ) : (
                                              <Chip label="Pendiente" color="default" size="small" variant="outlined" />
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={5} align="center">
                                          <Typography variant="body2" color="text.secondary">
                                            No hay detalle por depósito disponible
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          </Collapse>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Tab: History */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historial de Reconciliaciones
            </Typography>
            {historial.length === 0 ? (
              <Box textAlign="center" py={4}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">
                  No hay reconciliaciones anteriores
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Período</TableCell>
                      <TableCell>Fecha Inicio</TableCell>
                      <TableCell>Fecha Fin</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historial.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{rec.codigoReconciliacion || `#${rec.id}`}</TableCell>
                        <TableCell>{rec.periodo}</TableCell>
                        <TableCell>{dayjs(rec.fechaInicio).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>
                          {rec.fechaFinalizacion 
                            ? dayjs(rec.fechaFinalizacion).format('DD/MM/YYYY')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEstadoLabel(rec.estado)}
                            color={getEstadoColor(rec.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Ver detalle">
                            <IconButton onClick={() => handleVerDetalle(rec)} size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog: Iniciar Reconciliación */}
      <Dialog open={openIniciarDialog} onClose={() => setOpenIniciarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Iniciar Nueva Reconciliación
            <IconButton onClick={() => setOpenIniciarDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              placeholder="ej: Enero 2026"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIniciarDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleIniciarReconciliacion}
            disabled={loadingAction || !periodo}
          >
            {loadingAction ? <CircularProgress size={24} /> : 'Iniciar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Registrar Ajuste */}
      <Dialog open={openAjusteDialog} onClose={() => setOpenAjusteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Registrar Ajuste de Stock
            <IconButton onClick={() => setOpenAjusteDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Depósito</InputLabel>
              <Select
                value={ajusteForm.depositoId}
                onChange={(e) => setAjusteForm({ ...ajusteForm, depositoId: e.target.value as number })}
                label="Depósito"
              >
                <MenuItem value="" disabled><em>Seleccionar depósito...</em></MenuItem>
                {depositos.map((dep) => (
                  <MenuItem key={dep.id} value={dep.id}>{dep.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Producto</InputLabel>
              <Select
                value={ajusteForm.productoId}
                onChange={(e) => setAjusteForm({ ...ajusteForm, productoId: e.target.value as number })}
                label="Producto"
              >
                <MenuItem value="" disabled><em>Seleccionar producto...</em></MenuItem>
                {productos.map((prod) => (
                  <MenuItem key={prod.id} value={prod.id}>
                    {prod.nombre} {prod.codigo ? `(${prod.codigo})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Cantidad Física Contada"
              value={ajusteForm.cantidadFisicaContada}
              onChange={(e) => setAjusteForm({ ...ajusteForm, cantidadFisicaContada: e.target.value === '' ? '' : parseInt(e.target.value) })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Observaciones"
              value={ajusteForm.observaciones}
              onChange={(e) => setAjusteForm({ ...ajusteForm, observaciones: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAjusteDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleRegistrarAjuste}
            disabled={loadingAction || ajusteForm.depositoId === '' || ajusteForm.productoId === '' || ajusteForm.cantidadFisicaContada === ''}
          >
            {loadingAction ? <CircularProgress size={24} /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Aprobar Reconciliación */}
      <Dialog open={openAprobarDialog} onClose={() => setOpenAprobarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Aprobar Reconciliación
            <IconButton onClick={() => setOpenAprobarDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Al aprobar la reconciliación, se pueden aplicar los ajustes de stock registrados.
            </Alert>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Aplicar Ajustes</InputLabel>
              <Select
                value={aplicarAjustes ? 'si' : 'no'}
                onChange={(e) => setAplicarAjustes(e.target.value === 'si')}
                label="Aplicar Ajustes"
              >
                <MenuItem value="si">Sí, aplicar ajustes al stock</MenuItem>
                <MenuItem value="no">No, solo cerrar reconciliación</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Observaciones de Aprobación"
              value={observacionesAprobacion}
              onChange={(e) => setObservacionesAprobacion(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAprobarDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAprobarReconciliacion}
            disabled={loadingAction}
          >
            {loadingAction ? <CircularProgress size={24} /> : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Cancelar Reconciliación */}
      <Dialog open={openCancelarDialog} onClose={() => setOpenCancelarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Cancelar Reconciliación
            <IconButton onClick={() => setOpenCancelarDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Esta acción cancelará la reconciliación actual. Los ajustes registrados no se aplicarán.
            </Alert>
            <TextField
              fullWidth
              label="Motivo de Cancelación"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              multiline
              rows={3}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelarDialog(false)}>Volver</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelarReconciliacion}
            disabled={loadingAction || !motivoCancelacion}
          >
            {loadingAction ? <CircularProgress size={24} /> : 'Cancelar Reconciliación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Ver Detalle - Versión mejorada con auditoría */}
      <Dialog open={openDetalleDialog} onClose={() => setOpenDetalleDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <HistoryIcon color="primary" />
              <Typography variant="h6">
                Detalle de Reconciliación {selectedReconciliacion?.codigoReconciliacion || `#${selectedReconciliacion?.id}`}
              </Typography>
              {selectedReconciliacion && (
                <Chip
                  label={getEstadoLabel(selectedReconciliacion.estado)}
                  color={getEstadoColor(selectedReconciliacion.estado)}
                  size="small"
                />
              )}
            </Box>
            <IconButton onClick={() => setOpenDetalleDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReconciliacion && (() => {
            // Normalizar: el backend devuelve ajustesDepositos, no ajustes
            const ajustesArray = selectedReconciliacionDetalle?.ajustesDepositos 
              || selectedReconciliacionDetalle?.ajustes 
              || [];
            
            return (
            <Box>
              {/* Tabs para organizar información */}
              <Tabs 
                value={detalleTabValue} 
                onChange={(_, newValue) => setDetalleTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Información General" />
                <Tab 
                  label={`Ajustes Realizados (${ajustesArray.length})`} 
                  disabled={loadingDetalle}
                />
                <Tab label="Estadísticas" />
              </Tabs>

              {/* Tab 0: Información General */}
              {detalleTabValue === 0 && (
                <Box>
                  <Grid container spacing={3}>
                    {/* Información básica */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        📋 Datos de la Reconciliación
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Código</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedReconciliacion.codigoReconciliacion || `#${selectedReconciliacion.id}`}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Período</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedReconciliacion.periodo}</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Fecha Inicio</Typography>
                      <Typography variant="body1">
                        {dayjs(selectedReconciliacion.fechaInicio).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Fecha Finalización</Typography>
                      <Typography variant="body1">
                        {selectedReconciliacion.fechaFinalizacion 
                          ? dayjs(selectedReconciliacion.fechaFinalizacion).format('DD/MM/YYYY HH:mm')
                          : <Chip label="En curso" size="small" color="info" variant="outlined" />
                        }
                      </Typography>
                    </Grid>

                    {/* Información de auditoría de usuarios */}
                    {(selectedReconciliacionDetalle?.usuarioInicioNombre || selectedReconciliacionDetalle?.usuarioAprobacionNombre) && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                            👤 Auditoría de Usuarios
                          </Typography>
                        </Grid>
                        {selectedReconciliacionDetalle?.usuarioInicioNombre && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2" color="text.secondary">Iniciada por</Typography>
                            <Chip 
                              label={selectedReconciliacionDetalle.usuarioInicioNombre} 
                              size="small" 
                              variant="outlined"
                              color="primary"
                            />
                          </Grid>
                        )}
                        {selectedReconciliacionDetalle?.usuarioAprobacionNombre && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2" color="text.secondary">Aprobada por</Typography>
                            <Chip 
                              label={selectedReconciliacionDetalle.usuarioAprobacionNombre} 
                              size="small" 
                              variant="outlined"
                              color="success"
                            />
                          </Grid>
                        )}
                      </>
                    )}
                    
                    {/* Observaciones */}
                    {selectedReconciliacion.observaciones && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                          📝 Observaciones
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="body2">{selectedReconciliacion.observaciones}</Typography>
                        </Paper>
                      </Grid>
                    )}

                    {/* Resumen rápido */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                        📊 Resumen Rápido
                      </Typography>
                      <Box display="flex" gap={2} flexWrap="wrap">
                        <Paper variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {selectedReconciliacion.totalProductosRevisados ?? '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Productos Revisados
                          </Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {selectedReconciliacion.totalDiferenciasEncontradas ?? '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Diferencias Encontradas
                          </Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {selectedReconciliacion.totalAjustesAplicados ?? ajustesArray.length ?? '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ajustes Aplicados
                          </Typography>
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 1: Ajustes Realizados */}
              {detalleTabValue === 1 && (
                <Box>
                  {loadingDetalle ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : ajustesArray.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell><strong>Producto</strong></TableCell>
                            <TableCell><strong>Depósito</strong></TableCell>
                            <TableCell align="right"><strong>Cant. Anterior</strong></TableCell>
                            <TableCell align="right"><strong>Cant. Contada</strong></TableCell>
                            <TableCell align="right"><strong>Diferencia</strong></TableCell>
                            <TableCell><strong>Usuario</strong></TableCell>
                            <TableCell><strong>Fecha Ajuste</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ajustesArray.map((ajuste) => (
                            <TableRow key={ajuste.id} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {ajuste.productoNombre}
                                  </Typography>
                                  {ajuste.productoCodigo && (
                                    <Typography variant="caption" color="text.secondary">
                                      {ajuste.productoCodigo}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>{ajuste.depositoNombre}</TableCell>
                              <TableCell align="right">{ajuste.cantidadAnterior}</TableCell>
                              <TableCell align="right">{ajuste.cantidadFisicaContada}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={ajuste.diferencia > 0 ? `+${ajuste.diferencia}` : ajuste.diferencia}
                                  size="small"
                                  color={ajuste.diferencia > 0 ? 'success' : ajuste.diferencia < 0 ? 'error' : 'default'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {ajuste.usuarioAjusteNombre || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {ajuste.fechaAjuste 
                                    ? dayjs(ajuste.fechaAjuste).format('DD/MM/YYYY HH:mm')
                                    : '-'
                                  }
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      No se registraron ajustes en esta reconciliación.
                    </Alert>
                  )}
                </Box>
              )}

              {/* Tab 2: Estadísticas */}
              {detalleTabValue === 2 && (
                <Box>
                  <Grid container spacing={3}>
                    {/* Estadísticas de ajustes */}
                    {ajustesArray.length > 0 ? (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                            📈 Análisis de Ajustes
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h5" color="success.main">
                              {ajustesArray.filter(a => a.diferencia > 0).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Ajustes Positivos (Sobrantes)
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              Total: +{ajustesArray
                                .filter(a => a.diferencia > 0)
                                .reduce((sum, a) => sum + a.diferencia, 0)} unidades
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h5" color="error.main">
                              {ajustesArray.filter(a => a.diferencia < 0).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Ajustes Negativos (Faltantes)
                            </Typography>
                            <Typography variant="caption" color="error.main">
                              Total: {ajustesArray
                                .filter(a => a.diferencia < 0)
                                .reduce((sum, a) => sum + a.diferencia, 0)} unidades
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="h5" color="info.main">
                              {ajustesArray.filter(a => a.diferencia === 0).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Sin Diferencia
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Verificaciones correctas
                            </Typography>
                          </Paper>
                        </Grid>

                        {/* Depósitos afectados */}
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                            🏭 Depósitos Afectados
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {[...new Set(ajustesArray.map(a => a.depositoNombre))].map(deposito => {
                              const ajustesDeposito = ajustesArray.filter(a => a.depositoNombre === deposito);
                              return (
                                <Chip
                                  key={deposito}
                                  label={`${deposito} (${ajustesDeposito.length} ajustes)`}
                                  variant="outlined"
                                  color="primary"
                                />
                              );
                            })}
                          </Box>
                        </Grid>

                        {/* Timeline de ajustes */}
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                            ⏰ Cronología de Ajustes
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                            {[...ajustesArray]
                              .sort((a, b) => new Date(a.fechaAjuste).getTime() - new Date(b.fechaAjuste).getTime())
                              .map((ajuste) => (
                                <Box key={ajuste.id} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                                    {dayjs(ajuste.fechaAjuste).format('DD/MM HH:mm:ss')}
                                  </Typography>
                                  <Chip size="small" label={ajuste.diferencia > 0 ? `+${ajuste.diferencia}` : ajuste.diferencia} 
                                    color={ajuste.diferencia > 0 ? 'success' : ajuste.diferencia < 0 ? 'error' : 'default'}
                                    sx={{ minWidth: 60 }}
                                  />
                                  <Typography variant="body2">
                                    {ajuste.productoNombre} en {ajuste.depositoNombre}
                                  </Typography>
                                </Box>
                              ))
                            }
                          </Paper>
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          No hay ajustes registrados para mostrar estadísticas.
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </Box>
          );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalleDialog(false)} variant="outlined">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReconciliacionStockPage;
