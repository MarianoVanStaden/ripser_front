import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { CHART_SERIES, CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from '../../../theme/chartTokens';

const BAR_COLOR = CHART_SERIES[0];

interface Props {
  data: { plan: string; cantidad: number }[];
}

/** Ventas financiadas por plan elegido — barras horizontales, un solo tono (magnitud). */
export const FinanciadasPorPlanChart: React.FC<Props> = ({ data }) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Financiadas por Plan
      </Typography>
      {data.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Sin ventas financiadas en el período
        </Typography>
      ) : (
        <Box sx={{ height: Math.max(200, data.length * 44) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_GRID} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: CHART_AXIS }} stroke={CHART_AXIS} />
              <YAxis
                type="category"
                dataKey="plan"
                width={150}
                tick={{ fontSize: 12, fill: CHART_AXIS }}
                stroke={CHART_AXIS}
              />
              <Tooltip formatter={(v) => [v ?? 0, 'Ventas']} contentStyle={{ backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT }} />
              <Bar dataKey="cantidad" fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </CardContent>
  </Card>
);
