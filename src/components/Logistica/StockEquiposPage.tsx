import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import { movimientoStockFabricacionApi } from '../../api/services/movimientoStockFabricacionApi';
import type { 
  EquipoFabricadoDTO,
  TipoEquipo, 
  EstadoFabricacion,
  MovimientoStock,
} from '../../types';

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
  const [equipos, setEquipos] = useState<EquipoFabricadoDTO[]>([]);
  const [movimientosStock, setMovimientosStock] = useState<MovimientoStock[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [equiposData, movimientosData] = await Promise.all([
        equipoFabricadoApi.findAll(0, 1000),
        movimientoStockFabricacionApi.findAll(),
      ]);

      setEquipos(equiposData.content || equiposData || []);
      setMovimientosStock(movimientosData || []);
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

  const historialMovimientos = generarHistorialMovimientos(equipos);

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <Inventory2Icon />
          Gestión de Stock de Equipos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={3} sx={{ mb: 3 }}>
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
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Inventario de Equipos" />
            <Tab label="Registro de Movimientos de Equipos" icon={<HistoryIcon />} iconPosition="end" />
            <Tab label="Movimientos de Materias Primas" />
          </Tabs>
        </CardContent>
      </Card>

      {/* Tab Panel 0: Inventario de Equipos */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número Heladera</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Asignado</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha Creación</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipos.map((equipo) => (
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
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 1: Registro de Movimientos de Equipos */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
              <HistoryIcon />
              Historial de Movimientos de Equipos
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Nº Heladera</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Acción</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Responsable</TableCell>
                    <TableCell>Observaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historialMovimientos.map((movimiento) => (
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
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab Panel 2: Movimientos de Materias Primas */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Movimientos de Stock de Materias Primas (Fabricación)
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo Movimiento</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell>Nº Heladera</TableCell>
                    <TableCell>Concepto</TableCell>
                    <TableCell>Comprobante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientosStock
                    .filter(m => 
                      m.tipo === 'SALIDA_FABRICACION' || 
                      m.tipo === 'REINGRESO_CANCELACION_FABRICACION'
                    )
                    .map((movimiento) => (
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
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
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