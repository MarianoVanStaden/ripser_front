import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete, Box, Button, Chip, Collapse, IconButton, MenuItem, Paper,
  Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EmpresaAutocomplete from '../../../components/common/EmpresaAutocomplete';
import type { Empresa } from '../../../types/tenant.types';
import {
  platformApi,
  type PlatformColumnaInfo,
  type PlatformOperacion,
  type PlatformOpsLog,
  type PlatformPreviewResponse,
} from '../../../api/services/platformApi';

const OPERACIONES: { value: PlatformOperacion; label: string }[] = [
  { value: 'UPDATE_CAMPO', label: 'Corregir campo (datos de migración)' },
  { value: 'SOFT_DELETE', label: 'Soft-delete (marca inactivo)' },
  { value: 'HARD_DELETE', label: 'HARD delete (borra la fila, snapshot previo)' },
  { value: 'MOVER_EMPRESA', label: 'Mover a otra empresa (cross-tenant)' },
];

const ESTADO_COLOR: Record<PlatformOpsLog['estado'], 'default' | 'success' | 'warning' | 'error'> = {
  PENDIENTE: 'warning',
  EJECUTADA: 'success',
  REVERTIDA: 'default',
  CANCELADA: 'error',
};

interface Props {
  tablas: string[];
  onError: (msg: string) => void;
  onOk: (msg: string) => void;
}

function HistorialRow({ op, busy, onRevert }: { op: PlatformOpsLog; busy: boolean; onRevert: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const params = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(op.params), null, 2);
    } catch {
      return op.params;
    }
  }, [op.params]);

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{op.id}</TableCell>
        <TableCell><Chip size="small" variant="outlined" label={op.operacion} /></TableCell>
        <TableCell sx={{ maxWidth: 420 }}>
          <Tooltip title={op.detalle ?? ''}>
            <Typography variant="body2" noWrap>{op.detalle}</Typography>
          </Tooltip>
        </TableCell>
        <TableCell>{op.empresaId || '—'}</TableCell>
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
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} unmountOnExit>
            <Box component="pre" sx={{ fontSize: 12, m: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, overflow: 'auto' }}>
              {params}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Tab de operaciones destructivas: form con autocompletes (empresa por nombre,
 * tabla y columna desde metadata), preview → confirmación → execute, e historial
 * paginado con revert y params expandibles.
 */
