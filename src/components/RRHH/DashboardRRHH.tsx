import React, { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Skeleton,
  Alert,
  Chip,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PeopleAlt as PeopleAltIcon,
  CheckCircleOutline as ActiveIcon,
  EventBusy as EventBusyIcon,
  HowToReg as PresentismoIcon,
  Description as DocumentIcon,
  Cake as CakeIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  BeachAccess as BeachAccessIcon,
  Folder as FolderIcon,
  Assessment as AssessmentIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import dashboardRRHHApi from '../../api/services/dashboardRRHHApi';
import type {
  DashboardRRHHDTO,
  PuntoSerieDTO,
  TendenciaMensualDTO,
  DistribucionDTO,
} from '../../types/dashboardRRHH.types';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';
import { CHART_SERIES, chartSerie, CHART_AXIS, CHART_GRID } from '../../theme/chartTokens';

// Velos del color primario (CSS vars → siguen el esquema activo)
/* eslint-disable ripser/no-literal-colors -- alpha sobre token del theme vía mainChannel, no es color hardcodeado */
const PRIMARY_FADE_04 = 'rgba(var(--mui-palette-primary-mainChannel) / 0.04)';
const PRIMARY_FADE_10 = 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)';
const PRIMARY_FADE_12 = 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)';
const PRIMARY_FADE_15 = 'rgba(var(--mui-palette-primary-mainChannel) / 0.15)';
const PRIMARY_FADE_18 = 'rgba(var(--mui-palette-primary-mainChannel) / 0.18)';
/* eslint-enable ripser/no-literal-colors */

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  /** Token de paleta (sx) para el ícono del avatar. */
  accentColor: string;
  /** Token de paleta (sx) para el fondo suave del avatar. */
  accentBg: string;
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, accentColor, accentBg, loading }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'transform 180ms ease, box-shadow 180ms ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        // eslint-disable-next-line ripser/no-literal-colors -- sombra decorativa de hover; la card ya tiene borde
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Avatar
          sx={{
            bgcolor: accentBg,
            color: accentColor,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={80} height={36} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.25, color: 'text.primary', lineHeight: 1.2 }}>
              {value}
            </Typography>
          )}
          {hint && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {hint}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  minHeight?: number | string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, action, children, minHeight }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', minHeight }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </CardContent>
  </Card>
);

const EmptyState: React.FC<{ icon?: React.ReactNode; message: string }> = ({ icon, message }) => (
  <Box
    sx={{
      height: '100%',
      minHeight: 160,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      color: 'text.secondary',
      px: 2,
      textAlign: 'center',
    }}
  >
    {icon ?? <FolderIcon sx={{ fontSize: 40, opacity: 0.4 }} />}
    <Typography variant="body2">{message}</Typography>
  </Box>
);

const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 240 }) => (
  <Skeleton variant="rounded" height={height} sx={{ borderRadius: 2 }} />
);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de formato
// ─────────────────────────────────────────────────────────────────────────────

const formatFecha = (iso: string | null): string => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

const formatDiaMes = (iso: string | null): string => {
  if (!iso) return '—';
  const [, m, d] = iso.split('-');
  if (!m || !d) return iso;
  return `${parseInt(d, 10)}/${parseInt(m, 10)}`;
};

