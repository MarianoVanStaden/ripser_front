import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Stack, Alert,
  Snackbar, CircularProgress, Card, CardContent, IconButton,
  FormControlLabel, Checkbox,
} from '@mui/material';
import { ArrowBack, Save, Add, Delete } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  recetaFabricacionApi,
} from '../../api/services/recetaFabricacionApi';
import type {
  RecetaFabricacionCreateDTO,
  RecetaFabricacionUpdateDTO,
  DetalleRecetaCreateDTO,
  TipoEquipo,
  RecetaFabricacionDTO,
} from '../../types';
import { COLORES_EQUIPO, MEDIDAS_EQUIPO } from '../../types';
import api from '../../api/config';
import SuccessDialog from '../common/SuccessDialog';

const schema = yup.object().shape({
  nombre: yup.string().required('El nombre es obligatorio'),
  tipoEquipo: yup.string().required('El tipo de equipo es obligatorio'),
  descripcion: yup.string(),
  modelo: yup.string(),
  medida: yup.string(),
  color: yup.string(),
  observaciones: yup.string(),
  precioVenta: yup.number().nullable().min(0, 'El precio debe ser mayor o igual a 0'),
  disponibleParaVenta: yup.boolean(),
});

interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  precio: number;
  costo: number | null;
}

const RecetaForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetalleRecetaCreateDTO[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
  
  // Success Dialog states
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdReceta, setCreatedReceta] = useState<RecetaFabricacionDTO | null>(null);
  const [editSuccessDialogOpen, setEditSuccessDialogOpen] = useState(false);
  const [updatedReceta, setUpdatedReceta] = useState<RecetaFabricacionDTO | null>(null);

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipoEquipo: '' as TipoEquipo,
      modelo: '',
      medida: '',
      color: '',
      observaciones: '',
      precioVenta: undefined as number | undefined,
      disponibleParaVenta: true,
    },
  });

  useEffect(() => {
    loadProductos();
    if (isEdit && id) {
      loadReceta(Number(id));
    }
  }, [id, isEdit]);

  const loadProductos = async () => {
    try {
      const response = await api.get('/api/productos/activos');
      setProductos(response.data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
    }
  };

  const loadReceta = async (recetaId: number) => {
    try {
      setLoading(true);
      const data = await recetaFabricacionApi.findById(recetaId);
      reset({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        tipoEquipo: data.tipoEquipo,
        modelo: data.modelo || '',
        medida: data.medida || '',
        color: data.color || '',
        observaciones: data.observaciones || '',
        precioVenta: data.precioVenta,
        disponibleParaVenta: data.disponibleParaVenta ?? true,
      });
      setDetalles(
        data.detalles.map((d) => ({
          productoId: d.productoId,
          cantidad: d.cantidad,
          costoUnitario: d.costoUnitario,
          observaciones: d.observaciones,
        }))
      );
    } catch (error) {
      console.error('Error loading receta:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar la receta',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      if (isEdit && id) {
        const updateData: RecetaFabricacionUpdateDTO = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipoEquipo: data.tipoEquipo,
          modelo: data.modelo,
          medida: data.medida,
          color: data.color,
          observaciones: data.observaciones,
          precioVenta: data.precioVenta,
          disponibleParaVenta: data.disponibleParaVenta,
        };
        const updated = await recetaFabricacionApi.update(Number(id), updateData);
        setUpdatedReceta(updated);
        setEditSuccessDialogOpen(true);
      } else {
        // Validate that all detalles have a valid productoId
        const invalidDetalles = detalles.filter(d => !d.productoId || d.productoId === 0);
        if (invalidDetalles.length > 0) {
          setSnackbar({
            open: true,
            message: 'Debe seleccionar un producto válido para todos los materiales',
            severity: 'error',
          });
          setLoading(false);
          return;
        }

        // Validate that there is at least one detalle
        if (detalles.length === 0) {
          setSnackbar({
            open: true,
            message: 'Debe agregar al menos un material a la receta',
            severity: 'error',
          });
          setLoading(false);
          return;
        }

        const createData: RecetaFabricacionCreateDTO = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          tipoEquipo: data.tipoEquipo,
          modelo: data.modelo,
          medida: data.medida,
          color: data.color,
          observaciones: data.observaciones,
          precioVenta: data.precioVenta,
          disponibleParaVenta: data.disponibleParaVenta,
          detalles,
        };
        const savedReceta = await recetaFabricacionApi.create(createData);
        setCreatedReceta(savedReceta);
        setSuccessDialogOpen(true);
      }
      
      // For updates, show snackbar and navigate
      if (isEdit) {
        setTimeout(() => navigate('/fabricacion/recetas'), 1500);
      }
    } catch (error: any) {
      console.error('Error saving receta:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al guardar la receta',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const addDetalle = () => {
    setDetalles([
      ...detalles,
      { productoId: 0, cantidad: 1, costoUnitario: 0, observaciones: '' },
    ]);
  };

  const removeDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const updateDetalle = (index: number, field: keyof DetalleRecetaCreateDTO, value: any) => {
    setDetalles((prev) => {
      const newDetalles = [...prev];
      const detalle = newDetalles[index];

      // Update the field
      if (field === 'productoId') detalle.productoId = Number(value) || 0;
      else if (field === 'cantidad') detalle.cantidad = Number(value) || 0;
      else if (field === 'costoUnitario') detalle.costoUnitario = Number(value) || 0;
      else if (field === 'observaciones') detalle.observaciones = value as string;

      // Auto-update cost when product changes (prefer costo over precio)
      if (field === 'productoId' && value) {
        const producto = productos.find((p) => p.id === Number(value));
        if (producto) {
          detalle.costoUnitario = producto.costo ?? producto.precio ?? 0;
        }
      }

      return newDetalles;
    });
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/fabricacion/recetas')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="600">
          {isEdit ? 'Editar Receta' : 'Nueva Receta'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Información General
          </Typography>
          <Stack spacing={2} mt={2}>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre *"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  fullWidth
                />
              )}
            />
            <Controller
              name="tipoEquipo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo de Equipo *"
                  error={!!errors.tipoEquipo}
                  helperText={errors.tipoEquipo?.message}
                  fullWidth
                >
                  <MenuItem value="HELADERA">Heladera</MenuItem>
                  <MenuItem value="COOLBOX">Coolbox</MenuItem>
                  <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="modelo"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Modelo" fullWidth />
              )}
            />
            <Controller
              name="medida"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Medida"
                  fullWidth
                >
                  <MenuItem value="">Ninguna</MenuItem>
                  {MEDIDAS_EQUIPO.map((medida) => (
                    <MenuItem key={medida} value={medida}>
                      {medida}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Color"
                  fullWidth
                >
                  <MenuItem value="">Ninguno</MenuItem>
                  {COLORES_EQUIPO.map((color) => (
                    <MenuItem key={color} value={color}>
                      {color.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="descripcion"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Descripción" multiline rows={3} fullWidth />
              )}
            />
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Observaciones" multiline rows={2} fullWidth />
              )}
            />
            <Controller
              name="precioVenta"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
                  label="Precio de Venta"
                  type="number"
                  error={!!errors.precioVenta}
                  helperText={errors.precioVenta?.message || 'Precio de venta del equipo fabricado'}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  fullWidth
                />
              )}
            />
            <Controller
              name="disponibleParaVenta"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value || false}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  }
                  label="Disponible para Venta"
                />
              )}
            />
          </Stack>
        </Paper>

        {!isEdit && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Lista de Materiales</Typography>
              <Button variant="outlined" startIcon={<Add />} onClick={addDetalle}>
                Agregar Material
              </Button>
            </Box>
            {detalles.map((detalle, index) => {
              return (
                <Card key={index} sx={{ mb: 2, border: !detalle.productoId || detalle.productoId === 0 ? '2px solid #f44336' : 'none' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <TextField
                        select
                        label="Producto *"
                        value={detalle.productoId || ''}
                        onChange={(e) => updateDetalle(index, 'productoId', e.target.value)}
                        error={!detalle.productoId || detalle.productoId === 0}
                        helperText={!detalle.productoId || detalle.productoId === 0 ? 'Debe seleccionar un producto' : ''}
                        sx={{ flex: 2 }}
                        fullWidth
                      >
                        <MenuItem value="">Seleccionar producto</MenuItem>
                        {productos.map((producto) => (
                          <MenuItem key={producto.id} value={producto.id}>
                            {producto.nombre} ({producto.codigo}) - ${producto.precio?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Cantidad *"
                        type="number"
                        value={detalle.cantidad}
                        onChange={(e) => updateDetalle(index, 'cantidad', Number(e.target.value))}
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={{ width: 120 }}
                        required
                      />
                      <TextField
                        label="Costo Unit."
                        type="number"
                        value={detalle.costoUnitario}
                        onChange={(e) => updateDetalle(index, 'costoUnitario', Number(e.target.value))}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        sx={{ width: 120 }}
                      />
                      <IconButton color="error" onClick={() => removeDetalle(index)}>
                        <Delete />
                      </IconButton>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Paper>
        )}

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => navigate('/fabricacion/recetas')}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false})} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Success Dialog - Creación */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setCreatedReceta(null);
          navigate('/fabricacion/recetas');
        }}
        title="¡Receta Creada Exitosamente!"
        message="La receta de fabricación ha sido registrada correctamente"
        details={createdReceta ? [
          { label: 'Nombre', value: createdReceta.nombre },
          { label: 'Tipo de Equipo', value: createdReceta.tipoEquipo },
          { label: 'Modelo', value: createdReceta.modelo || '-' },
          { label: 'Color', value: createdReceta.color || '-' },
          { label: 'Medida', value: createdReceta.medida || '-' },
          { label: 'Precio de Venta', value: createdReceta.precioVenta ? `$${createdReceta.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-' },
        ] : []}
        actions={[
          {
            label: 'Crear Otra Receta',
            onClick: () => {
              setSuccessDialogOpen(false);
              setCreatedReceta(null);
              reset({
                nombre: '',
                descripcion: '',
                tipoEquipo: '' as TipoEquipo,
                modelo: '',
                medida: '',
                color: '',
                observaciones: '',
                precioVenta: undefined,
                disponibleParaVenta: true,
              });
              setDetalles([]);
            },
            icon: <Add />,
            variant: 'outlined',
          },
        ]}
      />

      {/* Success Dialog - Edición */}
      <SuccessDialog
        open={editSuccessDialogOpen}
        onClose={() => {
          setEditSuccessDialogOpen(false);
          setUpdatedReceta(null);
          navigate('/fabricacion/recetas');
        }}
        title="¡Receta Actualizada Exitosamente!"
        message="La receta de fabricación ha sido actualizada correctamente"
        details={updatedReceta ? [
          { label: 'Nombre', value: updatedReceta.nombre },
          { label: 'Tipo de Equipo', value: updatedReceta.tipoEquipo },
          { label: 'Modelo', value: updatedReceta.modelo || '-' },
          { label: 'Color', value: updatedReceta.color || '-' },
          { label: 'Medida', value: updatedReceta.medida || '-' },
          { label: 'Precio de Venta', value: updatedReceta.precioVenta ? `$${updatedReceta.precioVenta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-' },
        ] : []}
        actions={[]}
      />
    </Box>
  );
};

export default RecetaForm;
