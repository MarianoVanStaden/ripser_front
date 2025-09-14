import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Stack,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { saleApi, clienteApi, usuarioApi, productApi } from '../../api/services';
import type { Venta, Cliente, Usuario, PaymentMethod, DetalleVenta } from '../../types';

const formatMoney = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RegistroVentasPage: React.FC = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));

  const [sales, setSales] = useState<Venta[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Venta | null>(null);
  const [ventaToDelete, setVentaToDelete] = useState<Venta | null>(null);
  const [editingSale, setEditingSale] = useState<Venta | null>(null);
  const [editForm, setEditForm] = useState({
    numeroVenta: '',
    clienteId: '',
    usuarioId: '',
    estado: '',
    metodoPago: 'EFECTIVO' as PaymentMethod,
    fechaVenta: '',
    notas: '',
    total: 0,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [salesResponse, clientsResponse, usuariosResponse, productsResponse] = await Promise.all([
        saleApi.getAll(),
        clienteApi.getAll(),
        usuarioApi.getAll(),
        productApi.getAll(),
      ]);

      const salesData = Array.isArray(salesResponse) ? salesResponse : salesResponse.content || salesResponse.data || [];
      const clientsData = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.content || clientsResponse.data || [];
      const usuariosData = Array.isArray(usuariosResponse) ? usuariosResponse : usuariosResponse.content || usuariosResponse.data || [];
      const productsData = Array.isArray(productsResponse) ? productsResponse : productsResponse.content || productsResponse.data || [];

      const clientsMap = new Map<any, Cliente>();
      const usuariosMap = new Map<any, Usuario>();
      const productsMap = new Map<any, any>();

      clientsData.forEach((client: any) => {
        if (client?.id !== undefined && client?.id !== null) {
          clientsMap.set(client.id, client);
          clientsMap.set(String(client.id), client);
          const n = parseInt(client.id, 10);
          if (!Number.isNaN(n)) clientsMap.set(n, client);
        }
      });

      usuariosData.forEach((usuario: any) => {
        if (usuario?.id !== undefined && usuario?.id !== null) {
          usuariosMap.set(usuario.id, usuario);
          usuariosMap.set(String(usuario.id), usuario);
          const n = parseInt(usuario.id, 10);
          if (!Number.isNaN(n)) usuariosMap.set(n, usuario);
        }
      });

      productsData.forEach((product: any) => {
        if (product?.id !== undefined && product?.id !== null) {
          productsMap.set(product.id, product);
          productsMap.set(String(product.id), product);
          const n = parseInt(product.id, 10);
          if (!Number.isNaN(n)) productsMap.set(n, product);
        }
      });

      const enrichedSales: Venta[] = salesData.map((sale: any) => {
        let cliente: Cliente | null = null;
        let usuario: Usuario | null = null;

        if (sale?.cliente && typeof sale.cliente === 'object') {
          cliente = sale.cliente as Cliente;
        } else if (sale?.clienteId !== undefined && sale?.clienteId !== null) {
          cliente =
            clientsMap.get(sale.clienteId) ||
            clientsMap.get(String(sale.clienteId)) ||
            clientsMap.get(parseInt(sale.clienteId, 10)) ||
            null;
        }

        if (sale?.usuario && typeof sale.usuario === 'object') {
          usuario = sale.usuario as Usuario;
        } else if (sale?.usuarioId !== undefined && sale?.usuarioId !== null) {
          const uid = sale.usuarioId;
          usuario =
            usuariosMap.get(uid) ||
            usuariosMap.get(String(uid)) ||
            usuariosMap.get(parseInt(uid, 10)) ||
            null;
        }

        const enrichedDetalleVentas: DetalleVenta[] = (sale.detalleVentas || []).map((detalle: any) => {
          let producto: any = null;
          if (detalle?.producto && typeof detalle.producto === 'object') {
            producto = detalle.producto;
          } else if (detalle?.productoId !== undefined && detalle?.productoId !== null) {
            producto =
              productsMap.get(detalle.productoId) ||
              productsMap.get(String(detalle.productoId)) ||
              productsMap.get(parseInt(detalle.productoId, 10)) ||
              null;
          }
          return {
            ...detalle,
            producto,
            productoNombre: detalle.productoNombre || producto?.nombre,
          };
        });

        return {
          ...sale,
          cliente,
          usuario,
          detalleVentas: enrichedDetalleVentas,
          metodoPago: sale.metodoPago || sale.metodo_pago || 'EFECTIVO',
        } as Venta;
      });

      setSales(enrichedSales);
      setClients(clientsData);
      setUsuarios(usuariosData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSale = (sale: Venta): void => {
    setViewingSale(sale);
    setViewDialogOpen(true);
  };

  const handleEditSale = (sale: Venta): void => {
    setEditingSale(sale);
    setEditForm({
      numeroVenta: (sale as any).ventaNumero || '',
      clienteId: sale.cliente?.id?.toString() || '',
      usuarioId: sale.usuario?.id?.toString() || (sale as any).empleado?.id?.toString() || '',
      estado: (sale as any).estado || 'PENDIENTE',
      metodoPago: (sale.metodoPago as PaymentMethod) || 'CASH',
      fechaVenta: sale.fechaVenta ? new Date(sale.fechaVenta).toISOString().split('T')[0] : '',
      notas: (sale as any).observaciones || '',
      total: sale.total || 0,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSale = async (): Promise<void> => {
    if (!editingSale) return;
    try {
      setEditLoading(true);
      setError(null);
      alert('La funcionalidad de edición está en desarrollo.');
      setEditDialogOpen(false);
      setEditingSale(null);
    } catch (err) {
      console.error('Error updating sale:', err);
      setError('Error al actualizar la venta. Verifique los datos e intente nuevamente.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (field: string, value: string | number): void => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ENVIADA: 'Enviada',
      CANCELADA: 'Cancelada',
      ENTREGADA: 'Entregada',
      CONFIRMADA: 'Confirmada',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (
    status: string,
  ): 'warning' | 'info' | 'error' | 'success' | 'default' => {
    const statusColors: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default'> = {
      PENDIENTE: 'warning',
      ENVIADA: 'info',
      CANCELADA: 'error',
      ENTREGADA: 'success',
      CONFIRMADA: 'success',
    };
    return statusColors[status] || 'default';
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const methods: Record<PaymentMethod, string> = {
      EFECTIVO: 'Efectivo',
      CHEQUE: 'Cheque',
      CUENTA_CORRIENTE: 'Cuenta Corriente',
      MERCADO_PAGO: 'Mercado Pago',
      TARJETA_CREDITO: 'Tarjeta de Crédito',
      TARJETA_DEBITO: 'Tarjeta de Débito',
      TRANSFERENCIA_BANCARIA: 'Transferencia',
    } as any;
    return (methods as any)[method] || (method as any);
  };

  const getClientFullName = (cliente: Cliente | null): string => {
    if (!cliente) return 'Cliente no disponible';
    if ((cliente as any).razonSocial && (cliente as any).razonSocial.trim()) {
      return (cliente as any).razonSocial;
    }
    const parts = [cliente.nombre, cliente.apellido].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Cliente no disponible';
  };

  const getUsuarioFullName = (usuario: Usuario | null): string => {
    if (!usuario) return 'Vendedor no disponible';
    const parts = [usuario.nombre, usuario.apellido].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Vendedor no disponible';
  };

  const filteredSales = sales.filter((sale: Venta) => {
    const clientName = getClientFullName(sale.cliente || null);
    const usuarioName = getUsuarioFullName(((sale as any).usuario || (sale as any).empleado) as Usuario || null);

    const matchesSearch =
      searchTerm === '' ||
      (sale as any).ventaNumero?.toLowerCase?.().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuarioName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || (sale as any).estado === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || (sale as any).metodoPago === paymentMethodFilter;
    const matchesClient = clientFilter === 'all' || sale.cliente?.id?.toString() === clientFilter;

    const saleDate = sale.fechaVenta ? new Date(sale.fechaVenta) : null;
    const matchesDateFrom = !dateFromFilter || (saleDate && saleDate >= new Date(dateFromFilter));
    const matchesDateTo = !dateToFilter || (saleDate && saleDate <= new Date(dateToFilter));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPaymentMethod &&
      matchesClient &&
      matchesDateFrom &&
      matchesDateTo
    );
  });

  const clearFilters = (): void => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setClientFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const totalRevenue = filteredSales.reduce((sum: number, sale: Venta) => sum + (sale.total || 0), 0);
  const totalTransactions = filteredSales.length;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
      >
        <Typography variant={isSmDown ? 'h5' : 'h4'} display="flex" alignItems="center" gap={1}>
          <ReceiptIcon />
          Registro de Ventas
        </Typography>
        <Box display="flex" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          <Button
            fullWidth={isSmDown}
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => alert('Función de exportación en desarrollo')}
          >
            Exportar
          </Button>
          <Button
            fullWidth={isSmDown}
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => alert('Ir a Facturación para crear nueva venta')}
          >
            Nueva Venta
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoneyIcon color="primary" />
                <Box>
                  <Typography variant="h6">${formatMoney(totalRevenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">Ingresos Totales</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ShoppingCartIcon color="success" />
                <Box>
                  <Typography variant="h6">{totalTransactions}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Ventas</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="warning" />
                <Box>
                  <Typography variant="h6">${formatMoney(averageOrderValue)}</Typography>
                  <Typography variant="body2" color="text.secondary">Valor Promedio</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterListIcon />
            <Typography variant="h6">Filtros</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número, cliente..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="ENVIADA">Enviada</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  <MenuItem value="ENTREGADA">Entregada</MenuItem>
                  <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Método de Pago</InputLabel>
                <Select value={paymentMethodFilter} label="Método de Pago" onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="CHEQUE">Cheque</MenuItem>
                  <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
                  <MenuItem value="MERCADO_PAGO">Mercado Pago</MenuItem>
                  <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                  <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select value={clientFilter} label="Cliente" onChange={(e) => setClientFilter(e.target.value)}>
                  <MenuItem value="all">Todos</MenuItem>
                  {clients.map((client: Cliente) => (
                    <MenuItem key={client.id} value={client.id?.toString?.() || String(client.id)}>
                      {getClientFullName(client)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                size="small"
                value={dateFromFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFromFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                size="small"
                value={dateToFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateToFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Box mt={2} display="flex" justifyContent={{ xs: 'stretch', sm: 'flex-start' }}>
            <Button variant="outlined" size="small" onClick={clearFilters} fullWidth={isSmDown}>
              Limpiar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Sales List/Table - responsive switch */}
      {isMdUp ? (
        <Card>
          <CardContent>
            <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vendedor</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Método de Pago</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSales.map((sale: Venta) => (
                    <TableRow key={sale.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">#{sale.id}</Typography>
                        {(sale as any).ventaNumero && (
                          <Typography variant="caption" color="text.secondary">
                            {(sale as any).ventaNumero}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{getClientFullName(sale.cliente || null)}</Typography>
                          {sale.cliente?.email && (
                            <Typography variant="caption" color="text.secondary">{sale.cliente.email}</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{getUsuarioFullName(((sale as any).usuario || (sale as any).empleado) as Usuario || null)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel((sale as any).estado)} color={getStatusColor((sale as any).estado)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">${(sale.total || 0).toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getPaymentMethodLabel(((sale as any).metodoPago as PaymentMethod) || 'EFECTIVO')} size="small" color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => handleViewSale(sale)} title="Ver detalles" aria-label={`ver venta ${sale.id}`}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEditSale(sale)} title="Editar" aria-label={`editar venta ${sale.id}`}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => alert('Función de impresión en desarrollo')} title="Imprimir" aria-label={`imprimir venta ${sale.id}`}>
                          <PrintIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setVentaToDelete(sale);
                            setDeleteDialogOpen(true);
                          }}
                          title="Eliminar"
                          color="error"
                          aria-label={`eliminar venta ${sale.id}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">No se encontraron ventas que coincidan con los filtros aplicados</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        // MOBILE / TABLET: Card list view
        <Stack spacing={2}>
          {filteredSales.length === 0 && (
            <Alert severity="info">No se encontraron ventas que coincidan con los filtros aplicados</Alert>
          )}
          {filteredSales.map((sale: Venta) => (
            <Card key={sale.id} variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" gap={2} alignItems="flex-start" flexWrap="wrap">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>#{sale.id} {(sale as any).ventaNumero ? `· ${(sale as any).ventaNumero}` : ''}</Typography>
                    <Typography variant="body2" color="text.secondary">{sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : '-'}</Typography>
                  </Box>
                  <Chip label={getStatusLabel((sale as any).estado)} color={getStatusColor((sale as any).estado)} size="small"/>
                </Box>

                <Box mt={1.5}>
                  <Typography variant="body2"><strong>Cliente:</strong> {getClientFullName(sale.cliente || null)}</Typography>
                  <Typography variant="body2"><strong>Vendedor:</strong> {getUsuarioFullName(((sale as any).usuario || (sale as any).empleado) as Usuario || null)}</Typography>
                </Box>

                <Box mt={1.5} display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Chip label={`Total $${(sale.total || 0).toLocaleString()}`} variant="outlined"/>
                  <Chip label={getPaymentMethodLabel(((sale as any).metodoPago as PaymentMethod) || 'EFECTIVO')} variant="outlined"/>
                </Box>

                <Box mt={1.5} display="flex" gap={1}>
                  <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewSale(sale)}>
                    Ver
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditSale(sale)}>
                    Editar
                  </Button>
                  <IconButton size="small" onClick={() => alert('Función de impresión en desarrollo')} aria-label="imprimir">
                    <PrintIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setVentaToDelete(sale);
                      setDeleteDialogOpen(true);
                    }}
                    color="error"
                    aria-label="eliminar"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalles de la Venta</DialogTitle>
        <DialogContent>
          {viewingSale && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography><strong>Número:</strong> #{viewingSale?.id}</Typography>
                    <Typography><strong>Fecha:</strong> {viewingSale.fechaVenta ? new Date(viewingSale.fechaVenta).toLocaleDateString() : '-'}</Typography>
                    <Typography><strong>Estado:</strong> {getStatusLabel((viewingSale as any).estado)}</Typography>
                    <Typography><strong>Método de Pago:</strong> {getPaymentMethodLabel(((viewingSale as any).metodoPago as PaymentMethod) || 'EFECTIVO')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <strong>Cliente:</strong> {getClientFullName(viewingSale.cliente || null)}
                    </Typography>
                    {viewingSale.cliente?.email && (
                      <Typography variant="body2" color="text.secondary">Email: {viewingSale.cliente.email}</Typography>
                    )}
                    {viewingSale.cliente?.telefono && (
                      <Typography variant="body2" color="text.secondary">Teléfono: {viewingSale.cliente.telefono}</Typography>
                    )}
                    {(viewingSale as any).cliente?.cuit && (
                      <Typography variant="body2" color="text.secondary">CUIT: {(viewingSale as any).cliente.cuit}</Typography>
                    )}
                    <Typography sx={{ mt: 2 }}>
                      <strong>Vendedor:</strong> {getUsuarioFullName(((viewingSale as any).usuario || (viewingSale as any).empleado) as Usuario || null)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {viewingSale.detalleVentas && viewingSale.detalleVentas.length > 0 ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    Productos ({viewingSale.detalleVentas.length} artículos)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Precio Unit.</TableCell>
                          <TableCell align="right">Descuento</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingSale.detalleVentas.map((item: DetalleVenta, index: number) => (
                          <TableRow key={(item as any).id || index}>
                            <TableCell>
                              <Typography variant="body2">{(item as any).productoNombre || (item as any).producto?.nombre || 'Producto no disponible'}</Typography>
                              {(item as any).producto?.descripcion && (
                                <Typography variant="caption" color="text.secondary">{(item as any).producto.descripcion}</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{(item as any).cantidad}</TableCell>
                            <TableCell align="right">${(item as any).precioUnitario?.toFixed?.(2) || '0.00'}</TableCell>
                            <TableCell align="right">{(item as any).descuento || 0}%</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">${(item as any).subtotal?.toFixed?.(2) || '0.00'}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Alert severity="info">No hay productos asociados a esta venta</Alert>
              )}

              <Box mt={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Box>
                  {((viewingSale as any).notas || (viewingSale as any).observaciones) && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">Notas</Typography>
                      <Typography variant="body2">{(viewingSale as any).notas || (viewingSale as any).observaciones}</Typography>
                    </>
                  )}
                </Box>
                <Typography variant={isSmDown ? 'h6' : 'h5'} color="primary" fontWeight="bold">
                  Total: ${formatMoney(viewingSale.total)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => alert('Función de impresión en desarrollo')}>
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Venta #{editingSale?.id}</DialogTitle>
        <DialogContent>
          {editingSale && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Número de Venta"
                    value={editForm.numeroVenta}
                    onChange={(e) => handleEditFormChange('numeroVenta', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Venta"
                    type="date"
                    value={editForm.fechaVenta}
                    onChange={(e) => handleEditFormChange('fechaVenta', e.target.value)}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cliente</InputLabel>
                    <Select value={editForm.clienteId} label="Cliente" onChange={(e) => handleEditFormChange('clienteId', e.target.value)}>
                      {clients.map((client: Cliente) => (
                        <MenuItem key={client.id} value={client.id?.toString?.() || String(client.id)}>
                          {getClientFullName(client)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Vendedor</InputLabel>
                    <Select value={editForm.usuarioId} label="Vendedor" onChange={(e) => handleEditFormChange('usuarioId', e.target.value)}>
                      {usuarios.map((usuario: Usuario) => (
                        <MenuItem key={usuario.id} value={usuario.id?.toString?.() || String(usuario.id)}>
                          {getUsuarioFullName(usuario)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select value={editForm.estado} label="Estado" onChange={(e) => handleEditFormChange('estado', e.target.value)}>
                      <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                      <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
                      <MenuItem value="ENVIADA">Enviada</MenuItem>
                      <MenuItem value="ENTREGADA">Entregada</MenuItem>
                      <MenuItem value="CANCELADA">Cancelada</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Método de Pago</InputLabel>
                    <Select value={editForm.metodoPago} label="Método de Pago" onChange={(e) => handleEditFormChange('metodoPago', e.target.value as PaymentMethod)}>
                      <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                      <MenuItem value="CHEQUE">Cheque</MenuItem>
                      <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
                      <MenuItem value="MERCADO_PAGO">Mercado Pago</MenuItem>
                      <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                      <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                      <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    type="number"
                    value={editForm.total}
                    onChange={(e) => handleEditFormChange('total', parseFloat(e.target.value) || 0)}
                    variant="outlined"
                    size="small"
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas"
                    multiline
                    rows={3}
                    value={editForm.notas}
                    onChange={(e) => handleEditFormChange('notas', e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="Agregar notas adicionales sobre la venta..."
                  />
                </Grid>
                {/* Resumen */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Resumen de la Venta
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Cliente Actual:</strong> {getClientFullName(editingSale.cliente || null)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Vendedor Actual:</strong> {getUsuarioFullName(((editingSale as any).usuario || (editingSale as any).empleado) as Usuario || null)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Estado Actual:</strong> {getStatusLabel((editingSale as any).estado)}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2"><strong>Total Actual:</strong> ${(editingSale.total || 0).toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleUpdateSale} color="primary" variant="contained" disabled={editLoading}>
            {editLoading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Sale Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar venta</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la venta <b>{(ventaToDelete as any)?.ventaNumero || (ventaToDelete as any)?.numeroVenta || `#${ventaToDelete?.id}`}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (ventaToDelete) {
                try {
                  await saleApi.delete(ventaToDelete.id as any);
                  setSales((prev) => prev.filter((s) => s.id !== ventaToDelete.id));
                  setDeleteDialogOpen(false);
                  setError(null);
                } catch (err) {
                  setError('Error al eliminar la venta');
                  console.error('Error deleting sale:', err);
                }
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Integration Info */}
      <Box mt={3}>
        <Alert severity="info">
          <Typography variant="body2"><strong>Este módulo integra con:</strong></Typography>
          <Box component="ul" mt={1} sx={{ pl: 2 }}>
            <Typography component="li" variant="body2"><strong>Facturación:</strong> Para crear y editar ventas</Typography>
            <Typography component="li" variant="body2"><strong>Presupuestos:</strong> Para convertir presupuestos en ventas</Typography>
            <Typography component="li" variant="body2"><strong>Informes:</strong> Para análisis detallado de ventas</Typography>
            <Typography component="li" variant="body2"><strong>Inventario:</strong> Para control de stock</Typography>
          </Box>
        </Alert>
      </Box>
    </Box>
  );
};

export default RegistroVentasPage;
