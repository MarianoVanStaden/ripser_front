import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import type { PaymentMethodAggregation, TimeSeriesData } from '../../../../types';
import PaymentMethodPieChart from '../charts/PaymentMethodPieChart';
import IncomeExpenseBarChart from '../charts/IncomeExpenseBarChart';
import CashFlowLineChart from '../charts/CashFlowLineChart';

interface FlujoCajaChartsProps {
  paymentMethodData: PaymentMethodAggregation[];
  timeSeriesData: TimeSeriesData[];
  onPaymentMethodClick?: (metodoPago: string) => void;
  loading?: boolean;
  granularity?: 'day' | 'week' | 'month';
}

const FlujoCajaCharts: React.FC<FlujoCajaChartsProps> = ({
  paymentMethodData,
  timeSeriesData,
  onPaymentMethodClick,
  loading = false,
  granularity = 'day',
}) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Visualizaciones
      </Typography>
      <Grid container spacing={3}>
        {/* Pie Chart - Distribución por método de pago */}
        <Grid item xs={12} lg={4}>
          <PaymentMethodPieChart
            data={paymentMethodData}
            onSliceClick={onPaymentMethodClick}
            loading={loading}
          />
        </Grid>

        {/* Bar Chart - Ingresos vs Egresos */}
        <Grid item xs={12} lg={4}>
          <IncomeExpenseBarChart data={paymentMethodData} loading={loading} />
        </Grid>

        {/* Line Chart - Evolución temporal */}
        <Grid item xs={12} lg={4}>
          <CashFlowLineChart
            data={timeSeriesData}
            loading={loading}
            defaultGranularity={granularity}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default React.memo(FlujoCajaCharts);
