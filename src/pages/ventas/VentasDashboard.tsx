import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Chip,
  Paper,
  Stack,
  Divider,
  Avatar,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  AssignmentTurnedIn as AssignmentIcon,
  NotificationsActive as NotificationsIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  AddCircle as AddCircleIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Stars as StarsIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { leadApi } from '../../api/services/leadApi';
import { leadMetricasApi } from '../../api/services/leadMetricasApi';
import type { LeadDTO, RecordatorioLeadDTO } from '../../types/lead.types';
import type { LeadMetricasResponseDTO } from '../../api/services/leadMetricasApi';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';

// Import existing chart components
import { EmbudoVentasChart } from '../../components/metricas/EmbudoVentasChart';
import { MetricasCanalChart } from '../../components/metricas/MetricasCanalChart';
import { MetricasPrioridadChart } from '../../components/metricas/MetricasPrioridadChart';

dayjs.locale('es');

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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend, onClick }) => (
  <Card
    sx={{
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: 4
      } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: color + '20',
            color,
            display: 'inline-flex',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {trend.isPositive ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: trend.isPositive ? 'success.main' : 'error.main', fontWeight: 600 }}
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}% vs mes anterior
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const VentasDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { empresaId, sucursalFiltro, sucursales } = useTenant();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [metricas, setMetricas] = useState<LeadMetricasResponseDTO | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadDTO[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Array<RecordatorioLeadDTO & { leadNombre: string; leadId: number }>>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get sucursal name
  const sucursalNombre = sucursalFiltro
    ? sucursales.find(s => s.id === sucursalFiltro)?.nombre || 'Sucursal'
    : 'Todas las sucursales';

  // Date range - default to current month
  const [fechaInicio] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [fechaFin] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [empresaId, sucursalFiltro, user?.id]); // Re-fetch when tenant or sucursal changes

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const params = {
        sucursalId: sucursalFiltro !== null ? sucursalFiltro : undefined
      };

      const [allLeads, metricasData] = await Promise.all([
        leadApi.getAll(params),
        leadMetricasApi.obtenerMetricasCompletas({
          fechaInicio,
          fechaFin,
          sucursalId: sucursalFiltro !== null ? sucursalFiltro : undefined,
          usuarioAsignadoId: user?.id
        })
      ]);

      // Calculate quick stats
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
        ).length
      };

      // Fetch recordatorios for all active leads
      const activeLeads = allLeads.filter(l =>
        !['CONVERTIDO', 'PERDIDO', 'DESCARTADO'].includes(l.estadoLead)
      );

      const allReminders: Array<RecordatorioLeadDTO & { leadNombre: string; leadId: number }> = [];

      for (const lead of activeLeads.slice(0, 20)) { // Limit to first 20 for performance
        try {
          const reminders = await leadApi.getRecordatorios(lead.id!);
          const pendingReminders = reminders.filter(r => !r.enviado);

          pendingReminders.forEach(reminder => {
            allReminders.push({
              ...reminder,
              leadNombre: lead.apellido ? `${lead.nombre} ${lead.apellido}` : lead.nombre,
              leadId: lead.id!
            });

            const reminderDate = dayjs(`${reminder.fechaRecordatorio} ${reminder.hora || '00:00'}`);
            const now = dayjs();
            const today = dayjs().startOf('day');
            const weekFromNow = dayjs().add(7, 'days').endOf('day');

            if (reminderDate.isBefore(now)) {
              stats.recordatoriosVencidos++;
            } else if (reminderDate.isSame(today, 'day')) {
              stats.recordatoriosHoy++;
            } else if (reminderDate.isBefore(weekFromNow)) {
              stats.recordatoriosEstaSemana++;
            } else {
              stats.recordatoriosProximos++;
            }
          });
        } catch (err) {
          console.error(`Error loading reminders for lead ${lead.id}:`, err);
        }
      }

      // Sort reminders by date
      allReminders.sort((a, b) => {
        const dateA = dayjs(`${a.fechaRecordatorio} ${a.hora || '00:00'}`);
        const dateB = dayjs(`${b.fechaRecordatorio} ${b.hora || '00:00'}`);
        return dateA.diff(dateB);
      });

      setQuickStats(stats);
      setMetricas(metricasData);
      setRecentLeads(allLeads.slice(0, 5));
      setUpcomingReminders(allReminders.slice(0, 5));
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar el dashboard. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading && !quickStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' }, 
          justifyContent: 'space-between', 
          gap: 2,
          mb: 1 
        }}>
          <Box>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
              <SpeedIcon fontSize="large" />
              Dashboard de Ventas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Bienvenido, {user?.nombre || user?.username} - {sucursalNombre}
            </Typography>
          </Box>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={1} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Chip
                icon={<BusinessIcon />}
                label={sucursalNombre}
                color="primary"
                variant="outlined"
              />
              <Tooltip title="Última actualización">
                <Chip
                  icon={<ScheduleIcon />}
                  label={dayjs(lastRefresh).format('HH:mm:ss')}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              fullWidth
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Actualizar
            </Button>
          </Stack>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {quickStats && (
        <Grid container spacing={3}>
          {/* Lead State KPIs */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon color="primary" />
              Estado de Leads
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pipeline Activo"
              value={quickStats.leadsActivePipeline}
              icon={<PeopleIcon />}
              color="#1976d2"
              subtitle="Leads en proceso"
              onClick={() => navigate('/leads')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Primer Contacto"
              value={quickStats.primerContacto}
              icon={<PhoneIcon />}
              color="#2e7d32"
              subtitle="Nuevos leads"
              onClick={() => navigate('/leads/table')}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Mostraron Interés"
              value={quickStats.mostraronInteres}
              icon={<StarsIcon />}
              color="#ed6c02"
              subtitle="Leads interesados"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Cliente Potencial"
              value={quickStats.clientePotencial}
              icon={<TrendingUpIcon />}
              color="#7b1fa2"
              subtitle="En negociación"
            />
          </Grid>

          {/* Priority Distribution */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" />
              Distribución por Prioridad
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <StatCard
              title="Leads HOT"
              value={quickStats.hotLeads}
              icon={<ErrorIcon />}
              color="#d32f2f"
              subtitle="Alta prioridad"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <StatCard
              title="Leads WARM"
              value={quickStats.warmLeads}
              icon={<WarningIcon />}
              color="#ed6c02"
              subtitle="Prioridad media"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <StatCard
              title="Leads COLD"
              value={quickStats.coldLeads}
              icon={<CheckCircleIcon />}
              color="#0288d1"
              subtitle="Baja prioridad"
            />
          </Grid>

          {/* Recordatorios KPIs */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon color="primary" />
              Recordatorios
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Vencidos"
              value={quickStats.recordatoriosVencidos}
              icon={<ErrorIcon />}
              color="#d32f2f"
              subtitle="Requieren atención"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Hoy"
              value={quickStats.recordatoriosHoy}
              icon={<CalendarIcon />}
              color="#ed6c02"
              subtitle="Para hoy"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Esta Semana"
              value={quickStats.recordatoriosEstaSemana}
              icon={<ScheduleIcon />}
              color="#fbc02d"
              subtitle="Próximos 7 días"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Próximos"
              value={quickStats.recordatoriosProximos}
              icon={<NotificationsIcon />}
              color="#0288d1"
              subtitle="Más adelante"
            />
          </Grid>

          {/* Quick Actions (Atajos) */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
              Acciones Rápidas
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AddCircleIcon />}
                    onClick={() => navigate('/leads/nuevo')}
                    sx={{ py: 1.5 }}
                  >
                    Nuevo Lead
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PhoneIcon />}
                    onClick={() => navigate('/leads/table')}
                    sx={{ py: 1.5 }}
                  >
                    Registrar Llamada
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmailIcon />}
                    onClick={() => navigate('/leads/table')}
                    sx={{ py: 1.5 }}
                  >
                    Enviar Email
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<MoneyIcon />}
                    onClick={() => navigate('/ventas/presupuestos')}
                    sx={{ py: 1.5 }}
                  >
                    Crear Presupuesto
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<TrendingUpIcon />}
                    onClick={() => navigate('/leads')}
                    sx={{ py: 1.5 }}
                  >
                    Convertir Lead
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<CalendarIcon />}
                    onClick={() => navigate('/leads/table')}
                    sx={{ py: 1.5 }}
                  >
                    Agendar Recordatorio
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/leads/metricas')}
                    sx={{ py: 1.5 }}
                  >
                    Métricas Completas
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate('/leads/table')}
                    sx={{ py: 1.5 }}
                  >
                    Ver Todos
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Charts Section */}
          {metricas && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  Análisis Visual
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <EmbudoVentasChart data={metricas.embudoVentas} />
              </Grid>

              <Grid item xs={12} md={6}>
                <MetricasCanalChart data={metricas.metricasPorCanal} />
              </Grid>

              <Grid item xs={12} md={6}>
                <MetricasPrioridadChart data={metricas.metricasPorPrioridad} />
              </Grid>

              {/* Conversion Rate Card */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tasa de Conversión
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="h2" color="primary" fontWeight="bold">
                        {metricas.tasaConversion?.tasaConversion?.toFixed(1) ?? '0.0'}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {metricas.tasaConversion?.leadsConvertidos ?? 0} de {metricas.tasaConversion?.totalLeads ?? 0} leads convertidos
                      </Typography>
                      {metricas.tasaConversion?.variacionPorcentual !== undefined && (
                        <Chip
                          icon={metricas.tasaConversion.variacionPorcentual >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          label={`${metricas.tasaConversion.variacionPorcentual >= 0 ? '+' : ''}${metricas.tasaConversion.variacionPorcentual.toFixed(1)}% vs mes anterior`}
                          color={metricas.tasaConversion.variacionPorcentual >= 0 ? 'success' : 'error'}
                          sx={{ mt: 2 }}
                        />
                      )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Tiempo Promedio de Conversión
                      </Typography>
                      <Typography variant="h5" color="secondary">
                        {metricas.tiempoConversion?.promedioGeneral?.toFixed(0) ?? '0'} días
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Recent Leads Widget */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon color="primary" />
                  Leads Recientes
                </Typography>
                <Divider sx={{ my: 2 }} />
                {recentLeads.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No hay leads recientes
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {recentLeads.map((lead) => (
                      <Paper
                        key={lead.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {lead.nombre.charAt(0)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {lead.nombre} {lead.apellido}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {lead.telefono} • {lead.email}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip
                                label={lead.estadoLead}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                label={lead.prioridad}
                                size="small"
                                color={
                                  lead.prioridad === 'HOT' ? 'error' :
                                  lead.prioridad === 'WARM' ? 'warning' : 'info'
                                }
                              />
                              {lead.canal && (
                                <Chip
                                  label={lead.canal}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Reminders Widget */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" />
                  Próximos Recordatorios
                </Typography>
                <Divider sx={{ my: 2 }} />
                {upcomingReminders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No hay recordatorios pendientes
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {upcomingReminders.map((reminder, index) => {
                      const reminderDate = dayjs(`${reminder.fechaRecordatorio} ${reminder.hora || '00:00'}`);
                      const isOverdue = reminderDate.isBefore(dayjs());
                      const isToday = reminderDate.isSame(dayjs(), 'day');

                      return (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderLeft: 4,
                            borderLeftColor: isOverdue ? 'error.main' : isToday ? 'warning.main' : 'info.main'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                bgcolor: isOverdue ? 'error.lighter' : isToday ? 'warning.lighter' : 'info.lighter',
                                color: isOverdue ? 'error.main' : isToday ? 'warning.main' : 'info.main'
                              }}
                            >
                              {reminder.tipo === 'LLAMADA' && <PhoneIcon fontSize="small" />}
                              {reminder.tipo === 'EMAIL' && <EmailIcon fontSize="small" />}
                              {reminder.tipo === 'WHATSAPP' && <WhatsAppIcon fontSize="small" />}
                              {!['LLAMADA', 'EMAIL', 'WHATSAPP'].includes(reminder.tipo) && <NotificationsIcon fontSize="small" />}
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {reminder.leadNombre}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {reminder.mensaje}
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip
                                  icon={<CalendarIcon />}
                                  label={reminderDate.format('DD/MM/YYYY HH:mm')}
                                  size="small"
                                  color={isOverdue ? 'error' : isToday ? 'warning' : 'default'}
                                />
                                <Chip
                                  label={reminder.tipo}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default VentasDashboard;
