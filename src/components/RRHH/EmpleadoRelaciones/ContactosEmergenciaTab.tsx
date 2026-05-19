import React, { useEffect, useState } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Grid, Typography, Alert, Chip, FormControlLabel, Checkbox,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, EmergencyShare as EmergencyIcon, Star as StarIcon } from '@mui/icons-material';
import { contactosEmergenciaApi } from '../../../api/services/empleadoRelacionesApi';
import type { ContactoEmergencia } from '../../../types/rrhh.types';
import ConfirmDialog from '../../common/ConfirmDialog';

interface Props { empleadoId: number; }

type FormState = {
  id?: number;
  nombreCompleto: string;
  relacion: string;
  telCodigoPais: string;
  telArea: string;
  telNumero: string;
  email: string;
  esPrincipal: boolean;
};

const emptyForm: FormState = {
  nombreCompleto: '', relacion: '', telCodigoPais: '', telArea: '', telNumero: '', email: '', esPrincipal: false,
};

const ContactosEmergenciaTab: React.FC<Props> = ({ empleadoId }) => {
  const [items, setItems] = useState<ContactoEmergencia[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ContactoEmergencia | null>(null);

  const load = async () => {
    try {
      setItems(await contactosEmergenciaApi.getByEmpleado(empleadoId));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando contactos');
    }
  };

  useEffect(() => { load(); }, [empleadoId]);

  const handleOpenNew = () => {
    // Si no hay ninguno, el primero queda como principal por default.
    setForm({ ...emptyForm, esPrincipal: items.length === 0 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: ContactoEmergencia) => {
    setForm({
      id: c.id, nombreCompleto: c.nombreCompleto, relacion: c.relacion ?? '',
      telCodigoPais: c.telCodigoPais ?? '', telArea: c.telArea ?? '',
      telNumero: c.telNumero ?? '', email: c.email ?? '', esPrincipal: c.esPrincipal,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombreCompleto.trim()) { setError('Nombre completo requerido'); return; }
    const dto = {
      nombreCompleto: form.nombreCompleto.trim(),
      relacion: form.relacion.trim() || null,
      telCodigoPais: form.telCodigoPais.trim() || null,
      telArea: form.telArea.trim() || null,
      telNumero: form.telNumero.trim() || null,
      email: form.email.trim() || null,
      esPrincipal: form.esPrincipal,
    };
    try {
      if (form.id) await contactosEmergenciaApi.update(empleadoId, form.id, dto);
      else await contactosEmergenciaApi.create(empleadoId, dto);
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await contactosEmergenciaApi.delete(empleadoId, toDelete.id);
      setToDelete(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al eliminar');
    }
  };

  const telFormat = (c: ContactoEmergencia) => {
    const parts = [c.telCodigoPais, c.telArea, c.telNumero].filter(Boolean);
    return parts.length > 0 ? `(${parts.slice(0, -1).join(') (')}) ${parts.at(-1)}` : '—';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Contactos de Emergencia ({items.length})
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenNew}>
          Agregar
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Relación</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  <EmergencyIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><br />
                  Sin contactos de emergencia cargados.
                </TableCell>
              </TableRow>
            ) : items.map(c => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {c.esPrincipal && <Chip size="small" icon={<StarIcon />} label="Principal" color="primary" />}
                    {c.nombreCompleto}
                  </Box>
                </TableCell>
                <TableCell>{c.relacion || '—'}</TableCell>
                <TableCell>{telFormat(c)}</TableCell>
                <TableCell>{c.email || '—'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(c)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setToDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Editar contacto' : 'Nuevo contacto de emergencia'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth required label="Nombre completo" value={form.nombreCompleto}
                  onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Relación / Vínculo" placeholder="Madre, Hermano, etc."
                  value={form.relacion}
                  onChange={(e) => setForm({ ...form, relacion: e.target.value })} />
              </Grid>
              <Grid item xs={4} sm={2}>
                <TextField fullWidth label="Cód. País" value={form.telCodigoPais}
                  onChange={(e) => setForm({ ...form, telCodigoPais: e.target.value })} />
              </Grid>
              <Grid item xs={4} sm={3}>
                <TextField fullWidth label="Área (sin 0)" value={form.telArea}
                  onChange={(e) => setForm({ ...form, telArea: e.target.value })} />
              </Grid>
              <Grid item xs={4} sm={4}>
                <TextField fullWidth label="Número (sin 15)" value={form.telNumero}
                  onChange={(e) => setForm({ ...form, telNumero: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={form.esPrincipal}
                    onChange={(e) => setForm({ ...form, esPrincipal: e.target.checked })} />}
                  label="Marcar como contacto principal" />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.nombreCompleto.trim()}>
            {form.id ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar contacto?"
        severity="error"
        description={toDelete ? `Está por eliminar a ${toDelete.nombreCompleto}.` : ''}
        confirmLabel="Eliminar"
      />
    </Box>
  );
};

export default ContactosEmergenciaTab;
