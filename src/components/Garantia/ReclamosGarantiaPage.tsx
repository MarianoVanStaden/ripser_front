import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Stack, Chip,
  IconButton, Alert, Grid, MenuItem, Select, FormControl,
  InputLabel, InputAdornment, Autocomplete, TablePagination, Divider
} from '@mui/material';
import { StickyScrollTable } from '../common/StickyScrollTable';
import ResponsiveDataView from '../common/ResponsiveDataView';
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
import LoadingOverlay from '../common/LoadingOverlay';

const ReclamosGarantiaPage: React.FC = () => {
  const [reclamos, setReclamos] = useState<ReclamoGarantiaDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [garantias, setGarantias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (server-side: search/estado/garantiaId viajan al backend)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [garantiaFilter, setGarantiaFilter] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stats server-side (totalElements de 1 request size:1 por estado — patrón GarantiasPage)
  const [stats, setStats] = useState({ total: 0, pendientes: 0, enProceso: 0, resueltos: 0 });

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [selectedReclamo, setSelectedReclamo] = useState<ReclamoGarantiaDTO | null>(null);

  // Debounce de búsqueda (mismo patrón que GarantiasPage)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Al cambiar cualquier filtro se vuelve a la página 0: si no, una página
  // fuera de rango deja la lista vacía (y en mobile, sin controles de paginado).
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, estadoFilter, garantiaFilter]);

  const loadReclamos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reclamoGarantiaApi.findAll({
        page,
        size: rowsPerPage,
        sort: 'fechaReclamo,desc',
        search: debouncedSearch || undefined,
        estado: estadoFilter !== 'TODOS' ? (estadoFilter as ReclamoGarantiaDTO['estado']) : undefined,
        garantiaId: garantiaFilter?.id ?? undefined,
      });
      setReclamos(response.content ?? []);
      setTotalElements(response.totalElements ?? 0);
    } catch (err: any) {
      console.error('Error loading reclamos:', err);
      setError(err.response?.data?.message || 'Error al cargar los reclamos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [total, pendientes, enProceso, resueltos] = await Promise.all([
        reclamoGarantiaApi.findAll({ page: 0, size: 1 }),
        reclamoGarantiaApi.findAll({ page: 0, size: 1, estado: 'PENDIENTE' }),
        reclamoGarantiaApi.findAll({ page: 0, size: 1, estado: 'EN_PROCESO' }),
        reclamoGarantiaApi.findAll({ page: 0, size: 1, estado: 'RESUELTO' }),
      ]);
      setStats({
        total: total.totalElements ?? 0,
        pendientes: pendientes.totalElements ?? 0,
        enProceso: enProceso.totalElements ?? 0,
        resueltos: resueltos.totalElements ?? 0,
      });
    } catch (err) {
      console.error('Error loading stats de reclamos:', err);
    }
  };

  // Garantías para el Autocomplete de filtro y el form dialog.
  const loadGarantias = async () => {
    try {
      const garantiasResponse = await garantiaApi.findAll({ page: 0, size: 1000 });
      const garantiasList = Array.isArray(garantiasResponse)
        ? garantiasResponse
        : (garantiasResponse as any).content || [];
      setGarantias(garantiasList);
    } catch (err) {
      console.error('Error loading garantias:', err);
    }
  };

  useEffect(() => {
    loadReclamos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, debouncedSearch, estadoFilter, garantiaFilter]);

  useEffect(() => {
    loadStats();
    loadGarantias();
  }, []);

  const loadData = async () => {
    await Promise.all([loadReclamos(), loadStats()]);
  };

  const filteredReclamos = reclamos;
  const paginatedReclamos = reclamos;

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

  return (
    <Box p={3}>
      <LoadingOverlay open={loading} message="Cargando reclamos..." />
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

      {/* Desktop: StickyScrollTable / Mobile: cards */}
      <ResponsiveDataView
        items={paginatedReclamos}
        getKey={(reclamo) => reclamo.id}
        emptyState={
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="textSecondary" align="center" py={4}>
                No se encontraron reclamos
              </Typography>
            </CardContent>
          </Card>
        }
        renderCard={(reclamo) => (
          <Card variant="outlined">
            <CardContent sx={{ pb: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box>
                  <Typography fontWeight={600}>
                    {reclamo.clienteNombre && reclamo.clienteApellido
                      ? `${reclamo.clienteNombre} ${reclamo.clienteApellido}`
                      : reclamo.clienteNombre || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {reclamo.garantiaEquipoModelo || 'Sin modelo'} · {reclamo.numeroReclamo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dayjs(reclamo.fechaReclamo).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
                <Chip
                  label={reclamo.estado?.replace('_', ' ') || 'SIN ESTADO'}
                  color={getEstadoColor(reclamo.estado)}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {reclamo.descripcionProblema}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                sx={{ minHeight: 44 }}
                onClick={() => {
                  setSelectedReclamo(reclamo);
                  setFormOpen(true);
                }}
              >
                Ver / Editar
              </Button>
            </CardContent>
          </Card>
        )}
        renderTable={() => (
      <StickyScrollTable
        minWidth={1370}
        pagination={
          <TablePagination
            component="div"
            count={totalElements}
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
        }
      >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 160 }}><strong>Cliente</strong></TableCell>
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
                    <TableCell colSpan={10} align="center">
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
                      {reclamo.clienteNombre && reclamo.clienteApellido
                        ? `${reclamo.clienteNombre} ${reclamo.clienteApellido}`
                        : reclamo.clienteNombre || '-'}
                    </Typography>
                  </TableCell>
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
      </StickyScrollTable>
        )}
      />

      {/* Paginación en mobile (en desktop vive dentro de StickyScrollTable) */}
      {filteredReclamos.length > 0 && (
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </Box>
      )}

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
