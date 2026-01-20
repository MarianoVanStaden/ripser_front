import React, { useState, useEffect, useMemo } from 'react';
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
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Stack,
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
import type { ProveedorDTO, CreateProveedorDTO, ProvinciaEnum } from '../../types';
import { PROVINCIA_LABELS } from '../../types/shared.enums';

const SuppliersPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    provincia: undefined as ProvinciaEnum | undefined,
    codigoPostal: '',
  });
  const [formErrors, setFormErrors] = useState<{
    razonSocial?: string;
    cuit?: string;
    email?: string;
    telefono?: string;
  }>({});

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [ciudadFilter, setCiudadFilter] = useState<string>('all');
  const [provinciaFilter, setProvinciaFilter] = useState<string>('all');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      provincia: undefined as ProvinciaEnum | undefined,
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
      provincia: supplier.provincia,
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

  // Get unique cities and provinces for filters
  const uniqueCiudades = useMemo(() => {
    const ciudades = new Set(suppliers.map(s => s.ciudad).filter(Boolean));
    return Array.from(ciudades).sort();
  }, [suppliers]);

  const uniqueProvincias = useMemo(() => {
    const provincias = new Set(suppliers.map(s => s.provincia).filter((p): p is ProvinciaEnum => Boolean(p)));
    return Array.from(provincias).sort();
  }, [suppliers]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch = searchTerm === '' ||
        supplier.razonSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.cuit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = !estadoFilter || supplier.estado === estadoFilter;
      const matchesCiudad = ciudadFilter === 'all' || supplier.ciudad === ciudadFilter;
      const matchesProvincia = provinciaFilter === 'all' || supplier.provincia === provinciaFilter;
      return matchesSearch && matchesEstado && matchesCiudad && matchesProvincia;
    });
  }, [suppliers, searchTerm, estadoFilter, ciudadFilter, provinciaFilter]);

  // Paginate filtered suppliers
  const paginatedSuppliers = useMemo(() => {
    return filteredSuppliers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredSuppliers, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <BusinessIcon />
          Gestión de Proveedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          fullWidth={isMobile}
        >
          Agregar Proveedor
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Typography variant="h6">Filtros</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <TextField
              fullWidth
              label="Buscar"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por razón social, CUIT, email..."
            />
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={estadoFilter}
                label="Estado"
                onChange={(e) => setEstadoFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
                <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Ciudad</InputLabel>
              <Select
                value={ciudadFilter}
                label="Ciudad"
                onChange={(e) => setCiudadFilter(e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                {uniqueCiudades.map((ciudad) => (
                  <MenuItem key={ciudad} value={ciudad}>
                    {ciudad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Provincia</InputLabel>
              <Select
                value={provinciaFilter}
                label="Provincia"
                onChange={(e) => setProvinciaFilter(e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                {uniqueProvincias.map((provincia) => (
                  <MenuItem key={provincia} value={provincia}>
                    {provincia && PROVINCIA_LABELS[provincia as ProvinciaEnum] || provincia}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Razón Social</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>CUIT</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Email</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Teléfono</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Dirección</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Ciudad</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Provincia</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Código Postal</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 120 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography variant="body1" color="textSecondary">
                        No hay proveedores que coincidan con los filtros
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSuppliers.map((supplier) => (
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
                      <TableCell>{supplier.provincia ? PROVINCIA_LABELS[supplier.provincia] : '-'}</TableCell>
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

          <TablePagination
            component="div"
            count={filteredSuppliers.length}
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
        </CardContent>
      </Card>

      {/* Supplier Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
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
                select
                label="Provincia"
                value={formData.provincia || ''}
                onChange={(e) => setFormData({ ...formData, provincia: e.target.value as ProvinciaEnum })}
                fullWidth
              >
                <MenuItem value="">Seleccionar provincia</MenuItem>
                {Object.entries(PROVINCIA_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
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