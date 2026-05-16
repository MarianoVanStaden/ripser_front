import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
import type { CatalogoApi } from '../../../api/services/catalogosApi';
import type { CatalogoBase, CatalogoCreatePayload } from '../../../types/catalogos.types';

export interface ExtraColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
}

export interface CatalogoTablaCRUDProps<T extends CatalogoBase, C extends CatalogoCreatePayload> {
  /** Título visible en el header (singular). Ej: "Banda Jerárquica". */
  titulo: string;
  /** Plural para el botón "Nuevo X" / mensajes. */
  pluralLabel: string;
  /** Cliente de API generado por buildCatalogoApi. */
  api: CatalogoApi<T, C>;
  /** Columnas extra (después de Nombre, antes de Estado). */
  extraColumns?: ExtraColumn<T>[];
  /** Renderea inputs adicionales en el dialog. Recibe estado parcial + setter. */
  renderExtraFields?: (state: Partial<C>, update: (patch: Partial<C>) => void, editing: T | null) => ReactNode;
  /**
   * Valida y/o transforma el payload antes de mandarlo al backend. Devolver
   * un string aborta el guardado mostrando el error en el dialog.
   */
  buildPayload?: (state: Partial<C>) => C | string;
}

/**
 * Componente genérico para los 13 catálogos del Manual de Puestos. Centraliza
 * el patrón listado + filtros + create/edit dialog + soft-delete.
 *
 * Las subclases por catálogo sólo declaran extraColumns / renderExtraFields /
 * buildPayload para los campos propios (orden, FKs, enums, etc.).
 */
export default function CatalogoTablaCRUD<T extends CatalogoBase, C extends CatalogoCreatePayload>({
  titulo,
  pluralLabel,
  api,
  extraColumns = [],
  renderExtraFields,
  buildPayload,
}: CatalogoTablaCRUDProps<T, C>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [formState, setFormState] = useState<Partial<C>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.list(onlyActive);
      setRows(data);
    } catch {
      setError(`No se pudieron cargar los ${pluralLabel}`);
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
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(term) ||
        r.codigo.toLowerCase().includes(term)
    );
  }, [rows, search]);

  const updateForm = (patch: Partial<C>) => setFormState((s) => ({ ...s, ...patch }));

  const openCreate = () => {
    setEditing(null);
    setFormState({ activo: true } as Partial<C>);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (row: T) => {
    setEditing(row);
    setFormState({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      activo: row.activo,
      ...(row as unknown as Partial<C>),
    });
    setFormError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);

    const baseCodigo = (formState.codigo ?? '').trim();
    const baseNombre = (formState.nombre ?? '').trim();
    if (!baseCodigo) return setFormError('El código es obligatorio');
    if (!baseNombre) return setFormError('El nombre es obligatorio');

    let payload: C;
    if (buildPayload) {
      const built = buildPayload({ ...formState, codigo: baseCodigo, nombre: baseNombre });
      if (typeof built === 'string') return setFormError(built);
      payload = built;
    } else {
      payload = {
        codigo: baseCodigo,
        nombre: baseNombre,
        descripcion: formState.descripcion?.trim() || undefined,
        activo: formState.activo ?? true,
      } as C;
    }

    setSaving(true);
    try {
      if (editing) await api.update(editing.id, payload);
      else await api.create(payload);
      await load();
      setOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409 || apiMsg?.includes('ya existe')) {
        setFormError(`Ya existe otro registro con código '${baseCodigo}'`);
      } else {
        setFormError(apiMsg || 'No se pudo guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: T) => {
    if (!window.confirm(`¿Desactivar "${row.nombre}"?`)) return;
    try {
      await api.delete(row.id);
      await load();
    } catch {
      setError('No se pudo desactivar el registro');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">{titulo}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
          Nuevo
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
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              {extraColumns.map((c) => (
                <TableCell key={c.header} align={c.align ?? 'left'}>{c.header}</TableCell>
              ))}
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4 + extraColumns.length} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4 + extraColumns.length} align="center">
                  <Typography variant="body2" color="text.secondary">Sin registros.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell><code>{row.codigo}</code></TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  {extraColumns.map((c) => (
                    <TableCell key={c.header} align={c.align ?? 'left'}>{c.render(row)}</TableCell>
                  ))}
                  <TableCell>
                    <Chip
                      label={row.activo ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={row.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {row.activo && (
                      <Tooltip title="Desactivar">
                        <IconButton size="small" onClick={() => handleDelete(row)} color="warning">
                          <span style={{ fontSize: 18, lineHeight: 1 }}>✕</span>
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Editar ${titulo.toLowerCase()}` : `Nuevo ${titulo.toLowerCase()}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Código"
              fullWidth
              required
              value={formState.codigo ?? ''}
              onChange={(e) => updateForm({ codigo: e.target.value } as Partial<C>)}
              disabled={!!editing}
              helperText={editing ? 'El código no se puede modificar' : 'Identificador único corto'}
              inputProps={{ maxLength: 80 }}
            />
            <TextField
              label="Nombre"
              fullWidth
              required
              value={formState.nombre ?? ''}
              onChange={(e) => updateForm({ nombre: e.target.value } as Partial<C>)}
              inputProps={{ maxLength: 150 }}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              value={formState.descripcion ?? ''}
              onChange={(e) => updateForm({ descripcion: e.target.value } as Partial<C>)}
            />
            {renderExtraFields?.(formState, updateForm, editing)}
            {editing && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Activo</Typography>
                <Switch
                  checked={!!formState.activo}
                  onChange={(_, v) => updateForm({ activo: v } as Partial<C>)}
                />
              </Stack>
            )}
            {formError && <Alert severity="error">{formError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
