import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { CuentaCorriente, CreateCuentaCorrienteRequest, TipoMovimiento, MetodoPago } from '../../types';
import { cuentaCorrienteApiWithFallback as cuentaCorrienteApi } from '../../api/services/apiWithFallback';

interface CuentaCorrienteTabProps {
  clienteId: number;
}

const CuentaCorrienteTab: React.FC<CuentaCorrienteTabProps> = ({ clienteId }) => {
  const [movimientos, setMovimientos] = useState<CuentaCorriente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [formData, setFormData] = useState<CreateCuentaCorrienteRequest & { metodoPago: MetodoPago }>({
    clienteId,
    fecha: dayjs().format('YYYY-MM-DD'),
    tipo: 'DEBITO',
    importe: 0,
    concepto: '',
    numeroComprobante: '',
    metodoPago: 'EFECTIVO',
  });

  useEffect(() => {
    loadMovimientos();
  }, [clienteId]);

  const loadMovimientos = async () => {
    try {
      setLoading(true);
      const data = await cuentaCorrienteApi.getByClienteId(clienteId);
      // Ordenar por fecha descendente
      setMovimientos(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch (err) {
      setError('Error al cargar los movimientos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      clienteId,
      fecha: dayjs().format('YYYY-MM-DD'),
      tipo: 'DEBITO',
      importe: 0,
      concepto: '',
      numeroComprobante: '',
      metodoPago: 'EFECTIVO',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError(null);
  };

  const handleInputChange = (field: keyof (CreateCuentaCorrienteRequest & { metodoPago: MetodoPago })) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'importe' ? Number(event.target.value) : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.concepto.trim()) {
      setError('El concepto es obligatorio');
      return;
    }

    if (formData.importe <= 0) {
      setError('El importe debe ser mayor a 0');
      return;
    }

    try {
      // Use current time for the selected date
      const currentTime = dayjs().format('HH:mm:ss');
      const requestData = {
        ...formData,
        fecha: `${formData.fecha}T${currentTime}`,
      };

      console.log('Sending requestData:', JSON.stringify(requestData, null, 2));

      await cuentaCorrienteApi.create(requestData);
      handleCloseDialog();
      loadMovimientos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el movimiento');
    }
  };

  const getSaldoTotal = () => {
    return movimientos.reduce((total, mov) => {
      return mov.tipo === 'DEBITO' ? total + mov.importe : total - mov.importe;
    }, 0);
  };

  const getMovimientoIcon = (tipo: TipoMovimiento) => {
    return tipo === 'DEBITO' ? (
      <TrendingUpIcon color="error" />
    ) : (
      <TrendingDownIcon color="success" />
    );
  };

  const getMovimientoColor = (tipo: TipoMovimiento) => {
    return tipo === 'DEBITO' ? 'error' : 'success';
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedMovimientos = movimientos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Cuenta Corriente
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nuevo Movimiento
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Saldo Actual
            </Typography>
            <Typography variant="h4" color={getSaldoTotal() > 0 ? 'error.main' : 'success.main'}>
              ${getSaldoTotal().toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Movimientos
            </Typography>
            <Typography variant="h4">
              {movimientos.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Movements Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell align="right">Saldo</TableCell>
              <TableCell>Comprobante</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMovimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="text.secondary" py={4}>
                    No hay movimientos registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovimientos.map((movimiento) => (
                <TableRow key={movimiento.id}>
                  <TableCell>
                    {new Date(movimiento.fecha).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getMovimientoIcon(movimiento.tipo)}
                      <Chip
                        label={movimiento.tipo}
                        color={getMovimientoColor(movimiento.tipo)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{movimiento.concepto}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={movimiento.tipo === 'DEBITO' ? 'error.main' : 'success.main'}
                      fontWeight="bold"
                    >
                      {movimiento.tipo === 'DEBITO' ? '+' : '-'}${movimiento.importe.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      ${movimiento.saldo.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {movimiento.numeroComprobante || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {movimientos.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={movimientos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            Nuevo Movimiento
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  select
                  label="Tipo de Movimiento"
                  value={formData.tipo}
                  onChange={handleInputChange('tipo')}
                  required
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="DEBITO">Débito (Cargo)</MenuItem>
                  <MenuItem value="CREDITO">Crédito (Pago)</MenuItem>
                </TextField>
                <TextField
                  type="date"
                  label="Fecha"
                  value={formData.fecha}
                  onChange={handleInputChange('fecha')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              <TextField
                label="Concepto"
                value={formData.concepto}
                onChange={handleInputChange('concepto')}
                required
                placeholder="Describa el motivo del movimiento..."
              />
              
              <TextField
                type="number"
                label="Importe"
                value={formData.importe}
                onChange={handleInputChange('importe')}
                required
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
              
              <TextField
                label="Número de Comprobante (opcional)"
                value={formData.numeroComprobante}
                onChange={handleInputChange('numeroComprobante')}
                placeholder="Ej: FAC-001, REC-123, etc."
              />

              <TextField
                select
                label="Método de Pago"
                value={formData.metodoPago}
                onChange={handleInputChange('metodoPago')}
                required
                fullWidth
              >
                <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
                <MenuItem value="TRANSFERENCIA_BANCARIA">🏦 Transferencia Bancaria</MenuItem>
                <MenuItem value="CHEQUE">📝 Cheque</MenuItem>
                <MenuItem value="TARJETA_CREDITO">💳 Tarjeta de Crédito</MenuItem>
                <MenuItem value="TARJETA_DEBITO">💳 Tarjeta de Débito</MenuItem>
                <MenuItem value="MERCADO_PAGO">📱 Mercado Pago</MenuItem>
                <MenuItem value="FINANCIACION_PROPIA">📋 Financiación Propia</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              Crear Movimiento
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CuentaCorrienteTab;
