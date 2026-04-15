import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartData } from 'chart.js';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { TimeSeriesData } from '../../../../types';
import { lineChartOptions, chartColors } from '../../../../config/chartConfig';

// Extender dayjs con el plugin de semana
dayjs.extend(weekOfYear);

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CashFlowLineChartProps {
  data: TimeSeriesData[];
  loading?: boolean;
  defaultGranularity?: 'day' | 'week' | 'month';
}

const CashFlowLineChart: React.FC<CashFlowLineChartProps> = ({
  data,
  loading = false,
  defaultGranularity = 'day',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>(defaultGranularity);

  // Función para formatear las fechas según granularidad
  const formatLabel = (fecha: string): string => {
    const date = dayjs(fecha);
    switch (granularity) {
      case 'day':
        return date.format('DD/MM');
      case 'week':
        return `Sem ${date.week()}`;
      case 'month':
        return date.format('MMM YYYY');
      default:
        return date.format('DD/MM/YYYY');
    }
  };

  // Agrupar datos según granularidad
  const aggregateData = (dataToAggregate: TimeSeriesData[]): TimeSeriesData[] => {
    if (granularity === 'day') return dataToAggregate;

    const grouped = new Map<string, TimeSeriesData>();

    dataToAggregate.forEach((item) => {
      const date = dayjs(item.fecha);
      let key: string;

      if (granularity === 'week') {
        key = date.startOf('week').format('YYYY-MM-DD');
      } else {
        // month
        key = date.startOf('month').format('YYYY-MM-DD');
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          fecha: key,
          ingresos: 0,
          egresos: 0,
          flujoNeto: 0,
        });
      }

      const current = grouped.get(key)!;
      current.ingresos += item.ingresos;
      current.egresos += item.egresos;
      current.flujoNeto += item.flujoNeto;
    });

    return Array.from(grouped.values()).sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  };

  const aggregatedData = aggregateData(data);

  // Preparar datos para el gráfico
  const chartData: ChartData<'line'> = {
    labels: aggregatedData.map((item) => formatLabel(item.fecha)),
    datasets: [
      {
        label: 'Ingresos',
        data: aggregatedData.map((item) => item.ingresos),
        borderColor: chartColors.ingresos,
        backgroundColor: chartColors.ingresosAlpha,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Egresos',
        data: aggregatedData.map((item) => item.egresos),
        borderColor: chartColors.egresos,
        backgroundColor: chartColors.egresosAlpha,
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Flujo Neto',
        data: aggregatedData.map((item) => item.flujoNeto),
        borderColor: chartColors.flujoNeto,
        backgroundColor: chartColors.flujoNetoAlpha,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const handleGranularityChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGranularity: 'day' | 'week' | 'month' | null
  ) => {
    if (newGranularity !== null) {
      setGranularity(newGranularity);
    }
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
    <Paper id="flujo-line-chart" sx={{ p: { xs: 2, sm: 3 }, height: { xs: 'auto', sm: 450 } }}>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={2}
        gap={{ xs: 2, sm: 0 }}
      >
        <Box>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
            Evolución del Flujo de Caja
          </Typography>
          {!isMobile && (
            <Typography variant="body2" color="text.secondary">
              Tendencia temporal de ingresos y egresos
            </Typography>
          )}
        </Box>
        <ToggleButtonGroup
          value={granularity}
          exclusive
          onChange={handleGranularityChange}
          size="small"
          aria-label="granularity"
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          <ToggleButton value="day" aria-label="day" sx={{ flex: { xs: 1, sm: 'initial' } }}>
            Día
          </ToggleButton>
          <ToggleButton value="week" aria-label="week" sx={{ flex: { xs: 1, sm: 'initial' } }}>
            Semana
          </ToggleButton>
          <ToggleButton value="month" aria-label="month" sx={{ flex: { xs: 1, sm: 'initial' } }}>
            Mes
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          height: { xs: 300, sm: 340 },
          position: 'relative',
          mt: 2,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Line
          data={chartData}
          options={{
            ...lineChartOptions,
            maintainAspectRatio: false,
            responsive: true,
          }}
        />
      </Box>
    </Paper>
  );
};

export default React.memo(CashFlowLineChart);
