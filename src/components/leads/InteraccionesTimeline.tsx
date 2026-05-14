import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  List,
  ListItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Group as ReunionIcon,
  DirectionsCar as VisitaIcon,
  Notes as OtroIcon,
  AccessTime as AccessTimeIcon,
  StickyNote2 as NotaIcon,
  SwapHoriz as CambioEstadoIcon
} from '@mui/icons-material';
import type {
  InteraccionLeadDTO,
  TipoInteraccionEnum,
  ResultadoInteraccionEnum,
  LeadDTO,
} from '../../types/lead.types';
import {
  TIPO_INTERACCION_LABELS,
  RESULTADO_INTERACCION_LABELS,
  RESULTADO_INTERACCION_COLORS,
  TipoInteraccionEnum as TipoInteraccion,
} from '../../types/lead.types';
import { leadApi } from '../../api/services/leadApi';
import ConfirmDialog from '../common/ConfirmDialog';

const mapLeadPrioridadToRecordatorio = (p?: string) =>
  p === 'HOT' ? 'ALTA' as const : p === 'WARM' ? 'MEDIA' as const : 'BAJA' as const;

const mapTipoInteraccionToRecordatorio = (tipo: string) =>
  tipo === 'LLAMADA' ? 'LLAMADA' as const :
  tipo === 'EMAIL' ? 'EMAIL' as const :
  tipo === 'WHATSAPP' ? 'WHATSAPP' as const :
  'TAREA' as const;

interface InteraccionesTimelineProps {
  leadId: number;
  lead: LeadDTO;
  interacciones: InteraccionLeadDTO[];
  onInteraccionesChange: () => void;
}

const TIPO_ICONS: Record<TipoInteraccionEnum, React.ReactElement> = {
  LLAMADA: <PhoneIcon />,
  EMAIL: <EmailIcon />,
  WHATSAPP: <WhatsAppIcon />,
  REUNION: <ReunionIcon />,
  VISITA: <VisitaIcon />,
  OTRO: <OtroIcon />,
  NOTA: <NotaIcon />,
  CAMBIO_ESTADO: <CambioEstadoIcon />
};

const TIPO_COLORS: Record<TipoInteraccionEnum, 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'> = {
  LLAMADA: 'primary',
  EMAIL: 'info',
  WHATSAPP: 'success',
  REUNION: 'secondary',
  VISITA: 'warning',
  OTRO: 'info',
  NOTA: 'secondary',
  CAMBIO_ESTADO: 'warning'
};

