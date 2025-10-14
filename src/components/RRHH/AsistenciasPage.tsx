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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TimerOff as TimerOffIcon
} from '@mui/icons-material';
import { registroAsistenciaApi } from '../../api/services/registroAsistenciaApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { RegistroAsistencia, Empleado } from '../../types';
import dayjs from 'dayjs';

const AsistenciasPage: React.FC = () => {
  const [asistencias, setAsistencias] = useState<RegistroAsistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RegistroAsistencia | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingAsistencia, setEditingAsistencia] = useState<RegistroAsistencia | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [fechaDesde, setFechaDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fechaHasta, setFechaHasta] = useState(dayjs().format('YYYY-MM-DD'));

  // Form state
  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha: dayjs().format('YYYY-MM-DD'),
    horaEntrada: '09:00',
    horaSalida: '18:00',
    horasTrabajadas: '',
    horasExtras: '0',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (fechaDesde && fechaHasta) {
      loadAsistenciasByPeriodo();
    }
  }, [fechaDesde, fechaHasta]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empleadosData] = await Promise.all([
        employeeApi.getAllList()
      ]);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      await loadAsistenciasByPeriodo();
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setEmpleados([]);
      setAsistencias([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAsistenciasByPeriodo = async () => {
    try {
      setError(null);
      const data = await registroAsistenciaApi.getByPeriodo(fechaDesde, fechaHasta);
      setAsistencias(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar las asistencias');
      console.error('Error loading asistencias:', err);
      setAsistencias([]);
    }
  };

  const getEmpleadoNombre = (empleado: Empleado) => {
    return `${empleado.nombre} ${empleado.apellido}`;
  };

  const calcularHorasTrabajadas = (entrada: string, salida: string): number => {
    if (!entrada || !salida) return 0;
    
    const [horaEntrada, minEntrada] = entrada.split(':').map(Number);
    const [horaSalida, minSalida] = salida.split(':').map(Number);
    
    const minutosEntrada = horaEntrada * 60 + minEntrada;
    const minutosSalida = horaSalida * 60 + minSalida;
    
    const diferenciaMinutos = minutosSalida - minutosEntrada;
    return Math.max(0, Math.round((diferenciaMinutos / 60) * 100) / 100);
  };

  const filteredAsistencias = asistencias.filter(a => {
    const matchesEmpleado = !empleadoFilter || a.empleado.id === empleadoFilter.id;
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(a.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpleado && matchesSearch;
  });

  const handleOpenForm = (asistencia?: RegistroAsistencia) => {
    if (asistencia) {
      setEditingAsistencia(asistencia);
      setFormData({
        empleadoId: asistencia.empleado.id.toString(),
        fecha: asistencia.fecha,
        horaEntrada: asistencia.horaEntrada,
        horaSalida: asistencia.horaSalida,
        horasTrabajadas: asistencia.horasTrabajadas.toString(),
        horasExtras: asistencia.horasExtras.toString(),
        observaciones: asistencia.observaciones || ''
      });
    } else {
      setEditingAsistencia(null);
      setFormData({
        empleadoId: '',
        fecha: dayjs().format('YYYY-MM-DD'),
        horaEntrada: '09:00',
        horaSalida: '18:00',
        horasTrabajadas: '',
        horasExtras: '0',
        observaciones: ''
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingAsistencia(null);
    setFormData({
      empleadoId: '',
      fecha: dayjs().format('YYYY-MM-DD'),
      horaEntrada: '09:00',
      horaSalida: '18:00',
      horasTrabajadas: '',
      horasExtras: '0',
      observaciones: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calcular horas trabajadas cuando cambian entrada o salida
      if (name === 'horaEntrada' || name === 'horaSalida') {
        const entrada = name === 'horaEntrada' ? value : prev.horaEntrada;
        const salida = name === 'horaSalida' ? value : prev.horaSalida;
        newData.horasTrabajadas = calcularHorasTrabajadas(entrada, salida).toString();
      }
      
      return newData;
    });
  };

  const handleSaveAsistencia = async () => {
    try {
      setError(null);

      if (!formData.empleadoId) {
        setError('Debe seleccionar un empleado');
        return;
      }

      if (!formData.fecha) {
        setError('La fecha es obligatoria');
        return;
      }

      if (!formData.horaEntrada || !formData.horaSalida) {
        setError('Las horas de entrada y salida son obligatorias');
        return;
      }

      const horasTrabajadas = parseFloat(formData.horasTrabajadas) || 0;
      const horasExtras = parseFloat(formData.horasExtras) || 0;

      if (horasTrabajadas <= 0) {
        setError('Las horas trabajadas deben ser mayor a 0');
        return;
      }

      const asistenciaData: any = {
        empleadoId: parseInt(formData.empleadoId),
        fecha: formData.fecha,
        horaEntrada: formData.horaEntrada,
        horaSalida: formData.horaSalida,
        horasTrabajadas: horasTrabajadas,
        horasExtras: horasExtras,
        observaciones: formData.observaciones.trim() || null
      };

      if (editingAsistencia) {
        await registroAsistenciaApi.update(editingAsistencia.id, { ...asistenciaData, id: editingAsistencia.id });
      } else {
        await registroAsistenciaApi.create(asistenciaData);
      }

      await loadAsistenciasByPeriodo();
      handleCloseForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la asistencia');
      console.error('Error saving asistencia:', err);
    }
  };

  const handleDeleteAsistencia = async () => {
    if (!selected) return;
    
    try {
      setError(null);
      await registroAsistenciaApi.delete(selected.id);
      await loadAsistenciasByPeriodo();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la asistencia');
      console.error('Error deleting asistencia:', err);
      setOpenDelete(false);
    }
  };

  const handleViewDetails = (asistencia: RegistroAsistencia) => {
    setSelected(asistencia);
    setOpenDetail(true);
  };

  const handleOpenDelete = (asistencia: RegistroAsistencia) => {
    setSelected(asistencia);
    setOpenDelete(true);
  };

  // Estadísticas
  const totalHorasTrabajadas = filteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0);
  const totalHorasExtras = filteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0);
  const promedioHorasDiarias = filteredAsistencias.length > 0 
    ? totalHorasTrabajadas / filteredAsistencias.length 
    : 0;
  const empleadosUnicos = new Set(filteredAsistencias.map(a => a.empleado.id)).size;

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
        <Typography variant="h4">Registro de Asistencias</Typography>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadAsistenciasByPeriodo} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Registrar Asistencia
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CalendarIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {filteredAsistencias.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Registros
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TimeIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {Math.round(totalHorasTrabajadas)}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Horas Trabajadas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {Math.round(totalHorasExtras)}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Horas Extras
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PersonIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {empleadosUnicos}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Empleados
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
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Empleado, observaciones..."
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
              <Grid item xs={12} md={3}>
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

              {/* Fecha Desde */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Desde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Fecha Hasta */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Hasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Entrada</TableCell>
                  <TableCell align="center">Salida</TableCell>
                  <TableCell align="center">Horas Trabajadas</TableCell>
                  <TableCell align="center">Horas Extras</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAsistencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay asistencias registradas en el período seleccionado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAsistencias.map(asistencia => (
                    <TableRow key={asistencia.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {getEmpleadoNombre(asistencia.empleado)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dayjs(asistencia.fecha).format('DD/MM/YYYY')}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<TimeIcon />}
                          label={asistencia.horaEntrada}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<TimerOffIcon />}
                          label={asistencia.horaSalida}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          {asistencia.horasTrabajadas}h
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {asistencia.horasExtras > 0 ? (
                          <Chip
                            label={`${asistencia.horasExtras}h`}
                            size="small"
                            color="warning"
                          />
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {asistencia.observaciones || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenForm(asistencia)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(asistencia)}
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

      {/* Dialog de Formulario */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAsistencia ? 'Editar Asistencia' : 'Registrar Asistencia'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
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
              disabled={!!editingAsistencia}
            />
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={formData.fecha}
              onChange={handleFormChange}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Hora Entrada"
                  name="horaEntrada"
                  type="time"
                  value={formData.horaEntrada}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Hora Salida"
                  name="horaSalida"
                  type="time"
                  value={formData.horaSalida}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Horas Trabajadas"
                  name="horasTrabajadas"
                  type="number"
                  value={formData.horasTrabajadas}
                  onChange={handleFormChange}
                  required
                  fullWidth
                  inputProps={{ step: 0.1, min: 0 }}
                  helperText="Se calcula automáticamente"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Horas Extras"
                  name="horasExtras"
                  type="number"
                  value={formData.horasExtras}
                  onChange={handleFormChange}
                  fullWidth
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Grid>
            </Grid>
            <TextField
              label="Observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Notas adicionales sobre la jornada..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseForm}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveAsistencia}>
            {editingAsistencia ? 'Guardar Cambios' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el registro de asistencia de{' '}
            <strong>{selected && getEmpleadoNombre(selected.empleado)}</strong> del día{' '}
            <strong>{selected && dayjs(selected.fecha).format('DD/MM/YYYY')}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDelete(false)}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteAsistencia}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AsistenciasPage;
