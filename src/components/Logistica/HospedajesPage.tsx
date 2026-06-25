import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Rating,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HotelIcon from '@mui/icons-material/Hotel';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';
import PoolIcon from '@mui/icons-material/Pool';
import { hospedajeEstadiaApi } from '../../api/services/hospedajeEstadiaApi';
import { usePermisos } from '../../hooks/usePermisos';
import type { CreateHospedajeEstadiaDTO, FiltrosHospedaje, HospedajeEstadiaDTO } from '../../types';

const extractError = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message ?? 'Error inesperado';
};

const formatPrice = (price: number | null): string => {
  if (price == null) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const FILTROS_VACIOS: FiltrosHospedaje = {
  nombre: '',
  provincia: '',
  localidad: '',
  calificacion: '',
  cochera: false,
  desayuno: false,
  pileta: false,
};

const FORM_VACIO: CreateHospedajeEstadiaDTO = {
  nombre: '',
  provincia: '',
  localidad: '',
  direccion: '',
  telefono: '',
  resena: '',
  ultimoPrecio: null,
  calificacion: null,
  tieneCochera: false,
  tieneDesayuno: false,
  tienePileta: false,
  activo: true,
  observaciones: '',
};

const HospedajesPage: React.FC = () => {
  const { tieneRol, esAdmin } = usePermisos();
  const canEdit = esAdmin || tieneRol('SUPER_ADMIN', 'COORDINADORA_LOGISTICA');
  const canDelete = esAdmin || tieneRol('SUPER_ADMIN');

  const [hospedajes, setHospedajes] = useState<HospedajeEstadiaDTO[]>([]);
  const [provincias, setProvincias] = useState<string[]>([]);
  const [localidades, setLocalidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<FiltrosHospedaje>(FILTROS_VACIOS);
  const nombreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nombreCommitted, setNombreCommitted] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<HospedajeEstadiaDTO | null>(null);
  const [form, setForm] = useState<CreateHospedajeEstadiaDTO>(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [archivando, setArchivando] = useState<number | null>(null);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const fetchHospedajes = useCallback(async (f: FiltrosHospedaje, nombre: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {};
      if (nombre) params.nombre = nombre;
      if (f.provincia) params.provincia = f.provincia;
      if (f.localidad) params.localidad = f.localidad;
      if (f.calificacion) params.calificacion = Number(f.calificacion);
      if (f.cochera) params.cochera = true;
      if (f.desayuno) params.desayuno = true;
      if (f.pileta) params.pileta = true;
      const data = await hospedajeEstadiaApi.getAll(params);
      setHospedajes(data);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hospedajeEstadiaApi.getProvincias().then(setProvincias).catch(() => {});
  }, []);

  useEffect(() => {
    fetchHospedajes(filtros, nombreCommitted);
  }, [filtros, nombreCommitted, fetchHospedajes]);

  // Debounce del campo nombre
  const handleNombreChange = (value: string) => {
    setFiltros((prev) => ({ ...prev, nombre: value }));
    if (nombreDebounceRef.current) clearTimeout(nombreDebounceRef.current);
    nombreDebounceRef.current = setTimeout(() => setNombreCommitted(value), 400);
  };

  const handleProvinciaChange = async (provincia: string) => {
    setFiltros((prev) => ({ ...prev, provincia, localidad: '' }));
    if (provincia) {
      const locs = await hospedajeEstadiaApi.getLocalidades(provincia).catch(() => []);
      setLocalidades(locs);
    } else {
      setLocalidades([]);
    }
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setNombreCommitted('');
    setLocalidades([]);
  };

  // ── Formulario ────────────────────────────────────────────────────────────

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setFormError(null);
    setDialogOpen(true);
  };

  const abrirEditar = (h: HospedajeEstadiaDTO) => {
    setEditando(h);
    setForm({
      nombre: h.nombre,
      provincia: h.provincia ?? '',
      localidad: h.localidad ?? '',
      direccion: h.direccion ?? '',
      telefono: h.telefono ?? '',
      resena: h.resena ?? '',
      ultimoPrecio: h.ultimoPrecio,
      calificacion: h.calificacion,
      tieneCochera: h.tieneCochera,
      tieneDesayuno: h.tieneDesayuno,
      tienePileta: h.tienePileta,
      activo: h.activo,
      observaciones: h.observaciones ?? '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const cerrarDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditando(null);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: CreateHospedajeEstadiaDTO = {
        ...form,
        nombre: form.nombre.trim(),
        ultimoPrecio: form.ultimoPrecio != null && form.ultimoPrecio !== 0 ? form.ultimoPrecio : null,
      };
      if (editando) {
        await hospedajeEstadiaApi.update(editando.id, payload);
      } else {
        await hospedajeEstadiaApi.create(payload);
      }
      cerrarDialog();
      fetchHospedajes(filtros, nombreCommitted);
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleArchivar = async (id: number) => {
    setArchivando(id);
    try {
      await hospedajeEstadiaApi.delete(id);
      fetchHospedajes(filtros, nombreCommitted);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setArchivando(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const hayFiltros =
    filtros.nombre || filtros.provincia || filtros.localidad ||
    filtros.calificacion || filtros.cochera || filtros.desayuno || filtros.pileta;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Encabezado */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <HotelIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>Hospedajes / Estadías</Typography>
        </Stack>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirCrear}>
            Agregar hospedaje
          </Button>
        )}
      </Stack>

      {/* Filtros */}
      <Box
        sx={{
          display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3,
          p: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          label="Buscar por nombre"
          size="small"
          value={filtros.nombre}
          onChange={(e) => handleNombreChange(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
        <TextField
          select label="Provincia" size="small"
          value={filtros.provincia} sx={{ minWidth: 170 }}
          onChange={(e) => handleProvinciaChange(e.target.value)}
        >
          <MenuItem value="">Todas</MenuItem>
          {provincias.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
        </TextField>
        <TextField
          select label="Localidad" size="small"
          value={filtros.localidad} sx={{ minWidth: 170 }}
          disabled={!filtros.provincia}
          onChange={(e) => setFiltros((prev) => ({ ...prev, localidad: e.target.value }))}
        >
          <MenuItem value="">Todas</MenuItem>
          {localidades.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </TextField>
        <TextField
          select label="Calificación" size="small"
          value={filtros.calificacion} sx={{ minWidth: 150 }}
          onChange={(e) => setFiltros((prev) => ({ ...prev, calificacion: e.target.value }))}
        >
          <MenuItem value="">Cualquiera</MenuItem>
          {[5, 4, 3, 2, 1].map((n) => <MenuItem key={n} value={n}>{'⭐'.repeat(n)}</MenuItem>)}
        </TextField>

        <Stack direction="row" gap={0.5} alignItems="center" flexWrap="wrap">
          <FormControlLabel
            label={<Chip icon={<DirectionsCarIcon />} label="Cochera" size="small" color={filtros.cochera ? 'primary' : 'default'} variant={filtros.cochera ? 'filled' : 'outlined'} />}
            control={<Checkbox checked={filtros.cochera} onChange={(e) => setFiltros((p) => ({ ...p, cochera: e.target.checked }))} sx={{ display: 'none' }} />}
            sx={{ m: 0, cursor: 'pointer' }}
          />
          <FormControlLabel
            label={<Chip icon={<FreeBreakfastIcon />} label="Desayuno" size="small" color={filtros.desayuno ? 'primary' : 'default'} variant={filtros.desayuno ? 'filled' : 'outlined'} />}
            control={<Checkbox checked={filtros.desayuno} onChange={(e) => setFiltros((p) => ({ ...p, desayuno: e.target.checked }))} sx={{ display: 'none' }} />}
            sx={{ m: 0, cursor: 'pointer' }}
          />
          <FormControlLabel
            label={<Chip icon={<PoolIcon />} label="Pileta" size="small" color={filtros.pileta ? 'primary' : 'default'} variant={filtros.pileta ? 'filled' : 'outlined'} />}
            control={<Checkbox checked={filtros.pileta} onChange={(e) => setFiltros((p) => ({ ...p, pileta: e.target.checked }))} sx={{ display: 'none' }} />}
            sx={{ m: 0, cursor: 'pointer' }}
          />
        </Stack>

        {hayFiltros && (
          <Tooltip title="Limpiar filtros">
            <IconButton size="small" onClick={limpiarFiltros}><ClearIcon /></IconButton>
          </Tooltip>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : hospedajes.length === 0 ? (
        <Box textAlign="center" py={8}>
          <HotelIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            {hayFiltros ? 'Ningún hospedaje coincide con los filtros.' : 'No hay hospedajes cargados.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {hospedajes.length} hospedaje{hospedajes.length !== 1 ? 's' : ''}
          </Typography>
          <Grid container spacing={2}>
            {hospedajes.map((h) => (
              <Grid item xs={12} sm={6} md={4} key={h.id}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    {/* Nombre + calificación */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                        {h.nombre}
                      </Typography>
                      {h.calificacion && (
                        <Rating value={h.calificacion} max={5} size="small" readOnly />
                      )}
                    </Stack>

                    {/* Ubicación */}
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {[h.provincia, h.localidad].filter(Boolean).join(' · ') || '—'}
                    </Typography>

                    {/* Amenities */}
                    <Stack direction="row" gap={0.5} flexWrap="wrap" mb={1}>
                      {h.tieneCochera && <Chip icon={<DirectionsCarIcon />} label="Cochera" size="small" color="success" variant="outlined" />}
                      {h.tieneDesayuno && <Chip icon={<FreeBreakfastIcon />} label="Desayuno" size="small" color="success" variant="outlined" />}
                      {h.tienePileta && <Chip icon={<PoolIcon />} label="Pileta" size="small" color="success" variant="outlined" />}
                      {!h.tieneCochera && !h.tieneDesayuno && !h.tienePileta && (
                        <Typography variant="caption" color="text.disabled">Sin amenities registrados</Typography>
                      )}
                    </Stack>

                    {/* Reseña */}
                    {h.resena && (
                      <Typography
                        variant="body2" color="text.secondary"
                        sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1, fontStyle: 'italic' }}
                        title={h.resena}
                      >
                        "{h.resena}"
                      </Typography>
                    )}

                    {/* Dirección y teléfono */}
                    {(h.direccion || h.telefono) && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {[h.direccion, h.telefono].filter(Boolean).join(' · ')}
                      </Typography>
                    )}

                    {/* Precio */}
                    {h.ultimoPrecio && (
                      <Typography variant="body2" fontWeight={500} mt={0.5}>
                        Último precio: {formatPrice(h.ultimoPrecio)}
                      </Typography>
                    )}

                    {/* Observaciones internas */}
                    {h.observaciones && (
                      <Alert severity="info" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
                        {h.observaciones}
                      </Alert>
                    )}
                  </CardContent>

                  {canEdit && (
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => abrirEditar(h)}>
                        Editar
                      </Button>
                      {canDelete && (
                        <Button
                          size="small" color="warning" startIcon={<ArchiveIcon />}
                          disabled={archivando === h.id}
                          onClick={() => handleArchivar(h.id)}
                        >
                          {archivando === h.id ? 'Archivando…' : 'Archivar'}
                        </Button>
                      )}
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onClose={cerrarDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editando ? 'Editar hospedaje' : 'Nuevo hospedaje'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Nombre *" fullWidth size="small"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Provincia" fullWidth size="small"
                value={form.provincia ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, provincia: e.target.value }))}
              />
              <TextField
                label="Localidad / Ciudad" fullWidth size="small"
                value={form.localidad ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, localidad: e.target.value }))}
              />
            </Stack>
            <TextField
              label="Dirección" fullWidth size="small"
              value={form.direccion ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
            />
            <TextField
              label="Teléfono" fullWidth size="small"
              value={form.telefono ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            />
            <TextField
              label="Reseña / notas operativas" fullWidth size="small" multiline minRows={2}
              value={form.resena ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, resena: e.target.value }))}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
              <TextField
                label="Último precio (ARS)" fullWidth size="small" type="number"
                value={form.ultimoPrecio ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, ultimoPrecio: e.target.value ? Number(e.target.value) : null }))}
              />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Calificación</Typography>
                <Rating
                  value={form.calificacion ?? 0}
                  onChange={(_, value) => setForm((p) => ({ ...p, calificacion: value }))}
                />
              </Box>
            </Stack>

            {/* Amenities */}
            <Stack direction="row" gap={2} flexWrap="wrap">
              <FormControlLabel
                label={<Stack direction="row" gap={0.5} alignItems="center"><DirectionsCarIcon fontSize="small" /><span>Cochera</span></Stack>}
                control={<Checkbox size="small" checked={form.tieneCochera ?? false} onChange={(e) => setForm((p) => ({ ...p, tieneCochera: e.target.checked }))} />}
              />
              <FormControlLabel
                label={<Stack direction="row" gap={0.5} alignItems="center"><FreeBreakfastIcon fontSize="small" /><span>Desayuno</span></Stack>}
                control={<Checkbox size="small" checked={form.tieneDesayuno ?? false} onChange={(e) => setForm((p) => ({ ...p, tieneDesayuno: e.target.checked }))} />}
              />
              <FormControlLabel
                label={<Stack direction="row" gap={0.5} alignItems="center"><PoolIcon fontSize="small" /><span>Pileta</span></Stack>}
                control={<Checkbox size="small" checked={form.tienePileta ?? false} onChange={(e) => setForm((p) => ({ ...p, tienePileta: e.target.checked }))} />}
              />
            </Stack>

            <TextField
              label="Observaciones internas" fullWidth size="small" multiline minRows={2}
              value={form.observaciones ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
            />

            {editando && (
              <FormControlLabel
                label="Activo (desmarcá para archivar)"
                control={<Checkbox checked={form.activo ?? true} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardar} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : editando ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospedajesPage;
