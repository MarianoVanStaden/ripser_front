import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Paper,
  Chip,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Divider,
  Avatar,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  Category as CategoryIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { clientApi, productApi, documentoApi, parametroSistemaApi } from '../../api/services';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { testConnection } from '../../api/testConnection';
import BackendSetupDialog from '../BackendSetupDialog/BackendSetupDialog';
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import AdminDashboard from './AdminDashboard';
import VendedorDashboard from './VendedorDashboard';
import ProduccionDashboard from './ProduccionDashboard';
import TallerDashboard from './TallerDashboard';
import LoadingOverlay from '../common/LoadingOverlay';

interface DashboardStats {
  totalClients: number;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  monthlySalesAmount: number;
  monthlySalesCount: number;
  lowStockProducts: number;
  todaySales: number;
  weekSales: number;
  averageOrderValue: number;
  clientsThisMonth: number;
  productsOutOfStock: number;
  pendingOrders: number;
  completedOrdersToday: number;
  todayTrend: number;
  weekTrend: number;
  monthTrend: number;
}

interface TopProduct {
  id: number;
  nombre: string;
  categoria: string;
  stockActual: number;
  precio: number;
  salesCount?: number;
}

interface RecentSale {
  id: number;
  numeroDocumento: string;
  clienteNombre: string;
  total: number;
  fecha: string;
  estado: string;
}

