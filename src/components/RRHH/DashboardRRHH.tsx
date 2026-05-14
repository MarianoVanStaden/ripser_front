import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  alpha,
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

// ─────────────────────────────────────────────────────────────────────────────
// Paleta corporativa — colores derivados del teal/azul del producto.
// ─────────────────────────────────────────────────────────────────────────────
const PRIMARY = '#00B8A9';
const ACCENT = '#212A3E';
const PIE_COLORS = ['#00B8A9', '#3F72AF', '#F08A5D', '#B83B5E', '#6A6B83', '#9CB4CC', '#F9D5A7', '#F2B6C1'];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  accentColor: string;
  loading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon, accentColor, loading }) => (
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
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Avatar
          sx={{
            bgcolor: alpha(accentColor, 0.12),
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
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.25, color: ACCENT, lineHeight: 1.2 }}>
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
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ACCENT }}>
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
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <ChartTooltip cursor={{ fill: alpha(PRIMARY, 0.08) }} />
        <Bar dataKey="valor" name="Asistentes" fill={PRIMARY} radius={[6, 6, 0, 0]} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <ChartTooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="altas" name="Altas" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="bajas" name="Bajas" stroke="#F08A5D" strokeWidth={2.5} dot={{ r: 3 }} />
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
            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
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
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
        <ChartTooltip cursor={{ fill: alpha(ACCENT, 0.06) }} />
        <Bar dataKey="valor" name="Horas" fill={ACCENT} radius={[6, 6, 0, 0]} />
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

  const [data, setData] = useState<DashboardRRHHDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodoAsistencia, setPeriodoAsistencia] = useState<Periodo>('semanal');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const dto = await dashboardRRHHApi.get();
      setData(dto);
    } catch (err) {
      console.error('Error cargando dashboard RRHH', err);
      setError('No se pudo cargar el dashboard. Reintentá en unos segundos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <Typography variant="h4" sx={{ fontWeight: 700, color: ACCENT }}>
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
              bgcolor: alpha(PRIMARY, 0.1),
              color: PRIMARY,
              '&:hover': { bgcolor: alpha(PRIMARY, 0.18) },
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
      accentColor: PRIMARY,
    },
    {
      label: 'Activos',
      value: data?.empleadosActivos ?? 0,
      hint: data?.empleadosEnLicencia ? `${data.empleadosEnLicencia} en licencia` : undefined,
      icon: <ActiveIcon />,
      accentColor: '#2e7d32',
    },
    {
      label: 'Presentismo de hoy',
      value: data ? `${data.porcentajePresentismoHoy.toFixed(1)}%` : '—',
      hint: data ? `${data.presentismoHoy} / ${data.empleadosEsperadosHoy} esperados` : undefined,
      icon: <PresentismoIcon />,
      accentColor: '#3F72AF',
    },
    {
      label: 'Ausencias / licencias',
      value: data?.ausenciasHoy ?? 0,
      hint: 'Activas hoy',
      icon: <EventBusyIcon />,
      accentColor: '#F08A5D',
    },
    {
      label: 'Documentos por vencer',
      value: data?.documentosPorVencer ?? 0,
      hint: 'Próximos 30 días',
      icon: <DocumentIcon />,
      accentColor: '#B83B5E',
    },
    {
      label: 'Cumpleaños del mes',
      value: data?.cumpleanosMes ?? 0,
      hint: 'Empleados activos',
      icon: <CakeIcon />,
      accentColor: '#9C27B0',
    },
  ];

  // ── Accesos rápidos ───────────────────────────────────────────────────────
  const quickActions = [
    { label: 'Alta empleado', icon: <PersonAddIcon />, to: '/rrhh/empleados', color: PRIMARY },
    { label: 'Gestionar licencias', icon: <BeachAccessIcon />, to: '/rrhh/licencias', color: '#F08A5D' },
    { label: 'Ver legajos', icon: <FolderIcon />, to: '/rrhh/legajos', color: '#3F72AF' },
    { label: 'Generar reportes', icon: <AssessmentIcon />, to: '/rrhh/asistencia', color: ACCENT },
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
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
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
          background: `linear-gradient(135deg, ${alpha(PRIMARY, 0.04)}, transparent)`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
            Accesos rápidos
          </Typography>
          <Grid container spacing={1.5}>
            {quickActions.map(action => (
              <Grid key={action.label} size={{ xs: 6, sm: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={action.icon}
                  onClick={() => navigate(action.to)}
                  sx={{
                    py: 1.25,
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    borderColor: alpha(action.color, 0.3),
                    color: action.color,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: action.color,
                      bgcolor: alpha(action.color, 0.06),
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
        <Grid size={{ xs: 12, md: 8 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Rotación de personal" subtitle="Altas vs bajas (12 meses)">
            {loading ? <ChartSkeleton /> : <RotacionChart data={data?.rotacionMensual ?? []} />}
          </SectionCard>
        </Grid>
      </Grid>

      {/* Charts: distribución + horas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Distribución por sector" subtitle="Empleados por puesto / departamento">
            {loading ? <ChartSkeleton /> : <DistribucionChart data={data?.distribucionPorSector ?? []} />}
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Horas trabajadas" subtitle="Por semana (últimas 6)">
            {loading ? <ChartSkeleton /> : <HorasTrabajadasChart data={data?.horasTrabajadasSemanal ?? []} />}
          </SectionCard>
        </Grid>
      </Grid>

      {/* Listados: últimos ingresos + solicitudes + cumpleaños */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
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
                      '&:hover': { bgcolor: alpha(PRIMARY, 0.04) },
                    }}
                    onClick={() => navigate(`/rrhh/empleados`)}
                  >
                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(PRIMARY, 0.15), color: PRIMARY, fontSize: 14 }}>
                      {emp.nombreCompleto.trim().charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: ACCENT }} noWrap>
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

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
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
                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#F08A5D', 0.15), color: '#F08A5D' }}>
                      <BeachAccessIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: ACCENT }} noWrap>
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

        <Grid size={{ xs: 12, md: 12, lg: 4 }}>
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
                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha('#9C27B0', 0.15), color: '#9C27B0' }}>
                      <CakeIcon fontSize="small" />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: ACCENT }} noWrap>
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
