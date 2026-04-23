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
} from '@mui/icons-material';
import { ubicacionEquipoApi } from '../../../api/services/ubicacionEquipoApi';
import { depositoApi } from '../../../api/services/depositoApi';
import { equipoFabricadoApi } from '../../../api/services';
import { movimientoEquipoApi } from '../../../api/services/movimientosApi';
import { usePermisos } from '../../../hooks/usePermisos';
import LoadingOverlay from '../../common/LoadingOverlay';
import type {
  UbicacionEquipo,
  Deposito,
  DesgloseModeloDTO,
  EquipoFabricadoDTO,
  MovimientoEquipo,
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

  // Estado para la operación de registro masivo
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Server-side desglose (tab 3)
  const [desgloseServidor, setDesgloseServidor] = useState<DesgloseModeloDTO[]>([]);
  const [loadingDesglose, setLoadingDesglose] = useState(false);

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
    equiposSeleccionados: [] as string[], // Array de numeroHeladera
    depositoId: '' as number | '',
    ubicacionInterna: '',
    observaciones: '',
  });

  // Estado para búsqueda de equipos en el diálogo de creación
  const [equipoSearchType, setEquipoSearchType] = useState<TipoEquipo | ''>('');
  const [equipoSearchTerm, setEquipoSearchTerm] = useState('');
  const [equiposSearchResults, setEquiposSearchResults] = useState<EquipoFabricadoDTO[]>([]);
  const [searchingEquipos, setSearchingEquipos] = useState(false);
  // Error local del diálogo (se muestra dentro del modal, no detrás)
  const [dialogError, setDialogError] = useState<string | null>(null);

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
        ubicacionEquipoApi.getAll({ size: 5000 }), // Traer todas para el filtro de búsqueda
        depositoApi.getActivos(),
        equipoFabricadoApi.findAll({ page: 0, size: 1000 }),
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
      equiposSeleccionados: [],
      depositoId: '' as number | '',
      ubicacionInterna: '',
      observaciones: '',
    });
    setEquipoSearchType('');
    setEquipoSearchTerm('');
    setEquiposSearchResults([]);
    setDialogError(null);
    setCreateDialogOpen(true);
  };

  const handleSearchEquipos = async () => {
    if (!equipoSearchType) {
      setDialogError('Debe seleccionar un tipo de equipo');
      return;
    }

    try {
      setSearchingEquipos(true);
      setDialogError(null);

      const response = await equipoFabricadoApi.findByTipo(equipoSearchType as TipoEquipo);
      const equiposPorTipo = Array.isArray(response) ? response : (response as any)?.content || [];

      const searchLower = equipoSearchTerm.trim().toLowerCase();
      const ubicacionesIds = new Set(ubicaciones.map((u) => u.equipoFabricadoId));
      const ubicacionesNumeros = new Set(ubicaciones.map((u) => u.equipoNumeroHeladera?.toLowerCase()));

      const filteredResults = equiposPorTipo.filter((equipo: any) => {
        if (equipo.estadoAsignacion !== 'DISPONIBLE') return false;
        if (equipo.id != null && ubicacionesIds.has(equipo.id)) return false;
        if (equipo.numeroHeladera && ubicacionesNumeros.has(equipo.numeroHeladera.toLowerCase())) return false;

        // Si no hay término de búsqueda, mostrar todos sin ubicación del tipo seleccionado
        if (!searchLower) return true;

        return (
          equipo.numeroHeladera?.toLowerCase().includes(searchLower) ||
          equipo.modelo?.toLowerCase().includes(searchLower)
        );
      });

      setEquiposSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        setDialogError(
          searchLower
            ? 'No se encontraron equipos sin ubicación que coincidan con la búsqueda'
            : `No hay equipos de ese tipo sin ubicación asignada`
        );
      }
    } catch (err: any) {
      console.error('❌ Error searching equipos:', err);
      setDialogError('Error al buscar equipos');
      setEquiposSearchResults([]);
    } finally {
      setSearchingEquipos(false);
    }
  };

  const handleCreate = async () => {
    if (createForm.equiposSeleccionados.length === 0 || !createForm.depositoId) {
      setDialogError('Debe seleccionar al menos un equipo y un depósito');
      return;
    }

    const total = createForm.equiposSeleccionados.length;
    setSubmitting(true);
    setSubmitProgress({ current: 0, total });

    try {
      let exitosos = 0;
      let yaRegistrados = 0;
      let errores = 0;

      for (let i = 0; i < createForm.equiposSeleccionados.length; i++) {
        const numeroHeladera = createForm.equiposSeleccionados[i];
        setSubmitProgress({ current: i + 1, total });

        // Usar los datos ya cargados en equiposSearchResults — sin request extra por equipo
        const equipo = equiposSearchResults.find((e) => e.numeroHeladera === numeroHeladera);
        if (!equipo || equipo.id == null) {
          console.warn(`⚠️ No se encontró ID para ${numeroHeladera}, omitiendo`);
          errores++;
          continue;
        }

        try {
          await ubicacionEquipoApi.create({
            equipoFabricadoId: equipo.id,
            depositoId: Number(createForm.depositoId),
            ubicacionInterna: createForm.ubicacionInterna,
            observaciones: createForm.observaciones,
          });
          exitosos++;
        } catch (err: any) {
          const backendMsg: string = err?.response?.data?.message || '';
          if (backendMsg.toLowerCase().includes('ya tiene una ubicación')) {
            // El equipo fue registrado en una operación previa — no es un error real
            yaRegistrados++;
          } else {
            console.error(`❌ Error creando ubicación para ${numeroHeladera}:`, err);
            errores++;
          }
        }
      }

      // Mensaje de resultado
      await loadData();

      if (exitosos > 0 && errores === 0 && yaRegistrados === 0) {
        setSuccess(`Se registraron ${exitosos} ubicaciones correctamente`);
        setCreateDialogOpen(false);
      } else if (exitosos > 0) {
        const partes = [`${exitosos} registradas`];
        if (yaRegistrados > 0) partes.push(`${yaRegistrados} ya tenían ubicación`);
        if (errores > 0) partes.push(`${errores} con error`);
        setSuccess(partes.join(' · '));
        setCreateDialogOpen(false);
      } else if (yaRegistrados > 0 && errores === 0) {
        setError(
          `Todos los equipos seleccionados ya tienen ubicación registrada. ` +
          `Verificá en la pestaña "Todos los Equipos". ` +
          `(${yaRegistrados} ya registrados)`
        );
      } else {
        setError(`No se pudo registrar ninguna ubicación (${errores} errores)`);
      }
    } catch (err: any) {
      console.error('❌ Error general:', err);
      setError('Error al registrar las ubicaciones');
    } finally {
      setSubmitting(false);
      setSubmitProgress({ current: 0, total: 0 });
    }
  };

  const handleOpenHistorial = async (ubicacion: UbicacionEquipo) => {
    setSelectedUbicacion(ubicacion);
    try {
      const response = await movimientoEquipoApi.getByEquipo(ubicacion.equipoFabricadoId);
      // Asegurar que movimientosData sea siempre un array
      const movimientosData = Array.isArray(response) 
        ? response 
        : (response as any)?.content || [];
      setMovimientos(movimientosData);
      setHistorialDialogOpen(true);
    } catch (err) {
      console.error('Error loading movements:', err);
      setMovimientos([]); // Resetear a array vacío en caso de error
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

  // Get equipos sin ubicación - filter out null/undefined IDs and units physically off-site
  const equiposSinUbicacion = useMemo(() => {
    const ubicacionesIds = new Set(ubicaciones.map((u) => u.equipoFabricadoId));
    return equipos.filter(
      (e) =>
        e.id != null &&
        !ubicacionesIds.has(e.id) &&
        e.estadoAsignacion !== 'EN_TRANSITO' &&
        e.estadoAsignacion !== 'ENTREGADO',
    );
  }, [equipos, ubicaciones]);

  const TIPO_LABEL: Record<string, string> = {
    HELADERA: 'HELADERAS',
    COOLBOX: 'COOLBOX',
    EXHIBIDOR: 'EXHIBIDORES',
    OTRO: 'OTROS',
  };
  const TIPO_ORDER: TipoEquipo[] = ['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'];

  /**
   * Agrupación de desgloseServidor por tipo para el renderizado.
   * Los conteos vienen calculados server-side — no hay cálculo client-side.
   */
  const desgloseAgrupado = useMemo(() => {
    return TIPO_ORDER
      .filter((tipo) => desgloseServidor.some((d) => d.tipo === tipo))
      .map((tipo) => {
        const modelos = desgloseServidor.filter((d) => d.tipo === tipo);
        return {
          tipo,
          label: TIPO_LABEL[tipo] || tipo,
          modelos,
          totalTipo: {
            total:       modelos.reduce((s, m) => s + m.total, 0),
            asignados:   modelos.reduce((s, m) => s + m.asignados, 0),
            enService:   modelos.reduce((s, m) => s + m.enService, 0),
            disponibles: modelos.reduce((s, m) => s + m.disponibles, 0),
          },
        };
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desgloseServidor]);

  if (!tienePermiso('LOGISTICA')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <LoadingOverlay open={loading} message="Cargando ubicaciones..." />
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocationOnIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main' }} />
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            Ubicación de Equipos
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpenCreateDialog}
          fullWidth
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
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
        <Tabs
          value={tabValue}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          onChange={async (_, newValue: number) => {
            setTabValue(newValue);
            if (newValue === 3 && desgloseServidor.length === 0) {
              try {
                setLoadingDesglose(true);
                const data = await equipoFabricadoApi.getDesgloseModelo();
                setDesgloseServidor(data);
              } catch {
                setError('Error al cargar el desglose por modelo');
              } finally {
                setLoadingDesglose(false);
              }
            }
          }}
        >
          <Tab label="Todos los Equipos" />
          <Tab label="Por Depósito" />
          <Tab label="Buscar Equipo" />
          <Tab label="Desglose por Modelo" />
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
        {!loading && (
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

      <TabPanel value={tabValue} index={3}>
        {/* Desglose por Modelo */}
        {loadingDesglose ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : desgloseAgrupado.length === 0 ? (
          <Alert severity="info">No hay equipos registrados</Alert>
        ) : (
          desgloseAgrupado.map(({ tipo, label, modelos, totalTipo }) => (
            <Box key={tipo} sx={{ mb: 4 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.dark' }}>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold', width: '28%' }}>
                        EQUIPOS
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT TOTAL
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT ASIGNADOS
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT EN SERVICE
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT DISPONIBLE
                      </TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        NUMEROS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modelos.map((row) => (
                      <TableRow key={row.modelo} hover>
                        <TableCell>{row.modelo}</TableCell>
                        <TableCell align="right">{row.total}</TableCell>
                        <TableCell align="right">{row.asignados}</TableCell>
                        <TableCell align="right">{row.enService}</TableCell>
                        <TableCell align="right">{row.disponibles}</TableCell>
                        <TableCell sx={{ typography: 'caption', maxWidth: 300, wordBreak: 'break-word' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ color: 'text.secondary' }}>
                              {row.numerosDisponibles.join(', ') || '—'}
                            </Box>
                            {row.numerosEnService && row.numerosEnService.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label="En Service"
                                  size="small"
                                  sx={{
                                    bgcolor: 'warning.main',
                                    color: 'common.white',
                                    fontWeight: 'bold',
                                    height: 20,
                                  }}
                                />
                                <Box sx={{ color: 'warning.dark', fontWeight: 500 }}>
                                  {row.numerosEnService.join(', ')}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Subtotal row */}
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        TOTAL {label}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.total}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.asignados}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.enService}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.disponibles}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))
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
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Ubicación de Equipo</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Error local del diálogo — se muestra dentro del modal */}
          {dialogError && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setDialogError(null)}>
              {dialogError}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Búsqueda de Equipos */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                1. Buscar Equipo
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Equipo</InputLabel>
                <Select
                  value={equipoSearchType}
                  onChange={(e) => {
                    setEquipoSearchType(e.target.value as TipoEquipo);
                    setEquiposSearchResults([]);
                    setDialogError(null);
                    setCreateForm({ ...createForm, equiposSeleccionados: [] });
                  }}
                  label="Tipo de Equipo"
                >
                  <MenuItem value="HELADERA">Heladera</MenuItem>
                  <MenuItem value="COOLBOX">Cool Box</MenuItem>
                  <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Filtrar por Número o Modelo"
                value={equipoSearchTerm}
                onChange={(e) => setEquipoSearchTerm(e.target.value)}
                placeholder="Opcional — vacío muestra todos sin ubicación"
                onKeyPress={(e) => e.key === 'Enter' && handleSearchEquipos()}
                disabled={!equipoSearchType}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSearchEquipos}
                disabled={!equipoSearchType || searchingEquipos}
                sx={{ height: '56px' }}
              >
                {searchingEquipos ? <CircularProgress size={24} /> : 'Buscar'}
              </Button>
            </Grid>

            {/* Resultados de búsqueda */}
            {equiposSearchResults.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Seleccionar Equipos ({createForm.equiposSeleccionados.length} seleccionados)
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Tooltip title="Seleccionar todos">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (createForm.equiposSeleccionados.length === equiposSearchResults.length) {
                                  setCreateForm({ ...createForm, equiposSeleccionados: [] });
                                } else {
                                  setCreateForm({
                                    ...createForm,
                                    equiposSeleccionados: equiposSearchResults.map((e) => e.numeroHeladera),
                                  });
                                }
                              }}
                            >
                              {createForm.equiposSeleccionados.length === equiposSearchResults.length ? (
                                <SearchIcon />
                              ) : (
                                <AddIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>Número</TableCell>
                        <TableCell>Modelo</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>Medida</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {equiposSearchResults.map((equipo, index) => {
                        const isSelected = createForm.equiposSeleccionados.includes(equipo.numeroHeladera);
                        return (
                          <TableRow
                            key={equipo.numeroHeladera || index}
                            hover
                            selected={isSelected}
                            onClick={() => {
                              if (isSelected) {
                                setCreateForm({
                                  ...createForm,
                                  equiposSeleccionados: createForm.equiposSeleccionados.filter(
                                    (n) => n !== equipo.numeroHeladera
                                  ),
                                });
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  equiposSeleccionados: [...createForm.equiposSeleccionados, equipo.numeroHeladera],
                                });
                              }
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                style={{ cursor: 'pointer' }}
                              />
                            </TableCell>
                            <TableCell>{equipo.numeroHeladera}</TableCell>
                            <TableCell>{equipo.modelo}</TableCell>
                            <TableCell>{equipo.color || '-'}</TableCell>
                            <TableCell>{equipo.medida || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Datos de ubicación */}
            {createForm.equiposSeleccionados.length > 0 && (
              <>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    2. Datos de Ubicación
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
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
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={submitting}>Cancelar</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={createForm.equiposSeleccionados.length === 0 || !createForm.depositoId || submitting}
          >
            Registrar ({createForm.equiposSeleccionados.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay para operaciones masivas */}
      <LoadingOverlay
        open={submitting}
        message="Registrando ubicaciones..."
        progress={submitProgress.total > 0 ? submitProgress : undefined}
      />

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
