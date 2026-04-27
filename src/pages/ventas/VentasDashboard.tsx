import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Chip,
  Paper,
  Stack,
  Divider,
  Avatar,
  Tooltip,
  LinearProgress,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  NotificationsActive as NotificationsIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AddCircle as AddCircleIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  Whatshot as WhatshotIcon,
  AccessTime as AccessTimeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { leadApi } from '../../api/services/leadApi';
import { leadMetricasApi } from '../../api/services/leadMetricasApi';
import { recordatorioLeadApi } from '../../api/services/recordatorioLeadApi';
import type { LeadDTO, RecordatorioLeadDTO } from '../../types/lead.types';
import type { LeadMetricasResponseDTO } from '../../api/services/leadMetricasApi';
import type { RecordatorioConLeadDTO } from '../../api/services/recordatorioLeadApi';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';
import { usePermisos } from '../../hooks/usePermisos';
import { EmbudoVentasChart } from '../../components/metricas/EmbudoVentasChart';
import { MetricasCanalChart } from '../../components/metricas/MetricasCanalChart';
import { MetricasPrioridadChart } from '../../components/metricas/MetricasPrioridadChart';

dayjs.locale('es');

const RIPSER_BLUE = '#144272';

interface QuickStats {
  totalLeads: number;
  primerContacto: number;
  mostraronInteres: number;
  clientePotencial: number;
  clientePotencialCalificado: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  recordatoriosVencidos: number;
  recordatoriosHoy: number;
  recordatoriosEstaSemana: number;
  recordatoriosProximos: number;
  leadsActivePipeline: number;
}

type ReminderItem = RecordatorioLeadDTO & { leadNombre: string; leadId: number };

const PRIORITY_CONFIG = {
  HOT: { color: '#d32f2f', chipColor: 'error' as const },
  WARM: { color: '#ed6c02', chipColor: 'warning' as const },
  COLD: { color: '#0288d1', chipColor: 'info' as const },
};

const ESTADO_LABELS: Record<string, string> = {
  PRIMER_CONTACTO: 'Primer Contacto',
  MOSTRO_INTERES: 'Mostró Interés',
  CLIENTE_POTENCIAL: 'Cliente Potencial',
  CLIENTE_POTENCIAL_CALIFICADO: 'CP Calificado',
  CONVERTIDO: 'Convertido',
  PERDIDO: 'Perdido',
  DESCARTADO: 'Descartado',
};

const getGreeting = () => {
  const h = dayjs().hour();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
};

const ReminderTypeIcon: React.FC<{ tipo?: string; size?: number }> = ({ tipo, size = 16 }) => {
  if (tipo === 'LLAMADA') return <PhoneIcon sx={{ fontSize: size }} />;
  if (tipo === 'EMAIL') return <EmailIcon sx={{ fontSize: size }} />;
  if (tipo === 'WHATSAPP') return <WhatsAppIcon sx={{ fontSize: size }} />;
  return <NotificationsIcon sx={{ fontSize: size }} />;
};

const KpiCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  urgent?: boolean;
  onClick?: () => void;
}> = ({ title, value, icon, color, subtitle, urgent, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      border: '1px solid',
      borderColor: urgent ? color : 'divider',
      boxShadow: urgent ? `0 0 0 1px ${color}30` : 1,
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {},
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{
          p: 1.25,
          borderRadius: 2,
          bgcolor: color + '18',
          color,
          display: 'inline-flex',
          flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.75rem', lineHeight: 1.1 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {urgent && (
          <Box sx={{
            '@keyframes blink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.25 },
            },
            width: 9,
            height: 9,
            borderRadius: '50%',
            bgcolor: color,
            flexShrink: 0,
            mt: 0.5,
            animation: 'blink 1.5s ease-in-out infinite',
          }} />
        )}
      </Box>
    </CardContent>
  </Card>
);

