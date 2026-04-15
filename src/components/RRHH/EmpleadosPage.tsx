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
  useTheme,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Autocomplete,
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
  AttachMoney as AttachMoneyIcon,
  AccountCircle as AccountCircleIcon,
  LinkOff as LinkOffIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { employeeApi } from '../../api/services/employeeApi';
import { puestoApi } from '../../api/services/puestoApi';
import { documentoEmpleadoApi } from '../../api/services/documentoEmpleadoApi';
import usuarioAdminApi, { type UsuarioDTO } from '../../api/services/usuarioAdminApi';
import { sucursalService } from '../../services/sucursalService';
import { useTenant } from '../../context/TenantContext';
import DocumentManager from '../shared/DocumentManager';
import type { Empleado, Puesto, EmpleadoCreateDTO, Sucursal } from '../../types';

// Categorías de documentos para empleados
const CATEGORIAS_EMPLEADO = [
  'DNI',
  'CUIT',
  'CV',
  'CERTIFICADO_TRABAJO',
  'RECIBO_SUELDO',
  'LICENCIA_CONDUCIR',
  'CERTIFICADO_MEDICO',
  'ALTA_AFIP',
  'CONTRATO',
  'CERTIFICADO',
  'FOTO',
  'OTROS',
];

const EmpleadosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { empresaId } = useTenant();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [detailTabValue, setDetailTabValue] = useState(0);

  // Vincular usuario dialog
  const [vincularDialogOpen, setVincularDialogOpen] = useState(false);
  const [vincularEmpleadoTarget, setVincularEmpleadoTarget] = useState<Empleado | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<UsuarioDTO | null>(null);
  const [vincularLoading, setVincularLoading] = useState(false);
  const [inactiveWarning, setInactiveWarning] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [puestoFilter, setPuestoFilter] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState<EmpleadoCreateDTO & { confirmPassword?: string }>({
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
    estado: 'ACTIVO',
    sucursalId: undefined,
    crearUsuario: false,
    usuarioPassword: '',
    confirmPassword: '',
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
        puestoApi.getAll(),
      ]);
      setEmpleados(empleadosData);
      setPuestos(puestosData.content || []);

      if (empresaId) {
        try {
          const sucursalesData = await sucursalService.getByEmpresa(empresaId);
          setSucursales(sucursalesData.filter(s => s.estado === 'ACTIVO'));
        } catch {
          // sucursales not critical
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setDetailTabValue(0);
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
        estado: empleado.estado || 'ACTIVO',
        sucursalId: empleado.sucursalId,
        crearUsuario: false,
        usuarioPassword: '',
        confirmPassword: '',
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
        estado: 'ACTIVO',
        sucursalId: undefined,
        crearUsuario: false,
        usuarioPassword: '',
        confirmPassword: '',
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

      if (!formData.nombre || !formData.apellido || !formData.dni) {
        setError('Nombre, Apellido y DNI son requeridos');
        return;
      }

      if (!formData.puestoId || formData.puestoId === 0) {
        setError('Debe seleccionar un puesto');
        return;
      }

      if (!editingEmpleado && formData.crearUsuario) {
        if (!formData.email) {
          setError('El email es requerido para crear una cuenta de acceso');
          return;
        }
        if (!formData.usuarioPassword || formData.usuarioPassword.length < 8) {
          setError('La contraseña debe tener al menos 8 caracteres');
          return;
        }
        if (formData.usuarioPassword !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          return;
        }
      }

      const { confirmPassword, ...payload } = formData;
      if (!payload.crearUsuario) {
        delete payload.usuarioPassword;
      }

      if (editingEmpleado) {
        await employeeApi.update(editingEmpleado.id, payload);
        setSuccess('Empleado actualizado exitosamente');
      } else {
        await employeeApi.create(payload);
        setSuccess(
          payload.crearUsuario
            ? `Empleado creado exitosamente. Se creó la cuenta de acceso con usuario emp_${payload.dni}`
            : 'Empleado creado exitosamente'
        );
      }

      await loadData();
      handleCloseForm();
      setTimeout(() => setSuccess(null), 5000);
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

  const handleOpenVincularDialog = async (empleado: Empleado) => {
    setVincularEmpleadoTarget(empleado);
    setSelectedUsuario(null);
    setVincularLoading(true);
    setVincularDialogOpen(true);
    try {
      const data = await usuarioAdminApi.getAll(0, 200);
      // Only show users that don't have a linked empleado (or are already this one's)
      setUsuarios(data.content.filter(u => u.empleadoId === null || u.empleadoId === empleado.usuarioId));
    } catch {
      setUsuarios([]);
    } finally {
      setVincularLoading(false);
    }
  };

  const handleConfirmVincular = async () => {
    if (!vincularEmpleadoTarget || !selectedUsuario) return;
    try {
      await employeeApi.vincularUsuario(vincularEmpleadoTarget.id, selectedUsuario.id);
      setSuccess('Usuario vinculado correctamente');
      setVincularDialogOpen(false);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al vincular usuario');
    }
  };

  const handleDesvincularUsuario = async (empleado: Empleado) => {
    if (!window.confirm('¿Desvincular la cuenta de acceso de este empleado?')) return;
    try {
      await employeeApi.desvincularUsuario(empleado.id);
      setSuccess('Usuario desvinculado correctamente');
      await loadData();
      // Update detail dialog if open
      if (selectedEmpleado?.id === empleado.id) {
        setSelectedEmpleado({ ...selectedEmpleado, usuarioId: null });
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desvincular usuario');
    }
  };

  const getEstadoColor = (estado: string): 'default' | 'success' | 'error' | 'warning' => {
    switch (estado) {
      case 'ACTIVO': return 'success';
      case 'INACTIVO': return 'error';
      case 'LICENCIA': return 'warning';
      default: return 'default';
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
      {inactiveWarning && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setInactiveWarning(null)}>
          {inactiveWarning}
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
                  <TableCell align="center" sx={{ minWidth: 60 }}>Acceso</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmpleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
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
                          label={empleado.puesto?.nombre || empleado.puestoNombre || '-'}
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
                      <TableCell align="center">
                        {empleado.usuarioId !== null ? (
                          <Tooltip title={`Usuario #${empleado.usuarioId} vinculado`}>
                            <AccountCircleIcon color="success" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Sin cuenta de acceso">
                            <AccountCircleIcon color="disabled" fontSize="small" />
                          </Tooltip>
                        )}
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
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        {selectedEmpleado && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', pb: 2 }}>
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
                    sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Box>
              </Box>
            </DialogTitle>
            <Tabs
              value={detailTabValue}
              onChange={(_, newValue) => setDetailTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Información" />
              <Tab label="Acceso al sistema" />
              <Tab label="Documentos" />
            </Tabs>
            <DialogContent sx={{ pt: 3, minHeight: 400 }}>
              {detailTabValue === 0 && (
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
                        <Typography><strong>Puesto:</strong> {selectedEmpleado.puesto?.nombre || selectedEmpleado.puestoNombre || '-'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AttachMoneyIcon color="action" />
                        <Typography><strong>Salario:</strong> ${selectedEmpleado.salario?.toLocaleString('es-AR') || '0'}</Typography>
                      </Box>
                      <Typography><strong>Fecha Nacimiento:</strong> {selectedEmpleado.fechaNacimiento || '-'}</Typography>
                      <Typography><strong>Fecha Ingreso:</strong> {selectedEmpleado.fechaIngreso || '-'}</Typography>
                      {selectedEmpleado.sucursalId && (
                        <Typography>
                          <strong>Sucursal:</strong>{' '}
                          {sucursales.find(s => s.id === selectedEmpleado.sucursalId)?.nombre || `#${selectedEmpleado.sucursalId}`}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              )}

              {detailTabValue === 1 && (
                <Stack spacing={2}>
                  {selectedEmpleado.usuarioId !== null ? (
                    <Box>
                      <Alert severity="success" icon={<AccountCircleIcon />} sx={{ mb: 2 }}>
                        Este empleado tiene acceso al sistema
                      </Alert>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            <strong>Usuario vinculado:</strong> #{selectedEmpleado.usuarioId}
                          </Typography>
                        </Stack>
                      </Paper>
                      <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<LinkOffIcon />}
                          onClick={() => handleDesvincularUsuario(selectedEmpleado)}
                        >
                          Desvincular cuenta
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Este empleado no tiene cuenta de acceso al sistema
                      </Alert>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => {
                            setDetailDialogOpen(false);
                            handleOpenVincularDialog(selectedEmpleado);
                          }}
                        >
                          Vincular cuenta existente
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}

              {detailTabValue === 2 && (
                <DocumentManager
                  entityId={selectedEmpleado.id}
                  categorias={CATEGORIAS_EMPLEADO}
                  onUpload={async (file, categoria, descripcion) => {
                    await documentoEmpleadoApi.upload(selectedEmpleado.id, file, categoria, descripcion);
                  }}
                  onDownload={async (id, fileName) => {
                    await documentoEmpleadoApi.downloadAndSave(selectedEmpleado.id, id, fileName);
                  }}
                  onDelete={async (id) => {
                    await documentoEmpleadoApi.delete(selectedEmpleado.id, id);
                  }}
                  onLoad={async (empleadoId) => {
                    const docs = await documentoEmpleadoApi.getByEmpleadoId(empleadoId);
                    return docs.map(doc => ({
                      id: doc.id,
                      nombreArchivo: doc.nombreOriginal,
                      tipoArchivo: doc.mimeType || '',
                      tamanioBytes: doc.sizeBytes,
                      descripcion: doc.descripcion,
                      categoria: doc.categoria,
                      fechaSubida: doc.fechaSubida,
                      subidoPor: doc.subidoPor || ''
                    }));
                  }}
                />
              )}
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
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2.5 }}>
          <Typography variant="h5" fontWeight="600">
            {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* Información Personal */}
            <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom mb={2}>
                INFORMACIÓN PERSONAL
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
                CONTACTO
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={formData.crearUsuario ? 'Email *' : 'Email'}
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
                INFORMACIÓN LABORAL
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
                {sucursales.length > 0 && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Sucursal"
                      value={formData.sucursalId || ''}
                      onChange={(e) => setFormData({ ...formData, sucursalId: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <MenuItem value="">Sin sucursal asignada</MenuItem>
                      {sucursales.map(s => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Cuenta de acceso — solo en creación */}
            {!editingEmpleado && (
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom mb={2}>
                  ACCESO AL SISTEMA
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!formData.crearUsuario}
                      onChange={(e) => setFormData({ ...formData, crearUsuario: e.target.checked })}
                    />
                  }
                  label="Crear cuenta de acceso al sistema"
                />
                {formData.crearUsuario && (
                  <Stack spacing={2} mt={2}>
                    <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                      Se creará el usuario <strong>emp_{formData.dni || '{DNI}'}</strong> con roles derivados del puesto seleccionado.
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Contraseña *"
                          type="password"
                          value={formData.usuarioPassword}
                          onChange={(e) => setFormData({ ...formData, usuarioPassword: e.target.value })}
                          helperText="Mínimo 8 caracteres"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirmar contraseña *"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          error={!!formData.confirmPassword && formData.confirmPassword !== formData.usuarioPassword}
                          helperText={
                            formData.confirmPassword && formData.confirmPassword !== formData.usuarioPassword
                              ? 'Las contraseñas no coinciden'
                              : ''
                          }
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                )}
              </Paper>
            )}
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
            {editingEmpleado ? 'Guardar Cambios' : 'Crear Empleado'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Vincular usuario existente */}
      <Dialog
        open={vincularDialogOpen}
        onClose={() => setVincularDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Vincular cuenta de acceso</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {vincularLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="textSecondary">
                Seleccione el usuario a vincular con <strong>{vincularEmpleadoTarget?.nombre} {vincularEmpleadoTarget?.apellido}</strong>
              </Typography>
              <Autocomplete
                options={usuarios}
                getOptionLabel={(u) => `${u.username} (${u.email})`}
                value={selectedUsuario}
                onChange={(_, val) => setSelectedUsuario(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Usuario" placeholder="Buscar usuario..." />
                )}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVincularDialogOpen(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmVincular}
            variant="contained"
            disabled={!selectedUsuario}
          >
            Vincular
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmpleadosPage;
