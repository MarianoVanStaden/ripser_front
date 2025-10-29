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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Assignment as OrderIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import type { EntregaViaje, Viaje, Cliente, Venta, EstadoEntrega, DocumentoComercial } from '../../types';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import { clienteApi } from '../../api/services/clienteApi';
import { documentoApi } from '../../api/services/documentoApi';
import { viajeApi } from '../../api/services/viajeApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`delivery-tabpanel-${index}`}
      aria-labelledby={`delivery-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DeliveriesPage: React.FC = () => {
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
  const [tabValue, setTabValue] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoEntrega>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Pagination states
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

      // Load each resource individually to better handle errors
      let deliveriesData: EntregaViaje[] = [];
      let clientsData: Cliente[] = [];
      let facturasData: DocumentoComercial[] = [];
      let tripsData: Viaje[] = [];
      const errors: string[] = [];

      try {
        deliveriesData = await entregaViajeApi.getAll();
        console.log('✅ Entregas cargadas:', deliveriesData.length, deliveriesData);
      } catch (err) {
        console.error('❌ Error cargando entregas:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Entregas: ${errorMsg}`);
      }

      try {
        clientsData = await clienteApi.getAll();
        console.log('✅ Clientes cargados:', clientsData.length, clientsData);
      } catch (err) {
        console.error('❌ Error cargando clientes:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Clientes: ${errorMsg}`);
      }

      try {
        facturasData = await documentoApi.getByTipo('FACTURA');
        // Filtrar solo facturas (FAC-), excluir notas de pedido (NP-)
        facturasData = facturasData.filter(f => f.numeroDocumento?.startsWith('FAC-'));
        console.log('✅ Facturas cargadas:', facturasData.length);
        console.log('📊 Muestra de facturas:', facturasData.slice(0, 2));
      } catch (err) {
        console.error('❌ Error cargando facturas:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Facturas: ${errorMsg}`);
      }

      try {
        tripsData = await viajeApi.getAll();
        console.log('✅ Viajes cargados:', tripsData.length, tripsData);
      } catch (err) {
        console.error('❌ Error cargando viajes:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Viajes: ${errorMsg}`);
      }

      // Show errors if any
      if (errors.length > 0) {
        setError(errors.join(' | '));
      }

      console.log('✅ Datos cargados:');
      console.log('   - Entregas:', deliveriesData.length);
      console.log('   - Facturas:', facturasData.length);
      console.log('   - Clientes:', clientsData.length);
      console.log('   - Viajes:', tripsData.length);

      // Ensure all data is in array format - NO enriquecer aquí, usar funciones auxiliares
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setFacturas(Array.isArray(facturasData) ? facturasData : []);
      setTrips(Array.isArray(tripsData) ? tripsData : []);

    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al cargar los datos');
      console.error('❌ Error general loading data:', err);
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
    .sort((a, b) => {
      // Ordenar por ID de entrega descendente (última entrega primero)
      return b.id - a.id;
    });

  // Paginate filtered deliveries
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

  const handleViewDetails = (delivery: EntregaViaje) => {
    setSelectedDelivery(delivery);
    setDetailsDialogOpen(true);
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
      console.error('Error saving delivery:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta entrega?')) {
      try {
        await entregaViajeApi.delete(id);
        await loadData();
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error?.response?.data?.message || 'Error al eliminar la entrega');
        console.error('Error deleting delivery:', err);
      }
    }
  };

  const handleMarkAsDelivered = async (id: number, receptorNombre?: string, receptorDni?: string) => {
    try {
      // Prompt for receptor info if not provided
      const nombre = receptorNombre || window.prompt('Nombre del receptor:') || 'Sin nombre';
      const dni = receptorDni || window.prompt('DNI del receptor:') || '';

      await entregaViajeApi.marcarComoEntregada(id, nombre, dni);
      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al marcar como entregado');
      console.error('Error marking as delivered:', err);
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

  // Obtener factura por delivery - Mismo patrón que TripsPage
  const getFacturaByDelivery = (delivery: EntregaViaje): DocumentoComercial | undefined => {
    // Intentar obtener el ID de la factura/documento desde diferentes fuentes
    let facturaId: number | undefined;

    // Opción 1: documentoComercialId (si el backend devuelve solo el ID)
    // @ts-ignore
    if (delivery.documentoComercialId) {
      // @ts-ignore
      facturaId = delivery.documentoComercialId;
    }
    // Opción 2: documentoComercial.id (si el backend devuelve el objeto completo)
    // @ts-ignore
    else if (delivery.documentoComercial?.id) {
      // @ts-ignore
      facturaId = delivery.documentoComercial.id;
    }
    // Opción 3: ventaId (para compatibilidad con versiones antiguas del backend)
    else if (delivery.ventaId) {
      facturaId = delivery.ventaId;
    }
    // Opción 4: venta.id (si el backend devuelve el objeto venta completo)
    else if (delivery.venta?.id) {
      facturaId = delivery.venta.id;
    }

    if (!facturaId) return undefined;

    return facturas.find(f => f.id === facturaId);
  };

  // Obtener nombre del cliente por delivery - Mismo patrón que TripsPage
  const getClientName = (delivery: EntregaViaje): string => {
    const factura = getFacturaByDelivery(delivery);

    if (!factura) return 'Sin Factura';

    // Primero intentar con clienteNombre de la factura
    if (factura.clienteNombre && factura.clienteNombre.trim()) {
      return factura.clienteNombre;
    }

    // Si no, buscar el cliente completo
    const cliente = clients.find(c => c.id === factura.clienteId);
    if (cliente) {
      // If it's a business (persona jurídica), prioritize razón social
      if (cliente.razonSocial && cliente.razonSocial.trim()) {
        return cliente.razonSocial;
      }
      // Otherwise, use name and lastname
      const parts = [cliente.nombre, cliente.apellido].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : 'Cliente sin nombre';
    }

    return 'Cliente no disponible';
  };

  // Obtener número de factura por delivery
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

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <DeliveryIcon />
          Control de Entregas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Nueva Entrega
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Badge badgeContent={pendingDeliveries.length} color="warning">
                  <ScheduleIcon color="warning" />
                </Badge>
                <Box>
                  <Typography variant="h4">{pendingDeliveries.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckIcon color="success" />
                <Box>
                  <Typography variant="h4">{deliveredCount}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Entregados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Badge badgeContent={unassignedDeliveries.length} color="error">
                  <CancelIcon color="error" />
                </Badge>
                <Box>
                  <Typography variant="h4">{unassignedDeliveries.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
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
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Todas las Entregas" />
          <Tab label="Pendientes" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: All Deliveries */}
      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Box display="flex" gap={2} mb={3} alignItems="center">
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
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
            sx={{ minWidth: 200 }}
          />
        </Box>

        {/* Deliveries Table */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Orden</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Fecha Programada</TableCell>
                    <TableCell>Viaje</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ClientIcon sx={{ fontSize: 16 }} />
                          {getClientName(delivery)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <OrderIcon sx={{ fontSize: 16 }} />
                          {getVentaNumero(delivery)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                            {delivery.direccionEntrega}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(delivery.fechaEntrega).toLocaleString()}
                      </TableCell>
                      <TableCell>{getTripNumber(delivery.viajeId)}</TableCell>
                      <TableCell>{getStatusChip(delivery.estado)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleViewDetails(delivery)}
                          size="small"
                          title="Ver detalles"
                        >
                          <ViewIcon />
                        </IconButton>

                        <IconButton onClick={() => handleEdit(delivery)} size="small">
                          <EditIcon />
                        </IconButton>

                        {delivery.estado === 'PENDIENTE' && (
                          <IconButton onClick={() => handleDelete(delivery.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredDeliveries.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Pending Deliveries */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Entregas Pendientes de Asignación
        </Typography>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Orden</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Fecha Programada</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>{getClientName(delivery)}</TableCell>
                      <TableCell>{getVentaNumero(delivery)}</TableCell>
                      <TableCell>{delivery.direccionEntrega}</TableCell>
                      <TableCell>{new Date(delivery.fechaEntrega).toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEdit(delivery)}
                        >
                          Asignar a Viaje
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Delivery Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeliveryIcon />
            {editingDelivery ? 'Editar Entrega' : 'Nueva Entrega'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box display="flex" gap={2}>
              <Autocomplete
                options={facturas}
                getOptionLabel={(factura) => `${factura.numeroDocumento || `FAC-${factura.id}`} - ${factura.clienteNombre || 'Sin cliente'}`}
                value={facturas.find(f => f.id.toString() === formData.ventaId) || null}
                onChange={(_, value) => setFormData({ ...formData, ventaId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Factura (Opcional)" />
                )}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                options={trips}
                getOptionLabel={(trip) => `Viaje #${trip.id} - ${trip.destino}`}
                value={trips.find(t => t.id.toString() === formData.viajeId) || null}
                onChange={(_, value) => setFormData({ ...formData, viajeId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Viaje (Opcional)" />
                )}
                sx={{ flex: 1 }}
              />
            </Box>

            <TextField
              label="Dirección de Entrega"
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

            {formData.estado === 'ENTREGADA' && (
              <>
                <TextField
                  label="Nombre del Receptor"
                  value={formData.receptorNombre}
                  onChange={(e) => setFormData({ ...formData, receptorNombre: e.target.value })}
                  fullWidth
                  placeholder="Nombre de quien recibió"
                />
                <TextField
                  label="DNI del Receptor"
                  value={formData.receptorDni}
                  onChange={(e) => setFormData({ ...formData, receptorDni: e.target.value })}
                  fullWidth
                  placeholder="DNI de quien recibió"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingDelivery ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ViewIcon />
            Detalles de Entrega
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Información de Entrega
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography variant="body2">
                          <strong>Cliente:</strong> {getClientName(selectedDelivery)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Factura:</strong> {getVentaNumero(selectedDelivery)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Viaje:</strong> {getTripNumber(selectedDelivery.viajeId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Estado:</strong> {getStatusChip(selectedDelivery.estado)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Fecha de Entrega:</strong> {new Date(selectedDelivery.fechaEntrega).toLocaleString()}
                        </Typography>
                        {selectedDelivery.receptorNombre && (
                          <Typography variant="body2">
                            <strong>Recibido por:</strong> {selectedDelivery.receptorNombre}
                          </Typography>
                        )}
                        {selectedDelivery.receptorDni && (
                          <Typography variant="body2">
                            <strong>DNI Receptor:</strong> {selectedDelivery.receptorDni}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Dirección y Ubicación
                      </Typography>
                      <Box display="flex" alignItems="start" gap={1} mb={2}>
                        <LocationIcon sx={{ fontSize: 20, mt: 0.5 }} />
                        <Typography variant="body2">
                          {selectedDelivery.direccionEntrega}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<MapIcon />}
                        onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(selectedDelivery.direccionEntrega)}`, '_blank')}
                        fullWidth
                      >
                        Ver en Google Maps
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {selectedDelivery.observaciones && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2">
                      {selectedDelivery.observaciones}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
          <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveriesPage;
