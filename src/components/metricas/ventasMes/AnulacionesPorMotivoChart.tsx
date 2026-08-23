import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_SERIES, CHART_TOOLTIP_BG, CHART_TOOLTIP_TEXT } from '../../../theme/chartTokens';

// Identidad por motivo: series del theme con hue equivalente al original
// (azul/naranja/violeta + gris para "Sin especificar"), estable por motivo.
const MOTIVO_CONFIG: Record<string, { label: string; color: string }> = {
  DEVOLUCION_EQUIPO: { label: 'Devolución de equipo', color: CHART_SERIES[0] },
  ERROR_FACTURACION: { label: 'Error de facturación', color: CHART_SERIES[1] },
  OTRO: { label: 'Otro', color: CHART_SERIES[3] },
  SIN_ESPECIFICAR: { label: 'Sin especificar', color: CHART_SERIES[7] },
};

interface Props {
  data: { motivo: string; cantidad: number }[];
  total: number;
}

/** Anulaciones (NC) del período por motivo — donut con leyenda. */
export const AnulacionesPorMotivoChart: React.FC<Props> = ({ data, total }) => {
  const chartData = data.map((d) => ({
    name: MOTIVO_CONFIG[d.motivo]?.label ?? d.motivo,
    value: d.cantidad,
    color: MOTIVO_CONFIG[d.motivo]?.color ?? CHART_SERIES[7],
  }));

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Anulaciones del Período ({total})
        </Typography>
        {chartData.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Sin anulaciones en el período
          </Typography>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="var(--mui-palette-background-paper)"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v ?? 0, 'Notas de Crédito']} contentStyle={{ backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
