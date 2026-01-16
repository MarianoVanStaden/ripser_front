import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { adminFlujoCajaApi } from '../../../api/services/adminFlujoCajaApi';
import type { FlujoCajaMovimientoEnhanced, MetodoPago } from '../../../types';
import {
  aggregateByPaymentMethod,
  aggregateChequeStatus,
  prepareTimeSeriesData,
  calculateKPIs,
  getOptimalGranularity,
} from '../../../utils/flujoCajaUtils';
import { generateFlujoCajaPDF } from '../../../utils/pdfExportUtils';
import FlujoCajaKPICards from './components/FlujoCajaKPICards';
import FlujoCajaCharts from './components/FlujoCajaCharts';
import FlujoCajaPaymentBreakdown from './components/FlujoCajaPaymentBreakdown';
import FlujoCajaMovimientosTable from './components/FlujoCajaMovimientosTable';

dayjs.locale('es');

const FlujoCajaPage: React.FC = () => {
  // State
  const [movimientos, setMovimientos] = useState<FlujoCajaMovimientoEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(3, 'month'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());
  const [activeFilter, setActiveFilter] = useState<string>('last3months');
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<MetodoPago | 'ALL'>('ALL');

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const fechaDesdeStr = fechaDesde ? fechaDesde.format('YYYY-MM-DD') : undefined;
      const fechaHastaStr = fechaHasta ? fechaHasta.format('YYYY-MM-DD') : undefined;

      // Intentar usar endpoint mejorado, si falla usar el básico
      try {
        const response = await adminFlujoCajaApi.getFlujoCajaEnhanced(
          fechaDesdeStr,
          fechaHastaStr
        );
        setMovimientos(response.movimientos);
      } catch (enhancedError) {
        console.warn('Enhanced endpoint not available, falling back to basic endpoint');
        // Fallback al endpoint básico
        const basicResponse = await adminFlujoCajaApi.getFlujoCaja(
          fechaDesdeStr,
          fechaHastaStr
        );
        // Convertir a formato mejorado (sin metodoPago)
        setMovimientos(
          basicResponse.movimientos.map((mov) => ({
            ...mov,
            metodoPago: undefined,
            chequeId: undefined,
            chequeNumero: undefined,
            chequeEstado: undefined,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading flujo de caja:', err);
      setError('Error al cargar el flujo de caja. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Computed data with useMemo for performance
  const paymentMethodData = useMemo(() => {
    return aggregateByPaymentMethod(movimientos);
  }, [movimientos]);

  const chequeStatusData = useMemo(() => {
    return aggregateChequeStatus(movimientos);
  }, [movimientos]);

  const granularity = useMemo(() => {
    return getOptimalGranularity(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  const timeSeriesData = useMemo(() => {
    return prepareTimeSeriesData(movimientos, granularity);
  }, [movimientos, granularity]);

  const totalIngresos = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + m.importe, 0);
  }, [movimientos]);

  const totalEgresos = useMemo(() => {
    return movimientos
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + m.importe, 0);
  }, [movimientos]);

  const flujoNeto = totalIngresos - totalEgresos;

  const kpis = useMemo(() => {
    const response = {
      totalIngresos,
      totalEgresos,
      flujoNeto,
      totalMovimientos: movimientos.length,
      movimientos,
    };
    return calculateKPIs(response, paymentMethodData, chequeStatusData);
  }, [totalIngresos, totalEgresos, flujoNeto, movimientos, paymentMethodData, chequeStatusData]);

  const totalGeneral = totalIngresos + totalEgresos;

  // Handlers
  const handleExportPDF = async () => {
    try {
      await generateFlujoCajaPDF(
        movimientos,
        {
          fechaDesde: fechaDesde ? fechaDesde.format('DD/MM/YYYY') : '',
          fechaHasta: fechaHasta ? fechaHasta.format('DD/MM/YYYY') : '',
        },
        {
          totalIngresos,
          totalEgresos,
          flujoNeto,
          totalMovimientos: movimientos.length,
        }
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error al generar el PDF. Intente nuevamente.');
    }
  };

  const handlePaymentMethodClick = (metodoPago: string) => {
    setSelectedMetodoPago(metodoPago as MetodoPago);
    // Scroll to table
    setTimeout(() => {
      const tableElement = document.getElementById('movimientos-table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleQuickFilter = (filter: string, desde: Dayjs, hasta: Dayjs) => {
    setFechaDesde(desde);
    setFechaHasta(hasta);
    setActiveFilter(filter);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" display="flex" alignItems="center">
              <AccountBalanceIcon sx={{ mr: 2 }} />
              Flujo de Caja - Dashboard Profesional
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {movimientos.length} movimientos
              {fechaDesde && fechaHasta && (
                <> | {fechaDesde.format('DD/MM/YYYY')} - {fechaHasta.format('DD/MM/YYYY')}</>
              )}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportPDF}
              disabled={movimientos.length === 0}
            >
              Exportar PDF
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData}>
              Actualizar
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Date Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" mb={2}>
            Filtros por Fecha
          </Typography>

          {/* Quick Filters */}
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            Filtros Rápidos:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Button
              size="small"
              variant={activeFilter === 'today' ? 'contained' : 'outlined'}
              onClick={() => handleQuickFilter('today', dayjs(), dayjs())}
            >
              Hoy
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'lastweek' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('lastweek', dayjs().subtract(7, 'day'), dayjs())
              }
            >
              Última Semana
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'last30days' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('last30days', dayjs().subtract(30, 'day'), dayjs())
              }
            >
              Últimos 30 días
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'thismonth' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter(
                  'thismonth',
                  dayjs().startOf('month'),
                  dayjs().endOf('month')
                )
              }
            >
              Este Mes
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'lastmonth' ? 'contained' : 'outlined'}
              onClick={() => {
                const lastMonthStart = dayjs().subtract(1, 'month').startOf('month');
                const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month');
                handleQuickFilter('lastmonth', lastMonthStart, lastMonthEnd);
              }}
            >
              Mes Anterior
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'last3months' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('last3months', dayjs().subtract(3, 'month'), dayjs())
              }
            >
              Últimos 3 Meses
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'last6months' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('last6months', dayjs().subtract(6, 'month'), dayjs())
              }
            >
              Últimos 6 Meses
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'thisyear' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('thisyear', dayjs().startOf('year'), dayjs())
              }
            >
              Este Año
            </Button>
          </Box>

          {/* Custom Date Range */}
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            Fechas Personalizadas:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(newValue) => {
                setFechaDesde(newValue);
                setActiveFilter('custom');
              }}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(newValue) => {
                setFechaHasta(newValue);
                setActiveFilter('custom');
              }}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Button variant="contained" onClick={loadData}>
              Aplicar Filtros
            </Button>
          </Box>
        </Paper>

        {/* KPI Cards */}
        <Box mb={4}>
          <FlujoCajaKPICards kpis={kpis} loading={loading} />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Charts Section */}
        <Box mb={4}>
          <FlujoCajaCharts
            paymentMethodData={paymentMethodData}
            timeSeriesData={timeSeriesData}
            onPaymentMethodClick={handlePaymentMethodClick}
            loading={loading}
            granularity={granularity}
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Payment Method Breakdown */}
        <Box mb={4}>
          <FlujoCajaPaymentBreakdown
            paymentMethodData={paymentMethodData}
            chequeStatusData={chequeStatusData}
            totalGeneral={totalGeneral}
            loading={loading}
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Detailed Table */}
        <Box id="movimientos-table">
          <FlujoCajaMovimientosTable movimientos={movimientos} loading={loading} />
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Este dashboard muestra el flujo de caja completo con desglose
            por método de pago.
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <Typography component="li" variant="body2">
              <strong>Ingresos:</strong> Pagos recibidos de clientes
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Egresos:</strong> Pagos realizados a proveedores
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Métodos de Pago:</strong> Efectivo, Transferencia, Cheques, Tarjetas, etc.
            </Typography>
          </Box>
        </Alert>
      </Box>
    </LocalizationProvider>
  );
};

export default FlujoCajaPage;
