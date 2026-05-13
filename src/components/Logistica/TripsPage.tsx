import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  IconButton,
  TextField,
  Paper,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  TablePagination,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Fab,
  SwipeableDrawer,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  Badge,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
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
  KeyboardArrowLeft as BackIcon,
  KeyboardArrowRight as NextIcon,
  ErrorOutline as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import type { Viaje, Vehiculo, Empleado, EntregaViaje, EstadoViaje, EstadoEntrega, DocumentoComercial, Cliente } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';
import { viajeApi } from '../../api/services/viajeApi';
import { vehiculoApi } from '../../api/services/vehiculoApi';
import { employeeApi } from '../../api/services/employeeApi';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import { documentoApi } from '../../api/services/documentoApi';
import { clienteApi } from '../../api/services/clienteApi';
import type { EquipoFabricadoDTO } from '../../types';

// Custom hook for responsive breakpoints
const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-899px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  return { isMobile, isTablet, isDesktop };
};

// Bottom Sheet component for mobile dialogs
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, onOpen, title, children, actions }) => {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null; // Use regular dialog for non-mobile
  }

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen || (() => {})}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '95vh',
          minHeight: '50vh',
        },
      }}
    >
      {/* Handle indicator */}
      <Box
        sx={{
          width: 40,
          height: 4,
          bgcolor: 'grey.300',
          borderRadius: 2,
          mx: 'auto',
          mt: 1.5,
          mb: 1,
        }}
      />

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        {children}
      </Box>

      {/* Actions - sticky at bottom */}
      {actions && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            bottom: 0,
          }}
        >
          {actions}
        </Box>
      )}
    </SwipeableDrawer>
  );
};

// Wizard steps for mobile trip creation
const wizardSteps = ['Información', 'Entregas', 'Confirmar'];

