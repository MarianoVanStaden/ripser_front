import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import {
  platformApi,
  type PlatformOpRequest,
  type PlatformOperacion,
  type PlatformOpsLog,
  type PlatformPreviewResponse,
} from '../../api/services/platformApi';

const OPERACIONES: { value: PlatformOperacion; label: string }[] = [
  { value: 'SOFT_DELETE', label: 'Soft-delete (marca inactivo)' },
  { value: 'HARD_DELETE', label: 'HARD delete (borra la fila, snapshot previo)' },
  { value: 'UPDATE_CAMPO', label: 'Corregir campo (datos de migración)' },
  { value: 'MOVER_EMPRESA', label: 'Mover a otra empresa (cross-tenant)' },
];

const ESTADO_COLOR: Record<PlatformOpsLog['estado'], 'default' | 'success' | 'warning' | 'error'> = {
  PENDIENTE: 'warning',
  EJECUTADA: 'success',
  REVERTIDA: 'default',
  CANCELADA: 'error',
};

/**
 * Herramientas de mantenimiento del SaaS — visibles solo para el platform owner
 * (guard de ruta + backend ROLE_PLATFORM_OWNER). Flujo preview → confirmar → execute,
 * con historial y revert desde el snapshot.
 */
export default function PlatformOpsPage() {
  const [form, setForm] = useState<PlatformOpRequest>({
    operacion: 'UPDATE_CAMPO', empresaId: 0, tabla: '', registroId: 0,
  });
  const [preview, setPreview] = useState<PlatformPreviewResponse | null>(null);
  const [historial, setHistorial] = useState<PlatformOpsLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cargarHistorial = useCallback(async () => {
    try {
      const page = await platformApi.historial();
      setHistorial(page.content);
    } catch {
      /* historial es secundario */
    }
  }, []);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  const set = (patch: Partial<PlatformOpRequest>) => setForm((f) => ({ ...f, ...patch }));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(null); setOk(null);
    try {
      await fn();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const onPreview = () => run(async () => {
    setPreview(await platformApi.preview(form));
  });

  const onExecute = () => run(async () => {
    if (!preview) return;
    const res = await platformApi.execute(preview.confirmToken);
    setPreview(null);
    setOk(`Operación #${res.opId} ejecutada (${res.filasAfectadas} fila)`);
    await cargarHistorial();
  });

  const onRevert = (opId: number) => run(async () => {
    const res = await platformApi.revert(opId);
    setOk(`Operación #${res.opId} revertida`);
    await cargarHistorial();
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Mantenimiento de plataforma</Typography>
      <Alert severity="warning" sx={{ mb: 2 }}>
        Operaciones destructivas sobre datos de un tenant. Todo queda registrado con snapshot
        para poder revertir. El scope de empresa es obligatorio.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOk(null)}>{ok}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField select label="Operación" value={form.operacion} sx={{ minWidth: 280 }}
            onChange={(e) => set({ operacion: e.target.value as PlatformOperacion })}>
            {OPERACIONES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
          <TextField label="Empresa ID (scope)" type="number" required value={form.empresaId || ''}
            onChange={(e) => set({ empresaId: Number(e.target.value) })} sx={{ width: 170 }} />
          <TextField label="Tabla" required value={form.tabla}
            onChange={(e) => set({ tabla: e.target.value.trim().toLowerCase() })} sx={{ width: 220 }} />
          <TextField label="Registro ID" type="number" required value={form.registroId || ''}
            onChange={(e) => set({ registroId: Number(e.target.value) })} sx={{ width: 150 }} />
          {form.operacion === 'UPDATE_CAMPO' && (
            <>
              <TextField label="Columna" required value={form.columna ?? ''}
                onChange={(e) => set({ columna: e.target.value.trim().toLowerCase() })} sx={{ width: 200 }} />
              <TextField label="Valor nuevo" value={form.valorNuevo ?? ''}
                onChange={(e) => set({ valorNuevo: e.target.value })} sx={{ width: 240 }} />
            </>
          )}
          {form.operacion === 'MOVER_EMPRESA' && (
            <TextField label="Empresa destino ID" type="number" required value={form.empresaDestinoId ?? ''}
              onChange={(e) => set({ empresaDestinoId: Number(e.target.value) })} sx={{ width: 190 }} />
          )}
          <Button variant="contained" onClick={onPreview}
            disabled={busy || !form.tabla || !form.empresaId || !form.registroId}>
            Previsualizar
          </Button>
        </Stack>
      </Paper>

      <Typography variant="h6" gutterBottom>Historial de operaciones</Typography>
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Operación</TableCell>
              <TableCell>Detalle</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {historial.map((op) => (
              <TableRow key={op.id}>
                <TableCell>{op.id}</TableCell>
                <TableCell>{op.operacion}</TableCell>
                <TableCell sx={{ maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.detalle}</TableCell>
                <TableCell>{op.empresaId}</TableCell>
                <TableCell><Chip size="small" label={op.estado} color={ESTADO_COLOR[op.estado]} /></TableCell>
                <TableCell>{op.createdAt?.replace('T', ' ').slice(0, 19)}</TableCell>
                <TableCell>
                  {op.estado === 'EJECUTADA' && op.reversible && (
                    <Button size="small" color="warning" disabled={busy} onClick={() => onRevert(op.id)}>
                      Revertir
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {historial.length === 0 && (
              <TableRow><TableCell colSpan={7}><Typography color="text.secondary">Sin operaciones registradas</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Confirmar operación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>{preview?.resumen}</Alert>
          <Typography variant="subtitle2" gutterBottom>Fila afectada (snapshot):</Typography>
          <Box component="pre" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1, fontSize: 12, overflow: 'auto', maxHeight: 320 }}>
            {JSON.stringify(preview?.filaAfectada, null, 2)}
          </Box>
          <Typography variant="caption" color="text.secondary">
            El token de confirmación expira a los 5 minutos ({preview?.expiraAt?.replace('T', ' ').slice(0, 19)}).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Cancelar</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={onExecute}>
            Ejecutar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
