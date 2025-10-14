// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Stack, IconButton, Tooltip, Chip, Alert, CircularProgress,
  Autocomplete, FormControlLabel, Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Work as WorkIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { legajoApi } from '../../api/services/legajoApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { Legajo, Empleado } from '../../types';

const LegajosPage: React.FC = () => {
  const [legajos, setLegajos] = useState<Legajo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadosSinLegajo, setEmpleadosSinLegajo] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  
  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Legajo | null>(null);
  const [editingLegajo, setEditingLegajo] = useState<Legajo | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    empleadoId: '',
    numeroLegajo: '',
    fechaAlta: dayjs().format('YYYY-MM-DD'),
    fechaBaja: '',
    motivoBaja: '',
    documentacion: '',
    observaciones: '',
    activo: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [legajosData, empleadosData] = await Promise.all([
        legajoApi.getAll(),
        employeeApi.getAllList()
      ]);
      
      console.log('Legajos raw data:', legajosData);
      console.log('Empleados data:', empleadosData);
      
      // Mapear los legajos para incluir el objeto empleado completo
      const legajosConEmpleado = Array.isArray(legajosData) 
        ? legajosData.map((legajo: any) => {
            const empleado = empleadosData.find((e: any) => e.id === legajo.empleadoId);
            return {
              ...legajo,
              empleado: empleado || {
                id: legajo.empleadoId,
                nombre: legajo.empleadoNombre || '',
                apellido: legajo.empleadoApellido || '',
                dni: legajo.empleadoDni || ''
              }
            };
          })
        : [];
      
      console.log('Legajos mapped:', legajosConEmpleado);
      
      // Calcular empleados sin legajo asignado
      const empleadosConLegajoIds = new Set(
        legajosConEmpleado.map(leg => leg.empleado?.id).filter(Boolean)
      );
      const empleadosDisponibles = Array.isArray(empleadosData)
        ? empleadosData.filter(emp => !empleadosConLegajoIds.has(emp.id))
        : [];
      
      console.log('Empleados con legajo (IDs):', Array.from(empleadosConLegajoIds));
      console.log('Empleados sin legajo:', empleadosDisponibles);
      
      setLegajos(legajosConEmpleado);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setEmpleadosSinLegajo(empleadosDisponibles);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setLegajos([]);
      setEmpleados([]);
      setEmpleadosSinLegajo([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmpleadoNombre = (empleado: Empleado) => {
    return `${empleado.nombre} ${empleado.apellido}`;
  };

  const filteredLegajos = legajos.filter(l => {
    if (!l.empleado) return false;
    
    const matchesEmpleado = !empleadoFilter || l.empleado.id === empleadoFilter.id;
    const matchesEstado = estadoFilter === 'TODOS' || 
      (estadoFilter === 'ACTIVOS' && l.activo) ||
      (estadoFilter === 'INACTIVOS' && !l.activo);
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(l.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.numeroLegajo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpleado && matchesEstado && matchesSearch;
  });

  const handleOpenForm = (legajo?: Legajo) => {
    if (legajo) {
      setEditingLegajo(legajo);
      setFormData({
        empleadoId: legajo.empleado?.id?.toString() || '',
        numeroLegajo: legajo.numeroLegajo,
        fechaAlta: legajo.fechaAlta,
        fechaBaja: legajo.fechaBaja || '',
        motivoBaja: legajo.motivoBaja || '',
        documentacion: legajo.documentacion || '',
        observaciones: legajo.observaciones || '',
        activo: legajo.activo
      });
    } else {
      setEditingLegajo(null);
      setFormData({
        empleadoId: '',
        numeroLegajo: '',
        fechaAlta: dayjs().format('YYYY-MM-DD'),
        fechaBaja: '',
        motivoBaja: '',
        documentacion: '',
        observaciones: '',
        activo: true
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingLegajo(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveLegajo = async () => {
    try {
      if (!formData.empleadoId || !formData.numeroLegajo || !formData.fechaAlta) {
        setError('Por favor complete los campos obligatorios');
        return;
      }

      const empleadoIdParsed = parseInt(formData.empleadoId);
      if (isNaN(empleadoIdParsed) || empleadoIdParsed <= 0) {
        setError('ID de empleado inválido');
        return;
      }

      const legajoData = {
        empleadoId: empleadoIdParsed,
        numeroLegajo: formData.numeroLegajo,
        fechaAlta: formData.fechaAlta,
        fechaBaja: formData.fechaBaja || null,
        motivoBaja: formData.motivoBaja || null,
        documentacion: formData.documentacion || null,
        observaciones: formData.observaciones || null,
        activo: formData.activo !== undefined ? formData.activo : true
      };

      console.log('Sending legajo data:', legajoData);

      if (editingLegajo) {
        await legajoApi.update(editingLegajo.id, legajoData);
      } else {
        await legajoApi.create(legajoData as any);
      }

      await loadData();
      handleCloseForm();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el legajo');
      console.error('Error saving legajo:', err);
    }
  };

  const handleDeleteLegajo = async () => {
    if (!selected) return;
    
    try {
      await legajoApi.delete(selected.id);
      await loadData();
      setOpenDelete(false);
      setSelected(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el legajo');
      console.error('Error deleting legajo:', err);
    }
  };

  const handleViewDetails = (legajo: Legajo) => {
    setSelected(legajo);
    setOpenDetail(true);
  };

  const handleOpenDelete = (legajo: Legajo) => {
    setSelected(legajo);
    setOpenDelete(true);
  };

  // Estadísticas
  const totalActivos = filteredLegajos.filter(l => l.activo).length;
  const totalInactivos = filteredLegajos.filter(l => !l.activo).length;
  const empleadosRegistrados = new Set(
    filteredLegajos
      .filter(l => l.empleado?.id)
      .map(l => l.empleado.id)
  ).size;

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
        <Typography variant="h4" fontWeight="700" color="primary">
          Gestión de Legajos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          size="large"
        >
          Nuevo Legajo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="700" color="primary.main">
                    {filteredLegajos.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Legajos
                  </Typography>
                </Box>
                <BadgeIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="700" color="success.main">
                    {totalActivos}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Activos
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="700" color="error.main">
                    {totalInactivos}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Inactivos
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'info.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="700" color="info.main">
                    {empleadosRegistrados}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Empleados
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por empleado o legajo..."
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={empleados}
                getOptionLabel={(empleado) => getEmpleadoNombre(empleado)}
                value={empleadoFilter}
                onChange={(_, newValue) => setEmpleadoFilter(newValue)}
                renderInput={(params) => <TextField {...params} label="Empleado" size="small" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Empleado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Nº Legajo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Fecha Alta</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Fecha Baja</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Antigüedad</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLegajos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay legajos registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLegajos.map(legajo => {
                    const antiguedadAnios = dayjs().diff(dayjs(legajo.fechaAlta), 'year');
                    const antiguedadMeses = dayjs().diff(dayjs(legajo.fechaAlta), 'month') % 12;
                    
                    return (
                      <TableRow key={legajo.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {legajo.empleado ? getEmpleadoNombre(legajo.empleado) : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<BadgeIcon />}
                            label={legajo.numeroLegajo}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {dayjs(legajo.fechaAlta).format('DD/MM/YYYY')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {legajo.fechaBaja ? (
                            <Typography variant="body2" color="error.main">
                              {dayjs(legajo.fechaBaja).format('DD/MM/YYYY')}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={<CalendarIcon />}
                            label={`${antiguedadAnios}a ${antiguedadMeses}m`}
                            size="small"
                            color="info"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {legajo.activo ? (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Activo"
                              size="small"
                              color="success"
                            />
                          ) : (
                            <Chip
                              icon={<CancelIcon />}
                              label="Inactivo"
                              size="small"
                              color="error"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Ver Detalle">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewDetails(legajo)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenForm(legajo)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDelete(legajo)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <BadgeIcon />
                <Typography variant="h6" fontWeight="600">
                  Detalle de Legajo - {selected.numeroLegajo}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Información del Empleado */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Empleado
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Nombre
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                            {selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Nº de Legajo
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {selected.numeroLegajo}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Fechas */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Fechas
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Fecha de Alta
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {dayjs(selected.fechaAlta).format('DD/MM/YYYY')}
                          </Typography>
                        </Box>
                        {selected.fechaBaja && (
                          <Box>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                              Fecha de Baja
                            </Typography>
                            <Typography variant="body1" color="error.main" sx={{ mt: 0.5 }}>
                              {dayjs(selected.fechaBaja).format('DD/MM/YYYY')}
                            </Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Antigüedad
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {dayjs().diff(dayjs(selected.fechaAlta), 'year')} años {dayjs().diff(dayjs(selected.fechaAlta), 'month') % 12} meses
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Estado */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Estado Laboral
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body2" color="textSecondary" fontWeight="600">
                          Estado:
                        </Typography>
                        {selected.activo ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Activo"
                            color="success"
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label="Inactivo"
                            color="error"
                          />
                        )}
                      </Box>
                      {selected.motivoBaja && (
                        <Box mt={2}>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Motivo de Baja
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {selected.motivoBaja}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Documentación */}
                {selected.documentacion && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary" fontWeight="600" textTransform="uppercase" gutterBottom>
                          <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                          Documentación
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {selected.documentacion}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Observaciones */}
                {selected.observaciones && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary" fontWeight="600" textTransform="uppercase" gutterBottom>
                          Observaciones
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {selected.observaciones}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDetail(false)} variant="outlined">
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <BadgeIcon />
            <Typography variant="h6" fontWeight="600">
              {editingLegajo ? 'Editar Legajo' : 'Nuevo Legajo'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={editingLegajo ? empleados : empleadosSinLegajo}
                getOptionLabel={(empleado) => getEmpleadoNombre(empleado)}
                value={empleados.find(e => e.id.toString() === formData.empleadoId) || null}
                onChange={(_, newValue) => handleFormChange('empleadoId', newValue?.id.toString() || '')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Empleado *" 
                    required 
                    helperText={!editingLegajo && empleadosSinLegajo.length === 0 
                      ? "Todos los empleados ya tienen legajo asignado" 
                      : !editingLegajo 
                        ? "Solo se muestran empleados sin legajo" 
                        : undefined
                    }
                  />
                )}
                disabled={!!editingLegajo}
                noOptionsText={!editingLegajo 
                  ? "No hay empleados disponibles (todos tienen legajo)" 
                  : "No hay empleados"
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Legajo *"
                value={formData.numeroLegajo}
                onChange={(e) => handleFormChange('numeroLegajo', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Alta *"
                value={formData.fechaAlta}
                onChange={(e) => handleFormChange('fechaAlta', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Baja"
                value={formData.fechaBaja}
                onChange={(e) => handleFormChange('fechaBaja', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo de Baja"
                value={formData.motivoBaja}
                onChange={(e) => handleFormChange('motivoBaja', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Documentación"
                value={formData.documentacion}
                onChange={(e) => handleFormChange('documentacion', e.target.value)}
                multiline
                rows={2}
                placeholder="Referencias a documentación, archivos, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => handleFormChange('observaciones', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) => handleFormChange('activo', e.target.checked)}
                    color="success"
                  />
                }
                label="Legajo Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleSaveLegajo} variant="contained" startIcon={<BadgeIcon />}>
            {editingLegajo ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            ¿Está seguro que desea eliminar este legajo?
          </Typography>
          {selected && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>Empleado:</strong> {selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Nº Legajo:</strong> {selected.numeroLegajo}
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong> {selected.activo ? 'Activo' : 'Inactivo'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleDeleteLegajo} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LegajosPage;