const estadoColor = (estado: string | null): 'default' | 'success' | 'warning' | 'error' => {
  switch (estado) {
    case 'ACTIVO': return 'success';
    case 'LICENCIA': return 'warning';
    case 'INACTIVO': return 'error';
    default: return 'default';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Gráficos
// ─────────────────────────────────────────────────────────────────────────────

const AsistenciaChart: React.FC<{ data: PuntoSerieDTO[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState icon={<AssessmentIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="Sin registros de asistencia en el período" />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
        <ChartTooltip cursor={{ fill: 'var(--mui-palette-action-hover)' }} />
        <Bar dataKey="valor" name="Asistentes" fill={CHART_SERIES[0]} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const RotacionChart: React.FC<{ data: TendenciaMensualDTO[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState icon={<TrendingUpIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="Sin movimientos de personal" />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
        <ChartTooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="altas" name="Altas" stroke="var(--mui-palette-status-success-fg)" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="bajas" name="Bajas" stroke="var(--mui-palette-status-danger-fg)" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const DistribucionChart: React.FC<{ data: DistribucionDTO[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState icon={<WorkIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="Sin empleados asignados a puestos" />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="cantidad"
          nameKey="etiqueta"
          innerRadius={50}
          outerRadius={85}
          paddingAngle={2}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={chartSerie(idx)} />
          ))}
        </Pie>
        <ChartTooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
      </PieChart>
    </ResponsiveContainer>
  );
};

const HorasTrabajadasChart: React.FC<{ data: PuntoSerieDTO[] }> = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState icon={<ScheduleIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="Sin horas registradas" />;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
        <ChartTooltip cursor={{ fill: 'var(--mui-palette-action-hover)' }} />
        <Bar dataKey="valor" name="Horas" fill={CHART_SERIES[1]} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

type Periodo = 'semanal' | 'mensual';

const DashboardRRHH: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();

  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-rrhh'],
    queryFn: () => dashboardRRHHApi.get(),
  });
  const data: DashboardRRHHDTO | null = dashboardQuery.data ?? null;
  const loading = dashboardQuery.isPending;
  const refreshing = dashboardQuery.isFetching && !dashboardQuery.isPending;
  const error = dashboardQuery.error
    ? 'No se pudo cargar el dashboard. Reintentá en unos segundos.'
    : null;
  const [periodoAsistencia, setPeriodoAsistencia] = useState<Periodo>('semanal');

  const fetchData = useCallback(
    async (_isRefresh = false) => { await queryClient.invalidateQueries({ queryKey: ['dashboard-rrhh'] }); },
    [queryClient],
  );

  const asistenciaData = useMemo(() => {
    if (!data) return [];
    return periodoAsistencia === 'semanal' ? data.asistenciaSemanal : data.asistenciaMensual;
  }, [data, periodoAsistencia]);

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Recursos Humanos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bienvenido/a, {getFirstName(user) || 'equipo'}. Resumen de personal y novedades del día.
        </Typography>
      </Box>
      <Tooltip title="Actualizar">
        <span>
          <IconButton
            onClick={() => fetchData(true)}
            disabled={refreshing}
            sx={{
              bgcolor: PRIMARY_FADE_10,
              color: 'primary.main',
              '&:hover': { bgcolor: PRIMARY_FADE_18 },
            }}
          >
            <RefreshIcon sx={{ transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 600ms' }} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis: KpiCardProps[] = [
    {
      label: 'Total empleados',
      value: data?.totalEmpleados ?? 0,
      hint: data ? `${data.empleadosActivos} activos / ${data.empleadosInactivos} inactivos` : undefined,
      icon: <PeopleAltIcon />,
      accentColor: 'primary.main',
      accentBg: PRIMARY_FADE_12,
    },
    {
      label: 'Activos',
      value: data?.empleadosActivos ?? 0,
      hint: data?.empleadosEnLicencia ? `${data.empleadosEnLicencia} en licencia` : undefined,
      icon: <ActiveIcon />,
      accentColor: 'status.success.fg',
      accentBg: 'status.success.bg',
    },
    {
      label: 'Presentismo de hoy',
      value: data ? `${data.porcentajePresentismoHoy.toFixed(1)}%` : '—',
      hint: data ? `${data.presentismoHoy} / ${data.empleadosEsperadosHoy} esperados` : undefined,
      icon: <PresentismoIcon />,
      accentColor: 'status.info.fg',
      accentBg: 'status.info.bg',
    },
    {
      label: 'Ausencias / licencias',
      value: data?.ausenciasHoy ?? 0,
      hint: 'Activas hoy',
      icon: <EventBusyIcon />,
      accentColor: 'status.warning.fg',
      accentBg: 'status.warning.bg',
    },
    {
      label: 'Documentos por vencer',
      value: data?.documentosPorVencer ?? 0,
      hint: 'Próximos 30 días',
      icon: <DocumentIcon />,
      accentColor: 'status.danger.fg',
      accentBg: 'status.danger.bg',
    },
    {
      label: 'Cumpleaños del mes',
      value: data?.cumpleanosMes ?? 0,
      hint: 'Empleados activos',
      icon: <CakeIcon />,
      accentColor: 'tertiary.main',
      // eslint-disable-next-line ripser/no-literal-colors -- alpha sobre token del theme vía mainChannel
      accentBg: 'rgba(var(--mui-palette-tertiary-mainChannel) / 0.12)',
    },
  ];

  // ── Accesos rápidos ───────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Alta empleado', icon: <PersonAddIcon />, to: '/rrhh/empleados', color: 'var(--mui-palette-primary-main)' },
    { label: 'Gestionar licencias', icon: <BeachAccessIcon />, to: '/rrhh/licencias', color: 'var(--mui-palette-status-warning-fg)' },
    { label: 'Ver legajos', icon: <FolderIcon />, to: '/rrhh/legajos', color: 'var(--mui-palette-status-info-fg)' },
    { label: 'Generar reportes', icon: <AssessmentIcon />, to: '/rrhh/asistencia', color: 'var(--mui-palette-text-primary)' },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {header}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => fetchData(true)}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi, i) => (
          <Grid item key={i} xs={12} sm={6} md={4} lg={2}>
            <KpiCard {...kpi} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Accesos rápidos */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          mb: 3,
          background: `linear-gradient(135deg, ${PRIMARY_FADE_04}, transparent)`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            Accesos rápidos
          </Typography>
          <Grid container spacing={1.5}>
            {quickActions.map(action => (
              <Grid item key={action.label} xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={() => navigate(action.to)}
                  sx={{
                    py: 1.25,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    borderColor: `color-mix(in srgb, ${action.color} 30%, transparent)`,
                    color: action.color,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: action.color,
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {action.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Charts: asistencia + rotación */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <SectionCard
            title="Asistencia"
            subtitle={periodoAsistencia === 'semanal' ? 'Últimos 14 días' : 'Últimos 6 meses'}
            action={
              <Stack direction="row" spacing={0.5}>
                <Chip
                  label="Semanal"
                  size="small"
                  onClick={() => setPeriodoAsistencia('semanal')}
                  color={periodoAsistencia === 'semanal' ? 'primary' : 'default'}
                  variant={periodoAsistencia === 'semanal' ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
                <Chip
                  label="Mensual"
                  size="small"
                  onClick={() => setPeriodoAsistencia('mensual')}
                  color={periodoAsistencia === 'mensual' ? 'primary' : 'default'}
                  variant={periodoAsistencia === 'mensual' ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              </Stack>
            }
          >
            {loading ? <ChartSkeleton /> : <AsistenciaChart data={asistenciaData} />}
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <SectionCard title="Rotación de personal" subtitle="Altas vs bajas (12 meses)">
            {loading ? <ChartSkeleton /> : <RotacionChart data={data?.rotacionMensual ?? []} />}
          </SectionCard>
        </Grid>
      </Grid>

      {/* Charts: distribución + horas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <SectionCard title="Distribución por sector" subtitle="Empleados por puesto / departamento">
            {loading ? <ChartSkeleton /> : <DistribucionChart data={data?.distribucionPorSector ?? []} />}
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <SectionCard title="Horas trabajadas" subtitle="Por semana (últimas 6)">
            {loading ? <ChartSkeleton /> : <HorasTrabajadasChart data={data?.horasTrabajadasSemanal ?? []} />}
          </SectionCard>
        </Grid>
      </Grid>

      {/* Listados: últimos ingresos + solicitudes + cumpleaños */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6} lg={4}>
          <SectionCard
            title="Últimos ingresos"
            subtitle="Nuevos empleados"
            action={
              <Button size="small" onClick={() => navigate('/rrhh/empleados')} sx={{ textTransform: 'none' }}>
                Ver todos
              </Button>
            }
          >
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} />)}</Stack>
            ) : !data?.ultimosIngresos.length ? (
              <EmptyState icon={<PersonAddIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="No hay ingresos recientes" />
            ) : (
              <Stack divider={<Divider flexItem />}>
                {data.ultimosIngresos.map(emp => (
                  <Stack
                    key={emp.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      py: 1.25,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/rrhh/empleados`)}
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: PRIMARY_FADE_15, color: 'primary.main', fontSize: 14 }}>
                      {emp.nombreCompleto.trim().charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                        {emp.nombreCompleto.trim()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {emp.puesto || 'Sin puesto'} · ingresó {formatFecha(emp.fechaIngreso)}
                      </Typography>
                    </Box>
                    <Chip
                      label={emp.estado || '—'}
                      size="small"
                      color={estadoColor(emp.estado)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <SectionCard
            title="Solicitudes pendientes"
            subtitle="Licencias por aprobar"
            action={
              <Button size="small" onClick={() => navigate('/rrhh/licencias')} sx={{ textTransform: 'none' }}>
                Gestionar
              </Button>
            }
          >
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} />)}</Stack>
            ) : !data?.solicitudesPendientes.length ? (
              <EmptyState icon={<BeachAccessIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="No hay solicitudes pendientes" />
            ) : (
              <Stack divider={<Divider flexItem />}>
                {data.solicitudesPendientes.slice(0, 5).map(s => (
                  <Stack key={s.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.25 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'status.warning.bg', color: 'status.warning.fg' }}>
                      <BeachAccessIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                        {s.empleado}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {s.tipo || '—'} · {formatFecha(s.fechaInicio)} → {formatFecha(s.fechaFin)}
                        {s.dias ? ` · ${s.dias} días` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={12} lg={4}>
          <SectionCard
            title={isMobile ? 'Cumpleaños' : 'Cumpleaños del mes'}
            subtitle="Empleados activos"
          >
            {loading ? (
              <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={48} />)}</Stack>
            ) : !data?.proximosCumpleanos.length ? (
              <EmptyState icon={<CakeIcon sx={{ fontSize: 40, opacity: 0.4 }} />} message="No hay cumpleaños este mes" />
            ) : (
              <Stack divider={<Divider flexItem />}>
                {data.proximosCumpleanos.map(c => (
                  <Stack key={c.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.25 }}>
                    <Avatar
                      // eslint-disable-next-line ripser/no-literal-colors -- alpha sobre token del theme vía mainChannel
                      sx={{ width: 36, height: 36, bgcolor: 'rgba(var(--mui-palette-tertiary-mainChannel) / 0.15)', color: 'tertiary.main' }}
                    >
                      <CakeIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                        {c.nombreCompleto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDiaMes(c.fechaNacimiento)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardRRHH;
