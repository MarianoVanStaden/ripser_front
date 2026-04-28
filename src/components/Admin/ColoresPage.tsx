import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { colorApi, type Color } from '../../api/services/colorApi';
import { useColores } from '../../context/ColoresContext';

/**
 * Catálogo de colores parametrizables (`/api/colores`).
 *
 * - Listado con buscador y toggle "solo activos".
 * - Crear color (modal).
 * - Editar nombre / activo (modal). Sin baja física: la consigna pide solo
 *   activar/desactivar.
 */
export default function ColoresPage() {
  const [colores, setColores] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Color | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Refresh the global cache so any color picker visible elsewhere stays
  // in sync after edits.
  const { refresh: refreshGlobal } = useColores();

  const loadColores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await colorApi.list(onlyActive ? true : undefined);
      setColores(data);
    } catch (err) {
      console.error('Error loading colores:', err);
      setError('No se pudieron cargar los colores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadColores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return colores;
    return colores.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [colores, search]);

  const openCreate = () => {
    setEditing(null);
    setFormNombre('');
    setFormActivo(true);
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (c: Color) => {
    setEditing(c);
    setFormNombre(c.nombre);
    setFormActivo(c.activo);
    setFormError(null);
    setCreateOpen(true);
  };

  const handleSave = async () => {
    const trimmed = formNombre.trim();
    if (!trimmed) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await colorApi.update(editing.id, {
          nombre: trimmed !== editing.nombre ? trimmed : undefined,
          activo: formActivo,
        });
      } else {
        await colorApi.create({ nombre: trimmed });
      }
      await loadColores();
      await refreshGlobal();
      setCreateOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setFormError('Ya existe otro color con ese nombre');
      } else {
        setFormError('No se pudo guardar el color');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Catálogo de colores</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo color
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Buscar"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">Solo activos</Typography>
            <Switch checked={onlyActive} onChange={(_, v) => setOnlyActive(v)} />
          </Stack>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2" color="text.secondary">Sin colores para mostrar.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={c.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(c)} aria-label="Editar color">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar color' : 'Nuevo color'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              error={Boolean(formError)}
              helperText={formError}
              inputProps={{ maxLength: 50 }}
              sx={{ mb: 2 }}
            />
            {editing && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Activo</Typography>
                <Switch checked={formActivo} onChange={(_, v) => setFormActivo(v)} />
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
