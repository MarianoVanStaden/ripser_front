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
  Divider,
  Grid,
  IconButton,
  MenuItem,
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
import {
  especificacionTecnicaApi,
  type EspecificacionTecnicaModeloDTO,
  type CreateEspecificacionTecnicaRequest,
  type UpdateEspecificacionTecnicaRequest,
} from '../../api/services/especificacionTecnicaApi';
import type { TipoEquipo } from '../../types';

const TIPOS_EQUIPO: TipoEquipo[] = ['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'];

type FormState = {
  tipo: TipoEquipo;
  modelo: string;
  motor: string;
  gas: string;
  humedad: string;
  sistema: string;
  estructura: string;
  gabinete: string;
  iluminacion: string;
  transformador: string;
  leds: string;
  vidrios: string;
  paneles: string;
  puertas: string;
  revestimiento: string;
  estanteriasCantidad: string;
  estanteriasFormato: string;
  alto: string;
  profundidad: string;
  ancho: string;
  activo: boolean;
};

const emptyForm = (): FormState => ({
  tipo: 'HELADERA',
  modelo: '',
  motor: '',
  gas: '',
  humedad: '',
  sistema: '',
  estructura: '',
  gabinete: '',
  iluminacion: '',
  transformador: '',
  leds: '',
  vidrios: '',
  paneles: '',
  puertas: '',
  revestimiento: '',
  estanteriasCantidad: '',
  estanteriasFormato: '',
  alto: '',
  profundidad: '',
  ancho: '',
  activo: true,
});

const fromDTO = (e: EspecificacionTecnicaModeloDTO): FormState => ({
  tipo: e.tipo,
  modelo: e.modelo,
  motor: e.motor ?? '',
  gas: e.gas ?? '',
  humedad: e.humedad ?? '',
  sistema: e.sistema ?? '',
  estructura: e.estructura ?? '',
  gabinete: e.gabinete ?? '',
  iluminacion: e.iluminacion ?? '',
  transformador: e.transformador ?? '',
  leds: e.leds ?? '',
  vidrios: e.vidrios ?? '',
  paneles: e.paneles ?? '',
  puertas: e.puertas ?? '',
  revestimiento: e.revestimiento ?? '',
  estanteriasCantidad: e.estanteriasCantidad?.toString() ?? '',
  estanteriasFormato: e.estanteriasFormato ?? '',
  alto: e.alto?.toString() ?? '',
  profundidad: e.profundidad?.toString() ?? '',
  ancho: e.ancho?.toString() ?? '',
  activo: e.activo,
});

