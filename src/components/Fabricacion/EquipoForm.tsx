import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Stack, Alert,
  Snackbar, CircularProgress, IconButton, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import { ArrowBack, Save, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  equipoFabricadoApi,
} from '../../api/services/equipoFabricadoApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import type {
  TipoEquipo,
  EquipoFabricadoCreateDTO,
  EquipoFabricadoUpdateDTO,
  EstadoFabricacion,
  MedidaEquipo,
  ColorEquipo,
} from '../../types';
import { MEDIDAS_EQUIPO, COLORES_EQUIPO } from '../../types';
import { employeeApi } from '../../api/services/employeeApi';
import { clienteApi } from '../../api/services/clienteApi';
import StockErrorDialog, { type ProductoInsuficiente } from '../common/StockErrorDialog';
import EquipoSuccessDialog, { type EquipoCreado } from '../common/EquipoSuccessDialog';


const schema = yup.object().shape({
  tipo: yup.string().required('El tipo es obligatorio'),
  modelo: yup.string().required('El modelo es obligatorio'),
  numeroHeladera: yup.string().when('$isEdit', {
    is: true,
    then: (schema) => schema.required('El número de heladera es obligatorio'),
    otherwise: (schema) => schema.notRequired(),
  }),
  cantidad: yup.number().min(1, 'La cantidad debe ser al menos 1').required('La cantidad es obligatoria'),
  equipo: yup.string(),
  medida: yup.string(),
  color: yup.string(),
  observaciones: yup.string(),
});

const EquipoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: numeroHeladera } = useParams<{ id: string }>();
  const isEdit = Boolean(numeroHeladera);

  const [loading, setLoading] = useState(false);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [selectedReceta, setSelectedReceta] = useState<any>(null);
  const [selectedResponsable, setSelectedResponsable] = useState<any>(null);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [estado, setEstado] = useState<EstadoFabricacion>('PENDIENTE');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [stockErrorDialogOpen, setStockErrorDialogOpen] = useState(false);
  const [productosInsuficientes, setProductosInsuficientes] = useState<ProductoInsuficiente[]>([]);
  const [cantidadEquiposIntentados, setCantidadEquiposIntentados] = useState(1);

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [equiposCreados, setEquiposCreados] = useState<EquipoCreado[]>([]);

  const [editSuccessDialogOpen, setEditSuccessDialogOpen] = useState(false);
  const [equipoEditado, setEquipoEditado] = useState<{
    numeroHeladera: string;
    tipo: string;
    modelo: string;
  } | null>(null);

  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm({
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
    context: { isEdit },
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadRecetas(),
        loadEmpleados(),
        loadClientes(),
      ]);
      if (isEdit && numeroHeladera) {
        await loadEquipo(numeroHeladera);
      }
    };
    loadData();
  }, [numeroHeladera, isEdit]);

  // Auto-fill form fields when recipe is selected
  useEffect(() => {
    if (selectedReceta && !isEdit) {
      setValue('tipo', selectedReceta.tipoEquipo);
      setValue('equipo', selectedReceta.nombre || '');
      setValue('modelo', selectedReceta.modelo || '');
      setValue('medida', selectedReceta.medida || '');
    }
  }, [selectedReceta, isEdit, setValue]);

  const loadRecetas = async () => {
    try {
      console.log('🔄 Cargando recetas activas...');
      const data = await recetaFabricacionApi.findAllActive();
      console.log('✅ Recetas cargadas:', data);
      setRecetas(data);
    } catch (error: any) {
      console.error('❌ Error loading recetas:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Mostrar error al usuario
      setSnackbar({
        open: true,
        message: `Error al cargar recetas: ${error.response?.data?.message || error.message || 'Error desconocido'}`,
        severity: 'error',
      });
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

  const loadEquipo = async (numeroHeladera: string) => {
    try {
      setLoading(true);
      const data = await equipoFabricadoApi.findByNumeroHeladera(numeroHeladera);
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
        
        const response = await equipoFabricadoApi.update(Number(id), updateData);
        console.log('✅ Equipo updated successfully:', response);
        
        // Guardar info del equipo editado para el modal
        setEquipoEditado({
          numeroHeladera: data.numeroHeladera,
          tipo: data.tipo,
          modelo: data.modelo,
        });
        
        setEditSuccessDialogOpen(true);
      } else {
        const createData: EquipoFabricadoCreateDTO = {
          tipo: data.tipo,
          modelo: data.modelo,
          equipo: data.equipo,
          medida: data.medida,
          color: data.color,
          cantidad: data.cantidad,
          observaciones: data.observaciones,
          estado,
          numeroHeladera: 'AUTO', // Placeholder - backend debe reemplazarlo
          recetaId: selectedReceta?.id,
          responsableId: selectedResponsable?.id,
          clienteId: selectedCliente?.id,
        };
        
        // Log para debug - ver qué se está enviando
        console.log('📦 CreateData being sent:', JSON.stringify(createData, null, 2));

        const response = await equipoFabricadoApi.createBatch(createData);
        console.log('✅ Equipos created successfully:', response);

        // Mapear la respuesta al formato del modal
        const equiposParaModal: EquipoCreado[] = response.equipos.map(equipo => ({
          numeroHeladera: equipo.numeroHeladera,
          tipo: equipo.tipo,
          modelo: equipo.modelo,
        }));

        setEquiposCreados(equiposParaModal);
        setSuccessDialogOpen(true);
      }
      // Don't navigate automatically anymore - let the success modal handle it
    } catch (error: any) {
      console.error('Error saving equipo:', error);
      console.error('Error response data:', error.response?.data);

      // Extraer mensaje de error del backend
      let errorMessage = 'Error al guardar el equipo';
      let isStockError = false;

      if (error.response?.data) {
        const responseData = error.response.data;
        const message = responseData.message || responseData;

        // Detectar error de stock insuficiente
        if (typeof message === 'string' && message.includes('Stock insuficiente para los siguientes productos')) {
          isStockError = true;

          // Parsear los productos insuficientes del mensaje
          const productosParseados: ProductoInsuficiente[] = [];
          const lineas = message.split('\n');

          for (const linea of lineas) {
            // Formato: "Producto: Nombre (Código: CODIGO) - Necesario: X, Disponible: Y, Faltante: Z"
            const match = linea.match(/Producto:\s*(.+?)\s*\(Código:\s*(.+?)\)\s*-\s*Necesario:\s*(\d+),\s*Disponible:\s*(\d+),\s*Faltante:\s*(\d+)/);

            if (match) {
              productosParseados.push({
                nombre: match[1].trim(),
                codigo: match[2].trim(),
                necesario: parseInt(match[3]),
                disponible: parseInt(match[4]),
                faltante: parseInt(match[5]),
              });
            }
          }

          if (productosParseados.length > 0) {
            setProductosInsuficientes(productosParseados);
            setCantidadEquiposIntentados(data.cantidad);
            setStockErrorDialogOpen(true);
          } else {
            // Fallback si no se pudo parsear
            errorMessage = message;
          }
        }
        // Error de validación de stock (409 Conflict)
        else if (error.response.status === 409 && responseData.message) {
          errorMessage = responseData.message;
        }
        // Error de número duplicado o validación (400 Bad Request)
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
        // Error de validación de campos
        else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else {
          // Si es un objeto de validación (e.g., {numeroHeladera: 'mensaje', campo2: 'mensaje'})
          const errors = Object.entries(responseData)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
          if (errors) errorMessage = errors;
        }
      }

      // Solo mostrar snackbar si no es error de stock (el modal se encarga de eso)
      if (!isStockError) {
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error',
        });
      }
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

            {isEdit && (
              <Controller
                name="numeroHeladera"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de Heladera"
                    error={!!errors.numeroHeladera}
                    helperText={errors.numeroHeladera?.message}
                    fullWidth
                    disabled
                  />
                )}
              />
            )}

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
                  <TextField
                    {...field}
                    select
                    label="Medida"
                    fullWidth
                    value={field.value || ''}
                  >
                    <MenuItem value="">
                      <em>Sin especificar</em>
                    </MenuItem>
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
                    value={field.value || ''}
                  >
                    <MenuItem value="">
                      <em>Sin especificar</em>
                    </MenuItem>
                    {COLORES_EQUIPO.map((color) => (
                      <MenuItem key={color} value={color}>
                        {color.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={isEdit ? "Cantidad *" : "Cantidad de Unidades a Crear *"}
                    type="number"
                    error={!!errors.cantidad}
                    helperText={isEdit ? errors.cantidad?.message : errors.cantidad?.message || "Se creará un registro individual por cada unidad"}
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
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
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
        autoHideDuration={snackbar.severity === 'error' ? 8000 : 4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            whiteSpace: 'pre-line', // Permite saltos de línea
            maxWidth: '600px',
            width: '100%'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <StockErrorDialog
        open={stockErrorDialogOpen}
        onClose={() => setStockErrorDialogOpen(false)}
        productosInsuficientes={productosInsuficientes}
        cantidadEquipos={cantidadEquiposIntentados}
      />

      <EquipoSuccessDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        equiposCreados={equiposCreados}
        onNuevoEquipo={() => {
          setSuccessDialogOpen(false);
          reset();
          setSelectedReceta(null);
          setSelectedResponsable(null);
          setSelectedCliente(null);
          setEstado('EN_PROCESO');
        }}
        onVerEquipos={() => navigate('/fabricacion/equipos')}
      />

      {/* Edit Success Dialog */}
      <Dialog
        open={editSuccessDialogOpen}
        onClose={() => setEditSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'success.main', color: 'white' }}>
          <CheckCircle />
          Equipo Actualizado
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            El equipo ha sido actualizado correctamente.
          </Alert>
          
          {equipoEditado && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Datos actualizados:
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Número:
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {equipoEditado.numeroHeladera}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tipo:
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {equipoEditado.tipo}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Modelo:
                  </Typography>
                  <Typography variant="body2" fontWeight="500">
                    {equipoEditado.modelo}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => navigate('/fabricacion/equipos')}
            variant="contained"
            color="success"
            fullWidth
          >
            Ver Equipos
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EquipoForm;
