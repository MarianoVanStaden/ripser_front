import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TextField, Stack, Chip,
  IconButton, Alert, CircularProgress, Grid, MenuItem, Select, FormControl,
  InputLabel, InputAdornment, Autocomplete, TablePagination
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { 
  reclamoGarantiaApi, 
  type ReclamoGarantiaDTO 
} from '../../api/services/reclamoGarantiaApi';
import { garantiaApi } from '../../api/services/garantiaApi';
import ReclamoFormDialog from './ReclamoFormDialog';

const ReclamosGarantiaPage: React.FC = () => {
  const [reclamos, setReclamos] = useState<ReclamoGarantiaDTO[]>([]);
  const [garantias, setGarantias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [garantiaFilter, setGarantiaFilter] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [selectedReclamo, setSelectedReclamo] = useState<ReclamoGarantiaDTO | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [reclamosData, garantiasData] = await Promise.all([
        reclamoGarantiaApi.findAll(),
        garantiaApi.findAll()
      ]);
      
      setReclamos(reclamosData);
      setGarantias(garantiasData);
    } catch (err: any) {
      console.error('Error loading reclamos:', err);
      setError(err.response?.data?.message || 'Error al cargar los reclamos');
    } finally {
      setLoading(false);
    }
  };

  // Filter reclamos
  const filteredReclamos = useMemo(() => {
    return reclamos.filter(r => {
      const matchSearch = search === '' ||
        r.numeroReclamo.toLowerCase().includes(search.toLowerCase()) ||
        r.descripcionProblema.toLowerCase().includes(search.toLowerCase()) ||
        r.garantiaNumeroSerie.toLowerCase().includes(search.toLowerCase()) ||
        (r.garantiaEquipoModelo?.toLowerCase().includes(search.toLowerCase()) || false);

      const matchEstado = estadoFilter === 'TODOS' || r.estado === estadoFilter;
      const matchGarantia = !garantiaFilter || r.garantiaId === garantiaFilter.id;

      return matchSearch && matchEstado && matchGarantia;
    });
  }, [reclamos, search, estadoFilter, garantiaFilter]);

  // Paginate filtered reclamos
  const paginatedReclamos = useMemo(() => {
    return filteredReclamos.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [filteredReclamos, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get estado color
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'RESUELTO':
        return 'success';
      case 'RECHAZADO':
        return 'error';
      case 'EN_PROCESO':
        return 'info';
      case 'PENDIENTE':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Calculate statistics
  const stats = {
    total: reclamos.length,
    pendientes: reclamos.filter(r => r.estado === 'PENDIENTE').length,
    enProceso: reclamos.filter(r => r.estado === 'EN_PROCESO').length,
    resueltos: reclamos.filter(r => r.estado === 'RESUELTO').length,
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Reclamos de Garantía
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedReclamo(null);
            setFormOpen(true);
          }}
        >
          Nuevo Reclamo
        </Button>
      </Stack>

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
                    Total Reclamos
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <HourglassIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.pendientes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pendientes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <EditIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.enProceso}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    En Proceso
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
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.resueltos}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Resueltos
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
                label="Buscar por número, problema o modelo de equipo"
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
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                  <MenuItem value="RESUELTO">Resuelto</MenuItem>
                  <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={garantias}
                getOptionLabel={(option) =>
                  `${option.numeroSerie} - ${option.equipoFabricadoModelo || 'Sin modelo'}`
                }
                value={garantiaFilter}
                onChange={(_, newValue) => setGarantiaFilter(newValue)}
                renderInput={(params) => <TextField {...params} label="Garantía" />}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setEstadoFilter('TODOS');
                  setGarantiaFilter(null);
                }}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(estadoFilter !== 'TODOS' || garantiaFilter || search) && (
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
                  label={`Estado: ${estadoFilter.replace('_', ' ')}`} 
                  onDelete={() => setEstadoFilter('TODOS')} 
                  size="small"
                  color="primary"
                />
              )}
              {garantiaFilter && (
                <Chip 
                  label={`Garantía: ${garantiaFilter.numeroSerie}`} 
                  onDelete={() => setGarantiaFilter(null)} 
                  size="small"
                  color="secondary"
                />
              )}
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
                  <TableCell sx={{ minWidth: 120 }}><strong>N° Reclamo</strong></TableCell>
                  <TableCell sx={{ minWidth: 120 }}><strong>Fecha</strong></TableCell>
                  <TableCell sx={{ minWidth: 120 }}><strong>Garantía</strong></TableCell>
                  <TableCell sx={{ minWidth: 140 }}><strong>Modelo de Equipo</strong></TableCell>
                  <TableCell sx={{ minWidth: 200 }}><strong>Problema</strong></TableCell>
                  <TableCell sx={{ minWidth: 140 }}><strong>Tipo Solución</strong></TableCell>
                  <TableCell sx={{ minWidth: 120 }} align="center"><strong>Estado</strong></TableCell>
                  <TableCell sx={{ minWidth: 150 }}><strong>Técnico</strong></TableCell>
                  <TableCell sx={{ minWidth: 100 }} align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReclamos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="textSecondary" py={4}>
                        No se encontraron reclamos
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReclamos.map((reclamo) => (
                <TableRow key={reclamo.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {reclamo.numeroReclamo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {dayjs(reclamo.fechaReclamo).format('DD/MM/YYYY')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {dayjs(reclamo.fechaReclamo).format('HH:mm')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {reclamo.garantiaNumeroSerie}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {reclamo.garantiaEquipoModelo || '-'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                      {reclamo.descripcionProblema}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {reclamo.tipoSolucion?.replace('_', ' ') || '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={reclamo.estado?.replace('_', ' ') || 'SIN ESTADO'}
                      color={getEstadoColor(reclamo.estado)}
                      size="small"
                      sx={{ fontWeight: 600, minWidth: 100 }}
                    />
                  </TableCell>
                  <TableCell>
                    {reclamo.tecnicoNombre && reclamo.tecnicoApellido
                      ? `${reclamo.tecnicoNombre} ${reclamo.tecnicoApellido}`
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedReclamo(reclamo);
                        setFormOpen(true);
                      }}
                      title="Ver/Editar"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredReclamos.length}
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

      {/* Reclamo Dialog */}
      <ReclamoFormDialog
        open={formOpen}
        garantiaId={selectedReclamo?.garantiaId}
        reclamo={selectedReclamo}
        garantias={garantias}
        onClose={() => {
          setFormOpen(false);
          setSelectedReclamo(null);
        }}
        onSave={() => {
          setFormOpen(false);
          setSelectedReclamo(null);
          loadData();
        }}
      />
    </Box>
  );
};

export default ReclamosGarantiaPage;
