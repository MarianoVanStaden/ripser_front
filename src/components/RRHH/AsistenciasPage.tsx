import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import type { ResumenAsistencia } from '../../api/services/registroAsistenciaApi';
import { asistenciaAutomaticaApi } from '../../api/services/asistenciaAutomaticaApi';
import { licenciaApi } from '../../api/services/licenciaApi';
import type { Licencia, RegistroAsistencia, Empleado } from '../../types';
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
  excepcionToFormData,
} from './Asistencias/constants';
import ConfigHorariosDialog from './Asistencias/dialogs/ConfigHorariosDialog';
import ExcepcionDialog from './Asistencias/dialogs/ExcepcionDialog';
import ExcepcionMasivaDialog from './Asistencias/dialogs/ExcepcionMasivaDialog';
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

  // `asistencias` (dataset completo) sólo se usa en el tab Reportes y se carga
  // de forma diferida al abrirlo. El Resumen Diario usa paginación de servidor.
  const [asistencias, setAsistencias] = useState<RegistroAsistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // Resumen Diario: tabla paginada en servidor + totales exactos del rango.
  const [resumenRowsRaw, setResumenRowsRaw] = useState<RegistroAsistencia[]>([]);
  const [resumenTotal, setResumenTotal] = useState(0);
  const [resumenKpis, setResumenKpis] = useState<ResumenAsistencia>({
    totalAsistencias: 0,
    asistenciasNormales: 0,
  });
  const [resumenPage, setResumenPage] = useState(0);
  const [resumenRowsPerPage, setResumenRowsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuraciones y excepciones
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [excepciones, setExcepciones] = useState<any[]>([]);
  // Licencias del período visible (cualquier estado). Las APROBADAS se
  // pintan como chip "En Licencia" en el Resumen Diario y suman al KPI propio.
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [openConfigDialog, setOpenConfigDialog] = useState(false);
  const [openExcepcionDialog, setOpenExcepcionDialog] = useState(false);
  const [openMasivaDialog, setOpenMasivaDialog] = useState(false);
  const [editingExcepcionId, setEditingExcepcionId] = useState<number | null>(null);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [configFormData, setConfigFormData] = useState<ConfigFormData>(DEFAULT_DIA_CONFIG);
  const [excepcionFormData, setExcepcionFormData] = useState<ExcepcionFormData>(
    createInitialExcepcionForm
  );

  const [fechaDesde, setFechaDesde] = useState(dayjs().subtract(3, 'month').format('YYYY-MM-DD'));
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

  // Resumen Diario: trae la página actual + los totales exactos del rango.
  const loadResumenAsistencias = useCallback(async () => {
    if (!fechaDesde || !fechaHasta) return;
    try {
      const [pageData, kpis] = await Promise.all([
        registroAsistenciaApi.getByPeriodoPaged(fechaDesde, fechaHasta, {
          page: resumenPage,
          size: resumenRowsPerPage,
        }),
        registroAsistenciaApi.getResumenPeriodo(fechaDesde, fechaHasta),
      ]);
      setResumenRowsRaw(Array.isArray(pageData.content) ? pageData.content : []);
      setResumenTotal(pageData.totalElements ?? 0);
      setResumenKpis(kpis ?? { totalAsistencias: 0, asistenciasNormales: 0 });
    } catch (err) {
      console.error('Error loading resumen asistencias:', err);
      setResumenRowsRaw([]);
      setResumenTotal(0);
    }
  }, [fechaDesde, fechaHasta, resumenPage, resumenRowsPerPage]);

  useEffect(() => {
    loadResumenAsistencias();
  }, [loadResumenAsistencias]);

  // Tab Reportes: carga el dataset completo de asistencias sólo al abrirlo.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (tabValue === 3 && fechaDesde && fechaHasta) {
      loadAsistenciasByPeriodo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, fechaDesde, fechaHasta]);

  // Licencias necesitan cubrir cualquier rango visible (Resumen, Reportes,
  // Comparación). Recargamos cuando cambia alguno de esos rangos usando la
  // unión [min(desde), max(hasta)] así un único fetch alcanza para todos los tabs.
  useEffect(() => {
    const allDates = [
      fechaDesde, fechaHasta,
      reportFechaDesde, reportFechaHasta,
      ...(showComparison ? [comparisonFechaDesde, comparisonFechaHasta] : []),
    ].filter(Boolean);
    if (allDates.length === 0) return;
    const minDesde = allDates.reduce((min, d) => (d < min ? d : min), allDates[0]);
    const maxHasta = allDates.reduce((max, d) => (d > max ? d : max), allDates[0]);
    licenciaApi
      .getByPeriodo(minDesde, maxHasta)
      .then((data) => setLicencias(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Error loading licencias (unión rangos):', err);
        setLicencias([]);
      });
  }, [
    fechaDesde, fechaHasta,
    reportFechaDesde, reportFechaHasta,
    showComparison, comparisonFechaDesde, comparisonFechaHasta,
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero cargar empleados
      const empleadosData = await employeeApi.getAllList().catch(() => []);
      const empleadosArray = Array.isArray(empleadosData) ? empleadosData : [];
      setEmpleados(empleadosArray);
      
      // Luego cargar configuraciones, excepciones y licencias en paralelo
      const [configsData, excepcionesData, licenciasData] = await Promise.all([
        configuracionAsistenciaApi.getAll().catch(() => []),
        excepcionAsistenciaApi.getByPeriodo(
          dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
          dayjs().format('YYYY-MM-DD')
        ).catch(() => []),
        licenciaApi.getByPeriodo(fechaDesde, fechaHasta).catch(() => [])
      ]);

      console.log('Configuraciones data:', configsData);
      console.log('Excepciones data:', excepcionesData);
      console.log('Licencias data:', licenciasData);

      setConfiguraciones(Array.isArray(configsData) ? configsData : []);
      setExcepciones(Array.isArray(excepcionesData) ? excepcionesData : []);
      setLicencias(Array.isArray(licenciasData) ? licenciasData : []);

      // La tabla del Resumen Diario se carga paginada vía efecto aparte
      // (loadResumenAsistencias). El dataset completo de `asistencias` queda
      // para el tab Reportes y se carga al abrirlo.
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
      setEmpleados([]);
      setAsistencias([]);
      setConfiguraciones([]);
      setExcepciones([]);
      setLicencias([]);
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
    // Recargar licencias para el nuevo rango así el chip "En Licencia" sigue al día.
    try {
      const data = await licenciaApi.getByPeriodo(fechaDesde, fechaHasta);
      setLicencias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading licencias:', err);
      setLicencias([]);
    }
  };

  // Filas de la página actual del Resumen Diario con el objeto empleado resuelto
  // (el backend devuelve empleadoId; el nombre se arma desde la lista de empleados).
  const resumenRows = useMemo<RegistroAsistencia[]>(
    () =>
      resumenRowsRaw.map((a) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = a as any;
        return {
          ...raw,
          empleado:
            empleados.find((e) => e.id === raw.empleadoId) ||
            ({
              id: raw.empleadoId,
              nombre: raw.empleadoNombre || '',
              apellido: raw.empleadoApellido || '',
              dni: raw.empleadoDni || '',
            } as Empleado),
        } as RegistroAsistencia;
      }),
    [resumenRowsRaw, empleados]
  );


  const handleGenerarAutomaticas = async () => {
    try {
      await asistenciaAutomaticaApi.ejecutarGeneracionDiaria();
      await loadData();
      await loadResumenAsistencias();
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
      await loadResumenAsistencias();
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
    setEditingExcepcionId(null);
    setExcepcionFormData(createInitialExcepcionForm());
    setOpenExcepcionDialog(true);
  };

  const handleOpenEditExcepcion = (excepcion: any) => {
    setEditingExcepcionId(excepcion.id);
    setExcepcionFormData(excepcionToFormData(excepcion));
    setOpenExcepcionDialog(true);
  };

  const handleCloseExcepcionDialog = () => {
    setOpenExcepcionDialog(false);
    setEditingExcepcionId(null);
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
      if (editingExcepcionId != null) {
        await excepcionAsistenciaApi.update(editingExcepcionId, payload);
      } else {
        await excepcionAsistenciaApi.create(payload);
      }
      await loadData();
      await loadResumenAsistencias();
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
          asistencias={resumenRows}
          excepciones={excepciones}
          licencias={licencias}
          empleados={empleados}
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onChangeFechaDesde={(v) => { setResumenPage(0); setFechaDesde(v); }}
          onChangeFechaHasta={(v) => { setResumenPage(0); setFechaHasta(v); }}
          onGenerarAutomaticas={handleGenerarAutomaticas}
          totalAsistencias={resumenTotal}
          asistenciasNormales={resumenKpis.asistenciasNormales}
          page={resumenPage}
          rowsPerPage={resumenRowsPerPage}
          onPageChange={setResumenPage}
          onRowsPerPageChange={(rpp) => { setResumenRowsPerPage(rpp); setResumenPage(0); }}
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
          onEditExcepcion={handleOpenEditExcepcion}
          onOpenMasivaDialog={() => setOpenMasivaDialog(true)}
        />
      )}

      {tabValue === 3 && (
        <ReportesTab
          asistencias={asistencias}
          excepciones={excepciones}
          licencias={licencias}
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
        isEdit={editingExcepcionId != null}
      />

      <ExcepcionMasivaDialog
        open={openMasivaDialog}
        onClose={() => setOpenMasivaDialog(false)}
        onSaved={loadData}
        fullScreen={isMobile}
        empleados={empleados}
      />
    </Box>
  );
};

export default AsistenciasPage;
