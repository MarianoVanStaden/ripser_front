import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Tabs, Tab, Button, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert,
  CircularProgress, MenuItem, InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Public as PublicIcon,
  MedicalServices as ObraSocialIcon, HealthAndSafety as ArtIcon,
  LocationCity as ProvinciaIcon,
} from '@mui/icons-material';
import {
  paisesApi, provinciasApi, obrasSocialesApi, artsApi,
} from '../../../api/services/catalogosGlobalesApi';
import type {
  Pais, Provincia, ObraSocial, Art,
} from '../../../types/catalogosGlobales.types';
import ConfirmDialog from '../../common/ConfirmDialog';

// ── Genérico CRUD para catálogos planos {id, codigo?, nombre, activo} ────────
interface CatalogoFlat { id: number; codigo?: string | null; nombre: string; activo: boolean; }
interface CatalogoFlatPayload { codigo?: string | null; nombre: string; activo?: boolean; }

interface FlatProps<T extends CatalogoFlat> {
  titulo: string;
  api: {
    list: () => Promise<T[]>;
    create: (dto: any) => Promise<T>;
    update: (id: number, dto: any) => Promise<T>;
    delete: (id: number) => Promise<void>;
  };
  /** Si true, oculta la columna/campo `codigo` (catálogos donde no aplica). */
  hideCodigo?: boolean;
  codigoLabel?: string;
}

