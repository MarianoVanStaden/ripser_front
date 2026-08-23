import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardContent,
  TextField, MenuItem, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Select, FormControl, InputLabel, IconButton, Tooltip as MuiTooltip,
  Stack, Divider,
} from '@mui/material';
import {
  Inventory, Assignment, CheckCircle, LocalShipping,
  TrendingUp, PieChart as PieChartIcon, GetApp as GetAppIcon,
  ChevronLeft, ChevronRight, Build, HourglassEmpty,
} from '@mui/icons-material';
import { generateReportesEstadosPDF, generateReportesFabricacionPDF, captureElementAsImage } from '../../utils/pdfExportUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import dayjs from 'dayjs';
import api from '../../api/config';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { EquipoFabricadoDTO, EstadoAsignacionEquipo } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';

interface EstadisticasEstados {
  DISPONIBLE: number;
  RESERVADO: number;
  FACTURADO: number;
  EN_TRANSITO: number;
  ENTREGADO: number;
  PENDIENTE_TERMINACION: number;
  EN_SERVICE: number;
  total: number;
}

// Tokens semánticos de estado (theme.status.*) como CSS vars: válidos en sx, borders y SVG (Recharts).
const fgVar = (role: string) => `var(--mui-palette-status-${role}-fg)`;
const bgVar = (role: string) => `var(--mui-palette-status-${role}-bg)`;

// Fuente única de verdad para los estados de asignación: orden fijo, rol visual, ícono.
// La leyenda con conteos y la tabla cubren el relief de contraste.
const ESTADOS_ASIGNACION: Array<{
  key: EstadoAsignacionEquipo;
  label: string;
  hex: string;
  bg: string;
  icon: React.ReactElement<{ sx?: object }>;
}> = [
  { key: 'DISPONIBLE', label: 'Disponible', hex: fgVar('success'), bg: bgVar('success'), icon: <Inventory /> },
  { key: 'RESERVADO', label: 'Reservado', hex: fgVar('warning'), bg: bgVar('warning'), icon: <Assignment /> },
  { key: 'FACTURADO', label: 'Facturado', hex: fgVar('info'), bg: bgVar('info'), icon: <CheckCircle /> },
  { key: 'EN_TRANSITO', label: 'En Tránsito', hex: fgVar('process'), bg: bgVar('process'), icon: <LocalShipping /> },
  { key: 'ENTREGADO', label: 'Entregado', hex: fgVar('success'), bg: bgVar('success'), icon: <CheckCircle /> },
  { key: 'PENDIENTE_TERMINACION', label: 'Pend. Terminación', hex: fgVar('warning'), bg: bgVar('warning'), icon: <HourglassEmpty /> },
  { key: 'EN_SERVICE', label: 'En Service', hex: fgVar('danger'), bg: bgVar('danger'), icon: <Build /> },
];

const estadoCfg = (estado: EstadoAsignacionEquipo) =>
  ESTADOS_ASIGNACION.find((e) => e.key === estado);

// Estados de fabricación en curso (snapshot actual): mismos roles que el donut de fabricación.
const ESTADOS_FABRICACION_WIP: Array<{
  key: string;
  label: string;
  hex: string;
  bg: string;
}> = [
  { key: 'PENDIENTE', label: 'Pendiente', hex: fgVar('warning'), bg: bgVar('warning') },
  { key: 'EN_PROCESO', label: 'En Proceso', hex: fgVar('process'), bg: bgVar('process') },
  { key: 'PENDIENTE_CONTROL_CALIDAD', label: 'Control Calidad', hex: fgVar('info'), bg: bgVar('info') },
  { key: 'FABRICADO_SIN_TERMINACION', label: 'Sin Terminación', hex: fgVar('neutral'), bg: bgVar('neutral') },
];

// Máximo de chips de códigos visibles por estado antes de colapsar en "+N más".
const MAX_CODIGOS_VISIBLES = 60;

