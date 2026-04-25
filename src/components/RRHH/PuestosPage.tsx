/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue
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
  Button,
  Dialog,
  Stack,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  Chip,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  PowerSettingsNew as ActivarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { puestoApi } from '../../api/services/puestoApi';
import { usePermisos } from '../../hooks/usePermisos';
import type { PuestoListDTO } from '../../types';
import PuestoFormDialog from './PuestoFormDialog';
import { formatPrice } from '../../utils/priceCalculations';
import LoadingOverlay from '../common/LoadingOverlay';

const PuestosPage: React.FC = () => {
  const navigate = useNavigate();
  const { tieneRol } = usePermisos();
  const canWrite = tieneRol('ADMIN', 'ADMIN_EMPRESA');

  const [puestos, setPuestos] = useState<PuestoListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departamentoFilter, setDepartamentoFilter] = useState('TODOS');
  const [departamentos, setDepartamentos] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingPuesto, setEditingPuesto] = useState<PuestoListDTO | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<PuestoListDTO | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [puestosData, deptsData] = await Promise.all([
        puestoApi.getAll(),
        puestoApi.getDepartamentos(),
      ]);
      setPuestos(Array.isArray(puestosData) ? puestosData : (puestosData?.content ?? []));
      setDepartamentos(Array.isArray(deptsData) ? deptsData : []);
    } catch (err) {
      setError('Error al cargar los puestos');
      console.error('Error loading puestos:', err);
      setPuestos([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPuestos = useMemo(() => {
    return puestos.filter((p) => {
      const matchesDept = departamentoFilter === 'TODOS' || p.departamento === departamentoFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        p.nombre.toLowerCase().includes(term) ||
        p.departamento?.toLowerCase().includes(term);
      return matchesDept && matchesSearch;
    });
  }, [puestos, departamentoFilter, searchTerm]);

  const paginatedPuestos = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredPuestos.slice(start, start + rowsPerPage);
  }, [filteredPuestos, page, rowsPerPage]);

  const stats = useMemo(() => {
    const total = puestos.length;
    const activos = puestos.filter((p) => p.activo).length;
    const totalEmpleados = puestos.reduce((sum, p) => sum + (p.cantidadEmpleados || 0), 0);
    return { total, activos, departamentos: departamentos.length, totalEmpleados };
  }, [puestos, departamentos]);

  const handleOpenForm = (puesto?: PuestoListDTO) => {
    setEditingPuesto(puesto || null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingPuesto(null);
  };

  const handleSave = async () => {
    await loadData();
    handleCloseForm();
    setSuccess('Puesto guardado correctamente');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleOpenDelete = (puesto: PuestoListDTO) => {
    setSelectedForDelete(puesto);
    setDeleteOpen(true);
  };

  const handleDeletePuesto = async () => {
    if (!selectedForDelete) return;
    try {
      setError(null);
      await puestoApi.delete(selectedForDelete.id);
      await loadData();
      setDeleteOpen(false);
      setSelectedForDelete(null);
      setSuccess('Puesto eliminado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el puesto');
      setDeleteOpen(false);
    }
  };

  const handleActivar = async (puesto: PuestoListDTO) => {
    try {
      setError(null);
      await puestoApi.activar(puesto.id);
      await loadData();
      setSuccess('Puesto activado correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al activar el puesto');
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando puestos..." />
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <WorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
            Puestos de Trabajo
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {canWrite && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
              Nuevo Puesto
            </Button>
          )}
        </Stack>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body2" color="textSecondary">Total Puestos</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body2" color="textSecondary">Activos</Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">{stats.activos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body2" color="textSecondary">Departamentos</Typography>
              <Typography variant="h4" fontWeight="bold" color="info.main">{stats.departamentos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="body2" color="textSecondary">Empleados Asignados</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">{stats.totalEmpleados}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Nombre, departamento..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Departamento"
                value={departamentoFilter}
                onChange={(e) => { setDepartamentoFilter(e.target.value); setPage(0); }}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="TODOS">Todos</option>
                {departamentos.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell align="right">Salario Base</TableCell>
              <TableCell align="center">Versión</TableCell>
              <TableCell align="center">Empleados</TableCell>
              <TableCell align="center">Tareas</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPuestos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                    No se encontraron puestos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPuestos.map((puesto) => (
                <TableRow key={puesto.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{puesto.nombre}</Typography>
                  </TableCell>
                  <TableCell>
                    {puesto.departamento ? (
                      <Chip label={puesto.departamento} size="small" color="primary" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="textSecondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="600" color="success.main">
                      {formatPrice(puesto.salarioBase || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`v${puesto.version}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<PeopleIcon />}
                      label={puesto.cantidadEmpleados}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">{puesto.cantidadTareas}</TableCell>
                  <TableCell align="center">
                    {puesto.activo ? (
                      <Chip icon={<CheckCircleIcon />} label="Activo" color="success" size="small" />
                    ) : (
                      <Chip label="Inactivo" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver Detalle">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => navigate(`/rrhh/puestos/${puesto.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canWrite && (
                        <>
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => handleOpenForm(puesto)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!puesto.activo && (
                            <Tooltip title="Activar">
                              <IconButton size="small" color="success" onClick={() => handleActivar(puesto)}>
                                <ActivarIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => handleOpenDelete(puesto)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPuestos.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas por página"
        />
      </TableContainer>

      {/* Form Dialog */}
      <PuestoFormDialog
        open={formOpen}
        puestoId={editingPuesto?.id || null}
        onClose={handleCloseForm}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el puesto <strong>{selectedForDelete?.nombre}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDeletePuesto}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PuestosPage;
