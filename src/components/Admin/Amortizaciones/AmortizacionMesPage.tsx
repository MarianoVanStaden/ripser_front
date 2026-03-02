import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { amortizacionApi } from '../../../api/services/amortizacionApi';
import type { ActivoAmortizableDTO, AmortizacionMensualDTO } from '../../../types';
import AmortizacionMesRow from './components/AmortizacionMesRow';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function AmortizacionMesPage() {
  const { anio, mes } = useParams<{ anio: string; mes: string }>();
  const navigate = useNavigate();

  const anioNum = Number(anio);
  const mesNum = Number(mes);

  const [activos, setActivos] = useState<ActivoAmortizableDTO[]>([]);
  const [detalles, setDetalles] = useState<AmortizacionMensualDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activosData, detallesData] = await Promise.all([
        amortizacionApi.getActivos(),
        amortizacionApi.getDetallesMes(anioNum, mesNum),
      ]);
      setActivos(activosData.filter((a) => a.activo));
      setDetalles(detallesData);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [anioNum, mesNum]);

  useEffect(() => { load(); }, [load]);

  const detalleMap = new Map<number, AmortizacionMensualDTO>();
  detalles.forEach((d) => detalleMap.set(d.activoId, d));

  const totalPesos = detalles.reduce((sum, d) => sum + d.montoAmortizadoPesos, 0);
  const totalDolares = detalles.reduce((sum, d) => sum + d.montoAmortizadoDolares, 0);
  const registrados = detalles.length;
  const pendientes = activos.length - registrados;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/amortizaciones')} size="small">
          Activos
        </Button>
      </Box>

      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <ReceiptLongIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Amortizaciones — {MESES[mesNum]} {anioNum}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total amortizado ($)</Typography>
              <Typography variant="h6" fontWeight={700}>${fmt(totalPesos)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Total amortizado (USD)</Typography>
              <Typography variant="h6" fontWeight={700}>USD {fmt(totalDolares)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Activos registrados</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">{registrados}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="caption" color="text.secondary">Pendientes</Typography>
              <Typography variant="h6" fontWeight={700} color={pendientes > 0 ? 'warning.main' : 'text.secondary'}>
                {pendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>Activo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Método</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Amortizado ($)</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Fondo acumulado ($)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={2}>
                    No hay activos activos. <Button size="small" onClick={() => navigate('/admin/amortizaciones')}>Ir a activos</Button>
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {activos.map((activo) => (
              <AmortizacionMesRow
                key={activo.id}
                activo={activo}
                amortizacion={detalleMap.get(activo.id) ?? null}
                anio={anioNum}
                mes={mesNum}
                onRegistered={load}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
