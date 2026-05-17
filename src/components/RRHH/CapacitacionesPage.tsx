/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unused-vars */
// @ts-nocheck - Temporary: MUI v7 Grid compatibility issue - see MUI_V7_GRID_FIX.md
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  Stack,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  MenuItem,
  Grid,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Verified as CertifiedIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { capacitacionApi } from '../../api/services/capacitacionApi';
import { employeeApi } from '../../api/services/employeeApi';
import { areaApi } from '../../api/services/catalogosApi';
import type { Area } from '../../types/catalogos.types';
import {
  MOTIVO_CAPACITACION_LABEL,
  type Capacitacion,
  type Empleado,
  type MotivoCapacitacion,
} from '../../types';
import dayjs from 'dayjs';
import LoadingOverlay from '../common/LoadingOverlay';
import { generateCapacitacionPlanillaPdf } from '../../utils/capacitacionPlanillaPdf';

const MOTIVOS: MotivoCapacitacion[] = ['DNC', 'PAC', 'INDUCCION'];

const motivoColor = (m?: MotivoCapacitacion | null) => {
  switch (m) {
    case 'DNC': return 'warning';
    case 'PAC': return 'primary';
    case 'INDUCCION': return 'success';
    default: return 'default';
  }
};

const emptyForm = () => ({
  motivo: '' as MotivoCapacitacion | '',
  areaId: '' as number | '',
  actividad: '',
  nombre: '',
  objetivo: '',
  descripcion: '',
  institucion: '',
  capacitador: '',
  fechaInicio: dayjs().format('YYYY-MM-DD'),
  fechaFin: dayjs().add(1, 'week').format('YYYY-MM-DD'),
  horas: '',
  certificado: false,
  costo: '0',
  empleados: [] as Empleado[],
});

const empleadoLabel = (e: Empleado) => `${e.apellido}, ${e.nombre}${e.dni ? ` (${e.dni})` : ''}`;

const CapacitacionesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Capacitacion | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editing, setEditing] = useState<Capacitacion | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [motivoFilter, setMotivoFilter] = useState<MotivoCapacitacion | 'TODOS'>('TODOS');
  const [areaFilter, setAreaFilter] = useState<Area | null>(null);

  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [caps, emps, ars] = await Promise.all([
        capacitacionApi.getAll(),
        employeeApi.getAllList(),
        areaApi.list(true),
      ]);
      setCapacitaciones(Array.isArray(caps) ? caps : []);
      setEmpleados(Array.isArray(emps) ? emps : []);
      setAreas(Array.isArray(ars) ? ars : []);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const empleadosById = useMemo(() => {
    const m = new Map<number, Empleado>();
    empleados.forEach(e => m.set(e.id, e));
    return m;
  }, [empleados]);

  const filtered = capacitaciones.filter(c => {
    if (motivoFilter !== 'TODOS' && c.motivo !== motivoFilter) return false;
    if (areaFilter && c.areaId !== areaFilter.id) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const inText =
        c.nombre?.toLowerCase().includes(q) ||
        c.actividad?.toLowerCase().includes(q) ||
        c.institucion?.toLowerCase().includes(q) ||
        c.capacitador?.toLowerCase().includes(q);
      if (!inText) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm());
    setOpenForm(true);
  };

  const openEdit = (c: Capacitacion) => {
    setEditing(c);
    setFormData({
      motivo: c.motivo ?? '',
      areaId: c.areaId ?? '',
      actividad: c.actividad ?? '',
      nombre: c.nombre ?? '',
      objetivo: c.objetivo ?? '',
      descripcion: c.descripcion ?? '',
      institucion: c.institucion ?? '',
      capacitador: c.capacitador ?? '',
      fechaInicio: c.fechaInicio,
      fechaFin: c.fechaFin,
      horas: String(c.horas ?? ''),
      certificado: !!c.certificado,
      costo: String(c.costo ?? 0),
      empleados: (c.empleadoIds ?? [])
        .map(id => empleadosById.get(id))
        .filter(Boolean) as Empleado[],
    });
    setOpenForm(true);
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (!formData.nombre.trim()) {
        setError('El nombre de la capacitación es obligatorio'); return;
      }
      if (!formData.empleados.length) {
        setError('Seleccioná al menos un empleado'); return;
      }
      if (!formData.fechaInicio || !formData.fechaFin) {
        setError('Las fechas son obligatorias'); return;
      }
      const horas = parseInt(formData.horas) || 0;
      if (horas <= 0) { setError('Las horas deben ser mayor a 0'); return; }

      const payload: any = {
        motivo: formData.motivo || null,
        areaId: formData.areaId || null,
        actividad: formData.actividad.trim() || null,
        nombre: formData.nombre.trim(),
        objetivo: formData.objetivo.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        institucion: formData.institucion.trim() || null,
        capacitador: formData.capacitador.trim() || null,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        horas,
        certificado: formData.certificado,
        costo: parseFloat(formData.costo) || 0,
        empleadoIds: formData.empleados.map(e => e.id),
      };

      if (editing) {
        await capacitacionApi.update(editing.id, { ...payload, id: editing.id });
      } else {
        await capacitacionApi.create(payload);
      }

      await loadData();
      setOpenForm(false);
      setEditing(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la capacitación');
      console.error('Error saving capacitacion:', err);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setError(null);
      await capacitacionApi.delete(selected.id);
      await loadData();
      setOpenDelete(false);
      setSelected(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la capacitación');
      setOpenDelete(false);
    }
  };

  const downloadPlanilla = (c: Capacitacion) => {
    const asistencias = (c.asistencias?.length ? c.asistencias : (c.empleadoIds ?? []).map(id => {
      const e = empleadosById.get(id);
      return e
        ? { empleadoId: id, empleadoNombre: e.nombre, empleadoApellido: e.apellido, asistio: false }
        : { empleadoId: id, asistio: false };
    }));
    generateCapacitacionPlanillaPdf({ capacitacion: c, asistencias });
  };

  // Stats
  const totalHoras = filtered.reduce((s, c) => s + (c.horas || 0), 0);
  const totalCosto = filtered.reduce((s, c) => s + Number(c.costo || 0), 0);
  const totalEmpleadosCapacitados = new Set(
    filtered.flatMap(c => c.empleadoIds ?? [])
  ).size;
  const totalCertificados = filtered.filter(c => c.certificado).length;

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando capacitaciones..." />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Capacitaciones
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Tooltip title="Recargar">
            <IconButton onClick={loadData} color="primary"><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} fullWidth={isMobile}>
            Nueva Capacitación
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <SchoolIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">{filtered.length}</Typography>
                  <Typography variant="body2" color="textSecondary">Capacitaciones</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <GroupIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">{totalEmpleadosCapacitados}</Typography>
                  <Typography variant="body2" color="textSecondary">Empleados</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <TimeIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{totalHoras}h</Typography>
                  <Typography variant="body2" color="textSecondary">Horas Totales</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={{ xs: 1, sm: 2 }}>
                <MoneyIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    ${totalCosto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Inversión</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth size="small"
                label="Buscar"
                placeholder="Nombre, actividad, capacitador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth select size="small" label="Motivo"
                value={motivoFilter}
                onChange={(e) => setMotivoFilter(e.target.value as any)}
              >
                <MenuItem value="TODOS">Todos los motivos</MenuItem>
                {MOTIVOS.map(m => <MenuItem key={m} value={m}>{MOTIVO_CAPACITACION_LABEL[m]}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                size="small"
                options={areas}
                getOptionLabel={o => o.nombre}
                value={areaFilter}
                onChange={(_, v) => setAreaFilter(v)}
                renderInput={(p) => <TextField {...p} label="Área" />}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 900, md: 'auto' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 90 }}>Motivo</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Actividad / Nombre</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Área</TableCell>
                  <TableCell sx={{ minWidth: 130 }}>Capacitador</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Período</TableCell>
                  <TableCell align="center" sx={{ minWidth: 70 }}>Hs</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Particip.</TableCell>
                  <TableCell align="center" sx={{ minWidth: 160 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay capacitaciones registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      {c.motivo ? (
                        <Chip size="small" label={c.motivo} color={motivoColor(c.motivo) as any} />
                      ) : <Typography variant="body2" color="textSecondary">-</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">{c.actividad || c.nombre}</Typography>
                      {c.actividad && c.nombre && c.actividad !== c.nombre && (
                        <Typography variant="caption" color="textSecondary">{c.nombre}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.areaNombre ? <Chip size="small" variant="outlined" label={c.areaNombre} /> :
                        <Typography variant="body2" color="textSecondary">-</Typography>}
                    </TableCell>
                    <TableCell>{c.capacitador || <Typography variant="body2" color="textSecondary">-</Typography>}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(c.fechaInicio).format('DD/MM/YYYY')} - {dayjs(c.fechaFin).format('DD/MM/YYYY')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip icon={<TimeIcon />} label={`${c.horas}h`} size="small" color="info" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip icon={<GroupIcon />} label={c.empleadoIds?.length ?? 0} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Ver Detalle">
                          <IconButton size="small" color="info" onClick={() => { setSelected(c); setOpenDetail(true); }}>
                            <SchoolIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Descargar planilla F-RRHH-003">
                          <IconButton size="small" color="secondary" onClick={() => downloadPlanilla(c)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => openEdit(c)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => { setSelected(c); setOpenDelete(true); }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detail */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        {selected && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">{selected.actividad || selected.nombre}</Typography>
                {selected.motivo && (
                  <Chip size="small" label={selected.motivo} color={motivoColor(selected.motivo) as any} sx={{ ml: 1 }} />
                )}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">Área</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>{selected.areaNombre || '-'}</Typography>
                      <Typography variant="subtitle2" color="textSecondary">Capacitador</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>{selected.capacitador || '-'}</Typography>
                      <Typography variant="subtitle2" color="textSecondary">Institución</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>{selected.institucion || '-'}</Typography>
                      <Typography variant="subtitle2" color="textSecondary">Período</Typography>
                      <Typography variant="body1">
                        {dayjs(selected.fechaInicio).format('DD/MM/YYYY')} – {dayjs(selected.fechaFin).format('DD/MM/YYYY')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">Objetivo</Typography>
                      <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>{selected.objetivo || '-'}</Typography>
                      <Typography variant="subtitle2" color="textSecondary">Descripción</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{selected.descripcion || '-'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                        Participantes ({selected.empleadoIds?.length ?? 0})
                      </Typography>
                      <List dense>
                        {(selected.asistencias ?? []).map(a => (
                          <ListItem key={a.empleadoId} disableGutters>
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <ListItemText
                              primary={`${a.empleadoApellido ?? ''}${a.empleadoApellido ? ', ' : ''}${a.empleadoNombre ?? ''}`}
                              secondary={a.empleadoDni ? `DNI ${a.empleadoDni}` : null}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="outlined" onClick={() => setOpenDetail(false)}>Cerrar</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadPlanilla(selected)}>
                Descargar planilla
              </Button>
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => { setOpenDetail(false); openEdit(selected); }}>
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Form */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>{editing ? 'Editar Capacitación' : 'Nueva Capacitación'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Motivo" value={formData.motivo}
                onChange={(e) => setFormData(p => ({ ...p, motivo: e.target.value as MotivoCapacitacion }))}
              >
                <MenuItem value="">— Sin motivo —</MenuItem>
                {MOTIVOS.map(m => <MenuItem key={m} value={m}>{MOTIVO_CAPACITACION_LABEL[m]}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={areas}
                getOptionLabel={o => o.nombre}
                value={areas.find(a => a.id === formData.areaId) ?? null}
                onChange={(_, v) => setFormData(p => ({ ...p, areaId: v?.id ?? '' }))}
                renderInput={(p) => <TextField {...p} label="Área" />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Actividad" placeholder="Ej.: Capacitación 5S"
                value={formData.actividad}
                onChange={(e) => setFormData(p => ({ ...p, actividad: e.target.value }))}
                helperText="Encabezado de la planilla F-RRHH-003"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth required label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej.: Inducción Operarios Planta"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Objetivo"
                value={formData.objetivo}
                onChange={(e) => setFormData(p => ({ ...p, objetivo: e.target.value }))}
                multiline minRows={2}
                helperText="Aparece en la planilla impresa"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Capacitador"
                value={formData.capacitador}
                onChange={(e) => setFormData(p => ({ ...p, capacitador: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Institución (opcional)"
                value={formData.institucion}
                onChange={(e) => setFormData(p => ({ ...p, institucion: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date" fullWidth required label="Fecha Inicio"
                value={formData.fechaInicio}
                onChange={(e) => setFormData(p => ({ ...p, fechaInicio: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="date" fullWidth required label="Fecha Fin"
                value={formData.fechaFin}
                onChange={(e) => setFormData(p => ({ ...p, fechaFin: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                type="number" fullWidth required label="Horas"
                value={formData.horas}
                onChange={(e) => setFormData(p => ({ ...p, horas: e.target.value }))}
                inputProps={{ min: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><TimeIcon /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                type="number" fullWidth label="Costo"
                value={formData.costo}
                onChange={(e) => setFormData(p => ({ ...p, costo: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={formData.certificado} color="success"
                  onChange={(e) => setFormData(p => ({ ...p, certificado: e.target.checked }))} />}
                label={<Box display="flex" alignItems="center" gap={1}><CertifiedIcon />Con Certificado</Box>}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>Participantes</Divider>
              <Autocomplete
                multiple
                options={empleados}
                getOptionLabel={empleadoLabel}
                value={formData.empleados}
                onChange={(_, v) => setFormData(p => ({ ...p, empleados: v }))}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderTags={(value, getTagProps) =>
                  value.map((opt, idx) => (
                    <Chip
                      {...getTagProps({ index: idx })}
                      key={opt.id}
                      label={`${opt.apellido}, ${opt.nombre}`}
                      size="small"
                    />
                  ))
                }
                renderInput={(p) => (
                  <TextField
                    {...p}
                    label="Empleados que reciben la capacitación"
                    placeholder="Buscar y seleccionar..."
                    required={formData.empleados.length === 0}
                    helperText={`${formData.empleados.length} seleccionado(s) — aparecerán en la planilla para firma`}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={3} label="Descripción / Temario"
                value={formData.descripcion}
                onChange={(e) => setFormData(p => ({ ...p, descripcion: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setOpenForm(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? 'Guardar Cambios' : 'Crear Capacitación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la capacitación <strong>{selected?.actividad || selected?.nombre}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Se borrarán también las asistencias registradas. Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CapacitacionesPage;
