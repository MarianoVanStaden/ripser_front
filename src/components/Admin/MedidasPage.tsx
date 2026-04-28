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
import { medidaApi, type Medida } from '../../api/services/medidaApi';
import { useMedidas } from '../../context/useMedidas';

/**
 * Catálogo parametrizable de medidas (`/api/medidas`).
 * Listado + buscador + activo toggle + create/edit modal. Sin baja física.
 */
export default function MedidasPage() {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Medida | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { refresh: refreshGlobal } = useMedidas();

  const loadMedidas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await medidaApi.list(onlyActive ? true : undefined);
      setMedidas(data);
    } catch (err) {
      console.error('Error loading medidas:', err);
      setError('No se pudieron cargar las medidas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMedidas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return medidas;
    return medidas.filter((m) => m.nombre.toLowerCase().includes(term));
  }, [medidas, search]);

  const openCreate = () => {
    setEditing(null);
    setFormNombre('');
    setFormActivo(true);
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (m: Medida) => {
    setEditing(m);
    setFormNombre(m.nombre);
    setFormActivo(m.activo);
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
        await medidaApi.update(editing.id, {
          nombre: trimmed !== editing.nombre ? trimmed : undefined,
          activo: formActivo,
        });
      } else {
        await medidaApi.create({ nombre: trimmed });
      }
      await loadMedidas();
      await refreshGlobal();
      setCreateOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setFormError('Ya existe otra medida con ese nombre');
      } else {
        setFormError('No se pudo guardar la medida');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Catálogo de medidas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva medida
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
            <Typography variant="body2">Solo activas</Typography>
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
                  <Typography variant="body2" color="text.secondary">Sin medidas para mostrar.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.nombre}</TableCell>
                  <TableCell>
                    <Chip
                      label={m.activo ? 'Activa' : 'Inactiva'}
                      size="small"
                      color={m.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(m)} aria-label="Editar medida">
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
        <DialogTitle>{editing ? 'Editar medida' : 'Nueva medida'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              error={Boolean(formError)}
              helperText={formError ?? 'Ej: "1.4m", "60x40cm".'}
              inputProps={{ maxLength: 20 }}
              sx={{ mb: 2 }}
            />
            {editing && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Activa</Typography>
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
