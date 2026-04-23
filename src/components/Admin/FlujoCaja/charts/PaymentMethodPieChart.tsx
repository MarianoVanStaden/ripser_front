import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PaymentMethodAggregation } from '../../../../types';
import { getPaymentMethodLabel, getPaymentMethodColor } from '../../../../utils/flujoCajaUtils';
import { formatARS } from '../../../../config/chartConfig';

interface PaymentMethodPieChartProps {
  data: PaymentMethodAggregation[];
  onSliceClick?: (metodoPago: string) => void;
  loading?: boolean;
}

const PaymentMethodPieChart: React.FC<PaymentMethodPieChartProps> = ({
  data,
  onSliceClick,
  loading = false,
}) => {
  const chartData = data.map((item) => ({
    name: getPaymentMethodLabel(item.metodoPago),
    value: item.totalIngresos + item.totalEgresos,
    color: getPaymentMethodColor(item.metodoPago),
    metodoPago: item.metodoPago,
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
    <Paper id="flujo-pie-chart" sx={{ p: 3, height: 450 }}>
      <Typography variant="h6" gutterBottom>
        Distribución por Método de Pago
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Porcentaje del total de transacciones
      </Typography>
      <Box sx={{ height: 350, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              onClick={(slice: any) => {
                if (onSliceClick && slice?.payload?.metodoPago) {
                  onSliceClick(slice.payload.metodoPago);
                }
              }}
              cursor={onSliceClick ? 'pointer' : 'default'}
            >
              {chartData.map((entry) => (
                <Cell key={entry.metodoPago} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, props: any) => {
                const v = typeof value === 'number' ? value : Number(value);
                const total = chartData.reduce((sum, d) => sum + d.value, 0);
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0.0';
                return [`${formatARS(v)} (${pct}%)`, props?.payload?.name ?? ''];
              }}
            />
            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(PaymentMethodPieChart);
