import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warehouse as WarehouseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { depositoApi } from '../../../api/services/depositoApi';
import { sucursalService } from '../../../services/sucursalService';
import { useTenant } from '../../../context/TenantContext';
import { usePermisos } from '../../../hooks/usePermisos';
import type { Deposito, DepositoCreateDTO, Sucursal } from '../../../types';

const DepositosPage: React.FC = () => {
  // Context and permissions
  const { empresaId, sucursalId } = useTenant();
  const { tienePermiso } = usePermisos();

  // State management
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeposito, setSelectedDeposito] = useState<Deposito | null>(null);

  // Form state
  const [formData, setFormData] = useState<DepositoCreateDTO>({
    codigo: '',
    nombre: '',
    direccion: '',
    descripcion: '',
    sucursalId: undefined,
    esPrincipal: false,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [sucursalFilter, setSucursalFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all'); // all, compartido, sucursal

  // Load data on mount
  useEffect(() => {
    if (tienePermiso('LOGISTICA')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const depositosResponse = await depositoApi.getAll();
      // Handle paginated response (if API returns { content: [...] } or direct array)
      const depositosData = Array.isArray(depositosResponse) 
        ? depositosResponse 
        : (depositosResponse as any)?.content || [];
      let sucursalesData: Sucursal[] = [];
      if (empresaId) {
        sucursalesData = await sucursalService.getByEmpresa(empresaId);
      }
      setDepositos(depositosData);
      setSucursales(sucursalesData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información');
      } else {
        setError('Error al cargar los depósitos');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtered depositos
  const filteredDepositos = useMemo(() => {
    return depositos.filter((deposito) => {
      const matchesSearch =
        deposito.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposito.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deposito.direccion && deposito.direccion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesEstado =
        estadoFilter === 'all' ||
        (estadoFilter === 'activo' && deposito.activo) ||
        (estadoFilter === 'inactivo' && !deposito.activo);

      const matchesSucursal =
        sucursalFilter === 'all' ||
        (sucursalFilter === 'compartido' && !deposito.sucursalId) ||
        (sucursalFilter !== 'compartido' && deposito.sucursalId?.toString() === sucursalFilter);

      const matchesTipo =
        tipoFilter === 'all' ||
        (tipoFilter === 'compartido' && !deposito.sucursalId) ||
        (tipoFilter === 'sucursal' && deposito.sucursalId);

      return matchesSearch && matchesEstado && matchesSucursal && matchesTipo;
    });
  }, [depositos, searchTerm, estadoFilter, sucursalFilter, tipoFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: depositos.length,
      activos: depositos.filter((d) => d.activo).length,
      inactivos: depositos.filter((d) => !d.activo).length,
      compartidos: depositos.filter((d) => !d.sucursalId).length,
      principal: depositos.find((d) => d.esPrincipal),
    };
  }, [depositos]);

  // Handlers
  const handleOpenDialog = (deposito?: Deposito) => {
    if (deposito) {
      setSelectedDeposito(deposito);
      setFormData({
        codigo: deposito.codigo,
        nombre: deposito.nombre,
        direccion: deposito.direccion || '',
        descripcion: deposito.descripcion || '',
        sucursalId: deposito.sucursalId,
        esPrincipal: deposito.esPrincipal,
      });
    } else {
      setSelectedDeposito(null);
      setFormData({
        codigo: '',
        nombre: '',
        direccion: '',
        descripcion: '',
        sucursalId: undefined,
        esPrincipal: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDeposito(null);
    setFormData({
      codigo: '',
      nombre: '',
      direccion: '',
      descripcion: '',
      sucursalId: undefined,
      esPrincipal: false,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (selectedDeposito) {
        await depositoApi.update(selectedDeposito.id, formData);
        setSuccess('Depósito actualizado correctamente');
      } else {
        await depositoApi.create(formData);
        setSuccess('Depósito creado correctamente');
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving deposito:', err);
      if (err.response?.status === 409) {
        setError('Ya existe un depósito con ese código');
      } else {
        setError('Error al guardar el depósito');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async (deposito: Deposito) => {
    try {
      setLoading(true);
      if (deposito.activo) {
        await depositoApi.desactivar(deposito.id);
        setSuccess('Depósito desactivado correctamente');
      } else {
        await depositoApi.activar(deposito.id);
        setSuccess('Depósito activado correctamente');
      }
      await loadData();
    } catch (err: any) {
      console.error('Error toggling estado:', err);
      setError('Error al cambiar el estado del depósito');
    } finally {
      setLoading(false);
    }
  };

  // Check permission
  if (!tienePermiso('LOGISTICA')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <WarehouseIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Gestión de Depósitos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nuevo Depósito
        </Button>
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

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Depósitos
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Activos
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.activos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Inactivos
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.inactivos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Compartidos
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.compartidos}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Depósito Principal
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                {stats.principal ? stats.principal.nombre : 'No definido'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Código, nombre o dirección..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="activo">Activos</MenuItem>
                  <MenuItem value="inactivo">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} label="Tipo">
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="compartido">Compartidos</MenuItem>
                  <MenuItem value="sucursal">De Sucursal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  value={sucursalFilter}
                  onChange={(e) => setSucursalFilter(e.target.value)}
                  label="Sucursal"
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="compartido">Compartidos</MenuItem>
                  {sucursales.map((sucursal) => (
                    <MenuItem key={sucursal.id} value={sucursal.id.toString()}>
                      {sucursal.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Dirección</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell align="center">Principal</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDepositos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                      No se encontraron depósitos
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepositos.map((deposito) => (
                  <TableRow key={deposito.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {deposito.codigo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{deposito.nombre}</Typography>
                        {deposito.esPrincipal && (
                          <Tooltip title="Depósito Principal">
                            <StarIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{deposito.direccion || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      {deposito.sucursalId ? (
                        <Chip label={deposito.sucursalNombre} size="small" />
                      ) : (
                        <Chip label="Compartido" size="small" color="info" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {deposito.esPrincipal ? (
                        <CheckCircleIcon sx={{ color: 'warning.main' }} />
                      ) : (
                        <StarBorderIcon sx={{ color: 'text.disabled' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {deposito.activo ? (
                        <Chip label="Activo" size="small" color="success" />
                      ) : (
                        <Chip label="Inactivo" size="small" color="error" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenDialog(deposito)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={deposito.activo ? 'Desactivar' : 'Activar'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleEstado(deposito)}
                          color={deposito.activo ? 'error' : 'success'}
                        >
                          {deposito.activo ? (
                            <CancelIcon fontSize="small" />
                          ) : (
                            <CheckCircleIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDeposito ? 'Editar Depósito' : 'Nuevo Depósito'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                required
                disabled={!!selectedDeposito}
                helperText="Único e inmutable"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sucursal</InputLabel>
                <Select
                  value={formData.sucursalId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sucursalId: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  label="Sucursal"
                >
                  <MenuItem value="">
                    <em>Compartido (todas las sucursales)</em>
                  </MenuItem>
                  {sucursales.map((sucursal) => (
                    <MenuItem key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.esPrincipal}
                    onChange={(e) => setFormData({ ...formData, esPrincipal: e.target.checked })}
                  />
                }
                label="Marcar como depósito principal"
              />
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                Solo puede haber un depósito principal por empresa
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.codigo || !formData.nombre}
          >
            {selectedDeposito ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepositosPage;
