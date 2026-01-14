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
import { stockDepositoApi } from '../../../api/services/stockDepositoApi';
import { usePermisos } from '../../../hooks/usePermisos';
import type {
  ReconciliacionStockDTO,
  ReconciliacionDetalladaDTO,
  ReconciliacionDiferenciasDTO,
  Deposito,
  Producto,
  StockDeposito,
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
  const { tienePermiso } = usePermisos();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // State management
  const [reconciliacionActiva, setReconciliacionActiva] = useState<ReconciliacionDetalladaDTO | null>(null);
  const [diferencias, setDiferencias] = useState<ReconciliacionDiferenciasDTO | null>(null);
  const [historial, setHistorial] = useState<ReconciliacionStockDTO[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stockDepositos, setStockDepositos] = useState<StockDeposito[]>([]);
  
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

  // Form states
  const [periodo, setPeriodo] = useState(dayjs().format('MMMM YYYY'));
  const [observaciones, setObservaciones] = useState('');
  const [ajusteForm, setAjusteForm] = useState({
    depositoId: 0,
    productoId: 0,
    cantidadContada: 0,
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

      const [activa, depositosData, productosData, stockData] = await Promise.all([
        reconciliacionApi.getActiva(),
        depositoApi.getAll(),
        productApi.getAll(),
        stockDepositoApi.getAll(),
      ]);

      setReconciliacionActiva(activa);
      // Handle case where API returns paginated response or array
      setDepositos(Array.isArray(depositosData) ? depositosData : (depositosData as any)?.content || []);
      setProductos(Array.isArray(productosData) ? productosData : (productosData as any)?.content || []);
      setStockDepositos(Array.isArray(stockData) ? stockData : (stockData as any)?.content || []);

      // If there's an active reconciliation, load differences
      if (activa && activa.id) {
        try {
          const difs = await reconciliacionApi.getDiferencias(activa.id);
          setDiferencias(difs);
        } catch (err) {
          console.warn('Could not load differences:', err);
        }
      } else {
        setDiferencias(null);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(`Error al cargar los datos: ${formatearErrorBackend(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistorial = useCallback(async () => {
    try {
      const response = await reconciliacionApi.getHistorial(0, 20);
      setHistorial(response.content);
    } catch (err: any) {
      console.error('Error loading historial:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadHistorial();
  }, [loadData, loadHistorial]);

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

  // Handlers
  const handleIniciarReconciliacion = async () => {
    try {
      setLoadingAction(true);
      const payload = {
        periodo,
        observaciones: observaciones || undefined,
      };
      console.log('Enviando payload iniciar:', payload);
      await reconciliacionApi.iniciar(payload);
      setSuccess('Reconciliación iniciada correctamente');
      setOpenIniciarDialog(false);
      setObservaciones('');
      await loadData();
      await loadHistorial();
    } catch (err: any) {
      console.error('Error iniciar reconciliación:', err.response?.data);
      setError(`Error al iniciar reconciliación: ${formatearErrorBackend(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRegistrarAjuste = async () => {
    if (!reconciliacionActiva) return;
    
    try {
      setLoadingAction(true);
      await reconciliacionApi.ajustarDeposito(reconciliacionActiva.id, {
        depositoId: ajusteForm.depositoId,
        productoId: ajusteForm.productoId,
        cantidadContada: ajusteForm.cantidadContada,
        observaciones: ajusteForm.observaciones || undefined,
      });
      setSuccess('Ajuste registrado correctamente');
      setOpenAjusteDialog(false);
      setAjusteForm({ depositoId: 0, productoId: 0, cantidadContada: 0, observaciones: '' });
      await loadData();
    } catch (err: any) {
      setError(`Error al registrar ajuste: ${formatearErrorBackend(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAprobar = async () => {
    if (!reconciliacionActiva) return;

    try {
      setLoadingAction(true);
      await reconciliacionApi.aprobar(reconciliacionActiva.id, {
        aplicarAjustes,
        observacionesAprobacion: observacionesAprobacion || undefined,
      });
      setSuccess('Reconciliación aprobada correctamente');
      setOpenAprobarDialog(false);
      setAplicarAjustes(true);
      setObservacionesAprobacion('');
      await loadData();
      await loadHistorial();
    } catch (err: any) {
      setError(`Error al aprobar reconciliación: ${formatearErrorBackend(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelar = async () => {
    if (!reconciliacionActiva) return;

    try {
      setLoadingAction(true);
      await reconciliacionApi.cancelar(reconciliacionActiva.id, {
        motivo: motivoCancelacion,
      });
      setSuccess('Reconciliación cancelada');
      setOpenCancelarDialog(false);
      setMotivoCancelacion('');
      await loadData();
      await loadHistorial();
    } catch (err: any) {
      setError(`Error al cancelar: ${formatearErrorBackend(err)}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerDetalle = async (reconciliacion: ReconciliacionStockDTO) => {
    try {
      const detalle = await reconciliacionApi.getById(reconciliacion.id);
      setSelectedReconciliacion(detalle);
      setOpenDetalleDialog(true);
    } catch (err: any) {
      setError(`Error al cargar detalle: ${formatearErrorBackend(err)}`);
    }
  };

  // Get stock from system for a product in a deposit
  const getStockSistema = (productoId: number, depositoId: number): number => {
    const stock = stockDepositos.find(
      s => s.productoId === productoId && s.depositoId === depositoId
    );
    return stock?.cantidad || 0;
  };

  // Filter differences
  const filteredDiferencias = diferencias?.diferencias?.filter(item =>
    item.productoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productoSku?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const steps = ['Iniciar Reconciliación', 'Registrar Recuentos', 'Revisar Diferencias', 'Aprobar y Aplicar'];
  const activeStep = reconciliacionActiva 
    ? (reconciliacionActiva.estado === 'EN_PROCESO' ? 1 : 
       reconciliacionActiva.estado === 'PENDIENTE_APROBACION' ? 2 : 3)
    : 0;

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
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadData(); loadHistorial(); }}
            disabled={loading}
          >
            Actualizar
          </Button>
          {!reconciliacionActiva && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenIniciarDialog(true)}
              disabled={!tienePermiso('LOGISTICA')}
            >
              Iniciar Reconciliación
            </Button>
          )}
        </Box>
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

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Reconciliación Activa" icon={<PlayArrowIcon />} iconPosition="start" />
        <Tab label="Historial" icon={<HistoryIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab 0: Active Reconciliation */}
      {tabValue === 0 && (
        <>
          {!reconciliacionActiva ? (
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <SyncIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No hay reconciliación activa
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Inicie una nueva reconciliación para comenzar el proceso de recuento de stock.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenIniciarDialog(true)}
                    disabled={!tienePermiso('LOGISTICA')}
                  >
                    Iniciar Reconciliación
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Active reconciliation info */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Reconciliación: {reconciliacionActiva.periodo}
                      </Typography>
                      <Box display="flex" gap={2} mb={1}>
                        <Chip
                          label={getEstadoLabel(reconciliacionActiva.estado)}
                          color={getEstadoColor(reconciliacionActiva.estado)}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Iniciada: {dayjs(reconciliacionActiva.fechaInicio).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                      </Box>
                      {reconciliacionActiva.observaciones && (
                        <Typography variant="body2" color="text.secondary">
                          {reconciliacionActiva.observaciones}
                        </Typography>
                      )}
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenAjusteDialog(true)}
                        disabled={reconciliacionActiva.estado !== 'EN_PROCESO'}
                      >
                        Registrar Ajuste
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<DoneAllIcon />}
                        onClick={() => setOpenAprobarDialog(true)}
                        disabled={reconciliacionActiva.estado === 'APROBADA' || reconciliacionActiva.estado === 'CANCELADA'}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => setOpenCancelarDialog(true)}
                        disabled={reconciliacionActiva.estado === 'APROBADA' || reconciliacionActiva.estado === 'CANCELADA'}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Summary cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Ajustes Registrados
                      </Typography>
                      <Typography variant="h4">
                        {reconciliacionActiva.ajustes?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: diferencias?.productosConDiferencia ? 'warning.light' : 'success.light' }}>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Productos con Diferencia
                      </Typography>
                      <Typography variant="h4" color={diferencias?.productosConDiferencia ? 'warning.main' : 'success.main'}>
                        {diferencias?.productosConDiferencia || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Productos Evaluados
                      </Typography>
                      <Typography variant="h4">
                        {diferencias?.totalProductosEvaluados || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Registered adjustments */}
              {reconciliacionActiva.ajustes && reconciliacionActiva.ajustes.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Ajustes Registrados
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Depósito</TableCell>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Stock Sistema</TableCell>
                            <TableCell align="right">Cantidad Contada</TableCell>
                            <TableCell align="right">Diferencia</TableCell>
                            <TableCell>Fecha</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reconciliacionActiva.ajustes.map((ajuste) => (
                            <TableRow key={ajuste.id}>
                              <TableCell>{ajuste.depositoNombre}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{ajuste.productoNombre}</Typography>
                                {ajuste.productoSku && (
                                  <Typography variant="caption" color="text.secondary">
                                    {ajuste.productoSku}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="right">{ajuste.stockSistema}</TableCell>
                              <TableCell align="right">{ajuste.cantidadContada}</TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={ajuste.diferencia}
                                  color={ajuste.diferencia === 0 ? 'success' : ajuste.diferencia > 0 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {dayjs(ajuste.fechaRegistro).format('DD/MM/YYYY HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Differences */}
              {diferencias && diferencias.diferencias && diferencias.diferencias.length > 0 && (
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Diferencias Detectadas
                      </Typography>
                      {diferencias.resumen && (
                        <Box display="flex" gap={2}>
                          <Chip
                            label={`Sobrante: ${diferencias.resumen.totalDiferenciaPositiva}`}
                            color="warning"
                            size="small"
                          />
                          <Chip
                            label={`Faltante: ${diferencias.resumen.totalDiferenciaNegativa}`}
                            color="error"
                            size="small"
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Search */}
                    <TextField
                      fullWidth
                      placeholder="Buscar por nombre o SKU..."
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

                    {/* Differences list */}
                    <List>
                      {filteredDiferencias.map((item) => (
                        <React.Fragment key={item.productoId}>
                          <ListItemButton
                            onClick={() => setExpandedProducto(
                              expandedProducto === item.productoId ? null : item.productoId
                            )}
                          >
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle2">
                                    {item.productoNombre}
                                  </Typography>
                                  {item.productoSku && (
                                    <Typography variant="caption" color="text.secondary">
                                      ({item.productoSku})
                                    </Typography>
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box display="flex" gap={2} mt={0.5}>
                                  <Typography variant="body2">
                                    Sistema: {item.stockGlobalSistema}
                                  </Typography>
                                  <Typography variant="body2">
                                    Contado: {item.stockGlobalContado}
                                  </Typography>
                                  <Chip
                                    label={`Diferencia: ${item.diferencia}`}
                                    color={item.diferencia > 0 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </Box>
                              }
                            />
                            {expandedProducto === item.productoId ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </ListItemButton>
                          <Collapse in={expandedProducto === item.productoId}>
                            <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Detalle por Depósito:
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Depósito</TableCell>
                                    <TableCell align="right">Stock Sistema</TableCell>
                                    <TableCell align="right">Contado</TableCell>
                                    <TableCell align="right">Diferencia</TableCell>
                                    <TableCell>Estado</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {item.detallesPorDeposito?.map((detalle) => (
                                    <TableRow key={detalle.depositoId}>
                                      <TableCell>{detalle.depositoNombre}</TableCell>
                                      <TableCell align="right">{detalle.stockSistema}</TableCell>
                                      <TableCell align="right">{detalle.cantidadContada}</TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          label={detalle.diferencia}
                                          color={detalle.diferencia === 0 ? 'success' : detalle.diferencia > 0 ? 'warning' : 'error'}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {detalle.ajusteRegistrado ? (
                                          <Chip label="Ajustado" color="success" size="small" />
                                        ) : (
                                          <Chip label="Pendiente" color="default" size="small" />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
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

      {/* Tab 1: History */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historial de Reconciliaciones
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mes/Año</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell>Fecha Fin</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell>Con Diferencia</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historial.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" py={2}>
                          No hay reconciliaciones en el historial
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    historial.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{rec.periodo}</TableCell>
                        <TableCell>{dayjs(rec.fechaInicio).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>
                          {rec.fechaFinalizacion ? dayjs(rec.fechaFinalizacion).format('DD/MM/YYYY') : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getEstadoLabel(rec.estado)}
                            color={getEstadoColor(rec.estado)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{rec.totalProductosRevisados || '-'}</TableCell>
                        <TableCell>{rec.totalDiferenciasEncontradas || '-'}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              onClick={() => handleVerDetalle(rec)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Iniciar Reconciliación */}
      <Dialog open={openIniciarDialog} onClose={() => setOpenIniciarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Iniciar Nueva Reconciliación</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Período"
              placeholder="Ej: Enero 2026"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Ingrese el período de la reconciliación (ej: Enero 2026)"
            />
            <TextField
              fullWidth
              label="Observaciones (opcional)"
              multiline
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
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
            {loadingAction ? <CircularProgress size={20} /> : 'Iniciar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Registrar Ajuste */}
      <Dialog open={openAjusteDialog} onClose={() => setOpenAjusteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Ajuste de Stock</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Depósito</InputLabel>
              <Select
                value={ajusteForm.depositoId}
                onChange={(e) => setAjusteForm({ ...ajusteForm, depositoId: Number(e.target.value) })}
                label="Depósito"
              >
                {depositos?.map((dep) => (
                  <MenuItem key={dep.id} value={dep.id}>
                    {dep.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Producto</InputLabel>
              <Select
                value={ajusteForm.productoId}
                onChange={(e) => setAjusteForm({ ...ajusteForm, productoId: Number(e.target.value) })}
                label="Producto"
              >
                {productos?.map((prod) => (
                  <MenuItem key={prod.id} value={prod.id}>
                    {prod.nombre} {prod.codigo ? `(${prod.codigo})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {ajusteForm.depositoId > 0 && ajusteForm.productoId > 0 && (
              <Alert severity="info">
                Stock actual en sistema: {getStockSistema(ajusteForm.productoId, ajusteForm.depositoId)}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Cantidad Contada"
              type="number"
              value={ajusteForm.cantidadContada}
              onChange={(e) => setAjusteForm({ ...ajusteForm, cantidadContada: Number(e.target.value) })}
              inputProps={{ min: 0 }}
            />
            <TextField
              fullWidth
              label="Observaciones (opcional)"
              multiline
              rows={2}
              value={ajusteForm.observaciones}
              onChange={(e) => setAjusteForm({ ...ajusteForm, observaciones: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAjusteDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleRegistrarAjuste}
            disabled={loadingAction || !ajusteForm.depositoId || !ajusteForm.productoId}
          >
            {loadingAction ? <CircularProgress size={20} /> : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Aprobar Reconciliación */}
      <Dialog open={openAprobarDialog} onClose={() => setOpenAprobarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aprobar Reconciliación</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Al aprobar la reconciliación, se aplicarán los ajustes de stock registrados al sistema.
              Esta acción no se puede deshacer.
            </Alert>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Aplicar Ajustes</InputLabel>
              <Select
                value={aplicarAjustes ? 'true' : 'false'}
                onChange={(e) => setAplicarAjustes(e.target.value === 'true')}
                label="Aplicar Ajustes"
              >
                <MenuItem value="true">Sí, aplicar todos los ajustes</MenuItem>
                <MenuItem value="false">No, solo marcar como aprobada</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Observaciones de Aprobación (opcional)"
              multiline
              rows={3}
              value={observacionesAprobacion}
              onChange={(e) => setObservacionesAprobacion(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAprobarDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAprobar}
            disabled={loadingAction}
          >
            {loadingAction ? <CircularProgress size={20} /> : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Cancelar Reconciliación */}
      <Dialog open={openCancelarDialog} onClose={() => setOpenCancelarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancelar Reconciliación</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Al cancelar, se descartarán todos los ajustes registrados.
            </Alert>
            <TextField
              fullWidth
              label="Motivo de Cancelación"
              multiline
              rows={3}
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelarDialog(false)}>Volver</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelar}
            disabled={loadingAction || !motivoCancelacion}
          >
            {loadingAction ? <CircularProgress size={20} /> : 'Cancelar Reconciliación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Ver Detalle */}
      <Dialog open={openDetalleDialog} onClose={() => setOpenDetalleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Detalle de Reconciliación: {selectedReconciliacion?.periodo}
            </Typography>
            <IconButton onClick={() => setOpenDetalleDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReconciliacion && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Estado</Typography>
                  <Chip
                    label={getEstadoLabel(selectedReconciliacion.estado)}
                    color={getEstadoColor(selectedReconciliacion.estado)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Fecha Inicio</Typography>
                  <Typography>{dayjs(selectedReconciliacion.fechaInicio).format('DD/MM/YYYY HH:mm')}</Typography>
                </Grid>
                {selectedReconciliacion.fechaFinalizacion && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Fecha Fin</Typography>
                    <Typography>{dayjs(selectedReconciliacion.fechaFinalizacion).format('DD/MM/YYYY HH:mm')}</Typography>
                  </Grid>
                )}
                {selectedReconciliacion.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Observaciones</Typography>
                    <Typography>{selectedReconciliacion.observaciones}</Typography>
                  </Grid>
                )}
              </Grid>

              {(selectedReconciliacion as ReconciliacionDetalladaDTO).ajustes && 
               (selectedReconciliacion as ReconciliacionDetalladaDTO).ajustes.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Ajustes Realizados
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Depósito</TableCell>
                          <TableCell>Producto</TableCell>
                          <TableCell align="right">Sistema</TableCell>
                          <TableCell align="right">Contado</TableCell>
                          <TableCell align="right">Diferencia</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedReconciliacion as ReconciliacionDetalladaDTO).ajustes.map((ajuste) => (
                          <TableRow key={ajuste.id}>
                            <TableCell>{ajuste.depositoNombre}</TableCell>
                            <TableCell>{ajuste.productoNombre}</TableCell>
                            <TableCell align="right">{ajuste.stockSistema}</TableCell>
                            <TableCell align="right">{ajuste.cantidadContada}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={ajuste.diferencia}
                                color={ajuste.diferencia === 0 ? 'success' : ajuste.diferencia > 0 ? 'warning' : 'error'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ReconciliacionStockPage;
