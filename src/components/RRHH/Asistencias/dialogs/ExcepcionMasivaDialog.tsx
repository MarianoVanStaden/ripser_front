// Carga masiva de Horas Extras: el caso común es que varias personas se queden
// el mismo día la misma cantidad de horas. Se elige el grupo y unas horas
// compartidas; cada empleado puede sobreescribir sus horas si difiere.
// Self-contained: maneja su propio estado y persiste vía el endpoint /masiva.
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import type { Empleado } from '../../../../types';
import { excepcionAsistenciaApi } from '../../../../api/services/excepcionAsistenciaApi';
import { getEmpleadoNombre } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Se llama tras guardar con éxito (para que el padre recargue la lista). */
  onSaved: () => void;
  fullScreen?: boolean;
  empleados: Empleado[];
}

const ExcepcionMasivaDialog: React.FC<Props> = ({
  open,
  onClose,
  onSaved,
  fullScreen = false,
  empleados,
}) => {
  const [seleccionados, setSeleccionados] = useState<Empleado[]>([]);
  const [fecha, setFecha] = useState(dayjs().format('YYYY-MM-DD'));
  const [horasComunes, setHorasComunes] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [justificado, setJustificado] = useState(true);
  // Overrides por empleado: empleadoId -> horas (string del input). Vacío = usa el común.
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setSeleccionados([]);
    setFecha(dayjs().format('YYYY-MM-DD'));
    setHorasComunes('');
    setObservaciones('');
    setJustificado(true);
    setOverrides({});
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const setOverride = (empleadoId: number, value: string) =>
    setOverrides((prev) => ({ ...prev, [empleadoId]: value }));

  // Válido si hay al menos un empleado y cada uno termina con un número de horas > 0
  // (sea por el valor común o por su override).
  const horasComunesNum = horasComunes ? parseFloat(horasComunes) : NaN;
  const puedeGuardar = useMemo(() => {
    if (seleccionados.length === 0) return false;
    return seleccionados.every((emp) => {
      const ov = overrides[emp.id];
      const horas = ov ? parseFloat(ov) : horasComunesNum;
      return !isNaN(horas) && horas > 0;
    });
  }, [seleccionados, overrides, horasComunesNum]);

  const handleSave = async () => {
    if (!puedeGuardar) return;
    setSaving(true);
    setError(null);
    try {
      await excepcionAsistenciaApi.createMasiva({
        empleados: seleccionados.map((emp) => {
          const ov = overrides[emp.id];
          return {
            empleadoId: emp.id,
            horasExtras: ov ? parseFloat(ov) : undefined,
          };
        }),
        fecha,
        tipo: 'HORAS_EXTRAS',
        horasExtras: isNaN(horasComunesNum) ? undefined : horasComunesNum,
        observaciones: observaciones || undefined,
        justificado,
      });
      reset();
      onSaved();
      onClose();
    } catch (err) {
      console.error('ExcepcionMasivaDialog save:', err);
      setError('Error al guardar la carga masiva de horas extras');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Carga masiva de Horas Extras</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={empleados}
            getOptionLabel={(option) => getEmpleadoNombre(option)}
            value={seleccionados}
            onChange={(_, newValue) => setSeleccionados(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Empleados" placeholder="Agregar al grupo" required />
            )}
          />

          <TextField
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Horas extras (para todo el grupo)"
            type="number"
            value={horasComunes}
            onChange={(e) => setHorasComunes(e.target.value)}
            fullWidth
            inputProps={{ step: 0.5, min: 0.5 }}
            helperText="Valor por defecto. Podés ajustar por persona abajo si alguien hizo otra cantidad."
          />

          {seleccionados.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle2" color="textSecondary">
                Horas por persona ({seleccionados.length})
              </Typography>
              <Stack spacing={1}>
                {seleccionados.map((emp) => (
                  <Box key={emp.id} display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {getEmpleadoNombre(emp)}
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={overrides[emp.id] ?? ''}
                      onChange={(e) => setOverride(emp.id, e.target.value)}
                      placeholder={horasComunes || '—'}
                      inputProps={{ step: 0.5, min: 0.5 }}
                      sx={{ width: 110 }}
                    />
                  </Box>
                ))}
              </Stack>
            </>
          )}

          <TextField
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={justificado}
                onChange={(e) => setJustificado(e.target.checked)}
              />
            }
            label="Justificado"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!puedeGuardar || saving}>
          {saving
            ? 'Guardando...'
            : `Registrar (${seleccionados.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcepcionMasivaDialog;
