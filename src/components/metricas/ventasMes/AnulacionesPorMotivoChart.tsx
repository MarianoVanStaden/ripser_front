import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Identidad por motivo: hues fijos (azul/naranja/violeta) + gris para "Sin especificar".
const MOTIVO_CONFIG: Record<string, { label: string; color: string }> = {
  DEVOLUCION_EQUIPO: { label: 'Devolución de equipo', color: '#0288d1' },
  ERROR_FACTURACION: { label: 'Error de facturación', color: '#ed6c02' },
  OTRO: { label: 'Otro', color: '#7b1fa2' },
  SIN_ESPECIFICAR: { label: 'Sin especificar', color: '#9e9e9e' },
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
    color: MOTIVO_CONFIG[d.motivo]?.color ?? '#9e9e9e',
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
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v ?? 0, 'Notas de Crédito']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
