import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Paper,
  List,
  ListItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  SwapHoriz as ConvertIcon,
  Phone as PhoneIcon,
  ContentCopy as CopyIcon,
  Notifications as NotificationsIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { leadApi } from '../../api/services/leadApi';
import { EstadoLeadEnum, PROVINCIA_LABELS } from '../../types/lead.types';
import type { LeadDTO } from '../../types/lead.types';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { CanalBadge } from '../../components/leads/CanalBadge';

export const LeadDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadDTO | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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
    } catch (err) {
      console.error('Error al cargar lead:', err);
      setError('Error al cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPhone = () => {
    if (lead?.telefono) {
      navigator.clipboard.writeText(lead.telefono);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const canConvert = (leadData: LeadDTO): boolean => {
    return leadData.estadoLead !== EstadoLeadEnum.CONVERTIDO && 
           leadData.estadoLead !== EstadoLeadEnum.DESCARTADO;
  };

  const canEdit = (leadData: LeadDTO): boolean => {
    return leadData.estadoLead !== EstadoLeadEnum.CONVERTIDO;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lead) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Lead no encontrado'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mt: 2 }}
        >
          Volver a Leads
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {lead.nombre}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <LeadStatusBadge status={lead.estadoLead} size="medium" />
              {lead.dias !== null && lead.dias !== undefined && (
                <Chip 
                  label={`${lead.dias} días desde primer contacto`} 
                  size="small" 
                  color="default"
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {canEdit(lead) && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/leads/${lead.id}/editar`)}
              >
                Editar
              </Button>
            )}
            {canConvert(lead) && (
              <Button
                variant="contained"
                color="success"
                startIcon={<ConvertIcon />}
                onClick={() => navigate(`/leads/${lead.id}/convertir`)}
              >
                Convertir a Cliente
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {lead.estadoLead === EstadoLeadEnum.CONVERTIDO && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Este lead fue convertido a cliente
          {lead.fechaConversion && ` el ${lead.fechaConversion}`}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Columna Izquierda - Información de Contacto */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📞 Información de Contacto
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Teléfono
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon color="primary" />
                  <Typography variant="h6">{lead.telefono}</Typography>
                  <IconButton size="small" onClick={handleCopyPhone}>
                    <CopyIcon fontSize="small" />
                  </IconButton>
                  {copySuccess && (
                    <Typography variant="caption" color="success.main">
                      ¡Copiado!
                    </Typography>
                  )}
                </Box>
              </Box>

              {lead.provincia && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provincia
                  </Typography>
                  <Typography variant="body1">{PROVINCIA_LABELS[lead.provincia]}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Canal de Origen
                </Typography>
                <CanalBadge canal={lead.canal} size="medium" />
              </Box>

              {lead.fechaPrimerContacto && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Fecha Primer Contacto
                  </Typography>
                  <Typography variant="body1">{lead.fechaPrimerContacto}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Producto de Interés */}
          {lead.equipoInteresadoNombre && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🛒 Producto de Interés
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" fontWeight="bold">
                  {lead.equipoInteresadoNombre}
                </Typography>
                {lead.equipoInteresadoId && (
                  <Typography variant="body2" color="text.secondary">
                    ID: {lead.equipoInteresadoId}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Columna Derecha - Timeline y Recordatorios */}
        <Grid item xs={12} md={6}>
          {/* Recordatorios */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Recordatorios
              </Typography>
              <Divider sx={{ my: 2 }} />

              {!lead.recordatorio1Fecha && !lead.recordatorio2Fecha ? (
                <Typography variant="body2" color="text.secondary">
                  No hay recordatorios programados
                </Typography>
              ) : (
                <List>
                  {lead.recordatorio1Fecha && (
                    <ListItem>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          width: '100%',
                          bgcolor: lead.recordatorio1Enviado ? 'success.light' : 'warning.light'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <NotificationsIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            Recordatorio 1
                          </Typography>
                          <Chip 
                            label={lead.recordatorio1Enviado ? 'Enviado' : 'Pendiente'}
                            size="small"
                            color={lead.recordatorio1Enviado ? 'success' : 'warning'}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon fontSize="small" />
                          <Typography variant="body2">
                            {lead.recordatorio1Fecha}
                          </Typography>
                        </Box>
                      </Paper>
                    </ListItem>
                  )}

                  {lead.recordatorio2Fecha && (
                    <ListItem>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          width: '100%',
                          bgcolor: lead.recordatorio2Enviado ? 'success.light' : 'warning.light'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <NotificationsIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            Recordatorio 2
                          </Typography>
                          <Chip 
                            label={lead.recordatorio2Enviado ? 'Enviado' : 'Pendiente'}
                            size="small"
                            color={lead.recordatorio2Enviado ? 'success' : 'warning'}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EventIcon fontSize="small" />
                          <Typography variant="body2">
                            {lead.recordatorio2Fecha}
                          </Typography>
                        </Box>
                      </Paper>
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Timeline de Estados */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Estado Actual
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estado del Lead
                  </Typography>
                  <LeadStatusBadge status={lead.estadoLead} size="medium" />
                </Box>

                {lead.fechaConversion && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha de Conversión
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {lead.fechaConversion}
                    </Typography>
                  </Box>
                )}

                {/* Información adicional */}
                <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    💡 Próximos Pasos Sugeridos
                  </Typography>
                  {lead.estadoLead === EstadoLeadEnum.PRIMER_CONTACTO && (
                    <Typography variant="body2">
                      • Contactar al lead para conocer sus necesidades<br />
                      • Actualizar estado a "Mostró Interés" si responde positivamente
                    </Typography>
                  )}
                  {lead.estadoLead === EstadoLeadEnum.MOSTRO_INTERES && (
                    <Typography variant="body2">
                      • Enviar información detallada del producto<br />
                      • Programar seguimiento<br />
                      • Actualizar a "Cliente Potencial" si continúa interesado
                    </Typography>
                  )}
                  {lead.estadoLead === EstadoLeadEnum.CLIENTE_POTENCIAL && (
                    <Typography variant="body2">
                      • Calificar el lead según presupuesto y necesidades<br />
                      • Enviar propuesta comercial<br />
                      • Actualizar a "Cliente Potencial Calificado"
                    </Typography>
                  )}
                  {lead.estadoLead === EstadoLeadEnum.CLIENTE_POTENCIAL_CALIFICADO && (
                    <Typography variant="body2">
                      • Negociar condiciones de venta<br />
                      • Preparar documentación<br />
                      • Convertir a Cliente cuando confirme la compra
                    </Typography>
                  )}
                  {lead.estadoLead === EstadoLeadEnum.VENTA && (
                    <Typography variant="body2">
                      • Cerrar la venta<br />
                      • Convertir a Cliente para registrar en el sistema
                    </Typography>
                  )}
                  {lead.estadoLead === EstadoLeadEnum.DESCARTADO && (
                    <Typography variant="body2" color="error.main">
                      Lead descartado. No requiere seguimiento.
                    </Typography>
                  )}
                  {lead.estadoLead === EstadoLeadEnum.CONVERTIDO && (
                    <Typography variant="body2" color="success.main">
                      ✅ Lead convertido exitosamente a Cliente
                    </Typography>
                  )}
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
