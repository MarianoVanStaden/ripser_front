import React, { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Empleado } from '../../../types';
import {
  ESTADO_SANCION_LABEL,
  TIPO_SANCION_COLOR,
  TIPO_SANCION_LABEL,
  type EstadoSancion,
  type SancionCreateDTO,
  type SancionDTO,
  type TipoSancion,
} from '../../../types/sancion.types';

interface SancionFormDialogProps {
  open: boolean;
  empleados: Empleado[];
  empleadoFijo?: Empleado | null;        // si se abre desde el perfil del empleado
  initial?: SancionDTO | null;            // null = nuevo
  motivosAcumuladosSugeridos?: string[];  // autocomplete sugerido
  onClose: () => void;
  onSubmit: (dto: SancionCreateDTO) => Promise<void>;
}

const MOTIVOS_ACUM_DEFAULT = [
  'Ausencias Reiteradas',
  'Ausentarse de su puesto de Trabajo',
  'Maltrato Verbal',
  'Incumplimientos varios',
  'Infraccción de Transito',
  'Dormirse en Viaje',
];

const SancionFormDialog: React.FC<SancionFormDialogProps> = ({
  open,
  empleados,
  empleadoFijo,
  initial,
  motivosAcumuladosSugeridos,
  onClose,
  onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [fecha, setFecha] = useState<string>('');
  const [tipo, setTipo] = useState<TipoSancion>('LLAMADA_ATENCION_VERBAL');
  const [dias, setDias] = useState<number>(0);
  const [motivo, setMotivo] = useState<string>('');
  const [motivoAcumulado, setMotivoAcumulado] = useState<string>('');
  const [pedidaPor, setPedidaPor] = useState<string>('');
  const [estado, setEstado] = useState<EstadoSancion>('PENDIENTE');
  const [observaciones, setObservaciones] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const emp = empleados.find(e => e.id === initial.empleadoId) ?? null;
      setEmpleado(emp ?? (empleadoFijo ?? null));
      setFecha(initial.fecha);
      setTipo(initial.tipo);
      setDias(initial.dias ?? 0);
      setMotivo(initial.motivo);
      setMotivoAcumulado(initial.motivoAcumulado ?? '');
      setPedidaPor(initial.pedidaPor ?? '');
      setEstado(initial.estado);
      setObservaciones(initial.observaciones ?? '');
    } else {
      setEmpleado(empleadoFijo ?? null);
      setFecha(new Date().toISOString().split('T')[0]);
      setTipo('LLAMADA_ATENCION_VERBAL');
      setDias(0);
      setMotivo('');
      setMotivoAcumulado('');
      setPedidaPor('');
      setEstado('PENDIENTE');
      setObservaciones('');
    }
    setError(null);
  }, [open, initial, empleadoFijo, empleados]);

  const handleSubmit = async () => {
    if (!empleado) { setError('Seleccioná un empleado'); return; }
    if (!fecha) { setError('La fecha es obligatoria'); return; }
    if (!motivo.trim()) { setError('Describí el motivo'); return; }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        empleadoId: empleado.id,
        fecha,
        tipo,
        dias: tipo === 'SUSPENSION' ? dias : 0,
        motivo: motivo.trim(),
        motivoAcumulado: motivoAcumulado.trim() || undefined,
        pedidaPor: pedidaPor.trim() || undefined,
        estado,
        observaciones: observaciones.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'No se pudo guardar la sanción');
    } finally {
      setSaving(false);
    }
  };

  const motivosSugeridos = Array.from(new Set([
    ...MOTIVOS_ACUM_DEFAULT,
    ...(motivosAcumuladosSugeridos ?? []),
  ]));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2 } }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', py: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <GavelIcon />
          <Typography variant="h5" fontWeight={600}>
            {initial ? 'Editar Sanción' : 'Nueva Sanción'}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={2}>
              EMPLEADO
            </Typography>
            <Autocomplete
              options={empleados}
              value={empleado}
              disabled={!!empleadoFijo}
              onChange={(_, v) => setEmpleado(v)}
              getOptionLabel={(e) => `${e.apellido}, ${e.nombre} (DNI ${e.dni})`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                    {option.nombre[0]}{option.apellido[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {option.apellido}, {option.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      DNI {option.dni} · {option.puesto?.nombre ?? '—'}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Buscar empleado *" placeholder="Apellido, nombre o DNI" />
              )}
            />
          </Paper>

          <Paper elevation={0} sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="primary" mb={2}>
              MEDIDA DISCIPLINARIA
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth label="Fecha *" type="date"
                  value={fecha} onChange={(e) => setFecha(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth select label="Tipo de Sanción *"
                  value={tipo} onChange={(e) => setTipo(e.target.value as TipoSancion)}
                >
                  {(Object.keys(TIPO_SANCION_LABEL) as TipoSancion[]).map(t => (
                    <MenuItem key={t} value={t}>
                      <Chip
                        size="small" color={TIPO_SANCION_COLOR[t]}
                        label={TIPO_SANCION_LABEL[t]} sx={{ mr: 1 }}
                      />
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth label="Días" type="number"
                  value={dias}
                  onChange={(e) => setDias(Math.max(0, Number(e.target.value) || 0))}
                  disabled={tipo !== 'SUSPENSION'}
                  helperText={tipo === 'SUSPENSION' ? 'Días de suspensión' : 'Sólo para suspensiones'}
                  InputProps={{ endAdornment: <InputAdornment position="end">días</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={motivosSugeridos}
                  value={motivoAcumulado}
                  onChange={(_, v) => setMotivoAcumulado(v ?? '')}
                  onInputChange={(_, v) => setMotivoAcumulado(v)}
                  renderInput={(p) => (
                    <TextField {...p} label="Motivo acumulado"
                      helperText="Etiqueta corta — agrupa reincidencias" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Pedida por"
                  placeholder="Ej: Villar, P"
                  value={pedidaPor} onChange={(e) => setPedidaPor(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={2}
                  label="Motivo / Descripción del hecho *"
                  value={motivo} onChange={(e) => setMotivo(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth select label="Estado *"
                  value={estado} onChange={(e) => setEstado(e.target.value as EstadoSancion)}
                >
                  {(Object.keys(ESTADO_SANCION_LABEL) as EstadoSancion[]).map(s => (
                    <MenuItem key={s} value={s}>{ESTADO_SANCION_LABEL[s]}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth multiline rows={3}
                  label="Observaciones internas (RRHH)"
                  value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {!initial && (
            <Alert severity="info" variant="outlined">
              Después de crear la sanción vas a poder adjuntar el aviso firmado o cualquier otro archivo
              desde el detalle.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'grey.100' }}>
        <Button onClick={onClose} variant="outlined" sx={{ minWidth: 120 }}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={saving}
          sx={{ minWidth: 180 }}
        >
          {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear sanción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SancionFormDialog;
