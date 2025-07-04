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
  MenuItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { clientApi, employeeApi, presupuestoApi, productApi, serviceApi } from '../../api/services';
import type { Presupuesto, Client, Employee, PresupuestoStatus } from '../../types';
import { PresupuestoStatus as PresupuestoStatusEnum } from '../../types';

const PresupuestosPage: React.FC = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<Presupuesto | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    employeeId: '',
    quoteDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    observations: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load data from backend APIs
      try {
        const [clientsData, employeesData, presupuestosData] = await Promise.all([
          clientApi.getAll(),
          employeeApi.getAll(),
          presupuestoApi.getAll(),
        ]);
        
        setClients(clientsData);
        setEmployees(employeesData);
        setPresupuestos(presupuestosData);
        
      } catch (apiError) {
        console.warn('Backend API not available, using mock data:', apiError);
        
        // Fallback to mock data if backend is not available
        const [clientsData, employeesData] = await Promise.all([
          clientApi.getAll().catch(() => []),
          employeeApi.getAll().catch(() => []),
        ]);
        
        setClients(clientsData);
        setEmployees(employeesData);
        
        // Mock presupuestos data for fallback
        setPresupuestos([
          {
            id: 1,
            clientId: clientsData[0]?.id || 1,
            client: clientsData[0],
            employeeId: employeesData[0]?.id || 1,
            employee: employeesData[0],
            quoteNumber: 'PRES-2025-001',
            quoteDate: '2025-01-15',
            validUntil: '2025-02-15',
            status: PresupuestoStatusEnum.DRAFT,
            subtotal: 1500.00,
            tax: 315.00,
            discount: 0.00,
            total: 1815.00,
            observations: 'Presupuesto inicial para instalación',
            items: [],
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
          {
            id: 2,
            clientId: clientsData[1]?.id || 2,
            client: clientsData[1],
            employeeId: employeesData[0]?.id || 1,
            employee: employeesData[0],
            quoteNumber: 'PRES-2025-002',
            quoteDate: '2025-01-16',
            validUntil: '2025-02-16',
            status: PresupuestoStatusEnum.SENT,
            subtotal: 2800.00,
            tax: 588.00,
            discount: 100.00,
            total: 3288.00,
            observations: 'Presupuesto para reparación completa',
            items: [],
            createdAt: '2025-01-16T14:00:00Z',
            updatedAt: '2025-01-16T14:00:00Z',
          }
        ]);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos de presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PresupuestoStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case PresupuestoStatusEnum.DRAFT: return 'default';
      case PresupuestoStatusEnum.SENT: return 'info';
      case PresupuestoStatusEnum.APPROVED: return 'success';
      case PresupuestoStatusEnum.REJECTED: return 'error';
      case PresupuestoStatusEnum.EXPIRED: return 'warning';
      case PresupuestoStatusEnum.CONVERTED: return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: PresupuestoStatus): string => {
    switch (status) {
      case PresupuestoStatusEnum.DRAFT: return 'Borrador';
      case PresupuestoStatusEnum.SENT: return 'Enviado';
      case PresupuestoStatusEnum.APPROVED: return 'Aprobado';
      case PresupuestoStatusEnum.REJECTED: return 'Rechazado';
      case PresupuestoStatusEnum.EXPIRED: return 'Vencido';
      case PresupuestoStatusEnum.CONVERTED: return 'Convertido';
      default: return status;
    }
  };

  const handleOpenDialog = (presupuesto?: Presupuesto) => {
    if (presupuesto) {
      setEditingPresupuesto(presupuesto);
      setFormData({
        clientId: presupuesto.clientId.toString(),
        employeeId: presupuesto.employeeId.toString(),
        quoteDate: presupuesto.quoteDate,
        validUntil: presupuesto.validUntil,
        observations: presupuesto.observations,
      });
    } else {
      setEditingPresupuesto(null);
      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + 1);
      setFormData({
        clientId: '',
        employeeId: '',
        quoteDate: new Date().toISOString().split('T')[0],
        validUntil: validUntil.toISOString().split('T')[0],
        observations: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPresupuesto(null);
  };

  const handleSavePresupuesto = async () => {
    try {
      setLoading(true);
      
      const presupuestoData = {
        clientId: parseInt(formData.clientId),
        employeeId: parseInt(formData.employeeId),
        quoteDate: formData.quoteDate,
        validUntil: formData.validUntil,
        status: PresupuestoStatusEnum.DRAFT,
        subtotal: 0, // These would be calculated based on items
        tax: 0,
        discount: 0,
        total: 0,
        observations: formData.observations,
        items: [] // Would include actual items in a complete implementation
      };

      try {
        let savedPresupuesto: Presupuesto;
        
        if (editingPresupuesto) {
          savedPresupuesto = await presupuestoApi.update(editingPresupuesto.id, presupuestoData);
          setPresupuestos(presupuestos.map(p => 
            p.id === editingPresupuesto.id ? savedPresupuesto : p
          ));
        } else {
          savedPresupuesto = await presupuestoApi.create(presupuestoData);
          setPresupuestos([savedPresupuesto, ...presupuestos]);
        }
        
      } catch (apiError) {
        console.warn('API not available, saving locally:', apiError);
        
        // Fallback to local creation if API is not available
        const newPresupuesto: Presupuesto = {
          id: editingPresupuesto?.id || Math.max(...presupuestos.map(p => p.id)) + 1,
          ...presupuestoData,
          client: clients.find(c => c.id === presupuestoData.clientId),
          employee: employees.find(e => e.id === presupuestoData.employeeId),
          quoteNumber: `PRES-${new Date().getFullYear()}-${String(presupuestos.length + 1).padStart(3, '0')}`,
          createdAt: editingPresupuesto?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        if (editingPresupuesto) {
          setPresupuestos(presupuestos.map(p => 
            p.id === editingPresupuesto.id ? newPresupuesto : p
          ));
        } else {
          setPresupuestos([newPresupuesto, ...presupuestos]);
        }
      }

      handleCloseDialog();
      
    } catch (err) {
      console.error('Error saving presupuesto:', err);
      setError('Error al guardar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePresupuesto = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este presupuesto?')) {
      return;
    }

    try {
      await presupuestoApi.delete(id);
      setPresupuestos(presupuestos.filter(p => p.id !== id));
    } catch (apiError) {
      console.warn('API not available, deleting locally:', apiError);
      setPresupuestos(presupuestos.filter(p => p.id !== id));
    }
  };

  const handleConvertToSale = async (id: number) => {
    try {
      await presupuestoApi.convertToSale(id);
      // Refresh the presupuesto to show updated status
      await fetchData();
      alert('Presupuesto convertido a venta exitosamente');
    } catch (apiError) {
      console.warn('API not available for conversion:', apiError);
      // Update status locally
      setPresupuestos(presupuestos.map(p => 
        p.id === id ? { ...p, status: PresupuestoStatusEnum.CONVERTED } : p
      ));
      alert('Presupuesto marcado como convertido');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Presupuestos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presupuestos.map((presupuesto) => (
                  <TableRow key={presupuesto.id}>
                    <TableCell>{presupuesto.quoteNumber}</TableCell>
                    <TableCell>{presupuesto.client?.name}</TableCell>
                    <TableCell>{new Date(presupuesto.quoteDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(presupuesto.validUntil).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(presupuesto.status)}
                        color={getStatusColor(presupuesto.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${presupuesto.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="success">
                        <PrintIcon />
                      </IconButton>
                      <IconButton size="small" color="info">
                        <SendIcon />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {presupuestos.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay presupuestos registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comience creando su primer presupuesto
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Crear Presupuesto
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Cliente"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                margin="normal"
                required
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                select
                label="Empleado"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                margin="normal"
                required
              >
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id.toString()}>
                    {employee.firstName} {employee.lastName}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                label="Fecha del Presupuesto"
                type="date"
                value={formData.quoteDate}
                onChange={(e) => setFormData({ ...formData, quoteDate: e.target.value })}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                fullWidth
                label="Válido Hasta"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSavePresupuesto}>
            {editingPresupuesto ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PresupuestosPage;
