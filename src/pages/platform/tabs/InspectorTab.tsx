import { useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmpresaAutocomplete from '../../../components/common/EmpresaAutocomplete';
import type { Empresa } from '../../../types/tenant.types';
import { platformApi } from '../../../api/services/platformApi';

interface Props {
  tablas: string[];
  onError: (msg: string) => void;
}

type Modo = 'porId' | 'ultimos';

const fmt = (v: unknown): string => {
  if (v === null || v === undefined) return '∅';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

/**
 * Inspector read-only: ver una fila puntual (tabla + id) o los últimos N
 * registros de una tabla para una empresa. No modifica nada y las columnas
 * sensibles llegan enmascaradas del backend.
 */
export default function InspectorTab({ tablas, onError }: Props) {
  const [modo, setModo] = useState<Modo>('porId');
  const [tabla, setTabla] = useState<string | null>(null);
  const [registroId, setRegistroId] = useState('');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [limit, setLimit] = useState('20');
  const [busy, setBusy] = useState(false);

  const [fila, setFila] = useState<Record<string, unknown> | null>(null);
  const [filas, setFilas] = useState<Record<string, unknown>[] | null>(null);

  const buscar = async () => {
    setBusy(true);
    setFila(null);
    setFilas(null);
    try {
      if (modo === 'porId') {
        const res = await platformApi.inspectRegistro(tabla!, Number(registroId));
        setFila(res.fila);
      } else {
        const res = await platformApi.inspectUltimos(tabla!, empresa!.id, Number(limit) || 20);
        setFilas(res.filas);
      }
    } catch (e: any) {
      onError(e?.response?.data?.message || e?.response?.data?.error || e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const puedeBuscar = tabla && (modo === 'porId' ? !!registroId : !!empresa);
  const columnasLista = filas && filas.length > 0
    ? Object.keys(filas[0]).filter((c) => c !== 'usuario_id_username')
    : [];

  const fmtCelda = (f: Record<string, unknown>, c: string): string =>
    c === 'usuario_id' && f.usuario_id_username != null ? String(f.usuario_id_username) : fmt(f[c]);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Solo lectura: nada de lo que hagas acá modifica datos. Útil para verificar una fila
        antes de operarla en la pestaña Operaciones.
      </Alert>
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack spacing={2}>
          <ToggleButtonGroup exclusive size="small" value={modo}
            onChange={(_, v) => { if (v) { setModo(v); setFila(null); setFilas(null); } }}>
            <ToggleButton value="porId">Buscar por ID</ToggleButton>
            <ToggleButton value="ultimos">Últimos registros por empresa</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Autocomplete
              options={tablas}
              value={tabla}
              onChange={(_, v) => setTabla(v)}
              sx={{ minWidth: 280, flex: 1 }}
              renderInput={(p) => <TextField {...p} label="Tabla" required />}
            />
            {modo === 'porId' ? (
              <TextField label="Registro ID" type="number" required value={registroId}
                onChange={(e) => setRegistroId(e.target.value)} sx={{ width: 160 }} />
            ) : (
              <>
                <EmpresaAutocomplete value={empresa} onChange={setEmpresa}
                  label="Empresa" required sx={{ minWidth: 280 }} />
                <TextField label="Cantidad" type="number" value={limit}
                  onChange={(e) => setLimit(e.target.value)} sx={{ width: 120 }}
                  helperText="Máx. 100" />
              </>
            )}
            <Button variant="contained" startIcon={<SearchIcon />} onClick={buscar}
              disabled={busy || !puedeBuscar} sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
              Buscar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {fila && (
        <Paper sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle1" sx={{ p: 2, pb: 1, fontWeight: 600 }}>
            {tabla} #{registroId}
          </Typography>
          <Table size="small">
            <TableBody>
              {Object.entries(fila).filter(([k]) => k !== 'usuario_id_username').map(([k, v]) => (
                <TableRow key={k} hover>
                  <TableCell sx={{ fontWeight: 600, width: 260 }}>{k}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
                    {k === 'usuario_id' && fila.usuario_id_username != null ? String(fila.usuario_id_username) : fmt(v)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {filas && (
        <Paper>
          <Typography variant="subtitle1" sx={{ p: 2, pb: 1, fontWeight: 600 }}>
            {tabla} — últimos {filas.length} registros de {empresa?.nombre}
          </Typography>
          {filas.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>Sin registros para esa empresa.</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columnasLista.map((c) => <TableCell key={c} sx={{ whiteSpace: 'nowrap' }}>{c}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.map((f, i) => (
                    <TableRow key={i} hover>
                      {columnasLista.map((c) => (
                        <TableCell key={c} sx={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {fmtCelda(f, c)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
