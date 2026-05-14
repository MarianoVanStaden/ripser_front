import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { registroActividadApi } from '../../api/services/registroActividadApi';
import type { HorarioLaboralDTO } from '../../types/actividad.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

// bit 0 = lunes ... bit 6 = domingo (igual que el backend Empresa.diasLaborables).
const DIAS = [
  { bit: 0, label: 'Lun' },
  { bit: 1, label: 'Mar' },
  { bit: 2, label: 'Mié' },
  { bit: 3, label: 'Jue' },
  { bit: 4, label: 'Vie' },
  { bit: 5, label: 'Sáb' },
  { bit: 6, label: 'Dom' },
];

const toHHmm = (time: string | undefined): string => {
  if (!time) return '';
  // Backend devuelve "HH:mm:ss" o "HH:mm". Para el input type=time queremos "HH:mm".
  return time.substring(0, 5);
};

const toHHmmss = (hhmm: string): string => {
  // Reverso: el input type=time da "HH:mm"; mandamos "HH:mm:00".
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm;
};

export const HorarioLaboralDialog: React.FC<Props> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('18:00');
  const [diasMask, setDiasMask] = useState(31); // L-V default

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setLoading(true);
    registroActividadApi
      .getHorario()
      .then((h) => {
        setHorarioInicio(toHHmm(h.horarioInicio) || '08:00');
        setHorarioFin(toHHmm(h.horarioFin) || '18:00');
        setDiasMask(h.diasLaborables ?? 31);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message ?? 'Error al cargar la configuración');
      })
      .finally(() => setLoading(false));
  }, [open]);

  const toggleDia = (bit: number) => {
    setDiasMask((m) => m ^ (1 << bit));
  };

  const isDiaActivo = (bit: number) => ((diasMask >> bit) & 1) === 1;

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    if (horarioInicio >= horarioFin) {
      setError('La hora de inicio debe ser anterior a la hora de fin');
      return;
    }
    if (diasMask === 0) {
      setError('Tenés que marcar al menos un día laborable');
      return;
    }

    setSaving(true);
    try {
      const dto: HorarioLaboralDTO = {
        horarioInicio: toHHmmss(horarioInicio),
        horarioFin: toHHmmss(horarioFin),
        diasLaborables: diasMask,
      };
      await registroActividadApi.updateHorario(dto);
      setSuccess(true);
      // Dejamos el diálogo abierto unos segundos con el mensaje de éxito.
      setTimeout(onClose, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar el horario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScheduleIcon color="primary" />
        Horario laboral
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Las acciones que se ejecutan fuera de este rango se marcan como
          &quot;fuera de horario&quot; en el registro de actividad. Aplica a toda la empresa.
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Hora de inicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={saving}
              />
              <TextField
                label="Hora de fin"
                type="time"
                value={horarioFin}
                onChange={(e) => setHorarioFin(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={saving}
              />
            </Box>

            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Días laborables
            </Typography>
            <FormGroup row>
              {DIAS.map((d) => (
                <FormControlLabel
                  key={d.bit}
                  control={
                    <Checkbox
                      checked={isDiaActivo(d.bit)}
                      onChange={() => toggleDia(d.bit)}
                      disabled={saving}
                      size="small"
                    />
                  }
                  label={d.label}
                />
              ))}
            </FormGroup>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 2 }}>Horario actualizado</Alert>}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || loading}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
