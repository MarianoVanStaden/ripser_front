import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid2 as Grid,
  IconButton,
  Paper,
  Skeleton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import type { CajaAhorroDolares } from '../../../../types';

const ARG2 = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtUSD = (n: number) => `USD ${ARG2.format(n)}`;

// ─── Summary KPI mini-card ────────────────────────────────────────────────────
interface KpiMiniProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bgColor: string;
  loading?: boolean;
}

const KpiMini: React.FC<KpiMiniProps> = ({
  icon, label, value, sub, color, bgColor, loading,
}) => (
  <Box display="flex" alignItems="center" gap={1.5}>
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box sx={{ color, fontSize: 22, display: 'flex' }}>{icon}</Box>
    </Box>
    <Box minWidth={0}>
      <Typography variant="caption" color="text.secondary" noWrap display="block">
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={90} height={24} />
      ) : (
        <Typography variant="subtitle1" fontWeight={700} noWrap>
          {value}
        </Typography>
      )}
      {sub && !loading && (
        <Typography variant="caption" color="text.secondary" noWrap display="block">
          {sub}
        </Typography>
      )}
    </Box>
  </Box>
);

// ─── Individual caja card ─────────────────────────────────────────────────────
interface CajaCardProps {
  caja: CajaAhorroDolares;
  onClick: () => void;
}

const CajaCard: React.FC<CajaCardProps> = ({ caja, onClick }) => {
  const theme = useTheme();
  const activa = caja.estado === 'ACTIVA';

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        opacity: activa ? 1 : 0.55,
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': activa
          ? {
              borderColor: theme.palette.success.main,
              boxShadow: `0 0 0 2px ${theme.palette.success.light}40`,
              transform: 'translateY(-2px)',
            }
          : {},
      }}
    >
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Header row */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={0.75} sx={{ flex: 1, minWidth: 0, mr: 1 }}>
            <SavingsIcon
              sx={{
                fontSize: 18,
                color: activa ? 'success.main' : 'text.disabled',
                flexShrink: 0,
              }}
            />
            <Tooltip title={caja.nombre} placement="top">
              <Typography
                variant="subtitle2"
                fontWeight={700}
                noWrap
                sx={{ lineHeight: 1.3 }}
              >
                {caja.nombre}
              </Typography>
            </Tooltip>
          </Box>
          <Chip
            label={activa ? 'Activa' : 'Inactiva'}
            color={activa ? 'success' : 'default'}
            size="small"
            sx={{ height: 20, fontSize: 10, flexShrink: 0 }}
          />
        </Box>

        {/* Saldo */}
        <Typography
          variant="h6"
          fontWeight={800}
          color={activa ? 'success.main' : 'text.disabled'}
          sx={{ letterSpacing: '-0.5px', mt: 0.5 }}
        >
          {fmtUSD(caja.saldoActual)}
        </Typography>

        {/* Descripción truncada */}
        {caja.descripcion && (
          <Tooltip title={caja.descripcion} placement="bottom">
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              noWrap
              mt={0.5}
            >
              {caja.descripcion}
            </Typography>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Skeleton para cards ──────────────────────────────────────────────────────
const CajaCardSkeleton: React.FC = () => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent sx={{ pb: '12px !important' }}>
      <Box display="flex" justifyContent="space-between" mb={1}>
        <Skeleton width="60%" height={20} />
        <Skeleton width={50} height={20} />
      </Box>
      <Skeleton width="80%" height={32} />
      <Skeleton width="50%" height={16} sx={{ mt: 0.5 }} />
    </CardContent>
  </Card>
);

// ─── Main component ───────────────────────────────────────────────────────────
const CajasAhorroUSDSection: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [cajas, setCajas] = useState<CajaAhorroDolares[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    cajasAhorroApi
      .getAll()
      .then((data) => {
        if (!cancelled) {
          setCajas(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            typeof err?.response?.data === 'string'
              ? err.response.data
              : err?.message ?? 'Error al cargar cajas de ahorro';
          setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activas = cajas.filter((c) => c.estado === 'ACTIVA');
  const totalUSD = activas.reduce((acc, c) => acc + c.saldoActual, 0);
  const mayorCaja = activas.length > 0
    ? activas.reduce((best, c) => (c.saldoActual > best.saldoActual ? c : best), activas[0])
    : null;

  // Si no hay cajas y no está cargando, no renderizar nada
  if (!loading && !error && cajas.length === 0) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        borderColor: theme.palette.success.light,
        borderWidth: 1.5,
      }}
    >
      {/* Header strip */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
          px: { xs: 2, sm: 3 },
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.25}>
          <SavingsIcon sx={{ color: 'white', fontSize: 26 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="white" lineHeight={1.2}>
              Reservas en USD
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Cajas de ahorro en dólares
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Ver detalle completo">
          <IconButton
            size="small"
            onClick={() => navigate('/admin/cajas-ahorro')}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box px={{ xs: 2, sm: 3 }} pt={2.5} pb={3}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary KPIs row */}
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <KpiMini
              icon={<TrendingUpIcon fontSize="inherit" />}
              label="Total acumulado"
              value={fmtUSD(totalUSD)}
              sub={`en ${activas.length} caja${activas.length !== 1 ? 's' : ''} activa${activas.length !== 1 ? 's' : ''}`}
              color={theme.palette.success.main}
              bgColor={`${theme.palette.success.main}18`}
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <KpiMini
              icon={<AccountBalanceWalletIcon fontSize="inherit" />}
              label="Cajas registradas"
              value={loading ? '—' : `${cajas.length} total`}
              sub={
                !loading && cajas.length > activas.length
                  ? `${cajas.length - activas.length} inactiva${cajas.length - activas.length !== 1 ? 's' : ''}`
                  : undefined
              }
              color={theme.palette.info.main}
              bgColor={`${theme.palette.info.main}18`}
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <KpiMini
              icon={<EmojiEventsIcon fontSize="inherit" />}
              label="Mayor saldo"
              value={mayorCaja ? fmtUSD(mayorCaja.saldoActual) : '—'}
              sub={mayorCaja?.nombre}
              color={theme.palette.warning.main}
              bgColor={`${theme.palette.warning.main}18`}
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Caja cards grid */}
        <Grid container spacing={2}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <CajaCardSkeleton />
                </Grid>
              ))
            : cajas.map((caja) => (
                <Grid key={caja.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <CajaCard
                    caja={caja}
                    onClick={() => navigate(`/admin/cajas-ahorro/${caja.id}`)}
                  />
                </Grid>
              ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default CajasAhorroUSDSection;
