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
  Chip
} from '@mui/material';
import {
  SwapHoriz as ConvertIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import { PROVINCIA_LABELS } from '../../types/lead.types';
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
      const data = await leadApi.getById(leadId);
      setLead(data);

      // Pre-cargar algunos datos si están disponibles
      setConversionData((prev) => ({
        ...prev,
        productoCompradoId: data.equipoInteresadoId
      }));
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

      const result = await leadApi.convertir(parseInt(id), conversionData);
      setSuccess(result);
    } catch (err: any) {
      console.error('Error al convertir lead:', err);
      
      // Manejar errores específicos del backend
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'El lead no puede ser convertido');
      } else if (err.response?.status === 404) {
        setError('Lead no encontrado');
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

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/clientes/${success.clienteId}`)}
                >
                  Ver Perfil del Cliente
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/leads')}
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
          onClick={() => navigate('/leads')}
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

              {lead.equipoInteresadoNombre && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Interesado en:
                  </Typography>
                  <Typography variant="body1">{lead.equipoInteresadoNombre}</Typography>
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

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="ID Producto Comprado"
                      value={conversionData.productoCompradoId || ''}
                      onChange={handleChange('productoCompradoId')}
                      helperText="ID del producto que compró"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Monto de la Venta"
                      value={conversionData.montoConversion || ''}
                      onChange={handleChange('montoConversion')}
                      error={Boolean(errors.montoConversion)}
                      helperText={errors.montoConversion || 'Monto total de la venta'}
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                      }}
                    />
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
                        onClick={() => navigate('/leads')}
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
