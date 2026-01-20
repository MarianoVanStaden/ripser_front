import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent, Chip, IconButton,
  Stack, Alert, Snackbar, CircularProgress, Grid, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete, TextField,
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot, TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack, Edit, CheckCircle, Cancel, Link, LinkOff, History, PlayArrow,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  equipoFabricadoApi,
} from '../../api/services/equipoFabricadoApi';
import { historialEstadoEquipoApi } from '../../api/historialEstadoEquipoApi';
import api from '../../api/config';
import type { EquipoFabricadoDTO, HistorialEstadoEquipo } from '../../types';


const EquipoDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id: numeroHeladera } = useParams<{ id: string }>();
  const [equipo, setEquipo] = useState<EquipoFabricadoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [historial, setHistorial] = useState<HistorialEstadoEquipo[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [unassignDialog, setUnassignDialog] = useState(false);
  const [unassignErrorDialog, setUnassignErrorDialog] = useState<{
    open: boolean;
    errorMessage: string;
  }>({ open: false, errorMessage: '' });

  const [deliveryDialog, setDeliveryDialog] = useState(false);
  const [deliveryErrorDialog, setDeliveryErrorDialog] = useState<{
    open: boolean;
    errorMessage: string;
  }>({ open: false, errorMessage: '' });

  const [changeStateDialog, setChangeStateDialog] = useState(false);
  const [newState, setNewState] = useState<'DISPONIBLE' | 'RESERVADO' | 'FACTURADO' | 'ENTREGADO' | null>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (numeroHeladera) {
      loadEquipo();
      loadClientes();
    }
  }, [numeroHeladera]);

  useEffect(() => {
    if (equipo?.id) {
      loadHistorial();
    }
  }, [equipo?.id]);

  const loadEquipo = async () => {
    try {
      setLoading(true);
      const data = await equipoFabricadoApi.findByNumeroHeladera(numeroHeladera!);
      setEquipo(data);
    } catch (error) {
      console.error('Error loading equipo:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar el equipo',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async () => {
    if (!equipo?.id) return; // Wait until equipo is loaded to get the real ID
    try {
      setLoadingHistorial(true);
      const data = await historialEstadoEquipoApi.getByEquipoId(equipo.id);
      setHistorial(data);
    } catch (error) {
      console.error('Error loading historial:', error);
    } finally {
      setLoadingHistorial(false);
    }
  };

const loadClientes = async () => {
    try {
      await api.get('/api/clientes', { params: { page: 0, size: 10000 } })
      .then(response => {
        if (typeof response.data === 'string') {
          throw new Error('API returned HTML instead of JSON. Check if the backend endpoint exists.');
        }
        setClientes(response.data.content || response.data || []);
      });
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const handleIniciarFabricacion = async () => {
    if (!equipo?.id) return;

    try {
      await equipoFabricadoApi.iniciarFabricacion(equipo.id);
      setSnackbar({
        open: true,
        message: '✅ Fabricación iniciada correctamente. Stock descontado.',
        severity: 'success',
      });
      loadEquipo(); // Refresh the equipment data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
      setSnackbar({
        open: true,
        message: `❌ Error al iniciar fabricación: ${errorMessage}`,
        severity: 'error',
      });
    }
  };

  const handleCompletar = async () => {
    if (!equipo) return;
    try {
      await equipoFabricadoApi.completarFabricacion(equipo.id);
      setSnackbar({
        open: true,
        message: 'Equipo completado correctamente',
        severity: 'success',
      });
      loadEquipo();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al completar el equipo',
        severity: 'error',
      });
    }
  };

  const handleCancelar = async () => {
    if (!equipo) return;
    try {
      await equipoFabricadoApi.cancelarFabricacion(equipo.id);
      setSnackbar({
        open: true,
        message: 'Equipo cancelado correctamente',
        severity: 'success',
      });
      loadEquipo();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cancelar el equipo',
        severity: 'error',
      });
    }
  };

  const handleAsignar = async () => {
    if (!equipo || !selectedCliente) return;
    try {
      await equipoFabricadoApi.asignarEquipo(equipo.id, selectedCliente.id);
      setSnackbar({
        open: true,
        message: 'Cliente asignado correctamente',
        severity: 'success',
      });
      setAssignDialog(false);
      setSelectedCliente(null);
      loadEquipo();
      loadHistorial();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al asignar el cliente',
        severity: 'error',
      });
    }
  };

  const handleDesasignar = async () => {
    if (!equipo) return;
    try {
      await equipoFabricadoApi.desasignarEquipo(equipo.id);
      setSnackbar({
        open: true,
        message: 'Cliente desasignado correctamente',
        severity: 'success',
      });
      setUnassignDialog(false);
      loadEquipo();
      loadHistorial();
    } catch (error: any) {
      // Close confirmation dialog
      setUnassignDialog(false);

      // Show error dialog with backend message
      const errorMessage = error.response?.data?.message ||
                          error.response?.data ||
                          error.message ||
                          'Error desconocido al desasignar el cliente';
      setUnassignErrorDialog({
        open: true,
        errorMessage: errorMessage,
      });
    }
  };

  const handleMarcarEntregado = async () => {
    if (!equipo) return;
    try {
      await equipoFabricadoApi.marcarComoEntregado(equipo.id);
      setSnackbar({
        open: true,
        message: '✅ Equipo marcado como ENTREGADO correctamente',
        severity: 'success',
      });
      setDeliveryDialog(false);
      loadEquipo();
      loadHistorial();
    } catch (error: any) {
      // Close confirmation dialog
      setDeliveryDialog(false);

      // Show error dialog with backend message
      const errorMessage = error.response?.data?.message ||
                          error.response?.data ||
                          error.message ||
                          'Error desconocido al marcar como entregado';
      setDeliveryErrorDialog({
        open: true,
        errorMessage: errorMessage,
      });
    }
  };

  const handleChangeState = async () => {
    if (!equipo || !newState) return;
    try {
      // Cambiar estado usando el método del API
      await equipoFabricadoApi.updateEstadoAsignacion(equipo.id, newState);
      
      setSnackbar({
        open: true,
        message: `✅ Estado cambiado a ${newState} correctamente`,
        severity: 'success',
      });
      setChangeStateDialog(false);
      setNewState(null);
      loadEquipo();
      loadHistorial();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message ||
                          error.response?.data ||
                          error.message ||
                          'Error al cambiar el estado';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!equipo) {
    return (
      <Box p={3}>
        <Alert severity="error">Equipo no encontrado</Alert>
      </Box>
    );
  }

  const estadoColor = {
    PENDIENTE: 'warning',
    EN_PROCESO: 'info',
    COMPLETADO: 'success',
    CANCELADO: 'error',
  }[equipo.estado] as 'warning' | 'info' | 'success' | 'error';

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/fabricacion/equipos')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5" fontWeight="600">
            {equipo.numeroHeladera}
          </Typography>
          <Chip label={equipo.estado.replace('_', ' ')} color={estadoColor} />
          {equipo.asignado && <Chip label="Asignado" color="success" />}
        </Box>
        <Stack direction="row" spacing={2}>
          {equipo.estado === 'PENDIENTE' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleIniciarFabricacion}
            >
              Iniciar Fabricación
            </Button>
          )}
          {equipo.estado === 'EN_PROCESO' && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleCompletar}
            >
              Completar
            </Button>
          )}
          {equipo.estado !== 'CANCELADO' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleCancelar}
            >
              Cancelar
            </Button>
          )}
          {!equipo.asignado && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Link />}
              onClick={() => setAssignDialog(true)}
            >
              Asignar Cliente
            </Button>
          )}
          {equipo.asignado && equipo.estadoAsignacion !== 'ENTREGADO' && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LinkOff />}
              onClick={() => setUnassignDialog(true)}
            >
              Desasignar
            </Button>
          )}
          {equipo.asignado && equipo.estadoAsignacion === 'FACTURADO' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => setDeliveryDialog(true)}
            >
              Marcar como Entregado
            </Button>
          )}
          <Button
            variant="outlined"
            color="info"
            startIcon={<History />}
            onClick={() => {
              setNewState((equipo.estadoAsignacion as 'DISPONIBLE' | 'RESERVADO' | 'FACTURADO' | 'ENTREGADO') || null);
              setChangeStateDialog(true);
            }}
          >
            Cambiar Estado
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/fabricacion/equipos/editar/${equipo.id}`)}
          >
            Editar
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Técnica
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1">
                    <Chip label={equipo.tipo} color="primary" size="small" />
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Modelo
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {equipo.modelo}
                  </Typography>
                </Box>
                {equipo.equipo && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Equipo
                    </Typography>
                    <Typography variant="body1">{equipo.equipo}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Medida
                  </Typography>
                  <Typography variant="body1">{equipo.medida || '-'}</Typography>
                </Box>
                {equipo.color && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Color
                    </Typography>
                    <Typography variant="body1">{equipo.color}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Cantidad
                  </Typography>
                  <Typography variant="body1">{equipo.cantidad}</Typography>
                </Box>
                {equipo.estadoAsignacion && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Estado de Asignación
                    </Typography>
                    <Box>
                      <Chip
                        label={equipo.estadoAsignacion}
                        color={
                          equipo.estadoAsignacion === 'ENTREGADO' ? 'success' :
                          equipo.estadoAsignacion === 'FACTURADO' ? 'primary' :
                          equipo.estadoAsignacion === 'RESERVADO' ? 'warning' :
                          'default'
                        }
                        size="small"
                      />
                    </Box>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de Fabricación
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {equipo.recetaNombre && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Receta Base
                    </Typography>
                    <Typography variant="body1">
                      {equipo.recetaNombre} ({equipo.recetaCodigo})
                    </Typography>
                  </Box>
                )}
                {equipo.responsableNombre && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Responsable
                    </Typography>
                    <Typography variant="body1">{equipo.responsableNombre}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1">
                    {dayjs(equipo.fechaCreacion).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                </Box>
                {equipo.fechaFinalizacion && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Fecha de Finalización
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(equipo.fechaFinalizacion).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Box>
                )}
                {equipo.observaciones && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Observaciones
                    </Typography>
                    <Typography variant="body2">{equipo.observaciones}</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {equipo.clienteNombre && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cliente Asignado
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" fontWeight="500">
                  {equipo.clienteNombre}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Historial de Estados */}
        {equipo.estadoAsignacion && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <History color="primary" />
                  <Typography variant="h6">
                    Historial de Estados de Asignación
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                {loadingHistorial ? (
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={30} />
                  </Box>
                ) : historial.length === 0 ? (
                  <Alert severity="info">
                    No hay cambios de estado registrados para este equipo.
                  </Alert>
                ) : (
                  <Timeline position="right">
                    {historial.map((item, index) => (
                      <TimelineItem key={item.id}>
                        <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                          <Typography variant="body2" fontWeight="500">
                            {dayjs(item.fechaCambio).format('DD/MM/YYYY')}
                          </Typography>
                          <Typography variant="caption">
                            {dayjs(item.fechaCambio).format('HH:mm')}
                          </Typography>
                        </TimelineOppositeContent>
                        
                        <TimelineSeparator>
                          <TimelineDot 
                            color={
                              item.estadoNuevo === 'ENTREGADO' ? 'success' :
                              item.estadoNuevo === 'FACTURADO' ? 'primary' :
                              item.estadoNuevo === 'RESERVADO' ? 'warning' :
                              'grey'
                            }
                          />
                          {index < historial.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        
                        <TimelineContent sx={{ py: '12px', px: 2 }}>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                              {item.estadoAnterior && (
                                <>
                                  <Chip
                                    label={item.estadoAnterior}
                                    size="small"
                                    color="default"
                                  />
                                  <Typography variant="body2">→</Typography>
                                </>
                              )}
                              <Chip
                                label={item.estadoNuevo}
                                size="small"
                                color={
                                  item.estadoNuevo === 'ENTREGADO' ? 'success' :
                                  item.estadoNuevo === 'FACTURADO' ? 'primary' :
                                  item.estadoNuevo === 'RESERVADO' ? 'warning' :
                                  'default'
                                }
                              />
                            </Box>
                            {item.usuarioNombre && (
                              <Typography variant="body2" color="text.secondary">
                                Usuario: <strong>{item.usuarioNombre}</strong>
                              </Typography>
                            )}
                            {item.tipoDocumento && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Documento: {item.tipoDocumento}
                                {item.documentoId && ` #${item.documentoId}`}
                              </Typography>
                            )}
                            {item.observaciones && (
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {item.observaciones}
                              </Typography>
                            )}
                          </Box>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Cliente</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clientes}
            getOptionLabel={(option) => option.nombre || ''}
            value={selectedCliente}
            onChange={(_, newValue) => setSelectedCliente(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Cliente *" required sx={{ mt: 2 }} />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAsignar}>
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog
        open={unassignDialog}
        onClose={() => setUnassignDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'visible',
          },
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {/* Warning Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.warning.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LinkOff sx={{ fontSize: 50, color: 'warning.main' }} />
            </Box>

            {/* Title */}
            <Typography variant="h5" fontWeight="600" gutterBottom>
              Desasignar Equipo
            </Typography>

            {/* Message */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              ¿Está seguro de que desea desasignar este equipo del cliente?
            </Typography>

            {/* Equipment Details */}
            {equipo && (
              <Paper
                variant="outlined"
                sx={{
                  width: '100%',
                  p: 2,
                  bgcolor: (theme) => theme.palette.warning.main + '08',
                  borderColor: (theme) => theme.palette.warning.main + '30',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Número:
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {equipo.numeroHeladera}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Modelo:
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {equipo.modelo}
                  </Typography>
                </Box>
                {equipo.clienteNombre && (
                  <>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                      <Typography variant="body2" color="text.secondary">
                        Cliente Actual:
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {equipo.clienteNombre}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={() => setUnassignDialog(false)}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDesasignar}
            color="warning"
            variant="contained"
            startIcon={<LinkOff />}
            size="large"
            sx={{ minWidth: 120 }}
          >
            Desasignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unassign Error Dialog */}
      <Dialog
        open={unassignErrorDialog.open}
        onClose={() => setUnassignErrorDialog({ open: false, errorMessage: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {/* Error Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.error.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Cancel sx={{ fontSize: 50, color: 'error.main' }} />
            </Box>

            {/* Title */}
            <Typography variant="h5" fontWeight="600" gutterBottom color="error">
              No se puede desasignar
            </Typography>

            {/* Error Message */}
            <Alert severity="error" sx={{ width: '100%', mt: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {unassignErrorDialog.errorMessage}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setUnassignErrorDialog({ open: false, errorMessage: '' })}
            variant="contained"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Confirmation Dialog */}
      <Dialog
        open={deliveryDialog}
        onClose={() => setDeliveryDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {/* Success Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.success.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <CheckCircle sx={{ fontSize: 50, color: 'success.main' }} />
            </Box>

            {/* Title */}
            <Typography variant="h5" fontWeight="600" gutterBottom>
              ¿Marcar como ENTREGADO?
            </Typography>

            {/* Description */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Está a punto de marcar el equipo como entregado al cliente
            </Typography>

            {equipo && (
              <Paper
                elevation={0}
                sx={{
                  bgcolor: (theme) => theme.palette.grey[50],
                  p: 2,
                  width: '100%',
                  borderRadius: 2,
                }}
              >
                <>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Equipo:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {equipo.numeroHeladera}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Modelo:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {equipo.modelo}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Cliente:
                    </Typography>
                    <Typography variant="body2" fontWeight="600">
                      {equipo.clienteNombre || 'No asignado'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                    <Typography variant="caption" color="warning.dark" sx={{ display: 'block', fontWeight: 600 }}>
                      ⚠️ Acción Irreversible
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Una vez marcado como ENTREGADO, el equipo no podrá ser desasignado ni modificado.
                      La entrega cierra el contrato definitivamente.
                    </Typography>
                  </Box>
                </>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={() => setDeliveryDialog(false)}
            variant="outlined"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMarcarEntregado}
            color="success"
            variant="contained"
            startIcon={<CheckCircle />}
            size="large"
            sx={{ minWidth: 120 }}
          >
            Confirmar Entrega
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Error Dialog */}
      <Dialog
        open={deliveryErrorDialog.open}
        onClose={() => setDeliveryErrorDialog({ open: false, errorMessage: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            {/* Error Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.error.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Cancel sx={{ fontSize: 50, color: 'error.main' }} />
            </Box>

            {/* Title */}
            <Typography variant="h5" fontWeight="600" gutterBottom color="error">
              Error al marcar como entregado
            </Typography>

            {/* Error Message */}
            <Alert severity="error" sx={{ width: '100%', mt: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {deliveryErrorDialog.errorMessage}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            onClick={() => setDeliveryErrorDialog({ open: false, errorMessage: '' })}
            variant="contained"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change State Dialog */}
      <Dialog
        open={changeStateDialog}
        onClose={() => setChangeStateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cambiar Estado de Asignación</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Estado actual: <strong>{equipo?.estadoAsignacion}</strong>
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Cambiar el estado manualmente puede afectar el flujo normal del sistema.
              </Typography>
            </Alert>
            
            <TextField
              select
              fullWidth
              label="Nuevo Estado"
              value={newState || ''}
              onChange={(e) => setNewState(e.target.value as any)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Seleccione un estado</option>
              <option value="DISPONIBLE">DISPONIBLE</option>
              <option value="RESERVADO">RESERVADO</option>
              <option value="FACTURADO">FACTURADO</option>
              <option value="ENTREGADO">ENTREGADO</option>
            </TextField>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Flujo normal de estados:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                DISPONIBLE → RESERVADO → FACTURADO → ENTREGADO
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setChangeStateDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleChangeState}
            variant="contained"
            disabled={!newState || newState === equipo?.estadoAsignacion}
            color="primary"
          >
            Cambiar Estado
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EquipoDetail;
