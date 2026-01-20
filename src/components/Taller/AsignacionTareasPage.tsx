// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Button,
  Dialog,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  InputAdornment,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { tareaServicioApi } from '../../api/services/tareaServicioApi';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { TareaServicio, OrdenServicio, Empleado } from '../../types';

const AsignacionTareasPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tareas, setTareas] = useState<TareaServicio[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<TareaServicio | null>(null);

  // Estados para modal de completar tarea
  const [completarDialogOpen, setCompletarDialogOpen] = useState(false);
  const [tareaToComplete, setTareaToComplete] = useState<TareaServicio | null>(null);
  const [horasRealesInput, setHorasRealesInput] = useState<string>('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [ordenFilter, setOrdenFilter] = useState<number | null>(null);
  const [empleadoFilter, setEmpleadoFilter] = useState<number | null>(null);

  // Form data
  const [formData, setFormData] = useState<{
    ordenServicioId: string;
    empleadoId: string;
    descripcion: string;
    horasEstimadas: string;
    horasReales: string;
    observaciones: string;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA';
  }>({
    ordenServicioId: '',
    empleadoId: '',
    descripcion: '',
    horasEstimadas: '1',
    horasReales: '0',
    observaciones: '',
    estado: 'PENDIENTE'
  });

  useEffect(() => {
    loadTareas();
    loadOrdenes();
    loadEmpleados();
  }, []);

  const loadTareas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tareaServicioApi.getAll();
      // Handle paginated response if backend returns Page<T>
      setTareas(Array.isArray(data) ? data : (data as any).content || []);
    } catch (err) {
      setError('Error al cargar las tareas');
      console.error('Error loading tareas:', err);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenes = async () => {
    try {
      const data = await ordenServicioApi.getAll();
      // Filtrar solo órdenes que no estén finalizadas o canceladas
      const ordenesActivas = (Array.isArray(data) ? data : []).filter(
        (o: OrdenServicio) => o.estado === 'PENDIENTE' || o.estado === 'EN_PROCESO'
      );
      setOrdenes(ordenesActivas);
    } catch (err) {
      console.error('Error loading ordenes:', err);
      setOrdenes([]);
    }
  };

  const loadEmpleados = async () => {
    try {
      const data = await employeeApi.getAllList();
      setEmpleados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading empleados:', err);
      setEmpleados([]);
    }
  };

  const handleOpenForm = (tarea?: TareaServicio) => {
    if (tarea) {
      setEditingTarea(tarea);
      setFormData({
        ordenServicioId: tarea.ordenServicioId.toString(),
        empleadoId: tarea.empleadoId?.toString() || '',
        descripcion: tarea.descripcion,
        horasEstimadas: tarea.horasEstimadas.toString(),
        horasReales: tarea.horasReales?.toString() || '0',
        observaciones: tarea.observaciones || '',
        estado: tarea.estado
      });
    } else {
      setEditingTarea(null);
      setFormData({
        ordenServicioId: '',
        empleadoId: '',
        descripcion: '',
        horasEstimadas: '1',
        horasReales: '0',
        observaciones: '',
        estado: 'PENDIENTE'
      });
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingTarea(null);
    setFormData({
      ordenServicioId: '',
      empleadoId: '',
      descripcion: '',
      horasEstimadas: '1',
      horasReales: '0',
      observaciones: '',
      estado: 'PENDIENTE'
    });
  };

  const handleSaveTarea = async () => {
    console.log('formData before validation:', formData);
    
    // Validación: verificar que ordenServicioId esté presente
    if (!formData.ordenServicioId) {
      setError('Por favor seleccione una Orden de Servicio');
      return;
    }

    try {
      const tareaData: any = {
        ordenServicioId: parseInt(formData.ordenServicioId),
        empleadoId: formData.empleadoId ? parseInt(formData.empleadoId) : null,
        descripcion: formData.descripcion,
        horasEstimadas: parseInt(formData.horasEstimadas) || 1,
        horasReales: parseInt(formData.horasReales) || 0,
        observaciones: formData.observaciones || '',
        estado: formData.estado
      };

      console.log('Saving tarea with data:', tareaData);

      if (editingTarea) {
        await tareaServicioApi.update(editingTarea.id, tareaData);
      } else {
        await tareaServicioApi.create(tareaData);
      }

      await loadTareas();
      handleCloseForm();
      setError(null);
    } catch (err: any) {
      let errorMsg = 'Error al guardar la tarea';
      if (err.response?.status === 400) {
        const errors = err.response?.data;
        if (typeof errors === 'object' && errors !== null) {
          const errorMessages = Object.values(errors).join(', ');
          errorMsg = `Error de validación: ${errorMessages}`;
        }
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
      console.error('Error saving tarea:', err);
    }
  };

  const handleDeleteTarea = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta tarea?')) return;

    try {
      await tareaServicioApi.delete(id);
      await loadTareas();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la tarea');
      console.error('Error deleting tarea:', err);
    }
  };

  const handleIniciarTarea = async (id: number) => {
    try {
      await tareaServicioApi.iniciar(id);
      await loadTareas();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar la tarea');
      console.error('Error starting tarea:', err);
    }
  };

  const handleCompletarTarea = (tarea: TareaServicio) => {
    setTareaToComplete(tarea);
    setHorasRealesInput(tarea.horasEstimadas?.toString() || '1');
    setCompletarDialogOpen(true);
  };

  const handleConfirmCompletar = async () => {
    if (!tareaToComplete) return;

    try {
      const horas = parseInt(horasRealesInput);
      if (isNaN(horas) || horas < 0) {
        setError('Por favor ingrese un número válido de horas');
        return;
      }
      await tareaServicioApi.completar(tareaToComplete.id, horas);
      await loadTareas();
      setCompletarDialogOpen(false);
      setTareaToComplete(null);
      setHorasRealesInput('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al completar la tarea');
      console.error('Error completing tarea:', err);
    }
  };

  const handleCancelCompletar = () => {
    setCompletarDialogOpen(false);
    setTareaToComplete(null);
    setHorasRealesInput('');
  };

  const getOrdenInfo = (tarea: TareaServicio) => {
    const orden = ordenes.find(o => o.id === tarea.ordenServicioId);
    return orden ? `${orden.numeroOrden} - ${orden.descripcionTrabajo.substring(0, 30)}...` : `Orden #${tarea.ordenServicioId}`;
  };

  const getEmpleadoNombre = (tarea: TareaServicio) => {
    if (tarea.empleado) {
      return `${tarea.empleado.nombre} ${tarea.empleado.apellido}`;
    }
    if (tarea.empleadoId) {
      const empleado = empleados.find(e => e.id === tarea.empleadoId);
      return empleado ? `${empleado.nombre} ${empleado.apellido}` : `Empleado #${tarea.empleadoId}`;
    }
    return 'Sin asignar';
  };

  const getEstadoColor = (estado: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (estado) {
      case 'COMPLETADA':
        return 'success';
      case 'EN_PROCESO':
        return 'warning';
      case 'PENDIENTE':
      default:
        return 'default';
    }
  };

  // Filter and sort tareas by creation date descending (newest first)
  const filteredTareas = useMemo(() => {
    const filtered = tareas.filter(t => {
      const matchesEstado = estadoFilter === 'TODOS' || t.estado === estadoFilter;
      const matchesOrden = ordenFilter === null || t.ordenServicioId === ordenFilter;
      const matchesEmpleado = empleadoFilter === null || t.empleadoId === empleadoFilter;
      const matchesSearch = !searchTerm ||
        t.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getOrdenInfo(t).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getEmpleadoNombre(t).toLowerCase().includes(searchTerm.toLowerCase());

      return matchesEstado && matchesOrden && matchesEmpleado && matchesSearch;
    });

    // Sort by id descending (newest first) - assuming higher ID = more recent
    return filtered.sort((a, b) => b.id - a.id);
  }, [tareas, estadoFilter, ordenFilter, empleadoFilter, searchTerm]);

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
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Asignación de Tareas
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadTareas} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Nueva Tarea
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box mb={2}>
            <Grid container spacing={2}>
              {/* Búsqueda */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Descripción, Orden, Empleado..."
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

              {/* Filtro por Estado */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                  <MenuItem value="COMPLETADA">Completada</MenuItem>
                </TextField>
              </Grid>

              {/* Filtro por Orden */}
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  options={ordenes}
                  getOptionLabel={(option) => option.numeroOrden}
                  value={ordenes.find(o => o.id === ordenFilter) || null}
                  onChange={(_, value) => setOrdenFilter(value?.id || null)}
                  renderInput={(params) => (
                    <TextField {...params} label="Filtrar por Orden" />
                  )}
                />
              </Grid>

              {/* Filtro por Empleado */}
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  size="small"
                  options={empleados}
                  getOptionLabel={(option) => `${option.nombre} ${option.apellido}`}
                  value={empleados.find(e => e.id === empleadoFilter) || null}
                  onChange={(_, value) => setEmpleadoFilter(value?.id || null)}
                  renderInput={(params) => (
                    <TextField {...params} label="Filtrar por Empleado" />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>Orden</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Descripción</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Empleado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 90 }}>Horas Est.</TableCell>
                  <TableCell align="center" sx={{ minWidth: 90 }}>Horas Reales</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTareas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay tareas disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTareas.map(tarea => (
                    <TableRow key={tarea.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {getOrdenInfo(tarea)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tarea.descripcion}
                        </Typography>
                        {tarea.observaciones && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {tarea.observaciones}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getEmpleadoNombre(tarea)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<AccessTimeIcon />}
                          label={`${tarea.horasEstimadas}h`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {tarea.horasReales > 0 ? (
                          <Chip
                            icon={<AccessTimeIcon />}
                            label={`${tarea.horasReales}h`}
                            size="small"
                            color={tarea.horasReales <= tarea.horasEstimadas ? 'success' : 'error'}
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tarea.estado}
                          color={getEstadoColor(tarea.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenForm(tarea)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          {tarea.estado === 'PENDIENTE' && (
                            <Tooltip title="Iniciar Tarea">
                              <IconButton
                                size="small"
                                onClick={() => handleIniciarTarea(tarea.id)}
                                color="warning"
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {tarea.estado === 'EN_PROCESO' && (
                            <Tooltip title="Completar Tarea">
                              <IconButton
                                size="small"
                                onClick={() => handleCompletarTarea(tarea)}
                                color="success"
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {tarea.estado === 'PENDIENTE' && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteTarea(tarea.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
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

      {/* Dialog de Formulario Crear/Editar */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 2.5
          }}
        >
          <Typography variant="h5" fontWeight="600">
            {editingTarea ? '✏️ Editar Tarea' : '➕ Nueva Tarea'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            {editingTarea ? 'Modifique los campos necesarios' : 'Complete los datos de la nueva tarea'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Orden de Servicio */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  📋 ORDEN DE SERVICIO
                </Typography>
                <Autocomplete
                  options={ordenes}
                  getOptionLabel={(orden) => `${orden.numeroOrden} - ${orden.descripcionTrabajo}`}
                  value={ordenes.find(o => o.id.toString() === formData.ordenServicioId) || null}
                  onChange={(_, value) =>
                    setFormData({ ...formData, ordenServicioId: value?.id.toString() || '' })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Orden de Servicio *"
                      required
                      placeholder="Seleccione una orden"
                      sx={{ bgcolor: 'white' }}
                    />
                  )}
                />
              </Paper>

              {/* Descripción y Empleado */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  📝 DETALLES DE LA TAREA
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Descripción de la Tarea *"
                    multiline
                    rows={3}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    required
                    placeholder="Describa la tarea a realizar..."
                    sx={{ bgcolor: 'white' }}
                  />

                  <Autocomplete
                    options={empleados}
                    getOptionLabel={(empleado) => `${empleado.nombre} ${empleado.apellido}`}
                    value={empleados.find(e => e.id.toString() === formData.empleadoId) || null}
                    onChange={(_, value) =>
                      setFormData({ ...formData, empleadoId: value?.id.toString() || '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Empleado Asignado"
                        placeholder="Seleccione un empleado (opcional)"
                        sx={{ bgcolor: 'white' }}
                      />
                    )}
                  />

                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales sobre la tarea..."
                    sx={{ bgcolor: 'white' }}
                  />
                </Stack>
              </Paper>

              {/* Horas y Estado */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  ⏱️ HORAS Y ESTADO
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={editingTarea ? 4 : 6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Horas Estimadas *"
                      value={formData.horasEstimadas}
                      onChange={(e) => setFormData({ ...formData, horasEstimadas: e.target.value })}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={editingTarea ? 4 : 6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Horas Reales"
                      value={formData.horasReales}
                      onChange={(e) => setFormData({ ...formData, horasReales: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTimeIcon />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Se actualiza al completar la tarea"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>

                  {editingTarea && (
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        select
                        label="Estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({
                          ...formData,
                          estado: e.target.value as typeof formData.estado
                        })}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="PENDIENTE">⏳ Pendiente</MenuItem>
                        <MenuItem value="EN_PROCESO">🔧 En Proceso</MenuItem>
                        <MenuItem value="COMPLETADA">✅ Completada</MenuItem>
                      </TextField>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Nota informativa */}
              <Alert
                severity="info"
                icon={<Box component="span" sx={{ fontSize: '1.2rem' }}>💡</Box>}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight="600" gutterBottom>
                  <strong>Gestión de Tareas:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  • Asigne tareas a empleados para llevar control del trabajo<br />
                  • Las horas estimadas ayudan a planificar la carga de trabajo<br />
                  • Use los botones de acción para cambiar el estado de las tareas<br />
                  • Las horas reales se registran al completar la tarea
                </Typography>
              </Alert>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.100', borderTop: '1px solid', borderColor: 'grey.300' }}>
          <Button
            onClick={handleCloseForm}
            size="large"
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTarea}
            variant="contained"
            size="large"
            disabled={!formData.ordenServicioId || !formData.descripcion || !formData.horasEstimadas}
            sx={{ minWidth: 160 }}
          >
            {editingTarea ? '💾 Guardar Cambios' : '➕ Crear Tarea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Completar Tarea con Horas Reales */}
      <Dialog
        open={completarDialogOpen}
        onClose={handleCancelCompletar}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            py: 3,
            textAlign: 'center'
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
            <CheckCircleIcon sx={{ fontSize: 56, opacity: 0.9 }} />
            <Typography variant="h5" fontWeight="700">
              Completar Tarea
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
              Registre las horas reales trabajadas
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 4, pb: 3 }}>
          {tareaToComplete && (
            <Stack spacing={3}>
              {/* Información de la Tarea */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase" display="block" mb={1}>
                  Tarea a Completar
                </Typography>
                <Typography variant="body1" fontWeight="600" gutterBottom>
                  {tareaToComplete.descripcion}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  Orden: {getOrdenInfo(tareaToComplete)}
                </Typography>
              </Paper>

              {/* Comparación de Horas */}
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'info.50',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'info.main',
                        textAlign: 'center'
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                      <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">
                        Horas Estimadas
                      </Typography>
                      <Typography variant="h4" fontWeight="700" color="info.main">
                        {tareaToComplete.horasEstimadas}h
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'success.50',
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: 'success.main',
                        textAlign: 'center'
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="caption" color="textSecondary" fontWeight="600" display="block">
                        Horas Reales
                      </Typography>
                      <Typography variant="h4" fontWeight="700" color="success.main">
                        {horasRealesInput || '0'}h
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Input de Horas Reales */}
              <TextField
                fullWidth
                type="number"
                label="Horas Reales Trabajadas"
                value={horasRealesInput}
                onChange={(e) => setHorasRealesInput(e.target.value)}
                autoFocus
                required
                inputProps={{ min: 0, step: 0.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon color="success" />
                    </InputAdornment>
                  ),
                }}
                helperText="Ingrese las horas efectivamente trabajadas en esta tarea"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& input': {
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'success.main'
                    }
                  }
                }}
              />

              {/* Alerta informativa */}
              {parseInt(horasRealesInput) > tareaToComplete.horasEstimadas && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    Las horas reales <strong>({horasRealesInput}h)</strong> superan las estimadas <strong>({tareaToComplete.horasEstimadas}h)</strong>.
                    Esto afectará el cálculo del costo de mano de obra.
                  </Typography>
                </Alert>
              )}

              {parseInt(horasRealesInput) <= tareaToComplete.horasEstimadas && parseInt(horasRealesInput) > 0 && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    ¡Excelente! La tarea se completó dentro del tiempo estimado.
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.50', gap: 1 }}>
          <Button
            onClick={handleCancelCompletar}
            size="large"
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmCompletar}
            variant="contained"
            size="large"
            color="success"
            disabled={!horasRealesInput || parseInt(horasRealesInput) < 0}
            startIcon={<CheckCircleIcon />}
            sx={{ minWidth: 180 }}
          >
            Completar Tarea
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AsignacionTareasPage;
