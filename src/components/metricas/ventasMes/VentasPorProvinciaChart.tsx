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

const BAR_COLOR = '#144272';

interface Props {
  data: { provincia: string; cantidad: number }[];
}

const formatProvincia = (p: string) =>
  p === 'Sin provincia' ? p : p.replaceAll('_', ' ');

/** Ventas por provincia (envío con fallback a la del cliente) — barras horizontales. */
export const VentasPorProvinciaChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map((d) => ({ ...d, provincia: formatProvincia(d.provincia) }));
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Ventas por Provincia
        </Typography>
        {chartData.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Sin ventas en el período
          </Typography>
        ) : (
          <Box sx={{ height: Math.max(200, chartData.length * 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="provincia" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v ?? 0, 'Ventas']} />
                <Bar dataKey="cantidad" fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
