/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
// Dialog para "ausencia combinada": el empleado se va antes hoy + licencia
// continuada desde mañana. Crea atómicamente la excepción SALIDA_ANTICIPADA
// y la licencia (vía POST /api/ausencias/combinada).
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { ausenciaApi } from '../../../api/services/ausenciaApi';
import type { Empleado, TipoLicencia } from '../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  empleados: Empleado[];
  fullScreen?: boolean;
}

const TIPOS_LICENCIA: { value: TipoLicencia; label: string }[] = [
  { value: 'AUS_P_TRAMITES_PERSONAL', label: 'Aus. p/Tramites Personal' },
  { value: 'LLEGADA_TARDE', label: 'Llegada Tarde' },
  { value: 'SALIDA_ANTICIPADA', label: 'Salida Anticipada' },
  { value: 'AUSENTE_SIN_AVISO', label: 'Ausente Sin aviso' },
  { value: 'DIAS_AUSENTE_INJUSTIFICADO', label: 'Dias Ausente Injustificado' },
  { value: 'DIAS_ENFERMEDAD', label: 'Dias Enfermedad' },
  { value: 'DIAS_EXT_SANGRE', label: 'Dias Ext. Sangre' },
  { value: 'DIAS_FAM_ENFERMO', label: 'Dias Fam. Enfermo' },
  { value: 'DIAS_SUSPENSION', label: 'Dias Suspensión' },
  { value: 'FALTA_JUSTIFICADA', label: 'Falta Justificada' },
  { value: 'LIC_ACCIDENTE', label: 'Lic. Accidente' },
  { value: 'LIC_EXAMEN', label: 'Lic. Examen' },
  { value: 'LIC_FALLECIMIENTO_FAMILIAR', label: 'Lic. Fallecimiento de Familiar' },
  { value: 'LIC_MATERNIDAD', label: 'Lic. Maternidad' },
  { value: 'LIC_MATRIMONIO', label: 'Lic. Matrimonio' },
  { value: 'LIC_MATRIMONIO_HIJO', label: 'Lic. Matrimonio Hijo' },
  { value: 'LIC_MUDANZA', label: 'Lic. Mudanza' },
  { value: 'LIC_NACIMIENTO_HIJO', label: 'Lic. Nacimiento Hijo' },
  { value: 'LIC_SIN_GOCE_SUELDO', label: 'Lic. Sin Goce Sueldo' },
  { value: 'LIC_VACACIONES', label: 'Lic. Vacaciones' },
  { value: 'RESERVA_DE_PUESTO', label: 'Reserva de Puesto' },
];

const emptyForm = () => ({
  empleadoId: '' as string,
  fechaSalidaAnticipada: dayjs().format('YYYY-MM-DD'),
  horaSalidaReal: dayjs().format('HH:mm'),
  tipoLicencia: 'DIAS_ENFERMEDAD' as TipoLicencia,
  fechaFinLicencia: dayjs().add(2, 'day').format('YYYY-MM-DD'),
  motivo: '',
  goceHaber: true,
});

