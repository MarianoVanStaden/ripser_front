import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Paper, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  modeloCodigoEquipoApi,
  type ModeloCodigoEquipo,
} from '../../api/services/modeloCodigoEquipoApi';

/**
 * Catálogo modelo→código de equipo (`/api/admin/modelo-codigo`).
 * La sigla se usa para componer el código de venta/despacho:
 * MM + AAAA + códigoModelo + códigoMedida + correlativo.
 */
export default function ModeloCodigoEquipoPage() {
  // items/loading/error se derivan del query ['modelo-codigo-equipo'].
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ModeloCodigoEquipo | null>(null);
  const [formModelo, setFormModelo] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<ModeloCodigoEquipo | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const modeloQuery = useQuery({
    queryKey: ['modelo-codigo-equipo'],
    queryFn: () => modeloCodigoEquipoApi.list(),
  });
  const items = modeloQuery.data ?? [];
  const loading = modeloQuery.isPending;
  const error = modeloQuery.error ? 'No se pudo cargar el catálogo de códigos de modelo' : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['modelo-codigo-equipo'] });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (m) => m.modelo.toLowerCase().includes(term) || m.codigo.toLowerCase().includes(term),
    );
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setFormModelo('');
    setFormCodigo('');
    setFormActivo(true);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (m: ModeloCodigoEquipo) => {
    setEditing(m);
    setFormModelo(m.modelo);
    setFormCodigo(m.codigo);
    setFormActivo(m.activo);
    setFormError(null);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (vars: { modelo: string; codigo: string }) => editing
      ? modeloCodigoEquipoApi.update(editing.id, { modelo: vars.modelo, codigo: vars.codigo, activo: formActivo })
      : modeloCodigoEquipoApi.create({ modelo: vars.modelo, codigo: vars.codigo, activo: formActivo }),
    onSuccess: () => { load(); setDialogOpen(false); },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setFormError(status === 409 ? 'Ya existe un mapeo para ese modelo' : 'No se pudo guardar');
    },
  });
  const saving = saveMutation.isPending;

  const handleSave = () => {
    const modelo = formModelo.trim();
    const codigo = formCodigo.trim().toUpperCase();
    if (!modelo || !codigo) {
      setFormError('Modelo y código son obligatorios');
      return;
    }
    setFormError(null);
    saveMutation.mutate({ modelo, codigo });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => modeloCodigoEquipoApi.remove(id),
    onSuccess: () => { load(); setToDelete(null); },
    onError: (err) => {
      console.error('Error deleting modelo-codigo:', err);
      setDeleteError('No se pudo eliminar el mapeo');
    },
  });
  const deleting = deleteMutation.isPending;

  const handleDelete = () => {
    if (!toDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(toDelete.id);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5">Códigos de venta por modelo</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo mapeo
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sigla por modelo para el código de venta/despacho (MM + AAAA + <b>sigla</b> + medida + correlativo).
        El nombre del modelo debe coincidir con el de los equipos.
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Buscar modelo o código"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
      </Paper>

      {(error || deleteError) && <Alert severity="error" sx={{ mb: 2 }}>{error || deleteError}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Modelo</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary">Sin mapeos para mostrar.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.modelo}</TableCell>
                  <TableCell>
                    <Chip label={m.codigo} size="small" color="primary" sx={{ fontWeight: 700, fontFamily: 'monospace' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={m.activo ? 'Activo' : 'Inactivo'} size="small" color={m.activo ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(m)} aria-label="Editar mapeo">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => setToDelete(m)} aria-label="Eliminar mapeo">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Crear/Editar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Editar mapeo' : 'Nuevo mapeo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus fullWidth label="Modelo"
              value={formModelo}
              onChange={(e) => setFormModelo(e.target.value)}
              placeholder="Heladera Gala"
              inputProps={{ maxLength: 120 }}
            />
            <TextField
              fullWidth label="Código (sigla)"
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
              placeholder="HG"
              inputProps={{ maxLength: 10 }}
              error={Boolean(formError)}
              helperText={formError}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Activo</Typography>
              <Switch checked={formActivo} onChange={(_, v) => setFormActivo(v)} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Eliminar */}
      <Dialog open={Boolean(toDelete)} onClose={() => !deleting && setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar mapeo</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Eliminar el mapeo <b>{toDelete?.modelo}</b> → <b>{toDelete?.codigo}</b>? Los códigos ya
            generados no cambian; sólo deja de usarse para nuevas ventas.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} disabled={deleting}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
