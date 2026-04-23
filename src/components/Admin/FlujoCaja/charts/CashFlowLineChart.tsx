import React, { useState } from 'react';
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
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import type { TimeSeriesData } from '../../../../types';
import { chartColors, formatARS } from '../../../../config/chartConfig';

dayjs.extend(weekOfYear);

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

  const formatLabel = (fecha: string): string => {
    const date = dayjs(fecha);
    switch (granularity) {
      case 'day':   return date.format('DD/MM');
      case 'week':  return `Sem ${date.week()}`;
      case 'month': return date.format('MMM YYYY');
      default:      return date.format('DD/MM/YYYY');
    }
  };

  const aggregateData = (dataToAggregate: TimeSeriesData[]): TimeSeriesData[] => {
    if (granularity === 'day') return dataToAggregate;

    const grouped = new Map<string, TimeSeriesData>();
    dataToAggregate.forEach((item) => {
      const date = dayjs(item.fecha);
      const key = granularity === 'week'
        ? date.startOf('week').format('YYYY-MM-DD')
        : date.startOf('month').format('YYYY-MM-DD');

      if (!grouped.has(key)) {
        grouped.set(key, { fecha: key, ingresos: 0, egresos: 0, flujoNeto: 0 });
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

  const chartData = aggregateData(data).map((item) => ({
    label: formatLabel(item.fecha),
    Ingresos: item.ingresos,
    Egresos: item.egresos,
    'Flujo Neto': item.flujoNeto,
  }));

  const handleGranularityChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGranularity: 'day' | 'week' | 'month' | null
  ) => {
    if (newGranularity !== null) setGranularity(newGranularity);
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
        <Typography color="text.secondary">No hay datos para mostrar</Typography>
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
          <ToggleButton value="day"   sx={{ flex: { xs: 1, sm: 'initial' } }}>Día</ToggleButton>
          <ToggleButton value="week"  sx={{ flex: { xs: 1, sm: 'initial' } }}>Semana</ToggleButton>
          <ToggleButton value="month" sx={{ flex: { xs: 1, sm: 'initial' } }}>Mes</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ height: { xs: 300, sm: 340 }, mt: 2, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={formatARS} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => formatARS(value as number)} />
            <Legend />
            {/* Área bajo el flujo neto — da sensación de volumen */}
            <Area
              type="monotone"
              dataKey="Flujo Neto"
              fill={chartColors.flujoNetoAlpha}
              stroke="none"
              legendType="none"
              isAnimationActive={false}
            />
            <Line type="monotone" dataKey="Ingresos"   stroke={chartColors.ingresos}  strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Egresos"    stroke={chartColors.egresos}   strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Flujo Neto" stroke={chartColors.flujoNeto} strokeWidth={3} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default React.memo(CashFlowLineChart);
