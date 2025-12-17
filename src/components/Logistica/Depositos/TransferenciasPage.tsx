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

    try {
      setLoading(true);

      const dto: ConfirmarRecepcionDTO = {
        transferenciaId: selectedTransferencia.id!,
        fechaRecepcion: dayjs().toISOString(),
        usuarioRecepcionId: user?.id || 0,
        items: selectedTransferencia.items.map(item => ({
          id: item.id!,
          cantidadRecibida: item.cantidadSolicitada,
          observaciones: '',
        })),
      };

      await transferenciaApi.confirmarRecepcion(dto);
      setSuccess('Recepción confirmada correctamente');
      setReceiveDialogOpen(false);
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

        {/* Diálogo: Confirmar Recepción */}
        <Dialog open={receiveDialogOpen} onClose={() => setReceiveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Confirmar Recepción</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mt: 2 }}>
              ¿Confirmar la recepción de esta transferencia en el depósito destino? Esta acción
              actualizará el stock y no podrá deshacerse.
            </Alert>
            {selectedTransferencia && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Transferencia:</strong> {selectedTransferencia.numero}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Depósito Destino:</strong> {selectedTransferencia.depositoDestinoNombre}
                </Typography>
                <Typography variant="body2">
                  <strong>Items:</strong> {selectedTransferencia.items.length}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReceiveDialogOpen(false)}>Cancelar</Button>
            <Button variant="contained" color="success" onClick={handleConfirmarRecepcion} disabled={loading}>
              Confirmar Recepción
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TransferenciasPage;
