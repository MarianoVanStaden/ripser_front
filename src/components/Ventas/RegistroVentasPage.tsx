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
} from '@mui/material';
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
import { documentoApi, clienteApi, usuarioApi, productApi } from '../../api/services';
import type { 
  DocumentoComercial, 
  Cliente, 
  Usuario, 
  DetalleDocumento,
  EstadoDocumento,
  MetodoPago 
} from '../../types';

const RegistroVentasPage: React.FC = () => {
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingFactura, setViewingFactura] = useState<DocumentoComercial | null>(null);
  const [facturaToDelete, setFacturaToDelete] = useState<DocumentoComercial | null>(null);
  const [editingFactura, setEditingFactura] = useState<DocumentoComercial | null>(null);
  const [editForm, setEditForm] = useState({
    numeroDocumento: '',
    clienteId: '',
    usuarioId: '',
    estado: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
    fecha: '',
    observaciones: '',
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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch facturas, clients, usuarios, and products
      const [facturasResponse, clientsResponse, usuariosResponse, productsResponse] = await Promise.all([
        documentoApi.getByTipo('FACTURA'),
        clienteApi.getAll(),
        usuarioApi.getAll(),
        productApi.getAll(),
      ]);

      // Extract actual data from paginated responses
      const facturasData = Array.isArray(facturasResponse) ? facturasResponse : facturasResponse.content || facturasResponse.data || [];
      const clientsData = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.content || clientsResponse.data || [];
      const usuariosData = Array.isArray(usuariosResponse) ? usuariosResponse : usuariosResponse.content || usuariosResponse.data || [];
      const productsData = Array.isArray(productsResponse) ? productsResponse : productsResponse.content || productsResponse.data || [];

      console.log('Facturas data:', facturasData);
      console.log('Clients data:', clientsData);
      console.log('Usuarios data:', usuariosData);
      console.log('Products data:', productsData);

      // Create maps for faster lookups
      const clientsMap = new Map();
      const usuariosMap = new Map();
      const productsMap = new Map();

      // Handle clients mapping
      if (Array.isArray(clientsData)) {
        clientsData.forEach((client) => {
          if (client && client.id !== undefined && client.id !== null) {
            clientsMap.set(client.id, client);
            clientsMap.set(String(client.id), client);
            clientsMap.set(parseInt(client.id), client);
          }
        });
      }

      // Handle usuarios mapping
      if (Array.isArray(usuariosData)) {
        usuariosData.forEach((usuario) => {
          if (usuario && usuario.id !== undefined && usuario.id !== null) {
            usuariosMap.set(usuario.id, usuario);
            usuariosMap.set(String(usuario.id), usuario);
            const parsedId = parseInt(usuario.id);
            if (!isNaN(parsedId)) {
              usuariosMap.set(parsedId, usuario);
            }
          }
        });
      }

      // Handle products mapping
      if (Array.isArray(productsData)) {
        productsData.forEach((product) => {
          if (product && product.id !== undefined && product.id !== null) {
            productsMap.set(product.id, product);
            productsMap.set(String(product.id), product);
            productsMap.set(parseInt(product.id), product);
          }
        });
      }

      // Enrich facturas data with client, usuario, and product information
      const enrichedFacturas = facturasData.map((factura) => {
        let cliente = null;
        let usuario = null;

        // Client lookup
        if (factura.cliente && typeof factura.cliente === 'object') {
          cliente = factura.cliente;
        } else if (factura.clienteId !== undefined && factura.clienteId !== null) {
          cliente =
            clientsMap.get(factura.clienteId) ||
            clientsMap.get(String(factura.clienteId)) ||
            clientsMap.get(parseInt(factura.clienteId));
        }

        // Usuario lookup
        if (factura.usuario && typeof factura.usuario === 'object') {
          usuario = factura.usuario;
        } else if (factura.usuarioId !== undefined && factura.usuarioId !== null) {
          const uid = factura.usuarioId;
          usuario =
            usuariosMap.get(uid) ||
            usuariosMap.get(String(uid)) ||
            usuariosMap.get(parseInt(uid));
        }

        // Enrich detalles
        const enrichedDetalles = factura.detalles?.map((detalle) => {
          let producto = null;
          if (detalle.producto && typeof detalle.producto === 'object') {
            producto = detalle.producto;
          } else if (detalle.productoId !== undefined && detalle.productoId !== null) {
            producto =
              productsMap.get(detalle.productoId) ||
              productsMap.get(String(detalle.productoId)) ||
              productsMap.get(parseInt(detalle.productoId));
          }
          return {
            ...detalle,
            producto,
          };
        }) || [];

        return {
          ...factura,
          cliente,
          usuario,
          detalles: enrichedDetalles,
        };
      });

      setFacturas(enrichedFacturas);
      setClients(clientsData);
      setUsuarios(usuariosData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFactura = (factura: DocumentoComercial): void => {
    console.log('Viewing factura:', factura);
    setViewingFactura(factura);
    setViewDialogOpen(true);
  };

  const handleEditFactura = (factura: DocumentoComercial): void => {
    setEditingFactura(factura);
    setEditForm({
      numeroDocumento: factura.numeroDocumento || '',
      clienteId: factura.cliente?.id?.toString() || factura.clienteId?.toString() || '',
      usuarioId: factura.usuario?.id?.toString() || factura.usuarioId?.toString() || '',
      estado: factura.estado || 'BORRADOR',
      metodoPago: factura.metodoPago || 'EFECTIVO',
      fecha: factura.fecha ? new Date(factura.fecha).toISOString().split('T')[0] : '',
      observaciones: factura.observaciones || '',
      total: factura.total || 0,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateFactura = async (): Promise<void> => {
    if (!editingFactura) return;

    try {
      setEditLoading(true);
      setError(null);

      // For now, disable editing until API is properly mapped
      alert('La funcionalidad de edición está en desarrollo. Las correcciones se están aplicando al sistema de visualización.');
      setEditDialogOpen(false);
      setEditingFactura(null);
      
    } catch (err) {
      console.error('Error updating factura:', err);
      setError('Error al actualizar la factura. Verifique los datos e intente nuevamente.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditFormChange = (field: string, value: string | number): void => {
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusLabel = (status: EstadoDocumento): string => {
    const statusLabels: Record<EstadoDocumento, string> = {
      'BORRADOR': 'Borrador',
      'PENDIENTE': 'Pendiente',
      'APROBADO': 'Aprobado',
      'RECHAZADO': 'Rechazado',
      'CANCELADO': 'Cancelado',
      'FINALIZADO': 'Finalizado',
      'ANULADO': 'Anulado'
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: EstadoDocumento): 'warning' | 'info' | 'error' | 'success' | 'default' => {
    const statusColors: Record<EstadoDocumento, 'warning' | 'info' | 'error' | 'success' | 'default'> = {
      'BORRADOR': 'default',
      'PENDIENTE': 'warning',
      'APROBADO': 'success',
      'RECHAZADO': 'error',
      'CANCELADO': 'error',
      'FINALIZADO': 'success',
      'ANULADO': 'error'
    };
    return statusColors[status] || 'default';
  };

  const getPaymentMethodLabel = (method: MetodoPago): string => {
    const methods: Record<MetodoPago, string> = {
      EFECTIVO: 'Efectivo',
      CHEQUE: 'Cheque',
      CUENTA_CORRIENTE: 'Cuenta Corriente',
      MERCADO_PAGO: 'Mercado Pago',
      TARJETA_CREDITO: 'Tarjeta de Crédito',
      TARJETA_DEBITO: 'Tarjeta de Débito',
      TRANSFERENCIA_BANCARIA: 'Transferencia',
    };
    return methods[method] || method;
  };

  // Helper function to get client full name
  const getClientFullName = (cliente: Cliente | null): string => {
    if (!cliente) return 'Cliente no disponible';
    
    // If it's a business (persona jurídica), prioritize razón social
    if (cliente.razonSocial && cliente.razonSocial.trim()) {
      return cliente.razonSocial;
    }
    
    // Otherwise, use name and lastname
    const parts = [cliente.nombre, cliente.apellido].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Cliente no disponible';
  };

  // Helper function to get usuario full name
  const getUsuarioFullName = (usuario: Usuario | null): string => {
    if (!usuario) return 'Vendedor no disponible';
    
    const parts = [usuario.nombre, usuario.apellido].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Vendedor no disponible';
  };

  const filteredFacturas = facturas.filter((factura: DocumentoComercial) => {
    const clientName = getClientFullName(factura.cliente || null);
    const usuarioName = getUsuarioFullName(factura.usuario || null);
    
    const matchesSearch = searchTerm === '' || 
      factura.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuarioName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || factura.estado === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || factura.metodoPago === paymentMethodFilter;
    const matchesClient = clientFilter === 'all' || factura.cliente?.id?.toString() === clientFilter;

    const facturaDate = new Date(factura.fecha);
    const matchesDateFrom = !dateFromFilter || facturaDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || facturaDate <= new Date(dateToFilter);

    return matchesSearch && matchesStatus && matchesPaymentMethod && 
           matchesClient && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = (): void => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setClientFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const calculateTotals = () => {
    const totalRevenue = filteredFacturas.reduce((sum: number, factura: DocumentoComercial) => 
      sum + (factura.total || 0), 0);
    const totalTransactions = filteredFacturas.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return { totalRevenue, totalTransactions, averageOrderValue };
  };

  const { totalRevenue, totalTransactions, averageOrderValue } = calculateTotals();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1}>
          <ReceiptIcon />
          Registro de Facturas
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => alert('Función de exportación en desarrollo')}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => alert('Ir a Facturación para crear nueva factura')}
          >
            Nueva Factura
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AttachMoneyIcon color="primary" />
                <Box>
                  <Typography variant="h6">${totalRevenue.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ingresos Totales
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ShoppingCartIcon color="success" />
                <Box>
                  <Typography variant="h6">{totalTransactions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Facturas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="warning" />
                <Box>
                  <Typography variant="h6">${averageOrderValue.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor Promedio
                  </Typography>
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
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="BORRADOR">Borrador</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="APROBADO">Aprobado</MenuItem>
                  <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                  <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                  <MenuItem value="ANULADO">Anulado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  label="Método de Pago"
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                >
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={clientFilter}
                  label="Cliente"
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {clients.map((client: Cliente) => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {getClientFullName(client)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
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
            <Grid item xs={12} md={1.5}>
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
          <Box mt={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={clearFilters}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Facturas Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
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
                {filteredFacturas.map((factura: DocumentoComercial) => (
                  <TableRow key={factura.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{factura.id}
                      </Typography>
                      {factura.numeroDocumento && (
                        <Typography variant="caption" color="text.secondary">
                          {factura.numeroDocumento}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {factura.fecha ? new Date(factura.fecha).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {getClientFullName(factura.cliente || null)}
                        </Typography>
                        {factura.cliente?.email && (
                          <Typography variant="caption" color="text.secondary">
                            {factura.cliente.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getUsuarioFullName(factura.usuario || null)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(factura.estado)}
                        color={getStatusColor(factura.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${(factura.total || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentMethodLabel(factura.metodoPago || 'EFECTIVO')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewFactura(factura)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditFactura(factura)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => alert('Función de impresión en desarrollo')}
                        title="Imprimir"
                      >
                        <PrintIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setFacturaToDelete(factura);
                          setDeleteDialogOpen(true);
                        }}
                        title="Eliminar"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFacturas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No se encontraron facturas que coincidan con los filtros aplicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Factura Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de la Factura
        </DialogTitle>
        <DialogContent>
          {viewingFactura && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography><strong>Número:</strong> {viewingFactura.numeroDocumento || `#${viewingFactura.id}`}</Typography>
                    <Typography><strong>Fecha:</strong> {new Date(viewingFactura.fecha).toLocaleDateString()}</Typography>
                    <Typography><strong>Estado:</strong> {getStatusLabel(viewingFactura.estado)}</Typography>
                    <Typography><strong>Método de Pago:</strong> {getPaymentMethodLabel(viewingFactura.metodoPago || 'EFECTIVO')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <strong>Cliente:</strong> {getClientFullName(viewingFactura.cliente || null)}
                    </Typography>
                    {viewingFactura.cliente?.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {viewingFactura.cliente.email}
                      </Typography>
                    )}
                    {viewingFactura.cliente?.telefono && (
                      <Typography variant="body2" color="text.secondary">
                        Teléfono: {viewingFactura.cliente.telefono}
                      </Typography>
                    )}
                    {viewingFactura.cliente?.cuit && (
                      <Typography variant="body2" color="text.secondary">
                        CUIT: {viewingFactura.cliente.cuit}
                      </Typography>
                    )}
                    <Typography sx={{ mt: 2 }}>
                      <strong>Vendedor:</strong> {getUsuarioFullName(viewingFactura.usuario || null)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {viewingFactura.detalles && viewingFactura.detalles.length > 0 ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    Productos ({viewingFactura.detalles.length} artículos)
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
                        {viewingFactura.detalles.map((item: DetalleDocumento, index: number) => (
                          <TableRow key={item.id || index}>
                            <TableCell>
                              <Typography variant="body2">
                                {item.descripcion || item.producto?.nombre || 'Producto no disponible'}
                              </Typography>
                              {item.producto?.descripcion && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.producto.descripcion}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{item.cantidad}</TableCell>
                            <TableCell align="right">${item.precioUnitario?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell align="right">{item.descuento || 0}%</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                ${item.subtotal?.toFixed(2) || '0.00'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Typography color="text.secondary" align="center" py={3}>
                  No hay detalles de productos disponibles
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="flex-end">
                <Typography variant="h6">
                  <strong>Total: ${(viewingFactura.total || 0).toLocaleString()}</strong>
                </Typography>
              </Box>

              {viewingFactura.observaciones && (
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones:
                  </Typography>
                  <Typography variant="body2">
                    {viewingFactura.observaciones}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => alert('Función de impresión en desarrollo')}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Factura Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Factura
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de Documento"
                value={editForm.numeroDocumento}
                onChange={(e) => handleEditFormChange('numeroDocumento', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={editForm.clienteId}
                  label="Cliente"
                  onChange={(e) => handleEditFormChange('clienteId', e.target.value)}
                >
                  {clients.map((client: Cliente) => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {getClientFullName(client)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={editForm.usuarioId}
                  label="Vendedor"
                  onChange={(e) => handleEditFormChange('usuarioId', e.target.value)}
                >
                  {usuarios.map((usuario: Usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id.toString()}>
                      {getUsuarioFullName(usuario)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editForm.estado}
                  label="Estado"
                  onChange={(e) => handleEditFormChange('estado', e.target.value)}
                >
                  <MenuItem value="BORRADOR">Borrador</MenuItem>
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="APROBADO">Aprobado</MenuItem>
                  <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                  <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                  <MenuItem value="ANULADO">Anulado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={editForm.metodoPago}
                  label="Método de Pago"
                  onChange={(e) => handleEditFormChange('metodoPago', e.target.value)}
                >
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
                label="Fecha"
                type="date"
                value={editForm.fecha}
                onChange={(e) => handleEditFormChange('fecha', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total"
                type="number"
                value={editForm.total}
                onChange={(e) => handleEditFormChange('total', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={editForm.observaciones}
                onChange={(e) => handleEditFormChange('observaciones', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateFactura}
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={20} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar esta factura? Esta acción no se puede deshacer.
          </Typography>
          {facturaToDelete && (
            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2">
                <strong>Factura:</strong> #{facturaToDelete.id}
              </Typography>
              <Typography variant="body2">
                <strong>Cliente:</strong> {getClientFullName(facturaToDelete.cliente || null)}
              </Typography>
              <Typography variant="body2">
                <strong>Total:</strong> ${(facturaToDelete.total || 0).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              alert('Función de eliminación en desarrollo');
              setDeleteDialogOpen(false);
              setFacturaToDelete(null);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegistroVentasPage;