import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
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
  Tabs,
  Tab,
  Badge,
  TablePagination,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Fab,
  SwipeableDrawer,
  Collapse,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as DeliveryIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Route as RouteIcon,
  Person as ClientIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Map as MapIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Inventory as EquipmentIcon,
} from '@mui/icons-material';
import type { EntregaViaje, Viaje, Cliente, EstadoEntrega, DocumentoComercial, EstadoAsignacionEquipo } from '../../types';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import { clienteApi } from '../../api/services/clienteApi';
import { documentoApi } from '../../api/services/documentoApi';
import { viajeApi } from '../../api/services/viajeApi';

// Custom hook for responsive breakpoints
const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  return { isMobile, isTablet, isDesktop };
};

// Helper function to get color for estadoAsignacion
const getEstadoAsignacionColor = (estado: EstadoAsignacionEquipo | null | undefined): 'default' | 'warning' | 'info' | 'secondary' | 'success' => {
  if (!estado) return 'default';
  const colorMap: Record<EstadoAsignacionEquipo, 'default' | 'warning' | 'info' | 'secondary' | 'success'> = {
    DISPONIBLE: 'default',
    RESERVADO: 'warning',
    FACTURADO: 'info',
    EN_TRANSITO: 'secondary',
    ENTREGADO: 'success',
  };
  return colorMap[estado] || 'default';
};

const getEstadoAsignacionLabel = (estado: EstadoAsignacionEquipo | null | undefined): string => {
  if (!estado) return 'No especificado';
  const labelMap: Record<EstadoAsignacionEquipo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    FACTURADO: 'Facturado',
    EN_TRANSITO: 'En Transito',
    ENTREGADO: 'Entregado',
  };
  return labelMap[estado] || estado;
};

// Bottom Sheet component for mobile
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

  if (!isMobile) return null;

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

      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        {children}
      </Box>

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

// Predefined rejection reasons
const REJECTION_REASONS = [
  'Cliente ausente',
  'Direccion incorrecta',
  'Rechazado por cliente',
  'Horario no disponible',
  'Zona inaccesible',
];

