import React, { useState } from 'react';
import { Box, Card, CardContent, Stack, Switch, Typography } from '@mui/material';
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
const TOP = 5;

interface Props {
  data: { recetaId: number; modelo: string; tipoEquipo: string | null; unidades: number }[];
}

/** Modelos de equipos más vendidos — top 5 con toggle "ver todos". No netea NC. */
export const TopModelosChart: React.FC<Props> = ({ data }) => {
  const [verTodos, setVerTodos] = useState(false);
  const visible = verTodos ? data : data.slice(0, TOP);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle1" fontWeight={600}>
            Modelos Más Vendidos
          </Typography>
          {data.length > TOP && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Ver todos ({data.length})
              </Typography>
              <Switch size="small" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} />
            </Stack>
          )}
        </Stack>
        {visible.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Sin equipos vendidos en el período
          </Typography>
        ) : (
          <Box sx={{ height: Math.max(200, visible.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visible} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="modelo" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v ?? 0, 'Unidades']} />
                <Bar dataKey="unidades" fill={BAR_COLOR} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
