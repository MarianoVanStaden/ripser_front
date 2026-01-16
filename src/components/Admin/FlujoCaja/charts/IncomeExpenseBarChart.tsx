import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData } from 'chart.js';
import type { PaymentMethodAggregation } from '../../../../types';
import { getPaymentMethodLabel } from '../../../../utils/flujoCajaUtils';
import { barChartOptions, chartColors } from '../../../../config/chartConfig';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IncomeExpenseBarChartProps {
  data: PaymentMethodAggregation[];
  loading?: boolean;
}

const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({
  data,
  loading = false,
}) => {
  // Preparar datos para el gráfico
  const chartData: ChartData<'bar'> = {
    labels: data.map((item) => getPaymentMethodLabel(item.metodoPago)),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map((item) => item.totalIngresos),
        backgroundColor: chartColors.ingresos,
        borderColor: chartColors.ingresos,
        borderWidth: 1,
      },
      {
        label: 'Egresos',
        data: data.map((item) => item.totalEgresos),
        backgroundColor: chartColors.egresos,
        borderColor: chartColors.egresos,
        borderWidth: 1,
      },
    ],
  };

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
    <Paper sx={{ p: 3, height: 450 }}>
      <Typography variant="h6" gutterBottom>
        Ingresos vs Egresos
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Comparación por método de pago
      </Typography>
      <Box sx={{ height: 350, position: 'relative', mt: 2 }}>
        <Bar data={chartData} options={barChartOptions} />
      </Box>
    </Paper>
  );
};

export default React.memo(IncomeExpenseBarChart);
