import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  TrendingUp,
  TrendingDown,
  Warning as WarningIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Repeat as RepeatIcon,
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
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import dayjs from 'dayjs';
import { sancionApi } from '../../../api/services/sancionApi';
import {
  NIVEL_GRAVEDAD_COLOR,
  TIPO_SANCION_LABEL,
  type DisciplinaDashboardDTO,
  type SancionEmpleadoResumenDTO,
  type TipoSancion,
} from '../../../types/sancion.types';

const TIPO_COLORS: Record<TipoSancion, string> = {
  LLAMADA_ATENCION_VERBAL: '#29b6f6',
  APERCIBIMIENTO_ESCRITO: '#ffa726',
  SUSPENSION: '#ef5350',
  DESPIDO: '#b71c1c',
};

const SECTOR_PALETTE = [
  '#1976d2', '#7b1fa2', '#388e3c', '#f57c00', '#0288d1',
  '#c2185b', '#5d4037', '#455a64', '#00897b', '#fbc02d',
];

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  color?: string;
  subtitle?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, trend, color = 'primary.main', subtitle }) => (
  <Paper elevation={0} sx={{
    p: 2, borderRadius: 2, height: '100%',
    border: 1, borderColor: 'divider',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
  }}>
    <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
      <Box sx={{
        width: 44, height: 44, borderRadius: 1.5,
        bgcolor: 'background.default', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Typography>
    </Stack>
    <Typography variant="h4" fontWeight={800} lineHeight={1.1}>{value}</Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
    )}
    {trend && (
      <Stack direction="row" spacing={0.5} alignItems="center" mt={0.5}>
        {trend.direction === 'up' && <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />}
        {trend.direction === 'down' && <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />}
        <Typography variant="caption" color={
          trend.direction === 'up' ? 'error.main'
            : trend.direction === 'down' ? 'success.main'
              : 'text.secondary'
        } fontWeight={600}>
          {trend.value}
        </Typography>
      </Stack>
    )}
  </Paper>
);

interface DisciplinaDashboardProps {
  onSelectEmpleado?: (resumen: SancionEmpleadoResumenDTO) => void;
}

