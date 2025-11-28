import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Chip, IconButton,
  Tooltip, Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Stack, Autocomplete, Card, CardContent,
  Grid, Tabs, Tab, Divider, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Visibility, Edit, Delete, CheckCircle, Cancel, Link, LinkOff,
  Inventory, Assignment, LocalShipping, Build, Done, TrendingUp, ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  equipoFabricadoApi,

} from '../../api/services/equipoFabricadoApi';
import type { TipoEquipo, EstadoFabricacion, EquipoFabricadoListDTO, EstadoAsignacionEquipo } from '../../types';
import api from '../../api/config';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Helper function to get color for estadoAsignacion
const getEstadoAsignacionColor = (estado: EstadoAsignacionEquipo | null | undefined): 'default' | 'warning' | 'info' | 'secondary' | 'success' => {
  if (!estado) return 'default';
  const colorMap: Record<EstadoAsignacionEquipo, 'default' | 'warning' | 'info' | 'secondary' | 'success'> = {
    DISPONIBLE: 'default',
    RESERVADO: 'warning',
    FACTURADO: 'info',
    EN_TRANSITO: 'secondary',
    ENTREGADO: 'success',
  };
  return colorMap[estado] || 'default';
};

const getEstadoAsignacionLabel = (estado: EstadoAsignacionEquipo | null | undefined): string => {
  if (!estado) return 'No especificado';
  const labelMap: Record<EstadoAsignacionEquipo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    FACTURADO: 'Facturado',
    EN_TRANSITO: 'En Tránsito',
    ENTREGADO: 'Entregado',
  };
  return labelMap[estado] || estado;
};

