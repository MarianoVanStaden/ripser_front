import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp,
  TrendingDown,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { generateFlujoCajaPDF } from '../../utils/pdfExportUtils';
import LoadingOverlay from '../common/LoadingOverlay';

// Tipos de movimiento
type TipoMovimiento = 'INGRESO' | 'EGRESO';
type OrigenMovimiento = 
  | 'PAGO_CLIENTE' 
  | 'PAGO_PROVEEDOR' 
  | 'VENTA' 
  | 'COMPRA' 
  | 'COBRO_CUENTA_CORRIENTE'
  | 'PAGO_CUENTA_CORRIENTE'
  | 'AJUSTE_MANUAL'
  | 'OTRO';

interface MovimientoFlujoCaja {
  id: number;
  fecha: string;
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  entidad: string; // Cliente o Proveedor
  entidadId?: number;
  concepto: string;
  numeroComprobante?: string;
  importe: number;
  metodoPago?: string;
  cuentaBancaria?: string;
  observaciones?: string;
}

interface Filters {
  fechaDesde: string;
  fechaHasta: string;
  tipoMovimiento: TipoMovimiento | 'TODOS';
  origenMovimiento: OrigenMovimiento | 'TODOS';
  entidadFilter: string;
  metodoPagoFilter: string;
  cuentaBancariaFilter: string;
  montoMinimo: string;
  montoMaximo: string;
  searchTerm: string;
}