function CatalogoFlatCRUD<T extends CatalogoFlat>({ titulo, api, hideCodigo, codigoLabel = 'Código' }: FlatProps<T>) {
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<CatalogoFlatPayload>({ codigo: '', nombre: '', activo: true });
  const [toDelete, setToDelete] = useState<T | null>(null);

  const queryClient = useQueryClient();
  const rowsQuery = useQuery({
    queryKey: ['catalogo-flat', titulo],
    queryFn: () => api.list(),
  });
  const rows = rowsQuery.data ?? [];
  const loading = rowsQuery.isPending;
  const loadError = rowsQuery.error
    ? ((rowsQuery.error as any)?.response?.data?.message || `Error cargando ${titulo.toLowerCase()}`)
    : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['catalogo-flat', titulo] });

  const handleOpenNew = () => {
    setEditing(null);
    setForm({ codigo: '', nombre: '', activo: true });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: T) => {
    setEditing(row);
    setForm({ codigo: row.codigo ?? '', nombre: row.nombre, activo: row.activo });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = {
        codigo: form.codigo?.trim() || null,
        nombre: form.nombre.trim(),
        activo: form.activo ?? true,
      };
      return editing ? api.update(editing.id, dto) : api.create(dto);
    },
    onSuccess: () => { setDialogOpen(false); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al guardar'),
  });
  const handleSave = () => {
    if (!form.nombre.trim()) { setError('Nombre requerido'); return; }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(id),
    onSuccess: () => { setToDelete(null); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al eliminar'),
  });
  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id);
  };

  const filtered = rows.filter(r => !search ||
    r.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (r.codigo ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center" justifyContent="space-between">
        <TextField size="small" placeholder={`Buscar ${titulo.toLowerCase()}…`}
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
          sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenNew}>
          Nuevo
        </Button>
      </Stack>

      {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error || loadError}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {!hideCodigo && <TableCell sx={{ width: 120 }}>{codigoLabel}</TableCell>}
              <TableCell>Nombre</TableCell>
              <TableCell sx={{ width: 100 }}>Estado</TableCell>
              <TableCell sx={{ width: 100 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Sin resultados
              </TableCell></TableRow>
            ) : filtered.map(row => (
              <TableRow key={row.id} hover sx={{ opacity: row.activo ? 1 : 0.5 }}>
                {!hideCodigo && <TableCell><code>{row.codigo || '—'}</code></TableCell>}
                <TableCell>{row.nombre}</TableCell>
                <TableCell>
                  <Chip size="small" label={row.activo ? 'Activo' : 'Inactivo'}
                    color={row.activo ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(row)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Editar ${titulo}` : `Nuevo ${titulo}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {!hideCodigo && (
              <TextField fullWidth label={codigoLabel} value={form.codigo ?? ''}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            )}
            <TextField fullWidth required label="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextField select fullWidth label="Estado" value={form.activo ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}>
              <MenuItem value="true">Activo</MenuItem>
              <MenuItem value="false">Inactivo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.nombre.trim()}>
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`¿Dar de baja ${titulo.toLowerCase()}?`}
        severity="warning"
        description={toDelete ? `Se desactivará "${toDelete.nombre}". Los empleados que ya lo tengan asignado quedan intactos.` : ''}
        confirmLabel="Dar de baja"
      />
    </Box>
  );
}

// ── Tab Países: tiene codigoIso + codigoTelefonico (campos propios) ──────────
function PaisesTab() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pais | null>(null);
  const [form, setForm] = useState({ codigoIso: '', nombre: '', codigoTelefonico: '', activo: true });
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Pais | null>(null);

  const queryClient = useQueryClient();
  const paisesQuery = useQuery({ queryKey: ['paises'], queryFn: () => paisesApi.list() });
  const rows = paisesQuery.data ?? [];
  const loadError = paisesQuery.error ? ((paisesQuery.error as any)?.response?.data?.message || 'Error cargando países') : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['paises'] });

  const filtered = rows.filter(r => !search || r.nombre.toLowerCase().includes(search.toLowerCase()));

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = {
        codigoIso: form.codigoIso.trim().toUpperCase() || null,
        nombre: form.nombre.trim(),
        codigoTelefonico: form.codigoTelefonico.trim() || null,
        activo: form.activo,
      };
      return editing ? paisesApi.update(editing.id, dto) : paisesApi.create(dto);
    },
    onSuccess: () => { setDialogOpen(false); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al guardar'),
  });
  const handleSave = () => {
    if (!form.nombre.trim()) { setError('Nombre requerido'); return; }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => paisesApi.delete(id),
    onSuccess: () => { setToDelete(null); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al eliminar'),
  });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center" justifyContent="space-between">
        <TextField size="small" placeholder="Buscar país…" value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }} sx={{ flex: 1 }} />
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => { setEditing(null); setForm({ codigoIso: '', nombre: '', codigoTelefonico: '', activo: true }); setDialogOpen(true); }}>
          Nuevo
        </Button>
      </Stack>

      {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error || loadError}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}>ISO</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell sx={{ width: 100 }}>Cód. Tel.</TableCell>
              <TableCell sx={{ width: 100 }}>Estado</TableCell>
              <TableCell sx={{ width: 100 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} hover sx={{ opacity: p.activo ? 1 : 0.5 }}>
                <TableCell><code>{p.codigoIso || '—'}</code></TableCell>
                <TableCell>{p.nombre}</TableCell>
                <TableCell>{p.codigoTelefonico ? `+${p.codigoTelefonico}` : '—'}</TableCell>
                <TableCell><Chip size="small" label={p.activo ? 'Activo' : 'Inactivo'} color={p.activo ? 'success' : 'default'} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => {
                    setEditing(p);
                    setForm({ codigoIso: p.codigoIso ?? '', nombre: p.nombre, codigoTelefonico: p.codigoTelefonico ?? '', activo: p.activo });
                    setDialogOpen(true);
                  }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(p)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar país' : 'Nuevo país'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField fullWidth label="Código ISO (2 letras)" value={form.codigoIso}
              onChange={(e) => setForm({ ...form, codigoIso: e.target.value.toUpperCase().slice(0, 2) })}
              inputProps={{ maxLength: 2 }} />
            <TextField fullWidth required label="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextField fullWidth label="Código telefónico" value={form.codigoTelefonico}
              onChange={(e) => setForm({ ...form, codigoTelefonico: e.target.value })}
              placeholder="Ej. 54" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.nombre.trim()}>
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) deleteMutation.mutate(toDelete.id); }}
        title="¿Dar de baja país?" severity="warning"
        description={toDelete ? `Se desactivará "${toDelete.nombre}".` : ''} confirmLabel="Dar de baja" />
    </Box>
  );
}

