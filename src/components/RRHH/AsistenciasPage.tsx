import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Box,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  EventBusy as EventBusyIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
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
import ReportesTab from './Asistencias/tabs/ReportesTab';

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
  
  // Estados de visualización del tab Reportes (persisten entre cambios de tab).
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

      {tabValue === 3 && (
        <ReportesTab
          asistencias={asistencias}
          excepciones={excepciones}
          empleados={empleados}
          reportEmpleadoFilter={reportEmpleadoFilter}
          setReportEmpleadoFilter={setReportEmpleadoFilter}
          reportFechaDesde={reportFechaDesde}
          setReportFechaDesde={setReportFechaDesde}
          reportFechaHasta={reportFechaHasta}
          setReportFechaHasta={setReportFechaHasta}
          reportTipoFilter={reportTipoFilter}
          setReportTipoFilter={setReportTipoFilter}
          showCharts={showCharts}
          setShowCharts={setShowCharts}
          showComparison={showComparison}
          setShowComparison={setShowComparison}
          comparisonFechaDesde={comparisonFechaDesde}
          setComparisonFechaDesde={setComparisonFechaDesde}
          comparisonFechaHasta={comparisonFechaHasta}
          setComparisonFechaHasta={setComparisonFechaHasta}
        />
      )}

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
