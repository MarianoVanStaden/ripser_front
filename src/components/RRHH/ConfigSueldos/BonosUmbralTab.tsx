import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem,
  Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { categoriaSalarialApi } from '../../../api/services/categoriaSalarialApi';
import { bonoProduccionApi } from '../../../api/services/bonoProduccionApi';
import { bonoVentasApi } from '../../../api/services/bonoVentasApi';
import type {
  BonoProduccionTabla, BonoProduccionTablaCreateDTO,
  BonoVentasTabla, BonoVentasTablaCreateDTO,
  CategoriaSalarial,
} from '../../../types';

interface Props {
  variant: 'PRODUCCION' | 'VENTAS';
}

type Bono = BonoProduccionTabla | BonoVentasTabla;

const BonosUmbralTab: React.FC<Props> = ({ variant }) => {
  const api = variant === 'PRODUCCION' ? bonoProduccionApi : bonoVentasApi;
  const label = variant === 'PRODUCCION' ? 'Producción' : 'Ventas';

  const [categorias, setCategorias] = useState<CategoriaSalarial[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [filterCategoria, setFilterCategoria] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bono | null>(null);
  const [form, setForm] = useState<BonoProduccionTablaCreateDTO | BonoVentasTablaCreateDTO>({
    categoriaSalarialId: 0,
    umbralUnidades: 0,
    monto: 0,
  });

  const [confirmDelete, setConfirmDelete] = useState<Bono | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, list] = await Promise.all([
        categoriaSalarialApi.getAll(),
        api.getAll(),
      ]);
      setCategorias(Array.isArray(cats) ? cats : []);
      setBonos(Array.isArray(list) ? list : []);
    } catch {
      setError(`Error al cargar bonos de ${label.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [api, label]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return filterCategoria ? bonos.filter(b => b.categoriaSalarialId === filterCategoria) : bonos;
  }, [bonos, filterCategoria]);

  const handleOpen = (b?: Bono) => {
    if (b) {
      setEditing(b);
      setForm({
        categoriaSalarialId: b.categoriaSalarialId,
        umbralUnidades: b.umbralUnidades,
        monto: Number(b.monto),
      });
    } else {
      setEditing(null);
      setForm({
        categoriaSalarialId: filterCategoria ? Number(filterCategoria) : (categorias[0]?.id ?? 0),
        umbralUnidades: 0,
        monto: 0,
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.categoriaSalarialId) { setError('Seleccione una categoría'); return; }
    try {
      if (editing) {
        await (api as typeof bonoProduccionApi).update(editing.id, form as any);
      } else {
        await (api as typeof bonoProduccionApi).create(form as any);
      }
      setOpen(false);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar (¿umbral duplicado?)');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Filtrar por categoría</InputLabel>
          <Select
            label="Filtrar por categoría"
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <MenuItem value="">Todas</MenuItem>
            {categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Nuevo umbral
        </Button>
      </Stack>

      <Card sx={{ boxShadow: 2 }}>
        <CardContent>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Umbral (unidades)</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Monto</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} align="center">Cargando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center">Sin umbrales</TableCell></TableRow>
                ) : filtered.map(b => {
                  const catNombre = b.categoriaSalarialNombre ?? categorias.find(c => c.id === b.categoriaSalarialId)?.nombre ?? '—';
                  return (
                    <TableRow key={b.id} hover>
                      <TableCell><Typography fontWeight={600}>{catNombre}</Typography></TableCell>
                      <TableCell align="right">{b.umbralUnidades}</TableCell>
                      <TableCell align="right">${Number(b.monto).toLocaleString('es-AR')}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" color="primary" onClick={() => handleOpen(b)}><EditIcon /></IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" color="error" onClick={() => setConfirmDelete(b)}><DeleteIcon /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {editing ? `Editar umbral` : `Nuevo umbral de bono ${label.toLowerCase()}`}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoría *</InputLabel>
                <Select
                  label="Categoría *"
                  value={form.categoriaSalarialId || ''}
                  onChange={(e) => setForm({ ...form, categoriaSalarialId: Number(e.target.value) })}
                >
                  {categorias.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Umbral (unidades) *"
                value={form.umbralUnidades}
                onChange={(e) => setForm({ ...form, umbralUnidades: Number(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="number" label="Monto del bono *"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: Number(e.target.value) || 0 })}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            {editing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>Eliminar umbral</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>¿Eliminar este umbral?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BonosUmbralTab;
