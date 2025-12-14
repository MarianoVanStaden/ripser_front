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
  Stack,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon
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
import { parametroSistemaApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
import { EmbudoVentasChart } from '../../components/metricas/EmbudoVentasChart';
import { MetricasCanalChart } from '../../components/metricas/MetricasCanalChart';
import { MetricasPrioridadChart } from '../../components/metricas/MetricasPrioridadChart';
import { DistribucionGeograficaTable } from '../../components/metricas/DistribucionGeograficaTable';
import { ProductosInteresTables } from '../../components/metricas/ProductosInteresTables';
import { RankingVendedoresTable } from '../../components/metricas/RankingVendedoresTable';
import { TendenciasTemporalesChart } from '../../components/metricas/TendenciasTemporalesChart';
import { exportarMetricasExcel, exportarMetricasPDF, generarNombreArchivo } from '../../utils/metricasExportUtils';

// Configurar dayjs en español
dayjs.locale('es');

export const LeadMetricasPage = () => {
  const { sucursalFiltro, sucursales } = useTenant();
  
  // Obtener nombre de la sucursal actual
  const sucursalActualNombre = sucursalFiltro 
    ? sucursales.find(s => s.id === sucursalFiltro)?.nombre || 'Sucursal desconocida'
    : 'Todas las sucursales';
  
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
  const [metaMensualLeads, setMetaMensualLeads] = useState<number>(30); // Valor por defecto para empresa mediana
  const [metaPresupuestoMensual, setMetaPresupuestoMensual] = useState<number>(1000000); // Meta de facturación mensual

  // Cargar métricas al montar y cuando cambian los filtros
  useEffect(() => {
    loadMetricas();
    loadParametrosMeta();
  }, [sucursalFiltro]);

  // Auto-refresh cuando la página recibe el foco (usuario vuelve después de convertir un lead)
  useEffect(() => {
    const handleFocus = () => {
      // Recargar métricas cuando el usuario vuelve a la pestaña
      if (document.visibilityState === 'visible') {
        loadMetricas();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fechaInicio, fechaFin, sucursalFiltro, usuarioAsignadoId]);

  const loadParametrosMeta = async () => {
    try {
      const paramMeta = await parametroSistemaApi.getByClave('META_MENSUAL_LEADS');
      if (paramMeta && paramMeta.valor) {
        setMetaMensualLeads(Number(paramMeta.valor));
      }
    } catch (err) {
      // Si no existe el parámetro, usar valor por defecto (30 para empresa mediana)
      console.log('Parámetro META_MENSUAL_LEADS no configurado, usando valor por defecto');
    }

    try {
      const paramPresupuesto = await parametroSistemaApi.getByClave('META_PRESUPUESTO_MENSUAL');
      if (paramPresupuesto && paramPresupuesto.valor) {
        setMetaPresupuestoMensual(Number(paramPresupuesto.valor));
      }
    } catch (err) {
      // Si no existe el parámetro, usar valor por defecto
      console.log('Parámetro META_PRESUPUESTO_MENSUAL no configurado, usando valor por defecto');
    }
  };

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

      console.log('📤 PARÁMETROS ENVIADOS AL BACKEND:', params);

      const data = await leadMetricasApi.obtenerMetricasCompletas(params);
      console.log('📊 Métricas recibidas del backend:', {
        tiempoConversion: data.tiempoConversion,
        presupuestoVsRealizado: data.presupuestoVsRealizado,
        tasaConversion: data.tasaConversion,
        metricasPorPrioridad: data.metricasPorPrioridad
      });
      console.log('🎯 Métricas por Prioridad detalladas:', JSON.stringify(data.metricasPorPrioridad, null, 2));
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
      exportarMetricasExcel(metricas, nombreArchivo, metaMensualLeads, metaPresupuestoMensual, sucursalActualNombre);
      setError(null); // Limpiar errores previos si fue exitoso
    } catch (err: any) {
      console.error('Error al exportar métricas a Excel:', err);
      setError(`Error al exportar a Excel: ${err.message || 'Verifique que los datos estén completos.'}`);
    }
  };

  const handleExportarPDF = () => {
    if (!metricas) return;

    try {
      const nombreArchivo = generarNombreArchivo('pdf');
      exportarMetricasPDF(metricas, nombreArchivo, metaMensualLeads, metaPresupuestoMensual, sucursalActualNombre);
      setError(null); // Limpiar errores previos si fue exitoso
    } catch (err: any) {
      console.error('Error al exportar PDF:', err);
      setError(`Error al exportar a PDF: ${err.message || 'Verifique que los datos estén completos.'}`);
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon fontSize="large" />
              Métricas de Leads
            </Typography>
            <Chip
              icon={<BusinessIcon />}
              label={sucursalActualNombre}
              color={sucursalFiltro ? 'primary' : 'default'}
              variant={sucursalFiltro ? 'filled' : 'outlined'}
              sx={{ fontWeight: 'medium' }}
            />
          </Box>
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
                onChange={(newValue) => setFechaInicio(newValue as Dayjs | null)}
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
                onChange={(newValue) => setFechaFin(newValue as Dayjs | null)}
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
              </Stack>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportar}
                  disabled={!metricas || loading}
                  fullWidth
                  sx={{ flex: 1 }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportarPDF}
                  disabled={!metricas || loading}
                  fullWidth
                  sx={{ flex: 1 }}
                  color="error"
                >
                  PDF
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
                    {metricas.tasaConversion?.tasaConversion?.toFixed(1) ?? '0.0'}%
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {metricas.tasaConversion?.leadsConvertidos ?? 0} de {metricas.tasaConversion?.totalLeads ?? 0} leads convertidos
                    </Typography>
                    <Typography
                      variant="body2"
                      color={
                        !metricas.tasaConversion?.variacionPorcentual || metricas.tasaConversion?.variacionPorcentual === 0
                          ? 'text.secondary'
                          : metricas.tasaConversion.variacionPorcentual > 0
                          ? 'success.main'
                          : 'error.main'
                      }
                    >
                      {!metricas.tasaConversion?.variacionPorcentual || metricas.tasaConversion?.variacionPorcentual === 0
                        ? '→'
                        : metricas.tasaConversion.variacionPorcentual > 0
                        ? '↑'
                        : '↓'}{' '}
                      {Math.abs(metricas.tasaConversion?.variacionPorcentual ?? 0).toFixed(1)}% vs mes anterior
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
                    {metricas.tiempoConversion?.promedioGeneral && metricas.tiempoConversion.promedioGeneral > 0
                      ? metricas.tiempoConversion.promedioGeneral.toFixed(0)
                      : '0'}{' '}
                    días
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Min: {metricas.tiempoConversion?.minimoTiempo ?? 0} días
                      {' | '}
                      Max: {metricas.tiempoConversion?.maximoTiempo ?? 0} días
                    </Typography>
                    {metricas.tiempoConversion?.promedioGeneral && metricas.tiempoConversion.promedioGeneral > 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Mediana: {metricas.tiempoConversion.medianaGeneral.toFixed(0)} días
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        → Sin datos del mes anterior
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Presupuesto vs Meta */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Cumplimiento de Meta de Ventas
                  </Typography>
                  <Typography
                    variant="h3"
                    component="div"
                    color={
                      ((metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0) / metaPresupuestoMensual * 100) >= 100
                        ? 'success.main'
                        : ((metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0) / metaPresupuestoMensual * 100) >= 70
                          ? 'warning.main'
                          : 'error.main'
                    }
                  >
                    {metaPresupuestoMensual > 0
                      ? ((metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0) / metaPresupuestoMensual * 100).toFixed(0)
                      : '0'}%
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Realizado: ${(metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Meta mensual: ${metaPresupuestoMensual.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {metricas.presupuestoVsRealizado?.cantidadPresupuestosRealizados ?? 0} de {metricas.presupuestoVsRealizado?.cantidadPresupuestosEstimados ?? 0} presupuestos convertidos
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Meta de Leads */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Cumplimiento de Meta de Leads
                  </Typography>
                  <Typography
                    variant="h3"
                    component="div"
                    color={
                      ((metricas.tasaConversion?.totalLeads ?? 0) / metaMensualLeads * 100) >= 100
                        ? 'success.main'
                        : ((metricas.tasaConversion?.totalLeads ?? 0) / metaMensualLeads * 100) >= 70
                          ? 'warning.main'
                          : 'error.main'
                    }
                  >
                    {metaMensualLeads > 0
                      ? ((metricas.tasaConversion?.totalLeads ?? 0) / metaMensualLeads * 100).toFixed(0)
                      : '0'}%
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Leads generados: {metricas.tasaConversion?.totalLeads ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      Meta mensual: {metaMensualLeads} leads
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Faltan {Math.max(0, metaMensualLeads - (metricas.tasaConversion?.totalLeads ?? 0))} leads para cumplir la meta
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Valor Promedio por Conversión */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Valor Promedio por Conversión
                  </Typography>
                  <Typography variant="h3" component="div" color="info.main">
                    ${(
                      (metricas.presupuestoVsRealizado?.cantidadPresupuestosRealizados ?? 0) > 0
                        ? (metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0) /
                          (metricas.presupuestoVsRealizado?.cantidadPresupuestosRealizados ?? 1)
                        : 0
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Conversiones: {metricas.presupuestoVsRealizado?.cantidadPresupuestosRealizados ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      Total facturado: ${(metricas.presupuestoVsRealizado?.valorRealizadoTotal ?? 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Ticket promedio de venta
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Leads en Pipeline Activo */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Leads en Pipeline Activo
                  </Typography>
                  <Typography variant="h3" component="div" color="warning.main">
                    {(() => {
                      const totalLeads = metricas.tasaConversion?.totalLeads ?? 0;
                      const convertidos = metricas.tasaConversion?.leadsConvertidos ?? 0;
                      // Contar leads perdidos y descartados del embudo
                      const perdidosDescartados = metricas.embudoVentas
                        .filter(e => ['PERDIDO', 'DESCARTADO'].includes(e.estadoLead))
                        .reduce((sum, e) => sum + e.cantidad, 0);
                      return totalLeads - convertidos - perdidosDescartados;
                    })()}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Total leads: {metricas.tasaConversion?.totalLeads ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      Convertidos: {metricas.tasaConversion?.leadsConvertidos ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Leads siendo trabajados actualmente
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
