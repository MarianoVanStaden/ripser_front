import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TablePagination,
  Stack,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  AccountBalance as CreditIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Pending as PendingIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { creditoClienteApi, clienteApi } from '../../api/services';
import type { CreditoCliente, Cliente, EstadoCreditoCliente } from '../../types';
import SuccessDialog from '../common/SuccessDialog';

const CreditosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [creditos, setCreditos] = useState<CreditoCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [clienteFilter, setClienteFilter] = useState<Cliente | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<EstadoCreditoCliente | 'TODOS'>('TODOS');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: 0,
    importe: '',
    motivo: '',
  });

  // Details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCredito, setSelectedCredito] = useState<CreditoCliente | null>(null);

  // Anular dialog
  const [anularDialogOpen, setAnularDialogOpen] = useState(false);
  const [creditoToAnular, setCreditoToAnular] = useState<CreditoCliente | null>(null);

  // Success dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState<Array<{ label: string; value: string | number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [creditosData, clientesData] = await Promise.all([
        creditoClienteApi.getAll(),
        clienteApi.getAll(),
      ]);

      console.log('Creditos data received:', creditosData);
      console.log('Clientes data received:', clientesData);

      // Ensure we always set arrays
      setCreditos(Array.isArray(creditosData) ? creditosData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);

      if (!Array.isArray(creditosData)) {
        console.warn('Expected creditos to be an array, got:', typeof creditosData, creditosData);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
      // Ensure state is reset to empty arrays on error
      setCreditos([]);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.clienteId || !formData.importe) {
        setError('Cliente e importe son obligatorios');
        return;
      }

      const credito = await creditoClienteApi.create({
        clienteId: formData.clienteId,
        importe: parseFloat(formData.importe),
        motivo: formData.motivo,
      });

      setSuccessMessage('Crédito creado exitosamente');
      setSuccessDetails([
        { label: 'N° Nota de Crédito', value: credito.numeroNotaCredito },
        { label: 'Cliente', value: credito.clienteNombre },
        { label: 'Importe', value: `$${credito.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
      ]);
      setSuccessDialogOpen(true);

      setCreateDialogOpen(false);
      setFormData({ clienteId: 0, importe: '', motivo: '' });
      await loadData();
    } catch (err: any) {
      console.error('Error creating credito:', err);
      setError(err.response?.data?.message || 'Error al crear el crédito');
    }
  };

  const handleViewDetails = (credito: CreditoCliente) => {
    setSelectedCredito(credito);
    setDetailsDialogOpen(true);
  };

  const handleOpenAnularDialog = (credito: CreditoCliente) => {
    setCreditoToAnular(credito);
    setAnularDialogOpen(true);
  };

  const handleAnular = async () => {
    if (!creditoToAnular) return;

    try {
      await creditoClienteApi.anular(creditoToAnular.id);

      setSuccessMessage('Crédito anulado exitosamente');
      setSuccessDetails([
        { label: 'N° Nota de Crédito', value: creditoToAnular.numeroNotaCredito },
        { label: 'Importe', value: `$${creditoToAnular.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` },
      ]);
      setSuccessDialogOpen(true);

      setAnularDialogOpen(false);
      setCreditoToAnular(null);
      await loadData();
    } catch (err: any) {
      console.error('Error anulando credito:', err);
      setError(err.response?.data?.message || 'Error al anular el crédito');
    }
  };

  const getEstadoChip = (estado: EstadoCreditoCliente) => {
    const config = {
      PENDIENTE: { label: 'Pendiente', color: 'warning' as const, icon: <PendingIcon fontSize="small" /> },
      APLICADO: { label: 'Aplicado', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> },
      ANULADO: { label: 'Anulado', color: 'error' as const, icon: <BlockIcon fontSize="small" /> },
    };

    const { label, color, icon } = config[estado];
    return <Chip label={label} color={color} size="small" icon={icon} />;
  };

  // Filtered and paginated data
  const filteredCreditos = creditos.filter(credito => {
    const matchesCliente = !clienteFilter || credito.clienteId === clienteFilter.id;
    const matchesEstado = estadoFilter === 'TODOS' || credito.estado === estadoFilter;
    return matchesCliente && matchesEstado;
  });

  const paginatedCreditos = filteredCreditos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Statistics
  const stats = {
    total: creditos.length,
    pendientes: creditos.filter(c => c.estado === 'PENDIENTE').length,
    aplicados: creditos.filter(c => c.estado === 'APLICADO').length,
    anulados: creditos.filter(c => c.estado === 'ANULADO').length,
    importeTotal: creditos
      .filter(c => c.estado !== 'ANULADO')
      .reduce((sum, c) => sum + c.importe, 0),
    importePendiente: creditos
      .filter(c => c.estado === 'PENDIENTE')
      .reduce((sum, c) => sum + c.importe, 0),
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        pb={2}
        borderBottom={`1px solid ${theme.palette.divider}`}
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.success.main, 0.1),
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditIcon sx={{ fontSize: 28, color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="600" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Créditos de Clientes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Gestión de notas de crédito y saldos a favor
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          fullWidth={isMobile}
        >
          Nuevo Crédito
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={2}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Total Créditos
              </Typography>
              <Typography variant="h4" fontWeight="600" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Pendientes
              </Typography>
              <Typography variant="h4" fontWeight="600" color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                {stats.pendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Aplicados
              </Typography>
              <Typography variant="h4" fontWeight="600" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                {stats.aplicados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Anulados
              </Typography>
              <Typography variant="h4" fontWeight="600" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                {stats.anulados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Importe Total
              </Typography>
              <Typography variant="h6" fontWeight="600" color="info.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                ${stats.importeTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={2}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Pendiente
              </Typography>
              <Typography variant="h6" fontWeight="600" color="warning.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                ${stats.importePendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(cliente) =>
                  cliente.razonSocial
                    ? `${cliente.razonSocial} (${cliente.cuit})`
                    : `${cliente.nombre} ${cliente.apellido || ''}`
                }
                value={clienteFilter}
                onChange={(_, value) => setClienteFilter(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Filtrar por Cliente" />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value as EstadoCreditoCliente | 'TODOS')}
                  label="Estado"
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="APLICADO">Aplicado</MenuItem>
                  <MenuItem value="ANULADO">Anulado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Creditos Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>N° Nota</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Importe</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Motivo</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCreditos.map((credito) => (
                  <TableRow key={credito.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ReceiptIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" fontWeight="600">
                          {credito.numeroNotaCredito}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(credito.fecha).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{credito.clienteNombre}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="600" color="success.main">
                        ${credito.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {credito.motivo || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{getEstadoChip(credito.estado)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(credito)}
                        title="Ver detalles"
                      >
                        <ViewIcon />
                      </IconButton>

                      {credito.estado === 'PENDIENTE' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenAnularDialog(credito)}
                          title="Anular crédito"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={filteredCreditos.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CreditIcon />
            Nuevo Crédito
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Autocomplete
              options={clientes}
              getOptionLabel={(cliente) =>
                cliente.razonSocial
                  ? `${cliente.razonSocial} (${cliente.cuit})`
                  : `${cliente.nombre} ${cliente.apellido || ''}`
              }
              value={clientes.find(c => c.id === formData.clienteId) || null}
              onChange={(_, value) => setFormData({ ...formData, clienteId: value?.id || 0 })}
              renderInput={(params) => (
                <TextField {...params} label="Cliente" required />
              )}
            />

            <TextField
              label="Importe"
              type="number"
              fullWidth
              value={formData.importe}
              onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              required
            />

            <TextField
              label="Motivo"
              fullWidth
              multiline
              rows={3}
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ej: Devolución por producto defectuoso"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleCreate} variant="contained" startIcon={<AddIcon />}>
            Crear Crédito
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Detalles del Crédito</DialogTitle>
        <DialogContent>
          {selectedCredito && (
            <Box sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    N° Nota de Crédito
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {selectedCredito.numeroNotaCredito}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1">{selectedCredito.clienteNombre}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(selectedCredito.fecha).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Importe
                  </Typography>
                  <Typography variant="h5" fontWeight="600" color="success.main">
                    ${selectedCredito.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getEstadoChip(selectedCredito.estado)}</Box>
                </Box>

                {selectedCredito.motivo && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Motivo
                    </Typography>
                    <Typography variant="body2">{selectedCredito.motivo}</Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Anular Dialog */}
      <Dialog
        open={anularDialogOpen}
        onClose={() => setAnularDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CancelIcon color="error" />
            Anular Crédito
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Está seguro que desea anular este crédito? Esta acción no se puede deshacer.
          </Alert>
          {creditoToAnular && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>N° Nota:</strong> {creditoToAnular.numeroNotaCredito}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Cliente:</strong> {creditoToAnular.clienteNombre}
              </Typography>
              <Typography variant="body2">
                <strong>Importe:</strong> ${creditoToAnular.importe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnularDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleAnular} variant="contained" color="error" startIcon={<CancelIcon />}>
            Anular Crédito
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setSuccessMessage('');
          setSuccessDetails([]);
        }}
        title={successMessage}
        details={successDetails}
      />
    </Box>
  );
};

export default CreditosPage;
