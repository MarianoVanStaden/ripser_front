import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Stack, Alert, CircularProgress, FormControlLabel, Switch, Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import {
  TipoAccionCobranza,
  TIPO_ACCION_COBRANZA_LABELS,
  ResultadoAccionCobranza,
  RESULTADO_ACCION_COBRANZA_LABELS,
} from '../../../types/cobranza.types';
import type { TipoAccionCobranza as TipoAccionType, ResultadoAccionCobranza as ResultadoType } from '../../../types/cobranza.types';

interface RegistrarAccionDialogProps {
  open: boolean;
  gestionId: number;
  clienteNombre: string;
  onClose: () => void;
  onSaved: () => void;
}

const defaultFecha = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return now.toISOString().slice(0, 16);
};

export const RegistrarAccionDialog: React.FC<RegistrarAccionDialogProps> = ({
  open,
  gestionId,
  clienteNombre,
  onClose,
  onSaved,
}) => {
  const [form, setForm] = useState({
    tipo: TipoAccionCobranza.LLAMADA as TipoAccionType,
    resultado: '' as ResultadoType | '',
    fecha: defaultFecha(),
    descripcion: '',
    duracionMinutos: '' as number | '',
    fechaPrometePago: '',
    fechaProximoContacto: '',
    actualizarGestion: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    setForm({
      tipo: TipoAccionCobranza.LLAMADA,
      resultado: '',
      fecha: defaultFecha(),
      descripcion: '',
      duracionMinutos: '',
      fechaPrometePago: '',
      fechaProximoContacto: '',
      actualizarGestion: true,
    });
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      await gestionCobranzaApi.createAccion({
        gestionId,
        tipo: form.tipo,
        resultado: (form.resultado || undefined) as ResultadoType | undefined,
        fecha: new Date(form.fecha).toISOString(),
        descripcion: form.descripcion || undefined,
        duracionMinutos: form.duracionMinutos !== '' ? Number(form.duracionMinutos) : undefined,
        fechaPrometePago: form.fechaPrometePago || undefined,
        fechaProximoContacto: form.fechaProximoContacto || undefined,
        actualizarGestion: form.actualizarGestion,
      });
      onSaved();
      handleClose();
    } catch {
      setFormError('Error al registrar la acción. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const showFechaPromesa = form.resultado === ResultadoAccionCobranza.PROMETIO_PAGO;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Registrar Acción de Cobranza
        <br />
        <span style={{ fontSize: '0.875rem', color: '#666' }}>{clienteNombre}</span>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={form.tipo}
                  label="Tipo *"
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoAccionType }))}
                >
                  {(Object.keys(TipoAccionCobranza) as (keyof typeof TipoAccionCobranza)[]).map((k) => (
                    <MenuItem key={k} value={TipoAccionCobranza[k]}>
                      {TIPO_ACCION_COBRANZA_LABELS[TipoAccionCobranza[k]]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Resultado</InputLabel>
                <Select
                  value={form.resultado}
                  label="Resultado"
                  onChange={(e) => setForm((f) => ({ ...f, resultado: e.target.value as ResultadoType | '' }))}
                >
                  <MenuItem value=""><em>Sin resultado</em></MenuItem>
                  {(Object.keys(ResultadoAccionCobranza) as (keyof typeof ResultadoAccionCobranza)[]).map((k) => (
                    <MenuItem key={k} value={ResultadoAccionCobranza[k]}>
                      {RESULTADO_ACCION_COBRANZA_LABELS[ResultadoAccionCobranza[k]]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={7}>
              <TextField
                label="Fecha y Hora"
                type="datetime-local"
                fullWidth size="small"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                label="Duración (min)"
                type="number"
                fullWidth size="small"
                value={form.duracionMinutos}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    duracionMinutos: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Descripción"
            multiline rows={3}
            fullWidth size="small"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="¿Qué ocurrió en esta gestión?"
          />

          {showFechaPromesa && (
            <TextField
              label="Fecha en que prometió pagar *"
              type="date"
              fullWidth size="small"
              value={form.fechaPrometePago}
              onChange={(e) => setForm((f) => ({ ...f, fechaPrometePago: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          )}

          <TextField
            label="Próximo contacto (fecha)"
            type="date"
            fullWidth size="small"
            value={form.fechaProximoContacto}
            onChange={(e) => setForm((f) => ({ ...f, fechaProximoContacto: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.actualizarGestion}
                onChange={(e) => setForm((f) => ({ ...f, actualizarGestion: e.target.checked }))}
                size="small"
              />
            }
            label="Actualizar estado de la gestión automáticamente"
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
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
