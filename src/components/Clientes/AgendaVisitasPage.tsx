 
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
 
import LoadingOverlay from '../common/LoadingOverlay';
 
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
/* eslint-disable react-hooks/exhaustive-deps */
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
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
 

 
  return (
 
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <LoadingOverlay open={loading} message="Cargando agenda..." />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Header */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Typography variant="h4" component="h1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Agenda de Visitas
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Button
 
            variant="contained"
 
            startIcon={<AddIcon />}
 
            onClick={() => handleOpenDialog()}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Nueva Visita
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {error && (
 
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {error}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Summary Cards */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card sx={{ minWidth: 200 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box display="flex" alignItems="center" gap={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TodayIcon color="primary" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="h6" color="primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {visitasHoy.length}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Visitas Hoy
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card sx={{ minWidth: 200 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box display="flex" alignItems="center" gap={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <ScheduleIcon color="warning" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="h6" color="warning.main">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {visitasPendientes.length}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Pendientes
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Filters */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Paper sx={{ p: 2, mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <DatePicker
 
              label="Fecha"
 
              value={selectedDate}
 
              onChange={(newValue) => setSelectedDate(newValue as Dayjs | null)}
 
              slotProps={{ textField: { size: 'small' } }}
 
            />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <TextField
 
              select
 
              size="small"
 
              label="Estado"
 
              value={filterEstado}
 
              onChange={(e) => setFilterEstado(e.target.value)}
 
              sx={{ minWidth: 150 }}
 
            >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <MenuItem value="">Todos</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <MenuItem value="PROGRAMADA">Programada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <MenuItem value="COMPLETADA">Completada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <MenuItem value="CANCELADA">Cancelada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <MenuItem value="REPROGRAMADA">Reprogramada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </TextField>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Button
 
              variant="outlined"
 
              startIcon={<FilterIcon />}
 
              onClick={() => {
 
                setSelectedDate(null);
 
                setFilterEstado('');
 
              }}
 
            >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Limpiar Filtros
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Paper>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Visits List */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Paper>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <List>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {filteredVisitas.length === 0 ? (
 
              <ListItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box textAlign="center" width="100%" py={4}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <EventIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="h6" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    No hay visitas programadas
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {selectedDate || filterEstado 
 
                      ? 'No se encontraron visitas con los filtros aplicados'
 
                      : 'Comienza programando tu primera visita'
 
                    }
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </ListItem>
 
            ) : (
 
              filteredVisitas.map((visita, index) => (
 
                <React.Fragment key={visita.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <ListItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <PersonIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Avatar>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <ListItemText
 
                      primary={
 
                        <Box display="flex" alignItems="center" gap={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="subtitle1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            {visita.cliente?.nombre || 'Cliente no encontrado'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Chip
 
                            label={visita.estado}
 
                            color={getEstadoColor(visita.estado)}
 
                            size="small"
 
                          />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
 
                      }
 
                      secondary={
 
                        <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <strong>Fecha:</strong> {dayjs(visita.fecha).format('DD/MM/YYYY')} a las {visita.hora}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <strong>Motivo:</strong> {visita.motivo}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {visita.observaciones && (
 
                            <Typography variant="body2" color="text.secondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <strong>Observaciones:</strong> {visita.observaciones}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Typography>
 
                          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
 
                      }
 
                    />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <ListItemSecondaryAction>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <IconButton onClick={() => handleOpenDialog(visita)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <EditIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <IconButton onClick={() => handleDeleteClick(visita.id)} color="error">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <DeleteIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </ListItemSecondaryAction>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </ListItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {index < filteredVisitas.length - 1 && <Divider />}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </React.Fragment>
 
              ))
 
            )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </List>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Paper>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <form onSubmit={handleSubmit}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {editingVisita ? 'Editar Visita' : 'Nueva Visita'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box display="flex" flexDirection="column" gap={2} pt={1}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TextField
 
                  select
 
                  fullWidth
 
                  label="Cliente"
 
                  value={formData.clienteId}
 
                  onChange={handleInputChange('clienteId')}
 
                  required
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {clientes.map((cliente) => (
 
                    <MenuItem key={cliente.id} value={cliente.id.toString()}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {cliente.nombre} {cliente.apellido && `${cliente.apellido}`}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </MenuItem>
 
                  ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </TextField>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box display="flex" gap={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TextField
 
                    type="date"
 
                    label="Fecha"
 
                    value={formData.fecha}
 
                    onChange={handleInputChange('fecha')}
 
                    required
 
                    InputLabelProps={{ shrink: true }}
 
                    sx={{ flex: 1 }}
 
                  />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TextField
 
                    type="time"
 
                    label="Hora"
 
                    value={formData.hora}
 
                    onChange={handleInputChange('hora')}
 
                    required
 
                    InputLabelProps={{ shrink: true }}
 
                    sx={{ flex: 1 }}
 
                  />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TextField
 
                  fullWidth
 
                  label="Motivo"
 
                  value={formData.motivo}
 
                  onChange={handleInputChange('motivo')}
 
                  required
 
                  placeholder="Describa el motivo de la visita..."
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TextField
 
                  select
 
                  fullWidth
 
                  label="Estado"
 
                  value={formData.estado}
 
                  onChange={handleInputChange('estado')}
 
                  required
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="PROGRAMADA">Programada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="COMPLETADA">Completada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="REPROGRAMADA">Reprogramada</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </TextField>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TextField
 
                  fullWidth
 
                  multiline
 
                  rows={3}
 
                  label="Observaciones (opcional)"
 
                  value={formData.observaciones}
 
                  onChange={handleInputChange('observaciones')}
 
                  placeholder="Notas adicionales sobre la visita..."
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Button onClick={handleCloseDialog}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Button type="submit" variant="contained">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {editingVisita ? 'Actualizar' : 'Programar Visita'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </form>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Confirm Delete Dialog */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <DialogTitle>Eliminar visita</DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography>¿Está seguro de que desea eliminar esta visita? Esta acción no se puede deshacer.</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Button onClick={handleCancelDelete}>Cancelar</Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Eliminar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Floating Action Button */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Fab
 
          color="primary"
 
          aria-label="add"
 
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
 
          onClick={() => handleOpenDialog()}
 
        >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <AddIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Fab>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    </LocalizationProvider>
 
  );
 
};
 

 
export default AgendaVisitasPage;
