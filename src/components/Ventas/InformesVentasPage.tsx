import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { documentoApi, usuarioApi, opcionFinanciamientoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { generateSalesReportPDF, generateSaleDetailPDF } from '../../utils/pdfExportUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SaleRecord = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClientRecord = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UsuarioRecord = any;

const InformeVentasPage = () => {
  const { empresaId } = useTenant();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleRecord | null>(null);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<Record<number, unknown[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [vendedorFilter, setVendedorFilter] = useState('all');
  const [dateFromFilter, setDateFromFilter] = useState<Date | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Date | null>(null);
  const [tipoDocumentoFilter, setTipoDocumentoFilter] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const [groupBy, setGroupBy] = useState('Método de Pago');
  const [chartType, setChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, [empresaId]); // Re-fetch when tenant changes

const loadData = async () => {
  try {
    setLoading(true);
    setError(null);

    const [facturasResponse, notasCreditoResponse, usuariosResponse] = await Promise.all([
      documentoApi.getByTipo('FACTURA').catch(err => {
        console.error('Error loading facturas:', err);
        if (err.response?.status === 500) {
          throw new Error('Error en el servidor: Posible problema de integridad de datos. Contacte al administrador.');
        }
        throw err;
      }),
      documentoApi.getByTipo('NOTA_CREDITO').catch(err => {
        console.error('Error loading notas de crédito:', err);
        return [];
      }),
      usuarioApi.getAll().catch(() => []),
    ]);
    
    // Combine both document types
    const salesResponse = [...(Array.isArray(facturasResponse) ? facturasResponse : (facturasResponse as any).content || (facturasResponse as any).data || []),
                           ...(Array.isArray(notasCreditoResponse) ? notasCreditoResponse : (notasCreditoResponse as any).content || (notasCreditoResponse as any).data || [])];

    // Extract actual data from paginated responses
    const salesData = Array.isArray(salesResponse) ? salesResponse : (salesResponse as any).content || (salesResponse as any).data || [];
    const usuariosData = Array.isArray(usuariosResponse) ? usuariosResponse : (usuariosResponse as any).content || (usuariosResponse as any).data || [];

    console.log('Sales data:', salesData);
    console.log('Usuarios data:', usuariosData);


    console.log(`Total sales loaded: ${salesData.length}`);

    // Debug the usuarios structure
    console.log('=== USUARIOS DEBUG ===');
    console.log('Usuarios count:', usuariosData.length);
    if (usuariosData.length > 0) {
      console.log('First usuario:', usuariosData[0]);
      usuariosData.forEach((usuario: UsuarioRecord, index: number) => {
        console.log(`Usuario ${index}:`, {
          id: usuario.id,
          idType: typeof usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido
        });
      });
    }
    console.log('=== END USUARIOS DEBUG ===');

    // Create maps for faster lookups
    const usuariosMap = new Map();

    // Handle usuarios mapping
    if (Array.isArray(usuariosData)) {
      usuariosData.forEach(usuario => {
        if (usuario && usuario.id !== undefined && usuario.id !== null) {
          console.log(`Mapping usuario ID ${usuario.id} (type: ${typeof usuario.id}):`, usuario);
          
          // Map all possible formats of the ID
          usuariosMap.set(usuario.id, usuario);
          usuariosMap.set(String(usuario.id), usuario);
          
          // Only add parseInt if it's a valid number
          const parsedId = parseInt(usuario.id);
          if (!isNaN(parsedId)) {
            usuariosMap.set(parsedId, usuario);
          }
        }
      });
    }

    // Debug: Log the maps to see what we have
    console.log('Usuarios map keys:', Array.from(usuariosMap.keys()));
    console.log('Usuarios map size:', usuariosMap.size);
    
    // Test if usuario with ID 2 exists in different formats
    console.log('Usuario with ID 2:', usuariosMap.get(2));
    console.log('Usuario with ID "2":', usuariosMap.get("2"));

    // Enrich sales data with client and usuario information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedSales = salesData.map((sale: any) => {
      // Map cliente - DocumentoComercial has clienteId and clienteNombre
      let cliente = null;
      if (sale.cliente) {
        cliente = sale.cliente;
      } else if (sale.clienteId && sale.clienteNombre) {
        const nameParts = sale.clienteNombre.split(' ');
        cliente = {
          id: sale.clienteId,
          nombre: nameParts[0] || sale.clienteNombre,
          apellido: nameParts.slice(1).join(' ') || '',
        };
      }

      // Map usuario - DocumentoComercial has usuarioId and usuarioNombre
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
        };
      } else if (sale.usuarioId) {
        // Try to get from map
        const usuarioFromMap = usuariosMap.get(sale.usuarioId);
        if (usuarioFromMap) {
          usuario = usuarioFromMap;
        }
      }

      // Map detalles to detalleVentas for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detalleVentas = (sale.detalles || []).map((detalle: any) => ({
        ...detalle,
        producto: {
          id: detalle.productoId,
          nombre: detalle.productoNombre || detalle.descripcion || 'Producto desconocido',
          descripcion: detalle.descripcion || '',
        },
      }));

      // Map fechaEmision to fechaVenta for compatibility
      const fechaVenta = sale.fechaEmision || sale.fecha_venta || sale.fechaVenta;

      // Map numeroDocumento to numeroVenta for compatibility
      const numeroVenta = sale.numeroDocumento || sale.numero_venta || sale.numeroVenta;

      // Map estado
      const estado = sale.estado || 'CONFIRMADA';

      // Map observaciones to notas for compatibility
      const notas = sale.observaciones || sale.notas;

      // Preserve metodoPago from the backend
      const metodoPago = sale.metodoPago || sale.metodo_pago;

      return {
        ...sale,
        cliente,
        usuario,
        detalleVentas,
        fechaVenta,
        numeroVenta,
        estado,
        notas,
        metodoPago,
      };
    });

    // Sort by date descending (most recent first)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedSales = enrichedSales.sort((a: any, b: any) => {
      const dateA = new Date(a.fechaVenta || a.fecha_venta || 0).getTime();
      const dateB = new Date(b.fechaVenta || b.fecha_venta || 0).getTime();
      return dateB - dateA;
    });

    // Derive unique clients from enriched sales (no separate API call needed)
    const uniqueClientsMap = new Map<number, ClientRecord>();
    enrichedSales.forEach((sale: any) => {
      if (sale.cliente?.id) uniqueClientsMap.set(sale.cliente.id, sale.cliente);
    });

    setSales(sortedSales);
    setClients(Array.from(uniqueClientsMap.values()));
    setUsuarios(usuariosData);

    // Load opciones de financiamiento for each factura
    const opcionesMap: Record<number, unknown[]> = {};
    for (const sale of enrichedSales) {
      try {
        const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(sale.id);
        if (opciones && opciones.length > 0) {
          opcionesMap[sale.id] = opciones;
        }
      } catch (err) {
        console.warn(`No se pudieron cargar las opciones de financiamiento para la factura ${sale.id}:`, err);
      }
    }
    setOpcionesFinanciamiento(opcionesMap);

  } catch (err: unknown) {
    console.error('Error loading data:', err);
    setError(err instanceof Error ? err.message : 'Error al cargar los datos. Verifique la conexión con el servidor.');
  } finally {
    setLoading(false);
  }
};

  const handleViewSale = (sale: SaleRecord) => {
    setViewingSale(sale);
    setViewDialogOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ENVIADA: 'Enviada',
      CANCELADA: 'Cancelada',
      ENTREGADA: 'Entregada',
      CONFIRMADA: 'Confirmada',
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'error' | 'success' | 'default' | 'primary' | 'secondary' => {
    const statusColors: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default' | 'primary' | 'secondary'> = {
      PENDIENTE: 'warning',
      ENVIADA: 'info',
      CANCELADA: 'error',
      ENTREGADA: 'success',
      CONFIRMADA: 'success',
    };
    return statusColors[status] || 'default';
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA_CREDITO: 'Tarjeta de Crédito',
      TARJETA_DEBITO: 'Tarjeta de Débito',
      TRANSFERENCIA: 'Transferencia',
      CUENTA_CORRIENTE: 'Cuenta Corriente',
      CHEQUE: 'Cheque',
      FINANCIAMIENTO: 'Financiamiento',
    };
    return methods[method] || method;
  };

  const getTipoDocumentoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      FACTURA: 'Factura',
      NOTA_CREDITO: 'Nota de Crédito',
      NOTA_PEDIDO: 'Nota de Pedido',
      PRESUPUESTO: 'Presupuesto',
    };
    return tipos[tipo] || tipo;
  };

  const getTipoDocumentoColor = (tipo: string): 'warning' | 'info' | 'error' | 'success' | 'default' | 'primary' | 'secondary' => {
    const colors: Record<string, 'warning' | 'info' | 'error' | 'success' | 'default' | 'primary' | 'secondary'> = {
      FACTURA: 'primary',
      NOTA_CREDITO: 'error',
      NOTA_PEDIDO: 'warning',
      PRESUPUESTO: 'info',
    };
    return colors[tipo] || 'default';
  };

  function getClientFullName(cliente: ClientRecord) {
    if (!cliente) {
      return 'Cliente no disponible';
    }

    // Handle different possible field names
    const razonSocial = cliente.razonSocial || cliente.razon_social || cliente.businessName;
    const nombre = cliente.nombre || cliente.name || cliente.firstName;
    const apellido = cliente.apellido || cliente.surname || cliente.lastName;

    // First try business name / razon social
    if (razonSocial && razonSocial.trim()) {
      return razonSocial.trim();
    }

    // Then try combining first and last name
    const nameParts = [nombre, apellido].filter(part => part && part.trim());
    if (nameParts.length > 0) {
      return nameParts.join(' ').trim();
    }

    // Fallback to any available name field
    const fallbackName = cliente.fullName || cliente.displayName || cliente.email;
    if (fallbackName && fallbackName.trim()) {
      return fallbackName.trim();
    }

    // If we have an ID, show that at least
    if (cliente.id) {
      return `Cliente #${cliente.id}`;
    }

    return 'Cliente no disponible';
  }

