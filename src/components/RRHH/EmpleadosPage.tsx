import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { employeeApi } from '../../api/services/employeeApi';
import { puestoApi } from '../../api/services/puestoApi';
import type { Empleado, Puesto, EmpleadoCreateDTO } from '../../types';

const EmpleadosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [puestoFilter, setPuestoFilter] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState<EmpleadoCreateDTO>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    fechaIngreso: '',
    puestoId: 0,
    salario: 0,
    estado: 'ACTIVO'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empleadosData, puestosData] = await Promise.all([
        employeeApi.getAllList(),
        puestoApi.getAll()
      ]);
      setEmpleados(empleadosData);
      setPuestos(puestosData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setDetailDialogOpen(true);
  };

  const handleOpenForm = (empleado?: Empleado) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData({
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        dni: empleado.dni,
        email: empleado.email || '',
        telefono: empleado.telefono || '',
        direccion: empleado.direccion || '',
        fechaNacimiento: empleado.fechaNacimiento || '',
        fechaIngreso: empleado.fechaIngreso || '',
        puestoId: empleado.puesto?.id || 0,
        salario: empleado.salario || 0,
        estado: empleado.estado || 'ACTIVO'
      });
    } else {
      setEditingEmpleado(null);
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: '',
        fechaNacimiento: '',
        fechaIngreso: new Date().toISOString().split('T')[0],
        puestoId: 0,
        salario: 0,
        estado: 'ACTIVO'
      });
    }
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setEditingEmpleado(null);
    setError(null);
  };

  const handleSaveEmpleado = async () => {
    try {
      setError(null);

      // Validaciones
      if (!formData.nombre || !formData.apellido || !formData.dni) {
        setError('Nombre, Apellido y DNI son requeridos');
        return;
      }

      if (!formData.puestoId || formData.puestoId === 0) {
        setError('Debe seleccionar un puesto');
        return;
      }

      if (editingEmpleado) {
        await employeeApi.update(editingEmpleado.id, formData);
        setSuccess('Empleado actualizado exitosamente');
      } else {
        await employeeApi.create(formData);
        setSuccess('Empleado creado exitosamente');
      }

      await loadData();
      handleCloseForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el empleado');
      console.error('Error saving empleado:', err);
    }
  };

  const handleDeleteEmpleado = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este empleado?')) return;

    try {
      await employeeApi.delete(id);
      setSuccess('Empleado eliminado exitosamente');
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el empleado');
      console.error('Error deleting empleado:', err);
    }
  };

  const getEstadoColor = (estado: string): "default" | "success" | "error" | "warning" => {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'error';
      case 'LICENCIA':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredEmpleados = empleados.filter(emp => {
    const matchesEstado = estadoFilter === 'TODOS' || emp.estado === estadoFilter;
    const matchesPuesto = puestoFilter === null || emp.puesto?.id === puestoFilter;
    const matchesSearch = !searchTerm ||
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.dni.includes(searchTerm);

    return matchesEstado && matchesPuesto && matchesSearch;
  });

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
        <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
          <PersonIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
              Empleados
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Gestión de personal y empleados
            </Typography>
          </Box>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Nuevo Empleado
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card>
        <CardContent>
          {/* Filtros */}
          <Box mb={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Nombre, Apellido o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="ACTIVO">Activo</MenuItem>
                  <MenuItem value="INACTIVO">Inactivo</MenuItem>
                  <MenuItem value="LICENCIA">Licencia</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Puesto"
                  value={puestoFilter || ''}
                  onChange={(e) => setPuestoFilter(e.target.value ? Number(e.target.value) : null)}
                  size="small"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {puestos.map(puesto => (
                    <MenuItem key={puesto.id} value={puesto.id}>
                      {puesto.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Empleado</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>DNI</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Puesto</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Email</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Teléfono</TableCell>
                  <TableCell sx={{ minWidth: 90 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmpleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay empleados disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmpleados.map(empleado => (
                    <TableRow key={empleado.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            {empleado.nombre[0]}{empleado.apellido[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {empleado.nombre} {empleado.apellido}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{empleado.dni}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<WorkIcon />}
                          label={empleado.puesto?.nombre || '-'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{empleado.email || '-'}</TableCell>
                      <TableCell>{empleado.telefono || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={empleado.estado}
                          size="small"
                          color={getEstadoColor(empleado.estado)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Ver Detalle">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetail(empleado)}
                              color="info"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(empleado)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteEmpleado(empleado.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Detalle */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3 }
        }}
      >
        {selectedEmpleado && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 3 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 56, height: 56 }}>
                  {selectedEmpleado.nombre[0]}{selectedEmpleado.apellido[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="700">
                    {selectedEmpleado.nombre} {selectedEmpleado.apellido}
                  </Typography>
                  <Chip
                    label={selectedEmpleado.estado}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white'
                    }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                    INFORMACIÓN PERSONAL
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BadgeIcon color="action" />
                      <Typography><strong>DNI:</strong> {selectedEmpleado.dni}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon color="action" />
                      <Typography><strong>Email:</strong> {selectedEmpleado.email || '-'}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PhoneIcon color="action" />
                      <Typography><strong>Teléfono:</strong> {selectedEmpleado.telefono || '-'}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <HomeIcon color="action" />
                      <Typography><strong>Dirección:</strong> {selectedEmpleado.direccion || '-'}</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight="600" display="block" mb={1}>
                    INFORMACIÓN LABORAL
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <WorkIcon color="action" />
                      <Typography><strong>Puesto:</strong> {selectedEmpleado.puesto?.nombre || '-'}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachMoneyIcon color="action" />
                      <Typography><strong>Salario:</strong> ${selectedEmpleado.salario?.toLocaleString('es-AR') || '0'}</Typography>
                    </Box>
                    <Typography><strong>Fecha Nacimiento:</strong> {selectedEmpleado.fechaNacimiento || '-'}</Typography>
                    <Typography><strong>Fecha Ingreso:</strong> {selectedEmpleado.fechaIngreso || '-'}</Typography>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
              <Button onClick={() => setDetailDialogOpen(false)} variant="outlined">
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setDetailDialogOpen(false);
                  handleOpenForm(selectedEmpleado);
                }}
                variant="contained"
                startIcon={<EditIcon />}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de Formulario */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2.5 }}>
          <Typography variant="h5" fontWeight="600">
            {editingEmpleado ? '✏️ Editar Empleado' : '➕ Nuevo Empleado'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Información Personal */}
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom mb={2}>
                👤 INFORMACIÓN PERSONAL
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre *"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellido *"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="DNI *"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Nacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Información de Contacto */}
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom mb={2}>
                📞 CONTACTO
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Información Laboral */}
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom mb={2}>
                💼 INFORMACIÓN LABORAL
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Puesto *"
                    value={formData.puestoId}
                    onChange={(e) => setFormData({ ...formData, puestoId: Number(e.target.value) })}
                    required
                  >
                    <MenuItem value={0}>Seleccione un puesto</MenuItem>
                    {puestos.map(puesto => (
                      <MenuItem key={puesto.id} value={puesto.id}>
                        {puesto.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Salario"
                    type="number"
                    value={formData.salario}
                    onChange={(e) => setFormData({ ...formData, salario: Number(e.target.value) })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Ingreso"
                    type="date"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Estado *"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    required
                  >
                    <MenuItem value="ACTIVO">Activo</MenuItem>
                    <MenuItem value="INACTIVO">Inactivo</MenuItem>
                    <MenuItem value="LICENCIA">Licencia</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.100' }}>
          <Button onClick={handleCloseForm} variant="outlined" sx={{ minWidth: 120 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEmpleado}
            variant="contained"
            disabled={!formData.nombre || !formData.apellido || !formData.dni || !formData.puestoId}
            sx={{ minWidth: 160 }}
          >
            {editingEmpleado ? '💾 Guardar Cambios' : '➕ Crear Empleado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmpleadosPage;
