import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent, Chip, IconButton,
  Stack, Alert, Snackbar, CircularProgress, Grid, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, Autocomplete, TextField,
} from '@mui/material';
import {
  ArrowBack, Edit, CheckCircle, Cancel, Link, LinkOff,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  equipoFabricadoApi,
} from '../../api/services/equipoFabricadoApi';
import api from '../../api/config';
import type { EquipoFabricadoDTO } from '../../types';
import { employeeApi } from '../../api/services/employeeApi';


const EquipoDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [equipo, setEquipo] = useState<EquipoFabricadoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [assignDialog, setAssignDialog] = useState(false);

  const [unassignDialog, setUnassignDialog] = useState(false);
  const [unassignErrorDialog, setUnassignErrorDialog] = useState<{
    open: boolean;
    errorMessage: string;
  }>({ open: false, errorMessage: '' });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      loadEquipo();
      loadClientes();
    }
  }, [id]);

  const loadEquipo = async () => {
    try {
      setLoading(true);
      const data = await equipoFabricadoApi.findById(Number(id));
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
    EN_PROCESO: 'info',
    COMPLETADO: 'success',
    CANCELADO: 'error',
  }[equipo.estado] as 'info' | 'success' | 'error';

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
          {equipo.asignado && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LinkOff />}
              onClick={() => setUnassignDialog(true)}
            >
              Desasignar
            </Button>
          )}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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
