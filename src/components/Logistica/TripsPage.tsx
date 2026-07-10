import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  TablePagination,
  Stack,
  Divider,
  Fab,
  SwipeableDrawer,
  Collapse,
  Badge,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon,
  Route as RouteIcon,
  Person as DriverIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ErrorOutline as ErrorOutlineIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import type { Viaje, Vehiculo, Empleado, EntregaViaje, EstadoViaje, DocumentoComercial, Cliente, OrdenServicio, ResumenFinancieroViaje } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';
import ConfirmDialog from '../common/ConfirmDialog';
import RendicionDialog from './RendicionDialog';
import PreViajeChecklistDialog from './PreViajeChecklistDialog';
import { usePermisos } from '../../hooks/usePermisos';
import { useParametroSistema, parseIntOr } from '../../hooks/useParametroSistema';
import { viajeApi } from '../../api/services/viajeApi';
import { vehiculoApi } from '../../api/services/vehiculoApi';
import { employeeApi } from '../../api/services/employeeApi';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import { documentoApi } from '../../api/services/documentoApi';
import { clienteApi } from '../../api/services/clienteApi';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import type { EquipoFabricadoDTO } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  useResponsive,
  tipoParadaLabel,
  entregaEstimadaInfo as entregaEstimadaInfoBase,
  renderEntregaEstimada as renderEntregaEstimadaBase,
} from './tripWizard/tripWizardShared';
import { BottomSheet } from './tripWizard/TripBottomSheet';
import { useTripWizard } from './tripWizard/useTripWizard';
import TripWizardDialog from './tripWizard/TripWizardDialog';

// ── Helper ────────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  n != null ? `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

// ── Componentes de Resumen de Cobros ─────────────────────────────────────────

const COBRO_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  COBRADO: 'success',
  COBRADO_PARCIAL: 'warning',
  COBRO_EXCEDENTE: 'warning',
  SIN_COBRO: 'default',
  PENDIENTE: 'error',
};
const COBRO_LABEL_MAP: Record<string, string> = {
  COBRADO: 'Cobrado',
  COBRADO_PARCIAL: 'Parcial',
  COBRO_EXCEDENTE: 'Excedente',
  SIN_COBRO: 'Sin cobro',
  PENDIENTE: 'Pendiente',
};

interface ResumenCobrosProps {
  resumen: ResumenFinancieroViaje | null | undefined;
  estadoViaje?: string;
  puedeRendir?: boolean;
  onRendir?: () => void;
}

/** Versión mobile: lista compacta de tarjetas */
const ResumenCobrosMobile: React.FC<ResumenCobrosProps> = ({ resumen, estadoViaje, puedeRendir, onRendir }) => {
  if (resumen === undefined) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body2" color="text.secondary">Cargando cobros…</Typography>
      </Box>
    );
  }
  if (resumen === null || resumen.cantidadEntregas === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
        Sin entregas con información financiera
      </Typography>
    );
  }

  const totalCobrado = resumen.totalCobradoConductor ?? 0;
  const hayCobrosPendientes = puedeRendir
    && (estadoViaje === 'COMPLETADO' || estadoViaje === 'PENDIENTE_RENDICION')
    && totalCobrado > 0;

  return (
    <Stack spacing={1.5}>
      {/* Totales del viaje */}
      <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.main' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <WalletIcon color="success" fontSize="small" />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              RESUMEN DEL VIAJE
            </Typography>
          </Box>
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">A recaudar</Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                {fmt(resumen.totalEntregasIniciales)}
              </Typography>
            </Box>
            {totalCobrado > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Cobrado</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {fmt(totalCobrado)}
                </Typography>
              </Box>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {resumen.cantidadEntregas} entregas
          </Typography>
        </CardContent>
      </Card>

      {/* Detalle por entrega */}
      {resumen.entregas.map((ef, i) => (
        <Card key={ef.entregaId} variant="outlined">
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1} mr={1}>
                <Typography variant="subtitle2">
                  Entrega #{i + 1}
                  {ef.clienteNombre ? ` — ${ef.clienteNombre}` : ''}
                </Typography>
                {ef.numeroDocumento && (
                  <Typography variant="caption" color="text.secondary">
                    {ef.numeroDocumento}
                    {ef.tieneFinanciacion && (
                      <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 0.5 }}>
                        · Financiado ({ef.cantidadCuotas} × {fmt(ef.montoCuota)})
                      </Typography>
                    )}
                  </Typography>
                )}
                {ef.direccionEntrega && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {ef.direccionEntrega}
                  </Typography>
                )}
              </Box>
              <Box textAlign="right">
                {/* A cobrar */}
                <Typography variant="caption" color="text.secondary" display="block">A cobrar</Typography>
                <Typography variant="body2" fontWeight={700} color={ef.montoEntregaInicial != null ? 'success.dark' : 'text.disabled'}>
                  {fmt(ef.montoEntregaInicial)}
                </Typography>
                {/* Cobrado */}
                {ef.montoCobrado != null && (
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Cobrado</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {fmt(ef.montoCobrado)}
                    </Typography>
                  </>
                )}
                {/* Estado cobro */}
                {ef.estadoCobro ? (
                  <Chip
                    label={COBRO_LABEL_MAP[ef.estadoCobro] ?? ef.estadoCobro}
                    color={COBRO_COLOR_MAP[ef.estadoCobro] ?? 'default'}
                    size="small"
                    sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                  />
                ) : (
                  <Chip
                    label={ef.estado === 'ENTREGADA' ? 'Entregada' : ef.estado === 'NO_ENTREGADA' ? 'No entregada' : 'Pendiente'}
                    size="small"
                    color={ef.estado === 'ENTREGADA' ? 'success' : ef.estado === 'NO_ENTREGADA' ? 'error' : 'warning'}
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Botón rendir */}
      {hayCobrosPendientes && (
        <Button
          variant="contained"
          color="success"
          fullWidth
          startIcon={<AttachMoneyIcon />}
          onClick={onRendir}
          sx={{ mt: 1 }}
        >
          Rendir cobros ({fmt(totalCobrado)})
        </Button>
      )}
    </Stack>
  );
};

