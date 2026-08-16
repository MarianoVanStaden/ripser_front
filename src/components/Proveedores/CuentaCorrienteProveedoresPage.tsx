import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TablePagination,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
  Autocomplete,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { proveedorApi } from '../../api/services/proveedorApi';
import { cuentaCorrienteProveedorApi } from '../../api/services/cuentaCorrienteProveedorApi';
import type { CuentaCorrienteProveedor, TipoMovimiento, MetodoPago } from '../../types';
import { metodoPagoRequiereCaja, type CajaRef } from '../../types/caja.types';
import { CajaSelector } from '../common/CajaSelector';
import { generateCuentaCorrienteProveedorPDF } from '../../utils/pdfExportUtils';
import LoadingOverlay from '../common/LoadingOverlay';
import { usePermisos } from '../../hooks/usePermisos';

dayjs.locale('es');

interface Proveedor {
  id: number;
  nombre: string;
  razonSocial?: string;
  saldoActual?: number;
}

const CuentaCorrienteProveedoresPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { esAdmin, esSuperAdmin } = usePermisos();
  // Backdating solo ADMIN pleno o SUPER_ADMIN (coincide con esAdmin() del backend); excluye
  // ADMIN_EMPRESA_LIMITADO por pedido del dueño (control de arqueos). Tope: 1° del mes anterior.
  const puedeBackdatear = esAdmin || esSuperAdmin;
  const minFechaMovimiento = dayjs().startOf('month').subtract(1, 'month');
  const queryClient = useQueryClient();
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const proveedoresQuery = useQuery({
    queryKey: ['proveedores', 'catalogo-cc'],
    queryFn: () => proveedorApi.getAll({ size: 1000 }).then((r) => r.content),
    staleTime: 300_000,
  });
  const proveedores: Proveedor[] = proveedoresQuery.data ?? [];
  const movimientosQuery = useQuery({
    queryKey: ['cc-proveedor', selectedProveedor?.id],
    queryFn: () => cuentaCorrienteProveedorApi.getByProveedorId(selectedProveedor!.id),
    enabled: !!selectedProveedor,
  });
  const movimientos: CuentaCorrienteProveedor[] = selectedProveedor
    ? (movimientosQuery.data ?? [])
    : [];
  const loading = proveedoresQuery.isPending || (movimientosQuery.isPending && !!selectedProveedor);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); // spinner de guardar movimiento/ajuste
  const error = proveedoresQuery.error
    ? 'Error al cargar los proveedores.'
    : movimientosQuery.error
      ? 'Error al cargar los movimientos del proveedor.'
      : actionError;
  const setError = setActionError;
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoMovimiento | ''>('');
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(null);
  const [openMovimientoDialog, setOpenMovimientoDialog] = useState(false);
  const [newMovimiento, setNewMovimiento] = useState({
    tipo: 'DEBITO' as TipoMovimiento,
    importe: 0,
    concepto: '',
    numeroComprobante: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
  });
  const [cajaRef, setCajaRef] = useState<CajaRef | null>(null);
  // Fecha del movimiento (fecha de negocio). Default hoy; editable solo si puedeBackdatear.
  const [fechaMovimiento, setFechaMovimiento] = useState<Dayjs>(dayjs());
  // Corrección de saldo (ADMIN): ajusta la CC sin generar movimiento de caja.
  const [openAjusteDialog, setOpenAjusteDialog] = useState(false);
  const [newAjuste, setNewAjuste] = useState({
    tipo: 'CREDITO' as TipoMovimiento,
    importe: 0,
    concepto: '',
    numeroComprobante: '',
  });

  const esPago = newMovimiento.tipo === 'CREDITO';
  const requiereCaja = esPago && metodoPagoRequiereCaja(newMovimiento.metodoPago);
  const cajaFaltante = requiereCaja && !cajaRef;

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['cc-proveedor'] });
  };

  const handleProveedorChange = (proveedorId: number) => {
    const proveedor = proveedores.find((pr) => pr.id === proveedorId) || null;
    setSelectedProveedor(proveedor);
  };

  const handleSaveMovimiento = async () => {
    if (!selectedProveedor) {
      setError("Debe seleccionar un proveedor para registrar un movimiento.");
      return;
    }
    if (cajaFaltante) {
      setError('Seleccioná la caja de donde sale el pago al proveedor.');
      return;
    }

    try {
      setSaving(true);
      // Backdate solo para ADMIN+; el backend revalida rol y tope (1° del mes anterior).
      const localDateTime = puedeBackdatear && fechaMovimiento.isValid()
        ? fechaMovimiento.format('YYYY-MM-DD') + 'T' + dayjs().format('HH:mm:ss')
        : dayjs().format('YYYY-MM-DDTHH:mm:ss');

      const payload = {
        proveedorId: selectedProveedor.id,
        fecha: localDateTime,
        tipo: newMovimiento.tipo,
        importe: newMovimiento.importe,
        concepto: newMovimiento.concepto,
        numeroComprobante: newMovimiento.numeroComprobante || undefined,
        metodoPago: newMovimiento.metodoPago,
        cajaPesosId: esPago && cajaRef?.tipo === 'PESOS' ? cajaRef.id : null,
        cajaAhorroId: esPago && cajaRef?.tipo === 'AHORRO' ? cajaRef.id : null,
      };

      await cuentaCorrienteProveedorApi.create(payload);

      setNewMovimiento({
        tipo: 'DEBITO',
        importe: 0,
        concepto: '',
        numeroComprobante: '',
        metodoPago: 'EFECTIVO',
      });
      setCajaRef(null);
      setFechaMovimiento(dayjs());
      setOpenMovimientoDialog(false);

      // Refresh: invalidar movimientos + catálogo (saldo del proveedor) y
      // actualizar el seleccionado con el dato fresco.
      const proveedorActualizado = await proveedorApi.getById(selectedProveedor.id);
      setSelectedProveedor(proveedorActualizado);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cc-proveedor'] }),
        queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
      ]);
    } catch (err) {
      setError('Error al guardar el movimiento.');
      console.error('Error saving movement:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAjuste = async () => {
    if (!selectedProveedor) {
      setError('Debe seleccionar un proveedor para registrar una corrección.');
      return;
    }
    if (!newAjuste.concepto.trim()) {
      setError('El motivo de la corrección es obligatorio.');
      return;
    }
    if (newAjuste.importe <= 0) {
      setError('El importe de la corrección debe ser mayor a cero.');
      return;
    }

    try {
      setSaving(true);
      await cuentaCorrienteProveedorApi.crearAjuste({
        proveedorId: selectedProveedor.id,
        fecha: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
        tipo: newAjuste.tipo,
        importe: newAjuste.importe,
        concepto: newAjuste.concepto,
        numeroComprobante: newAjuste.numeroComprobante || undefined,
      });

      setNewAjuste({ tipo: 'CREDITO', importe: 0, concepto: '', numeroComprobante: '' });
      setOpenAjusteDialog(false);

      const proveedorActualizado = await proveedorApi.getById(selectedProveedor.id);
      setSelectedProveedor(proveedorActualizado);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cc-proveedor'] }),
        queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
      ]);
    } catch (err) {
      setError('Error al guardar la corrección.');
      console.error('Error saving ajuste:', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredMovimientos = movimientos.filter(mov => {
    const matchesSearch =
      mov.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.numeroComprobante?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesTipo = !tipoFilter || mov.tipo === tipoFilter;

    const fechaMovimiento = dayjs(mov.fecha);
    const matchesFecha =
      (!fechaDesde || fechaMovimiento.isAfter(fechaDesde.subtract(1, 'day'))) &&
      (!fechaHasta || fechaMovimiento.isBefore(fechaHasta.add(1, 'day')));

    return matchesSearch && matchesTipo && matchesFecha;
  });

  const getSaldoTotal = () => {
    // Calculate saldo from all movements:
    // DEBITO = Compra/deuda (increases what we owe)
    // CREDITO = Payment to supplier (decreases what we owe)
    // Positive balance = we owe the supplier
    // Negative balance = supplier owes us (rare, but possible with returns/credits)
    const totalDebitos = movimientos
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);

    const totalCreditos = movimientos
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);

    return totalDebitos - totalCreditos;
  };

  const getTotalDebitos = () => {
    return filteredMovimientos
      .filter(m => m.tipo === 'DEBITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);
  };

  const getTotalCreditos = () => {
    return filteredMovimientos
      .filter(m => m.tipo === 'CREDITO')
      .reduce((sum, m) => sum + (m.importe ?? 0), 0);
  };

  const handleExportarPDF = async (): Promise<void> => {
    if (!selectedProveedor) {
      setError('Debe seleccionar un proveedor para exportar el PDF.');
      return;
    }

    try {
      const saldoTotal = getSaldoTotal();
      await generateCuentaCorrienteProveedorPDF(
        selectedProveedor,
        filteredMovimientos,
        {
          searchTerm,
          tipoFilter: tipoFilter || '',
          fechaDesde: fechaDesde ? fechaDesde.format('YYYY-MM-DD') : '',
          fechaHasta: fechaHasta ? fechaHasta.format('YYYY-MM-DD') : '',
        },
        saldoTotal
      );
    } catch (err) {
      console.error('Error al generar PDF:', err);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Paginate filtered movimientos
  const paginatedMovimientos = filteredMovimientos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box p={{ xs: 2, sm: 3 }}>
        <LoadingOverlay open={loading || saving} message="Cargando cuenta corriente..." />
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" component="h1" display="flex" alignItems="center" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
            <AccountBalanceIcon sx={{ mr: 1 }} />
            Cuenta Corriente Proveedores
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportarPDF}
              disabled={!selectedProveedor}
              fullWidth={isMobile}
            >
              Exportar PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenMovimientoDialog(true)}
              disabled={!selectedProveedor}
              fullWidth={isMobile}
            >
              Nuevo Movimiento
            </Button>
            {puedeBackdatear && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<BuildIcon />}
                onClick={() => setOpenAjusteDialog(true)}
                disabled={!selectedProveedor}
                fullWidth={isMobile}
              >
                Corrección (ADMIN)
              </Button>
            )}
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(200px, 1fr))' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Saldo Actual</Typography>
              </Box>
              <Typography variant="h4" color={getSaldoTotal() > 0 ? 'error.main' : 'success.main'} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                ${Math.abs(getSaldoTotal()).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getSaldoTotal() > 0 ? 'Deuda pendiente' : getSaldoTotal() < 0 ? 'A favor nuestro' : 'Sin deuda'}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Total Débitos</Typography>
              </Box>
              <Typography variant="h4" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                ${getTotalDebitos().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingDownIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>Total Créditos</Typography>
              </Box>
              <Typography variant="h4" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                ${getTotalCreditos().toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Autocomplete
              options={proveedores}
              getOptionLabel={(p) => p.razonSocial || p.nombre}
              value={selectedProveedor}
              onChange={(_, value) => value ? handleProveedorChange(value.id) : setSelectedProveedor(null)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              sx={{ minWidth: { xs: '100%', sm: 220 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              size={isMobile ? 'small' : 'medium'}
              renderOption={(props, option) => {
                const { key: _key, ...otherProps } = props;
                return (
                  <li key={option.id} {...otherProps}>
                    {option.razonSocial || option.nombre}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Proveedor" placeholder="Buscar proveedor..." />
              )}
            />

            <TextField
              label="Buscar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />

            <TextField
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoMovimiento | '')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="DEBITO">Débito</MenuItem>
              <MenuItem value="CREDITO">Crédito</MenuItem>
            </TextField>

            <DatePicker
              label="Desde"
              value={fechaDesde}
              onChange={(newValue) => { if (newValue && !(newValue as Dayjs).isValid()) return; setFechaDesde(newValue as Dayjs | null); }}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="Hasta"
              value={fechaHasta}
              onChange={(newValue) => { if (newValue && !(newValue as Dayjs).isValid()) return; setFechaHasta(newValue as Dayjs | null); }}
              slotProps={{ textField: { size: 'small' } }}
            />

            <IconButton onClick={loadData}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Movements Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Comprobante</TableCell>
                <TableCell align="right">Importe</TableCell>
                <TableCell align="right">Saldo</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Registrado por</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMovimientos.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell>
                    {dayjs(movimiento.fecha).format('DD/MM/YYYY HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={movimiento.tipo}
                        color={movimiento.tipo === 'DEBITO' ? 'error' : 'success'}
                        size="small"
                      />
                      {movimiento.esAjuste && (
                        <Tooltip title="Corrección manual de saldo (sin impacto en caja)">
                          <Chip label="Ajuste" color="warning" size="small" variant="outlined" />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{movimiento.concepto}</TableCell>
                  <TableCell>{movimiento.numeroComprobante || '-'}</TableCell>
                  <TableCell align="right">
                    ${(movimiento.importe ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${(movimiento.saldo ?? 0).toLocaleString('es-AR')}
                  </TableCell>
                  <TableCell>
                    {movimiento.usuarioNombre ? (
                      <Tooltip title={movimiento.usuarioNombre}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                            {movimiento.usuarioNombre}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {paginatedMovimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={4}>
                      No se encontraron movimientos
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredMovimientos.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TableContainer>

        {/* New Movement Dialog */}
        <Dialog open={openMovimientoDialog} onClose={() => setOpenMovimientoDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>
            Nuevo Movimiento - {selectedProveedor?.razonSocial || selectedProveedor?.nombre}
          </DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <TextField
                fullWidth
                select
                label="Tipo de Movimiento"
                value={newMovimiento.tipo}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, tipo: e.target.value as TipoMovimiento })}
                margin="normal"
                helperText="Débito: Compra/deuda (+). Crédito: Pago al proveedor (-)"
              >
                <MenuItem value="DEBITO">Débito - Compra/Deuda (+)</MenuItem>
                <MenuItem value="CREDITO">Crédito - Pago al proveedor (-)</MenuItem>
              </TextField>

              {puedeBackdatear && (
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                  <DatePicker
                    label="Fecha del movimiento"
                    value={fechaMovimiento}
                    onChange={(v) => {
                      // Guard: tipeo parcial produce "Invalid Date"; no lo propagamos.
                      if (v && v.isValid()) setFechaMovimiento(v);
                    }}
                    minDate={minFechaMovimiento}
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                        helperText: 'Solo admins. Impacta el flujo de caja en esta fecha (tope: 1° del mes anterior).',
                      },
                    }}
                  />
                </LocalizationProvider>
              )}

              <TextField
                fullWidth
                label="Importe"
                type="number"
                value={newMovimiento.importe}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, importe: Number(e.target.value) })}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Concepto"
                value={newMovimiento.concepto}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, concepto: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="Número de Comprobante"
                value={newMovimiento.numeroComprobante}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, numeroComprobante: e.target.value })}
                margin="normal"
              />

              <TextField
                fullWidth
                select
                label="Método de Pago"
                value={newMovimiento.metodoPago}
                onChange={(e) => setNewMovimiento({ ...newMovimiento, metodoPago: e.target.value as MetodoPago })}
                margin="normal"
                required
              >
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                <MenuItem value="MERCADO_PAGO">Mercado Pago</MenuItem>
                <MenuItem value="FINANCIACION_PROPIA">Financiación Propia</MenuItem>
              </TextField>

              {requiereCaja && (
                <Box mt={2}>
                  <CajaSelector
                    metodoPago={newMovimiento.metodoPago}
                    value={cajaRef}
                    onChange={setCajaRef}
                    direccion="egreso"
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMovimientoDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveMovimiento}
              disabled={!newMovimiento.concepto || newMovimiento.importe <= 0 || cajaFaltante}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Correction Dialog (ADMIN) */}
        <Dialog open={openAjusteDialog} onClose={() => setOpenAjusteDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>
            Corrección de Saldo (ADMIN) - {selectedProveedor?.razonSocial || selectedProveedor?.nombre}
          </DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Esta operación ajusta el saldo de la cuenta corriente del proveedor{' '}
                <strong>sin generar ningún movimiento de caja</strong> ni impactar el flujo de caja.
                Usala solo para corregir errores de carga.
              </Alert>

              <TextField
                fullWidth
                select
                label="Tipo de Corrección"
                value={newAjuste.tipo}
                onChange={(e) => setNewAjuste({ ...newAjuste, tipo: e.target.value as TipoMovimiento })}
                margin="normal"
                helperText="Débito: aumenta la deuda con el proveedor (+). Crédito: la disminuye (-)"
              >
                <MenuItem value="DEBITO">Débito - Aumenta deuda (+)</MenuItem>
                <MenuItem value="CREDITO">Crédito - Disminuye deuda (-)</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Importe"
                type="number"
                value={newAjuste.importe}
                onChange={(e) => setNewAjuste({ ...newAjuste, importe: Number(e.target.value) })}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Motivo"
                value={newAjuste.concepto}
                onChange={(e) => setNewAjuste({ ...newAjuste, concepto: e.target.value })}
                margin="normal"
                required
                multiline
                rows={2}
                helperText="Obligatorio. Queda registrado para auditoría."
              />

              <TextField
                fullWidth
                label="Número de Comprobante (opcional)"
                value={newAjuste.numeroComprobante}
                onChange={(e) => setNewAjuste({ ...newAjuste, numeroComprobante: e.target.value })}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAjusteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleSaveAjuste}
              disabled={!newAjuste.concepto.trim() || newAjuste.importe <= 0}
            >
              Guardar Corrección
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default CuentaCorrienteProveedoresPage;
