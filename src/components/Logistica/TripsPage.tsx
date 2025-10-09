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
  List,
  ListItem,
  ListItemText,
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
} from '@mui/icons-material';
import type { Viaje, Vehiculo, Empleado, EntregaViaje, EstadoViaje, EstadoEntrega } from '../../types';
import { viajeApi } from '../../api/services/viajeApi';
import { vehiculoApi } from '../../api/services/vehiculoApi';
import { employeeApi } from '../../api/services/employeeApi';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';

const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Viaje[]>([]);
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [drivers, setDrivers] = useState<Empleado[]>([]);
  const [deliveries, setDeliveries] = useState<EntregaViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Viaje | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Viaje | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | EstadoViaje>('all');

  // Form data
  const [formData, setFormData] = useState({
    fechaViaje: '',
    destino: '',
    conductorId: '',
    vehiculoId: '',
    estado: 'PLANIFICADO' as EstadoViaje,
    observaciones: '',
  });

  // Deliveries for current trip - using a custom type for form state
  type DeliveryFormState = Partial<EntregaViaje> & { fechaProgramada?: string };
  const [tripDeliveries, setTripDeliveries] = useState<DeliveryFormState[]>([]);
  const [newDelivery, setNewDelivery] = useState({
    direccionEntrega: '',
    fechaProgramada: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load each resource individually to better handle errors
      let tripsData: Viaje[] = [];
      let vehiclesData: Vehiculo[] = [];
      let employeesData: Empleado[] = [];
      let deliveriesData: EntregaViaje[] = [];
      const errors: string[] = [];

      try {
        tripsData = await viajeApi.getAll();
        console.log('✅ Viajes cargados:', tripsData.length, tripsData);
      } catch (err) {
        console.error('❌ Error cargando viajes:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Viajes: ${errorMsg}`);
      }

      try {
        const allVehicles = await vehiculoApi.getAll();
        // Filter only available vehicles for creating trips
        vehiclesData = allVehicles.filter(v => v.estado === 'DISPONIBLE');
        console.log('✅ Vehículos cargados (total/disponibles):', allVehicles.length, '/', vehiclesData.length, vehiclesData);
        if (allVehicles.length > 0 && vehiclesData.length === 0) {
          errors.push(`⚠️ Hay ${allVehicles.length} vehículos pero ninguno está DISPONIBLE`);
        }
      } catch (err) {
        console.error('❌ Error cargando vehículos:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Vehículos: ${errorMsg}`);
      }

      try {
        employeesData = await employeeApi.getAllList();
        console.log('✅ Empleados cargados:', employeesData.length, employeesData);
      } catch (err) {
        console.error('❌ Error cargando empleados:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Empleados: ${errorMsg}`);
      }

      try {
        deliveriesData = await entregaViajeApi.getAll();
        console.log('✅ Entregas cargadas:', deliveriesData.length, deliveriesData);
      } catch (err) {
        console.error('❌ Error cargando entregas:', err);
        const errorMsg = (err as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || (err as Error)?.message || 'Error desconocido';
        errors.push(`❌ Entregas: ${errorMsg}`);
      }

      // Show errors if any
      if (errors.length > 0) {
        setError(errors.join(' | '));
      }

      // Ensure all data is in array format
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setDrivers(Array.isArray(employeesData) ? employeesData : []);
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);

    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || 'Error al cargar los datos');
      console.error('❌ Error general loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    return statusFilter === 'all' || trip.estado === statusFilter;
  });

  // Helper to check if a vehicle is currently in use
  const isVehicleInUse = (vehicleId: string): boolean => {
    return trips.some(trip =>
      trip.vehiculoId.toString() === vehicleId &&
      trip.estado === 'EN_CURSO'
    );
  };

  // Get trip that is currently using the vehicle
  const getTripUsingVehicle = (vehicleId: string): Viaje | undefined => {
    return trips.find(trip =>
      trip.vehiculoId.toString() === vehicleId &&
      trip.estado === 'EN_CURSO'
    );
  };

  const handleAdd = () => {
    setEditingTrip(null);
    setFormData({
      fechaViaje: '',
      destino: '',
      conductorId: '',
      vehiculoId: '',
      estado: 'PLANIFICADO',
      observaciones: '',
    });
    setTripDeliveries([]);
    setNewDelivery({ direccionEntrega: '', fechaProgramada: '', observaciones: '' });
    setDialogOpen(true);
  };

  const handleEdit = async (trip: Viaje) => {
    setEditingTrip(trip);
    setFormData({
      fechaViaje: trip.fechaViaje.slice(0, 16),
      destino: trip.destino,
      conductorId: trip.conductorId.toString(),
      vehiculoId: trip.vehiculoId.toString(),
      estado: trip.estado,
      observaciones: trip.observaciones || '',
    });

    // Load existing deliveries for this trip
    try {
      const existingDeliveries = await entregaViajeApi.getByViaje(trip.id);
      setTripDeliveries(existingDeliveries);
    } catch (err) {
      console.error('Error loading deliveries:', err);
      setTripDeliveries([]);
    }
    setNewDelivery({ direccionEntrega: '', fechaProgramada: '', observaciones: '' });
    setDialogOpen(true);
  };

  const handleViewDetails = (trip: Viaje) => {
    setSelectedTrip(trip);
    setDetailsDialogOpen(true);
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

      // Save deliveries for the trip
      if (tripDeliveries.length > 0) {
        let successCount = 0;
        let errorCount = 0;
        for (const delivery of tripDeliveries) {
          if (!delivery.id) {
            // New delivery - send with viajeId instead of nested viaje object
            try {
              const deliveryPayload: Partial<EntregaViaje> = {
                viajeId: savedTrip.id,
                direccionEntrega: delivery.direccionEntrega || '',
                fechaEntrega: delivery.fechaProgramada ? new Date(delivery.fechaProgramada).toISOString() : new Date().toISOString(),
                observaciones: delivery.observaciones || '',
                estado: 'PENDIENTE' as EstadoEntrega,
              };
              console.log('📦 Creating delivery:', deliveryPayload);
              const result = await entregaViajeApi.create(deliveryPayload);
              console.log('✅ Delivery created:', result);
              successCount++;
            } catch (deliveryError) {
              errorCount++;
              console.error('❌ Error creating delivery:', deliveryError);
              console.error('Delivery data:', delivery);
              const err = deliveryError as { response?: { status?: number; data?: unknown } };
              console.error('Error response:', err.response);
            }
          }
        }
        console.log(`📊 Delivery results: ${successCount} created, ${errorCount} failed`);
      }

      await loadData();
      setDialogOpen(false);
      setTripDeliveries([]);

      // Show success message if deliveries were attempted but some failed
      const newDeliveriesCount = tripDeliveries.filter(d => !d.id).length;
      if (newDeliveriesCount > 0) {
        console.log(`✅ Viaje guardado. Se intentó crear ${newDeliveriesCount} entregas.`);
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      let errorMessage = error.response?.data?.message || error.message || 'Error al guardar el viaje';

      // Provide specific error messages
      if (errorMessage.includes('no está disponible')) {
        errorMessage = 'El vehículo seleccionado no está disponible. Por favor, selecciona otro vehículo o cambia el estado del vehículo a DISPONIBLE en la sección de Vehículos.';
      } else if (error.response?.status === 403) {
        errorMessage = 'No tienes permisos para crear viajes o entregas. Contacta al administrador para que te asigne el rol USER o ADMIN.';
      }

      setError(errorMessage);
      console.error('Error saving trip:', err);
      console.error('Error details:', { status: error.response?.status, data: error.response?.data });
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
    }]);

    setNewDelivery({ direccionEntrega: '', fechaProgramada: '', observaciones: '' });
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
        console.error('Error deleting trip:', err);
      }
    }
  };

  const handleChangeEstado = async (id: number, nuevoEstado: EstadoViaje) => {
    try {
      await viajeApi.changeEstado(id, nuevoEstado);
      await loadData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      let errorMessage = error.response?.data?.message || error.message || 'Error al cambiar el estado del viaje';

      // Provide specific error messages
      if (errorMessage.includes('no está disponible')) {
        const trip = trips.find(t => t.id === id);
        errorMessage = `No se puede iniciar el viaje porque el vehículo ya está en uso por otro viaje.

Opciones:
1. Completa o cancela el viaje actual que usa este vehículo
2. Cambia este viaje para usar otro vehículo disponible
3. Deja este viaje en estado PLANIFICADO hasta que el vehículo esté disponible`;
      }

      setError(errorMessage);
      console.error('Error changing trip status:', err);
      console.error('Error details:', error.response?.data);
    }
  };

  const getStatusChip = (status: EstadoViaje) => {
    const statusConfig = {
      PLANIFICADO: { label: 'Planificado', color: 'info' as const },
      EN_CURSO: { label: 'En Curso', color: 'warning' as const },
      COMPLETADO: { label: 'Completado', color: 'success' as const },
      CANCELADO: { label: 'Cancelado', color: 'error' as const },
    };

    const config = statusConfig[status];
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
    // Backend now returns both viajeId and viaje object
    return deliveries.filter(d => d.viajeId === tripId);
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
          <TruckIcon />
          Armado de Viajes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Nuevo Viaje
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ScheduleIcon color="info" />
                <Box>
                  <Typography variant="h4">
                    {trips.filter(t => t.estado === 'PLANIFICADO').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Planificados
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
                <RouteIcon color="warning" />
                <Box>
                  <Typography variant="h4">
                    {trips.filter(t => t.estado === 'EN_CURSO').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Curso
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
                  <Typography variant="h4">
                    {trips.filter(t => t.estado === 'COMPLETADO').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completados
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
                <TruckIcon color="primary" />
                <Box>
                  <Typography variant="h4">{vehicles.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehículos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | EstadoViaje)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="PLANIFICADO">Planificados</MenuItem>
            <MenuItem value="EN_CURSO">En Curso</MenuItem>
            <MenuItem value="COMPLETADO">Completados</MenuItem>
            <MenuItem value="CANCELADO">Cancelados</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Trips Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Conductor</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Entregas</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrips.map((trip) => {
                  const tripDeliveries = getTripDeliveries(trip.id);

                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          #{trip.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DriverIcon sx={{ fontSize: 16 }} />
                          {getDriverName(trip.conductorId)}
                        </Box>
                      </TableCell>
                      <TableCell>{getVehicleInfo(trip.vehiculoId)}</TableCell>
                      <TableCell>{trip.destino}</TableCell>
                      <TableCell>
                        {new Date(trip.fechaViaje).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusChip(trip.estado)}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tripDeliveries.length} entregas
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleViewDetails(trip)}
                          size="small"
                          title="Ver detalles"
                        >
                          <MapIcon />
                        </IconButton>

                        {trip.estado === 'PLANIFICADO' && (
                          <IconButton
                            onClick={() => handleChangeEstado(trip.id, 'EN_CURSO')}
                            size="small"
                            title="Iniciar viaje"
                            color="success"
                          >
                            <StartIcon />
                          </IconButton>
                        )}

                        {trip.estado === 'EN_CURSO' && (
                          <IconButton
                            onClick={() => handleChangeEstado(trip.id, 'COMPLETADO')}
                            size="small"
                            title="Completar viaje"
                            color="primary"
                          >
                            <StopIcon />
                          </IconButton>
                        )}

                        <IconButton onClick={() => handleEdit(trip)} size="small">
                          <EditIcon />
                        </IconButton>

                        {trip.estado === 'PLANIFICADO' && (
                          <IconButton onClick={() => handleDelete(trip.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Trip Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TruckIcon />
            {editingTrip ? 'Editar Viaje' : 'Nuevo Viaje'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {(drivers.length === 0 || vehicles.length === 0) && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                ⚠️ Faltan datos para crear un viaje
              </Typography>
              {drivers.length === 0 && (
                <Typography variant="body2">
                  • No hay empleados (conductores) cargados. Ve a RRHH → Empleados para agregar.
                </Typography>
              )}
              {vehicles.length === 0 && (
                <Typography variant="body2">
                  • No hay vehículos cargados. Debes crear vehículos primero.
                </Typography>
              )}
            </Alert>
          )}
          
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Destino"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              fullWidth
              required
            />

            <Box display="flex" gap={2}>
              <Autocomplete
                options={drivers}
                getOptionLabel={(driver) => `${driver.nombre} ${driver.apellido}`}
                value={drivers.find(d => d.id.toString() === formData.conductorId) || null}
                onChange={(_, value) => setFormData({ ...formData, conductorId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Conductor" 
                    required 
                    helperText={drivers.length === 0 ? '⚠️ No hay empleados cargados' : `${drivers.length} empleados disponibles`}
                  />
                )}
                noOptionsText="No hay conductores disponibles"
                sx={{ flex: 1 }}
              />

              <Box sx={{ flex: 1 }}>
                <Autocomplete
                  options={vehicles}
                  getOptionLabel={(vehicle) => `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})`}
                  value={vehicles.find(v => v.id.toString() === formData.vehiculoId) || null}
                  onChange={(_, value) => setFormData({ ...formData, vehiculoId: value?.id.toString() || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehículo"
                      required
                      helperText={vehicles.length === 0 ? '⚠️ No hay vehículos cargados' : `${vehicles.length} vehículos disponibles`}
                    />
                  )}
                  noOptionsText="No hay vehículos disponibles"
                />
                {formData.vehiculoId && isVehicleInUse(formData.vehiculoId) && formData.estado === 'EN_CURSO' && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      ⚠️ Este vehículo ya está en uso por el Viaje #{getTripUsingVehicle(formData.vehiculoId)?.id}.
                      No podrás iniciar este viaje hasta que el otro viaje se complete o cancele.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </Box>

            <Box display="flex" gap={2}>
              <TextField
                label="Fecha del Viaje"
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
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoViaje })}
                >
                  <MenuItem value="PLANIFICADO">Planificado</MenuItem>
                  <MenuItem value="EN_CURSO">En Curso</MenuItem>
                  <MenuItem value="COMPLETADO">Completado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            {/* Deliveries Section */}
            <Box mt={2}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <LocationIcon />
                Entregas
              </Typography>

              {/* Existing Deliveries List */}
              {tripDeliveries.length > 0 && (
                <List dense sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  {tripDeliveries.map((delivery, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        !delivery.id && (
                          <IconButton edge="end" onClick={() => handleRemoveDelivery(index)}>
                            <DeleteIcon />
                          </IconButton>
                        )
                      }
                    >
                      <ListItemText
                        primary={delivery.direccionEntrega}
                        secondary={
                          <>
                            {delivery.fechaProgramada && (
                              <Typography variant="caption" display="block">
                                Fecha: {new Date(delivery.fechaProgramada).toLocaleString()}
                              </Typography>
                            )}
                            {delivery.observaciones && (
                              <Typography variant="caption" display="block">
                                {delivery.observaciones}
                              </Typography>
                            )}
                            {delivery.id && (
                              <Chip
                                label={delivery.estado}
                                size="small"
                                color={delivery.estado === 'ENTREGADA' ? 'success' : 'default'}
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Add New Delivery Form */}
              <Box display="flex" flexDirection="column" gap={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="subtitle2">Agregar Entrega</Typography>
                <TextField
                  label="Dirección de Entrega"
                  value={newDelivery.direccionEntrega}
                  onChange={(e) => setNewDelivery({ ...newDelivery, direccionEntrega: e.target.value })}
                  fullWidth
                  size="small"
                  placeholder="Ej: Calle 123, Ciudad"
                />
                <TextField
                  label="Fecha Programada"
                  type="datetime-local"
                  value={newDelivery.fechaProgramada}
                  onChange={(e) => setNewDelivery({ ...newDelivery, fechaProgramada: e.target.value })}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Observaciones"
                  value={newDelivery.observaciones}
                  onChange={(e) => setNewDelivery({ ...newDelivery, observaciones: e.target.value })}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Notas sobre la entrega..."
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddDelivery}
                  size="small"
                >
                  Agregar Entrega
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTrip ? 'Actualizar' : 'Crear'} {tripDeliveries.filter(d => !d.id).length > 0 && `(+${tripDeliveries.filter(d => !d.id).length} entregas)`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trip Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <MapIcon />
            Detalles del Viaje #{selectedTrip?.id}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTrip && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Información General
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography variant="body2">
                          <strong>Conductor:</strong> {getDriverName(selectedTrip.conductorId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Vehículo:</strong> {getVehicleInfo(selectedTrip.vehiculoId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Destino:</strong> {selectedTrip.destino}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Estado:</strong> {getStatusChip(selectedTrip.estado)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Fecha:</strong> {new Date(selectedTrip.fechaViaje).toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Entregas del Viaje
                      </Typography>
                      <List>
                        {getTripDeliveries(selectedTrip.id).map((delivery, index) => (
                          <ListItem key={delivery.id} divider>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocationIcon sx={{ fontSize: 16 }} />
                                  <Typography variant="body2" fontWeight="bold">
                                    Entrega #{index + 1}
                                  </Typography>
                                  <Chip
                                    label={delivery.estado}
                                    size="small"
                                    color={delivery.estado === 'ENTREGADA' ? 'success' : 'warning'}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {delivery.direccionEntrega}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(delivery.fechaEntrega).toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                        {getTripDeliveries(selectedTrip.id).length === 0 && (
                          <ListItem>
                            <ListItemText
                              primary="No hay entregas asignadas a este viaje"
                              secondary="Puede asignar entregas desde el módulo de Control de Entregas"
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {selectedTrip.observaciones && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2">
                      {selectedTrip.observaciones}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripsPage;
