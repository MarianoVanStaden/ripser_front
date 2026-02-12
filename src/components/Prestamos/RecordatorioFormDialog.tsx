import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress, Box,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { recordatorioCuotaApi } from '../../api/services/recordatorioCuotaApi';
import { TipoRecordatorioEnum } from '../../types/lead.types';
import type { RecordatorioCuotaDTO } from '../../types/prestamo.types';
import dayjs from 'dayjs';

const TIPO_RECORDATORIO_OPTIONS: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  TAREA: 'Tarea',
  NOTIFICACION: 'Notificación',
  WHATSAPP: 'WhatsApp',
  LLAMADA: 'Llamada',
};

interface RecordatorioFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  cuotaId: number;
  recordatorio?: RecordatorioCuotaDTO | null;
}

export const RecordatorioFormDialog: React.FC<RecordatorioFormDialogProps> = ({
  open, onClose, onSaved, cuotaId, recordatorio,
}) => {
  const isEdit = Boolean(recordatorio);
  const [formData, setFormData] = useState<Partial<RecordatorioCuotaDTO>>({
    cuotaId,
    fechaRecordatorio: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    tipo: TipoRecordatorioEnum.WHATSAPP,
    mensaje: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (recordatorio) {
        setFormData({
          cuotaId: recordatorio.cuotaId,
          fechaRecordatorio: recordatorio.fechaRecordatorio,
          tipo: recordatorio.tipo,
          mensaje: recordatorio.mensaje,
          usuarioAsignadoId: recordatorio.usuarioAsignadoId,
        });
      } else {
        setFormData({
          cuotaId,
          fechaRecordatorio: dayjs().add(1, 'day').format('YYYY-MM-DD'),
          tipo: TipoRecordatorioEnum.WHATSAPP,
          mensaje: '',
        });
      }
      setError(null);
    }
  }, [open, cuotaId, recordatorio]);

  const handleChange = (field: keyof RecordatorioCuotaDTO, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.mensaje) {
      setError('El mensaje es requerido');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = formData as RecordatorioCuotaDTO;
      if (isEdit && recordatorio?.id) {
        await recordatorioCuotaApi.update(recordatorio.id, payload);
      } else {
        await recordatorioCuotaApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el recordatorio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha Recordatorio"
                type="date"
                value={formData.fechaRecordatorio || ''}
                onChange={(e) => handleChange('fechaRecordatorio', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={formData.tipo || ''}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                {Object.entries(TIPO_RECORDATORIO_OPTIONS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensaje"
                required
                multiline
                rows={3}
                value={formData.mensaje || ''}
                onChange={(e) => handleChange('mensaje', e.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
        >
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
