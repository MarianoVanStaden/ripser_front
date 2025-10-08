import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Check as CheckIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as QrCodeIcon,
} from '@mui/icons-material';
import { movimientoStockApi } from '../../api/services';
import type { MovimientoStock } from '../../types';

interface RecountTask extends MovimientoStock {
  // All fields from MovimientoStock, particularly:
  // id, producto, stockAnterior, stockActual (null for pending), concepto
}

const RecountTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<RecountTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RecountTask | null>(null);
  const [countedQuantity, setCountedQuantity] = useState<string>('');

  useEffect(() => {
    loadPendingRecounts();
  }, []);

  const loadPendingRecounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pendingRecounts = await movimientoStockApi.getRecuentosPendientes();
      
      console.log('Pending recounts loaded:', pendingRecounts.length);
      setTasks(pendingRecounts);
      
    } catch (err) {
      setError('Error al cargar las tareas de recuento');
      console.error('Error loading recount tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteDialog = (task: RecountTask) => {
    setSelectedTask(task);
    setCountedQuantity(''); // Start with empty to force manual entry
    setCompleteDialogOpen(true);
  };

  const handleCompleteRecount = async () => {
    if (!selectedTask || !countedQuantity) {
      alert('Por favor ingresa la cantidad contada');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cantidad = parseInt(countedQuantity);
      
      if (isNaN(cantidad) || cantidad < 0) {
        alert('Por favor ingresa una cantidad válida (número entero positivo)');
        return;
      }

      console.log(`Completing recount for task ${selectedTask.id} with quantity ${cantidad}`);
      
      // Call backend API to complete the recount
      await movimientoStockApi.completarRecuento(selectedTask.id!, cantidad);
      
      setCompleteDialogOpen(false);
      setSelectedTask(null);
      setCountedQuantity('');
      
      // Show success message
      const difference = cantidad - (selectedTask.stockAnterior || 0);
      const message = difference === 0
        ? '✅ Recuento completado. No hay diferencias.'
        : `✅ Recuento completado.\n\n` +
          `Stock esperado: ${selectedTask.stockAnterior}\n` +
          `Stock real: ${cantidad}\n` +
          `Diferencia: ${difference > 0 ? '+' : ''}${difference}\n\n` +
          `Se ha creado automáticamente un ajuste de inventario.`;
      
      alert(message);
      
      // Reload pending recounts
      await loadPendingRecounts();
      
    } catch (err) {
      setError('Error al completar el recuento');
      console.error('Error completing recount:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (task: RecountTask): string => {
    if (typeof task.producto === 'object' && task.producto !== null) {
      return task.producto.nombre || 'Producto sin nombre';
    }
    return 'Producto desconocido';
  };

  const getProductSKU = (task: RecountTask): string => {
    if (typeof task.producto === 'object' && task.producto !== null) {
      return task.producto.codigo || '-';
    }
    return '-';
  };

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📋 Tareas de Recuento
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPendingRecounts}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Pendientes: {tasks.length}
            </Typography>
            {tasks.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Realiza el conteo físico e ingresa las cantidades reales
              </Typography>
            )}
          </Box>

          {tasks.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ✅ No hay tareas de recuento pendientes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inicia un nuevo recuento desde la página de Inventario
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Stock Esperado</TableCell>
                    <TableCell>Notas</TableCell>
                    <TableCell>Comprobante</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Chip 
                          label={getProductSKU(task)} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {getProductName(task)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {task.stockAnterior ?? 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {task.concepto || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={task.numeroComprobante || 'N/A'} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckIcon />}
                          onClick={() => handleOpenCompleteDialog(task)}
                        >
                          Contar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Complete Recount Dialog */}
      <Dialog 
        open={completeDialogOpen} 
        onClose={() => setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Completar Recuento
        </DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Producto:</strong> {getProductName(selectedTask)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>SKU:</strong> {getProductSKU(selectedTask)}
              </Typography>
              <Typography variant="body1" gutterBottom color="primary">
                <strong>Stock Esperado:</strong> {selectedTask.stockAnterior ?? 0}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Cantidad Contada (física)"
                  type="number"
                  fullWidth
                  value={countedQuantity}
                  onChange={(e) => setCountedQuantity(e.target.value)}
                  autoFocus
                  required
                  InputProps={{
                    inputProps: { min: 0, step: 1 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" disabled>
                          <QrCodeIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Ingresa la cantidad real encontrada en el inventario físico"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCompleteRecount();
                    }
                  }}
                />
              </Box>

              {countedQuantity && !isNaN(parseInt(countedQuantity)) && (
                <Alert 
                  severity={
                    parseInt(countedQuantity) === (selectedTask.stockAnterior ?? 0)
                      ? 'success'
                      : 'warning'
                  } 
                  sx={{ mt: 2 }}
                >
                  {parseInt(countedQuantity) === (selectedTask.stockAnterior ?? 0) ? (
                    '✅ La cantidad coincide con el stock esperado'
                  ) : (
                    <>
                      <strong>Diferencia detectada:</strong>{' '}
                      {parseInt(countedQuantity) - (selectedTask.stockAnterior ?? 0) > 0 ? '+' : ''}
                      {parseInt(countedQuantity) - (selectedTask.stockAnterior ?? 0)} unidades
                      <br />
                      Se creará automáticamente un ajuste de inventario.
                    </>
                  )}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCompleteRecount} 
            variant="contained"
            disabled={!countedQuantity || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Completar Recuento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecountTasksPage;
