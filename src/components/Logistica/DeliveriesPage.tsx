import React, { useState, useEffect, useRef } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  TablePagination,
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
  LocalShipping as DeliveryIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Person as ClientIcon,
  Visibility as ViewIcon,
  Map as MapIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as EquipmentIcon,
  PhotoCamera as PhotoCameraIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import type { EntregaViaje, Viaje, Cliente, EstadoEntrega, DocumentoComercial } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import { entregaViajeDocumentoApi } from '../../api/services/entregaViajeDocumentoApi';
import type { DocumentoEntrega } from '../../api/services/entregaViajeDocumentoApi';
import { clienteApi } from '../../api/services/clienteApi';
import { documentoApi } from '../../api/services/documentoApi';
import { viajeApi } from '../../api/services/viajeApi';
// FRONT-003: extracted to keep this file orchestrator-shaped.
import { useResponsive } from './Deliveries/useResponsive';
import { getEstadoAsignacionColor, getEstadoAsignacionLabel } from './Deliveries/utils';
import BottomSheet from './Deliveries/components/BottomSheet';
import LightboxDialog from './Deliveries/dialogs/LightboxDialog';
import RejectDeliveryDialog from './Deliveries/dialogs/RejectDeliveryDialog';
import ConfirmDeliveryDialog from './Deliveries/dialogs/ConfirmDeliveryDialog';
import DeliveryFormDialog from './Deliveries/dialogs/DeliveryFormDialog';