const getUsuarioFullName = (usuario: UsuarioRecord, usuarioId: number | string | null = null) => {
  if (!usuario && !usuarioId) {
    return 'Vendedor no disponible';
  }

  // If we have the usuario object, use it
  if (usuario && typeof usuario === 'object') {
    // Handle different possible field names for usuario
    const possibleNameFields = [
      // Combined fields
      usuario.nombreCompleto,
      usuario.nombre_completo,
      usuario.fullName,
      usuario.full_name,
      usuario.displayName,
      usuario.display_name,
    ];

    // Try combined name fields first
    for (const nameField of possibleNameFields) {
      if (nameField && typeof nameField === 'string' && nameField.trim()) {
        return nameField.trim();
      }
    }

    // Try first and last name combinations
    const firstName = usuario.nombre || usuario.name || usuario.firstName || usuario.first_name;
    const lastName = usuario.apellido || usuario.surname || usuario.lastName || usuario.last_name;
    
    if (firstName && lastName) {
      return `${firstName.trim()} ${lastName.trim()}`;
    }
    
    if (firstName) {
      return firstName.trim();
    }

    if (lastName) {
      return lastName.trim();
    }

    // Fallback to other identification fields
    const fallbackFields = [
      usuario.username,
      usuario.user_name,
      usuario.login,
      usuario.email,
      usuario.cedula,
      usuario.documento
    ];

    for (const field of fallbackFields) {
      if (field && typeof field === 'string' && field.trim()) {
        return field.trim();
      }
    }

    // If we have an ID in the object, show that
    if (usuario.id) {
      return `Usuario #${usuario.id}`;
    }
  }

  // If we only have an ID, show that
  if (usuarioId) {
    return `Usuario #${usuarioId}`;
  }

  return 'Vendedor no disponible';
};

  const safeParseDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const filteredSales = sales.filter(sale => {
    const clientName = getClientFullName(sale.cliente);
    const usuarioName = getUsuarioFullName(sale.usuario);

    const matchesSearch =
      searchTerm === '' ||
      (sale.numeroVenta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       sale.numero_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       usuarioName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || sale.estado === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' ||
      sale.metodoPago === paymentMethodFilter ||
      sale.metodo_pago === paymentMethodFilter;

    const matchesClient = clientFilter === 'all' ||
      (sale.cliente?.id?.toString() === clientFilter) ||
      (sale.clienteId?.toString() === clientFilter) ||
      (sale.cliente_id?.toString() === clientFilter);

    const matchesVendedor = vendedorFilter === 'all' ||
      (sale.usuario?.id?.toString() === vendedorFilter) ||
      (sale.usuarioId?.toString() === vendedorFilter);
    
    const matchesTipoDocumento = tipoDocumentoFilter === 'all' || sale.tipoDocumento === tipoDocumentoFilter;

    const saleDate = safeParseDate(sale.fechaVenta || sale.fecha_venta);
    if (!saleDate) return false;

    const toDateEndOfDay = dateToFilter ? new Date(dateToFilter) : null;
    if (toDateEndOfDay) {
      toDateEndOfDay.setHours(23, 59, 59, 999);
    }

    const matchesDateFrom = !dateFromFilter || saleDate >= dateFromFilter;
    const matchesDateTo = !toDateEndOfDay || saleDate <= toDateEndOfDay;

    return matchesSearch && matchesStatus && matchesPaymentMethod &&
           matchesClient && matchesVendedor && matchesTipoDocumento && matchesDateFrom && matchesDateTo;
  });

  // Paginated sales
  const paginatedSales = useMemo(() => {
    return filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSales, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentMethodFilter('all');
    setClientFilter('all');
    setVendedorFilter('all');
    setDateFromFilter(null);
    setDateToFilter(null);
    setTipoDocumentoFilter('all');
  };

  const calculateTotals = () => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const totalTransactions = filteredSales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    return { totalRevenue, totalTransactions, averageOrderValue };
  };

  const { totalRevenue, totalTransactions, averageOrderValue } = calculateTotals();

  const generateSalesReport = (): Record<string, { count: number; total: number }> => {
    const groupedSales: Record<string, { count: number; total: number }> = {};
    filteredSales.forEach((sale: SaleRecord) => {
      const saleDate = safeParseDate(sale.fechaVenta || sale.fecha_venta) || new Date();
      let key = '';
      switch (groupBy) {
        case 'Dia':
          key = saleDate.toLocaleDateString();
          break;
        case 'Semana':
          key = `Semana ${Math.ceil(saleDate.getDate() / 7)}`;
          break;
        case 'Mes':
          key = saleDate.toLocaleString('default', { month: 'long' });
          break;
        case 'Año':
          key = saleDate.getFullYear().toString();
          break;
        case 'Tipo de Documento':
          key = getTipoDocumentoLabel(sale.tipoDocumento);
          break;
        case 'Estado':
          key = getStatusLabel(sale.estado);
          break;
        case 'Método de Pago':
          const tipoLabel = sale.tipoDocumento === 'NOTA_CREDITO' ? 'NC' : 'FAC';
          const paymentLabel = getPaymentMethodLabel(sale.metodoPago || sale.metodo_pago);
          key = `${paymentLabel} (${tipoLabel})`;
          break;
        case 'Cliente':
          key = getClientFullName(sale.cliente);
          break;
        case 'Vendedor':
          key = getUsuarioFullName(sale.usuario);
          break;
        default:
          key = 'Todos';
      }
      if (!groupedSales[key]) {
        groupedSales[key] = { count: 0, total: 0 };
      }
      groupedSales[key].count += 1;
      groupedSales[key].total += sale.total || 0;
    });
    return groupedSales;
  };

  const salesReport = generateSalesReport();

  const handleExportPDF = async () => {
    try {
      await generateSalesReportPDF(
        salesReport,
        {
          searchTerm,
          statusFilter,
          paymentMethodFilter,
          clientFilter,
          vendedorFilter,
          dateFromFilter,
          dateToFilter,
        },
        {
          totalRevenue,
          totalTransactions,
          averageOrderValue,
        },
        groupBy
      );
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  const handlePrintSaleDetail = async () => {
    if (!viewingSale) return;

    try {
      await generateSaleDetailPDF(
        viewingSale,
        opcionesFinanciamiento[viewingSale.id],
        getClientFullName,
        getUsuarioFullName,
        getStatusLabel,
        getPaymentMethodLabel
      );
    } catch (error) {
      console.error('Error al generar PDF de detalle:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
  };

  // Prepare chart data
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
    '#FF99E6', '#4169E1', '#FFD700', '#32CD32', '#FF4500', '#9932CC',
  ];

  const chartData = {
    labels: Object.keys(salesReport),
    datasets: [
      {
        label: 'Total Ventas ($)',
        data: Object.values(salesReport).map(item => item.total),
        backgroundColor: chartType === 'pie' ? chartColors : 'rgba(75, 192, 192, 0.6)',
        borderColor: chartType === 'pie' ? chartColors.map(c => c) : 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: chartType === 'line' ? false : true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          generateLabels: chartType === 'pie' ? (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          } : undefined,
        },
      },
      title: {
        display: true,
        text: `Ventas por ${groupBy}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || context.parsed.y || 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total ($)',
        },
        ticks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
      x: {
        title: {
          display: true,
          text: groupBy,
        },
      },
    } : {},
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
          <BarChartIcon />
          Informe de Ventas
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportPDF}
          >
            Exportar PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handleExportPDF}
          >
            Imprimir
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}



      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuración del Informe
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Informe</InputLabel>
                <Select
                  value={reportType}
                  label="Tipo de Informe"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="summary">Resumen</MenuItem>
                  <MenuItem value="detailed">Detallado</MenuItem>
                  <MenuItem value="comparative">Comparativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Agrupar por</InputLabel>
                <Select
                  value={groupBy}
                  label="Agrupar por"
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <MenuItem value="Dia">Día</MenuItem>
                  <MenuItem value="Semana">Semana</MenuItem>
                  <MenuItem value="Mes">Mes</MenuItem>
                  <MenuItem value="Año">Año</MenuItem>
                  <MenuItem value="Tipo de Documento">Tipo de Documento</MenuItem>
                  <MenuItem value="Estado">Estado</MenuItem>
                  <MenuItem value="Método de Pago">Método de Pago</MenuItem>
                  <MenuItem value="Cliente">Cliente</MenuItem>
                  <MenuItem value="Vendedor">Vendedor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Gráfico</InputLabel>
                <Select
                  value={chartType}
                  label="Tipo de Gráfico"
                  onChange={(e) => setChartType(e.target.value as 'pie' | 'bar' | 'line')}
                >
                  <MenuItem value="bar">Barras</MenuItem>
                  <MenuItem value="pie">Torta</MenuItem>
                  <MenuItem value="line">Líneas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <FilterListIcon />
            <Typography variant="h6">Filtros</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número, cliente..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
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
                  <MenuItem value="FINANCIAMIENTO">Financiamiento</MenuItem>
                  <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={clientFilter}
                  label="Cliente"
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {getClientFullName(client)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={vendedorFilter}
                  label="Vendedor"
                  onChange={(e) => setVendedorFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {usuarios.map(usuario => (
                    <MenuItem key={usuario.id} value={usuario.id.toString()}>
                      {getUsuarioFullName(usuario)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Desde"
                  value={dateFromFilter}
                  onChange={(newValue) => setDateFromFilter(newValue as Date | null)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Hasta"
                  value={dateToFilter}
                  onChange={(newValue) => setDateToFilter(newValue as Date | null)}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Visualización del Informe
          </Typography>
          <Box sx={{ height: 400, mb: 3 }}>
            {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
            {chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
            {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
          </Box>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 500, sm: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>{groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Cantidad de Ventas</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Total</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Porcentaje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(salesReport).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell align="right">{value.count}</TableCell>
                    <TableCell align="right">${value.total.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {totalRevenue > 0 ? ((value.total / totalRevenue) * 100).toFixed(2) : 0}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>{totalTransactions}</strong></TableCell>
                  <TableCell align="right"><strong>${totalRevenue.toLocaleString()}</strong></TableCell>
                  <TableCell align="right"><strong>100%</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Detalle de Ventas ({filteredSales.length})
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 80 }}>ID</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Tipo</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Fecha</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Cliente</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Vendedor</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Total</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Método de Pago</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{sale.id}
                      </Typography>                
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTipoDocumentoLabel(sale.tipoDocumento)}
                        color={getTipoDocumentoColor(sale.tipoDocumento)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {(sale.fechaVenta || sale.fecha_venta) ? 
                        new Date(sale.fechaVenta || sale.fecha_venta).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getClientFullName(sale.cliente)}
                      </Typography>
                    </TableCell>
                    <TableCell>
  <Typography variant="body2">
    {getUsuarioFullName(sale.usuario)}
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
                        label={getPaymentMethodLabel(sale.metodoPago || sale.metodo_pago)}
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
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
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
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </CardContent>
      </Card>

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
                    <Typography><strong>Número:</strong> {viewingSale.numeroVenta || 'N/A'}</Typography>
                    <Typography><strong>Fecha:</strong> {new Date(viewingSale.fechaVenta).toLocaleDateString()}</Typography>
                    <Typography><strong>Estado:</strong> {getStatusLabel(viewingSale.estado)}</Typography>
                    <Typography><strong>Método de Pago:</strong> {getPaymentMethodLabel(viewingSale.metodoPago)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cliente y Vendedor
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography>
                      <strong>Cliente:</strong> {getClientFullName(viewingSale.cliente)}
                    </Typography>
                    {viewingSale.cliente?.email && (
                      <Typography variant="body2" color="text.secondary">
                        Email: {viewingSale.cliente.email}
                      </Typography>
                    )}
                    <Typography sx={{ mt: 2 }}>
                      <strong>Vendedor:</strong> {getUsuarioFullName(viewingSale.usuario)}
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
                        {viewingSale.detalleVentas.map((item: any, index: number) => (
                          <TableRow key={item.id || index}>
                            <TableCell>
                              {item.tipoItem === 'EQUIPO' ? (
                                <>
                                  <Typography variant="body2">
                                    {item.recetaNombre || item.descripcionEquipo || 'Equipo'}
                                  </Typography>
                                  {item.equiposNumerosHeladera && item.equiposNumerosHeladera.length > 0 && (
                                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                                      Equipos: {item.equiposNumerosHeladera.join(', ')}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Typography variant="body2">
                                  {item.producto?.nombre || item.productoNombre || 'Producto no disponible'}
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
                <Alert severity="info">
                  No hay productos asociados a esta venta
                </Alert>
              )}

              {/* Opciones de Financiamiento */}
              {opcionesFinanciamiento[viewingSale.id] && opcionesFinanciamiento[viewingSale.id].length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" mb={2}>
                    Opciones de Financiamiento
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Opción</TableCell>
                          <TableCell>Método de Pago</TableCell>
                          <TableCell align="center">Cuotas</TableCell>
                          <TableCell align="right">Tasa (%)</TableCell>
                          <TableCell align="right">Monto Total</TableCell>
                          <TableCell align="right">Monto Cuota</TableCell>
                          <TableCell align="center">Seleccionada</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {opcionesFinanciamiento[viewingSale.id].map((opcion: any, index: number) => (
                          <TableRow key={(opcion as any).id || index}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={opcion.esSeleccionada ? 'bold' : 'normal'}>
                                {opcion.nombre}
                              </Typography>
                              {opcion.descripcion && (
                                <Typography variant="caption" color="text.secondary">
                                  {opcion.descripcion}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{getPaymentMethodLabel(opcion.metodoPago)}</TableCell>
                            <TableCell align="center">{opcion.cantidadCuotas}</TableCell>
                            <TableCell align="right">{opcion.tasaInteres}%</TableCell>
                            <TableCell align="right">${opcion.montoTotal?.toLocaleString()}</TableCell>
                            <TableCell align="right">${opcion.montoCuota?.toLocaleString()}</TableCell>
                            <TableCell align="center">
                              {opcion.esSeleccionada && <Chip label="Sí" color="success" size="small" />}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  {viewingSale.notas && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notas
                      </Typography>
                      <Typography variant="body2">
                        {viewingSale.notas}
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
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintSaleDetail}
          >
            Imprimir PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InformeVentasPage;