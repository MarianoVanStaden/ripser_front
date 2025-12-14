import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  SwapHoriz as ConvertIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import { productApi } from '../../api/services';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import { PROVINCIA_LABELS } from '../../types/lead.types';
import type { Producto } from '../../types';
import type {
  LeadDTO,
  ConversionLeadRequest,
  ConversionLeadResponse,
  ValidationErrors
} from '../../types/lead.types';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { CanalBadge } from '../../components/leads/CanalBadge';

export const ConvertLeadPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ConversionLeadResponse | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [lead, setLead] = useState<LeadDTO | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<{type: 'producto' | 'receta', id: number, nombre: string, precio: number} | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{type: 'producto' | 'receta', id: number, nombre: string, precio: number, cantidad: number}>>([]);
  const [cantidadActual, setCantidadActual] = useState<number>(1);

  const [conversionData, setConversionData] = useState<ConversionLeadRequest>({
    productoCompradoId: undefined,
    montoConversion: undefined,
    emailCliente: '',
    direccionCliente: '',
    ciudadCliente: ''
  });

  useEffect(() => {
    if (id) {
      loadLead(parseInt(id));
    }
  }, [id]);

  const loadLead = async (leadId: number) => {
    try {
      setLoading(true);
      const [leadData, productosData, recetasData] = await Promise.all([
        leadApi.getById(leadId),
        productApi.getAll().catch(() => []),
        recetaFabricacionApi.findAllActive().catch(() => [])
      ]);
      
      setLead(leadData);
      setProductos(productosData);
      setRecetas(recetasData);

      // Pre-seleccionar producto/receta si está disponible
      if (leadData.recetaInteresId || leadData.equipoFabricadoInteresId) {
        // Priorizar equipos/recetas
        try {
          const recetaId = leadData.recetaInteresId || leadData.equipoFabricadoInteresId;
          const recetaCompleta = await recetaFabricacionApi.findById(recetaId!);
          const precio = recetaCompleta.precioVenta || 0;
          const cantidad = leadData.cantidadRecetaInteres || leadData.cantidadEquipoInteres || 1;
          const selected = { type: 'receta' as const, id: recetaCompleta.id, nombre: recetaCompleta.nombre, precio: precio };
          setSelectedProduct(selected);
          setCantidadActual(cantidad);
          
          // Agregar al array de items seleccionados
          setSelectedItems([{ ...selected, cantidad }]);
          
          // Calcular monto automáticamente
          const monto = precio * cantidad;
          setConversionData((prev) => ({
            ...prev,
            productoCompradoId: recetaCompleta.id,
            montoConversion: monto
          }));
        } catch (err) {
          console.error('Error cargando receta completa:', err);
        }
      } else if (leadData.productoInteresId) {
        const producto = productosData.find(p => p.id === leadData.productoInteresId);
        if (producto) {
          const cantidad = leadData.cantidadProductoInteres || 1;
          const precio = producto.precio || 0;
          const selected = { type: 'producto' as const, id: producto.id, nombre: producto.nombre, precio: precio };
          setSelectedProduct(selected);
          setCantidadActual(cantidad);
          
          // Agregar al array de items seleccionados
          setSelectedItems([{ ...selected, cantidad }]);
          
          // Calcular monto automáticamente
          const monto = precio * cantidad;
          setConversionData((prev) => ({
            ...prev,
            productoCompradoId: producto.id,
            montoConversion: monto
          }));
        }
      }
    } catch (err) {
      console.error('Error al cargar lead:', err);
      setError('Error al cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (conversionData.emailCliente && !validateEmail(conversionData.emailCliente)) {
      newErrors.emailCliente = 'Email inválido';
    }

    if (conversionData.montoConversion && conversionData.montoConversion <= 0) {
      newErrors.montoConversion = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    try {
      setConverting(true);
      setError(null);

      // Si productoCompradoId es undefined o null, eliminarlo del payload
      const payload = {
        ...conversionData,
        productoCompradoId: conversionData.productoCompradoId || undefined
      };

      const result = await leadApi.convertir(parseInt(id), payload);
      setSuccess(result);
    } catch (err: any) {
      console.error('Error al convertir lead:', err);
      
      // Manejar errores específicos del backend
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'El lead no puede ser convertido');
      } else if (err.response?.status === 404) {
        const errorMsg = err.response.data?.message || 'Recurso no encontrado';
        
        // Si el error es por producto no encontrado, dar un mensaje más claro
        if (errorMsg.includes('Producto no encontrado')) {
          setError(
            'El producto asociado al lead ya no existe en el sistema. ' +
            'Por favor, deje el campo "Producto Comprado" vacío o seleccione otro producto.'
          );
          // Limpiar el productoCompradoId
          setConversionData(prev => ({ ...prev, productoCompradoId: undefined }));
        } else {
          setError(errorMsg);
        }
      } else {
        setError('Error al convertir el lead. Por favor, intente nuevamente.');
      }
    } finally {
      setConverting(false);
    }
  };

  const handleChange = (field: keyof ConversionLeadRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setConversionData({
      ...conversionData,
      [field]: field === 'productoCompradoId' || field === 'montoConversion' 
        ? (value === '' ? undefined : Number(value))
        : value
    });

    // Limpiar error del campo
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Lead no encontrado</Alert>
      </Box>
    );
  }

  // Si la conversión fue exitosa, mostrar pantalla de éxito
  if (success) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                ¡Conversión Exitosa!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {success.mensaje}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2} sx={{ textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    ID del Cliente:
                  </Typography>
                  <Typography variant="h6">{success.clienteId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Conversión:
                  </Typography>
                  <Typography variant="h6">{success.fechaConversion}</Typography>
                </Grid>
                {success.productoComprado && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Producto:
                    </Typography>
                    <Typography variant="h6">{success.productoComprado}</Typography>
                  </Grid>
                )}
                {success.montoConversion && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Monto:
                    </Typography>
                    <Typography variant="h6">
                      $ {success.montoConversion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
                <Typography variant="body2">
                  <strong>✅ Actualización automática:</strong> Todos los presupuestos asociados a este lead 
                  se han actualizado automáticamente al nuevo cliente.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/ventas/notas-pedido')}
                >
                  Ir a Notas de Pedido
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/clientes/detalle/${success.clienteId}`)}
                >
                  Ver Perfil del Cliente
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/leads/table')}
                >
                  Volver a Leads
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
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
          🔄 Convertir Lead a Cliente
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Info del Lead */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información del Lead
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Nombre:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {lead.nombre}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Teléfono:
                </Typography>
                <Typography variant="body1">{lead.telefono}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estado:
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <LeadStatusBadge status={lead.estadoLead} size="medium" />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Canal:
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <CanalBadge canal={lead.canal} size="medium" />
                </Box>
              </Box>

              {lead.provincia && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Provincia:
                  </Typography>
                  <Typography variant="body1">{PROVINCIA_LABELS[lead.provincia]}</Typography>
                </Box>
              )}

              {(lead.productoInteresNombre || lead.equipoFabricadoInteresNombre || lead.equipoInteresadoNombre) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Interesado en:
                  </Typography>
                  {lead.productoInteresNombre && (
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        📦 Producto: {lead.productoInteresNombre}
                      </Typography>
                      {lead.cantidadProductoInteres && (
                        <Typography variant="body2" color="primary.main">
                          Cantidad: {lead.cantidadProductoInteres}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {(lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre) && (
                    <Box sx={{ ml: 2, mt: lead.productoInteresNombre ? 1 : 0 }}>
                      <Typography variant="body1" fontWeight="bold">
                        🔧 Equipo a Fabricar: {lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre}
                      </Typography>
                      {(lead.cantidadRecetaInteres || lead.cantidadEquipoInteres) && (
                        <Typography variant="body2" color="primary.main">
                          Cantidad: {lead.cantidadRecetaInteres || lead.cantidadEquipoInteres}
                        </Typography>
                      )}
                      {((lead.modeloRecetaInteres || lead.modeloEquipoInteres) || (lead.colorRecetaInteres || lead.colorEquipoInteres) || (lead.medidaRecetaInteres || lead.medidaEquipoInteres)) && (
                        <Typography variant="body2" color="text.secondary">
                          Personalizado: {[
                            (lead.modeloRecetaInteres || lead.modeloEquipoInteres) && `Modelo: ${lead.modeloRecetaInteres || lead.modeloEquipoInteres}`,
                            (lead.colorRecetaInteres || lead.colorEquipoInteres) && `Color: ${lead.colorRecetaInteres || lead.colorEquipoInteres}`,
                            (lead.medidaRecetaInteres || lead.medidaEquipoInteres) && `Medida: ${lead.medidaRecetaInteres || lead.medidaEquipoInteres}`
                          ].filter(Boolean).join(' • ')}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {!lead.productoInteresNombre && !lead.equipoFabricadoInteresNombre && lead.equipoInteresadoNombre && (
                    <Typography variant="body1" sx={{ ml: 2 }}>
                      {lead.equipoInteresadoNombre}
                    </Typography>
                  )}
                </Box>
              )}

              {lead.dias !== null && lead.dias !== undefined && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Días transcurridos:
                  </Typography>
                  <Chip label={`${lead.dias} días`} color="primary" size="small" />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Formulario de Conversión */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Datos de Conversión
              </Typography>
              <Divider sx={{ my: 2 }} />

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email del Cliente"
                      value={conversionData.emailCliente}
                      onChange={handleChange('emailCliente')}
                      error={Boolean(errors.emailCliente)}
                      helperText={errors.emailCliente || 'Email para el nuevo cliente'}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Dirección"
                      value={conversionData.direccionCliente}
                      onChange={handleChange('direccionCliente')}
                      helperText="Dirección del cliente"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Ciudad"
                      value={conversionData.ciudadCliente}
                      onChange={handleChange('ciudadCliente')}
                      helperText="Ciudad del cliente"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      options={[
                        ...recetas.map(r => ({ type: 'receta' as const, id: r.id, nombre: `🔧 ${r.nombre}`, precio: r.precioVenta || 0 })),
                        ...productos.map(p => ({ type: 'producto' as const, id: p.id, nombre: `📦 ${p.nombre}`, precio: p.precio || 0 }))
                      ]}
                      getOptionLabel={(option) => `${option.nombre} - $${(option.precio || 0).toLocaleString('es-AR')}`}
                      value={selectedProduct}
                      isOptionEqualToValue={(option, value) => option.id === value.id && option.type === value.type}
                      onChange={(_, newValue) => {
                        setSelectedProduct(newValue);
                        if (newValue) {
                          // Mantener cantidad actual
                          setCantidadActual(1);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Seleccionar Producto/Equipo"
                          helperText="Seleccione el producto o equipo que compró el cliente. Los equipos aparecen con 🔧 y productos con 📦."
                        />
                      )}
                    />
                  </Grid>

                  {selectedProduct && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Cantidad"
                          value={cantidadActual}
                          onChange={(e) => {
                            const newCantidad = Math.max(1, Number(e.target.value));
                            setCantidadActual(newCantidad);
                          }}
                          inputProps={{ min: 1 }}
                          helperText="Cantidad de unidades"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          sx={{ height: '56px' }}
                          onClick={() => {
                            if (selectedProduct) {
                              const newItem = {
                                ...selectedProduct,
                                cantidad: cantidadActual,
                                precio: selectedProduct.precio || 0
                              };
                              
                              // Verificar si ya existe
                              const existingIndex = selectedItems.findIndex(
                                item => item.id === selectedProduct.id && item.type === selectedProduct.type
                              );
                              
                              if (existingIndex >= 0) {
                                // Actualizar cantidad del existente
                                const updated = [...selectedItems];
                                updated[existingIndex].cantidad += cantidadActual;
                                setSelectedItems(updated);
                              } else {
                                // Agregar nuevo
                                setSelectedItems([...selectedItems, newItem]);
                              }
                              
                              // Calcular monto total
                              const totalMonto = [...selectedItems, newItem].reduce(
                                (sum, item) => sum + (item.precio * item.cantidad),
                                0
                              );
                              
                              setConversionData(prev => ({
                                ...prev,
                                montoConversion: totalMonto
                              }));
                              
                              // Reset
                              setSelectedProduct(null);
                              setCantidadActual(1);
                            }
                          }}
                        >
                          + Agregar
                        </Button>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Resumen de Conversión:
                      </Typography>
                      {selectedItems.length > 0 ? (
                        <>
                          {selectedItems.map((item, index) => (
                            <Box 
                              key={`${item.type}-${item.id}-${index}`} 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                mb: 1,
                                p: 1,
                                bgcolor: 'white',
                                borderRadius: 1
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2">
                                  {item.type === 'receta' ? '🔧' : '📦'} <strong>{item.nombre.replace('🔧 ', '').replace('📦 ', '')}</strong>
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })} x {item.cantidad} unidades
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  ${(item.precio * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </Typography>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    const updated = selectedItems.filter((_, i) => i !== index);
                                    setSelectedItems(updated);
                                    const totalMonto = updated.reduce(
                                      (sum, it) => sum + (it.precio * it.cantidad),
                                      0
                                    );
                                    setConversionData(prev => ({
                                      ...prev,
                                      montoConversion: totalMonto || undefined
                                    }));
                                  }}
                                >
                                  ✕
                                </Button>
                              </Box>
                            </Box>
                          ))}
                          <Typography variant="h6" color="primary" sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            Total: ${(conversionData.montoConversion || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Seleccione productos o equipos para agregar al pedido.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="info">
                      Al convertir este lead, se creará un nuevo cliente con la información proporcionada.
                      El lead quedará marcado como "Convertido" y ya no podrá ser modificado.
                    </Alert>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/leads/table')}
                        disabled={converting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        startIcon={converting ? <CircularProgress size={20} /> : <ConvertIcon />}
                        disabled={converting}
                      >
                        {converting ? 'Convirtiendo...' : 'Convertir a Cliente'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
