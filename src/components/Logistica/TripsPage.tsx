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
import type { Trip, Vehicle, Employee, Delivery, TripStatus } from '../../types';

// Mock data for development
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    licensePlate: 'ABC-123',
    brand: 'Ford',
    model: 'Transit',
    year: 2022,
    capacity: 2000,
    isActive: true,
    lastMaintenance: '2024-01-15',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    licensePlate: 'DEF-456',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2023,
    capacity: 3500,
    isActive: true,
    lastMaintenance: '2024-01-20',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
  },
];

const mockDrivers: Employee[] = [
  {
    id: 1,
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    email: 'carlos.rodriguez@company.com',
    phone: '+54 11 1234-5678',
    position: 'Conductor',
    department: 'Logística',
    hireDate: '2023-01-15',
    salary: 450000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    firstName: 'Ana',
    lastName: 'López',
    email: 'ana.lopez@company.com',
    phone: '+54 11 8765-4321',
    position: 'Conductora',
    department: 'Logística',
    hireDate: '2023-06-01',
    salary: 430000,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
  },
];

const mockTrips: Trip[] = [
  {
    id: 1,
    tripNumber: 'TRIP-2024-001',
    driverId: 1,
    vehicleId: 1,
    startDate: '2024-01-25T08:00:00Z',
    endDate: '2024-01-25T18:00:00Z',
    status: 'COMPLETED',
    deliveries: [],
    totalDistance: 150,
    observations: 'Viaje completado sin inconvenientes',
    createdAt: '2024-01-25T07:00:00Z',
    updatedAt: '2024-01-25T18:30:00Z',
  },
  {
    id: 2,
    tripNumber: 'TRIP-2024-002',
    driverId: 2,
    vehicleId: 2,
    startDate: '2024-01-26T09:00:00Z',
    status: 'IN_PROGRESS',
    deliveries: [],
    totalDistance: 0,
    observations: 'Viaje en curso',
    createdAt: '2024-01-26T08:00:00Z',
    updatedAt: '2024-01-26T09:00:00Z',
  },
  {
    id: 3,
    tripNumber: 'TRIP-2024-003',
    driverId: 1,
    vehicleId: 1,
    startDate: '2024-01-27T08:30:00Z',
    status: 'PLANNED',
    deliveries: [],
    totalDistance: 0,
    observations: 'Viaje planificado para mañana',
    createdAt: '2024-01-26T16:00:00Z',
    updatedAt: '2024-01-26T16:00:00Z',
  },
];

const mockDeliveries: Delivery[] = [
  {
    id: 1,
    tripId: 1,
    orderId: 1,
    clientId: 1,
    address: 'Av. Corrientes 1234, Buenos Aires',
    scheduledDate: '2024-01-25T10:00:00Z',
    deliveredDate: '2024-01-25T10:30:00Z',
    status: 'DELIVERED',
    observations: 'Entregado sin problemas',
    createdAt: '2024-01-25T07:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: 2,
    tripId: 2,
    orderId: 2,
    clientId: 2,
    address: 'Av. Santa Fe 5678, Buenos Aires',
    scheduledDate: '2024-01-26T11:00:00Z',
    status: 'IN_TRANSIT',
    observations: 'En camino',
    createdAt: '2024-01-26T08:00:00Z',
    updatedAt: '2024-01-26T09:00:00Z',
  },
];

