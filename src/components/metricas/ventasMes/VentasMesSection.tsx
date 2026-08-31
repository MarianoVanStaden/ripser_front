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
  /** Filtro por vendedor asignado del documento (null = todos). */
  usuarioId?: number | null;
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
export const VentasMesSection: React.FC<Props> = ({ empresaId, sucursalId, usuarioId, desde, hasta }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ventas-dashboard', empresaId, sucursalId, usuarioId, desde, hasta],
    queryFn: () =>
      documentoApi.getDashboardVentas(desde, hasta, sucursalId ?? undefined, usuarioId ?? undefined),
    refetchInterval: 5 * 60_000,
  });

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PointOfSaleIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>
            Ventas del Período
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
                subtitle="no incluye anuladas"
                icon={<PointOfSaleIcon fontSize="large" />}
                color="primary.main"
              />
              <StatCard
                title="Efectivo"
                value={data.ventasEfectivo}
                subtitle={
                  data.totalVentas > 0
                    ? `${Math.round((data.ventasEfectivo / data.totalVentas) * 100)}% de las ventas · sin anuladas`
                    : 'sin anuladas'
                }
                icon={<PaidIcon fontSize="large" />}
                color="status.success.fg"
              />
              <StatCard
                title="Financiadas"
                value={data.ventasFinanciadas}
                subtitle={
                  data.totalVentas > 0
                    ? `${Math.round((data.ventasFinanciadas / data.totalVentas) * 100)}% de las ventas · sin anuladas`
                    : 'sin anuladas'
                }
                icon={<CreditScoreIcon fontSize="large" />}
                color="status.warning.fg"
              />
              <StatCard
                title="Anulaciones"
                value={data.totalAnulaciones}
                subtitle="NC emitidas en el período"
                icon={<CancelIcon fontSize="large" />}
                color="status.danger.fg"
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