const TripsPage2: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();

  const [trips, setTrips] = useState<Viaje[]>([]);
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [drivers, setDrivers] = useState<Empleado[]>([]);
  const [deliveries, setDeliveries] = useState<EntregaViaje[]>([]);
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Viaje | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Viaje | null>(null);
  const [deliveryDetailsMap, setDeliveryDetailsMap] = useState<Record<number, any>>({});

  // Wizard state for mobile
  const [activeStep, setActiveStep] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoViaje>('all');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Expanded cards state for mobile
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Details tab state
  const [detailsTab, setDetailsTab] = useState(0);

  // Modal de aviso al seleccionar vehículo no DISPONIBLE
  const [vehiculoEstadoDialog, setVehiculoEstadoDialog] = useState<{
    open: boolean;
    vehiculo: Vehiculo | null;
    severity: 'info' | 'error';
  }>({ open: false, vehiculo: null, severity: 'info' });

  // Modal "vehículo ya en uso por otro viaje"
  const [vehicleInUseDialogOpen, setVehicleInUseDialogOpen] = useState(false);

  // Modal de error al cambiar estado del viaje (e.g. equipo no COMPLETADO)
  const [changeEstadoErrorDialog, setChangeEstadoErrorDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: '', message: '' });

  // Preflight: para cada viaje PLANIFICADO, marca si tiene equipos en estado != COMPLETADO
  const [tripsConEquiposPendientes, setTripsConEquiposPendientes] = useState<Set<number>>(new Set());

  // Form data
  const [formData, setFormData] = useState({
    fechaViaje: '',
    destino: '',
    conductorId: '',
    vehiculoId: '',
    facturaId: '',
    estado: 'PLANIFICADO' as EstadoViaje,
    observaciones: '',
  });

  // Deliveries for current trip
  type DeliveryFormState = Partial<EntregaViaje> & {
    fechaProgramada?: string;
    facturaId?: number;
    factura?: DocumentoComercial;
  };
  const [tripDeliveries, setTripDeliveries] = useState<DeliveryFormState[]>([]);
  const [newDelivery, setNewDelivery] = useState({
    direccionEntrega: '',
    fechaProgramada: '',
    observaciones: '',
    facturaId: '',
  });
  const [selectedDeliveryFactura, setSelectedDeliveryFactura] = useState<DocumentoComercial | null>(null);

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

  // Facturas ya asignadas a alguna entrega (excluir las del viaje en edición)
  const facturasAsignadasIds = new Set(
    deliveries
      .filter(d => !editingTrip || d.viajeId !== editingTrip.id)
      .map(d => (d as any).documentoComercialId ?? (d as any).documentoComercial?.id ?? (d as any).ventaId)
      .filter((id): id is number => id != null)
  );
  // También excluir las ya agregadas en el form actual
  const facturasEnFormIds = new Set(
    tripDeliveries.map(d => d.facturaId).filter((id): id is number => id != null)
  );
  const facturasDisponibles = facturas.filter(
    f => !facturasAsignadasIds.has(f.id) && !facturasEnFormIds.has(f.id)
  );

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

  const isVehicleInUse = (vehicleId: string): boolean => {
    return trips.some(trip =>
      trip.vehiculoId.toString() === vehicleId &&
      trip.estado === 'EN_CURSO'
    );
  };

  const getTripUsingVehicle = (vehicleId: string): Viaje | undefined => {
    return trips.find(trip =>
      trip.vehiculoId.toString() === vehicleId &&
      trip.estado === 'EN_CURSO'
    );
  };

  const VEHICULO_ESTADO_LABEL: Record<string, string> = {
    DISPONIBLE: 'Disponible',
    EN_USO: 'En uso',
    MANTENIMIENTO: 'En mantenimiento',
    FUERA_SERVICIO: 'Fuera de servicio',
  };

  const VEHICULO_ESTADO_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    DISPONIBLE: 'success',
    EN_USO: 'warning',
    MANTENIMIENTO: 'warning',
    FUERA_SERVICIO: 'error',
  };

  const getSelectedVehicle = (vehicleId: string): Vehiculo | undefined =>
    vehicles.find(v => v.id.toString() === vehicleId);

  const renderVehiculoEstadoChip = (estado?: string) => {
    if (!estado) return null;
    return (
      <Chip
        size="small"
        label={VEHICULO_ESTADO_LABEL[estado] || estado}
        color={VEHICULO_ESTADO_COLOR[estado] || 'default'}
        variant="outlined"
      />
    );
  };

  // Arma "calle, ciudad" desde un Cliente (formato compatible con Google Maps).
  const buildDireccionFromCliente = (cliente: Cliente | null | undefined): string => {
    if (!cliente) return '';
    const partes: string[] = [];
    if (cliente.direccion) partes.push(cliente.direccion);
    if (cliente.ciudad) partes.push(cliente.ciudad);
    return partes.join(', ');
  };

  // Selecciona una factura para una entrega nueva: autocompleta dirección
  // (direccion + ciudad del cliente). Si el cliente no está en el cache local,
  // lo trae por API. El campo queda editable por el usuario.
  const handleSelectFacturaForDelivery = async (factura: DocumentoComercial | null) => {
    setSelectedDeliveryFactura(factura);

    if (!factura) {
      setNewDelivery(prev => ({ ...prev, facturaId: '', direccionEntrega: '' }));
      return;
    }

    const facturaIdStr = factura.id.toString();
    let cliente = factura.clienteId
      ? clientes.find(c => c.id === factura.clienteId)
      : undefined;

    // Pre-fill con lo que tengamos en cache (puede ser "")
    setNewDelivery(prev => ({
      ...prev,
      facturaId: facturaIdStr,
      direccionEntrega: buildDireccionFromCliente(cliente),
    }));

    // Si no hay cliente en cache, traerlo por API y completar la dirección.
    if (!cliente && factura.clienteId) {
      try {
        const fetched = await clienteApi.getById(factura.clienteId);
        cliente = fetched;
        // Cachearlo para próximas selecciones
        setClientes(prev => (prev.some(c => c.id === fetched.id) ? prev : [...prev, fetched]));
        // Solo sobrescribir si el usuario no editó manualmente todavía.
        setNewDelivery(prev =>
          prev.facturaId === facturaIdStr && !prev.direccionEntrega
            ? { ...prev, direccionEntrega: buildDireccionFromCliente(fetched) }
            : prev
        );
      } catch {
        // si falla, dejamos el campo vacío para que el usuario lo escriba.
      }
    }
  };

  // Selecciona un vehículo. Para PLANIFICADO se muestra un Alert info inline
  // bajo el selector; para EN_CURSO con vehículo no DISPONIBLE se mantiene el
  // dialog de error bloqueante.
  const handleSelectVehicle = (vehiculo: Vehiculo | null) => {
    setFormData(prev => ({ ...prev, vehiculoId: vehiculo?.id.toString() || '' }));
    if (vehiculo && vehiculo.estado !== 'DISPONIBLE' && formData.estado === 'EN_CURSO') {
      setVehiculoEstadoDialog({
        open: true,
        vehiculo,
        severity: 'error',
      });
    }
  };

  const handleAdd = () => {
    setEditingTrip(null);
    setSelectedDeliveryFactura(null);
    setFormData({
      fechaViaje: '',
      destino: '',
      conductorId: '',
      vehiculoId: '',
      facturaId: '',
      estado: 'PLANIFICADO',
      observaciones: '',
    });
    setTripDeliveries([]);
    setNewDelivery({ direccionEntrega: '', fechaProgramada: '', observaciones: '', facturaId: '' });
    setActiveStep(0);
    setDialogOpen(true);
  };

  const handleEdit = async (trip: Viaje) => {
    setEditingTrip(trip);
    setFormData({
      fechaViaje: trip.fechaViaje.slice(0, 16),
      destino: trip.destino,
      conductorId: trip.conductorId.toString(),
      vehiculoId: trip.vehiculoId.toString(),
      facturaId: '',
      estado: trip.estado,
      observaciones: trip.observaciones || '',
    });

    try {
      const existingDeliveries = await entregaViajeApi.getByViaje(trip.id);
      setTripDeliveries(existingDeliveries);
    } catch (err) {
      setTripDeliveries([]);
    }
    setNewDelivery({ direccionEntrega: '', fechaProgramada: '', observaciones: '', facturaId: '' });
    setActiveStep(0);
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
  };

  const handleSave = async () => {
    try {
      const viajeData = {
        fechaViaje: new Date(formData.fechaViaje).toISOString(),
        destino: formData.destino,
        conductorId: parseInt(formData.conductorId),
        vehiculoId: parseInt(formData.vehiculoId),
        estado: formData.estado,
        observaciones: formData.observaciones,
      };

      let savedTrip;
      if (editingTrip) {
        savedTrip = await viajeApi.update(editingTrip.id, viajeData);
      } else {
        savedTrip = await viajeApi.create(viajeData);
      }

      const entregaErrors: string[] = [];
      for (const delivery of tripDeliveries) {
        if (delivery.id || !delivery.facturaId) continue;

        try {
          const deliveryPayload: any = {
            viajeId: savedTrip.id,
            documentoComercialId: delivery.facturaId,
            direccionEntrega: delivery.direccionEntrega || '',
            fechaEntrega: delivery.fechaProgramada ? new Date(delivery.fechaProgramada).toISOString() : new Date().toISOString(),
            observaciones: delivery.observaciones || '',
            estado: 'PENDIENTE' as EstadoEntrega,
          };
          await entregaViajeApi.create(deliveryPayload);
        } catch (deliveryError: any) {
          const msg = deliveryError?.response?.data?.message || deliveryError?.message || 'Error desconocido';
          const facturaLabel = delivery.factura?.numeroDocumento ?? `ID ${delivery.facturaId}`;
          entregaErrors.push(`Factura ${facturaLabel}: ${msg}`);
        }
      }

      await loadData();
      setDialogOpen(false);
      setTripDeliveries([]);

      if (entregaErrors.length > 0) {
        setError(`Viaje guardado, pero hubo errores en algunas entregas:\n${entregaErrors.join('\n')}`);
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      let errorMessage = error.response?.data?.message || error.message || 'Error al guardar el viaje';

      if (error.response?.status === 409 || errorMessage.toLowerCase().includes('ya está asignada') || errorMessage.toLowerCase().includes('already')) {
        errorMessage = `Una o más facturas ya están asignadas a otro viaje. ${errorMessage}`;
      } else if (errorMessage.includes('no está disponible')) {
        errorMessage = 'El vehículo seleccionado no está disponible. Por favor, selecciona otro vehículo.';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tienes permisos para crear viajes. Contacta al administrador.';
      }

      setError(errorMessage);
    }
  };

  const handleAddDelivery = () => {
    if (!newDelivery.direccionEntrega) {
      setError('Debe ingresar una dirección de entrega');
      return;
    }

    setTripDeliveries([...tripDeliveries, {
      direccionEntrega: newDelivery.direccionEntrega,
      fechaProgramada: newDelivery.fechaProgramada || formData.fechaViaje,
      observaciones: newDelivery.observaciones,
      estado: 'PENDIENTE',
      facturaId: newDelivery.facturaId ? parseInt(newDelivery.facturaId) : undefined,
      factura: selectedDeliveryFactura || undefined,
    }]);

    setNewDelivery({ direccionEntrega: '', fechaProgramada: '', observaciones: '', facturaId: '' });
    setSelectedDeliveryFactura(null);
  };

  const handleRemoveDelivery = (index: number) => {
    setTripDeliveries(tripDeliveries.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este viaje?')) {
      try {
        await viajeApi.delete(id);
        await loadData();
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error?.response?.data?.message || 'Error al eliminar el viaje');
      }
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

  const getStatusChip = (status: EstadoViaje) => {
    const statusConfig: Record<string, { label: string; color: 'info' | 'warning' | 'success' | 'error' | 'default' }> = {
      PLANIFICADO: { label: 'Planificado', color: 'info' },
      EN_CURSO: { label: 'En Ruta', color: 'warning' },
      COMPLETADO: { label: 'Completado', color: 'success' },
      CANCELADO: { label: 'Cancelado', color: 'error' },
    };

    const config = statusConfig[status] || { label: status || 'Desconocido', color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getDriverName = (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.nombre} ${driver.apellido}` : 'N/A';
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})` : 'N/A';
  };

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

  const getClientesByTrip = (tripId: number): string[] => {
    const tripFacturas = getFacturasByTrip(tripId);
    const clienteNombres = tripFacturas
      .map(f => f.clienteNombre)
      .filter((nombre): nombre is string => nombre !== undefined && nombre !== null && nombre.trim() !== '');

    return [...new Set(clienteNombres)];
  };

  // Wizard navigation
  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, wizardSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const canProceedStep1 = () => {
    return formData.destino && formData.conductorId && formData.vehiculoId && formData.fechaViaje;
  };

  // Render wizard step content
  const renderWizardStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={2.5}>
            <TextField
              label="Destino"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              fullWidth
              required
              size="medium"
              placeholder="Ej: Buenos Aires"
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <Autocomplete
              options={drivers}
              getOptionLabel={(driver) => `${driver.nombre} ${driver.apellido}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={drivers.find(d => d.id.toString() === formData.conductorId) || null}
              onChange={(_, value) => setFormData({ ...formData, conductorId: value?.id.toString() || '' })}
              renderOption={({ key: _key, ...props }, option) => (
                <li key={option.id} {...props}>
                  {`${option.nombre} ${option.apellido}`}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Conductor"
                  required
                  size="medium"
                  helperText={drivers.length === 0 ? 'No hay conductores' : `${drivers.length} disponibles`}
                  InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                />
              )}
              noOptionsText="No hay conductores"
            />

            <Autocomplete
              options={vehicles}
              getOptionLabel={(vehicle) => `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})`}
              value={vehicles.find(v => v.id.toString() === formData.vehiculoId) || null}
              onChange={(_, value) => handleSelectVehicle(value)}
              renderOption={({ key: _key, ...props }, option) => (
                <li key={option.id} {...props}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <span>{`${option.marca} ${option.modelo} (${option.patente})`}</span>
                    {renderVehiculoEstadoChip(option.estado)}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vehículo"
                  required
                  size="medium"
                  helperText={vehicles.length === 0 ? 'No hay vehículos cargados' : `${vehicles.length} totales`}
                  InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                />
              )}
              noOptionsText="No hay vehículos"
            />

            {formData.vehiculoId && isVehicleInUse(formData.vehiculoId) && (
              <Box>
                <Button
                  size="small"
                  variant="text"
                  color="warning"
                  onClick={() => setVehicleInUseDialogOpen(true)}
                >
                  Este vehículo está en uso por el Viaje #{getTripUsingVehicle(formData.vehiculoId)?.id}. Ver detalle
                </Button>
              </Box>
            )}

            {formData.vehiculoId &&
              formData.estado === 'PLANIFICADO' &&
              getSelectedVehicle(formData.vehiculoId) &&
              getSelectedVehicle(formData.vehiculoId)!.estado !== 'DISPONIBLE' && (
                <Alert severity="info">
                  Este vehículo está actualmente en uso. Podrás iniciarlo cuando esté disponible.
                </Alert>
              )}

            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              value={formData.fechaViaje}
              onChange={(e) => setFormData({ ...formData, fechaViaje: e.target.value })}
              fullWidth
              required
              size="medium"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={3}
              size="medium"
              placeholder="Notas adicionales..."
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Entregas agregadas: {tripDeliveries.length}
            </Typography>

            {tripDeliveries.length > 0 && (
              <Stack spacing={1}>
                {tripDeliveries.map((delivery, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {delivery.direccionEntrega}
                          </Typography>
                          {delivery.factura && (
                            <Chip
                              label={delivery.factura.numeroDocumento}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                        {!delivery.id && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveDelivery(index)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            <Divider />

            <Typography variant="subtitle2">Agregar nueva entrega</Typography>

            <Autocomplete
              options={facturasDisponibles}
              getOptionLabel={(factura) => `${factura.numeroDocumento} - ${factura.clienteNombre}`}
              value={facturas.find(f => f.id.toString() === newDelivery.facturaId) || null}
              onChange={(_, value) => { void handleSelectFacturaForDelivery(value); }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Factura"
                  size="medium"
                  placeholder="Buscar factura..."
                  InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }}
                />
              )}
              noOptionsText="No hay facturas"
            />

            {selectedDeliveryFactura && (
              <Alert severity="info" sx={{ py: 1 }}>
                <Typography variant="caption" fontWeight="bold">
                  {selectedDeliveryFactura.clienteNombre}
                </Typography>
                <Typography variant="caption" display="block">
                  Total: ${selectedDeliveryFactura.total.toLocaleString()} | {selectedDeliveryFactura.detalles.length} items
                </Typography>
              </Alert>
            )}

            <TextField
              label="Dirección de Entrega"
              value={newDelivery.direccionEntrega}
              onChange={(e) => setNewDelivery({ ...newDelivery, direccionEntrega: e.target.value })}
              fullWidth
              size="medium"
              placeholder="Calle 123, Ciudad"
              helperText="Se autocompleta con la dirección del cliente al elegir la factura. Editable."
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="Fecha Programada"
              type="datetime-local"
              value={newDelivery.fechaProgramada}
              onChange={(e) => setNewDelivery({ ...newDelivery, fechaProgramada: e.target.value })}
              fullWidth
              size="medium"
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddDelivery}
              fullWidth
              sx={{ minHeight: 48 }}
            >
              Agregar Entrega
            </Button>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Resumen del Viaje</Typography>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Destino:</strong> {formData.destino}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <DriverIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Conductor:</strong> {getDriverName(parseInt(formData.conductorId))}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <TruckIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Vehículo:</strong> {getVehicleInfo(parseInt(formData.vehiculoId))}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    <ScheduleIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      <strong>Fecha:</strong> {formData.fechaViaje ? new Date(formData.fechaViaje).toLocaleString() : 'No definida'}
                    </Typography>
                  </Box>

                  <Divider />

                  <Typography variant="body2">
                    <strong>Entregas:</strong> {tripDeliveries.length}
                  </Typography>

                  {tripDeliveries.map((delivery, idx) => (
                    <Typography key={idx} variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                      • {delivery.direccionEntrega}
                      {delivery.factura && ` (${delivery.factura.numeroDocumento})`}
                    </Typography>
                  ))}

                  {formData.observaciones && (
                    <>
                      <Divider />
                      <Typography variant="body2">
                        <strong>Notas:</strong> {formData.observaciones}
                      </Typography>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        );

      default:
        return null;
    }
  };

  // Mobile Trip Card Component
  const MobileTripCard = ({ trip }: { trip: Viaje }) => {
    const tripDeliveriesData = getTripDeliveries(trip.id);
    const tripFacturas = getFacturasByTrip(trip.id);
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

              {/* Invoices */}
              {tripFacturas.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Facturas:
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
                      onClick={(e) => { e.stopPropagation(); handleChangeEstado(trip.id, 'EN_CURSO'); }}
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
                <IconButton
                  onClick={(e) => { e.stopPropagation(); handleChangeEstado(trip.id, 'COMPLETADO'); }}
                  size="small"
                  color="primary"
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <StopIcon />
                </IconButton>
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
                    {trips.filter(t => t.estado === 'COMPLETADO').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completados
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
                      <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Estado</Box>
                      <Box component="th" sx={{ p: 1.5, textAlign: 'center', fontWeight: 'bold' }}>Acciones</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {paginatedTrips.map((trip) => {
                      const tripFacturas = getFacturasByTrip(trip.id);
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
                              {tripFacturas.length > 0 ? (
                                <Box>
                                  <Typography variant="body2" color="primary.main" noWrap>
                                    {tripFacturas[0]?.numeroDocumento}
                                  </Typography>
                                  {tripFacturas.length > 1 && (
                                    <Chip label={`+${tripFacturas.length - 1}`} size="small" color="primary" />
                                  )}
                                </Box>
                              ) : (
                                <Typography variant="caption" color="text.secondary">Sin facturas</Typography>
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
                                      onClick={() => handleChangeEstado(trip.id, 'EN_CURSO')}
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

      {/* Mobile Bottom Sheet for Create/Edit */}
      {isMobile && (
        <BottomSheet
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
          actions={
            <Stack spacing={1.5}>
              {/* Stepper */}
              <Stepper activeStep={activeStep} alternativeLabel>
                {wizardSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Navigation buttons */}
              <Box display="flex" gap={1}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<BackIcon />}
                  sx={{ flex: 1, minHeight: 48 }}
                >
                  Atrás
                </Button>

                {activeStep < wizardSteps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<NextIcon />}
                    disabled={activeStep === 0 && !canProceedStep1()}
                    sx={{ flex: 1, minHeight: 48 }}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSave}
                    sx={{ flex: 1, minHeight: 48 }}
                  >
                    {editingTrip ? 'Actualizar' : 'Crear Viaje'}
                  </Button>
                )}
              </Box>
            </Stack>
          }
        >
          {renderWizardStep()}
        </BottomSheet>
      )}

      {/* Desktop Dialog for Create/Edit */}
      {!isMobile && (
        <SwipeableDrawer
          anchor="right"
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onOpen={() => {}}
          PaperProps={{
            sx: { width: isTablet ? '80%' : 500 }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                {editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
              </Typography>
              <IconButton onClick={() => setDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={2.5}>
              <TextField
                label="Destino"
                value={formData.destino}
                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                fullWidth
                required
              />

              <Autocomplete
                options={drivers}
                getOptionLabel={(driver) => `${driver.nombre} ${driver.apellido}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                value={drivers.find(d => d.id.toString() === formData.conductorId) || null}
                onChange={(_, value) => setFormData({ ...formData, conductorId: value?.id.toString() || '' })}
                renderOption={({ key: _key, ...props }, option) => (
                  <li key={option.id} {...props}>
                    {`${option.nombre} ${option.apellido}`}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Conductor" required />
                )}
              />

              <Autocomplete
                options={vehicles}
                getOptionLabel={(vehicle) => `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})`}
                value={vehicles.find(v => v.id.toString() === formData.vehiculoId) || null}
                onChange={(_, value) => handleSelectVehicle(value)}
                renderOption={({ key: _key, ...props }, option) => (
                  <li key={option.id} {...props}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <span>{`${option.marca} ${option.modelo} (${option.patente})`}</span>
                      {renderVehiculoEstadoChip(option.estado)}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Vehículo" required />
                )}
              />

              {formData.vehiculoId &&
                formData.estado === 'PLANIFICADO' &&
                getSelectedVehicle(formData.vehiculoId) &&
                getSelectedVehicle(formData.vehiculoId)!.estado !== 'DISPONIBLE' && (
                  <Alert severity="info">
                    Este vehículo está actualmente en uso. Podrás iniciarlo cuando esté disponible.
                  </Alert>
                )}

              <TextField
                label="Fecha y Hora"
                type="datetime-local"
                value={formData.fechaViaje}
                onChange={(e) => setFormData({ ...formData, fechaViaje: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado"
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoViaje })}
                >
                  <MenuItem value="PLANIFICADO">Planificado</MenuItem>
                  <MenuItem value="EN_CURSO">En Ruta</MenuItem>
                  <MenuItem value="COMPLETADO">Completado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />

              <Divider />

              {/* Deliveries section */}
              <Typography variant="subtitle1" fontWeight="bold">
                Entregas ({tripDeliveries.length})
              </Typography>

              {tripDeliveries.map((delivery, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{delivery.direccionEntrega}</Typography>
                      {!delivery.id && (
                        <IconButton size="small" onClick={() => handleRemoveDelivery(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}

              <Autocomplete
                options={facturasDisponibles}
                getOptionLabel={(factura) => `${factura.numeroDocumento} - ${factura.clienteNombre}`}
                value={facturas.find(f => f.id.toString() === newDelivery.facturaId) || null}
                onChange={(_, value) => { void handleSelectFacturaForDelivery(value); }}
                renderInput={(params) => (
                  <TextField {...params} label="Factura" size="small" />
                )}
              />

              <TextField
                label="Dirección de Entrega"
                value={newDelivery.direccionEntrega}
                onChange={(e) => setNewDelivery({ ...newDelivery, direccionEntrega: e.target.value })}
                fullWidth
                size="small"
                placeholder="Calle 123, Ciudad"
                helperText="Se autocompleta con la dirección del cliente al elegir la factura. Editable."
              />

              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddDelivery}
              >
                Agregar Entrega
              </Button>

              <Divider />

              <Box display="flex" gap={2}>
                <Button
                  onClick={() => setDialogOpen(false)}
                  sx={{ flex: 1 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{ flex: 1 }}
                >
                  {editingTrip ? 'Actualizar' : 'Crear'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </SwipeableDrawer>
      )}

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
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab label="Info" />
                <Tab label={`Entregas (${getTripDeliveries(selectedTrip.id).length})`} />
                <Tab label={`Facturas (${getFacturasByTrip(selectedTrip.id).length})`} />
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
                          <Typography variant="caption" color="text.secondary">
                            {new Date(delivery.fechaEntrega).toLocaleString()}
                          </Typography>
                          {detalles?.equipos?.length > 0 && (
                            <Box mt={1}>
                              <Typography variant="caption" color="primary">
                                {detalles.equipos.length} equipos
                              </Typography>
                            </Box>
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
                        <Typography variant="caption" color="text.secondary">
                          {factura.detalles.length} items
                        </Typography>
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
                        {getTripDeliveries(selectedTrip.id).map((delivery, index) => (
                          <ListItem key={delivery.id} disablePadding>
                            <ListItemText
                              primary={`Entrega #${index + 1}`}
                              secondary={delivery.direccionEntrega}
                            />
                            <Chip
                              label={delivery.estado}
                              size="small"
                              color={delivery.estado === 'ENTREGADA' ? 'success' : 'warning'}
                            />
                          </ListItem>
                        ))}
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

      {/* Modal: vehículo seleccionado no está DISPONIBLE */}
      <Dialog
        open={vehiculoEstadoDialog.open}
        onClose={() => setVehiculoEstadoDialog(prev => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {vehiculoEstadoDialog.severity === 'error'
              ? <ErrorOutlineIcon sx={{ fontSize: 40, color: 'error.main' }} />
              : <InfoOutlinedIcon sx={{ fontSize: 40, color: 'info.main' }} />}
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {vehiculoEstadoDialog.severity === 'error'
                  ? 'Vehículo no disponible'
                  : 'Vehículo en uso'}
              </Typography>
              {vehiculoEstadoDialog.vehiculo && (
                <Typography variant="caption" color="text.secondary">
                  {vehiculoEstadoDialog.vehiculo.marca} {vehiculoEstadoDialog.vehiculo.modelo} ({vehiculoEstadoDialog.vehiculo.patente})
                </Typography>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {vehiculoEstadoDialog.severity === 'error'
              ? `El vehículo está ${VEHICULO_ESTADO_LABEL[vehiculoEstadoDialog.vehiculo?.estado || ''] || vehiculoEstadoDialog.vehiculo?.estado}. No se puede iniciar un viaje con un vehículo que no esté DISPONIBLE.`
              : 'Este vehículo está en uso actualmente. Podés planificar el viaje, y podrá salir cuando esté libre.'}
          </Typography>
          {vehiculoEstadoDialog.vehiculo?.estado && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary">Estado actual: </Typography>
              {renderVehiculoEstadoChip(vehiculoEstadoDialog.vehiculo.estado)}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            color={vehiculoEstadoDialog.severity === 'error' ? 'error' : 'primary'}
            fullWidth
            onClick={() => setVehiculoEstadoDialog(prev => ({ ...prev, open: false }))}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: vehículo en uso por otro viaje */}
      <Dialog
        open={vehicleInUseDialogOpen}
        onClose={() => setVehicleInUseDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <WarningAmberIcon sx={{ fontSize: 40, color: 'warning.main' }} />
            <Typography variant="h6" fontWeight={600}>Vehículo ya asignado</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {(() => {
            const tripUsing = getTripUsingVehicle(formData.vehiculoId);
            return (
              <Typography variant="body2">
                Este vehículo está actualmente asignado al
                {' '}<strong>Viaje #{tripUsing?.id}</strong>
                {tripUsing?.destino ? ` (destino: ${tripUsing.destino})` : ''}.
                {' '}Podés planificar este viaje y saldrá cuando el vehículo quede libre.
              </Typography>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setVehicleInUseDialogOpen(false)}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default TripsPage2;
