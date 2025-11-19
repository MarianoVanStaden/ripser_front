import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stack,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  ExpandMore,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import type { RecetaFabricacionListDTO, TipoEquipo } from '../../types';
const RecetasList: React.FC = () => {
  const navigate = useNavigate();
  const [recetas, setRecetas] = useState<RecetaFabricacionListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Filtros
  const [searchText, setSearchText] = useState('');
  const [tipoEquipoFilter, setTipoEquipoFilter] = useState<TipoEquipo | ''>('');
  const [soloActivas, setSoloActivas] = useState(false);

  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Estado para confirmación de eliminación
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    recetaId: number | null;
  }>({ open: false, recetaId: null });

  // Group recetas by tipo
  const recetasPorTipo = useMemo(() => {
    const grupos: Record<TipoEquipo, RecetaFabricacionListDTO[]> = {
      HELADERA: [],
      COOLBOX: [],
      EXHIBIDOR: [],
      OTRO: [],
    };

    recetas.forEach(receta => {
      if (receta.tipoEquipo && grupos[receta.tipoEquipo]) {
        grupos[receta.tipoEquipo].push(receta);
      }
    });

    return grupos;
  }, [recetas]);

  useEffect(() => {
    loadRecetas();
  }, [page, pageSize]);

  const loadRecetas = async () => {
    try {
      setLoading(true);
      const response = await recetaFabricacionApi.findAll(page, pageSize);

      // Filtrar localmente según los criterios
      let filtered = response.content || [];

      if (searchText) {
        filtered = filtered.filter((r: RecetaFabricacionListDTO) =>
          r.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
          r.codigo.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      if (tipoEquipoFilter) {
        filtered = filtered.filter((r: RecetaFabricacionListDTO) => r.tipoEquipo === tipoEquipoFilter);
      }

      if (soloActivas) {
        filtered = filtered.filter((r: RecetaFabricacionListDTO) => r.activo);
      }

      setRecetas(filtered);
      setTotalElements(response.totalElements || filtered.length);
    } catch (error) {
      console.error('Error loading recetas:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar las recetas',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      if (currentActive) {
        await recetaFabricacionApi.deactivate(id);
        setSnackbar({
          open: true,
          message: 'Receta desactivada correctamente',
          severity: 'success',
        });
      } else {
        await recetaFabricacionApi.activate(id);
        setSnackbar({
          open: true,
          message: 'Receta activada correctamente',
          severity: 'success',
        });
      }
      loadRecetas();
    } catch (error) {
      console.error('Error toggling active:', error);
      setSnackbar({
        open: true,
        message: 'Error al cambiar el estado de la receta',
        severity: 'error',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.recetaId) return;

    try {
      // Como no hay endpoint de delete, desactivamos
      await recetaFabricacionApi.deactivate(deleteDialog.recetaId);
      setSnackbar({
        open: true,
        message: 'Receta eliminada (desactivada) correctamente',
        severity: 'success',
      });
      setDeleteDialog({ open: false, recetaId: null });
      loadRecetas();
    } catch (error) {
      console.error('Error deleting receta:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar la receta',
        severity: 'error',
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="500">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'modelo',
      headerName: 'Modelo',
      width: 150,
    },
    {
      field: 'cantidadDetalles',
      headerName: 'Materiales',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value || 0} size="small" variant="outlined" />
      ),
    },
    {
      field: 'fechaCreacion',
      headerName: 'Fecha Creación',
      width: 130,
      renderCell: (params: GridRenderCellParams) =>
        dayjs(params.value).format('DD/MM/YYYY'),
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <Chip label="Activa" color="success" size="small" />
        ) : (
          <Chip label="Inactiva" color="default" size="small" />
        ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Ver detalle">
            <IconButton
              size="small"
              color="info"
              onClick={() => navigate(`/fabricacion/recetas/${params.row.id}`)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              size="small"
              color="primary"
              onClick={() => navigate(`/fabricacion/recetas/editar/${params.row.id}`)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.activo ? 'Desactivar' : 'Activar'}>
            <IconButton
              size="small"
              color={params.row.activo ? 'warning' : 'success'}
              onClick={() => handleToggleActive(params.row.id, params.row.activo)}
            >
              {params.row.activo ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteDialog({ open: true, recetaId: params.row.id })}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box p={3}>
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="600">
            Estructura de Producción
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/fabricacion/recetas/nueva')}
          >
            Nueva Receta
          </Button>
        </Box>

        {/* Filtros */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
          <TextField
            label="Buscar por nombre o código"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Tipo de Equipo"
            select
            variant="outlined"
            size="small"
            value={tipoEquipoFilter}
            onChange={(e) => setTipoEquipoFilter(e.target.value as TipoEquipo | '')}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="HELADERA">Heladera</MenuItem>
            <MenuItem value="COOLBOX">Coolbox</MenuItem>
            <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
            <MenuItem value="OTRO">Otro</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={soloActivas}
                onChange={(e) => setSoloActivas(e.target.checked)}
              />
            }
            label="Solo activas"
          />
          <Button variant="outlined" onClick={loadRecetas}>
            Aplicar Filtros
          </Button>
        </Stack>

        {/* DataGrid Grouped by Tipo */}
        <Box>
          {(['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'] as TipoEquipo[]).map((tipo) => {
            const recetasDelTipo = recetasPorTipo[tipo];
            if (recetasDelTipo.length === 0) return null;

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
                      {recetasDelTipo.length} receta{recetasDelTipo.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Box sx={{ width: '100%' }}>
                    <DataGrid
                      rows={recetasDelTipo}
                      columns={columns}
                      loading={loading}
                      autoHeight
                      disableRowSelectionOnClick
                      pageSizeOptions={[10, 25, 50, 100]}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 10 },
                        },
                      }}
                      localeText={{
                        noRowsLabel: 'No hay recetas disponibles',
                      }}
                      sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                          bgcolor: 'grey.50',
                        },
                      }}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}

          {recetas.length === 0 && !loading && (
            <Alert severity="info">
              No hay recetas disponibles
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, recetaId: null })}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar esta receta? La receta será desactivada.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, recetaId: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecetasList;
