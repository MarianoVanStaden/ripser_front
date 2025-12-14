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
import type { LeadDTO, InteraccionLeadDTO } from '../../types/lead.types';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { CanalBadge } from '../../components/leads/CanalBadge';
import { ProximoRecordatorio } from '../../components/leads/ProximoRecordatorio';
import { InteraccionesTimeline } from '../../components/leads/InteraccionesTimeline';

export const LeadDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadDTO | null>(null);
  const [interacciones, setInteracciones] = useState<InteraccionLeadDTO[]>([]);
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
      
      // Cargar recordatorios del lead
      try {
        const recordatorios = await leadApi.getRecordatorios(leadId);
        data.recordatorios = recordatorios;
      } catch (err) {
        console.error('Error al cargar recordatorios:', err);
        data.recordatorios = [];
      }

      // Cargar interacciones del lead
      try {
        const interaccionesData = await leadApi.getInteracciones(leadId);
        setInteracciones(interaccionesData);
      } catch (err) {
        console.error('Error al cargar interacciones:', err);
        setInteracciones([]);
      }
      
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

  const getRecordatorioColor = (fechaRecordatorio: string, enviado: boolean) => {
    if (enviado) {
      return {
        bgcolor: '#e8f5e9', // Verde muy claro
        borderColor: '#4caf50'
      };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaRecordatorio);
    fecha.setHours(0, 0, 0, 0);
    
    const diferenciaDias = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) {
      // Vencido - rojo claro
      return {
        bgcolor: '#ffebee',
        borderColor: '#ef5350'
      };
    } else if (diferenciaDias === 0) {
      // Hoy - naranja muy claro
      return {
        bgcolor: '#fff3e0',
        borderColor: '#ff9800'
      };
    } else if (diferenciaDias === 1) {
      // Mañana - amarillo claro
      return {
        bgcolor: '#fffde7',
        borderColor: '#fdd835'
      };
    } else if (diferenciaDias <= 3) {
      // 2-3 días - amarillo verdoso claro
      return {
        bgcolor: '#f9fbe7',
        borderColor: '#c0ca33'
      };
    } else if (diferenciaDias <= 7) {
      // 4-7 días - verde amarillento claro
      return {
        bgcolor: '#f1f8e9',
        borderColor: '#9ccc65'
      };
    } else {
      // Más de 7 días - verde claro
      return {
        bgcolor: '#e8f5e9',
        borderColor: '#66bb6a'
      };
    }
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
          onClick={() => navigate('/leads/table')}
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
          onClick={() => navigate('/leads/table')}
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

          {/* Productos de Interés */}
          {(lead.productoInteresNombre || lead.equipoFabricadoInteresNombre || lead.equipoInteresadoNombre) && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🛒 Productos de Interés
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {lead.productoInteresNombre && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      📦 Producto:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {lead.productoInteresNombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                      {lead.productoInteresId && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {lead.productoInteresId}
                        </Typography>
                      )}
                      {lead.cantidadProductoInteres && (
                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                          Cantidad: {lead.cantidadProductoInteres}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}

                {(lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre) && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      🔧 Equipo a Fabricar:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {lead.recetaInteresNombre || lead.equipoFabricadoInteresNombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                      {(lead.recetaInteresId || lead.equipoFabricadoInteresId) && (
                        <Typography variant="caption" color="text.secondary">
                          Receta ID: {lead.recetaInteresId || lead.equipoFabricadoInteresId}
                        </Typography>
                      )}
                      {(lead.cantidadRecetaInteres || lead.cantidadEquipoInteres) && (
                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                          Cantidad: {lead.cantidadRecetaInteres || lead.cantidadEquipoInteres}
                        </Typography>
                      )}
                    </Box>
                    {((lead.modeloRecetaInteres || lead.modeloEquipoInteres) || (lead.colorRecetaInteres || lead.colorEquipoInteres) || (lead.medidaRecetaInteres || lead.medidaEquipoInteres)) && (
                      <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                          ⚙️ Personalización:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                          {(lead.modeloRecetaInteres || lead.modeloEquipoInteres) && (
                            <Typography variant="body2">
                              Modelo: <strong>{lead.modeloRecetaInteres || lead.modeloEquipoInteres}</strong>
                            </Typography>
                          )}
                          {(lead.colorRecetaInteres || lead.colorEquipoInteres) && (
                            <Typography variant="body2">
                              Color: <strong>{lead.colorRecetaInteres || lead.colorEquipoInteres}</strong>
                            </Typography>
                          )}
                          {(lead.medidaRecetaInteres || lead.medidaEquipoInteres) && (
                            <Typography variant="body2">
                              Medida: <strong>{lead.medidaRecetaInteres || lead.medidaEquipoInteres}</strong>
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Legacy field support */}
                {!lead.productoInteresNombre && !lead.equipoFabricadoInteresNombre && lead.equipoInteresadoNombre && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Equipo Interesado (Legacy):
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {lead.equipoInteresadoNombre}
                    </Typography>
                    {lead.equipoInteresadoId && (
                      <Typography variant="caption" color="text.secondary">
                        ID: {lead.equipoInteresadoId}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Columna Derecha - Timeline y Recordatorios */}
        <Grid item xs={12} md={6}>
          {/* Próximo Recordatorio Pendiente */}
          {lead.recordatorios && lead.recordatorios.length > 0 && (() => {
            // Filtrar solo recordatorios pendientes (no enviados)
            const recordatoriosPendientes = lead.recordatorios
              .filter(r => !r.enviado)
              .sort((a, b) => new Date(a.fechaRecordatorio).getTime() - new Date(b.fechaRecordatorio).getTime());
            
            const proximoRecordatorio = recordatoriosPendientes[0] || null;
            
            if (proximoRecordatorio) {
              return (
                <Box sx={{ mb: 3 }}>
                  <ProximoRecordatorio 
                    leadId={lead.id!} 
                    recordatorio={proximoRecordatorio}
                    onRecordatorioEnviado={() => {
                      if (id) loadLead(parseInt(id));
                    }}
                  />
                </Box>
              );
            }
            return null;
          })()}

          {/* Recordatorios */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Todos los Recordatorios
              </Typography>
              <Divider sx={{ my: 2 }} />

              {(!lead.recordatorios || lead.recordatorios.length === 0) ? (
                <Typography variant="body2" color="text.secondary">
                  No hay recordatorios programados
                </Typography>
              ) : (
                <List>
                  {/* Mostrar recordatorios de la nueva estructura */}
                  {lead.recordatorios?.map((recordatorio) => {
                    const colors = getRecordatorioColor(recordatorio.fechaRecordatorio, recordatorio.enviado || false);
                    return (
                    <ListItem key={recordatorio.id}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          width: '100%',
                          bgcolor: colors.bgcolor,
                          borderLeft: 4,
                          borderColor: colors.borderColor
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                          <NotificationsIcon fontSize="small" />
                          <Typography variant="body2" fontWeight="bold">
                            {recordatorio.tipo?.replace(/_/g, ' ')}
                          </Typography>
                          <Chip 
                            label={recordatorio.enviado ? 'Enviado' : 'Pendiente'}
                            size="small"
                            color={recordatorio.enviado ? 'success' : 'warning'}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <EventIcon fontSize="small" />
                          <Typography variant="body2">
                            {recordatorio.fechaRecordatorio}
                          </Typography>
                        </Box>
                        {recordatorio.mensaje && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                            {recordatorio.mensaje}
                          </Typography>
                        )}
                        {recordatorio.fechaEnvio && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Enviado: {new Date(recordatorio.fechaEnvio).toLocaleString('es-AR')}
                          </Typography>
                        )}
                      </Paper>
                    </ListItem>
                  )})}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Interacciones Timeline */}
          <Box sx={{ mt: 3 }}>
            <InteraccionesTimeline
              leadId={lead.id!}
              interacciones={interacciones}
              onInteraccionesChange={() => {
                if (id) loadLead(parseInt(id));
              }}
            />
          </Box>

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