const FlujoCajaPage: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovimientoFlujoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filtros - Por defecto muestra los últimos 3 meses
  const getDefaultFechaDesde = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState<Filters>({
    fechaDesde: getDefaultFechaDesde(),
    fechaHasta: new Date().toISOString().split('T')[0],
    tipoMovimiento: 'TODOS',
    origenMovimiento: 'TODOS',
    entidadFilter: '',
    metodoPagoFilter: 'TODOS',
    cuentaBancariaFilter: 'TODOS',
    montoMinimo: '',
    montoMaximo: '',
    searchTerm: '',
  });

  // Mock data - Replace with actual API call
  useEffect(() => {
    loadMovimientos();
  }, []);

  const loadMovimientos = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const data = await flujoCajaApi.getMovimientos(filters);
      
      // Mock data for demonstration
      const mockData: MovimientoFlujoCaja[] = [
        {
          id: 1,
          fecha: '2024-01-15',
          tipo: 'INGRESO',
          origen: 'PAGO_CLIENTE',
          entidad: 'Cliente ABC',
          entidadId: 1,
          concepto: 'Pago de factura #001',
          numeroComprobante: 'REC-001',
          importe: 50000,
          metodoPago: 'TRANSFERENCIA_BANCARIA',
          cuentaBancaria: 'Banco Nación - CC 123',
        },
        {
          id: 2,
          fecha: '2024-01-16',
          tipo: 'EGRESO',
          origen: 'PAGO_PROVEEDOR',
          entidad: 'Proveedor XYZ',
          entidadId: 2,
          concepto: 'Pago de orden de compra #045',
          numeroComprobante: 'PROV-045',
          importe: 25000,
          metodoPago: 'CHEQUE',
          cuentaBancaria: 'Banco Galicia - CC 456',
        },
      ];
      
      setMovimientos(mockData);
    } catch (error) {
      console.error('Error loading movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar movimientos
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter((mov) => {
      // Filtro por fechas
      const movFecha = new Date(mov.fecha);
      const fechaDesde = filters.fechaDesde ? new Date(filters.fechaDesde) : null;
      const fechaHasta = filters.fechaHasta ? new Date(filters.fechaHasta) : null;
      
      if (fechaDesde && movFecha < fechaDesde) return false;
      if (fechaHasta && movFecha > fechaHasta) return false;

      // Filtro por tipo de movimiento
      if (filters.tipoMovimiento !== 'TODOS' && mov.tipo !== filters.tipoMovimiento) return false;

      // Filtro por origen
      if (filters.origenMovimiento !== 'TODOS' && mov.origen !== filters.origenMovimiento) return false;

      // Filtro por entidad (cliente/proveedor)
      if (filters.entidadFilter && !mov.entidad.toLowerCase().includes(filters.entidadFilter.toLowerCase())) {
        return false;
      }

      // Filtro por método de pago
      if (filters.metodoPagoFilter !== 'TODOS' && mov.metodoPago !== filters.metodoPagoFilter) return false;

      // Filtro por cuenta bancaria
      if (filters.cuentaBancariaFilter !== 'TODOS' && mov.cuentaBancaria !== filters.cuentaBancariaFilter) {
        return false;
      }

      // Filtro por monto mínimo
      if (filters.montoMinimo && mov.importe < Number(filters.montoMinimo)) return false;

      // Filtro por monto máximo
      if (filters.montoMaximo && mov.importe > Number(filters.montoMaximo)) return false;

      // Búsqueda general
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          mov.entidad.toLowerCase().includes(searchLower) ||
          mov.concepto.toLowerCase().includes(searchLower) ||
          mov.numeroComprobante?.toLowerCase().includes(searchLower) ||
          mov.observaciones?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [movimientos, filters]);

  // Calcular resumen
  const summary = useMemo(() => {
    const totalIngresos = filteredMovimientos
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + m.importe, 0);

    const totalEgresos = filteredMovimientos
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + m.importe, 0);

    const flujoNeto = totalIngresos - totalEgresos;
    const totalMovimientos = filteredMovimientos.length;

    return {
      totalIngresos,
      totalEgresos,
      flujoNeto,
      totalMovimientos,
    };
  }, [filteredMovimientos]);

  // Obtener listas únicas para filtros
  const uniqueMetodosPago = useMemo(() => {
    const metodos = new Set(movimientos.map((m) => m.metodoPago).filter(Boolean));
    return Array.from(metodos);
  }, [movimientos]);

  const uniqueCuentasBancarias = useMemo(() => {
    const cuentas = new Set(movimientos.map((m) => m.cuentaBancaria).filter(Boolean));
    return Array.from(cuentas);
  }, [movimientos]);

  // Filtros rápidos de fechas
  const applyQuickDateFilter = (type: 'today' | 'week' | 'month' | 'last_month' | '3_months' | '6_months' | 'year' | 'all') => {
    const today = new Date();
    let fechaDesde: string;

    switch (type) {
      case 'today':
        fechaDesde = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        fechaDesde = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        fechaDesde = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        setFilters({
          ...filters,
          fechaDesde: lastMonthStart.toISOString().split('T')[0],
          fechaHasta: lastMonthEnd.toISOString().split('T')[0],
        });
        return;
      case '3_months':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        fechaDesde = threeMonthsAgo.toISOString().split('T')[0];
        break;
      case '6_months':
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        fechaDesde = sixMonthsAgo.toISOString().split('T')[0];
        break;
      case 'year':
        fechaDesde = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'all':
        fechaDesde = '';
        break;
    }

    setFilters({
      ...filters,
      fechaDesde,
      fechaHasta: type === 'all' ? '' : today.toISOString().split('T')[0],
    });
  };

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: getDefaultFechaDesde(),
      fechaHasta: new Date().toISOString().split('T')[0],
      tipoMovimiento: 'TODOS',
      origenMovimiento: 'TODOS',
      entidadFilter: '',
      metodoPagoFilter: 'TODOS',
      cuentaBancariaFilter: 'TODOS',
      montoMinimo: '',
      montoMaximo: '',
      searchTerm: '',
    });
  };

  const handleExportPDF = async () => {
    try {
      await generateFlujoCajaPDF(filteredMovimientos, filters, summary);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const getOrigenLabel = (origen: OrigenMovimiento): string => {
    const labels: Record<OrigenMovimiento, string> = {
      PAGO_CLIENTE: 'Pago de Cliente',
      PAGO_PROVEEDOR: 'Pago a Proveedor',
      VENTA: 'Venta',
      COMPRA: 'Compra',
      COBRO_CUENTA_CORRIENTE: 'Cobro CC',
      PAGO_CUENTA_CORRIENTE: 'Pago CC',
      AJUSTE_MANUAL: 'Ajuste Manual',
      OTRO: 'Otro',
    };
    return labels[origen] || origen;
  };

  return (
    <Box p={3}>
      <LoadingOverlay open={loading} message="Cargando flujo de caja..." />
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Flujo de Caja
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Mostrando {filteredMovimientos.length} de {movimientos.length} movimientos
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={showFilters ? <ClearIcon /> : <FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleExportPDF}
            disabled={filteredMovimientos.length === 0}
          >
            Exportar PDF
          </Button>
        </Stack>
      </Box>

      {/* Quick Date Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" mb={1.5} fontWeight="medium">
            Filtros Rápidos por Fecha
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('today')}
              sx={{ textTransform: 'none' }}
            >
              Hoy
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('week')}
              sx={{ textTransform: 'none' }}
            >
              Última Semana
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('month')}
              sx={{ textTransform: 'none' }}
            >
              Este Mes
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('last_month')}
              sx={{ textTransform: 'none' }}
            >
              Mes Anterior
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => applyQuickDateFilter('3_months')}
              sx={{ textTransform: 'none' }}
            >
              Últimos 3 Meses
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('6_months')}
              sx={{ textTransform: 'none' }}
            >
              Últimos 6 Meses
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('year')}
              sx={{ textTransform: 'none' }}
            >
              Este Año
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyQuickDateFilter('all')}
              sx={{ textTransform: 'none' }}
            >
              Todo
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Resumen */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Ingresos
                </Typography>
              </Box>
              <Typography variant="h5" color="success.main" fontWeight="bold">
                ${summary.totalIngresos.toLocaleString('es-AR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDown color="error" />
                <Typography variant="subtitle2" color="text.secondary">
                  Egresos
                </Typography>
              </Box>
              <Typography variant="h5" color="error.main" fontWeight="bold">
                ${summary.totalEgresos.toLocaleString('es-AR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalanceIcon color={summary.flujoNeto >= 0 ? 'success' : 'error'} />
                <Typography variant="subtitle2" color="text.secondary">
                  Flujo Neto
                </Typography>
              </Box>
              <Typography
                variant="h5"
                color={summary.flujoNeto >= 0 ? 'success.main' : 'error.main'}
                fontWeight="bold"
              >
                ${summary.flujoNeto.toLocaleString('es-AR')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>
                Total Movimientos
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {summary.totalMovimientos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Filtros Avanzados
              </Typography>
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Limpiar Filtros
              </Button>
            </Box>

            <Grid container spacing={2}>
              {/* Búsqueda General */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Buscar por entidad, concepto, comprobante..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  size="small"
                />
              </Grid>

              {/* Tipo de Movimiento */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select
                    value={filters.tipoMovimiento}
                    label="Tipo de Movimiento"
                    onChange={(e) => setFilters({ ...filters, tipoMovimiento: e.target.value as any })}
                  >
                    <MenuItem value="TODOS">Todos</MenuItem>
                    <MenuItem value="INGRESO">Ingresos</MenuItem>
                    <MenuItem value="EGRESO">Egresos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Origen del Movimiento */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Origen</InputLabel>
                  <Select
                    value={filters.origenMovimiento}
                    label="Origen"
                    onChange={(e) => setFilters({ ...filters, origenMovimiento: e.target.value as any })}
                  >
                    <MenuItem value="TODOS">Todos</MenuItem>
                    <MenuItem value="PAGO_CLIENTE">Pago de Cliente</MenuItem>
                    <MenuItem value="PAGO_PROVEEDOR">Pago a Proveedor</MenuItem>
                    <MenuItem value="VENTA">Venta</MenuItem>
                    <MenuItem value="COMPRA">Compra</MenuItem>
                    <MenuItem value="COBRO_CUENTA_CORRIENTE">Cobro CC</MenuItem>
                    <MenuItem value="PAGO_CUENTA_CORRIENTE">Pago CC</MenuItem>
                    <MenuItem value="AJUSTE_MANUAL">Ajuste Manual</MenuItem>
                    <MenuItem value="OTRO">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fecha Desde */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Fecha Desde"
                  type="date"
                  value={filters.fechaDesde}
                  onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              {/* Fecha Hasta */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Fecha Hasta"
                  type="date"
                  value={filters.fechaHasta}
                  onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>

              {/* Entidad (Cliente/Proveedor) */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Cliente/Proveedor"
                  placeholder="Filtrar por nombre..."
                  value={filters.entidadFilter}
                  onChange={(e) => setFilters({ ...filters, entidadFilter: e.target.value })}
                  size="small"
                />
              </Grid>

              {/* Método de Pago */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={filters.metodoPagoFilter}
                    label="Método de Pago"
                    onChange={(e) => setFilters({ ...filters, metodoPagoFilter: e.target.value })}
                  >
                    <MenuItem value="TODOS">Todos</MenuItem>
                    {uniqueMetodosPago.map((metodo) => (
                      <MenuItem key={metodo} value={metodo}>
                        {metodo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Cuenta Bancaria */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cuenta Bancaria</InputLabel>
                  <Select
                    value={filters.cuentaBancariaFilter}
                    label="Cuenta Bancaria"
                    onChange={(e) => setFilters({ ...filters, cuentaBancariaFilter: e.target.value })}
                  >
                    <MenuItem value="TODOS">Todas</MenuItem>
                    {uniqueCuentasBancarias.map((cuenta) => (
                      <MenuItem key={cuenta} value={cuenta}>
                        {cuenta}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Monto Mínimo */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Monto Mínimo"
                  type="number"
                  value={filters.montoMinimo}
                  onChange={(e) => setFilters({ ...filters, montoMinimo: e.target.value })}
                  InputProps={{ startAdornment: '$' }}
                  size="small"
                />
              </Grid>

              {/* Monto Máximo */}
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Monto Máximo"
                  type="number"
                  value={filters.montoMaximo}
                  onChange={(e) => setFilters({ ...filters, montoMaximo: e.target.value })}
                  InputProps={{ startAdornment: '$' }}
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Active Filters Summary */}
            <Box mt={2}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" mb={1}>
                Filtros activos:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {/* Siempre mostrar el rango de fechas */}
                <Chip
                  label={`Fechas: ${filters.fechaDesde ? new Date(filters.fechaDesde).toLocaleDateString('es-AR') : 'Inicio'} - ${filters.fechaHasta ? new Date(filters.fechaHasta).toLocaleDateString('es-AR') : 'Hoy'}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {filters.tipoMovimiento !== 'TODOS' && (
                  <Chip
                    label={`Tipo: ${filters.tipoMovimiento}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, tipoMovimiento: 'TODOS' })}
                  />
                )}
                {filters.origenMovimiento !== 'TODOS' && (
                  <Chip
                    label={`Origen: ${getOrigenLabel(filters.origenMovimiento as OrigenMovimiento)}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, origenMovimiento: 'TODOS' })}
                  />
                )}
                {filters.searchTerm && (
                  <Chip
                    label={`Búsqueda: "${filters.searchTerm}"`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, searchTerm: '' })}
                  />
                )}
                {filters.entidadFilter && (
                  <Chip
                    label={`Entidad: "${filters.entidadFilter}"`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, entidadFilter: '' })}
                  />
                )}
                {filters.metodoPagoFilter !== 'TODOS' && (
                  <Chip
                    label={`Método: ${filters.metodoPagoFilter}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, metodoPagoFilter: 'TODOS' })}
                  />
                )}
                {filters.cuentaBancariaFilter !== 'TODOS' && (
                  <Chip
                    label={`Cuenta: ${filters.cuentaBancariaFilter}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, cuentaBancariaFilter: 'TODOS' })}
                  />
                )}
                {filters.montoMinimo && (
                  <Chip
                    label={`Min: $${filters.montoMinimo}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, montoMinimo: '' })}
                  />
                )}
                {filters.montoMaximo && (
                  <Chip
                    label={`Max: $${filters.montoMaximo}`}
                    size="small"
                    onDelete={() => setFilters({ ...filters, montoMaximo: '' })}
                  />
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Movimientos */}
      <Card>
        <CardContent>
          {filteredMovimientos.length === 0 ? (
            <Alert severity="info">
              No se encontraron movimientos con los filtros aplicados.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Entidad</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Comprobante</TableCell>
                    <TableCell>Método Pago</TableCell>
                    <TableCell align="right">Importe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{new Date(mov.fecha).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell>
                        <Chip
                          label={mov.tipo}
                          size="small"
                          color={mov.tipo === 'INGRESO' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>{getOrigenLabel(mov.origen)}</TableCell>
                      <TableCell>{mov.entidad}</TableCell>
                      <TableCell>{mov.concepto}</TableCell>
                      <TableCell>{mov.numeroComprobante || '-'}</TableCell>
                      <TableCell>{mov.metodoPago || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight="bold"
                          color={mov.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                        >
                          {mov.tipo === 'INGRESO' ? '+' : '-'}${mov.importe.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FlujoCajaPage;