/** Versión desktop: tabla compacta dentro del drawer */
const ResumenCobrosDesktop: React.FC<ResumenCobrosProps> = ({ resumen, estadoViaje, puedeRendir, onRendir }) => {
  if (resumen === undefined) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AttachMoneyIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Cobros del viaje</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Cargando…</Typography>
        </CardContent>
      </Card>
    );
  }
  if (resumen === null || resumen.cantidadEntregas === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AttachMoneyIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Cobros del viaje</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Sin información financiera disponible
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const totalCobrado = resumen.totalCobradoConductor ?? 0;
  const hayCobrosPendientes = puedeRendir
    && (estadoViaje === 'COMPLETADO' || estadoViaje === 'PENDIENTE_RENDICION')
    && totalCobrado > 0;

  return (
    <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
      <CardContent>
        {/* Header con totales */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <WalletIcon color="success" />
            <Typography variant="subtitle1" fontWeight={700}>
              Cobros del viaje
            </Typography>
          </Box>
          <Stack direction="row" spacing={3} alignItems="flex-end">
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" display="block">
                A recaudar
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                {fmt(resumen.totalEntregasIniciales)}
              </Typography>
            </Box>
            {totalCobrado > 0 && (
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Cobrado por conductor
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {fmt(totalCobrado)}
                </Typography>
              </Box>
            )}
            {hayCobrosPendientes && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<AttachMoneyIcon />}
                onClick={onRendir}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Rendir cobros
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Tabla de entregas */}
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead">
            <Box component="tr">
              {['#', 'Cliente', 'Documento', 'A cobrar', 'Cobrado', 'Estado cobro'].map(h => (
                <Box
                  key={h}
                  component="th"
                  sx={{
                    textAlign: (h === 'A cobrar' || h === 'Cobrado') ? 'right' : 'left',
                    py: 0.5,
                    px: 1,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {resumen.entregas.map((ef, i) => (
              <Box
                key={ef.entregaId}
                component="tr"
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: i < resumen.entregas.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box component="td" sx={{ py: 1, px: 1, fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  #{i + 1}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>
                  {ef.clienteNombre ?? '—'}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>
                  <Typography variant="caption" display="block">{ef.numeroDocumento ?? '—'}</Typography>
                  {ef.tieneFinanciacion && ef.cantidadCuotas && (
                    <Typography variant="caption" color="primary.main">
                      {ef.cantidadCuotas} × {fmt(ef.montoCuota)}
                    </Typography>
                  )}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={ef.montoEntregaInicial != null ? 'success.dark' : 'text.disabled'}
                  >
                    {fmt(ef.montoEntregaInicial)}
                  </Typography>
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {ef.montoCobrado != null ? (
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {fmt(ef.montoCobrado)}
                      </Typography>
                      {ef.diferenciaCobro != null && ef.diferenciaCobro !== 0 && (
                        <Typography
                          variant="caption"
                          color={ef.diferenciaCobro > 0 ? 'warning.main' : 'error.main'}
                        >
                          {ef.diferenciaCobro > 0 ? '+' : ''}{fmt(ef.diferenciaCobro)}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1 }}>
                  {ef.estadoCobro ? (
                    <Chip
                      label={COBRO_LABEL_MAP[ef.estadoCobro] ?? ef.estadoCobro}
                      color={COBRO_COLOR_MAP[ef.estadoCobro] ?? 'default'}
                      size="small"
                    />
                  ) : (
                    <Chip
                      label={ef.estado === 'ENTREGADA' ? 'Entregada' : ef.estado === 'NO_ENTREGADA' ? 'No entregada' : 'Pendiente'}
                      size="small"
                      color={ef.estado === 'ENTREGADA' ? 'success' : ef.estado === 'NO_ENTREGADA' ? 'error' : 'warning'}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
          {/* Footer con totales */}
          <Box component="tfoot">
            <Box component="tr" sx={{ bgcolor: 'action.hover' }}>
              <Box component="td" colSpan={3} sx={{ py: 1, px: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                Total viaje ({resumen.cantidadEntregas} entregas)
              </Box>
              <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right' }}>
                <Typography variant="body1" fontWeight={700} color="success.dark">
                  {fmt(resumen.totalEntregasIniciales)}
                </Typography>
              </Box>
              <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right' }}>
                {totalCobrado > 0 && (
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {fmt(totalCobrado)}
                  </Typography>
                )}
              </Box>
              <Box component="td" />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const TripsPage2: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const { tieneRol } = usePermisos();
  const { user } = useAuth();
  const esConductor = tieneRol('CONDUCTOR');
  const esLogistico = tieneRol('LOGISTICO');

  // Devuelve true si el usuario actual está asignado al viaje como conductor o acompañante.
  // Usado para decidir si LOGISTICO puede ver la recaudación de un viaje específico.
  const esAsignadoAlViaje = (trip: Viaje): boolean => {
    if (!user?.empleadoId) return false;
    return user.empleadoId === trip.conductorId || user.empleadoId === trip.acompananteId;
  };

  // CONDUCTOR: siempre puede rendir sus propios viajes (el backend filtra la lista).
  // LOGISTICO: puede rendir solo si está asignado al viaje — se evalúa por viaje en el render.
  // Otros roles (admin, transporte, etc.): siempre pueden rendir.
  const puedeRendirViaje = (trip: Viaje): boolean => {
    if (esConductor) return true;
    if (esLogistico) return esAsignadoAlViaje(trip);
    return true;
  };

  // Días estimados de entrega (parámetro global editable en /admin/settings).
  // Fecha estimada = fecha de emisión de la factura + estos días.
  const { value: diasEntregaEstimada } = useParametroSistema('DIAS_ENTREGA_ESTIMADA', 25, parseIntOr(25));

  const [trips, setTrips] = useState<Viaje[]>([]);
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [drivers, setDrivers] = useState<Empleado[]>([]);
  const [deliveries, setDeliveries] = useState<EntregaViaje[]>([]);
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Viaje | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Viaje | null>(null);
  const [deliveryDetailsMap, setDeliveryDetailsMap] = useState<Record<number, { equipos: EquipoFabricadoDTO[] }>>({});
  /** Resumen financiero cacheado por viajeId */
  const [resumenFinancieroMap, setResumenFinancieroMap] = useState<Record<number, ResumenFinancieroViaje | null>>({});

  // Rendición de viaje
  const [rendicionDialogViaje, setRendicionDialogViaje] = useState<Viaje | null>(null);
  const [cerrandoViajeId, setCerrandoViajeId] = useState<number | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoViaje>('all');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Expanded cards state for mobile
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Details tab state
  const [detailsTab, setDetailsTab] = useState(0);

  // Modal de error al cambiar estado del viaje (e.g. equipo no COMPLETADO)
  const [changeEstadoErrorDialog, setChangeEstadoErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: '', message: '' });

  // Preflight: para cada viaje PLANIFICADO, marca si tiene equipos en estado != COMPLETADO
  const [tripsConEquiposPendientes, setTripsConEquiposPendientes] = useState<Set<number>>(new Set());

  // Checklist de pre-viaje: obligatorio antes de iniciar. Al completarse, se inicia el viaje.
  const [checklistTrip, setChecklistTrip] = useState<Viaje | null>(null);

  // Wizard de creación/edición de viajes: todo el estado, catálogos y lógica
  // del formulario viven en useTripWizard; TripsPage sólo controla la apertura
  // del diálogo y le pasa sus catálogos ya cargados para evitar refetch.
  const wizard = useTripWizard({
    onSaved: async (_viaje, entregaErrors) => {
      await loadData();
      setDialogOpen(false);
      if (entregaErrors.length > 0) {
        setError(`Viaje guardado, pero hubo errores en algunas entregas:\n${entregaErrors.join('\n')}`);
      }
    },
    onError: (msg) => setError(msg),
    catalogos: { vehiculos: vehicles, drivers, facturas, ordenes, clientes, deliveries, trips },
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const computePreflight = async () => {
      const planificados = trips.filter((t) => t.estado === 'PLANIFICADO');
      if (planificados.length === 0) {
        setTripsConEquiposPendientes(new Set());
        return;
      }
      const pendientes = new Set<number>();
      for (const trip of planificados) {
        const tripEntregas = deliveries.filter((d) => d.viajeId === trip.id);
        if (tripEntregas.length === 0) continue;
        let tieneIncompleto = false;
        for (const entrega of tripEntregas) {
          try {
            const detalles = await entregaViajeApi.getDetalles(entrega.id);
            const lista: Array<{ equipo?: EquipoFabricadoDTO }> = Array.isArray(detalles)
              ? detalles
              : (detalles?.detalles ?? []);
            if (lista.some((d) => d.equipo && d.equipo.estado !== 'COMPLETADO')) {
              tieneIncompleto = true;
              break;
            }
          } catch {
            // Ignorar: la falta de datos no debe bloquear el badge
          }
        }
        if (cancelled) return;
        if (tieneIncompleto) pendientes.add(trip.id);
      }
      if (!cancelled) setTripsConEquiposPendientes(pendientes);
    };
    void computePreflight();
    return () => {
      cancelled = true;
    };
  }, [trips, deliveries]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let tripsData: Viaje[] = [];
      let vehiclesData: Vehiculo[] = [];
      let employeesData: Empleado[] = [];
      let deliveriesData: EntregaViaje[] = [];
      let facturasData: DocumentoComercial[] = [];
      let clientesData: Cliente[] = [];
      const errors: string[] = [];

      try {
        const tripsResponse = await viajeApi.getAll({ page: 0, size: 1000, sort: 'id,desc' });
        tripsData = tripsResponse.content || [];
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Viajes: ${errorMsg}`);
      }

      try {
        const allVehiclesResponse = await vehiculoApi.getAll({ page: 0, size: 1000 });
        vehiclesData = Array.isArray(allVehiclesResponse)
          ? allVehiclesResponse
          : (allVehiclesResponse as any).content || [];
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Vehículos: ${errorMsg}`);
      }

      try {
        employeesData = await employeeApi.getAllList();
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Empleados: ${errorMsg}`);
      }

      try {
        deliveriesData = await entregaViajeApi.getAll();
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Entregas: ${errorMsg}`);
      }

      try {
        facturasData = await documentoApi.getByTipo('FACTURA');
        facturasData = facturasData.filter(f => f.numeroDocumento?.startsWith('FAC-'));
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Facturas: ${errorMsg}`);
      }

      let ordenesData: any[] = [];
      try {
        ordenesData = await ordenServicioApi.getByEstado('FINALIZADA');
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Órdenes de Servicio: ${errorMsg}`);
      }

      try {
        const clientesResponse = await clienteApi.getAll({ page: 0, size: 1000 });
        clientesData = Array.isArray(clientesResponse)
          ? clientesResponse
          : (clientesResponse as any).content || [];
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Clientes: ${errorMsg}`);
      }

      if (errors.length > 0) {
        setError(errors.join(' | '));
      }

      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setDrivers(Array.isArray(employeesData) ? employeesData : []);
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setFacturas(Array.isArray(facturasData) ? facturasData : []);
      setOrdenes(Array.isArray(ordenesData) ? ordenesData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);

    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips
    .filter(trip => statusFilter === 'all' || trip.estado === statusFilter)
    .sort((a, b) => b.id - a.id);

  const paginatedTrips = filteredTrips.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAdd = () => {
    wizard.startCreate();
    setDialogOpen(true);
  };

  const handleEdit = async (trip: Viaje) => {
    await wizard.startEdit(trip);
    setDialogOpen(true);
  };

  const handleViewDetails = async (trip: Viaje) => {
    setSelectedTrip(trip);
    setDetailsTab(0);
    setDetailsDialogOpen(true);

    const tripDeliveriesData = getTripDeliveries(trip.id);
    const detailsMap: Record<number, any> = {};

    for (const delivery of tripDeliveriesData) {
      try {
        const detalles = await entregaViajeApi.getDetalles(delivery.id);
        detailsMap[delivery.id] = detalles;
      } catch (err) {
        console.error(`Error loading details for delivery #${delivery.id}:`, err);
      }
    }

    setDeliveryDetailsMap(detailsMap);

    // Cargar resumen financiero del viaje (cobros a recibir por entrega)
    if (!(trip.id in resumenFinancieroMap)) {
      try {
        const resumen = await entregaViajeApi.getResumenFinanciero(trip.id);
        setResumenFinancieroMap(prev => ({ ...prev, [trip.id]: resumen }));
      } catch (err) {
        console.error(`Error cargando resumen financiero del viaje #${trip.id}:`, err);
        setResumenFinancieroMap(prev => ({ ...prev, [trip.id]: null }));
      }
    }
  };

  const handleDelete = (id: number) => {
    const trip = trips.find((t) => t.id === id);
    if (trip) setTripToDelete(trip);
  };

  const handleConfirmDelete = async () => {
    if (!tripToDelete) return;
    setDeleteLoading(true);
    try {
      await viajeApi.delete(tripToDelete.id);
      await loadData();
      setTripToDelete(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al eliminar el viaje');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangeEstado = async (id: number, nuevoEstado: EstadoViaje) => {
    try {
      await viajeApi.changeEstado(id, nuevoEstado);
      await loadData();
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const backendMessage = error.response?.data?.message;
      let errorMessage = backendMessage || error.message || 'Error al cambiar el estado del viaje';

      // Backend formato: "No se puede iniciar el viaje: el equipo {numeroHeladera} aún no
      // está COMPLETADO (estado: {estado}). Finalizá la producción antes de salir."
      if (!backendMessage && errorMessage.includes('no está disponible')) {
        errorMessage = 'No se puede iniciar el viaje porque el vehículo ya está en uso.';
      }

      const isIniciarEquipoError = nuevoEstado === 'EN_CURSO'
        && errorMessage.toLowerCase().includes('completado');

      setChangeEstadoErrorDialog({
        open: true,
        title: isIniciarEquipoError
          ? 'No se puede iniciar el viaje'
          : 'No se pudo cambiar el estado del viaje',
        message: errorMessage,
      });
    }
  };

  const handleCerrarViaje = async (trip: Viaje) => {
    setCerrandoViajeId(trip.id);
    try {
      await viajeApi.cerrarViaje(trip.id);
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Error al cerrar el viaje';
      setChangeEstadoErrorDialog({
        open: true,
        title: 'No se pudo cerrar el viaje',
        message: typeof msg === 'string' ? msg : JSON.stringify(msg),
      });
    } finally {
      setCerrandoViajeId(null);
    }
  };

  const getStatusChip = (status: EstadoViaje) => {
    const statusConfig: Record<string, { label: string; color: 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
      PLANIFICADO: { label: 'Planificado', color: 'info' },
      EN_CURSO: { label: 'En Ruta', color: 'warning' },
      COMPLETADO: { label: 'Completado', color: 'success' },
      PENDIENTE_RENDICION: { label: 'Pend. Rendición', color: 'warning' },
      RENDIDO: { label: 'Rendido', color: 'success' },
      CANCELADO: { label: 'Cancelado', color: 'error' },
    };

    const config = statusConfig[status] || { label: status || 'Desconocido', color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getDriverName = (driverId: number | null | undefined) => {
    if (driverId == null) return 'Sin asignar';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.nombre} ${driver.apellido}` : 'N/A';
  };

  const getAcompananteName = (id: number | null | undefined) => {
    if (id == null) return null;
    const emp = drivers.find(d => d.id === id);
    return emp ? `${emp.nombre} ${emp.apellido}` : null;
  };

  const getVehicleInfo = (vehicleId: number | null | undefined) => {
    if (vehicleId == null) return 'Sin asignar';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})` : 'N/A';
  };

  // Info de entrega estimada a partir de la fecha de emisión de la factura
  // (cálculo compartido con el wizard, ligado al parámetro DIAS_ENTREGA_ESTIMADA).
  const entregaEstimadaInfo = (fechaEmision?: string | null) =>
    entregaEstimadaInfoBase(fechaEmision, diasEntregaEstimada);

  // Info estimada para una entrega: resuelve su factura (documentoComercialId).
  // Las entregas de orden de servicio no tienen factura → null.
  const infoEntregaDeDelivery = (delivery: EntregaViaje) => {
    const docId = (delivery as any).documentoComercialId ?? (delivery as any).documentoComercial?.id;
    if (docId == null) return null;
    const factura = facturas.find(f => f.id === docId);
    return entregaEstimadaInfo(factura?.fechaEmision ?? (factura as any)?.fecha);
  };

  // Entrega más urgente del viaje (menor "restantes" = más próxima/atrasada),
  // para mostrar un indicador en la fila del listado. null si no hay facturas.
  const infoEntregaViaje = (tripId: number) => {
    const infos = getTripDeliveries(tripId)
      .map(d => infoEntregaDeDelivery(d))
      .filter((x): x is { fecha: string; transcurridos: number; restantes: number } => x != null);
    if (infos.length === 0) return null;
    return infos.reduce((min, cur) => (cur.restantes < min.restantes ? cur : min));
  };

  // Línea "Transcurridos X de N d · faltan/atrasada" reutilizable.
  const renderEntregaEstimada = (info: { fecha: string; transcurridos: number; restantes: number } | null) =>
    renderEntregaEstimadaBase(info, diasEntregaEstimada);

  const getTripDeliveries = (tripId: number) => {
    return deliveries.filter(d => d.viajeId === tripId);
  };

  const getFacturasByTrip = (tripId: number): DocumentoComercial[] => {
    const tripDeliveries = getTripDeliveries(tripId);

    const facturaIds = tripDeliveries
      .map(d => {
        if (d.documentoComercialId) return d.documentoComercialId;
        if (d.documentoComercial?.id) return d.documentoComercial.id;
        if (d.ventaId) return d.ventaId;
        if (d.venta?.id) return d.venta.id;
        return undefined;
      })
      .filter((id): id is number => id !== undefined && id !== null);

    const uniqueFacturaIds = [...new Set(facturaIds)];
    const foundFacturas = uniqueFacturaIds
      .map(id => facturas.find(f => f.id === id))
      .filter((f): f is DocumentoComercial => f !== undefined);

    return foundFacturas;
  };

  const getOrdenesByTrip = (tripId: number): any[] => {
    const tripDeliveries = getTripDeliveries(tripId);

    const ordenIds = tripDeliveries
      .map(d => (d as any).ordenServicioId)
      .filter((id): id is number => id !== undefined && id !== null);

    const uniqueOrdenIds = [...new Set(ordenIds)];
    const foundOrdenes = uniqueOrdenIds
      .map(id => ordenes.find(o => o.id === id))
      .filter((o): o is any => o !== undefined);

    return foundOrdenes;
  };

  const getClientesByTrip = (tripId: number): string[] => {
    const tripFacturas = getFacturasByTrip(tripId);
    const tripOrdenes = getOrdenesByTrip(tripId);

    const clienteNombres = [
      ...tripFacturas
        .map(f => f.clienteNombre)
        .filter((nombre): nombre is string => nombre !== undefined && nombre !== null && nombre.trim() !== ''),
      ...tripOrdenes
        .map(o => o.clienteNombre)
        .filter((nombre): nombre is string => nombre !== undefined && nombre !== null && nombre.trim() !== ''),
    ];

    return [...new Set(clienteNombres)];
  };

  // Mobile Trip Card Component
  const MobileTripCard = ({ trip }: { trip: Viaje }) => {
    const tripDeliveriesData = getTripDeliveries(trip.id);
    const tripFacturas = getFacturasByTrip(trip.id);
    const tripOrdenes = getOrdenesByTrip(trip.id);
    const tripClientes = getClientesByTrip(trip.id);
    const isExpanded = expandedCard === trip.id;

    return (
      <Card
        variant="outlined"
        sx={{
          transition: 'all 0.2s ease',
          '&:active': { transform: 'scale(0.98)' }
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            onClick={() => setExpandedCard(isExpanded ? null : trip.id)}
            sx={{ cursor: 'pointer' }}
          >
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Viaje #{trip.id}
                </Typography>
                {getStatusChip(trip.estado)}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {new Date(trip.fechaViaje).toLocaleDateString('es-AR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </Typography>
            </Box>
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Quick info */}
          <Box mt={1.5}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={0.5}>
                <DriverIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" noWrap sx={{ maxWidth: 120 }}>
                  {getDriverName(trip.conductorId)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                  {trip.destino}
                </Typography>
              </Box>
              <Badge badgeContent={tripDeliveriesData.length} color="primary" sx={{ ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary">Entregas</Typography>
              </Badge>
            </Stack>
            {(() => {
              const info = infoEntregaViaje(trip.id);
              if (!info) return null;
              return (
                <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                  <Typography variant="caption" color="text.secondary">Entrega est.:</Typography>
                  <Typography variant="caption">{info.fecha}</Typography>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={info.restantes >= 0 ? `faltan ${info.restantes} d` : `atrasada ${Math.abs(info.restantes)} d`}
                    color={info.restantes < 0 ? 'error' : info.restantes <= 3 ? 'warning' : 'default'}
                  />
                </Box>
              );
            })()}
          </Box>

          {/* Expanded content */}
          <Collapse in={isExpanded}>
            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1.5}>
              {/* Vehicle */}
              <Box display="flex" alignItems="center" gap={1}>
                <TruckIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {getVehicleInfo(trip.vehiculoId)}
                </Typography>
              </Box>

              {/* Clients */}
              {tripClientes.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Clientes:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {tripClientes.map((cliente, idx) => (
                      <Chip key={idx} label={cliente} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Documentos (Facturas y Órdenes) */}
              {(tripFacturas.length > 0 || tripOrdenes.length > 0) && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Documentos:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                    {tripFacturas.map((factura) => (
                      <Chip
                        key={factura.id}
                        label={factura.numeroDocumento}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {tripOrdenes.map((orden) => (
                      <Chip
                        key={orden.id}
                        label={orden.numeroOrden}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>

            {/* Actions */}
            <Box
              display="flex"
              justifyContent="flex-end"
              gap={1}
              mt={2}
              pt={1.5}
              borderTop="1px solid"
              borderColor="divider"
            >
              <IconButton
                onClick={(e) => { e.stopPropagation(); handleViewDetails(trip); }}
                size="small"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <MapIcon />
              </IconButton>

              {trip.estado === 'PLANIFICADO' && (
                <Tooltip
                  title={
                    tripsConEquiposPendientes.has(trip.id)
                      ? 'Hay equipos en producción. Verificá el checklist antes de salir.'
                      : 'Iniciar viaje'
                  }
                  enterDelay={300}
                >
                  <Badge
                    color="warning"
                    variant="dot"
                    invisible={!tripsConEquiposPendientes.has(trip.id)}
                    overlap="circular"
                  >
                    <IconButton
                      onClick={(e) => { e.stopPropagation(); setChecklistTrip(trip); }}
                      size="small"
                      color="success"
                      aria-label="Iniciar viaje"
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <StartIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>
              )}

              {trip.estado === 'EN_CURSO' && (
                <Tooltip title="Finalizar viaje" enterDelay={300}>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleChangeEstado(trip.id, 'COMPLETADO'); }}
                    size="small"
                    color="primary"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <StopIcon />
                  </IconButton>
                </Tooltip>
              )}

              {/* Cerrar viaje (conductor informa que ya terminó las entregas) */}
              {(trip.estado === 'COMPLETADO' || trip.estado === 'EN_CURSO') && (
                <Tooltip title="Cerrar viaje y pasar a rendición" enterDelay={300}>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleCerrarViaje(trip); }}
                    size="small"
                    color="warning"
                    disabled={cerrandoViajeId === trip.id}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    {cerrandoViajeId === trip.id
                      ? <CircularProgress size={18} color="inherit" />
                      : <WalletIcon />}
                  </IconButton>
                </Tooltip>
              )}

              {/* Rendir viaje (admin recibe el dinero) */}
              {puedeRendirViaje(trip) && (trip.estado === 'COMPLETADO' || trip.estado === 'PENDIENTE_RENDICION') && (
                <Tooltip title="Registrar rendición de efectivo" enterDelay={300}>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); setRendicionDialogViaje(trip); }}
                    size="small"
                    color="success"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <AttachMoneyIcon />
                  </IconButton>
                </Tooltip>
              )}

              <IconButton
                onClick={(e) => { e.stopPropagation(); handleEdit(trip); }}
                size="small"
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <EditIcon />
              </IconButton>

              {trip.estado === 'PLANIFICADO' && (
                <IconButton
                  onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
                  size="small"
                  color="error"
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ pb: isMobile ? 10 : 3, minHeight: '100vh' }}>
      <LoadingOverlay open={loading} message="Cargando viajes..." />
      {/* Header - Sin card de fondo */}
      <Box
        sx={{ mb: 3 }}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          display="flex"
          alignItems="center"
          gap={1}
        >
          <TruckIcon />
          Armado de Viajes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          fullWidth={isMobile}
          sx={{ display: isMobile ? 'none' : 'inline-flex' }}
        >
          Nuevo Viaje
        </Button>
      </Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards - Grid estático como versión 1 */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <ScheduleIcon color="info" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>
                    {trips.filter(t => t.estado === 'PLANIFICADO').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Planificados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <RouteIcon color="warning" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>
                    {trips.filter(t => t.estado === 'EN_CURSO').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    En Ruta
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <CheckIcon color="success" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>
                    {trips.filter(t => t.estado === 'COMPLETADO' || t.estado === 'PENDIENTE_RENDICION').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completados
                  </Typography>
                </Box>
              </Box>
              {trips.filter(t => t.estado === 'PENDIENTE_RENDICION').length > 0 && (
                <Typography variant="caption" color="warning.main" fontWeight={600}>
                  {trips.filter(t => t.estado === 'PENDIENTE_RENDICION').length} pend. rendición
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <TruckIcon color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>{vehicles.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vehículos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

        {/* Filter - Chips on mobile */}
        <Box mb={2}>
          {isMobile ? (
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'PLANIFICADO', label: 'Planificados' },
                { value: 'EN_CURSO', label: 'En Ruta' },
                { value: 'COMPLETADO', label: 'Completados' },
                { value: 'PENDIENTE_RENDICION', label: 'Pend. Rendición' },
                { value: 'RENDIDO', label: 'Rendidos' },
              ].map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => setStatusFilter(option.value as 'all' | EstadoViaje)}
                  color={statusFilter === option.value ? 'primary' : 'default'}
                  variant={statusFilter === option.value ? 'filled' : 'outlined'}
                  sx={{ minHeight: 36 }}
                />
              ))}
            </Stack>
          ) : (
            <FormControl sx={{ minWidth: 150 }} size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value as 'all' | EstadoViaje)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="PLANIFICADO">Planificados</MenuItem>
                <MenuItem value="EN_CURSO">En Ruta</MenuItem>
                <MenuItem value="COMPLETADO">Completados</MenuItem>
                <MenuItem value="PENDIENTE_RENDICION">Pendiente de Rendición</MenuItem>
                <MenuItem value="RENDIDO">Rendidos</MenuItem>
                <MenuItem value="CANCELADO">Cancelados</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Trip List */}
        {isMobile ? (
          <Stack spacing={1.5}>
            {paginatedTrips.map((trip) => (
              <MobileTripCard key={trip.id} trip={trip} />
            ))}
          </Stack>
        ) : (
          /* Desktop/Tablet Table */
          <Card>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <Paper sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: 'grey.50' }}>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>ID</Box>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Clientes</Box>
                      {!isTablet && <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Facturas</Box>}
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Conductor</Box>
                      {!isTablet && <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Vehículo</Box>}
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Destino</Box>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Fecha</Box>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Entrega est.</Box>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Estado</Box>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'center', fontWeight: 'bold' }}>Acciones</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {paginatedTrips.map((trip) => {
                      const tripFacturas = getFacturasByTrip(trip.id);
                      const tripOrdenes = getOrdenesByTrip(trip.id);
                      const tripClientes = getClientesByTrip(trip.id);

                      return (
                        <Box
                          component="tr"
                          key={trip.id}
                          sx={{
                            '&:hover': { bgcolor: 'grey.50' },
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2" fontWeight="bold">#{trip.id}</Typography>
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            {tripClientes.length > 0 ? (
                              <Box>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                  {tripClientes[0]}
                                </Typography>
                                {tripClientes.length > 1 && (
                                  <Chip label={`+${tripClientes.length - 1}`} size="small" />
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">Sin clientes</Typography>
                            )}
                          </Box>
                          {!isTablet && (
                            <Box component="td" sx={{ p: 1.5 }}>
                              {tripFacturas.length > 0 || tripOrdenes.length > 0 ? (
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {tripFacturas.slice(0, 2).map((factura) => (
                                    <Chip
                                      key={factura.id}
                                      label={factura.numeroDocumento}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ))}
                                  {tripOrdenes.slice(0, 2).map((orden) => (
                                    <Chip
                                      key={orden.id}
                                      label={orden.numeroOrden}
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                    />
                                  ))}
                                  {(tripFacturas.length > 2 || tripOrdenes.length > 2) && (
                                    <Chip
                                      label={`+${tripFacturas.length + tripOrdenes.length - 2}`}
                                      size="small"
                                    />
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">Sin documentos</Typography>
                              )}
                            </Box>
                          )}
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {getDriverName(trip.conductorId)}
                            </Typography>
                          </Box>
                          {!isTablet && (
                            <Box component="td" sx={{ p: 1.5 }}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {getVehicleInfo(trip.vehiculoId)}
                              </Typography>
                            </Box>
                          )}
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                              {trip.destino}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2" noWrap>
                              {new Date(trip.fechaViaje).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            {(() => {
                              const info = infoEntregaViaje(trip.id);
                              if (!info) return <Typography variant="caption" color="text.secondary">—</Typography>;
                              return (
                                <Box>
                                  <Typography variant="body2" noWrap>{info.fecha}</Typography>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={info.restantes >= 0 ? `faltan ${info.restantes} d` : `atrasada ${Math.abs(info.restantes)} d`}
                                    color={info.restantes < 0 ? 'error' : info.restantes <= 3 ? 'warning' : 'default'}
                                  />
                                </Box>
                              );
                            })()}
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            {getStatusChip(trip.estado)}
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Box display="flex" justifyContent="center" gap={0.5}>
                              <IconButton onClick={() => handleViewDetails(trip)} size="small">
                                <MapIcon fontSize="small" />
                              </IconButton>
                              {trip.estado === 'PLANIFICADO' && (
                                <Tooltip
                                  title={
                                    tripsConEquiposPendientes.has(trip.id)
                                      ? 'Hay equipos en producción. Verificá el checklist antes de salir.'
                                      : 'Iniciar viaje'
                                  }
                                  enterDelay={300}
                                >
                                  <Badge
                                    color="warning"
                                    variant="dot"
                                    invisible={!tripsConEquiposPendientes.has(trip.id)}
                                    overlap="circular"
                                  >
                                    <IconButton
                                      onClick={() => setChecklistTrip(trip)}
                                      size="small"
                                      color="success"
                                      aria-label="Iniciar viaje"
                                    >
                                      <StartIcon fontSize="small" />
                                    </IconButton>
                                  </Badge>
                                </Tooltip>
                              )}
                              {trip.estado === 'EN_CURSO' && (
                                <IconButton onClick={() => handleChangeEstado(trip.id, 'COMPLETADO')} size="small" color="primary">
                                  <StopIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton onClick={() => handleEdit(trip)} size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              {trip.estado === 'PLANIFICADO' && (
                                <IconButton onClick={() => handleDelete(trip.id)} size="small">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Paper>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredTrips.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25, 50]}
          labelRowsPerPage={isMobile ? '' : 'Filas:'}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
            '.MuiTablePagination-selectLabel': { display: isMobile ? 'none' : 'block' },
            '.MuiTablePagination-toolbar': { px: isMobile ? 0 : 2 },
          }}
        />

      {/* FAB for mobile */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            width: 56,
            height: 56,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Wizard de creación/edición de viajes (bottom sheet móvil + drawer desktop) */}
      <TripWizardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        wizard={wizard}
      />

      {/* Details Bottom Sheet / Dialog */}
      {isMobile ? (
        <BottomSheet
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          title={`Viaje #${selectedTrip?.id}`}
          actions={
            <Button
              fullWidth
              variant="contained"
              onClick={() => setDetailsDialogOpen(false)}
              sx={{ minHeight: 48 }}
            >
              Cerrar
            </Button>
          }
        >
          {selectedTrip && (
            <Box>
              <Tabs
                value={detailsTab}
                onChange={(_, v) => setDetailsTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab label="Info" />
                <Tab label={`Entregas (${getTripDeliveries(selectedTrip.id).length})`} />
                <Tab label={`Facturas (${getFacturasByTrip(selectedTrip.id).length})`} />
                {(!esLogistico || esAsignadoAlViaje(selectedTrip)) && (
                  <Tab
                    label="Cobros"
                    icon={<AttachMoneyIcon sx={{ fontSize: 16 }} />}
                    iconPosition="start"
                    sx={{ minHeight: 48 }}
                  />
                )}
              </Tabs>

              {detailsTab === 0 && (
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DriverIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Conductor</Typography>
                            <Typography variant="body2">{getDriverName(selectedTrip.conductorId)}</Typography>
                            {getAcompananteName(selectedTrip.acompananteId) && (
                              <>
                                <Typography variant="caption" color="text.secondary">Acompañante</Typography>
                                <Typography variant="body2">{getAcompananteName(selectedTrip.acompananteId)}</Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TruckIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Vehículo</Typography>
                            <Typography variant="body2">{getVehicleInfo(selectedTrip.vehiculoId)}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Destino</Typography>
                            <Typography variant="body2">{selectedTrip.destino}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">Fecha</Typography>
                            <Typography variant="body2">{new Date(selectedTrip.fechaViaje).toLocaleString()}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">Estado:</Typography>
                          {getStatusChip(selectedTrip.estado)}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  {selectedTrip.observaciones && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                        <Typography variant="body2">{selectedTrip.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              )}

              {detailsTab === 1 && (
                <Stack spacing={1.5}>
                  {getTripDeliveries(selectedTrip.id).map((delivery, index) => {
                    const detalles = deliveryDetailsMap[delivery.id];
                    return (
                      <Card key={delivery.id} variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="subtitle2">Entrega #{index + 1}</Typography>
                            <Chip
                              label={delivery.estado}
                              size="small"
                              color={delivery.estado === 'ENTREGADA' ? 'success' : 'warning'}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {delivery.direccionEntrega}
                          </Typography>
                          {(delivery as any).tipoParada && (
                            <Chip
                              label={tipoParadaLabel((delivery as any).tipoParada)}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(delivery.fechaEntrega).toLocaleString()}
                          </Typography>
                          {renderEntregaEstimada(infoEntregaDeDelivery(delivery))}
                          {delivery.observaciones && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              📝 {delivery.observaciones}
                            </Typography>
                          )}
                          {detalles?.equipos?.length > 0 ? (
                            <Box mt={1}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Equipos ({detalles.equipos.length}):
                              </Typography>
                              <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                                {detalles.equipos.map((eq: any) => (
                                  <Chip
                                    key={eq.id}
                                    label={eq.codigoVenta ?? eq.numeroHeladera}
                                    size="small"
                                    variant="outlined"
                                    title={`${eq.modelo ?? ''} | ${eq.tipo ?? ''}`}
                                  />
                                ))}
                              </Stack>
                            </Box>
                          ) : detalles && (
                            <Typography variant="caption" color="text.disabled" display="block" mt={1} sx={{ fontStyle: 'italic' }}>
                              Sin equipos registrados
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {getTripDeliveries(selectedTrip.id).length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      No hay entregas asignadas
                    </Typography>
                  )}
                </Stack>
              )}

              {detailsTab === 2 && (
                <Stack spacing={1.5}>
                  {getFacturasByTrip(selectedTrip.id).map((factura) => (
                    <Card key={factura.id} variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="subtitle2" color="primary">
                          {factura.numeroDocumento}
                        </Typography>
                        <Typography variant="body2">{factura.clienteNombre}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${factura.total.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {factura.detalles.length} items
                        </Typography>
                        {renderEntregaEstimada(entregaEstimadaInfo(factura.fechaEmision ?? (factura as any).fecha))}
                      </CardContent>
                    </Card>
                  ))}
                  {getFacturasByTrip(selectedTrip.id).length === 0 && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                      No hay facturas asociadas
                    </Typography>
                  )}
                </Stack>
              )}

              {detailsTab === 3 && (!esLogistico || esAsignadoAlViaje(selectedTrip)) && (
                <ResumenCobrosMobile
                  resumen={resumenFinancieroMap[selectedTrip.id]}
                  estadoViaje={selectedTrip.estado}
                  puedeRendir={puedeRendirViaje(selectedTrip)}
                  onRendir={() => setRendicionDialogViaje(selectedTrip)}
                />
              )}
            </Box>
          )}
        </BottomSheet>
      ) : (
        /* Desktop Details Dialog */
        <SwipeableDrawer
          anchor="right"
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          onOpen={() => {}}
          PaperProps={{
            sx: { width: isTablet ? '90%' : 600 }
          }}
        >
          {selectedTrip && (
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <MapIcon color="primary" />
                  <Typography variant="h6">Viaje #{selectedTrip.id}</Typography>
                  {getStatusChip(selectedTrip.estado)}
                </Box>
                <IconButton onClick={() => setDetailsDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Información General</Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2"><strong>Conductor:</strong> {getDriverName(selectedTrip.conductorId)}</Typography>
                        {getAcompananteName(selectedTrip.acompananteId) && (
                          <Typography variant="body2"><strong>Acompañante:</strong> {getAcompananteName(selectedTrip.acompananteId)}</Typography>
                        )}
                        <Typography variant="body2"><strong>Vehículo:</strong> {getVehicleInfo(selectedTrip.vehiculoId)}</Typography>
                        <Typography variant="body2"><strong>Destino:</strong> {selectedTrip.destino}</Typography>
                        <Typography variant="body2"><strong>Fecha:</strong> {new Date(selectedTrip.fechaViaje).toLocaleString()}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Entregas ({getTripDeliveries(selectedTrip.id).length})
                      </Typography>
                      <List dense>
                        {getTripDeliveries(selectedTrip.id).map((delivery, index) => {
                          const detalles = deliveryDetailsMap[delivery.id];
                          return (
                          <ListItem key={delivery.id} disablePadding sx={{ flexDirection: 'column', alignItems: 'stretch', py: 0.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" width="100%">
                              <ListItemText
                                primary={`Entrega #${index + 1}`}
                                secondary={
                                  <>
                                    {(() => {
                                      const info = infoEntregaDeDelivery(delivery);
                                      if (!info) return delivery.direccionEntrega;
                                      const restTxt = info.restantes >= 0
                                        ? `faltan ${info.restantes} d`
                                        : `atrasada ${Math.abs(info.restantes)} d`;
                                      return `${delivery.direccionEntrega} · Estimada ${info.fecha} (transcurridos ${info.transcurridos}/${diasEntregaEstimada} d, ${restTxt})`;
                                    })()}
                                    {delivery.observaciones && (
                                      <Box component="span" display="block" sx={{ fontStyle: 'italic', mt: 0.25 }}>
                                        📝 {delivery.observaciones}
                                      </Box>
                                    )}
                                  </>
                                }
                              />
                              <Chip
                                label={delivery.estado}
                                size="small"
                                color={delivery.estado === 'ENTREGADA' ? 'success' : 'warning'}
                                sx={{ mt: 0.5, flexShrink: 0 }}
                              />
                            </Box>
                            {detalles?.equipos?.length > 0 ? (
                              <Box mt={0.5} mb={0.5}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  Equipos ({detalles.equipos.length}):
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                                  {detalles.equipos.map((eq: any) => (
                                    <Chip
                                      key={eq.id}
                                      label={`${eq.codigoVenta ?? eq.numeroHeladera}${eq.color?.nombre ? ` · ${eq.color.nombre}` : ''}`}
                                      size="small"
                                      variant="outlined"
                                      title={`${eq.modelo ?? ''} | ${eq.tipo ?? ''}`}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            ) : detalles && (
                              <Typography variant="caption" color="text.disabled" display="block" mt={0.5} mb={0.5} sx={{ fontStyle: 'italic' }}>
                                Sin equipos registrados
                              </Typography>
                            )}
                          </ListItem>
                          );
                        })}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {getFacturasByTrip(selectedTrip.id).length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Facturas ({getFacturasByTrip(selectedTrip.id).length})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {getFacturasByTrip(selectedTrip.id).map((factura) => (
                            <Chip
                              key={factura.id}
                              label={`${factura.numeroDocumento} - $${factura.total.toLocaleString()}`}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {selectedTrip.observaciones && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Observaciones</Typography>
                        <Typography variant="body2">{selectedTrip.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Resumen financiero — visible para roles con acceso financiero */}
                {(!esLogistico || esAsignadoAlViaje(selectedTrip)) && (
                  <Grid item xs={12}>
                    <ResumenCobrosDesktop
                      resumen={resumenFinancieroMap[selectedTrip.id]}
                      estadoViaje={selectedTrip.estado}
                      puedeRendir={puedeRendirViaje(selectedTrip)}
                      onRendir={() => { setDetailsDialogOpen(false); setRendicionDialogViaje(selectedTrip); }}
                    />
                  </Grid>
                )}
              </Grid>

              <Box mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </Box>
            </Box>
          )}
        </SwipeableDrawer>
      )}

      {/* Checklist de pre-viaje: obligatorio para iniciar. Al completarse, inicia el viaje. */}
      <PreViajeChecklistDialog
        open={checklistTrip !== null}
        trip={checklistTrip}
        onClose={() => setChecklistTrip(null)}
        onCompleted={(viajeId) => handleChangeEstado(viajeId, 'EN_CURSO')}
      />

      {/* Modal: error al cambiar estado del viaje (e.g. equipo no COMPLETADO) */}
      <Dialog
        open={changeEstadoErrorDialog.open}
        onClose={() => setChangeEstadoErrorDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />
            <Typography variant="h6" fontWeight={600} color="error.main">
              {changeEstadoErrorDialog.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {changeEstadoErrorDialog.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={() => setChangeEstadoErrorDialog(prev => ({ ...prev, open: false }))}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!tripToDelete}
        onClose={() => setTripToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar viaje?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description="Está a punto de eliminar el siguiente viaje:"
        itemDetails={
          tripToDelete && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {tripToDelete.destino || `Viaje #${tripToDelete.id}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tripToDelete.fechaViaje}
                {tripToDelete.vehiculo?.patente ? ` · ${tripToDelete.vehiculo.patente}` : ''}
              </Typography>
            </>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteLoading}
      />

      {/* Dialog de rendición de viaje */}
      <RendicionDialog
        open={rendicionDialogViaje !== null}
        viaje={rendicionDialogViaje}
        onClose={() => setRendicionDialogViaje(null)}
        onSuccess={async () => {
          await loadData();
          setRendicionDialogViaje(null);
        }}
      />
    </Box>
  );
};

export default TripsPage2;