export const VentasDashboard = () => {
  const navigate = useNavigate();
  const { user, esSuperAdmin } = useAuth();
  const { empresaId, sucursalFiltro, sucursales } = useTenant();
  const { tieneRol } = usePermisos();
  const isVendedor = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('VENDEDOR');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [metricas, setMetricas] = useState<LeadMetricasResponseDTO | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadDTO[]>([]);
  const [allReminders, setAllReminders] = useState<ReminderItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const sucursalNombre = sucursalFiltro
    ? sucursales.find(s => s.id === sucursalFiltro)?.nombre || 'Sucursal'
    : 'Todas las sucursales';

  const [fechaInicio] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fechaFin] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  // Reminders for today (overdue + today) — shown in "Foco de hoy"
  const focusItems = useMemo(() => {
    const endOfToday = dayjs().endOf('day');
    return allReminders.filter(r => {
      const d = dayjs(`${r.fechaRecordatorio} ${r.hora || '00:00'}`);
      return d.isBefore(endOfToday);
    });
  }, [allReminders]);

  // Reminders after today
  const futureReminders = useMemo(() => {
    const endOfToday = dayjs().endOf('day');
    return allReminders.filter(r => {
      const d = dayjs(`${r.fechaRecordatorio} ${r.hora || '00:00'}`);
      return d.isAfter(endOfToday);
    });
  }, [allReminders]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [empresaId, sucursalFiltro, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        sucursalId: sucursalFiltro !== null ? sucursalFiltro : undefined,
      };

      // Recordatorios: una sola request al endpoint global. Misma fuente de
      // verdad que GestionGlobalRecordatoriosPage. Si el backend no soporta
      // el endpoint (403/404), degradamos a lista vacía sin romper el dashboard.
      const recordatoriosPromise = recordatorioLeadApi
        .getAll(
          { page: 0, size: 500 },
          {
            enviado: false,
            sucursalId: sucursalFiltro !== null ? sucursalFiltro : undefined,
            usuarioId: isVendedor ? user?.id : undefined,
          }
        )
        .then((res) => res.content)
        .catch((err) => {
          console.warn('No se pudieron cargar recordatorios globales:', err);
          return [] as RecordatorioConLeadDTO[];
        });

      const [allLeadsResponse, metricasData, recordatoriosData] = await Promise.all([
        leadApi.getAll({}, params),
        leadMetricasApi.obtenerMetricasCompletas({
          fechaInicio,
          fechaFin,
          sucursalId: sucursalFiltro !== null ? sucursalFiltro : undefined,
          usuarioAsignadoId: user?.id,
        }),
        recordatoriosPromise,
      ]);

      const allLeads = allLeadsResponse.content;

      const stats: QuickStats = {
        totalLeads: allLeads.length,
        primerContacto: allLeads.filter(l => l.estadoLead === 'PRIMER_CONTACTO').length,
        mostraronInteres: allLeads.filter(l => l.estadoLead === 'MOSTRO_INTERES').length,
        clientePotencial: allLeads.filter(l => l.estadoLead === 'CLIENTE_POTENCIAL').length,
        clientePotencialCalificado: allLeads.filter(l => l.estadoLead === 'CLIENTE_POTENCIAL_CALIFICADO').length,
        hotLeads: allLeads.filter(l => l.prioridad === 'HOT').length,
        warmLeads: allLeads.filter(l => l.prioridad === 'WARM').length,
        coldLeads: allLeads.filter(l => l.prioridad === 'COLD').length,
        recordatoriosVencidos: 0,
        recordatoriosHoy: 0,
        recordatoriosEstaSemana: 0,
        recordatoriosProximos: 0,
        leadsActivePipeline: allLeads.filter(l =>
          !['CONVERTIDO', 'PERDIDO', 'DESCARTADO'].includes(l.estadoLead)
        ).length,
      };

      const reminders: ReminderItem[] = recordatoriosData.map((r) => {
        const leadNombre = r.lead
          ? r.lead.apellido
            ? `${r.lead.nombre} ${r.lead.apellido}`
            : r.lead.nombre
          : `Lead #${r.leadId}`;
        return {
          ...r,
          leadNombre,
          leadId: r.leadId,
        };
      });

      const now = dayjs();
      const today = dayjs();
      const weekFromNow = dayjs().add(7, 'days').endOf('day');
      reminders.forEach((reminder) => {
        const d = dayjs(`${reminder.fechaRecordatorio} ${reminder.hora || '00:00'}`);
        if (d.isBefore(now)) {
          stats.recordatoriosVencidos++;
        } else if (d.isSame(today, 'day')) {
          stats.recordatoriosHoy++;
        } else if (d.isBefore(weekFromNow)) {
          stats.recordatoriosEstaSemana++;
        } else {
          stats.recordatoriosProximos++;
        }
      });

      reminders.sort((a, b) => {
        const dA = dayjs(`${a.fechaRecordatorio} ${a.hora || '00:00'}`);
        const dB = dayjs(`${b.fechaRecordatorio} ${b.hora || '00:00'}`);
        return dA.diff(dB);
      });

      setQuickStats(stats);
      setMetricas(metricasData);
      setRecentLeads(allLeads.slice(0, 6));
      setAllReminders(reminders.slice(0, 15));
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar el dashboard. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const hasUrgent = !loading && quickStats &&
    (quickStats.recordatoriosVencidos > 0 || quickStats.hotLeads > 0);

  const pipelineStages = [
    { label: 'Primer Contacto', count: quickStats?.primerContacto ?? 0, color: '#1976d2' },
    { label: 'Mostró Interés', count: quickStats?.mostraronInteres ?? 0, color: '#ed6c02' },
    { label: 'Cliente Potencial', count: quickStats?.clientePotencial ?? 0, color: '#7b1fa2' },
    { label: 'CP Calificado', count: quickStats?.clientePotencialCalificado ?? 0, color: '#2e7d32' },
  ];
  const pipelineMax = Math.max(...pipelineStages.map(s => s.count), 1);

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── HEADER ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${RIPSER_BLUE} 0%, #0d2d4d 100%)`,
        borderRadius: { xs: 0, sm: 2 },
        p: { xs: 2.5, sm: 3 },
        mb: 3,
        color: 'white',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} sx={{
              color: 'white',
              mb: 0.25,
              fontSize: { xs: '1.3rem', sm: '1.6rem' },
              lineHeight: 1.2,
            }}>
              {getGreeting()}, {getFirstName(user)}! 👋
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', mb: 1.5 }}>
              {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
            </Typography>
            {hasUrgent && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(quickStats?.recordatoriosVencidos ?? 0) > 0 && (
                  <Chip
                    size="small"
                    icon={<ErrorIcon sx={{ fontSize: '13px !important', color: 'white !important' }} />}
                    label={`${quickStats!.recordatoriosVencidos} recordatorio${quickStats!.recordatoriosVencidos !== 1 ? 's' : ''} vencido${quickStats!.recordatoriosVencidos !== 1 ? 's' : ''}`}
                    sx={{ bgcolor: 'rgba(211,47,47,0.85)', color: 'white', fontSize: '0.72rem', fontWeight: 600 }}
                  />
                )}
                {(quickStats?.hotLeads ?? 0) > 0 && (
                  <Chip
                    size="small"
                    icon={<WhatshotIcon sx={{ fontSize: '13px !important', color: 'white !important' }} />}
                    label={`${quickStats!.hotLeads} lead${quickStats!.hotLeads !== 1 ? 's' : ''} HOT`}
                    sx={{ bgcolor: 'rgba(239,108,2,0.85)', color: 'white', fontSize: '0.72rem', fontWeight: 600 }}
                  />
                )}
              </Stack>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Chip
                icon={<BusinessIcon sx={{ color: 'rgba(255,255,255,0.75) !important' }} />}
                label={sucursalNombre}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white', mb: 0.5, fontSize: '0.75rem' }}
              />
              <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.45)' }}>
                Act. {dayjs(lastRefresh).format('HH:mm')}
              </Typography>
            </Box>
            <Tooltip title="Actualizar datos">
              <span>
                <IconButton
                  onClick={loadDashboardData}
                  disabled={loading}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── KPI CARDS ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: 2 }} />
          ))
        ) : (
          <>
            <KpiCard
              title="Pipeline Activo"
              value={quickStats?.leadsActivePipeline ?? 0}
              icon={<PeopleIcon />}
              color={RIPSER_BLUE}
              subtitle={`${quickStats?.totalLeads ?? 0} leads totales`}
              onClick={() => navigate('/leads')}
            />
            <KpiCard
              title="Leads HOT"
              value={quickStats?.hotLeads ?? 0}
              icon={<WhatshotIcon />}
              color="#d32f2f"
              subtitle="Alta prioridad"
              urgent={(quickStats?.hotLeads ?? 0) > 0}
              onClick={() => navigate('/leads/table')}
            />
            <KpiCard
              title="Pendientes Hoy"
              value={(quickStats?.recordatoriosVencidos ?? 0) + (quickStats?.recordatoriosHoy ?? 0)}
              icon={<AccessTimeIcon />}
              color={(quickStats?.recordatoriosVencidos ?? 0) > 0 ? '#d32f2f' : '#ed6c02'}
              subtitle={`${quickStats?.recordatoriosVencidos ?? 0} vencidos · ${quickStats?.recordatoriosHoy ?? 0} de hoy`}
              urgent={(quickStats?.recordatoriosVencidos ?? 0) > 0}
            />
            <KpiCard
              title="Tasa de Conversión"
              value={
                metricas?.tasaConversion?.tasaConversion != null
                  ? `${metricas.tasaConversion.tasaConversion.toFixed(1)}%`
                  : '—'
              }
              icon={<AssessmentIcon />}
              color="#2e7d32"
              subtitle={metricas
                ? `${metricas.tasaConversion?.leadsConvertidos ?? 0} de ${metricas.tasaConversion?.totalLeads ?? 0} leads`
                : 'Sin datos aún'
              }
            />
          </>
        )}
      </Box>

      {/* ── FOCO DE HOY + PIPELINE ETAPAS ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
        gap: 2,
        mb: 2,
      }}>
        {/* Foco de Hoy */}
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTimeIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                Foco de Hoy
              </Typography>
              {focusItems.length > 0 && !loading && (
                <Chip label={focusItems.length} size="small" color="warning" sx={{ fontWeight: 700 }} />
              )}
            </Box>

            {loading ? (
              <Stack spacing={1.5}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={68} sx={{ borderRadius: 1.5 }} />)}
              </Stack>
            ) : focusItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 52, color: 'success.main', mb: 1 }} />
                <Typography variant="body1" fontWeight={600} color="success.main">
                  ¡Todo al día!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  No tenés recordatorios pendientes para hoy
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {focusItems.slice(0, 6).map((reminder, i) => {
                  const d = dayjs(`${reminder.fechaRecordatorio} ${reminder.hora || '00:00'}`);
                  const isOverdue = d.isBefore(dayjs());
                  const borderColor = isOverdue ? 'error.main' : 'warning.main';
                  const bgColor = isOverdue ? 'rgba(211,47,47,0.05)' : 'rgba(237,108,2,0.05)';
                  const iconBg = isOverdue ? '#d32f2f' : '#ed6c02';
                  return (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderLeft: 4,
                        borderLeftColor: borderColor,
                        bgcolor: bgColor,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: isOverdue ? 'rgba(211,47,47,0.1)' : 'rgba(237,108,2,0.1)' },
                      }}
                      onClick={() => navigate(`/leads/${reminder.leadId}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          p: 0.75,
                          borderRadius: 1,
                          bgcolor: iconBg,
                          color: 'white',
                          display: 'inline-flex',
                          flexShrink: 0,
                        }}>
                          <ReminderTypeIcon tipo={reminder.tipo} size={15} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {reminder.leadNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {reminder.tipo}
                            {' · '}
                            {isOverdue
                              ? `Vencido el ${d.format('DD/MM')} a las ${d.format('HH:mm')}`
                              : `Hoy a las ${d.format('HH:mm')}`}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={isOverdue ? 'VENCIDO' : 'HOY'}
                          color={isOverdue ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}
                        />
                      </Box>
                    </Paper>
                  );
                })}
                {focusItems.length > 6 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                    sx={{ display: 'block', pt: 0.5 }}
                  >
                    +{focusItems.length - 6} más recordatorios
                  </Typography>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Pipeline por Etapas */}
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Pipeline
              </Typography>
            </Box>

            {loading ? (
              <Stack spacing={2.5}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={36} />)}
              </Stack>
            ) : (
              <>
                <Stack spacing={2.5}>
                  {pipelineStages.map((stage, i) => (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {stage.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: stage.color, minWidth: 24, textAlign: 'right' }}>
                          {stage.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stage.count > 0 ? (stage.count / pipelineMax) * 100 : 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: stage.color + '18',
                          '& .MuiLinearProgress-bar': { bgcolor: stage.color, borderRadius: 4 },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total activo
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {quickStats?.leadsActivePipeline ?? 0}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.75} justifyContent="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    icon={<WhatshotIcon sx={{ fontSize: '13px !important' }} />}
                    label={`${quickStats?.hotLeads ?? 0} HOT`}
                    color="error"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Chip
                    size="small"
                    label={`${quickStats?.warmLeads ?? 0} WARM`}
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Chip
                    size="small"
                    label={`${quickStats?.coldLeads ?? 0} COLD`}
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Stack>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── LEADS RECIENTES + PRÓXIMOS RECORDATORIOS ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        mb: 2,
      }}>
        {/* Leads Recientes */}
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PeopleIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                Leads Recientes
              </Typography>
              <Button
                size="small"
                endIcon={<NavigateNextIcon />}
                onClick={() => navigate('/leads/table')}
                sx={{ textTransform: 'none' }}
              >
                Ver todos
              </Button>
            </Box>

            {loading ? (
              <Stack spacing={1.5}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 1.5 }} />)}
              </Stack>
            ) : recentLeads.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PeopleIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No hay leads registrados
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddCircleIcon />}
                  onClick={() => navigate('/leads/nuevo')}
                  sx={{ mt: 1, bgcolor: RIPSER_BLUE }}
                >
                  Crear primer lead
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {recentLeads.map(lead => {
                  const priorConfig = PRIORITY_CONFIG[lead.prioridad as keyof typeof PRIORITY_CONFIG];
                  return (
                    <Paper
                      key={lead.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        borderLeft: 4,
                        borderLeftColor: priorConfig?.color || 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: priorConfig?.color || RIPSER_BLUE,
                            width: 36,
                            height: 36,
                            fontSize: '0.9rem',
                            flexShrink: 0,
                          }}
                        >
                          {lead.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {lead.nombre} {lead.apellido}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {lead.telefono || lead.email || 'Sin datos de contacto'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} flexShrink={0} alignItems="center">
                          <Chip
                            label={ESTADO_LABELS[lead.estadoLead] || lead.estadoLead}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.63rem', height: 20 }}
                          />
                          <Chip
                            label={lead.prioridad}
                            size="small"
                            color={priorConfig?.chipColor || 'default'}
                            sx={{ fontSize: '0.63rem', height: 20, fontWeight: 700 }}
                          />
                        </Stack>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Próximos Recordatorios */}
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                Próximos Recordatorios
              </Typography>
              {!loading && (quickStats?.recordatoriosEstaSemana ?? 0) > 0 && (
                <Chip
                  size="small"
                  label={`${quickStats!.recordatoriosEstaSemana} esta semana`}
                  color="info"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>

            {loading ? (
              <Stack spacing={1.5}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 1.5 }} />)}
              </Stack>
            ) : futureReminders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No hay recordatorios próximos
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {futureReminders.slice(0, 5).map((reminder, i) => {
                  const d = dayjs(`${reminder.fechaRecordatorio} ${reminder.hora || '00:00'}`);
                  const isThisWeek = d.isBefore(dayjs().add(7, 'days').endOf('day'));
                  return (
                    <Paper
                      key={i}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderLeft: 4,
                        borderLeftColor: isThisWeek ? 'info.main' : 'grey.300',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => navigate(`/leads/${reminder.leadId}`)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          p: 0.75,
                          borderRadius: 1,
                          bgcolor: isThisWeek ? 'info.main' : 'grey.400',
                          color: 'white',
                          display: 'inline-flex',
                          flexShrink: 0,
                        }}>
                          <ReminderTypeIcon tipo={reminder.tipo} size={15} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {reminder.leadNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {reminder.tipo} · {d.format('DD/MM/YYYY')} a las {d.format('HH:mm')}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={isThisWeek ? 'Esta semana' : d.format('DD/MM')}
                          color={isThisWeek ? 'info' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', flexShrink: 0 }}
                        />
                      </Box>
                    </Paper>
                  );
                })}
                {futureReminders.length > 5 && (
                  <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', pt: 0.5 }}>
                    +{futureReminders.length - 5} más
                  </Typography>
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── ANÁLISIS VISUAL (Charts) ── */}
      {!loading && metricas && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Análisis Visual
              </Typography>
            </Box>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}>
              <EmbudoVentasChart data={metricas.embudoVentas} />
              <MetricasCanalChart data={metricas.metricasPorCanal} />
              <MetricasPrioridadChart data={metricas.metricasPorPrioridad} />

              {/* Conversion Rate */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Tasa de Conversión
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h2" color="primary" fontWeight={700}>
                      {metricas.tasaConversion?.tasaConversion?.toFixed(1) ?? '0.0'}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {metricas.tasaConversion?.leadsConvertidos ?? 0} de{' '}
                      {metricas.tasaConversion?.totalLeads ?? 0} leads convertidos
                    </Typography>
                    {metricas.tasaConversion?.variacionPorcentual !== undefined && (
                      <Chip
                        icon={metricas.tasaConversion.variacionPorcentual >= 0
                          ? <TrendingUpIcon />
                          : <TrendingDownIcon />}
                        label={`${metricas.tasaConversion.variacionPorcentual >= 0 ? '+' : ''}${metricas.tasaConversion.variacionPorcentual.toFixed(1)}% vs mes anterior`}
                        color={metricas.tasaConversion.variacionPorcentual >= 0 ? 'success' : 'error'}
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tiempo Promedio de Conversión
                  </Typography>
                  <Typography variant="h5" color="secondary">
                    {metricas.tiempoConversion?.promedioGeneral?.toFixed(0) ?? '0'} días
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ── ACCIONES RÁPIDAS ── */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Acciones Rápidas
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => navigate('/leads/nuevo')}
              sx={{ py: 1.5, bgcolor: RIPSER_BLUE, '&:hover': { bgcolor: '#0d2d4d' }, textTransform: 'none' }}
              fullWidth
            >
              Nuevo Lead
            </Button>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/leads/table')}
              sx={{ py: 1.5, textTransform: 'none' }}
              fullWidth
            >
              Ver Pipeline
            </Button>
            <Button
              variant="outlined"
              startIcon={<MoneyIcon />}
              onClick={() => navigate('/ventas/presupuestos')}
              sx={{ py: 1.5, textTransform: 'none' }}
              fullWidth
            >
              Presupuestos
            </Button>
            {!isVendedor && (
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/leads/metricas')}
                sx={{ py: 1.5, textTransform: 'none' }}
                fullWidth
              >
                Métricas
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/leads/table')}
              sx={{ py: 1.5, textTransform: 'none' }}
              fullWidth
            >
              Recordatorios
            </Button>
            <Button
              variant="outlined"
              startIcon={<PhoneIcon />}
              onClick={() => navigate('/clientes/agenda')}
              sx={{ py: 1.5, textTransform: 'none' }}
              fullWidth
            >
              Agenda Visitas
            </Button>
            <Button
              variant="outlined"
              startIcon={<TrendingUpIcon />}
              onClick={() => navigate('/leads')}
              sx={{ py: 1.5, textTransform: 'none' }}
              fullWidth
            >
              Convertir Lead
            </Button>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/clientes')}
              sx={{ py: 1.5, textTransform: 'none' }}
              fullWidth
            >
              Clientes
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VentasDashboard;
