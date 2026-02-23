import { useState, useEffect } from 'react';
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
import { useNavigate, useParams } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
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
import type { LeadDTO, ValidationErrors, RecordatorioLeadDTO } from '../../types/lead.types';
import type { Producto, RecetaFabricacionListDTO, ColorEquipo, MedidaEquipo } from '../../types';
import { COLORES_EQUIPO, MEDIDAS_EQUIPO } from '../../types';
import { ProximoRecordatorio } from '../../components/leads/ProximoRecordatorio';
import { useTenant } from '../../context/TenantContext';

export const LeadFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { sucursalFiltro } = useTenant();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionListDTO[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  const [formData, setFormData] = useState<Partial<LeadDTO>>({
    nombre: '',
    telefono: '',
    provincia: undefined,
    canal: CanalEnum.WHATSAPP,
    estadoLead: EstadoLeadEnum.PRIMER_CONTACTO,
    fechaPrimerContacto: new Date().toISOString().split('T')[0],
    productoInteresId: undefined,
    cantidadProductoInteres: undefined,
    recetaInteresId: undefined,
    cantidadRecetaInteres: undefined,
    modeloRecetaInteres: '',
    colorRecetaInteres: '',
    medidaRecetaInteres: '',
    // Legacy fields
    equipoFabricadoInteresId: undefined,
    cantidadEquipoInteres: undefined,
    modeloEquipoInteres: '',
    colorEquipoInteres: '',
    medidaEquipoInteres: '',
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

  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const [productosResponse, recetasData] = await Promise.all([
        productApi.getAll({ page: 0, size: 1000 }).catch(() => []),
        recetaFabricacionApi.findAllActive().catch(() => [])
      ]);
      const productosList = Array.isArray(productosResponse) 
        ? productosResponse 
        : (productosResponse as any)?.content || [];
      setProductos(productosList);
      setRecetas(recetasData);
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

      // Normalizar campos de equipo/receta para compatibilidad
      // Si vienen datos en equipoFabricadoInteres*, copiarlos a recetaInteres*
      if (data.equipoFabricadoInteresId && !data.recetaInteresId) {
        data.recetaInteresId = data.equipoFabricadoInteresId;
        data.recetaInteresNombre = data.equipoFabricadoInteresNombre;
        data.cantidadRecetaInteres = data.cantidadEquipoInteres;
        data.modeloRecetaInteres = data.modeloEquipoInteres;
        data.colorRecetaInteres = data.colorEquipoInteres;
        data.medidaRecetaInteres = data.medidaEquipoInteres;
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

      navigate('/leads/table');
    } catch (err) {
      console.error('Error al guardar lead:', err);
      setError('Error al guardar el lead. Por favor, intente nuevamente.');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads/table')}
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
                  error={Boolean(errors.telefono)}
                  helperText={errors.telefono}
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
                  options={recetas}
                  getOptionLabel={(option) => {
                    const parts = [option.nombre, option.tipoEquipo];
                    if (option.modelo) parts.push(`Modelo: ${option.modelo}`);
                    if (option.medida) parts.push(option.medida);
                    if (option.color) parts.push(option.color);
                    return parts.join(' - ');
                  }}
                  value={recetas.find(r => r.id === formData.recetaInteresId) || null}
                  onChange={(_, newValue) => {
                    setFormData({ 
                      ...formData, 
                      recetaInteresId: newValue?.id,
                      recetaInteresNombre: newValue?.nombre,
                      // Pre-cargar valores de la receta, pero permitir edición
                      modeloRecetaInteres: newValue?.modelo || '',
                      colorRecetaInteres: newValue?.color || '',
                      medidaRecetaInteres: newValue?.medida || '',
                      // Mapear a campos del backend
                      equipoFabricadoInteresId: newValue?.id,
                      equipoFabricadoInteresNombre: newValue?.nombre,
                      modeloEquipoInteres: newValue?.modelo || '',
                      colorEquipoInteres: newValue?.color || '',
                      medidaEquipoInteres: newValue?.medida || ''
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
                      cantidadEquipoInteres: cantidad // Mapear al backend
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
                      modeloEquipoInteres: e.target.value // Mapear al backend
                    });
                  }}
                  disabled={!formData.recetaInteresId}
                  placeholder="Ej: HI-2024-001"
                  helperText="Puede personalizar el modelo"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth disabled={!formData.recetaInteresId}>
                  <InputLabel>Color</InputLabel>
                  <Select
                    value={formData.colorRecetaInteres || ''}
                    label="Color"
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        colorRecetaInteres: e.target.value as ColorEquipo,
                        colorEquipoInteres: e.target.value // Mapear al backend
                      });
                    }}
                  >
                    <MenuItem value="">Ninguno</MenuItem>
                    {COLORES_EQUIPO.map((color) => (
                      <MenuItem key={color} value={color}>
                        {color.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth disabled={!formData.recetaInteresId}>
                  <InputLabel>Medida</InputLabel>
                  <Select
                    value={formData.medidaRecetaInteres || ''}
                    label="Medida"
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        medidaRecetaInteres: e.target.value as MedidaEquipo,
                        medidaEquipoInteres: e.target.value // Mapear al backend
                      });
                    }}
                  >
                    <MenuItem value="">Ninguna</MenuItem>
                    {MEDIDAS_EQUIPO.map((medida) => (
                      <MenuItem key={medida} value={medida}>
                        {medida}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    onClick={() => navigate('/leads/table')}
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
