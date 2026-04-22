import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, Alert, Chip, Stack } from '@mui/material';
import LoadingOverlay from '../common/LoadingOverlay';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

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

  const hourChart = useMemo(() => {
    if (!data) return null;
    return {
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Commits',
          data: data.histograms.byHour,
          backgroundColor: 'rgba(33, 150, 243, 0.5)',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: 'Commits por hora' } },
      } as const,
    };
  }, [data]);

  const dowChart = useMemo(() => {
    if (!data) return null;
    return {
      data: {
        labels: dowNames,
        datasets: [{
          label: 'Commits',
          data: data.histograms.byDOW,
          backgroundColor: 'rgba(76, 175, 80, 0.5)',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, title: { display: true, text: 'Commits por día de la semana' } },
      } as const,
    };
  }, [data]);

  const typeChart = useMemo(() => {
    if (!data) return null;
    const entries = Object.entries(data.typeDistribution).filter(([, v]) => v > 0);
    const labels = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const colors = ['#42a5f5','#66bb6a','#ffa726','#ab47bc','#ef5350','#29b6f6','#9ccc65','#ffca28','#8d6e63','#26a69a','#ec407a','#78909c'];
    return {
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: labels.map((_, i) => colors[i % colors.length]) }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Tipos de commits' } } } as const,
    };
  }, [data]);

  const topAuthorsChart = useMemo(() => {
    if (!data) return null;
    return {
      data: {
        labels: data.authorsTop.map(a => a.name),
        datasets: [{ label: 'Commits', data: data.authorsTop.map(a => a.count), backgroundColor: 'rgba(255, 99, 132, 0.5)' }],
      },
      options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Top autores (commits)' } } } as const,
    };
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
              {hourChart && <Bar data={hourChart.data} options={hourChart.options} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              {dowChart && <Bar data={dowChart.data} options={dowChart.options} />}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              {typeChart && <Doughnut data={typeChart.data} options={typeChart.options} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              {topAuthorsChart && <Bar data={topAuthorsChart.data} options={topAuthorsChart.options} />}
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
