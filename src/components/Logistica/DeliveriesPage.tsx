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
import type { Delivery, Trip, Client, Order, DeliveryStatus } from '../../types';

// Mock data for development
const mockClients: Client[] = [
  {
    id: 1,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Corrientes 1234, Buenos Aires',
    city: 'Buenos Aires',
    birthDate: '1985-03-15',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@email.com',
    phone: '+54 11 8765-4321',
    address: 'Av. Santa Fe 5678, Buenos Aires',
    city: 'Buenos Aires',
    birthDate: '1990-07-22',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
  },
];

const mockOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'ORD-2024-001',
    clientId: 1,
    employeeId: 1,
    orderDate: '2024-01-20T00:00:00Z',
    status: 'CONFIRMED',
    total: 150000,
    discount: 0,
    tax: 31500,
    totalWithTax: 181500,
    deliveryDate: '2024-01-25T00:00:00Z',
    observations: '',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: 2,
    orderNumber: 'ORD-2024-002',
    clientId: 2,
    employeeId: 1,
    orderDate: '2024-01-22T00:00:00Z',
    status: 'PENDING',
    total: 85000,
    discount: 5000,
    tax: 16800,
    totalWithTax: 96800,
    deliveryDate: '2024-01-28T00:00:00Z',
    observations: '',
    createdAt: '2024-01-22T00:00:00Z',
    updatedAt: '2024-01-22T14:15:00Z',
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
    observations: '',
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
    observations: '',
    createdAt: '2024-01-26T08:00:00Z',
    updatedAt: '2024-01-26T09:00:00Z',
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
    observations: 'Entregado sin problemas. Cliente satisfecho.',
    signature: 'Juan Pérez',
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
    observations: 'En camino al destino',
    createdAt: '2024-01-26T08:00:00Z',
    updatedAt: '2024-01-26T09:00:00Z',
  },
  {
    id: 3,
    orderId: null,
    clientId: 1,
    address: 'Av. Rivadavia 9999, Buenos Aires',
    scheduledDate: '2024-01-27T14:00:00Z',
    status: 'PENDING',
    observations: 'Pendiente de asignación a viaje',
    createdAt: '2024-01-26T16:00:00Z',
    updatedAt: '2024-01-26T16:00:00Z',
  },
  {
    id: 4,
    tripId: 1,
    orderId: null,
    clientId: 2,
    address: 'Av. Libertador 1111, Buenos Aires',
    scheduledDate: '2024-01-25T15:00:00Z',
    deliveredDate: '2024-01-25T15:45:00Z',
    status: 'DELIVERED',
    observations: 'Entrega realizada. Documentos firmados.',
    signature: 'María González',
    createdAt: '2024-01-25T07:00:00Z',
    updatedAt: '2024-01-25T15:45:00Z',
  },
];

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
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    tripId: '',
    orderId: '',
    clientId: '',
    address: '',
    scheduledDate: '',
    deliveredDate: '',
    status: 'PENDING' as DeliveryStatus,
    observations: '',
    signature: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDeliveries(mockDeliveries);
      setClients(mockClients);
      setOrders(mockOrders);
      setTrips(mockTrips);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesDate = !dateFilter || 
      new Date(delivery.scheduledDate).toDateString() === new Date(dateFilter).toDateString();
    return matchesStatus && matchesDate;
  });

  const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING');
  const inTransitDeliveries = deliveries.filter(d => d.status === 'IN_TRANSIT');
  const deliveredCount = deliveries.filter(d => d.status === 'DELIVERED').length;
  const unassignedDeliveries = deliveries.filter(d => !d.tripId);

  const handleAdd = () => {
    setEditingDelivery(null);
    setFormData({
      tripId: '',
      orderId: '',
      clientId: '',
      address: '',
      scheduledDate: '',
      deliveredDate: '',
      status: 'PENDING',
      observations: '',
      signature: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    const client = clients.find(c => c.id === delivery.clientId);
    setFormData({
      tripId: delivery.tripId?.toString() || '',
      orderId: delivery.orderId?.toString() || '',
      clientId: delivery.clientId.toString(),
      address: delivery.address,
      scheduledDate: delivery.scheduledDate.slice(0, 16),
      deliveredDate: delivery.deliveredDate ? delivery.deliveredDate.slice(0, 16) : '',
      status: delivery.status,
      observations: delivery.observations,
      signature: delivery.signature || '',
    });
    setDialogOpen(true);
  };

  const handleViewDetails = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setDetailsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving delivery:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingDelivery) {
        // Update existing delivery
        setDeliveries(deliveries.map(delivery => 
          delivery.id === editingDelivery.id 
            ? { 
                ...delivery, 
                ...formData,
                tripId: formData.tripId ? parseInt(formData.tripId) : undefined,
                orderId: formData.orderId ? parseInt(formData.orderId) : undefined,
                clientId: parseInt(formData.clientId),
                scheduledDate: new Date(formData.scheduledDate).toISOString(),
                deliveredDate: formData.deliveredDate ? new Date(formData.deliveredDate).toISOString() : undefined,
                updatedAt: new Date().toISOString() 
              }
            : delivery
        ));
      } else {
        // Add new delivery
        const newDelivery: Delivery = {
          id: Math.max(...deliveries.map(d => d.id)) + 1,
          ...formData,
          tripId: formData.tripId ? parseInt(formData.tripId) : undefined,
          orderId: formData.orderId ? parseInt(formData.orderId) : undefined,
          clientId: parseInt(formData.clientId),
          scheduledDate: new Date(formData.scheduledDate).toISOString(),
          deliveredDate: formData.deliveredDate ? new Date(formData.deliveredDate).toISOString() : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDeliveries([...deliveries, newDelivery]);
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError('Error al guardar la entrega');
      console.error('Error saving delivery:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta entrega?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setDeliveries(deliveries.filter(delivery => delivery.id !== id));
      } catch (err) {
        setError('Error al eliminar la entrega');
        console.error('Error deleting delivery:', err);
      }
    }
  };

  const handleMarkAsDelivered = async (id: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDeliveries(deliveries.map(delivery => 
        delivery.id === id 
          ? { 
              ...delivery, 
              status: 'DELIVERED',
              deliveredDate: new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            }
          : delivery
      ));
    } catch (err) {
      setError('Error al marcar como entregado');
      console.error('Error marking as delivered:', err);
    }
  };

  const getStatusChip = (status: DeliveryStatus) => {
    const statusConfig = {
      PENDING: { label: 'Pendiente', color: 'warning' as const },
      ASSIGNED: { label: 'Asignado', color: 'info' as const },
      IN_TRANSIT: { label: 'En Tránsito', color: 'primary' as const },
      DELIVERED: { label: 'Entregado', color: 'success' as const },
      FAILED: { label: 'Fallido', color: 'error' as const },
      RETURNED: { label: 'Devuelto', color: 'default' as const },
    };
    
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'N/A';
  };

  const getOrderNumber = (orderId: number | null | undefined) => {
    if (!orderId) return 'Sin orden';
    const order = orders.find(o => o.id === orderId);
    return order?.orderNumber || 'N/A';
  };

  const getTripNumber = (tripId: number | null | undefined) => {
    if (!tripId) return 'Sin asignar';
    const trip = trips.find(t => t.id === tripId);
    return trip?.tripNumber || 'N/A';
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
                <Badge badgeContent={inTransitDeliveries.length} color="primary">
                  <RouteIcon color="primary" />
                </Badge>
                <Box>
                  <Typography variant="h4">{inTransitDeliveries.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Tránsito
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
          <Tab label="En Tránsito" />
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
              onChange={(e) => setStatusFilter(e.target.value as 'all' | DeliveryStatus)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="PENDING">Pendientes</MenuItem>
              <MenuItem value="ASSIGNED">Asignados</MenuItem>
              <MenuItem value="IN_TRANSIT">En Tránsito</MenuItem>
              <MenuItem value="DELIVERED">Entregados</MenuItem>
              <MenuItem value="FAILED">Fallidos</MenuItem>
              <MenuItem value="RETURNED">Devueltos</MenuItem>
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
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ClientIcon sx={{ fontSize: 16 }} />
                          {getClientName(delivery.clientId)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <OrderIcon sx={{ fontSize: 16 }} />
                          {getOrderNumber(delivery.orderId)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                            {delivery.address}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(delivery.scheduledDate).toLocaleString()}
                      </TableCell>
                      <TableCell>{getTripNumber(delivery.tripId)}</TableCell>
                      <TableCell>{getStatusChip(delivery.status)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleViewDetails(delivery)} 
                          size="small"
                          title="Ver detalles"
                        >
                          <ViewIcon />
                        </IconButton>
                        
                        {delivery.status === 'IN_TRANSIT' && (
                          <IconButton 
                            onClick={() => handleMarkAsDelivered(delivery.id)} 
                            size="small"
                            title="Marcar como entregado"
                            color="success"
                          >
                            <CheckIcon />
                          </IconButton>
                        )}
                        
                        <IconButton onClick={() => handleEdit(delivery)} size="small">
                          <EditIcon />
                        </IconButton>
                        
                        {delivery.status === 'PENDING' && (
                          <IconButton onClick={() => handleDelete(delivery.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      <TableCell>{getClientName(delivery.clientId)}</TableCell>
                      <TableCell>{getOrderNumber(delivery.orderId)}</TableCell>
                      <TableCell>{delivery.address}</TableCell>
                      <TableCell>{new Date(delivery.scheduledDate).toLocaleString()}</TableCell>
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

      {/* Tab Panel 2: In Transit Deliveries */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Entregas en Tránsito
        </Typography>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Viaje</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Fecha Programada</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inTransitDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>{getClientName(delivery.clientId)}</TableCell>
                      <TableCell>{getTripNumber(delivery.tripId)}</TableCell>
                      <TableCell>{delivery.address}</TableCell>
                      <TableCell>{new Date(delivery.scheduledDate).toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleMarkAsDelivered(delivery.id)}
                        >
                          Marcar Entregado
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
                options={clients}
                getOptionLabel={(client) => `${client.firstName} ${client.lastName}`}
                value={clients.find(c => c.id.toString() === formData.clientId) || null}
                onChange={(_, value) => {
                  setFormData({ 
                    ...formData, 
                    clientId: value?.id.toString() || '',
                    address: value?.address || formData.address
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente" required />
                )}
                sx={{ flex: 1 }}
              />
              
              <Autocomplete
                options={orders}
                getOptionLabel={(order) => order.orderNumber}
                value={orders.find(o => o.id.toString() === formData.orderId) || null}
                onChange={(_, value) => setFormData({ ...formData, orderId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Orden (Opcional)" />
                )}
                sx={{ flex: 1 }}
              />
            </Box>
            
            <TextField
              label="Dirección de Entrega"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Fecha Programada"
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Fecha de Entrega"
                type="datetime-local"
                value={formData.deliveredDate}
                onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={formData.status !== 'DELIVERED'}
              />
            </Box>
            
            <Box display="flex" gap={2}>
              <Autocomplete
                options={trips}
                getOptionLabel={(trip) => trip.tripNumber}
                value={trips.find(t => t.id.toString() === formData.tripId) || null}
                onChange={(_, value) => setFormData({ ...formData, tripId: value?.id.toString() || '' })}
                renderInput={(params) => (
                  <TextField {...params} label="Viaje (Opcional)" />
                )}
                sx={{ flex: 1 }}
              />
              
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as DeliveryStatus })}
                >
                  <MenuItem value="PENDING">Pendiente</MenuItem>
                  <MenuItem value="ASSIGNED">Asignado</MenuItem>
                  <MenuItem value="IN_TRANSIT">En Tránsito</MenuItem>
                  <MenuItem value="DELIVERED">Entregado</MenuItem>
                  <MenuItem value="FAILED">Fallido</MenuItem>
                  <MenuItem value="RETURNED">Devuelto</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              label="Observaciones"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            
            {formData.status === 'DELIVERED' && (
              <TextField
                label="Firma/Recibido por"
                value={formData.signature}
                onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                fullWidth
                placeholder="Nombre de quien recibió"
              />
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
                          <strong>Cliente:</strong> {getClientName(selectedDelivery.clientId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Orden:</strong> {getOrderNumber(selectedDelivery.orderId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Viaje:</strong> {getTripNumber(selectedDelivery.tripId)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Estado:</strong> {getStatusChip(selectedDelivery.status)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Fecha Programada:</strong> {new Date(selectedDelivery.scheduledDate).toLocaleString()}
                        </Typography>
                        {selectedDelivery.deliveredDate && (
                          <Typography variant="body2">
                            <strong>Fecha de Entrega:</strong> {new Date(selectedDelivery.deliveredDate).toLocaleString()}
                          </Typography>
                        )}
                        {selectedDelivery.signature && (
                          <Typography variant="body2">
                            <strong>Recibido por:</strong> {selectedDelivery.signature}
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
                          {selectedDelivery.address}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        startIcon={<MapIcon />}
                        onClick={() => window.open(`https://maps.google.com?q=${encodeURIComponent(selectedDelivery.address)}`, '_blank')}
                        fullWidth
                      >
                        Ver en Google Maps
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {selectedDelivery.observations && (
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2">
                      {selectedDelivery.observations}
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
