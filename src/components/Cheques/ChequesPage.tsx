import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TablePagination,
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
import { usePermisos } from '../../hooks/usePermisos';
import type { Cheque, ChequeResumenDTO } from '../../types';
import ChequeFormDialog from './ChequeFormDialog';
import ChequeDetailDialog from './ChequeDetailDialog';
import ChequeEstadoChip from './ChequeEstadoChip';
import ChequeTipoChip from './ChequeTipoChip';

const ChequesPage: React.FC = () => {
  const { tienePermiso } = usePermisos();

  // Datos
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [resumen, setResumen] = useState<ChequeResumenDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);

  // Paginación
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   
  useEffect(() => {
    if (tienePermiso('VENTAS')) {
      loadResumen();
    }
  }, []);

   
  useEffect(() => {
    if (tienePermiso('VENTAS')) {
      loadCheques();
    }
  }, [page, pageSize, tipoFilter, estadoFilter]);

  // Debounce del search para no disparar una request por cada tecla
   
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(0);
      loadCheques();
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm]);

  const loadResumen = async () => {
    try {
      const data = await chequeApi.getResumen();
      setResumen(data);
    } catch (err) {
      console.error('Error loading resumen:', err);
    }
  };

  const loadCheques = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (tipoFilter !== 'all') params.tipo = tipoFilter;
      if (estadoFilter !== 'all') params.estado = estadoFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await chequeApi.buscar(params, page, pageSize, 'fechaAlta,desc');
      setCheques(response.content);
      setTotalElements(response.totalElements);
      setError(null);
    } catch (err: any) {
      console.error('Error loading cheques:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información');
      } else {
        setError('Error al cargar los datos');
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, tipoFilter, estadoFilter, searchTerm]);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (value: string) => {
      setter(value);
      setPage(0);
    };

  const handleOpenForm = (cheque?: Cheque) => {
    setSelectedCheque(cheque || null);
    setFormDialogOpen(true);
  };

  const handleCloseForm = () => {
    setFormDialogOpen(false);
    setSelectedCheque(null);
  };

  const handleSave = async () => {
    await Promise.all([loadCheques(), loadResumen()]);
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

  const handleDetailUpdate = async () => {
    await Promise.all([loadCheques(), loadResumen()]);
  };

  if (!tienePermiso('VENTAS')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  const enCartera = resumen?.porEstado?.['EN_CARTERA'];
  const depositados = resumen?.porEstado?.['DEPOSITADO'];
  const cobrados = resumen?.porEstado?.['COBRADO'];
  const rechazados = resumen?.porEstado?.['RECHAZADO'];

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
              <Typography variant="h4">{resumen?.total ?? '-'}</Typography>
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
                {enCartera?.cantidad ?? '-'}
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
                {depositados?.cantidad ?? '-'}
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
                {cobrados?.cantidad ?? '-'}
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
                {rechazados?.cantidad ?? '-'}
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
                ${(enCartera?.monto ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                  onChange={(e) => handleFilterChange(setTipoFilter)(e.target.value)}
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
                  onChange={(e) => handleFilterChange(setEstadoFilter)(e.target.value)}
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
        <Paper>
          <TableContainer>
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
                {cheques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No se encontraron cheques
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cheques.map((cheque) => (
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
                          {cheque.esEcheq && (
                            <Chip label="E-Cheq" size="small" variant="outlined" color="info" />
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
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </Paper>
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
        onUpdate={handleDetailUpdate}
      />
    </Box>
  );
};

export default ChequesPage;