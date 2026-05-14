import React, { useState, useEffect, useMemo, useReducer } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  MoneyOff as MoneyOffIcon,
  AttachMoney as AttachMoneyIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { useFlujoCaja } from '../../../hooks/useFlujoCaja';
import { useSmartRefresh, formatLastUpdated } from '../../../hooks/useSmartRefresh';
import type {
  MetodoPago,
  PaymentMethodAggregation,
  ChequeStatusAggregation,
  TimeSeriesData,
  ResumenChequesDTO,
  FlujoCajaMovimientoEnhanced,
} from '../../../types';
import {
  aggregateByPaymentMethod,
  aggregateChequeStatus,
  prepareTimeSeriesData,
  getOptimalGranularity,
  convertSaldosToAggregation,
  convertResumenChequesToAggregation,
  convertEvolucionToTimeSeries,
  calculateKPIsFromBackend,
} from '../../../utils/flujoCajaUtils';
import { generateFlujoCajaPDF, captureElementAsImage } from '../../../utils/pdfExportUtils';
import FlujoCajaKPICards from './components/FlujoCajaKPICards';
import FlujoCajaCharts from './components/FlujoCajaCharts';
import FlujoCajaPaymentBreakdown from './components/FlujoCajaPaymentBreakdown';
import FlujoCajaMovimientosTable from './components/FlujoCajaMovimientosTable';
import CajasAhorroUSDSection from './components/CajasAhorroUSDSection';
import MovimientoExtraDialog from './dialogs/MovimientoExtraDialog';
import TransferirPesosDialog from '../CajasPesos/dialogs/TransferirPesosDialog';
import { movimientoExtraApi } from '../../../api/services/movimientoExtraApi';
import LoadingOverlay from '../../common/LoadingOverlay';
import ConfirmDialog from '../../common/ConfirmDialog';

dayjs.locale('es');

