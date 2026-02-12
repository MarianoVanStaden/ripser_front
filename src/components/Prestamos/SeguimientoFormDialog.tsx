import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, MenuItem, Alert, CircularProgress, Box,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { seguimientoPrestamoApi } from '../../api/services/seguimientoPrestamoApi';
import {
  TIPO_INTERACCION_PRESTAMO_LABELS,
} from '../../types/prestamo.types';
import type { CreateSeguimientoPrestamoDTO } from '../../types/prestamo.types';
import dayjs from 'dayjs';

interface SeguimientoFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prestamoId: number;
}

export const SeguimientoFormDialog: React.FC<SeguimientoFormDialogProps> = ({
  open, onClose, onSaved, prestamoId,
}) => {
  const [formData, setFormData] = useState<CreateSeguimientoPrestamoDTO>({
    prestamoId,
    tipo: undefined,
    fecha: dayjs().format('YYYY-MM-DDTHH:mm'),
    descripcion: '',
    resultado: '',
    proximaAccion: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        prestamoId,
        tipo: undefined,
        fecha: dayjs().format('YYYY-MM-DDTHH:mm'),
        descripcion: '',
        resultado: '',
        proximaAccion: '',
      });
      setError(null);
    }
  }, [open, prestamoId]);

  const handleChange = (field: keyof CreateSeguimientoPrestamoDTO, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await seguimientoPrestamoApi.create(formData);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el seguimiento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo Seguimiento</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Tipo de Interacción"
                value={formData.tipo || ''}
                onChange={(e) => handleChange('tipo', e.target.value || undefined)}
              >
                <MenuItem value="">Sin especificar</MenuItem>
                {Object.entries(TIPO_INTERACCION_PRESTAMO_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha"
                type="datetime-local"
                value={formData.fecha || ''}
                onChange={(e) => handleChange('fecha', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.descripcion || ''}
                onChange={(e) => handleChange('descripcion', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Resultado"
                value={formData.resultado || ''}
                onChange={(e) => handleChange('resultado', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Próxima Acción"
                value={formData.proximaAccion || ''}
                onChange={(e) => handleChange('proximaAccion', e.target.value)}
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
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
