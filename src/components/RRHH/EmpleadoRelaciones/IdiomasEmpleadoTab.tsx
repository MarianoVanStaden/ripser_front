import React, { useEffect, useState } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Typography, Alert, Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Translate as TranslateIcon } from '@mui/icons-material';
import { idiomasEmpleadoApi } from '../../../api/services/empleadoRelacionesApi';
import type { IdiomaEmpleadoItem, NivelIdioma } from '../../../types/rrhh.types';
import { NIVELES_IDIOMA, NIVEL_IDIOMA_LABEL } from '../../../types/rrhh.types';
import ConfirmDialog from '../../common/ConfirmDialog';

interface Props { empleadoId: number; }

type FormState = { id?: number; idioma: string; nivel: NivelIdioma | ''; };
const emptyForm: FormState = { idioma: '', nivel: '' };

const nivelColor = (n: NivelIdioma): 'success' | 'warning' | 'default' =>
  n === 'ALTO' ? 'success' : n === 'MEDIO' ? 'warning' : 'default';

const IdiomasEmpleadoTab: React.FC<Props> = ({ empleadoId }) => {
  const [items, setItems] = useState<IdiomaEmpleadoItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<IdiomaEmpleadoItem | null>(null);

  const load = async () => {
    try {
      setItems(await idiomasEmpleadoApi.getByEmpleado(empleadoId));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando idiomas');
    }
  };

  useEffect(() => { load(); }, [empleadoId]);

  const handleOpenNew = () => { setForm(emptyForm); setDialogOpen(true); };
  const handleOpenEdit = (i: IdiomaEmpleadoItem) => {
    setForm({ id: i.id, idioma: i.idioma, nivel: i.nivel });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.idioma.trim() || !form.nivel) {
      setError('Idioma y nivel son requeridos'); return;
    }
    const dto = { idioma: form.idioma.trim(), nivel: form.nivel as NivelIdioma };
    try {
      if (form.id) await idiomasEmpleadoApi.update(empleadoId, form.id, dto);
      else await idiomasEmpleadoApi.create(empleadoId, dto);
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await idiomasEmpleadoApi.delete(empleadoId, toDelete.id);
      setToDelete(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>Idiomas ({items.length})</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenNew}>
          Agregar
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Idioma</TableCell>
              <TableCell>Nivel</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  <TranslateIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><br />
                  Sin idiomas cargados.
                </TableCell>
              </TableRow>
            ) : items.map(i => (
              <TableRow key={i.id} hover>
                <TableCell>{i.idioma}</TableCell>
                <TableCell>
                  <Chip size="small" label={NIVEL_IDIOMA_LABEL[i.nivel]} color={nivelColor(i.nivel)} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(i)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(i)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{form.id ? 'Editar idioma' : 'Nuevo idioma'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required label="Idioma" placeholder="Inglés, Portugués…"
                  value={form.idioma}
                  onChange={(e) => setForm({ ...form, idioma: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth select required label="Nivel" value={form.nivel}
                  onChange={(e) => setForm({ ...form, nivel: e.target.value as NivelIdioma })}>
                  {NIVELES_IDIOMA.map(n => <MenuItem key={n} value={n}>{NIVEL_IDIOMA_LABEL[n]}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={!form.idioma.trim() || !form.nivel}>
            {form.id ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar idioma?"
        severity="error"
        description={toDelete ? `Está por eliminar ${toDelete.idioma}.` : ''}
        confirmLabel="Eliminar"
      />
    </Box>
  );
};

export default IdiomasEmpleadoTab;
