/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
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
  MenuItem,
  FormControlLabel,
  Switch,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pending as PendingIcon,
  BeachAccess as VacationIcon,
  LocalHospital as SickIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { licenciaApi } from '../../api/services/licenciaApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { Licencia, Empleado, TipoLicencia, EstadoLicencia } from '../../types';
import dayjs from 'dayjs';
import LoadingOverlay from '../common/LoadingOverlay';

const LicenciasPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Licencia | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openApproval, setOpenApproval] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [editingLicencia, setEditingLicencia] = useState<Licencia | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');

  // Form state
  const [formData, setFormData] = useState({
    empleadoId: '',
    tipo: '' as TipoLicencia | '',
    fechaInicio: dayjs().format('YYYY-MM-DD'),
    fechaFin: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    dias: '1',
    motivo: '',
    goceHaber: true,
    estado: 'SOLICITADA' as EstadoLicencia
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [licenciasData, empleadosData] = await Promise.all([
        licenciaApi.getAll(),
        employeeApi.getAllList()
      ]);
      
      console.log('Licencias raw data:', licenciasData);
      console.log('Empleados data:', empleadosData);
      
      // Mapear empleadoId a objeto empleado completo
      const empleadoFallback = { id: 0, nombre: 'Desconocido', apellido: '', puesto: '', email: '' };
      const licenciasConEmpleado = Array.isArray(licenciasData)
        ? licenciasData.map((licencia: any) => {
            const empleado = empleadosData.find((e: any) => e.id === licencia.empleadoId);
            return {
              ...licencia,
              empleado: empleado || licencia.empleado || empleadoFallback
            };
          })
        : [];
      
      console.log('Licencias with empleado:', licenciasConEmpleado);
      
      setLicencias(licenciasConEmpleado);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setLicencias([]);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmpleadoNombre = (empleado: Empleado | undefined) => {
    if (!empleado) return 'Desconocido';
    return `${empleado.nombre} ${empleado.apellido}`;
  };

  const getTipoIcon = (tipo: TipoLicencia) => {
    switch (tipo) {
      case 'VACACIONES':
        return <VacationIcon />;
      case 'ENFERMEDAD':
        return <SickIcon />;
      case 'MATERNIDAD':
      case 'PERSONAL':
        return <PersonIcon />;
      default:
        return <CalendarIcon />;
    }
  };

  const getTipoColor = (tipo: TipoLicencia): "primary" | "error" | "warning" | "info" => {
    switch (tipo) {
      case 'VACACIONES':
        return 'primary';
      case 'ENFERMEDAD':
        return 'error';
      case 'MATERNIDAD':
        return 'warning';
      case 'PERSONAL':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getEstadoColor = (estado: EstadoLicencia): "warning" | "success" | "error" => {
    switch (estado) {
      case 'SOLICITADA':
        return 'warning';
      case 'APROBADA':
        return 'success';
      case 'RECHAZADA':
        return 'error';
      default:
        return 'warning';
    }
  };

  const calcularDias = (fechaInicio: string, fechaFin: string): number => {
    const inicio = dayjs(fechaInicio);
    const fin = dayjs(fechaFin);
    return fin.diff(inicio, 'day') + 1;
  };

  const filteredLicencias = licencias.filter(l => {
    if (!l.empleado) return false; // Safety check
    
    const matchesEmpleado = !empleadoFilter || l.empleado.id === empleadoFilter.id;
    const matchesTipo = tipoFilter === 'TODOS' || l.tipo === tipoFilter;
    const matchesEstado = estadoFilter === 'TODOS' || l.estado === estadoFilter;
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(l.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.motivo?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpleado && matchesTipo && matchesEstado && matchesSearch;
  });

  const handleOpenForm = (licencia?: Licencia) => {
    if (licencia) {
      setEditingLicencia(licencia);
      setFormData({
        empleadoId: licencia.empleado?.id?.toString() || '',
        tipo: licencia.tipo,
        fechaInicio: licencia.fechaInicio,
        fechaFin: licencia.fechaFin,
        dias: licencia.dias.toString(),
        motivo: licencia.motivo || '',
        goceHaber: licencia.goceHaber,
        estado: licencia.estado
      });
    } else {
      setEditingLicencia(null);
      setFormData({
        empleadoId: '',
        tipo: '' as TipoLicencia | '',
        fechaInicio: dayjs().format('YYYY-MM-DD'),
        fechaFin: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        dias: '1',
        motivo: '',
        goceHaber: true,
        estado: 'SOLICITADA'
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingLicencia(null);
    setFormData({
      empleadoId: '',
      tipo: '' as TipoLicencia | '',
      fechaInicio: dayjs().format('YYYY-MM-DD'),
      fechaFin: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      dias: '1',
      motivo: '',
      goceHaber: true,
      estado: 'SOLICITADA'
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calcular días cuando cambian las fechas
      if (name === 'fechaInicio' || name === 'fechaFin') {
        const inicio = name === 'fechaInicio' ? value : prev.fechaInicio;
        const fin = name === 'fechaFin' ? value : prev.fechaFin;
        if (inicio && fin) {
          newData.dias = calcularDias(inicio, fin).toString();
        }
      }
      
      return newData;
    });
  };

  const handleSaveLicencia = async () => {
    try {
      setError(null);

      if (!formData.empleadoId) {
        setError('Debe seleccionar un empleado');
        return;
      }

      const empleadoIdParsed = parseInt(formData.empleadoId);
      if (isNaN(empleadoIdParsed) || empleadoIdParsed <= 0) {
        setError('ID de empleado inválido');
        return;
      }

      if (!formData.tipo) {
        setError('Debe seleccionar un tipo de licencia');
        return;
      }

      if (!formData.fechaInicio || !formData.fechaFin) {
        setError('Las fechas son obligatorias');
        return;
      }

      const dias = parseInt(formData.dias) || 0;
      if (dias <= 0) {
        setError('Los días deben ser mayor a 0');
        return;
      }

      const licenciaData: any = {
        empleadoId: empleadoIdParsed,
        tipo: formData.tipo,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        dias: dias,
        motivo: formData.motivo.trim() || null,
        goceHaber: formData.goceHaber,
        estado: formData.estado
      };

      console.log('💾 Sending licencia to backend:', licenciaData);

      if (editingLicencia) {
        await licenciaApi.update(editingLicencia.id, { ...licenciaData, id: editingLicencia.id });
      } else {
        await licenciaApi.create(licenciaData);
      }

      await loadData();
      handleCloseForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la licencia');
      console.error('Error saving licencia:', err);
    }
  };

  const handleDeleteLicencia = async () => {
    if (!selected) return;
    
    try {
      setError(null);
      await licenciaApi.delete(selected.id);
      await loadData();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la licencia');
      console.error('Error deleting licencia:', err);
      setOpenDelete(false);
    }
  };

  const handleOpenApproval = (licencia: Licencia, action: 'APROBADA' | 'RECHAZADA') => {
    setSelected(licencia);
    setApprovalAction(action);
    setOpenApproval(true);
  };

  const handleApprovalAction = async () => {
    if (!selected) return;
    
    try {
      setError(null);
      await licenciaApi.update(selected.id, {
        ...selected,
        estado: approvalAction
      });
      await loadData();
      setOpenApproval(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el estado de la licencia');
      console.error('Error updating licencia status:', err);
      setOpenApproval(false);
    }
  };

  const handleViewDetails = (licencia: Licencia) => {
    setSelected(licencia);
    setOpenDetail(true);
  };

  const handleOpenDelete = (licencia: Licencia) => {
    setSelected(licencia);
    setOpenDelete(true);
  };

  // Estadísticas
  const totalSolicitadas = licencias.filter(l => l.estado === 'SOLICITADA').length;
  const totalAprobadas = licencias.filter(l => l.estado === 'APROBADA').length;
  const totalRechazadas = licencias.filter(l => l.estado === 'RECHAZADA').length;
  const totalDiasLicencia = filteredLicencias.reduce((sum, l) => sum + l.dias, 0);

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando licencias..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Gestión de Licencias
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
            Nueva Licencia
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas Rápidas */}
      <Grid container spacing={{ xs: 2, sm: 2 }} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <PendingIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {totalSolicitadas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Solicitadas
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
                <ApproveIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {totalAprobadas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Aprobadas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <RejectIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {totalRechazadas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Rechazadas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <CalendarIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {totalDiasLicencia}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Días Totales
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
                  placeholder="Empleado, motivo..."
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

              {/* Filtro por Tipo */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Tipo"
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="VACACIONES">Vacaciones</MenuItem>
                  <MenuItem value="ENFERMEDAD">Enfermedad</MenuItem>
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="MATERNIDAD">Maternidad</MenuItem>
                </TextField>
              </Grid>

              {/* Filtro por Estado */}
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
                  <MenuItem value="SOLICITADA">Solicitadas</MenuItem>
                  <MenuItem value="APROBADA">Aprobadas</MenuItem>
                  <MenuItem value="RECHAZADA">Rechazadas</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 850, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Empleado</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Tipo</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Período</TableCell>
                  <TableCell align="center" sx={{ minWidth: 70 }}>Días</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Goce Haber</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 130 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLicencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay licencias registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLicencias.map(licencia => (
                    <TableRow key={licencia.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {getEmpleadoNombre(licencia.empleado)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTipoIcon(licencia.tipo)}
                          label={licencia.tipo}
                          size="small"
                          color={getTipoColor(licencia.tipo)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(licencia.fechaInicio).format('DD/MM/YYYY')} - {dayjs(licencia.fechaFin).format('DD/MM/YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${licencia.dias} días`}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {licencia.goceHaber ? (
                          <Chip icon={<MoneyIcon />} label="Sí" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="No" size="small" color="default" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={licencia.estado}
                          size="small"
                          color={getEstadoColor(licencia.estado)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {licencia.estado === 'SOLICITADA' && (
                            <>
                              <Tooltip title="Aprobar">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenApproval(licencia, 'APROBADA')}
                                >
                                  <ApproveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenApproval(licencia, 'RECHAZADA')}
                                >
                                  <RejectIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenForm(licencia)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(licencia)}
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
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {editingLicencia ? 'Editar Licencia' : 'Nueva Licencia'}
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
              disabled={!!editingLicencia}
            />
            <TextField
              select
              label="Tipo de Licencia"
              name="tipo"
              value={formData.tipo}
              onChange={handleFormChange}
              required
              fullWidth
            >
              <MenuItem value="VACACIONES">Vacaciones</MenuItem>
              <MenuItem value="ENFERMEDAD">Enfermedad</MenuItem>
              <MenuItem value="PERSONAL">Personal</MenuItem>
              <MenuItem value="MATERNIDAD">Maternidad</MenuItem>
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
              <Grid item xs={6}>
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
            </Grid>
            <TextField
              label="Días"
              name="dias"
              type="number"
              value={formData.dias}
              onChange={handleFormChange}
              required
              fullWidth
              inputProps={{ min: 1 }}
              helperText="Se calcula automáticamente según las fechas"
            />
            <TextField
              label="Motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={3}
              placeholder="Descripción o razón de la licencia..."
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.goceHaber}
                  onChange={(e) => setFormData(prev => ({ ...prev, goceHaber: e.target.checked }))}
                  color="success"
                />
              }
              label="Con Goce de Haber"
            />
            <TextField
              select
              label="Estado"
              name="estado"
              value={formData.estado}
              onChange={handleFormChange}
              required
              fullWidth
            >
              <MenuItem value="SOLICITADA">Solicitada</MenuItem>
              <MenuItem value="APROBADA">Aprobada</MenuItem>
              <MenuItem value="RECHAZADA">Rechazada</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseForm}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveLicencia}>
            {editingLicencia ? 'Guardar Cambios' : 'Crear Licencia'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Aprobación/Rechazo */}
      <Dialog open={openApproval} onClose={() => setOpenApproval(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {approvalAction === 'APROBADA' ? 'Aprobar Licencia' : 'Rechazar Licencia'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea <strong>{approvalAction === 'APROBADA' ? 'aprobar' : 'rechazar'}</strong> la licencia de{' '}
            <strong>{selected && getEmpleadoNombre(selected.empleado)}</strong>?
          </Typography>
          {selected && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2"><strong>Tipo:</strong> {selected.tipo}</Typography>
              <Typography variant="body2"><strong>Período:</strong> {dayjs(selected.fechaInicio).format('DD/MM/YYYY')} - {dayjs(selected.fechaFin).format('DD/MM/YYYY')}</Typography>
              <Typography variant="body2"><strong>Días:</strong> {selected.dias}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenApproval(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={approvalAction === 'APROBADA' ? 'success' : 'error'}
            onClick={handleApprovalAction}
          >
            {approvalAction === 'APROBADA' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la licencia de{' '}
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
          <Button variant="contained" color="error" onClick={handleDeleteLicencia}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LicenciasPage;
