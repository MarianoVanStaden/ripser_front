import React, { useState, useEffect, useRef } from 'react';
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
  Stack,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TimerOff as TimerOffIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  EventBusy as EventBusyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Create as CreateIcon,
  GetApp as GetAppIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { registroAsistenciaApi } from '../../api/services/registroAsistenciaApi';
import { employeeApi } from '../../api/services/employeeApi';
import { configuracionAsistenciaApi } from '../../api/services/configuracionAsistenciaApi';
import { excepcionAsistenciaApi } from '../../api/services/excepcionAsistenciaApi';
import { asistenciaAutomaticaApi } from '../../api/services/asistenciaAutomaticaApi';
import type { RegistroAsistencia, Empleado } from '../../types';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import LoadingOverlay from '../common/LoadingOverlay';

dayjs.extend(isBetween);
// FRONT-003: extracted to keep this file orchestrator-shaped.
import type { ConfigFormData, ExcepcionFormData } from './Asistencias/types';
import {
  DEFAULT_DIA_CONFIG,
  DIAS_SEMANA,
  FALLBACK_DIA,
  createInitialExcepcionForm,
} from './Asistencias/constants';
import { getEmpleadoNombre } from './Asistencias/utils';
import ConfigHorariosDialog from './Asistencias/dialogs/ConfigHorariosDialog';
import ExcepcionDialog from './Asistencias/dialogs/ExcepcionDialog';
import ConfigurarHorariosTab from './Asistencias/tabs/ConfigurarHorariosTab';
import ExcepcionesTab from './Asistencias/tabs/ExcepcionesTab';
import ResumenDiarioTab from './Asistencias/tabs/ResumenDiarioTab';
import { exportAsistenciasToExcel, exportAsistenciasToPDF } from './Asistencias/exportService';

const AsistenciasPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isFirstRender = useRef(true);
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  const [asistencias, setAsistencias] = useState<RegistroAsistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuraciones y excepciones
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [excepciones, setExcepciones] = useState<any[]>([]);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [openExcepcionDialog, setOpenExcepcionDialog] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [configFormData, setConfigFormData] = useState<ConfigFormData>(DEFAULT_DIA_CONFIG);
  const [excepcionFormData, setExcepcionFormData] = useState<ExcepcionFormData>(
    createInitialExcepcionForm
  );

  // Filtros (búsqueda libre y filtro por empleado quedaron como placeholders;
  // los setters están sin cablear porque la UI nunca se conectó.)
  const [searchTerm] = useState('');
  const [empleadoFilter] = useState<Empleado | null>(null);
  const [fechaDesde, setFechaDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fechaHasta, setFechaHasta] = useState(dayjs().format('YYYY-MM-DD'));

  // Filtros específicos para reportes
  const [reportEmpleadoFilter, setReportEmpleadoFilter] = useState<Empleado | null>(null);
  const [reportFechaDesde, setReportFechaDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [reportFechaHasta, setReportFechaHasta] = useState(dayjs().format('YYYY-MM-DD'));
  const [reportTipoFilter, setReportTipoFilter] = useState<string>('TODOS');
  
  // Estados para exportación y visualización
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [showCharts, setShowCharts] = useState(false);
  
  // Estados para comparación de períodos
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonFechaDesde, setComparisonFechaDesde] = useState(
    dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD')
  );
  const [comparisonFechaHasta, setComparisonFechaHasta] = useState(
    dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (fechaDesde && fechaHasta) {
      loadAsistenciasByPeriodo();
    }
  }, [fechaDesde, fechaHasta]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero cargar empleados
      const empleadosData = await employeeApi.getAllList().catch(() => []);
      const empleadosArray = Array.isArray(empleadosData) ? empleadosData : [];
      setEmpleados(empleadosArray);
      
      // Luego cargar configuraciones y excepciones en paralelo
      const [configsData, excepcionesData] = await Promise.all([
        configuracionAsistenciaApi.getAll().catch(() => []),
        excepcionAsistenciaApi.getByPeriodo(
          dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
          dayjs().format('YYYY-MM-DD')
        ).catch(() => [])
      ]);
      
      console.log('Configuraciones data:', configsData);
      console.log('Excepciones data:', excepcionesData);
      
      setConfiguraciones(Array.isArray(configsData) ? configsData : []);
      setExcepciones(Array.isArray(excepcionesData) ? excepcionesData : []);
      
      // Finalmente cargar asistencias con empleados ya disponibles
      await loadAsistenciasByPeriodoWithEmpleados(empleadosArray);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setEmpleados([]);
      setAsistencias([]);
      setConfiguraciones([]);
      setExcepciones([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAsistenciasByPeriodoWithEmpleados = async (empleadosData: Empleado[]) => {
    try {
      setError(null);
      const data = await registroAsistenciaApi.getByPeriodo(fechaDesde, fechaHasta);
      
      console.log('Asistencias raw data:', data);
      console.log('Empleados disponibles:', empleadosData);
      
      // Mapear las asistencias para incluir el objeto empleado completo
      const asistenciasConEmpleado = Array.isArray(data)
        ? data.map((asistencia: any) => {
            const empleado = empleadosData.find((e: any) => e.id === asistencia.empleadoId);
            return {
              ...asistencia,
              empleado: empleado || {
                id: asistencia.empleadoId,
                nombre: asistencia.empleadoNombre || '',
                apellido: asistencia.empleadoApellido || '',
                dni: asistencia.empleadoDni || ''
              }
            };
          })
        : [];
      
      console.log('Asistencias mapped:', asistenciasConEmpleado);
      
      setAsistencias(asistenciasConEmpleado);
    } catch (err) {
      setError('Error al cargar las asistencias');
      console.error('Error loading asistencias:', err);
      setAsistencias([]);
    }
  };

  const loadAsistenciasByPeriodo = async () => {
    await loadAsistenciasByPeriodoWithEmpleados(empleados);
  };

  const filteredAsistencias = asistencias.filter(a => {
    if (!a.empleado) return false;
    
    const matchesEmpleado = !empleadoFilter || a.empleado.id === empleadoFilter.id;
    
    const matchesSearch = !searchTerm ||
      getEmpleadoNombre(a.empleado).toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmpleado && matchesSearch;
  });

  // Funciones de exportación — el servicio se encarga del download; la
  // página solo cierra el menú de exportación al despachar.
  const exportToExcel = async () => {
    await exportAsistenciasToExcel({
      asistencias: reportFilteredAsistencias,
      excepciones,
      reportStats,
      reportEmpleadoFilter,
      reportFechaDesde,
      reportFechaHasta,
      reportTipoFilter,
    });
    setExportMenuAnchor(null);
  };

  const exportToPDF = () => {
    exportAsistenciasToPDF({
      asistencias: reportFilteredAsistencias,
      excepciones,
      reportStats,
      reportEmpleadoFilter,
      reportFechaDesde,
      reportFechaHasta,
      reportTipoFilter,
    });
    setExportMenuAnchor(null);
  };

  const handleGenerarAutomaticas = async () => {
    try {
      await asistenciaAutomaticaApi.ejecutarGeneracionDiaria();
      await loadData();
    } catch (err) {
      console.error('Error al generar asistencias:', err);
      setError('Error al generar asistencias automáticas');
    }
  };

  // Handlers para configuración de horarios
  const handleCrearHorarioEstandar = async (empleadoId: number) => {
    try {
      await configuracionAsistenciaApi.createHorarioEstandar(empleadoId);
      await loadData();
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error al crear horario estándar:', error);
      setError('Error al crear horario estándar');
    }
  };

  // Handlers para excepciones
  const handleDeleteExcepcion = async (excepcionId: number) => {
    try {
      await excepcionAsistenciaApi.delete(excepcionId);
      await loadData();
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error al eliminar excepción:', error);
      setError('Error al eliminar excepción');
    }
  };

  const handleOpenConfigDialog = (empleado: Empleado | null = null) => {
    setSelectedEmpleado(empleado);
    if (empleado && Array.isArray(configuraciones)) {
      const config = configuraciones.find(c => c.empleadoId === empleado.id);
      if (config) {
        setConfigFormData(
          DIAS_SEMANA.reduce<ConfigFormData>((acc, dia) => {
            acc[dia] = config[dia] || FALLBACK_DIA;
            return acc;
          }, {} as ConfigFormData)
        );
      }
    }
    setOpenConfigDialog(true);
  };

  const handleCloseConfigDialog = () => {
    setOpenConfigDialog(false);
    setSelectedEmpleado(null);
    setConfigFormData(DEFAULT_DIA_CONFIG);
  };

  const handleSaveConfiguracion = async () => {
    if (!selectedEmpleado) return;
    
    try {
      const config = Array.isArray(configuraciones) ? configuraciones.find(c => c.empleadoId === selectedEmpleado.id) : null;
      const payload = {
        empleadoId: selectedEmpleado.id,
        activo: true,
        ...configFormData
      };
      
      if (config) {
        await configuracionAsistenciaApi.update(config.id, payload);
      } else {
        await configuracionAsistenciaApi.create(payload);
      }
      
      await loadData();
      handleCloseConfigDialog();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      setError('Error al guardar configuración de horarios');
    }
  };

  const handleOpenExcepcionDialog = () => {
    setExcepcionFormData(createInitialExcepcionForm());
    setOpenExcepcionDialog(true);
  };

  const handleCloseExcepcionDialog = () => {
    setOpenExcepcionDialog(false);
    setExcepcionFormData(createInitialExcepcionForm());
  };

  const handleSaveExcepcion = async () => {
    try {
      // Validar que debe trabajar ese día
      const debeTrabajar = await asistenciaAutomaticaApi.debeTrabajar(
        parseInt(excepcionFormData.empleadoId),
        excepcionFormData.fecha
      );
      
      if (!debeTrabajar && excepcionFormData.tipo !== 'INASISTENCIA') {
        setError('El empleado no tiene configurado trabajar este día');
        return;
      }
      
      const payload: any = {
        empleadoId: parseInt(excepcionFormData.empleadoId),
        fecha: excepcionFormData.fecha,
        tipo: excepcionFormData.tipo,
        justificado: excepcionFormData.justificado,
        observaciones: excepcionFormData.observaciones
      };
      
      // Agregar campos específicos según tipo
      if (excepcionFormData.tipo === 'LLEGADA_TARDE' && excepcionFormData.minutosTardanza) {
        payload.minutosTardanza = parseInt(excepcionFormData.minutosTardanza);
        
        // Calcular la hora de entrada real sumando los minutos de tardanza
        // Buscar la asistencia del día para obtener la hora de entrada configurada
        const asistenciaDelDia = asistencias.find(a => 
          a.empleado?.id === parseInt(excepcionFormData.empleadoId) &&
          dayjs(a.fecha).format('YYYY-MM-DD') === excepcionFormData.fecha
        );
        
        if (asistenciaDelDia && asistenciaDelDia.horaEntrada) {
          const [horas, minutos] = asistenciaDelDia.horaEntrada.split(':').map(Number);
          const totalMinutos = horas * 60 + minutos + parseInt(excepcionFormData.minutosTardanza);
          const nuevasHoras = Math.floor(totalMinutos / 60);
          const nuevosMinutos = totalMinutos % 60;
          payload.horaEntradaReal = `${String(nuevasHoras).padStart(2, '0')}:${String(nuevosMinutos).padStart(2, '0')}:00`;
          console.log('Calculada hora entrada real para tardanza:', payload.horaEntradaReal);
        }
      }
      if (excepcionFormData.tipo === 'HORAS_EXTRAS' && excepcionFormData.horasExtras) {
        payload.horasExtras = parseFloat(excepcionFormData.horasExtras);
      }
      if (['SALIDA_ANTICIPADA', 'MODIFICACION_HORARIO'].includes(excepcionFormData.tipo)) {
        if (excepcionFormData.horaEntradaReal) payload.horaEntradaReal = excepcionFormData.horaEntradaReal;
        if (excepcionFormData.horaSalidaReal) payload.horaSalidaReal = excepcionFormData.horaSalidaReal;
      }
      if (excepcionFormData.tipo === 'INASISTENCIA' && excepcionFormData.motivo) {
        payload.motivo = excepcionFormData.motivo;
      }
      
      console.log('Payload de excepción a enviar:', payload);
      await excepcionAsistenciaApi.create(payload);
      await loadData();
      handleCloseExcepcionDialog();
    } catch (error) {
      console.error('Error al guardar excepción:', error);
      setError('Error al guardar excepción');
    }
  };

  // Datos filtrados para reportes
  const reportFilteredAsistencias = asistencias.filter(a => {
    if (!a.empleado) return false;
    
    // Filtro por empleado
    const matchesEmpleado = !reportEmpleadoFilter || a.empleado.id === reportEmpleadoFilter.id;
    
    // Filtro por fecha
    const asistenciaDate = dayjs(a.fecha);
    const matchesFecha = asistenciaDate.isBetween(
      dayjs(reportFechaDesde), 
      dayjs(reportFechaHasta), 
      null, 
      '[]'
    );
    
    // Filtro por tipo de excepción
    let matchesTipo = true;
    if (reportTipoFilter !== 'TODOS') {
      const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
        ex.empleadoId === a.empleado?.id && 
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
      ) : null;
      
      if (reportTipoFilter === 'PRESENTE') {
        matchesTipo = !excepcion;
      } else {
        matchesTipo = excepcion?.tipo === reportTipoFilter;
      }
    }
    
    return matchesEmpleado && matchesFecha && matchesTipo;
  });

  // Estadísticas del reporte
  const reportStats = {
    totalAsistencias: reportFilteredAsistencias.length,
    totalHoras: reportFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0),
    totalHorasExtras: reportFilteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0),
    promedioHoras: reportFilteredAsistencias.length > 0 
      ? reportFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0) / reportFilteredAsistencias.length 
      : 0,
    tardanzas: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'LLEGADA_TARDE' && 
      dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0,
    inasistencias: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'INASISTENCIA' && 
      dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0,
    empleadosUnicos: new Set(
      reportFilteredAsistencias
        .filter(a => a.empleado?.id)
        .map(a => a.empleado.id)
    ).size
  };

  // Gráfico de distribución de estados
  const estadosDistribucion = [
    { name: 'Presente', value: reportFilteredAsistencias.filter(a => {
      const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
        ex.empleadoId === a.empleado?.id && 
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
      ) : null;
      return !excepcion;
    }).length, color: '#4caf50' },
    { name: 'Tardanza', value: reportStats.tardanzas, color: '#ff9800' },
    { name: 'Inasistencia', value: reportStats.inasistencias, color: '#f44336' },
    { name: 'Horas Extras', value: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'HORAS_EXTRAS' && 
      dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0, color: '#2196f3' }
  ].filter(item => item.value > 0);

  // Gráfico de horas por empleado (top 10)
  const horasPorEmpleado = reportEmpleadoFilter 
    ? []
    : Object.entries(
        reportFilteredAsistencias.reduce((acc: any, asistencia) => {
          if (asistencia.empleado) {
            const nombre = getEmpleadoNombre(asistencia.empleado);
            if (!acc[nombre]) {
              acc[nombre] = { nombre, horas: 0, extras: 0 };
            }
            acc[nombre].horas += asistencia.horasTrabajadas;
            acc[nombre].extras += asistencia.horasExtras;
          }
          return acc;
        }, {})
      )
      .map(([_, data]: any) => data)
      .sort((a: any, b: any) => b.horas - a.horas)
      .slice(0, 10);

  // Gráfico de tendencia diaria (últimos 30 días o período filtrado)
  const tendenciaDiaria = reportFilteredAsistencias
    .reduce((acc: any, asistencia) => {
      const fecha = dayjs(asistencia.fecha).format('DD/MM');
      if (!acc[fecha]) {
        acc[fecha] = { fecha, horas: 0, count: 0 };
      }
      acc[fecha].horas += asistencia.horasTrabajadas;
      acc[fecha].count += 1;
      return acc;
    }, {});
  
  const tendenciaDiariaArray = Object.values(tendenciaDiaria)
    .map((item: any) => ({
      ...item,
      promedio: item.horas / item.count
    }))
    .sort((a: any, b: any) => {
      const [diaA, mesA] = a.fecha.split('/').map(Number);
      const [diaB, mesB] = b.fecha.split('/').map(Number);
      return mesA !== mesB ? mesA - mesB : diaA - diaB;
    });

  // Gráfico de asistencias por día de la semana
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const asistenciasPorDiaSemana = reportFilteredAsistencias.reduce((acc: any, asistencia) => {
    const diaSemana = dayjs(asistencia.fecha).day(); // 0 = domingo, 1 = lunes, etc.
    const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1; // Convertir a índice comenzando en lunes
    const nombreDia = diasSemana[diaIndex];
    
    if (!acc[nombreDia]) {
      acc[nombreDia] = { 
        dia: nombreDia, 
        asistencias: 0, 
        tardanzas: 0, 
        inasistencias: 0,
        horas: 0
      };
    }
    
    acc[nombreDia].asistencias += 1;
    acc[nombreDia].horas += asistencia.horasTrabajadas;
    
    const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
      ex.empleadoId === asistencia.empleado?.id && 
      dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
    ) : null;
    
    if (excepcion?.tipo === 'LLEGADA_TARDE') acc[nombreDia].tardanzas += 1;
    if (excepcion?.tipo === 'INASISTENCIA') acc[nombreDia].inasistencias += 1;
    
    return acc;
  }, {});

  const asistenciasPorDiaArray = diasSemana.map(dia => 
    asistenciasPorDiaSemana[dia] || { 
      dia, 
      asistencias: 0, 
      tardanzas: 0, 
      inasistencias: 0,
      horas: 0 
    }
  );

  // Datos de comparación entre períodos
  const comparisonFilteredAsistencias = showComparison ? asistencias.filter(a => {
    if (!a.empleado) return false;
    
    const matchesEmpleado = !reportEmpleadoFilter || a.empleado.id === reportEmpleadoFilter.id;
    const asistenciaDate = dayjs(a.fecha);
    const matchesFecha = asistenciaDate.isBetween(
      dayjs(comparisonFechaDesde), 
      dayjs(comparisonFechaHasta), 
      null, 
      '[]'
    );
    
    return matchesEmpleado && matchesFecha;
  }) : [];

  const comparisonStats = showComparison ? {
    totalHoras: comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0),
    totalHorasExtras: comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0),
    promedioHoras: comparisonFilteredAsistencias.length > 0 
      ? comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0) / comparisonFilteredAsistencias.length 
      : 0,
    tardanzas: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'LLEGADA_TARDE' && 
      dayjs(ex.fecha).isBetween(dayjs(comparisonFechaDesde), dayjs(comparisonFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0,
    inasistencias: Array.isArray(excepciones) ? excepciones.filter(ex => 
      ex.tipo === 'INASISTENCIA' && 
      dayjs(ex.fecha).isBetween(dayjs(comparisonFechaDesde), dayjs(comparisonFechaHasta), null, '[]') &&
      (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length : 0
  } : null;

  const periodosComparacion = showComparison && comparisonStats ? [
    {
      periodo: 'Período Actual',
      horas: reportStats.totalHoras,
      promedio: reportStats.promedioHoras,
      tardanzas: reportStats.tardanzas,
      inasistencias: reportStats.inasistencias
    },
    {
      periodo: 'Período Anterior',
      horas: comparisonStats.totalHoras,
      promedio: comparisonStats.promedioHoras,
      tardanzas: comparisonStats.tardanzas,
      inasistencias: comparisonStats.inasistencias
    }
  ] : [];

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando asistencias..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Asistencias - Sistema Inteligente
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, overflowX: 'auto' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
        >
          <Tab icon={<CalendarIcon />} label={isMobile ? 'Resumen' : 'Resumen Diario'} iconPosition="start" />
          <Tab icon={<ScheduleIcon />} label={isMobile ? 'Horarios' : 'Configurar Horarios'} iconPosition="start" />
          <Tab icon={<EventBusyIcon />} label="Excepciones" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="Reportes" iconPosition="start" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <ResumenDiarioTab
          asistencias={filteredAsistencias}
          excepciones={excepciones}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onChangeFechaDesde={setFechaDesde}
          onChangeFechaHasta={setFechaHasta}
          onGenerarAutomaticas={handleGenerarAutomaticas}
        />
      )}

      {tabValue === 1 && (
        <ConfigurarHorariosTab
          empleados={empleados}
          configuraciones={configuraciones}
          onOpenConfigDialog={handleOpenConfigDialog}
          onCrearHorarioEstandar={handleCrearHorarioEstandar}
        />
      )}

      {tabValue === 2 && (
        <ExcepcionesTab
          empleados={empleados}
          excepciones={excepciones}
          onOpenExcepcionDialog={handleOpenExcepcionDialog}
          onDeleteExcepcion={handleDeleteExcepcion}
        />
      )}

      {/* Tab 3: Reportes */}
      {tabValue === 3 && (
        <>
          {/* Filtros de Reporte */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Filtros de Búsqueda</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={showCharts ? 'contained' : 'outlined'}
                    startIcon={<ChartIcon />}
                    onClick={() => setShowCharts(!showCharts)}
                    size="small"
                  >
                    {showCharts ? 'Ocultar' : 'Ver'} Gráficos
                  </Button>
                  <Button
                    variant={showComparison ? 'contained' : 'outlined'}
                    startIcon={<CalendarIcon />}
                    onClick={() => setShowComparison(!showComparison)}
                    size="small"
                    color="secondary"
                  >
                    Comparar Períodos
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<GetAppIcon />}
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    size="small"
                  >
                    Exportar
                  </Button>
                </Stack>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    options={empleados}
                    getOptionLabel={(option) => getEmpleadoNombre(option)}
                    value={reportEmpleadoFilter}
                    onChange={(_, newValue) => setReportEmpleadoFilter(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Empleado" placeholder="Todos" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    type="date"
                    label="Desde"
                    value={reportFechaDesde}
                    onChange={(e) => setReportFechaDesde(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    type="date"
                    label="Hasta"
                    value={reportFechaHasta}
                    onChange={(e) => setReportFechaHasta(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Registro</InputLabel>
                    <Select
                      value={reportTipoFilter}
                      onChange={(e) => setReportTipoFilter(e.target.value)}
                      label="Tipo de Registro"
                    >
                      <MenuItem value="TODOS">Todos</MenuItem>
                      <MenuItem value="PRESENTE">Presente</MenuItem>
                      <MenuItem value="LLEGADA_TARDE">Llegada Tarde</MenuItem>
                      <MenuItem value="INASISTENCIA">Inasistencia</MenuItem>
                      <MenuItem value="HORAS_EXTRAS">Horas Extras</MenuItem>
                      <MenuItem value="SALIDA_ANTICIPADA">Salida Anticipada</MenuItem>
                      <MenuItem value="PERMISO">Permiso</MenuItem>
                      <MenuItem value="MODIFICACION_HORARIO">Modificación de Horario</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: '56px' }}
                    onClick={() => {
                      setReportEmpleadoFilter(null);
                      setReportFechaDesde(dayjs().startOf('month').format('YYYY-MM-DD'));
                      setReportFechaHasta(dayjs().format('YYYY-MM-DD'));
                      setReportTipoFilter('TODOS');
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Comparación de Períodos */}
          {showComparison && comparisonStats && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2}>Configurar Período de Comparación</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="date"
                      label="Período Anterior - Desde"
                      value={comparisonFechaDesde}
                      onChange={(e) => setComparisonFechaDesde(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      type="date"
                      label="Período Anterior - Hasta"
                      value={comparisonFechaHasta}
                      onChange={(e) => setComparisonFechaHasta(e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Alert severity="info" sx={{ py: 0 }}>
                      <Typography variant="caption">
                        <strong>Período Actual:</strong> {dayjs(reportFechaDesde).format('DD/MM/YYYY')} - {dayjs(reportFechaHasta).format('DD/MM/YYYY')}
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>

                {/* Gráfico de comparación */}
                {periodosComparacion.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle1" mb={2} fontWeight="600">
                      Comparación de Métricas
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={periodosComparacion}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="horas" fill="#4caf50" name="Horas Totales" />
                        <Bar dataKey="promedio" fill="#2196f3" name="Promedio Diario" />
                        <Bar dataKey="tardanzas" fill="#ff9800" name="Tardanzas" />
                        <Bar dataKey="inasistencias" fill="#f44336" name="Inasistencias" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Análisis de cambio */}
                    <Grid container spacing={2} mt={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Horas Totales
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.totalHoras > comparisonStats.totalHoras 
                                ? 'success.main' 
                                : reportStats.totalHoras < comparisonStats.totalHoras 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.totalHoras > comparisonStats.totalHoras ? '+' : ''}
                            {(reportStats.totalHoras - comparisonStats.totalHoras).toFixed(1)}h
                            <Typography component="span" variant="caption" ml={1}>
                              ({comparisonStats.totalHoras > 0 
                                ? ((reportStats.totalHoras - comparisonStats.totalHoras) / comparisonStats.totalHoras * 100).toFixed(1) 
                                : '0'}%)
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Tardanzas
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.tardanzas < comparisonStats.tardanzas 
                                ? 'success.main' 
                                : reportStats.tardanzas > comparisonStats.tardanzas 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.tardanzas > comparisonStats.tardanzas ? '+' : ''}
                            {reportStats.tardanzas - comparisonStats.tardanzas}
                            <Typography component="span" variant="caption" ml={1}>
                              ({reportStats.tardanzas < comparisonStats.tardanzas ? '↓ Mejor' : reportStats.tardanzas > comparisonStats.tardanzas ? '↑ Peor' : '='})
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'error.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Inasistencias
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.inasistencias < comparisonStats.inasistencias 
                                ? 'success.main' 
                                : reportStats.inasistencias > comparisonStats.inasistencias 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.inasistencias > comparisonStats.inasistencias ? '+' : ''}
                            {reportStats.inasistencias - comparisonStats.inasistencias}
                            <Typography component="span" variant="caption" ml={1}>
                              ({reportStats.inasistencias < comparisonStats.inasistencias ? '↓ Mejor' : reportStats.inasistencias > comparisonStats.inasistencias ? '↑ Peor' : '='})
                            </Typography>
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                          <Typography variant="caption" color="textSecondary">
                            Cambio en Promedio Diario
                          </Typography>
                          <Typography 
                            variant="h6" 
                            color={
                              reportStats.promedioHoras > comparisonStats.promedioHoras 
                                ? 'success.main' 
                                : reportStats.promedioHoras < comparisonStats.promedioHoras 
                                  ? 'error.main' 
                                  : 'textPrimary'
                            }
                            fontWeight="bold"
                          >
                            {reportStats.promedioHoras > comparisonStats.promedioHoras ? '+' : ''}
                            {(reportStats.promedioHoras - comparisonStats.promedioHoras).toFixed(1)}h
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* KPIs del Reporte */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CalendarIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {reportStats.totalAsistencias}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Registros
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
                        {reportStats.totalHoras.toFixed(1)}h
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
                    <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {reportStats.tardanzas}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Tardanzas
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {reportStats.inasistencias}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Inasistencias
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="info.main">
                        {reportStats.totalHorasExtras.toFixed(1)}h
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Horas Extras Totales
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'secondary.50', borderLeft: '4px solid', borderColor: 'secondary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PersonIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="secondary.main">
                        {reportStats.empleadosUnicos}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Empleados Únicos
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <ScheduleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {reportStats.promedioHoras.toFixed(1)}h
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Promedio Diario
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          {showCharts && reportFilteredAsistencias.length > 0 && (
            <Grid container spacing={3} mb={3}>
              {/* Gráfico de Distribución de Estados */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <PieChartIcon sx={{ mr: 1 }} />
                      Distribución de Estados
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={estadosDistribucion}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {estadosDistribucion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Tendencia Diaria */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <ChartIcon sx={{ mr: 1 }} />
                      Tendencia de Horas Diarias
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={tendenciaDiariaArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="horas" 
                          stroke="#4caf50" 
                          name="Horas Totales"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="promedio" 
                          stroke="#2196f3" 
                          name="Promedio"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Horas por Empleado (solo si no hay filtro de empleado) */}
              {!reportEmpleadoFilter && horasPorEmpleado.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" mb={2} display="flex" alignItems="center">
                        <TrendingUpIcon sx={{ mr: 1 }} />
                        Top 10 Empleados por Horas Trabajadas
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={horasPorEmpleado}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="nombre" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                          />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="horas" fill="#4caf50" name="Horas Normales" />
                          <Bar dataKey="extras" fill="#2196f3" name="Horas Extras" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Gráfico de Asistencias por Día de la Semana */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <CalendarIcon sx={{ mr: 1 }} />
                      Análisis por Día de la Semana
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={asistenciasPorDiaArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dia" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="asistencias" fill="#4caf50" name="Asistencias" />
                        <Bar dataKey="tardanzas" fill="#ff9800" name="Tardanzas" />
                        <Bar dataKey="inasistencias" fill="#f44336" name="Inasistencias" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Horas Promedio por Día de la Semana */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2} display="flex" alignItems="center">
                      <ScheduleIcon sx={{ mr: 1 }} />
                      Horas Promedio por Día de Semana
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={asistenciasPorDiaArray}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dia" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar 
                          dataKey={(data: any) => data.asistencias > 0 ? (data.horas / data.asistencias).toFixed(2) : 0} 
                          fill="#2196f3" 
                          name="Horas Promedio"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <Box mt={2}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        <strong>Día más productivo:</strong> {
                          asistenciasPorDiaArray.reduce((max, dia) => 
                            (dia.asistencias > 0 && dia.horas / dia.asistencias > (max.horas / (max.asistencias || 1))) ? dia : max
                          , asistenciasPorDiaArray[0] || {dia: 'N/A', horas: 0, asistencias: 1}).dia
                        }
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        <strong>Día con más tardanzas:</strong> {
                          asistenciasPorDiaArray.reduce((max, dia) => 
                            dia.tardanzas > max.tardanzas ? dia : max
                          , {dia: 'N/A', tardanzas: 0}).dia
                        }
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tabla de Detalles */}
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Detalle de Asistencias
                {reportEmpleadoFilter && (
                  <Chip 
                    label={`Empleado: ${getEmpleadoNombre(reportEmpleadoFilter)}`} 
                    onDelete={() => setReportEmpleadoFilter(null)}
                    sx={{ ml: 2 }}
                    color="primary"
                  />
                )}
                {reportTipoFilter !== 'TODOS' && (
                  <Chip 
                    label={`Tipo: ${reportTipoFilter}`} 
                    onDelete={() => setReportTipoFilter('TODOS')}
                    sx={{ ml: 1 }}
                    color="secondary"
                  />
                )}
              </Typography>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Empleado</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Entrada</TableCell>
                      <TableCell align="center">Salida</TableCell>
                      <TableCell align="center">Horas Trabajadas</TableCell>
                      <TableCell align="center">Horas Extras</TableCell>
                      <TableCell>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportFilteredAsistencias.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="textSecondary" py={3}>
                            No se encontraron registros con los filtros aplicados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportFilteredAsistencias.map(asistencia => {
                        const excepcion = Array.isArray(excepciones) ? excepciones.find(ex => 
                          ex.empleadoId === asistencia.empleado?.id && 
                          dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(asistencia.fecha).format('YYYY-MM-DD')
                        ) : null;
                        
                        const estadoFinal = excepcion ? excepcion.tipo : 'PRESENTE';
                        
                        return (
                          <TableRow key={asistencia.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {dayjs(asistencia.fecha).format('DD/MM/YYYY')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {dayjs(asistencia.fecha).format('dddd')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {asistencia.empleado ? getEmpleadoNombre(asistencia.empleado) : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {estadoFinal === 'PRESENTE' && (
                                <Chip label="Presente" color="success" size="small" icon={<CheckCircleIcon />} />
                              )}
                              {estadoFinal === 'LLEGADA_TARDE' && excepcion && (
                                <Chip 
                                  label={`Tardanza (${excepcion.minutosTardanza || 0} min)`} 
                                  color="warning" 
                                  size="small" 
                                  icon={<WarningIcon />} 
                                />
                              )}
                              {estadoFinal === 'INASISTENCIA' && (
                                <Chip label="Ausente" color="error" size="small" icon={<CancelIcon />} />
                              )}
                              {estadoFinal === 'HORAS_EXTRAS' && excepcion && (
                                <Chip 
                                  label={`+ ${excepcion.horasExtras || 0}h extras`} 
                                  color="info" 
                                  size="small" 
                                  icon={<TrendingUpIcon />} 
                                />
                              )}
                              {['SALIDA_ANTICIPADA', 'PERMISO', 'MODIFICACION_HORARIO'].includes(estadoFinal) && (
                                <Chip 
                                  label={estadoFinal.replace(/_/g, ' ')} 
                                  color="default" 
                                  size="small" 
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {asistencia.horaEntrada ? (
                                <Typography variant="body2" fontWeight="500">
                                  {asistencia.horaEntrada}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              {asistencia.horaSalida ? (
                                <Typography variant="body2" fontWeight="500">
                                  {asistencia.horaSalida}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="600" color="success.main">
                                {asistencia.horasTrabajadas.toFixed(1)}h
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography 
                                variant="body2" 
                                fontWeight="600" 
                                color={asistencia.horasExtras > 0 ? 'info.main' : 'textSecondary'}
                              >
                                {asistencia.horasExtras > 0 ? `+${asistencia.horasExtras.toFixed(1)}h` : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {excepcion ? (excepcion.observaciones || excepcion.motivo || '-') : (asistencia.observaciones || '-')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Resumen al pie de la tabla */}
              {reportFilteredAsistencias.length > 0 && (
                <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Total Horas Trabajadas
                      </Typography>
                      <Typography variant="h6" color="success.main" fontWeight="bold">
                        {reportStats.totalHoras.toFixed(2)} horas
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Total Horas Extras
                      </Typography>
                      <Typography variant="h6" color="info.main" fontWeight="bold">
                        {reportStats.totalHorasExtras.toFixed(2)} horas
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Promedio Horas/Día
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {reportStats.promedioHoras.toFixed(2)} horas
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="textSecondary">
                        Días Trabajados
                      </Typography>
                      <Typography variant="h6" color="secondary.main" fontWeight="bold">
                        {reportFilteredAsistencias.length} días
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Menú de Exportación */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={exportToExcel}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Exportar a Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportToPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Exportar a PDF</ListItemText>
        </MenuItem>
      </Menu>

      <ConfigHorariosDialog
        open={openConfigDialog}
        onClose={handleCloseConfigDialog}
        onSave={handleSaveConfiguracion}
        fullScreen={isMobile}
        empleados={empleados}
        selectedEmpleado={selectedEmpleado}
        setSelectedEmpleado={setSelectedEmpleado}
        form={configFormData}
        setForm={setConfigFormData}
      />

      <ExcepcionDialog
        open={openExcepcionDialog}
        onClose={handleCloseExcepcionDialog}
        onSave={handleSaveExcepcion}
        fullScreen={isMobile}
        empleados={empleados}
        form={excepcionFormData}
        setForm={setExcepcionFormData}
      />
    </Box>
  );
};

export default AsistenciasPage;
