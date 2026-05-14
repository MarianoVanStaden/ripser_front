/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
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
  Autocomplete,
  InputAdornment,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon, 
  Visibility as ViewIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import { clienteApi } from '../../api/services/clienteApi';
import { employeeApi } from '../../api/services/employeeApi';
import { equipoFabricadoApi } from '../../api/services';
import type { OrdenServicio, Cliente, Empleado, EquipoFabricadoDTO } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';


const OrdenesServicioPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OrdenServicio | null>(null);
  const [open, setOpen] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  
  // Estados para el formulario
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrden, setEditingOrden] = useState<OrdenServicio | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [saving, setSaving] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<{
    clienteId: string;
    responsableId: string;
    descripcionTrabajo: string;
    observaciones: string;
    fechaEstimada: string;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';
  }>({
    clienteId: '',
    responsableId: '',
    descripcionTrabajo: '',
    observaciones: '',
    fechaEstimada: '',
    estado: 'PENDIENTE'
  });

  // Estado para equipos en service vinculados a la orden
  const [equiposOrden, setEquiposOrden] = useState<EquipoFabricadoDTO[]>([]);
  const [descripcionFalla, setDescripcionFalla] = useState('');
  const [equipoEncontrado, setEquipoEncontrado] = useState<EquipoFabricadoDTO | null>(null);
  const [equipoError, setEquipoError] = useState<string | null>(null);
  // Equipos del cliente seleccionado: se cargan al elegir cliente y se usan
  // como opciones del Autocomplete (evita tipear el código a mano).
  const [equiposCliente, setEquiposCliente] = useState<EquipoFabricadoDTO[]>([]);
  const [loadingEquiposCliente, setLoadingEquiposCliente] = useState(false);

  useEffect(() => {
    loadOrdenes();
    loadClientes();
    loadEmpleados();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await clienteApi.getAll({ page: 0, size: 1000 });
      const clientesList = Array.isArray(data) 
        ? data 
        : (data as any).content || [];
      setClientes(clientesList);
    } catch (err) {
      console.error('Error loading clientes:', err);
    }
  };

  const loadEmpleados = async () => {
    try {
      const data = await employeeApi.getAllList();
      setEmpleados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading empleados:', err);
    }
  };

  const loadOrdenes = async () => {
    try {
      setLoading(true);
      setError(null);
      // size grande + sort desc por id para garantizar que las recién creadas
      // entren en la página y aparezcan arriba (la default del backend solo trae ~20).
      const data = await ordenServicioApi.getAll({ page: 0, size: 1000, sort: 'id,desc' });
      // Handle paginated response
      const ordenesList = Array.isArray(data)
        ? data
        : (data as any).content || [];
      setOrdenes(ordenesList);
    } catch (err) {
      setError('Error al cargar las órdenes de servicio');
      console.error('Error loading ordenes:', err);
      setOrdenes([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (orden?: OrdenServicio) => {
    if (orden) {
      setEditingOrden(orden);
      setFormData({
        clienteId: orden.clienteId.toString(),
        responsableId: orden.responsableId?.toString() || '',
        descripcionTrabajo: orden.descripcionTrabajo,
        observaciones: orden.observaciones || '',
        fechaEstimada: orden.fechaEstimada ? orden.fechaEstimada.split('T')[0] : '',
        estado: orden.estado
      });
    } else {
      setEditingOrden(null);
      setFormData({
        clienteId: '',
        responsableId: '',
        descripcionTrabajo: '',
        observaciones: '',
        fechaEstimada: '',
        estado: 'PENDIENTE'
      });
    }
    setFormOpen(true);
  };

  const resetEquiposState = () => {
    setEquiposOrden([]);
    setDescripcionFalla('');
    setEquipoEncontrado(null);
    setEquipoError(null);
    setEquiposCliente([]);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingOrden(null);
    setFormData({
      clienteId: '',
      responsableId: '',
      descripcionTrabajo: '',
      observaciones: '',
      fechaEstimada: '',
      estado: 'PENDIENTE'
    });
    resetEquiposState();
  };

  // Cargar equipos del cliente seleccionado para el combo del formulario.
  // Se ejecuta cuando el cliente del form cambia (incluyendo cuando se abre
  // en modo edición con cliente preseleccionado).
  useEffect(() => {
    if (!formOpen) return;
    const clienteId = formData.clienteId ? parseInt(formData.clienteId) : null;
    if (!clienteId) {
      setEquiposCliente([]);
      setEquipoEncontrado(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEquiposCliente(true);
      setEquipoError(null);
      try {
        const list = await equipoFabricadoApi.findByCliente(clienteId);
        if (!cancelled) setEquiposCliente((list as any) || []);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error cargando equipos del cliente:', err);
          setEquipoError('Error al cargar equipos del cliente');
          setEquiposCliente([]);
        }
      } finally {
        if (!cancelled) setLoadingEquiposCliente(false);
      }
    })();
    return () => { cancelled = true; };
  }, [formOpen, formData.clienteId]);

  const handleAgregarEquipo = () => {
    if (!equipoEncontrado) return;
    if (equipoEncontrado.id != null && equiposOrden.some((e) => e.id === equipoEncontrado.id)) {
      setEquipoError('Este equipo ya fue agregado a la orden');
      return;
    }
    setEquiposOrden((prev) => [...prev, equipoEncontrado]);
    setEquipoEncontrado(null);
    setEquipoError(null);
  };

  const handleQuitarEquipo = (equipoId: number) => {
    setEquiposOrden((prev) => prev.filter((e) => e.id !== equipoId));
  };

  const handleSaveOrden = async () => {
    setSaving(true);
    try {
      const equipoIds = equiposOrden
        .map((e) => e.id)
        .filter((id): id is number => id != null);

      const ordenData: any = {
        clienteId: parseInt(formData.clienteId),
        responsableId: formData.responsableId ? parseInt(formData.responsableId) : undefined,
        descripcionTrabajo: formData.descripcionTrabajo,
        observaciones: formData.observaciones,
        estado: formData.estado,
        materiales: [],
        tareas: [],
        ...(equipoIds.length > 0 && { equipoIds }),
        ...(descripcionFalla.trim() && { descripcionFalla: descripcionFalla.trim() }),
      };

      // Solo agregar fechaEstimada si tiene valor y es futura
      if (formData.fechaEstimada) {
        const selectedDate = new Date(formData.fechaEstimada);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        if (selectedDate >= tomorrow) {
          ordenData.fechaEstimada = selectedDate.toISOString();
        }
      }

      if (editingOrden) {
        await ordenServicioApi.update(editingOrden.id, ordenData);
      } else {
        await ordenServicioApi.create(ordenData);
      }

      // Close the form immediately so the user has clear feedback,
      // then refresh the list in the background.
      handleCloseForm();
      loadOrdenes(); // intentionally not awaited — runs in background
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la orden de servicio');
      console.error('Error saving orden:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      await ordenServicioApi.cambiarEstado(id, nuevoEstado);
      await loadOrdenes();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado');
      console.error('Error changing estado:', err);
    }
  };

  const getClientName = (orden: OrdenServicio) => {
    // Primero intentar usar clienteNombre del DTO
    if (orden.clienteNombre) {
      return orden.clienteNombre;
    }
    // Fallback a objeto cliente completo
    if (orden.cliente) {
      return orden.cliente.nombre + 
        (orden.cliente.apellido ? ' ' + orden.cliente.apellido : '') +
        (orden.cliente.razonSocial ? ' - ' + orden.cliente.razonSocial : '');
    }
    return `Cliente #${orden.clienteId}`;
  };

  const getEstadoColor = (estado: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (estado) {
      case 'FINALIZADA':
        return 'success';
      case 'EN_PROCESO':
        return 'warning';
      case 'CANCELADA':
        return 'error';
      case 'PENDIENTE':
      default:
        return 'default';
    }
  };

  // Filter and sort ordenes by date descending (newest first)
  const filteredOrdenes = useMemo(() => {
    if (!Array.isArray(ordenes)) return [];

    const filtered = ordenes
      .filter(o => estadoFilter === 'TODOS' || o.estado === estadoFilter)
      .filter(o => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          o.numeroOrden?.toLowerCase().includes(searchLower) ||
          getClientName(o).toLowerCase().includes(searchLower) ||
          o.descripcionTrabajo?.toLowerCase().includes(searchLower)
        );
      });

    // Sort by date descending (newest first)
    return filtered.sort((a, b) =>
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  }, [ordenes, estadoFilter, searchTerm]);

  const handleViewDetails = (orden: OrdenServicio) => {
    setSelected(orden);
    setOpen(true);
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando órdenes de servicio..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Órdenes de Servicio
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadOrdenes} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Nueva Orden
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box mb={2} display="flex" gap={2} flexWrap="wrap">
            <TextField
              label="Buscar"
              placeholder="N° Orden, Cliente, Descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 300 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Filtrar por Estado"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
              <MenuItem value="FINALIZADA">Finalizada</MenuItem>
              <MenuItem value="CANCELADA">Cancelada</MenuItem>
            </TextField>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100 }}>N° Orden</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Cliente</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Fecha Creación</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Descripción</TableCell>
                  <TableCell align="right" sx={{ minWidth: 80 }}>Total</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrdenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay órdenes de servicio disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrdenes.map(orden => (
                    <TableRow key={orden.id} hover>
                      <TableCell>{orden.numeroOrden}</TableCell>
                      <TableCell>{getClientName(orden)}</TableCell>
                      <TableCell>
                        {new Date(orden.fechaCreacion).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={orden.estado} 
                          color={getEstadoColor(orden.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{orden.descripcionTrabajo}</TableCell>
                      <TableCell align="right">
                        ${orden.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Ver Detalle">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewDetails(orden)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenForm(orden)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>

                          {/* Botones de cambio de estado */}
                          {orden.estado === 'PENDIENTE' && (
                            <Tooltip title="Iniciar">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCambiarEstado(orden.id, 'EN_PROCESO')}
                                color="warning"
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {orden.estado === 'EN_PROCESO' && (
                            <Tooltip title="Finalizar">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCambiarEstado(orden.id, 'FINALIZADA')}
                                color="success"
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          {(orden.estado === 'PENDIENTE' || orden.estado === 'EN_PROCESO') && (
                            <Tooltip title="Cancelar">
                              <IconButton 
                                size="small" 
                                onClick={() => handleCambiarEstado(orden.id, 'CANCELADA')}
                                color="error"
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
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
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Orden {selected.numeroOrden}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={0.5}>
                    Creada el {new Date(selected.fechaCreacion).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Typography>
                </Box>
                <Chip
                  label={selected.estado}
                  color={getEstadoColor(selected.estado)}
                  size="medium"
                  sx={{ fontWeight: 'bold', fontSize: '0.9rem', px: 2 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
            {/* @ts-ignore - MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md */}
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              {/* Información General */}
              {/* @ts-ignore */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                      📋 Información General
                    </Typography>
                    <Stack spacing={2.5}>
                      <Box>
                        <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                          Cliente
                        </Typography>
                        <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                          {getClientName(selected)}
                        </Typography>
                      </Box>
                      {selected.fechaEstimada && (
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                            Fecha Estimada
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {new Date(selected.fechaEstimada).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      )}
                      {selected.fechaFinalizacion && (
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                            Fecha Finalización
                          </Typography>
                          <Typography variant="body1" sx={{ mt: 0.5 }}>
                            {new Date(selected.fechaFinalizacion).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      )}
                      {selected.responsable && (
                        <Box>
                          <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
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

              {/* Costos */}
              {/* @ts-ignore */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2, boxShadow: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                      💰 Costos
                    </Typography>
                    <Stack spacing={2.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                          Mano de Obra
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          ${(selected.costoManoObra || 0).toLocaleString('es-AR')}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="textSecondary" fontWeight="600" textTransform="uppercase" letterSpacing={0.5}>
                          Materiales
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                          ${(selected.costoMateriales || 0).toLocaleString('es-AR')}
                        </Typography>
                      </Box>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        pt={2}
                        mt={1}
                        borderTop="2px solid"
                        borderColor="primary.main"
                      >
                        <Typography variant="h6" color="primary" fontWeight="700">
                          Total
                        </Typography>
                        <Typography variant="h5" color="primary" fontWeight="700">
                          ${(selected.total || 0).toLocaleString('es-AR')}
                        </Typography>
                      </Box>
                    </Stack>
                    {selected.materiales && selected.materiales.length === 0 && selected.tareas && selected.tareas.length === 0 && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="caption">
                          No se han agregado materiales ni tareas. Los costos se calcularán automáticamente al agregarlos.
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Descripción del Trabajo */}
              {/* @ts-ignore */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                      📝 Descripción del Trabajo
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'grey.50',
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                        {selected.descripcionTrabajo}
                      </Typography>
                    </Box>
                    {selected.observaciones && (
                      <>
                        <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mt: 3, mb: 2 }}>
                          💬 Observaciones
                        </Typography>
                        <Box
                          sx={{
                            bgcolor: 'info.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'info.200'
                          }}
                        >
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                            {selected.observaciones}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Equipos en Service */}
              {selected.equipos && selected.equipos.length > 0 && (
                // @ts-expect-error
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" color="warning.dark" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        🔧 Equipos en Service
                      </Typography>
                      <TableContainer sx={{ borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'warning.50' }}>
                              <TableCell sx={{ fontWeight: 600 }}>N° Heladera</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Modelo</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Falla Reportada</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Ingreso</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selected.equipos.map((eq, idx) => (
                              <TableRow key={eq.equipoFabricadoId ?? idx} hover>
                                <TableCell sx={{ fontWeight: 600 }}>{eq.numeroHeladera}</TableCell>
                                <TableCell>{eq.tipo}</TableCell>
                                <TableCell>{eq.modelo}</TableCell>
                                <TableCell sx={{ color: 'text.secondary' }}>
                                  {eq.descripcionFalla || '—'}
                                </TableCell>
                                <TableCell>
                                  {eq.fechaIngresoServicio
                                    ? new Date(eq.fechaIngresoServicio).toLocaleDateString('es-AR')
                                    : '—'}
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

              {/* Materiales Utilizados */}
              {selected.materiales && selected.materiales.length > 0 && (
                // @ts-expect-error
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

              {/* Tareas */}
              {selected.tareas && selected.tareas.length > 0 && (
                // @ts-expect-error
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
                        ✅ Tareas Asignadas
                      </Typography>
                      <Stack spacing={2}>
                        {selected.tareas.map((tarea, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 2.5,
                              bgcolor: tarea.estado === 'COMPLETADA' ? 'success.50' : 'warning.50',
                              borderRadius: 2,
                              border: '2px solid',
                              borderColor: tarea.estado === 'COMPLETADA' ? 'success.main' : 'warning.main',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2
                              }
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                              <Typography variant="body1" fontWeight="600" sx={{ flex: 1 }}>
                                {tarea.descripcion}
                              </Typography>
                              <Chip
                                label={tarea.estado}
                                size="small"
                                color={tarea.estado === 'COMPLETADA' ? 'success' : 'warning'}
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>
                            {tarea.empleado && (
                              <Typography variant="caption" color="textSecondary" fontWeight="500" mt={1.5} display="block">
                                👤 Asignado a: {tarea.empleado.nombre} {tarea.empleado.apellido}
                              </Typography>
                            )}
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
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => {
                  setOpen(false);
                  handleOpenForm(selected);
                }}
              >
                Editar Orden
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de Formulario Crear/Editar */}
      <Dialog
        open={formOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 2 }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 2.5
          }}
        >
          <Typography variant="h5" fontWeight="600">
            {editingOrden ? '✏️ Editar Orden de Servicio' : '➕ Nueva Orden de Servicio'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
            {editingOrden ? 'Modifique los campos necesarios' : 'Complete los datos de la nueva orden'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Cliente y Responsable */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  👤 INFORMACIÓN DEL CLIENTE
                </Typography>
                <Stack spacing={2}>
                  <Autocomplete
                    options={clientes}
                    getOptionLabel={(cliente) =>
                      `${cliente.nombre}${cliente.apellido ? ' ' + cliente.apellido : ''}${cliente.razonSocial ? ' - ' + cliente.razonSocial : ''}`
                    }
                    value={clientes.find(c => c.id.toString() === formData.clienteId) || null}
                    onChange={(_, value) =>
                      setFormData({ ...formData, clienteId: value?.id.toString() || '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cliente *"
                        required
                        placeholder="Seleccione un cliente"
                      />
                    )}
                  />

                  <Autocomplete
                    options={empleados}
                    getOptionLabel={(empleado) => `${empleado.nombre} ${empleado.apellido}`}
                    value={empleados.find(e => e.id.toString() === formData.responsableId) || null}
                    onChange={(_, value) =>
                      setFormData({ ...formData, responsableId: value?.id.toString() || '' })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Responsable"
                        placeholder="Seleccione un responsable (opcional)"
                      />
                    )}
                  />
                </Stack>
              </Paper>

              {/* Descripción del Trabajo */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  📝 DESCRIPCIÓN DEL TRABAJO
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Descripción del Trabajo *"
                    multiline
                    rows={4}
                    value={formData.descripcionTrabajo}
                    onChange={(e) => setFormData({ ...formData, descripcionTrabajo: e.target.value })}
                    required
                    placeholder="Describa el trabajo a realizar de forma detallada..."
                    sx={{ bgcolor: 'white' }}
                  />

                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas adicionales, requerimientos especiales..."
                    sx={{ bgcolor: 'white' }}
                  />
                </Stack>
              </Paper>

              {/* Equipos en Service */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  bgcolor: 'warning.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'warning.200',
                }}
              >
                <Typography variant="subtitle2" fontWeight="700" color="warning.dark" gutterBottom sx={{ mb: 0.5 }}>
                  🔧 EQUIPOS EN SERVICE
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Opcional — vincula los equipos físicos que ingresan a reparación. El conteo "En Service" se actualiza automáticamente.
                </Typography>

                {/* Selector de equipos del cliente — sólo aparecen equipos asociados */}
                {!formData.clienteId ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Seleccioná un cliente para ver sus equipos.
                  </Alert>
                ) : (
                  <Autocomplete
                    fullWidth
                    size="small"
                    loading={loadingEquiposCliente}
                    options={equiposCliente.filter(
                      (e) => e.id != null && !equiposOrden.some((eo) => eo.id === e.id)
                    )}
                    value={equipoEncontrado}
                    onChange={(_, val) => {
                      setEquipoEncontrado(val);
                      setEquipoError(null);
                    }}
                    getOptionLabel={(eq) =>
                      `${eq.numeroHeladera} · ${eq.tipo} · ${eq.modelo}${
                        eq.color?.nombre ? ` · ${eq.color.nombre}` : ''
                      }`
                    }
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    noOptionsText={
                      loadingEquiposCliente
                        ? 'Cargando…'
                        : 'El cliente no tiene equipos disponibles para service'
                    }
                    sx={{ mb: 2, bgcolor: 'white' }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Equipo del cliente"
                        placeholder="Buscar por número, modelo, color..."
                        helperText={
                          equiposCliente.length === 0 && !loadingEquiposCliente
                            ? 'Este cliente no tiene equipos vinculados.'
                            : `${equiposCliente.length} equipo(s) del cliente`
                        }
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {loadingEquiposCliente ? <CircularProgress size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}

                {/* Error de búsqueda */}
                {equipoError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEquipoError(null)}>
                    {equipoError}
                  </Alert>
                )}

                {/* Resultado encontrado — confirmar antes de agregar */}
                {equipoEncontrado && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'success.50',
                      border: '1px solid',
                      borderColor: 'success.300',
                      borderRadius: 1.5,
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                      <Box>
                        <Typography variant="body2" fontWeight="700">
                          {equipoEncontrado.numeroHeladera}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {equipoEncontrado.tipo} · {equipoEncontrado.modelo}
                          {equipoEncontrado.color?.nombre ? ` · ${equipoEncontrado.color.nombre}` : ''}
                        </Typography>
                        <Box mt={0.5}>
                          <Chip label={equipoEncontrado.estadoAsignacion} size="small" />
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={handleAgregarEquipo}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        + Agregar
                      </Button>
                    </Box>
                  </Paper>
                )}

                {/* Lista de equipos ya agregados */}
                {equiposOrden.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      fontWeight="700"
                      color="text.secondary"
                      sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      Equipos vinculados ({equiposOrden.length})
                    </Typography>
                    <Stack spacing={0.75}>
                      {equiposOrden.map((equipo) => (
                        <Box
                          key={equipo.id ?? equipo.numeroHeladera}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            px: 1.5,
                            py: 1,
                            bgcolor: 'white',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.300',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              {equipo.numeroHeladera}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {equipo.tipo} · {equipo.modelo}
                            </Typography>
                          </Box>
                          <Tooltip title="Quitar equipo">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => equipo.id != null && handleQuitarEquipo(equipo.id)}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Descripción de la falla */}
                <TextField
                  fullWidth
                  label="Descripción de la Falla"
                  multiline
                  rows={2}
                  value={descripcionFalla}
                  onChange={(e) => setDescripcionFalla(e.target.value)}
                  placeholder="Describa el problema o falla reportada..."
                  size="small"
                  sx={{ bgcolor: 'white' }}
                  disabled={equiposOrden.length === 0}
                  helperText={equiposOrden.length === 0 ? 'Agregue al menos un equipo para ingresar la falla' : undefined}
                />
              </Paper>

              {/* Fechas y Estado */}
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="primary" gutterBottom sx={{ mb: 2 }}>
                  📅 FECHAS Y ESTADO
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={editingOrden ? 6 : 12}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha Estimada de Finalización"
                      value={formData.fechaEstimada}
                      onChange={(e) => setFormData({ ...formData, fechaEstimada: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      helperText="Opcional - Fecha estimada para completar el trabajo"
                      sx={{ bgcolor: 'white' }}
                    />
                  </Grid>

                  {editingOrden && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Estado"
                        value={formData.estado}
                        onChange={(e) => setFormData({
                          ...formData,
                          estado: e.target.value as typeof formData.estado
                        })}
                        sx={{ bgcolor: 'white' }}
                      >
                        <MenuItem value="PENDIENTE">⏳ Pendiente</MenuItem>
                        <MenuItem value="EN_PROCESO">🔧 En Proceso</MenuItem>
                        <MenuItem value="FINALIZADA">✅ Finalizada</MenuItem>
                        <MenuItem value="CANCELADA">❌ Cancelada</MenuItem>
                      </TextField>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Nota informativa */}
              <Alert
                severity="info"
                icon={<Box component="span" sx={{ fontSize: '1.2rem' }}>💡</Box>}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight="600" gutterBottom>
                  <strong>Importante: Flujo de Trabajo</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  1. Crear la orden de servicio con los datos básicos<br />
                  2. Agregar materiales en <strong>"Control de Materiales"</strong><br />
                  3. Asignar tareas a empleados en <strong>"Asignación de Tareas"</strong><br />
                  4. Los costos se calculan automáticamente según materiales y tareas<br />
                  5. Ver el resumen completo en <strong>"Trabajos Realizados"</strong>
                </Typography>
              </Alert>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.100', borderTop: '1px solid', borderColor: 'grey.300' }}>
          <Button
            onClick={handleCloseForm}
            size="large"
            variant="outlined"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveOrden}
            variant="contained"
            size="large"
            disabled={!formData.clienteId || !formData.descripcionTrabajo || saving}
            sx={{ minWidth: 160 }}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {saving ? 'Guardando...' : (editingOrden ? '💾 Guardar Cambios' : '➕ Crear Orden')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdenesServicioPage;