interface ConnectionStatus {
  connected: boolean;
  message: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle, trend }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            p: { xs: 1, sm: 1.25 },
            borderRadius: 2,
            backgroundColor: color + '20',
            color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: { xs: 22, sm: 24, md: 26 } },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography
            variant="h4"
            component="div"
            fontWeight="bold"
            sx={{
              fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {trend.isPositive ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: trend.isPositive ? 'success.main' : 'error.main',
                  fontWeight: 600
                }}
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </Typography>
              {trend.label && (
                <Typography variant="caption" color="text.secondary">
                  {trend.label}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { empresaId } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    message: 'Checking connection...',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [metaVentasMensuales, setMetaVentasMensuales] = useState<number>(50); // Default 50

  useEffect(() => {
    checkConnection();
    fetchDashboardData();
    loadMetaVentas();
  }, [empresaId]); // Re-fetch when tenant changes

  const loadMetaVentas = async () => {
    try {
      const parametro = await parametroSistemaApi.getByClave('META_VENTAS_MENSUALES');
      setMetaVentasMensuales(parseInt(parametro.valor));
    } catch (error) {
      console.warn('No se pudo cargar META_VENTAS_MENSUALES, usando valor por defecto (50)');
      // Mantener el valor por defecto de 50 si hay error
    }
  };

  const checkConnection = async () => {
    try {
      const status = await testConnection();
      setConnectionStatus(status);
    } catch (err) {
      setConnectionStatus({
        connected: false,
        message: 'Failed to check backend connection',
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔍 DEBUG: Log current empresaId before making API calls
      const currentEmpresaId = sessionStorage.getItem('empresaId');
      console.log('🔍 Dashboard fetchDashboardData - empresaId from sessionStorage:', currentEmpresaId, 'from context:', empresaId);

      const [clientsData, productsData, allDocumentos, lowStock] = await Promise.all([
        clientApi.getAll().catch((err) => {
          throw new Error(`clientApi.getAll failed: ${err.response?.status} ${err.response?.data}`);
        }),
        productApi.getAll({ page: 0, size: 1000 }).catch((err) => {
          throw new Error(`productApi.getAll failed: ${err.response?.status} ${err.response?.data}`);
        }),
        documentoApi.getByTipo('FACTURA').catch((err) => {
          throw new Error(`documentoApi.getByTipo failed: ${err.response?.status} ${err.response?.data}`);
        }),
        productApi.getLowStock().catch((err) => {
          throw new Error(`productApi.getLowStock failed: ${err.response?.status} ${err.response?.data}`);
        }),
      ]);
      
      // Handle pagination/content extraction
      const clients = Array.isArray(clientsData) ? clientsData : (clientsData as any).content || [];
      const products = Array.isArray(productsData) ? productsData : (productsData as any).content || [];
      const documentos = Array.isArray(allDocumentos) ? allDocumentos : (allDocumentos as any).content || [];
      const lowStockItems = Array.isArray(lowStock) ? lowStock : (lowStock as any).content || [];

      // 🔍 DEBUG: Log what data was returned
      console.log('🔍 Dashboard data received:', {
        clientsCount: clients.length,
        firstClientIds: clients.slice(0, 3).map((c: any) => ({ id: c.id, nombre: c.nombre })),
        productsCount: products.length,
        documentosCount: documentos.length,
        firstDocumentosIds: documentos.slice(0, 3).map((d: any) => ({
          id: d.id,
          numero: d.numeroDocumento,
          clienteId: d.clienteId,
          clienteNombre: d.clienteNombre
        })),
        lowStockCount: lowStockItems.length,
      });

      // 🔍 DEBUG: Check if these clients belong to empresa 2
      if (clients.length > 0) {
        console.log('⚠️ VERIFY: Are these clients from empresa 2?', clients.slice(0, 5).map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          empresaId: c.empresaId || 'NOT IN RESPONSE'
        })));
      }

      // Filter only invoices (FAC-), exclude order notes (NP-)
      const sales = documentos.filter((doc: any) => {
        const numeroDoc = doc.numeroDocumento || doc.ventaNumero || '';
        return numeroDoc.startsWith('FAC-');
      });

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate time-based sales
      const monthlySales = sales.filter((sale: any) => {
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;
        if (!fechaVenta) return false;
        const saleDate = new Date(fechaVenta);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      });

      const todaySales = sales.filter((sale: any) => {
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;
        if (!fechaVenta) return false;
        const saleDate = new Date(fechaVenta);
        return saleDate >= today;
      });

      const weekSales = sales.filter((sale: any) => {
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;
        if (!fechaVenta) return false;
        const saleDate = new Date(fechaVenta);
        return saleDate >= weekAgo;
      });

      const monthlySalesAmount = monthlySales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);
      const todaySalesAmount = todaySales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);
      const weekSalesAmount = weekSales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);
      const averageOrderValue = sales.length > 0 ? sales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0) / sales.length : 0;

      // Calculate previous period sales for trends
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const lastMonthEnd = new Date(currentYear, currentMonth, 0);

      const yesterdaySales = sales.filter((sale: any) => {
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;
        if (!fechaVenta) return false;
        const saleDate = new Date(fechaVenta);
        return saleDate >= yesterday && saleDate < today;
      });

      const previousWeekSales = sales.filter((sale: any) => {
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;
        if (!fechaVenta) return false;
        const saleDate = new Date(fechaVenta);
        return saleDate >= twoWeeksAgo && saleDate < weekAgo;
      });

      const lastMonthSales = sales.filter((sale: any) => {
        const fechaVenta = sale.fechaEmision || sale.fechaVenta;
        if (!fechaVenta) return false;
        const saleDate = new Date(fechaVenta);
        return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
      });

      const yesterdaySalesAmount = yesterdaySales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);
      const previousWeekSalesAmount = previousWeekSales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);
      const lastMonthSalesAmount = lastMonthSales.reduce((sum: number, sale: any) => sum + Number(sale.total || 0), 0);

      // Calculate trend percentages
      const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const todayTrend = calculateTrend(todaySalesAmount, yesterdaySalesAmount);
      const weekTrend = calculateTrend(weekSalesAmount, previousWeekSalesAmount);
      const monthTrend = calculateTrend(monthlySalesAmount, lastMonthSalesAmount);

      // Clients this month
      const monthlyClients = clients.filter((client: any) => {
        const fechaAlta = client.fechaAlta;
        if (!fechaAlta) return false;
        const clientDate = new Date(fechaAlta);
        return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
      });

      // Products out of stock
      const outOfStock = products.filter((p: any) => p.stockActual === 0);

      // Set low stock products - Filter only active products
      const activeLowStock = lowStockItems.filter((p: any) => p.activo === true);
      setLowStockProducts(activeLowStock.slice(0, 5));

      // Top products by stock value
      const topProductsByValue = [...products]
        .sort((a: any, b: any) => (b.stockActual * b.precio) - (a.stockActual * a.precio))
        .slice(0, 5)
        .map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoriaProductoNombre || 'Sin categoría',
          stockActual: p.stockActual,
          precio: p.precio,
        }));
      setTopProducts(topProductsByValue);

      // Recent sales (last 5)
      const recentSalesData = sales
        .sort((a: any, b: any) => {
          const dateA = new Date(a.fechaEmision || a.fechaVenta || 0);
          const dateB = new Date(b.fechaEmision || b.fechaVenta || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map((sale: any) => ({
          id: sale.id,
          numeroDocumento: sale.numeroDocumento || sale.ventaNumero || 'N/A',
          clienteNombre: sale.clienteNombre || 'Cliente desconocido',
          total: sale.total,
          fecha: sale.fechaEmision || sale.fechaVenta,
          estado: sale.estado || 'COMPLETADO',
        }));
      setRecentSales(recentSalesData);

      setStats({
        totalClients: clients.length,
        totalProducts: products.length,
        totalOrders: sales.length,
        totalSales: sales.length,
        monthlySalesAmount,
        monthlySalesCount: monthlySales.length,
        lowStockProducts: activeLowStock.length, // Use filtered active products
        todaySales: todaySalesAmount,
        weekSales: weekSalesAmount,
        averageOrderValue,
        clientsThisMonth: monthlyClients.length,
        productsOutOfStock: outOfStock.length,
        pendingOrders: 0, // TODO: implement pending orders
        completedOrdersToday: todaySales.length,
        todayTrend,
        weekTrend,
        monthTrend,
      });
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err.message);
      if (err.message.includes('403')) {
        setError('Access denied. Please ensure you have the necessary permissions.');
      } else {
        setError('Failed to load dashboard data. Make sure your backend is running on http://localhost:8080');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    checkConnection();
    fetchDashboardData();
  };

  const renderDashboard = () => {
    // Debug: Log user information
    console.log('👤 Current user:', user);
    console.log('👤 User rol:', user?.rol);
    console.log('👤 User roles array:', user?.roles);
    
    // Check rol or roles array - handle both formats
    let userRole = user?.rol;
    if (!userRole && user?.roles && user.roles.length > 0) {
      userRole = user.roles[0];
    }
    
    console.log('🎯 Determined role:', userRole);
    
    // Normalize role to uppercase and trim whitespace
    const normalizedRole = userRole?.toString().trim().toUpperCase();
    console.log('✨ Normalized role:', normalizedRole);
    
    switch (normalizedRole) {
      case 'GERENTE':
        console.log('✅ Rendering AdminDashboard for GERENTE');
        return <AdminDashboard />;
      case 'VENDEDOR':
        console.log('✅ Rendering VendedorDashboard');
        return <VendedorDashboard />;
      case 'PRODUCCION':
        console.log('✅ Rendering ProduccionDashboard');
        return <ProduccionDashboard />;
      case 'TALLER':
        console.log('✅ Rendering TallerDashboard');
        return <TallerDashboard />;
      case 'LOGISTICA':
      case 'RRHH':
        return (
          <Box>
            <Typography variant="h4" gutterBottom>
              Dashboard de {normalizedRole}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Dashboard en construcción para el rol {normalizedRole}
            </Typography>
            <Alert severity="info">
              Las métricas y funcionalidades específicas para este rol se agregarán próximamente.
            </Alert>
          </Box>
        );
      case 'ADMIN':
        // ADMIN uses the full generic dashboard below
        console.log('✅ ADMIN - showing full dashboard');
        return null;
      default:
        console.log('⚠️ No specific dashboard found for role:', normalizedRole, '- showing generic');
        return null;
    }
  };

  // Check if user has a specific dashboard — do NOT gate on loading,
  // role is known immediately from auth context (no data fetch needed)
  const specificDashboard = renderDashboard();
  if (specificDashboard !== null) {
    return (
      <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto' }}>
        {specificDashboard}
      </Box>
    );
  }

  // Generic dashboard for users without specific role
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1600,
        mx: 'auto',
      }}
    >
      <LoadingOverlay open={loading} message="Cargando dashboard..." />
      {/* Header responsive */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: { xs: 2, sm: 3 },
        }}
      >
        {/* Welcome Section */}
        <Box>
          {user && (
            <Box sx={{ mb: 0.5 }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                sx={{
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 0.5,
                }}
              >
                ¡Hola, {user.username}! 👋
              </Typography>
              <Box
                component="div"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                Bienvenido de vuelta al panel de control
                {/* 🔍 DEBUG: Show current empresaId */}
                <Chip
                  label={`Empresa ID: ${empresaId || 'No seleccionada'}`}
                  size="small"
                  color={empresaId === 2 ? 'success' : 'warning'}
                  sx={{ ml: 1 }}
                />
                {user.roles && user.roles.length > 0 && (
                  <Chip
                    label={user.roles[0]}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </Box>
            </Box>
          )}
          {!user && (
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              sx={{ fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' } }}
            >
              Dashboard
            </Typography>
          )}
        </Box>

        {/* Actions Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Chip
            icon={connectionStatus.connected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={connectionStatus.connected ? 'Conectado' : 'Desconectado'}
            color={connectionStatus.connected ? 'success' : 'error'}
            variant="outlined"
            sx={{ height: 32 }}
          />
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSetupDialogOpen(true)}
            size="small"
          >
            Configurar
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
            size="small"
          >
            Actualizar
          </Button>
        </Box>
      </Box>

      {!connectionStatus.connected && (
        <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" gutterBottom>
            <strong>Backend Connection Failed:</strong> {connectionStatus.message}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Please ensure your Spring Boot backend is running on <code>http://localhost:8080/RipserApp</code>
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSetupDialogOpen(true)}
              startIcon={<SettingsIcon />}
            >
              Setup Guide
            </Button>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
          {error}
        </Alert>
      )}

      {stats ? (
        <>
          {/* Main KPIs - 8 cards grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: { xs: 1.5, sm: 2, md: 2.5 },
              mb: { xs: 2, sm: 3 },
            }}
          >
            <StatCard
              title="Ventas de Hoy"
              value={`$${stats.todaySales.toLocaleString()}`}
              icon={<MoneyIcon />}
              color="#2e7d32"
              subtitle={`${stats.completedOrdersToday} órdenes`}
              trend={{ value: Math.abs(stats.todayTrend), isPositive: stats.todayTrend >= 0, label: 'vs ayer' }}
            />
            <StatCard
              title="Ventas Semanales"
              value={`$${stats.weekSales.toLocaleString()}`}
              icon={<TrendingUpIcon />}
              color="#1976d2"
              subtitle="Últimos 7 días"
              trend={{ value: Math.abs(stats.weekTrend), isPositive: stats.weekTrend >= 0, label: 'vs semana anterior' }}
            />
            <StatCard
              title="Ventas Mensuales"
              value={`$${stats.monthlySalesAmount.toLocaleString()}`}
              icon={<AssessmentIcon />}
              color="#7b1fa2"
              subtitle={`${stats.monthlySalesCount} ventas`}
              trend={{ value: Math.abs(stats.monthTrend), isPositive: stats.monthTrend >= 0, label: 'vs mes anterior' }}
            />
            <StatCard
              title="Ticket Promedio"
              subtitle='Últimos 90 días'
              value={`$${stats.averageOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
              icon={<ShoppingCartIcon />}
              color="#ed6c02"
            />
          </Box>

          {/* Secondary KPIs */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: { xs: 1.5, sm: 2, md: 2.5 },
              mb: { xs: 3, sm: 4 },
            }}
          >
            <StatCard
              title="Total Clientes"
              value={stats.totalClients}
              icon={<PeopleIcon />}
              color="#0288d1"
              subtitle={`+${stats.clientsThisMonth} este mes`}
            />
            <StatCard
              title="Total Productos"
              value={stats.totalProducts}
              icon={<InventoryIcon />}
              color="#388e3c"
              subtitle={`${stats.productsOutOfStock} sin stock`}
            />
            <StatCard
              title="Stock Bajo"
              value={stats.lowStockProducts}
              icon={<WarningIcon />}
              color="#f57c00"
              subtitle="Requiere atención"
            />
            <StatCard
              title="Total Órdenes"
              value={stats.totalOrders}
              icon={<ShoppingCartIcon />}
              color="#5e35b1"
            />
          </Box>

          {/* Tabs Section */}
          <Card sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_e, newValue) => setTabValue(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
            >
              <Tab label="Resumen" />
              <Tab label="Top Productos" />
              <Tab label="Alertas" />
            </Tabs>

            {/* Tab 0: Overview */}
            {tabValue === 0 && (
              <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Recent Sales */}
                  <Grid item xs={12} lg={7}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      <ShippingIcon color="primary" />
                      Ventas Recientes
                    </Typography>
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: { xs: 500, sm: 'auto' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Nº Documento</strong></TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Cliente</strong></TableCell>
                            <TableCell align="right"><strong>Total</strong></TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Fecha</strong></TableCell>
                            <TableCell align="center"><strong>Estado</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentSales.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body2" color="text.secondary" py={2}>
                                  No hay ventas recientes
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            recentSales.map((sale) => (
                              <TableRow key={sale.id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="500" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    {sale.numeroDocumento}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{sale.clienteNombre}</TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="600" color="success.main">
                                    ${sale.total.toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                  <Typography variant="caption">
                                    {new Date(sale.fecha).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={sale.estado}
                                    size="small"
                                    color="success"
                                    sx={{ minWidth: 80 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          
                          )}
                          
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>


                  {/* Performance Indicators */}
                  <Grid item xs={12} lg={5}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon color="primary" />
                      Indicadores de Rendimiento
                    </Typography>
                    <Stack spacing={2.5}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Cumplimiento de Ventas Mensuales (Meta: {metaVentasMensuales})
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            {stats.monthlySalesCount > 0 ? Math.min(100, (stats.monthlySalesCount / metaVentasMensuales) * 100).toFixed(0) : 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={stats.monthlySalesCount > 0 ? Math.min(100, (stats.monthlySalesCount / metaVentasMensuales) * 100) : 0}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Productos en Stock
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            {((stats.totalProducts - stats.productsOutOfStock) / stats.totalProducts * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(stats.totalProducts - stats.productsOutOfStock) / stats.totalProducts * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="success"
                        />
                      </Box>

                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Crecimiento de Clientes
                          </Typography>
                          <Typography variant="body2" fontWeight="600">
                            {stats.totalClients > 0 ? ((stats.clientsThisMonth / stats.totalClients) * 100).toFixed(1) : 0}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={stats.totalClients > 0 ? Math.min(100, (stats.clientsThisMonth / stats.totalClients) * 100) : 0}
                          sx={{ height: 8, borderRadius: 4 }}
                          color="info"
                        />
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                          Actividad del Sistema
                        </Typography>
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: 'success.main' }} />
                              Órdenes Completadas Hoy
                            </Typography>
                            <Chip label={stats.completedOrdersToday} size="small" color="success" />
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: 'warning.main' }} />
                              Órdenes Pendientes
                            </Typography>
                            <Chip label={stats.pendingOrders} size="small" color="warning" />
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">
                              <WarningIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: 'error.main' }} />
                              Alertas de Stock
                            </Typography>
                            <Chip label={stats.lowStockProducts} size="small" color="error" />
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Tab 1: Top Products */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StarIcon color="primary" />
                  Productos con Mayor Valor en Inventario
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Producto</strong></TableCell>
                        <TableCell><strong>Categoría</strong></TableCell>
                        <TableCell align="center"><strong>Stock</strong></TableCell>
                        <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                        <TableCell align="right"><strong>Valor Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary" py={3}>
                              No hay datos de productos disponibles
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        topProducts.map((product, index) => (
                          <TableRow key={product.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: `hsl(${index * 70}, 70%, 50%)`,
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {index + 1}
                                </Avatar>
                                <Typography variant="body2" fontWeight="500">
                                  {product.nombre}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={product.categoria}
                                size="small"
                                variant="outlined"
                                icon={<CategoryIcon />}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={product.stockActual}
                                size="small"
                                color={product.stockActual > 50 ? 'success' : product.stockActual > 20 ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                ${product.precio.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="600" color="primary.main">
                                ${(product.stockActual * product.precio).toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Tab 2: Alerts */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  Alertas de Stock Bajo
                </Typography>

                {lowStockProducts.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="success.main" gutterBottom>
                      ¡Todo en orden!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No hay productos con stock bajo en este momento
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {lowStockProducts.map((product: any) => (
                      <Card key={product.id} variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box flex={1}>
                              <Typography variant="subtitle1" fontWeight="600">
                                {product.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {product.categoriaProductoNombre || 'Sin categoría'}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Chip
                                label={`Stock: ${product.stockActual}`}
                                color="error"
                                size="small"
                              />
                              <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                                Mínimo: {product.stockMinimo}
                              </Typography>
                            </Box>
                          </Box>
                          <Box mt={1.5}>
                            <LinearProgress
                              variant="determinate"
                              value={(product.stockActual / (product.stockMinimo * 2)) * 100}
                              color="error"
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Card>

          {/* Bottom Panels */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
              gap: { xs: 1.5, sm: 2, md: 3 },
            }}
          >
            <Paper
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                minHeight: { xs: 240, sm: 280, md: 300 },
                maxHeight: { md: 380 },
                overflow: 'auto',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
                Actividad Reciente
              </Typography>
              <RecentActivity />
            </Paper>

            <Paper
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                minHeight: { xs: 240, sm: 280, md: 300 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                justifyContent: 'flex-start',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.05rem', sm: '1.1rem' } }}>
                Acciones Rápidas
              </Typography>
              <QuickActions />
            </Paper>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: { xs: 5, sm: 6, md: 8 }, px: { xs: 2 } }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start your backend server to load dashboard data
          </Typography>
          <Button
            variant="contained"
            onClick={handleRetry}
            startIcon={<RefreshIcon />}
          >
            Try Again
          </Button>
        </Box>
      )}

      <BackendSetupDialog
        open={setupDialogOpen}
        onClose={() => setSetupDialogOpen(false)}
      />
    </Box>
  );
};

export default Dashboard;