const DisciplinaDashboard: React.FC<DisciplinaDashboardProps> = ({ onSelectEmpleado }) => {
  const [data, setData] = useState<DisciplinaDashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const dto = await sancionApi.getDashboard();
        setData(dto);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const distTipoChart = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.distribucionPorTipo ?? {}).map(([tipo, value]) => ({
      name: TIPO_SANCION_LABEL[tipo as TipoSancion] ?? tipo,
      value,
      tipo: tipo as TipoSancion,
    }));
  }, [data]);

  const sectorChart = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.distribucionPorSector ?? {})
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  const evolucionChart = useMemo(() => {
    if (!data) return [];
    return (data.evolucionMensual ?? []).map(p => ({
      label: dayjs(p.mes + '-01').format('MMM YY'),
      Total: p.total,
      Llamadas: p.llamadasAtencion,
      Apercibimientos: p.apercibimientos,
      Suspensiones: p.suspensiones,
    }));
  }, [data]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error ?? 'Sin datos'}</Alert>;
  }

  const trendMes = data.sancionesMesActual - data.sancionesMesAnterior;
  const trendPct = data.sancionesMesAnterior > 0
    ? Math.round((trendMes / data.sancionesMesAnterior) * 100)
    : 0;

  return (
    <Stack spacing={3}>
      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<GavelIcon />} color="primary.main"
            label="Total (rango)" value={data.totalSanciones}
            subtitle="Sanciones en el período"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<GavelIcon />} color="warning.main"
            label="Este mes" value={data.sancionesMesActual}
            trend={trendMes !== 0 ? {
              direction: trendMes > 0 ? 'up' : 'down',
              value: `${trendMes > 0 ? '+' : ''}${trendPct}% vs mes anterior`,
            } : undefined}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<AccessTimeIcon />} color="error.main"
            label="Días susp. mes" value={data.diasSuspensionMes}
            subtitle={`${data.suspensionesActivasMes} suspensión(es) en el mes`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <KpiCard
            icon={<RepeatIcon />} color="error.main"
            label="Reincidentes" value={data.empleadosReincidentes}
            subtitle={`de ${data.empleadosConSanciones} empleados sancionados`}
          />
        </Grid>
      </Grid>

      {/* Charts row 1 */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', height: 380 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={2}>
              DISTRIBUCIÓN POR TIPO
            </Typography>
            {distTipoChart.length === 0 ? (
              <Alert severity="info" variant="outlined">Sin datos en el período</Alert>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={distTipoChart} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={100}
                    paddingAngle={2} stroke="#fff" strokeWidth={2}
                  >
                    {distTipoChart.map((entry) => (
                      <Cell key={entry.tipo} fill={TIPO_COLORS[entry.tipo]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', height: 380 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={2}>
              SANCIONES POR SECTOR (Top 10)
            </Typography>
            {sectorChart.length === 0 ? (
              <Alert severity="info" variant="outlined">Sin datos en el período</Alert>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={sectorChart} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="sector" type="category" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {sectorChart.map((_, idx) => (
                      <Cell key={idx} fill={SECTOR_PALETTE[idx % SECTOR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts row 2 */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', height: 360 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={2}>
              EVOLUCIÓN MENSUAL (Últimos 12 meses)
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={evolucionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Llamadas" stroke={TIPO_COLORS.LLAMADA_ATENCION_VERBAL} strokeWidth={2} />
                <Line type="monotone" dataKey="Apercibimientos" stroke={TIPO_COLORS.APERCIBIMIENTO_ESCRITO} strokeWidth={2} />
                <Line type="monotone" dataKey="Suspensiones" stroke={TIPO_COLORS.SUSPENSION} strokeWidth={2} />
                <Line type="monotone" dataKey="Total" stroke="#222" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider', height: 360, overflow: 'auto' }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={2}>
              MOTIVOS MÁS FRECUENTES
            </Typography>
            {Object.keys(data.motivosFrecuentes ?? {}).length === 0 ? (
              <Alert severity="info" variant="outlined">Sin datos</Alert>
            ) : (
              <Stack spacing={1.5}>
                {Object.entries(data.motivosFrecuentes ?? {}).map(([motivo, count]) => {
                  const max = Math.max(...Object.values(data.motivosFrecuentes ?? {}));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <Box key={motivo}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={500} noWrap title={motivo}>{motivo}</Typography>
                        <Typography variant="body2" fontWeight={700} color="primary">{count}</Typography>
                      </Stack>
                      <Box sx={{
                        height: 6, borderRadius: 3, bgcolor: 'grey.100', overflow: 'hidden',
                      }}>
                        <Box sx={{
                          width: `${pct}%`, height: '100%',
                          background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                        }} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top reincidentes */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <WarningIcon color="error" />
          <Typography variant="subtitle2" fontWeight={700} color="primary">
            EMPLEADOS REINCIDENTES (Top 10)
          </Typography>
        </Stack>
        {data.topReincidentes.length === 0 ? (
          <Alert severity="success" variant="outlined">Sin reincidencias en el período. </Alert>
        ) : (
          <Grid container spacing={1.5}>
            {data.topReincidentes.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.empleadoId}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5, borderRadius: 2, cursor: onSelectEmpleado ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    '&:hover': onSelectEmpleado ? { boxShadow: 2, borderColor: 'primary.main' } : undefined,
                  }}
                  onClick={() => onSelectEmpleado?.(r)}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: `${NIVEL_GRAVEDAD_COLOR[r.nivelGravedad]}.main` }}>
                      {r.empleadoNombre[0]}{r.empleadoApellido[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {r.empleadoApellido}, {r.empleadoNombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {[r.sector, r.puesto].filter(Boolean).join(' · ') || 'Sin sector'}
                      </Typography>
                      <Stack direction="row" spacing={0.5} mt={0.5}>
                        <Chip size="small"
                          label={`${r.totalSanciones} sanción${r.totalSanciones === 1 ? '' : 'es'}`}
                          color="primary" variant="outlined" />
                        <Chip size="small"
                          label={r.nivelGravedad}
                          color={NIVEL_GRAVEDAD_COLOR[r.nivelGravedad]} />
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" mt={1}>
        <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          {data.empleadosConSanciones} empleados con sanciones · {data.empleadosReincidentes} reincidentes
        </Typography>
      </Stack>
    </Stack>
  );
};

export default DisciplinaDashboard;