/** Leyenda propia para los donuts: nombre + cantidad + % en texto legible (sin labels sobre las porciones). */
const DonutLegend: React.FC<{ data: Array<{ name: string; value: number; color: string }> }> = ({ data }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <Stack spacing={0.75} justifyContent="center" sx={{ minWidth: 190 }}>
      {data.map((d) => (
        <Box key={d.name} display="flex" alignItems="center" gap={1}>
          <Box sx={{ width: 12, height: 12, borderRadius: '3px', bgcolor: d.color, flexShrink: 0 }} />
          <Typography variant="body2" sx={{ flex: 1 }} noWrap>
            {d.name}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {d.value}
          </Typography>
          {/* eslint-disable-next-line ripser/no-literal-colors -- texto sobre fondo blanco fijo de captura PDF */}
          <Typography variant="caption" sx={{ width: 38, textAlign: 'right', color: 'rgba(0, 0, 0, 0.6)' }}>
            {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : '0%'}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

/** Donut sin labels superpuestos: gap blanco entre porciones, total al centro, leyenda al costado.
 * El wrapper mantiene fondo blanco fijo (se captura como imagen para el PDF, siempre claro);
 * por eso el texto interno usa colores fijos oscuros, no tokens de texto del theme. */
const DonutChart: React.FC<{
  id: string;
  data: Array<{ name: string; value: number; color: string }>;
  centerLabel: string;
}> = ({ id, data, centerLabel }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    // eslint-disable-next-line ripser/no-literal-colors -- fondo blanco fijo para captura PDF; texto fijo oscuro encima
    <div id={id} style={{ background: '#fff', color: 'rgba(0, 0, 0, 0.87)' }}>
      <Box display="flex" alignItems="center" flexWrap="wrap">
        <Box sx={{ width: { xs: '100%', sm: 240 }, height: 240, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={95}
                paddingAngle={1.5}
                // eslint-disable-next-line ripser/no-literal-colors -- gap entre porciones sobre el fondo blanco fijo de captura
                stroke="#fff"
                strokeWidth={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} equipos`, String(name)]} />
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
            }}
          >
            <Typography variant="h4" fontWeight={700}>{total}</Typography>
            {/* eslint-disable-next-line ripser/no-literal-colors -- texto sobre fondo blanco fijo de captura PDF */}
            <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>{centerLabel}</Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1, pl: { sm: 2 }, pt: { xs: 1, sm: 0 } }}>
          <DonutLegend data={data} />
        </Box>
      </Box>
    </div>
  );
};

const ReportesEstadosPage: React.FC = () => {
  const [equipos, setEquipos] = useState<EquipoFabricadoDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros globales (barra superior). mesSeleccionado = '' significa "todos los meses".
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => dayjs().format('YYYY-MM'));
  const [filtroEstado, setFiltroEstado] = useState<EstadoAsignacionEquipo | 'TODOS'>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroModelo, setFiltroModelo] = useState<string>('');

  // Paginación de la tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/equipos-fabricados', {
        params: { page: 0, size: 10000 },
      });
      setEquipos(response.data.content || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (delta: number) => {
    const base = mesSeleccionado ? dayjs(`${mesSeleccionado}-01`) : dayjs();
    setMesSeleccionado(base.add(delta, 'month').format('YYYY-MM'));
  };

  const mesLabel = mesSeleccionado
    ? dayjs(`${mesSeleccionado}-01`).format('MMMM YYYY')
    : 'Todos los meses';

  // Equipos del período (mes + tipo + modelo). El filtro de estado NO se aplica acá:
  // las métricas y los códigos por estado siempre muestran la distribución completa del mes.
  const equiposDelMes = useMemo(() => {
    let result = equipos;
    if (mesSeleccionado) {
      result = result.filter((e) => dayjs(e.fechaCreacion).format('YYYY-MM') === mesSeleccionado);
    }
    if (filtroTipo !== 'TODOS') {
      result = result.filter((e) => e.tipo === filtroTipo);
    }
    if (filtroModelo) {
      result = result.filter((e) => e.modelo.toLowerCase().includes(filtroModelo.toLowerCase()));
    }
    return result;
  }, [equipos, mesSeleccionado, filtroTipo, filtroModelo]);

  // Tabla: período + filtro de estado (drill-down).
  const filteredEquipos = useMemo(() => {
    if (filtroEstado === 'TODOS') return equiposDelMes;
    return equiposDelMes.filter((e) => e.estadoAsignacion === filtroEstado);
  }, [equiposDelMes, filtroEstado]);

  useEffect(() => {
    setPage(0);
  }, [filteredEquipos]);

  const estadisticas = useMemo<EstadisticasEstados>(() => {
    const stats: EstadisticasEstados = {
      DISPONIBLE: 0, RESERVADO: 0, FACTURADO: 0, EN_TRANSITO: 0,
      ENTREGADO: 0, PENDIENTE_TERMINACION: 0, EN_SERVICE: 0,
      total: equiposDelMes.length,
    };
    equiposDelMes.forEach((equipo) => {
      if (equipo.estadoAsignacion) {
        stats[equipo.estadoAsignacion]++;
      } else if (equipo.estado === 'COMPLETADO') {
        // DTO sin estadoAsignacion explícito: inferir por flag asignado.
        if (equipo.asignado) stats.ENTREGADO++;
        else stats.DISPONIBLE++;
      }
    });
    return stats;
  }, [equiposDelMes]);

  // Códigos de equipos agrupados por estado de asignación (para el mes seleccionado).
  const codigosPorEstado = useMemo(() => {
    const grupos = new Map<EstadoAsignacionEquipo, EquipoFabricadoDTO[]>();
    ESTADOS_ASIGNACION.forEach((e) => grupos.set(e.key, []));
    equiposDelMes.forEach((equipo) => {
      const estado = equipo.estadoAsignacion
        ?? (equipo.estado === 'COMPLETADO' ? (equipo.asignado ? 'ENTREGADO' : 'DISPONIBLE') : null);
      if (estado && grupos.has(estado)) grupos.get(estado)!.push(equipo);
    });
    return grupos;
  }, [equiposDelMes]);

  const pieChartData = useMemo(() =>
    ESTADOS_ASIGNACION
      .filter((e) => !['PENDIENTE_TERMINACION', 'EN_SERVICE'].includes(e.key))
      .map((e) => ({ name: e.label, value: estadisticas[e.key], color: e.hex }))
      .filter((item) => item.value > 0),
  [estadisticas]);

  const barChartData = useMemo(() =>
    ESTADOS_ASIGNACION
      .filter((e) => !['PENDIENTE_TERMINACION', 'EN_SERVICE'].includes(e.key))
      .map((e) => ({ estado: e.label, cantidad: estadisticas[e.key], color: e.hex })),
  [estadisticas]);

  const hasAsignacionData = pieChartData.length > 0;

  // ===== Fabricación (snapshot actual + producción mensual) =====
  // Ventana fija de 12 meses que termina en el mes seleccionado (u hoy si "todos").
  const mesFin = mesSeleccionado ? dayjs(`${mesSeleccionado}-01`) : dayjs().startOf('month');
  const mesInicio = mesFin.subtract(11, 'month');
  const fechaInicio = mesInicio.startOf('month').format('YYYY-MM-DD');
  const fechaFin = mesFin.endOf('month').format('YYYY-MM-DD');

  const { data: resumenEstados } = useQuery({
    queryKey: ['equipos-fabricados', 'resumen-estados'],
    queryFn: () => equipoFabricadoApi.getResumenEstados(),
  });

  const { data: produccionMensual } = useQuery({
    queryKey: ['equipos-fabricados', 'produccion-mensual', fechaInicio, fechaFin],
    queryFn: () => equipoFabricadoApi.getProduccionMensual(fechaInicio, fechaFin),
  });

  // Rellena los 12 meses de la ventana (sin datos = 0).
  const mensualData = useMemo(() => {
    const map = new Map<string, { ingresos: number; completados: number }>();
    (produccionMensual ?? []).forEach((m) =>
      map.set(`${m.anio}-${m.mes}`, { ingresos: m.ingresos, completados: m.completados }));
    const buckets: Array<{ anio: number; mes: number; label: string; yyyymm: string; ingresos: number; completados: number }> = [];
    let cursor = mesInicio;
    while (cursor.isBefore(mesFin) || cursor.isSame(mesFin, 'month')) {
      const anio = cursor.year();
      const mes = cursor.month() + 1;
      const v = map.get(`${anio}-${mes}`);
      buckets.push({
        anio, mes,
        label: cursor.format('MM/YY'),
        yyyymm: cursor.format('YYYY-MM'),
        ingresos: v?.ingresos ?? 0,
        completados: v?.completados ?? 0,
      });
      cursor = cursor.add(1, 'month');
    }
    return buckets;
  }, [produccionMensual, fechaInicio, fechaFin]);

  // Códigos de equipos actualmente en fabricación, por estado. Snapshot sobre todos los
  // equipos cargados: NO se filtra por mes — el trabajo en curso es de "ahora", venga del mes que venga.
  const codigosEnFabricacion = useMemo(() => {
    const grupos = new Map<string, EquipoFabricadoDTO[]>();
    ESTADOS_FABRICACION_WIP.forEach((e) => grupos.set(e.key, []));
    equipos.forEach((equipo) => {
      if (grupos.has(equipo.estado)) grupos.get(equipo.estado)!.push(equipo);
    });
    grupos.forEach((lista) => lista.sort((a, b) => a.numeroHeladera.localeCompare(b.numeroHeladera)));
    return grupos;
  }, [equipos]);

  const estadoFabData = useMemo(() => {
    if (!resumenEstados) return [] as Array<{ name: string; value: number; color: string }>;
    return [
      { name: 'Completados', value: resumenEstados.completados, color: fgVar('success') },
      { name: 'Sin Terminación', value: resumenEstados.sinTerminacion, color: fgVar('neutral') },
      { name: 'En Proceso', value: resumenEstados.enProceso, color: fgVar('process') },
      { name: 'Pendientes', value: resumenEstados.pendientes, color: fgVar('warning') },
      { name: 'Control Calidad', value: resumenEstados.pendienteControlCalidad, color: fgVar('info') },
      { name: 'Cancelados', value: resumenEstados.cancelados, color: fgVar('danger') },
    ].filter((d) => d.value > 0);
  }, [resumenEstados]);

  const clearFilters = () => {
    setFiltroEstado('TODOS');
    setFiltroTipo('TODOS');
    setFiltroModelo('');
    setMesSeleccionado(dayjs().format('YYYY-MM'));
  };

  const handleExportPDF = async () => {
    try {
      const [pieImg, barImg] = await Promise.all([
        captureElementAsImage('estados-pie-chart'),
        captureElementAsImage('estados-bar-chart'),
      ]);
      await generateReportesEstadosPDF(
        estadisticas,
        filteredEquipos,
        {
          estado: filtroEstado,
          tipo: filtroTipo,
          modelo: filtroModelo,
          fechaDesde: mesSeleccionado ? dayjs(`${mesSeleccionado}-01`).startOf('month').format('YYYY-MM-DD') : '',
          fechaHasta: mesSeleccionado ? dayjs(`${mesSeleccionado}-01`).endOf('month').format('YYYY-MM-DD') : '',
        },
        { pieChartImgData: pieImg, barChartImgData: barImg }
      );
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  const handleExportFabricacionPDF = async () => {
    if (!resumenEstados) return;
    try {
      const [estadoImg, mensualImg] = await Promise.all([
        captureElementAsImage('fabricacion-estado-chart'),
        captureElementAsImage('fabricacion-mensual-chart'),
      ]);
      await generateReportesFabricacionPDF(
        resumenEstados,
        mensualData.map(({ anio, mes, ingresos, completados }) => ({ anio, mes, ingresos, completados })),
        { fechaDesde: fechaInicio, fechaHasta: fechaFin },
        { estadoChartImgData: estadoImg, mensualChartImgData: mensualImg },
      );
    } catch (err) {
      console.error('Error al generar PDF de fabricación:', err);
    }
  };

  return (
    <Box>
      <LoadingOverlay open={loading} message="Cargando reportes de estados..." />

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <Typography variant="h4" fontWeight="600">
          Dashboard de Estados de Equipos
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={loadData}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleExportPDF}>
            Exportar PDF
          </Button>
        </Box>
      </Box>

      {/* Barra de filtros — arriba de todo, gobierna toda la página */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <MuiTooltip title="Mes anterior">
                  <IconButton size="small" onClick={() => cambiarMes(-1)}>
                    <ChevronLeft />
                  </IconButton>
                </MuiTooltip>
                <TextField
                  fullWidth
                  size="small"
                  label="Mes"
                  type="month"
                  InputLabelProps={{ shrink: true }}
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  helperText={mesSeleccionado ? undefined : 'Sin mes: se muestran todos los equipos'}
                />
                <MuiTooltip title="Mes siguiente">
                  <IconButton size="small" onClick={() => cambiarMes(1)}>
                    <ChevronRight />
                  </IconButton>
                </MuiTooltip>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  label="Estado"
                  onChange={(e) => setFiltroEstado(e.target.value as EstadoAsignacionEquipo | 'TODOS')}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  {ESTADOS_ASIGNACION.map((e) => (
                    <MenuItem key={e.key} value={e.key}>{e.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtroTipo}
                  label="Tipo"
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="HELADERA">Heladera</MenuItem>
                  <MenuItem value="COOLBOX">Coolbox</MenuItem>
                  <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Modelo"
                value={filtroModelo}
                onChange={(e) => setFiltroModelo(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={1} display="flex" justifyContent="flex-end">
              <Button variant="outlined" size="small" onClick={clearFilters}>
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPIs del período */}
      <Box display="flex" alignItems="baseline" gap={1} mb={1.5}>
        <Typography variant="h5" fontWeight="600">
          Estados de Asignación
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          — {mesLabel}
        </Typography>
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Equipos
                  </Typography>
                  <Typography variant="h4" fontWeight="600">
                    {estadisticas.total}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {ESTADOS_ASIGNACION
          .filter((e) => !['PENDIENTE_TERMINACION', 'EN_SERVICE'].includes(e.key))
          .map((e) => (
            <Grid item xs={12} sm={6} md={2} key={e.key}>
              <Card sx={{ bgcolor: e.bg }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {e.label}
                      </Typography>
                      <Typography variant="h4" fontWeight="600" sx={{ color: e.hex }}>
                        {estadisticas[e.key]}
                      </Typography>
                    </Box>
                    {React.cloneElement(e.icon, { sx: { fontSize: 40, color: e.hex } })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Gráficos de asignación */}
      <Grid container spacing={3} mb={4}>
        {hasAsignacionData ? (
          <>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <PieChartIcon /> Distribución por Estado
                  </Typography>
                  <DonutChart id="estados-pie-chart" data={pieChartData} centerLabel="equipos" />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cantidad por Estado
                  </Typography>
                  {/* eslint-disable-next-line ripser/no-literal-colors -- fondo blanco fijo para captura PDF */}
                  <div id="estados-bar-chart" style={{ background: '#fff', color: 'rgba(0, 0, 0, 0.87)' }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value) => [`${value} equipos`, 'Cantidad']} />
                        <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                          {barChartData.map((entry) => (
                            <Cell key={entry.estado} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={4}>
                  <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Sin equipos en {mesLabel.toLowerCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cambiá de mes con las flechas o borrá el mes para ver todos los equipos
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Códigos de equipos por estado (del mes seleccionado) */}
      <Box display="flex" alignItems="baseline" gap={1} mb={1.5}>
        <Typography variant="h5" fontWeight="600">
          Códigos por Estado
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
          — {mesLabel}
        </Typography>
      </Box>
      <Grid container spacing={2} mb={4}>
        {ESTADOS_ASIGNACION.map((cfg) => {
          const lista = codigosPorEstado.get(cfg.key) ?? [];
          if (lista.length === 0) return null;
          const visibles = lista.slice(0, MAX_CODIGOS_VISIBLES);
          const ocultos = lista.length - visibles.length;
          return (
            <Grid item xs={12} sm={6} md={4} key={cfg.key}>
              <Card sx={{ height: '100%', borderTop: `3px solid ${cfg.hex}` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {React.cloneElement(cfg.icon, { sx: { color: cfg.hex } })}
                      <Typography variant="subtitle1" fontWeight={600}>
                        {cfg.label}
                      </Typography>
                    </Box>
                    <Chip label={lista.length} size="small" sx={{ bgcolor: cfg.bg, fontWeight: 600 }} />
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box display="flex" flexWrap="wrap" gap={0.75}>
                    {visibles.map((equipo) => (
                      <MuiTooltip
                        key={equipo.id}
                        title={`${equipo.tipo} ${equipo.modelo}${equipo.clienteNombre ? ` — ${equipo.clienteNombre}` : ''}`}
                      >
                        <Chip label={equipo.numeroHeladera} size="small" variant="outlined" />
                      </MuiTooltip>
                    ))}
                    {ocultos > 0 && (
                      <Chip label={`+${ocultos} más`} size="small" sx={{ bgcolor: cfg.bg }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {equiposDelMes.length === 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No hay equipos creados en este período
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ====== Fabricación (snapshot actual + producción mensual) ====== */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2}>
        <Typography variant="h5" fontWeight="600">
          Fabricación
        </Typography>
        <Button
          variant="contained"
          startIcon={<GetAppIcon />}
          onClick={handleExportFabricacionPDF}
          disabled={!resumenEstados}
        >
          Exportar PDF (período)
        </Button>
      </Box>

      {/* KPIs por estado de fabricación (snapshot actual, no depende del mes) */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total', value: resumenEstados?.total ?? 0, bg: 'background.default', color: 'text.secondary' },
          { label: 'Completados', value: resumenEstados?.completados ?? 0, bg: bgVar('success'), color: fgVar('success') },
          { label: 'Sin Terminación', value: resumenEstados?.sinTerminacion ?? 0, bg: bgVar('neutral'), color: fgVar('neutral') },
          { label: 'En Proceso', value: resumenEstados?.enProceso ?? 0, bg: bgVar('process'), color: fgVar('process') },
          { label: 'Pendientes', value: resumenEstados?.pendientes ?? 0, bg: bgVar('warning'), color: fgVar('warning') },
          { label: 'Control Calidad', value: resumenEstados?.pendienteControlCalidad ?? 0, bg: bgVar('info'), color: fgVar('info') },
        ].map((k) => (
          <Grid item xs={6} sm={4} md={2} key={k.label}>
            <Card sx={{ bgcolor: k.bg }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {k.label}
                </Typography>
                <Typography variant="h4" fontWeight="600" sx={{ color: k.color }}>
                  {k.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <PieChartIcon /> Estado de Fabricación (actual)
              </Typography>
              <DonutChart id="fabricacion-estado-chart" data={estadoFabData} centerLabel="equipos" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Producción por mes: ingresos vs. completados
              </Typography>
              {/* eslint-disable-next-line ripser/no-literal-colors -- fondo blanco fijo para captura PDF */}
              <div id="fabricacion-mensual-chart" style={{ background: '#fff', color: 'rgba(0, 0, 0, 0.87)' }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={mensualData}
                    onClick={(state) => {
                      const i = Number(state?.activeTooltipIndex);
                      if (!Number.isNaN(i) && mensualData[i]) setMesSeleccionado(mensualData[i].yyyymm);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresaron" fill={fgVar('info')} radius={[4, 4, 0, 0]} cursor="pointer" />
                    <Bar dataKey="completados" name="Completados" fill={fgVar('success')} radius={[4, 4, 0, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Typography variant="caption" color="text.secondary">
                Últimos 12 meses hasta {mesLabel.toLowerCase()}. Ingresos por fecha de creación; completados por
                fecha de finalización. Click en un mes del gráfico para seleccionarlo como filtro.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Códigos actualmente en fabricación (snapshot, sin filtro de mes) */}
      <Box display="flex" alignItems="baseline" gap={1} mb={1.5}>
        <Typography variant="h5" fontWeight="600">
          En Fabricación Ahora
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          — pendientes y en proceso, de cualquier mes
        </Typography>
      </Box>
      <Grid container spacing={2} mb={4}>
        {ESTADOS_FABRICACION_WIP.map((cfg) => {
          const lista = codigosEnFabricacion.get(cfg.key) ?? [];
          if (lista.length === 0) return null;
          const visibles = lista.slice(0, MAX_CODIGOS_VISIBLES);
          const ocultos = lista.length - visibles.length;
          return (
            <Grid item xs={12} sm={6} key={cfg.key}>
              <Card sx={{ height: '100%', borderTop: `3px solid ${cfg.hex}` }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Build sx={{ color: cfg.hex }} />
                      <Typography variant="subtitle1" fontWeight={600}>
                        {cfg.label}
                      </Typography>
                    </Box>
                    <Chip label={lista.length} size="small" sx={{ bgcolor: cfg.bg, fontWeight: 600 }} />
                  </Box>
                  <Divider sx={{ mb: 1.5 }} />
                  <Box display="flex" flexWrap="wrap" gap={0.75}>
                    {visibles.map((equipo) => (
                      <MuiTooltip
                        key={equipo.id}
                        title={`${equipo.tipo} ${equipo.modelo} — creado ${dayjs(equipo.fechaCreacion).format('DD/MM/YYYY')}`}
                      >
                        <Chip label={equipo.numeroHeladera} size="small" variant="outlined" />
                      </MuiTooltip>
                    ))}
                    {ocultos > 0 && (
                      <Chip label={`+${ocultos} más`} size="small" sx={{ bgcolor: cfg.bg }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {ESTADOS_FABRICACION_WIP.every((cfg) => (codigosEnFabricacion.get(cfg.key) ?? []).length === 0) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  No hay equipos en fabricación en este momento
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Tabla de equipos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Equipos ({filteredEquipos.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>N° Heladera</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Estado Asignación</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEquipos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((equipo) => {
                    const cfg = equipo.estadoAsignacion ? estadoCfg(equipo.estadoAsignacion) : undefined;
                    return (
                      <TableRow key={equipo.id} hover>
                        <TableCell>{equipo.numeroHeladera}</TableCell>
                        <TableCell>{equipo.tipo}</TableCell>
                        <TableCell>{equipo.modelo}</TableCell>
                        <TableCell>{equipo.color?.nombre || '-'}</TableCell>
                        <TableCell>
                          {cfg ? (
                            <Chip
                              label={cfg.label}
                              size="small"
                              icon={cfg.icon}
                              sx={{ bgcolor: cfg.bg, color: cfg.hex, fontWeight: 600, '& .MuiChip-icon': { color: cfg.hex } }}
                            />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{equipo.clienteNombre || '-'}</TableCell>
                        <TableCell>
                          {dayjs(equipo.fechaCreacion).format('DD/MM/YYYY')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {filteredEquipos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay equipos que coincidan con los filtros
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredEquipos.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportesEstadosPage;
