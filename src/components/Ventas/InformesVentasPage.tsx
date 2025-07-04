import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Print as PrintIcon,
  GetApp as GetAppIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { saleApi, clientApi, employeeApi, productApi } from '../../api/services';
import type { Sale, Client, Employee, Product } from '../../types';

interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalTransactions: number;
  topClient: Client | null;
  topEmployee: Employee | null;
  topProduct: Product | null;
  monthlyGrowth: number;
}

interface SalesReportData {
  period: string;
  sales: number;
  revenue: number;
  transactions: number;
}

const InformesVentasPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [reportData, setReportData] = useState<SalesReportData[]>([]);
  
  // Filter states
  const [reportType, setReportType] = useState<string>('monthly');
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      calculateMetrics();
      generateReportData();
    }
  }, [sales, reportType, dateFrom, dateTo, selectedClient, selectedEmployee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [salesData, clientsData, employeesData, productsData] = await Promise.all([
        saleApi.getAll(),
        clientApi.getAll(),
        employeeApi.getAll(),
        productApi.getAll(),
      ]);

      setSales(salesData);
      setClients(clientsData);
      setEmployees(employeesData);
      setProducts(productsData);
    } catch (err) {
      setError('Error al cargar los datos para el informe');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSales = () => {
    return sales.filter((sale: Sale) => {
      const saleDate = new Date(sale.saleDate);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      const dateMatch = saleDate >= fromDate && saleDate <= toDate;
      const clientMatch = selectedClient === 'all' || sale.clientId.toString() === selectedClient;
      const employeeMatch = selectedEmployee === 'all' || sale.employeeId.toString() === selectedEmployee;

      return dateMatch && clientMatch && employeeMatch;
    });
  };

  const calculateMetrics = () => {
    const filteredSales = getFilteredSales();
    
    if (filteredSales.length === 0) {
      setMetrics({
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalTransactions: 0,
        topClient: null,
        topEmployee: null,
        topProduct: null,
        monthlyGrowth: 0,
      });
      return;
    }

    const totalRevenue = filteredSales.reduce((sum: number, sale: Sale) => sum + (sale.total || sale.totalAmount || 0), 0);
    const totalTransactions = filteredSales.length;
    const averageOrderValue = totalRevenue / totalTransactions;

    // Calculate top client
    const clientSales = clients.map((client: Client) => {
      const clientRevenue = filteredSales
        .filter((sale: Sale) => sale.clientId === client.id)
        .reduce((sum: number, sale: Sale) => sum + (sale.total || sale.totalAmount || 0), 0);
      return { client, revenue: clientRevenue };
    });
    const topClient = clientSales.reduce((prev: any, current: any) => 
      current.revenue > prev.revenue ? current : prev, { client: null, revenue: 0 }
    ).client;

    // Calculate top employee
    const employeeSales = employees.map((employee: Employee) => {
      const employeeRevenue = filteredSales
        .filter((sale: Sale) => sale.employeeId === employee.id)
        .reduce((sum: number, sale: Sale) => sum + (sale.total || sale.totalAmount || 0), 0);
      return { employee, revenue: employeeRevenue };
    });
    const topEmployee = employeeSales.reduce((prev: any, current: any) => 
      current.revenue > prev.revenue ? current : prev, { employee: null, revenue: 0 }
    ).employee;

    // Calculate monthly growth (simplified)
    const currentMonth = new Date().getMonth();
    const currentMonthSales = filteredSales.filter((sale: Sale) => 
      new Date(sale.saleDate).getMonth() === currentMonth
    );
    const previousMonthSales = filteredSales.filter((sale: Sale) => 
      new Date(sale.saleDate).getMonth() === currentMonth - 1
    );
    
    const currentMonthRevenue = currentMonthSales.reduce((sum: number, sale: Sale) => sum + (sale.total || sale.totalAmount || 0), 0);
    const previousMonthRevenue = previousMonthSales.reduce((sum: number, sale: Sale) => sum + (sale.total || sale.totalAmount || 0), 0);
    
    const monthlyGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    setMetrics({
      totalSales: filteredSales.length,
      totalRevenue,
      averageOrderValue,
      totalTransactions,
      topClient,
      topEmployee,
      topProduct: products[0] || null, // Simplified for now
      monthlyGrowth,
    });
  };

  const generateReportData = () => {
    const filteredSales = getFilteredSales();
    
    if (reportType === 'daily') {
      // Group by day
      const dailyData = new Map<string, { sales: number; revenue: number; transactions: number }>();
      
      filteredSales.forEach((sale: Sale) => {
        const dateKey = new Date(sale.saleDate).toISOString().split('T')[0];
        const existing = dailyData.get(dateKey) || { sales: 0, revenue: 0, transactions: 0 };
        dailyData.set(dateKey, {
          sales: existing.sales + 1,
          revenue: existing.revenue + (sale.total || sale.totalAmount || 0),
          transactions: existing.transactions + 1,
        });
      });

      const reportArray = Array.from(dailyData.entries()).map(([period, data]) => ({
        period,
        ...data,
      }));
      
      setReportData(reportArray.sort((a, b) => a.period.localeCompare(b.period)));
    } else if (reportType === 'monthly') {
      // Group by month
      const monthlyData = new Map<string, { sales: number; revenue: number; transactions: number }>();
      
      filteredSales.forEach((sale: Sale) => {
        const date = new Date(sale.saleDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey) || { sales: 0, revenue: 0, transactions: 0 };
        monthlyData.set(monthKey, {
          sales: existing.sales + 1,
          revenue: existing.revenue + (sale.total || sale.totalAmount || 0),
          transactions: existing.transactions + 1,
        });
      });

      const reportArray = Array.from(monthlyData.entries()).map(([period, data]) => ({
        period,
        ...data,
      }));
      
      setReportData(reportArray.sort((a, b) => a.period.localeCompare(b.period)));
    }
  };

  const handleExportReport = () => {
    alert('Funcionalidad de exportación en desarrollo');
  };

  const handlePrintReport = () => {
    window.print();
  };

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
          <AssessmentIcon />
          Informes de Ventas
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrintReport}
          >
            Imprimir
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => alert('Exportar PDF en desarrollo')}
          >
            Exportar PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={handleExportReport}
          >
            Exportar Excel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Filtros del Reporte</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Reporte</InputLabel>
                <Select
                  value={reportType}
                  label="Tipo de Reporte"
                  onChange={(e: any) => setReportType(e.target.value)}
                >
                  <MenuItem value="daily">Diario</MenuItem>
                  <MenuItem value="monthly">Mensual</MenuItem>
                  <MenuItem value="yearly">Anual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                type="date"
                label="Fecha Desde"
                size="small"
                fullWidth
                value={dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                type="date"
                label="Fecha Hasta"
                size="small"
                fullWidth
                value={dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={selectedClient}
                  label="Cliente"
                  onChange={(e: any) => setSelectedClient(e.target.value)}
                >
                  <MenuItem value="all">Todos los Clientes</MenuItem>
                  {clients.map((client: Client) => (
                    <MenuItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Vendedor"
                  onChange={(e: any) => setSelectedEmployee(e.target.value)}
                >
                  <MenuItem value="all">Todos los Vendedores</MenuItem>
                  {employees.map((employee: Employee) => (
                    <MenuItem key={employee.id} value={employee.id.toString()}>
                      {employee.firstName} {employee.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Ventas
                    </Typography>
                    <Typography variant="h4">
                      {metrics.totalSales}
                    </Typography>
                  </Box>
                  <BarChartIcon color="primary" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Ingresos Totales
                    </Typography>
                    <Typography variant="h4">
                      ${metrics.totalRevenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Valor Promedio
                    </Typography>
                    <Typography variant="h4">
                      ${metrics.averageOrderValue.toFixed(0)}
                    </Typography>
                  </Box>
                  <PieChartIcon color="info" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Crecimiento Mensual
                    </Typography>
                    <Typography variant="h4">
                      {metrics.monthlyGrowth.toFixed(1)}%
                    </Typography>
                  </Box>
                  <TimelineIcon 
                    color={metrics.monthlyGrowth >= 0 ? "success" : "error"} 
                    sx={{ fontSize: 40 }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Top Performers */}
      {metrics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Mejor Cliente</Typography>
                {metrics.topClient ? (
                  <Box>
                    <Typography variant="h5">{metrics.topClient.name}</Typography>
                    <Typography color="textSecondary">{metrics.topClient.email}</Typography>
                  </Box>
                ) : (
                  <Typography color="textSecondary">No hay datos</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Mejor Vendedor</Typography>
                {metrics.topEmployee ? (
                  <Box>
                    <Typography variant="h5">
                      {metrics.topEmployee.firstName} {metrics.topEmployee.lastName}
                    </Typography>
                    <Typography color="textSecondary">{metrics.topEmployee.position}</Typography>
                  </Box>
                ) : (
                  <Typography color="textSecondary">No hay datos</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Producto Destacado</Typography>
                {metrics.topProduct ? (
                  <Box>
                    <Typography variant="h5">{metrics.topProduct.name}</Typography>
                    <Typography color="textSecondary">
                      ${metrics.topProduct.price.toLocaleString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography color="textSecondary">No hay datos</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Report Data Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>
            Detalle del Reporte - {reportType === 'daily' ? 'Diario' : 'Mensual'}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Período</TableCell>
                  <TableCell align="center">Ventas</TableCell>
                  <TableCell align="right">Ingresos</TableCell>
                  <TableCell align="center">Transacciones</TableCell>
                  <TableCell align="right">Promedio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row: SalesReportData, index: number) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {reportType === 'daily' 
                          ? new Date(row.period).toLocaleDateString()
                          : row.period
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={row.sales} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${row.revenue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{row.transactions}</TableCell>
                    <TableCell align="right">
                      ${(row.revenue / (row.transactions || 1)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary">
                        No hay datos para mostrar en el período seleccionado
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box mt={3}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Próximas funcionalidades:</strong>
          </Typography>
          <Box component="ul" mt={1} sx={{ pl: 2 }}>
            <Typography component="li" variant="body2">Gráficos interactivos con Chart.js o Recharts</Typography>
            <Typography component="li" variant="body2">Comparación entre períodos</Typography>
            <Typography component="li" variant="body2">Análisis de tendencias y predicciones</Typography>
            <Typography component="li" variant="body2">Reportes personalizados por usuario</Typography>
            <Typography component="li" variant="body2">Exportación a múltiples formatos</Typography>
            <Typography component="li" variant="body2">Programación de reportes automáticos</Typography>
          </Box>
        </Alert>
      </Box>
    </Box>
  );
};

export default InformesVentasPage;
