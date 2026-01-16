import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData } from 'chart.js';
import type { PaymentMethodAggregation } from '../../../../types';
import { getPaymentMethodLabel, getPaymentMethodColor } from '../../../../utils/flujoCajaUtils';
import { pieChartOptions } from '../../../../config/chartConfig';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

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
  // Preparar datos para el gráfico
  const chartData: ChartData<'doughnut'> = {
    labels: data.map((item) => getPaymentMethodLabel(item.metodoPago)),
    datasets: [
      {
        label: 'Distribución por Método de Pago',
        data: data.map((item) => item.totalIngresos + item.totalEgresos),
        backgroundColor: data.map((item) => getPaymentMethodColor(item.metodoPago)),
        borderColor: '#fff',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  // Configuración con evento de click
  const optionsWithClick = {
    ...pieChartOptions,
    onClick: (_event: any, elements: any) => {
      if (elements.length > 0 && onSliceClick) {
        const index = elements[0].index;
        const metodoPago = data[index].metodoPago;
        onSliceClick(metodoPago);
      }
    },
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
        Distribución por Método de Pago
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Porcentaje del total de transacciones
      </Typography>
      <Box sx={{ height: 350, position: 'relative', mt: 2 }}>
        <Doughnut data={chartData} options={optionsWithClick} />
      </Box>
    </Paper>
  );
};

export default React.memo(PaymentMethodPieChart);
