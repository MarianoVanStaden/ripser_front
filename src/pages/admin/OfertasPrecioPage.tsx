import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Stack, Chip, IconButton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, Autocomplete, Alert, LinearProgress,
  Tooltip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {
  ofertaPrecioApi, type OfertaPrecioDTO, type OfertaPrecioCreateDTO,
  type TipoReferenciaOferta,
} from '../../api/services/ofertaPrecioApi';
import { productApi } from '../../api/services/productApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import type { Producto, RecetaFabricacionListDTO } from '../../types';

interface FormState {
  tipo: TipoReferenciaOferta;
  referenciaId: number | null;
  precioOferta: number | '';
  descuentoPct: number | '';
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  activo: boolean;
  // Para calcular descuento: precio original conocido al elegir referencia
  precioOriginalRef: number;
}

const emptyForm = (): FormState => ({
  tipo: 'PRODUCTO',
  referenciaId: null,
  precioOferta: '',
  descuentoPct: '',
  fechaInicio: dayjs().format('YYYY-MM-DD'),
  fechaFin: dayjs().endOf('month').format('YYYY-MM-DD'),
  motivo: '',
  activo: true,
  precioOriginalRef: 0,
});

const estadoChip = (oferta: OfertaPrecioDTO) => {
  if (!oferta.activo) return <Chip label="Inactiva" size="small" />;
  if (oferta.vigente) return <Chip label="Vigente" color="success" size="small" />;
  const hoy = dayjs();
  if (dayjs(oferta.fechaInicio).isAfter(hoy)) return <Chip label="Futura" color="info" size="small" />;
  return <Chip label="Vencida" color="default" size="small" />;
};

