import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  const [resumenPage, setResumenPage] = useState(0);
  const [resumenRowsPerPage, setResumenRowsPerPage] = useState(50);
  const [error, setError] = useState<string | null>(null);
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

  const queryClient = useQueryClient();

  // Base: empleados + configuraciones + excepciones. Es lo que refresca el
  // botón Recargar y las mutaciones (via loadData = invalidate).
  const baseQuery = useQuery({
    queryKey: ['asistencias-base'],
    queryFn: async () => {
      // Primero empleados (el resto de la página los usa para resolver nombres).
      const empleadosData = await employeeApi.getAllList().catch(() => []);
      const [configsData, excepcionesData] = await Promise.all([
        configuracionAsistenciaApi.getAll().catch(() => []),
        excepcionAsistenciaApi.getByPeriodo(
          dayjs().subtract(1, 'year').format('YYYY-MM-DD'),
          dayjs().format('YYYY-MM-DD')
        ).catch(() => []),
      ]);
      return {
        empleados: Array.isArray(empleadosData) ? empleadosData : [],
        configuraciones: Array.isArray(configsData) ? configsData : [],
        excepciones: Array.isArray(excepcionesData) ? excepcionesData : [],
      };
    },
  });
  const empleados = baseQuery.data?.empleados ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configuraciones: any[] = baseQuery.data?.configuraciones ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excepciones: any[] = baseQuery.data?.excepciones ?? [];
  const loading = baseQuery.isPending;
  const loadError = baseQuery.error ? 'Error al cargar los datos' : null;

  // Resumen Diario: página actual + totales exactos del rango, keyed por
  // rango y paginación. Errores degradan a tabla vacía (sin alert), como antes.
  const resumenQuery = useQuery({
    queryKey: ['asistencias-resumen', fechaDesde, fechaHasta, resumenPage, resumenRowsPerPage],
    queryFn: async () => {
      const [pageData, kpis] = await Promise.all([
        registroAsistenciaApi.getByPeriodoPaged(fechaDesde, fechaHasta, {
          page: resumenPage,
          size: resumenRowsPerPage,
        }),
        registroAsistenciaApi.getResumenPeriodo(fechaDesde, fechaHasta),
      ]);
      return {
        rows: Array.isArray(pageData.content) ? pageData.content : [],
        total: pageData.totalElements ?? 0,
        kpis: kpis ?? { totalAsistencias: 0, asistenciasNormales: 0 },
      };
    },
    enabled: !!fechaDesde && !!fechaHasta,
  });
  const resumenRowsRaw = resumenQuery.data?.rows ?? [];
  const resumenTotal = resumenQuery.data?.total ?? 0;
  const resumenKpis: ResumenAsistencia = resumenQuery.data?.kpis ?? {
    totalAsistencias: 0,
    asistenciasNormales: 0,
  };

  // Tab Reportes: dataset completo, solo se fetchea con el tab abierto
  // (enabled). Al volver al tab con el mismo rango se sirve de cache.
  const asistenciasQuery = useQuery({
    queryKey: ['asistencias-completas', fechaDesde, fechaHasta],
    queryFn: () => registroAsistenciaApi.getByPeriodo(fechaDesde, fechaHasta),
    enabled: tabValue === 3 && !!fechaDesde && !!fechaHasta,
  });
  // Mapear las asistencias para incluir el objeto empleado completo.
  const asistencias = useMemo<RegistroAsistencia[]>(() => {
    const data = asistenciasQuery.data;
    return Array.isArray(data)
      ? data.map((asistencia: any) => {
          const empleado = empleados.find((e: any) => e.id === asistencia.empleadoId);
          return {
            ...asistencia,
            empleado: empleado || {
              id: asistencia.empleadoId,
              nombre: asistencia.empleadoNombre || '',
              apellido: asistencia.empleadoApellido || '',
              dni: asistencia.empleadoDni || '',
            },
          };
        })
      : [];
  }, [asistenciasQuery.data, empleados]);

  // Licencias: cubren cualquier rango visible (Resumen, Reportes, Comparación)
  // usando la unión [min(desde), max(hasta)] — un único fetch alcanza para
  // todos los tabs, y el cambio de rango refetchea solo por la queryKey.
  const rangoLicencias = useMemo(() => {
    const allDates = [
      fechaDesde, fechaHasta,
      reportFechaDesde, reportFechaHasta,
      ...(showComparison ? [comparisonFechaDesde, comparisonFechaHasta] : []),
    ].filter(Boolean);
    if (allDates.length === 0) return null;
    return {
      desde: allDates.reduce((min, d) => (d < min ? d : min), allDates[0]),
      hasta: allDates.reduce((max, d) => (d > max ? d : max), allDates[0]),
    };
  }, [
    fechaDesde, fechaHasta,
    reportFechaDesde, reportFechaHasta,
    showComparison, comparisonFechaDesde, comparisonFechaHasta,
  ]);
  const licenciasQuery = useQuery({
    queryKey: ['asistencias-licencias', rangoLicencias?.desde, rangoLicencias?.hasta],
    queryFn: () => licenciaApi.getByPeriodo(rangoLicencias!.desde, rangoLicencias!.hasta)
      .then((data) => (Array.isArray(data) ? data : []))
      .catch(() => [] as Licencia[]),
    enabled: rangoLicencias != null,
  });
  const licencias = licenciasQuery.data ?? [];

  // Conserva los nombres de las funciones de recarga: ahora invalidan.
  const loadData = () => {
    queryClient.invalidateQueries({ queryKey: ['asistencias-base'] });
    queryClient.invalidateQueries({ queryKey: ['asistencias-licencias'] });
  };
  const loadResumenAsistencias = () =>
    queryClient.invalidateQueries({ queryKey: ['asistencias-resumen'] });

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


  const generarAutomaticasMutation = useMutation({
    mutationFn: () => asistenciaAutomaticaApi.ejecutarGeneracionDiaria(),
    onSuccess: () => { loadData(); loadResumenAsistencias(); },
    onError: (err) => {
      console.error('Error al generar asistencias:', err);
      setError('Error al generar asistencias automáticas');
    },
  });
  const handleGenerarAutomaticas = () => generarAutomaticasMutation.mutate();

  // Handlers para configuración de horarios
  const horarioEstandarMutation = useMutation({
    mutationFn: (empleadoId: number) => configuracionAsistenciaApi.createHorarioEstandar(empleadoId),
    onSuccess: () => loadData(),
    onError: (error) => {
      console.error('Error al crear horario estándar:', error);
      setError('Error al crear horario estándar');
    },
  });
  const handleCrearHorarioEstandar = (empleadoId: number) => horarioEstandarMutation.mutate(empleadoId);

  // Handlers para excepciones
  const deleteExcepcionMutation = useMutation({
    mutationFn: (excepcionId: number) => excepcionAsistenciaApi.delete(excepcionId),
    onSuccess: () => { loadData(); loadResumenAsistencias(); },
    onError: (error) => {
      console.error('Error al eliminar excepción:', error);
      setError('Error al eliminar excepción');
    },
  });
  const handleDeleteExcepcion = (excepcionId: number) => deleteExcepcionMutation.mutate(excepcionId);

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

  const saveConfiguracionMutation = useMutation({
    mutationFn: () => {
      const config = Array.isArray(configuraciones)
        ? configuraciones.find(c => c.empleadoId === selectedEmpleado!.id)
        : null;
      const payload = {
        empleadoId: selectedEmpleado!.id,
        activo: true,
        ...configFormData
      };
      return config
        ? configuracionAsistenciaApi.update(config.id, payload)
        : configuracionAsistenciaApi.create(payload);
    },
    onSuccess: () => { loadData(); handleCloseConfigDialog(); },
    onError: (error) => {
      console.error('Error al guardar configuración:', error);
      setError('Error al guardar configuración de horarios');
    },
  });
  const handleSaveConfiguracion = () => {
    if (!selectedEmpleado) return;
    saveConfiguracionMutation.mutate();
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

  const saveExcepcionMutation = useMutation({
    mutationFn: (payload: any) =>
      editingExcepcionId != null
        ? excepcionAsistenciaApi.update(editingExcepcionId, payload)
        : excepcionAsistenciaApi.create(payload),
    onSuccess: () => {
      loadData();
      loadResumenAsistencias();
      handleCloseExcepcionDialog();
    },
    onError: (error) => {
      console.error('Error al guardar excepción:', error);
      setError('Error al guardar excepción');
    },
  });

  const handleSaveExcepcion = async () => {
    try {
      // Validar que debe trabajar ese día (guard async previo a la mutación).
      const debeTrabajar = await asistenciaAutomaticaApi.debeTrabajar(
        parseInt(excepcionFormData.empleadoId),
        excepcionFormData.fecha
      );

      if (!debeTrabajar && excepcionFormData.tipo !== 'INASISTENCIA' && excepcionFormData.tipo !== 'HORAS_EXTRAS') {
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

      saveExcepcionMutation.mutate(payload);
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

      {(error || loadError) && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error || loadError}
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
