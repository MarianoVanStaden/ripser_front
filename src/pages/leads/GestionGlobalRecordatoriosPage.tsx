import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  TablePagination,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
  Link,
  Autocomplete,
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
  Chat as ChatIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  LocalFireDepartment as FireIcon,
  AcUnit as ColdIcon,
  Whatshot as HotIcon,
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useNavigate } from 'react-router-dom';
import { useRecordatoriosLeads } from '../../hooks/useRecordatoriosLeads';
import { LeadStatusBadge } from '../../components/leads/LeadStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import {
  TipoRecordatorioEnum,
  PrioridadLeadEnum,
  PrioridadRecordatorioEnum,
  TipoInteraccionEnum,
  ResultadoInteraccionEnum,
  PRIORIDAD_LABELS,
  TIPO_INTERACCION_LABELS,
  RESULTADO_INTERACCION_LABELS,
  EstadoLeadEnum,
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
import type {
  RecordatorioConLeadDTO,
  RecordatorioGlobalFilterParams,
} from '../../api/services/recordatorioLeadApi';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

type DatePreset = 'hoy' | 'mañana' | 'semana' | 'vencidos' | 'personalizado' | 'todos';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'vencidos', label: 'Vencidos' },
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

interface PrioridadBadgeProps {
  prioridad?: PrioridadType;
}

