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
  Tabs,
  Tab,
  Grid,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationOnIcon,
  SwapHoriz as SwapHorizIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { ubicacionEquipoApi } from '../../../api/services/ubicacionEquipoApi';
import { depositoApi } from '../../../api/services/depositoApi';
import { equipoFabricadoApi } from '../../../api/services';
import { movimientoEquipoApi } from '../../../api/services/movimientosApi';
import { usePermisos } from '../../../hooks/usePermisos';
import type {
  UbicacionEquipo,
  Deposito,
  EquipoFabricadoDTO,
  MovimientoEquipo,
  UbicacionEquipoCreateDTO,
  TipoEquipo,
} from '../../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const UbicacionEquiposPage: React.FC = () => {
  const { tienePermiso } = usePermisos();

  // State management
  const [ubicaciones, setUbicaciones] = useState<UbicacionEquipo[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [equipos, setEquipos] = useState<EquipoFabricadoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [depositoFilter, setDepositoFilter] = useState<string>('all');
  const [tipoEquipoFilter, setTipoEquipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');

  // Dialog states
  const [moverDialogOpen, setMoverDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [selectedUbicacion, setSelectedUbicacion] = useState<UbicacionEquipo | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoEquipo[]>([]);

  // Forms
  const [moverForm, setMoverForm] = useState({
    nuevoDepositoId: '' as number | '',
    ubicacionInterna: '',
    observaciones: '',
  });

  const [editForm, setEditForm] = useState({
    ubicacionInterna: '',
    observaciones: '',
  });

  const [createForm, setCreateForm] = useState({
    equipoFabricadoId: '' as number | '',
    depositoId: '' as number | '',
    ubicacionInterna: '',
    observaciones: '',
  });

  useEffect(() => {
    if (tienePermiso('LOGISTICA')) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ubicacionesResponse, depositosResponse, equiposResponse] = await Promise.all([
        ubicacionEquipoApi.getAll(),
        depositoApi.getActivos(),
        equipoFabricadoApi.findAll(0, 10000),
      ]);
      // Handle paginated responses
      const ubicacionesData = Array.isArray(ubicacionesResponse) 
        ? ubicacionesResponse 
        : (ubicacionesResponse as any)?.content || [];
      const depositosData = Array.isArray(depositosResponse) 
        ? depositosResponse 
        : (depositosResponse as any)?.content || [];
      const equiposData = Array.isArray(equiposResponse) 
        ? equiposResponse 
        : (equiposResponse as any)?.content || [];
      setUbicaciones(ubicacionesData);
      setDepositos(depositosData);
      setEquipos(equiposData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filtered ubicaciones
  const filteredUbicaciones = useMemo(() => {
    return ubicaciones.filter((ubicacion) => {
      const matchesSearch =
        ubicacion.equipoNumeroHeladera.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ubicacion.equipoModelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ubicacion.depositoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ubicacion.ubicacionInterna?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDeposito =
        depositoFilter === 'all' || ubicacion.depositoId.toString() === depositoFilter;

      const matchesTipo =
        tipoEquipoFilter === 'all' || ubicacion.equipoTipo === tipoEquipoFilter;

      // Get equipo details for estado filter
      const equipo = equipos.find((e) => e.numeroHeladera === ubicacion.equipoNumeroHeladera);
      const matchesEstado =
        estadoFilter === 'all' ||
        (estadoFilter === 'disponible' && equipo?.estadoAsignacion === 'DISPONIBLE') ||
        (estadoFilter === 'asignado' && equipo?.estadoAsignacion !== 'DISPONIBLE');

      return matchesSearch && matchesDeposito && matchesTipo && matchesEstado;
    });
  }, [ubicaciones, searchTerm, depositoFilter, tipoEquipoFilter, estadoFilter, equipos]);

  // Statistics
  const stats = useMemo(() => {
    const porDeposito = depositos.map((deposito) => ({
      deposito: deposito.nombre,
      count: ubicaciones.filter((u) => u.depositoId === deposito.id).length,
    }));

    const disponibles = equipos.filter((e) => e.estadoAsignacion === 'DISPONIBLE').length;
    const asignados = equipos.filter((e) => e.estadoAsignacion !== 'DISPONIBLE').length;

    return {
      totalEquipos: ubicaciones.length,
      porDeposito,
      disponibles,
      asignados,
    };
  }, [ubicaciones, depositos, equipos]);

  // Handlers
  const handleOpenMoverDialog = (ubicacion: UbicacionEquipo) => {
    setSelectedUbicacion(ubicacion);
    setMoverForm({
      nuevoDepositoId: '' as number | '',
      ubicacionInterna: ubicacion.ubicacionInterna || '',
      observaciones: '',
    });
    setMoverDialogOpen(true);
  };

  const handleMover = async () => {
    if (!selectedUbicacion) return;

    if (!moverForm.nuevoDepositoId) {
      setError('Debe seleccionar un depósito');
      return;
    }

    if (Number(moverForm.nuevoDepositoId) === selectedUbicacion.depositoId) {
      setError('Debe seleccionar un depósito diferente');
      return;
    }

    try {
      setLoading(true);
      await ubicacionEquipoApi.mover(
        selectedUbicacion.equipoFabricadoId,
        Number(moverForm.nuevoDepositoId),
        moverForm.ubicacionInterna,
        moverForm.observaciones
      );
      setSuccess('Equipo movido correctamente');
      await loadData();
      setMoverDialogOpen(false);
    } catch (err: any) {
      console.error('Error moving equipment:', err);
      setError('Error al mover el equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (ubicacion: UbicacionEquipo) => {
    setSelectedUbicacion(ubicacion);
    setEditForm({
      ubicacionInterna: ubicacion.ubicacionInterna || '',
      observaciones: ubicacion.observaciones || '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUbicacion) return;

    try {
      setLoading(true);
      await ubicacionEquipoApi.update(selectedUbicacion.id, editForm);
      setSuccess('Ubicación actualizada correctamente');
      await loadData();
      setEditDialogOpen(false);
    } catch (err: any) {
      console.error('Error updating location:', err);
      setError('Error al actualizar la ubicación');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateForm({
      equipoFabricadoId: '' as number | '',
      depositoId: '' as number | '',
      ubicacionInterna: '',
      observaciones: '',
    });
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.equipoFabricadoId || !createForm.depositoId) {
      setError('Debe seleccionar equipo y depósito');
      return;
    }

    try {
      setLoading(true);
      await ubicacionEquipoApi.create({
        equipoFabricadoId: Number(createForm.equipoFabricadoId),
        depositoId: Number(createForm.depositoId),
        ubicacionInterna: createForm.ubicacionInterna,
        observaciones: createForm.observaciones,
      });
      setSuccess('Ubicación registrada correctamente');
      await loadData();
      setCreateDialogOpen(false);
    } catch (err: any) {
      console.error('Error creating location:', err);
      if (err.response?.status === 409) {
        setError('Este equipo ya tiene una ubicación asignada');
      } else {
        setError('Error al registrar la ubicación');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistorial = async (ubicacion: UbicacionEquipo) => {
    setSelectedUbicacion(ubicacion);
    try {
      const movimientosData = await movimientoEquipoApi.getByEquipo(ubicacion.equipoFabricadoId);
      setMovimientos(movimientosData);
      setHistorialDialogOpen(true);
    } catch (err) {
      console.error('Error loading movements:', err);
      setError('Error al cargar el historial');
    }
  };

  const handleSearchByNumero = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const ubicacion = await ubicacionEquipoApi.getByNumeroHeladera(searchTerm.trim());
      setUbicaciones([ubicacion]);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No se encontró ningún equipo con ese número');
      } else {
        setError('Error al buscar el equipo');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get equipos sin ubicación - filter out null/undefined IDs
  const equiposSinUbicacion = useMemo(() => {
    const ubicacionesIds = new Set(ubicaciones.map((u) => u.equipoFabricadoId));
    return equipos.filter((e) => e.id != null && !ubicacionesIds.has(e.id));
  }, [equipos, ubicaciones]);

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
          <LocationOnIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Ubicación de Equipos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          Registrar Ubicación
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
      {equiposSinUbicacion.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Hay {equiposSinUbicacion.length} equipos sin ubicación asignada
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Total Equipos Ubicados
              </Typography>
              <Typography variant="h4">{stats.totalEquipos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Equipos Disponibles
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.disponibles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Equipos Asignados
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.asignados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Depósitos Activos
              </Typography>
              <Typography variant="h4">{depositos.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Todos los Equipos" />
          <Tab label="Por Depósito" />
          <Tab label="Buscar Equipo" />
        </Tabs>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {tabValue === 2 ? (
              <>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Buscar por Número de Heladera"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ingrese el número de heladera..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchByNumero()}
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
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearchByNumero}
                    sx={{ height: '56px' }}
                  >
                    Buscar
                  </Button>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Buscar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Número, modelo, depósito..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Depósito</InputLabel>
                    <Select
                      value={depositoFilter}
                      onChange={(e) => setDepositoFilter(e.target.value)}
                      label="Depósito"
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      {depositos.map((deposito) => (
                        <MenuItem key={deposito.id} value={deposito.id.toString()}>
                          {deposito.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Equipo</InputLabel>
                    <Select
                      value={tipoEquipoFilter}
                      onChange={(e) => setTipoEquipoFilter(e.target.value)}
                      label="Tipo de Equipo"
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="HELADERA">Heladera</MenuItem>
                      <MenuItem value="COOLBOX">Cool Box</MenuItem>
                      <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                      <MenuItem value="OTRO">Otro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={estadoFilter}
                      onChange={(e) => setEstadoFilter(e.target.value)}
                      label="Estado"
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="disponible">Disponible</MenuItem>
                      <MenuItem value="asignado">Asignado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Content */}
      <TabPanel value={tabValue} index={0}>
        {/* Todos los Equipos */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nº Heladera</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Depósito</TableCell>
                  <TableCell>Ubicación Interna</TableCell>
                  <TableCell>Fecha Ingreso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUbicaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No se encontraron equipos ubicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUbicaciones.map((ubicacion) => (
                    <TableRow key={ubicacion.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {ubicacion.equipoNumeroHeladera}
                        </Typography>
                      </TableCell>
                      <TableCell>{ubicacion.equipoModelo}</TableCell>
                      <TableCell>
                        <Chip label={ubicacion.equipoTipo} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={ubicacion.depositoNombre} size="small" color="primary" />
                      </TableCell>
                      <TableCell>{ubicacion.ubicacionInterna || '-'}</TableCell>
                      <TableCell>{new Date(ubicacion.fechaIngreso).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar ubicación interna">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(ubicacion)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Mover a otro depósito">
                          <IconButton size="small" onClick={() => handleOpenMoverDialog(ubicacion)}>
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver historial">
                          <IconButton size="small" onClick={() => handleOpenHistorial(ubicacion)}>
                            <HistoryIcon fontSize="small" />
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Por Depósito */}
        {depositoFilter !== 'all' ? (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Equipos en: {depositos.find((d) => d.id.toString() === depositoFilter)?.nombre}
                </Typography>
                <Typography variant="h4">{filteredUbicaciones.length} equipos</Typography>
              </CardContent>
            </Card>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nº Heladera</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Ubicación Interna</TableCell>
                    <TableCell>Fecha Ingreso</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUbicaciones.map((ubicacion) => (
                    <TableRow key={ubicacion.id} hover>
                      <TableCell>{ubicacion.equipoNumeroHeladera}</TableCell>
                      <TableCell>{ubicacion.equipoModelo}</TableCell>
                      <TableCell>
                        <Chip label={ubicacion.equipoTipo} size="small" />
                      </TableCell>
                      <TableCell>{ubicacion.ubicacionInterna || '-'}</TableCell>
                      <TableCell>{new Date(ubicacion.fechaIngreso).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(ubicacion)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Mover">
                          <IconButton size="small" onClick={() => handleOpenMoverDialog(ubicacion)}>
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Alert severity="info">Seleccione un depósito para ver los equipos ubicados</Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Buscar Equipo - results shown in table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : ubicaciones.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nº Heladera</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Depósito</TableCell>
                  <TableCell>Ubicación Interna</TableCell>
                  <TableCell>Fecha Ingreso</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ubicaciones.map((ubicacion) => (
                  <TableRow key={ubicacion.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {ubicacion.equipoNumeroHeladera}
                      </Typography>
                    </TableCell>
                    <TableCell>{ubicacion.equipoModelo}</TableCell>
                    <TableCell>
                      <Chip label={ubicacion.equipoTipo} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={ubicacion.depositoNombre} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{ubicacion.ubicacionInterna || '-'}</TableCell>
                    <TableCell>{new Date(ubicacion.fechaIngreso).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver historial completo">
                        <IconButton size="small" onClick={() => handleOpenHistorial(ubicacion)}>
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">Ingrese un número de heladera y presione Buscar</Alert>
        )}
      </TabPanel>

      {/* Mover Dialog */}
      <Dialog open={moverDialogOpen} onClose={() => setMoverDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mover Equipo a Otro Depósito</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedUbicacion && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Equipo:</strong> {selectedUbicacion.equipoNumeroHeladera}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 3 }}>
                <strong>Depósito Actual:</strong> {selectedUbicacion.depositoNombre}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Nuevo Depósito</InputLabel>
                    <Select
                      value={moverForm.nuevoDepositoId}
                      onChange={(e) =>
                        setMoverForm({ ...moverForm, nuevoDepositoId: Number(e.target.value) })
                      }
                      label="Nuevo Depósito"
                    >
                      {depositos
                        .filter((d) => d.id != null && d.id !== selectedUbicacion.depositoId)
                        .map((deposito) => (
                          <MenuItem key={deposito.id} value={deposito.id}>
                            {deposito.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ubicación Interna (Nueva)"
                    value={moverForm.ubicacionInterna}
                    onChange={(e) => setMoverForm({ ...moverForm, ubicacionInterna: e.target.value })}
                    placeholder="Ej: Pasillo A - Estante 3"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    value={moverForm.observaciones}
                    onChange={(e) => setMoverForm({ ...moverForm, observaciones: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoverDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleMover} variant="contained" disabled={!moverForm.nuevoDepositoId}>
            Mover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Ubicación Interna</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedUbicacion && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ubicación Interna"
                  value={editForm.ubicacionInterna}
                  onChange={(e) => setEditForm({ ...editForm, ubicacionInterna: e.target.value })}
                  placeholder="Ej: Pasillo A - Estante 3"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleEdit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Ubicación de Equipo</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Equipo</InputLabel>
                <Select
                  value={createForm.equipoFabricadoId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, equipoFabricadoId: Number(e.target.value) })
                  }
                  label="Equipo"
                >
                  {equiposSinUbicacion
                    .filter((equipo) => equipo.id != null)
                    .map((equipo) => (
                      <MenuItem key={equipo.id} value={equipo.id}>
                        {equipo.numeroHeladera} - {equipo.modelo}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Depósito</InputLabel>
                <Select
                  value={createForm.depositoId}
                  onChange={(e) => setCreateForm({ ...createForm, depositoId: Number(e.target.value) })}
                  label="Depósito"
                >
                  {depositos
                    .filter((deposito) => deposito.id != null)
                    .map((deposito) => (
                      <MenuItem key={deposito.id} value={deposito.id}>
                        {deposito.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ubicación Interna"
                value={createForm.ubicacionInterna}
                onChange={(e) => setCreateForm({ ...createForm, ubicacionInterna: e.target.value })}
                placeholder="Ej: Pasillo A - Estante 3"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={createForm.observaciones}
                onChange={(e) => setCreateForm({ ...createForm, observaciones: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!createForm.equipoFabricadoId || !createForm.depositoId}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Historial Dialog */}
      <Dialog
        open={historialDialogOpen}
        onClose={() => setHistorialDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Historial de Movimientos</DialogTitle>
        <DialogContent>
          {selectedUbicacion && (
            <>
              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                <strong>Equipo:</strong> {selectedUbicacion.equipoNumeroHeladera} |{' '}
                <strong>Modelo:</strong> {selectedUbicacion.equipoModelo}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Origen</TableCell>
                      <TableCell>Destino</TableCell>
                      <TableCell>Usuario</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimientos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No hay movimientos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientos.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>{new Date(mov.fechaMovimiento).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={mov.tipoMovimiento} size="small" />
                          </TableCell>
                          <TableCell>{mov.depositoOrigenNombre || '-'}</TableCell>
                          <TableCell>{mov.depositoDestinoNombre || '-'}</TableCell>
                          <TableCell>{mov.usuarioNombre || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistorialDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UbicacionEquiposPage;
