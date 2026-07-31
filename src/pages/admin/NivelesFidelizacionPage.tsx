import React, { useEffect, useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Loyalty as LoyaltyIcon,
} from '@mui/icons-material';
import type { NivelFidelizacion, NivelFidelizacionRequest } from '../../types';
import { nivelFidelizacionApi } from '../../api/services/nivelFidelizacionApi';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const EMPTY_FORM: NivelFidelizacionRequest = { nivel: 1, minCompras: 1, descuentoSugerido: 0, nombre: '' };

/**
 * Configuración de niveles de fidelización (nivel → % descuento sugerido).
 * Un cliente alcanza el nivel de mayor "compras mínimas" que cubra su
 * cantidad de compras válidas (facturas no anuladas). El descuento es
 * sugerido: se muestra a ventas, no se aplica automáticamente.
 */
const NivelesFidelizacionPage: React.FC = () => {
  const [rows, setRows] = useState<NivelFidelizacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NivelFidelizacion | null>(null);
  const [form, setForm] = useState<NivelFidelizacionRequest>(EMPTY_FORM);
  const [toDelete, setToDelete] = useState<NivelFidelizacion | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await nivelFidelizacionApi.list());
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando niveles de fidelización');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleOpenNew = () => {
    setEditing(null);
    const maxNivel = rows.reduce((m, r) => Math.max(m, r.nivel), 0);
    const maxMin = rows.reduce((m, r) => Math.max(m, r.minCompras), 0);
    setForm({ nivel: maxNivel + 1, minCompras: maxMin + 1, descuentoSugerido: 0, nombre: '' });
    setDialogOpen(true);
  };

  const handleOpenEdit = (row: NivelFidelizacion) => {
    setEditing(row);
    setForm({ nivel: row.nivel, minCompras: row.minCompras, descuentoSugerido: row.descuentoSugerido, nombre: row.nombre ?? '' });
    setDialogOpen(true);
  };

  const formValido =
    form.nivel >= 1 && form.minCompras >= 1 &&
    form.descuentoSugerido >= 0 && form.descuentoSugerido <= 100;

  const handleSave = async () => {
    if (!formValido) return;
    const dto: NivelFidelizacionRequest = {
      nivel: form.nivel,
      minCompras: form.minCompras,
      descuentoSugerido: form.descuentoSugerido,
      nombre: form.nombre?.trim() || undefined,
    };
    try {
      if (editing) await nivelFidelizacionApi.update(editing.id, dto);
      else await nivelFidelizacionApi.create(dto);
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al guardar el nivel');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await nivelFidelizacionApi.delete(toDelete.id);
      setToDelete(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al eliminar el nivel');
    }
  };

  const numField = (key: 'nivel' | 'minCompras' | 'descuentoSugerido') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value === '' ? 0 : Number(e.target.value);
      setForm({ ...form, [key]: Number.isNaN(v) ? 0 : v });
    };

  return (
    <Box sx={{ px: { sm: 2, md: 3, lg: 4 }, py: { sm: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <LoyaltyIcon color="secondary" />
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
            Niveles de Fidelización
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenNew}>
          Nuevo Nivel
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Un cliente alcanza el nivel cuyo mínimo de compras cubra sus compras válidas
        (facturas no anuladas). El descuento es sugerido para ventas; no se aplica
        automáticamente a ningún documento.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 90 }}>Nivel</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell sx={{ width: 140 }} align="right">Compras mínimas</TableCell>
              <TableCell sx={{ width: 160 }} align="right">Descuento sugerido</TableCell>
              <TableCell sx={{ width: 100 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Sin niveles configurados. Los clientes no mostrarán nivel hasta que cargues al menos uno.
              </TableCell></TableRow>
            ) : rows.map(row => (
              <TableRow key={row.id} hover>
                <TableCell><Chip label={`Nivel ${row.nivel}`} size="small" color="secondary" variant="outlined" /></TableCell>
                <TableCell>{row.nombre || '—'}</TableCell>
                <TableCell align="right">{row.minCompras}</TableCell>
                <TableCell align="right">{row.descuentoSugerido}%</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(row)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(row)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? `Editar Nivel ${editing.nivel}` : 'Nuevo Nivel'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth required type="number" label="Nivel"
              value={form.nivel}
              onChange={numField('nivel')}
              inputProps={{ min: 1 }}
              error={form.nivel < 1}
            />
            <TextField
              fullWidth required type="number" label="Compras mínimas"
              value={form.minCompras}
              onChange={numField('minCompras')}
              inputProps={{ min: 1 }}
              error={form.minCompras < 1}
              helperText="Cantidad de compras válidas para alcanzar este nivel"
            />
            <TextField
              fullWidth required type="number" label="Descuento sugerido (%)"
              value={form.descuentoSugerido}
              onChange={numField('descuentoSugerido')}
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              error={form.descuentoSugerido < 0 || form.descuentoSugerido > 100}
            />
            <TextField
              fullWidth label="Nombre (opcional)" value={form.nombre ?? ''}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              inputProps={{ maxLength: 50 }}
              placeholder="Ej: Cliente frecuente, VIP…"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formValido}>
            {editing ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar nivel?"
        severity="warning"
        description={toDelete
          ? `Se eliminará el Nivel ${toDelete.nivel}${toDelete.nombre ? ` (${toDelete.nombre})` : ''}. Los clientes que hoy lo alcanzan pasarán al nivel inferior.`
          : ''}
        confirmLabel="Eliminar"
      />
    </Box>
  );
};

export default NivelesFidelizacionPage;
