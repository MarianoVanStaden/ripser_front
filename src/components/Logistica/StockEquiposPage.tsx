import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Inventory2 as Inventory2Icon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
  RemoveCircle as RemoveCircleIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  Edit as EditIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import { movimientoStockFabricacionApi } from '../../api/services/movimientoStockFabricacionApi';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import type {
  EquipoFabricadoDTO,
  TipoEquipo,
  EstadoFabricacion,
  MovimientoStock,
  EntregaViaje,
} from '../../types';
import { generateEquiposInventoryPDF } from '../../utils/pdfExportUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stock-equipos-tabpanel-${index}`}
      aria-labelledby={`stock-equipos-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface EquipoMovimiento {
  id: number;
  fecha: string;
  numeroHeladera: string;
  tipo: TipoEquipo;
  modelo: string;
  accion: 'CREADO' | 'COMPLETADO' | 'CANCELADO' | 'ASIGNADO' | 'DESASIGNADO';
  clienteNombre?: string;
  responsableNombre?: string;
  observaciones?: string;
}

const StockEquiposPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [equipos, setEquipos] = useState<EquipoFabricadoDTO[]>([]);
  const [movimientosStock, setMovimientosStock] = useState<MovimientoStock[]>([]);
  const [entregasHistorial, setEntregasHistorial] = useState<EntregaViaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoFabricadoDTO | null>(null);
  const [editForm, setEditForm] = useState({
    modelo: '',
    color: '',
    observaciones: '',
    estado: 'EN_PROCESO' as EstadoFabricacion,
  });

  // Filter and Pagination states for Tab 0: Inventario de Equipos
  const [searchEquipos, setSearchEquipos] = useState('');
  const [tipoEquipoFilter, setTipoEquipoFilter] = useState<string>('all');
  const [estadoEquipoFilter, setEstadoEquipoFilter] = useState<string>('all');
  const [asignadoFilter, setAsignadoFilter] = useState<string>('all');
  const [pageEquipos, setPageEquipos] = useState(0);
  const [rowsPerPageEquipos, setRowsPerPageEquipos] = useState(10);

  // Filter and Pagination states for Tab 1: Registro de Movimientos de Equipos
  const [searchMovimientos, setSearchMovimientos] = useState('');
  const [accionFilter, setAccionFilter] = useState<string>('all');
  const [tipoMovimientoFilter, setTipoMovimientoFilter] = useState<string>('all');
  const [pageMovimientos, setPageMovimientos] = useState(0);
  const [rowsPerPageMovimientos, setRowsPerPageMovimientos] = useState(10);

  // Filter and Pagination states for Tab 2: Movimientos de Materias Primas
  const [searchMateriasPrimas, setSearchMateriasPrimas] = useState('');
  const [tipoMPFilter, setTipoMPFilter] = useState<string>('all');
  const [pageMateriasPrimas, setPageMateriasPrimas] = useState(0);
  const [rowsPerPageMateriasPrimas, setRowsPerPageMateriasPrimas] = useState(10);

  // Filter and Pagination states for Tab 3: Historial de Entregas
  const [searchEntregas, setSearchEntregas] = useState('');
  const [pageEntregas, setPageEntregas] = useState(0);
  const [rowsPerPageEntregas, setRowsPerPageEntregas] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equiposData, movimientosData, todasEntregas] = await Promise.all([
        equipoFabricadoApi.findAll({ page: 0, size: 1000 }),
        movimientoStockFabricacionApi.findAll(),
        entregaViajeApi.getAll(),
      ]);

      setEquipos(equiposData.content || equiposData || []);
      setMovimientosStock(movimientosData || []);
      setEntregasHistorial(
        (todasEntregas || [])
          .filter((e) => e.estado === 'ENTREGADA')
          .sort((a, b) => (b.fechaEntrega > a.fechaEntrega ? 1 : -1))
      );
      setError(null);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.');
      } else {
        setError('Error al cargar los datos');
      }
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEquipo = (equipo: EquipoFabricadoDTO) => {
    setSelectedEquipo(equipo);
    setEditForm({
      modelo: equipo.modelo,
      color: equipo.color || '',
      observaciones: equipo.observaciones || '',
      estado: equipo.estado,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEquipo) return;

    try {
      setLoading(true);
      await equipoFabricadoApi.update(selectedEquipo.id, {
        modelo: editForm.modelo,
        color: editForm.color,
        observaciones: editForm.observaciones,
        estado: editForm.estado,
      });

      await loadData();
      setEditDialogOpen(false);
      setSelectedEquipo(null);
    } catch (err) {
      console.error('Error updating equipo:', err);
      setError('Error al actualizar el equipo');
    } finally {
      setLoading(false);
    }
  };

  // ============= FILTER AND PAGINATION LOGIC =============

  // Tab 0: Filter and paginate Equipos
  const filteredEquipos = useMemo(() => {
    return equipos
      .filter((equipo) => {
        const matchesSearch = searchEquipos === '' ||
          equipo.numeroHeladera.toLowerCase().includes(searchEquipos.toLowerCase()) ||
          equipo.modelo.toLowerCase().includes(searchEquipos.toLowerCase()) ||
          equipo.clienteNombre?.toLowerCase().includes(searchEquipos.toLowerCase());

        const matchesTipo = tipoEquipoFilter === 'all' || equipo.tipo === tipoEquipoFilter;
        const matchesEstado = estadoEquipoFilter === 'all' || equipo.estado === estadoEquipoFilter;
        const matchesAsignado = asignadoFilter === 'all' ||
          (asignadoFilter === 'asignado' && equipo.asignado) ||
          (asignadoFilter === 'no-asignado' && !equipo.asignado);

        return matchesSearch && matchesTipo && matchesEstado && matchesAsignado;
      })
      .sort((a, b) => (b.fechaCreacion > a.fechaCreacion ? 1 : -1));
  }, [equipos, searchEquipos, tipoEquipoFilter, estadoEquipoFilter, asignadoFilter]);

  const paginatedEquipos = useMemo(() => {
    return filteredEquipos.slice(
      pageEquipos * rowsPerPageEquipos,
      pageEquipos * rowsPerPageEquipos + rowsPerPageEquipos
    );
  }, [filteredEquipos, pageEquipos, rowsPerPageEquipos]);

  const handleChangePageEquipos = (_event: unknown, newPage: number) => {
    setPageEquipos(newPage);
  };

  const handleChangeRowsPerPageEquipos = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageEquipos(parseInt(event.target.value, 10));
    setPageEquipos(0);
  };

  // Handler para exportar inventario de equipos a PDF
  const handleExportEquiposPDF = async (): Promise<void> => {
    try {
      const disponibles = equipos.filter(e => !e.asignado && e.estado === 'COMPLETADO').length;
      const asignados = equipos.filter(e => e.asignado).length;
      const enProceso = equipos.filter(e => e.estado === 'EN_PROCESO').length;

      await generateEquiposInventoryPDF(
        filteredEquipos,
        {
          searchTerm: searchEquipos,
          tipoFilter: tipoEquipoFilter,
          estadoFilter: estadoEquipoFilter,
          asignadoFilter,
        },
        {
          totalEquipos: equipos.length,
          disponibles,
          asignados,
          enProceso,
        }
      );
    } catch (error) {
      console.error('Error al generar PDF de inventario de equipos:', error);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Generar historial de movimientos de equipos
  const generarHistorialMovimientos = (equipos: EquipoFabricadoDTO[]): EquipoMovimiento[] => {
    const movimientos: EquipoMovimiento[] = [];
    
    equipos.forEach(equipo => {
      // Movimiento de creación
      movimientos.push({
        id: equipo.id,
        fecha: equipo.fechaCreacion,
        numeroHeladera: equipo.numeroHeladera,
        tipo: equipo.tipo,
        modelo: equipo.modelo,
        accion: 'CREADO',
        responsableNombre: equipo.responsableNombre,
        observaciones: equipo.observaciones,
      });

      // Movimiento de finalización (si está completado)
      if (equipo.estado === 'COMPLETADO' && equipo.fechaFinalizacion) {
        movimientos.push({
          id: equipo.id * 10000 + 1, // ID único para el movimiento
          fecha: equipo.fechaFinalizacion,
          numeroHeladera: equipo.numeroHeladera,
          tipo: equipo.tipo,
          modelo: equipo.modelo,
          accion: 'COMPLETADO',
          responsableNombre: equipo.responsableNombre,
          observaciones: 'Fabricación completada',
        });
      }

      // Movimiento de cancelación (si está cancelado)
      if (equipo.estado === 'CANCELADO' && equipo.fechaFinalizacion) {
        movimientos.push({
          id: equipo.id * 10000 + 2, // ID único para el movimiento
          fecha: equipo.fechaFinalizacion,
          numeroHeladera: equipo.numeroHeladera,
          tipo: equipo.tipo,
          modelo: equipo.modelo,
          accion: 'CANCELADO',
          responsableNombre: equipo.responsableNombre,
          observaciones: 'Fabricación cancelada',
        });
      }

      // Movimiento de asignación a cliente (si está asignado)
      if (equipo.asignado && equipo.clienteNombre) {
        movimientos.push({
          id: equipo.id * 10000 + 3, // ID único para el movimiento
          fecha: equipo.fechaFinalizacion || equipo.fechaCreacion,
          numeroHeladera: equipo.numeroHeladera,
          tipo: equipo.tipo,
          modelo: equipo.modelo,
          accion: 'ASIGNADO',
          clienteNombre: equipo.clienteNombre,
          responsableNombre: equipo.responsableNombre,
          observaciones: `Asignado a ${equipo.clienteNombre}`,
        });
      }
    });

    // Ordenar por fecha descendente (más reciente primero)
    return movimientos.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  };

  // Tab 1: Filter and paginate Movimientos de Equipos
  const historialMovimientos = generarHistorialMovimientos(equipos);

  const filteredMovimientos = useMemo(() => {
    return historialMovimientos.filter((movimiento) => {
      const matchesSearch = searchMovimientos === '' ||
        movimiento.numeroHeladera.toLowerCase().includes(searchMovimientos.toLowerCase()) ||
        movimiento.modelo.toLowerCase().includes(searchMovimientos.toLowerCase()) ||
        movimiento.clienteNombre?.toLowerCase().includes(searchMovimientos.toLowerCase()) ||
        movimiento.responsableNombre?.toLowerCase().includes(searchMovimientos.toLowerCase());

      const matchesAccion = accionFilter === 'all' || movimiento.accion === accionFilter;
      const matchesTipo = tipoMovimientoFilter === 'all' || movimiento.tipo === tipoMovimientoFilter;

      return matchesSearch && matchesAccion && matchesTipo;
    });
  }, [historialMovimientos, searchMovimientos, accionFilter, tipoMovimientoFilter]);

  const paginatedMovimientos = useMemo(() => {
    return filteredMovimientos.slice(
      pageMovimientos * rowsPerPageMovimientos,
      pageMovimientos * rowsPerPageMovimientos + rowsPerPageMovimientos
    );
  }, [filteredMovimientos, pageMovimientos, rowsPerPageMovimientos]);

  const handleChangePageMovimientos = (_event: unknown, newPage: number) => {
    setPageMovimientos(newPage);
  };

  const handleChangeRowsPerPageMovimientos = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageMovimientos(parseInt(event.target.value, 10));
    setPageMovimientos(0);
  };

  // Tab 2: Filter and paginate Movimientos de Materias Primas
  // Sort by date descending (newest first)
  const materiasPrimasMovimientos = movimientosStock
    .filter(m =>
      m.tipo === 'SALIDA_FABRICACION' ||
      m.tipo === 'REINGRESO_CANCELACION_FABRICACION'
    )
    .sort((a, b) => (b.fecha > a.fecha ? 1 : -1));

  const filteredMateriasPrimas = useMemo(() => {
    return materiasPrimasMovimientos.filter((movimiento) => {
      const matchesSearch = searchMateriasPrimas === '' ||
        movimiento.productoNombre?.toLowerCase().includes(searchMateriasPrimas.toLowerCase()) ||
        movimiento.equipoFabricadoNumero?.toLowerCase().includes(searchMateriasPrimas.toLowerCase()) ||
        movimiento.concepto?.toLowerCase().includes(searchMateriasPrimas.toLowerCase());

      const matchesTipo = tipoMPFilter === 'all' || movimiento.tipo === tipoMPFilter;

      return matchesSearch && matchesTipo;
    });
  }, [materiasPrimasMovimientos, searchMateriasPrimas, tipoMPFilter]);

  const paginatedMateriasPrimas = useMemo(() => {
    return filteredMateriasPrimas.slice(
      pageMateriasPrimas * rowsPerPageMateriasPrimas,
      pageMateriasPrimas * rowsPerPageMateriasPrimas + rowsPerPageMateriasPrimas
    );
  }, [filteredMateriasPrimas, pageMateriasPrimas, rowsPerPageMateriasPrimas]);

  const handleChangePageMateriasPrimas = (_event: unknown, newPage: number) => {
    setPageMateriasPrimas(newPage);
  };

  const handleChangeRowsPerPageMateriasPrimas = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageMateriasPrimas(parseInt(event.target.value, 10));
    setPageMateriasPrimas(0);
  };

  // Filtrar historial de entregas completadas (desde entregaViajeApi)
  const filteredEntregas = useMemo(() => {
    if (searchEntregas === '') return entregasHistorial;
    const q = searchEntregas.toLowerCase();
    return entregasHistorial.filter((e) =>
      e.receptorNombre?.toLowerCase().includes(q) ||
      e.receptorDni?.toLowerCase().includes(q) ||
      e.direccionEntrega?.toLowerCase().includes(q) ||
      e.observaciones?.toLowerCase().includes(q) ||
      e.documentoComercial?.clienteNombre?.toLowerCase().includes(q) ||
      e.documentoComercial?.numeroDocumento?.toLowerCase().includes(q)
    );
  }, [entregasHistorial, searchEntregas]);

  const paginatedEntregas = useMemo(() => {
    return filteredEntregas.slice(
      pageEntregas * rowsPerPageEntregas,
      pageEntregas * rowsPerPageEntregas + rowsPerPageEntregas
    );
  }, [filteredEntregas, pageEntregas, rowsPerPageEntregas]);

  const getClienteNombreEntrega = (e: EntregaViaje): string => {
    if (e.documentoComercial?.clienteNombre) return e.documentoComercial.clienteNombre;
    const match = e.direccionEntrega?.match(/^Cliente:\s*(.+)$/i);
    return match ? match[1] : e.direccionEntrega || '-';
  };

  const handleChangePageEntregas = (_event: unknown, newPage: number) => {
    setPageEntregas(newPage);
  };

  const handleChangeRowsPerPageEntregas = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageEntregas(parseInt(event.target.value, 10));
    setPageEntregas(0);
  };

  // Calcular métricas
  const totalEquipos = equipos.length;
  const equiposCompletados = equipos.filter(e => e.estado === 'COMPLETADO').length;
  const equiposEnProceso = equipos.filter(e => e.estado === 'EN_PROCESO').length;
  const equiposAsignados = equipos.filter(e => e.asignado).length;

  // Helpers para chips
  const getEstadoChip = (estado: EstadoFabricacion) => {
    switch (estado) {
      case 'EN_PROCESO':
        return <Chip label="En Proceso" color="info" size="small" icon={<ScheduleIcon />} />;
      case 'COMPLETADO':
        return <Chip label="Completado" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'CANCELADO':
        return <Chip label="Cancelado" color="error" size="small" icon={<CancelIcon />} />;
      default:
        return <Chip label={estado} color="default" size="small" />;
    }
  };

  const getTipoChip = (tipo: TipoEquipo) => {
    const colors: Record<TipoEquipo, 'primary' | 'secondary' | 'info' | 'default'> = {
      HELADERA: 'primary',
      COOLBOX: 'secondary',
      EXHIBIDOR: 'info',
      OTRO: 'default',
    };
    return <Chip label={tipo} color={colors[tipo]} size="small" variant="outlined" />;
  };

  const getAccionChip = (accion: string) => {
    switch (accion) {
      case 'CREADO':
        return <Chip label="Creado" color="info" size="small" icon={<BuildIcon />} />;
      case 'COMPLETADO':
        return <Chip label="Completado" color="success" size="small" icon={<CheckCircleIcon />} />;
      case 'CANCELADO':
        return <Chip label="Cancelado" color="error" size="small" icon={<CancelIcon />} />;
      case 'ASIGNADO':
        return <Chip label="Asignado a Cliente" color="success" size="small" icon={<PersonIcon />} />;
      case 'DESASIGNADO':
        return <Chip label="Desasignado" color="warning" size="small" icon={<RemoveCircleIcon />} />;
      default:
        return <Chip label={accion} color="default" size="small" />;
    }
  };

  const getMovimientoStockChip = (tipo: string) => {
    switch (tipo) {
      case 'SALIDA_FABRICACION':
        return <Chip label="Salida Fabricación" color="error" size="small" />;
      case 'REINGRESO_CANCELACION_FABRICACION':
        return <Chip label="Reingreso Cancelación" color="success" size="small" />;
      default:
        return <Chip label={tipo} color="default" size="small" />;
    }
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
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <Inventory2Icon />
          Gestión de Stock de Equipos
        </Typography>
        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={handleExportEquiposPDF}
          fullWidth={isMobile}
        >
          Exportar PDF
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fit, minmax(200px, 1fr))' }} gap={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Inventory2Icon color="primary" />
              <Box>
                <Typography variant="h4">{totalEquipos}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Equipos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={equiposCompletados} color="success">
                <CheckCircleIcon color="success" />
              </Badge>
              <Box>
                <Typography variant="h4">{equiposCompletados}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Equipos Completados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={equiposEnProceso} color="info">
                <ScheduleIcon color="info" />
              </Badge>
              <Box>
                <Typography variant="h4">{equiposEnProceso}</Typography>
                <Typography variant="body2" color="text.secondary">
                  En Proceso
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={equiposAsignados} color="secondary">
                <AssignmentIcon color="secondary" />
              </Badge>
              <Box>
                <Typography variant="h4">{equiposAsignados}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Asignados a Clientes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab label={isMobile ? 'Inventario' : 'Inventario de Equipos'} />
            <Tab label={isMobile ? 'Mov. Equipos' : 'Registro de Movimientos de Equipos'} icon={isMobile ? undefined : <HistoryIcon />} iconPosition="end" />
            <Tab label={isMobile ? 'Mov. Mat. Primas' : 'Movimientos de Materias Primas'} />
            <Tab label="Historial de Entregas" icon={<PersonIcon />} iconPosition="end" />
          </Tabs>
        </CardContent>
      </Card>

      {/* Tab Panel 0: Inventario de Equipos */}
      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Filtros</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchEquipos}
                onChange={(e) => setSearchEquipos(e.target.value)}
                placeholder="Buscar por número, modelo, cliente..."
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={tipoEquipoFilter}
                  label="Tipo"
                  onChange={(e) => setTipoEquipoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="HELADERA">Heladera</MenuItem>
                  <MenuItem value="COOLBOX">Coolbox</MenuItem>
                  <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={estadoEquipoFilter}
                  label="Estado"
                  onChange={(e) => setEstadoEquipoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                  <MenuItem value="COMPLETADO">Completado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Asignación</InputLabel>
                <Select
                  value={asignadoFilter}
                  label="Asignación"
                  onChange={(e) => setAsignadoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="asignado">Asignados</MenuItem>
                  <MenuItem value="no-asignado">No Asignados</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>Número Heladera</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Tipo</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Modelo</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Color</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Estado</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Asignado</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Fecha Creación</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEquipos.map((equipo) => (
                    <TableRow key={equipo.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {equipo.numeroHeladera}
                        </Typography>
                      </TableCell>
                      <TableCell>{getTipoChip(equipo.tipo)}</TableCell>
                      <TableCell>{equipo.modelo}</TableCell>
                      <TableCell>{equipo.color || '-'}</TableCell>
                      <TableCell>{getEstadoChip(equipo.estado)}</TableCell>
                      <TableCell align="center">
                        {equipo.asignado ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">No</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {equipo.clienteNombre ? (
                          <Typography variant="body2">{equipo.clienteNombre}</Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(equipo.fechaCreacion).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditEquipo(equipo)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEquipos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <Box textAlign="center" py={4}>
                          <Typography variant="body1" color="text.secondary">
                            No se encontraron equipos con los filtros aplicados
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredEquipos.length}
              page={pageEquipos}
              onPageChange={handleChangePageEquipos}
              rowsPerPage={rowsPerPageEquipos}
              onRowsPerPageChange={handleChangeRowsPerPageEquipos}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Registro de Movimientos de Equipos */}
      <TabPanel value={tabValue} index={1}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Filtros</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchMovimientos}
                onChange={(e) => setSearchMovimientos(e.target.value)}
                placeholder="Buscar por número, modelo, cliente..."
              />
              <FormControl fullWidth size="small">
                <InputLabel>Acción</InputLabel>
                <Select
                  value={accionFilter}
                  label="Acción"
                  onChange={(e) => setAccionFilter(e.target.value)}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="CREADO">Creado</MenuItem>
                  <MenuItem value="COMPLETADO">Completado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                  <MenuItem value="ASIGNADO">Asignado</MenuItem>
                  <MenuItem value="DESASIGNADO">Desasignado</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Equipo</InputLabel>
                <Select
                  value={tipoMovimientoFilter}
                  label="Tipo de Equipo"
                  onChange={(e) => setTipoMovimientoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="HELADERA">Heladera</MenuItem>
                  <MenuItem value="COOLBOX">Coolbox</MenuItem>
                  <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <HistoryIcon />
              Historial de Movimientos de Equipos
            </Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150 }}>Fecha</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Nº Heladera</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Tipo</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Modelo</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Acción</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Responsable</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMovimientos.map((movimiento) => (
                    <TableRow key={movimiento.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(movimiento.fecha).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(movimiento.fecha).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {movimiento.numeroHeladera}
                        </Typography>
                      </TableCell>
                      <TableCell>{getTipoChip(movimiento.tipo)}</TableCell>
                      <TableCell>{movimiento.modelo}</TableCell>
                      <TableCell>{getAccionChip(movimiento.accion)}</TableCell>
                      <TableCell>
                        {movimiento.clienteNombre || (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {movimiento.responsableNombre || (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {movimiento.observaciones || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMovimientos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Box textAlign="center" py={4}>
                          <Typography variant="body1" color="text.secondary">
                            No se encontraron movimientos con los filtros aplicados
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredMovimientos.length}
              page={pageMovimientos}
              onPageChange={handleChangePageMovimientos}
              rowsPerPage={rowsPerPageMovimientos}
              onRowsPerPageChange={handleChangeRowsPerPageMovimientos}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 2: Movimientos de Materias Primas */}
      <TabPanel value={tabValue} index={2}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Filtros</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchMateriasPrimas}
                onChange={(e) => setSearchMateriasPrimas(e.target.value)}
                placeholder="Buscar por producto, heladera, concepto..."
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  value={tipoMPFilter}
                  label="Tipo de Movimiento"
                  onChange={(e) => setTipoMPFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="SALIDA_FABRICACION">Salida Fabricación</MenuItem>
                  <MenuItem value="REINGRESO_CANCELACION_FABRICACION">Reingreso Cancelación</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Movimientos de Stock de Materias Primas (Fabricación)
            </Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 800, md: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150 }}>Fecha</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Tipo Movimiento</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Producto</TableCell>
                    <TableCell sx={{ minWidth: 100 }} align="center">Cantidad</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Nº Heladera</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Concepto</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Comprobante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMateriasPrimas.map((movimiento) => (
                      <TableRow key={movimiento.id}>
                        <TableCell>
                          {new Date(movimiento.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getMovimientoStockChip(movimiento.tipo)}
                        </TableCell>
                        <TableCell>{movimiento.productoNombre || 'N/A'}</TableCell>
                        <TableCell align="center">
                          <Typography
                            fontWeight="bold"
                            color={
                              movimiento.tipo === 'REINGRESO_CANCELACION_FABRICACION'
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {movimiento.tipo === 'REINGRESO_CANCELACION_FABRICACION'
                              ? '+' + Math.abs(movimiento.cantidad)
                              : '-' + Math.abs(movimiento.cantidad)
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {movimiento.equipoFabricadoNumero || '-'}
                        </TableCell>
                        <TableCell>{movimiento.concepto}</TableCell>
                        <TableCell>{movimiento.numeroComprobante || '-'}</TableCell>
                      </TableRow>
                    ))}
                  {filteredMateriasPrimas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box textAlign="center" py={4}>
                          <Typography variant="body1" color="text.secondary">
                            No se encontraron movimientos de materias primas con los filtros aplicados
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredMateriasPrimas.length}
              page={pageMateriasPrimas}
              onPageChange={handleChangePageMateriasPrimas}
              rowsPerPage={rowsPerPageMateriasPrimas}
              onRowsPerPageChange={handleChangeRowsPerPageMateriasPrimas}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 3: Historial de Entregas */}
      <TabPanel value={tabValue} index={3}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">Filtros</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchEntregas}
                onChange={(e) => setSearchEntregas(e.target.value)}
                placeholder="Buscar por número, modelo, cliente, receptor, DNI..."
              />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Entregas Completadas ({filteredEntregas.length})
              </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 140 }}>Fecha Entrega</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Comprobante</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Receptor</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>DNI Receptor</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEntregas.map((entrega) => (
                    <TableRow key={entrega.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(entrega.fechaEntrega).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {getClienteNombreEntrega(entrega)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entrega.documentoComercial?.numeroDocumento || (entrega.documentoComercialId ? `#${entrega.documentoComercialId}` : '-')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" color="primary">
                          {entrega.receptorNombre || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {entrega.receptorDni || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {entrega.observaciones || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEntregas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box textAlign="center" py={4}>
                          <Typography variant="body1" color="text.secondary">
                            No se encontraron entregas completadas
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredEntregas.length}
              page={pageEntregas}
              onPageChange={handleChangePageEntregas}
              rowsPerPage={rowsPerPageEntregas}
              onRowsPerPageChange={handleChangeRowsPerPageEntregas}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Editar Equipo: {selectedEquipo?.numeroHeladera}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Modelo"
              value={editForm.modelo}
              onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Color"
              value={editForm.color}
              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
              fullWidth
            />

            <TextField
              label="Observaciones"
              value={editForm.observaciones}
              onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={editForm.estado}
                label="Estado"
                onChange={(e) => setEditForm({ ...editForm, estado: e.target.value as EstadoFabricacion })}
              >
                <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                <MenuItem value="COMPLETADO">Completado</MenuItem>
                <MenuItem value="CANCELADO">Cancelado</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Número Heladera: <strong>{selectedEquipo?.numeroHeladera}</strong>
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                Tipo: <strong>{selectedEquipo?.tipo}</strong>
              </Typography>
              <br />
              {selectedEquipo?.clienteNombre && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Cliente: <strong>{selectedEquipo.clienteNombre}</strong>
                  </Typography>
                  <br />
                </>
              )}
              <Typography variant="caption" color="text.secondary">
                Creado: <strong>{selectedEquipo && new Date(selectedEquipo.fechaCreacion).toLocaleDateString()}</strong>
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockEquiposPage;