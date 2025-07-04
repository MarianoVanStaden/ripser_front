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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { Sale } from '../../types';
import { saleApi } from '../../api/services';

const RegistroVentasPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await saleApi.getAll();
      setSales(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las ventas. Asegúrese de que el backend esté funcionando.');
      console.error('Error loading sales:', err);
      // Fallback to mock data if API fails
      // setSales(mockSales);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT_CARD: 'Tarjeta de Crédito',
      DEBIT_CARD: 'Tarjeta de Débito',
      BANK_TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
    };
    return methods[method] || method;
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
          <ReceiptIcon />
          Registro de Ventas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => alert('Funcionalidad en desarrollo')}
        >
          Nueva Venta
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Método de Pago</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{sale.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>Cliente #{sale.clientId}</TableCell>
                    <TableCell>Vendedor #{sale.employeeId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${sale.totalAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPaymentMethodLabel(sale.paymentMethod)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{sale.notes}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" title="Ver detalles">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton size="small" title="Editar">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" title="Imprimir">
                        <PrintIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box mt={3}>
        <Typography variant="body2" color="text.secondary">
          Esta página está en desarrollo. Próximamente se agregará funcionalidad completa para:
        </Typography>
        <Box component="ul" mt={1}>
          <li>Crear nuevas ventas con múltiples artículos</li>
          <li>Gestión de facturas y comprobantes</li>
          <li>Búsqueda y filtros avanzados</li>
          <li>Reportes de ventas por período</li>
          <li>Integración con inventario</li>
        </Box>
      </Box>
    </Box>
  );
};

export default RegistroVentasPage;
