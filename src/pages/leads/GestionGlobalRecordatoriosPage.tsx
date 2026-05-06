import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
  Link,
  Autocomplete,
  createFilterOptions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Today as TodayIcon,
  NotificationsActive as NotificationsActiveIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Task as TaskIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useRecordatoriosLeads } from '../../hooks/useRecordatoriosLeads';
import { EstadoQuickEdit } from '../../components/leads/EstadoQuickEdit';
import { PriorityQuickEdit } from '../../components/leads/PriorityQuickEdit';
import { useTenant } from '../../context/TenantContext';
import {
  TipoRecordatorioEnum,
  PrioridadLeadEnum,
  EstadoLeadEnum,
  PrioridadRecordatorioEnum,
  TipoInteraccionEnum,
  PRIORIDAD_LABELS,
  TIPO_INTERACCION_LABELS,
  RESULTADO_INTERACCION_LABELS,
} from '../../types/lead.types';
import type {
  TipoRecordatorioEnum as TipoRecordatorioType,
  PrioridadLeadEnum as PrioridadType,
  PrioridadRecordatorioEnum as PrioridadRecordatorioType,
  TipoInteraccionEnum as TipoInteraccionType,
  ResultadoInteraccionEnum as ResultadoType,
  InteraccionLeadDTO,
  LeadDTO,
} from '../../types/lead.types';
import { leadApi } from '../../api/services/leadApi';
import { usuarioApi } from '../../api/services/usuarioApi';
import { sucursalService } from '../../services/sucursalService';
import { openWhatsAppWeb } from '../../utils/whatsapp';
import type { Sucursal, Usuario } from '../../types';
import type {
  RecordatorioConLeadDTO,
  RecordatorioGlobalFilterParams,
} from '../../api/services/recordatorioLeadApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mapLeadPrioridadToRecordatorio = (p?: string) =>
  p === 'HOT' ? 'ALTA' as const : p === 'WARM' ? 'MEDIA' as const : 'BAJA' as const;

const mapTipoInteraccionToRecordatorio = (tipo: string) =>
  tipo === 'LLAMADA' ? 'LLAMADA' as const :
  tipo === 'EMAIL' ? 'EMAIL' as const :
  tipo === 'WHATSAPP' ? 'WHATSAPP' as const :
  'TAREA' as const;

const getTodayStr = () => new Date().toISOString().split('T')[0];

const getDateStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const getWeekEndStr = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getRowBgColor = (fechaRecordatorio: string) => {
  const today = getTodayStr();
  if (fechaRecordatorio < today) return 'error.50';
  if (fechaRecordatorio === today) return 'warning.50';
  return 'transparent';
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TIPO_RECORDATORIO_LABELS: Record<string, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  TAREA: 'Tarea',
  NOTIFICACION: 'Notificación',
  WHATSAPP: 'WhatsApp',
  LLAMADA: 'Llamada',
};

const PRIORIDAD_RECORDATORIO_LABELS: Record<string, string> = {
  ALTA: 'Urgente',
  MEDIA: 'Normal',
  BAJA: 'Baja',
};

const PRIORIDAD_RECORDATORIO_COLORS: Record<string, string> = {
  ALTA: '#EF4444',
  MEDIA: '#F59E0B',
  BAJA: '#9CA3AF',
};

const TIPO_RECORDATORIO_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <EmailIcon fontSize="small" />,
  SMS: <SmsIcon fontSize="small" />,
  TAREA: <TaskIcon fontSize="small" />,
  NOTIFICACION: <NotificationsActiveIcon fontSize="small" />,
  WHATSAPP: <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />,
  LLAMADA: <PhoneIcon fontSize="small" />,
};

const ESTADOS_QUICK_EDIT: EstadoLeadEnum[] = [
  EstadoLeadEnum.PRIMER_CONTACTO,
  EstadoLeadEnum.MOSTRO_INTERES,
  EstadoLeadEnum.CLIENTE_POTENCIAL,
  EstadoLeadEnum.CLIENTE_POTENCIAL_CALIFICADO,
  EstadoLeadEnum.VENTA,
  EstadoLeadEnum.DESCARTADO,
  EstadoLeadEnum.PERDIDO,
  EstadoLeadEnum.LEAD_DUPLICADO,
  EstadoLeadEnum.PRECIO_ELEVADO,
  EstadoLeadEnum.COMPRA_ANULADA,
];

