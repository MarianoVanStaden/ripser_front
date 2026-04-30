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
  FormControlLabel,
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
import SavingsIcon from '@mui/icons-material/Savings';
import { tipoProvisionApi } from '../../../api/services/tipoProvisionApi';
import type { TipoProvisionDTO } from '../../../types';

export default function TiposProvisionPage() {
  const [tipos, setTipos] = useState<TipoProvisionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TipoProvisionDTO | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCuentaPatrimonio, setFormCuentaPatrimonio] = useState(true);
  const [formActivo, setFormActivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tipoProvisionApi.list(onlyActive ? true : undefined);
      setTipos(data);
    } catch (err) {
      console.error('Error loading tipos de provisión:', err);
      setError('No se pudieron cargar los tipos de provisión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tipos;
    return tipos.filter(
      (t) =>
        t.nombre.toLowerCase().includes(term) ||
        t.codigo.toLowerCase().includes(term)
    );
  }, [tipos, search]);

  const openCreate = () => {
    setEditing(null);
    setFormCodigo('');
    setFormNombre('');
    setFormCuentaPatrimonio(true);
    setFormActivo(true);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (t: TipoProvisionDTO) => {
    setEditing(t);
    setFormCodigo(t.codigo);
    setFormNombre(t.nombre);
    setFormCuentaPatrimonio(t.cuentaEnPatrimonio);
    setFormActivo(t.activo);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const codigo = formCodigo.trim().toUpperCase();
    const nombre = formNombre.trim();
    if (!codigo) {
      setFormError('El código es obligatorio');
      return;
    }
    if (!nombre) {
      setFormError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await tipoProvisionApi.update(editing.id, {
          nombre: nombre !== editing.nombre ? nombre : undefined,
          cuentaEnPatrimonio:
            formCuentaPatrimonio !== editing.cuentaEnPatrimonio ? formCuentaPatrimonio : undefined,
          activo: formActivo !== editing.activo ? formActivo : undefined,
        });
      } else {
        await tipoProvisionApi.create({
          codigo,
          nombre,
          cuentaEnPatrimonio: formCuentaPatrimonio,
        });
      }
      await load();
      setDialogOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setFormError('Ya existe un tipo de provisión con ese código');
      } else {
        setFormError('No se pudo guardar el tipo de provisión');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <SavingsIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Tipos de Provisión</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo tipo
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Buscar (código o nombre)"
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
              <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cuenta en patrimonio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Sin tipos de provisión para mostrar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{t.codigo}</TableCell>
                  <TableCell>{t.nombre}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.cuentaEnPatrimonio ? 'Sí' : 'No'}
                      size="small"
                      color={t.cuentaEnPatrimonio ? 'primary' : 'default'}
                      variant={t.cuentaEnPatrimonio ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={t.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(t)}>
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

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar tipo de provisión' : 'Nuevo tipo de provisión'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Código *"
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
              disabled={!!editing}
              helperText={editing ? 'El código no se puede modificar' : 'Único, mayúsculas (ej. AGUINALDO, DESPIDOS)'}
              inputProps={{ maxLength: 30, style: { fontFamily: 'monospace' } }}
              fullWidth
              size="small"
            />
            <TextField
              label="Nombre *"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              inputProps={{ maxLength: 80 }}
              fullWidth
              size="small"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formCuentaPatrimonio}
                  onChange={(_, v) => setFormCuentaPatrimonio(v)}
                />
              }
              label="Cuenta en posición patrimonial"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              Si está activo, el saldo pendiente de este tipo se suma a los pasivos.
            </Typography>
            {editing && (
              <FormControlLabel
                control={<Switch checked={formActivo} onChange={(_, v) => setFormActivo(v)} />}
                label="Activo"
              />
            )}
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