const EquiposList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [equipos, setEquipos] = useState<EquipoFabricadoListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10000); // Load all equipos for client-side filtering
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [tipoFilter, setTipoFilter] = useState<TipoEquipo | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFabricacion | ''>('');
  const [estadoAsignacionFilter, setEstadoAsignacionFilter] = useState<EstadoAsignacionEquipo | ''>('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    equipoId: number | null;
    equipo: EquipoFabricadoListDTO | null;
  }>({ open: false, equipoId: null, equipo: null });

  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    equipoId: number | null;
    equipo: EquipoFabricadoListDTO | null;
  }>({ open: false, equipoId: null, equipo: null });

  const [completarDialog, setCompletarDialog] = useState<{
    open: boolean;
    equipoId: number | null;
    equipo: EquipoFabricadoListDTO | null;
  }>({ open: false, equipoId: null, equipo: null });

  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    equipoId: number | null;
  }>({ open: false, equipoId: null });

  const [unassignDialog, setUnassignDialog] = useState<{
    open: boolean;
    equipoId: number | null;
    equipo: EquipoFabricadoListDTO | null;
  }>({ open: false, equipoId: null, equipo: null });

  const [unassignErrorDialog, setUnassignErrorDialog] = useState<{
    open: boolean;
    errorMessage: string;
  }>({ open: false, errorMessage: '' });

  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Calculate metrics from all equipos (not just current page)
  const metrics = useMemo(() => {
    return {
      total: equipos.length,
      asignados: equipos.filter(e => e.asignado).length,
      noAsignados: equipos.filter(e => !e.asignado).length,
      enProceso: equipos.filter(e => e.estado === 'EN_PROCESO').length,
      completados: equipos.filter(e => e.estado === 'COMPLETADO').length,
      cancelados: equipos.filter(e => e.estado === 'CANCELADO').length,
      // Entregados = completados y asignados
      entregados: equipos.filter(e => e.estado === 'COMPLETADO' && e.asignado).length,
      // En tránsito = completados pero aún no asignados (listos para entrega)
      enTransito: equipos.filter(e => e.estado === 'COMPLETADO' && !e.asignado).length,
      // Stock disponible = completados y no asignados
      disponibles: equipos.filter(e => e.estado === 'COMPLETADO' && !e.asignado).length,
    };
  }, [equipos]);

  // Group equipos by tipo and sort by fechaCreacion DESC (newest first)
  const equiposPorTipo = useMemo(() => {
    const grupos: Record<TipoEquipo, EquipoFabricadoListDTO[]> = {
      HELADERA: [],
      COOLBOX: [],
      EXHIBIDOR: [],
      OTRO: [],
    };

    equipos.forEach(equipo => {
      if (equipo.tipo && grupos[equipo.tipo]) {
        grupos[equipo.tipo].push(equipo);
      }
    });

    // Sort each group by fechaCreacion DESC (newest first)
    Object.keys(grupos).forEach((tipo) => {
      grupos[tipo as TipoEquipo].sort((a, b) => {
        const dateA = new Date(a.fechaCreacion).getTime();
        const dateB = new Date(b.fechaCreacion).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
    });

    return grupos;
  }, [equipos]);

  // Reload equipos when navigating back to this page
  useEffect(() => {
    loadEquipos();
  }, [page, pageSize, tipoFilter, estadoFilter, estadoAsignacionFilter, location.key]);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadEquipos = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading equipos - Page:', page, 'PageSize:', pageSize);
      const response = await equipoFabricadoApi.findAll(page, pageSize);
      console.log('📥 API Response:', response);
      console.log('📊 Total elements in DB:', response.totalElements);
      console.log('📄 Total pages:', response.totalPages);
      console.log('🔢 Current page content:', response.content?.length, 'items');
      
      let filtered = response.content || [];

      if (tipoFilter) {
        console.log('🔍 Filtering by tipo:', tipoFilter);
        filtered = filtered.filter((e: EquipoFabricadoListDTO) => e.tipo === tipoFilter);
      }
      if (estadoFilter) {
        console.log('🔍 Filtering by estado:', estadoFilter);
        filtered = filtered.filter((e: EquipoFabricadoListDTO) => e.estado === estadoFilter);
      }
      if (estadoAsignacionFilter) {
        console.log('🔍 Filtering by estadoAsignacion:', estadoAsignacionFilter);
        filtered = filtered.filter((e: EquipoFabricadoListDTO) => {
          // If backend provides estadoAsignacion, use it
          if (e.estadoAsignacion) {
            return e.estadoAsignacion === estadoAsignacionFilter;
          }
          // Otherwise, infer it
          if (e.estado === 'COMPLETADO') {
            const inferredEstado = e.asignado ? 'ENTREGADO' : 'DISPONIBLE';
            return inferredEstado === estadoAsignacionFilter;
          }
          return false;
        });
      }

      console.log('📋 Filtered equipos:', filtered.length, 'items');
      console.log('📋 First 3 equipos:', filtered.slice(0, 3));
      setEquipos(filtered);
      setTotalElements(response.totalElements || filtered.length);
    } catch (error) {
      console.error('Error loading equipos:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los equipos',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await api.get('/api/clientes');
      const clientesData = response.data.content || response.data || [];
      console.log('EquiposList - Loaded clientes:', clientesData);
      console.log('EquiposList - Response structure:', response.data);
      setClientes(clientesData);
    } catch (error) {
      console.error('Error loading clientes:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los clientes',
        severity: 'error',
      });
    }
  };

  const handleCompletar = async () => {
    if (!completarDialog.equipoId) return;

    try {
      await equipoFabricadoApi.completarFabricacion(completarDialog.equipoId);
      setSnackbar({
        open: true,
        message: 'Equipo completado correctamente',
        severity: 'success',
      });
      setCompletarDialog({ open: false, equipoId: null, equipo: null });
      loadEquipos();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al completar el equipo',
        severity: 'error',
      });
    }
  };

  const handleCancelar = async () => {
    if (!cancelDialog.equipoId) return;

    try {
      await equipoFabricadoApi.cancelarFabricacion(cancelDialog.equipoId);
      setSnackbar({
        open: true,
        message: 'Equipo cancelado correctamente',
        severity: 'success',
      });
      setCancelDialog({ open: false, equipoId: null, equipo: null });
      loadEquipos();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al cancelar el equipo',
        severity: 'error',
      });
    }
  };

  const handleAsignar = async () => {
    if (!assignDialog.equipoId || !selectedCliente) return;

    try {
      await equipoFabricadoApi.asignarEquipo(assignDialog.equipoId, selectedCliente.id);
      setSnackbar({
        open: true,
        message: 'Equipo asignado correctamente',
        severity: 'success',
      });
      setAssignDialog({ open: false, equipoId: null });
      setSelectedCliente(null);
      loadEquipos();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al asignar el equipo',
        severity: 'error',
      });
    }
  };

  const handleDesasignar = async () => {
    if (!unassignDialog.equipoId) return;

    try {
      await equipoFabricadoApi.desasignarEquipo(unassignDialog.equipoId);
      setSnackbar({
        open: true,
        message: 'Equipo desasignado correctamente',
        severity: 'success',
      });
      setUnassignDialog({ open: false, equipoId: null, equipo: null });
      loadEquipos();
    } catch (error: any) {
      // Close confirmation dialog
      setUnassignDialog({ open: false, equipoId: null, equipo: null });

      // Show error dialog with backend message
      const errorMessage = error.response?.data?.message ||
                          error.response?.data ||
                          error.message ||
                          'Error desconocido al desasignar el equipo';
      setUnassignErrorDialog({
        open: true,
        errorMessage: errorMessage,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.equipoId) return;

    try {
      await equipoFabricadoApi.delete(deleteDialog.equipoId);
      setSnackbar({
        open: true,
        message: 'Equipo eliminado correctamente',
        severity: 'success',
      });
      setDeleteDialog({ open: false, equipoId: null, equipo: null });
      loadEquipos();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al eliminar el equipo',
        severity: 'error',
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'numeroHeladera',
      headerName: 'Número',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="500">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'modelo',
      headerName: 'Modelo',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'medida',
      headerName: 'Medida',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'color',
      headerName: 'Color',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value ? params.value.replace(/_/g, ' ') : '-'}
        </Typography>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado Fab.',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const colorMap: Record<EstadoFabricacion, 'info' | 'success' | 'error'> = {
          EN_PROCESO: 'info',
          COMPLETADO: 'success',
          CANCELADO: 'error',
        };
        return (
          <Chip
            label={params.value.replace('_', ' ')}
            color={colorMap[params.value as EstadoFabricacion] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'estadoAsignacion',
      headerName: 'Estado Asig.',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const estadoAsignacion = params.value as EstadoAsignacionEquipo | null;

        // Infer estado if not provided by backend
        let inferredEstado = estadoAsignacion;
        if (!inferredEstado && params.row.estado === 'COMPLETADO') {
          inferredEstado = params.row.asignado ? 'ENTREGADO' : 'DISPONIBLE';
        }

        return (
          <Chip
            label={getEstadoAsignacionLabel(inferredEstado)}
            color={getEstadoAsignacionColor(inferredEstado)}
            size="small"
          />
        );
      },
    },
    {
      field: 'asignado',
      headerName: 'Asig.',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label="Sí" color="success" size="small" />
        ) : (
          <Chip label="No" color="default" size="small" />
        ),
    },
    {
      field: 'clienteNombre',
      headerName: 'Cliente',
      width: 130,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'responsableNombre',
      headerName: 'Responsable',
      width: 130,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'fechaCreacion',
      headerName: 'Fecha',
      width: 90,
      renderCell: (params: GridRenderCellParams) =>
        dayjs(params.value).format('DD/MM/YY'),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 220,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        // Get estadoAsignacion (or infer it)
        let estadoAsignacion = params.row.estadoAsignacion as EstadoAsignacionEquipo | null;
        if (!estadoAsignacion && params.row.estado === 'COMPLETADO') {
          estadoAsignacion = params.row.asignado ? 'ENTREGADO' : 'DISPONIBLE';
        }
        
        // Validations based on estadoAsignacion
        const isReservadoOrHigher = estadoAsignacion && ['RESERVADO', 'FACTURADO', 'EN_TRANSITO', 'ENTREGADO'].includes(estadoAsignacion);
        const isFacturadoOrHigher = estadoAsignacion && ['FACTURADO', 'EN_TRANSITO', 'ENTREGADO'].includes(estadoAsignacion);
        const canEdit = !isReservadoOrHigher;
        const canDelete = !isReservadoOrHigher;
        const canAssign = params.row.estado === 'COMPLETADO' && !params.row.asignado && estadoAsignacion === 'DISPONIBLE';
        const canUnassign = params.row.asignado && !isFacturadoOrHigher;
        
        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Ver detalle">
              <IconButton
                size="small"
                color="info"
                onClick={() => navigate(`/fabricacion/equipos/${params.row.id}`)}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={canEdit ? "Editar" : `No se puede editar (Estado: ${getEstadoAsignacionLabel(estadoAsignacion)})`}>
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={!canEdit}
                  onClick={() => navigate(`/fabricacion/equipos/editar/${params.row.id}`)}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {params.row.estado === 'EN_PROCESO' && (
              <Tooltip title="Completar">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => setCompletarDialog({ 
                    open: true, 
                    equipoId: params.row.id,
                    equipo: params.row 
                  })}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {params.row.estado !== 'CANCELADO' && (
              <Tooltip title="Cancelar">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => setCancelDialog({ 
                    open: true, 
                    equipoId: params.row.id,
                    equipo: params.row 
                  })}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!params.row.asignado && (
              <Tooltip title={canAssign ? "Asignar Cliente" : `No se puede asignar (Estado: ${getEstadoAsignacionLabel(estadoAsignacion)})`}>
                <span>
                  <IconButton
                    size="small"
                    color="success"
                    disabled={!canAssign}
                    onClick={() => setAssignDialog({ open: true, equipoId: params.row.id })}
                  >
                    <Link fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {params.row.asignado && (
              <Tooltip title={canUnassign ? "Desasignar Cliente" : `No se puede desasignar (Estado: ${getEstadoAsignacionLabel(estadoAsignacion)})`}>
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    disabled={!canUnassign}
                    onClick={() => setUnassignDialog({
                      open: true,
                      equipoId: params.row.id,
                      equipo: params.row
                    })}
                  >
                    <LinkOff fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title={canDelete ? "Eliminar" : `No se puede eliminar (Estado: ${getEstadoAsignacionLabel(estadoAsignacion)})`}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!canDelete}
                  onClick={() => setDeleteDialog({ 
                    open: true, 
                    equipoId: params.row.id,
                    equipo: params.row 
                  })}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  // Chart colors
  const COLORS = {
    primary: '#1976d2',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
    grey: '#757575',
  };

  return (
    <Box p={3}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="600">
            Gestión de Equipos Fabricados
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                loadEquipos();
              }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/fabricacion/equipos/nuevo')}
            >
              Nuevo Equipo
            </Button>
          </Stack>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'primary.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.main', color: 'white' }}>
                    <Inventory fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {totalElements}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Equipos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'success.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.main', color: 'white' }}>
                    <Done fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {metrics.disponibles}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock Disponible
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'info.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.main', color: 'white' }}>
                    <Build fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {metrics.enProceso}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      En Proceso
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'warning.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.main', color: 'white' }}>
                    <Assignment fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {metrics.asignados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Asignados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'success.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.dark', color: 'white' }}>
                    <LocalShipping fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="success.dark">
                      {metrics.entregados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entregados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'grey.100' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.600', color: 'white' }}>
                    <Inventory fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="grey.700">
                      {metrics.noAsignados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No Asignados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'success.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.main', color: 'white' }}>
                    <CheckCircle fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {metrics.completados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'error.lighter' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.main', color: 'white' }}>
                    <Cancel fontSize="large" />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main">
                      {metrics.cancelados}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cancelados
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Lista de Equipos" icon={<Inventory />} iconPosition="start" />
            <Tab label="KPIs y Análisis" icon={<TrendingUp />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {currentTab === 0 && (
          <Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
          <TextField
            label="Tipo de Equipo"
            select
            size="small"
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoEquipo | '')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="HELADERA">Heladera</MenuItem>
            <MenuItem value="COOLBOX">Coolbox</MenuItem>
            <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
            <MenuItem value="OTRO">Otro</MenuItem>
          </TextField>
          <TextField
            label="Estado Fabricación"
            select
            size="small"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as EstadoFabricacion | '')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
            <MenuItem value="COMPLETADO">Completado</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </TextField>
          <TextField
            label="Estado Asignación"
            select
            size="small"
            value={estadoAsignacionFilter}
            onChange={(e) => setEstadoAsignacionFilter(e.target.value as EstadoAsignacionEquipo | '')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="DISPONIBLE">Disponible</MenuItem>
            <MenuItem value="RESERVADO">Reservado</MenuItem>
            <MenuItem value="FACTURADO">Facturado</MenuItem>
            <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
            <MenuItem value="ENTREGADO">Entregado</MenuItem>
          </TextField>
        </Stack>

            <Box>
              {/* Grouped by Tipo */}
              {(['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'] as TipoEquipo[]).map((tipo) => {
                const equiposDelTipo = equiposPorTipo[tipo];
                if (equiposDelTipo.length === 0) return null;

                const tipoLabels: Record<TipoEquipo, string> = {
                  HELADERA: 'Heladeras',
                  COOLBOX: 'Coolbox',
                  EXHIBIDOR: 'Exhibidores',
                  OTRO: 'Otros',
                };

                const tipoColors: Record<TipoEquipo, 'primary' | 'secondary' | 'success' | 'warning'> = {
                  HELADERA: 'primary',
                  COOLBOX: 'secondary',
                  EXHIBIDOR: 'success',
                  OTRO: 'warning',
                };

                return (
                  <Accordion key={tipo} defaultExpanded sx={{ mb: 2 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        bgcolor: `${tipoColors[tipo]}.lighter`,
                        '&:hover': {
                          bgcolor: `${tipoColors[tipo]}.light`,
                        },
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          label={tipoLabels[tipo]}
                          color={tipoColors[tipo]}
                          size="medium"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {equiposDelTipo.length} equipo{equiposDelTipo.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <Box sx={{ width: '100%' }}>
                        <DataGrid
                          rows={equiposDelTipo}
                          columns={columns}
                          loading={loading}
                          autoHeight
                          disableRowSelectionOnClick
                          pageSizeOptions={[25, 50, 100]}
                          initialState={{
                            pagination: {
                              paginationModel: { pageSize: 25 },
                            },
                          }}
                          localeText={{
                            noRowsLabel: 'No hay equipos disponibles',
                          }}
                          sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                              bgcolor: 'grey.50',
                            },
                            '& .MuiDataGrid-footerContainer': {
                              borderTop: '1px solid',
                              borderColor: 'divider',
                              '& .MuiIconButton-root': {
                                color: 'primary.main',
                              },
                              '& .MuiTablePagination-actions button': {
                                color: 'text.primary',
                              },
                            },
                          }}
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {equipos.length === 0 && !loading && (
                <Alert severity="info">
                  No hay equipos disponibles
                </Alert>
              )}
            </Box>
          </Box>
        )}

        {/* KPIs Tab */}
        {currentTab === 1 && (
          <Box>
            <Grid container spacing={3}>
              {/* Estado de Fabricación */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Estado de Fabricación
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'En Proceso', value: metrics.enProceso },
                          { name: 'Completados', value: metrics.completados },
                          { name: 'Cancelados', value: metrics.cancelados },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS.info} />
                        <Cell fill={COLORS.success} />
                        <Cell fill={COLORS.error} />
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Estado de Asignación */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Estado de Asignación
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Asignados', value: metrics.asignados },
                          { name: 'No Asignados', value: metrics.noAsignados },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS.warning} />
                        <Cell fill={COLORS.grey} />
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Distribución por Tipo */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Distribución por Tipo de Equipo
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { tipo: 'Heladera', cantidad: equipos.filter(e => e.tipo === 'HELADERA').length },
                        { tipo: 'Coolbox', cantidad: equipos.filter(e => e.tipo === 'COOLBOX').length },
                        { tipo: 'Exhibidor', cantidad: equipos.filter(e => e.tipo === 'EXHIBIDOR').length },
                        { tipo: 'Otro', cantidad: equipos.filter(e => e.tipo === 'OTRO').length },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tipo" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="cantidad" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Resumen de Flujo */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Flujo de Equipos
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { estado: 'En Proceso', cantidad: metrics.enProceso, fill: COLORS.info },
                        { estado: 'Disponibles', cantidad: metrics.disponibles, fill: COLORS.success },
                        { estado: 'Entregados', cantidad: metrics.entregados, fill: COLORS.warning },
                        { estado: 'Cancelados', cantidad: metrics.cancelados, fill: COLORS.error },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="estado" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="cantidad" fill={COLORS.primary}>
                        {[COLORS.info, COLORS.success, COLORS.warning, COLORS.error].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* KPIs Adicionales */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Indicadores Clave de Rendimiento
                  </Typography>
                  <Grid container spacing={3} mt={1}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="success.main" fontWeight="bold">
                          {totalElements > 0 ? ((metrics.completados / totalElements) * 100).toFixed(1) : 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tasa de Completación
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="warning.main" fontWeight="bold">
                          {metrics.completados > 0 ? ((metrics.asignados / metrics.completados) * 100).toFixed(1) : 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tasa de Asignación
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="info.main" fontWeight="bold">
                          {totalElements > 0 ? ((metrics.enProceso / totalElements) * 100).toFixed(1) : 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          En Fabricación
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="error.main" fontWeight="bold">
                          {totalElements > 0 ? ((metrics.cancelados / totalElements) * 100).toFixed(1) : 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tasa de Cancelación
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Assign Dialog */}
      <Dialog
        open={assignDialog.open}
        onClose={() => {
          setAssignDialog({ open: false, equipoId: null });
          setSelectedCliente(null);
        }}
        onTransitionEnter={() => {
          console.log('Assign dialog opened. Available clientes:', clientes);
          console.log('Clientes count:', clientes.length);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Asignar Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {clientes.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay clientes disponibles. Por favor, verifique la conexión con la API.
              </Alert>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {clientes.length} cliente(s) disponible(s)
              </Typography>
            )}
            <Autocomplete
              options={clientes}
              getOptionLabel={(option) => option.nombre || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedCliente}
              onChange={(_, newValue) => {
                console.log('Selected cliente:', newValue);
                setSelectedCliente(newValue);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Cliente *" required />
              )}
              noOptionsText="No hay clientes disponibles"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAssignDialog({ open: false, equipoId: null });
              setSelectedCliente(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAsignar}
            disabled={!selectedCliente}
          >
            Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completar Dialog - Enhanced */}
      <Dialog
        open={completarDialog.open}
        onClose={() => setCompletarDialog({ open: false, equipoId: null, equipo: null })}
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
              Completar Fabricación
            </Typography>

            {/* Message */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              ¿Está seguro de que desea marcar este equipo como completado?
            </Typography>

            {/* Equipment Details */}
            {completarDialog.equipo && (
              <Paper
                variant="outlined"
                sx={{
                  width: '100%',
                  p: 2,
                  bgcolor: (theme) => theme.palette.primary.main + '08',
                  borderColor: (theme) => theme.palette.primary.main + '30',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Número:
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {completarDialog.equipo.numeroHeladera}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {completarDialog.equipo.tipo}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Modelo:
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {completarDialog.equipo.modelo}
                  </Typography>
                </Box>
                {completarDialog.equipo.responsableNombre && (
                  <>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                      <Typography variant="body2" color="text.secondary">
                        Responsable:
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {completarDialog.equipo.responsableNombre}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            )}

            {/* Info Message */}
            <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
              <Typography variant="caption">
                Al completar, el equipo estará disponible para asignación o venta.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button onClick={() => setCompletarDialog({ open: false, equipoId: null, equipo: null })} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleCompletar} color="success" variant="contained" startIcon={<CheckCircle />}>
            Confirmar Completado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancelar Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, equipoId: null, equipo: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Cancel color="warning" />
          Cancelar Fabricación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Está seguro de que desea cancelar la fabricación de este equipo?
          </DialogContentText>
          {cancelDialog.equipo && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Equipo a cancelar:
              </Typography>
              <Typography variant="body2">
                <strong>Número:</strong> {cancelDialog.equipo.numeroHeladera}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {cancelDialog.equipo.tipo}
              </Typography>
              <Typography variant="body2">
                <strong>Modelo:</strong> {cancelDialog.equipo.modelo}
              </Typography>
              <Typography variant="body2">
                <strong>Estado actual:</strong> {cancelDialog.equipo.estado.replace('_', ' ')}
              </Typography>
            </Alert>
          )}
          <Alert severity="error">
            <Typography variant="body2">
              <strong>Advertencia:</strong> Esta acción marcará el equipo como cancelado. 
              Los materiales utilizados no se devolverán al stock automáticamente.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, equipoId: null, equipo: null })}>
            No Cancelar
          </Button>
          <Button onClick={handleCancelar} color="warning" variant="contained" startIcon={<Cancel />}>
            Sí, Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, equipoId: null, equipo: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete color="error" />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Está seguro de que desea eliminar este equipo? Esta acción no se puede deshacer.
          </DialogContentText>
          {deleteDialog.equipo && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Equipo a eliminar:
              </Typography>
              <Typography variant="body2">
                <strong>Número:</strong> {deleteDialog.equipo.numeroHeladera}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {deleteDialog.equipo.tipo}
              </Typography>
              <Typography variant="body2">
                <strong>Modelo:</strong> {deleteDialog.equipo.modelo}
              </Typography>
              {deleteDialog.equipo.clienteNombre && (
                <Typography variant="body2">
                  <strong>Cliente:</strong> {deleteDialog.equipo.clienteNombre}
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, equipoId: null, equipo: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" startIcon={<Delete />}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog
        open={unassignDialog.open}
        onClose={() => setUnassignDialog({ open: false, equipoId: null, equipo: null })}
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
            {unassignDialog.equipo && (
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
                    {unassignDialog.equipo.numeroHeladera}
                  </Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                  <Typography variant="body2" color="text.secondary">
                    Modelo:
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {unassignDialog.equipo.modelo}
                  </Typography>
                </Box>
                {unassignDialog.equipo.clienteNombre && (
                  <>
                    <Divider />
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={0.75}>
                      <Typography variant="body2" color="text.secondary">
                        Cliente Actual:
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {unassignDialog.equipo.clienteNombre}
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
            onClick={() => setUnassignDialog({ open: false, equipoId: null, equipo: null })}
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

export default EquiposList;
