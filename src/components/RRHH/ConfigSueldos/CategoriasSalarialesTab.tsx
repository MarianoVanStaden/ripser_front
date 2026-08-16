import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, InputAdornment, Stack, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography, Alert, FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Save as SaveIcon,
} from '@mui/icons-material';
import { categoriaSalarialApi } from '../../../api/services/categoriaSalarialApi';
import type { CategoriaSalarial, CategoriaSalarialCreateDTO } from '../../../types';

const emptyForm: CategoriaSalarialCreateDTO = {
  nombre: '',
  sueldoFijo: 0,
  presentismoDia: 0,
  horaExtraValor: 0,
  horaAusenteValor: 0,
  kmValor: 0,
  activo: true,
};

const CategoriasSalarialesTab: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoriaSalarial | null>(null);
  const [form, setForm] = useState<CategoriaSalarialCreateDTO>(emptyForm);

  const [confirmDelete, setConfirmDelete] = useState<CategoriaSalarial | null>(null);

  const queryClient = useQueryClient();
  const itemsQuery = useQuery({
    queryKey: ['categorias-salariales'],
    queryFn: async () => {
      const data = await categoriaSalarialApi.getAll();
      return Array.isArray(data) ? data : [];
    },
  });
  const items = itemsQuery.data ?? [];
  const loading = itemsQuery.isPending;
  const loadError = itemsQuery.error ? 'Error al cargar categorías salariales' : null;
  const load = () => queryClient.invalidateQueries({ queryKey: ['categorias-salariales'] });

  const handleOpen = (cat?: CategoriaSalarial) => {
    if (cat) {
      setEditing(cat);
      setForm({
        nombre: cat.nombre,
        sueldoFijo: Number(cat.sueldoFijo),
        presentismoDia: Number(cat.presentismoDia),
        horaExtraValor: Number(cat.horaExtraValor),
        horaAusenteValor: Number(cat.horaAusenteValor),
        kmValor: Number(cat.kmValor),
        activo: cat.activo,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => (editing ? categoriaSalarialApi.update(editing.id, form) : categoriaSalarialApi.create(form)),
    onSuccess: () => { setOpen(false); load(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al guardar'),
  });
  const handleSave = () => {
    if (!form.nombre.trim()) { setError('Nombre obligatorio'); return; }
    saveMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriaSalarialApi.delete(id),
    onSuccess: () => { setConfirmDelete(null); load(); },
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al eliminar (¿está en uso?)'),
  });
  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMutation.mutate(confirmDelete.id);
  };

  return (
    <Box>
      {(error || loadError) && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error || loadError}</Alert>}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Nueva Categoría
        </Button>
      </Box>

      <Card sx={{ boxShadow: 2 }}>
        <CardContent>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Sueldo Fijo</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Presentismo/día</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Valor HE</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Valor HA</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Valor KM</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} align="center">Cargando...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center">Sin categorías</TableCell></TableRow>
                ) : items.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography fontWeight={600}>{c.nombre}</Typography></TableCell>
                    <TableCell align="right">${Number(c.sueldoFijo).toLocaleString('es-AR')}</TableCell>
                    <TableCell align="right">${Number(c.presentismoDia).toLocaleString('es-AR')}</TableCell>
                    <TableCell align="right">${Number(c.horaExtraValor).toLocaleString('es-AR')}</TableCell>
                    <TableCell align="right">${Number(c.horaAusenteValor).toLocaleString('es-AR')}</TableCell>
                    <TableCell align="right">${Number(c.kmValor).toLocaleString('es-AR')}</TableCell>
                    <TableCell align="center">{c.activo ? 'Activa' : 'Inactiva'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => handleOpen(c)}><EditIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => setConfirmDelete(c)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {editing ? 'Editar Categoría Salarial' : 'Nueva Categoría Salarial'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth label="Nombre *" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={<Switch checked={form.activo ?? true} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />}
                label="Activa"
              />
            </Grid>

            {([
              ['sueldoFijo', 'Sueldo Fijo'],
              ['presentismoDia', 'Presentismo / día'],
              ['horaExtraValor', 'Valor Hora Extra'],
              ['horaAusenteValor', 'Valor Hora Ausente'],
              ['kmValor', 'Valor por KM'],
            ] as Array<[keyof CategoriaSalarialCreateDTO, string]>).map(([key, label]) => (
              <Grid key={String(key)} item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth type="number" label={label}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) || 0 } as any)}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
            {editing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>Eliminar categoría</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>¿Eliminar la categoría <strong>{confirmDelete?.nombre}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriasSalarialesTab;
