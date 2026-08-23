import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Button, Paper, Stack,
  Chip, Divider, LinearProgress, Tooltip, CircularProgress,
} from '@mui/material';
import {
  TrendingUp, Warning, Gavel, CheckCircle,
  AttachMoney, MoneyOff, Schedule, Refresh,
  ArrowForward, List as ListIcon, PhoneCallback, Handshake,
  NotificationsActive, Bolt,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { gestionCobranzaApi } from '../../api/services/gestionCobranzaApi';
import type { ResumenPrestamosDTO } from '../../types/prestamo.types';
import {
  CategoriaPrestamo, CATEGORIA_PRESTAMO_LABELS,
} from '../../types/prestamo.types';
import type { ResumenCobranzaDTO } from '../../types/cobranza.types';
import {
  ESTADO_GESTION_COBRANZA_LABELS,
  EstadoGestionCobranza,
} from '../../types/cobranza.types';
import { roleForEstado, statusSx, type StatusRole } from '../../theme/statusRoles';
import { CATEGORIA_ROLE } from './cuotaEstadoRole';
import { formatPrice } from '../../utils/priceCalculations';
import LoadingOverlay from '../common/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';
import { useSseEvent } from '../../hooks/useSseEvent';
import { SSE_EVENTS } from '../../lib/sse-contract';
import { usePermisos } from '../../hooks/usePermisos';

const LISTA = '/prestamos/lista';

// Deep-links a la lista de gestiones de cobranza. La lista por defecto muestra la
// "agenda de hoy"; los que deben ver TODAS las gestiones de un filtro pasan fechaFiltro=TODAS.
const LISTA_COB = '/cobranzas/lista';
const TODAS = 'fechaFiltro=TODAS';
const linkActivas = `${LISTA_COB}?soloActivas=true&${TODAS}`;
const linkActivasOrdenadoPorMonto = `${LISTA_COB}?soloActivas=true&${TODAS}&sort=montoPendiente,desc`;
const linkVencidasHoy = `${LISTA_COB}?soloActivas=true&fechaFiltro=HOY_Y_VENCIDAS`;
const linkPromesasIncumplidas = `${LISTA_COB}?soloActivas=true&${TODAS}&promesaIncumplida=true`;
const linkRecordatoriosPendientes = `${LISTA_COB}?soloActivas=true&${TODAS}&recordatoriosPendientes=true`;
const linkPromesasVencenHoy = `${LISTA_COB}?soloActivas=true&${TODAS}&promesaVenceHoy=true`;
const linkConMora = `${LISTA_COB}?soloActivas=true&${TODAS}&conMora=true`;
const linkEstado = (estado: EstadoGestionCobranza) =>
  `${LISTA_COB}?soloActivas=true&${TODAS}&estados=${encodeURIComponent(estado)}`;

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  to?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, subtitle, to }) => {
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
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ bgcolor: `color-mix(in srgb, ${color} 8%, transparent)`, borderRadius: '50%', p: 1.5, display: 'flex' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  if (!interactive) return card;
  return (
    <Box
      component={RouterLink}
      to={to!}
      aria-label={`${title}: ${value}`}
      sx={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
    >
      {card}
    </Box>
  );
};

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

/** Orden de severidad creciente para la cartera por categoría. */
const CATEGORIA_ORDEN: CategoriaPrestamo[] = [
  CategoriaPrestamo.NORMAL,
  CategoriaPrestamo.CON_SEGUIMIENTO,
  CategoriaPrestamo.DUDOSO,
  CategoriaPrestamo.PAGO_CON_MORA,
  CategoriaPrestamo.ALTO_RIESGO,
  CategoriaPrestamo.MOROSO,
  CategoriaPrestamo.LEGALES,
  CategoriaPrestamo.IRRECUPERABLE,
];

interface FocoItemProps {
  icon: React.ReactElement;
  label: string;
  value: number;
  role: StatusRole;
  hint: string;
  to: string;
}

const FocoItem: React.FC<FocoItemProps> = ({ icon, label, value, role, hint, to }) => (
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
      '&:hover': { boxShadow: 3, borderColor: `status.${role}.fg`, transform: 'translateX(4px)' },
    }}
  >
    <Box
      sx={{
        bgcolor: `status.${role}.bg`, color: `status.${role}.fg`, borderRadius: '50%', p: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" fontWeight={600}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{hint}</Typography>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip label={value} size="small" sx={{ ...statusSx(role), fontWeight: 700, minWidth: 40 }} />
      <ArrowForward sx={{ color: 'text.secondary', fontSize: 18 }} />
    </Box>
  </Box>
);

export const PrestamosResumenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { esAdmin, esSuperAdmin } = usePermisos();
  // Los montos de cartera (prestado/cobrado/pendiente y monto en gestión) solo se
  // muestran a ADMIN o SuperAdmin; roles inferiores ven el resto del resumen sin importes.
  const puedeVerMontos = esAdmin || esSuperAdmin;
  const [resumen, setResumen] = useState<ResumenPrestamosDTO | null>(null);
  const [resumenCob, setResumenCob] = useState<ResumenCobranzaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [motorRunning, setMotorRunning] = useState(false);
  const [motorMsg, setMotorMsg] = useState<string | null>(null);

  const loadResumen = async () => {
    setLoading(true);
    setError(null);
    // Carga tolerante a fallos parciales: si cae un resumen, mostramos el otro igual.
    const [rPrestamos, rCobranza] = await Promise.allSettled([
      prestamoPersonalApi.getResumen(),
      gestionCobranzaApi.getResumen(),
    ]);

    if (rPrestamos.status === 'fulfilled') setResumen(rPrestamos.value);
    if (rCobranza.status === 'fulfilled') setResumenCob(rCobranza.value);

    const fallidos: string[] = [];
    if (rPrestamos.status === 'rejected') {
      console.error('Error loading resumen créditos:', rPrestamos.reason);
      fallidos.push('créditos');
    }
    if (rCobranza.status === 'rejected') {
      console.error('Error loading resumen cobranzas:', rCobranza.reason);
      fallidos.push('cobranzas');
    }
    setError(fallidos.length > 0
      ? `No se pudo cargar el resumen de ${fallidos.join(' y ')}. Intente nuevamente.`
      : null);
    setLoading(false);
  };

  useEffect(() => {
    loadResumen();
  }, []);

  // Auto-refresh en tiempo real: confirmación/rechazo de pagos informados o pagos
  // registrados (otra pantalla/usuario) re-cargan el resumen. Reusa la conexión SSE global.
  useSseEvent([SSE_EVENTS.CUOTA_ACTUALIZADA, SSE_EVENTS.PAGO_REGISTRADO], loadResumen);

  const handleEjecutarMotor = async () => {
    try {
      setMotorRunning(true);
      setError(null);
      setMotorMsg(null);
      await gestionCobranzaApi.ejecutarMotor();
      await loadResumen();
      setMotorMsg('Motor de cobranza ejecutado. Se actualizaron las gestiones (mora, agenda, fantasmas cerrados).');
    } catch (err) {
      console.error('Error ejecutando motor de cobranza:', err);
      setError('No se pudo ejecutar el motor de cobranza.');
    } finally {
      setMotorRunning(false);
    }
  };

  const pctCobrado = useMemo(() => {
    if (!resumen) return 0;
    const total = resumen.montoTotalPrestado || 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((resumen.montoTotalCobrado / total) * 100));
  }, [resumen]);

  const categoriasCartera = useMemo(() => {
    if (!resumen) return [];
    const counts: Record<CategoriaPrestamo, number> = {
      NORMAL: resumen.prestamosNormales,
      CON_SEGUIMIENTO: resumen.prestamosConSeguimiento,
      DUDOSO: resumen.prestamosDudosos,
      PAGO_CON_MORA: resumen.prestamosPagoConMora,
      ALTO_RIESGO: resumen.prestamosAltoRiesgo,
      MOROSO: resumen.prestamosMorosos,
      LEGALES: resumen.prestamosLegales,
      IRRECUPERABLE: resumen.prestamosIrrecuperables,
    };
    const totalCat = Object.values(counts).reduce((s, v) => s + (v || 0), 0);
    return CATEGORIA_ORDEN
      .map((cat) => ({ cat, count: counts[cat] || 0 }))
      .filter((c) => c.count > 0)
      .map((c) => ({ ...c, pct: totalCat > 0 ? Math.round((c.count / totalCat) * 100) : 0 }));
  }, [resumen]);

  const totalFoco = useMemo(() => {
    if (!resumenCob) return 0;
    return (
      resumenCob.gestionesVencidasHoy +
      resumenCob.promesasVigentesHoy +
      resumenCob.promesasIncumplidas +
      resumenCob.recordatoriosPendientesAgente
    );
  }, [resumenCob]);

  const tasaRecuperada = useMemo(() => {
    if (!resumenCob?.gestionesPorEstado) return 0;
    const recuperadas = resumenCob.gestionesPorEstado[EstadoGestionCobranza.RECUPERADA] ?? 0;
    const total = Object.values(resumenCob.gestionesPorEstado).reduce((s, v) => s + (v ?? 0), 0);
    if (total === 0) return 0;
    return Math.round((recuperadas / total) * 100);
  }, [resumenCob]);

  const saludo = getSaludo();
  const firstName = getFirstName(user);

  return (
    <Box>
      <LoadingOverlay open={loading} message="Cargando créditos y cobranzas..." />

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
              // eslint-disable-next-line ripser/no-literal-colors -- gradiente decorativo de marca del saludo (texto con background-clip)
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
            {formatFechaLarga(new Date())} · Resumen de Créditos y Cobranzas
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {esAdmin && (
            <Tooltip title="Recalcula mora, abre/agenda gestiones y cierra las de préstamos refinanciados/finalizados">
              <span>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={motorRunning ? <CircularProgress size={16} /> : <Bolt />}
                  onClick={handleEjecutarMotor}
                  disabled={motorRunning}
                >
                  {motorRunning ? 'Ejecutando…' : 'Ejecutar motor'}
                </Button>
              </span>
            </Tooltip>
          )}
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadResumen}>
            Actualizar
          </Button>
          <Button variant="outlined" startIcon={<ListIcon />} onClick={() => navigate(LISTA)}>
            Ver Créditos
          </Button>
          <Button variant="contained" startIcon={<Schedule />} onClick={() => navigate(LISTA_COB)}>
            Agenda de Hoy
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {motorMsg && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMotorMsg(null)}>{motorMsg}</Alert>}

      {/* Foco de Hoy: agenda operativa de cobranza */}
      {resumenCob && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            borderRadius: 3,
            // eslint-disable-next-line ripser/no-literal-colors -- velo degradado decorativo de marca al 6%, legible en ambos esquemas
            background: 'linear-gradient(135deg, rgba(25,118,210,0.06) 0%, rgba(0,184,169,0.06) 100%)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, p: 1, display: 'flex' }}>
              <NotificationsActive />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>Foco de Hoy</Typography>
              <Typography variant="caption" color="text.secondary">
                {totalFoco === 0
                  ? '¡Todo al día! No hay acciones urgentes.'
                  : `${totalFoco} ${totalFoco === 1 ? 'acción requiere' : 'acciones requieren'} tu atención`}
              </Typography>
            </Box>
            {totalFoco > 0 && (
              <Chip label={totalFoco} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }} />
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FocoItem icon={<Schedule />} label="Vencidas hoy" value={resumenCob.gestionesVencidasHoy}
                role="danger" hint="Gestiones sin acción registrada hoy" to={linkVencidasHoy} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FocoItem icon={<Handshake />} label="Promesas vencen hoy" value={resumenCob.promesasVigentesHoy}
                role="process" hint="Verificar si el cliente cumplió" to={linkPromesasVencenHoy} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FocoItem icon={<Warning />} label="Promesas incumplidas" value={resumenCob.promesasIncumplidas}
                role="danger" hint="Re-contactar al cliente" to={linkPromesasIncumplidas} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FocoItem icon={<Gavel />} label="Recordatorios pendientes" value={resumenCob.recordatoriosPendientesAgente}
                role="warning" hint="Tareas asignadas a tu agenda" to={linkRecordatoriosPendientes} />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Panorama general: cartera de préstamos vigente (sin históricos) */}
      {resumen && (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Panorama General</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Activos" value={resumen.prestamosActivos}
                icon={<TrendingUp sx={{ color: 'status.success.fg', fontSize: 28 }} />} color="var(--mui-palette-status-success-fg)"
                to={`${LISTA}?estados=ACTIVO`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="En Mora" value={resumen.prestamosEnMora}
                icon={<Warning sx={{ color: 'status.warning.fg', fontSize: 28 }} />} color="var(--mui-palette-status-warning-fg)"
                to={`${LISTA}?estados=EN_MORA`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="En Legal" value={resumen.prestamosEnLegal}
                icon={<Gavel sx={{ color: 'status.danger.fg', fontSize: 28 }} />} color="var(--mui-palette-status-danger-fg)"
                to={`${LISTA}?estados=EN_LEGAL`} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Próximas a Vencer" value={resumen.cuotasProximasAVencer}
                icon={<Schedule sx={{ color: 'status.warning.fg', fontSize: 28 }} />} color="var(--mui-palette-status-warning-fg)"
                subtitle="Cuotas próx. días" />
            </Grid>
          </Grid>
        </>
      )}

      {/* Cobranza: estado de la gestión activa (todo actual) */}
      {resumenCob && (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Cobranza</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Gestiones Activas" value={resumenCob.totalGestionesActivas}
                icon={<PhoneCallback sx={{ color: 'primary.main', fontSize: 28 }} />} color="var(--mui-palette-primary-main)"
                to={linkActivas} />
            </Grid>
            {puedeVerMontos && (
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard title="Monto en Gestión" value={formatPrice(resumenCob.totalMontoPendiente)}
                  icon={<AttachMoney sx={{ color: 'status.warning.fg', fontSize: 28 }} />} color="var(--mui-palette-status-warning-fg)"
                  to={linkActivasOrdenadoPorMonto} subtitle="Ordenadas por monto" />
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Sin Gestión con Mora" value={resumenCob.sinGestionConMora}
                icon={<Warning sx={{ color: 'status.danger.fg', fontSize: 28 }} />} color="var(--mui-palette-status-danger-fg)"
                subtitle="Necesitan apertura de gestión" to={linkActivas} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Cuotas Vencidas" value={resumenCob.cuotasVencidasTotal}
                icon={<Schedule sx={{ color: 'status.neutral.fg', fontSize: 28 }} />} color="var(--mui-palette-status-neutral-fg)"
                subtitle="En toda la empresa" to={linkConMora} />
            </Grid>
          </Grid>
        </>
      )}

      {/* Montos + cartera por categoría (vigente) */}
      {resumen && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {puedeVerMontos && (
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoney sx={{ color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>Cartera</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">Cobrado sobre prestado</Typography>
              <Typography variant="h3" fontWeight={700} color="status.success.fg" sx={{ mb: 1 }}>{pctCobrado}%</Typography>
              <LinearProgress
                variant="determinate"
                value={pctCobrado}
                sx={{
                  height: 10, borderRadius: 5, bgcolor: 'status.success.bg',
                  '& .MuiLinearProgress-bar': { bgcolor: 'status.success.fg' },
                }}
              />
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    <AttachMoney sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                    Prestado
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{formatPrice(resumen.montoTotalPrestado)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    <CheckCircle sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'status.success.fg' }} />
                    Cobrado
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="status.success.fg">{formatPrice(resumen.montoTotalCobrado)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    <MoneyOff sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'status.warning.fg' }} />
                    Pendiente
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="status.warning.fg">{formatPrice(resumen.montoTotalPendiente)}</Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          )}

          <Grid item xs={12} md={puedeVerMontos ? 7 : 12}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Cartera por Categoría</Typography>
              {categoriasCartera.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin datos de categorías.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {categoriasCartera.map(({ cat, count, pct }) => {
                    const role = CATEGORIA_ROLE[cat];
                    return (
                      <Box
                        key={cat}
                        component={RouterLink}
                        to={`${LISTA}?categorias=${cat}`}
                        sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Chip label={CATEGORIA_PRESTAMO_LABELS[cat]} size="small"
                            sx={{ ...statusSx(role), fontWeight: 600 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={700}>{count}</Typography>
                            <ArrowForward sx={{ color: 'text.secondary', fontSize: 16 }} />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8, borderRadius: 4, bgcolor: `status.${role}.bg`,
                            '& .MuiLinearProgress-bar': { bgcolor: `status.${role}.fg` },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tasa de recuperación + gestiones por estado */}
      {resumenCob && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp sx={{ color: 'status.success.fg' }} />
                <Typography variant="h6" fontWeight={700}>Tasa de Recuperación</Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="status.success.fg" sx={{ mb: 1 }}>{tasaRecuperada}%</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Gestiones recuperadas sobre el total
              </Typography>
              <LinearProgress
                variant="determinate"
                value={tasaRecuperada}
                sx={{
                  height: 10, borderRadius: 5, bgcolor: 'status.success.bg',
                  '& .MuiLinearProgress-bar': { bgcolor: 'status.success.fg' },
                }}
              />
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    <CheckCircle sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'status.success.fg' }} />
                    Recuperadas
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {resumenCob.gestionesPorEstado?.[EstadoGestionCobranza.RECUPERADA] ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    <Gavel sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'status.danger.fg' }} />
                    En legal
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {resumenCob.gestionesPorEstado?.[EstadoGestionCobranza.EN_LEGAL] ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    <Warning sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: 'status.neutral.fg' }} />
                    Incobrables
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {resumenCob.gestionesPorEstado?.[EstadoGestionCobranza.INCOBRABLE] ?? 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Gestiones por Estado</Typography>
              <Grid container spacing={2}>
                {(Object.keys(EstadoGestionCobranza) as (keyof typeof EstadoGestionCobranza)[]).map((key) => {
                  const estado = EstadoGestionCobranza[key];
                  const count = resumenCob.gestionesPorEstado?.[estado] ?? 0;
                  const fgVar = `var(--mui-palette-status-${roleForEstado(estado)}-fg)`;
                  return (
                    <Grid item xs={6} sm={4} key={estado}>
                      <KpiCard
                        title={ESTADO_GESTION_COBRANZA_LABELS[estado]}
                        value={count}
                        icon={<CheckCircle sx={{ color: fgVar, fontSize: 28 }} />}
                        color={fgVar}
                        to={linkEstado(estado)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
