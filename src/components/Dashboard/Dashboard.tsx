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
  monthlySalesCount: number; // Added to track number of sales this month
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
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: color + '20',
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
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
      const currentMonth = new Date().getMonth(); // 8 (September)
      const currentYear = new Date().getFullYear(); // 2025
      const monthlySales = sales.filter((sale) => {
        const saleDate = new Date(sale.fechaVenta);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      });
      const monthlySalesAmount = monthlySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const monthlySalesCount = monthlySales.length; // Count sales for this month
      setStats({
        totalClients: clients.length,
        totalProducts: products.length,
        totalOrders: sales.length, // Use sales as orders
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && (
            <Typography variant="subtitle1">
              Hola {user.nombre || user.username}
            </Typography>
          )}
          <Chip
            icon={connectionStatus.connected ? <CheckCircleIcon /> : <ErrorIcon />}
            label={connectionStatus.connected ? 'Backend Connected' : 'Backend Disconnected'}
            color={connectionStatus.connected ? 'success' : 'error'}
            variant="outlined"
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
        <Alert severity="warning" sx={{ mb: 3 }}>
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {stats ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
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

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
            <Paper sx={{ p: 3, height: 300, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <RecentActivity />
            </Paper>
            <Paper sx={{ p: 3, height: 300, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-start' }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <QuickActions />
            </Paper>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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