const DeliveriesPage2: React.FC = () => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [deliveries, setDeliveries] = useState<EntregaViaje[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [trips, setTrips] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<EntregaViaje | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<EntregaViaje | null>(null);
  const [selectedDeliveryDetails, setSelectedDeliveryDetails] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);

  // Expanded card state for mobile
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Details tab state
  const [detailsTab, setDetailsTab] = useState(0);

  // Estados para modal de confirmar entrega
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDeliveryId, setConfirmDeliveryId] = useState<number | null>(null);
  const [receptorData, setReceptorData] = useState({
    nombre: '',
    dni: '',
    observaciones: ''
  });

  // Estados para modal de rechazar entrega
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDeliveryId, setRejectDeliveryId] = useState<number | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoEntrega>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form data
  const [formData, setFormData] = useState({
    viajeId: '',
    ventaId: '',
    direccionEntrega: '',
    fechaEntrega: '',
    estado: 'PENDIENTE' as EstadoEntrega,
    observaciones: '',
    receptorNombre: '',
    receptorDni: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let deliveriesData: EntregaViaje[] = [];
      let clientsData: Cliente[] = [];
      let facturasData: DocumentoComercial[] = [];
      let tripsData: Viaje[] = [];
      const errors: string[] = [];

      try {
        deliveriesData = await entregaViajeApi.getAll();
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Entregas: ${errorMsg}`);
      }

      try {
        clientsData = await clienteApi.getAll();
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Clientes: ${errorMsg}`);
      }

      try {
        facturasData = await documentoApi.getByTipo('FACTURA');
        facturasData = facturasData.filter(f => f.numeroDocumento?.startsWith('FAC-'));
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Facturas: ${errorMsg}`);
      }

      try {
        tripsData = await viajeApi.getAll();
      } catch (err) {
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`Viajes: ${errorMsg}`);
      }

      if (errors.length > 0) {
        setError(errors.join(' | '));
      }

      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setFacturas(Array.isArray(facturasData) ? facturasData : []);
      setTrips(Array.isArray(tripsData) ? tripsData : []);

    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries
    .filter(delivery => {
      const matchesStatus = statusFilter === 'all' || delivery.estado === statusFilter;
      const matchesDate = !dateFilter ||
        new Date(delivery.fechaEntrega).toDateString() === new Date(dateFilter).toDateString();
      return matchesStatus && matchesDate;
    })
    .sort((a, b) => b.id - a.id);

  const paginatedDeliveries = filteredDeliveries.slice(
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

  const pendingDeliveries = deliveries.filter(d => d.estado === 'PENDIENTE');
  const deliveredCount = deliveries.filter(d => d.estado === 'ENTREGADA').length;
  const unassignedDeliveries = deliveries.filter(d => !d.viajeId);

  const handleAdd = () => {
    setEditingDelivery(null);
    setFormData({
      viajeId: '',
      ventaId: '',
      direccionEntrega: '',
      fechaEntrega: '',
      estado: 'PENDIENTE',
      observaciones: '',
      receptorNombre: '',
      receptorDni: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (delivery: EntregaViaje) => {
    setEditingDelivery(delivery);
    setFormData({
      viajeId: delivery.viajeId?.toString() || '',
      ventaId: delivery.ventaId?.toString() || '',
      direccionEntrega: delivery.direccionEntrega,
      fechaEntrega: delivery.fechaEntrega.slice(0, 16),
      estado: delivery.estado,
      observaciones: delivery.observaciones || '',
      receptorNombre: delivery.receptorNombre || '',
      receptorDni: delivery.receptorDni || '',
    });
    setDialogOpen(true);
  };

  const handleViewDetails = async (delivery: EntregaViaje) => {
    setSelectedDelivery(delivery);
    setDetailsTab(0);
    setDetailsDialogOpen(true);

    try {
      const detalles = await entregaViajeApi.getDetalles(delivery.id);
      setSelectedDeliveryDetails(detalles);
    } catch (err) {
      setSelectedDeliveryDetails(null);
    }
  };

  const handleSave = async () => {
    try {
      const entregaData: Partial<EntregaViaje> = {
        viajeId: formData.viajeId ? parseInt(formData.viajeId) : undefined,
        ventaId: formData.ventaId ? parseInt(formData.ventaId) : undefined,
        direccionEntrega: formData.direccionEntrega,
        fechaEntrega: new Date(formData.fechaEntrega).toISOString(),
        estado: formData.estado,
        observaciones: formData.observaciones,
        receptorNombre: formData.receptorNombre || undefined,
        receptorDni: formData.receptorDni || undefined,
      };

      if (editingDelivery) {
        await entregaViajeApi.update(editingDelivery.id, entregaData);
      } else {
        await entregaViajeApi.create(entregaData);
      }

      await loadData();
      setDialogOpen(false);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al guardar la entrega');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Eliminar esta entrega?')) {
      try {
        await entregaViajeApi.delete(id);
        await loadData();
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error?.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const openConfirmDialog = (id: number) => {
    setConfirmDeliveryId(id);
    setReceptorData({ nombre: '', dni: '', observaciones: '' });
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!confirmDeliveryId) return;

    try {
      if (!receptorData.nombre.trim()) {
        setError('El nombre del receptor es obligatorio');
        return;
      }

      await entregaViajeApi.confirmarEntrega(
        confirmDeliveryId,
        'ENTREGADA',
        receptorData.nombre,
        receptorData.dni,
        receptorData.observaciones || undefined
      );

      setConfirmDialogOpen(false);
      setConfirmDeliveryId(null);
      setReceptorData({ nombre: '', dni: '', observaciones: '' });
      setError(null);
      await loadData();
      setDetailsDialogOpen(false);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al confirmar');
    }
  };

  const openRejectDialog = (id: number) => {
    setRejectDeliveryId(id);
    setRejectMotivo('');
    setRejectDialogOpen(true);
  };

  const handleRejectDelivery = async () => {
    if (!rejectDeliveryId) return;

    try {
      if (!rejectMotivo.trim()) {
        setError('El motivo es obligatorio');
        return;
      }

      await entregaViajeApi.confirmarEntrega(
        rejectDeliveryId,
        'NO_ENTREGADA',
        'N/A',
        'N/A',
        `RECHAZADO: ${rejectMotivo}`
      );

      setRejectDialogOpen(false);
      setRejectDeliveryId(null);
      setRejectMotivo('');
      setError(null);
      await loadData();
      setDetailsDialogOpen(false);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al rechazar');
    }
  };

  const getStatusChip = (estado: EstadoEntrega) => {
    const statusConfig = {
      PENDIENTE: { label: 'Pendiente', color: 'warning' as const },
      ENTREGADA: { label: 'Entregada', color: 'success' as const },
      NO_ENTREGADA: { label: 'No Entregada', color: 'error' as const },
    };
    const config = statusConfig[estado];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getFacturaByDelivery = (delivery: EntregaViaje): DocumentoComercial | undefined => {
    let facturaId: number | undefined;
    // @ts-ignore
    if (delivery.documentoComercialId) facturaId = delivery.documentoComercialId;
    // @ts-ignore
    else if (delivery.documentoComercial?.id) facturaId = delivery.documentoComercial.id;
    else if (delivery.ventaId) facturaId = delivery.ventaId;
    else if (delivery.venta?.id) facturaId = delivery.venta.id;

    if (!facturaId) return undefined;
    return facturas.find(f => f.id === facturaId);
  };

  const getClientName = (delivery: EntregaViaje): string => {
    const factura = getFacturaByDelivery(delivery);
    if (!factura) return 'Sin Factura';

    if (factura.clienteNombre?.trim()) return factura.clienteNombre;

    const cliente = clients.find(c => c.id === factura.clienteId);
    if (cliente) {
      if (cliente.razonSocial?.trim()) return cliente.razonSocial;
      const parts = [cliente.nombre, cliente.apellido].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : 'Sin nombre';
    }

    return 'Cliente no disponible';
  };

  const getVentaNumero = (delivery: EntregaViaje): string => {
    const factura = getFacturaByDelivery(delivery);
    return factura ? (factura.numeroDocumento || `FAC-${factura.id}`) : 'Sin Factura';
  };

  const getTripNumber = (viajeId: number | null | undefined) => {
    if (!viajeId) return 'Sin asignar';
    const trip = trips.find(t => t.id === viajeId);
    return trip ? `Viaje #${trip.id}` : 'N/A';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Mobile Delivery Card Component
  const MobileDeliveryCard = ({ delivery }: { delivery: EntregaViaje }) => {
    const isExpanded = expandedCard === delivery.id;

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
            onClick={() => setExpandedCard(isExpanded ? null : delivery.id)}
            sx={{ cursor: 'pointer' }}
          >
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: 200 }}>
                {getClientName(delivery)}
              </Typography>
              <Typography variant="caption" color="primary.main">
                {getVentaNumero(delivery)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusChip(delivery.estado)}
              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Quick info */}
          <Box mt={1.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(delivery.fechaEntrega).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {getTripNumber(delivery.viajeId)}
              </Typography>
            </Stack>
          </Box>

          {/* Expanded content */}
          <Collapse in={isExpanded}>
            <Divider sx={{ my: 1.5 }} />

            <Box display="flex" alignItems="flex-start" gap={1} mb={1.5}>
              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                {delivery.direccionEntrega}
              </Typography>
            </Box>

            {delivery.observaciones && (
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                {delivery.observaciones}
              </Typography>
            )}

            {/* Actions */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              pt={1.5}
              borderTop="1px solid"
              borderColor="divider"
            >
              <IconButton
                onClick={(e) => { e.stopPropagation(); handleViewDetails(delivery); }}
                sx={{ minWidth: 44, minHeight: 44 }}
              >
                <ViewIcon />
              </IconButton>

              {delivery.estado === 'PENDIENTE' && (
                <Box display="flex" gap={1}>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); openConfirmDialog(delivery.id); }}
                    color="success"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); openRejectDialog(delivery.id); }}
                    color="error"
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <CancelIcon />
                  </IconButton>
                  <IconButton
                    onClick={(e) => { e.stopPropagation(); handleEdit(delivery); }}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              )}

              {delivery.estado !== 'PENDIENTE' && (
                <IconButton
                  onClick={(e) => { e.stopPropagation(); handleEdit(delivery); }}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <EditIcon />
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
      {/* Header - Sin card de fondo */}
      <Box
        sx={{ mb: 3 }}
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
      >
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          display="flex"
          alignItems="center"
          gap={1}
        >
          <DeliveryIcon />
          Control de Entregas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          fullWidth={isMobile}
        >
          Nueva Entrega
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards - Grid estático */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <Badge badgeContent={pendingDeliveries.length} color="warning">
                  <ScheduleIcon color="warning" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </Badge>
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>{pendingDeliveries.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <CheckIcon color="success" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>{deliveredCount}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Entregados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                <Badge badgeContent={unassignedDeliveries.length} color="error">
                  <CancelIcon color="error" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </Badge>
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'}>{unassignedDeliveries.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sin Asignar
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
        >
          <Tab label="Todas" />
          <Tab
            label={
              <Badge badgeContent={pendingDeliveries.length} color="warning" sx={{ '& .MuiBadge-badge': { right: -12, top: 0 } }}>
                Pendientes
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {/* Tab 0: All Deliveries */}
      {tabValue === 0 && (
        <>
          {/* Filters */}
          <Box mb={2}>
            {isMobile ? (
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'PENDIENTE', label: 'Pendientes' },
                  { value: 'ENTREGADA', label: 'Entregadas' },
                  { value: 'NO_ENTREGADA', label: 'No Entregadas' },
                ].map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => setStatusFilter(option.value as 'all' | EstadoEntrega)}
                    color={statusFilter === option.value ? 'primary' : 'default'}
                    variant={statusFilter === option.value ? 'filled' : 'outlined'}
                    sx={{ minHeight: 36 }}
                  />
                ))}
              </Stack>
            ) : (
              <Box display="flex" gap={2} alignItems="center">
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Estado"
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | EstadoEntrega)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="PENDIENTE">Pendientes</MenuItem>
                    <MenuItem value="ENTREGADA">Entregadas</MenuItem>
                    <MenuItem value="NO_ENTREGADA">No Entregadas</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Fecha"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ width: 180 }}
                />
              </Box>
            )}
          </Box>

          {/* Delivery List */}
          {isMobile ? (
            <Stack spacing={1.5}>
              {paginatedDeliveries.map((delivery) => (
                <MobileDeliveryCard key={delivery.id} delivery={delivery} />
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Paper sx={{ overflowX: 'auto' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ bgcolor: 'grey.50' }}>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Cliente</Box>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Factura</Box>
                        {!isTablet && <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Direccion</Box>}
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Fecha</Box>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Viaje</Box>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontWeight: 'bold' }}>Estado</Box>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'center', fontWeight: 'bold' }}>Acciones</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {paginatedDeliveries.map((delivery) => (
                        <Box
                          component="tr"
                          key={delivery.id}
                          sx={{
                            '&:hover': { bgcolor: 'grey.50' },
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <ClientIcon sx={{ fontSize: 16 }} />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {getClientName(delivery)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2">{getVentaNumero(delivery)}</Typography>
                          </Box>
                          {!isTablet && (
                            <Box component="td" sx={{ p: 1.5 }}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                {delivery.direccionEntrega}
                              </Typography>
                            </Box>
                          )}
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2">
                              {new Date(delivery.fechaEntrega).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Typography variant="body2">{getTripNumber(delivery.viajeId)}</Typography>
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            {getStatusChip(delivery.estado)}
                          </Box>
                          <Box component="td" sx={{ p: 1.5 }}>
                            <Box display="flex" justifyContent="center" gap={0.5}>
                              <IconButton onClick={() => handleViewDetails(delivery)} size="small">
                                <ViewIcon fontSize="small" />
                              </IconButton>
                              {delivery.estado === 'PENDIENTE' && (
                                <>
                                  <IconButton onClick={() => openConfirmDialog(delivery.id)} size="small" color="success">
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton onClick={() => openRejectDialog(delivery.id)} size="small" color="error">
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton onClick={() => handleEdit(delivery)} size="small">
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredDeliveries.length}
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
        </>
      )}

      {/* Tab 1: Pending Deliveries */}
      {tabValue === 1 && (
        <>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
            Entregas Pendientes de Asignacion
          </Typography>

          {isMobile ? (
            <Stack spacing={1.5}>
              {pendingDeliveries.map((delivery) => (
                <Card key={delivery.id} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {getClientName(delivery)}
                    </Typography>
                    <Typography variant="caption" color="primary.main" display="block" mb={1}>
                      {getVentaNumero(delivery)}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                      <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {delivery.direccionEntrega}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      {new Date(delivery.fechaEntrega).toLocaleDateString()}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => handleEdit(delivery)}
                      sx={{ minHeight: 44 }}
                    >
                      Asignar a Viaje
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent>
                <Paper sx={{ overflowX: 'auto' }}>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                    <Box component="thead">
                      <Box component="tr" sx={{ bgcolor: 'grey.50' }}>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Cliente</Box>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Factura</Box>
                        {!isTablet && <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Direccion</Box>}
                        <Box component="th" sx={{ p: 1.5, textAlign: 'left' }}>Fecha</Box>
                        <Box component="th" sx={{ p: 1.5, textAlign: 'center' }}>Acciones</Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {pendingDeliveries.map((delivery) => (
                        <Box component="tr" key={delivery.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Box component="td" sx={{ p: 1.5 }}>{getClientName(delivery)}</Box>
                          <Box component="td" sx={{ p: 1.5 }}>{getVentaNumero(delivery)}</Box>
                          {!isTablet && <Box component="td" sx={{ p: 1.5 }}>{delivery.direccionEntrega}</Box>}
                          <Box component="td" sx={{ p: 1.5 }}>{new Date(delivery.fechaEntrega).toLocaleDateString()}</Box>
                          <Box component="td" sx={{ p: 1.5, textAlign: 'center' }}>
                            <Button size="small" variant="outlined" onClick={() => handleEdit(delivery)}>
                              Asignar
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </CardContent>
            </Card>
          )}
        </>
      )}

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
          title={editingDelivery ? 'Editar Entrega' : 'Nueva Entrega'}
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button
                onClick={() => setDialogOpen(false)}
                sx={{ flex: 1, minHeight: 48 }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{ flex: 1, minHeight: 48 }}
              >
                {editingDelivery ? 'Actualizar' : 'Crear'}
              </Button>
            </Stack>
          }
        >
          <Stack spacing={2.5}>
            <Autocomplete
              options={facturas}
              getOptionLabel={(f) => `${f.numeroDocumento || `FAC-${f.id}`} - ${f.clienteNombre || 'Sin cliente'}`}
              value={facturas.find(f => f.id.toString() === formData.ventaId) || null}
              onChange={(_, value) => setFormData({ ...formData, ventaId: value?.id.toString() || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Factura" size="medium" InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }} />
              )}
            />

            <Autocomplete
              options={trips}
              getOptionLabel={(t) => `Viaje #${t.id} - ${t.destino}`}
              value={trips.find(t => t.id.toString() === formData.viajeId) || null}
              onChange={(_, value) => setFormData({ ...formData, viajeId: value?.id.toString() || '' })}
              renderInput={(params) => (
                <TextField {...params} label="Viaje" size="medium" InputProps={{ ...params.InputProps, sx: { minHeight: 56 } }} />
              )}
            />

            <TextField
              label="Direccion de Entrega"
              value={formData.direccionEntrega}
              onChange={(e) => setFormData({ ...formData, direccionEntrega: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              InputProps={{ sx: { minHeight: 80 } }}
            />

            <TextField
              label="Fecha de Entrega"
              type="datetime-local"
              value={formData.fechaEntrega}
              onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </BottomSheet>
      )}

      {/* Desktop Drawer for Create/Edit */}
      {!isMobile && (
        <SwipeableDrawer
          anchor="right"
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onOpen={() => {}}
          PaperProps={{ sx: { width: isTablet ? '80%' : 450 } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                {editingDelivery ? 'Editar Entrega' : 'Nueva Entrega'}
              </Typography>
              <IconButton onClick={() => setDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={2.5}>
              <Autocomplete
                options={facturas}
                getOptionLabel={(f) => `${f.numeroDocumento || `FAC-${f.id}`} - ${f.clienteNombre || 'Sin cliente'}`}
                value={facturas.find(f => f.id.toString() === formData.ventaId) || null}
                onChange={(_, value) => setFormData({ ...formData, ventaId: value?.id.toString() || '' })}
                renderInput={(params) => <TextField {...params} label="Factura" />}
              />

              <Autocomplete
                options={trips}
                getOptionLabel={(t) => `Viaje #${t.id} - ${t.destino}`}
                value={trips.find(t => t.id.toString() === formData.viajeId) || null}
                onChange={(_, value) => setFormData({ ...formData, viajeId: value?.id.toString() || '' })}
                renderInput={(params) => <TextField {...params} label="Viaje" />}
              />

              <TextField
                label="Direccion de Entrega"
                value={formData.direccionEntrega}
                onChange={(e) => setFormData({ ...formData, direccionEntrega: e.target.value })}
                fullWidth
                required
                multiline
                rows={2}
              />

              <TextField
                label="Fecha de Entrega"
                type="datetime-local"
                value={formData.fechaEntrega}
                onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado"
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoEntrega })}
                >
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="ENTREGADA">Entregada</MenuItem>
                  <MenuItem value="NO_ENTREGADA">No Entregada</MenuItem>
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

              <Box display="flex" gap={2}>
                <Button onClick={() => setDialogOpen(false)} sx={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button variant="contained" onClick={handleSave} sx={{ flex: 1 }}>
                  {editingDelivery ? 'Actualizar' : 'Crear'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </SwipeableDrawer>
      )}

      {/* Details Bottom Sheet / Drawer */}
      {isMobile ? (
        <BottomSheet
          open={detailsDialogOpen}
          onClose={() => { setDetailsDialogOpen(false); setSelectedDeliveryDetails(null); }}
          title="Detalles de Entrega"
          actions={
            selectedDelivery?.estado === 'PENDIENTE' ? (
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => openConfirmDialog(selectedDelivery.id)}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  Confirmar Entrega
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => openRejectDialog(selectedDelivery.id)}
                  fullWidth
                  sx={{ minHeight: 48 }}
                >
                  No Entregada
                </Button>
              </Stack>
            ) : (
              <Button
                variant="contained"
                onClick={() => { setDetailsDialogOpen(false); setSelectedDeliveryDetails(null); }}
                fullWidth
                sx={{ minHeight: 48 }}
              >
                Cerrar
              </Button>
            )
          }
        >
          {selectedDelivery && (
            <Box>
              <Tabs
                value={detailsTab}
                onChange={(_, v) => setDetailsTab(v)}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab label="Info" />
                <Tab label={`Equipos (${selectedDeliveryDetails?.equipos?.length || 0})`} />
              </Tabs>

              {detailsTab === 0 && (
                <Stack spacing={2}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Cliente</Typography>
                          <Typography variant="body2" fontWeight="medium">{getClientName(selectedDelivery)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Factura</Typography>
                          <Typography variant="body2">{getVentaNumero(selectedDelivery)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Viaje</Typography>
                          <Typography variant="body2">{getTripNumber(selectedDelivery.viajeId)}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" color="text.secondary">Estado:</Typography>
                          {getStatusChip(selectedDelivery.estado)}
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Fecha</Typography>
                          <Typography variant="body2">{new Date(selectedDelivery.fechaEntrega).toLocaleString()}</Typography>
                        </Box>
                        {selectedDelivery.receptorNombre && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Receptor</Typography>
                            <Typography variant="body2">{selectedDelivery.receptorNombre}</Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                        <LocationIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedDelivery.direccionEntrega}</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<MapIcon />}
                        onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(selectedDelivery.direccionEntrega)}`, '_blank')}
                        fullWidth
                        sx={{ minHeight: 44 }}
                      >
                        Ver en Maps
                      </Button>
                    </CardContent>
                  </Card>

                  {selectedDelivery.observaciones && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="caption" color="text.secondary">Observaciones</Typography>
                        <Typography variant="body2">{selectedDelivery.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              )}

              {detailsTab === 1 && (
                <Stack spacing={1.5}>
                  {selectedDeliveryDetails?.equipos?.map((equipo: any) => {
                    let estadoAsignacion = equipo.estadoAsignacion;
                    if (!estadoAsignacion) {
                      estadoAsignacion = selectedDelivery.estado === 'ENTREGADA' ? 'ENTREGADO' : 'EN_TRANSITO';
                    }

                    return (
                      <Card key={equipo.id} variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                #{equipo.numeroHeladera || equipo.id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {equipo.modelo || 'N/A'} - {equipo.tipo || 'N/A'}
                              </Typography>
                              {equipo.color && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Color: {equipo.color}
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label={getEstadoAsignacionLabel(estadoAsignacion)}
                              size="small"
                              color={getEstadoAsignacionColor(estadoAsignacion)}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {(!selectedDeliveryDetails?.equipos || selectedDeliveryDetails.equipos.length === 0) && (
                    <Box textAlign="center" py={4}>
                      <EquipmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No hay equipos en esta entrega</Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>
          )}
        </BottomSheet>
      ) : (
        <SwipeableDrawer
          anchor="right"
          open={detailsDialogOpen}
          onClose={() => { setDetailsDialogOpen(false); setSelectedDeliveryDetails(null); }}
          onOpen={() => {}}
          PaperProps={{ sx: { width: isTablet ? '90%' : 550 } }}
        >
          {selectedDelivery && (
            <Box sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ViewIcon color="primary" />
                  <Typography variant="h6">Detalles de Entrega</Typography>
                  {getStatusChip(selectedDelivery.estado)}
                </Box>
                <IconButton onClick={() => { setDetailsDialogOpen(false); setSelectedDeliveryDetails(null); }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Informacion</Typography>
                      <Stack spacing={1}>
                        <Typography variant="body2"><strong>Cliente:</strong> {getClientName(selectedDelivery)}</Typography>
                        <Typography variant="body2"><strong>Factura:</strong> {getVentaNumero(selectedDelivery)}</Typography>
                        <Typography variant="body2"><strong>Viaje:</strong> {getTripNumber(selectedDelivery.viajeId)}</Typography>
                        <Typography variant="body2"><strong>Fecha:</strong> {new Date(selectedDelivery.fechaEntrega).toLocaleString()}</Typography>
                        {selectedDelivery.receptorNombre && (
                          <Typography variant="body2"><strong>Receptor:</strong> {selectedDelivery.receptorNombre}</Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Direccion</Typography>
                      <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                        <LocationIcon sx={{ fontSize: 18, mt: 0.3, color: 'text.secondary' }} />
                        <Typography variant="body2">{selectedDelivery.direccionEntrega}</Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MapIcon />}
                        onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(selectedDelivery.direccionEntrega)}`, '_blank')}
                        fullWidth
                      >
                        Ver en Maps
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {selectedDeliveryDetails?.equipos?.length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Equipos ({selectedDeliveryDetails.equipos.length})
                        </Typography>
                        <List dense>
                          {selectedDeliveryDetails.equipos.map((equipo: any) => {
                            let estadoAsignacion = equipo.estadoAsignacion;
                            if (!estadoAsignacion) {
                              estadoAsignacion = selectedDelivery.estado === 'ENTREGADA' ? 'ENTREGADO' : 'EN_TRANSITO';
                            }
                            return (
                              <ListItem key={equipo.id} divider>
                                <ListItemText
                                  primary={`#${equipo.numeroHeladera || equipo.id} - ${equipo.modelo || 'N/A'}`}
                                  secondary={`${equipo.tipo || ''} ${equipo.color ? `| ${equipo.color}` : ''}`}
                                />
                                <Chip
                                  label={getEstadoAsignacionLabel(estadoAsignacion)}
                                  size="small"
                                  color={getEstadoAsignacionColor(estadoAsignacion)}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {selectedDelivery.observaciones && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Observaciones</Typography>
                        <Typography variant="body2">{selectedDelivery.observaciones}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>

              {selectedDelivery.estado === 'PENDIENTE' && (
                <Box display="flex" gap={2} mt={3}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => openConfirmDialog(selectedDelivery.id)}
                    fullWidth
                  >
                    Confirmar Entrega
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => openRejectDialog(selectedDelivery.id)}
                    fullWidth
                  >
                    No Entregada
                  </Button>
                </Box>
              )}

              <Box mt={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { setDetailsDialogOpen(false); setSelectedDeliveryDetails(null); }}
                >
                  Cerrar
                </Button>
              </Box>
            </Box>
          )}
        </SwipeableDrawer>
      )}

      {/* Confirm Delivery Bottom Sheet / Dialog */}
      {isMobile ? (
        <BottomSheet
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          title="Confirmar Entrega"
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setConfirmDialogOpen(false)} sx={{ flex: 1, minHeight: 48 }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleConfirmDelivery}
                disabled={!receptorData.nombre.trim()}
                sx={{ flex: 1, minHeight: 48 }}
              >
                Confirmar
              </Button>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <Alert severity="info">
              Los equipos cambiaran a estado <strong>ENTREGADO</strong>.
            </Alert>

            <TextField
              label="Nombre del Receptor *"
              value={receptorData.nombre}
              onChange={(e) => setReceptorData({ ...receptorData, nombre: e.target.value })}
              fullWidth
              required
              placeholder="Ej: Juan Perez"
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="DNI del Receptor"
              value={receptorData.dni}
              onChange={(e) => setReceptorData({ ...receptorData, dni: e.target.value })}
              fullWidth
              placeholder="Ej: 12345678"
              inputMode="numeric"
              InputProps={{ sx: { minHeight: 56 } }}
            />

            <TextField
              label="Observaciones"
              value={receptorData.observaciones}
              onChange={(e) => setReceptorData({ ...receptorData, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Notas adicionales..."
            />
          </Stack>
        </BottomSheet>
      ) : (
        <SwipeableDrawer
          anchor="right"
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onOpen={() => {}}
          PaperProps={{ sx: { width: 400 } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <CheckIcon color="success" />
              <Typography variant="h6">Confirmar Entrega</Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Los equipos cambiaran a estado <strong>ENTREGADO</strong>.
            </Alert>

            <Stack spacing={2}>
              <TextField
                label="Nombre del Receptor *"
                value={receptorData.nombre}
                onChange={(e) => setReceptorData({ ...receptorData, nombre: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="DNI del Receptor"
                value={receptorData.dni}
                onChange={(e) => setReceptorData({ ...receptorData, dni: e.target.value })}
                fullWidth
              />
              <TextField
                label="Observaciones"
                value={receptorData.observaciones}
                onChange={(e) => setReceptorData({ ...receptorData, observaciones: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />

              <Box display="flex" gap={2} mt={2}>
                <Button onClick={() => setConfirmDialogOpen(false)} sx={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleConfirmDelivery}
                  disabled={!receptorData.nombre.trim()}
                  sx={{ flex: 1 }}
                >
                  Confirmar
                </Button>
              </Box>
            </Stack>
          </Box>
        </SwipeableDrawer>
      )}

      {/* Reject Delivery Bottom Sheet / Dialog */}
      {isMobile ? (
        <BottomSheet
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          title="Marcar como No Entregada"
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setRejectDialogOpen(false)} sx={{ flex: 1, minHeight: 48 }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleRejectDelivery}
                disabled={!rejectMotivo.trim()}
                sx={{ flex: 1, minHeight: 48 }}
              >
                Rechazar
              </Button>
            </Stack>
          }
        >
          <Stack spacing={2}>
            <Alert severity="warning">
              Indique el motivo por el cual no se pudo entregar.
            </Alert>

            <Typography variant="subtitle2">Motivos rapidos:</Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {REJECTION_REASONS.map((reason) => (
                <Chip
                  key={reason}
                  label={reason}
                  onClick={() => setRejectMotivo(reason)}
                  color={rejectMotivo === reason ? 'primary' : 'default'}
                  variant={rejectMotivo === reason ? 'filled' : 'outlined'}
                  sx={{ minHeight: 36 }}
                />
              ))}
            </Box>

            <TextField
              label="Motivo del Rechazo *"
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              placeholder="Describa el motivo..."
            />
          </Stack>
        </BottomSheet>
      ) : (
        <SwipeableDrawer
          anchor="right"
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onOpen={() => {}}
          PaperProps={{ sx: { width: 400 } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <CancelIcon color="error" />
              <Typography variant="h6">Marcar como No Entregada</Typography>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              Indique el motivo por el cual no se pudo entregar.
            </Alert>

            <Stack spacing={2}>
              <Typography variant="subtitle2">Motivos rapidos:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {REJECTION_REASONS.map((reason) => (
                  <Chip
                    key={reason}
                    label={reason}
                    onClick={() => setRejectMotivo(reason)}
                    color={rejectMotivo === reason ? 'primary' : 'default'}
                    variant={rejectMotivo === reason ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>

              <TextField
                label="Motivo del Rechazo *"
                value={rejectMotivo}
                onChange={(e) => setRejectMotivo(e.target.value)}
                fullWidth
                multiline
                rows={4}
                required
              />

              <Box display="flex" gap={2} mt={2}>
                <Button onClick={() => setRejectDialogOpen(false)} sx={{ flex: 1 }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleRejectDelivery}
                  disabled={!rejectMotivo.trim()}
                  sx={{ flex: 1 }}
                >
                  Rechazar
                </Button>
              </Box>
            </Stack>
          </Box>
        </SwipeableDrawer>
      )}
    </Box>
  );
};

export default DeliveriesPage2;
