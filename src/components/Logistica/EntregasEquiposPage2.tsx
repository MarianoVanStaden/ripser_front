import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  IconButton,
  Collapse,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  Fab,
  Badge,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as EquipoIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { documentoApi } from '../../api/services/documentoApi';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { DocumentoComercial, EquipoFabricadoDTO } from '../../types';
import api from '../../api/config';
import SuccessDialog from '../common/SuccessDialog';

// Custom hook for responsive breakpoints
const useResponsive = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  return { isMobile, isTablet, isDesktop };
};

interface FacturaConEquipos {
  factura: DocumentoComercial;
  equiposPorEntregar: EquipoFabricadoDTO[];
  expanded: boolean;
}

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
          minHeight: '40vh',
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

const EntregasEquiposPage2: React.FC = () => {
  const theme = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const [facturasConEquipos, setFacturasConEquipos] = useState<FacturaConEquipos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirm delivery dialog
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<DocumentoComercial | null>(null);
  const [receptorNombre, setReceptorNombre] = useState('');
  const [receptorDni, setReceptorDni] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Success dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [entregaConfirmada, setEntregaConfirmada] = useState<{
    facturaNumero: string;
    clienteNombre: string;
    cantidadEquipos: number;
  } | null>(null);

  // Selected invoice for quick action on mobile
  const [selectedForAction, setSelectedForAction] = useState<number | null>(null);

  useEffect(() => {
    loadFacturasConEquiposPorEntregar();
  }, []);

  const loadFacturasConEquiposPorEntregar = async () => {
    try {
      setLoading(true);
      setError(null);

      const facturas = await documentoApi.getByTipo('FACTURA');
      const facturasConEquiposData: FacturaConEquipos[] = [];

      for (const factura of facturas) {
        const equiposIds: number[] = [];

        factura.detalles?.forEach(detalle => {
          if (detalle.tipoItem === 'EQUIPO' && detalle.equiposFabricadosIds) {
            equiposIds.push(...detalle.equiposFabricadosIds);
          }
        });

        if (equiposIds.length === 0) continue;

        const equiposPromises = equiposIds.map(id =>
          equipoFabricadoApi.findById(id).catch(() => null)
        );
        const equipos = (await Promise.all(equiposPromises)).filter(Boolean) as EquipoFabricadoDTO[];

        const equiposPorEntregar = equipos.filter(
          equipo => equipo.estadoAsignacion === 'FACTURADO'
        );

        if (equiposPorEntregar.length > 0) {
          facturasConEquiposData.push({
            factura,
            equiposPorEntregar,
            expanded: false,
          });
        }
      }

      setFacturasConEquipos(facturasConEquiposData);
    } catch (err) {
      console.error('Error loading facturas con equipos:', err);
      setError('Error al cargar facturas con equipos pendientes');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (facturaId: number) => {
    setFacturasConEquipos(prev =>
      prev.map(item =>
        item.factura.id === facturaId
          ? { ...item, expanded: !item.expanded }
          : item
      )
    );
  };

  const handleOpenConfirmDialog = (factura: DocumentoComercial) => {
    setSelectedFactura(factura);
    setReceptorNombre(factura.clienteNombre || '');
    setReceptorDni('');
    setObservaciones('');
    setConfirmDialog(true);
    setSelectedForAction(null);
  };

  const handleConfirmEntrega = async () => {
    if (!selectedFactura) return;

    try {
      setLoading(true);
      setError(null);

      const equiposIds: number[] = [];
      selectedFactura.detalles?.forEach(detalle => {
        if (detalle.tipoItem === 'EQUIPO' && detalle.equiposFabricadosIds) {
          equiposIds.push(...detalle.equiposFabricadosIds);
        }
      });

      const entregaResponse = await api.post('/api/entregas-viaje', {
        documentoComercialId: selectedFactura.id,
        direccionEntrega: selectedFactura.clienteDireccion || `Cliente: ${selectedFactura.clienteNombre}`,
        fechaEntrega: dayjs().toISOString(),
        estado: 'PENDIENTE',
        observaciones: observaciones || `Entrega directa. Equipos: ${equiposIds.length}`,
        receptorNombre: null,
        receptorDni: null,
      });

      await api.post('/api/entregas-viaje/confirmar-entrega', {
        entregaId: entregaResponse.data.id,
        estado: 'ENTREGADA',
        receptorNombre: receptorNombre,
        receptorDni: receptorDni,
        observaciones: observaciones,
      });

      setEntregaConfirmada({
        facturaNumero: selectedFactura.numeroDocumento || `FAC-${selectedFactura.id}`,
        clienteNombre: selectedFactura.clienteNombre || 'Sin nombre',
        cantidadEquipos: equiposIds.length,
      });

      setConfirmDialog(false);
      setSelectedFactura(null);
      setSuccessDialogOpen(true);

      await loadFacturasConEquiposPorEntregar();
    } catch (err: any) {
      console.error('Error confirmando entrega:', err);
      setError(err.response?.data?.message || err.response?.data || 'Error al confirmar la entrega');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado?: string) => {
    if (!estado) return 'default';
    switch (estado) {
      case 'FACTURADO':
        return 'warning';
      case 'ENTREGADO':
        return 'success';
      case 'DISPONIBLE':
        return 'default';
      case 'RESERVADO':
        return 'info';
      default:
        return 'default';
    }
  };

  // Mobile Invoice Card Component
  const MobileInvoiceCard = ({ item }: { item: FacturaConEquipos }) => {
    const { factura, equiposPorEntregar, expanded } = item;
    const isSelected = selectedForAction === factura.id;

    return (
      <Card
        variant="outlined"
        sx={{
          transition: 'all 0.2s ease',
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'primary.main' : 'divider',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header - Tappable to select */}
          <Box
            onClick={() => setSelectedForAction(isSelected ? null : factura.id)}
            sx={{ cursor: 'pointer' }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <ReceiptIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {factura.numeroDocumento || `FAC-${factura.id}`}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                    {factura.clienteNombre || 'Sin cliente'}
                  </Typography>
                </Box>
              </Box>
              <Badge badgeContent={equiposPorEntregar.length} color="warning">
                <EquipoIcon color="action" />
              </Badge>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {dayjs(factura.fechaEmision).format('DD/MM/YYYY')}
              </Typography>
            </Box>
          </Box>

          {/* Action buttons when selected */}
          {isSelected && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={() => handleOpenConfirmDialog(factura)}
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  Confirmar Entrega
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(factura.id);
                  }}
                  sx={{ minWidth: 44 }}
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Stack>
            </>
          )}

          {/* Expanded equipment list */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" fontWeight="medium" gutterBottom display="block">
              Equipos a entregar:
            </Typography>
            <Stack spacing={1} mt={1}>
              {equiposPorEntregar.map(equipo => (
                <Box
                  key={equipo.id}
                  sx={{
                    p: 1.5,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        #{equipo.numeroHeladera || equipo.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {equipo.tipo} - {equipo.modelo}
                      </Typography>
                      {(equipo.color || equipo.medida) && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {[equipo.color, equipo.medida].filter(Boolean).join(' | ')}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={equipo.estadoAsignacion}
                      color={getEstadoColor(equipo.estadoAsignacion) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  // Desktop Invoice Card Component
  const DesktopInvoiceCard = ({ item }: { item: FacturaConEquipos }) => {
    const { factura, equiposPorEntregar, expanded } = item;

    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box flex={1}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Typography variant="h6" fontWeight="bold">
                  {factura.numeroDocumento || `FAC-${factura.id}`}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Chip
                    icon={<PersonIcon />}
                    label={factura.clienteNombre}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<EquipoIcon />}
                    label={`${equiposPorEntregar.length} equipo(s)`}
                    color="warning"
                    size="small"
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(factura.fechaEmision).format('DD/MM/YYYY')}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckIcon />}
                onClick={() => handleOpenConfirmDialog(factura)}
              >
                Confirmar Entrega
              </Button>
              <IconButton size="small" onClick={() => toggleExpand(factura.id)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>
          </Box>

          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Equipos a entregar:
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr" sx={{ bgcolor: 'grey.50' }}>
                    <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 'bold' }}>N Equipo</Box>
                    <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 'bold' }}>Tipo</Box>
                    <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 'bold' }}>Modelo</Box>
                    {!isTablet && <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 'bold' }}>Color</Box>}
                    {!isTablet && <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 'bold' }}>Medida</Box>}
                    <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 'bold' }}>Estado</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  {equiposPorEntregar.map(equipo => (
                    <Box
                      component="tr"
                      key={equipo.id}
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <Box component="td" sx={{ p: 1 }}>
                        <Typography variant="body2" fontWeight="600">
                          #{equipo.numeroHeladera || equipo.id}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1 }}>{equipo.tipo}</Box>
                      <Box component="td" sx={{ p: 1 }}>{equipo.modelo}</Box>
                      {!isTablet && <Box component="td" sx={{ p: 1 }}>{equipo.color || '-'}</Box>}
                      {!isTablet && <Box component="td" sx={{ p: 1 }}>{equipo.medida || '-'}</Box>}
                      <Box component="td" sx={{ p: 1 }}>
                        <Chip
                          label={equipo.estadoAsignacion}
                          color={getEstadoColor(equipo.estadoAsignacion) as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  if (loading && facturasConEquipos.length === 0) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px" gap={2}>
        <CircularProgress />
        <Typography color="text.secondary">Cargando entregas pendientes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: isMobile ? 10 : 3, minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          p: { xs: 2, sm: 2, md: 3 },
          position: isMobile ? 'sticky' : 'static',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 10,
          borderBottom: isMobile ? '1px solid' : 'none',
          borderColor: 'divider',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <ShippingIcon color="primary" />
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
              {isMobile ? 'Entregas Equipos' : 'Entregas de Equipos Pendientes'}
            </Typography>
          </Box>

          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadFacturasConEquiposPorEntregar}
              disabled={loading}
            >
              Actualizar
            </Button>
          )}

          {isMobile && (
            <IconButton onClick={loadFacturasConEquiposPorEntregar} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 2, md: 3 }, pt: { xs: 2 } }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Card */}
        <Card sx={{ mb: 3, bgcolor: 'warning.lighter' }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1.5}>
                <Badge badgeContent={facturasConEquipos.length} color="warning">
                  <ReceiptIcon sx={{ fontSize: 28, color: 'warning.main' }} />
                </Badge>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {facturasConEquipos.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Facturas pendientes
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Badge
                  badgeContent={facturasConEquipos.reduce((acc, item) => acc + item.equiposPorEntregar.length, 0)}
                  color="primary"
                >
                  <EquipoIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Badge>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {facturasConEquipos.reduce((acc, item) => acc + item.equiposPorEntregar.length, 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Equipos totales
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Empty State */}
        {facturasConEquipos.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <EquipoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay equipos pendientes
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Todos los equipos facturados han sido entregados
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadFacturasConEquiposPorEntregar}
            >
              Actualizar
            </Button>
          </Card>
        ) : (
          <>
            {/* Mobile instruction */}
            {isMobile && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Toca una factura para ver las opciones de entrega
              </Alert>
            )}

            {/* Invoice List */}
            <Stack spacing={isMobile ? 1.5 : 2}>
              {facturasConEquipos.map((item) =>
                isMobile ? (
                  <MobileInvoiceCard key={item.factura.id} item={item} />
                ) : (
                  <DesktopInvoiceCard key={item.factura.id} item={item} />
                )
              )}
            </Stack>
          </>
        )}
      </Box>

      {/* Confirm Delivery - Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheet
          open={confirmDialog}
          onClose={() => setConfirmDialog(false)}
          title="Confirmar Entrega"
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setConfirmDialog(false)} sx={{ flex: 1, minHeight: 48 }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleConfirmEntrega}
                disabled={!receptorNombre.trim() || loading}
                sx={{ flex: 1, minHeight: 48 }}
              >
                Confirmar
              </Button>
            </Stack>
          }
        >
          {selectedFactura && (
            <Stack spacing={2}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Factura:</strong> {selectedFactura.numeroDocumento}
                </Typography>
                <Typography variant="body2">
                  <strong>Cliente:</strong> {selectedFactura.clienteNombre}
                </Typography>
                <Typography variant="body2">
                  <strong>Equipos:</strong>{' '}
                  {facturasConEquipos.find(f => f.factura.id === selectedFactura.id)?.equiposPorEntregar.length || 0}
                </Typography>
              </Alert>

              <TextField
                label="Nombre del Receptor *"
                value={receptorNombre}
                onChange={(e) => setReceptorNombre(e.target.value)}
                fullWidth
                required
                InputProps={{ sx: { minHeight: 56 } }}
              />

              <TextField
                label="DNI del Receptor"
                value={receptorDni}
                onChange={(e) => setReceptorDni(e.target.value)}
                fullWidth
                inputMode="numeric"
                InputProps={{ sx: { minHeight: 56 } }}
              />

              <TextField
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Notas sobre la entrega..."
              />

              <Alert severity="warning">
                Los equipos cambiaran a estado <strong>ENTREGADO</strong>.
              </Alert>
            </Stack>
          )}
        </BottomSheet>
      )}

      {/* Confirm Delivery - Desktop Drawer */}
      {!isMobile && (
        <SwipeableDrawer
          anchor="right"
          open={confirmDialog}
          onClose={() => setConfirmDialog(false)}
          onOpen={() => {}}
          PaperProps={{ sx: { width: isTablet ? '70%' : 400 } }}
        >
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckIcon color="success" />
                <Typography variant="h6">Confirmar Entrega</Typography>
              </Box>
              <IconButton onClick={() => setConfirmDialog(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            {selectedFactura && (
              <Stack spacing={2.5}>
                <Alert severity="info">
                  <Typography variant="body2" gutterBottom>
                    <strong>Factura:</strong> {selectedFactura.numeroDocumento}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Cliente:</strong> {selectedFactura.clienteNombre}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Equipos a entregar:</strong>{' '}
                    {facturasConEquipos.find(f => f.factura.id === selectedFactura.id)?.equiposPorEntregar.length || 0}
                  </Typography>
                </Alert>

                <TextField
                  label="Nombre del Receptor"
                  value={receptorNombre}
                  onChange={(e) => setReceptorNombre(e.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label="DNI del Receptor"
                  value={receptorDni}
                  onChange={(e) => setReceptorDni(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Observaciones"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Notas sobre la entrega..."
                />

                <Alert severity="warning">
                  Los equipos cambiaran a estado <strong>ENTREGADO</strong> y se registrara en el historial.
                </Alert>

                <Box display="flex" gap={2}>
                  <Button onClick={() => setConfirmDialog(false)} sx={{ flex: 1 }}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleConfirmEntrega}
                    disabled={!receptorNombre.trim() || loading}
                    startIcon={<CheckIcon />}
                    sx={{ flex: 1 }}
                  >
                    Confirmar
                  </Button>
                </Box>
              </Stack>
            )}
          </Box>
        </SwipeableDrawer>
      )}

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setEntregaConfirmada(null);
        }}
        title="Entrega Confirmada!"
        message={`${entregaConfirmada?.cantidadEquipos || 0} equipo(s) marcados como ENTREGADO`}
        details={entregaConfirmada ? [
          { label: 'Factura', value: entregaConfirmada.facturaNumero },
          { label: 'Cliente', value: entregaConfirmada.clienteNombre },
          { label: 'Equipos Entregados', value: entregaConfirmada.cantidadEquipos },
        ] : []}
      />
    </Box>
  );
};

export default EntregasEquiposPage2;
