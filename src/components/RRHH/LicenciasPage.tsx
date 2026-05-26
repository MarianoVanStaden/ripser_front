/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/useDebounce';
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
  Tab,
  Tabs,
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
  TablePagination,
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
  AttachMoney as MoneyIcon,
  EventBusy as EventBusyIcon,
  MedicalServices as MedicalIcon
} from '@mui/icons-material';
import { licenciaApi } from '../../api/services/licenciaApi';
import { employeeApi } from '../../api/services/employeeApi';
import { capacitacionApi } from '../../api/services/capacitacionApi';
import { getNombreCompleto } from '../../utils/userDisplay';
import { useTenant } from '../../context/TenantContext';
import type { Licencia, Empleado, TipoLicencia, EstadoLicencia } from '../../types';
import dayjs from 'dayjs';
import LoadingOverlay from '../common/LoadingOverlay';
import ExcepcionesTab from './Asistencias/tabs/ExcepcionesTab';
import ExcepcionDialog from './Asistencias/dialogs/ExcepcionDialog';
import { useExcepciones } from './Asistencias/hooks/useExcepciones';
import AusenciaCombinadaDialog from './Licencias/AusenciaCombinadaDialog';

const LicenciasPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { empresaId } = useTenant();

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [capacitacionPage, setCapacitacionPage] = useState(0);
  const [capacitacionRowsPerPage, setCapacitacionRowsPerPage] = useState(10);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Licencia | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openApproval, setOpenApproval] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [editingLicencia, setEditingLicencia] = useState<Licencia | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openCombinada, setOpenCombinada] = useState(false);

  // Hook compartido de excepciones (tab "Excepciones de asistencia"). El mismo
  // hook lo consume AsistenciasPage, así no hay duplicación de lógica.
  const excepcionesHook = useExcepciones();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [empleadoFilter, setEmpleadoFilter] = useState<Empleado | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const debouncedSearch = useDebounce(searchTerm, 300);

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

  // Reset page cuando cambian filtros
  useEffect(() => {
    setPage(0);
    setCapacitacionPage(0);
  }, [debouncedSearch, tipoFilter, estadoFilter, empleadoFilter?.id]);

  // Cargar empleados
  useEffect(() => {
    const loadEmpleados = async () => {
      try {
        const data = await employeeApi.getAllList();
        setEmpleados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading empleados:', err);
        setEmpleados([]);
      }
    };
    loadEmpleados();
  }, []);

  // Query para licencias paginadas
  const licenciasQuery = useQuery({
    queryKey: ['licencias', { page, size: rowsPerPage, debouncedSearch, tipoFilter, estadoFilter, empleadoFilter }],
    queryFn: async () => {
      // Para ahora, usamos getAll() y filtramos en client
      // En el futuro, el backend debería soportar paginación
      const data = await licenciaApi.getAll();
      const licenciasArray = Array.isArray(data) ? data : [];

      // Mapear empleado
      const empleadoFallback = { id: 0, nombre: 'Desconocido', apellido: '', puesto: '', email: '' };
      const licenciasConEmpleado = licenciasArray.map((licencia: any) => {
        const empleado = empleados.find((e: any) => e.id === licencia.empleadoId);
        return {
          ...licencia,
          empleado: empleado || licencia.empleado || empleadoFallback
        };
      });

      // Filtrar
      let filtered = licenciasConEmpleado.filter(l => {
        if (!l.empleado) return false;

        const matchesEmpleado = !empleadoFilter || l.empleado.id === empleadoFilter.id;
        const matchesTipo = tipoFilter === 'TODOS' || l.tipo === tipoFilter;
        const matchesEstado = estadoFilter === 'TODOS' || l.estado === estadoFilter;
        const matchesSearch = !debouncedSearch ||
          getNombreCompleto(l.empleado).toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          l.motivo?.toLowerCase().includes(debouncedSearch.toLowerCase());

        return matchesEmpleado && matchesTipo && matchesEstado && matchesSearch;
      });

      // Ordenar por fecha más reciente (DESC)
      filtered = filtered.sort((a, b) => {
        return new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
      });

      // Paginar
      const totalElements = filtered.length;
      const start = page * rowsPerPage;
      const end = start + rowsPerPage;
      const content = filtered.slice(start, end);

      return { content, totalElements };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const licencias = useMemo(() => licenciasQuery.data?.content ?? [], [licenciasQuery.data]);
  const totalLicencias = useMemo(() => licenciasQuery.data?.totalElements ?? 0, [licenciasQuery.data]);

  // Query para capacitaciones paginadas
  const capacitacionesQuery = useQuery({
    queryKey: ['capacitaciones', { page: capacitacionPage, size: capacitacionRowsPerPage }],
    queryFn: async () => {
      const data = await capacitacionApi.getAll();
      const capacitacionesArray = Array.isArray(data) ? data : [];

      // Mapear empleado
      const empleadoFallback = { id: 0, nombre: 'Desconocido', apellido: '', puesto: '', email: '' };
      const capacitacionesConEmpleado = capacitacionesArray.map((cap: any) => {
        const empleado = empleados.find((e: any) => e.id === cap.empleadoId);
        return {
          ...cap,
          empleado: empleado || cap.empleado || empleadoFallback
        };
      });

      // Ordenar por fecha más reciente
      const sorted = capacitacionesConEmpleado.sort((a, b) => {
        return new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
      });

      // Paginar
      const totalElements = sorted.length;
      const start = capacitacionPage * capacitacionRowsPerPage;
      const end = start + capacitacionRowsPerPage;
      const content = sorted.slice(start, end);

      return { content, totalElements };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const capacitaciones = useMemo(() => capacitacionesQuery.data?.content ?? [], [capacitacionesQuery.data]);
  const totalCapacitaciones = useMemo(() => capacitacionesQuery.data?.totalElements ?? 0, [capacitacionesQuery.data]);

  const getEmpleadoNombre = (empleado: Empleado | undefined) => {
    if (!empleado) return 'Desconocido';
    return getNombreCompleto(empleado);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeCapacitacionPage = (_event: unknown, newPage: number) => {
    setCapacitacionPage(newPage);
  };

  const handleChangeCapacitacionRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCapacitacionRowsPerPage(parseInt(event.target.value, 10));
    setCapacitacionPage(0);
  };

  const getTipoIcon = (tipo: TipoLicencia) => {
    if (tipo.includes('VACACIONES') || tipo.includes('MUDANZA') || tipo.includes('NACIMIENTO') || tipo.includes('MATRIMONIO')) {
      return <VacationIcon />;
    }
    if (tipo.includes('ENFERMEDAD') || tipo.includes('SANGRE') || tipo.includes('ACCIDENTE')) {
      return <SickIcon />;
    }
    if (tipo.includes('MATERNIDAD') || tipo.includes('FAMILIAR') || tipo.includes('EXAMEN')) {
      return <PersonIcon />;
    }
    return <CalendarIcon />;
  };

  const getTipoColor = (tipo: TipoLicencia): "primary" | "error" | "warning" | "info" => {
    // Rojo para ausencias sin aviso y sin justificación
    if (tipo.includes('AUSENTE_SIN_AVISO') || tipo.includes('INJUSTIFICADO') || tipo.includes('SUSPENSION')) {
      return 'error';
    }
    // Naranja para enfermedad y licencias por salud
    if (tipo.includes('ENFERMEDAD') || tipo.includes('SANGRE') || tipo.includes('ACCIDENTE')) {
      return 'error';
    }
    // Amarillo para maternidad y eventos personales importantes
    if (tipo.includes('MATERNIDAD') || tipo.includes('MATRIMONIO') || tipo.includes('FALLECIMIENTO') || tipo.includes('NACIMIENTO')) {
      return 'warning';
    }
    // Azul por defecto para vacaciones y otras licencias
    return 'primary';
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

      licenciasQuery.refetch();
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
      licenciasQuery.refetch();
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
      licenciasQuery.refetch();
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
  const totalDiasLicencia = licencias.reduce((sum, l) => sum + l.dias, 0);

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={licenciasQuery.isLoading && page === 0} message="Cargando licencias..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Gestión de Licencias
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={() => licenciasQuery.refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<MedicalIcon />}
            onClick={() => setOpenCombinada(true)}
            fullWidth={isMobile}
            color="warning"
          >
            Ausencia combinada
          </Button>
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

      {/* Tabs principales */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
        >
          <Tab icon={<CalendarIcon />} label="Licencias" iconPosition="start" />
          <Tab icon={<MedicalIcon />} label="Capacitaciones" iconPosition="start" />
          <Tab icon={<EventBusyIcon />} label="Excepciones de Asistencia" iconPosition="start" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {tabValue === 0 && (<>
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
                  <MenuItem value="AUS_P_TRAMITES_PERSONAL">Aus. p/Tramites Personal</MenuItem>
                  <MenuItem value="LLEGADA_TARDE">Llegada Tarde</MenuItem>
                  <MenuItem value="SALIDA_ANTICIPADA">Salida Anticipada</MenuItem>
                  <MenuItem value="AUSENTE_SIN_AVISO">Ausente Sin aviso</MenuItem>
                  <MenuItem value="DIAS_AUSENTE_INJUSTIFICADO">Dias Ausente Injustificado</MenuItem>
                  <MenuItem value="DIAS_ENFERMEDAD">Dias Enfermedad</MenuItem>
                  <MenuItem value="DIAS_EXT_SANGRE">Dias Ext. Sangre</MenuItem>
                  <MenuItem value="DIAS_FAM_ENFERMO">Dias Fam. Enfermo</MenuItem>
                  <MenuItem value="DIAS_SUSPENSION">Dias Suspensión</MenuItem>
                  <MenuItem value="FALTA_JUSTIFICADA">Falta Justificada</MenuItem>
                  <MenuItem value="LIC_ACCIDENTE">Lic. Accidente</MenuItem>
                  <MenuItem value="LIC_EXAMEN">Lic. Examen</MenuItem>
                  <MenuItem value="LIC_FALLECIMIENTO_FAMILIAR">Lic. Fallecimiento de Familiar</MenuItem>
                  <MenuItem value="LIC_MATERNIDAD">Lic. Maternidad</MenuItem>
                  <MenuItem value="LIC_MATRIMONIO">Lic. Matrimonio</MenuItem>
                  <MenuItem value="LIC_MATRIMONIO_HIJO">Lic. Matrimonio Hijo</MenuItem>
                  <MenuItem value="LIC_MUDANZA">Lic. Mudanza</MenuItem>
                  <MenuItem value="LIC_NACIMIENTO_HIJO">Lic. Nacimiento Hijo</MenuItem>
                  <MenuItem value="LIC_SIN_GOCE_SUELDO">Lic. Sin Goce Sueldo</MenuItem>
                  <MenuItem value="LIC_VACACIONES">Lic. Vacaciones</MenuItem>
                  <MenuItem value="RESERVA_DE_PUESTO">Reserva de Puesto</MenuItem>
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
                {licencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay licencias registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  licencias.map(licencia => (
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

          <TablePagination
            component="div"
            count={totalLicencias}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      </>)}

      {tabValue === 1 && (
        <>
          <Card>
            <CardContent>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: { xs: 850, md: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 150 }}>Empleado</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Tema</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Período</TableCell>
                      <TableCell align="center" sx={{ minWidth: 100 }}>Horas</TableCell>
                      <TableCell align="center" sx={{ minWidth: 130 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {capacitaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="textSecondary">
                            No hay capacitaciones registradas
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      capacitaciones.map(cap => (
                        <TableRow key={cap.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {getEmpleadoNombre(cap.empleado)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cap.tema || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cap.fechaInicio && cap.fechaFin
                                ? `${dayjs(cap.fechaInicio).format('DD/MM/YYYY')} - ${dayjs(cap.fechaFin).format('DD/MM/YYYY')}`
                                : '-'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${cap.horas || 0}h`}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  disabled
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled
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

              <TablePagination
                component="div"
                count={totalCapacitaciones}
                page={capacitacionPage}
                onPageChange={handleChangeCapacitacionPage}
                rowsPerPage={capacitacionRowsPerPage}
                onRowsPerPageChange={handleChangeCapacitacionRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                }
              />
            </CardContent>
          </Card>
        </>
      )}

      {tabValue === 2 && (
        <>
          <ExcepcionesTab
            empleados={empleados}
            excepciones={excepcionesHook.excepciones}
            onOpenExcepcionDialog={excepcionesHook.openCreateDialog}
            onDeleteExcepcion={excepcionesHook.deleteExcepcion}
          />
          <ExcepcionDialog
            open={excepcionesHook.openDialog}
            onClose={excepcionesHook.closeDialog}
            onSave={excepcionesHook.saveExcepcion}
            fullScreen={isMobile}
            empleados={empleados}
            form={excepcionesHook.form}
            setForm={excepcionesHook.setForm}
          />
        </>
      )}

      <AusenciaCombinadaDialog
        open={openCombinada}
        onClose={() => setOpenCombinada(false)}
        onSaved={() => { licenciasQuery.refetch(); excepcionesHook.reload(); }}
        empleados={empleados}
        fullScreen={isMobile}
      />

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
              <MenuItem value="AUS_P_TRAMITES_PERSONAL">Aus. p/Tramites Personal</MenuItem>
              <MenuItem value="LLEGADA_TARDE">Llegada Tarde</MenuItem>
              <MenuItem value="SALIDA_ANTICIPADA">Salida Anticipada</MenuItem>
              <MenuItem value="AUSENTE_SIN_AVISO">Ausente Sin aviso</MenuItem>
              <MenuItem value="DIAS_AUSENTE_INJUSTIFICADO">Dias Ausente Injustificado</MenuItem>
              <MenuItem value="DIAS_ENFERMEDAD">Dias Enfermedad</MenuItem>
              <MenuItem value="DIAS_EXT_SANGRE">Dias Ext. Sangre</MenuItem>
              <MenuItem value="DIAS_FAM_ENFERMO">Dias Fam. Enfermo</MenuItem>
              <MenuItem value="DIAS_SUSPENSION">Dias Suspensión</MenuItem>
              <MenuItem value="FALTA_JUSTIFICADA">Falta Justificada</MenuItem>
              <MenuItem value="LIC_ACCIDENTE">Lic. Accidente</MenuItem>
              <MenuItem value="LIC_EXAMEN">Lic. Examen</MenuItem>
              <MenuItem value="LIC_FALLECIMIENTO_FAMILIAR">Lic. Fallecimiento de Familiar</MenuItem>
              <MenuItem value="LIC_MATERNIDAD">Lic. Maternidad</MenuItem>
              <MenuItem value="LIC_MATRIMONIO">Lic. Matrimonio</MenuItem>
              <MenuItem value="LIC_MATRIMONIO_HIJO">Lic. Matrimonio Hijo</MenuItem>
              <MenuItem value="LIC_MUDANZA">Lic. Mudanza</MenuItem>
              <MenuItem value="LIC_NACIMIENTO_HIJO">Lic. Nacimiento Hijo</MenuItem>
              <MenuItem value="LIC_SIN_GOCE_SUELDO">Lic. Sin Goce Sueldo</MenuItem>
              <MenuItem value="LIC_VACACIONES">Lic. Vacaciones</MenuItem>
              <MenuItem value="RESERVA_DE_PUESTO">Reserva de Puesto</MenuItem>
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
