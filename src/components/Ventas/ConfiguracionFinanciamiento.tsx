import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, Alert, CircularProgress, Tooltip, Stack,
  Switch, FormControlLabel, Slider, InputAdornment, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { opcionFinanciamientoTemplateApi } from '../../api/services';
import type {
  OpcionFinanciamientoTemplateDTO,
  CreateOpcionFinanciamientoTemplateDTO,
  UpdateOpcionFinanciamientoTemplateDTO,
} from '../../api/services/opcionFinanciamientoTemplateApi';
import type { MetodoPago } from '../../types';

const ConfiguracionFinanciamiento: React.FC = () => {
  const [templates, setTemplates] = useState<OpcionFinanciamientoTemplateDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OpcionFinanciamientoTemplateDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<OpcionFinanciamientoTemplateDTO | null>(null);

  const [formData, setFormData] = useState<Partial<OpcionFinanciamientoTemplateDTO>>({
    nombre: '',
    metodoPago: 'EFECTIVO' as MetodoPago,
    cantidadCuotas: 1,
    tasaInteres: 0,
    descripcion: '',
    ordenPresentacion: 1,
    activa: true,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const templatesData = await opcionFinanciamientoTemplateApi.obtenerTodas();
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Error al cargar las plantillas de financiamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: OpcionFinanciamientoTemplateDTO) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nombre: template.nombre,
        metodoPago: template.metodoPago,
        cantidadCuotas: template.cantidadCuotas,
        tasaInteres: template.tasaInteres,
        descripcion: template.descripcion || '',
        ordenPresentacion: template.ordenPresentacion,
        activa: template.activa,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        nombre: '',
        metodoPago: 'EFECTIVO' as MetodoPago,
        cantidadCuotas: 1,
        tasaInteres: 0,
        descripcion: '',
        ordenPresentacion: templates.length + 1,
        activa: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      nombre: '',
      metodoPago: 'EFECTIVO' as MetodoPago,
      cantidadCuotas: 1,
      tasaInteres: 0,
      descripcion: '',
      ordenPresentacion: 1,
      activa: true,
    });
  };

  const handleFormChange = (field: keyof OpcionFinanciamientoTemplateDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = async () => {
    try {
      setError(null);

      if (!formData.nombre || !formData.metodoPago) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }

      const templateData: CreateOpcionFinanciamientoTemplateDTO | UpdateOpcionFinanciamientoTemplateDTO = {
        nombre: formData.nombre!,
        metodoPago: formData.metodoPago!,
        cantidadCuotas: formData.cantidadCuotas || 1,
        tasaInteres: formData.tasaInteres || 0,
        descripcion: formData.descripcion,
        ordenPresentacion: formData.ordenPresentacion || 1,
        activa: formData.activa !== undefined ? formData.activa : true,
      };

      if (editingTemplate && editingTemplate.id) {
        // Update existing template
        const updated = await opcionFinanciamientoTemplateApi.actualizar(
          editingTemplate.id,
          templateData as UpdateOpcionFinanciamientoTemplateDTO
        );
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? updated : t))
        );
        setSuccess('Plantilla actualizada correctamente');
      } else {
        // Create new template
        const newTemplate = await opcionFinanciamientoTemplateApi.crear(
          templateData as CreateOpcionFinanciamientoTemplateDTO
        );
        setTemplates((prev) => [...prev, newTemplate]);
        setSuccess('Plantilla creada correctamente');
      }

      handleCloseDialog();
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Error al guardar la plantilla');
    }
  };

  const handleDeleteClick = (template: OpcionFinanciamientoTemplateDTO) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      setError(null);
      if (templateToDelete.id) {
        await opcionFinanciamientoTemplateApi.eliminar(templateToDelete.id);
      }
      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      setSuccess('Plantilla eliminada correctamente');
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Error al eliminar la plantilla');
    }
  };

  const handleToggleActiva = async (template: OpcionFinanciamientoTemplateDTO) => {
    try {
      setError(null);
      if (template.id) {
        const updated = await opcionFinanciamientoTemplateApi.toggleActiva(
          template.id,
          !template.activa
        );
        setTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? updated : t))
        );
        setSuccess(updated.activa ? 'Plantilla activada' : 'Plantilla desactivada');
      }
    } catch (err) {
      console.error('Error toggling template:', err);
      setError('Error al cambiar el estado de la plantilla');
    }
  };

  const handleCreateDefaults = async () => {
    try {
      setLoading(true);
      setError(null);
      const defaultTemplates = await opcionFinanciamientoTemplateApi.crearTemplatesPorDefecto();
      setTemplates(defaultTemplates);
      setSuccess('Plantillas por defecto creadas correctamente');
    } catch (err) {
      console.error('Error creating defaults:', err);
      setError('Error al crear plantillas por defecto. Es posible que ya existan plantillas configuradas.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: MetodoPago): string => {
    const methods: Record<string, string> = {
      EFECTIVO: 'Efectivo',
      TARJETA_CREDITO: 'Tarjeta de Crédito',
      TARJETA_DEBITO: 'Tarjeta de Débito',
      TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
      CHEQUE: 'Cheque',
      FINANCIACION_PROPIA: 'Financiación Propia',
      CUENTA_CORRIENTE: 'Cuenta Corriente',
      MERCADO_PAGO: 'Mercado Pago',
      OTRO: 'Otro',
    };
    return methods[method] || method;
  };

  if (loading && templates.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <SettingsIcon />
          Configuración de Opciones de Financiamiento
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadTemplates}
            fullWidth
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Recargar
          </Button>
          <IconButton
            onClick={loadTemplates}
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <RefreshIcon />
          </IconButton>
          {templates.length === 0 && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<AutoAwesomeIcon />}
              onClick={handleCreateDefaults}
              fullWidth
              sx={{ whiteSpace: 'nowrap' }}
            >
              Crear Plantillas por Defecto
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            fullWidth
          >
            Nueva Plantilla
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Plantillas de Financiamiento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Estas plantillas se utilizarán automáticamente al crear nuevos presupuestos.
            Solo las plantillas activas se incluirán como opciones por defecto.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 700, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 60 }}>Orden</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Nombre</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Método de Pago</TableCell>
                  <TableCell align="center" sx={{ minWidth: 70 }}>Cuotas</TableCell>
                  <TableCell align="right" sx={{ minWidth: 80 }}>Tasa (%)</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <SettingsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          No hay plantillas configuradas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Haga clic en "Nueva Plantilla" o "Crear Plantillas por Defecto"
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates
                    .sort((a, b) => a.ordenPresentacion - b.ordenPresentacion)
                    .map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.ordenPresentacion}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {template.nombre}
                          </Typography>
                          {template.descripcion && (
                            <Typography variant="caption" color="text.secondary">
                              {template.descripcion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPaymentMethodLabel(template.metodoPago)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">{template.cantidadCuotas}</TableCell>
                        <TableCell align="right">
                          <Typography
                            color={
                              template.tasaInteres < 0
                                ? 'success.main'
                                : template.tasaInteres > 0
                                ? 'error.main'
                                : 'text.primary'
                            }
                          >
                            {template.tasaInteres}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={template.activa}
                                onChange={() => handleToggleActiva(template)}
                                color="success"
                              />
                            }
                            label={template.activa ? 'Activa' : 'Inactiva'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(template)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(template)}
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nombre de la Plantilla"
                  value={formData.nombre || ''}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  required
                  placeholder="Ej: 3 Cuotas sin interés, Contado con descuento"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Orden"
                  value={formData.ordenPresentacion || 1}
                  onChange={(e) => handleFormChange('ordenPresentacion', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1 }}
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
                    <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
                    <MenuItem value="CHEQUE">Cheque</MenuItem>
                    <MenuItem value="FINANCIACION_PROPIA">Financiación Propia</MenuItem>
                    <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
                    <MenuItem value="MERCADO_PAGO">Mercado Pago</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad de Cuotas"
                  value={formData.cantidadCuotas || 1}
                  onChange={(e) => handleFormChange('cantidadCuotas', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 48 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tasa de Interés / Descuento (%)"
                  value={formData.tasaInteres || 0}
                  onChange={(e) => handleFormChange('tasaInteres', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: -100, max: 100, step: 0.01 }}
                  helperText="Valores negativos = descuento, positivos = interés"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activa !== undefined ? formData.activa : true}
                      onChange={(e) => handleFormChange('activa', e.target.checked)}
                      color="success"
                    />
                  }
                  label={formData.activa ? 'Plantilla Activa' : 'Plantilla Inactiva'}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>Tasa de Interés: {formData.tasaInteres || 0}%</Typography>
                <Slider
                  value={formData.tasaInteres || 0}
                  onChange={(_, value) => handleFormChange('tasaInteres', value as number)}
                  min={-20}
                  max={100}
                  marks={[
                    { value: -20, label: '-20%' },
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción (opcional)"
                  value={formData.descripcion || ''}
                  onChange={(e) => handleFormChange('descripcion', e.target.value)}
                  placeholder="Ej: Con tarjetas seleccionadas, válido hasta fin de mes"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Nota:</strong> Esta plantilla se aplicará automáticamente al monto total
                    de cada presupuesto. El cálculo se realizará dinámicamente según el monto del documento.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {editingTemplate ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar Plantilla</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la plantilla <strong>{templateToDelete?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no afectará los presupuestos existentes que ya tienen opciones configuradas.
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

export default ConfiguracionFinanciamiento;
