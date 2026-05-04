// FRONT-003: extracted from AsistenciasPage.tsx — Tab "Reportes".
// Owns the heavy report-specific derivations (filtered list, stats,
// comparison, charts) and the export menu (Excel/PDF).  Filter state
// stays in the orchestrator so values persist across tab switches.
import React, { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  BarChart as ChartIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  GetApp as GetAppIcon,
  PictureAsPdf as PdfIcon,
  PieChart as PieChartIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TableChart as ExcelIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import type { Empleado, RegistroAsistencia } from '../../../../types';
import { getEmpleadoNombre } from '../utils';
import {
  exportAsistenciasToExcel,
  exportAsistenciasToPDF,
  type ReportStats,
} from '../exportService';

interface Props {
  asistencias: RegistroAsistencia[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excepciones: any[];
  empleados: Empleado[];
  reportEmpleadoFilter: Empleado | null;
  setReportEmpleadoFilter: (value: Empleado | null) => void;
  reportFechaDesde: string;
  setReportFechaDesde: (value: string) => void;
  reportFechaHasta: string;
  setReportFechaHasta: (value: string) => void;
  reportTipoFilter: string;
  setReportTipoFilter: (value: string) => void;
  showCharts: boolean;
  setShowCharts: (value: boolean) => void;
  showComparison: boolean;
  setShowComparison: (value: boolean) => void;
  comparisonFechaDesde: string;
  setComparisonFechaDesde: (value: string) => void;
  comparisonFechaHasta: string;
  setComparisonFechaHasta: (value: string) => void;
}

const TIPO_REGISTRO_OPTIONS: { value: string; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'LLEGADA_TARDE', label: 'Llegada Tarde' },
  { value: 'INASISTENCIA', label: 'Inasistencia' },
  { value: 'HORAS_EXTRAS', label: 'Horas Extras' },
  { value: 'SALIDA_ANTICIPADA', label: 'Salida Anticipada' },
  { value: 'PERMISO', label: 'Permiso' },
  { value: 'MODIFICACION_HORARIO', label: 'Modificación de Horario' },
];

const DIAS_SEMANA_LABEL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

interface DiaSemanaStats {
  dia: string;
  asistencias: number;
  tardanzas: number;
  inasistencias: number;
  horas: number;
}

const ReportesTab: React.FC<Props> = ({
  asistencias,
  excepciones,
  empleados,
  reportEmpleadoFilter,
  setReportEmpleadoFilter,
  reportFechaDesde,
  setReportFechaDesde,
  reportFechaHasta,
  setReportFechaHasta,
  reportTipoFilter,
  setReportTipoFilter,
  showCharts,
  setShowCharts,
  showComparison,
  setShowComparison,
  comparisonFechaDesde,
  setComparisonFechaDesde,
  comparisonFechaHasta,
  setComparisonFechaHasta,
}) => {
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const excepcionesArr = Array.isArray(excepciones) ? excepciones : [];

  const findExcepcion = (a: RegistroAsistencia) =>
    excepcionesArr.find(
      (ex) =>
        ex.empleadoId === a.empleado?.id &&
        dayjs(ex.fecha).format('YYYY-MM-DD') === dayjs(a.fecha).format('YYYY-MM-DD')
    ) ?? null;

  // ─── Derivations ───────────────────────────────────────────────────────────
  const reportFilteredAsistencias = asistencias.filter((a) => {
    if (!a.empleado) return false;

    const matchesEmpleado = !reportEmpleadoFilter || a.empleado.id === reportEmpleadoFilter.id;
    const asistenciaDate = dayjs(a.fecha);
    const matchesFecha = asistenciaDate.isBetween(
      dayjs(reportFechaDesde),
      dayjs(reportFechaHasta),
      null,
      '[]'
    );

    let matchesTipo = true;
    if (reportTipoFilter !== 'TODOS') {
      const excepcion = findExcepcion(a);
      if (reportTipoFilter === 'PRESENTE') matchesTipo = !excepcion;
      else matchesTipo = excepcion?.tipo === reportTipoFilter;
    }

    return matchesEmpleado && matchesFecha && matchesTipo;
  });

  const tardanzasInPeriodo = (desde: string, hasta: string) =>
    excepcionesArr.filter(
      (ex) =>
        ex.tipo === 'LLEGADA_TARDE' &&
        dayjs(ex.fecha).isBetween(dayjs(desde), dayjs(hasta), null, '[]') &&
        (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length;

  const inasistenciasInPeriodo = (desde: string, hasta: string) =>
    excepcionesArr.filter(
      (ex) =>
        ex.tipo === 'INASISTENCIA' &&
        dayjs(ex.fecha).isBetween(dayjs(desde), dayjs(hasta), null, '[]') &&
        (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length;

  const reportStats: ReportStats = {
    totalAsistencias: reportFilteredAsistencias.length,
    totalHoras: reportFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0),
    totalHorasExtras: reportFilteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0),
    promedioHoras:
      reportFilteredAsistencias.length > 0
        ? reportFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0) /
          reportFilteredAsistencias.length
        : 0,
    tardanzas: tardanzasInPeriodo(reportFechaDesde, reportFechaHasta),
    inasistencias: inasistenciasInPeriodo(reportFechaDesde, reportFechaHasta),
    empleadosUnicos: new Set(
      reportFilteredAsistencias
        .filter((a) => a.empleado?.id)
        .map((a) => a.empleado.id)
    ).size,
  };

  const horasExtrasEnPeriodo = excepcionesArr
    .filter(
      (ex) =>
        ex.tipo === 'HORAS_EXTRAS' &&
        dayjs(ex.fecha).isBetween(dayjs(reportFechaDesde), dayjs(reportFechaHasta), null, '[]') &&
        (!reportEmpleadoFilter || ex.empleadoId === reportEmpleadoFilter.id)
    ).length;

  const estadosDistribucion = [
    {
      name: 'Presente',
      value: reportFilteredAsistencias.filter((a) => !findExcepcion(a)).length,
      color: '#4caf50',
    },
    { name: 'Tardanza', value: reportStats.tardanzas, color: '#ff9800' },
    { name: 'Inasistencia', value: reportStats.inasistencias, color: '#f44336' },
    { name: 'Horas Extras', value: horasExtrasEnPeriodo, color: '#2196f3' },
  ].filter((item) => item.value > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const horasPorEmpleado: Array<{ nombre: string; horas: number; extras: number }> = reportEmpleadoFilter
    ? []
    : Object.values(
        reportFilteredAsistencias.reduce<Record<string, { nombre: string; horas: number; extras: number }>>(
          (acc, asistencia) => {
            if (asistencia.empleado) {
              const nombre = getEmpleadoNombre(asistencia.empleado);
              if (!acc[nombre]) acc[nombre] = { nombre, horas: 0, extras: 0 };
              acc[nombre].horas += asistencia.horasTrabajadas;
              acc[nombre].extras += asistencia.horasExtras;
            }
            return acc;
          },
          {}
        )
      )
        .sort((a, b) => b.horas - a.horas)
        .slice(0, 10);

  const tendenciaDiariaArray = Object.values(
    reportFilteredAsistencias.reduce<Record<string, { fecha: string; horas: number; count: number }>>(
      (acc, asistencia) => {
        const fecha = dayjs(asistencia.fecha).format('DD/MM');
        if (!acc[fecha]) acc[fecha] = { fecha, horas: 0, count: 0 };
        acc[fecha].horas += asistencia.horasTrabajadas;
        acc[fecha].count += 1;
        return acc;
      },
      {}
    )
  )
    .map((item) => ({ ...item, promedio: item.horas / item.count }))
    .sort((a, b) => {
      const [diaA, mesA] = a.fecha.split('/').map(Number);
      const [diaB, mesB] = b.fecha.split('/').map(Number);
      return mesA !== mesB ? mesA - mesB : diaA - diaB;
    });

  const asistenciasPorDiaSemana = reportFilteredAsistencias.reduce<Record<string, DiaSemanaStats>>(
    (acc, asistencia) => {
      const diaSemana = dayjs(asistencia.fecha).day();
      const diaIndex = diaSemana === 0 ? 6 : diaSemana - 1;
      const nombreDia = DIAS_SEMANA_LABEL[diaIndex];

      if (!acc[nombreDia]) {
        acc[nombreDia] = {
          dia: nombreDia,
          asistencias: 0,
          tardanzas: 0,
          inasistencias: 0,
          horas: 0,
        };
      }

      acc[nombreDia].asistencias += 1;
      acc[nombreDia].horas += asistencia.horasTrabajadas;

      const excepcion = findExcepcion(asistencia);
      if (excepcion?.tipo === 'LLEGADA_TARDE') acc[nombreDia].tardanzas += 1;
      if (excepcion?.tipo === 'INASISTENCIA') acc[nombreDia].inasistencias += 1;

      return acc;
    },
    {}
  );

  const asistenciasPorDiaArray: DiaSemanaStats[] = DIAS_SEMANA_LABEL.map(
    (dia) =>
      asistenciasPorDiaSemana[dia] ?? {
        dia,
        asistencias: 0,
        tardanzas: 0,
        inasistencias: 0,
        horas: 0,
      }
  );

  // ─── Comparison block ──────────────────────────────────────────────────────
  const comparisonFilteredAsistencias = showComparison
    ? asistencias.filter((a) => {
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
      })
    : [];

  const comparisonStats = showComparison
    ? {
        totalHoras: comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0),
        totalHorasExtras: comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasExtras, 0),
        promedioHoras:
          comparisonFilteredAsistencias.length > 0
            ? comparisonFilteredAsistencias.reduce((sum, a) => sum + a.horasTrabajadas, 0) /
              comparisonFilteredAsistencias.length
            : 0,
        tardanzas: tardanzasInPeriodo(comparisonFechaDesde, comparisonFechaHasta),
        inasistencias: inasistenciasInPeriodo(comparisonFechaDesde, comparisonFechaHasta),
      }
    : null;

  const periodosComparacion =
    showComparison && comparisonStats
      ? [
          {
            periodo: 'Período Actual',
            horas: reportStats.totalHoras,
            promedio: reportStats.promedioHoras,
            tardanzas: reportStats.tardanzas,
            inasistencias: reportStats.inasistencias,
          },
          {
            periodo: 'Período Anterior',
            horas: comparisonStats.totalHoras,
            promedio: comparisonStats.promedioHoras,
            tardanzas: comparisonStats.tardanzas,
            inasistencias: comparisonStats.inasistencias,
          },
        ]
      : [];

  // ─── Export handlers ───────────────────────────────────────────────────────
  const exportOpts = {
    asistencias: reportFilteredAsistencias,
    excepciones,
    reportStats,
    reportEmpleadoFilter,
    reportFechaDesde,
    reportFechaHasta,
    reportTipoFilter,
  };

  const handleExportExcel = async () => {
    await exportAsistenciasToExcel(exportOpts);
    setExportMenuAnchor(null);
  };

  const handleExportPDF = () => {
    exportAsistenciasToPDF(exportOpts);
    setExportMenuAnchor(null);
  };

  return (
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
                  {TIPO_REGISTRO_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
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
            <Typography variant="h6" mb={2}>
              Configurar Período de Comparación
            </Typography>
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
                    <strong>Período Actual:</strong>{' '}
                    {dayjs(reportFechaDesde).format('DD/MM/YYYY')} -{' '}
                    {dayjs(reportFechaHasta).format('DD/MM/YYYY')}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>

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
                          (
                          {comparisonStats.totalHoras > 0
                            ? (
                                ((reportStats.totalHoras - comparisonStats.totalHoras) /
                                  comparisonStats.totalHoras) *
                                100
                              ).toFixed(1)
                            : '0'}
                          %)
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
                          (
                          {reportStats.tardanzas < comparisonStats.tardanzas
                            ? '↓ Mejor'
                            : reportStats.tardanzas > comparisonStats.tardanzas
                            ? '↑ Peor'
                            : '='}
                          )
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
                          (
                          {reportStats.inasistencias < comparisonStats.inasistencias
                            ? '↓ Mejor'
                            : reportStats.inasistencias > comparisonStats.inasistencias
                            ? '↑ Peor'
                            : '='}
                          )
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
                      <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
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
                      dataKey={(data: DiaSemanaStats) =>
                        data.asistencias > 0 ? Number((data.horas / data.asistencias).toFixed(2)) : 0
                      }
                      fill="#2196f3"
                      name="Horas Promedio"
                    />
                  </BarChart>
                </ResponsiveContainer>
                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary" display="block">
                    <strong>Día más productivo:</strong>{' '}
                    {
                      asistenciasPorDiaArray.reduce(
                        (max, dia) =>
                          dia.asistencias > 0 &&
                          dia.horas / dia.asistencias > max.horas / (max.asistencias || 1)
                            ? dia
                            : max,
                        asistenciasPorDiaArray[0] ?? {
                          dia: 'N/A',
                          horas: 0,
                          asistencias: 1,
                          tardanzas: 0,
                          inasistencias: 0,
                        }
                      ).dia
                    }
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    <strong>Día con más tardanzas:</strong>{' '}
                    {
                      asistenciasPorDiaArray.reduce<DiaSemanaStats>(
                        (max, dia) => (dia.tardanzas > max.tardanzas ? dia : max),
                        { dia: 'N/A', tardanzas: 0, asistencias: 0, inasistencias: 0, horas: 0 }
                      ).dia
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
                  reportFilteredAsistencias.map((asistencia) => {
                    const excepcion = findExcepcion(asistencia);
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
                            <Chip
                              label="Presente"
                              color="success"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
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
                            <Chip
                              label="Ausente"
                              color="error"
                              size="small"
                              icon={<CancelIcon />}
                            />
                          )}
                          {estadoFinal === 'HORAS_EXTRAS' && excepcion && (
                            <Chip
                              label={`+ ${excepcion.horasExtras || 0}h extras`}
                              color="info"
                              size="small"
                              icon={<TrendingUpIcon />}
                            />
                          )}
                          {['SALIDA_ANTICIPADA', 'PERMISO', 'MODIFICACION_HORARIO'].includes(
                            estadoFinal
                          ) && (
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
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {asistencia.horaSalida ? (
                            <Typography variant="body2" fontWeight="500">
                              {asistencia.horaSalida}
                            </Typography>
                          ) : (
                            '-'
                          )}
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
                            {asistencia.horasExtras > 0
                              ? `+${asistencia.horasExtras.toFixed(1)}h`
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {excepcion
                              ? excepcion.observaciones || excepcion.motivo || '-'
                              : asistencia.observaciones || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

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

      {/* Menú de Exportación */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={handleExportExcel}>
          <ListItemIcon>
            <ExcelIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Exportar a Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportPDF}>
          <ListItemIcon>
            <PdfIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Exportar a PDF</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ReportesTab;
