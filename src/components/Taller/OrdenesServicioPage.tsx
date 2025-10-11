// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
import React, { useState, useEffect } from 'react';
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
  Grid
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
import type { OrdenServicio, Cliente, Empleado } from '../../types';


const OrdenesServicioPage: React.FC = () => {
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
  
  // Estados del formulario
  const [formData, setFormData] = useState<{
    clienteId: string;
    responsableId: string;
    descripcionTrabajo: string;
    observaciones: string;
    fechaEstimada: string;
    costoManoObra: string;
    estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';
  }>({
    clienteId: '',
    responsableId: '',
    descripcionTrabajo: '',
    observaciones: '',
    fechaEstimada: '',
    costoManoObra: '0',
    estado: 'PENDIENTE'
  });

  useEffect(() => {
    loadOrdenes();
    loadClientes();
    loadEmpleados();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await clienteApi.getAll();
      setClientes(Array.isArray(data) ? data : []);
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
      const data = await ordenServicioApi.getAll();
      setOrdenes(Array.isArray(data) ? data : []);
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
        costoManoObra: orden.costoManoObra.toString(),
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
        costoManoObra: '0',
        estado: 'PENDIENTE'
      });
    }
    setFormOpen(true);
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
      costoManoObra: '0',
      estado: 'PENDIENTE'
    });
  };

  const handleSaveOrden = async () => {
    try {
      const ordenData: any = {
        clienteId: parseInt(formData.clienteId),
        responsableId: formData.responsableId ? parseInt(formData.responsableId) : undefined,
        descripcionTrabajo: formData.descripcionTrabajo,
        observaciones: formData.observaciones,
        costoManoObra: parseFloat(formData.costoManoObra) || 0,
        costoMateriales: 0,
        total: parseFloat(formData.costoManoObra) || 0,
        estado: formData.estado,
        materiales: [], // Agregar array vacío
        tareas: [] // Agregar array vacío
      };

      // Solo agregar fechaEstimada si tiene valor y es futura
      if (formData.fechaEstimada) {
        const selectedDate = new Date(formData.fechaEstimada);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        // Solo enviar si la fecha es al menos mañana
        if (selectedDate >= tomorrow) {
          ordenData.fechaEstimada = selectedDate.toISOString();
        }
      }

      if (editingOrden) {
        await ordenServicioApi.update(editingOrden.id, ordenData);
      } else {
        await ordenServicioApi.create(ordenData);
      }

      await loadOrdenes();
      handleCloseForm();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la orden de servicio');
      console.error('Error saving orden:', err);
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

  const filteredOrdenes = Array.isArray(ordenes) 
    ? ordenes
        .filter(o => estadoFilter === 'TODOS' || o.estado === estadoFilter)
        .filter(o => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          return (
            o.numeroOrden?.toLowerCase().includes(searchLower) ||
            getClientName(o).toLowerCase().includes(searchLower) ||
            o.descripcionTrabajo?.toLowerCase().includes(searchLower)
          );
        })
    : [];

  const handleViewDetails = (orden: OrdenServicio) => {
    setSelected(orden);
    setOpen(true);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Órdenes de Servicio</Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadOrdenes} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Nueva Orden
          </Button>
        </Box>
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
              sx={{ minWidth: 300 }}
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
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="TODOS">Todos</MenuItem>
              <MenuItem value="PENDIENTE">Pendiente</MenuItem>
              <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
              <MenuItem value="FINALIZADA">Finalizada</MenuItem>
              <MenuItem value="CANCELADA">Cancelada</MenuItem>
            </TextField>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Orden</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Acciones</TableCell>
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        {selected && (
          <Box p={3}>
            <Typography variant="h5" mb={3} fontWeight="bold">
              Detalle de Orden {selected.numeroOrden}
            </Typography>
            
            {/* @ts-ignore - MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md */}
            <Grid container spacing={3}>
              {/* Información General */}
              {/* @ts-ignore */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Información General
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Cliente</Typography>
                        <Typography variant="body1" fontWeight="500">{getClientName(selected)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Estado</Typography>
                        <Box mt={0.5}>
                          <Chip 
                            label={selected.estado} 
                            color={getEstadoColor(selected.estado)}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary">Fecha Creación</Typography>
                        <Typography variant="body1">
                          {new Date(selected.fechaCreacion).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      {selected.fechaEstimada && (
                        <Box>
                          <Typography variant="caption" color="textSecondary">Fecha Estimada</Typography>
                          <Typography variant="body1">
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
                          <Typography variant="caption" color="textSecondary">Fecha Finalización</Typography>
                          <Typography variant="body1">
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
                          <Typography variant="caption" color="textSecondary">Responsable</Typography>
                          <Typography variant="body1">
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
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Costos
                    </Typography>
                    <Stack spacing={1.5}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">Mano de Obra:</Typography>
                        <Typography variant="body1" fontWeight="500">
                          ${selected.costoManoObra.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="textSecondary">Materiales:</Typography>
                        <Typography variant="body1" fontWeight="500">
                          ${selected.costoMateriales.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" pt={1} borderTop="1px solid #e0e0e0">
                        <Typography variant="h6" color="primary">Total:</Typography>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          ${selected.total.toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Descripción del Trabajo */}
              {/* @ts-ignore */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Descripción del Trabajo
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selected.descripcionTrabajo}
                    </Typography>
                    {selected.observaciones && (
                      <>
                        <Typography variant="h6" color="primary" gutterBottom mt={2}>
                          Observaciones
                        </Typography>
                        <Typography variant="body1">
                          {selected.observaciones}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Materiales Utilizados */}
              {selected.materiales && selected.materiales.length > 0 && (
                // @ts-ignore
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Materiales Utilizados
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Producto</TableCell>
                              <TableCell align="center">Cantidad</TableCell>
                              <TableCell align="right">Precio Unit.</TableCell>
                              <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selected.materiales.map((material, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  {material.productoTerminado?.nombre || `Producto #${material.productoTerminadoId}`}
                                </TableCell>
                                <TableCell align="center">{material.cantidad}</TableCell>
                                <TableCell align="right">${material.precioUnitario?.toLocaleString() || 0}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 500 }}>
                                  ${material.subtotal.toLocaleString()}
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
                // @ts-ignore
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Tareas Asignadas
                      </Typography>
                      <Stack spacing={1.5}>
                        {selected.tareas.map((tarea, idx) => (
                          <Box 
                            key={idx} 
                            p={2} 
                            bgcolor={tarea.estado === 'COMPLETADA' ? '#e8f5e9' : '#fff3e0'}
                            borderRadius={1}
                            border="1px solid"
                            borderColor={tarea.estado === 'COMPLETADA' ? '#4caf50' : '#ff9800'}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" fontWeight="500">
                                {tarea.descripcion}
                              </Typography>
                              <Chip 
                                label={tarea.estado} 
                                size="small"
                                color={tarea.estado === 'COMPLETADA' ? 'success' : 'warning'}
                              />
                            </Box>
                            {tarea.empleado && (
                              <Typography variant="caption" color="textSecondary" mt={1} display="block">
                                Asignado a: {tarea.empleado.nombre} {tarea.empleado.apellido}
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

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button variant="outlined" onClick={() => setOpen(false)}>
                Cerrar
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  setOpen(false);
                  handleOpenForm(selected);
                }}
              >
                Editar Orden
              </Button>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Dialog de Formulario Crear/Editar */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOrden ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(cliente) => 
                    cliente.nombre + 
                    (cliente.apellido ? ' ' + cliente.apellido : '') +
                    (cliente.razonSocial ? ' - ' + cliente.razonSocial : '')
                  }
                  value={clientes.find(c => c.id.toString() === formData.clienteId) || null}
                  onChange={(_, value) => 
                    setFormData({ ...formData, clienteId: value?.id.toString() || '' })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Cliente" required />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={empleados}
                  getOptionLabel={(empleado) => `${empleado.nombre} ${empleado.apellido}`}
                  value={empleados.find(e => e.id.toString() === formData.responsableId) || null}
                  onChange={(_, value) => 
                    setFormData({ ...formData, responsableId: value?.id.toString() || '' })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Responsable (Opcional)" />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción del Trabajo"
                  multiline
                  rows={3}
                  value={formData.descripcionTrabajo}
                  onChange={(e) => setFormData({ ...formData, descripcionTrabajo: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Estimada de Finalización"
                  value={formData.fechaEstimada}
                  onChange={(e) => setFormData({ ...formData, fechaEstimada: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Costo Mano de Obra"
                  value={formData.costoManoObra}
                  onChange={(e) => setFormData({ ...formData, costoManoObra: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {editingOrden && (
                // @ts-ignore
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      estado: e.target.value as typeof formData.estado
                    })}
                  >
                    <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                    <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                    <MenuItem value="FINALIZADA">Finalizada</MenuItem>
                    <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  </TextField>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancelar</Button>
          <Button 
            onClick={handleSaveOrden} 
            variant="contained"
            disabled={!formData.clienteId || !formData.descripcionTrabajo}
          >
            {editingOrden ? 'Guardar Cambios' : 'Crear Orden'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdenesServicioPage;



