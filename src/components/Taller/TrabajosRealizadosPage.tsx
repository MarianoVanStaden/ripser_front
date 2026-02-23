// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import type { OrdenServicio } from '../../types';
import dayjs from 'dayjs';

const TrabajosRealizadosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OrdenServicio | null>(null);
  const [open, setOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');

  useEffect(() => {
    loadOrdenes();
  }, []);

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordenServicioApi.getAll();
      
      const ordenesList = Array.isArray(data) 
        ? data 
        : (data as any).content || [];
        
      // Filtrar solo órdenes finalizadas o canceladas
      const ordenesCompletadas = ordenesList.filter(
        (o: OrdenServicio) => o.estado === 'FINALIZADA' || o.estado === 'CANCELADA'
      );
      setOrdenes(ordenesCompletadas);
    } catch (err) {
      setError('Error al cargar los trabajos realizados');
      console.error('Error loading ordenes:', err);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (orden: OrdenServicio) => {
    if (orden.clienteNombre) {
      return orden.clienteNombre;
    }
    if (orden.cliente) {
      return orden.cliente.nombre + 
        (orden.cliente.apellido ? ' ' + orden.cliente.apellido : '') +
        (orden.cliente.razonSocial ? ' - ' + orden.cliente.razonSocial : '');
    }
    return `Cliente #${orden.clienteId}`;
  };

  const getEstadoColor = (estado: string): "default" | "success" | "error" => {
    switch (estado) {
      case 'FINALIZADA':
        return 'success';
      case 'CANCELADA':
        return 'error';
      default:
        return 'default';
    }
  };

  // Filter and sort ordenes by finalization date descending (newest first)
  const filteredOrdenes = useMemo(() => {
    const filtered = ordenes.filter(o => {
      const matchesEstado = estadoFilter === 'TODOS' || o.estado === estadoFilter;

      const matchesSearch = !searchTerm ||
        o.numeroOrden?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(o).toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.descripcionTrabajo?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFechaDesde = !fechaDesde ||
        (o.fechaFinalizacion && new Date(o.fechaFinalizacion) >= new Date(fechaDesde));

      const matchesFechaHasta = !fechaHasta ||
        (o.fechaFinalizacion && new Date(o.fechaFinalizacion) <= new Date(fechaHasta));

      return matchesEstado && matchesSearch && matchesFechaDesde && matchesFechaHasta;
    });

    // Sort by finalization date descending (newest first)
    return filtered.sort((a, b) => {
      const dateA = a.fechaFinalizacion ? new Date(a.fechaFinalizacion).getTime() : 0;
      const dateB = b.fechaFinalizacion ? new Date(b.fechaFinalizacion).getTime() : 0;
      return dateB - dateA;
    });
  }, [ordenes, estadoFilter, searchTerm, fechaDesde, fechaHasta]);

  const handleViewDetails = (orden: OrdenServicio) => {
    setSelected(orden);
    setOpen(true);
  };

  const calcularTotalHoras = (orden: OrdenServicio): number => {
    if (!orden.tareas || orden.tareas.length === 0) return 0;
    return orden.tareas.reduce((sum, tarea) => sum + (tarea.horasReales || 0), 0);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Trabajos Realizados
        </Typography>
        <Tooltip title="Recargar">
          <IconButton onClick={loadOrdenes} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas Rápidas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <BuildIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {filteredOrdenes.filter(o => o.estado === 'FINALIZADA').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Finalizados
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <BuildIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {filteredOrdenes.filter(o => o.estado === 'CANCELADA').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Cancelados
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <MoneyIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${filteredOrdenes.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Facturado
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <CalendarIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {filteredOrdenes.reduce((sum, o) => sum + calcularTotalHoras(o), 0)}h
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Horas Trabajadas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box mb={2}>
            <Grid container spacing={2}>
              {/* Búsqueda */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="N° Orden, Cliente, Descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Filtro por Estado */}
              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="FINALIZADA">Finalizados</MenuItem>
                  <MenuItem value="CANCELADA">Cancelados</MenuItem>
                </TextField>
              </Grid>

              {/* Fecha Desde */}
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Desde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Fecha Hasta */}
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Hasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100 }}>N° Orden</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Fecha Finalización</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Descripción</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Horas</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Total</TableCell>
                  <TableCell sx={{ minWidth: 80 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrdenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay trabajos realizados disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrdenes.map(orden => (
                    <TableRow key={orden.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {orden.numeroOrden}
                        </Typography>
                      </TableCell>
                      <TableCell>{getClientName(orden)}</TableCell>
                      <TableCell>
                        {orden.fechaFinalizacion
                          ? dayjs(orden.fechaFinalizacion).format('DD/MM/YYYY')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={orden.estado}
                          color={getEstadoColor(orden.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {orden.descripcionTrabajo}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<CalendarIcon />}
                          label={`${calcularTotalHoras(orden)}h`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600" color="primary.main">
                          ${orden.total.toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver Detalle">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(orden)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
                    Trabajo Realizado - {selected.numeroOrden}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={0.5}>
                    Finalizado el {selected.fechaFinalizacion
                      ? dayjs(selected.fechaFinalizacion).format('DD/MM/YYYY')
                      : '-'}
                  </Typography>
                </Box>
                <Chip
                  label={selected.estado}
                  color={getEstadoColor(selected.estado)}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: { xs: 1, sm: 2 } }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                {/* Información del Cliente */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Cliente
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                            Nombre
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                            {getClientName(selected)}
                          </Typography>
                        </Box>
                        {selected.responsable && (
                          <Box>
                            <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                              Responsable
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                              {selected.responsable.nombre} {selected.responsable.apellido}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Costos y Resumen */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Resumen Económico
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Mano de Obra
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            ${(selected.costoManoObra || 0).toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Materiales
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            ${(selected.costoMateriales || 0).toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="textSecondary" fontWeight="600">
                            Horas Trabajadas
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {calcularTotalHoras(selected)}h
                          </Typography>
                        </Box>
                        <Divider />
                        <Box display="flex" justifyContent="space-between" pt={1}>
                          <Typography variant="h6" color="primary" fontWeight="700">
                            Total
                          </Typography>
                          <Typography variant="h5" color="primary" fontWeight="700">
                            ${(selected.total || 0).toLocaleString('es-AR')}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Descripción del Trabajo */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        📝 Descripción del Trabajo
                      </Typography>
                      <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                          {selected.descripcionTrabajo}
                        </Typography>
                      </Box>
                      {selected.observaciones && (
                        <>
                          <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mt: 3, mb: 2 }}>
                            💬 Observaciones
                          </Typography>
                          <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                              {selected.observaciones}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Materiales Utilizados */}
                {selected.materiales && selected.materiales.length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                          🔧 Materiales Utilizados
                        </Typography>
                        <TableContainer sx={{ borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'primary.50' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Cantidad</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Precio Unit.</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selected.materiales.map((material, idx) => (
                                <TableRow key={idx} hover>
                                  <TableCell>
                                    {material.productoNombre || material.productoTerminado?.nombre || `Producto #${material.productoId || material.productoTerminadoId}`}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 500 }}>{material.cantidad}</TableCell>
                                  <TableCell align="right">${material.precioUnitario?.toLocaleString('es-AR') || 0}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    ${material.subtotal.toLocaleString('es-AR')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Tareas Realizadas */}
                {selected.tareas && selected.tareas.length > 0 && (
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                          ✅ Tareas Realizadas
                        </Typography>
                        <Stack spacing={2}>
                          {selected.tareas.map((tarea, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                p: 2.5,
                                bgcolor: tarea.estado === 'COMPLETADA' ? 'success.50' : 'grey.50',
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: tarea.estado === 'COMPLETADA' ? 'success.main' : 'grey.300',
                              }}
                            >
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                                <Box flex={1}>
                                  <Typography variant="body1" fontWeight="600" gutterBottom>
                                    {tarea.descripcion}
                                  </Typography>
                                  {tarea.empleado && (
                                    <Typography variant="caption" color="textSecondary" display="block">
                                      👤 {tarea.empleado.nombre} {tarea.empleado.apellido}
                                    </Typography>
                                  )}
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={`${tarea.horasReales || 0}h reales`}
                                    size="small"
                                    color="primary"
                                  />
                                  <Chip
                                    label={tarea.estado}
                                    size="small"
                                    color={tarea.estado === 'COMPLETADA' ? 'success' : 'default'}
                                    sx={{ fontWeight: 600 }}
                                  />
                                </Stack>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
              <Button variant="outlined" onClick={() => setOpen(false)} size="large">
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TrabajosRealizadosPage;
