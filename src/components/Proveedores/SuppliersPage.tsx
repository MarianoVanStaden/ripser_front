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
  Rating,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import type { Supplier } from '../../types';

// Mock data for development
const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'Proveedor Tech S.A.',
    email: 'contacto@proveedortech.com',
    phone: '+54 11 4567-8901',
    address: 'Av. Tecnología 123, Buenos Aires',
    contactPerson: 'María González',
    paymentTerms: '30 días',
    rating: 4.5,
    isActive: true,
    observations: 'Excelente proveedor de equipos tecnológicos',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    name: 'Materiales del Sur',
    email: 'ventas@materialesdelsur.com',
    phone: '+54 11 2345-6789',
    address: 'Calle Industrial 456, Buenos Aires',
    contactPerson: 'Carlos Rodríguez',
    paymentTerms: '15 días',
    rating: 4.0,
    isActive: true,
    observations: 'Proveedor confiable de materiales de construcción',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-20T14:15:00Z',
  },
  {
    id: 3,
    name: 'Servicios Integrales López',
    email: 'info@servicioslopez.com',
    phone: '+54 11 9876-5432',
    address: 'Boulevard Servicios 789, Buenos Aires',
    contactPerson: 'Ana López',
    paymentTerms: '45 días',
    rating: 3.5,
    isActive: false,
    observations: 'Proveedor de servicios varios - suspendido temporalmente',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-25T09:45:00Z',
  },
];

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    paymentTerms: '',
    rating: 0,
    isActive: true,
    observations: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuppliers(mockSuppliers);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      paymentTerms: '',
      rating: 0,
      isActive: true,
      observations: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      contactPerson: supplier.contactPerson,
      paymentTerms: supplier.paymentTerms,
      rating: supplier.rating,
      isActive: supplier.isActive,
      observations: supplier.observations,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving supplier:', formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (editingSupplier) {
        // Update existing supplier
        setSuppliers(suppliers.map(supplier => 
          supplier.id === editingSupplier.id 
            ? { 
                ...supplier, 
                ...formData, 
                updatedAt: new Date().toISOString() 
              }
            : supplier
        ));
      } else {
        // Add new supplier
        const newSupplier: Supplier = {
          id: Math.max(...suppliers.map(s => s.id)) + 1,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSuppliers([...suppliers, newSupplier]);
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el proveedor');
      console.error('Error saving supplier:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
      } catch (err) {
        setError('Error al eliminar el proveedor');
        console.error('Error deleting supplier:', err);
      }
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    return 'error';
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
          <BusinessIcon />
          Gestión de Proveedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Agregar Proveedor
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
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Persona de Contacto</TableCell>
                  <TableCell>Términos de Pago</TableCell>
                  <TableCell>Calificación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {supplier.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {supplier.address}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <EmailIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{supplier.email}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <PhoneIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{supplier.phone}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.paymentTerms}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Rating
                          value={supplier.rating}
                          readOnly
                          size="small"
                          precision={0.5}
                        />
                        <Chip
                          label={supplier.rating.toFixed(1)}
                          color={getRatingColor(supplier.rating)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={supplier.isActive ? 'Activo' : 'Inactivo'}
                        color={supplier.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleEdit(supplier)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(supplier.id)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Supplier Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessIcon />
            {editingSupplier ? 'Editar Proveedor' : 'Agregar Proveedor'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Nombre del Proveedor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                required
              />
            </Box>
            
            <TextField
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              required
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Persona de Contacto"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Términos de Pago"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                fullWidth
                placeholder="ej: 30 días"
              />
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Typography component="legend">Calificación</Typography>
              <Rating
                value={formData.rating}
                onChange={(_, newValue) => setFormData({ ...formData, rating: newValue || 0 })}
                precision={0.5}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Proveedor Activo"
            />
            
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
            {editingSupplier ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuppliersPage;
