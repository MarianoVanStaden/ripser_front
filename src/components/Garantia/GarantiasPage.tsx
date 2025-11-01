import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Stack,
  Chip, Alert, CircularProgress, Grid, InputAdornment, Autocomplete, Dialog,
  MenuItem, Select, FormControl, InputLabel, TablePagination
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Search as SearchIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  LocalShipping as ShippingIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { garantiaApi, type GarantiaDTO } from '../../api/services/garantiaApi';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import { documentoApi } from '../../api/documentoApi';
import GarantiaFormDialog from './GarantiaFormDialog';
import GarantiaDetailPage from './GarantiaDetailPage';

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<GarantiaDTO[]>([]);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [equipoFilter, setEquipoFilter] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedGarantia, setSelectedGarantia] = useState<GarantiaDTO | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data with error handling for each request
      const [garantiasData, equiposData, facturasData] = await Promise.allSettled([
        garantiaApi.findAll(),
        equipoFabricadoApi.findAll(0, 1000), // Load all equipos
        documentoApi.getByTipo('FACTURA')
      ]);

      // Handle garantias
      if (garantiasData.status === 'fulfilled') {
        setGarantias(Array.isArray(garantiasData.value) ? garantiasData.value : []);
      } else {
        console.error('Error loading garantias:', garantiasData.reason);
        setError('Error al cargar las garantías: ' + (garantiasData.reason?.response?.data?.message || garantiasData.reason?.message || 'Error desconocido'));
      }

      // Handle equipos fabricados
      if (equiposData.status === 'fulfilled') {
        const equiposContent = equiposData.value?.content || equiposData.value || [];
        setEquipos(Array.isArray(equiposContent) ? equiposContent : []);
      } else {
        console.error('Error loading equipos:', equiposData.reason);
      }

      // Handle facturas
      if (facturasData.status === 'fulfilled') {
        setFacturas(Array.isArray(facturasData.value) ? facturasData.value : []);
      } else {
        console.error('Error loading facturas:', facturasData.reason);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Handle anular garantia
  const handleAnular = async (id: number) => {
    if (!window.confirm('¿Está seguro de anular esta garantía?')) return;
    
    try {
      const updated = await garantiaApi.anular(id);
      setGarantias(garantias.map(g => g.id === id ? updated : g));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al anular la garantía');
    }
  };

  // Filter garantias
  const filteredGarantias = useMemo(() => {
    return garantias.filter(g => {
      const matchSearch = search === '' ||
        g.equipoFabricadoModelo.toLowerCase().includes(search.toLowerCase()) ||
        g.numeroSerie.toLowerCase().includes(search.toLowerCase());

      const matchEstado = estadoFilter === 'TODOS' || g.estado === estadoFilter;
      const matchEquipo = !equipoFilter || g.equipoFabricadoId === equipoFilter.id;

      return matchSearch && matchEstado && matchEquipo;
    });
  }, [garantias, search, estadoFilter, equipoFilter]);

  // Paginate filtered garantias
  const paginatedGarantias = useMemo(() => {
    return filteredGarantias.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredGarantias, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get status color
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'VIGENTE':
        return 'success';
      case 'VENCIDA':
        return 'error';
      case 'ANULADA':
        return 'default';
      default:
        return 'warning';
    }
  };

  // Calculate statistics
  const stats = {
    total: garantias.length,
    vigentes: garantias.filter(g => g.estado === 'VIGENTE').length,
    vencidas: garantias.filter(g => g.estado === 'VENCIDA').length,
    anuladas: garantias.filter(g => g.estado === 'ANULADA').length,
  };

  // Filter equipos that already have a guarantee
  const availableEquipos = equipos.filter(equipo =>
    !garantias.some(garantia => garantia.equipoFabricadoId === equipo.id)
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Gestión de Garantías
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Garantías
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ShippingIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.vigentes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vigentes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BlockIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.vencidas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vencidas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'grey.100', borderLeft: '4px solid', borderColor: 'grey.500' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BlockIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="grey.700">
                    {stats.anuladas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Anuladas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar por modelo, serie"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  label="Estado"
                  onChange={(e) => setEstadoFilter(e.target.value)}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="VIGENTE">Vigente</MenuItem>
                  <MenuItem value="VENCIDA">Vencida</MenuItem>
                  <MenuItem value="ANULADA">Anulada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={equipos}
                getOptionLabel={(option) => `${option.modelo} - ${option.numeroHeladera}`}
                value={equipoFilter}
                onChange={(_, newValue) => setEquipoFilter(newValue)}
                renderInput={(params) => <TextField {...params} label="Equipo" />}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedGarantia(null);
                  setFormOpen(true);
                }}
              >
                Nueva Garantía
              </Button>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(estadoFilter !== 'TODOS' || equipoFilter || search) && (
            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
              {search && (
                <Chip
                  label={`Búsqueda: "${search}"`}
                  onDelete={() => setSearch('')}
                  size="small"
                />
              )}
              {estadoFilter !== 'TODOS' && (
                <Chip
                  label={`Estado: ${estadoFilter}`}
                  onDelete={() => setEstadoFilter('TODOS')}
                  size="small"
                  color="primary"
                />
              )}
              {equipoFilter && (
                <Chip
                  label={`Equipo: ${equipoFilter.modelo}`}
                  onDelete={() => setEquipoFilter(null)}
                  size="small"
                  color="secondary"
                />
              )}
              <Button
                size="small"
                onClick={() => {
                  setSearch('');
                  setEstadoFilter('TODOS');
                  setEquipoFilter(null);
                }}
              >
                Limpiar Filtros
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}><strong>N° Serie</strong></TableCell>
                  <TableCell sx={{ minWidth: 150 }}><strong>Modelo de Equipo</strong></TableCell>
                  <TableCell sx={{ minWidth: 100 }}><strong>N° Venta</strong></TableCell>
                  <TableCell sx={{ minWidth: 120 }} align="center"><strong>Fecha Compra</strong></TableCell>
                  <TableCell sx={{ minWidth: 140 }} align="center"><strong>Fecha Vencimiento</strong></TableCell>
                  <TableCell sx={{ minWidth: 100 }} align="center"><strong>Estado</strong></TableCell>
                  <TableCell sx={{ minWidth: 120 }} align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGarantias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary" py={4}>
                        No se encontraron garantías
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGarantias.map((garantia) => (
                <TableRow key={garantia.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {garantia.numeroSerie}
                    </Typography>
                  </TableCell>
                  <TableCell>{garantia.equipoFabricadoModelo || 'Sin equipo'}</TableCell>
                  <TableCell>
                    {garantia.ventaId ? `#${garantia.ventaId}` : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {dayjs(garantia.fechaCompra).format('DD/MM/YYYY')}
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="body2"
                      color={
                        garantia.estado === 'VENCIDA' 
                          ? 'error.main' 
                          : dayjs(garantia.fechaVencimiento).diff(dayjs(), 'day') < 30
                            ? 'warning.main'
                            : 'textPrimary'
                      }
                      fontWeight="500"
                    >
                      {dayjs(garantia.fechaVencimiento).format('DD/MM/YYYY')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={garantia.estado} 
                      color={getStatusColor(garantia.estado)}
                      size="small"
                      sx={{ fontWeight: 600, minWidth: 90 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedGarantia(garantia);
                          setDetailOpen(true);
                        }}
                        title="Ver Detalle"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      
                      {garantia.estado === 'VIGENTE' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleAnular(garantia.id)}
                          title="Anular Garantía"
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredGarantias.length}
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
        </CardContent>
      </Card>

      {/* Dialogs */}
      <GarantiaFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedGarantia(null);
        }}
        onSave={() => {
          setFormOpen(false);
          setSelectedGarantia(null);
          loadData();
        }}
        equipos={availableEquipos}
        ventas={facturas}
      />

      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedGarantia && (
          <GarantiaDetailPage
            garantia={selectedGarantia}
            onBack={() => setDetailOpen(false)}
            onAnular={() => {
              handleAnular(selectedGarantia.id);
              setDetailOpen(false);
            }}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default GarantiasPage;
