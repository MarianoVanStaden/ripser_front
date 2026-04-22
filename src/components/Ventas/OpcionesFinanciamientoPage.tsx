import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { opcionFinanciamientoApi, documentoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
import type { OpcionFinanciamientoDTO, MetodoPago, DocumentoComercial } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';

const OpcionesFinanciamientoPage: React.FC = () => {
  const { empresaId } = useTenant();
  const [opciones, setOpciones] = useState<OpcionFinanciamientoDTO[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoComercial[]>([]);
  const [selectedDocumentoId, setSelectedDocumentoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOpcion, setEditingOpcion] = useState<OpcionFinanciamientoDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opcionToDelete, setOpcionToDelete] = useState<OpcionFinanciamientoDTO | null>(null);

  const [formData, setFormData] = useState<Partial<OpcionFinanciamientoDTO>>({
    nombre: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
    cantidadCuotas: 1,
    tasaInteres: 0,
    montoTotal: 0,
    montoCuota: 0,
    descripcion: '',
    ordenPresentacion: 1,
    esSeleccionada: false,
  });

  useEffect(() => {
    loadDocumentos();
  }, [empresaId]); // Re-fetch when tenant changes

  useEffect(() => {
    if (selectedDocumentoId) {
      loadOpciones();
    } else {
      setOpciones([]);
    }
  }, [selectedDocumentoId]);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load presupuestos
      const presupuestos = await documentoApi.getPresupuestos();
      setDocumentos(presupuestos);

      // Auto-select first documento if available
      if (presupuestos.length > 0 && !selectedDocumentoId) {
        setSelectedDocumentoId(presupuestos[0].id);
      }
    } catch (err) {
      console.error('Error loading documentos:', err);
      setError('Error al cargar los documentos');
    } finally {
      setLoading(false);
    }
  };

  const loadOpciones = async () => {
    if (!selectedDocumentoId) return;

    try {
      setLoading(true);
      setError(null);
      const opcionesData = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(selectedDocumentoId);
      setOpciones(opcionesData);
    } catch (err) {
      console.error('Error loading opciones:', err);
      setError('Error al cargar las opciones de financiamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (opcion?: OpcionFinanciamientoDTO) => {
    if (opcion) {
      setEditingOpcion(opcion);
      setFormData({
        nombre: opcion.nombre,
        metodoPago: opcion.metodoPago,
        cantidadCuotas: opcion.cantidadCuotas,
        tasaInteres: opcion.tasaInteres,
        montoTotal: opcion.montoTotal,
        montoCuota: opcion.montoCuota,
        descripcion: opcion.descripcion || '',
        ordenPresentacion: opcion.ordenPresentacion || 1,
        esSeleccionada: opcion.esSeleccionada || false,
      });
    } else {
      setEditingOpcion(null);
      setFormData({
        nombre: '',
        metodoPago: 'EFECTIVO' as MetodoPago,
        cantidadCuotas: 1,
        tasaInteres: 0,
        montoTotal: 0,
        montoCuota: 0,
        descripcion: '',
        ordenPresentacion: opciones.length + 1,
        esSeleccionada: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOpcion(null);
    setFormData({
      nombre: '',
      metodoPago: 'EFECTIVO' as MetodoPago,
      cantidadCuotas: 1,
      tasaInteres: 0,
      montoTotal: 0,
      montoCuota: 0,
      descripcion: '',
      ordenPresentacion: 1,
      esSeleccionada: false,
    });
  };

  const handleFormChange = (field: keyof OpcionFinanciamientoDTO, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate montoTotal and montoCuota when relevant fields change
      if (field === 'cantidadCuotas' || field === 'tasaInteres' || field === 'montoTotal') {
        const montoBase = updated.montoTotal || 0;
        const cuotas = updated.cantidadCuotas || 1;
        const tasa = updated.tasaInteres || 0;

        // Calculate with interest
          // El anticipo (40%) va sin recargo, el interés se aplica al financiado (60%)
          const montoFinanciado = montoBase * 0.6 * (1 + tasa / 100);
          const montoPorCuota = cuotas > 0 ? montoFinanciado / cuotas : 0;
        updated.montoCuota = parseFloat(montoPorCuota.toFixed(2));
      }

      return updated;
    });
  };

  const handleSaveOpcion = async () => {
    try {
      setError(null);

      if (!selectedDocumentoId) {
        setError('Por favor seleccione un documento primero');
        return;
      }

      if (!formData.nombre || !formData.metodoPago) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }

      const opcionData: OpcionFinanciamientoDTO = {
        nombre: formData.nombre!,
        metodoPago: formData.metodoPago!,
        cantidadCuotas: formData.cantidadCuotas || 1,
        tasaInteres: formData.tasaInteres || 0,
        montoTotal: formData.montoTotal || 0,
        montoCuota: formData.montoCuota || 0,
        descripcion: formData.descripcion,
        ordenPresentacion: formData.ordenPresentacion || 1,
        esSeleccionada: formData.esSeleccionada || false,
      };

      if (editingOpcion && editingOpcion.id) {
        // Update existing option
        const updated = await opcionFinanciamientoApi.actualizar(editingOpcion.id, opcionData);
        setOpciones((prev) =>
          prev.map((op) => (op.id === editingOpcion.id ? updated : op))
        );
        setSuccess('Opción actualizada correctamente');
      } else {
        // Create new option
        const newOpcion = await opcionFinanciamientoApi.crear(selectedDocumentoId, opcionData);
        setOpciones((prev) => [...prev, newOpcion]);
        setSuccess('Opción creada correctamente');
      }

      handleCloseDialog();
    } catch (err) {
      console.error('Error saving opcion:', err);
      setError('Error al guardar la opción de financiamiento');
    }
  };

  const handleDeleteClick = (opcion: OpcionFinanciamientoDTO) => {
    setOpcionToDelete(opcion);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!opcionToDelete) return;

    try {
      setError(null);
      if (opcionToDelete.id) {
        await opcionFinanciamientoApi.eliminar(opcionToDelete.id);
      }
      setOpciones((prev) => prev.filter((op) => op.id !== opcionToDelete.id));
      setSuccess('Opción eliminada correctamente');
      setDeleteDialogOpen(false);
      setOpcionToDelete(null);
    } catch (err) {
      console.error('Error deleting opcion:', err);
      setError('Error al eliminar la opción de financiamiento');
    }
  };

  const handleCreateDefaultOptions = async () => {
    if (!selectedDocumentoId) {
      setError('Por favor seleccione un documento primero');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the selected document to use its total as base amount
      const selectedDoc = documentos.find(d => d.id === selectedDocumentoId);
      const baseAmount = selectedDoc?.total || 0;

      const defaultOptions: Partial<OpcionFinanciamientoDTO>[] = [
        {
          nombre: 'Contado con 10% descuento',
          metodoPago: 'EFECTIVO',
          cantidadCuotas: 1,
          tasaInteres: -10, // Descuento del 10%
          montoTotal: baseAmount,
          montoCuota: baseAmount * 0.9, // 10% de descuento
          descripcion: 'Pago en efectivo con 10% de descuento',
          ordenPresentacion: 1,
          esSeleccionada: false,
        },
        {
          nombre: '3 Cuotas sin interés',
          metodoPago: 'TARJETA_CREDITO',
          cantidadCuotas: 3,
          tasaInteres: 0,
          montoTotal: baseAmount,
          montoCuota: baseAmount / 3,
          descripcion: '3 cuotas sin interés con tarjeta de crédito',
          ordenPresentacion: 2,
          esSeleccionada: false,
        },
        {
          nombre: '6 Cuotas sin interés',
          metodoPago: 'TARJETA_CREDITO',
          cantidadCuotas: 6,
          tasaInteres: 0,
          montoTotal: baseAmount,
          montoCuota: baseAmount / 6,
          descripcion: '6 cuotas sin interés con tarjeta de crédito',
          ordenPresentacion: 3,
          esSeleccionada: false,
        },
        {
          nombre: '12 Cuotas sin interés',
          metodoPago: 'TARJETA_CREDITO',
          cantidadCuotas: 12,
          tasaInteres: 0,
          montoTotal: baseAmount,
          montoCuota: baseAmount / 12,
          descripcion: '12 cuotas sin interés con tarjeta de crédito',
          ordenPresentacion: 4,
          esSeleccionada: false,
        },
        {
          nombre: '3 Cuotas - Financiación Propia',
          metodoPago: 'FINANCIAMIENTO',
          cantidadCuotas: 3,
          tasaInteres: 0,
          montoTotal: baseAmount,
          montoCuota: baseAmount / 3,
          descripcion: '3 cuotas sin interés - Financiación propia',
          ordenPresentacion: 5,
          esSeleccionada: false,
        },
        {
          nombre: '6 Cuotas - Financiación Propia',
          metodoPago: 'FINANCIAMIENTO',
          cantidadCuotas: 6,
          tasaInteres: 0,
          montoTotal: baseAmount,
          montoCuota: baseAmount / 6,
          descripcion: '6 cuotas sin interés - Financiación propia',
          ordenPresentacion: 6,
          esSeleccionada: false,
        },
        {
          nombre: '12 Cuotas - Financiación Propia',
          metodoPago: 'FINANCIAMIENTO',
          cantidadCuotas: 12,
          tasaInteres: 0,
          montoTotal: baseAmount,
          montoCuota: baseAmount / 12,
          descripcion: '12 cuotas sin interés - Financiación propia',
          ordenPresentacion: 7,
          esSeleccionada: false,
        },
      ];

      // Create all options
      const createdOptions = [];
      for (const option of defaultOptions) {
        const newOpcion = await opcionFinanciamientoApi.crear(selectedDocumentoId, option as OpcionFinanciamientoDTO);
        createdOptions.push(newOpcion);
      }

      setOpciones(createdOptions);
      setSuccess('Opciones por defecto creadas correctamente');
    } catch (err) {
      console.error('Error creating default options:', err);
      setError('Error al crear las opciones por defecto');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: MetodoPago): string => {
    const methods: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA_CREDITO: 'Tarjeta de Crédito',
      TARJETA_DEBITO: 'Tarjeta de Débito',
      TRANSFERENCIA: 'Transferencia Bancaria',
      CHEQUE: 'Cheque',
      FINANCIAMIENTO: 'Financiamiento',
      CUENTA_CORRIENTE: 'Cuenta Corriente',
    };
    return methods[method] || method;
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Procesando opciones de financiamiento..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <PaymentIcon />
          Opciones de Financiamiento
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadOpciones}
            disabled={!selectedDocumentoId}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Recargar
          </Button>
          <IconButton
            onClick={loadOpciones}
            disabled={!selectedDocumentoId}
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <RefreshIcon />
          </IconButton>
          {opciones.length === 0 && selectedDocumentoId && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CalculateIcon />}
              onClick={handleCreateDefaultOptions}
              fullWidth
              sx={{ whiteSpace: 'nowrap' }}
            >
              Crear Opciones por Defecto
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={!selectedDocumentoId}
            fullWidth
          >
            Nueva Opción
          </Button>
        </Stack>
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

      {/* Documento Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Presupuesto/Documento</InputLabel>
                <Select
                  value={selectedDocumentoId || ''}
                  label="Seleccionar Presupuesto/Documento"
                  onChange={(e) => setSelectedDocumentoId(Number(e.target.value))}
                >
                  {documentos.length === 0 ? (
                    <MenuItem value="" disabled>
                      No hay documentos disponibles
                    </MenuItem>
                  ) : (
                    documentos.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>
                        {doc.numeroDocumento || `Documento #${doc.id}`} -
                        {doc.clienteNombre || 'Sin cliente'} -
                        ${doc.total?.toLocaleString() || 0}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Seleccione un documento para gestionar sus opciones de financiamiento.
                {selectedDocumentoId && (
                  <span style={{ display: 'block', marginTop: 8, fontWeight: 'bold', color: '#1976d2' }}>
                    {opciones.length} opción(es) configurada(s)
                  </span>
                )}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Opciones Disponibles
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure las opciones de financiamiento que se mostrarán a los clientes en los presupuestos y facturas.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 80 }}>Orden</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Nombre</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Método de Pago</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Cuotas</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Tasa (%)</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Monto Total</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Monto/Cuota</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Box py={4}>
                        <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          No hay opciones de financiamiento configuradas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Haga clic en "Nueva Opción" para comenzar
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  opciones
                    .sort((a, b) => (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0))
                    .map((opcion) => (
                      <TableRow key={opcion.id}>
                        <TableCell>{opcion.ordenPresentacion || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {opcion.nombre}
                          </Typography>
                          {opcion.descripcion && (
                            <Typography variant="caption" color="text.secondary">
                              {opcion.descripcion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(opcion.metodoPago)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">{opcion.cantidadCuotas}</TableCell>
                        <TableCell align="right">{opcion.tasaInteres}%</TableCell>
                        <TableCell align="right">
                          ${opcion.montoTotal?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="right">
                          ${opcion.montoCuota?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="center">
                          {opcion.esSeleccionada ? (
                            <Chip
                              label="Seleccionada"
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon />}
                            />
                          ) : (
                            <Chip label="Disponible" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(opcion)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(opcion)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: { xs: '100%', sm: '90vh' },
            m: { xs: 0, sm: 2 }
          }
        }}
      >
        <DialogTitle>
          {editingOpcion ? 'Editar Opción de Financiamiento' : 'Nueva Opción de Financiamiento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Opción"
                  value={formData.nombre || ''}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  required
                  placeholder="Ej: Contado, 3 Cuotas sin interés"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={formData.metodoPago || 'EFECTIVO'}
                    label="Método de Pago"
                    onChange={(e) => handleFormChange('metodoPago', e.target.value as MetodoPago)}
                  >
                    <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                    <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                    <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                    <MenuItem value="TRANSFERENCIA">Transferencia Bancaria</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                    <MenuItem value="FINANCIAMIENTO">Financiamiento</MenuItem>
                    <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad de Cuotas"
                  value={formData.cantidadCuotas || 1}
                  onChange={(e) => handleFormChange('cantidadCuotas', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tasa de Interés / Descuento (%)"
                  value={formData.tasaInteres || 0}
                  onChange={(e) => handleFormChange('tasaInteres', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: -100, max: 100, step: 0.01 }}
                  helperText="Valores negativos = descuento, positivos = interés"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Orden de Presentación"
                  value={formData.ordenPresentacion || 1}
                  onChange={(e) => handleFormChange('ordenPresentacion', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monto Total Base"
                  value={formData.montoTotal || 0}
                  onChange={(e) => handleFormChange('montoTotal', parseFloat(e.target.value) || 0)}
                  inputProps={{ min: 0, step: 0.01 }}
                  helperText="Monto base para el cálculo de cuotas"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monto por Cuota"
                  value={formData.montoCuota || 0}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="Calculado automáticamente"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción"
                  value={formData.descripcion || ''}
                  onChange={(e) => handleFormChange('descripcion', e.target.value)}
                  placeholder="Descripción adicional de la opción de financiamiento..."
                />
              </Grid>

              {/* Calculation Summary */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <CalculateIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Resumen del Cálculo
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Monto Base
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        ${(formData.montoTotal || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        {(formData.tasaInteres || 0) < 0 ? 'Descuento Total' : 'Interés Total'}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={(formData.tasaInteres || 0) < 0 ? 'success.main' : 'error.main'}
                      >
                          ${Math.abs((((formData.montoTotal || 0) * 0.6) * (formData.tasaInteres || 0)) / 100).toLocaleString()}
                          {(formData.tasaInteres || 0) < 0 ? ' (descuento)' : ''}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Monto Final
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          ${((formData.montoTotal || 0) * 0.4 + ((formData.montoTotal || 0) * 0.6) * (1 + (formData.tasaInteres || 0) / 100)).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Cuota Mensual
                      </Typography>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        ${(formData.montoCuota || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveOpcion}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {editingOpcion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar Opción de Financiamiento</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la opción <strong>{opcionToDelete?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OpcionesFinanciamientoPage;
