import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
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
} from '@mui/icons-material';
import { clientApi, productApi, saleApi } from '../../api/services';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { testConnection } from '../../api/testConnection';
import BackendSetupDialog from '../BackendSetupDialog/BackendSetupDialog';
import { useAuth } from "../../context/AuthContext";

interface DashboardStats {
  totalClients: number;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  monthlySalesAmount: number;
  monthlySalesCount: number;
  lowStockProducts: number;
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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    message: 'Checking connection...',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

  useEffect(() => {
    checkConnection();
    fetchDashboardData();
  }, []);

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
      const [clients, products, sales, lowStockProducts] = await Promise.all([
        clientApi.getAll().catch((err) => {
          throw new Error(`clientApi.getAll failed: ${err.response?.status} ${err.response?.data}`);
        }),
        productApi.getAll(0, 100).catch((err) => {
          throw new Error(`productApi.getAll failed: ${err.response?.status} ${err.response?.data}`);
        }),
        saleApi.getAll().catch((err) => {
          throw new Error(`saleApi.getAll failed: ${err.response?.status} ${err.response?.data}`);
        }),
        productApi.getLowStock().catch((err) => {
          throw new Error(`productApi.getLowStock failed: ${err.response?.status} ${err.response?.data}`);
        }),
      ]);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlySales = sales.filter((sale) => {
        const saleDate = new Date(sale.fechaVenta);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      });
      const monthlySalesAmount = monthlySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const monthlySalesCount = monthlySales.length;
      setStats({
        totalClients: clients.length,
        totalProducts: products.length,
        totalOrders: sales.length,
        totalSales: sales.length,
        monthlySalesAmount,
        monthlySalesCount,
        lowStockProducts: lowStockProducts.length,
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: 280, sm: 360, md: 400 }, px: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
      {/* Header responsive */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          rowGap: 1.5,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{ m: 0, fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' } }}
        >
          Dashboard
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {user && (
            <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Hola {user.nombre || user.username}
            </Typography>
          )}
          <Chip
            icon={connectionStatus.connected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={connectionStatus.connected ? 'Backend Connected' : 'Backend Disconnected'}
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
            Setup
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
            size="small"
          >
            Refresh
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
          {/* KPIs responsive */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: { xs: 1.5, sm: 2, md: 3 },
              mb: { xs: 2, sm: 3, md: 4 },
            }}
          >
            <StatCard
              title="Total Clients"
              value={stats.totalClients}
              icon={<PeopleIcon />}
              color="#1976d2"
            />
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon={<InventoryIcon />}
              color="#388e3c"
              subtitle={`${stats.lowStockProducts} low stock`}
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={<ShoppingCartIcon />}
              color="#f57c00"
            />
            <StatCard
              title="Monthly Sales"
              value={`$${stats.monthlySalesAmount.toLocaleString()}`}
              icon={<TrendingUpIcon />}
              color="#7b1fa2"
              subtitle={`${stats.monthlySalesCount} sales this month`}
            />
          </Box>

          {/* Panels inferiores responsive */}
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
                Recent Activity
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
                Quick Actions
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
