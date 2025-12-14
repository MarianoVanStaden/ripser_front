import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Stack
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { leadMetricasApi } from '../../api/services/leadMetricasApi';
import type {
  LeadMetricasResponseDTO,
  LeadMetricasRequestParams
} from '../../api/services/leadMetricasApi';
import { useTenant } from '../../context/TenantContext';
import { EmbudoVentasChart } from '../../components/metricas/EmbudoVentasChart';
import { MetricasCanalChart } from '../../components/metricas/MetricasCanalChart';
import { MetricasPrioridadChart } from '../../components/metricas/MetricasPrioridadChart';
import { DistribucionGeograficaTable } from '../../components/metricas/DistribucionGeograficaTable';
import { ProductosInteresTables } from '../../components/metricas/ProductosInteresTables';
import { RankingVendedoresTable } from '../../components/metricas/RankingVendedoresTable';
import { TendenciasTemporalesChart } from '../../components/metricas/TendenciasTemporalesChart';
import { exportarMetricasExcel, generarNombreArchivo } from '../../utils/metricasExportUtils';

// Configurar dayjs en español
dayjs.locale('es');

export const LeadMetricasPage = () => {
  const { sucursalFiltro } = useTenant();
  
  // Estado de filtros
  const [fechaInicio, setFechaInicio] = useState<Dayjs | null>(
    dayjs().subtract(30, 'days')
  );
  const [fechaFin, setFechaFin] = useState<Dayjs | null>(dayjs());
  const [usuarioAsignadoId, setUsuarioAsignadoId] = useState<number | undefined>();

  // Estado de datos
  const [metricas, setMetricas] = useState<LeadMetricasResponseDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar métricas al montar y cuando cambian los filtros
  useEffect(() => {
    loadMetricas();
  }, [sucursalFiltro]);

  const loadMetricas = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Debe seleccionar ambas fechas');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: LeadMetricasRequestParams = {
        fechaInicio: fechaInicio.format('YYYY-MM-DD'),
        fechaFin: fechaFin.format('YYYY-MM-DD'),
      };

      if (sucursalFiltro !== null) {
        params.sucursalId = sucursalFiltro;
      }

      if (usuarioAsignadoId !== undefined) {
        params.usuarioAsignadoId = usuarioAsignadoId;
      }

      const data = await leadMetricasApi.obtenerMetricasCompletas(params);
      setMetricas(data);
    } catch (err) {
      console.error('Error al cargar métricas:', err);
      setError('Error al cargar las métricas. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    if (!metricas) return;
    
    try {
      const nombreArchivo = generarNombreArchivo('xlsx');
      exportarMetricasExcel(metricas, nombreArchivo);
    } catch (err) {
      console.error('Error al exportar métricas:', err);
      setError('Error al exportar las métricas.');
    }
  };

  const handleRefresh = () => {
    loadMetricas();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon fontSize="large" />
            Métricas de Leads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis detallado del rendimiento de leads y conversiones
          </Typography>
        </Box>

        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={(newValue) => setFechaInicio(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={(newValue) => setFechaFin(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Vendedor ID (opcional)"
                type="number"
                size="small"
                fullWidth
                value={usuarioAsignadoId || ''}
                onChange={(e) => setUsuarioAsignadoId(e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  fullWidth
                  disabled={loading}
                >
                  Actualizar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportar}
                  disabled={!metricas || loading}
                >
                  Exportar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Métricas Content */}
        {!loading && metricas && (
          <Grid container spacing={3}>
            {/* Tasa de Conversión */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Tasa de Conversión
                  </Typography>
                  <Typography variant="h3" component="div" color="primary">
                    {metricas.tasaConversion.tasaConversion.toFixed(1)}%
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {metricas.tasaConversion.leadsConvertidos} de {metricas.tasaConversion.totalLeads} leads convertidos
                    </Typography>
                    <Typography
                      variant="body2"
                      color={metricas.tasaConversion.variacionPorcentual >= 0 ? 'success.main' : 'error.main'}
                    >
                      {metricas.tasaConversion.variacionPorcentual >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(metricas.tasaConversion.variacionPorcentual).toFixed(1)}% vs mes anterior
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Tiempo de Conversión */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Tiempo Promedio de Conversión
                  </Typography>
                  <Typography variant="h3" component="div" color="secondary">
                    {metricas.tiempoConversion.promedioTiempoConversion.toFixed(0)} días
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Min: {metricas.tiempoConversion.tiempoConversionMinimo} días
                      {' | '}
                      Max: {metricas.tiempoConversion.tiempoConversionMaximo} días
                    </Typography>
                    <Typography
                      variant="body2"
                      color={metricas.tiempoConversion.variacionPorcentual <= 0 ? 'success.main' : 'warning.main'}
                    >
                      {metricas.tiempoConversion.variacionPorcentual >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(metricas.tiempoConversion.variacionPorcentual).toFixed(1)}% vs mes anterior
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Presupuesto vs Realizado */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Cumplimiento de Objetivos
                  </Typography>
                  <Typography variant="h3" component="div" color="success.main">
                    {metricas.presupuestoVsRealizado.porcentajeCumplimiento.toFixed(0)}%
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Estimado: ${metricas.presupuestoVsRealizado.valorEstimadoTotal.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Realizado: ${metricas.presupuestoVsRealizado.valorRealizado.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Embudo de Ventas */}
            <Grid item xs={12} md={6}>
              <EmbudoVentasChart data={metricas.embudoVentas} />
            </Grid>

            {/* Métricas por Canal */}
            <Grid item xs={12} md={6}>
              <MetricasCanalChart data={metricas.metricasPorCanal} />
            </Grid>

            {/* Métricas por Prioridad */}
            <Grid item xs={12} md={6}>
              <MetricasPrioridadChart data={metricas.metricasPorPrioridad} />
            </Grid>

            {/* Tendencias Temporales */}
            <Grid item xs={12} md={6}>
              <TendenciasTemporalesChart data={metricas.tendenciasTemporales} />
            </Grid>

            {/* Distribución Geográfica */}
            <Grid item xs={12}>
              <DistribucionGeograficaTable data={metricas.distribucionGeografica} />
            </Grid>

            {/* Productos de Interés */}
            <Grid item xs={12}>
              <ProductosInteresTables data={metricas.productosInteres} />
            </Grid>

            {/* Ranking de Vendedores */}
            <Grid item xs={12}>
              <RankingVendedoresTable data={metricas.metricasPorVendedor} />
            </Grid>
          </Grid>
        )}

        {/* Empty State */}
        {!loading && !error && !metricas && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <TrendingUpIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Seleccione un rango de fechas y presione "Actualizar" para ver las métricas
            </Typography>
          </Paper>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default LeadMetricasPage;
