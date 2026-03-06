import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Tabs,
  Tab,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  DirectionsCar as DirectionsCarIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorOutlineIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { vehiculoApi } from '../../api/services/vehiculoApi';
import { incidenciaVehiculoApi } from '../../api/services/incidenciaVehiculoApi';
import type {
  Vehiculo,
  IncidenciaVehiculoDTO,
  CreateIncidenciaVehiculoDTO,
  UpdateIncidenciaVehiculoDTO,
  TipoIncidenciaVehiculo,
  GravedadIncidencia,
  EstadoIncidencia,
} from '../../types';
import {
  TIPO_INCIDENCIA_LABELS,
  GRAVEDAD_INCIDENCIA_LABELS,
  ESTADO_INCIDENCIA_LABELS,
} from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
};

const getDaysUntil = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getVehiculoLabel = (v: Vehiculo) => `${v.patente} — ${v.marca} ${v.modelo} (${v.año})`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const GravedadChip: React.FC<{ gravedad: GravedadIncidencia }> = ({ gravedad }) => {
  const colorMap: Record<GravedadIncidencia, 'default' | 'warning' | 'error'> = {
    LEVE: 'default',
    MODERADA: 'warning',
    GRAVE: 'error',
    CRITICA: 'error',
  };
  return (
    <Chip
      label={GRAVEDAD_INCIDENCIA_LABELS[gravedad]}
      size="small"
      color={colorMap[gravedad]}
      sx={gravedad === 'CRITICA' ? { fontWeight: 700 } : undefined}
    />
  );
};

const EstadoChip: React.FC<{ estado: EstadoIncidencia }> = ({ estado }) => {
  const colorMap: Record<EstadoIncidencia, 'error' | 'warning' | 'success' | 'default'> = {
    ABIERTA: 'error',
    EN_PROCESO: 'warning',
    RESUELTA: 'success',
    CERRADA: 'default',
  };
  return (
    <Chip
      label={ESTADO_INCIDENCIA_LABELS[estado]}
      size="small"
      color={colorMap[estado]}
    />
  );
};

interface StatCardProps {
  label: string;
  count: number;
  color: 'error' | 'warning' | 'primary' | 'success';
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, count, color, icon }) => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: 4, borderColor: `${color}.main` }}>
    <Box sx={{ color: `${color}.main` }}>{icon}</Box>
    <Box>
      <Typography variant="h5" fontWeight={700} color={`${color}.main`}>{count}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  </Paper>
);

const getRowBgByGravedad = (gravedad: GravedadIncidencia, estado: EstadoIncidencia): string => {
  if (estado === 'RESUELTA' || estado === 'CERRADA') return 'transparent';
  if (gravedad === 'CRITICA') return 'error.50';
  if (gravedad === 'GRAVE') return 'warning.50';
  return 'transparent';
};

// ─── Resolver Dialog ──────────────────────────────────────────────────────────

interface ResolverDialogProps {
  open: boolean;
  incidencia: IncidenciaVehiculoDTO | null;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateIncidenciaVehiculoDTO) => Promise<void>;
}