type DatePreset = 'hoy' | 'ayer' | 'mañana' | 'semana' | 'vencidos' | 'personalizado' | 'todos';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'vencidos', label: 'Vencidos' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'mañana', label: 'Mañana' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'personalizado', label: 'Personalizado' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  color: 'error' | 'warning' | 'primary' | 'success';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, color, icon }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      borderLeft: 4,
      borderColor: `${color}.main`,
    }}
  >
    <Box sx={{ color: `${color}.main` }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight={700} color={`${color}.main`}>
        {count}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  </Paper>
);

// ─── Interacción Dialog ───────────────────────────────────────────────────────

interface InteraccionDialogProps {
  open: boolean;
  leadId: number;
  leadNombre: string;
  leadPrioridad?: PrioridadType;
  onClose: () => void;
  onSubmit: (leadId: number, data: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>, leadPrioridad?: PrioridadType) => Promise<void>;
}

const InteraccionDialog: React.FC<InteraccionDialogProps> = ({
  open,
  leadId,
  leadNombre,
  leadPrioridad,
  onClose,
  onSubmit,
}) => {
  const defaultFecha = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    tipo: TipoInteraccionEnum.LLAMADA as TipoInteraccionType,
    fecha: defaultFecha(),
    descripcion: '',
    resultado: '' as ResultadoType | '',
    duracionMinutos: '' as number | '',
    proximaAccion: '',
    notasProximaAccion: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    setForm({
      tipo: TipoInteraccionEnum.LLAMADA,
      fecha: defaultFecha(),
      descripcion: '',
      resultado: '',
      duracionMinutos: '',
      proximaAccion: '',
      notasProximaAccion: '',
    });
    setFormError(null);
    onClose();
  };

  const proximaAccionRequerida = form.resultado === 'REAGENDAR';

  const handleSubmit = async () => {
    if (!form.descripcion.trim()) {
      setFormError('La descripción es requerida.');
      return;
    }
    if (proximaAccionRequerida && !form.proximaAccion) {
      setFormError('La fecha de próxima acción es requerida cuando el resultado es Reagendar.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(leadId, {
        tipo: form.tipo,
        fecha: new Date(form.fecha).toISOString(),
        descripcion: form.descripcion.trim(),
        resultado: form.resultado || null,
        duracionMinutos: form.duracionMinutos !== '' ? Number(form.duracionMinutos) : null,
        proximaAccion: form.proximaAccion || null,
        notasProximaAccion: form.notasProximaAccion || null,
      }, leadPrioridad);
      handleClose();
    } catch {
      setFormError('Error al registrar la interacción. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle>
        Registrar Interacción
        <Typography variant="body2" color="text.secondary">
          Lead: <strong>{leadNombre}</strong>
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={form.tipo}
                  label="Tipo"
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoInteraccionType }))}
                >
                  {Object.entries(TIPO_INTERACCION_LABELS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Fecha y Hora"
                type="datetime-local"
                fullWidth
                size="small"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Descripción *"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="¿Qué ocurrió en esta interacción?"
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Resultado</InputLabel>
                <Select
                  value={form.resultado}
                  label="Resultado"
                  onChange={(e) => setForm((f) => ({ ...f, resultado: e.target.value as ResultadoType | '' }))}
                >
                  <MenuItem value=""><em>Sin resultado</em></MenuItem>
                  {Object.entries(RESULTADO_INTERACCION_LABELS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Duración (minutos)"
                type="number"
                fullWidth
                size="small"
                value={form.duracionMinutos}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duracionMinutos: e.target.value === '' ? '' : Number(e.target.value) }))
                }
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          <Divider>
            <Typography variant="caption" color={proximaAccionRequerida ? 'warning.main' : 'text.secondary'}>
              {proximaAccionRequerida ? 'Próxima Acción *' : 'Próxima Acción'}
            </Typography>
          </Divider>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Próxima acción (fecha)"
                type="date"
                fullWidth
                size="small"
                value={form.proximaAccion}
                onChange={(e) => setForm((f) => ({ ...f, proximaAccion: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required={proximaAccionRequerida}
                error={proximaAccionRequerida && !form.proximaAccion}
                helperText={proximaAccionRequerida && !form.proximaAccion ? 'Requerido cuando resultado es Reagendar' : undefined}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Notas próxima acción"
                fullWidth
                size="small"
                value={form.notasProximaAccion}
                onChange={(e) => setForm((f) => ({ ...f, notasProximaAccion: e.target.value }))}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || (proximaAccionRequerida && !form.proximaAccion)}
          startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Reprogramar Dialog ───────────────────────────────────────────────────────

interface ReprogramarDialogProps {
  open: boolean;
  recordatorio: RecordatorioConLeadDTO | null;
  onClose: () => void;
  onSubmit: (recordatorioId: number, leadId: number, nuevaFecha: string) => Promise<void>;
}

const ReprogramarDialog: React.FC<ReprogramarDialogProps> = ({
  open,
  recordatorio,
  onClose,
  onSubmit,
}) => {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (recordatorio) setNuevaFecha(recordatorio.fechaRecordatorio);
  }, [recordatorio]);

  const handleClose = () => {
    setNuevaFecha('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!nuevaFecha) {
      setFormError('Seleccione una nueva fecha.');
      return;
    }
    if (!recordatorio?.id) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(recordatorio.id, recordatorio.leadId, nuevaFecha);
      handleClose();
    } catch {
      setFormError('Error al reprogramar. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const leadNombre = recordatorio?.lead
    ? `${recordatorio.lead.nombre}${recordatorio.lead.apellido ? ' ' + recordatorio.lead.apellido : ''}`
    : `Lead #${recordatorio?.leadId}`;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle>
        Reprogramar Recordatorio
        <Typography variant="body2" color="text.secondary">
          Lead: <strong>{leadNombre}</strong>
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Fecha actual: <strong>{formatDateDisplay(recordatorio?.fechaRecordatorio ?? '')}</strong>
          </Typography>
          <TextField
            label="Nueva fecha"
            type="date"
            fullWidth
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: getTodayStr() }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <ScheduleIcon />}
        >
          Reprogramar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Nuevo Recordatorio Dialog ────────────────────────────────────────────────

const PRIORIDAD_RECORDATORIO_OPTIONS: { value: PrioridadRecordatorioType; label: string }[] = [
  { value: PrioridadRecordatorioEnum.ALTA, label: 'Urgente' },
  { value: PrioridadRecordatorioEnum.MEDIA, label: 'Normal' },
  { value: PrioridadRecordatorioEnum.BAJA, label: 'Baja' },
];

interface NuevoRecordatorioDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (leadId: number, data: {
    fechaRecordatorio: string;
    hora?: string;
    tipo: TipoRecordatorioType;
    mensaje?: string;
    prioridad?: PrioridadRecordatorioType;
  }) => Promise<void>;
}

const NuevoRecordatorioDialog: React.FC<NuevoRecordatorioDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { empresaId } = useTenant();
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);
  const [form, setForm] = useState({
    fechaRecordatorio: getTodayStr(),
    hora: '',
    tipo: TipoRecordatorioEnum.LLAMADA as TipoRecordatorioType,
    mensaje: '',
    prioridad: '' as PrioridadRecordatorioType | '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load leads + sucursales when dialog opens (en paralelo)
  useEffect(() => {
    if (!open) return;
    setLoadingLeads(true);

    const leadsPromise = leadApi.getAll({ page: 0, size: 300 })
      .then((res) => setLeads(res.content))
      .catch(() => setLeads([]));

    const sucursalesPromise = empresaId
      ? sucursalService.getByEmpresa(empresaId)
          .then((data) => setSucursales(data))
          .catch(() => setSucursales([]))
      : Promise.resolve();

    Promise.all([leadsPromise, sucursalesPromise]).finally(() => setLoadingLeads(false));
  }, [open, empresaId]);

  // Map sucursalId → nombre, para el render y el sort.
  const sucursalNameById = useMemo(() => {
    const map = new Map<number, string>();
    sucursales.forEach((s) => {
      if (s.id != null) map.set(s.id, s.nombre);
    });
    return map;
  }, [sucursales]);

  const SIN_SUCURSAL_LABEL = 'Sin sucursal';

  const getSucursalLabel = (lead: LeadDTO) => {
    if (lead.sucursalId == null) return SIN_SUCURSAL_LABEL;
    return sucursalNameById.get(lead.sucursalId) ?? `Sucursal #${lead.sucursalId}`;
  };

  // Orden: por sucursal alfabética (Sin sucursal al final), luego por nombre del lead.
  const sortedLeads = useMemo(() => {
    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    return [...leads].sort((a, b) => {
      const sa = getSucursalLabel(a);
      const sb = getSucursalLabel(b);
      // "Sin sucursal" al final
      if (sa !== sb) {
        if (sa === SIN_SUCURSAL_LABEL) return 1;
        if (sb === SIN_SUCURSAL_LABEL) return -1;
        return collator.compare(sa, sb);
      }
      const na = `${a.nombre ?? ''} ${a.apellido ?? ''}`.trim();
      const nb = `${b.nombre ?? ''} ${b.apellido ?? ''}`.trim();
      return collator.compare(na, nb);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, sucursalNameById]);

  const handleClose = () => {
    setSelectedLead(null);
    setForm({
      fechaRecordatorio: getTodayStr(),
      hora: '',
      tipo: TipoRecordatorioEnum.LLAMADA,
      mensaje: '',
      prioridad: '',
    });
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedLead?.id) {
      setFormError('Seleccione un lead.');
      return;
    }
    if (!form.fechaRecordatorio) {
      setFormError('La fecha es requerida.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit(selectedLead.id, {
        fechaRecordatorio: form.fechaRecordatorio,
        hora: form.hora || undefined,
        tipo: form.tipo,
        mensaje: form.mensaje || undefined,
        prioridad: (form.prioridad || undefined) as PrioridadRecordatorioType | undefined,
      });
      handleClose();
    } catch {
      setFormError('Error al crear el recordatorio. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getLeadLabel = (lead: LeadDTO) => {
    const nombre = [lead.nombre, lead.apellido].filter(Boolean).join(' ');
    return lead.telefono ? `${nombre} — ${lead.telefono}` : nombre;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableRestoreFocus>
      <DialogTitle>
        Nuevo Recordatorio
        <Typography variant="body2" color="text.secondary">
          Crear un recordatorio para cualquier lead
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Lead selector — agrupado y ordenado por sucursal */}
          <Autocomplete
            options={sortedLeads}
            loading={loadingLeads}
            value={selectedLead}
            onChange={(_, value) => setSelectedLead(value)}
            getOptionLabel={getLeadLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            groupBy={(option) => getSucursalLabel(option)}
            filterOptions={createFilterOptions<LeadDTO>({
              stringify: (lead) =>
                [
                  lead.nombre,
                  lead.apellido,
                  lead.telefono,
                  lead.email,
                  getSucursalLabel(lead),
                ]
                  .filter(Boolean)
                  .join(' '),
            })}
            renderOption={(props, option) => {
              const sucursalLabel = getSucursalLabel(option);
              return (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                    <Typography variant="body2" component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getLeadLabel(option)}
                    </Typography>
                    <Chip
                      label={sucursalLabel}
                      size="small"
                      variant="outlined"
                      sx={{ flexShrink: 0, height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                </li>
              );
            }}
            renderGroup={(params) => (
              <li key={params.key}>
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    bgcolor: 'grey.100',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {params.group}
                </Box>
                <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lead *"
                size="small"
                placeholder="Buscar por nombre, teléfono o sucursal..."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingLeads && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={7}>
              <TextField
                label="Fecha *"
                type="date"
                fullWidth
                size="small"
                value={form.fechaRecordatorio}
                onChange={(e) => setForm((f) => ({ ...f, fechaRecordatorio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: getTodayStr() }}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                label="Hora (opcional)"
                type="time"
                fullWidth
                size="small"
                value={form.hora}
                onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={form.tipo}
                  label="Tipo *"
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoRecordatorioType }))}
                >
                  {Object.entries(TipoRecordatorioEnum).map(([k]) => (
                    <MenuItem key={k} value={k}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {TIPO_RECORDATORIO_ICONS[k]}
                        {TIPO_RECORDATORIO_LABELS[k]}
                      </Box>
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
                  onChange={(e) => setForm((f) => ({ ...f, prioridad: e.target.value as PrioridadRecordatorioType | '' }))}
                >
                  <MenuItem value=""><em>Sin prioridad</em></MenuItem>
                  {PRIORIDAD_RECORDATORIO_OPTIONS.map(({ value, label }) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            label="Mensaje / Descripción"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={form.mensaje}
            onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
            placeholder="¿Qué hay que recordar? (opcional)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !selectedLead}
          startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Crear Recordatorio
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GestionGlobalRecordatoriosPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sucursalFiltro } = useTenant();

  // ── Filter state ──
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [customFechaDesde, setCustomFechaDesde] = useState('');
  const [customFechaHasta, setCustomFechaHasta] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState<PrioridadType | ''>('');
  const [filterTipo, setFilterTipo] = useState<TipoRecordatorioType | ''>('');
  const [filterUsuarioId, setFilterUsuarioId] = useState<number | ''>('');
  const [soloMios, setSoloMios] = useState(false);

  // ── Usuarios (asesores) ──
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  useEffect(() => {
    usuarioApi
      .getVendedores()
      .then((data) => {
        if (data.length > 0) setUsuarios(data);
        else return usuarioApi.getActivos().then(setUsuarios);
      })
      .catch(() => usuarioApi.getActivos().then(setUsuarios).catch(() => {}));
  }, []);
  // ── Dialog state ──
  const [interaccionOpen, setInteraccionOpen] = useState(false);
  const [selectedForInteraccion, setSelectedForInteraccion] = useState<RecordatorioConLeadDTO | null>(null);
  const [reprogramarOpen, setReprogramarOpen] = useState(false);
  const [selectedForReprogramar, setSelectedForReprogramar] = useState<RecordatorioConLeadDTO | null>(null);
  const [nuevoRecordatorioOpen, setNuevoRecordatorioOpen] = useState(false);

  // ── Action feedback ──
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ── Filtros memoizados ──
  // Input estable para la queryKey de useRecordatoriosLeads. Cuando los filtros
  // cambian, React Query refetchea automáticamente. La actualización en tiempo
  // real ante cambios de datos llega vía SSE (crm.recordatorio.actualizado).
  const filters = useMemo<RecordatorioGlobalFilterParams>(() => {
    const f: RecordatorioGlobalFilterParams = { enviado: false };

    if (filterPrioridad) f.prioridad = filterPrioridad;
    if (filterTipo) f.tipo = filterTipo;
    if (soloMios) f.soloMisRecordatorios = true;
    else if (filterUsuarioId) f.usuarioId = filterUsuarioId;
    if (sucursalFiltro) f.sucursalId = sucursalFiltro;

    const today = getTodayStr();
    switch (datePreset) {
      case 'ayer': {
        const ayer = getDateStr(-1);
        f.fechaDesde = ayer;
        f.fechaHasta = ayer;
        break;
      }
      case 'hoy':
        f.fechaDesde = today;
        f.fechaHasta = today;
        break;
      case 'mañana':
        f.fechaDesde = getDateStr(1);
        f.fechaHasta = getDateStr(1);
        break;
      case 'semana':
        f.fechaDesde = today;
        f.fechaHasta = getWeekEndStr();
        break;
      case 'vencidos':
        f.fechaHasta = getDateStr(-1);
        break;
      case 'personalizado':
        if (customFechaDesde) f.fechaDesde = customFechaDesde;
        if (customFechaHasta) f.fechaHasta = customFechaHasta;
        break;
      default:
        break;
    }
    return f;
  }, [
    datePreset,
    customFechaDesde,
    customFechaHasta,
    filterPrioridad,
    filterTipo,
    filterUsuarioId,
    soloMios,
    sucursalFiltro,
  ]);

  const {
    recordatorios,
    conteos,
    loading,
    error,
    usingFallback,
    refetch,
    marcarCompletado,
    reprogramar,
    crearInteraccion,
    crearRecordatorio,
  } = useRecordatoriosLeads(filters);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // ── Stable today string for row coloring ──
  const today = getTodayStr();

  // ── Handlers ──
  const handleMarcarCompletado = async (rec: RecordatorioConLeadDTO) => {
    setActionError(null);
    try {
      await marcarCompletado(rec.id!, rec.leadId);
      setActionSuccess('Recordatorio marcado como completado.');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      setActionError('Error al marcar como completado.');
    }
  };

  const handleOpenInteraccion = (rec: RecordatorioConLeadDTO) => {
    setSelectedForInteraccion(rec);
    setInteraccionOpen(true);
  };

  const handleSubmitInteraccion = async (
    leadId: number,
    data: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>,
    leadPrioridad?: PrioridadType
  ) => {
    const sourceRecordatorioId = selectedForInteraccion?.id;

    await crearInteraccion(leadId, data);

    if (data.proximaAccion) {
      try {
        await leadApi.createRecordatorio(leadId, {
          fechaRecordatorio: data.proximaAccion,
          tipo: mapTipoInteraccionToRecordatorio(data.tipo),
          mensaje: data.notasProximaAccion || `Próxima acción: ${data.tipo}`,
          prioridad: mapLeadPrioridadToRecordatorio(leadPrioridad),
        });
      } catch (recErr) {
        console.warn('No se pudo crear el recordatorio automático:', recErr);
      }
    }

    if (sourceRecordatorioId) {
      try {
        await marcarCompletado(sourceRecordatorioId, leadId);
      } catch (loopErr) {
        console.warn('No se pudo cerrar el recordatorio fuente:', loopErr);
      }
    }

    setActionSuccess('Interacción registrada correctamente.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleOpenReprogramar = (rec: RecordatorioConLeadDTO) => {
    setSelectedForReprogramar(rec);
    setReprogramarOpen(true);
  };

  const handleSubmitReprogramar = async (recordatorioId: number, leadId: number, nuevaFecha: string) => {
    await reprogramar(recordatorioId, leadId, nuevaFecha);
    setActionSuccess('Recordatorio reprogramado.');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Optimistic patch sobre el cache de recordatorios para reflejar cambios de
  // estado/prioridad del lead inmediatamente, sin esperar al refetch.
  const patchLeadInRecordatoriosCache = (
    leadId: number,
    patch: Partial<{ estadoLead: EstadoLeadEnum; prioridad: PrioridadType }>
  ) => {
    queryClient.setQueriesData<{ content: RecordatorioConLeadDTO[] } & Record<string, unknown>>(
      { queryKey: ['recordatorios'] },
      (data) => {
        if (!data?.content) return data;
        return {
          ...data,
          content: data.content.map((rec) =>
            rec.leadId === leadId && rec.lead
              ? { ...rec, lead: { ...rec.lead, ...patch } }
              : rec
          ),
        };
      }
    );
  };

  const handleUpdateEstado = async (leadId: number, newEstado: EstadoLeadEnum) => {
    try {
      await leadApi.updateEstado(leadId, newEstado);
      patchLeadInRecordatoriosCache(leadId, { estadoLead: newEstado });
      queryClient.invalidateQueries({ queryKey: ['recordatorios'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setActionSuccess('Estado actualizado.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch {
      setActionError('Error al actualizar el estado del lead.');
    }
  };

  const handleUpdatePrioridad = async (leadId: number, newPrioridad: PrioridadType) => {
    try {
      await leadApi.updatePrioridad(leadId, newPrioridad);
      patchLeadInRecordatoriosCache(leadId, { prioridad: newPrioridad });
      queryClient.invalidateQueries({ queryKey: ['recordatorios'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setActionSuccess('Prioridad actualizada.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch {
      setActionError('Error al actualizar la prioridad del lead.');
    }
  };

  const handleSubmitNuevoRecordatorio = async (
    leadId: number,
    data: Parameters<typeof crearRecordatorio>[1]
  ) => {
    await crearRecordatorio(leadId, data);
    setActionSuccess('Recordatorio creado correctamente.');
    setTimeout(() => setActionSuccess(null), 3000);
    refresh(); // recargar la lista para que aparezca si coincide con los filtros activos
  };

  const getLeadNombre = (rec: RecordatorioConLeadDTO) => {
    if (rec.lead) {
      return `${rec.lead.nombre}${rec.lead.apellido ? ' ' + rec.lead.apellido : ''}`;
    }
    return `Lead #${rec.leadId}`;
  };

  // Solo el primer nombre del asesor (sin apellido), para compactar la columna.
  const usuarioPrimerNombre = useCallback(
    (id?: number) => {
      if (!id) return '—';
      const u = usuarios.find((u) => u.id === id);
      if (!u) return `#${id}`;
      const nombre = u.nombre || (u as any).username || '';
      return nombre || `#${id}`;
    },
    [usuarios]
  );

  const getLeadTelefono = (rec: RecordatorioConLeadDTO) => rec.lead?.telefono ?? '-';

  const openWhatsApp = (telefono: string) => openWhatsAppWeb(telefono);

  // ── Render ──
  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gestión Global de Recordatorios
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Bandeja operativa diaria — recordatorios pendientes de todos los leads
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNuevoRecordatorioOpen(true)}
            size="small"
          >
            Nuevo Recordatorio
          </Button>
          <Tooltip title="Forzar resincronización (la lista se actualiza automáticamente)">
            <span>
              <IconButton onClick={refresh} color="primary" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Stats ── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Total pendientes"
            count={conteos.totalPendientes}
            color="primary"
            icon={<NotificationsActiveIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Vencidos"
            count={conteos.vencidos}
            color="error"
            icon={<WarningIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Para hoy"
            count={conteos.hoy}
            color="warning"
            icon={<TodayIcon />}
          />
        </Grid>
      </Grid>

      {/* ── Alerts ── */}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {usingFallback && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Modo compatibilidad activo: el endpoint <code>/api/recordatorios</code> aún no está desplegado. Los datos se cargan lead a lead — puede ser más lento.
        </Alert>
      )}

      {/* ── Filters ── */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          {/* Date presets */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Fecha:
            </Typography>
            {DATE_PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                label={preset.label}
                onClick={() => setDatePreset(preset.value)}
                variant={datePreset === preset.value ? 'filled' : 'outlined'}
                color={datePreset === preset.value ? 'primary' : 'default'}
                size="small"
              />
            ))}
          </Box>

          {/* Custom date range */}
          {datePreset === 'personalizado' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Desde"
                type="date"
                size="small"
                value={customFechaDesde}
                onChange={(e) => setCustomFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 180 }}
              />
              <TextField
                label="Hasta"
                type="date"
                size="small"
                value={customFechaHasta}
                onChange={(e) => setCustomFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 180 }}
              />
            </Box>
          )}

          {/* Additional filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={filterPrioridad}
                label="Prioridad"
                onChange={(e) => setFilterPrioridad(e.target.value as PrioridadType | '')}
              >
                <MenuItem value=""><em>Todas</em></MenuItem>
                {Object.entries(PrioridadLeadEnum).map(([k]) => (
                  <MenuItem key={k} value={k}>{PRIORIDAD_LABELS[k as PrioridadType]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterTipo}
                label="Tipo"
                onChange={(e) => setFilterTipo(e.target.value as TipoRecordatorioType | '')}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {Object.entries(TipoRecordatorioEnum).map(([k]) => (
                  <MenuItem key={k} value={k}>{TIPO_RECORDATORIO_LABELS[k]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }} disabled={soloMios}>
              <InputLabel>Asesor</InputLabel>
              <Select
                value={soloMios ? '' : filterUsuarioId}
                label="Asesor"
                onChange={(e) => {
                  const v = e.target.value;
                  setFilterUsuarioId(v === '' ? '' : Number(v));
                }}
              >
                <MenuItem value=""><em>Todos</em></MenuItem>
                {usuarios.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.nombre || (u as any).username || `#${u.id}`}{u.apellido ? ' ' + u.apellido : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={soloMios}
                  onChange={(e) => {
                    setSoloMios(e.target.checked);
                    if (e.target.checked) setFilterUsuarioId('');
                  }}
                  size="small"
                />
              }
              label={<Typography variant="body2">Solo mis recordatorios</Typography>}
            />

            {(filterPrioridad || filterTipo || filterUsuarioId || soloMios || datePreset !== 'todos') && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => {
                  setDatePreset('todos');
                  setFilterPrioridad('');
                  setFilterTipo('');
                  setFilterUsuarioId('');
                  setSoloMios(false);
                  setCustomFechaDesde('');
                  setCustomFechaHasta('');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* ── Table ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : recordatorios.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: 'success.light', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">
            No hay recordatorios pendientes
          </Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            {datePreset !== 'todos' || filterPrioridad || filterTipo || filterUsuarioId || soloMios
              ? 'Pruebe cambiando los filtros.'
              : '¡Excelente trabajo! Todo al día.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
          <Table size="small" stickyHeader sx={{ minWidth: 880 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo / Mensaje</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lead</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Asesor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recordatorios.map((rec) => {
                const bgColor = getRowBgColor(rec.fechaRecordatorio);
                const esVencido = rec.fechaRecordatorio < today;
                const esHoy = rec.fechaRecordatorio === today;
                const leadNombre = getLeadNombre(rec);
                const telefono = getLeadTelefono(rec);

                return (
                  <TableRow
                    key={rec.id}
                    hover
                    sx={{
                      bgcolor: bgColor,
                      '&:hover': { filter: 'brightness(0.97)' },
                    }}
                  >
                    {/* Fecha */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <Box sx={{ pt: '2px' }}>
                          {esVencido && (
                            <Tooltip title="Vencido">
                              <WarningIcon fontSize="small" color="error" />
                            </Tooltip>
                          )}
                          {esHoy && !esVencido && (
                            <Tooltip title="Para hoy">
                              <TodayIcon fontSize="small" color="warning" />
                            </Tooltip>
                          )}
                        </Box>
                        <Box>
                          <Typography
                            variant="body2"
                            fontWeight={esHoy || esVencido ? 700 : 400}
                            color={esVencido ? 'error.main' : esHoy ? 'warning.dark' : 'text.primary'}
                          >
                            {formatDateDisplay(rec.fechaRecordatorio)}
                          </Typography>
                          {rec.hora && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {rec.hora} hs
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Tipo (solo icono) + prioridad + mensaje */}
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Tooltip title={TIPO_RECORDATORIO_LABELS[rec.tipo] ?? rec.tipo} placement="top">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            {TIPO_RECORDATORIO_ICONS[rec.tipo]}
                          </Box>
                        </Tooltip>
                        <Tooltip title={rec.mensaje ?? ''} placement="top">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color="text.primary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 240,
                            }}
                          >
                            {rec.mensaje || <span style={{ color: '#bbb', fontWeight: 400 }}>Sin mensaje</span>}
                          </Typography>
                        </Tooltip>
                        {rec.prioridad && (
                          <Chip
                            label={PRIORIDAD_RECORDATORIO_LABELS[rec.prioridad] ?? rec.prioridad}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.62rem',
                              bgcolor: PRIORIDAD_RECORDATORIO_COLORS[rec.prioridad] ?? '#9CA3AF',
                              color: 'white',
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    {/* Lead */}
                    <TableCell sx={{ maxWidth: 160 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={leadNombre}
                      >
                        {leadNombre}
                      </Typography>
                      {rec.lead?.email && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={rec.lead.email}
                        >
                          {rec.lead.email}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Asesor (solo nombre) */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        {usuarioPrimerNombre(rec.usuarioId)}
                      </Typography>
                    </TableCell>

                    {/* Teléfono */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {telefono !== '-' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Link
                            href={`tel:${telefono}`}
                            underline="hover"
                            sx={{ fontSize: '0.875rem' }}
                          >
                            {telefono}
                          </Link>
                          <Tooltip title="WhatsApp">
                            <IconButton
                              size="small"
                              sx={{ color: '#25D366', p: 0.25 }}
                              onClick={() => openWhatsApp(telefono)}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>

                    {/* Estado (quick edit) */}
                    <TableCell>
                      {rec.lead?.estadoLead ? (
                        <EstadoQuickEdit
                          leadId={rec.leadId}
                          currentEstado={rec.lead.estadoLead}
                          options={ESTADOS_QUICK_EDIT}
                          onUpdate={handleUpdateEstado}
                          disabled={rec.lead.estadoLead === EstadoLeadEnum.CONVERTIDO}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>

                    {/* Prioridad (quick edit) */}
                    <TableCell>
                      <PriorityQuickEdit
                        leadId={rec.leadId}
                        currentPriority={rec.lead?.prioridad}
                        onUpdate={handleUpdatePrioridad}
                      />
                    </TableCell>

                    {/* Score 
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight={rec.lead?.score && rec.lead.score >= 70 ? 700 : 400}
                        color={
                          rec.lead?.score && rec.lead.score >= 70
                            ? 'success.main'
                            : rec.lead?.score && rec.lead.score >= 40
                            ? 'warning.main'
                            : 'text.secondary'
                        }
                      >
                        {rec.lead?.score ?? '-'}
                      </Typography>
                    </TableCell>*/}

                    {/* Acciones */}
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Marcar como completado">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleMarcarCompletado(rec)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Registrar interacción">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenInteraccion(rec)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Ver lead">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/leads/${rec.leadId}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Reprogramar">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenReprogramar(rec)}
                        >
                          <ScheduleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {recordatorios.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Mostrando {recordatorios.length} recordatorios
        </Typography>
      )}

      {/* ── Dialogs ── */}
      {selectedForInteraccion && (
        <InteraccionDialog
          open={interaccionOpen}
          leadId={selectedForInteraccion.leadId}
          leadNombre={getLeadNombre(selectedForInteraccion)}
          leadPrioridad={selectedForInteraccion.lead?.prioridad}
          onClose={() => {
            setInteraccionOpen(false);
            setSelectedForInteraccion(null);
          }}
          onSubmit={handleSubmitInteraccion}
        />
      )}

      <ReprogramarDialog
        open={reprogramarOpen}
        recordatorio={selectedForReprogramar}
        onClose={() => {
          setReprogramarOpen(false);
          setSelectedForReprogramar(null);
        }}
        onSubmit={handleSubmitReprogramar}
      />

      <NuevoRecordatorioDialog
        open={nuevoRecordatorioOpen}
        onClose={() => setNuevoRecordatorioOpen(false)}
        onSubmit={handleSubmitNuevoRecordatorio}
      />
    </Box>
  );
};

export default GestionGlobalRecordatoriosPage;
