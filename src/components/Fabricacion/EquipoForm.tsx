import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Paper, Typography, Button, TextField, MenuItem, Stack, Alert,
  Snackbar, CircularProgress, IconButton, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions, ToggleButtonGroup, ToggleButton,
  Checkbox, FormControlLabel,
} from '@mui/material';
import { ArrowBack, Save, CheckCircle, Build, Brush } from '@mui/icons-material';
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
} from '../../types';
import ColorPicker from '../common/ColorPicker';
import MedidaPicker from '../common/MedidaPicker';
import { employeeApi } from '../../api/services/employeeApi';
import ClienteAutocomplete from '../common/ClienteAutocomplete';
import StockErrorDialog, { type ProductoInsuficiente } from '../common/StockErrorDialog';
import EquipoSuccessDialog, { type EquipoCreado } from '../common/EquipoSuccessDialog';
import LoadingOverlay from '../common/LoadingOverlay';


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
  medidaId: yup.number().nullable().transform((v) => (v === '' || v == null ? null : v)),
  colorId: yup.number().nullable().transform((v) => (v === '' || v == null ? null : v)),
  especial: yup.boolean(),
  espPuertasFrontales: yup.boolean(),
  espLuzFria: yup.boolean(),
  espLateraMixta: yup.boolean(),
  observaciones: yup.string(),
});

const EquipoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: numeroHeladera } = useParams<{ id: string }>();
  const isEdit = Boolean(numeroHeladera);

  const [loading, setLoading] = useState(false);
  const recetasQuery = useQuery({
    queryKey: ['recetas', 'activas'],
    queryFn: () => recetaFabricacionApi.findAllActive(),
    staleTime: 300_000,
  });
  const empleadosQuery = useQuery({
    queryKey: ['empleados', 'list'],
    queryFn: () => employeeApi.getAllList(),
    staleTime: 300_000,
  });
  const recetas: any[] = recetasQuery.data ?? [];
  const empleados: any[] = empleadosQuery.data ?? [];
  const [selectedReceta, setSelectedReceta] = useState<any>(null);
  const [selectedResponsable, setSelectedResponsable] = useState<any>(null);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [estado, setEstado] = useState<EstadoFabricacion>('PENDIENTE');
  // PK real del equipo (el route param :id es el numeroHeladera, no la primary key).
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [modoFabricacion, setModoFabricacion] = useState<'COMPLETO' | 'BASE'>('COMPLETO');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [stockErrorDialogOpen, setStockErrorDialogOpen] = useState(false);
  const [productosInsuficientes, setProductosInsuficientes] = useState<ProductoInsuficiente[]>([]);
  const [cantidadEquiposIntentados, setCantidadEquiposIntentados] = useState(1);
  const [recetaIdIntentada, setRecetaIdIntentada] = useState<number | null>(null);
  // Datos del form pendientes de guardar cuando se muestra el aviso de faltantes,
  // para poder ejecutar el alta si el usuario elige "Fabricar igual".
  const [pendingData, setPendingData] = useState<any>(null);

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [equiposCreados, setEquiposCreados] = useState<EquipoCreado[]>([]);

  const [editSuccessDialogOpen, setEditSuccessDialogOpen] = useState(false);
  const [equipoEditado, setEquipoEditado] = useState<{
    numeroHeladera: string;
    tipo: string;
    modelo: string;
  } | null>(null);

  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipo: '' as TipoEquipo,
      modelo: '',
      equipo: '',
      medidaId: null as number | null,
      colorId: null as number | null,
      numeroHeladera: '',
      cantidad: 1,
      especial: false,
      espPuertasFrontales: false,
      espLuzFria: false,
      espLateraMixta: false,
      observaciones: '',
    },
    context: { isEdit },
  });

  // Especial → observaciones obligatorias (mismo criterio que un presupuesto especial):
  // ahí se detallan las particularidades de fabricación. Solo gatea al CREAR.
  const especialValue = watch('especial');
  const observacionesValue = watch('observaciones');
  const faltaObsEspecial = !isEdit && !!especialValue && !((observacionesValue as string) || '').trim();

  // Cada equipo Especial debe tener al menos una característica estructurada (invariante del backend).
  const espPuertasValue = watch('espPuertasFrontales');
  const espLuzValue = watch('espLuzFria');
  const espLateraMixtaValue = watch('espLateraMixta');
  const faltaCaracteristicasEspecial =
    !!especialValue && !espPuertasValue && !espLuzValue && !espLateraMixtaValue;

  // Equipo a editar: query bajo el namespace ['equipos']; la hidratación del
  // form espera a los catálogos (para resolver receta/responsable) y corre
  // UNA vez por número — un refetch de fondo no pisa la edición en curso.
  const equipoEditQuery = useQuery({
    queryKey: ['equipos', 'detalle', numeroHeladera],
    queryFn: () => equipoFabricadoApi.findByNumeroHeladera(numeroHeladera!),
    enabled: isEdit && !!numeroHeladera,
  });
  const hydratedRef = useRef<string | null>(null);
  useEffect(() => {
    const data = equipoEditQuery.data;
    if (!isEdit || !data || !numeroHeladera) return;
    if (recetasQuery.isPending || empleadosQuery.isPending) return;
    if (hydratedRef.current === numeroHeladera) return;
    hydratedRef.current = numeroHeladera;

    reset({
      tipo: data.tipo,
      modelo: data.modelo,
      equipo: data.equipo || '',
      medidaId: data.medida?.id ?? null,
      colorId: data.color?.id ?? null,
      numeroHeladera: data.numeroHeladera,
      cantidad: data.cantidad,
      especial: (data as any).especial ?? false,
      espPuertasFrontales: (data as any).espPuertasFrontales ?? false,
      espLuzFria: (data as any).espLuzFria ?? false,
      espLateraMixta: (data as any).espLateraMixta ?? false,
      observaciones: data.observaciones || '',
    });
    setEstado(data.estado);
    setEquipoId(data.id);
    if (data.recetaId) {
      setSelectedReceta(recetas.find((r) => r.id === data.recetaId) || null);
    }
    if (data.responsableId) {
      setSelectedResponsable(empleados.find((e) => e.id === data.responsableId) || null);
    }
    if (data.clienteId) {
      setSelectedCliente({ id: data.clienteId, nombre: data.clienteNombre });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipoEditQuery.data, recetasQuery.isPending, empleadosQuery.isPending, isEdit, numeroHeladera]);
  useEffect(() => {
    if (recetasQuery.error) {
      const error: any = recetasQuery.error;
      setSnackbar({
        open: true,
        message: `Error al cargar recetas: ${error.response?.data?.message || error.message || 'Error desconocido'}`,
        severity: 'error',
      });
    } else if (equipoEditQuery.error) {
      setSnackbar({ open: true, message: 'Error al cargar el equipo', severity: 'error' });
    }
  }, [recetasQuery.error, equipoEditQuery.error]);

  // Auto-fill form fields when recipe is selected
  useEffect(() => {
    if (selectedReceta && !isEdit) {
      setValue('tipo', selectedReceta.tipoEquipo);
      setValue('equipo', selectedReceta.nombre || '');
      setValue('modelo', selectedReceta.modelo || '');
      setValue('medidaId', selectedReceta.medida?.id ?? null);
    }
  }, [selectedReceta, isEdit, setValue]);


  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      // Al crear, la Receta Base es obligatoria: de ella se derivan tipo/modelo/equipo/medida
      // (esos campos no se editan en el form). Sin receta no hay datos de fabricación.
      if (!isEdit && !selectedReceta?.id) {
        setSnackbar({ open: true, message: 'Seleccioná una Receta Base', severity: 'error' });
        setLoading(false);
        return;
      }

      // Especial exige observaciones (particularidades de fabricación).
      if (faltaObsEspecial) {
        setSnackbar({
          open: true,
          message: 'Las observaciones son obligatorias para equipos especiales',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      // Especial exige al menos una característica estructurada.
      if (faltaCaracteristicasEspecial) {
        setSnackbar({
          open: true,
          message: 'Un equipo Especial debe indicar al menos una característica (puertas frontales, luz fría o latera mixta)',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      // Validación proactiva de stock (solo al crear con receta): muestra el modal
      // con los faltantes estructurados ANTES de intentar fabricar.
      if (!isEdit && selectedReceta?.id) {
        try {
          const validacion = await equipoFabricadoApi.validarStock({
            tipo: data.tipo,
            modelo: data.modelo,
            equipo: data.equipo,
            medidaId: data.medidaId ?? null,
            colorId: data.colorId ?? null,
            cantidad: data.cantidad,
            estado: 'PENDIENTE',
            numeroHeladera: 'AUTO',
            recetaId: selectedReceta.id,
            responsableId: selectedResponsable?.id,
          } as EquipoFabricadoCreateDTO);

          if (!validacion.stockSuficiente && (validacion.faltantes?.length ?? 0) > 0) {
            setProductosInsuficientes(
              (validacion.faltantes ?? []).map((f) => ({
                nombre: f.nombre,
                codigo: f.codigo,
                necesario: f.necesario,
                disponible: f.disponible,
                faltante: f.faltante,
                productoId: f.productoId,
                proveedorSugeridoId: f.proveedorSugeridoId,
                proveedorSugeridoNombre: f.proveedorSugeridoNombre,
              })),
            );
            setCantidadEquiposIntentados(data.cantidad);
            setRecetaIdIntentada(selectedReceta.id);
            setPendingData(data);
            setStockErrorDialogOpen(true);
            setLoading(false);
            return;
          }
        } catch (validationError) {
          // Si la validación previa falla (red u otro motivo) seguimos al flujo
          // normal: el backend vuelve a validar el stock al crear.
          console.warn('No se pudo validar stock previamente:', validationError);
        }
      }

      await ejecutarGuardado(data);
    } catch (error) {
      // La validación proactiva no debería lanzar; el guardado maneja sus propios errores.
      console.error('Error inesperado en onSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ejecuta el alta/edición real. Se invoca tras la validación proactiva o cuando el
  // usuario elige "Fabricar igual" en el modal de faltantes (permitiendo stock negativo).
  const ejecutarGuardado = async (data: any) => {
    try {
      setLoading(true);

      if (isEdit && numeroHeladera) {
        if (equipoId == null) {
          throw new Error('No se pudo determinar el id del equipo a editar');
        }
        const updateData: EquipoFabricadoUpdateDTO = {
          tipo: data.tipo,
          modelo: data.modelo,
          equipo: data.equipo,
          medidaId: data.medidaId ?? null,
          colorId: data.colorId ?? null,
          cantidad: data.cantidad,
          observaciones: data.observaciones,
          estado,
          recetaId: selectedReceta?.id,
          responsableId: selectedResponsable?.id,
          clienteId: selectedCliente?.id,
          // Bloque Especial: se envía siempre (no undefined) para que el backend lo aplique
          // (contrato PATCH-like: especial=null significa "no tocar").
          especial: data.especial ?? false,
          espPuertasFrontales: data.espPuertasFrontales ?? false,
          espLuzFria: data.espLuzFria ?? false,
          espLateraMixta: data.espLateraMixta ?? false,
        };

        const response = await equipoFabricadoApi.update(equipoId, updateData);
        console.log('✅ Equipo updated successfully:', response);
        
        // Guardar info del equipo editado para el modal
        setEquipoEditado({
          numeroHeladera: data.numeroHeladera,
          tipo: data.tipo,
          modelo: data.modelo,
        });
        
        setEditSuccessDialogOpen(true);
      } else if (modoFabricacion === 'BASE') {
        // Flujo base: arranca en PENDIENTE igual que el flujo tradicional pero sin color.
        // PENDIENTE → Iniciar → EN_PROCESO → Completar → FABRICADO_SIN_TERMINACION → Aplicar Terminación → COMPLETADO
        const createData: EquipoFabricadoCreateDTO = {
          tipo: data.tipo,
          modelo: data.modelo,
          equipo: data.equipo,
          medidaId: data.medidaId ?? null,
          colorId: null, // Sin color — el backend lo completa a FABRICADO_SIN_TERMINACION
          cantidad: data.cantidad,
          especial: data.especial ?? false,
          espPuertasFrontales: data.espPuertasFrontales ?? false,
          espLuzFria: data.espLuzFria ?? false,
          espLateraMixta: data.espLateraMixta ?? false,
          observaciones: data.observaciones,
          numeroHeladera: 'AUTO',
          recetaId: selectedReceta?.id,
          responsableId: selectedResponsable?.id,
        };

        console.log('📦 CreateData (base, sin color) being sent:', JSON.stringify(createData, null, 2));

        const response = await equipoFabricadoApi.createBatch(createData);
        console.log('✅ Equipos base created successfully:', response);

        const equiposParaModal: EquipoCreado[] = response.equipos.map(equipo => ({
          numeroHeladera: equipo.numeroHeladera,
          tipo: equipo.tipo,
          modelo: equipo.modelo,
        }));

        setEquiposCreados(equiposParaModal);
        setSuccessDialogOpen(true);
      } else {
        const createData: EquipoFabricadoCreateDTO = {
          tipo: data.tipo,
          modelo: data.modelo,
          equipo: data.equipo,
          medidaId: data.medidaId ?? null,
          colorId: data.colorId ?? null,
          cantidad: data.cantidad,
          especial: data.especial ?? false,
          espPuertasFrontales: data.espPuertasFrontales ?? false,
          espLuzFria: data.espLuzFria ?? false,
          espLateraMixta: data.espLateraMixta ?? false,
          observaciones: data.observaciones,
          estado: 'PENDIENTE', // Always start in PENDIENTE for new equipos
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
            setRecetaIdIntentada(selectedReceta?.id ?? null);
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

  return (
    <Box p={3}>
      <LoadingOverlay open={(loading || equipoEditQuery.isPending) && isEdit} message="Cargando equipo..." />
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/fabricacion/equipos')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" fontWeight="600">
          {isEdit ? 'Editar Equipo' : 'Nuevo Equipo'}
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        {!isEdit && (
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Modo de Fabricación
            </Typography>
            <ToggleButtonGroup
              value={modoFabricacion}
              exclusive
              onChange={(_, newMode) => { if (newMode) setModoFabricacion(newMode); }}
              sx={{ mt: 1 }}
            >
              <ToggleButton value="COMPLETO" sx={{ gap: 1 }}>
                <Build fontSize="small" />
                Fabricación Completa
              </ToggleButton>
              <ToggleButton value="BASE" sx={{ gap: 1 }}>
                <Brush fontSize="small" />
                Fabricar Base (sin terminación)
              </ToggleButton>
            </ToggleButtonGroup>
            {modoFabricacion === 'BASE' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                El equipo arrancará en estado <strong>Pendiente</strong>, sin color asignado. Flujo: Iniciar Fabricación → Completar → quedará como base genérica (Sin Terminación) lista para aplicar terminación a demanda.
              </Alert>
            )}
          </Paper>
        )}

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
              disabled={isEdit && estado !== 'PENDIENTE'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={isEdit ? 'Receta Base (opcional)' : 'Receta Base *'}
                  helperText={!isEdit ? 'Define tipo, modelo, equipo y medida del equipo' : undefined}
                />
              )}
            />

            {/* Tipo/Modelo/Equipo/Medida se derivan de la Receta Base: no se editan al crear.
                En edición se muestran para poder corregirlos (según estado). */}
            {isEdit && (
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
                    disabled={isEdit && estado !== 'PENDIENTE'}
                  >
                    <MenuItem value="HELADERA">Heladera</MenuItem>
                    <MenuItem value="COOLBOX">Coolbox</MenuItem>
                    <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                    <MenuItem value="OTRO">Otro</MenuItem>
                  </TextField>
                )}
              />
            )}

            {isEdit && (
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
                    disabled={isEdit && estado !== 'PENDIENTE'}
                  />
                )}
              />
            )}

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

            {isEdit && (
              <Controller
                name="equipo"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Equipo" fullWidth />
                )}
              />
            )}

            <Stack direction="row" spacing={2}>
              {isEdit && (
                <Controller
                  name="medidaId"
                  control={control}
                  render={({ field }) => (
                    <MedidaPicker
                      value={field.value ?? undefined}
                      onChange={(id) => field.onChange(id ?? null)}
                      label="Medida"
                      disabled={isEdit}
                    />
                  )}
                />
              )}
              {(isEdit || modoFabricacion === 'COMPLETO') && (
                <Controller
                  name="colorId"
                  control={control}
                  render={({ field }) => (
                    <ColorPicker
                      value={field.value ?? undefined}
                      onChange={(id) => field.onChange(id ?? null)}
                      label="Color"
                    />
                  )}
                />
              )}
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
                    disabled={isEdit}
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

            <ClienteAutocomplete
              size="medium"
              label="Cliente (opcional)"
              value={selectedCliente}
              onChange={(newValue) => setSelectedCliente(newValue)}
            />

            {isEdit && (
              <TextField
                label="Estado"
                select
                value={estado}
                fullWidth
                disabled
                helperText="El estado se cambia desde las acciones de fabricación (iniciar / completar / cancelar)"
              >
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="EN_PROCESO">En Proceso</MenuItem>
                <MenuItem value="PENDIENTE_CONTROL_CALIDAD">Pendiente Control de Calidad</MenuItem>
                <MenuItem value="COMPLETADO">Completado</MenuItem>
                <MenuItem value="CANCELADO">Cancelado</MenuItem>
                <MenuItem value="FABRICADO_SIN_TERMINACION">Fabricado Sin Terminación</MenuItem>
              </TextField>
            )}

            <Controller
              name="especial"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (!e.target.checked) {
                          // Sin marca Especial no puede haber características (invariante del backend).
                          setValue('espPuertasFrontales', false);
                          setValue('espLuzFria', false);
                          setValue('espLateraMixta', false);
                        }
                      }}
                    />
                  }
                  label="Especial (fabricación con particularidades: puertas / enchufes / medidas)"
                />
              )}
            />

            {!!especialValue && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pl: 4 }} alignItems={{ sm: 'center' }}>
                <Controller
                  name="espPuertasFrontales"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Puertas frontales"
                    />
                  )}
                />
                <Controller
                  name="espLuzFria"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Luz fría"
                    />
                  )}
                />
                <Controller
                  name="espLateraMixta"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Latera mixta"
                    />
                  )}
                />
                {faltaCaracteristicasEspecial && (
                  <Typography variant="caption" color="error" sx={{ alignSelf: 'center' }}>
                    Indicá al menos una característica
                  </Typography>
                )}
              </Stack>
            )}

            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={!isEdit && especialValue ? 'Observaciones *' : 'Observaciones'}
                  multiline
                  rows={3}
                  fullWidth
                  error={faltaObsEspecial}
                  helperText={faltaObsEspecial ? 'Obligatorias para equipos especiales' : undefined}
                />
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
            disabled={loading || faltaObsEspecial || faltaCaracteristicasEspecial}
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
        recetaId={recetaIdIntentada}
        onRequerimientoCreado={(msg) =>
          setSnackbar({ open: true, message: msg, severity: 'success' })
        }
        onFabricarIgual={() => {
          setStockErrorDialogOpen(false);
          if (pendingData) ejecutarGuardado(pendingData);
        }}
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
          setEstado('PENDIENTE');
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'success.main', color: 'common.white' }}>
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
