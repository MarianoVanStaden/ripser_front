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
  Save as SaveIcon,
} from '@mui/icons-material';
import { reconciliacionApi } from '../../../api/services/reconciliacionApi';
import LoadingOverlay from '../../common/LoadingOverlay';
import type {
  ReconciliacionStockDTO,
  ReconciliacionDetalladaDTO,
  ReconciliacionDiferenciasDTO,
  DiferenciaProductoDTO,
  DetalleDiferenciaDepositoDTO,
  EstadoReconciliacionType,
} from '../../../types';
import dayjs from 'dayjs';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

/**
 * Returns a MUI color token for a numeric difference.
 * 0 → success · negative → error · positive → warning
 */
const getDiferenciaChipColor = (diff: number): 'success' | 'error' | 'warning' => {
  if (diff === 0) return 'success';
  if (diff < 0) return 'error';
  return 'warning';
};

const getDiferenciaTextColor = (diff: number): string => {
  if (diff === 0) return 'success.main';
  if (diff < 0) return 'error.main';
  return 'warning.main';
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface InlineAjusteFormState {
  cantidadFisicaContada: number | '';
  observaciones: string;
}

/** Key: `${productoId}-${depositoId}` */
type AjusteKey = string;

// ─── Sub-component: InlineAjusteDeposito ─────────────────────────────────────

interface InlineAjusteDepositoProps {
  detalle: DetalleDiferenciaDepositoDTO;
  formState: InlineAjusteFormState;
  isLoading: boolean;
  onChangeValue: (field: keyof InlineAjusteFormState, value: number | '' | string) => void;
  onGuardar: () => void;
}

const InlineAjusteDeposito: React.FC<InlineAjusteDepositoProps> = ({
  detalle,
  formState,
  isLoading,
  onChangeValue,
  onGuardar,
}) => {
  const nuevoContado =
    formState.cantidadFisicaContada !== '' ? Number(formState.cantidadFisicaContada) : null;
  const nuevaDiferencia = nuevoContado !== null ? nuevoContado - detalle.stockSistema : null;

  return (
    <Box
      sx={{
        p: 1.5,
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        bgcolor: 'grey.50',
        mb: 1.5,
        '&:last-of-type': { mb: 0 },
      }}
    >
      <Grid container spacing={1.5} alignItems="flex-start">
        {/* Deposit info */}
        <Grid item xs={12} sm={3}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            {detalle.depositoNombre}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Sistema: <strong>{detalle.stockSistema}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Contado actual:{' '}
            <strong>{detalle.cantidadContada !== null ? detalle.cantidadContada : '—'}</strong>
          </Typography>
          {detalle.ajusteRegistrado && (
            <Chip label="Ajustado" color="success" size="small" variant="outlined" sx={{ mt: 0.5 }} />
          )}
        </Grid>

        {/* Nuevo contado */}
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            type="number"
            label="Nuevo contado"
            size="small"
            value={formState.cantidadFisicaContada}
            onChange={(e) =>
              onChangeValue(
                'cantidadFisicaContada',
                e.target.value === '' ? '' : parseInt(e.target.value, 10),
              )
            }
            inputProps={{ min: 0 }}
          />
          {nuevaDiferencia !== null && (
            <Typography
              variant="caption"
              sx={{ color: getDiferenciaTextColor(nuevaDiferencia), mt: 0.5, display: 'block' }}
            >
              Nueva diferencia:{' '}
              <strong>
                {nuevaDiferencia > 0 ? '+' : ''}
                {nuevaDiferencia}
              </strong>
            </Typography>
          )}
        </Grid>

        {/* Observaciones */}
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Observaciones"
            size="small"
            value={formState.observaciones}
            onChange={(e) => onChangeValue('observaciones', e.target.value)}
            placeholder="Opcional..."
          />
        </Grid>

        {/* Guardar */}
        <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'flex-start', pt: '4px !important' }}>
          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={onGuardar}
            disabled={isLoading || formState.cantidadFisicaContada === ''}
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
          >
            Guardar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── Sub-component: ProductoExpandidoContent ─────────────────────────────────

interface ProductoExpandidoContentProps {
  item: DiferenciaProductoDTO;
  isEditable: boolean;
  inlineAjusteValues: Record<AjusteKey, InlineAjusteFormState>;
  loadingAjuste: Record<AjusteKey, boolean>;
  onChangeInlineValue: (
    key: AjusteKey,
    field: keyof InlineAjusteFormState,
    value: number | '' | string,
  ) => void;
  onGuardarAjuste: (productoId: number, depositoId: number) => void;
}

const ProductoExpandidoContent: React.FC<ProductoExpandidoContentProps> = ({
  item,
  isEditable,
  inlineAjusteValues,
  loadingAjuste,
  onChangeInlineValue,
  onGuardarAjuste,
}) => (
  <Box
    sx={{
      pl: 2,
      pr: 2,
      pb: 2,
      pt: 1,
      bgcolor: 'background.paper',
      borderRadius: 1,
      mb: 1,
    }}
  >
    {/* Context header */}
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
      <Typography variant="subtitle2" fontWeight="bold">
        {item.productoNombre}
      </Typography>
      {item.productoCodigo && (
        <Chip label={item.productoCodigo} size="small" variant="outlined" />
      )}
      <Chip
        label={`Diferencia actual: ${item.diferencia > 0 ? '+' : ''}${item.diferencia}`}
        color={getDiferenciaChipColor(item.diferencia)}
        size="small"
      />
    </Box>

    {/* Deposit detail table */}
    <Typography variant="subtitle2" gutterBottom color="text.secondary">
      Detalle por Depósito:
    </Typography>
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
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
                  {detalle.cantidadContada !== null ? detalle.cantidadContada : '—'}
                </TableCell>
                <TableCell align="right">
                  {detalle.diferencia !== null ? (
                    <Chip
                      label={detalle.diferencia > 0 ? `+${detalle.diferencia}` : detalle.diferencia}
                      color={getDiferenciaChipColor(detalle.diferencia)}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    '—'
                  )}
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

    {/* Inline adjustment form — only in editable states */}
    {isEditable && item.detallesPorDeposito && item.detallesPorDeposito.length > 0 && (
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'primary.light',
          borderRadius: 1,
          p: 2,
          bgcolor: 'rgba(25, 118, 210, 0.03)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EditIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" color="primary">
            Registrar ajuste manual
          </Typography>
        </Box>

        {item.detallesPorDeposito.map((detalle) => {
          const key: AjusteKey = `${item.productoId}-${detalle.depositoId}`;
          const formState: InlineAjusteFormState = inlineAjusteValues[key] ?? {
            cantidadFisicaContada: detalle.cantidadContada ?? detalle.stockSistema,
            observaciones: '',
          };

          return (
            <InlineAjusteDeposito
              key={detalle.depositoId}
              detalle={detalle}
              formState={formState}
              isLoading={loadingAjuste[key] ?? false}
              onChangeValue={(field, value) => onChangeInlineValue(key, field, value)}
              onGuardar={() => onGuardarAjuste(item.productoId, detalle.depositoId)}
            />
          );
        })}
      </Box>
    )}
  </Box>
);

// ─── Main page component ──────────────────────────────────────────────────────

const ReconciliacionStockPage: React.FC = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Data state
  const [reconciliacionActiva, setReconciliacionActiva] = useState<ReconciliacionDetalladaDTO | null>(null);
  const [diferencias, setDiferencias] = useState<ReconciliacionDiferenciasDTO | null>(null);
  const [historial, setHistorial] = useState<ReconciliacionStockDTO[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states (Iniciar, Aprobar, Cancelar, Ver Detalle)
  const [openIniciarDialog, setOpenIniciarDialog] = useState(false);
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
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [aplicarAjustes, setAplicarAjustes] = useState(true);
  const [observacionesAprobacion, setObservacionesAprobacion] = useState('');

  // Inline adjustment state
  const [inlineAjusteValues, setInlineAjusteValues] = useState<Record<AjusteKey, InlineAjusteFormState>>({});
  const [loadingAjuste, setLoadingAjuste] = useState<Record<AjusteKey, boolean>>({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProducto, setExpandedProducto] = useState<number | null>(null);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const isEditable =
    reconciliacionActiva?.estado === 'EN_PROCESO' ||
    reconciliacionActiva?.estado === 'PENDIENTE_APROBACION';

  // ─── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        const activa = await reconciliacionApi.getActiva();
        setReconciliacionActiva(activa);

        if (activa?.id) {
          try {
            const difs = await reconciliacionApi.getDiferencias(activa.id);
            setDiferencias(difs);
          } catch (err) {
            console.error('Error loading diferencias:', err);
          }
        }
      } catch {
        setReconciliacionActiva(null);
      }

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleIniciarReconciliacion = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      await reconciliacionApi.iniciar({ periodo, observaciones: observaciones || undefined });
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

  const handleAprobarReconciliacion = async () => {
    if (!reconciliacionActiva?.id) return;
    try {
      setLoadingAction(true);
      setError(null);
      const resultado = await reconciliacionApi.aprobar(reconciliacionActiva.id, {
        aplicarAjustes,
        observaciones: observacionesAprobacion || undefined,
      });
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
      await reconciliacionApi.cancelar(reconciliacionActiva.id, { motivo: motivoCancelacion });
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
    try {
      setLoadingDetalle(true);
      const detalle = await reconciliacionApi.getById(rec.id);
      setSelectedReconciliacionDetalle(detalle);
    } catch (err) {
      console.error('Error cargando detalle:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  /** Toggle product row expansion and initialize inline form values on open. */
  const handleToggleProducto = (item: DiferenciaProductoDTO) => {
    const newExpanded = expandedProducto === item.productoId ? null : item.productoId;
    setExpandedProducto(newExpanded);

    if (newExpanded !== null) {
      setInlineAjusteValues((prev) => {
        const next = { ...prev };
        item.detallesPorDeposito.forEach((detalle) => {
          const key: AjusteKey = `${item.productoId}-${detalle.depositoId}`;
          next[key] = {
            cantidadFisicaContada: detalle.cantidadContada ?? detalle.stockSistema,
            observaciones: '',
          };
        });
        return next;
      });
    }
  };

  const handleChangeInlineValue = (
    key: AjusteKey,
    field: keyof InlineAjusteFormState,
    value: number | '' | string,
  ) => {
    setInlineAjusteValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleGuardarAjusteInline = async (productoId: number, depositoId: number) => {
    if (!reconciliacionActiva?.id) return;
    const key: AjusteKey = `${productoId}-${depositoId}`;
    const formState = inlineAjusteValues[key];
    if (!formState || formState.cantidadFisicaContada === '') return;

    try {
      setLoadingAjuste((prev) => ({ ...prev, [key]: true }));
      setError(null);

      await reconciliacionApi.ajustarDeposito(reconciliacionActiva.id, {
        productoId,
        depositoId,
        cantidadFisicaContada: formState.cantidadFisicaContada as number,
        observaciones: formState.observaciones || undefined,
      });

      setSuccess('Ajuste guardado correctamente');

      // Refresh differences and re-initialize form values for this product
      const difs = await reconciliacionApi.getDiferencias(reconciliacionActiva.id);
      setDiferencias(difs);

      const updatedItem = difs.diferencias.find((d) => d.productoId === productoId);
      if (updatedItem) {
        setInlineAjusteValues((prev) => {
          const next = { ...prev };
          updatedItem.detallesPorDeposito.forEach((detalle) => {
            const k: AjusteKey = `${productoId}-${detalle.depositoId}`;
            next[k] = {
              cantidadFisicaContada: detalle.cantidadContada ?? detalle.stockSistema,
              observaciones: '',
            };
          });
          return next;
        });
      }
    } catch (err: any) {
      setError(formatearErrorBackend(err));
    } finally {
      setLoadingAjuste((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ─── Derived lists ───────────────────────────────────────────────────────────

  const filteredDiferencias =
    diferencias?.diferencias?.filter((item) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.productoNombre.toLowerCase().includes(term) ||
        (item.productoCodigo && item.productoCodigo.toLowerCase().includes(term))
      );
    }) || [];

  const getStepIndex = (estado?: EstadoReconciliacionType): number => {
    switch (estado) {
      case 'EN_PROCESO': return 1;
      case 'PENDIENTE_APROBACION': return 2;
      case 'APROBADA': return 3;
      default: return 0;
    }
  };

  const steps = ['Sin iniciar', 'En proceso', 'Revisión', 'Aprobada'];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <LoadingOverlay open={loading} message="Cargando reconciliaciones..." />
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            alignItems: 'stretch',
          }}
        >
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

      {/* ─── Tab 0: Active Reconciliation ─────────────────────────────────────── */}
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
                    Inicia una nueva reconciliación para comparar el stock del sistema con el
                    inventario físico
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
                  <Stepper
                    activeStep={getStepIndex(reconciliacionActiva.estado)}
                    alternativeLabel
                  >
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
                        {reconciliacionActiva.codigoReconciliacion ||
                          `Reconciliación #${reconciliacionActiva.id}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Período: {reconciliacionActiva.periodo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Iniciada:{' '}
                        {dayjs(reconciliacionActiva.fechaInicio).format('DD/MM/YYYY HH:mm')}
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
                      {isEditable && (
                        <>
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

              {/* Summary Cards */}
              {diferencias && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.300' }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Productos
                        </Typography>
                        <Typography variant="h4">{diferencias.totalProductos}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        bgcolor: 'action.hover',
                        border: '1px solid',
                        borderColor: 'primary.light',
                      }}
                    >
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
                    <Card
                      sx={{
                        bgcolor: 'rgba(237, 108, 2, 0.08)',
                        border: '1px solid',
                        borderColor: 'warning.light',
                      }}
                    >
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
                    <Card
                      sx={{
                        bgcolor: 'rgba(211, 47, 47, 0.08)',
                        border: '1px solid',
                        borderColor: 'error.light',
                      }}
                    >
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
                      <Typography variant="h6">Diferencias Detectadas</Typography>
                    </Box>

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

                    <List disablePadding>
                      {filteredDiferencias.map((item) => (
                        <React.Fragment key={item.productoId}>
                          <ListItemButton
                            onClick={() => handleToggleProducto(item)}
                            sx={{
                              bgcolor:
                                item.tipoDiferencia === 'FALTANTE'
                                  ? 'rgba(211, 47, 47, 0.04)'
                                  : item.tipoDiferencia === 'SOBRANTE'
                                  ? 'rgba(237, 108, 2, 0.04)'
                                  : 'rgba(46, 125, 50, 0.04)',
                              '&:hover': {
                                bgcolor:
                                  item.tipoDiferencia === 'FALTANTE'
                                    ? 'rgba(211, 47, 47, 0.08)'
                                    : item.tipoDiferencia === 'SOBRANTE'
                                    ? 'rgba(237, 108, 2, 0.08)'
                                    : 'rgba(46, 125, 50, 0.08)',
                              },
                              borderRadius: 1,
                              mb: 0.5,
                              border: '1px solid',
                              borderColor:
                                item.tipoDiferencia === 'FALTANTE'
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
                                    color={getDiferenciaChipColor(item.diferencia)}
                                    size="small"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={
                                      item.tipoDiferencia === 'FALTANTE'
                                        ? 'Faltante'
                                        : item.tipoDiferencia === 'SOBRANTE'
                                        ? 'Sobrante'
                                        : 'OK'
                                    }
                                    color={getDiferenciaChipColor(item.diferencia)}
                                    size="small"
                                  />
                                </Box>
                              }
                            />
                            {expandedProducto === item.productoId ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </ListItemButton>

                          <Collapse in={expandedProducto === item.productoId}>
                            <ProductoExpandidoContent
                              item={item}
                              isEditable={isEditable ?? false}
                              inlineAjusteValues={inlineAjusteValues}
                              loadingAjuste={loadingAjuste}
                              onChangeInlineValue={handleChangeInlineValue}
                              onGuardarAjuste={handleGuardarAjusteInline}
                            />
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

      {/* ─── Tab 1: History ───────────────────────────────────────────────────── */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historial de Reconciliaciones
            </Typography>
            {historial.length === 0 ? (
              <Box textAlign="center" py={4}>
                <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography color="text.secondary">No hay reconciliaciones anteriores</Typography>
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
                        <TableCell>
                          {dayjs(rec.fechaInicio).format('DD/MM/YYYY')}
                        </TableCell>
                        <TableCell>
                          {rec.fechaFinalizacion
                            ? dayjs(rec.fechaFinalizacion).format('DD/MM/YYYY')
                            : '—'}
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

      {/* ─── Dialog: Iniciar Reconciliación ──────────────────────────────────── */}
      <Dialog
        open={openIniciarDialog}
        onClose={() => setOpenIniciarDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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

      {/* ─── Dialog: Aprobar Reconciliación ──────────────────────────────────── */}
      <Dialog
        open={openAprobarDialog}
        onClose={() => setOpenAprobarDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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

      {/* ─── Dialog: Cancelar Reconciliación ─────────────────────────────────── */}
      <Dialog
        open={openCancelarDialog}
        onClose={() => setOpenCancelarDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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
              Esta acción cancelará la reconciliación actual. Los ajustes registrados no se
              aplicarán.
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

      {/* ─── Dialog: Ver Detalle (historial) ─────────────────────────────────── */}
      <Dialog
        open={openDetalleDialog}
        onClose={() => setOpenDetalleDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <HistoryIcon color="primary" />
              <Typography variant="h6">
                Detalle de Reconciliación{' '}
                {selectedReconciliacion?.codigoReconciliacion || `#${selectedReconciliacion?.id}`}
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
          {selectedReconciliacion &&
            (() => {
              const ajustesArray =
                selectedReconciliacionDetalle?.ajustesDepositos ||
                selectedReconciliacionDetalle?.ajustes ||
                [];

              return (
                <Box>
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
                        <Grid item xs={12}>
                          <Typography
                            variant="subtitle2"
                            color="primary"
                            gutterBottom
                            sx={{ fontWeight: 'bold' }}
                          >
                            📋 Datos de la Reconciliación
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Código
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedReconciliacion.codigoReconciliacion ||
                              `#${selectedReconciliacion.id}`}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Período
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedReconciliacion.periodo}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Fecha Inicio
                          </Typography>
                          <Typography variant="body1">
                            {dayjs(selectedReconciliacion.fechaInicio).format('DD/MM/YYYY HH:mm')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="body2" color="text.secondary">
                            Fecha Finalización
                          </Typography>
                          <Typography variant="body1">
                            {selectedReconciliacion.fechaFinalizacion ? (
                              dayjs(selectedReconciliacion.fechaFinalizacion).format(
                                'DD/MM/YYYY HH:mm',
                              )
                            ) : (
                              <Chip label="En curso" size="small" color="info" variant="outlined" />
                            )}
                          </Typography>
                        </Grid>

                        {(selectedReconciliacionDetalle?.usuarioInicioNombre ||
                          selectedReconciliacionDetalle?.usuarioAprobacionNombre) && (
                          <>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                                sx={{ fontWeight: 'bold' }}
                              >
                                👤 Auditoría de Usuarios
                              </Typography>
                            </Grid>
                            {selectedReconciliacionDetalle?.usuarioInicioNombre && (
                              <Grid item xs={6} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  Iniciada por
                                </Typography>
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
                                <Typography variant="body2" color="text.secondary">
                                  Aprobada por
                                </Typography>
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

                        {selectedReconciliacion.observaciones && (
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              gutterBottom
                              sx={{ fontWeight: 'bold' }}
                            >
                              📝 Observaciones
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="body2">
                                {selectedReconciliacion.observaciones}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}

                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography
                            variant="subtitle2"
                            color="primary"
                            gutterBottom
                            sx={{ fontWeight: 'bold' }}
                          >
                            📊 Resumen Rápido
                          </Typography>
                          <Box display="flex" gap={2} flexWrap="wrap">
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
                              <Typography variant="h4" color="primary">
                                {selectedReconciliacion.totalProductosRevisados ?? '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Productos Revisados
                              </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
                              <Typography variant="h4" color="warning.main">
                                {selectedReconciliacion.totalDiferenciasEncontradas ?? '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Diferencias Encontradas
                              </Typography>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 2, minWidth: 140, textAlign: 'center' }}>
                              <Typography variant="h4" color="success.main">
                                {selectedReconciliacion.totalAjustesAplicados ??
                                  ajustesArray.length ??
                                  '—'}
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
                                      label={
                                        ajuste.diferencia > 0
                                          ? `+${ajuste.diferencia}`
                                          : ajuste.diferencia
                                      }
                                      size="small"
                                      color={getDiferenciaChipColor(ajuste.diferencia)}
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {ajuste.usuarioAjusteNombre || '—'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {ajuste.fechaAjuste
                                        ? dayjs(ajuste.fechaAjuste).format('DD/MM/YYYY HH:mm')
                                        : '—'}
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
                        {ajustesArray.length > 0 ? (
                          <>
                            <Grid item xs={12}>
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                                sx={{ fontWeight: 'bold' }}
                              >
                                📈 Análisis de Ajustes
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="h5" color="success.main">
                                  {ajustesArray.filter((a) => a.diferencia > 0).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Ajustes Positivos (Sobrantes)
                                </Typography>
                                <Typography variant="caption" color="success.main">
                                  Total: +
                                  {ajustesArray
                                    .filter((a) => a.diferencia > 0)
                                    .reduce((sum, a) => sum + a.diferencia, 0)}{' '}
                                  unidades
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="h5" color="error.main">
                                  {ajustesArray.filter((a) => a.diferencia < 0).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Ajustes Negativos (Faltantes)
                                </Typography>
                                <Typography variant="caption" color="error.main">
                                  Total:{' '}
                                  {ajustesArray
                                    .filter((a) => a.diferencia < 0)
                                    .reduce((sum, a) => sum + a.diferencia, 0)}{' '}
                                  unidades
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="h5" color="info.main">
                                  {ajustesArray.filter((a) => a.diferencia === 0).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Sin Diferencia
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Verificaciones correctas
                                </Typography>
                              </Paper>
                            </Grid>

                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                                sx={{ fontWeight: 'bold' }}
                              >
                                🏭 Depósitos Afectados
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                {[...new Set(ajustesArray.map((a) => a.depositoNombre))].map(
                                  (deposito) => {
                                    const count = ajustesArray.filter(
                                      (a) => a.depositoNombre === deposito,
                                    ).length;
                                    return (
                                      <Chip
                                        key={deposito}
                                        label={`${deposito} (${count} ajustes)`}
                                        variant="outlined"
                                        color="primary"
                                      />
                                    );
                                  },
                                )}
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                gutterBottom
                                sx={{ fontWeight: 'bold' }}
                              >
                                ⏰ Cronología de Ajustes
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}
                              >
                                {[...ajustesArray]
                                  .sort(
                                    (a, b) =>
                                      new Date(a.fechaAjuste).getTime() -
                                      new Date(b.fechaAjuste).getTime(),
                                  )
                                  .map((ajuste) => (
                                    <Box
                                      key={ajuste.id}
                                      sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ minWidth: 120 }}
                                      >
                                        {dayjs(ajuste.fechaAjuste).format('DD/MM HH:mm:ss')}
                                      </Typography>
                                      <Chip
                                        size="small"
                                        label={
                                          ajuste.diferencia > 0
                                            ? `+${ajuste.diferencia}`
                                            : ajuste.diferencia
                                        }
                                        color={getDiferenciaChipColor(ajuste.diferencia)}
                                        sx={{ minWidth: 60 }}
                                      />
                                      <Typography variant="body2">
                                        {ajuste.productoNombre} en {ajuste.depositoNombre}
                                      </Typography>
                                    </Box>
                                  ))}
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
          <Button onClick={() => setOpenDetalleDialog(false)} variant="outlined">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReconciliacionStockPage;