const parseNumberOrUndefined = (s: string): number | undefined => {
  if (s === '' || s === null) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const blankToUndef = (s: string) => (s.trim() === '' ? undefined : s.trim());

/**
 * ABM del catálogo de fichas técnicas por (tipo, modelo). Carga la matriz
 * que la empresa tenía en planilla — motor, gas, sistema, estructura, etc.
 * Esta data se consume al imprimir la ficha + QR de un equipo.
 */
export default function EspecificacionesTecnicasPage() {
  const [items, setItems] = useState<EspecificacionTecnicaModeloDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EspecificacionTecnicaModeloDTO | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await especificacionTecnicaApi.list(onlyActive ? true : undefined);
      setItems(data);
    } catch (err) {
      console.error('Error loading especificaciones:', err);
      setError('No se pudieron cargar las fichas técnicas');
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
    if (!term) return items;
    return items.filter(
      (e) =>
        e.modelo.toLowerCase().includes(term) ||
        e.tipo.toLowerCase().includes(term),
    );
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (e: EspecificacionTecnicaModeloDTO) => {
    setEditing(e);
    setForm(fromDTO(e));
    setFormError(null);
    setDialogOpen(true);
  };

  const buildPayload = (): CreateEspecificacionTecnicaRequest => ({
    tipo: form.tipo,
    modelo: form.modelo.trim(),
    motor: blankToUndef(form.motor),
    gas: blankToUndef(form.gas),
    humedad: blankToUndef(form.humedad),
    sistema: blankToUndef(form.sistema),
    estructura: blankToUndef(form.estructura),
    gabinete: blankToUndef(form.gabinete),
    iluminacion: blankToUndef(form.iluminacion),
    transformador: blankToUndef(form.transformador),
    leds: blankToUndef(form.leds),
    vidrios: blankToUndef(form.vidrios),
    paneles: blankToUndef(form.paneles),
    puertas: blankToUndef(form.puertas),
    revestimiento: blankToUndef(form.revestimiento),
    estanteriasCantidad: parseNumberOrUndefined(form.estanteriasCantidad),
    estanteriasFormato: blankToUndef(form.estanteriasFormato),
    alto: parseNumberOrUndefined(form.alto),
    profundidad: parseNumberOrUndefined(form.profundidad),
    ancho: parseNumberOrUndefined(form.ancho),
  });

  const handleSave = async () => {
    if (!form.modelo.trim()) {
      setFormError('El modelo es obligatorio');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const payload: UpdateEspecificacionTecnicaRequest = {
          ...buildPayload(),
          activo: form.activo,
        };
        await especificacionTecnicaApi.update(editing.id, payload);
      } else {
        await especificacionTecnicaApi.create(buildPayload());
      }
      await load();
      setDialogOpen(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setFormError('Ya existe otra ficha técnica para ese tipo y modelo');
      } else {
        setFormError('No se pudo guardar la ficha técnica');
      }
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Fichas técnicas por modelo</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva ficha
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
        >
          <TextField
            label="Buscar por tipo o modelo"
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell>Motor</TableCell>
              <TableCell>Sistema</TableCell>
              <TableCell>Medidas (A×P×An)</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Sin fichas técnicas para mostrar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{e.tipo}</TableCell>
                  <TableCell>{e.modelo}</TableCell>
                  <TableCell>{e.motor ?? '-'}</TableCell>
                  <TableCell>{e.sistema ?? '-'}</TableCell>
                  <TableCell>
                    {e.alto || e.profundidad || e.ancho
                      ? `${e.alto ?? '-'} × ${e.profundidad ?? '-'} × ${e.ancho ?? '-'}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={e.activo ? 'Activa' : 'Inactiva'}
                      size="small"
                      color={e.activo ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(e)}
                        aria-label="Editar ficha"
                      >
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editing ? 'Editar ficha técnica' : 'Nueva ficha técnica'}</DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Identificación
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Tipo"
                value={form.tipo}
                onChange={(e) => setField('tipo', e.target.value as TipoEquipo)}
              >
                {TIPOS_EQUIPO.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="Modelo *"
                value={form.modelo}
                onChange={(e) => setField('modelo', e.target.value)}
                inputProps={{ maxLength: 80 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Componentes
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Motor"
                value={form.motor}
                onChange={(e) => setField('motor', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Gas"
                value={form.gas}
                onChange={(e) => setField('gas', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Humedad"
                value={form.humedad}
                onChange={(e) => setField('humedad', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Sistema"
                value={form.sistema}
                onChange={(e) => setField('sistema', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Iluminación"
                value={form.iluminacion}
                onChange={(e) => setField('iluminacion', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Estructura"
                value={form.estructura}
                onChange={(e) => setField('estructura', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Gabinete"
                value={form.gabinete}
                onChange={(e) => setField('gabinete', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Transformador"
                value={form.transformador}
                onChange={(e) => setField('transformador', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Leds"
                value={form.leds}
                onChange={(e) => setField('leds', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Vidrios"
                value={form.vidrios}
                onChange={(e) => setField('vidrios', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Paneles"
                value={form.paneles}
                onChange={(e) => setField('paneles', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Puertas"
                value={form.puertas}
                onChange={(e) => setField('puertas', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Revestimiento"
                value={form.revestimiento}
                onChange={(e) => setField('revestimiento', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Estanterías y dimensiones
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Cantidad estanterías"
                value={form.estanteriasCantidad}
                onChange={(e) => setField('estanteriasCantidad', e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Formato"
                placeholder="Rectos / Escalonados"
                value={form.estanteriasFormato}
                onChange={(e) => setField('estanteriasFormato', e.target.value)}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ step: '0.01' }}
                label="Alto (m)"
                value={form.alto}
                onChange={(e) => setField('alto', e.target.value)}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ step: '0.01' }}
                label="Profundidad (m)"
                value={form.profundidad}
                onChange={(e) => setField('profundidad', e.target.value)}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ step: '0.01' }}
                label="Ancho (m)"
                value={form.ancho}
                onChange={(e) => setField('ancho', e.target.value)}
              />
            </Grid>
          </Grid>

          {editing && (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Activa</Typography>
                <Switch
                  checked={form.activo}
                  onChange={(_, v) => setField('activo', v)}
                />
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
