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
  TablePagination,
  Autocomplete,
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
import { useNavigate } from 'react-router-dom';
import { documentoApi, clienteApi, usuarioApi, opcionFinanciamientoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
import type { Venta, Cliente, Usuario, PaymentMethod, DetalleVenta, DocumentoComercial, OpcionFinanciamientoDTO } from '../../types';
import { generarVentaPDF } from '../../services/pdfService';
import { generateSalesListPDF } from '../../utils/pdfExportUtils';
import { useClienteSearch } from '../../hooks/useClienteSearch';

const RegistroVentasPage: React.FC = () => {
  const navigate = useNavigate();
  const { empresaId } = useTenant();
  const [sales, setSales] = useState<Venta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmStateChangeDialogOpen, setConfirmStateChangeDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Venta | null>(null);
  const [ventaToDelete, setVentaToDelete] = useState<Venta | null>(null);
  const [editingSale, setEditingSale] = useState<Venta | null>(null);
  const [editForm, setEditForm] = useState({
    numeroVenta: '',
    clienteId: '',
    usuarioId: '',
    estado: '',
    metodoPago: 'CASH' as PaymentMethod,
    fechaVenta: '',
    notas: '',
    total: 0,
  });
  const [editLoading, setEditLoading] = useState(false);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [selectedClientOption, setSelectedClientOption] = useState<Cliente | null>(null);
  const { options: clientOptions, loading: clientSearchLoading, inputValue: clientInputValue, setInputValue: setClientInputValue } = useClienteSearch();
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [tipoDocumentoFilter, setTipoDocumentoFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [empresaId]); // Re-fetch when tenant changes

  const loadData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all data in parallel — usuarios is non-critical, never blocks the page
      const [facturasData, notasCreditoData, usuariosData] = await Promise.all([
        documentoApi.getByTipo('FACTURA'),
        documentoApi.getByTipo('NOTA_CREDITO'),
        usuarioApi.getAll().catch(() => []),
      ]);

      // Combine both document types
      const salesData = [...(facturasData as any), ...(notasCreditoData as any)];

      console.log('Sales data:', salesData);
      console.log('Usuarios data:', usuariosData);

      // Create maps for quick lookups
      // Handle usuarios response - it might be paginated or direct array
      const usuariosArray = Array.isArray(usuariosData) ? usuariosData : (usuariosData as any).content || [];
      const usuariosMap = new Map(usuariosArray.map((usuario: Usuario) => [usuario.id, usuario]));
      
      // Keep all loaded documents (FACTURA and NOTA_CREDITO)
      const facturas = salesData;

      // Enrich sales data with client and usuario information
      const enrichedSales = facturas.map((sale: any) => {
        // Map cliente - DocumentoComercial has clienteId and clienteNombre
        let cliente = null;
        if (sale.cliente) {
          cliente = sale.cliente;
        } else if (sale.clienteId && sale.clienteNombre) {
          // Build a minimal cliente object from the document's denormalized fields
          const nameParts = sale.clienteNombre.split(' ');
          cliente = {
            id: sale.clienteId,
            nombre: nameParts[0] || sale.clienteNombre,
            apellido: nameParts.slice(1).join(' ') || '',
          } as Cliente;
        }

        // Map usuario - DocumentoComercial has usuarioId and usuarioNombre
        // Since backend Usuario doesn't have nombre/apellido, we use usuarioNombre directly
        let usuario = null;
        if (sale.usuario) {
          usuario = sale.usuario;
        } else if (sale.usuarioId && sale.usuarioNombre) {
          // Create a usuario object from usuarioNombre
          const nameParts = sale.usuarioNombre.trim().split(/\s+/);
          usuario = {
            id: sale.usuarioId,
            nombre: nameParts[0] || '',
            apellido: nameParts.slice(1).join(' ') || '',
            username: sale.usuarioNombre,
            email: '',
          } as Usuario;
        } else if (sale.usuarioId) {
          // Try to get from map (but backend usuarios only have username/email)
          const usuarioFromMap = usuariosMap.get(sale.usuarioId);
          if (usuarioFromMap) {
            usuario = usuarioFromMap;
          }
        }

        // Map detalles to detalleVentas for compatibility
        // DetalleDocumento has productoNombre field
        const detalleVentas = (sale.detalles || []).map((detalle: any) => ({
          ...detalle,
          producto: {
            id: detalle.productoId,
            nombre: detalle.productoNombre || detalle.descripcion || 'Producto desconocido',
            descripcion: detalle.descripcion || '',
          },
        }));

        // Map fechaEmision to fechaVenta for compatibility
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;

        // Map numeroDocumento to ventaNumero for compatibility
        const ventaNumero = sale.numeroDocumento || sale.ventaNumero;

        // Map estado
        const estado = sale.estado || 'CONFIRMADA';

        // Map observaciones to notas for compatibility
        const notas = sale.observaciones || sale.notas;

        // Preserve metodoPago from the backend
        const metodoPago = sale.metodoPago;

        console.log(`Sale ${sale.id}: usuarioNombre=`, sale.usuarioNombre, 'usuario=', usuario, 'detalles=', detalleVentas.length);

        return {
          ...sale,
          cliente,
          usuario,
          empleado: usuario, // Keep empleado field as well for compatibility
          detalleVentas,
          fechaVenta,
          ventaNumero,
          estado,
          notas,
          metodoPago,
        };
      });
      
      // Sort sales in reverse order (most recent first)
      const sortedSales = enrichedSales.sort((a, b) => {
        const dateA = new Date(a.fechaVenta || a.fechaEmision || 0).getTime();
        const dateB = new Date(b.fechaVenta || b.fechaEmision || 0).getTime();
        return dateB - dateA; // Descending order
      });
      
      setSales(sortedSales);
      setUsuarios(usuariosArray);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSale = (sale: Venta): void => {
    console.log('Viewing sale:', sale);
    setViewingSale(sale);
    setViewDialogOpen(true);
  };

  const handleEditSale = (sale: Venta): void => {
    setEditingSale(sale);
    setEditForm({
      numeroVenta: sale.ventaNumero || '',
      clienteId: sale.cliente?.id?.toString() || '',
      usuarioId: sale.usuario?.id?.toString() || sale.empleado?.id?.toString() || '',
      estado: sale.estado || 'PENDIENTE',
      metodoPago: sale.metodoPago as PaymentMethod || 'CASH',
      fechaVenta: sale.fechaVenta ? new Date(sale.fechaVenta).toISOString().split('T')[0] : '',
      notas: sale.observaciones || '',
      total: sale.total || 0,
    });
    setEditDialogOpen(true);
  };

  const handleOpenConfirmStateChange = (): void => {
    setConfirmStateChangeDialogOpen(true);
  };

  const handleUpdateSale = async (): Promise<void> => {
    if (!editingSale) return;

    try {
      setEditLoading(true);
      setError(null);

      // Only update estado using the dedicated endpoint
      const updatedSale = await documentoApi.updateEstado(
        editingSale.id,
        editForm.estado as any
      );

      // Update the local state — only estado changed, preserve existing enriched fields
      const usuariosMap = new Map(usuarios.map((usuario: Usuario) => [usuario.id, usuario]));

      const enrichedUpdatedSale = {
        ...updatedSale,
        cliente: editingSale.cliente ?? null,
        usuario: usuariosMap.get(parseInt(editForm.usuarioId)) || editingSale.usuario || null,
      } as unknown as Venta;

      setSales(prevSales =>
        prevSales.map(sale =>
          sale.id === editingSale.id ? enrichedUpdatedSale : sale
        )
      );

      setConfirmStateChangeDialogOpen(false);
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
    setEditForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'PENDIENTE': 'Pendiente',
      'ENVIADA': 'Enviada', 
      'CANCELADA': 'Cancelada',
      'ENTREGADA': 'Entregada',
      'CONFIRMADA': 'Confirmada',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'error' | 'success' | 'default' => {
    const statusColors: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default'> = {
      'PENDIENTE': 'warning',
      'ENVIADA': 'info',
      'CANCELADA': 'error',
      'ENTREGADA': 'success',
      'CONFIRMADA': 'success',
    };
    return statusColors[status] || 'default';
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const methods: Record<PaymentMethod, string> = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      BANK_TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
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
  const getUsuarioFullName = (usuario: Usuario | any | null): string => {
    if (!usuario) return 'Vendedor no disponible';

    // Try to get nombre and apellido first
    const parts = [usuario.nombre, usuario.apellido].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');

    // Fall back to username or email
    if (usuario.username) return usuario.username;
    if (usuario.email) return usuario.email;

    return 'Vendedor no disponible';
  };

  const filteredSales = sales.filter((sale: Venta) => {
    const clientName = getClientFullName(sale.cliente || null);
    const usuarioName = getUsuarioFullName((sale.usuario || sale.empleado) as Usuario || null);
    
    const matchesSearch = searchTerm === '' || 
      sale.ventaNumero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuarioName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sale.estado === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || sale.metodoPago === paymentMethodFilter;
    const matchesClient = clientFilter === 'all' || sale.cliente?.id?.toString() === clientFilter;
    
    const matchesTipoDocumento = tipoDocumentoFilter === 'all' || sale.tipoDocumento === tipoDocumentoFilter;

    const saleDate = new Date(sale.fechaVenta);
    const matchesDateFrom = !dateFromFilter || saleDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || saleDate <= new Date(dateToFilter);

    return matchesSearch && matchesStatus && matchesPaymentMethod && 
           matchesClient && matchesTipoDocumento && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = (): void => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setClientFilter('all');
    setSelectedClientOption(null);
    setClientInputValue('');
    setDateFromFilter('');
    setDateToFilter('');
    setTipoDocumentoFilter('all');
  };

  const calculateTotals = () => {
    const totalRevenue = filteredSales.reduce((sum: number, sale: Venta) => 
      sum + (sale.total || 0), 0);
    const totalTransactions = filteredSales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return { totalRevenue, totalTransactions, averageOrderValue };
  };

  const { totalRevenue, totalTransactions, averageOrderValue } = calculateTotals();

  // Paginate filtered sales
  const paginatedSales = filteredSales.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page when changing rows per page
  };

  // Handler para exportar lista completa de ventas a PDF
  const handleExportarListaPDF = async (): Promise<void> => {
    try {
      await generateSalesListPDF(
        filteredSales,
        {
          searchTerm,
          statusFilter,
          paymentMethodFilter,
          clientFilter,
          dateFromFilter,
          dateToFilter,
        },
        {
          totalRevenue,
          totalTransactions,
          averageOrderValue,
        },
        getClientFullName,
        getUsuarioFullName,
        getStatusLabel,
        getPaymentMethodLabel
      );
    } catch (error) {
      console.error('Error al generar PDF de lista de ventas:', error);
      setError('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Handler para exportar venta a PDF
  const handleExportarPDF = async (venta: Venta): Promise<void> => {
    try {
      console.log('Iniciando generación de PDF para venta:', venta);

      // Obtener el cliente — preferir el que ya viene enriquecido en la venta,
      // sino hacer fetch puntual por ID
      let cliente = venta.cliente ?? null;
      if (!cliente && venta.clienteId) {
        try {
          cliente = await clienteApi.getById(venta.clienteId);
        } catch {
          console.error('Cliente no encontrado:', venta.clienteId);
          setError('No se pudo encontrar la información del cliente');
          return;
        }
      }
      if (!cliente) {
        setError('No se pudo encontrar la información del cliente');
        return;
      }

      console.log('Cliente encontrado:', cliente);

      // Obtener el nombre del cliente correctamente
      const nombreCliente = venta.cliente
        ? (venta.cliente.razonSocial || `${venta.cliente.nombre || ''} ${venta.cliente.apellido || ''}`.trim())
        : (cliente.razonSocial || `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim());

      console.log('Nombre del cliente:', nombreCliente);
      console.log('Detalles de venta:', venta.detalleVentas);

      // Convertir Venta a DocumentoComercial para el PDF
      const documento: DocumentoComercial = {
        id: venta.id,
        numeroDocumento: venta.ventaNumero || venta.numeroVenta || `V-${venta.id}`,
        tipoDocumento: 'FACTURA',
        clienteId: venta.clienteId,
        clienteNombre: nombreCliente || 'Cliente',
        usuarioId: venta.empleadoId || 0,
        usuarioNombre: venta.empleado ? `${venta.empleado.nombre || ''} ${venta.empleado.apellido || ''}`.trim() : '',
        fechaEmision: venta.fechaVenta,
        fechaVencimiento: venta.fechaVenta,
        subtotal: venta.subtotal || 0,
        iva: venta.impuesto || 0,
        total: venta.total,
        tipoIva: 'IVA_21',
        estado: 'CONFIRMADA' as any,
        metodoPago: (venta.metodoPago || 'EFECTIVO') as any,
        detalles: (venta.detalleVentas || []).map(detalle => ({
          id: detalle.id,
          tipoItem: (detalle.tipoItem || 'PRODUCTO') as any,
          productoId: detalle.productoId,
          recetaId: detalle.recetaId,
          descripcion: detalle.productoNombre || detalle.producto?.nombre || detalle.descripcionEquipo || `Producto ${detalle.productoId || detalle.recetaId || ''}`,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.subtotal,
          equiposNumerosHeladera: detalle.equiposNumerosHeladera,
        } as any)),
        opcionesFinanciamiento: [],
      };

      console.log('Documento preparado:', documento);

      // Obtener la opción de financiamiento seleccionada si existe
      let opcionSeleccionada: OpcionFinanciamientoDTO | undefined;
      try {
        const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(venta.id);
        opcionSeleccionada = opciones.find(o => o.esSeleccionada);
        console.log('Opción de financiamiento:', opcionSeleccionada);
      } catch (e) {
        console.warn('No se pudo cargar la opción de financiamiento:', e);
      }

      // Generar el PDF
      console.log('Llamando a generarVentaPDF...');
      generarVentaPDF({
        documento,
        cliente,
        opcionSeleccionada
      });
      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error detallado al generar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al generar el PDF de la venta: ${errorMessage}`);
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
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          <ReceiptIcon />
          Registro de Ventas
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportarListaPDF}
          >
            Exportar PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/ventas/facturacion')}
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
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" gap={2}>
                <ShoppingCartIcon color="success" />
                <Box>
                  <Typography variant="h6">{totalTransactions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Ventas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={tipoDocumentoFilter}
                  label="Tipo de Documento"
                  onChange={(e) => setTipoDocumentoFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="FACTURA">Facturas</MenuItem>
                  <MenuItem value="NOTA_CREDITO">Notas de Crédito</MenuItem>
                </Select>
              </FormControl>
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
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="ENVIADA">Enviada</MenuItem>
                  <MenuItem value="CANCELADA">Cancelada</MenuItem>
                  <MenuItem value="ENTREGADA">Entregada</MenuItem>
                  <MenuItem value="CONFIRMADA">Confirmada</MenuItem>
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
                  <MenuItem value="CASH">Efectivo</MenuItem>
                  <MenuItem value="CREDIT_CARD">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="DEBIT_CARD">Tarjeta de Débito</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Transferencia</MenuItem>
                  <MenuItem value="CHECK">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Autocomplete
                size="small"
                options={clientOptions}
                loading={clientSearchLoading}
                value={selectedClientOption}
                inputValue={clientInputValue}
                getOptionLabel={(option) => getClientFullName(option)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterOptions={(x) => x}
                noOptionsText={clientInputValue.length < 3 ? 'Escribí 3 o más letras' : 'Sin resultados'}
                onInputChange={(_e, value) => setClientInputValue(value)}
                onChange={(_e, value) => {
                  setSelectedClientOption(value);
                  setClientFilter(value ? value.id.toString() : 'all');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    placeholder="Buscar cliente..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {clientSearchLoading ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
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

      {/* Sales Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 100 }}>ID</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Fecha</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Vendedor</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Total</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Método de Pago</TableCell>
                  <TableCell align="center" sx={{ minWidth: 180 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSales.map((sale: Venta) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{sale.id}
                      </Typography>
                      {sale.ventaNumero && (
                        <Typography variant="caption" color="text.secondary">
                          {sale.ventaNumero}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {sale.fechaVenta ? new Date(sale.fechaVenta).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {getClientFullName(sale.cliente || null)}
                        </Typography>
                        {sale.cliente?.email && (
                          <Typography variant="caption" color="text.secondary">
                            {sale.cliente.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getUsuarioFullName((sale.usuario || sale.empleado) as Usuario || null)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(sale.estado)}
                        color={getStatusColor(sale.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${(sale.total || 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentMethodLabel(sale.metodoPago as PaymentMethod || 'CASH')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSale(sale)}
                        title="Ver detalles"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditSale(sale)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleExportarPDF(sale)}
                        title="Exportar PDF"
                        color="info"
                      >
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
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No se encontraron ventas que coincidan con los filtros aplicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={filteredSales.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </CardContent>
      </Card>

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de la Venta #{viewingSale?.id}
        </DialogTitle>
        <DialogContent>
          {viewingSale && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Información General
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography><strong>Número:</strong> {viewingSale.ventaNumero || 'N/A'}</Typography>
                    <Typography><strong>Fecha:</strong> {new Date(viewingSale.fechaVenta).toLocaleDateString()}</Typography>
                    <Typography><strong>Estado:</strong> {getStatusLabel(viewingSale.estado)}</Typography>
                    <Typography><strong>Método de Pago:</strong> {getPaymentMethodLabel(viewingSale.metodoPago as PaymentMethod || 'CASH')}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cliente y Vendedor
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <strong>Cliente:</strong> {getClientFullName(viewingSale.cliente || null)}
                    </Typography>
                    {viewingSale.cliente?.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {viewingSale.cliente.email}
                      </Typography>
                    )}
                    {viewingSale.cliente?.telefono && (
                      <Typography variant="body2" color="text.secondary">
                        Teléfono: {viewingSale.cliente.telefono}
                      </Typography>
                    )}
                    {viewingSale.cliente?.cuit && (
                      <Typography variant="body2" color="text.secondary">
                        CUIT: {viewingSale.cliente.cuit}
                      </Typography>
                    )}
                    
                    <Typography sx={{ mt: 2 }}>
                      <strong>Vendedor:</strong> {getUsuarioFullName((viewingSale.usuario || viewingSale.empleado) as Usuario || null)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {viewingSale.detalleVentas && viewingSale.detalleVentas.length > 0 ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    Items ({viewingSale.detalleVentas.length} artículos)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="center">Cantidad</TableCell>
                          <TableCell align="right">Precio Unit.</TableCell>
                          <TableCell align="right">Descuento</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingSale.detalleVentas.map((item: DetalleVenta, index: number) => (
                          <TableRow key={item.id || index}>
                            <TableCell>
                              {item.tipoItem === 'EQUIPO' ? (
                                <>
                                  <Typography variant="body2" fontWeight="500">
                                    {item.recetaNombre || item.descripcionEquipo || 'Equipo'}
                                  </Typography>
                                  {item.equiposNumerosHeladera && item.equiposNumerosHeladera.length > 0 && (
                                    <Box sx={{ mt: 0.5 }}>
                                      <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                        <strong>N° Equipos:</strong> {item.equiposNumerosHeladera.join(', ')}
                                      </Typography>
                                      {item.descripcionEquipo && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          {item.descripcionEquipo}
                                        </Typography>
                                      )}
                                      {(item.recetaModelo || item.color || item.medida) && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                                          {[item.recetaModelo, item.medida, item.color].filter(Boolean).join(' - ')}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Typography variant="body2">
                                    {item.producto?.nombre || item.productoNombre || 'Item no disponible'}
                                  </Typography>
                                  {item.producto?.descripcion && (
                                    <Typography variant="caption" color="text.secondary">
                                      {item.producto.descripcion}
                                    </Typography>
                                  )}
                                </>
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
                <Alert severity="info">
                  No hay productos asociados a esta venta
                </Alert>
              )}

              <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  {(viewingSale.notas || viewingSale.observaciones) && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notas
                      </Typography>
                      <Typography variant="body2">
                        {viewingSale.notas || viewingSale.observaciones}
                      </Typography>
                    </>
                  )}
                </Box>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  Total: ${(viewingSale.total || 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
          {viewingSale?.prestamoId && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => { setViewDialogOpen(false); navigate(`/prestamos/${viewingSale.prestamoId}`); }}
            >
              Ver Préstamo
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => viewingSale && handleExportarPDF(viewingSale)}
          >
            Imprimir PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Cambiar Estado - Factura #{(editingSale as any)?.numeroDocumento || editingSale?.id}
        </DialogTitle>
        <DialogContent>
          {editingSale && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Estado</InputLabel>
                    <Select
                      value={editForm.estado}
                      label="Estado"
                      onChange={(e) => handleEditFormChange('estado', e.target.value)}
                    >
                      <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                      <MenuItem value="CONFIRMADA">Confirmada (reduce stock)</MenuItem>
                      <MenuItem value="PAGADA">Pagada</MenuItem>
                      <MenuItem value="VENCIDA">Vencida</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Current Sale Details Summary */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Información de la Factura
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Cliente:</strong> {getClientFullName(editingSale.cliente || null)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Usuario:</strong> {getUsuarioFullName((editingSale.usuario || editingSale.empleado) as Usuario || null)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Estado Actual:</strong> {getStatusLabel(editingSale.estado)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Total:</strong> ${(editingSale.total || 0).toLocaleString()}
                        </Typography>
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
          <Button
            onClick={handleOpenConfirmStateChange}
            color="primary"
            variant="contained"
            disabled={editLoading}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm State Change Dialog */}
      <Dialog
        open={confirmStateChangeDialogOpen}
        onClose={() => setConfirmStateChangeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
        <DialogContent>
          {editingSale && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Está por cambiar el estado de la factura. Por favor, confirme los detalles antes de continuar.
              </Alert>

              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Factura:</strong> {(editingSale as any)?.numeroDocumento || editingSale?.ventaNumero || `#${editingSale.id}`}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Cliente:</strong> {getClientFullName(editingSale.cliente || null)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total:</strong> ${(editingSale.total || 0).toLocaleString()}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" gutterBottom>
                  <strong>Estado Actual:</strong>{' '}
                  <Chip
                    label={getStatusLabel(editingSale.estado)}
                    color={getStatusColor(editingSale.estado)}
                    size="small"
                  />
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <strong>Nuevo Estado:</strong>{' '}
                  <Chip
                    label={getStatusLabel(editForm.estado)}
                    color={getStatusColor(editForm.estado)}
                    size="small"
                  />
                </Typography>
              </Box>

              {editForm.estado === 'CONFIRMADA' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Nota:</strong> Al confirmar esta venta, se reducirá el stock de los productos asociados.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmStateChangeDialogOpen(false)}
            disabled={editLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateSale}
            color="primary"
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? <CircularProgress size={24} /> : 'Confirmar Cambio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Sale Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar venta</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la venta <b>{ventaToDelete?.ventaNumero || ventaToDelete?.numeroVenta || `#${ventaToDelete?.id}`}</b>?
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
                  await documentoApi.delete(ventaToDelete.id);
                  setSales(sales.filter(sale => sale.id !== ventaToDelete.id));
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
          <Typography variant="body2">
            <strong>Este módulo integra con:</strong>
          </Typography>
          <Box component="ul" mt={1} sx={{ pl: 2 }}>
            <Typography component="li" variant="body2">
              <strong>Facturación:</strong> Para crear y editar ventas
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Presupuestos:</strong> Para convertir presupuestos en ventas
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Informes:</strong> Para análisis detallado de ventas
            </Typography>
            <Typography component="li" variant="body2">
              <strong>Inventario:</strong> Para control de stock
            </Typography>
          </Box>
        </Alert>
      </Box>
    </Box>
  );
};

export default RegistroVentasPage;