const OfertasPrecioPage: React.FC = () => {
  const [ofertas, setOfertas] = useState<OfertaPrecioDTO[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionListDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'TODAS' | 'VIGENTES' | 'INACTIVAS'>('TODAS');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadOfertas = async () => {
    setLoading(true);
    try {
      const data = await ofertaPrecioApi.findAll();
      setOfertas(data);
    } catch (e) {
      setError('Error cargando ofertas');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfertas();
    (async () => {
      try {
        const [p, r] = await Promise.all([
          productApi.getAll({ size: 5000 }),
          recetaFabricacionApi.findAll({ size: 5000 }),
        ]);
        setProductos(p.content || []);
        setRecetas(r.content || []);
      } catch (e) {
        console.error('Error cargando catálogos para ofertas', e);
      }
    })();
  }, []);

  const ofertasFiltradas = useMemo(() => {
    if (filter === 'VIGENTES') return ofertas.filter(o => o.vigente);
    if (filter === 'INACTIVAS') return ofertas.filter(o => !o.activo);
    return ofertas;
  }, [ofertas, filter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (o: OfertaPrecioDTO) => {
    setEditingId(o.id);
    setForm({
      tipo: o.tipo,
      referenciaId: o.referenciaId,
      precioOferta: o.precioOferta,
      descuentoPct: o.descuentoPct ?? '',
      fechaInicio: o.fechaInicio,
      fechaFin: o.fechaFin,
      motivo: o.motivo ?? '',
      activo: o.activo,
      precioOriginalRef: o.precioOriginal,
    });
    setDialogOpen(true);
  };

  // Cuando cambian las opciones de referencia, busco el precio original
  const handleReferenciaChange = (refId: number | null) => {
    let precioOriginal = 0;
    if (refId != null) {
      if (form.tipo === 'PRODUCTO') {
        precioOriginal = Number(productos.find(p => p.id === refId)?.precio ?? 0);
      } else {
        precioOriginal = Number((recetas.find(r => r.id === refId) as any)?.precioVenta ?? 0);
      }
    }
    setForm(f => ({
      ...f,
      referenciaId: refId,
      precioOriginalRef: precioOriginal,
      // Si el admin tenía un descuento_pct cargado, recalculamos el precio_oferta
      precioOferta: typeof f.descuentoPct === 'number' && precioOriginal > 0
        ? Number((precioOriginal * (1 - f.descuentoPct / 100)).toFixed(2))
        : f.precioOferta,
    }));
  };

  const handleDescuentoChange = (pct: number | '') => {
    setForm(f => ({
      ...f,
      descuentoPct: pct,
      precioOferta: typeof pct === 'number' && f.precioOriginalRef > 0
        ? Number((f.precioOriginalRef * (1 - pct / 100)).toFixed(2))
        : f.precioOferta,
    }));
  };

  const handlePrecioOfertaChange = (precio: number | '') => {
    setForm(f => ({
      ...f,
      precioOferta: precio,
      descuentoPct: typeof precio === 'number' && f.precioOriginalRef > 0
        ? Number((((f.precioOriginalRef - precio) / f.precioOriginalRef) * 100).toFixed(2))
        : f.descuentoPct,
    }));
  };

  const handleSave = async () => {
    if (form.referenciaId == null) {
      setError('Seleccioná un producto o equipo');
      return;
    }
    if (typeof form.precioOferta !== 'number' || form.precioOferta <= 0) {
      setError('Precio de oferta inválido');
      return;
    }
    if (dayjs(form.fechaFin).isBefore(form.fechaInicio)) {
      setError('La fecha fin debe ser mayor o igual a la fecha inicio');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const dto: OfertaPrecioCreateDTO = {
        tipo: form.tipo,
        referenciaId: form.referenciaId,
        precioOferta: form.precioOferta,
        descuentoPct: typeof form.descuentoPct === 'number' ? form.descuentoPct : null,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        motivo: form.motivo || undefined,
        activo: form.activo,
      };
      if (editingId) {
        await ofertaPrecioApi.update(editingId, dto);
      } else {
        await ofertaPrecioApi.create(dto);
      }
      setDialogOpen(false);
      loadOfertas();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = async (id: number) => {
    try {
      await ofertaPrecioApi.desactivar(id);
      loadOfertas();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar definitivamente esta oferta?')) return;
    try {
      await ofertaPrecioApi.delete(id);
      loadOfertas();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Ofertas Mensuales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Precios promocionales globales para productos y equipos.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva oferta
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, v) => v && setFilter(v)}
            >
              <ToggleButton value="TODAS">Todas ({ofertas.length})</ToggleButton>
              <ToggleButton value="VIGENTES">
                Vigentes ({ofertas.filter(o => o.vigente).length})
              </ToggleButton>
              <ToggleButton value="INACTIVAS">
                Inactivas ({ofertas.filter(o => !o.activo).length})
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Referencia</TableCell>
                  <TableCell align="right">Precio orig.</TableCell>
                  <TableCell align="right">Precio oferta</TableCell>
                  <TableCell align="right">Descuento</TableCell>
                  <TableCell>Vigencia</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ofertasFiltradas.map(o => (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <Chip
                        label={o.tipo === 'PRODUCTO' ? 'PROD' : 'EQ'}
                        size="small"
                        color={o.tipo === 'PRODUCTO' ? 'info' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>{o.referenciaNombre}</TableCell>
                    <TableCell align="right">
                      ${Number(o.precioOriginal).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.dark' }}>
                      ${Number(o.precioOferta).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell align="right">
                      {o.descuentoPct != null ? `${o.descuentoPct}%` : '—'}
                    </TableCell>
                    <TableCell>
                      {dayjs(o.fechaInicio).format('DD/MM/YY')} → {dayjs(o.fechaFin).format('DD/MM/YY')}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {o.motivo || '—'}
                    </TableCell>
                    <TableCell>{estadoChip(o)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(o)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {o.activo && (
                        <Tooltip title="Desactivar">
                          <IconButton size="small" onClick={() => handleDesactivar(o.id)}>
                            <ToggleOnIcon fontSize="small" color="warning" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(o.id)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {ofertasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Stack alignItems="center" py={3}>
                        <LocalOfferIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary" mt={1}>
                          No hay ofertas {filter !== 'TODAS' ? 'en esta vista' : ''}.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar oferta' : 'Nueva oferta'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={form.tipo}
                onChange={e => setForm(f => ({
                  ...f,
                  tipo: e.target.value as TipoReferenciaOferta,
                  referenciaId: null,
                  precioOriginalRef: 0,
                }))}
              >
                <MenuItem value="PRODUCTO">Producto</MenuItem>
                <MenuItem value="RECETA">Equipo / Receta</MenuItem>
              </Select>
            </FormControl>

            {form.tipo === 'PRODUCTO' ? (
              <Autocomplete
                size="small"
                options={productos}
                getOptionLabel={p => `${p.codigo || '—'} · ${p.nombre} · $${Number(p.precio).toLocaleString('es-AR')}`}
                value={productos.find(p => p.id === form.referenciaId) ?? null}
                onChange={(_, v) => handleReferenciaChange(v?.id ?? null)}
                renderInput={params => <TextField {...params} label="Producto" />}
              />
            ) : (
              <Autocomplete
                size="small"
                options={recetas}
                getOptionLabel={r => `${r.codigo || '—'} · ${r.nombre} · $${Number((r as any).precioVenta ?? 0).toLocaleString('es-AR')}`}
                value={recetas.find(r => r.id === form.referenciaId) ?? null}
                onChange={(_, v) => handleReferenciaChange(v?.id ?? null)}
                renderInput={params => <TextField {...params} label="Equipo" />}
              />
            )}

            {form.precioOriginalRef > 0 && (
              <Alert severity="info" variant="outlined">
                Precio actual: <b>${form.precioOriginalRef.toLocaleString('es-AR')}</b>
              </Alert>
            )}

            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                label="Precio oferta"
                type="number"
                fullWidth
                value={form.precioOferta}
                onChange={e => handlePrecioOfertaChange(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <TextField
                size="small"
                label="Descuento %"
                type="number"
                fullWidth
                value={form.descuentoPct}
                onChange={e => handleDescuentoChange(e.target.value === '' ? '' : Number(e.target.value))}
                helperText="Editá precio o descuento, el otro se autocompleta"
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.fechaInicio}
                onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
              />
              <TextField
                size="small"
                label="Hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.fechaFin}
                onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))}
              />
            </Stack>

            <TextField
              size="small"
              label="Motivo (opcional)"
              fullWidth
              value={form.motivo}
              onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
              placeholder="Ej: Oferta mayo 2026"
            />

            <FormControl size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={form.activo ? 'true' : 'false'}
                onChange={e => setForm(f => ({ ...f, activo: e.target.value === 'true' }))}
              >
                <MenuItem value="true">Activa</MenuItem>
                <MenuItem value="false">Inactiva</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfertasPrecioPage;
