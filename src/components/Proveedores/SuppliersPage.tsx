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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { supplierApi } from '../../api/services/supplierApi';
import type { ProveedorDTO, CreateProveedorDTO } from '../../types';

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ProveedorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ProveedorDTO | null>(null);
  const [formData, setFormData] = useState<CreateProveedorDTO>({
    razonSocial: '',
    cuit: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
  });
  const [formErrors, setFormErrors] = useState<{
    razonSocial?: string;
    cuit?: string;
    email?: string;
    telefono?: string;
  }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await supplierApi.getAll();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSuppliers(data);
        setError(null);
      } else {
        console.error('Unexpected data format:', data);
        setSuppliers([]);
        setError('Formato de datos inesperado');
      }
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setSuppliers([]); // Ensure suppliers is always an array
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // Validar Razón Social
    if (!formData.razonSocial.trim()) {
      errors.razonSocial = 'La razón social es obligatoria';
    }

    // Validar CUIT (formato argentino: XX-XXXXXXXX-X)
    if (!formData.cuit.trim()) {
      errors.cuit = 'El CUIT es obligatorio';
    } else if (!/^\d{2}-?\d{8}-?\d{1}$/.test(formData.cuit.replace(/\s/g, ''))) {
      errors.cuit = 'Formato de CUIT inválido (ej: 20-12345678-9)';
    }

    // Validar Email
    if (!formData.email.trim()) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Formato de email inválido';
    }

    // Validar Teléfono (opcional pero si está, debe ser válido)
    if (formData.telefono && !/^[\d\s\-\+\(\)]{7,20}$/.test(formData.telefono)) {
      errors.telefono = 'Formato de teléfono inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData({
      razonSocial: '',
      cuit: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      provincia: '',
      codigoPostal: '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleEdit = (supplier: ProveedorDTO) => {
    setEditingSupplier(supplier);
    setFormData({
      razonSocial: supplier.razonSocial || '',
      cuit: supplier.cuit || '',
      email: supplier.email || '',
      telefono: supplier.telefono || '',
      direccion: supplier.direccion || '',
      ciudad: supplier.ciudad || '',
      provincia: supplier.provincia || '',
      codigoPostal: supplier.codigoPostal || '',
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validar antes de enviar
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (editingSupplier) {
        const updated = await supplierApi.update(editingSupplier.id, formData);
        setSuppliers(suppliers.map(s => (s.id === updated.id ? updated : s)));
      } else {
        const created = await supplierApi.create(formData);
        setSuppliers([...suppliers, created]);
      }
      setDialogOpen(false);
      setError(null);
    } catch (err) {
      setError('Error al guardar el proveedor');
      console.error('Error saving supplier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        setLoading(true);
        await supplierApi.delete(id);
        setSuppliers(suppliers.filter(supplier => supplier.id !== id));
        setError(null);
      } catch (err) {
        setError('Error al eliminar el proveedor');
        console.error('Error deleting supplier:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'Activo';
      case 'INACTIVO':
        return 'Inactivo';
      case 'BLOQUEADO':
        return 'Bloqueado';
      default:
        return estado;
    }
  };

  const getEstadoColor = (estado: string): "success" | "warning" | "error" | "default" => {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'warning';
      case 'BLOQUEADO':
        return 'error';
      default:
        return 'default';
    }
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
                  <TableCell>Razón Social</TableCell>
                  <TableCell>CUIT</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Ciudad</TableCell>
                  <TableCell>Provincia</TableCell>
                  <TableCell>Código Postal</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body1" color="textSecondary">
                        No hay proveedores registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>{supplier.razonSocial}</TableCell>
                      <TableCell>{supplier.cuit}</TableCell>
                      <TableCell>
                        {supplier.email && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <EmailIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">{supplier.email}</Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.telefono && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PhoneIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">{supplier.telefono}</Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{supplier.direccion}</TableCell>
                      <TableCell>{supplier.ciudad}</TableCell>
                      <TableCell>{supplier.provincia}</TableCell>
                      <TableCell>{supplier.codigoPostal}</TableCell>
                      <TableCell>
                        {supplier.estado && (
                          <Chip
                            label={getEstadoLabel(supplier.estado)}
                            color={getEstadoColor(supplier.estado)}
                            size="small"
                          />
                        )}
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
                  ))
                )}
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
              label="Razón Social"
              value={formData.razonSocial}
              onChange={(e) => {
                setFormData({ ...formData, razonSocial: e.target.value });
                if (formErrors.razonSocial) {
                  setFormErrors({ ...formErrors, razonSocial: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.razonSocial}
              helperText={formErrors.razonSocial}
            />
            <TextField
              label="CUIT"
              value={formData.cuit}
              onChange={(e) => {
                setFormData({ ...formData, cuit: e.target.value });
                if (formErrors.cuit) {
                  setFormErrors({ ...formErrors, cuit: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.cuit}
              helperText={formErrors.cuit}
              placeholder="20-12345678-9"
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (formErrors.email) {
                  setFormErrors({ ...formErrors, email: undefined });
                }
              }}
              fullWidth
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              placeholder="ejemplo@email.com"
            />
            <TextField
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => {
                setFormData({ ...formData, telefono: e.target.value });
                if (formErrors.telefono) {
                  setFormErrors({ ...formErrors, telefono: undefined });
                }
              }}
              fullWidth
              error={!!formErrors.telefono}
              helperText={formErrors.telefono}
              placeholder="+54 11 1234-5678"
            />
            <TextField
              label="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              fullWidth
            />
            <Box display="flex" gap={2}>
              <TextField
                label="Ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                fullWidth
              />
              <TextField
                label="Provincia"
                value={formData.provincia}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                fullWidth
              />
              <TextField
                label="Código Postal"
                value={formData.codigoPostal}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                fullWidth
              />
            </Box>
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