const AusenciaCombinadaDialog: React.FC<Props> = ({
  open, onClose, onSaved, empleados, fullScreen = false,
}) => {
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);

  const empleado = empleados.find(e => e.id.toString() === form.empleadoId) || null;
  const inicioLicencia = form.fechaSalidaAnticipada
    ? dayjs(form.fechaSalidaAnticipada).add(1, 'day').format('YYYY-MM-DD')
    : '';
  const diasLicencia = inicioLicencia && form.fechaFinLicencia
    ? Math.max(0, dayjs(form.fechaFinLicencia).diff(dayjs(inicioLicencia), 'day') + 1)
    : 0;

  const handleSave = async () => {
    setError(null);
    if (!form.empleadoId) { setError('Seleccioná un empleado'); return; }
    if (!form.fechaSalidaAnticipada || !form.horaSalidaReal) { setError('Cargá fecha y hora de salida'); return; }
    if (!form.fechaFinLicencia) { setError('Cargá la fecha fin de licencia'); return; }
    if (dayjs(form.fechaFinLicencia).isBefore(dayjs(inicioLicencia))) {
      setError('La fecha fin de licencia debe ser igual o posterior al día siguiente a la salida anticipada');
      return;
    }

    try {
      setSaving(true);
      await ausenciaApi.crearCombinada({
        empleadoId: parseInt(form.empleadoId),
        fechaSalidaAnticipada: form.fechaSalidaAnticipada,
        horaSalidaReal: form.horaSalidaReal.length === 5 ? `${form.horaSalidaReal}:00` : form.horaSalidaReal,
        tipoLicencia: form.tipoLicencia,
        fechaFinLicencia: form.fechaFinLicencia,
        motivo: form.motivo?.trim() || undefined,
        goceHaber: form.goceHaber,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al crear la ausencia combinada';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Ausencia combinada (salida anticipada + licencia)</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          El empleado se retira antes <strong>hoy</strong> (se carga como excepción de salida anticipada) y la licencia continuada arranca <strong>al día siguiente</strong>. Se guarda todo en una sola operación.
        </Typography>

        <Stack spacing={2}>
          <Autocomplete
            options={empleados}
            getOptionLabel={(o) => `${o.apellido}, ${o.nombre}${o.dni ? ` (${o.dni})` : ''}`}
            value={empleado}
            onChange={(_, v) => setForm(p => ({ ...p, empleadoId: v ? v.id.toString() : '' }))}
            renderInput={(p) => <TextField {...p} label="Empleado" required />}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required type="date"
                label="Fecha de salida anticipada"
                value={form.fechaSalidaAnticipada}
                onChange={(e) => setForm(p => ({ ...p, fechaSalidaAnticipada: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                helperText="Normalmente hoy"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required type="time"
                label="Hora real de salida"
                value={form.horaSalidaReal}
                onChange={(e) => setForm(p => ({ ...p, horaSalidaReal: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth required label="Tipo de licencia"
                value={form.tipoLicencia}
                onChange={(e) => setForm(p => ({ ...p, tipoLicencia: e.target.value as TipoLicencia }))}
              >
                {TIPOS_LICENCIA.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required type="date"
                label="Fecha fin de licencia"
                value={form.fechaFinLicencia}
                onChange={(e) => setForm(p => ({ ...p, fechaFinLicencia: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                helperText={inicioLicencia ? `Licencia desde ${dayjs(inicioLicencia).format('DD/MM/YYYY')} · ${diasLicencia} día(s)` : ' '}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth multiline rows={2} label="Motivo"
            value={form.motivo}
            onChange={(e) => setForm(p => ({ ...p, motivo: e.target.value }))}
            placeholder="Ej.: Lumbalgia, sale al mediodía y reposo médico hasta el viernes."
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.goceHaber}
                color="success"
                onChange={(e) => setForm(p => ({ ...p, goceHaber: e.target.checked }))}
              />
            }
            label="Con goce de haber"
          />

          <Box bgcolor="info.50" p={1.5} borderRadius={1} borderLeft="4px solid" borderColor="info.main">
            <Typography variant="caption" color="textSecondary">
              Se crearán: <strong>1 excepción SALIDA_ANTICIPADA</strong> el {form.fechaSalidaAnticipada ? dayjs(form.fechaSalidaAnticipada).format('DD/MM/YYYY') : '—'} a las {form.horaSalidaReal || '—'}, y <strong>1 licencia {form.tipoLicencia}</strong> {inicioLicencia && form.fechaFinLicencia ? `del ${dayjs(inicioLicencia).format('DD/MM/YYYY')} al ${dayjs(form.fechaFinLicencia).format('DD/MM/YYYY')}` : ''} (estado APROBADA).
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Crear ausencia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AusenciaCombinadaDialog;
