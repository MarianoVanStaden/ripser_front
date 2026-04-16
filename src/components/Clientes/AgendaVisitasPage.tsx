import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  Event as EventIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import type { Cliente } from '../../types';

dayjs.locale('es');

interface VisitaAgenda {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'REPROGRAMADA';
  observaciones?: string;
  usuarioId?: number;
  fechaCreacion: string;
}

const AgendaVisitasPage: React.FC = () => {
  const [visitas, setVisitas] = useState<VisitaAgenda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState<VisitaAgenda | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [formData, setFormData] = useState<{
    clienteId: string;
    fecha: string;
    hora: string;
    motivo: string;
    estado: 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA' | 'REPROGRAMADA';
    observaciones: string;
  }>({
    clienteId: '',
    fecha: dayjs().format('YYYY-MM-DD'),
    hora: '09:00',
    motivo: '',
    estado: 'PROGRAMADA',
    observaciones: '',
  });

  // Mock data for demonstration
  const mockVisitas: VisitaAgenda[] = [
    {
      id: 1,
      clienteId: 1,
      fecha: dayjs().format('YYYY-MM-DD'),
      hora: '09:00',
      motivo: 'Presentación de nuevos productos',
      estado: 'PROGRAMADA',
      observaciones: 'Llevar catálogo actualizado',
      fechaCreacion: dayjs().subtract(2, 'day').toISOString(),
    },
    {
      id: 2,
      clienteId: 2,
      fecha: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      hora: '14:00',
      motivo: 'Seguimiento de pedido',
      estado: 'PROGRAMADA',
      observaciones: 'Revisar estado de entrega',
      fechaCreacion: dayjs().subtract(1, 'day').toISOString(),
    },
    {
      id: 3,
      clienteId: 3,
      fecha: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
      hora: '11:00',
      motivo: 'Gestión de cobranza',
      estado: 'COMPLETADA',
      observaciones: 'Cliente acordó plan de pagos',
      fechaCreacion: dayjs().subtract(3, 'day').toISOString(),
    },
    {
      id: 4,
      clienteId: 1,
      fecha: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      hora: '16:00',
      motivo: 'Renovación de contrato',
      estado: 'PROGRAMADA',
      fechaCreacion: dayjs().toISOString(),
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientesData] = await Promise.all([
        clienteApi.getAll({ page: 0, size: 500 }).then(res => res.content),
      ]);

      setClientes(clientesData);
      
      // Load visits with client data
      const visitasWithClients = mockVisitas.map(visita => ({
        ...visita,
        cliente: clientesData.find(c => c.id === visita.clienteId)
      }));
      
      setVisitas(visitasWithClients);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (visita?: VisitaAgenda) => {
    if (visita) {
      setEditingVisita(visita);
      setFormData({
        clienteId: visita.clienteId.toString(),
        fecha: visita.fecha,
        hora: visita.hora,
        motivo: visita.motivo,
        estado: visita.estado,
        observaciones: visita.observaciones || '',
      });
    } else {
      setEditingVisita(null);
      setFormData({
        clienteId: '',
        fecha: selectedDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
        hora: '09:00',
        motivo: '',
        estado: 'PROGRAMADA',
        observaciones: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVisita(null);
    setError(null);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.clienteId || !formData.motivo.trim()) {
      setError('Cliente y motivo son obligatorios');
      return;
    }

    try {
      const visitaData = {
        ...formData,
        clienteId: Number(formData.clienteId),
        id: editingVisita?.id || Math.max(...visitas.map(v => v.id)) + 1,
        fechaCreacion: editingVisita?.fechaCreacion || new Date().toISOString(),
      };

      if (editingVisita) {
        // Update existing visit
        setVisitas(prev => prev.map(v => 
          v.id === editingVisita.id 
            ? { ...visitaData, cliente: clientes.find(c => c.id === visitaData.clienteId) }
            : v
        ));
      } else {
        // Create new visit
        const newVisita: VisitaAgenda = {
          ...visitaData,
          cliente: clientes.find(c => c.id === visitaData.clienteId)
        };
        setVisitas(prev => [...prev, newVisita]);
      }
      
      handleCloseDialog();
    } catch (err: any) {
      setError('Error al guardar la visita');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteTargetId(id);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTargetId !== null) {
      setVisitas(prev => prev.filter(v => v.id !== deleteTargetId));
    }
    setConfirmDeleteOpen(false);
    setDeleteTargetId(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setDeleteTargetId(null);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PROGRAMADA':
        return 'primary';
      case 'COMPLETADA':
        return 'success';
      case 'CANCELADA':
        return 'error';
      case 'REPROGRAMADA':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredVisitas = visitas.filter(visita => {
    const matchesDate = !selectedDate || visita.fecha === selectedDate.format('YYYY-MM-DD');
    const matchesEstado = !filterEstado || visita.estado === filterEstado;
    return matchesDate && matchesEstado;
  });

  const visitasHoy = visitas.filter(v => v.fecha === dayjs().format('YYYY-MM-DD'));
  const visitasPendientes = visitas.filter(v => v.estado === 'PROGRAMADA' && dayjs(v.fecha).isAfter(dayjs().subtract(1, 'day')));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Agenda de Visitas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nueva Visita
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TodayIcon color="primary" />
                <Box>
                  <Typography variant="h6" color="primary">
                    {visitasHoy.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visitas Hoy
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ minWidth: 200 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon color="warning" />
                <Box>
                  <Typography variant="h6" color="warning.main">
                    {visitasPendientes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <DatePicker
              label="Fecha"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue as Dayjs | null)}
              slotProps={{ textField: { size: 'small' } }}
            />
            
            <TextField
              select
              size="small"
              label="Estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PROGRAMADA">Programada</MenuItem>
              <MenuItem value="COMPLETADA">Completada</MenuItem>
              <MenuItem value="CANCELADA">Cancelada</MenuItem>
              <MenuItem value="REPROGRAMADA">Reprogramada</MenuItem>
            </TextField>

            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSelectedDate(null);
                setFilterEstado('');
              }}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </Paper>

        {/* Visits List */}
        <Paper>
          <List>
            {filteredVisitas.length === 0 ? (
              <ListItem>
                <Box textAlign="center" width="100%" py={4}>
                  <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay visitas programadas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDate || filterEstado 
                      ? 'No se encontraron visitas con los filtros aplicados'
                      : 'Comienza programando tu primera visita'
                    }
                  </Typography>
                </Box>
              </ListItem>
            ) : (
              filteredVisitas.map((visita, index) => (
                <React.Fragment key={visita.id}>
                  <ListItem>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {visita.cliente?.nombre || 'Cliente no encontrado'}
                          </Typography>
                          <Chip
                            label={visita.estado}
                            color={getEstadoColor(visita.estado)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Fecha:</strong> {dayjs(visita.fecha).format('DD/MM/YYYY')} a las {visita.hora}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Motivo:</strong> {visita.motivo}
                          </Typography>
                          {visita.observaciones && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Observaciones:</strong> {visita.observaciones}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleOpenDialog(visita)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteClick(visita.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredVisitas.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>

        {/* Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingVisita ? 'Editar Visita' : 'Nueva Visita'}
            </DialogTitle>
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={2} pt={1}>
                <TextField
                  select
                  fullWidth
                  label="Cliente"
                  value={formData.clienteId}
                  onChange={handleInputChange('clienteId')}
                  required
                >
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre} {cliente.apellido && `${cliente.apellido}`}
                    </MenuItem>
                  ))}
                </TextField>
                
                <Box display="flex" gap={2}>
                  <TextField
                    type="date"
                    label="Fecha"
                    value={formData.fecha}
                    onChange={handleInputChange('fecha')}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="time"
                    label="Hora"
                    value={formData.hora}
                    onChange={handleInputChange('hora')}
                    required
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                  />
                </Box>
                
                <TextField
                  fullWidth
                  label="Motivo"
                  value={formData.motivo}
                  onChange={handleInputChange('motivo')}
                  required
                  placeholder="Describa el motivo de la visita..."
                />
                
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.estado}
                  onChange={handleInputChange('estado')}
                  required
                >
                  <MenuItem value="PROGRAMADA">Programada</MenuItem>
                  <MenuItem value="COMPLETADA">Completada</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  <MenuItem value="REPROGRAMADA">Reprogramada</MenuItem>
                </TextField>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observaciones (opcional)"
                  value={formData.observaciones}
                  onChange={handleInputChange('observaciones')}
                  placeholder="Notas adicionales sobre la visita..."
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained">
                {editingVisita ? 'Actualizar' : 'Programar Visita'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
          <DialogTitle>Eliminar visita</DialogTitle>
          <DialogContent>
            <Typography>¿Está seguro de que desea eliminar esta visita? Esta acción no se puede deshacer.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Fab>
      </Box>
    </LocalizationProvider>
  );
};

export default AgendaVisitasPage;