export default function OperacionesTab({ tablas, onError, onOk }: Props) {
  const [operacion, setOperacion] = useState<PlatformOperacion>('UPDATE_CAMPO');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresaDestino, setEmpresaDestino] = useState<Empresa | null>(null);
  const [tabla, setTabla] = useState<string | null>(null);
  const [registroId, setRegistroId] = useState('');
  const [columnas, setColumnas] = useState<PlatformColumnaInfo[]>([]);
  const [columna, setColumna] = useState<PlatformColumnaInfo | null>(null);
  const [valorNuevo, setValorNuevo] = useState('');

  const [preview, setPreview] = useState<PlatformPreviewResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const [historial, setHistorial] = useState<PlatformOpsLog[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const cargarHistorial = useCallback(async (p = page, size = rowsPerPage) => {
    try {
      const res = await platformApi.historial(p, size);
      setHistorial(res.content);
      setTotal(res.totalElements);
    } catch {
      /* historial es secundario */
    }
  }, [page, rowsPerPage]);

  useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

  // Columnas de la tabla elegida (solo hace falta para UPDATE_CAMPO)
  useEffect(() => {
    setColumna(null);
    setColumnas([]);
    if (!tabla) return;
    platformApi.getColumnas(tabla)
      .then(setColumnas)
      .catch(() => { /* autocomplete de columnas queda vacío */ });
  }, [tabla]);

  const faltantes = useMemo(() => {
    const f: string[] = [];
    if (!empresa) f.push('empresa');
    if (!tabla) f.push('tabla');
    if (!registroId) f.push('registro ID');
    if (operacion === 'UPDATE_CAMPO' && !columna) f.push('columna');
    if (operacion === 'MOVER_EMPRESA') {
      if (!empresaDestino) f.push('empresa destino');
      else if (empresa && empresaDestino.id === empresa.id) f.push('empresa destino distinta del origen');
    }
    return f;
  }, [empresa, tabla, registroId, operacion, columna, empresaDestino]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      onError(e?.response?.data?.message || e?.response?.data?.error || e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const onPreview = () => run(async () => {
    setPreview(await platformApi.preview({
      operacion,
      empresaId: empresa!.id,
      tabla: tabla!,
      registroId: Number(registroId),
      columna: operacion === 'UPDATE_CAMPO' ? columna?.nombre : undefined,
      valorNuevo: operacion === 'UPDATE_CAMPO' ? valorNuevo : undefined,
      empresaDestinoId: operacion === 'MOVER_EMPRESA' ? empresaDestino?.id : undefined,
    }));
  });

  const onExecute = () => run(async () => {
    if (!preview) return;
    const res = await platformApi.execute(preview.confirmToken);
    setPreview(null);
    onOk(`Operación #${res.opId} ejecutada (${res.filasAfectadas} fila)`);
    await cargarHistorial(0, rowsPerPage);
    setPage(0);
  });

  const onRevert = (opId: number) => run(async () => {
    const res = await platformApi.revert(opId);
    onOk(`Operación #${res.opId} revertida desde el snapshot`);
    await cargarHistorial();
  });

  return (
    <Box>
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Nueva operación</Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField select label="Operación" value={operacion} sx={{ minWidth: 300 }}
              onChange={(e) => setOperacion(e.target.value as PlatformOperacion)}>
              {OPERACIONES.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            <EmpresaAutocomplete value={empresa} onChange={setEmpresa}
              label="Empresa (scope)" required sx={{ minWidth: 280, flex: 1 }} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Autocomplete
              options={tablas}
              value={tabla}
              onChange={(_, v) => setTabla(v)}
              sx={{ minWidth: 280, flex: 1 }}
              renderInput={(p) => <TextField {...p} label="Tabla" required
                helperText="Buscá escribiendo el nombre — solo tablas multi-tenant operables" />}
            />
            <TextField label="Registro ID" type="number" required value={registroId}
              onChange={(e) => setRegistroId(e.target.value)} sx={{ width: 160 }} />
            {operacion === 'UPDATE_CAMPO' && (
              <>
                <Autocomplete
                  options={columnas.filter((c) => c.editable)}
                  value={columna}
                  onChange={(_, v) => setColumna(v)}
                  disabled={!tabla}
                  getOptionLabel={(c) => c.nombre}
                  renderOption={(props, c) => (
                    <li {...props} key={c.nombre}>
                      {c.nombre}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {c.tipo}{c.nullable ? '' : ' · not null'}
                      </Typography>
                    </li>
                  )}
                  sx={{ minWidth: 240 }}
                  renderInput={(p) => <TextField {...p} label="Columna" required
                    helperText={!tabla ? 'Elegí una tabla primero' : undefined} />}
                />
                <TextField label="Valor nuevo" value={valorNuevo}
                  onChange={(e) => setValorNuevo(e.target.value)} sx={{ minWidth: 240 }}
                  helperText="Vacío = string vacío" />
              </>
            )}
            {operacion === 'MOVER_EMPRESA' && (
              <EmpresaAutocomplete value={empresaDestino} onChange={setEmpresaDestino}
                label="Empresa destino" required sx={{ minWidth: 260 }} />
            )}
          </Stack>
          <Box>
            <Button variant="contained" onClick={onPreview} disabled={busy || faltantes.length > 0}>
              Previsualizar
            </Button>
            {faltantes.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Falta: {faltantes.join(', ')}
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6">Historial de operaciones</Typography>
        <IconButton onClick={() => cargarHistorial()} title="Actualizar"><RefreshIcon /></IconButton>
      </Stack>
      <Paper>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
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
                <HistorialRow key={op.id} op={op} busy={busy} onRevert={onRevert} />
              ))}
              {historial.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                      Sin operaciones registradas todavía
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas"
        />
      </Paper>

      <ConfirmDialog
        open={!!preview}
        onClose={() => setPreview(null)}
        onConfirm={onExecute}
        title="Confirmar operación destructiva"
        severity="error"
        loading={busy}
        confirmLabel="Ejecutar"
        warning={preview?.resumen}
        description={`El token de confirmación expira a los 5 minutos (${preview?.expiraAt?.replace('T', ' ').slice(0, 19)}). Queda snapshot para revertir.`}
        itemDetails={preview && (
          <Box component="pre" sx={{ m: 0, fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
            {JSON.stringify(preview.filaAfectada, null, 2)}
          </Box>
        )}
      />
    </Box>
  );
}
