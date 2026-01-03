import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  TablePagination,
  Switch,
  FormControlLabel,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  CheckCircle as ReceiveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { transferenciaApi, depositoApi, stockDepositoApi, equipoFabricadoApi } from '../../../api/services';
import { useAuth } from '../../../context/AuthContext';
import type {
  TransferenciaDepositoDTO,
  TransferenciaCreateDTO,
  ConfirmarRecepcionDTO,
  EstadoTransferencia,
  Deposito,
  StockDeposito,
  EquipoFabricadoDTO,
} from '../../../types';

dayjs.locale('es');

const TransferenciasPage: React.FC = () => {
  const { user } = useAuth();
  const [transferencias, setTransferencias] = useState<TransferenciaDepositoDTO[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [depositoFilter, setDepositoFilter] = useState<string>('all');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedTransferencia, setSelectedTransferencia] = useState<TransferenciaDepositoDTO | null>(null);

  // Form para crear transferencia
  const [newTransferencia, setNewTransferencia] = useState<{
    depositoOrigenId: number | '';
    depositoDestinoId: number | '';
    fechaTransferencia: Dayjs;
    observaciones: string;
    items: Array<{
      tipo: 'PRODUCTO' | 'EQUIPO';
      productoId?: number;
      equipoFabricadoId?: number;
      cantidad?: number;
      productoNombre?: string;
      equipoNumero?: string;
    }>;
  }>({
    depositoOrigenId: '',
    depositoDestinoId: '',
    fechaTransferencia: dayjs(),
    observaciones: '',
    items: [],
  });

  // Estados para selección de productos/equipos
  const [stocksDisponibles, setStocksDisponibles] = useState<StockDeposito[]>([]);
  const [equiposDisponibles, setEquiposDisponibles] = useState<EquipoFabricadoDTO[]>([]);
  const [selectedItemType, setSelectedItemType] = useState<'PRODUCTO' | 'EQUIPO'>('PRODUCTO');

  // Estados para recepción mejorada
  interface ItemRecepcion {
    detalleId: number;
    productoId?: number;
    equipoFabricadoId?: number;
    nombreItem: string;
    cantidadSolicitada: number;
    cantidadRecibida: number;
    distribuciones: Array<{
      depositoId: number;
      depositoNombre: string;
      cantidad: number;
    }>;
    observaciones: string;
  }

  const [recepcionData, setRecepcionData] = useState<{
    fechaRecepcion: Dayjs;
    items: ItemRecepcion[];
    usarDistribucionMultiple: boolean;
  }>({
    fechaRecepcion: dayjs(),
    items: [],
    usarDistribucionMultiple: false,
  });

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transferenciasData, depositosData] = await Promise.all([
        transferenciaApi.getAll({ empresaId: user?.empresaId }),
        depositoApi.getAll(),
      ]);

      // Handle paginated or array responses
      const transferenciasArray = Array.isArray(transferenciasData) 
        ? transferenciasData 
        : (transferenciasData as any)?.content || [];
      const depositosArray = Array.isArray(depositosData) 
        ? depositosData 
        : (depositosData as any)?.content || [];

      setTransferencias(transferenciasArray);
      setDepositos(depositosArray.filter((d: any) => d.activo));
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadStocksDisponibles = async (depositoId: number) => {
    try {
      const stocksData = await stockDepositoApi.getByDeposito(depositoId);
      const stocksArray = Array.isArray(stocksData) 
        ? stocksData 
        : (stocksData as any)?.content || [];
      setStocksDisponibles(stocksArray.filter((s: any) => s.cantidad > 0));
    } catch (err) {
      console.error('Error loading stocks:', err);
    }
  };

  const loadEquiposDisponibles = async (depositoId: number) => {
    try {
      // Llamar al API que obtenga equipos en un depósito específico
      // Por ahora usamos un filtro local
      const equipos = await equipoFabricadoApi.findAll(0, 1000);
      const equiposArray = Array.isArray(equipos) 
        ? equipos 
        : equipos?.content || [];
      setEquiposDisponibles(
        equiposArray.filter(
          (e: any) => e.estado === 'COMPLETADO' && !e.asignado
        )
      );
    } catch (err) {
      console.error('Error loading equipos:', err);
    }
  };

  const handleCreateTransferencia = async () => {
    if (!newTransferencia.depositoOrigenId || !newTransferencia.depositoDestinoId) {
      setError('Debe seleccionar depósito origen y destino');
      return;
    }

    if (newTransferencia.items.length === 0) {
      setError('Debe agregar al menos un ítem a la transferencia');
      return;
    }

    try {
      setLoading(true);

      const dto: TransferenciaCreateDTO = {
        depositoOrigenId: newTransferencia.depositoOrigenId as number,
        depositoDestinoId: newTransferencia.depositoDestinoId as number,
        fechaTransferencia: newTransferencia.fechaTransferencia.toISOString(),
        observaciones: newTransferencia.observaciones,
        usuarioSolicitudId: user?.id || 0,
        items: newTransferencia.items.map(item => ({
          productoId: item.productoId,
          equipoFabricadoId: item.equipoFabricadoId,
          cantidad: item.cantidad,
        })),
      };

      await transferenciaApi.create(dto);
      setSuccess('Transferencia creada correctamente');
      setCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Error creating transferencia:', err);
      setError(err.response?.data?.message || 'Error al crear la transferencia');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar datos de recepción cuando se abre el diálogo
  const inicializarRecepcion = (transferencia: TransferenciaDepositoDTO) => {
    const items: ItemRecepcion[] = transferencia.items.map(item => ({
      detalleId: item.id!,
      productoId: item.productoId,
      equipoFabricadoId: item.equipoFabricadoId,
      nombreItem: item.productoId
        ? `${item.productoNombre} (${item.productoCodigo})`
        : `Equipo: ${item.equipoNumero}`,
      cantidadSolicitada: item.cantidadSolicitada,
      cantidadRecibida: item.cantidadSolicitada, // Por defecto, recibir todo
      distribuciones: [],
      observaciones: '',
    }));

    setRecepcionData({
      fechaRecepcion: dayjs(),
      items,
      usarDistribucionMultiple: false,
    });
  };

  const resetRecepcionData = () => {
    setRecepcionData({
      fechaRecepcion: dayjs(),
      items: [],
      usarDistribucionMultiple: false,
    });
    setExpandedItems(new Set());
  };

  const validarDistribuciones = (items: ItemRecepcion[]): string[] => {
    const errores: string[] = [];

    items.forEach((item) => {
      if (item.cantidadRecibida === 0) return;

      const sumaDistribuciones = item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0);

      if (sumaDistribuciones !== item.cantidadRecibida) {
        errores.push(
          `${item.nombreItem}: suma de distribuciones (${sumaDistribuciones}) ≠ cantidad recibida (${item.cantidadRecibida})`
        );
      }

      // Validar depósitos duplicados
      const depositosIds = item.distribuciones.map(d => d.depositoId);
      const duplicados = depositosIds.filter((id, idx) => depositosIds.indexOf(id) !== idx);
      if (duplicados.length > 0) {
        errores.push(`${item.nombreItem}: depósito duplicado`);
      }
    });

    return errores;
  };

  const handleConfirmarEnvio = async (id: number) => {
    if (!window.confirm('¿Confirmar envío de esta transferencia? Esta acción descontará el stock del depósito origen.')) {
      return;
    }

    try {
      setLoading(true);
      await transferenciaApi.confirmarEnvio(id);
      setSuccess('Transferencia enviada correctamente');
      await loadData();
    } catch (err: any) {
      console.error('Error confirming envío:', err);
      setError(err.response?.data?.message || 'Error al confirmar el envío');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRecepcion = async () => {
    if (!selectedTransferencia) return;

    // Validar que al menos un item tenga cantidad > 0
    const tieneItemsRecibidos = recepcionData.items.some(item => item.cantidadRecibida > 0);
    if (!tieneItemsRecibidos) {
      setError('Debe recibir al menos un item');
      return;
    }

    // Validar distribuciones si están habilitadas
    if (recepcionData.usarDistribucionMultiple) {
      const erroresDistribucion = validarDistribuciones(recepcionData.items);
      if (erroresDistribucion.length > 0) {
        setError(erroresDistribucion.join(', '));
        return;
      }
    }

    try {
      setLoading(true);

      const dto: ConfirmarRecepcionDTO = {
        transferenciaId: selectedTransferencia.id!,
        fechaRecepcion: recepcionData.fechaRecepcion.toISOString(),
        usuarioRecepcionId: user?.id || 0,
        items: recepcionData.items.map(item => ({
          id: item.detalleId,
          cantidadRecibida: item.cantidadRecibida,
          observaciones: item.observaciones,
          // Si hay distribuciones, incluirlas
          distribucionDepositos: recepcionData.usarDistribucionMultiple && item.distribuciones.length > 0
            ? item.distribuciones.map(d => ({
                depositoId: d.depositoId,
                cantidad: d.cantidad
              }))
            : undefined
        }))
      };

      await transferenciaApi.confirmarRecepcion(dto);
      setSuccess('Recepción confirmada correctamente');
      setReceiveDialogOpen(false);
      resetRecepcionData();
      setSelectedTransferencia(null);
      await loadData();
    } catch (err: any) {
      console.error('Error confirming recepción:', err);
      setError(err.response?.data?.message || 'Error al confirmar la recepción');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarTransferencia = async (id: number) => {
    const motivo = window.prompt('Ingrese el motivo de la cancelación:');
    if (!motivo) return;

    try {
      setLoading(true);
      await transferenciaApi.cancelar(id, motivo);
      setSuccess('Transferencia cancelada correctamente');
      await loadData();
    } catch (err: any) {
      console.error('Error cancelling transferencia:', err);
      setError(err.response?.data?.message || 'Error al cancelar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarItem = () => {
    if (selectedItemType === 'PRODUCTO') {
      setNewTransferencia(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            tipo: 'PRODUCTO',
            productoId: undefined,
            cantidad: 1,
          },
        ],
      }));
    } else {
      setNewTransferencia(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            tipo: 'EQUIPO',
            equipoFabricadoId: undefined,
          },
        ],
      }));
    }
  };

  const handleEliminarItem = (index: number) => {
    setNewTransferencia(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setNewTransferencia(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          // Si se selecciona un producto, buscar su información
          if (field === 'productoId') {
            const stock = stocksDisponibles.find(s => s.productoId === value);
            return {
              ...item,
              productoId: value,
              productoNombre: stock?.productoNombre,
            };
          }
          // Si se selecciona un equipo, buscar su información
          if (field === 'equipoFabricadoId') {
            const equipo = equiposDisponibles.find(e => e.id === value);
            return {
              ...item,
              equipoFabricadoId: value,
              equipoNumero: equipo?.numeroHeladera,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    }));
  };

  const resetForm = () => {
    setNewTransferencia({
      depositoOrigenId: '',
      depositoDestinoId: '',
      fechaTransferencia: dayjs(),
      observaciones: '',
      items: [],
    });
    setStocksDisponibles([]);
    setEquiposDisponibles([]);
  };

  const getEstadoChip = (estado: EstadoTransferencia) => {
    const chipProps: Record<EstadoTransferencia, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' }> = {
      PENDIENTE: { label: 'Pendiente', color: 'warning' },
      EN_TRANSITO: { label: 'En Tránsito', color: 'info' },
      RECIBIDA: { label: 'Recibida', color: 'success' },
      CANCELADA: { label: 'Cancelada', color: 'error' },
    };

    const props = chipProps[estado];
    return <Chip label={props.label} color={props.color} size="small" />;
  };

  const filteredTransferencias = transferencias.filter(t => {
    const matchesEstado = estadoFilter === 'all' || t.estado === estadoFilter;
    const matchesDeposito =
      depositoFilter === 'all' ||
      t.depositoOrigenId === Number(depositoFilter) ||
      t.depositoDestinoId === Number(depositoFilter);
    return matchesEstado && matchesDeposito;
  });

  const paginatedTransferencias = filteredTransferencias.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading && transferencias.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" display="flex" alignItems="center" gap={1}>
            <ShippingIcon />
            Transferencias entre Depósitos
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Nueva Transferencia
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={estadoFilter}
                    label="Estado"
                    onChange={(e) => setEstadoFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                    <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
                    <MenuItem value="RECIBIDA">Recibida</MenuItem>
                    <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Depósito</InputLabel>
                  <Select
                    value={depositoFilter}
                    label="Depósito"
                    onChange={(e) => setDepositoFilter(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {depositos.map(d => (
                      <MenuItem key={d.id} value={d.id.toString()}>
                        {d.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de Transferencias */}
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Destino</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTransferencias.map(transferencia => (
                    <TableRow key={transferencia.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {transferencia.numero}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {dayjs(transferencia.fechaTransferencia).format('DD/MM/YYYY HH:mm')}
                      </TableCell>
                      <TableCell>{transferencia.depositoOrigenNombre}</TableCell>
                      <TableCell>{transferencia.depositoDestinoNombre}</TableCell>
                      <TableCell>{getEstadoChip(transferencia.estado)}</TableCell>
                      <TableCell>{transferencia.items.length}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transferencia.usuarioSolicitudNombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTransferencia(transferencia);
                                setViewDialogOpen(true);
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>

                          {transferencia.estado === 'PENDIENTE' && (
                            <>
                              <Tooltip title="Confirmar envío">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleConfirmarEnvio(transferencia.id!)}
                                >
                                  <SendIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelarTransferencia(transferencia.id!)}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {transferencia.estado === 'EN_TRANSITO' && (
                            <>
                              <Tooltip title="Confirmar recepción">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setSelectedTransferencia(transferencia);
                                    inicializarRecepcion(transferencia);
                                    setReceiveDialogOpen(true);
                                  }}
                                >
                                  <ReceiveIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelarTransferencia(transferencia.id!)}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedTransferencias.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography variant="body2" color="text.secondary" py={4}>
                          No se encontraron transferencias
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredTransferencias.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </CardContent>
        </Card>

        {/* Diálogo: Crear Transferencia */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nueva Transferencia</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Depósito Origen</InputLabel>
                    <Select
                      value={newTransferencia.depositoOrigenId}
                      label="Depósito Origen"
                      onChange={(e) => {
                        const depositoId = e.target.value as number;
                        setNewTransferencia(prev => ({
                          ...prev,
                          depositoOrigenId: depositoId,
                        }));
                        if (depositoId) {
                          loadStocksDisponibles(depositoId);
                          loadEquiposDisponibles(depositoId);
                        }
                      }}
                    >
                      {depositos.map(d => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Depósito Destino</InputLabel>
                    <Select
                      value={newTransferencia.depositoDestinoId}
                      label="Depósito Destino"
                      onChange={(e) =>
                        setNewTransferencia(prev => ({
                          ...prev,
                          depositoDestinoId: e.target.value as number,
                        }))
                      }
                      disabled={!newTransferencia.depositoOrigenId}
                    >
                      {depositos
                        .filter(d => d.id !== newTransferencia.depositoOrigenId)
                        .map(d => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <DateTimePicker
                label="Fecha de Transferencia"
                value={newTransferencia.fechaTransferencia}
                onChange={(newValue) =>
                  setNewTransferencia(prev => ({
                    ...prev,
                    fechaTransferencia: newValue || dayjs(),
                  }))
                }
                slotProps={{ textField: { fullWidth: true } }}
              />

              <TextField
                label="Observaciones"
                multiline
                rows={3}
                value={newTransferencia.observaciones}
                onChange={(e) =>
                  setNewTransferencia(prev => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                fullWidth
              />

              {/* Sección de Items */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Items a Transferir</Typography>
                  <Box display="flex" gap={1}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Tipo de Item</InputLabel>
                      <Select
                        value={selectedItemType}
                        label="Tipo de Item"
                        onChange={(e) => setSelectedItemType(e.target.value as 'PRODUCTO' | 'EQUIPO')}
                      >
                        <MenuItem value="PRODUCTO">Producto</MenuItem>
                        <MenuItem value="EQUIPO">Equipo</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAgregarItem}
                      disabled={!newTransferencia.depositoOrigenId}
                    >
                      Agregar Item
                    </Button>
                  </Box>
                </Box>

                {newTransferencia.items.map((item, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={item.tipo === 'PRODUCTO' ? 5 : 8}>
                        <FormControl fullWidth size="small">
                          <InputLabel>
                            {item.tipo === 'PRODUCTO' ? 'Producto' : 'Equipo'}
                          </InputLabel>
                          <Select
                            value={item.tipo === 'PRODUCTO' ? item.productoId || '' : item.equipoFabricadoId || ''}
                            label={item.tipo === 'PRODUCTO' ? 'Producto' : 'Equipo'}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                item.tipo === 'PRODUCTO' ? 'productoId' : 'equipoFabricadoId',
                                e.target.value
                              )
                            }
                          >
                            {item.tipo === 'PRODUCTO'
                              ? stocksDisponibles.map(s => (
                                  <MenuItem key={s.productoId} value={s.productoId}>
                                    {s.productoNombre} (Stock: {s.cantidad})
                                  </MenuItem>
                                ))
                              : equiposDisponibles.map(e => (
                                  <MenuItem key={e.id} value={e.id}>
                                    {e.numeroHeladera} - {e.modelo}
                                  </MenuItem>
                                ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {item.tipo === 'PRODUCTO' && (
                        <Grid item xs={12} md={5}>
                          <TextField
                            label="Cantidad"
                            type="number"
                            size="small"
                            value={item.cantidad || 1}
                            onChange={(e) =>
                              handleUpdateItem(index, 'cantidad', parseInt(e.target.value))
                            }
                            inputProps={{
                              min: 1,
                              max: stocksDisponibles.find(s => s.productoId === item.productoId)?.cantidad || 999,
                            }}
                            fullWidth
                          />
                        </Grid>
                      )}

                      <Grid item xs={12} md={2}>
                        <IconButton
                          color="error"
                          onClick={() => handleEliminarItem(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Card>
                ))}

                {newTransferencia.items.length === 0 && (
                  <Alert severity="info">
                    Agregue al menos un item para crear la transferencia
                  </Alert>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTransferencia}
              disabled={
                loading ||
                !newTransferencia.depositoOrigenId ||
                !newTransferencia.depositoDestinoId ||
                newTransferencia.items.length === 0
              }
            >
              Crear Transferencia
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo: Ver Detalle */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Detalle de Transferencia: {selectedTransferencia?.numero}
          </DialogTitle>
          <DialogContent>
            {selectedTransferencia && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Depósito Origen
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedTransferencia.depositoOrigenNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Depósito Destino
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedTransferencia.depositoDestinoNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de Transferencia
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(selectedTransferencia.fechaTransferencia).format('DD/MM/YYYY HH:mm')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Estado
                    </Typography>
                    <Box mt={0.5}>{getEstadoChip(selectedTransferencia.estado)}</Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Usuario Solicitud
                    </Typography>
                    <Typography variant="body1">
                      {selectedTransferencia.usuarioSolicitudNombre}
                    </Typography>
                  </Grid>
                  {selectedTransferencia.observaciones && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Observaciones
                      </Typography>
                      <Typography variant="body1">
                        {selectedTransferencia.observaciones}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Typography variant="h6" mb={2}>
                  Items
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center">Cantidad Solicitada</TableCell>
                        <TableCell align="center">Cantidad Recibida</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTransferencia.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Chip
                              label={item.productoId ? 'Producto' : 'Equipo'}
                              size="small"
                              color={item.productoId ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            {item.productoId
                              ? `${item.productoNombre} (${item.productoCodigo})`
                              : `Equipo: ${item.equipoNumero}`}
                          </TableCell>
                          <TableCell align="center">
                            {item.cantidadSolicitada || '-'}
                          </TableCell>
                          <TableCell align="center">
                            {item.cantidadRecibida || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo: Confirmar Recepción Mejorado */}
        <Dialog
          open={receiveDialogOpen}
          onClose={() => {
            setReceiveDialogOpen(false);
            resetRecepcionData();
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Confirmar Recepción - {selectedTransferencia?.numero}
              </Typography>
              {selectedTransferencia && (
                <Typography variant="body2" color="text.secondary">
                  {selectedTransferencia.depositoOrigenNombre} → {selectedTransferencia.depositoDestinoNombre}
                </Typography>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {/* Toggle para distribución multi-depósito */}
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={recepcionData.usarDistribucionMultiple}
                      onChange={(e) =>
                        setRecepcionData(prev => ({
                          ...prev,
                          usarDistribucionMultiple: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Habilitar distribución a múltiples depósitos"
                />
                <DateTimePicker
                  label="Fecha de Recepción"
                  value={recepcionData.fechaRecepcion}
                  onChange={(newValue) =>
                    setRecepcionData(prev => ({
                      ...prev,
                      fechaRecepcion: newValue || dayjs(),
                    }))
                  }
                  slotProps={{ textField: { size: 'small', sx: { width: 250 } } }}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Tabla de Items */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={40}></TableCell>
                      <TableCell>Producto/Equipo</TableCell>
                      <TableCell align="center" width={120}>Solicitada</TableCell>
                      <TableCell align="center" width={120}>A Recibir</TableCell>
                      <TableCell align="center" width={100}>Diferencia</TableCell>
                      <TableCell width={200}>Observaciones</TableCell>
                      {recepcionData.usarDistribucionMultiple && (
                        <TableCell align="center" width={120}>Distribución</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recepcionData.items.map((item, index) => (
                      <React.Fragment key={index}>
                        <TableRow>
                          <TableCell>
                            {recepcionData.usarDistribucionMultiple && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newExpanded = new Set(expandedItems);
                                  if (newExpanded.has(index)) {
                                    newExpanded.delete(index);
                                  } else {
                                    newExpanded.add(index);
                                  }
                                  setExpandedItems(newExpanded);
                                }}
                              >
                                {expandedItems.has(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.nombreItem}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={item.cantidadSolicitada} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={item.cantidadRecibida}
                              onChange={(e) => {
                                const valor = parseInt(e.target.value) || 0;
                                const newItems = [...recepcionData.items];
                                newItems[index].cantidadRecibida = Math.max(0, Math.min(valor, item.cantidadSolicitada));
                                setRecepcionData(prev => ({ ...prev, items: newItems }));
                              }}
                              inputProps={{
                                min: 0,
                                max: item.cantidadSolicitada,
                                style: { textAlign: 'center' }
                              }}
                              sx={{ width: 80 }}
                              error={item.cantidadRecibida > item.cantidadSolicitada}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.cantidadRecibida - item.cantidadSolicitada}
                              size="small"
                              color={
                                item.cantidadRecibida === item.cantidadSolicitada
                                  ? 'success'
                                  : item.cantidadRecibida < item.cantidadSolicitada
                                  ? 'warning'
                                  : 'error'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Observaciones..."
                              value={item.observaciones}
                              onChange={(e) => {
                                const newItems = [...recepcionData.items];
                                newItems[index].observaciones = e.target.value;
                                setRecepcionData(prev => ({ ...prev, items: newItems }));
                              }}
                            />
                          </TableCell>
                          {recepcionData.usarDistribucionMultiple && (
                            <TableCell align="center">
                              {item.distribuciones.length > 0 && (
                                <Chip
                                  label={`${item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0)} / ${item.cantidadRecibida}`}
                                  size="small"
                                  color={
                                    item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0) === item.cantidadRecibida
                                      ? 'success'
                                      : 'warning'
                                  }
                                  icon={
                                    item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0) !== item.cantidadRecibida
                                      ? <WarningIcon />
                                      : undefined
                                  }
                                />
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                        {/* Panel de distribución expandible */}
                        {recepcionData.usarDistribucionMultiple && (
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: expandedItems.has(index) ? 1 : 0 }}>
                              <Collapse in={expandedItems.has(index)}>
                                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Distribución por Depósito - {item.nombreItem}
                                  </Typography>
                                  <Grid container spacing={2}>
                                    {item.distribuciones.map((dist, distIndex) => (
                                      <Grid item xs={12} md={6} key={distIndex}>
                                        <Card variant="outlined">
                                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                            <Grid container spacing={2} alignItems="center">
                                              <Grid item xs={7}>
                                                <FormControl fullWidth size="small">
                                                  <InputLabel>Depósito</InputLabel>
                                                  <Select
                                                    value={dist.depositoId}
                                                    label="Depósito"
                                                    onChange={(e) => {
                                                      const deposito = depositos.find(d => d.id === e.target.value);
                                                      const newItems = [...recepcionData.items];
                                                      newItems[index].distribuciones[distIndex] = {
                                                        depositoId: e.target.value as number,
                                                        depositoNombre: deposito?.nombre || '',
                                                        cantidad: dist.cantidad,
                                                      };
                                                      setRecepcionData(prev => ({ ...prev, items: newItems }));
                                                    }}
                                                  >
                                                    {depositos.map(d => (
                                                      <MenuItem key={d.id} value={d.id}>
                                                        {d.nombre}
                                                      </MenuItem>
                                                    ))}
                                                  </Select>
                                                </FormControl>
                                              </Grid>
                                              <Grid item xs={3}>
                                                <TextField
                                                  type="number"
                                                  size="small"
                                                  label="Cantidad"
                                                  value={dist.cantidad}
                                                  onChange={(e) => {
                                                    const valor = parseInt(e.target.value) || 0;
                                                    const newItems = [...recepcionData.items];
                                                    newItems[index].distribuciones[distIndex].cantidad = Math.max(0, valor);
                                                    setRecepcionData(prev => ({ ...prev, items: newItems }));
                                                  }}
                                                  inputProps={{ min: 0 }}
                                                  fullWidth
                                                />
                                              </Grid>
                                              <Grid item xs={2}>
                                                <IconButton
                                                  size="small"
                                                  color="error"
                                                  onClick={() => {
                                                    const newItems = [...recepcionData.items];
                                                    newItems[index].distribuciones.splice(distIndex, 1);
                                                    setRecepcionData(prev => ({ ...prev, items: newItems }));
                                                  }}
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Grid>
                                            </Grid>
                                          </CardContent>
                                        </Card>
                                      </Grid>
                                    ))}
                                    <Grid item xs={12}>
                                      <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                          const newItems = [...recepcionData.items];
                                          newItems[index].distribuciones.push({
                                            depositoId: 0,
                                            depositoNombre: '',
                                            cantidad: 0,
                                          });
                                          setRecepcionData(prev => ({ ...prev, items: newItems }));
                                        }}
                                      >
                                        Agregar Depósito
                                      </Button>
                                      <Typography variant="caption" sx={{ ml: 2 }} color={
                                        item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0) === item.cantidadRecibida
                                          ? 'success.main'
                                          : 'warning.main'
                                      }>
                                        Total distribuido: {item.distribuciones.reduce((sum, d) => sum + d.cantidad, 0)} / {item.cantidadRecibida}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Resumen */}
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Resumen:</strong>{' '}
                    {recepcionData.items.filter(i => i.cantidadRecibida !== i.cantidadSolicitada).length} de{' '}
                    {recepcionData.items.length} items con diferencias
                  </Typography>
                  {recepcionData.usarDistribucionMultiple && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Nota:</strong> La distribución a múltiples depósitos requiere que la suma de cantidades distribuidas sea igual a la cantidad recibida para cada item.
                    </Typography>
                  )}
                </Alert>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setReceiveDialogOpen(false);
              resetRecepcionData();
            }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleConfirmarRecepcion}
              disabled={loading || recepcionData.items.length === 0}
            >
              Confirmar Recepción
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TransferenciasPage;
