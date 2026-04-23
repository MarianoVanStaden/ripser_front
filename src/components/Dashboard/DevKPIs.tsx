import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, Alert, Chip, Stack } from '@mui/material';
import LoadingOverlay from '../common/LoadingOverlay';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend as RLegend,
  ResponsiveContainer,
} from 'recharts';
import { categoricalPalette } from '../../config/chartConfig';

type Histogram = { byHour: number[]; byDOW: number[] };
type AuthorTop = { name: string; count: number };
type ESLintMetrics = { errors?: number; warnings?: number; fixableErrors?: number; fixableWarnings?: number; filesWithErrors?: number; filesWithWarnings?: number; error?: string } | null;
type TSMetrics = { errors?: number; error?: string } | null;

interface KpiSummary {
  windowDays: number;
  totalCommits: number;
  commitsPerWeek: number;
  commitsPerActiveDay: number;
  featRatio: number;
  fixRatio: number;
  insertions: number;
  deletions: number;
  filesChanged: number;
  avgCommitSize: number;
  churnRatio: number;
  uniqueAuthors: number;
  topContributorShare: number;
  hhi: number;
  medianTimeBetweenCommitsHours: number;
  firstDate: string;
  lastDate: string;
}

interface KpiReport {
  params: { sinceDays: number; branch?: string; pathFilter?: string };
  summary: KpiSummary;
  histograms: Histogram;
  typeDistribution: Record<string, number>;
  authorsTop: AuthorTop[];
  eslint: ESLintMetrics;
  typescript: TSMetrics;
  bundleBytes?: number;
  versions?: { location: string; version: string }[];
  generatedAt: string;
}

function toPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const v = bytes / Math.pow(1024, i);
  return `${v.toFixed(2)} ${sizes[i]}`;
}

const DevKPIs: React.FC = () => {
  const [data, setData] = useState<KpiReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/kpis/kpis-latest.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as KpiReport;
        if (mounted) setData(json);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'No se pudo cargar el reporte');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const dowNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const hourData = useMemo(() => {
    if (!data) return null;
    return data.histograms.byHour.map((count, i) => ({ label: `${i}:00`, Commits: count }));
  }, [data]);

  const dowData = useMemo(() => {
    if (!data) return null;
    return data.histograms.byDOW.map((count, i) => ({ label: dowNames[i], Commits: count }));
  }, [data]);

  const typeData = useMemo(() => {
    if (!data) return null;
    return Object.entries(data.typeDistribution)
      .filter(([, v]) => v > 0)
      .map(([k, v], i) => ({ name: k, value: v, color: categoricalPalette[i % categoricalPalette.length] }));
  }, [data]);

  const topAuthorsData = useMemo(() => {
    if (!data) return null;
    return data.authorsTop.map(a => ({ label: a.name, Commits: a.count }));
  }, [data]);

  if (error) {
    return (
      <Box p={3}>
        <LoadingOverlay open={loading} message="Cargando KPIs..." />
        <Alert severity="error" sx={{ mb: 2 }}>No se pudo cargar el reporte: {error}</Alert>
        <Typography variant="body2">
          Generá el archivo con: <code>npm run kpis -- --out public/kpis/kpis-latest.json</code>
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={3}>
        <LoadingOverlay open={loading} message="Cargando KPIs..." />
      </Box>
    );
  }

  const s = data.summary;

  return (
    <Box p={3}>
      <LoadingOverlay open={loading} message="Cargando KPIs..." />
      <Typography variant="h5" gutterBottom>KPIs de Desarrollo</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Ventana: últimos {data.params.sinceDays} días. Última generación: {new Date(data.generatedAt).toLocaleString()}.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Throughput semanal</Typography>
              <Typography variant="h4">{s.commitsPerWeek.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">commits / semana</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Feat ratio</Typography>
              <Typography variant="h4">{toPct(s.featRatio)}</Typography>
              <Typography variant="body2" color="text.secondary">de los commits</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Fix ratio</Typography>
              <Typography variant="h4">{toPct(s.fixRatio)}</Typography>
              <Typography variant="body2" color="text.secondary">de los commits</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="overline">Top contributor</Typography>
              <Typography variant="h4">{toPct(s.topContributorShare)}</Typography>
              <Typography variant="body2" color="text.secondary">contribución</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Commits por hora</Typography>
              {hourData && (
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <RTooltip />
                      <Bar dataKey="Commits" fill="rgba(33, 150, 243, 0.6)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Commits por día de la semana</Typography>
              {dowData && (
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <RTooltip />
                      <Bar dataKey="Commits" fill="rgba(76, 175, 80, 0.7)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Tipos de commits</Typography>
              {typeData && (
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {typeData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip />
                      <RLegend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Top autores (commits)</Typography>
              {topAuthorsData && (
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topAuthorsData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={100} />
                      <RTooltip />
                      <Bar dataKey="Commits" fill="rgba(255, 99, 132, 0.7)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Calidad estática</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip label={`TS errores: ${data.typescript?.errors ?? 'N/D'}`} color={data.typescript && (data.typescript.errors ?? 0) > 0 ? 'error' : 'success'} />
                {data.eslint && !data.eslint.error ? (
                  <>
                    <Chip label={`ESLint errores: ${data.eslint.errors}`} color={(data.eslint.errors ?? 0) > 0 ? 'error' : 'success'} />
                    <Chip label={`ESLint warnings: ${data.eslint.warnings}`} color={(data.eslint.warnings ?? 0) > 0 ? 'warning' : 'default'} />
                  </>
                ) : (
                  <Chip label="ESLint: no disponible" />
                )}
                {typeof data.bundleBytes === 'number' && (
                  <Chip label={`Bundle dist/: ${formatBytes(data.bundleBytes)}`} />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DevKPIs;