const ResolverDialog: React.FC<ResolverDialogProps> = ({ open, incidencia, onClose, onSubmit }) => {
  const [estado, setEstado] = useState<EstadoIncidencia>('RESUELTA');
  const [fechaResolucion, setFechaResolucion] = useState(getTodayStr());
  const [observaciones, setObservaciones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setEstado('RESUELTA');
    setFechaResolucion(getTodayStr());
    setObservaciones('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!incidencia?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(incidencia.id, {
        estado,
        fechaResolucion,
        observacionesResolucion: observaciones || undefined,
      });
      handleClose();
    } catch {
      setError('Error al resolver la incidencia. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Resolver Incidencia</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <FormControl fullWidth size="small">
            <InputLabel>Estado final</InputLabel>
            <Select value={estado} label="Estado final" onChange={(e) => setEstado(e.target.value as EstadoIncidencia)}>
              <MenuItem value="RESUELTA">Resuelta</MenuItem>
              <MenuItem value="CERRADA">Cerrada</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Fecha de resolución"
            type="date"
            fullWidth
            size="small"
            value={fechaResolucion}
            onChange={(e) => setFechaResolucion(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Observaciones"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="¿Cómo se resolvió?"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
        >
          Resolver
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Incidencia Form Dialog ───────────────────────────────────────────────────

interface IncidenciaFormDialogProps {
  open: boolean;
  vehiculos: Vehiculo[];
  incidencia: IncidenciaVehiculoDTO | null;
  defaultVehiculo?: Vehiculo | null;
  onClose: () => void;
  onSubmit: (data: CreateIncidenciaVehiculoDTO | UpdateIncidenciaVehiculoDTO, id?: number) => Promise<void>;
}

const TIPO_OPTIONS = Object.keys(TIPO_INCIDENCIA_LABELS) as TipoIncidenciaVehiculo[];
const GRAVEDAD_OPTIONS = Object.keys(GRAVEDAD_INCIDENCIA_LABELS) as GravedadIncidencia[];
const ESTADO_OPTIONS = Object.keys(ESTADO_INCIDENCIA_LABELS) as EstadoIncidencia[];

const TIPOS_CON_EXPEDIENTE: TipoIncidenciaVehiculo[] = ['ACCIDENTE', 'INFRACCION_TRANSITO'];

const defaultForm = (): {
  tipo: TipoIncidenciaVehiculo;
  gravedad: GravedadIncidencia;
  estado: EstadoIncidencia;
  fecha: string;
  kmVehiculo: number | '';
  lugar: string;
  descripcion: string;
  numeroExpediente: string;
  terceroInvolucrado: string;
  fechaVencimientoDoc: string;
  fechaResolucion: string;
  observacionesResolucion: string;
} => ({
  tipo: 'FALLA_MECANICA',
  gravedad: 'LEVE',
  estado: 'ABIERTA',
  fecha: getTodayStr(),
  kmVehiculo: '',
  lugar: '',
  descripcion: '',
  numeroExpediente: '',
  terceroInvolucrado: '',
  fechaVencimientoDoc: '',
  fechaResolucion: '',
  observacionesResolucion: '',
});

const IncidenciaFormDialog: React.FC<IncidenciaFormDialogProps> = ({
  open,
  vehiculos,
  incidencia,
  defaultVehiculo,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!incidencia;
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (isEdit && incidencia) {
      setForm({
        tipo: incidencia.tipo,
        gravedad: incidencia.gravedad,
        estado: incidencia.estado,
        fecha: incidencia.fecha?.split('T')[0] ?? getTodayStr(),
        kmVehiculo: incidencia.kmVehiculo ?? '',
        lugar: incidencia.lugar ?? '',
        descripcion: incidencia.descripcion,
        numeroExpediente: incidencia.numeroExpediente ?? '',
        terceroInvolucrado: incidencia.terceroInvolucrado ?? '',
        fechaVencimientoDoc: incidencia.fechaVencimientoDoc ?? '',
        fechaResolucion: incidencia.fechaResolucion ?? '',
        observacionesResolucion: incidencia.observacionesResolucion ?? '',
      });
    } else {
      setForm(defaultForm());
      setSelectedVehiculo(defaultVehiculo ?? null);
    }
    setFormError(null);
  }, [open, incidencia, defaultVehiculo, isEdit]);

  const set = <K extends keyof ReturnType<typeof defaultForm>>(key: K, val: ReturnType<typeof defaultForm>[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showExpediente = TIPOS_CON_EXPEDIENTE.includes(form.tipo);
  const showVencimientoDoc = form.tipo === 'VENCIMIENTO_DOCUMENTACION';
  const showResolucion = form.estado === 'RESUELTA' || form.estado === 'CERRADA';

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.descripcion.trim()) {
      setFormError('La descripción es requerida.');
      return;
    }
    if (!isEdit && !selectedVehiculo?.id) {
      setFormError('Seleccione un vehículo.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (isEdit && incidencia) {
        const data: UpdateIncidenciaVehiculoDTO = {
          tipo: form.tipo,
          gravedad: form.gravedad,
          estado: form.estado,
          fecha: form.fecha,
          kmVehiculo: form.kmVehiculo !== '' ? Number(form.kmVehiculo) : undefined,
          lugar: form.lugar || undefined,
          descripcion: form.descripcion.trim(),
          numeroExpediente: showExpediente && form.numeroExpediente ? form.numeroExpediente : undefined,
          terceroInvolucrado: showExpediente && form.terceroInvolucrado ? form.terceroInvolucrado : undefined,
          fechaVencimientoDoc: showVencimientoDoc && form.fechaVencimientoDoc ? form.fechaVencimientoDoc : undefined,
          fechaResolucion: showResolucion && form.fechaResolucion ? form.fechaResolucion : undefined,
          observacionesResolucion: showResolucion && form.observacionesResolucion ? form.observacionesResolucion : undefined,
        };
        await onSubmit(data, incidencia.id);
      } else {
        const data: CreateIncidenciaVehiculoDTO = {
          vehiculoId: selectedVehiculo!.id,
          tipo: form.tipo,
          gravedad: form.gravedad,
          fecha: form.fecha,
          kmVehiculo: form.kmVehiculo !== '' ? Number(form.kmVehiculo) : undefined,
          lugar: form.lugar || undefined,
          descripcion: form.descripcion.trim(),
          numeroExpediente: showExpediente && form.numeroExpediente ? form.numeroExpediente : undefined,
          terceroInvolucrado: showExpediente && form.terceroInvolucrado ? form.terceroInvolucrado : undefined,
          fechaVencimientoDoc: showVencimientoDoc && form.fechaVencimientoDoc ? form.fechaVencimientoDoc : undefined,
        };
        await onSubmit(data);
      }
      handleClose();
    } catch {
      setFormError('Error al guardar. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Editar Incidencia' : 'Nueva Incidencia'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={0.5}>
          {formError && <Alert severity="error">{formError}</Alert>}

          {/* Vehículo — solo en alta */}
          {!isEdit && (
            <Autocomplete
              options={vehiculos}
              value={selectedVehiculo}
              onChange={(_, v) => setSelectedVehiculo(v)}
              getOptionLabel={getVehiculoLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField {...params} label="Vehículo *" size="small" />
              )}
            />
          )}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo *</InputLabel>
                <Select value={form.tipo} label="Tipo *" onChange={(e) => set('tipo', e.target.value as TipoIncidenciaVehiculo)}>
                  {TIPO_OPTIONS.map((k) => (
                    <MenuItem key={k} value={k}>{TIPO_INCIDENCIA_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Gravedad *</InputLabel>
                <Select value={form.gravedad} label="Gravedad *" onChange={(e) => set('gravedad', e.target.value as GravedadIncidencia)}>
                  {GRAVEDAD_OPTIONS.map((k) => (
                    <MenuItem key={k} value={k}>{GRAVEDAD_INCIDENCIA_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={isEdit ? 6 : 6}>
              <TextField
                label="Fecha *"
                type="date"
                fullWidth
                size="small"
                value={form.fecha}
                onChange={(e) => set('fecha', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Km vehículo"
                type="number"
                fullWidth
                size="small"
                value={form.kmVehiculo}
                onChange={(e) => set('kmVehiculo', e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          {isEdit && (
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={form.estado} label="Estado" onChange={(e) => set('estado', e.target.value as EstadoIncidencia)}>
                {ESTADO_OPTIONS.map((k) => (
                  <MenuItem key={k} value={k}>{ESTADO_INCIDENCIA_LABELS[k]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Lugar"
            fullWidth
            size="small"
            value={form.lugar}
            onChange={(e) => set('lugar', e.target.value)}
            placeholder="Ej: Ruta 9 km 45"
          />

          <TextField
            label="Descripción *"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Descripción detallada de la incidencia"
          />

          {showExpediente && (
            <>
              <Divider />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="N° Expediente"
                    fullWidth
                    size="small"
                    value={form.numeroExpediente}
                    onChange={(e) => set('numeroExpediente', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Tercero involucrado"
                    fullWidth
                    size="small"
                    value={form.terceroInvolucrado}
                    onChange={(e) => set('terceroInvolucrado', e.target.value)}
                    placeholder="Nombre / dominio"
                  />
                </Grid>
              </Grid>
            </>
          )}

          {showVencimientoDoc && (
            <>
              <Divider />
              <TextField
                label="Fecha vencimiento documento"
                type="date"
                fullWidth
                size="small"
                value={form.fechaVencimientoDoc}
                onChange={(e) => set('fechaVencimientoDoc', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}

          {isEdit && showResolucion && (
            <>
              <Divider />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Fecha resolución"
                    type="date"
                    fullWidth
                    size="small"
                    value={form.fechaResolucion}
                    onChange={(e) => set('fechaResolucion', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Observaciones resolución"
                    fullWidth
                    size="small"
                    value={form.observacionesResolucion}
                    onChange={(e) => set('observacionesResolucion', e.target.value)}
                  />
                </Grid>
              </Grid>
            </>
          )}
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
          {isEdit ? 'Guardar cambios' : 'Crear incidencia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteProps> = ({ open, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false);
  const handleConfirm = async () => {
    setSubmitting(true);
    try { await onConfirm(); onClose(); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Eliminar incidencia</DialogTitle>
      <DialogContent>
        <Typography>¿Estás seguro de que deseas eliminar esta incidencia? Esta acción no se puede deshacer.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>Cancelar</Button>
        <Button onClick={handleConfirm} color="error" variant="contained" disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <DeleteIcon />}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Incidencias Table ────────────────────────────────────────────────────────

interface IncidenciasTableProps {
  rows: IncidenciaVehiculoDTO[];
  showVehiculo?: boolean;
  onEdit?: (inc: IncidenciaVehiculoDTO) => void;
  onResolve?: (inc: IncidenciaVehiculoDTO) => void;
  onDelete?: (inc: IncidenciaVehiculoDTO) => void;
}

const IncidenciasTable: React.FC<IncidenciasTableProps> = ({
  rows,
  showVehiculo = false,
  onEdit,
  onResolve,
  onDelete,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const paginated = useMemo(
    () => rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [rows, page, rowsPerPage]
  );

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Fecha</TableCell>
            {showVehiculo && <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>}
            <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Gravedad</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Lugar</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((inc) => {
            const bgColor = getRowBgByGravedad(inc.gravedad, inc.estado);
            const isResuelto = inc.estado === 'RESUELTA' || inc.estado === 'CERRADA';
            return (
              <TableRow
                key={inc.id}
                hover
                sx={{ bgcolor: bgColor, '&:hover': { filter: 'brightness(0.97)' } }}
              >
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">{formatDate(inc.fecha)}</Typography>
                  {inc.kmVehiculo != null && (
                    <Typography variant="caption" color="text.secondary">{inc.kmVehiculo.toLocaleString()} km</Typography>
                  )}
                </TableCell>
                {showVehiculo && (
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" fontWeight={600}>
                      {inc.vehiculo?.patente ?? `#${inc.vehiculoId}`}
                    </Typography>
                    {inc.vehiculo && (
                      <Typography variant="caption" color="text.secondary">
                        {inc.vehiculo.marca} {inc.vehiculo.modelo}
                      </Typography>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2">{TIPO_INCIDENCIA_LABELS[inc.tipo] ?? inc.tipo}</Typography>
                  {inc.numeroExpediente && (
                    <Typography variant="caption" color="text.secondary">Exp: {inc.numeroExpediente}</Typography>
                  )}
                </TableCell>
                <TableCell><GravedadChip gravedad={inc.gravedad} /></TableCell>
                <TableCell><EstadoChip estado={inc.estado} /></TableCell>
                <TableCell>
                  <Typography variant="body2" color={inc.lugar ? 'text.primary' : 'text.disabled'}>
                    {inc.lugar || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 240 }}>
                  <Tooltip title={inc.descripcion} placement="top">
                    <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                      {inc.descripcion}
                    </Typography>
                  </Tooltip>
                  {inc.fechaVencimientoDoc && (
                    <Typography variant="caption" color="warning.dark">
                      Vence: {formatDate(inc.fechaVencimientoDoc)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  {onEdit && (
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit(inc)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onResolve && !isResuelto && (
                    <Tooltip title="Resolver / Cerrar">
                      <IconButton size="small" color="success" onClick={() => onResolve(inc)}>
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => onDelete(inc)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Filas:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      />
    </TableContainer>
  );
};

// ─── Tab: Legajo por vehículo ─────────────────────────────────────────────────

interface TabLegajoProps {
  vehiculos: Vehiculo[];
  onMutation: () => void;
}

const TabLegajo: React.FC<TabLegajoProps> = ({ vehiculos, onMutation }) => {
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaVehiculoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterEstado, setFilterEstado] = useState<EstadoIncidencia | ''>('');
  const [filterTipo, setFilterTipo] = useState<TipoIncidenciaVehiculo | ''>('');
  const [filterGravedad, setFilterGravedad] = useState<GravedadIncidencia | ''>('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IncidenciaVehiculoDTO | null>(null);
  const [resolverTarget, setResolverTarget] = useState<IncidenciaVehiculoDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IncidenciaVehiculoDTO | null>(null);

  // Feedback
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const loadIncidencias = useCallback(async (vehiculo: Vehiculo) => {
    setLoading(true);
    setError(null);
    try {
      const res = await incidenciaVehiculoApi.getByVehiculo(vehiculo.id, { size: 200 });
      setIncidencias(res.content);
    } catch {
      setError('Error al cargar las incidencias del vehículo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVehiculo) loadIncidencias(selectedVehiculo);
    else setIncidencias([]);
  }, [selectedVehiculo, loadIncidencias]);

  const filtered = useMemo(() => {
    return incidencias.filter((inc) => {
      if (filterEstado && inc.estado !== filterEstado) return false;
      if (filterTipo && inc.tipo !== filterTipo) return false;
      if (filterGravedad && inc.gravedad !== filterGravedad) return false;
      return true;
    });
  }, [incidencias, filterEstado, filterTipo, filterGravedad]);

  const stats = useMemo(() => ({
    total: incidencias.length,
    abiertas: incidencias.filter((i) => i.estado === 'ABIERTA' || i.estado === 'EN_PROCESO').length,
    criticas: incidencias.filter((i) => (i.gravedad === 'GRAVE' || i.gravedad === 'CRITICA') && i.estado !== 'RESUELTA' && i.estado !== 'CERRADA').length,
  }), [incidencias]);

  const handleFormSubmit = async (data: CreateIncidenciaVehiculoDTO | UpdateIncidenciaVehiculoDTO, id?: number) => {
    if (id) {
      await incidenciaVehiculoApi.update(id, data as UpdateIncidenciaVehiculoDTO);
      showSuccess('Incidencia actualizada.');
    } else {
      await incidenciaVehiculoApi.create(data as CreateIncidenciaVehiculoDTO);
      showSuccess('Incidencia creada.');
    }
    if (selectedVehiculo) await loadIncidencias(selectedVehiculo);
    onMutation();
  };

  const handleResolve = async (id: number, data: UpdateIncidenciaVehiculoDTO) => {
    await incidenciaVehiculoApi.update(id, data);
    showSuccess('Incidencia resuelta.');
    if (selectedVehiculo) await loadIncidencias(selectedVehiculo);
    onMutation();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await incidenciaVehiculoApi.delete(deleteTarget.id);
    showSuccess('Incidencia eliminada.');
    if (selectedVehiculo) await loadIncidencias(selectedVehiculo);
    onMutation();
  };

  const hasFilters = filterEstado !== '' || filterTipo !== '' || filterGravedad !== '';

  return (
    <Box>
      {/* Vehicle selector */}
      <Box sx={{ mb: 2, maxWidth: 480 }}>
        <Autocomplete
          options={vehiculos}
          value={selectedVehiculo}
          onChange={(_, v) => setSelectedVehiculo(v)}
          getOptionLabel={getVehiculoLabel}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderOption={(props, option) => (
            <li {...props}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{option.patente}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.marca} {option.modelo} ({option.año})
                  {option.incidenciasAbiertas != null && option.incidenciasAbiertas > 0 && (
                    <Chip
                      label={`${option.incidenciasAbiertas} abiertas`}
                      size="small"
                      color="error"
                      sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                    />
                  )}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Seleccionar vehículo" placeholder="Buscar por patente, marca o modelo..." />
          )}
        />
      </Box>

      {selectedVehiculo && (
        <>
          {/* Stats */}
          {incidencias.length > 0 && (
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <StatCard label="Total incidencias" count={stats.total} color="primary" icon={<DirectionsCarIcon />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard label="Abiertas / En proceso" count={stats.abiertas} color="error" icon={<ErrorOutlineIcon />} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard label="Graves / Críticas activas" count={stats.criticas} color="warning" icon={<WarningIcon />} />
              </Grid>
            </Grid>
          )}

          {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Toolbar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Estado</InputLabel>
                <Select value={filterEstado} label="Estado" onChange={(e) => setFilterEstado(e.target.value as EstadoIncidencia | '')}>
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {(Object.keys(ESTADO_INCIDENCIA_LABELS) as EstadoIncidencia[]).map((k) => (
                    <MenuItem key={k} value={k}>{ESTADO_INCIDENCIA_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Tipo</InputLabel>
                <Select value={filterTipo} label="Tipo" onChange={(e) => setFilterTipo(e.target.value as TipoIncidenciaVehiculo | '')}>
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {(Object.keys(TIPO_INCIDENCIA_LABELS) as TipoIncidenciaVehiculo[]).map((k) => (
                    <MenuItem key={k} value={k}>{TIPO_INCIDENCIA_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Gravedad</InputLabel>
                <Select value={filterGravedad} label="Gravedad" onChange={(e) => setFilterGravedad(e.target.value as GravedadIncidencia | '')}>
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {(Object.keys(GRAVEDAD_INCIDENCIA_LABELS) as GravedadIncidencia[]).map((k) => (
                    <MenuItem key={k} value={k}>{GRAVEDAD_INCIDENCIA_LABELS[k]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {hasFilters && (
                <Button size="small" color="inherit" onClick={() => { setFilterEstado(''); setFilterTipo(''); setFilterGravedad(''); }}>
                  Limpiar filtros
                </Button>
              )}
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
            >
              Nueva incidencia
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                {incidencias.length === 0 ? 'Sin incidencias registradas' : 'Sin resultados para los filtros aplicados'}
              </Typography>
            </Paper>
          ) : (
            <IncidenciasTable
              rows={filtered}
              onEdit={(inc) => { setEditTarget(inc); setFormOpen(true); }}
              onResolve={(inc) => setResolverTarget(inc)}
              onDelete={(inc) => setDeleteTarget(inc)}
            />
          )}
        </>
      )}

      {!selectedVehiculo && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <DirectionsCarIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Seleccione un vehículo</Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            Elija un vehículo del selector para ver su legajo de incidencias.
          </Typography>
        </Paper>
      )}

      {/* Dialogs */}
      <IncidenciaFormDialog
        open={formOpen}
        vehiculos={vehiculos}
        incidencia={editTarget}
        defaultVehiculo={selectedVehiculo}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={handleFormSubmit}
      />
      <ResolverDialog
        open={!!resolverTarget}
        incidencia={resolverTarget}
        onClose={() => setResolverTarget(null)}
        onSubmit={handleResolve}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

// ─── Tab: Incidencias Abiertas ────────────────────────────────────────────────

interface TabAbiertasProps {
  vehiculos: Vehiculo[];
  onMutation: () => void;
}

const TabAbiertas: React.FC<TabAbiertasProps> = ({ vehiculos, onMutation }) => {
  const [incidencias, setIncidencias] = useState<IncidenciaVehiculoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IncidenciaVehiculoDTO | null>(null);
  const [resolverTarget, setResolverTarget] = useState<IncidenciaVehiculoDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IncidenciaVehiculoDTO | null>(null);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidenciaVehiculoApi.getAbiertas();
      setIncidencias(data);
    } catch {
      setError('Error al cargar las incidencias abiertas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFormSubmit = async (data: CreateIncidenciaVehiculoDTO | UpdateIncidenciaVehiculoDTO, id?: number) => {
    if (id) {
      await incidenciaVehiculoApi.update(id, data as UpdateIncidenciaVehiculoDTO);
      showSuccess('Incidencia actualizada.');
    } else {
      await incidenciaVehiculoApi.create(data as CreateIncidenciaVehiculoDTO);
      showSuccess('Incidencia creada.');
    }
    await load();
    onMutation();
  };

  const handleResolve = async (id: number, data: UpdateIncidenciaVehiculoDTO) => {
    await incidenciaVehiculoApi.update(id, data);
    showSuccess('Incidencia resuelta.');
    await load();
    onMutation();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await incidenciaVehiculoApi.delete(deleteTarget.id);
    showSuccess('Incidencia eliminada.');
    await load();
    onMutation();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {incidencias.length} incidencia{incidencias.length !== 1 ? 's' : ''} abierta{incidencias.length !== 1 ? 's' : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            Nueva incidencia
          </Button>
          <Tooltip title="Actualizar">
            <span>
              <IconButton onClick={load} disabled={loading} size="small">
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : incidencias.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Sin incidencias abiertas</Typography>
          <Typography variant="body2" color="text.disabled">¡Toda la flota al día!</Typography>
        </Paper>
      ) : (
        <IncidenciasTable
          rows={incidencias}
          showVehiculo
          onEdit={(inc) => { setEditTarget(inc); setFormOpen(true); }}
          onResolve={(inc) => setResolverTarget(inc)}
          onDelete={(inc) => setDeleteTarget(inc)}
        />
      )}

      <IncidenciaFormDialog
        open={formOpen}
        vehiculos={vehiculos}
        incidencia={editTarget}
        defaultVehiculo={null}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={handleFormSubmit}
      />
      <ResolverDialog
        open={!!resolverTarget}
        incidencia={resolverTarget}
        onClose={() => setResolverTarget(null)}
        onSubmit={handleResolve}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
};

// ─── Tab: Alertas de Vencimientos ─────────────────────────────────────────────

const TabVencimientos: React.FC = () => {
  const [dias, setDias] = useState(30);
  const [incidencias, setIncidencias] = useState<IncidenciaVehiculoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidenciaVehiculoApi.getVencimientos(d);
      setIncidencias(data);
    } catch {
      setError('Error al cargar alertas de vencimientos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(dias); }, [load, dias]);

  const today = getTodayStr();

  const getVencimientoRowBg = (fecha: string) => {
    const days = getDaysUntil(fecha);
    if (days < 0) return 'error.50';
    if (days <= 7) return 'warning.50';
    return 'transparent';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">Mostrar vencimientos en los próximos:</Typography>
          {[7, 15, 30, 60].map((d) => (
            <Chip
              key={d}
              label={`${d} días`}
              size="small"
              onClick={() => setDias(d)}
              variant={dias === d ? 'filled' : 'outlined'}
              color={dias === d ? 'primary' : 'default'}
            />
          ))}
        </Box>
        <Tooltip title="Actualizar">
          <span>
            <IconButton onClick={() => load(dias)} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : incidencias.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Sin vencimientos próximos</Typography>
          <Typography variant="body2" color="text.disabled" mt={0.5}>
            No hay documentación a vencer en los próximos {dias} días.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Fecha vencimiento</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Días restantes</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidencias.map((inc) => {
                const vence = inc.fechaVencimientoDoc ?? '';
                const daysLeft = vence ? getDaysUntil(vence) : null;
                const bgColor = vence ? getVencimientoRowBg(vence) : 'transparent';
                const expired = daysLeft != null && daysLeft < 0;
                const urgent = daysLeft != null && daysLeft >= 0 && daysLeft <= 7;
                return (
                  <TableRow key={inc.id} hover sx={{ bgcolor: bgColor, '&:hover': { filter: 'brightness(0.97)' } }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600}>
                        {inc.vehiculo?.patente ?? `#${inc.vehiculoId}`}
                      </Typography>
                      {inc.vehiculo && (
                        <Typography variant="caption" color="text.secondary">
                          {inc.vehiculo.marca} {inc.vehiculo.modelo}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{inc.descripcion}</Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography
                        variant="body2"
                        fontWeight={expired || urgent ? 700 : 400}
                        color={expired ? 'error.main' : urgent ? 'warning.dark' : 'text.primary'}
                      >
                        {formatDate(vence)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {daysLeft != null ? (
                        <Chip
                          label={daysLeft < 0 ? `Vencido hace ${Math.abs(daysLeft)}d` : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`}
                          size="small"
                          color={expired ? 'error' : urgent ? 'warning' : 'default'}
                          sx={expired || urgent ? { fontWeight: 700 } : undefined}
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell><EstadoChip estado={inc.estado} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const IncidenciasVehiculoPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);
  const [vehiculosError, setVehiculosError] = useState<string | null>(null);

  // Global stat for the header badge (total open)
  const [totalAbiertas, setTotalAbiertas] = useState<number | null>(null);

  const loadVehiculos = useCallback(async () => {
    setLoadingVehiculos(true);
    setVehiculosError(null);
    try {
      const res = await vehiculoApi.getAll({ size: 500 });
      setVehiculos(res.content);
    } catch {
      setVehiculosError('Error al cargar la lista de vehículos.');
    } finally {
      setLoadingVehiculos(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const data = await incidenciaVehiculoApi.getAbiertas();
      setTotalAbiertas(data.length);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    loadVehiculos();
    refreshStats();
  }, [loadVehiculos, refreshStats]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Legajo de Vehículos
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Incidencias, historial y alertas de documentación por vehículo
          </Typography>
        </Box>
        {totalAbiertas != null && totalAbiertas > 0 && (
          <Chip
            icon={<NotificationsActiveIcon />}
            label={`${totalAbiertas} incidencia${totalAbiertas !== 1 ? 's' : ''} abierta${totalAbiertas !== 1 ? 's' : ''}`}
            color="error"
            variant="outlined"
          />
        )}
      </Box>

      {vehiculosError && <Alert severity="error" sx={{ mb: 2 }}>{vehiculosError}</Alert>}

      {loadingVehiculos ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 2 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Legajo por vehículo" icon={<DirectionsCarIcon />} iconPosition="start" />
              <Tab
                label={
                  totalAbiertas != null && totalAbiertas > 0
                    ? `Incidencias abiertas (${totalAbiertas})`
                    : 'Incidencias abiertas'
                }
                icon={<ErrorOutlineIcon />}
                iconPosition="start"
              />
              <Tab label="Alertas de vencimientos" icon={<WarningIcon />} iconPosition="start" />
            </Tabs>
          </Paper>

          <Box>
            {tab === 0 && (
              <TabLegajo vehiculos={vehiculos} onMutation={refreshStats} />
            )}
            {tab === 1 && (
              <TabAbiertas vehiculos={vehiculos} onMutation={refreshStats} />
            )}
            {tab === 2 && (
              <TabVencimientos />
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default IncidenciasVehiculoPage;
