import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid2 as Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SavingsIcon from '@mui/icons-material/Savings';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { provisionApi } from '../../../api/services/provisionApi';
import type { ResumenProvisionAnualDTO, TipoProvision, ProvisionMensualDTO } from '../../../types';

const TIPOS: TipoProvision[] = ['AGUINALDO', 'VACACIONES', 'SAC', 'OTRO'];

const TIPO_LABELS: Record<TipoProvision, string> = {
  AGUINALDO: 'Aguinaldo',
  VACACIONES: 'Vacaciones',
  SAC: 'SAC',
  OTRO: 'Otro',
};

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function SaldoChip({ value }: { value: number }) {
  const color = value === 0 ? 'success' : value > 0 ? 'warning' : 'error';
  return <Chip label={`$${fmt(value)}`} color={color} size="small" sx={{ fontWeight: 600 }} />;
}

/** Fill in all 12 months client-side; months without backend data appear as zeroes */
function buildChartData(detalle: ProvisionMensualDTO[]) {
  const byMes = new Map<number, ProvisionMensualDTO>();
  detalle.forEach((d) => byMes.set(d.mes, d));

  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const d = byMes.get(m);
    return {
      mes: MONTH_NAMES[m].substring(0, 3),
      mesNum: m,
      provisionado: d?.montoProvisionado ?? 0,
      pagado: d?.montoPagado ?? 0,
      saldo: d?.saldoPendiente ?? 0,
    };
  });
}

export default function ProvisionResumenAnualPage() {
  const { tipo: tipoParam, anio: anioParam } = useParams<{ tipo: string; anio: string }>();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState<TipoProvision>((tipoParam as TipoProvision) ?? 'AGUINALDO');
  const [anio, setAnio] = useState(anioParam ? Number(anioParam) : CURRENT_YEAR);

  const [resumen, setResumen] = useState<ResumenProvisionAnualDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await provisionApi.getResumenAnual(tipo, anio);
      setResumen(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar el resumen anual');
    } finally {
      setLoading(false);
    }
  }, [tipo, anio]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep URL in sync
  useEffect(() => {
    navigate(`/admin/provisiones/resumen/${tipo}/${anio}`, { replace: true });
  }, [tipo, anio, navigate]);

  const chartData = resumen ? buildChartData(resumen.detalle) : [];

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/admin/provisiones/${anio}/${new Date().getMonth() + 1}`)}
          size="small"
        >
          Volver al mes
        </Button>
      </Box>

      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <SavingsIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Resumen Anual — Provisiones
        </Typography>
      </Box>

      {/* Controls */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoProvision)}>
            {TIPOS.map((t) => <MenuItem key={t} value={t}>{TIPO_LABELS[t]}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 90 }}>
          <InputLabel>Año</InputLabel>
          <Select label="Año" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : resumen ? (
        <>
          {/* Summary cards */}
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Total Provisionado</Typography>
                  <Typography variant="h6" fontWeight={700}>${fmt(resumen.totalProvisionado)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Total Pagado</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    ${fmt(resumen.totalPagado)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">Saldo Pendiente</Typography>
                  <Box mt={0.5}>
                    <SaldoChip value={resumen.saldoPendienteTotal} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Bar chart */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              {TIPO_LABELS[tipo]} {anio} — Provisionado vs. Pagado
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `$${new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(v)}`} />
                <RechartsTooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => [
                    `$${fmt(value ?? 0)}`,
                    name === 'provisionado' ? 'Provisionado' : 'Pagado',
                  ]) as any}
                />
                <Legend formatter={(value) => value === 'provisionado' ? 'Provisionado' : 'Pagado'} />
                <Bar dataKey="provisionado" fill="#1976d2" name="provisionado" />
                <Bar dataKey="pagado" fill="#2e7d32" name="pagado" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Monthly detail table */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Mes</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Provisionado ($)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acumulado período ($)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Pagado ($)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Saldo pendiente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Observaciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = i + 1;
                  const byMes = new Map<number, ProvisionMensualDTO>();
                  resumen.detalle.forEach((d) => byMes.set(d.mes, d));
                  const d = byMes.get(m);
                  return (
                    <TableRow key={m} hover>
                      <TableCell>{MONTH_NAMES[m]}</TableCell>
                      <TableCell align="right">
                        {d ? `$${fmt(d.montoProvisionado)}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        {d ? `$${fmt(d.montoAcumuladoPeriodo)}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        {d ? `$${fmt(d.montoPagado)}` : <Typography color="text.disabled" variant="body2">—</Typography>}
                      </TableCell>
                      <TableCell align="right">
                        {d ? <SaldoChip value={d.saldoPendiente} /> : <Typography color="text.disabled" variant="body2">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {d?.observaciones ?? '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}
    </Box>
  );
}