export const InteraccionesTimeline = ({ leadId, lead, interacciones, onInteraccionesChange }: InteraccionesTimelineProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInteraccion, setEditingInteraccion] = useState<InteraccionLeadDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [interaccionToDelete, setInteraccionToDelete] = useState<InteraccionLeadDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<InteraccionLeadDTO>>({
    tipo: TipoInteraccion.LLAMADA,
    fecha: new Date().toISOString().slice(0, 16),
    descripcion: '',
    resultado: undefined,
    duracionMinutos: undefined,
    proximaAccion: undefined,
    notasProximaAccion: ''
  });

  const handleOpenDialog = (interaccion?: InteraccionLeadDTO) => {
    if (interaccion) {
      setEditingInteraccion(interaccion);
      setFormData({
        ...interaccion,
        fecha: interaccion.fecha.slice(0, 16),
        // Convertir proximaAccion a formato YYYY-MM-DD si existe
        proximaAccion: interaccion.proximaAccion 
          ? (interaccion.proximaAccion.includes('T') 
              ? interaccion.proximaAccion.split('T')[0] 
              : interaccion.proximaAccion)
          : undefined
      });
    } else {
      setEditingInteraccion(null);
      setFormData({
        tipo: TipoInteraccion.LLAMADA,
        fecha: new Date().toISOString().slice(0, 16),
        descripcion: '',
        resultado: undefined,
        duracionMinutos: undefined,
        proximaAccion: undefined,
        notasProximaAccion: ''
      });
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInteraccion(null);
    setError(null);
  };

  const proximaAccionRequerida = formData.resultado === 'REAGENDAR';

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const dataToSend: any = {
        tipo: formData.tipo,
        fecha: new Date(formData.fecha!).toISOString(),
        descripcion: formData.descripcion,
        resultado: formData.resultado || null,
        duracionMinutos: formData.duracionMinutos || null,
        proximaAccion: formData.proximaAccion || null,
        notasProximaAccion: formData.notasProximaAccion || null
      };

      if (editingInteraccion?.id) {
        await leadApi.updateInteraccion(leadId, editingInteraccion.id, dataToSend);
      } else {
        await leadApi.createInteraccion(leadId, dataToSend);
        if (formData.proximaAccion) {
          try {
            await leadApi.createRecordatorio(leadId, {
              fechaRecordatorio: formData.proximaAccion,
              tipo: mapTipoInteraccionToRecordatorio(formData.tipo!),
              mensaje: formData.notasProximaAccion || `Próxima acción: ${formData.tipo}`,
              prioridad: mapLeadPrioridadToRecordatorio(lead.prioridad),
            });
          } catch (recErr) {
            console.warn('No se pudo crear el recordatorio automático:', recErr);
          }
        }
      }

      handleCloseDialog();
      onInteraccionesChange();
    } catch (err: any) {
      console.error('Error al guardar interacción:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al guardar la interacción');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (interaccionId: number) => {
    const target = interacciones.find((i) => i.id === interaccionId);
    if (target) {
      setDeleteError(null);
      setInteraccionToDelete(target);
    }
  };

  const handleConfirmDelete = async () => {
    if (!interaccionToDelete || interaccionToDelete.id == null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await leadApi.deleteInteraccion(leadId, interaccionToDelete.id);
      onInteraccionesChange();
      setInteraccionToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar interacción:', err);
      setDeleteError(err.response?.data?.message || 'Error al eliminar la interacción');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatearFecha = (fecha: string): string => {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearHora = (fecha: string): string => {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const interaccionesOrdenadas = [...interacciones].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            💬 Interacciones
            <Chip label={interacciones.length} size="small" color="primary" />
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Agregar
          </Button>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {interacciones.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hay interacciones registradas
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Comienza a registrar llamadas, reuniones y comunicaciones con este lead
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {interaccionesOrdenadas.map((interaccion, index) => (
              <ListItem
                key={interaccion.id}
                sx={{
                  display: 'block',
                  px: 0,
                  pb: 3,
                  borderLeft: index < interaccionesOrdenadas.length - 1 ? 2 : 0,
                  borderColor: 'divider',
                  ml: 3,
                  position: 'relative'
                }}
              >
                {/* Timeline Dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: -15,
                    top: 8,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: `${TIPO_COLORS[interaccion.tipo]}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.9rem',
                    boxShadow: 2
                  }}
                >
                  {TIPO_ICONS[interaccion.tipo]}
                </Box>

                <Card variant="outlined" sx={{ bgcolor: 'background.default', ml: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header con fecha y acciones */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" fontWeight="bold">
                          {formatearFecha(interaccion.fecha)} • {formatearHora(interaccion.fecha)}
                        </Typography>
                        {interaccion.duracionMinutos && (
                          <Chip
                            icon={<AccessTimeIcon fontSize="small" />}
                            label={`${interaccion.duracionMinutos} min`}
                            size="small"
                            sx={{ mt: 0.5, fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </Box>
                      {interaccion.tipo !== 'CAMBIO_ESTADO' && (
                        <Box>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(interaccion)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(interaccion.id!)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>

                    {/* Chips de tipo y resultado */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
                      <Chip
                        label={TIPO_INTERACCION_LABELS[interaccion.tipo]}
                        size="small"
                        color={TIPO_COLORS[interaccion.tipo]}
                      />
                      {interaccion.resultado && (
                        <Chip
                          label={RESULTADO_INTERACCION_LABELS[interaccion.resultado]}
                          size="small"
                          sx={{
                            bgcolor: RESULTADO_INTERACCION_COLORS[interaccion.resultado],
                            color: 'white'
                          }}
                        />
                      )}
                    </Box>

                    {/* Descripción */}
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {interaccion.descripcion}
                    </Typography>

                    {/* Próxima acción */}
                    {(interaccion.proximaAccion || interaccion.notasProximaAccion) && (
                      <Box
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: 'warning.lighter',
                          borderRadius: 1,
                          borderLeft: 3,
                          borderColor: 'warning.main'
                        }}
                      >
                        <Typography variant="caption" fontWeight="bold" color="warning.dark" display="block">
                          📅 Próxima Acción
                        </Typography>
                        {interaccion.proximaAccion && (
                          <Typography variant="caption" display="block">
                            Fecha: {formatearFecha(interaccion.proximaAccion)}
                          </Typography>
                        )}
                        {interaccion.notasProximaAccion && (
                          <Typography variant="caption" display="block">
                            {interaccion.notasProximaAccion}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      {/* Dialog para crear/editar interacción */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInteraccion ? 'Editar Interacción' : 'Nueva Interacción'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Interacción</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoInteraccionEnum })}
                  label="Tipo de Interacción"
                >
                  {Object.entries(TIPO_INTERACCION_LABELS)
                    .filter(([key]) => key !== 'CAMBIO_ESTADO')
                    .map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {TIPO_ICONS[key as TipoInteraccionEnum]} {label}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Fecha y Hora"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe lo que se conversó o el motivo de la interacción..."
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Resultado</InputLabel>
                <Select
                  value={formData.resultado || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    resultado: e.target.value as ResultadoInteraccionEnum || undefined
                  })}
                  label="Resultado"
                >
                  <MenuItem value="">
                    <em>Sin definir</em>
                  </MenuItem>
                  {Object.entries(RESULTADO_INTERACCION_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Duración (minutos)"
                value={formData.duracionMinutos || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  duracionMinutos: e.target.value ? Number(e.target.value) : undefined
                })}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  label={proximaAccionRequerida ? 'Próxima Acción *' : 'Próxima Acción'}
                  size="small"
                  color={proximaAccionRequerida ? 'warning' : 'default'}
                />
              </Divider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Próxima Acción"
                value={formData.proximaAccion || ''}
                onChange={(e) => setFormData({ ...formData, proximaAccion: e.target.value || undefined })}
                InputLabelProps={{ shrink: true }}
                required={proximaAccionRequerida}
                error={proximaAccionRequerida && !formData.proximaAccion}
                helperText={proximaAccionRequerida && !formData.proximaAccion ? 'Requerido cuando el resultado es Reagendar' : undefined}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Notas de Próxima Acción"
                value={formData.notasProximaAccion || ''}
                onChange={(e) => setFormData({ ...formData, notasProximaAccion: e.target.value })}
                placeholder="Ej: Enviar cotización, llamar para confirmar..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving || !formData.descripcion || (proximaAccionRequerida && !formData.proximaAccion)}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Guardando...' : editingInteraccion ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!interaccionToDelete}
        onClose={() => { if (!deleteLoading) { setInteraccionToDelete(null); setDeleteError(null); } }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar interacción?"
        severity="error"
        warning={deleteError ?? 'Esta acción no se puede deshacer.'}
        description="Está a punto de eliminar el siguiente registro de interacción con el lead:"
        itemDetails={
          interaccionToDelete && (
            <>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {interaccionToDelete.tipo}
              </Typography>
              {interaccionToDelete.descripcion && (
                <Typography variant="body2" color="text.secondary">
                  {interaccionToDelete.descripcion}
                </Typography>
              )}
            </>
          )
        }
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteLoading}
      />
    </Card>
  );
};