const DeliveriesPage2: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();

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

  // Estado para fotos/archivos en confirmación (múltiples)
  const [contratoFotos, setContratoFotos] = useState<File[]>([]);
  const [contratoPreviews, setContratoPreviews] = useState<(string | null)[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para documentos de entrega en detalles
  const [entregaDocumentos, setEntregaDocumentos] = useState<DocumentoEntrega[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [docThumbnails, setDocThumbnails] = useState<Record<number, string>>({});
  const addDocInputRef = useRef<HTMLInputElement>(null);
  const [addingDocumentos, setAddingDocumentos] = useState(false);

  // Lightbox para ver imagen en grande
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
        clientsData = (await clienteApi.getAll({ page: 0, size: 500 })).content;
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
        const tripsResponse = await viajeApi.getAll();
        tripsData = tripsResponse.content || [];
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
    setEntregaDocumentos([]);
    setDetailsDialogOpen(true);

    try {
      const detalles = await entregaViajeApi.getDetalles(delivery.id);
      setSelectedDeliveryDetails(detalles);
    } catch (err) {
      setSelectedDeliveryDetails(null);
    }

    // Cargar documentos para cualquier estado
    setLoadingDocumentos(true);
    try {
      const docs = await entregaViajeDocumentoApi.getByEntrega(delivery.id);
      setEntregaDocumentos(docs);
      // Pre-cargar miniaturas de imágenes como blobs (el endpoint requiere auth headers)
      const imageDocs = docs.filter((d) => d.mimeType?.startsWith('image/'));
      const thumbEntries = await Promise.all(
        imageDocs.map(async (d) => {
          try {
            const blob = await entregaViajeDocumentoApi.download(delivery.id, d.id);
            return [d.id, URL.createObjectURL(blob)] as [number, string];
          } catch {
            return null;
          }
        })
      );
      setDocThumbnails(Object.fromEntries(thumbEntries.filter(Boolean) as [number, string][]));
    } catch {
      setEntregaDocumentos([]);
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const handleAddDocumentos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !selectedDelivery) return;
    setAddingDocumentos(true);
    for (const file of files) {
      try {
        await entregaViajeDocumentoApi.upload(
          selectedDelivery.id,
          file,
          file.type.startsWith('image/') ? 'Foto de entrega' : 'Documento de entrega'
        );
      } catch { /* continúa con el siguiente */ }
    }
    try {
      const entregaId = selectedDelivery.id;
      const docs = await entregaViajeDocumentoApi.getByEntrega(entregaId);
      setEntregaDocumentos(docs);
      const imageDocs = docs.filter((d) => d.mimeType?.startsWith('image/'));
      const thumbEntries = await Promise.all(
        imageDocs.map(async (d) => {
          try {
            const blob = await entregaViajeDocumentoApi.download(entregaId, d.id);
            return [d.id, URL.createObjectURL(blob)] as [number, string];
          } catch {
            return null;
          }
        })
      );
      setDocThumbnails(Object.fromEntries(thumbEntries.filter(Boolean) as [number, string][]));
    } catch { /* mantiene lista actual */ }
    setAddingDocumentos(false);
    if (addDocInputRef.current) addDocInputRef.current.value = '';
  };

  const handleDeleteDocumento = async (doc: DocumentoEntrega) => {
    try {
      await entregaViajeDocumentoApi.delete(selectedDelivery!.id, doc.id);
      setEntregaDocumentos((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      setError('Error al eliminar el documento.');
    }
  };

  const handleViewImage = async (doc: DocumentoEntrega) => {
    try {
      const blob = await entregaViajeDocumentoApi.download(selectedDelivery!.id, doc.id);
      const url = URL.createObjectURL(blob);
      setLightboxSrc(url);
    } catch {
      setError('Error al cargar la imagen.');
    }
  };

  const handleDownloadDocumento = async (doc: DocumentoEntrega) => {
    try {
      const blob = await entregaViajeDocumentoApi.download(selectedDelivery!.id, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName ?? doc.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Error al descargar el documento.');
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


  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const prevCount = contratoFotos.length;
    setContratoFotos((prev) => [...prev, ...files]);
    files.forEach((file, i) => {
      const idx = prevCount + i;
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) =>
          setContratoPreviews((prev) => {
            const next = [...prev];
            next[idx] = ev.target?.result as string;
            return next;
          });
        reader.readAsDataURL(file);
      } else {
        setContratoPreviews((prev) => {
          const next = [...prev];
          next[idx] = null;
          return next;
        });
      }
    });
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setContratoFotos((prev) => prev.filter((_, i) => i !== index));
    setContratoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const limpiarFotos = () => {
    setContratoFotos([]);
    setContratoPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openConfirmDialog = (id: number) => {
    setConfirmDeliveryId(id);
    setReceptorData({ nombre: '', dni: '', observaciones: '' });
    limpiarFotos();
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

      // Subir archivos adjuntos si fueron seleccionados
      if (contratoFotos.length > 0) {
        setUploadingFoto(true);
        for (const file of contratoFotos) {
          try {
            await entregaViajeDocumentoApi.upload(
              confirmDeliveryId,
              file,
              file.type.startsWith('image/') ? 'Foto de entrega' : 'Documento de entrega'
            );
          } catch (uploadErr) {
            console.error('Error al subir archivo:', uploadErr);
          }
        }
        setUploadingFoto(false);
      }

      setConfirmDialogOpen(false);
      setConfirmDeliveryId(null);
      setReceptorData({ nombre: '', dni: '', observaciones: '' });
      limpiarFotos();
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
    if (delivery.documentoComercialId) facturaId = delivery.documentoComercialId;
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
      <LoadingOverlay open={loading} message="Cargando entregas..." />
      {/* Inputs de archivo ocultos — siempre montados para que los refs funcionen en mobile y desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFotoChange}
      />
      <input
        ref={addDocInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleAddDocumentos}
      />

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

      <DeliveryFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        editing={editingDelivery}
        formData={formData}
        setFormData={setFormData}
        facturas={facturas}
        trips={trips}
        clients={clients}
      />

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

                  {/* Imágenes / Documentos — disponible para todos los estados */}
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PhotoCameraIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">Imágenes / Documentos</Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={addingDocumentos ? <CircularProgress size={12} /> : <PhotoCameraIcon />}
                          onClick={() => addDocInputRef.current?.click()}
                          disabled={addingDocumentos}
                        >
                          {addingDocumentos ? 'Subiendo...' : 'Agregar fotos'}
                        </Button>
                      </Box>
                      {loadingDocumentos ? (
                        <Box display="flex" justifyContent="center" py={1}>
                          <CircularProgress size={20} />
                        </Box>
                      ) : (
                        <>
                          {/* Imágenes en grid */}
                          {entregaDocumentos.filter((d) => d.mimeType?.startsWith('image/')).length > 0 && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, mb: 1 }}>
                              {entregaDocumentos.filter((d) => d.mimeType?.startsWith('image/')).map((doc) => (
                                <Box
                                  key={doc.id}
                                  onClick={() => handleViewImage(doc)}
                                  sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', cursor: 'pointer' }}
                                >
                                  <Box sx={{ height: 64, overflow: 'hidden', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {docThumbnails[doc.id] ? (
                                      <img src={docThumbnails[doc.id]} alt={doc.originalName ?? doc.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <PhotoCameraIcon color="action" fontSize="small" />
                                    )}
                                  </Box>
                                  <Typography variant="caption" noWrap sx={{ display: 'block', px: 0.5, pb: 0.25, fontSize: 10 }}>
                                    {doc.originalName ?? doc.fileName}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDocumento(doc); }}
                                    sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.45)', color: 'white', p: '2px' }}
                                  >
                                    <CloseIcon sx={{ fontSize: 12 }} />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {/* Otros archivos */}
                          {entregaDocumentos.filter((d) => !d.mimeType?.startsWith('image/')).map((doc) => (
                            <ListItem
                              key={doc.id}
                              disableGutters
                              secondaryAction={
                                <Box display="flex">
                                  <IconButton size="small" onClick={() => handleDownloadDocumento(doc)}><DownloadIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteDocumento(doc)}><CloseIcon fontSize="small" /></IconButton>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={doc.descripcion || doc.originalName || doc.fileName}
                                secondary={doc.fechaCreacion ? new Date(doc.fechaCreacion).toLocaleString() : undefined}
                                primaryTypographyProps={{ variant: 'body2' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                          {entregaDocumentos.length === 0 && (
                            <Typography variant="body2" color="text.secondary">Sin documentos adjuntos.</Typography>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
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

                {/* Imágenes / Documentos — disponible para todos los estados */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PhotoCameraIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="subtitle2">Imágenes / Documentos</Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={addingDocumentos ? <CircularProgress size={14} /> : <PhotoCameraIcon />}
                          onClick={() => addDocInputRef.current?.click()}
                          disabled={addingDocumentos}
                        >
                          {addingDocumentos ? 'Subiendo...' : 'Agregar fotos'}
                        </Button>
                      </Box>
                      {loadingDocumentos ? (
                        <Box display="flex" justifyContent="center" py={2}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (
                        <>
                          {/* Imágenes en grid */}
                          {entregaDocumentos.filter((d) => d.mimeType?.startsWith('image/')).length > 0 && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 1.5 }}>
                              {entregaDocumentos.filter((d) => d.mimeType?.startsWith('image/')).map((doc) => (
                                <Box
                                  key={doc.id}
                                  onClick={() => handleViewImage(doc)}
                                  sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                                >
                                  <Box sx={{ height: 80, overflow: 'hidden', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {docThumbnails[doc.id] ? (
                                      <img src={docThumbnails[doc.id]} alt={doc.originalName ?? doc.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <PhotoCameraIcon color="action" />
                                    )}
                                  </Box>
                                  <Typography variant="caption" noWrap sx={{ display: 'block', px: 0.5, pb: 0.5 }}>
                                    {doc.originalName ?? doc.fileName}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDocumento(doc); }}
                                    sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.45)', color: 'white', p: '2px' }}
                                  >
                                    <CloseIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {/* Otros archivos */}
                          {entregaDocumentos.filter((d) => !d.mimeType?.startsWith('image/')).map((doc) => (
                            <ListItem
                              key={doc.id}
                              secondaryAction={
                                <Box display="flex">
                                  <IconButton size="small" onClick={() => handleDownloadDocumento(doc)}><DownloadIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteDocumento(doc)}><CloseIcon fontSize="small" /></IconButton>
                                </Box>
                              }
                            >
                              <ListItemText
                                primary={doc.descripcion || doc.originalName || doc.fileName}
                                secondary={doc.fechaCreacion ? new Date(doc.fechaCreacion).toLocaleString() : undefined}
                              />
                            </ListItem>
                          ))}
                          {entregaDocumentos.length === 0 && (
                            <Typography variant="body2" color="text.secondary">Sin documentos adjuntos.</Typography>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
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

      <ConfirmDeliveryDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelivery}
        receptor={receptorData}
        setReceptor={setReceptorData}
        fotos={contratoFotos}
        fotoPreviews={contratoPreviews}
        uploading={uploadingFoto}
        onPickFile={() => fileInputRef.current?.click()}
        onRemoveFile={removeFile}
      />

      <RejectDeliveryDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleRejectDelivery}
        motivo={rejectMotivo}
        setMotivo={setRejectMotivo}
      />

      <LightboxDialog
        src={lightboxSrc}
        onClose={() => {
          if (lightboxSrc) URL.revokeObjectURL(lightboxSrc);
          setLightboxSrc(null);
        }}
      />
    </Box>
  );
};

export default DeliveriesPage2;
