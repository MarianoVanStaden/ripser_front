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
import LoadingOverlay from '../common/LoadingOverlay';

interface RecountTask extends MovimientoStock {
  // All fields from MovimientoStock, particularly:
  // id, producto, stockAnterior, stockActual (null for pending), concepto
}

const RecountTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<RecountTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ title: string; content: string; severity: 'success' | 'warning' | 'error' }>({
    title: '',
    content: '',
    severity: 'success'
  });
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
      setError('Por favor ingresa la cantidad contada');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const cantidad = parseInt(countedQuantity);

      if (isNaN(cantidad) || cantidad < 0) {
        setError('Por favor ingresa una cantidad válida (número entero positivo)');
        setLoading(false);
        return;
      }

      console.log(`Completing recount for task ${selectedTask.id} with quantity ${cantidad}`);

      // Call backend API to complete the recount
      await movimientoStockApi.completarRecuento(selectedTask.id!, cantidad);

      setCompleteDialogOpen(false);

      // Show success message with details
      const difference = cantidad - (selectedTask.stockAnterior || 0);
      const productName = getProductName(selectedTask);

      if (difference === 0) {
        setResultMessage({
          title: 'Recuento Completado',
          content: `El producto "${productName}" tiene el stock correcto. No se detectaron diferencias.`,
          severity: 'success'
        });
      } else if (difference > 0) {
        setResultMessage({
          title: 'Recuento Completado - Sobrante Detectado',
          content: `Producto: ${productName}\n\nStock esperado: ${selectedTask.stockAnterior}\nStock real: ${cantidad}\nDiferencia: +${difference} unidades (SOBRANTE)\n\nSe ha creado automáticamente un ajuste de inventario tipo ENTRADA.`,
          severity: 'warning'
        });
      } else {
        setResultMessage({
          title: 'Recuento Completado - Faltante Detectado',
          content: `Producto: ${productName}\n\nStock esperado: ${selectedTask.stockAnterior}\nStock real: ${cantidad}\nDiferencia: ${difference} unidades (FALTANTE)\n\nSe ha creado automáticamente un ajuste de inventario tipo SALIDA.`,
          severity: 'warning'
        });
      }

      setResultDialogOpen(true);
      setSelectedTask(null);
      setCountedQuantity('');

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
    // Backend returns productoNombre as a flat field
    if (task.productoNombre) {
      return task.productoNombre;
    }
    // Fallback to producto object if it exists
    if (typeof task.producto === 'object' && task.producto !== null) {
      return task.producto.nombre || 'Producto sin nombre';
    }
    return 'Producto desconocido';
  };

  const getProductCode = (task: RecountTask): string => {
    // Backend returns productoCodigo as a flat field
    if (task.productoCodigo) {
      return task.productoCodigo;
    }
    // Fallback to producto object if it exists
    if (typeof task.producto === 'object' && task.producto !== null) {
      return task.producto.codigo || '-';
    }
    return '-';
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <LoadingOverlay open={loading} message="Cargando tareas de recuento..." />
      <Box
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3 
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
        >
          📋 Tareas de Recuento
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPendingRecounts}
          disabled={loading}
          fullWidth
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
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
                    <TableCell>Código</TableCell>
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
                          label={getProductCode(task)}
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
                <strong>Código:</strong> {getProductCode(selectedTask)}
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
                    (() => {
                      const diff = parseInt(countedQuantity) - (selectedTask.stockAnterior ?? 0);
                      return (
                        <>
                          <strong>Diferencia detectada:</strong>{' '}
                          {diff > 0 ? (
                            <span style={{ color: '#2e7d32' }}>+{diff} unidades (sobrante)</span>
                          ) : (
                            <span style={{ color: '#d32f2f' }}>{diff} unidades (faltante)</span>
                          )}
                          <br />
                          Se creará automáticamente un ajuste de inventario.
                        </>
                      );
                    })()
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

      {/* Result Dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {resultMessage.title}
        </DialogTitle>
        <DialogContent>
          <Alert severity={resultMessage.severity} sx={{ mt: 1 }}>
            {resultMessage.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < resultMessage.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)} variant="contained">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecountTasksPage;
