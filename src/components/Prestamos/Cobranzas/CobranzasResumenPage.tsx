import { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Button,
} from '@mui/material';
import {
  Gavel, Warning, AttachMoney, Schedule, CheckCircle,
  PhoneCallback, Refresh, List as ListIcon, Handshake,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import type { ResumenCobranzaDTO } from '../../../types/cobranza.types';
import {
  ESTADO_GESTION_COBRANZA_LABELS,
  ESTADO_GESTION_COBRANZA_COLORS,
  EstadoGestionCobranza,
} from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import LoadingOverlay from '../../common/LoadingOverlay';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, onClick }) => (
  <Card
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
      transition: 'all 0.2s ease-in-out',
    }}
    onClick={onClick}
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
              <StatCard
                title="Gestiones Activas"
                value={resumen.totalGestionesActivas}
                icon={<PhoneCallback sx={{ color: '#1976d2', fontSize: 28 }} />}
                color="#1976d2"
                onClick={() => navigate('/cobranzas/lista')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Monto Total Pendiente"
                value={formatPrice(resumen.totalMontoPendiente)}
                icon={<AttachMoney sx={{ color: '#FF9800', fontSize: 28 }} />}
                color="#FF9800"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Promesas Incumplidas"
                value={resumen.promesasIncumplidas}
                icon={<Warning sx={{ color: '#F44336', fontSize: 28 }} />}
                color="#F44336"
                subtitle="Prometieron pagar y no lo hicieron"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Vencidas Hoy"
                value={resumen.gestionesVencidasHoy}
                icon={<Schedule sx={{ color: '#E91E63', fontSize: 28 }} />}
                color="#E91E63"
                subtitle="Sin acción registrada"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Recordatorios Pendientes"
                value={resumen.recordatoriosPendientesAgente}
                icon={<Gavel sx={{ color: '#9C27B0', fontSize: 28 }} />}
                color="#9C27B0"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Promesas Vencen Hoy"
                value={resumen.promesasVigentesHoy}
                icon={<Handshake sx={{ color: '#9C27B0', fontSize: 28 }} />}
                color="#9C27B0"
                subtitle="Verificar si cumplieron"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Sin Gestión con Mora"
                value={resumen.sinGestionConMora}
                icon={<Warning sx={{ color: '#FF5722', fontSize: 28 }} />}
                color="#FF5722"
                subtitle="Préstamos que necesitan apertura"
                onClick={() => navigate('/cobranzas/lista')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Cuotas Vencidas Total"
                value={resumen.cuotasVencidasTotal}
                icon={<Schedule sx={{ color: '#795548', fontSize: 28 }} />}
                color="#795548"
                subtitle="En toda la empresa"
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
                  <StatCard
                    title={ESTADO_GESTION_COBRANZA_LABELS[estado]}
                    value={count}
                    icon={<CheckCircle sx={{ color, fontSize: 28 }} />}
                    color={color}
                    onClick={
                      estado === 'NUEVA' || estado === 'EN_GESTION'
                        ? () => navigate('/cobranzas/lista')
                        : undefined
                    }
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
