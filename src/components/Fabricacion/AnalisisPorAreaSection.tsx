import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
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

const formatHoras = (horas?: number | null): string => {
  if (horas === null || horas === undefined) return '—';
  if (horas < 24) return `${Math.round(horas)} h`;
  const dias = Math.floor(horas / 24);
  const resto = Math.round(horas % 24);
  return resto > 0 ? `${dias}d ${resto}h` : `${dias}d`;
};

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
  const cuellosData = kpisQuery.data?.cuellosDeBotella ?? [];
  // AISLACION no tiene área anterior: siempre sin muestras, se omite.
  const esperaData = (kpisQuery.data?.esperaEntreAreas ?? []).filter(
    (e) => e.tipoEtapa !== 'AISLACION'
  );
  const hayEspera = esperaData.some((e) => e.muestras > 0);
  const duracionData = kpisQuery.data?.duracionPorArea ?? [];
  const hayDuracion = duracionData.some((d) => d.muestras > 0);

  // Pivot de la tendencia: [{semana, AISLACION: p50, ...}] ordenado por semana ISO.
  const tendenciaData = useMemo(() => {
    const porSemana = new Map<string, Record<string, number | string>>();
    (kpisQuery.data?.tendenciaP50Semanal ?? []).forEach((fila) => {
      const row = porSemana.get(fila.semana) ?? { semana: fila.semana };
      if (fila.p50Horas !== null && fila.p50Horas !== undefined) {
        row[fila.tipoEtapa] = fila.p50Horas;
      }
      porSemana.set(fila.semana, row);
    });
    return Array.from(porSemana.values()).sort((a, b) =>
      String(a.semana).localeCompare(String(b.semana))
    );
  }, [kpisQuery.data]);
  const maxFrenados = Math.max(0, ...cuellosData.map((c) => c.equiposFrenados));

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
    retrabajoData.every((r) => r.completadas === 0) &&
    cuellosData.every((c) => c.equiposFrenados === 0);

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
          {/* Cuellos de botella: frenados entre áreas AHORA (no depende del rango).
              cuellosData vacío = backend viejo sin el campo (skew de deploy): ocultar la sección. */}
          {cuellosData.length > 0 && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Frenados entre áreas (ahora)
            </Typography>
            <Grid container spacing={2}>
              {cuellosData.map((area) => {
                const esCuello = maxFrenados > 0 && area.equiposFrenados === maxFrenados;
                return (
                  <Grid item xs={12} sm={6} md={3} key={area.tipoEtapa}>
                    <Card
                      variant="outlined"
                      sx={esCuello ? { borderColor: 'warning.main', borderWidth: 2 } : undefined}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {area.tipoEtapaLabel}
                          </Typography>
                          {esCuello && (
                            <Chip size="small" color="warning" label="Cuello de botella" />
                          )}
                        </Box>
                        <Typography variant="h5" fontWeight="bold">
                          {area.equiposFrenados}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.75 }}>
                            equipo{area.equiposFrenados === 1 ? '' : 's'} esperando
                          </Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          {area.equiposFrenados > 0
                            ? `Espera prom. ${formatHoras(area.esperaPromedioHoras)} · máx. ${formatHoras(area.esperaMaxHoras)}`
                            : 'Sin equipos frenados'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Equipos sin ninguna área en proceso, con las áreas anteriores terminadas y esta (la próxima)
              sin iniciar; la espera se cuenta desde la última área completada.
            </Typography>
          </Grid>
          )}

          {/* Espera histórica entre áreas: tiempo muerto entre que un área termina
              y la siguiente se inicia, sobre etapas iniciadas en el rango.
              esperaData vacío = backend viejo sin el campo: ocultar la sección. */}
          {esperaData.length > 0 && hayEspera && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>
              Espera entre áreas (histórica, en el rango)
            </Typography>
            <Grid container spacing={2}>
              {esperaData.map((area) => (
                <Grid item xs={12} sm={6} md={4} key={area.tipoEtapa}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        → {area.tipoEtapaLabel}
                      </Typography>
                      {area.muestras > 0 ? (
                        <>
                          <Typography variant="h5" fontWeight="bold">
                            {formatHoras(area.promedioHoras)}
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.75 }}>
                              promedio
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={0.5}>
                            {`p50 ${formatHoras(area.p50Horas)} · máx. ${formatHoras(area.maxHoras)} · ${area.muestras} transición${area.muestras === 1 ? '' : 'es'}`}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sin transiciones medibles en el rango
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Tiempo muerto entre que el área anterior termina y esta se inicia (requiere fecha de inicio,
              capturada desde sep 2026). A diferencia de los frenados de arriba, esto es historia del rango,
              no una foto de ahora.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              <strong>Promedio</strong>: cuánto espera en general un equipo para entrar a esta área.
              <strong> p50 (mediana)</strong>: la espera típica — la mitad de los equipos esperó menos que
              eso. <strong>Máx.</strong>: el peor caso del rango. Si el promedio o el máximo están muy por
              encima del p50, la mayoría pasa rápido pero algunos equipos quedaron frenados mucho tiempo —
              conviene revisar esos casos. Si el p50 es alto, la demora para entrar a esta área es de todos
              los días, no de casos sueltos.
            </Typography>
          </Grid>
          )}

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

          {/* Duración por área p50/p90 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                Duración por área (p50 / p90, en horas)
              </Typography>
              {hayDuracion ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={duracionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                      <XAxis dataKey="tipoEtapaLabel" tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                      <YAxis tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                      <RechartsTooltip
                        contentStyle={tooltipStyle}
                        formatter={(value, name, entry) => {
                          const fila = (entry as { payload?: (typeof duracionData)[number] })?.payload;
                          return [
                            `${formatHoras(Number(value))} (${fila?.muestras ?? 0} muestras)`,
                            name,
                          ];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="p50Horas" name="p50 (mediana)" fill={chartSerie(6)} />
                      <Bar dataKey="p90Horas" name="p90" fill={chartSerie(7)} />
                    </BarChart>
                  </ResponsiveContainer>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    <strong>p50 (mediana)</strong>: el tiempo típico del área — la mitad de las etapas se
                    terminan en menos de ese tiempo. <strong>p90</strong>: casi todas (9 de cada 10) se
                    terminan en menos de ese tiempo; las que lo superan son los casos problemáticos.
                    Si el p90 está muy por encima del p50, el área trabaja bien en general pero algunas
                    etapas se atrasan mucho — conviene revisar esos casos puntuales. Si suben los dos,
                    el área entera se está enlenteciendo.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    Solo etapas con fecha de inicio registrada (dato que se captura desde sep 2026) — el
                    volumen crece a medida que el taller usa el botón Iniciar.
                  </Typography>

                  {tendenciaData.length > 1 && (
                    <Box mt={3}>
                      <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                        Tendencia semanal de la mediana (p50)
                      </Typography>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={tendenciaData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                          <XAxis dataKey="semana" tick={{ fill: CHART_AXIS, fontSize: 12 }} stroke={CHART_AXIS} />
                          <YAxis tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
                          <RechartsTooltip
                            contentStyle={tooltipStyle}
                            formatter={(value, name) => [formatHoras(Number(value)), name]}
                          />
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
                      <Typography variant="caption" color="text.secondary">
                        Si la línea de un área sube semana a semana, esa área se está enlenteciendo.
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <Alert severity="info">
                  Todavía sin muestras de duración en el rango: se necesita que las etapas se inicien con el
                  botón Iniciar (la fecha de inicio se captura desde sep 2026) y se completen.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalisisPorAreaSection;
