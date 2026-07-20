import { useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  precioRecetaApi,
  type HistorialPrecioRecetaDTO,
  type TipoCambioPrecio,
} from '../../api/services/precioRecetaApi';
import type { RecetaFabricacionListDTO } from '../../types';
import { QUERY_KEYS } from '../../utils/queryKeys';

const TIPO_LABELS: Record<TipoCambioPrecio, string> = {
  MANUAL: 'Manual',
  MASIVO_PCT: 'Masivo %',
  MASIVO_MONTO: 'Masivo $',
  REVERSION: 'Reversión',
};

const TIPO_COLORS: Record<TipoCambioPrecio, 'default' | 'primary' | 'secondary' | 'warning'> = {
  MANUAL: 'primary',
  MASIVO_PCT: 'secondary',
  MASIVO_MONTO: 'secondary',
  REVERSION: 'warning',
};

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : `$${Number(n).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

interface Props {
  recetas: RecetaFabricacionListDTO[];
}

export default function HistorialPreciosSection({ recetas }: Props) {
  const queryClient = useQueryClient();

  const [recetaFiltro, setRecetaFiltro] = useState<RecetaFabricacionListDTO | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<TipoCambioPrecio | ''>('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [revertirTarget, setRevertirTarget] = useState<HistorialPrecioRecetaDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = {
    recetaId: recetaFiltro?.id,
    tipoCambio: tipoFiltro || undefined,
    desde: desde ? `${desde}T00:00:00` : undefined,
    hasta: hasta ? `${hasta}T23:59:59` : undefined,
    page,
    size,
  };

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.HISTORIAL_PRECIOS(filters),
    queryFn: () => precioRecetaApi.historial(filters),
  });

  const revertirMutation = useMutation({
    mutationFn: (historialId: number) => precioRecetaApi.revertir(historialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historialPreciosRecetas'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRECIOS_RECETAS() });
      setRevertirTarget(null);
      setError(null);
    },
    onError: (e: any) => {
      setError(e.response?.data?.message || e.message);
      setRevertirTarget(null);
    },
  });

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Autocomplete
          options={recetas}
          value={recetaFiltro}
          onChange={(_, v) => { setRecetaFiltro(v); setPage(0); }}
          getOptionLabel={(r) => `${r.codigo || '—'} · ${r.nombre}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => <TextField {...params} label="Equipo" size="small" />}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tipo de cambio</InputLabel>
          <Select
            value={tipoFiltro}
            label="Tipo de cambio"
            onChange={(e) => { setTipoFiltro(e.target.value as TipoCambioPrecio | ''); setPage(0); }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(TIPO_LABELS) as TipoCambioPrecio[]).map((t) => (
              <MenuItem key={t} value={t}>{TIPO_LABELS[t]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Desde" type="date" size="small" value={desde}
          onChange={(e) => { setDesde(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Hasta" type="date" size="small" value={hasta}
          onChange={(e) => { setHasta(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Equipo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Precio anterior</TableCell>
                  <TableCell align="right">Precio nuevo</TableCell>
                  <TableCell>Motivo</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.content ?? []).map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell>{new Date(h.fechaCambio).toLocaleString('es-AR')}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{h.recetaCodigo}</Typography>
                      <Typography variant="caption" color="text.secondary">{h.recetaNombre}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={TIPO_LABELS[h.tipoCambio]} color={TIPO_COLORS[h.tipoCambio]} />
                      {h.parametrosAjuste && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {h.parametrosAjuste}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{fmt(h.precioAnterior)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(h.precioNuevo)}</TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" noWrap title={h.motivo}>{h.motivo}</Typography>
                    </TableCell>
                    <TableCell>{h.usuarioNombre || '—'}</TableCell>
                    <TableCell>
                      {h.precioAnterior != null && (
                        <Button
                          size="small"
                          startIcon={<UndoIcon />}
                          onClick={() => setRevertirTarget(h)}
                        >
                          Revertir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.content ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        Sin cambios de precio registrados con estos filtros
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data?.totalElements ?? 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={size}
            onRowsPerPageChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </>
      )}

      <Dialog open={revertirTarget != null} onClose={() => setRevertirTarget(null)}>
        <DialogTitle>Revertir cambio de precio</DialogTitle>
        <DialogContent>
          {revertirTarget && (
            <Typography variant="body2">
              {revertirTarget.recetaCodigo} · {revertirTarget.recetaNombre}: el precio vuelve de{' '}
              <b>{fmt(revertirTarget.precioNuevo)}</b> a <b>{fmt(revertirTarget.precioAnterior)}</b>.
              Queda registrado como una reversión en el historial.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevertirTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            disabled={revertirMutation.isPending}
            onClick={() => revertirTarget && revertirMutation.mutate(revertirTarget.id)}
          >
            Revertir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
