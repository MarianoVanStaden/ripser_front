import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  ShowChart as ShowChartIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';
import type { FlujoCajaKPIs } from '../../../../types';
import { formatCurrency, formatPercentage, getPaymentMethodLabel, getPaymentMethodIcon } from '../../../../utils/flujoCajaUtils';

interface FlujoCajaKPICardsProps {
  kpis: FlujoCajaKPIs;
  loading?: boolean;
}

const FlujoCajaKPICards: React.FC<FlujoCajaKPICardsProps> = ({ kpis, loading = false }) => {
  const MetodoPagoIcon = getPaymentMethodIcon(kpis.metodoPagoMasUsado.metodo);

  const kpiCards = [
    {
      title: 'Total Ingresos',
      value: formatCurrency(kpis.totalIngresos),
      icon: TrendingUpIcon,
      color: 'success.main',
      bgColor: 'success.lighter',
      subtitle: `${kpis.totalMovimientos > 0 ? Math.round((kpis.totalIngresos / (kpis.totalIngresos + kpis.totalEgresos)) * 100) : 0}% del total`,
    },
    {
      title: 'Total Egresos',
      value: formatCurrency(kpis.totalEgresos),
      icon: TrendingDownIcon,
      color: 'error.main',
      bgColor: 'error.lighter',
      subtitle: `${kpis.totalMovimientos > 0 ? Math.round((kpis.totalEgresos / (kpis.totalIngresos + kpis.totalEgresos)) * 100) : 0}% del total`,
    },
    {
      title: 'Flujo Neto',
      value: formatCurrency(kpis.flujoNeto),
      icon: AttachMoneyIcon,
      color: kpis.flujoNeto >= 0 ? 'primary.main' : 'warning.main',
      bgColor: kpis.flujoNeto >= 0 ? 'primary.lighter' : 'warning.lighter',
      subtitle: kpis.flujoNeto >= 0 ? 'Superávit' : 'Déficit',
    },
    {
      title: 'Total Movimientos',
      value: kpis.totalMovimientos.toString(),
      icon: ReceiptIcon,
      color: 'info.main',
      bgColor: 'info.lighter',
      subtitle: 'Transacciones',
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(kpis.ticketPromedio),
      icon: MonetizationOnIcon,
      color: 'secondary.main',
      bgColor: 'secondary.lighter',
      subtitle: 'Por transacción',
    },
    {
      title: 'Mayor Transacción',
      value: formatCurrency(Math.max(kpis.mayorIngreso.importe, kpis.mayorEgreso.importe)),
      icon: ShowChartIcon,
      color: 'warning.main',
      bgColor: 'warning.lighter',
      subtitle: kpis.mayorIngreso.importe > kpis.mayorEgreso.importe
        ? `Ingreso: ${kpis.mayorIngreso.entidad}`
        : `Egreso: ${kpis.mayorEgreso.entidad}`,
    },
    {
      title: 'Método Más Usado',
      value: getPaymentMethodLabel(kpis.metodoPagoMasUsado.metodo),
      icon: MetodoPagoIcon,
      color: 'primary.main',
      bgColor: 'primary.lighter',
      subtitle: `${kpis.metodoPagoMasUsado.cantidad} (${formatPercentage(kpis.metodoPagoMasUsado.porcentaje)})`,
    },
    {
      title: 'Promedio Diario',
      value: formatCurrency(kpis.promedioIngresoDiario - kpis.promedioEgresoDiario),
      icon: ShowChartIcon,
      color: (kpis.promedioIngresoDiario - kpis.promedioEgresoDiario) >= 0 ? 'success.main' : 'error.main',
      bgColor: (kpis.promedioIngresoDiario - kpis.promedioEgresoDiario) >= 0 ? 'success.lighter' : 'error.lighter',
      subtitle: 'Flujo neto por día',
    },
  ];

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ height: 100 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {kpiCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: card.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ color: card.color, fontSize: 28 }} />
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{
                        color: card.color,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {card.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {card.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default React.memo(FlujoCajaKPICards);
