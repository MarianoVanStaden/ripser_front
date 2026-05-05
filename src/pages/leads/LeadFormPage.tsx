import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  IconButton,
  List,
  ListItem,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import { usuarioApi } from '../../api/services/usuarioApi';
import type { Cliente, Usuario } from '../../types';
import { productApi } from '../../api/services/productApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import {
  EstadoLeadEnum,
  CanalEnum,
  ProvinciaEnum,
  TipoRecordatorioEnum,
  ESTADO_LABELS,
  CANAL_LABELS,
  PROVINCIA_LABELS
} from '../../types/lead.types';
import type { LeadDTO, ValidationErrors, RecordatorioLeadDTO, DuplicatePhoneError } from '../../types/lead.types';
import { DuplicatePhoneDialog } from '../../components/leads/DuplicatePhoneDialog';
import { provinciaFromTelefono } from '../../utils/argentinaPhoneToProvincia';
import type { Producto, RecetaFabricacionListDTO } from '../../types';
import ColorPicker from '../../components/common/ColorPicker';
import MedidaPicker from '../../components/common/MedidaPicker';
import { ProximoRecordatorio } from '../../components/leads/ProximoRecordatorio';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import LoadingOverlay from '../../components/common/LoadingOverlay';

// Orden visual para el selector de recetas. Tipos no listados caen al final
// alfabéticamente — ese es el balde "y otros" del producto.
const TIPO_EQUIPO_ORDER: Record<string, number> = {
  EXHIBIDOR: 1,
  COOLBOX: 2,
  HELADERA: 3,
};

