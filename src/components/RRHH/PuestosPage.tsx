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
  Button,
  Dialog,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Grid,
  Chip,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Work as WorkIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { puestoApi } from '../../api/services/puestoApi';
import type { Puesto } from '../../types';

const PuestosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Puesto | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingPuesto, setEditingPuesto] = useState<Puesto | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [departamentoFilter, setDepartamentoFilter] = useState('TODOS');

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    departamento: '',
    salarioBase: ''
  });

  useEffect(() => {
    loadPuestos();
  }, []);

  const loadPuestos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await puestoApi.getAll();
      console.log('Puestos raw data:', data);
      console.log('Primer puesto:', data[0]);
      setPuestos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar los puestos');
      console.error('Error loading puestos:', err);
      setPuestos([]);
    } finally {
      setLoading(false);
    }
  };

  const departamentos = ['TODOS', ...Array.from(new Set(puestos.map(p => p.departamento).filter(Boolean)))];

  const filteredPuestos = puestos.filter(p => {
    const matchesDepartamento = departamentoFilter === 'TODOS' || p.departamento === departamentoFilter;
    
    const matchesSearch = !searchTerm ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.departamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDepartamento && matchesSearch;
  });

  const handleOpenForm = (puesto?: Puesto) => {
    if (puesto) {
      setEditingPuesto(puesto);
      setFormData({
        nombre: puesto.nombre,
        descripcion: puesto.descripcion || '',
        departamento: puesto.departamento || '',
        salarioBase: (puesto.salarioBase || 0).toString()
      });
    } else {
      setEditingPuesto(null);
      setFormData({
        nombre: '',
        descripcion: '',
        departamento: '',
        salarioBase: ''
      });
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingPuesto(null);
    setFormData({
      nombre: '',
      descripcion: '',
      departamento: '',
      salarioBase: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSavePuesto = async () => {
    try {
      setError(null);

      if (!formData.nombre.trim()) {
        setError('El nombre del puesto es obligatorio');
        return;
      }

      // Validación removida: ahora permite salario 0 o vacío
      const salarioBase = formData.salarioBase ? parseFloat(formData.salarioBase) : 0;
      if (salarioBase < 0) {
        setError('El salario base no puede ser negativo');
        return;
      }

      const puestoData: any = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        departamento: formData.departamento.trim() || null,
        salarioBase: salarioBase
      };

      if (editingPuesto) {
        await puestoApi.update(editingPuesto.id, { ...puestoData, id: editingPuesto.id });
      } else {
        await puestoApi.create(puestoData);
      }

      await loadPuestos();
      handleCloseForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el puesto');
      console.error('Error saving puesto:', err);
    }
  };

  const handleDeletePuesto = async () => {
    if (!selected) return;
    
    try {
      setError(null);
      await puestoApi.delete(selected.id);
      await loadPuestos();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el puesto');
      console.error('Error deleting puesto:', err);
      setOpenDelete(false);
    }
  };

  const handleViewDetails = (puesto: Puesto) => {
    setSelected(puesto);
    setOpenDetail(true);
  };

  const handleOpenDelete = (puesto: Puesto) => {
    setSelected(puesto);
    setOpenDelete(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Puestos de Trabajo
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadPuestos} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Nuevo Puesto
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas Rápidas */}
      <Grid container spacing={{ xs: 2, sm: 2 }} mb={3}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <WorkIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {filteredPuestos.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Total Puestos
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <BusinessIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                    {departamentos.length - 1}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Departamentos
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <MoneyIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'info.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${filteredPuestos.length > 0
                      ? Math.round(filteredPuestos.reduce((sum, p) => sum + (p.salarioBase || 0), 0) / filteredPuestos.length).toLocaleString('es-AR')
                      : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Salario Promedio
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <MoneyIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1rem', sm: '1.5rem' } }}>
                    ${filteredPuestos.length > 0
                      ? Math.max(...filteredPuestos.map(p => p.salarioBase || 0)).toLocaleString('es-AR')
                      : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Salario Máximo
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box mb={2}>
            <Grid container spacing={2}>
              {/* Búsqueda */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Nombre, departamento, descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Filtro por Departamento */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  select
                  label="Departamento"
                  value={departamentoFilter}
                  onChange={(e) => setDepartamentoFilter(e.target.value)}
                  size="small"
                  SelectProps={{ native: true }}
                >
                  {departamentos.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Nombre</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Departamento</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Descripción</TableCell>
                  <TableCell align="right" sx={{ minWidth: 110 }}>Salario Base</TableCell>
                  <TableCell align="center" sx={{ minWidth: 110 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPuestos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay puestos disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPuestos.map(puesto => (
                    <TableRow key={puesto.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {puesto.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {puesto.departamento ? (
                          <Chip
                            label={puesto.departamento}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Chip
                            label="Sin Asignar"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {puesto.descripcion || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600" color="success.main">
                          ${(puesto.salarioBase || 0).toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Ver Detalle">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleViewDetails(puesto)}
                            >
                              <DescriptionIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenForm(puesto)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(puesto)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Detalle */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <WorkIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  {selected.nombre}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                    Departamento
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {selected.departamento ? (
                      <Chip label={selected.departamento} size="small" color="primary" />
                    ) : (
                      <Chip label="Sin Asignar" size="small" color="default" />
                    )}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                    Descripción
                  </Typography>
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mt: 1 }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {selected.descripcion || 'Sin descripción'}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight="600" textTransform="uppercase">
                    Salario Base
                  </Typography>
                  <Typography variant="h4" color="success.main" fontWeight="bold" sx={{ mt: 1 }}>
                    ${(selected.salarioBase || 0).toLocaleString('es-AR')}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="outlined" onClick={() => setOpenDetail(false)}>
                Cerrar
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  setOpenDetail(false);
                  handleOpenForm(selected);
                }}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de Formulario */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {editingPuesto ? 'Editar Puesto' : 'Nuevo Puesto'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Nombre del Puesto"
              name="nombre"
              value={formData.nombre}
              onChange={handleFormChange}
              required
              fullWidth
              placeholder="Ej: Desarrollador Senior"
            />
            <TextField
              label="Departamento"
              name="departamento"
              value={formData.departamento}
              onChange={handleFormChange}
              fullWidth
              placeholder="Ej: Tecnología"
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Descripción detallada del puesto..."
            />
            <TextField
              label="Salario Base"
              name="salarioBase"
              type="number"
              value={formData.salarioBase}
              onChange={handleFormChange}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              placeholder="0.00"
              helperText="Opcional: Deja en 0 si no aplica"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseForm}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSavePuesto}>
            {editingPuesto ? 'Guardar Cambios' : 'Crear Puesto'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el puesto <strong>{selected?.nombre}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDelete(false)}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDeletePuesto}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PuestosPage;
