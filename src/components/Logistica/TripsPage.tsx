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
import type { Viaje, Vehiculo, Empleado, EntregaViaje, EstadoViaje } from '../../types';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripsData, vehiclesData, employeesData, deliveriesData] = await Promise.all([
        viajeApi.getAll(),
        vehiculoApi.getAll(),
        employeeApi.getAllList(),
        entregaViajeApi.getAll()
      ]);

      console.log('Trips Data:', tripsData);
      console.log('Vehicles Data:', vehiclesData);
      console.log('Employees Data:', employeesData);
      console.log('Deliveries Data:', deliveriesData);

      // Ensure all data is in array format
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setDrivers(Array.isArray(employeesData) ? employeesData : []);
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar los datos');
      console.error('Error loading data:', err);
      // Set empty arrays on error
      setTrips([]);
      setVehicles([]);
      setDrivers([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    return statusFilter === 'all' || trip.estado === statusFilter;
  });

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
    setDialogOpen(true);
  };

  const handleEdit = (trip: Viaje) => {
    setEditingTrip(trip);
    setFormData({
      fechaViaje: trip.fechaViaje.slice(0, 16),
      destino: trip.destino,
      conductorId: trip.conductorId.toString(),
      vehiculoId: trip.vehiculoId.toString(),
      estado: trip.estado,
      observaciones: trip.observaciones || '',
    });
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

      if (editingTrip) {
        await viajeApi.update(editingTrip.id, viajeData);
      } else {
        await viajeApi.create(viajeData);
      }

      await loadData();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar el viaje');
      console.error('Error saving trip:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este viaje?')) {
      try {
        await viajeApi.delete(id);
        await loadData();
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Error al eliminar el viaje');
        console.error('Error deleting trip:', err);
      }
    }
  };

  const handleChangeEstado = async (id: number, nuevoEstado: EstadoViaje) => {
    try {
      await viajeApi.changeEstado(id, nuevoEstado);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cambiar el estado del viaje');
      console.error('Error changing trip status:', err);
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
                  <TextField {...params} label="Conductor" required />
                )}
                sx={{ flex: 1 }}
              />

              <Autocomplete
                options={vehicles}
                getOptionLabel={(vehicle) => `${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})`}
                value={vehicles.find(v => v.id.toString() === formData.vehiculoId) || null}
                onChange={(_, value) => setFormData({ ...formData, vehiculoId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Vehículo" required />
                )}
                sx={{ flex: 1 }}
              />
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTrip ? 'Actualizar' : 'Crear'}
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