const FlujoCajaPage: React.FC = () => {
  // Theme and responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fechas y filtros
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(dayjs().subtract(3, 'month'));
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(dayjs());
  const [activeFilter, setActiveFilter] = useState<string>('last3months');
  const [_selectedMetodoPago, setSelectedMetodoPago] = useState<MetodoPago | 'ALL'>('ALL');
  const [localError, setLocalError] = useState<string | null>(null);

  // Movimientos extras state
  const [movimientoDialogOpen, setMovimientoDialogOpen] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState<FlujoCajaMovimientoEnhanced | null>(null);
  const [tipoDialogInicial, setTipoDialogInicial] = useState<'INGRESO' | 'EGRESO'>('EGRESO');

  // Transferencia entre cajas pesos
  const [transferirDialogOpen, setTransferirDialogOpen] = useState(false);
  const [movimientoToAnular, setMovimientoToAnular] = useState<number | null>(null);
  const [anularLoading, setAnularLoading] = useState(false);

  // React Query — datos del flujo de caja
  const {
    data: rawData,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
    invalidate,
    dataUpdatedAt,
  } = useFlujoCaja(fechaDesde, fechaHasta);

  // Auto-refresh inteligente: sólo cuando el usuario está idle y no hay modal abierto
  useSmartRefresh({ onRefetch: refetch, hasOpenModal: movimientoDialogOpen });

  // Forzar re-render periódico para actualizar el texto "Última actualización"
  const [, tickLastUpdated] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const interval = setInterval(tickLastUpdated, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Computed data with useMemo for performance
  const movimientos = useMemo(() => {
    return rawData?.movimientos || [];
  }, [rawData]);

  // Usar datos del backend si están disponibles, sino calcular en frontend
  const paymentMethodData: PaymentMethodAggregation[] = useMemo(() => {
    if (rawData?.saldosPorMetodoPago && rawData.saldosPorMetodoPago.length > 0) {
      return convertSaldosToAggregation(rawData.saldosPorMetodoPago);
    }
    return aggregateByPaymentMethod(movimientos);
  }, [rawData, movimientos]);

  const chequeStatusData: ChequeStatusAggregation[] = useMemo(() => {
    if (rawData?.resumenCheques) {
      return convertResumenChequesToAggregation(rawData.resumenCheques);
    }
    return aggregateChequeStatus(movimientos);
  }, [rawData, movimientos]);

  const resumenCheques: ResumenChequesDTO | undefined = useMemo(() => {
    return rawData?.resumenCheques;
  }, [rawData]);

  const granularity = useMemo(() => {
    return getOptimalGranularity(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  const timeSeriesData: TimeSeriesData[] = useMemo(() => {
    if (rawData?.evolucionDiaria && rawData.evolucionDiaria.length > 0) {
      return convertEvolucionToTimeSeries(rawData.evolucionDiaria);
    }
    return prepareTimeSeriesData(movimientos, granularity);
  }, [rawData, movimientos, granularity]);

  const totalIngresos = rawData?.totalIngresos || 0;
  const totalEgresos = rawData?.totalEgresos || 0;
  const flujoNeto = rawData?.flujoNeto || 0;
  const totalMovimientos = rawData?.totalMovimientos || 0;

  const kpis = useMemo(() => {
    if (!rawData) {
      return {
        totalIngresos: 0,
        totalEgresos: 0,
        flujoNeto: 0,
        totalMovimientos: 0,
        ticketPromedio: 0,
        medianaTransaccion: 0,
        mayorIngreso: { importe: 0, entidad: '', fecha: '' },
        mayorEgreso: { importe: 0, entidad: '', fecha: '' },
        metodoPagoMasUsado: { metodo: 'EFECTIVO' as MetodoPago, cantidad: 0, porcentaje: 0 },
        promedioIngresoDiario: 0,
        promedioEgresoDiario: 0,
      };
    }
    return calculateKPIsFromBackend(rawData);
  }, [rawData]);

  const totalGeneral = totalIngresos + totalEgresos;

  // Handlers
  const handleExportPDF = async () => {
    try {
      const [pieImg, barImg, lineImg] = await Promise.all([
        captureElementAsImage('flujo-pie-chart'),
        captureElementAsImage('flujo-bar-chart'),
        captureElementAsImage('flujo-line-chart'),
      ]);
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
          totalMovimientos,
        },
        { pieChartImgData: pieImg, barChartImgData: barImg, lineChartImgData: lineImg }
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      setLocalError('Error al generar el PDF. Intente nuevamente.');
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

  const handleEditMovimiento = (movimiento: FlujoCajaMovimientoEnhanced) => {
    setEditingMovimiento(movimiento);
    setMovimientoDialogOpen(true);
  };

  const handleAnularMovimiento = (movimientoExtraId: number) => {
    setMovimientoToAnular(movimientoExtraId);
  };

  const handleConfirmAnularMovimiento = async () => {
    if (movimientoToAnular == null) return;
    setAnularLoading(true);
    try {
      await movimientoExtraApi.anular(movimientoToAnular);
      invalidate();
      setMovimientoToAnular(null);
    } catch (err: any) {
      console.error('Error al anular movimiento:', err);
      setLocalError('Error al anular el movimiento. Por favor intentá de nuevo.');
    } finally {
      setAnularLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={{ xs: 2, sm: 3 }}>
        <LoadingOverlay open={isLoading} message="Cargando flujo de caja..." />
        {/* Header */}
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
          mb={3}
        >
          <Box>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              display="flex"
              alignItems="center"
            >
              <AccountBalanceIcon sx={{ mr: { xs: 1, sm: 2 } }} />
              {isMobile ? 'Flujo de Caja' : 'Flujo de Caja - Dashboard Profesional'}
              {isFetching && (
                <CircularProgress size={18} sx={{ ml: 2, color: 'text.secondary' }} />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {totalMovimientos} movimientos
              {fechaDesde && fechaHasta && (
                <> | {fechaDesde.format('DD/MM/YYYY')} - {fechaHasta.format('DD/MM/YYYY')}</>
              )}
              {dataUpdatedAt > 0 && (
                <> | Actualizado: {formatLastUpdated(dataUpdatedAt)}</>
              )}
            </Typography>
          </Box>
          <Box
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
            width={{ xs: '100%', sm: 'auto' }}
          >
            <Button
              variant="contained"
              color="error"
              startIcon={!isMobile && <MoneyOffIcon />}
              onClick={() => {
                setEditingMovimiento(null);
                setTipoDialogInicial('EGRESO');
                setMovimientoDialogOpen(true);
              }}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'medium'}
            >
              {isMobile ? 'Gasto Extra' : 'Registrar Gasto Extra'}
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={!isMobile && <AttachMoneyIcon />}
              onClick={() => {
                setEditingMovimiento(null);
                setTipoDialogInicial('INGRESO');
                setMovimientoDialogOpen(true);
              }}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'medium'}
            >
              {isMobile ? 'Cobro Extra' : 'Registrar Cobro Extra'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={!isMobile && <SwapHorizIcon />}
              onClick={() => setTransferirDialogOpen(true)}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'medium'}
            >
              {isMobile ? 'Transferir' : 'Transferir entre cajas'}
            </Button>
            <Button
              variant="contained"
              startIcon={!isMobile && <DownloadIcon />}
              onClick={handleExportPDF}
              disabled={movimientos.length === 0}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'medium'}
            >
              {isMobile ? 'Exportar PDF' : 'Exportar PDF'}
            </Button>
            <Button
              variant="outlined"
              startIcon={isFetching ? <CircularProgress size={16} /> : (!isMobile && <RefreshIcon />)}
              onClick={() => refetch()}
              disabled={isFetching}
              fullWidth={isMobile}
              size={isMobile ? 'medium' : 'medium'}
            >
              Actualizar
            </Button>
          </Box>
        </Box>

        {(isError || localError) && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLocalError(null)}>
            {localError ?? (queryError?.message || 'Error al cargar el flujo de caja.')}
          </Alert>
        )}

        {/* Alerta de cheques por vencer */}
        {resumenCheques && resumenCheques.porVencer7Dias.cantidad > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Atención:</strong> Tienes {resumenCheques.porVencer7Dias.cantidad} cheque(s)
              por vencer en los próximos 7 días por un total de
              <strong> ${resumenCheques.porVencer7Dias.monto.toLocaleString('es-AR')}</strong>
            </Typography>
          </Alert>
        )}

        {/* Date Filters */}
        <Paper sx={{ p: { xs: 2, sm: 2 }, mb: 3 }}>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} mb={2}>
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
              {isMobile ? '7d' : 'Última Semana'}
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'last30days' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('last30days', dayjs().subtract(30, 'day'), dayjs())
              }
            >
              {isMobile ? '30d' : 'Últimos 30 días'}
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
              {isMobile ? 'Mes' : 'Este Mes'}
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
              {isMobile ? 'Ant.' : 'Mes Anterior'}
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'last3months' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('last3months', dayjs().subtract(3, 'month'), dayjs())
              }
            >
              3M
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'last6months' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('last6months', dayjs().subtract(6, 'month'), dayjs())
              }
            >
              6M
            </Button>
            <Button
              size="small"
              variant={activeFilter === 'thisyear' ? 'contained' : 'outlined'}
              onClick={() =>
                handleQuickFilter('thisyear', dayjs().startOf('year'), dayjs())
              }
            >
              {isMobile ? 'Año' : 'Este Año'}
            </Button>
          </Box>

          {/* Custom Date Range */}
          <Typography variant="subtitle2" color="text.secondary" mb={1.5}>
            Fechas Personalizadas:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(newValue) => {
                setFechaDesde(newValue as Dayjs | null);
                setActiveFilter('custom');
              }}
              slotProps={{ textField: { size: 'small', fullWidth: isMobile } }}
            />
            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(newValue) => {
                setFechaHasta(newValue as Dayjs | null);
                setActiveFilter('custom');
              }}
              slotProps={{ textField: { size: 'small', fullWidth: isMobile } }}
            />
            <Button variant="contained" onClick={() => refetch()} disabled={isFetching} fullWidth={isMobile}>
              Aplicar Filtros
            </Button>
          </Box>
        </Paper>

        {/* KPI Cards */}
        <Box mb={4}>
          <FlujoCajaKPICards kpis={kpis} loading={isFetching} />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Cajas de Ahorro USD */}
        <Box mb={4}>
          <CajasAhorroUSDSection />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Charts Section */}
        <Box mb={4}>
          <FlujoCajaCharts
            paymentMethodData={paymentMethodData}
            timeSeriesData={timeSeriesData}
            onPaymentMethodClick={handlePaymentMethodClick}
            loading={isFetching}
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
            loading={isFetching}
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Detailed Table */}
        <Box id="movimientos-table">
          <FlujoCajaMovimientosTable
            movimientos={movimientos}
            loading={isFetching}
            onEdit={handleEditMovimiento}
            onAnular={handleAnularMovimiento}
          />
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> Este dashboard muestra el flujo de caja completo con desglose
            por método de pago y saldos en tiempo real.
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            <Typography component="li" variant="body2">
              <strong>Saldos:</strong> Muestran cuánto tienes disponible por cada método de pago (Ingresos - Egresos)
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Cheques:</strong> Incluye resumen de estados (En cartera, Depositados, Cobrados, etc.)
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Métodos:</strong> Efectivo, Transferencia, Cheques, Tarjetas, Cuenta Corriente, etc.
            </Typography>
          </Box>
        </Alert>

        {/* Movimiento Extra Dialog */}
        <MovimientoExtraDialog
          open={movimientoDialogOpen}
          onClose={() => {
            setMovimientoDialogOpen(false);
            setEditingMovimiento(null);
          }}
          onSuccess={() => {
            invalidate();
            setMovimientoDialogOpen(false);
            setEditingMovimiento(null);
          }}
          editingMovimiento={editingMovimiento}
          tipoInicial={tipoDialogInicial}
        />

        <TransferirPesosDialog
          open={transferirDialogOpen}
          onClose={() => setTransferirDialogOpen(false)}
          onSuccess={() => {
            invalidate();
            setTransferirDialogOpen(false);
          }}
        />

        <ConfirmDialog
          open={movimientoToAnular != null}
          onClose={() => setMovimientoToAnular(null)}
          onConfirm={handleConfirmAnularMovimiento}
          title="¿Anular movimiento?"
          severity="warning"
          warning="El movimiento dejará de impactar en el flujo de caja. Esta acción no se puede deshacer."
          description="¿Estás seguro de que querés anular este movimiento del flujo de caja?"
          confirmLabel="Anular movimiento"
          loadingLabel="Anulando…"
          loading={anularLoading}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default FlujoCajaPage;
