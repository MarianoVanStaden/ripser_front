import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, MenuItem, Box, Typography, Autocomplete,
  CircularProgress, Alert,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { clienteApi } from '../../api/services/clienteApi';
import {
  TIPO_FINANCIACION_LABELS,
  CATEGORIA_PRESTAMO_LABELS,
} from '../../types/prestamo.types';
import type { PrestamoPersonalDTO, CreatePrestamoPersonalDTO } from '../../types/prestamo.types';
import type { Cliente } from '../../types';
import { formatPrice } from '../../utils/priceCalculations';

interface PrestamoFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prestamo?: PrestamoPersonalDTO | null;
}

const emptyForm: CreatePrestamoPersonalDTO = {
  clienteId: 0,
  cantidadCuotas: 0,
  valorCuota: 0,
  tipoFinanciacion: undefined,
  primerVencimiento: undefined,
  categoria: undefined,
  observaciones: undefined,
  codigoClienteRojas: undefined,
};

export const PrestamoFormDialog: React.FC<PrestamoFormDialogProps> = ({
  open, onClose, onSaved, prestamo,
}) => {
  const isEdit = Boolean(prestamo);
  const [formData, setFormData] = useState<CreatePrestamoPersonalDTO>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    if (open) {
      loadClientes();
      if (prestamo) {
        setFormData({
          clienteId: prestamo.clienteId,
          cantidadCuotas: prestamo.cantidadCuotas,
          valorCuota: prestamo.valorCuota,
          tipoFinanciacion: prestamo.tipoFinanciacion,
          categoria: prestamo.categoria,
          observaciones: prestamo.observaciones || undefined,
          codigoClienteRojas: prestamo.codigoClienteRojas || undefined,
        });
        setSelectedCliente({ id: prestamo.clienteId, nombre: prestamo.clienteNombre } as Cliente);
      } else {
        setFormData(emptyForm);
        setSelectedCliente(null);
      }
      setError(null);
    }
  }, [open, prestamo]);

  const loadClientes = async () => {
    try {
      setLoadingClientes(true);
      const data: any = await clienteApi.getAll();
      console.log('Clientes data received:', data);
      // Handle both plain array and paginated response ({ content: [...] })
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setClientes(list);
    } catch (err) {
      console.error('Error loading clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleChange = (field: keyof CreatePrestamoPersonalDTO, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const montoTotal = (formData.cantidadCuotas || 0) * (formData.valorCuota || 0);

  const handleSave = async () => {
    if (!formData.clienteId || formData.clienteId === 0) {
      setError('Debe seleccionar un cliente');
      return;
    }
    if (!formData.cantidadCuotas || formData.cantidadCuotas <= 0) {
      setError('La cantidad de cuotas debe ser mayor a 0');
      return;
    }
    if (!formData.valorCuota || formData.valorCuota <= 0) {
      setError('El valor de cuota debe ser mayor a 0');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (isEdit && prestamo) {
        await prestamoPersonalApi.update(prestamo.id, formData);
      } else {
        await prestamoPersonalApi.create(formData);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el préstamo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Préstamo' : 'Nuevo Préstamo'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={clientes}
                getOptionLabel={(cliente) =>
                  cliente.razonSocial
                    ? `${cliente.razonSocial} (${cliente.cuit})`
                    : `${cliente.nombre} ${cliente.apellido || ''}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={({ key, ...props }, option) => (
                  <li key={key} {...props}>
                    {option.razonSocial
                      ? `${option.razonSocial} (${option.cuit})`
                      : `${option.nombre} ${option.apellido || ''}`}
                  </li>
                )}
                value={selectedCliente}
                onChange={(_, newVal) => {
                  setSelectedCliente(newVal);
                  handleChange('clienteId', newVal?.id || 0);
                }}
                loading={loadingClientes}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingClientes && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cantidad de Cuotas"
                type="number"
                required
                value={formData.cantidadCuotas || ''}
                onChange={(e) => handleChange('cantidadCuotas', parseInt(e.target.value) || 0)}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor de Cuota"
                type="number"
                required
                value={formData.valorCuota || ''}
                onChange={(e) => handleChange('valorCuota', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo de Financiación"
                value={formData.tipoFinanciacion || ''}
                onChange={(e) => handleChange('tipoFinanciacion', e.target.value || undefined)}
              >
                <MenuItem value="">Sin especificar</MenuItem>
                {Object.entries(TIPO_FINANCIACION_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primer Vencimiento"
                type="date"
                value={formData.primerVencimiento || ''}
                onChange={(e) => handleChange('primerVencimiento', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Categoría"
                value={formData.categoria || ''}
                onChange={(e) => handleChange('categoria', e.target.value || undefined)}
              >
                <MenuItem value="">Sin especificar</MenuItem>
                {Object.entries(CATEGORIA_PRESTAMO_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Cliente Rojas"
                value={formData.codigoClienteRojas || ''}
                onChange={(e) => handleChange('codigoClienteRojas', e.target.value || undefined)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={formData.observaciones || ''}
                onChange={(e) => handleChange('observaciones', e.target.value || undefined)}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Resumen del Cálculo</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Cuotas</Typography>
                    <Typography variant="body1" fontWeight="medium">{formData.cantidadCuotas || 0}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Valor Cuota</Typography>
                    <Typography variant="body1" fontWeight="medium">{formatPrice(formData.valorCuota || 0)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">Monto Total</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">{formatPrice(montoTotal)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
        >
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
