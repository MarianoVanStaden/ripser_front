import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_TEXT,
  chartSerie,
} from '../../theme/chartTokens';
import type { TipoEtapaFabricacion } from '../../types';

const TIPOS_ETAPA: TipoEtapaFabricacion[] = ['AISLACION', 'CHAPA', 'MOTOR', 'VIDRIOS'];

const AREA_LABELS: Record<TipoEtapaFabricacion, string> = {
  AISLACION: 'Aislación',
  CHAPA: 'Chapa',
  MOTOR: 'Motor',
  VIDRIOS: 'Vidrios',
};

const TOP_RESPONSABLES = 10;

const toISODate = (d: Date): string => d.toISOString().slice(0, 10);

const tooltipStyle = { backgroundColor: CHART_TOOLTIP_BG, color: CHART_TOOLTIP_TEXT };

const AnalisisPorAreaSection: React.FC = () => {
  const [desde, setDesde] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return toISODate(d);
  });
  const [hasta, setHasta] = useState<string>(() => toISODate(new Date()));

  const rangoValido = Boolean(desde && hasta && desde <= hasta);

  const kpisQuery = useQuery({
    queryKey: ['kpis-produccion', desde, hasta],
    queryFn: () => equipoFabricadoApi.getKpisProduccion(desde, hasta),
    enabled: rangoValido,
  });

  // Pivot: [{semana, AISLACION: n, CHAPA: n, ...}] ordenado por semana ISO.
  const throughputData = useMemo(() => {
    const porSemana = new Map<string, Record<string, number | string>>();
    (kpisQuery.data?.throughputSemanal ?? []).forEach((fila) => {
      const row = porSemana.get(fila.semana) ?? { semana: fila.semana };
      row[fila.tipoEtapa] = fila.cantidad;
      porSemana.set(fila.semana, row);
    });
    return Array.from(porSemana.values()).sort((a, b) =>
      String(a.semana).localeCompare(String(b.semana))
    );
  }, [kpisQuery.data]);

  const retrabajoData = kpisQuery.data?.retrabajoPorArea ?? [];

  const productividadData = useMemo(() => {
    const todos = kpisQuery.data?.productividadPorResponsable ?? [];
    const top = todos.slice(0, TOP_RESPONSABLES);
    const resto = todos.slice(TOP_RESPONSABLES);
    if (resto.length > 0) {
      const otros: Record<string, number | string> = { responsable: `Otros (${resto.length})` };
      TIPOS_ETAPA.forEach((tipo) => {
        otros[tipo] = resto.reduce((sum, p) => sum + (p.porArea[tipo] ?? 0), 0);
      });
      return [
        ...top.map((p) => ({ responsable: p.responsable, ...p.porArea })),
        otros,
      ];
    }
    return top.map((p) => ({ responsable: p.responsable, ...p.porArea }));
  }, [kpisQuery.data]);

  const sinDatos =
    !kpisQuery.isLoading &&
    !kpisQuery.isError &&
    throughputData.length === 0 &&
    retrabajoData.every((r) => r.completadas === 0);

  return (
    <Box mt={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Análisis por Área
        </Typography>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Box>

      {!rangoValido && <Alert severity="warning">Rango de fechas inválido.</Alert>}
      {kpisQuery.isError && (
        <Alert severity="error">No se pudieron cargar los KPIs de producción.</Alert>
      )}
      {kpisQuery.isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}
      {sinDatos && (
        <Alert severity="info">Sin etapas completadas en el rango seleccionado.</Alert>
      )}

      {rangoValido && !kpisQuery.isLoading && !kpisQuery.isError && !sinDatos && (
        <Grid container spacing={3}>
          {/* Throughput semanal */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Etapas completadas por semana
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={throughputData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="semana" tick={{ fill: CHART_AXIS, fontSize: 12 }} stroke={CHART_AXIS} />
                  <YAxis allowDecimals={false} tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {TIPOS_ETAPA.map((tipo, i) => (
                    <Line
                      key={tipo}
                      type="monotone"
                      dataKey={tipo}
                      name={AREA_LABELS[tipo]}
                      stroke={chartSerie(i)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Retrabajo QC */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Retrabajo QC por área (%)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={retrabajoData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="tipoEtapaLabel" tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                  <YAxis unit="%" tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                  <RechartsTooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, entry) => {
                      const fila = (entry as { payload?: (typeof retrabajoData)[number] })?.payload;
                      return [
                        `${value}% (${fila?.conRechazo ?? 0} de ${fila?.completadas ?? 0})`,
                        'Retrabajo',
                      ];
                    }}
                  />
                  <Bar dataKey="porcentajeRetrabajo" fill={chartSerie(5)} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Productividad por responsable */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Etapas completadas por responsable
              </Typography>
              <ResponsiveContainer width="100%" height={Math.max(300, productividadData.length * 36)}>
                <BarChart
                  data={productividadData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                  <YAxis
                    type="category"
                    dataKey="responsable"
                    width={140}
                    tick={{ fill: CHART_AXIS, fontSize: 12 }}
                    stroke={CHART_AXIS}
                  />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {TIPOS_ETAPA.map((tipo, i) => (
                    <Bar
                      key={tipo}
                      dataKey={tipo}
                      name={AREA_LABELS[tipo]}
                      stackId="areas"
                      fill={chartSerie(i)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalisisPorAreaSection;
