// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Stack, IconButton, Tooltip, Chip, Alert, CircularProgress,
  Autocomplete, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { sueldoApi } from '../../api/services/sueldoApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { Sueldo, Empleado } from '../../types';

const SueldosPage: React.FC = () => {
  const [sueldos, setSueldos] = useState<Sueldo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [periodoFilter, setPeriodoFilter] = useState(dayjs().format('YYYY-MM'));
  
  // Dialog states
  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selected, setSelected] = useState<Sueldo | null>(null);
  const [editingSueldo, setEditingSueldo] = useState<Sueldo | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    empleadoId: '',
    periodo: dayjs().format('YYYY-MM'),
    sueldoBasico: '',
    bonificaciones: '0',
    horasExtras: '0',
    comisiones: '0',
    descuentosLegales: '0',
    descuentosOtros: '0',
    fechaPago: '',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sueldosData, empleadosData] = await Promise.all([
        sueldoApi.getAll(),
        employeeApi.getAllList()
      ]);
      
      console.log('Sueldos raw data:', sueldosData);
      console.log('Empleados data:', empleadosData);
      
      // Mapear los sueldos para incluir el objeto empleado completo
      const sueldosConEmpleado = Array.isArray(sueldosData) 
        ? sueldosData.map((sueldo: any) => {
            const empleado = empleadosData.find((e: any) => e.id === sueldo.empleadoId);
            return {
              ...sueldo,
              empleado: empleado || {
                id: sueldo.empleadoId,
                nombre: sueldo.empleadoNombre || '',
                apellido: sueldo.empleadoApellido || '',
                dni: sueldo.empleadoDni || ''
              }
            };
          })
        : [];
      
      console.log('Sueldos mapped:', sueldosConEmpleado);
      
      setSueldos(sueldosConEmpleado);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setSueldos([]);
      setEmpleados([]);
    } finally {
      setLoading(false);
    }
  };

  const getEmpleadoNombre = (empleado: Empleado) => {
    return `${empleado.nombre} ${empleado.apellido}`;
  };

  const filteredSueldos = sueldos.filter(s => {
    if (!s.empleado) return false;
    
    const matchesEmpleado = !empleadoFilter || s.empleado.id === empleadoFilter.id;
    const matchesPeriodo = !periodoFilter || s.periodo === periodoFilter;
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(s.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.periodo.includes(searchTerm);

    return matchesEmpleado && matchesPeriodo && matchesSearch;
  });

  const calcularTotales = () => {
    const basico = parseFloat(formData.sueldoBasico) || 0;
    const bonif = parseFloat(formData.bonificaciones) || 0;
    const extras = parseFloat(formData.horasExtras) || 0;
    const com = parseFloat(formData.comisiones) || 0;
    const descLeg = parseFloat(formData.descuentosLegales) || 0;
    const descOtros = parseFloat(formData.descuentosOtros) || 0;
    
    const totalBruto = basico + bonif + extras + com;
    const totalDescuentos = descLeg + descOtros;
    const sueldoNeto = totalBruto - totalDescuentos;
    
    return { totalBruto, totalDescuentos, sueldoNeto };
  };

  const handleOpenForm = (sueldo?: Sueldo) => {
    if (sueldo) {
      setEditingSueldo(sueldo);
      setFormData({
        empleadoId: sueldo.empleado?.id?.toString() || '',
        periodo: sueldo.periodo,
        sueldoBasico: sueldo.sueldoBasico.toString(),
        bonificaciones: sueldo.bonificaciones.toString(),
        horasExtras: sueldo.horasExtras.toString(),
        comisiones: sueldo.comisiones.toString(),
        descuentosLegales: sueldo.descuentosLegales.toString(),
        descuentosOtros: sueldo.descuentosOtros.toString(),
        fechaPago: sueldo.fechaPago || '',
        observaciones: sueldo.observaciones || ''
      });
    } else {
      setEditingSueldo(null);
      setFormData({
        empleadoId: '',
        periodo: dayjs().format('YYYY-MM'),
        sueldoBasico: '',
        bonificaciones: '0',
        horasExtras: '0',
        comisiones: '0',
        descuentosLegales: '0',
        descuentosOtros: '0',
        fechaPago: '',
        observaciones: ''
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingSueldo(null);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSueldo = async () => {
    try {
      if (!formData.empleadoId || !formData.periodo || !formData.sueldoBasico) {
        setError('Por favor complete los campos obligatorios');
        return;
      }

      const empleadoIdParsed = parseInt(formData.empleadoId);
      if (isNaN(empleadoIdParsed) || empleadoIdParsed <= 0) {
        setError('ID de empleado inválido');
        return;
      }

      const { totalBruto, totalDescuentos, sueldoNeto } = calcularTotales();

      const sueldoData = {
        empleadoId: empleadoIdParsed,
        periodo: formData.periodo,
        sueldoBasico: parseFloat(formData.sueldoBasico),
        bonificaciones: parseFloat(formData.bonificaciones) || 0,
        horasExtras: parseFloat(formData.horasExtras) || 0,
        comisiones: parseFloat(formData.comisiones) || 0,
        totalBruto,
        descuentosLegales: parseFloat(formData.descuentosLegales) || 0,
        descuentosOtros: parseFloat(formData.descuentosOtros) || 0,
        totalDescuentos,
        sueldoNeto,
        fechaPago: formData.fechaPago || null,
        observaciones: formData.observaciones || null
      };

      if (editingSueldo) {
        await sueldoApi.update(editingSueldo.id, sueldoData);
      } else {
        await sueldoApi.create(sueldoData as any);
      }

      await loadData();
      handleCloseForm();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el sueldo');
      console.error('Error saving sueldo:', err);
    }
  };

  const handleDeleteSueldo = async () => {
    if (!selected) return;
    
    try {
      await sueldoApi.delete(selected.id);
      await loadData();
      setOpenDelete(false);
      setSelected(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el sueldo');
      console.error('Error deleting sueldo:', err);
    }
  };

  const handleViewDetails = (sueldo: Sueldo) => {
    setSelected(sueldo);
    setOpenDetail(true);
  };

  const handleOpenDelete = (sueldo: Sueldo) => {
    setSelected(sueldo);
    setOpenDelete(true);
  };

  // Estadísticas
  const totalSueldosNeto = filteredSueldos.reduce((sum, s) => sum + s.sueldoNeto, 0);
  const totalBruto = filteredSueldos.reduce((sum, s) => sum + s.totalBruto, 0);
  const totalDescuentos = filteredSueldos.reduce((sum, s) => sum + s.totalDescuentos, 0);
  const empleadosCobrados = new Set(
    filteredSueldos
      .filter(s => s.empleado?.id)
      .map(s => s.empleado.id)
  ).size;

  const { totalBruto: formBruto, totalDescuentos: formDescuentos, sueldoNeto: formNeto } = calcularTotales();

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
          Gestión de Sueldos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          size="large"
        >
          Nuevo Sueldo
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
          <Card sx={{ borderLeft: 4, borderColor: 'success.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="700" color="success.main">
                    {filteredSueldos.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sueldos Registrados
                  </Typography>
                </Box>
                <ReceiptIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="700" color="primary.main">
                    ${totalBruto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Bruto
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="700" color="error.main">
                    ${totalDescuentos.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Descuentos
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main', boxShadow: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="700" color="warning.main">
                    ${totalSueldosNeto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Neto
                  </Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
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
                placeholder="Buscar por empleado o período..."
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
                fullWidth
                type="month"
                label="Período"
                variant="outlined"
                value={periodoFilter}
                onChange={(e) => setPeriodoFilter(e.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Período</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Sueldo Básico</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Total Bruto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Descuentos</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Sueldo Neto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado Pago</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSueldos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay sueldos registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSueldos.map(sueldo => (
                    <TableRow key={sueldo.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {sueldo.empleado ? getEmpleadoNombre(sueldo.empleado) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<CalendarIcon />}
                          label={dayjs(sueldo.periodo).format('MMMM YYYY')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="500">
                          ${sueldo.sueldoBasico.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600" color="primary.main">
                          ${sueldo.totalBruto.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="500" color="error.main">
                          ${sueldo.totalDescuentos.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="700" color="success.main">
                          ${sueldo.sueldoNeto.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {sueldo.fechaPago ? (
                          <Chip
                            icon={<PaymentIcon />}
                            label={`Pagado ${dayjs(sueldo.fechaPago).format('DD/MM/YYYY')}`}
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip
                            label="Pendiente"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Ver Detalle">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewDetails(sueldo)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenForm(sueldo)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(sueldo)}
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

      {/* Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <MoneyIcon />
                <Typography variant="h6" fontWeight="600">
                  Detalle de Sueldo - {selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Información del Empleado y Período */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Información General
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Empleado
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                            {selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Período
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {dayjs(selected.periodo).format('MMMM YYYY')}
                          </Typography>
                        </Box>
                        {selected.fechaPago && (
                          <Box>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                              Fecha de Pago
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {dayjs(selected.fechaPago).format('DD/MM/YYYY')}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Conceptos del Sueldo */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Conceptos Positivos
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Sueldo Básico
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            ${selected.sueldoBasico.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Bonificaciones
                          </Typography>
                          <Typography variant="body2">
                            ${selected.bonificaciones.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Horas Extras
                          </Typography>
                          <Typography variant="body2">
                            ${selected.horasExtras.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Comisiones
                          </Typography>
                          <Typography variant="body2">
                            ${selected.comisiones.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Descuentos */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <Typography variant="h6" color="error" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <TrendingDownIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Descuentos
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Descuentos Legales
                          </Typography>
                          <Typography variant="body2" color="error.main" fontWeight="500">
                            ${selected.descuentosLegales.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Otros Descuentos
                          </Typography>
                          <Typography variant="body2" color="error.main" fontWeight="500">
                            ${selected.descuentosOtros.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Totales */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1, bgcolor: 'success.lighter' }}>
                    <CardContent>
                      <Typography variant="h6" color="success.dark" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Resumen
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="600">
                            Total Bruto
                          </Typography>
                          <Typography variant="body2" fontWeight="600" color="primary.main">
                            ${selected.totalBruto.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" fontWeight="600">
                            Total Descuentos
                          </Typography>
                          <Typography variant="body2" fontWeight="600" color="error.main">
                            -${selected.totalDescuentos.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" pt={1} borderTop={1} borderColor="divider">
                          <Typography variant="h6" fontWeight="700">
                            Sueldo Neto
                          </Typography>
                          <Typography variant="h6" fontWeight="700" color="success.main">
                            ${selected.sueldoNeto.toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

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
            <MoneyIcon />
            <Typography variant="h6" fontWeight="600">
              {editingSueldo ? 'Editar Sueldo' : 'Nuevo Sueldo'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={empleados}
                getOptionLabel={(empleado) => getEmpleadoNombre(empleado)}
                value={empleados.find(e => e.id.toString() === formData.empleadoId) || null}
                onChange={(_, newValue) => handleFormChange('empleadoId', newValue?.id.toString() || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Empleado *" required />
                )}
                disabled={!!editingSueldo}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="month"
                label="Período *"
                value={formData.periodo}
                onChange={(e) => handleFormChange('periodo', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Conceptos Positivos */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="600" color="primary" gutterBottom>
                Conceptos Positivos
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Sueldo Básico *"
                value={formData.sueldoBasico}
                onChange={(e) => handleFormChange('sueldoBasico', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Bonificaciones"
                value={formData.bonificaciones}
                onChange={(e) => handleFormChange('bonificaciones', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Horas Extras"
                value={formData.horasExtras}
                onChange={(e) => handleFormChange('horasExtras', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Comisiones"
                value={formData.comisiones}
                onChange={(e) => handleFormChange('comisiones', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>

            {/* Descuentos */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="600" color="error" gutterBottom>
                Descuentos
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Descuentos Legales"
                value={formData.descuentosLegales}
                onChange={(e) => handleFormChange('descuentosLegales', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Otros Descuentos"
                value={formData.descuentosOtros}
                onChange={(e) => handleFormChange('descuentosOtros', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>

            {/* Totales Calculados */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'grey.50', p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Total Bruto
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="600">
                      ${formBruto.toLocaleString('es-AR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Total Descuentos
                    </Typography>
                    <Typography variant="h6" color="error.main" fontWeight="600">
                      ${formDescuentos.toLocaleString('es-AR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Sueldo Neto
                    </Typography>
                    <Typography variant="h6" color="success.main" fontWeight="700">
                      ${formNeto.toLocaleString('es-AR')}
                    </Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Pago"
                value={formData.fechaPago}
                onChange={(e) => handleFormChange('fechaPago', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => handleFormChange('observaciones', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleSaveSueldo} variant="contained" startIcon={<MoneyIcon />}>
            {editingSueldo ? 'Actualizar' : 'Crear'}
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
            ¿Está seguro que desea eliminar este registro de sueldo?
          </Typography>
          {selected && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2">
                <strong>Empleado:</strong> {selected.empleado ? getEmpleadoNombre(selected.empleado) : 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Período:</strong> {dayjs(selected.periodo).format('MMMM YYYY')}
              </Typography>
              <Typography variant="body2">
                <strong>Sueldo Neto:</strong> ${selected.sueldoNeto.toLocaleString('es-AR')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleDeleteSueldo} variant="contained" color="error" startIcon={<DeleteIcon />}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SueldosPage;
