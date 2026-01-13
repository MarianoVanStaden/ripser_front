import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { chequeApi } from '../../api/services/chequeApi';
import { useTenant } from '../../context/TenantContext';
import { usePermisos } from '../../hooks/usePermisos';
import type { Cheque } from '../../types';
import ChequeFormDialog from './ChequeFormDialog';
import ChequeDetailDialog from './ChequeDetailDialog';
import ChequeEstadoChip from './ChequeEstadoChip';
import ChequeTipoChip from './ChequeTipoChip';

const ChequesPage: React.FC = () => {
  // Permisos y contexto
  const { empresaId, sucursalId } = useTenant();
  const { tienePermiso } = usePermisos();

  // Estados
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  // Cargar datos
  useEffect(() => {
    if (tienePermiso('VENTAS')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const chequesData = await chequeApi.getAllWithoutPagination();
      setCheques(Array.isArray(chequesData) ? chequesData : []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información');
      } else {
        setError('Error al cargar los datos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cheques filtrados
  const filteredCheques = useMemo(() => {
    return cheques.filter((cheque) => {
      const matchesSearch =
        cheque.numeroCheque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cheque.bancoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cheque.titular?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cheque.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cheque.proveedorNombre?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTipo = tipoFilter === 'all' || cheque.tipo === tipoFilter;

      const matchesEstado = estadoFilter === 'all' || cheque.estado === estadoFilter;

      return matchesSearch && matchesTipo && matchesEstado;
    });
  }, [cheques, searchTerm, tipoFilter, estadoFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = cheques.length;
    const propios = cheques.filter((c) => c.tipo === 'PROPIO').length;
    const terceros = cheques.filter((c) => c.tipo === 'TERCEROS').length;
    const enCartera = cheques.filter((c) => c.estado === 'EN_CARTERA').length;
    const depositados = cheques.filter((c) => c.estado === 'DEPOSITADO').length;
    const cobrados = cheques.filter((c) => c.estado === 'COBRADO').length;
    const rechazados = cheques.filter((c) => c.estado === 'RECHAZADO').length;
    const montoTotal = cheques.reduce((sum, c) => sum + c.monto, 0);
    const montoEnCartera = cheques
      .filter((c) => c.estado === 'EN_CARTERA')
      .reduce((sum, c) => sum + c.monto, 0);

    return { total, propios, terceros, enCartera, depositados, cobrados, rechazados, montoTotal, montoEnCartera };
  }, [cheques]);

  // Handlers
  const handleOpenForm = (cheque?: Cheque) => {
    setSelectedCheque(cheque || null);
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setSelectedCheque(null);
  };

  const handleSave = async () => {
    await loadData();
    handleCloseForm();
    setSuccess('Cheque guardado correctamente');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleOpenDetail = (cheque: Cheque) => {
    setSelectedCheque(cheque);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedCheque(null);
  };

  // Verificar permisos
  if (!tienePermiso('VENTAS')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Cheques
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
          Nuevo Cheque
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Cheques
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                En Cartera
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.enCartera}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Depositados
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.depositados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Cobrados
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.cobrados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Rechazados
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.rechazados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Monto en Cartera
              </Typography>
              <Typography variant="h5">
                ${stats.montoEnCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Número, banco, titular, cliente..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="PROPIO">Propios</MenuItem>
                  <MenuItem value="TERCEROS">Terceros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="EN_CARTERA">En Cartera</MenuItem>
                  <MenuItem value="DEPOSITADO">Depositado</MenuItem>
                  <MenuItem value="COBRADO">Cobrado</MenuItem>
                  <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                  <MenuItem value="ANULADO">Anulado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Banco</TableCell>
                <TableCell>Titular</TableCell>
                <TableCell>Fecha Emisión</TableCell>
                <TableCell>Fecha Cobro</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCheques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No se encontraron cheques
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCheques.map((cheque) => (
                  <TableRow key={cheque.id} hover>
                    <TableCell>
                      <ChequeTipoChip tipo={cheque.tipo} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {cheque.numeroCheque}
                        </Typography>
                        {cheque.vencido && (
                          <Tooltip title="Cheque vencido">
                            <WarningIcon color="error" fontSize="small" />
                          </Tooltip>
                        )}
                        {cheque.endosado && (
                          <Tooltip title="Ver cadena de endosos">
                            <Chip
                              label="Endosado"
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => handleOpenDetail(cheque)}
                              sx={{ cursor: 'pointer' }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{cheque.bancoNombre || '-'}</TableCell>
                    <TableCell>
                      {cheque.titular}
                      {cheque.clienteNombre && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          Cliente: {cheque.clienteNombre}
                        </Typography>
                      )}
                      {cheque.proveedorNombre && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          Proveedor: {cheque.proveedorNombre}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(cheque.fechaEmision).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Box>
                        {new Date(cheque.fechaCobro).toLocaleDateString('es-AR')}
                        {cheque.diasParaCobro !== undefined && cheque.diasParaCobro > 0 && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            En {cheque.diasParaCobro} días
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="center">
                      <ChequeEstadoChip estado={cheque.estado} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => handleOpenDetail(cheque)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {cheque.estado !== 'COBRADO' && cheque.estado !== 'ANULADO' && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenForm(cheque)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialogs */}
      <ChequeFormDialog
        open={formDialogOpen}
        cheque={selectedCheque}
        onClose={handleCloseForm}
        onSave={handleSave}
      />

      <ChequeDetailDialog
        open={detailDialogOpen}
        cheque={selectedCheque}
        onClose={handleCloseDetail}
        onUpdate={loadData}
      />
    </Box>
  );
};

export default ChequesPage;