const PrioridadBadge: React.FC<PrioridadBadgeProps> = ({ prioridad }) => {
  if (!prioridad) return <Typography variant="body2" color="text.disabled">-</Typography>;

  const colorMap: Record<string, 'error' | 'warning' | 'default'> = {
    HOT: 'error',
    WARM: 'warning',
    COLD: 'default',
  };

  return (
    <Chip
      label={PRIORIDAD_LABELS[prioridad]}
      size="small"
      color={colorMap[prioridad] ?? 'default'}
      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
};

// ─── Interacción Dialog ───────────────────────────────────────────────────────

interface InteraccionDialogProps {
  open: boolean;
  leadId: number;
  leadNombre: string;
  onClose: () => void;
  onSubmit: (leadId: number, data: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>) => Promise<void>;
}

const InteraccionDialog: React.FC<InteraccionDialogProps> = ({
  open,
  leadId,
  leadNombre,
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

  const handleSubmit = async () => {
    if (!form.descripcion.trim()) {
      setFormError('La descripción es requerida.');
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
      });
      handleClose();
    } catch {
      setFormError('Error al registrar la interacción. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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

          <Divider />

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
          disabled={submitting}
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
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
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
  const [leads, setLeads] = useState<LeadDTO[]>([]);
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

  // Load leads when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingLeads(true);
    leadApi.getAll({ page: 0, size: 300 })
      .then((res) => setLeads(res.content))
      .catch(() => setLeads([]))
      .finally(() => setLoadingLeads(false));
  }, [open]);

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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Nuevo Recordatorio
        <Typography variant="body2" color="text.secondary">
          Crear un recordatorio para cualquier lead
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Lead selector */}
          <Autocomplete
            options={leads}
            loading={loadingLeads}
            value={selectedLead}
            onChange={(_, value) => setSelectedLead(value)}
            getOptionLabel={getLeadLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Lead *"
                size="small"
                placeholder="Buscar por nombre o teléfono..."
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
  const { user } = useAuth();
  const { sucursalFiltro } = useTenant();
  const {
    recordatorios,
    conteos,
    loading,
    error,
    usingFallback,
    loadRecordatorios,
    marcarCompletado,
    reprogramar,
    crearInteraccion,
    crearRecordatorio,
  } = useRecordatoriosLeads();

  // ── UI state ──
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // ── Filter state ──
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [customFechaDesde, setCustomFechaDesde] = useState('');
  const [customFechaHasta, setCustomFechaHasta] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState<PrioridadType | ''>('');
  const [filterTipo, setFilterTipo] = useState<TipoRecordatorioType | ''>('');
  const [soloMios, setSoloMios] = useState(false);

  // ── Dialog state ──
  const [interaccionOpen, setInteraccionOpen] = useState(false);
  const [selectedForInteraccion, setSelectedForInteraccion] = useState<RecordatorioConLeadDTO | null>(null);
  const [reprogramarOpen, setReprogramarOpen] = useState(false);
  const [selectedForReprogramar, setSelectedForReprogramar] = useState<RecordatorioConLeadDTO | null>(null);
  const [nuevoRecordatorioOpen, setNuevoRecordatorioOpen] = useState(false);

  // ── Action feedback ──
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ── Auto-refresh ──
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load data ──
  const buildFilters = useCallback((): RecordatorioGlobalFilterParams => {
    const filters: RecordatorioGlobalFilterParams = { enviado: false };

    if (filterPrioridad) filters.prioridad = filterPrioridad;
    if (filterTipo) filters.tipo = filterTipo;
    if (soloMios && user?.id) filters.usuarioId = user.id;
    if (sucursalFiltro) filters.sucursalId = sucursalFiltro;

    const today = getTodayStr();
    switch (datePreset) {
      case 'hoy':
        filters.fechaDesde = today;
        filters.fechaHasta = today;
        break;
      case 'mañana':
        filters.fechaDesde = getDateStr(1);
        filters.fechaHasta = getDateStr(1);
        break;
      case 'semana':
        filters.fechaDesde = today;
        filters.fechaHasta = getWeekEndStr();
        break;
      case 'vencidos':
        filters.fechaHasta = getDateStr(-1);
        break;
      case 'personalizado':
        if (customFechaDesde) filters.fechaDesde = customFechaDesde;
        if (customFechaHasta) filters.fechaHasta = customFechaHasta;
        break;
      default:
        break;
    }
    return filters;
  }, [datePreset, customFechaDesde, customFechaHasta, filterPrioridad, filterTipo, soloMios, user, sucursalFiltro]);

  const refresh = useCallback(() => {
    setAutoRefreshCountdown(60);
    loadRecordatorios(buildFilters());
  }, [loadRecordatorios, buildFilters]);

  useEffect(() => {
    loadRecordatorios(buildFilters());
    setPage(0);
  }, [datePreset, filterPrioridad, filterTipo, soloMios, sucursalFiltro]);

  useEffect(() => {
    if (datePreset === 'personalizado' && (customFechaDesde || customFechaHasta)) {
      loadRecordatorios(buildFilters());
      setPage(0);
    }
  }, [customFechaDesde, customFechaHasta]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadRecordatorios(buildFilters());
      setAutoRefreshCountdown(60);
    }, 60000);

    countdownRef.current = setInterval(() => {
      setAutoRefreshCountdown((c) => (c > 0 ? c - 1 : 60));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [buildFilters]);

  // ── Stable today string for row coloring ──
  const today = getTodayStr();

  // ── Client-side pagination ──
  const paginatedRows = useMemo(() => {
    return recordatorios.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [recordatorios, page, rowsPerPage]);

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
    data: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>
  ) => {
    await crearInteraccion(leadId, data);
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

  const getLeadTelefono = (rec: RecordatorioConLeadDTO) => rec.lead?.telefono ?? '-';

  const openWhatsApp = (telefono: string) => {
    const phone = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

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
          <Typography variant="caption" color="text.secondary">
            Actualiza en {autoRefreshCountdown}s
          </Typography>
          <Tooltip title="Actualizar ahora">
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

            <FormControlLabel
              control={
                <Switch
                  checked={soloMios}
                  onChange={(e) => setSoloMios(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Solo mis recordatorios</Typography>}
            />

            {(filterPrioridad || filterTipo || soloMios || datePreset !== 'todos') && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => {
                  setDatePreset('todos');
                  setFilterPrioridad('');
                  setFilterTipo('');
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
            {datePreset !== 'todos'
              ? 'Pruebe cambiando los filtros de fecha.'
              : '¡Excelente trabajo! Todo al día.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mensaje</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lead</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((rec) => {
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

                    {/* Tipo + prioridad del recordatorio */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {TIPO_RECORDATORIO_ICONS[rec.tipo]}
                        <Typography variant="body2">
                          {TIPO_RECORDATORIO_LABELS[rec.tipo] ?? rec.tipo}
                        </Typography>
                      </Box>
                      {rec.prioridad && (
                        <Chip
                          label={PRIORIDAD_RECORDATORIO_LABELS[rec.prioridad] ?? rec.prioridad}
                          size="small"
                          sx={{
                            mt: 0.25,
                            height: 16,
                            fontSize: '0.62rem',
                            bgcolor: PRIORIDAD_RECORDATORIO_COLORS[rec.prioridad] ?? '#9CA3AF',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Mensaje */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={rec.mensaje ?? ''} placement="top">
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                          }}
                        >
                          {rec.mensaje || <span style={{ color: '#aaa' }}>Sin mensaje</span>}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    {/* Lead */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {leadNombre}
                      </Typography>
                      {rec.lead?.email && (
                        <Typography variant="caption" color="text.secondary">
                          {rec.lead.email}
                        </Typography>
                      )}
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

                    {/* Estado */}
                    <TableCell>
                      {rec.lead?.estadoLead ? (
                        <LeadStatusBadge status={rec.lead.estadoLead} />
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>

                    {/* Prioridad */}
                    <TableCell>
                      <PrioridadBadge prioridad={rec.lead?.prioridad} />
                    </TableCell>

                    {/* Score */}
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
                    </TableCell>

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

          <TablePagination
            component="div"
            count={recordatorios.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </TableContainer>
      )}

      {/* ── Dialogs ── */}
      {selectedForInteraccion && (
        <InteraccionDialog
          open={interaccionOpen}
          leadId={selectedForInteraccion.leadId}
          leadNombre={getLeadNombre(selectedForInteraccion)}
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
