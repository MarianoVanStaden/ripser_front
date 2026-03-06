import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Stack, Alert, CircularProgress, Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import {
  TipoRecordatorioCobranza,
  TIPO_RECORDATORIO_COBRANZA_LABELS,
  PrioridadCobranza,
  PRIORIDAD_COBRANZA_LABELS,
} from '../../../types/cobranza.types';
import type {
  TipoRecordatorioCobranza as TipoType,
  PrioridadCobranza as PrioridadType,
} from '../../../types/cobranza.types';

interface RecordatorioCobranzaDialogProps {
  open: boolean;
  gestionId: number;
  clienteNombre: string;
  onClose: () => void;
  onSaved: () => void;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const RecordatorioCobranzaDialog: React.FC<RecordatorioCobranzaDialogProps> = ({
  open,
  gestionId,
  clienteNombre,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    fechaRecordatorio: getTodayStr(),
    hora: '',
    tipo: TipoRecordatorioCobranza.TAREA as TipoType,
    prioridad: PrioridadCobranza.MEDIA as PrioridadType,
    mensaje: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    setForm({
      fechaRecordatorio: getTodayStr(),
      hora: '',
      tipo: TipoRecordatorioCobranza.TAREA,
      prioridad: PrioridadCobranza.MEDIA,
      mensaje: '',
    });
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.fechaRecordatorio) {
      setFormError('La fecha es requerida.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await gestionCobranzaApi.createRecordatorio({
        gestionId,
        fechaRecordatorio: form.fechaRecordatorio,
        hora: form.hora || undefined,
        tipo: form.tipo,
        prioridad: form.prioridad,
        mensaje: form.mensaje || undefined,
      });
      onSaved();
      handleClose();
    } catch {
      setFormError('Error al crear el recordatorio. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Nuevo Recordatorio
        <br />
        <span style={{ fontSize: '0.875rem', color: '#666' }}>{clienteNombre}</span>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={7}>
              <TextField
                label="Fecha *"
                type="date"
                fullWidth size="small"
                value={form.fechaRecordatorio}
                onChange={(e) => setForm((f) => ({ ...f, fechaRecordatorio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: getTodayStr() }}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                label="Hora"
                type="time"
                fullWidth size="small"
                value={form.hora}
                onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={form.tipo}
                  label="Tipo"
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoType }))}
                >
                  {(Object.keys(TipoRecordatorioCobranza) as (keyof typeof TipoRecordatorioCobranza)[]).map((k) => (
                    <MenuItem key={k} value={TipoRecordatorioCobranza[k]}>
                      {TIPO_RECORDATORIO_COBRANZA_LABELS[TipoRecordatorioCobranza[k]]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={form.prioridad}
                  label="Prioridad"
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as PrioridadType }))}
                >
                  {(Object.keys(PrioridadCobranza) as (keyof typeof PrioridadCobranza)[]).map((k) => (
                    <MenuItem key={k} value={PrioridadCobranza[k]}>
                      {PRIORIDAD_COBRANZA_LABELS[PrioridadCobranza[k]]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            label="Mensaje / Nota"
            multiline rows={3}
            fullWidth size="small"
            value={form.mensaje}
            onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
            placeholder="¿Qué hay que recordar?"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
};
