import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<IdiomaEmpleadoItem | null>(null);

  const queryClient = useQueryClient();
  const itemsQuery = useQuery({
    queryKey: ['idiomas-empleado', empleadoId],
    queryFn: () => idiomasEmpleadoApi.getByEmpleado(empleadoId),
  });
  const items = itemsQuery.data ?? [];
  const loadError = itemsQuery.error ? ((itemsQuery.error as any)?.response?.data?.message || 'Error cargando idiomas') : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['idiomas-empleado', empleadoId] });

  const handleOpenNew = () => { setForm(emptyForm); setDialogOpen(true); };
  const handleOpenEdit = (i: IdiomaEmpleadoItem) => {
    setForm({ id: i.id, idioma: i.idioma, nivel: i.nivel });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const dto = { idioma: form.idioma.trim(), nivel: form.nivel as NivelIdioma };
      return form.id ? idiomasEmpleadoApi.update(empleadoId, form.id, dto) : idiomasEmpleadoApi.create(empleadoId, dto);
    },
    onSuccess: () => { setDialogOpen(false); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al guardar'),
  });
  const handleSave = () => {
    if (!form.idioma.trim() || !form.nivel) {
      setError('Idioma y nivel son requeridos'); return;
    }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => idiomasEmpleadoApi.delete(empleadoId, id),
    onSuccess: () => { setToDelete(null); load(); },
    onError: (e: any) => setError(e?.response?.data?.message || 'Error al eliminar'),
  });
  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>Idiomas ({items.length})</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenNew}>
          Agregar
        </Button>
      </Box>

      {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error || loadError}</Alert>}

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
