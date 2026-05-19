import React, { useEffect, useState } from 'react';
import {
  Box, Button, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Grid, Typography, Alert, Chip, Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, FamilyRestroom as FamilyIcon } from '@mui/icons-material';
import { cargasFamiliaresApi } from '../../../api/services/empleadoRelacionesApi';
import type { CargaFamiliar, VinculoCargaFamiliar } from '../../../types/rrhh.types';
import { VINCULOS_CARGA, VINCULO_CARGA_LABEL } from '../../../types/rrhh.types';
import ConfirmDialog from '../../common/ConfirmDialog';

interface Props { empleadoId: number; }

type FormState = {
  id?: number;
  vinculo: VinculoCargaFamiliar | '';
  nombreCompleto: string;
  dni: string;
  cuil: string;
  fechaNacimiento: string;
  observaciones: string;
};

const emptyForm: FormState = {
  vinculo: '', nombreCompleto: '', dni: '', cuil: '', fechaNacimiento: '', observaciones: '',
};

const CargasFamiliaresTab: React.FC<Props> = ({ empleadoId }) => {
  const [items, setItems] = useState<CargaFamiliar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<CargaFamiliar | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await cargasFamiliaresApi.getByEmpleado(empleadoId);
      setItems(data);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando cargas familiares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [empleadoId]);

  const handleOpenNew = () => { setForm(emptyForm); setDialogOpen(true); };
  const handleOpenEdit = (c: CargaFamiliar) => {
    setForm({
      id: c.id, vinculo: c.vinculo, nombreCompleto: c.nombreCompleto,
      dni: c.dni ?? '', cuil: c.cuil ?? '',
      fechaNacimiento: c.fechaNacimiento ?? '', observaciones: c.observaciones ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.vinculo) { setError('Vínculo requerido'); return; }
    if (!form.nombreCompleto.trim()) { setError('Nombre completo requerido'); return; }
    const dto = {
      vinculo: form.vinculo as VinculoCargaFamiliar,
      nombreCompleto: form.nombreCompleto.trim(),
      dni: form.dni.trim() || null,
      cuil: form.cuil.trim() || null,
      fechaNacimiento: form.fechaNacimiento || null,
      observaciones: form.observaciones.trim() || null,
    };
    try {
      if (form.id) await cargasFamiliaresApi.update(empleadoId, form.id, dto);
      else await cargasFamiliaresApi.create(empleadoId, dto);
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al guardar');
    }
  };

  const handleConfirmDelete = async () => {
    if (!toDelete) return;
    try {
      await cargasFamiliaresApi.delete(empleadoId, toDelete.id);
      setToDelete(null);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al eliminar');
    }
  };

  // Bajita de asignación cuando cumple 18 (no aplica a hijo con discapacidad)
  const edadCarga = (fechaNac?: string | null) => {
    if (!fechaNac) return null;
    const nac = new Date(fechaNac); const hoy = new Date();
    let age = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) age--;
    return age;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Cargas de Familia ({items.length})
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenNew}>
          Agregar
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2, fontSize: '0.85rem' }}>
        Requerido para asignaciones familiares (SUAF/ANSES). DNI/CUIL y fecha de nacimiento son críticos
        — la fecha permite la baja automática del beneficio al cumplir 18 años. Hijo con discapacidad
        duplica la asignación.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vínculo</TableCell>
              <TableCell>Nombre completo</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>CUIL</TableCell>
              <TableCell>F. Nac.</TableCell>
              <TableCell>Edad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  <FamilyIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} /><br />
                  Sin cargas de familia cargadas.
                </TableCell>
              </TableRow>
            ) : items.map(c => {
              const edad = edadCarga(c.fechaNacimiento);
              const baja = c.vinculo === 'HIJO' && edad !== null && edad >= 18;
              return (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Chip size="small" label={VINCULO_CARGA_LABEL[c.vinculo]}
                      color={c.vinculo === 'HIJO_DISCAPACIDAD' ? 'secondary' : 'default'} />
                  </TableCell>
                  <TableCell>{c.nombreCompleto}</TableCell>
                  <TableCell>{c.dni || '—'}</TableCell>
                  <TableCell>{c.cuil || '—'}</TableCell>
                  <TableCell>{c.fechaNacimiento || '—'}</TableCell>
                  <TableCell>
                    {edad !== null ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {edad} años
                        {baja && (
                          <Tooltip title="Excede la edad para asignación familiar. Hay que dar de baja el beneficio.">
                            <Chip size="small" label="Baja" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Tooltip>
                        )}
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(c)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setToDelete(c)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? 'Editar carga familiar' : 'Nueva carga familiar'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select required label="Vínculo" value={form.vinculo}
                  onChange={(e) => setForm({ ...form, vinculo: e.target.value as VinculoCargaFamiliar })}>
                  {VINCULOS_CARGA.map(v => <MenuItem key={v} value={v}>{VINCULO_CARGA_LABEL[v]}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha de Nacimiento" type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required label="Nombre completo" value={form.nombreCompleto}
                  onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} />
              </Grid>
              <Grid item xs={6} sm={6}>
                <TextField fullWidth label="DNI" value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                  inputProps={{ inputMode: 'numeric', maxLength: 8 }} />
              </Grid>
              <Grid item xs={6} sm={6}>
                <TextField fullWidth label="CUIL" value={form.cuil}
                  onChange={(e) => setForm({ ...form, cuil: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  inputProps={{ inputMode: 'numeric', maxLength: 11 }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Observaciones" multiline rows={2}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={!form.vinculo || !form.nombreCompleto.trim()}>
            {form.id ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar carga familiar?"
        severity="error"
        description={toDelete ? `Está por eliminar a ${toDelete.nombreCompleto}.` : ''}
        confirmLabel="Eliminar"
      />
    </Box>
  );
};

export default CargasFamiliaresTab;