const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | TripStatus>('all');
  
  // Form data
  const [formData, setFormData] = useState({
    tripNumber: '',
    driverId: '',
    vehicleId: '',
    startDate: '',
    endDate: '',
    status: 'PLANNED' as TripStatus,
    totalDistance: 0,
    observations: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTrips(mockTrips);
      setVehicles(mockVehicles);
      setDrivers(mockDrivers);
      setDeliveries(mockDeliveries);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    return statusFilter === 'all' || trip.status === statusFilter;
  });

  const handleAdd = () => {
    setEditingTrip(null);
    setFormData({
      tripNumber: `TRIP-${new Date().getFullYear()}-${String(trips.length + 1).padStart(3, '0')}`,
      driverId: '',
      vehicleId: '',
      startDate: '',
      endDate: '',
      status: 'PLANNED',
      totalDistance: 0,
      observations: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({
      tripNumber: trip.tripNumber,
      driverId: trip.driverId.toString(),
      vehicleId: trip.vehicleId.toString(),
      startDate: trip.startDate.slice(0, 16), // Format for datetime-local input
      endDate: trip.endDate ? trip.endDate.slice(0, 16) : '',
      status: trip.status,
      totalDistance: trip.totalDistance,
      observations: trip.observations,
    });
    setDialogOpen(true);
  };

  const handleViewDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving trip:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingTrip) {
        // Update existing trip
        setTrips(trips.map(trip => 
          trip.id === editingTrip.id 
            ? { 
                ...trip, 
                ...formData,
                driverId: parseInt(formData.driverId),
                vehicleId: parseInt(formData.vehicleId),
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                updatedAt: new Date().toISOString() 
              }
            : trip
        ));
      } else {
        // Add new trip
        const newTrip: Trip = {
          id: Math.max(...trips.map(t => t.id)) + 1,
          ...formData,
          driverId: parseInt(formData.driverId),
          vehicleId: parseInt(formData.vehicleId),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
          deliveries: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTrips([...trips, newTrip]);
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el viaje');
      console.error('Error saving trip:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este viaje?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setTrips(trips.filter(trip => trip.id !== id));
      } catch (err) {
        setError('Error al eliminar el viaje');
        console.error('Error deleting trip:', err);
      }
    }
  };

  const handleStartTrip = async (id: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTrips(trips.map(trip => 
        trip.id === id 
          ? { 
              ...trip, 
              status: 'IN_PROGRESS',
              startDate: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            }
          : trip
      ));
    } catch (err) {
      setError('Error al iniciar el viaje');
      console.error('Error starting trip:', err);
    }
  };

  const handleCompleteTrip = async (id: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTrips(trips.map(trip => 
        trip.id === id 
          ? { 
              ...trip, 
              status: 'COMPLETED',
              endDate: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            }
          : trip
      ));
    } catch (err) {
      setError('Error al completar el viaje');
      console.error('Error completing trip:', err);
    }
  };

  const getStatusChip = (status: TripStatus) => {
    const statusConfig = {
      PLANNED: { label: 'Planificado', color: 'info' as const },
      IN_PROGRESS: { label: 'En Progreso', color: 'warning' as const },
      COMPLETED: { label: 'Completado', color: 'success' as const },
      CANCELLED: { label: 'Cancelado', color: 'error' as const },
    };
    
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getDriverName = (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'N/A';
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A';
  };

  const getTripDeliveries = (tripId: number) => {
    return deliveries.filter(d => d.tripId === tripId);
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
                <ScheduleIcon color="info" />
                <Box>
                  <Typography variant="h4">
                    {trips.filter(t => t.status === 'PLANNED').length}
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
                    {trips.filter(t => t.status === 'IN_PROGRESS').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Progreso
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
                    {trips.filter(t => t.status === 'COMPLETED').length}
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | TripStatus)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="PLANNED">Planificados</MenuItem>
            <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
            <MenuItem value="COMPLETED">Completados</MenuItem>
            <MenuItem value="CANCELLED">Cancelados</MenuItem>
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
                  <TableCell>Número de Viaje</TableCell>
                  <TableCell>Conductor</TableCell>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
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
                          {trip.tripNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DriverIcon sx={{ fontSize: 16 }} />
                          {getDriverName(trip.driverId)}
                        </Box>
                      </TableCell>
                      <TableCell>{getVehicleInfo(trip.vehicleId)}</TableCell>
                      <TableCell>
                        {new Date(trip.startDate).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusChip(trip.status)}</TableCell>
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
                        
                        {trip.status === 'PLANNED' && (
                          <IconButton 
                            onClick={() => handleStartTrip(trip.id)} 
                            size="small"
                            title="Iniciar viaje"
                            color="success"
                          >
                            <StartIcon />
                          </IconButton>
                        )}
                        
                        {trip.status === 'IN_PROGRESS' && (
                          <IconButton 
                            onClick={() => handleCompleteTrip(trip.id)} 
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
                        
                        {trip.status === 'PLANNED' && (
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
              label="Número de Viaje"
              value={formData.tripNumber}
              onChange={(e) => setFormData({ ...formData, tripNumber: e.target.value })}
              fullWidth
              required
            />
            
            <Box display="flex" gap={2}>
              <Autocomplete
                options={drivers}
                getOptionLabel={(driver) => `${driver.firstName} ${driver.lastName}`}
                value={drivers.find(d => d.id.toString() === formData.driverId) || null}
                onChange={(_, value) => setFormData({ ...formData, driverId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Conductor" required />
                )}
                sx={{ flex: 1 }}
              />
              
              <Autocomplete
                options={vehicles.filter(v => v.isActive)}
                getOptionLabel={(vehicle) => `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                value={vehicles.find(v => v.id.toString() === formData.vehicleId) || null}
                onChange={(_, value) => setFormData({ ...formData, vehicleId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Vehículo" required />
                )}
                sx={{ flex: 1 }}
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <TextField
                label="Fecha de Inicio"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Fecha de Fin"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TripStatus })}
                >
                  <MenuItem value="PLANNED">Planificado</MenuItem>
                  <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
                  <MenuItem value="COMPLETED">Completado</MenuItem>
                  <MenuItem value="CANCELLED">Cancelado</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Distancia Total (km)"
                type="number"
                value={formData.totalDistance}
                onChange={(e) => setFormData({ ...formData, totalDistance: parseFloat(e.target.value) || 0 })}
                fullWidth
              />
            </Box>
            
            <TextField
              label="Observaciones"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
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
            Detalles del Viaje: {selectedTrip?.tripNumber}
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
                          <strong>Conductor:</strong> {getDriverName(selectedTrip.driverId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Vehículo:</strong> {getVehicleInfo(selectedTrip.vehicleId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Estado:</strong> {getStatusChip(selectedTrip.status)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Fecha Inicio:</strong> {new Date(selectedTrip.startDate).toLocaleString()}
                        </Typography>
                        {selectedTrip.endDate && (
                          <Typography variant="body2">
                            <strong>Fecha Fin:</strong> {new Date(selectedTrip.endDate).toLocaleString()}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Distancia:</strong> {selectedTrip.totalDistance} km
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
                                    label={delivery.status} 
                                    size="small" 
                                    color={delivery.status === 'DELIVERED' ? 'success' : 'warning'}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">
                                    {delivery.address}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Programada: {new Date(delivery.scheduledDate).toLocaleString()}
                                  </Typography>
                                  {delivery.deliveredDate && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Entregada: {new Date(delivery.deliveredDate).toLocaleString()}
                                    </Typography>
                                  )}
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
              
              {selectedTrip.observations && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2">
                      {selectedTrip.observations}
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
