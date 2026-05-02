import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Button, Tooltip,
} from '@mui/material';
import {
  Gavel, Warning, AttachMoney, Schedule, CheckCircle,
  PhoneCallback, Refresh, List as ListIcon, Handshake,
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

export const CobranzasResumenPage: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <Box>
      <LoadingOverlay open={loading} message="Cargando cobranzas..." />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Resumen de Cobranzas</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          {/* KPIs principales */}
          <Typography variant="h6" gutterBottom>General</Typography>
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
                title="Promesas Incumplidas"
                value={resumen.promesasIncumplidas}
                icon={<Warning sx={{ color: '#F44336', fontSize: 28 }} />}
                color="#F44336"
                subtitle="Prometieron pagar y no lo hicieron"
                to={linkPromesasIncumplidas}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Vencidas Hoy"
                value={resumen.gestionesVencidasHoy}
                icon={<Schedule sx={{ color: '#E91E63', fontSize: 28 }} />}
                color="#E91E63"
                subtitle="Sin acción registrada"
                to={linkVencidasHoy}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Recordatorios Pendientes"
                value={resumen.recordatoriosPendientesAgente}
                icon={<Gavel sx={{ color: '#9C27B0', fontSize: 28 }} />}
                color="#9C27B0"
                to={linkRecordatoriosPendientes}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Promesas Vencen Hoy"
                value={resumen.promesasVigentesHoy}
                icon={<Handshake sx={{ color: '#9C27B0', fontSize: 28 }} />}
                color="#9C27B0"
                subtitle="Verificar si cumplieron"
                to={linkPromesasVencenHoy}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                title="Sin Gestión con Mora"
                value={resumen.sinGestionConMora}
                icon={<Warning sx={{ color: '#FF5722', fontSize: 28 }} />}
                color="#FF5722"
                subtitle="Créditos personales que necesitan apertura"
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

          {/* Por estado */}
          <Typography variant="h6" gutterBottom>Por Estado</Typography>
          <Grid container spacing={3}>
            {(Object.keys(EstadoGestionCobranza) as (keyof typeof EstadoGestionCobranza)[]).map((key) => {
              const estado = EstadoGestionCobranza[key];
              const count = resumen.gestionesPorEstado?.[estado] ?? 0;
              const color = ESTADO_GESTION_COBRANZA_COLORS[estado];
              return (
                <Grid item xs={6} sm={4} md={3} key={estado}>
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
        </>
      )}
    </Box>
  );
};
