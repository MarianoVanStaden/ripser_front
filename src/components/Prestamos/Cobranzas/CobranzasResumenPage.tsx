import { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Button, Tooltip,
  Chip, Paper, Stack, Divider, LinearProgress,
} from '@mui/material';
import {
  Gavel, Warning, AttachMoney, Schedule, CheckCircle,
  PhoneCallback, Refresh, List as ListIcon, Handshake,
  TrendingUp, NotificationsActive, ArrowForward,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import type { ResumenCobranzaDTO } from '../../../types/cobranza.types';
import {
  ESTADO_GESTION_COBRANZA_LABELS,
  ESTADO_GESTION_COBRANZA_COLORS,
  EstadoGestionCobranza,
} from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import LoadingOverlay from '../../common/LoadingOverlay';
import { useAuth } from '../../../context/AuthContext';
import { getFirstName } from '../../../utils/userDisplay';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  /** Si está presente, la card se vuelve un link clickeable a esa URL. */
  to?: string;
  /** Texto explicativo cuando la card no es clickeable (typically backend pendiente). */
  inactiveHint?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, subtitle, to, inactiveHint }) => {
  const interactive = !!to;
  const card = (
    <Card
      sx={{
        cursor: interactive ? 'pointer' : 'default',
        height: '100%',
        '&:hover': interactive ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">{title}</Typography>
            <Typography variant="h5" fontWeight="bold">{value}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}15`,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (interactive) {
    return (
      <Box
        component={RouterLink}
        to={to!}
        aria-label={`${title}: ${value}. Ver gestiones filtradas.`}
        sx={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
      >
        {card}
      </Box>
    );
  }

  if (inactiveHint) {
    return (
      <Tooltip title={inactiveHint} placement="top">
        <Box>{card}</Box>
      </Tooltip>
    );
  }
  return card;
};

const LISTA = '/cobranzas/lista';
const linkActivasOrdenadoPorMonto = `${LISTA}?soloActivas=true&sort=montoPendiente,desc`;
const linkVencidasHoy = `${LISTA}?soloActivas=true&fechaFiltro=VENCIDAS`;
const linkActivas = `${LISTA}?soloActivas=true`;
const linkPromesasIncumplidas = `${LISTA}?soloActivas=true&promesaIncumplida=true`;
const linkRecordatoriosPendientes = `${LISTA}?soloActivas=true&recordatoriosPendientes=true`;
const linkPromesasVencenHoy = `${LISTA}?soloActivas=true&promesaVenceHoy=true`;
const linkConMora = `${LISTA}?soloActivas=true&conMora=true`;
const linkEstado = (estado: EstadoGestionCobranza) =>
  `${LISTA}?soloActivas=true&estados=${encodeURIComponent(estado)}`;

const getSaludo = (): string => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatFechaLarga = (d: Date): string => {
  const fecha = d.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  return fecha.charAt(0).toUpperCase() + fecha.slice(1);
};

interface FocoItemProps {
  icon: React.ReactElement;
  label: string;
  value: number;
  color: string;
  hint: string;
  to: string;
}

const FocoItem: React.FC<FocoItemProps> = ({ icon, label, value, color, hint, to }) => (
  <Box
    component={RouterLink}
    to={to}
    sx={{
      textDecoration: 'none',
      color: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: 3,
        borderColor: color,
        transform: 'translateX(4px)',
      },
    }}
  >
    <Box
      sx={{
        bgcolor: `${color}20`,
        color,
        borderRadius: '50%',
        p: 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{hint}</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        label={value}
        size="small"
        sx={{ bgcolor: color, color: '#fff', fontWeight: 700, minWidth: 40 }}
      />
      <ArrowForward sx={{ color: 'text.secondary', fontSize: 18 }} />
    </Box>
  </Box>
);

export const CobranzasResumenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenCobranzaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResumen = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gestionCobranzaApi.getResumen();
      setResumen(data);
    } catch (err) {
      console.error('Error loading resumen cobranzas:', err);
      setError('Error al cargar el resumen. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumen();
  }, []);

  const totalFoco = useMemo(() => {
    if (!resumen) return 0;
    return (
      resumen.gestionesVencidasHoy +
      resumen.promesasVigentesHoy +
      resumen.promesasIncumplidas +
      resumen.recordatoriosPendientesAgente
    );
  }, [resumen]);

  const tasaRecuperada = useMemo(() => {
    if (!resumen?.gestionesPorEstado) return 0;
    const recuperadas = resumen.gestionesPorEstado[EstadoGestionCobranza.RECUPERADA] ?? 0;
    const total = Object.values(resumen.gestionesPorEstado).reduce((s, v) => s + (v ?? 0), 0);
    if (total === 0) return 0;
    return Math.round((recuperadas / total) * 100);
  }, [resumen]);

  const saludo = getSaludo();
  const firstName = getFirstName(user);

  return (
    <Box>
      <LoadingOverlay open={loading} message="Cargando cobranzas..." />

      {/* Welcome header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              background: 'linear-gradient(135deg, #1976d2 0%, #00B8A9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5,
            }}
          >
            {saludo}{firstName ? `, ${firstName}` : ''} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatFechaLarga(new Date())} · Resumen de Cobranzas
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadResumen}>
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<ListIcon />}
            onClick={() => navigate('/cobranzas/lista')}
          >
            Ver Gestiones
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {resumen && (
        <>
          {/* Foco de Hoy */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 4,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(25,118,210,0.06) 0%, rgba(0,184,169,0.06) 100%)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  bgcolor: '#1976d2',
                  color: '#fff',
                  borderRadius: 2,
                  p: 1,
                  display: 'flex',
                }}
              >
                <NotificationsActive />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Foco de Hoy
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalFoco === 0
                    ? '¡Todo al día! No hay acciones urgentes.'
                    : `${totalFoco} ${totalFoco === 1 ? 'acción requiere' : 'acciones requieren'} tu atención`}
                </Typography>
              </Box>
              {totalFoco > 0 && (
                <Chip
                  label={totalFoco}
                  sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 700 }}
                />
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FocoItem
                  icon={<Schedule />}
                  label="Vencidas hoy"
                  value={resumen.gestionesVencidasHoy}
                  color="#E91E63"
                  hint="Gestiones sin acción registrada hoy"
                  to={linkVencidasHoy}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FocoItem
                  icon={<Handshake />}
                  label="Promesas vencen hoy"
                  value={resumen.promesasVigentesHoy}
                  color="#9C27B0"
                  hint="Verificar si el cliente cumplió"
                  to={linkPromesasVencenHoy}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FocoItem
                  icon={<Warning />}
                  label="Promesas incumplidas"
                  value={resumen.promesasIncumplidas}
                  color="#F44336"
                  hint="Re-contactar al cliente"
                  to={linkPromesasIncumplidas}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FocoItem
                  icon={<Gavel />}
                  label="Recordatorios pendientes"
                  value={resumen.recordatoriosPendientesAgente}
                  color="#FF9800"
                  hint="Tareas asignadas a tu agenda"
                  to={linkRecordatoriosPendientes}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* KPIs principales */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Panorama General</Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Gestiones Activas"
                value={resumen.totalGestionesActivas}
                icon={<PhoneCallback sx={{ color: '#1976d2', fontSize: 28 }} />}
                color="#1976d2"
                to={linkActivas}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Monto Total Pendiente"
                value={formatPrice(resumen.totalMontoPendiente)}
                icon={<AttachMoney sx={{ color: '#FF9800', fontSize: 28 }} />}
                color="#FF9800"
                to={linkActivasOrdenadoPorMonto}
                subtitle="Ordenadas por monto"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Sin Gestión con Mora"
                value={resumen.sinGestionConMora}
                icon={<Warning sx={{ color: '#FF5722', fontSize: 28 }} />}
                color="#FF5722"
                subtitle="Necesitan apertura de gestión"
                to={linkActivas}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Cuotas Vencidas Total"
                value={resumen.cuotasVencidasTotal}
                icon={<Schedule sx={{ color: '#795548', fontSize: 28 }} />}
                color="#795548"
                subtitle="En toda la empresa"
                to={linkConMora}
              />
            </Grid>
          </Grid>

          {/* Indicador de recuperación + Por estado */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUp sx={{ color: '#4CAF50' }} />
                  <Typography variant="h6" fontWeight={700}>Tasa de Recuperación</Typography>
                </Box>
                <Typography variant="h3" fontWeight={700} color="#4CAF50" sx={{ mb: 1 }}>
                  {tasaRecuperada}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Gestiones recuperadas sobre el total
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={tasaRecuperada}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(76,175,80,0.15)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#4CAF50' },
                  }}
                />
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <CheckCircle sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: '#4CAF50' }} />
                      Recuperadas
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {resumen.gestionesPorEstado?.[EstadoGestionCobranza.RECUPERADA] ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <Gavel sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: '#F44336' }} />
                      En legal
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {resumen.gestionesPorEstado?.[EstadoGestionCobranza.EN_LEGAL] ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <Warning sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: '#9E9E9E' }} />
                      Incobrables
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {resumen.gestionesPorEstado?.[EstadoGestionCobranza.INCOBRABLE] ?? 0}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Gestiones por Estado
                </Typography>
                <Grid container spacing={2}>
                  {(Object.keys(EstadoGestionCobranza) as (keyof typeof EstadoGestionCobranza)[]).map((key) => {
                    const estado = EstadoGestionCobranza[key];
                    const count = resumen.gestionesPorEstado?.[estado] ?? 0;
                    const color = ESTADO_GESTION_COBRANZA_COLORS[estado];
                    return (
                      <Grid item xs={6} sm={4} key={estado}>
                        <KpiCard
                          title={ESTADO_GESTION_COBRANZA_LABELS[estado]}
                          value={count}
                          icon={<CheckCircle sx={{ color, fontSize: 28 }} />}
                          color={color}
                          to={linkEstado(estado)}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
