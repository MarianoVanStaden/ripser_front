import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Button, Paper, Stack,
  Chip, Divider, LinearProgress,
} from '@mui/material';
import {
  TrendingUp, Warning, Gavel, CheckCircle,
  AttachMoney, MoneyOff, Schedule, Refresh,
  ArrowForward, List as ListIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import type { ResumenPrestamosDTO } from '../../types/prestamo.types';
import {
  CategoriaPrestamo, CATEGORIA_PRESTAMO_LABELS, CATEGORIA_PRESTAMO_COLORS,
} from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';
import LoadingOverlay from '../common/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';

const LISTA = '/prestamos/lista';

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
          <Box sx={{ bgcolor: `${color}15`, borderRadius: '50%', p: 1.5, display: 'flex' }}>
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

export const PrestamosResumenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenPrestamosDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResumen = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await prestamoPersonalApi.getResumen();
      setResumen(data);
    } catch (err) {
      console.error('Error loading resumen:', err);
      setError('Error al cargar el resumen. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumen();
  }, []);

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

  const saludo = getSaludo();
  const firstName = getFirstName(user);

  return (
    <Box>
      <LoadingOverlay open={loading} message="Cargando créditos personales..." />

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
            {formatFechaLarga(new Date())} · Resumen de Créditos Personales
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadResumen}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<ListIcon />} onClick={() => navigate(LISTA)}>
            Ver Todos
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {resumen && (
        <>
          {/* Panorama general */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Panorama General</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <KpiCard title="Activos" value={resumen.prestamosActivos}
                icon={<TrendingUp sx={{ color: '#4CAF50', fontSize: 28 }} />} color="#4CAF50"
                to={`${LISTA}?estados=ACTIVO`} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <KpiCard title="En Mora" value={resumen.prestamosEnMora}
                icon={<Warning sx={{ color: '#FF9800', fontSize: 28 }} />} color="#FF9800"
                to={`${LISTA}?estados=EN_MORA`} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <KpiCard title="En Legal" value={resumen.prestamosEnLegal}
                icon={<Gavel sx={{ color: '#F44336', fontSize: 28 }} />} color="#F44336"
                to={`${LISTA}?estados=EN_LEGAL`} />
            </Grid>
          </Grid>

          {/* Montos + cartera */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney sx={{ color: '#1976d2' }} />
                  <Typography variant="h6" fontWeight={700}>Cartera</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">Cobrado sobre prestado</Typography>
                <Typography variant="h3" fontWeight={700} color="#4CAF50" sx={{ mb: 1 }}>{pctCobrado}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={pctCobrado}
                  sx={{
                    height: 10, borderRadius: 5, bgcolor: 'rgba(76,175,80,0.15)',
                    '& .MuiLinearProgress-bar': { bgcolor: '#4CAF50' },
                  }}
                />
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <AttachMoney sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: '#1976d2' }} />
                      Prestado
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>{formatPrice(resumen.montoTotalPrestado)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <CheckCircle sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: '#4CAF50' }} />
                      Cobrado
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#4CAF50">{formatPrice(resumen.montoTotalCobrado)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      <MoneyOff sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle', color: '#FF9800' }} />
                      Pendiente
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="#FF9800">{formatPrice(resumen.montoTotalPendiente)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Cartera por Categoría</Typography>
                {categoriasCartera.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Sin datos de categorías.</Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {categoriasCartera.map(({ cat, count, pct }) => {
                      const color = CATEGORIA_PRESTAMO_COLORS[cat];
                      return (
                        <Box
                          key={cat}
                          component={RouterLink}
                          to={`${LISTA}?categorias=${cat}`}
                          sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                            <Chip label={CATEGORIA_PRESTAMO_LABELS[cat]} size="small"
                              sx={{ bgcolor: color, color: '#fff', fontWeight: 600 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={700}>{count}</Typography>
                              <ArrowForward sx={{ color: 'text.secondary', fontSize: 16 }} />
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 8, borderRadius: 4, bgcolor: `${color}22`,
                              '& .MuiLinearProgress-bar': { bgcolor: color },
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

          {/* Cuotas KPIs */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Cuotas</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Cuotas Vencidas" value={resumen.cuotasVencidas}
                icon={<Schedule sx={{ color: '#F44336', fontSize: 28 }} />} color="#F44336"
                to={`${LISTA}?estados=EN_MORA`} subtitle="En toda la cartera" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Próximas a Vencer" value={resumen.cuotasProximasAVencer}
                icon={<Schedule sx={{ color: '#FF9800', fontSize: 28 }} />} color="#FF9800"
                subtitle="Próximos días" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard title="Finalizados" value={resumen.prestamosFinalizados}
                icon={<CheckCircle sx={{ color: '#2196F3', fontSize: 28 }} />} color="#2196F3"
                to={`${LISTA}?estados=FINALIZADO`} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};
