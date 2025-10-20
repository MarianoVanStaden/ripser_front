import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Chip, IconButton,
  Tooltip, Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Stack, CircularProgress, Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add, Visibility, Edit, Delete, CheckCircle, Cancel, Link, LinkOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  equipoFabricadoApi,

} from '../../api/services/equipoFabricadoApi';
import type { TipoEquipo, EstadoFabricacion, EquipoFabricadoListDTO } from '../../types';
import api from '../../api/config';

const EquiposList: React.FC = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<EquipoFabricadoListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [tipoFilter, setTipoFilter] = useState<TipoEquipo | ''>('');
  const [estadoFilter, setEstadoFilter] = useState<EstadoFabricacion | ''>('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    equipoId: number | null;
  }>({ open: false, equipoId: null });

  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    equipoId: number | null;
  }>({ open: false, equipoId: null });

  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  useEffect(() => {
    loadEquipos();
  }, [page, pageSize, tipoFilter, estadoFilter]);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadEquipos = async () => {
    try {
      setLoading(true);
      const response = await equipoFabricadoApi.findAll(page, pageSize);
      let filtered = response.content || [];

      if (tipoFilter) {
        filtered = filtered.filter((e: EquipoFabricadoListDTO) => e.tipo === tipoFilter);
      }
      if (estadoFilter) {
        filtered = filtered.filter((e: EquipoFabricadoListDTO) => e.estado === estadoFilter);
      }

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

  const handleCompletar = async (id: number) => {
    try {
      await equipoFabricadoApi.completarFabricacion(id);
      setSnackbar({
        open: true,
        message: 'Equipo completado correctamente',
        severity: 'success',
      });
      loadEquipos();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al completar el equipo',
        severity: 'error',
      });
    }
  };

  const handleCancelar = async (id: number) => {
    try {
      await equipoFabricadoApi.cancelarFabricacion(id);
      setSnackbar({
        open: true,
        message: 'Equipo cancelado correctamente',
        severity: 'success',
      });
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

  const handleDesasignar = async (id: number) => {
    try {
      await equipoFabricadoApi.desasignarEquipo(id);
      setSnackbar({
        open: true,
        message: 'Equipo desasignado correctamente',
        severity: 'success',
      });
      loadEquipos();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al desasignar el equipo',
        severity: 'error',
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
      setDeleteDialog({ open: false, equipoId: null });
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
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="500">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const colorMap: Record<TipoEquipo, 'primary' | 'secondary' | 'success' | 'warning'> = {
          HELADERA: 'primary',
          COOLBOX: 'secondary',
          EXHIBIDOR: 'success',
          OTRO: 'warning',
        };
        return (
          <Chip
            label={params.value}
            color={colorMap[params.value as TipoEquipo] || 'default'}
            size="small"
          />
        );
      },
    },
    {
      field: 'modelo',
      headerName: 'Modelo',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
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
      field: 'asignado',
      headerName: 'Asignado',
      width: 100,
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
      width: 150,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'responsableNombre',
      headerName: 'Responsable',
      width: 150,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'fechaCreacion',
      headerName: 'Fecha Creación',
      width: 130,
      renderCell: (params: GridRenderCellParams) =>
        dayjs(params.value).format('DD/MM/YYYY'),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 250,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
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
          <Tooltip title="Editar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/fabricacion/equipos/editar/${params.row.id}`)}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.estado === 'EN_PROCESO' && (
            <Tooltip title="Completar">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleCompletar(params.row.id)}
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
                onClick={() => handleCancelar(params.row.id)}
              >
                <Cancel fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!params.row.asignado && (
            <Tooltip title="Asignar Cliente">
              <IconButton
                size="small"
                color="success"
                onClick={() => setAssignDialog({ open: true, equipoId: params.row.id })}
              >
                <Link fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.asignado && (
            <Tooltip title="Desasignar Cliente">
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleDesasignar(params.row.id)}
              >
                <LinkOff fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteDialog({ open: true, equipoId: params.row.id })}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="600">
            Equipos Fabricados
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/fabricacion/equipos/nuevo')}
          >
            Nuevo Equipo
          </Button>
        </Box>

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
            label="Estado"
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
        </Stack>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={equipos}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={totalElements}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            rowsPerPageOptions={[5, 10, 20, 50]}
            disableSelectionOnClick
            localeText={{
              noRowsLabel: 'No hay equipos disponibles',
              MuiTablePagination: {
                labelRowsPerPage: 'Filas por página:',
              },
            }}
          />
        </Box>
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

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, equipoId: null })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar este equipo?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, equipoId: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
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
