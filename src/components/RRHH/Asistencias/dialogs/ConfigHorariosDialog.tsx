// FRONT-003: extracted from AsistenciasPage.tsx — per-empleado configuración
// de horarios laborales (lunes…domingo).  All persistence is owned by the
// orchestrator; this component is a controlled form view.
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
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
  FormControlLabel,
  Grid,
  Stack,
  TextField,
} from '@mui/material';
import type { Empleado } from '../../../../types';
import type { ConfigFormData, DiaSemana } from '../types';
import { DIAS_SEMANA } from '../constants';
import { getEmpleadoNombre } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  fullScreen?: boolean;
  empleados: Empleado[];
  selectedEmpleado: Empleado | null;
  setSelectedEmpleado: Dispatch<SetStateAction<Empleado | null>>;
  form: ConfigFormData;
  setForm: Dispatch<SetStateAction<ConfigFormData>>;
}

const ConfigHorariosDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  fullScreen = false,
  empleados,
  selectedEmpleado,
  setSelectedEmpleado,
  form,
  setForm,
}) => {
  const updateDia = (dia: DiaSemana, patch: Partial<ConfigFormData[DiaSemana]>) =>
    setForm((prev) => ({ ...prev, [dia]: { ...prev[dia], ...patch } }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle>
        {selectedEmpleado
          ? `Configurar Horario - ${getEmpleadoNombre(selectedEmpleado)}`
          : 'Seleccionar Empleado'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {!selectedEmpleado && (
            <Autocomplete
              options={empleados}
              getOptionLabel={(option) => getEmpleadoNombre(option)}
              value={selectedEmpleado}
              onChange={(_, newValue) => setSelectedEmpleado(newValue)}
              renderInput={(params) => <TextField {...params} label="Empleado" required />}
            />
          )}

          {selectedEmpleado && (
            <>
              <Alert severity="info">
                Configure los días y horarios laborales. Los días sin marcar se considerarán no
                laborables.
              </Alert>

              {DIAS_SEMANA.map((dia) => (
                <Box key={dia} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form[dia]?.trabaja || false}
                            onChange={(e) => updateDia(dia, { trabaja: e.target.checked })}
                          />
                        }
                        label={dia.charAt(0).toUpperCase() + dia.slice(1)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Hora Entrada"
                        type="time"
                        value={form[dia]?.horaEntrada || ''}
                        onChange={(e) => updateDia(dia, { horaEntrada: e.target.value })}
                        disabled={!form[dia]?.trabaja}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Hora Salida"
                        type="time"
                        value={form[dia]?.horaSalida || ''}
                        onChange={(e) => updateDia(dia, { horaSalida: e.target.value })}
                        disabled={!form[dia]?.trabaja}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={onSave} disabled={!selectedEmpleado}>
          Guardar Configuración
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigHorariosDialog;
