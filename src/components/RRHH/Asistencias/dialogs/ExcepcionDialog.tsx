// FRONT-003: extracted from AsistenciasPage.tsx — registro de excepciones
// (inasistencia, llegada tarde, etc.).  Form state and persistence stay
// in the orchestrator; this is a controlled view with conditional fields.
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Autocomplete,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { Empleado } from '../../../../types';
import type { ExcepcionFormData, TipoExcepcion } from '../types';
import { TIPO_EXCEPCION_OPTIONS } from '../constants';
import { getEmpleadoNombre } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  fullScreen?: boolean;
  empleados: Empleado[];
  form: ExcepcionFormData;
  setForm: Dispatch<SetStateAction<ExcepcionFormData>>;
}

const SHOW_HORAS_REALES: TipoExcepcion[] = ['SALIDA_ANTICIPADA', 'MODIFICACION_HORARIO'];

const ExcepcionDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  fullScreen = false,
  empleados,
  form,
  setForm,
}) => {
  const update = <K extends keyof ExcepcionFormData>(key: K, value: ExcepcionFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const empleadoSeleccionado = empleados.find((e) => e.id.toString() === form.empleadoId) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Registrar Excepción</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Autocomplete
            options={empleados}
            getOptionLabel={(option) => getEmpleadoNombre(option)}
            value={empleadoSeleccionado}
            onChange={(_, newValue) =>
              update('empleadoId', newValue ? newValue.id.toString() : '')
            }
            renderInput={(params) => <TextField {...params} label="Empleado" required />}
          />

          <TextField
            label="Fecha"
            type="date"
            value={form.fecha}
            onChange={(e) => update('fecha', e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth required>
            <InputLabel>Tipo de Excepción</InputLabel>
            <Select
              value={form.tipo}
              onChange={(e) => update('tipo', e.target.value as TipoExcepcion)}
              label="Tipo de Excepción"
            >
              {TIPO_EXCEPCION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.tipo === 'LLEGADA_TARDE' && (
            <TextField
              label="Minutos de Tardanza"
              type="number"
              value={form.minutosTardanza}
              onChange={(e) => update('minutosTardanza', e.target.value)}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
          )}

          {form.tipo === 'HORAS_EXTRAS' && (
            <TextField
              label="Horas Extras"
              type="number"
              value={form.horasExtras}
              onChange={(e) => update('horasExtras', e.target.value)}
              fullWidth
              required
              inputProps={{ step: 0.5, min: 0.5 }}
            />
          )}

          {SHOW_HORAS_REALES.includes(form.tipo) && (
            <>
              <TextField
                label="Hora Entrada Real"
                type="time"
                value={form.horaEntradaReal}
                onChange={(e) => update('horaEntradaReal', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hora Salida Real"
                type="time"
                value={form.horaSalidaReal}
                onChange={(e) => update('horaSalidaReal', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          {form.tipo === 'INASISTENCIA' && (
            <TextField
              label="Motivo"
              value={form.motivo}
              onChange={(e) => update('motivo', e.target.value)}
              fullWidth
              required
            />
          )}

          <TextField
            label="Observaciones"
            value={form.observaciones}
            onChange={(e) => update('observaciones', e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={form.justificado}
                onChange={(e) => update('justificado', e.target.checked)}
              />
            }
            label="Justificado"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!form.empleadoId || !form.tipo}
        >
          Registrar Excepción
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcepcionDialog;
