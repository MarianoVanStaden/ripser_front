import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Stack, Alert,
  Snackbar, CircularProgress, IconButton, Autocomplete,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  equipoFabricadoApi,
} from '../../api/services/equipoFabricadoApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import api from '../../api/config';
import type {
  TipoEquipo,
  EquipoFabricadoCreateDTO,
  EquipoFabricadoUpdateDTO,
  EstadoFabricacion,
} from '../../types';
import { employeeApi } from '../../api/services/employeeApi';
import { clienteApi } from '../../api/services/clienteApi';


const schema = yup.object().shape({
  tipo: yup.string().required('El tipo es obligatorio'),
  modelo: yup.string().required('El modelo es obligatorio'),
  numeroHeladera: yup.string().required('El número de heladera es obligatorio'),
  cantidad: yup.number().min(1, 'La cantidad debe ser al menos 1').required('La cantidad es obligatoria'),
  equipo: yup.string(),
  medida: yup.string(),
  color: yup.string(),
  observaciones: yup.string(),
});

const EquipoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedReceta, setSelectedReceta] = useState<any>(null);
  const [selectedResponsable, setSelectedResponsable] = useState<any>(null);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [estado, setEstado] = useState<EstadoFabricacion>('EN_PROCESO');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipo: '' as TipoEquipo,
      modelo: '',
      equipo: '',
      medida: '',
      color: '',
      numeroHeladera: '',
      cantidad: 1,
      observaciones: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadRecetas(),
        loadEmpleados(),
        loadClientes(),
      ]);
      if (isEdit && id) {
        await loadEquipo(Number(id));
      }
    };
    loadData();
  }, [id, isEdit]);

  const loadRecetas = async () => {
    try {
      const data = await recetaFabricacionApi.findAllActive();
      setRecetas(data);
    } catch (error) {
      console.error('Error loading recetas:', error);
    }
  };

  const loadEmpleados = async () => {
    try {
      await employeeApi.getAllList().catch(() => []);
      const empleadosData = await employeeApi.getAllList();
      console.log('Loaded empleados:', empleadosData);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error loading empleados:', error);
    }
  };

  const loadClientes = async () => {
    try {
      await clienteApi.getAll().catch(() => []);
      const clientesData = await clienteApi.getAll();
      console.log('Loaded clientes:', clientesData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Error loading clientes:', error);
    }
  };

  const loadEquipo = async (equipoId: number) => {
    try {
      setLoading(true);
      const data = await equipoFabricadoApi.findById(equipoId);
      console.log('Loaded equipo data:', data);
      console.log('Available empleados:', empleados);
      console.log('Available clientes:', clientes);

      reset({
        tipo: data.tipo,
        modelo: data.modelo,
        equipo: data.equipo || '',
        medida: data.medida || '',
        color: data.color || '',
        numeroHeladera: data.numeroHeladera,
        cantidad: data.cantidad,
        observaciones: data.observaciones || '',
      });
      setEstado(data.estado);

      if (data.recetaId) {
        const receta = recetas.find(r => r.id === data.recetaId);
        console.log('Found receta:', receta);
        setSelectedReceta(receta || null);
      }
      if (data.responsableId) {
        const empleado = empleados.find(e => e.id === data.responsableId);
        console.log('Looking for responsable ID:', data.responsableId, 'Found:', empleado);
        setSelectedResponsable(empleado || null);
      }
      if (data.clienteId) {
        const cliente = clientes.find(c => c.id === data.clienteId);
        console.log('Looking for cliente ID:', data.clienteId, 'Found:', cliente);
        setSelectedCliente(cliente || null);
      }
    } catch (error) {
      console.error('Error loading equipo:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar el equipo',
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
        const updateData: EquipoFabricadoUpdateDTO = {
          tipo: data.tipo,
          modelo: data.modelo,
          equipo: data.equipo,
          medida: data.medida,
          color: data.color,
          cantidad: data.cantidad,
          observaciones: data.observaciones,
          estado,
          recetaId: selectedReceta?.id,
          responsableId: selectedResponsable?.id,
          clienteId: selectedCliente?.id,
        };
        await equipoFabricadoApi.update(Number(id), updateData);
        setSnackbar({
          open: true,
          message: 'Equipo actualizado correctamente',
          severity: 'success',
        });
      } else {
        const createData: EquipoFabricadoCreateDTO = {
          tipo: data.tipo,
          modelo: data.modelo,
          equipo: data.equipo,
          medida: data.medida,
          color: data.color,
          numeroHeladera: data.numeroHeladera,
          cantidad: data.cantidad,
          observaciones: data.observaciones,
          estado,
          recetaId: selectedReceta?.id,
          responsableId: selectedResponsable?.id,
          clienteId: selectedCliente?.id,
        };
        await equipoFabricadoApi.create(createData);
        setSnackbar({
          open: true,
          message: 'Equipo creado correctamente',
          severity: 'success',
        });
      }
      setTimeout(() => navigate('/fabricacion/equipos'), 1500);
    } catch (error: any) {
      console.error('Error saving equipo:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al guardar el equipo',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
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
        <IconButton onClick={() => navigate('/fabricacion/equipos')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="600">
          {isEdit ? 'Editar Equipo' : 'Nuevo Equipo'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Información General
          </Typography>
          <Stack spacing={2} mt={2}>
            <Autocomplete
              options={recetas}
              getOptionLabel={(option) => `${option.nombre} (${option.codigo})`}
              value={selectedReceta}
              onChange={(_, newValue) => setSelectedReceta(newValue)}
              renderInput={(params) => <TextField {...params} label="Receta Base (opcional)" />}
            />

            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo *"
                  error={!!errors.tipo}
                  helperText={errors.tipo?.message}
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
                <TextField
                  {...field}
                  label="Modelo *"
                  error={!!errors.modelo}
                  helperText={errors.modelo?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="numeroHeladera"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Número de Heladera *"
                  error={!!errors.numeroHeladera}
                  helperText={errors.numeroHeladera?.message}
                  fullWidth
                  disabled={isEdit}
                />
              )}
            />

            <Controller
              name="equipo"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Equipo" fullWidth />
              )}
            />

            <Stack direction="row" spacing={2}>
              <Controller
                name="medida"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Medida" fullWidth />
                )}
              />
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Color" fullWidth />
                )}
              />
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cantidad *"
                    type="number"
                    error={!!errors.cantidad}
                    helperText={errors.cantidad?.message}
                    InputProps={{ inputProps: { min: 1 } }}
                    fullWidth
                  />
                )}
              />
            </Stack>

            <Autocomplete
              options={empleados}
              getOptionLabel={(option) =>
                option.nombre && option.apellido
                  ? `${option.nombre} ${option.apellido}`
                  : option.nombre || ''
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedResponsable}
              onChange={(_, newValue) => setSelectedResponsable(newValue)}
              renderInput={(params) => <TextField {...params} label="Responsable" />}
            />

            <Autocomplete
              options={clientes}
              getOptionLabel={(option) => option.nombre || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedCliente}
              onChange={(_, newValue) => setSelectedCliente(newValue)}
              renderInput={(params) => <TextField {...params} label="Cliente (opcional)" />}
            />

            {isEdit && (
              <TextField
                label="Estado"
                select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoFabricacion)}
                fullWidth
              >
                <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                <MenuItem value="COMPLETADO">Completado</MenuItem>
                <MenuItem value="CANCELADO">Cancelado</MenuItem>
              </TextField>
            )}

            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Observaciones" multiline rows={3} fullWidth />
              )}
            />
          </Stack>
        </Paper>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => navigate('/fabricacion/equipos')}>
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
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EquipoForm;
