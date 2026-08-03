import React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  PointOfSale as PointOfSaleIcon,
  Paid as PaidIcon,
  CreditScore as CreditScoreIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { documentoApi } from '../../../api/services/documentoApi';
import { FinanciadasPorPlanChart } from './FinanciadasPorPlanChart';
import { TopModelosChart } from './TopModelosChart';
import { VentasPorProvinciaChart } from './VentasPorProvinciaChart';
import { AnulacionesPorMotivoChart } from './AnulacionesPorMotivoChart';

interface Props {
  empresaId: number | null;
  sucursalId: number | null;
  /** ISO yyyy-mm-dd, inclusive. */
  desde: string;
  hasta: string;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactElement;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Box sx={{ color, display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Paper>
);

/**
 * Sección "Ventas del mes" del Dashboard de Ventas: cantidades de facturación
 * del período (solo counts, sin montos). Requiere rol de gestión — no montar
 * para VENDEDOR (el endpoint devuelve 403).
 */
export const VentasMesSection: React.FC<Props> = ({ empresaId, sucursalId, desde, hasta }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ventas-dashboard', empresaId, sucursalId, desde, hasta],
    queryFn: () => documentoApi.getDashboardVentas(desde, hasta, sucursalId ?? undefined),
    refetchInterval: 5 * 60_000,
  });

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PointOfSaleIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Ventas del Mes
          </Typography>
        </Box>

        {isError && (
          <Alert severity="error">No se pudieron cargar las métricas de ventas.</Alert>
        )}

        {isLoading && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={90} />
            <Skeleton variant="rounded" height={260} />
          </Stack>
        )}

        {data && (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 1.5,
                mb: 2,
              }}
            >
              <StatCard
                title="Ventas totales"
                value={data.totalVentas}
                icon={<PointOfSaleIcon fontSize="large" />}
                color="#144272"
              />
              <StatCard
                title="Con cobro total"
                value={data.ventasCobradasTotal}
                subtitle={
                  data.totalVentas > 0
                    ? `${Math.round((data.ventasCobradasTotal / data.totalVentas) * 100)}% de las ventas`
                    : undefined
                }
                icon={<PaidIcon fontSize="large" />}
                color="#2e7d32"
              />
              <StatCard
                title="Financiadas"
                value={data.ventasFinanciadas}
                subtitle={
                  data.totalVentas > 0
                    ? `${Math.round((data.ventasFinanciadas / data.totalVentas) * 100)}% de las ventas`
                    : undefined
                }
                icon={<CreditScoreIcon fontSize="large" />}
                color="#ed6c02"
              />
              <StatCard
                title="Anulaciones"
                value={data.totalAnulaciones}
                icon={<CancelIcon fontSize="large" />}
                color="#d32f2f"
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <FinanciadasPorPlanChart data={data.financiadasPorPlan} />
              <TopModelosChart data={data.topModelos} />
              <VentasPorProvinciaChart data={data.ventasPorProvincia} />
              <AnulacionesPorMotivoChart
                data={data.anulacionesPorMotivo}
                total={data.totalAnulaciones}
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
