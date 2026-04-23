import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PaymentMethodAggregation } from '../../../../types';
import { getPaymentMethodLabel } from '../../../../utils/flujoCajaUtils';
import { chartColors, formatARS } from '../../../../config/chartConfig';

interface IncomeExpenseBarChartProps {
  data: PaymentMethodAggregation[];
  loading?: boolean;
}

const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({
  data,
  loading = false,
}) => {
  const chartData = data.map((item) => ({
    name: getPaymentMethodLabel(item.metodoPago),
    Ingresos: item.totalIngresos,
    Egresos: item.totalEgresos,
  }));

  if (loading) {
    return (
      <Paper sx={{ p: 3, height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No hay datos para mostrar
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper id="flujo-bar-chart" sx={{ p: 3, height: 450 }}>
      <Typography variant="h6" gutterBottom>
        Ingresos vs Egresos
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Comparación por método de pago
      </Typography>
      <Box sx={{ height: 350, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatARS} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => formatARS(value as number)} />
            <Legend />
            <Bar dataKey="Ingresos" fill={chartColors.ingresos} />
            <Bar dataKey="Egresos" fill={chartColors.egresos} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(IncomeExpenseBarChart);