export const LeadFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { sucursalFiltro, sucursales } = useTenant();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const clienteOrigenIdParam = searchParams.get('clienteId');
  const modoRecompra = searchParams.get('modo') === 'recompra';

  const [clienteOrigen, setClienteOrigen] = useState<Cliente | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [duplicateError, setDuplicateError] = useState<DuplicatePhoneError | null>(null);
  // Cancela el chequeo en vuelo cuando el usuario sigue editando: si tabbing
  // entre campos, sólo nos importa la respuesta del último blur.
  const checkTelefonoAbortRef = useRef<AbortController | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionListDTO[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Recetas ordenadas por tipo (prioridad fija) y luego alfabéticamente.
  // Memoizada para evitar reordenar en cada render del Autocomplete.
  const sortedRecetas = useMemo(() => {
    return [...recetas].sort((a, b) => {
      const ordA = TIPO_EQUIPO_ORDER[a.tipoEquipo as string] ?? 99;
      const ordB = TIPO_EQUIPO_ORDER[b.tipoEquipo as string] ?? 99;
      if (ordA !== ordB) return ordA - ordB;
      return (a.nombre || '').localeCompare(b.nombre || '', 'es');
    });
  }, [recetas]);

  const [formData, setFormData] = useState<Partial<LeadDTO>>({
    nombre: '',
    telefono: '',
    email: '',
    provincia: undefined,
    canal: CanalEnum.WHATSAPP,
    estadoLead: EstadoLeadEnum.PRIMER_CONTACTO,
    fechaPrimerContacto: new Date().toISOString().split('T')[0],
    sucursalId: sucursalFiltro ?? undefined,
    usuarioAsignadoId: user?.id ?? undefined,
    productoInteresId: undefined,
    cantidadProductoInteres: undefined,
    recetaInteresId: undefined,
    cantidadRecetaInteres: undefined,
    modeloRecetaInteres: '',
    colorRecetaInteresId: undefined,
    medidaRecetaInteresId: undefined,
    // Legacy fields
    equipoFabricadoInteresId: undefined,
    cantidadEquipoInteres: undefined,
    modeloEquipoInteres: '',
    colorEquipoInteresId: undefined,
    medidaEquipoInteresId: undefined,
    equipoInteresadoId: undefined,
    recordatorios: []
  });

  // Estado para nuevo recordatorio
  const [nuevoRecordatorio, setNuevoRecordatorio] = useState({
    fechaRecordatorio: '',
    tipo: 'TAREA',
    mensaje: ''
  });

  // Rastrear recordatorios originales para detectar eliminaciones
  const [recordatoriosOriginales, setRecordatoriosOriginales] = useState<RecordatorioLeadDTO[]>([]);

  // Cargar catálogos y datos del lead
  useEffect(() => {
    loadCatalogs();
    if (isEditMode && id) {
      loadLead(parseInt(id));
    }
  }, [id, isEditMode]);

  // Pre-rellenar datos del cliente origen en modo recompra
  useEffect(() => {
    if (!modoRecompra || !clienteOrigenIdParam) return;
    const clienteId = parseInt(clienteOrigenIdParam);
    clienteApi.getById(clienteId).then((cliente) => {
      setClienteOrigen(cliente);
      setFormData((prev) => ({
        ...prev,
        nombre: `${cliente.nombre}${cliente.apellido ? ' ' + cliente.apellido : ''}`,
        telefono: cliente.telefono || cliente.whatsapp || prev.telefono || '',
        email: cliente.email || prev.email || '',
        canal: CanalEnum.RECOMPRA,
        clienteOrigenId: clienteId,
      }));
    }).catch((err) => {
      console.error('Error al cargar cliente origen:', err);
    });
  }, [clienteOrigenIdParam, modoRecompra]);

  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const [productosResponse, recetasData, usuariosData] = await Promise.all([
        productApi.getAll({ page: 0, size: 1000 }).catch(() => []),
        recetaFabricacionApi.findAllActive().catch(() => []),
        // Vendedores primero (visible para todos los roles); fallback a activos.
        usuarioApi.getVendedores()
          .then((data) => (data.length > 0 ? data : usuarioApi.getActivos()))
          .catch(() => usuarioApi.getActivos().catch(() => [])),
      ]);
      const productosList = Array.isArray(productosResponse)
        ? productosResponse
        : (productosResponse as any)?.content || [];
      setProductos(productosList);
      setRecetas(recetasData);
      setUsuarios(usuariosData);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const loadLead = async (leadId: number) => {
    try {
      setLoading(true);
      const data = await leadApi.getById(leadId);
      
      // Cargar recordatorios del lead
      try {
        const recordatorios = await leadApi.getRecordatorios(leadId);
        data.recordatorios = recordatorios;
        setRecordatoriosOriginales([...recordatorios]); // Guardar copia para detectar eliminaciones
      } catch (err) {
        console.error('Error al cargar recordatorios:', err);
        data.recordatorios = [];
        setRecordatoriosOriginales([]);
      }

      // Red de seguridad para leads pre-V53_0_0 cuyo id de "equipo" en realidad
      // era el id de una receta (bug histórico de mapeo). El backfill de la
      // migración cubre la mayoría, pero si por algún motivo un lead quedó
      // afuera, seguimos mostrándolo en el lado de receta. Borrar cuando todos
      // los leads en producción tengan recetaInteresId nativo.
      if (data.equipoFabricadoInteresId && !data.recetaInteresId) {
        data.recetaInteresId = data.equipoFabricadoInteresId;
        data.recetaInteresNombre = data.equipoFabricadoInteresNombre;
        data.cantidadRecetaInteres = data.cantidadEquipoInteres;
        data.modeloRecetaInteres = data.modeloEquipoInteres;
        data.colorRecetaInteresId = data.colorEquipoInteresId;
        data.medidaRecetaInteresId = data.medidaEquipoInteresId;
      }
      
      setFormData(data);
    } catch (err) {
      console.error('Error al cargar lead:', err);
      setError('Error al cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.nombre || formData.nombre.trim() === '') {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.telefono || formData.telefono.trim() === '') {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    // Email es opcional, pero si se carga debe tener formato válido.
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Formato de email inválido';
      }
    }

    if (!formData.canal) {
      newErrors.canal = 'El canal es obligatorio';
    }

    if (!formData.estadoLead) {
      newErrors.estadoLead = 'El estado es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Auto-asignar sucursal del contexto si no está especificada
      const dataToSend = {
        ...formData,
        sucursalId: formData.sucursalId || sucursalFiltro
      };

      let leadId: number;

      if (isEditMode && id) {
        await leadApi.update(parseInt(id), dataToSend as LeadDTO);
        leadId = parseInt(id);
      } else {
        const leadCreado = await leadApi.create(dataToSend as Omit<LeadDTO, 'id' | 'dias' | 'fechaConversion'>);
        leadId = leadCreado.id!;
      }

      // Gestionar recordatorios usando la API específica
      if (isEditMode) {
        // Detectar recordatorios eliminados
        const recordatoriosActualesIds = (formData.recordatorios || [])
          .filter(r => r.id)
          .map(r => r.id);
        
        const recordatoriosEliminados = recordatoriosOriginales.filter(
          original => original.id && !recordatoriosActualesIds.includes(original.id)
        );

        // Eliminar recordatorios removidos
        for (const recordatorio of recordatoriosEliminados) {
          if (recordatorio.id) {
            try {
              await leadApi.deleteRecordatorio(leadId, recordatorio.id);
            } catch (err) {
              console.error('Error al eliminar recordatorio:', err);
            }
          }
        }
      }

      // Crear o actualizar recordatorios
      if (formData.recordatorios && formData.recordatorios.length > 0) {
        for (const recordatorio of formData.recordatorios) {
          if (!recordatorio.id) {
            // Crear nuevo recordatorio
            try {
              const payload: any = {
                fechaRecordatorio: recordatorio.fechaRecordatorio,
                tipo: recordatorio.tipo,
                mensaje: recordatorio.mensaje || ''
              };
              console.log('Creando recordatorio:', payload);
              await leadApi.createRecordatorio(leadId, payload);
            } catch (err) {
              console.error('Error al crear recordatorio:', err);
            }
          } else {
            // Actualizar recordatorio existente
            try {
              await leadApi.updateRecordatorio(leadId, recordatorio.id, recordatorio);
            } catch (err) {
              console.error('Error al actualizar recordatorio:', err);
            }
          }
        }
      }

      navigate('/leads');
    } catch (err: unknown) {
      console.error('Error al guardar lead:', err);
      const data = (err as any)?.response?.data;
      if (data?.tipo === 'TELEFONO_DUPLICADO') {
        const isMatchClienteOrigen =
          modoRecompra &&
          clienteOrigenIdParam &&
          data.existingType === 'CLIENTE' &&
          data.existingId === parseInt(clienteOrigenIdParam);
        if (isMatchClienteOrigen) {
          setError('El backend rechazó la creación del lead de recompra por teléfono duplicado. Verificá que la API permita leads asociados al cliente origen.');
          return;
        }
        setDuplicateError(data as DuplicatePhoneError);
        return;
      }
      const msg = data?.message || data;
      if (typeof msg === 'string' && msg.includes('sucursal')) {
        setError(msg);
      } else {
        setError('Error al guardar el lead. Por favor, intente nuevamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof LeadDTO) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });

    // Limpiar error del campo
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Chequeo en vivo de duplicados al perder foco del campo teléfono. El backend
  // devuelve 200 con `exists` (no 409), así que el modal aparece sin tener que
  // esperar al submit. En edición se excluye el lead actual y se pasa warnOnly
  // para suprimir el botón "Ir al lead existente" — el usuario perdería los
  // cambios sin guardar.
  const handleTelefonoBlur = async () => {
    const telefono = (formData.telefono || '').trim();

    // Auto-detectar provincia desde el código de área. Pisa siempre que se
    // detecte un prefijo válido — si el usuario cambia el teléfono lo más
    // probable es que la provincia tenga que seguirlo. Si el número no matchea
    // ningún prefijo (ej. extranjero) se deja la provincia anterior intacta.
    const detected = provinciaFromTelefono(telefono);
    if (detected && detected !== formData.provincia) {
      setFormData((prev) => ({ ...prev, provincia: detected }));
    }

    // Sólo dígitos para decidir si vale la pena consultar; la normalización
    // real la hace el backend (PhoneNormalizer = últimos 10 dígitos = número
    // significativo nacional argentino, código de área + abonado). Con menos
    // de 10 el backend no trunca y el chequeo no es comparable contra los
    // teléfonos almacenados en formato canónico, así que ni siquiera
    // disparamos el request.
    const digitos = telefono.replace(/\D/g, '');
    if (digitos.length < 10) return;

    checkTelefonoAbortRef.current?.abort();
    const controller = new AbortController();
    checkTelefonoAbortRef.current = controller;

    try {
      const excludeId = isEditMode && id ? parseInt(id) : undefined;
      const result = await leadApi.checkTelefono(telefono, excludeId, controller.signal);
      if (controller.signal.aborted) return;
      if (result.exists && result.existingId && result.existingType && result.existingNombre) {
        // En modo recompra el teléfono pre-cargado pertenece al cliente origen; no
        // tiene sentido alertar de un duplicado que es justamente la razón del lead.
        const isMatchClienteOrigen =
          modoRecompra &&
          clienteOrigenIdParam &&
          result.existingType === 'CLIENTE' &&
          result.existingId === parseInt(clienteOrigenIdParam);
        if (isMatchClienteOrigen) return;
        setDuplicateError({
          tipo: 'TELEFONO_DUPLICADO',
          existingId: result.existingId,
          existingType: result.existingType,
          existingNombre: result.existingNombre,
          telefono: result.telefono ?? telefono,
        });
      }
    } catch (err) {
      // Cancelaciones son esperables al tabbing rápido — no son errores reales.
      if ((err as any)?.name === 'CanceledError' || (err as any)?.code === 'ERR_CANCELED') return;
      console.error('Error chequeando duplicados de teléfono:', err);
    }
  };

  const handleAgregarRecordatorio = () => {
    if (!nuevoRecordatorio.fechaRecordatorio) {
      return;
    }

    const recordatorio: RecordatorioLeadDTO = {
      leadId: parseInt(id || '0'),
      fechaRecordatorio: nuevoRecordatorio.fechaRecordatorio,
      tipo: nuevoRecordatorio.tipo as any,
      mensaje: nuevoRecordatorio.mensaje,
      enviado: false
    };

    setFormData({
      ...formData,
      recordatorios: [...(formData.recordatorios || []), recordatorio]
    });

    // Limpiar formulario de nuevo recordatorio
    setNuevoRecordatorio({
      fechaRecordatorio: '',
      tipo: 'TAREA',
      mensaje: ''
    });
  };

  const handleEliminarRecordatorio = (index: number) => {
    const nuevosRecordatorios = [...(formData.recordatorios || [])];
    nuevosRecordatorios.splice(index, 1);
    setFormData({
      ...formData,
      recordatorios: nuevosRecordatorios
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando lead..." />
      <DuplicatePhoneDialog
        open={duplicateError !== null}
        error={duplicateError}
        onClose={() => setDuplicateError(null)}
        warnOnly={isEditMode}
      />
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Editar Lead' : 'Nuevo Lead'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {modoRecompra && clienteOrigen && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Lead de recompra generado desde el cliente <strong>{clienteOrigen.nombre}{clienteOrigen.apellido ? ` ${clienteOrigen.apellido}` : ''}</strong>. Los datos fueron pre-cargados y pueden editarse.
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Información Básica */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Información de Contacto
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre"
                  value={formData.nombre}
                  onChange={handleChange('nombre')}
                  error={Boolean(errors.nombre)}
                  helperText={errors.nombre}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Teléfono"
                  value={formData.telefono}
                  onChange={handleChange('telefono')}
                  onBlur={handleTelefonoBlur}
                  error={Boolean(errors.telefono)}
                  helperText={errors.telefono}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  placeholder="opcional"
                  value={formData.email ?? ''}
                  onChange={handleChange('email')}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  inputProps={{ inputMode: 'email', autoComplete: 'email' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Provincia</InputLabel>
                  <Select
                    value={formData.provincia || ''}
                    onChange={handleChange('provincia')}
                    label="Provincia"
                  >
                    <MenuItem value="">
                      <em>Ninguna</em>
                    </MenuItem>
                    {Object.values(ProvinciaEnum).map((provincia) => (
                      <MenuItem key={provincia} value={provincia}>
                        {PROVINCIA_LABELS[provincia]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Canal y Estado */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Datos del Lead
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={Boolean(errors.canal)}>
                  <InputLabel>Canal</InputLabel>
                  <Select
                    value={formData.canal || ''}
                    onChange={handleChange('canal')}
                    label="Canal"
                  >
                    {Object.values(CanalEnum).map((canal) => (
                      <MenuItem key={canal} value={canal}>
                        {CANAL_LABELS[canal]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={Boolean(errors.estadoLead)}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.estadoLead || ''}
                    onChange={handleChange('estadoLead')}
                    label="Estado"
                  >
                    {Object.values(EstadoLeadEnum).map((estado) => (
                      <MenuItem key={estado} value={estado}>
                        {ESTADO_LABELS[estado]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Primer Contacto"
                  value={formData.fechaPrimerContacto}
                  onChange={handleChange('fechaPrimerContacto')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {sucursales.length > 0 && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sucursal</InputLabel>
                    <Select
                      value={formData.sucursalId ?? sucursalFiltro ?? ''}
                      onChange={handleChange('sucursalId')}
                      label="Sucursal"
                    >
                      {sucursales.map((s) => (
                        <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Asesor asignado</InputLabel>
                  <Select
                    value={formData.usuarioAsignadoId ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormData({
                        ...formData,
                        usuarioAsignadoId: v === '' ? undefined : Number(v),
                      });
                    }}
                    label="Asesor asignado"
                  >
                    <MenuItem value=""><em>Sin asignar</em></MenuItem>
                    {usuarios.map((u) => {
                      const nombre = u.nombre || (u as any).username || `#${u.id}`;
                      const apellido = u.apellido || '';
                      const label = apellido ? `${nombre} ${apellido}` : nombre;
                      return (
                        <MenuItem key={u.id} value={u.id}>{label}</MenuItem>
                      );
                    })}
                    {/* Fallback: si el lead está asignado a un user que no está en la lista
                        (p.ej. admin que no es vendedor), conservar el valor y mostrarlo. */}
                    {formData.usuarioAsignadoId != null &&
                     !usuarios.some((u) => u.id === formData.usuarioAsignadoId) && (
                      <MenuItem value={formData.usuarioAsignadoId}>
                        Usuario #{formData.usuarioAsignadoId}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Producto de Interés */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Producto de Interés
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <Autocomplete
                  options={productos}
                  getOptionLabel={(option) => `${option.nombre} - $${option.precio}`}
                  value={productos.find(p => p.id === formData.productoInteresId) || null}
                  onChange={(_, newValue) => {
                    setFormData({ 
                      ...formData, 
                      productoInteresId: newValue?.id,
                      productoInteresNombre: newValue?.nombre
                    });
                  }}
                  disabled={loadingCatalogs}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Buscar producto" 
                      placeholder="Escriba para buscar..."
                    />
                  )}
                  noOptionsText="No se encontraron productos"
                  loading={loadingCatalogs}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad"
                  value={formData.cantidadProductoInteres || ''}
                  onChange={(e) => setFormData({ ...formData, cantidadProductoInteres: e.target.value ? Number(e.target.value) : undefined })}
                  disabled={!formData.productoInteresId}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              {/* Receta de Fabricación de Interés */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
                  Equipo a Fabricar (Receta Base)
                </Typography>
              </Grid>

              <Grid item xs={12} md={12}>
                <Autocomplete
                  options={sortedRecetas}
                  getOptionLabel={(option) => option.nombre}
                  value={sortedRecetas.find(r => r.id === formData.recetaInteresId) || null}
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      recetaInteresId: newValue?.id,
                      recetaInteresNombre: newValue?.nombre,
                      // Pre-cargar valores de la receta, pero permitir edición.
                      modeloRecetaInteres: newValue?.modelo || '',
                      colorRecetaInteresId: newValue?.color?.id,
                      medidaRecetaInteresId: newValue?.medida?.id,
                    });
                  }}
                  disabled={loadingCatalogs}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Buscar receta de fabricación" 
                      placeholder="Escriba para buscar..."
                      helperText="Seleccione una receta base. Puede editar los parámetros abajo."
                    />
                  )}
                  noOptionsText="No se encontraron recetas activas"
                  loading={loadingCatalogs}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad"
                  value={formData.cantidadRecetaInteres || ''}
                  onChange={(e) => {
                    const cantidad = e.target.value ? Number(e.target.value) : undefined;
                    setFormData({
                      ...formData,
                      cantidadRecetaInteres: cantidad,
                    });
                  }}
                  disabled={!formData.recetaInteresId}
                  inputProps={{ min: 1 }}
                  helperText="Cantidad a fabricar"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Modelo Personalizado"
                  value={formData.modeloRecetaInteres || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      modeloRecetaInteres: e.target.value,
                    });
                  }}
                  disabled={!formData.recetaInteresId}
                  placeholder="Ej: HI-2024-001"
                  helperText="Puede personalizar el modelo"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <ColorPicker
                  label="Color"
                  value={formData.colorRecetaInteresId}
                  onChange={(id) => {
                    setFormData({
                      ...formData,
                      colorRecetaInteresId: id,
                    });
                  }}
                  disabled={!formData.recetaInteresId}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <MedidaPicker
                  label="Medida"
                  value={formData.medidaRecetaInteresId}
                  onChange={() => {}}
                  disabled
                  size="medium"
                />
              </Grid>

              {/* Recordatorios */}
              <Grid item xs={12}>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon /> Recordatorios
                </Typography>
              </Grid>

              {/* Próximo Recordatorio Pendiente (solo en modo edición) */}
              {isEditMode && formData.recordatorios && formData.recordatorios.length > 0 && (() => {
                const recordatoriosPendientes = formData.recordatorios
                  .filter(r => !r.enviado)
                  .sort((a, b) => new Date(a.fechaRecordatorio).getTime() - new Date(b.fechaRecordatorio).getTime());
                
                const proximoRecordatorio = recordatoriosPendientes[0] || null;
                
                if (proximoRecordatorio) {
                  return (
                    <Grid item xs={12}>
                      <ProximoRecordatorio 
                        leadId={parseInt(id!)} 
                        recordatorio={proximoRecordatorio}
                        onRecordatorioEnviado={() => {
                          if (id) loadLead(parseInt(id));
                        }}
                      />
                    </Grid>
                  );
                }
                return null;
              })()}

              {/* Lista de recordatorios existentes */}
              {formData.recordatorios && formData.recordatorios.length > 0 && (
                <Grid item xs={12}>
                  <List>
                    {formData.recordatorios.map((recordatorio, index) => (
                      <ListItem key={index}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            width: '100%',
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                              <Chip 
                                label={recordatorio.tipo?.replace(/_/g, ' ')}
                                size="small"
                                color="primary"
                              />
                              <Typography variant="body2" fontWeight="bold">
                                {recordatorio.fechaRecordatorio}
                              </Typography>
                            </Box>
                            {recordatorio.mensaje && (
                              <Typography variant="body2" color="text.secondary">
                                {recordatorio.mensaje}
                              </Typography>
                            )}
                          </Box>
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={() => handleEliminarRecordatorio(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}

              {/* Formulario para nuevo recordatorio */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Agregar Nuevo Recordatorio
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Fecha"
                        value={nuevoRecordatorio.fechaRecordatorio}
                        onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, fechaRecordatorio: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tipo</InputLabel>
                        <Select
                          value={nuevoRecordatorio.tipo}
                          label="Tipo"
                          onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, tipo: e.target.value })}
                        >
                          {Object.values(TipoRecordatorioEnum).map(tipo => (
                            <MenuItem key={tipo} value={tipo}>
                              {tipo.replace(/_/g, ' ')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Mensaje (opcional)"
                        value={nuevoRecordatorio.mensaje}
                        onChange={(e) => setNuevoRecordatorio({ ...nuevoRecordatorio, mensaje: e.target.value })}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="medium"
                        onClick={handleAgregarRecordatorio}
                        disabled={!nuevoRecordatorio.fechaRecordatorio}
                        startIcon={<AddIcon />}
                      >
                        Agregar
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Botones */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/leads')}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};