// ── Tab Provincias: dependiente de país (FK) ─────────────────────────────────
function ProvinciasTab() {
  const [filtroPais, setFiltroPais] = useState<number | ''>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Provincia | null>(null);
  const [form, setForm] = useState<{ paisId: number | ''; nombre: string; codigo: string; activo: boolean }>({
    paisId: '', nombre: '', codigo: '', activo: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Provincia | null>(null);

  const queryClient = useQueryClient();
  const paisesQuery = useQuery({ queryKey: ['paises'], queryFn: () => paisesApi.list() });
  const paises = paisesQuery.data ?? [];
  const provinciasQuery = useQuery({
    queryKey: ['provincias', filtroPais || null],
    queryFn: () => provinciasApi.list(filtroPais || undefined),
  });
  const rows = provinciasQuery.data ?? [];
  const loadError = provinciasQuery.error ? ((provinciasQuery.error as any)?.response?.data?.message || 'Error cargando provincias') : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['provincias', filtroPais || null] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = { paisId: Number(form.paisId), nombre: form.nombre.trim(), codigo: form.codigo.trim() || null, activo: form.activo };
      return editing ? provinciasApi.update(editing.id, dto) : provinciasApi.create(dto);
    },
    onSuccess: () => { setDialogOpen(false); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al guardar'),
  });
  const handleSave = () => {
    if (!form.nombre.trim() || !form.paisId) { setError('País y nombre son requeridos'); return; }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => provinciasApi.delete(id),
    onSuccess: () => { setToDelete(null); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al eliminar'),
  });

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2} alignItems="center" justifyContent="space-between">
        <TextField size="small" select label="Filtrar por país" value={filtroPais}
          onChange={(e) => setFiltroPais(e.target.value === '' ? '' : Number(e.target.value))} sx={{ minWidth: 220 }}>
          <MenuItem value="">— Todos —</MenuItem>
          {paises.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
        </TextField>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => { setEditing(null); setForm({ paisId: filtroPais || '', nombre: '', codigo: '', activo: true }); setDialogOpen(true); }}>
          Nueva provincia
        </Button>
      </Stack>

      {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error || loadError}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>País</TableCell>
              <TableCell>Provincia</TableCell>
              <TableCell sx={{ width: 100 }}>Código</TableCell>
              <TableCell sx={{ width: 100 }}>Estado</TableCell>
              <TableCell sx={{ width: 100 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(p => (
              <TableRow key={p.id} hover sx={{ opacity: p.activo ? 1 : 0.5 }}>
                <TableCell>{p.paisNombre || '—'}</TableCell>
                <TableCell>{p.nombre}</TableCell>
                <TableCell><code>{p.codigo || '—'}</code></TableCell>
                <TableCell><Chip size="small" label={p.activo ? 'Activa' : 'Inactiva'} color={p.activo ? 'success' : 'default'} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => {
                    setEditing(p);
                    setForm({ paisId: p.paisId, nombre: p.nombre, codigo: p.codigo ?? '', activo: p.activo });
                    setDialogOpen(true);
                  }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(p)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar provincia' : 'Nueva provincia'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField select fullWidth required label="País" value={form.paisId}
              onChange={(e) => setForm({ ...form, paisId: e.target.value === '' ? '' : Number(e.target.value) })}>
              <MenuItem value="">— Seleccionar —</MenuItem>
              {paises.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
            </TextField>
            <TextField fullWidth required label="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextField fullWidth label="Código" value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.nombre.trim() || !form.paisId}>
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) deleteMutation.mutate(toDelete.id); }}
        title="¿Dar de baja provincia?" severity="warning"
        description={toDelete ? `Se desactivará "${toDelete.nombre}".` : ''} confirmLabel="Dar de baja" />
    </Box>
  );
}

const TAB_DEFS = [
  { label: 'Países', icon: <PublicIcon /> },
  { label: 'Provincias', icon: <ProvinciaIcon /> },
  { label: 'Obras Sociales', icon: <ObraSocialIcon /> },
  { label: 'ART', icon: <ArtIcon /> },
];

export default function CatalogosGlobalesPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Catálogos Globales</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tablas de referencia compartidas entre todas las empresas: países, provincias, obras sociales y ART.
        Se usan en el legajo del empleado y se administran solo por super-admin.
        (Bancos se administra desde el módulo de cuentas bancarias.)
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        {TAB_DEFS.map((t, i) => <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />)}
      </Tabs>

      {tab === 0 && <PaisesTab />}
      {tab === 1 && <ProvinciasTab />}
      {tab === 2 && <CatalogoFlatCRUD<ObraSocial> titulo="Obra Social" api={obrasSocialesApi} codigoLabel="Cód. RNOS" />}
      {tab === 3 && <CatalogoFlatCRUD<Art> titulo="ART" api={artsApi} hideCodigo />}
    </Box>
  );
}
