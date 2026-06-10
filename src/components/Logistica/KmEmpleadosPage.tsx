import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RouteIcon from '@mui/icons-material/Route';
import { registroKmEmpleadoApi } from '../../api/services/registroKmEmpleadoApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { RegistroKmEmpleadoDTO } from '../../types';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface EmpleadoLite {
  id: number;
  nombre?: string;
  apellido?: string;
}

interface FormState {
  empleadoId: string;
  anio: string;
  mes: string;
  kmRecorridos: string;
  horasExtra: string;
  observaciones: string;
}

const emptyForm = (anio: number): FormState => ({
  empleadoId: '',
  anio: String(anio),
  mes: String(new Date().getMonth() + 1),
  kmRecorridos: '',
  horasExtra: '',
  observaciones: '',
});

const extractError = (err: unknown): string => {
  const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error inesperado';
};

const nombreEmpleado = (e: EmpleadoLite): string =>
  `${e.nombre ?? ''} ${e.apellido ?? ''}`.trim() || `#${e.id}`;

const KmEmpleadosPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const [anios, setAnios] = useState<number[]>([]);
  const [anio, setAnio] = useState<number>(currentYear);
  const [registros, setRegistros] = useState<RegistroKmEmpleadoDTO[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoLite[]>([]);
  const [metrica, setMetrica] = useState<'km' | 'horas'>('km');

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(currentYear));
  // id del registro en edición (null = alta nueva → inserta otra fila).
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Celda (empleado × mes) abierta en el panel de detalle, para ver/editar/borrar
  // los registros acumulados de ese período.
  const [cellDetail, setCellDetail] = useState<{ empleadoId: number; nombre: string; mes: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async (anioSel: number) => {
    setLoading(true);
    setPageError(null);
    try {
      const [regs, aniosData] = await Promise.all([
        registroKmEmpleadoApi.getByAnio(anioSel),
        registroKmEmpleadoApi.getAnios(),
      ]);
      setRegistros(regs);
      // Aseguramos que el año actual y el seleccionado estén siempre disponibles.
      const set = new Set<number>([...aniosData, currentYear, anioSel]);
      setAnios(Array.from(set).sort((a, b) => b - a));
    } catch (err) {
      setPageError(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    load(anio);
  }, [anio, load]);

  // Empleados para el selector del diálogo (carga diferida la primera vez).
  const ensureEmpleados = useCallback(async () => {
    if (empleados.length > 0) return;
    try {
      const list = await employeeApi.getAllList();
      setEmpleados(list as EmpleadoLite[]);
    } catch (err) {
      setFormError(extractError(err));
    }
  }, [empleados.length]);

  // Matriz empleado × mes con el valor de la métrica elegida. Cada celda puede
  // tener varios registros (acumulación/corrección): se SUMA por período.
  const matriz = useMemo(() => {
    const porEmpleado = new Map<number, { nombre: string; meses: Record<number, RegistroKmEmpleadoDTO[]> }>();
    for (const r of registros) {
      if (!porEmpleado.has(r.empleadoId)) {
        porEmpleado.set(r.empleadoId, { nombre: r.empleadoNombre || `#${r.empleadoId}`, meses: {} });
      }
      const meses = porEmpleado.get(r.empleadoId)!.meses;
      (meses[r.mes] ??= []).push(r);
    }
    const filas = Array.from(porEmpleado.entries()).map(([empleadoId, data]) => {
      const valores = MESES.map((_, idx) => {
        const regs = data.meses[idx + 1];
        if (!regs || regs.length === 0) return null;
        return regs.reduce((acc, reg) => acc + (metrica === 'km' ? reg.kmRecorridos : reg.horasExtra), 0);
      });
      const total = valores.reduce<number>((acc, v) => acc + (v ?? 0), 0);
      return { empleadoId, nombre: data.nombre, valores, total };
    });
    filas.sort((a, b) => b.total - a.total);
    return filas;
  }, [registros, metrica]);

  // Registros de la celda actualmente abierta en el panel de detalle.
  const cellRegistros = useMemo(() => {
    if (!cellDetail) return [];
    return registros
      .filter((r) => r.empleadoId === cellDetail.empleadoId && r.mes === cellDetail.mes)
      .sort((a, b) => (a.fechaCreacion ?? '').localeCompare(b.fechaCreacion ?? ''));
  }, [registros, cellDetail]);

  const totalGeneral = matriz.reduce((acc, f) => acc + f.total, 0);

  const openNuevo = async (prefill?: { empleadoId?: number; mes?: number }) => {
    setForm({
      ...emptyForm(anio),
      ...(prefill?.empleadoId != null ? { empleadoId: String(prefill.empleadoId) } : {}),
      ...(prefill?.mes != null ? { mes: String(prefill.mes) } : {}),
    });
    setEditingId(null);
    setFormError(null);
    setDialogOpen(true);
    await ensureEmpleados();
  };

  const openEditar = async (reg: RegistroKmEmpleadoDTO) => {
    setForm({
      empleadoId: String(reg.empleadoId),
      anio: String(reg.anio),
      mes: String(reg.mes),
      kmRecorridos: String(reg.kmRecorridos ?? ''),
      horasExtra: String(reg.horasExtra ?? ''),
      observaciones: reg.observaciones ?? '',
    });
    setEditingId(reg.id);
    setFormError(null);
    setDialogOpen(true);
    await ensureEmpleados();
  };

  const handleSave = async () => {
    if (!form.empleadoId) {
      setFormError('Elegí un empleado');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        empleadoId: Number(form.empleadoId),
        anio: Number(form.anio),
        mes: Number(form.mes),
        kmRecorridos: Number(form.kmRecorridos || 0),
        horasExtra: Number(form.horasExtra || 0),
        observaciones: form.observaciones || undefined,
      };
      // Con editingId actualizamos esa fila; sin él, se inserta una fila nueva
      // (se acumula con lo ya cargado para ese período, no lo pisa).
      if (editingId != null) {
        await registroKmEmpleadoApi.update(editingId, payload);
      } else {
        await registroKmEmpleadoApi.upsert(payload);
      }
      setDialogOpen(false);
      // Si cargó otro año, saltamos a ese; si no, recargamos el actual.
      const anioForm = Number(form.anio);
      if (anioForm !== anio) setAnio(anioForm);
      else load(anio);
    } catch (err) {
      setFormError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await registroKmEmpleadoApi.delete(id);
      await load(anio);
    } catch (err) {
      setPageError(extractError(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <RouteIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            Km por empleado
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={metrica}
            onChange={(_, v) => v && setMetrica(v)}
          >
            <ToggleButton value="km">Km</ToggleButton>
            <ToggleButton value="horas">Hs extra</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            select
            size="small"
            label="Año"
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            sx={{ minWidth: 110 }}
          >
            {anios.map((a) => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openNuevo()}>
            Nuevo registro
          </Button>
        </Stack>
      </Box>

      {pageError && <Alert severity="error" sx={{ mb: 2 }}>{pageError}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : matriz.length === 0 ? (
        <Alert severity="info">
          No hay registros de km para {anio}. Cargá el primero con <strong>+ Nuevo registro</strong>.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 3 }}>
                  Empleado
                </TableCell>
                {MESES.map((m) => (
                  <TableCell key={m} align="right" sx={{ fontWeight: 700 }}>{m}</TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matriz.map((fila) => (
                <TableRow key={fila.empleadoId} hover>
                  <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    {fila.nombre}
                  </TableCell>
                  {fila.valores.map((v, idx) => {
                    const tieneRegistros = v != null;
                    return (
                      <TableCell
                        key={idx}
                        align="right"
                        onClick={tieneRegistros
                          ? () => setCellDetail({ empleadoId: fila.empleadoId, nombre: fila.nombre, mes: idx + 1 })
                          : () => openNuevo({ empleadoId: fila.empleadoId, mes: idx + 1 })}
                        sx={{
                          cursor: 'pointer',
                          color: v == null ? 'text.disabled' : 'text.primary',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        {v == null ? '—' : v.toLocaleString('es-AR')}
                      </TableCell>
                    );
                  })}
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {fila.total.toLocaleString('es-AR')}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, position: 'sticky', left: 0, bgcolor: 'background.paper' }}>
                  <Chip label="Total" size="small" color="primary" />
                </TableCell>
                {MESES.map((_, idx) => {
                  const totMes = matriz.reduce((acc, f) => acc + (f.valores[idx] ?? 0), 0);
                  return (
                    <TableCell key={idx} align="right" sx={{ fontWeight: 700 }}>
                      {totMes ? totMes.toLocaleString('es-AR') : '—'}
                    </TableCell>
                  );
                })}
                <TableCell align="right" sx={{ fontWeight: 800 }}>
                  {totalGeneral.toLocaleString('es-AR')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        Cada celda suma todos los registros de ese mes. Tocá una celda con valor para ver el detalle, agregar otro registro (se acumula, no pisa) o corregir/borrar los existentes. Tocá una celda vacía para cargar el primero.
      </Typography>

      {/* Detalle del período: lista los registros acumulados de la celda */}
      <Dialog open={cellDetail !== null} onClose={() => setCellDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {cellDetail ? `${cellDetail.nombre} — ${MESES[cellDetail.mes - 1]} ${anio}` : ''}
        </DialogTitle>
        <DialogContent>
          {cellRegistros.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>No hay registros en este período.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="right">Km</TableCell>
                    <TableCell align="right">Hs extra</TableCell>
                    <TableCell>Observaciones</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cellRegistros.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell align="right">{(r.kmRecorridos ?? 0).toLocaleString('es-AR')}</TableCell>
                      <TableCell align="right">{(r.horasExtra ?? 0).toLocaleString('es-AR')}</TableCell>
                      <TableCell>{r.observaciones || '—'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => { setCellDetail(null); openEditar(r); }}>
                          Editar
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={deletingId === r.id}
                          onClick={() => handleDelete(r.id)}
                        >
                          {deletingId === r.id ? <CircularProgress size={16} /> : 'Borrar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {cellRegistros.reduce((acc, r) => acc + (r.kmRecorridos ?? 0), 0).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {cellRegistros.reduce((acc, r) => acc + (r.horasExtra ?? 0), 0).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total acumulado</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCellDetail(null)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              const c = cellDetail;
              setCellDetail(null);
              if (c) openNuevo({ empleadoId: c.empleadoId, mes: c.mes });
            }}
          >
            Agregar registro
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingId != null ? 'Corregir registro' : 'Nuevo registro de km / horas extra'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField
              select
              label="Empleado *"
              value={form.empleadoId}
              onChange={(e) => setForm((f) => ({ ...f, empleadoId: e.target.value }))}
              fullWidth
            >
              {empleados.length === 0 && <MenuItem value="" disabled>Cargando empleados…</MenuItem>}
              {empleados.map((e) => (
                <MenuItem key={e.id} value={String(e.id)}>{nombreEmpleado(e)}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Año *"
                type="number"
                value={form.anio}
                onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Mes *"
                value={form.mes}
                onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))}
                fullWidth
              >
                {MESES.map((m, idx) => (
                  <MenuItem key={m} value={String(idx + 1)}>{m}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Km recorridos"
                type="number"
                value={form.kmRecorridos}
                onChange={(e) => setForm((f) => ({ ...f, kmRecorridos: e.target.value }))}
                fullWidth
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Horas extra"
                type="number"
                value={form.horasExtra}
                onChange={(e) => setForm((f) => ({ ...f, horasExtra: e.target.value }))}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Stack>
            <TextField
              label="Observaciones"
              value={form.observaciones}
              onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KmEmpleadosPage;
