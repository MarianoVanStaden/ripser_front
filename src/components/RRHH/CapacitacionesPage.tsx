// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
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
  Stack,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Verified as CertifiedIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { capacitacionApi } from '../../api/services/capacitacionApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { Capacitacion, Empleado } from '../../types';
import dayjs from 'dayjs';

const CapacitacionesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Capacitacion | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingCapacitacion, setEditingCapacitacion] = useState<Capacitacion | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [certificadoFilter, setEstadoCertificado] = useState<string>('TODOS');

  // Form state
  const [formData, setFormData] = useState({
    empleadoId: '',
    nombre: '',
    descripcion: '',
    institucion: '',
    fechaInicio: dayjs().format('YYYY-MM-DD'),
    fechaFin: dayjs().add(1, 'week').format('YYYY-MM-DD'),
    horas: '',
    certificado: false,
    costo: '0'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [capacitacionesData, empleadosData] = await Promise.all([
        capacitacionApi.getAll(),
        employeeApi.getAllList()
      ]);
      
      console.log('Capacitaciones raw data:', capacitacionesData);
      console.log('Empleados data:', empleadosData);
      
      // Mapear las capacitaciones para incluir el objeto empleado completo
      const capacitacionesConEmpleado = Array.isArray(capacitacionesData)
        ? capacitacionesData.map((capacitacion: any) => {
            // Buscar el empleado en el array
            const empleado = empleadosData.find((e: any) => e.id === capacitacion.empleado?.id);
            return {
              ...capacitacion,
              empleado: empleado || capacitacion.empleado || {
                id: capacitacion.empleadoId || capacitacion.empleado?.id,
                nombre: capacitacion.empleadoNombre || capacitacion.empleado?.nombre || '',
                apellido: capacitacion.empleadoApellido || capacitacion.empleado?.apellido || '',
                dni: capacitacion.empleadoDni || capacitacion.empleado?.dni || ''
              }
            };
          })
        : [];
      
      console.log('Capacitaciones mapped:', capacitacionesConEmpleado);
      
      setCapacitaciones(capacitacionesConEmpleado);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setCapacitaciones([]);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmpleadoNombre = (empleado: Empleado) => {
    return `${empleado.nombre} ${empleado.apellido}`;
  };

  const filteredCapacitaciones = capacitaciones.filter(c => {
    if (!c.empleado) return false; // Skip if empleado is undefined
    
    const matchesEmpleado = !empleadoFilter || c.empleado.id === empleadoFilter.id;
    const matchesCertificado = certificadoFilter === 'TODOS' || 
      (certificadoFilter === 'CON_CERTIFICADO' && c.certificado) ||
      (certificadoFilter === 'SIN_CERTIFICADO' && !c.certificado);
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(c.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.institucion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpleado && matchesCertificado && matchesSearch;
  });

  const handleOpenForm = (capacitacion?: Capacitacion) => {
    if (capacitacion) {
      setEditingCapacitacion(capacitacion);
      setFormData({
        empleadoId: capacitacion.empleado?.id?.toString() || '',
        nombre: capacitacion.nombre,
        descripcion: capacitacion.descripcion || '',
        institucion: capacitacion.institucion || '',
        fechaInicio: capacitacion.fechaInicio,
        fechaFin: capacitacion.fechaFin,
        horas: capacitacion.horas.toString(),
        certificado: capacitacion.certificado,
        costo: capacitacion.costo.toString()
      });
    } else {
      setEditingCapacitacion(null);
      setFormData({
        empleadoId: '',
        nombre: '',
        descripcion: '',
        institucion: '',
        fechaInicio: dayjs().format('YYYY-MM-DD'),
        fechaFin: dayjs().add(1, 'week').format('YYYY-MM-DD'),
        horas: '',
        certificado: false,
        costo: '0'
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingCapacitacion(null);
    setFormData({
      empleadoId: '',
      nombre: '',
      descripcion: '',
      institucion: '',
      fechaInicio: dayjs().format('YYYY-MM-DD'),
      fechaFin: dayjs().add(1, 'week').format('YYYY-MM-DD'),
      horas: '',
      certificado: false,
      costo: '0'
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCapacitacion = async () => {
    try {
      setError(null);

      if (!formData.empleadoId || formData.empleadoId === '') {
        setError('Debe seleccionar un empleado');
        return;
      }

      if (!formData.nombre.trim()) {
        setError('El nombre de la capacitación es obligatorio');
        return;
      }

      if (!formData.fechaInicio || !formData.fechaFin) {
        setError('Las fechas son obligatorias');
        return;
      }

      const horas = parseInt(formData.horas) || 0;
      if (horas <= 0) {
        setError('Las horas deben ser mayor a 0');
        return;
      }

      const empleadoIdParsed = parseInt(formData.empleadoId);
      if (isNaN(empleadoIdParsed) || empleadoIdParsed <= 0) {
        setError('ID de empleado inválido');
        return;
      }

      const capacitacionData: any = {
        empleadoId: empleadoIdParsed,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        institucion: formData.institucion.trim() || null,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        horas: horas,
        certificado: formData.certificado,
        costo: parseFloat(formData.costo) || 0
      };

      if (editingCapacitacion) {
        await capacitacionApi.update(editingCapacitacion.id, { ...capacitacionData, id: editingCapacitacion.id });
      } else {
        await capacitacionApi.create(capacitacionData);
      }

      await loadData();
      handleCloseForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la capacitación');
      console.error('Error saving capacitacion:', err);
    }
  };

  const handleDeleteCapacitacion = async () => {
    if (!selected) return;
    
    try {
      setError(null);
      await capacitacionApi.delete(selected.id);
      await loadData();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la capacitación');
      console.error('Error deleting capacitacion:', err);
      setOpenDelete(false);
    }
  };

  const handleViewDetails = (capacitacion: Capacitacion) => {
    setSelected(capacitacion);
    setOpenDetail(true);
  };

  const handleOpenDelete = (capacitacion: Capacitacion) => {
    setSelected(capacitacion);
    setOpenDelete(true);
  };

  // Estadísticas
  const totalHoras = filteredCapacitaciones.reduce((sum, c) => sum + c.horas, 0);
  const totalCosto = filteredCapacitaciones.reduce((sum, c) => sum + c.costo, 0);
  const totalCertificados = filteredCapacitaciones.filter(c => c.certificado).length;
  const empleadosCapacitados = new Set(
    filteredCapacitaciones
      .filter(c => c.empleado?.id)
      .map(c => c.empleado.id)
  ).size;

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
          Capacitaciones
        </Typography>
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
            Nueva Capacitación
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas Rápidas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <SchoolIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {filteredCapacitaciones.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Capacitaciones
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <CertifiedIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {totalCertificados}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Certificados
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <TimeIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {totalHoras}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Horas Totales
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <MoneyIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${totalCosto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Inversión
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box mb={2}>
            <Grid container spacing={2}>
              {/* Búsqueda */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Empleado, nombre, institución..."
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

              {/* Filtro por Empleado */}
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={empleados}
                  getOptionLabel={(option) => getEmpleadoNombre(option)}
                  value={empleadoFilter}
                  onChange={(_, newValue) => setEmpleadoFilter(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Empleado" size="small" />
                  )}
                  size="small"
                />
              </Grid>

              {/* Filtro por Certificado */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Certificado"
                  value={certificadoFilter}
                  onChange={(e) => setEstadoCertificado(e.target.value)}
                  size="small"
                >
                  <option value="TODOS">Todos</option>
                  <option value="CON_CERTIFICADO">Con Certificado</option>
                  <option value="SIN_CERTIFICADO">Sin Certificado</option>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Empleado</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Capacitación</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Institución</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Período</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Horas</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Certificado</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Costo</TableCell>
                  <TableCell align="center" sx={{ minWidth: 110 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCapacitaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay capacitaciones registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCapacitaciones.map(capacitacion => (
                    <TableRow key={capacitacion.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {capacitacion.empleado ? getEmpleadoNombre(capacitacion.empleado) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {capacitacion.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {capacitacion.institucion ? (
                          <Chip
                            icon={<BusinessIcon />}
                            label={capacitacion.institucion}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(capacitacion.fechaInicio).format('DD/MM/YYYY')} - {dayjs(capacitacion.fechaFin).format('DD/MM/YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<TimeIcon />}
                          label={`${capacitacion.horas}h`}
                          size="small"
                          color="info"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {capacitacion.certificado ? (
                          <Chip
                            icon={<CertifiedIcon />}
                            label="Certificado"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            label="Sin certificar"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600" color="warning.main">
                          ${capacitacion.costo.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Ver Detalle">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewDetails(capacitacion)}
                            >
                              <SchoolIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenForm(capacitacion)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(capacitacion)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
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
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  {selected.nombre}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                {/* Información del Empleado */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
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
                        {selected.institucion && (
                          <Box>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                              Institución
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {selected.institucion}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Información de la Capacitación */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Detalles
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Período
                          </Typography>
                          <Typography variant="body1" fontWeight="500">
                            {dayjs(selected.fechaInicio).format('DD/MM/YYYY')} - {dayjs(selected.fechaFin).format('DD/MM/YYYY')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Horas
                          </Typography>
                          <Chip
                            icon={<TimeIcon />}
                            label={`${selected.horas}h`}
                            size="small"
                            color="info"
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Certificado
                          </Typography>
                          {selected.certificado ? (
                            <Chip icon={<CertifiedIcon />} label="Sí" size="small" color="success" />
                          ) : (
                            <Chip label="No" size="small" variant="outlined" />
                          )}
                        </Box>
                        <Divider />
                        <Box display="flex" justifyContent="space-between" pt={1}>
                          <Typography variant="h6" color="warning.main" fontWeight="700">
                            Costo
                          </Typography>
                          <Typography variant="h5" color="warning.main" fontWeight="700">
                            ${selected.costo.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Descripción */}
                {selected.descripcion && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                          📝 Descripción
                        </Typography>
                        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                            {selected.descripcion}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="outlined" onClick={() => setOpenDetail(false)}>
                Cerrar
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  setOpenDetail(false);
                  handleOpenForm(selected);
                }}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de Formulario */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {editingCapacitacion ? 'Editar Capacitación' : 'Nueva Capacitación'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={empleados}
                getOptionLabel={(option) => getEmpleadoNombre(option)}
                value={empleados.find(e => e.id.toString() === formData.empleadoId) || null}
                onChange={(_, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    empleadoId: newValue ? newValue.id.toString() : ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Empleado" required />
                )}
                disabled={!!editingCapacitacion}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre de la Capacitación"
                name="nombre"
                value={formData.nombre}
                onChange={handleFormChange}
                required
                fullWidth
                placeholder="Ej: Curso de Liderazgo"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Institución"
                name="institucion"
                value={formData.institucion}
                onChange={handleFormChange}
                fullWidth
                placeholder="Ej: Universidad Nacional"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha Inicio"
                name="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={handleFormChange}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha Fin"
                name="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={handleFormChange}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Horas"
                name="horas"
                type="number"
                value={formData.horas}
                onChange={handleFormChange}
                required
                fullWidth
                inputProps={{ min: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Costo"
                name="costo"
                type="number"
                value={formData.costo}
                onChange={handleFormChange}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.certificado}
                    onChange={(e) => setFormData(prev => ({ ...prev, certificado: e.target.checked }))}
                    color="success"
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <CertifiedIcon />
                    <Typography>Con Certificado</Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={4}
                placeholder="Descripción detallada de la capacitación, objetivos, temario..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseForm}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveCapacitacion}>
            {editingCapacitacion ? 'Guardar Cambios' : 'Crear Capacitación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la capacitación <strong>{selected?.nombre}</strong> de{' '}
            <strong>{selected && getEmpleadoNombre(selected.empleado)}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDelete(false)}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteCapacitacion}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapacitacionesPage;
