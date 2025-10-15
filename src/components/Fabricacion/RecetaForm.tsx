import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Stack, Alert,
  Snackbar, CircularProgress, Card, CardContent, IconButton,
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
} from '../../types';
import api from '../../api/config';

const schema = yup.object().shape({
  nombre: yup.string().required('El nombre es obligatorio'),
  tipoEquipo: yup.string().required('El tipo de equipo es obligatorio'),
  descripcion: yup.string(),
  modelo: yup.string(),
  medida: yup.string(),
  observaciones: yup.string(),
});

interface Producto {
  id: number;
  nombre: string;
  codigo: string;
  precio: number;
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

  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipoEquipo: '' as TipoEquipo,
      modelo: '',
      medida: '',
      observaciones: '',
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
        observaciones: data.observaciones || '',
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
          observaciones: data.observaciones,
        };
        await recetaFabricacionApi.update(Number(id), updateData);
        setSnackbar({
          open: true,
          message: 'Receta actualizada correctamente',
          severity: 'success',
        });
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
          observaciones: data.observaciones,
          detalles,
        };
        await recetaFabricacionApi.create(createData);
        setSnackbar({
          open: true,
          message: 'Receta creada correctamente',
          severity: 'success',
        });
      }
      setTimeout(() => navigate('/fabricacion/recetas'), 1500);
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

      // Auto-update cost when product changes
      if (field === 'productoId' && value) {
        const producto = productos.find((p) => p.id === Number(value));
        if (producto) {
          detalle.costoUnitario = producto.precio || 0;
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
                <TextField {...field} label="Medida" fullWidth />
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
    </Box>
  );
};

export default RecetaForm;
