// Listado de checklists de pre-viaje guardados, con filtro por fecha, export CSV
// y vista de detalle (solo lectura) por viaje.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import {
  Download as DownloadIcon,
  FactCheck as FactCheckIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { statusSx } from '../../theme/statusRoles';
import { viajeApi } from '../../api/services/viajeApi';
import type { ChecklistViaje, ChecklistViajeItems, Viaje } from '../../types/logistica.types';
import PreViajeChecklistDialog from './PreViajeChecklistDialog';

const OK_FIELDS: (keyof ChecklistViajeItems)[] = [
  'aguaOk', 'aceiteOk', 'lucesCamionetaOk', 'lucesTrailerOk',
  'auxilioCamionetaOk', 'auxilioTrailerOk', 'llaveCruzOk', 'matafuegoOk',
  'kitEmergenciaOk', 'rayonesAbolladurasOk', 'parabrisasOk', 'tapizadosOk',
  'cubiertasOk', 'seguroOk', 'vencCarnetOk', 'dniOk', 'cedulaVerdeOk',
  'valijaHerramientasOk', 'zunchosOk',
];

const countFallas = (cl: ChecklistViaje) =>
  OK_FIELDS.filter((k) => cl[k] === false).length;

const ChecklistsViajePage: React.FC = () => {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  // Rango aplicado: el botón Aplicar lo fija y la query refetchea.
  const [appliedRange, setAppliedRange] = useState<{ desde?: string; hasta?: string }>({});
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChecklistViaje | null>(null);

  const checklistsQuery = useQuery({
    queryKey: ['checklists-viaje', appliedRange],
    queryFn: () => viajeApi.listChecklists(appliedRange.desde, appliedRange.hasta),
  });
  const rows: ChecklistViaje[] = checklistsQuery.data ?? [];
  const loading = checklistsQuery.isPending;
  const queryErrorMsg = (() => {
    const err = checklistsQuery.error as { response?: { data?: unknown }; message?: string } | null;
    if (!err) return null;
    const data = err.response?.data;
    return (typeof data === 'string' ? data : (data as { message?: string })?.message)
      ?? err.message ?? 'No se pudieron cargar los checklists';
  })();
  const error = queryErrorMsg ?? actionError;
  const load = () => setAppliedRange({ desde: desde || undefined, hasta: hasta || undefined });

  const handleExport = async () => {
    setExporting(true);
    setActionError(null);
    try {
      await viajeApi.downloadChecklistsCsv(desde || undefined, hasta || undefined);
    } catch {
      setActionError('No se pudo exportar el CSV.');
    } finally {
      setExporting(false);
    }
  };

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

  const total = rows.length;
  const conFallas = rows.filter((r) => countFallas(r) > 0).length;
  const sinFallas = total - conFallas;

  const fallasSx: SxProps<Theme> =
    conFallas === 0
      ? statusSx('success')
      : conFallas <= 2
        ? statusSx('warning')
        : statusSx('danger');

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
        <FactCheckIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>Checklists de viaje</Typography>
      </Box>

      {!loading && total > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {[
            { label: 'Total', value: total, sx: statusSx('neutral') as SxProps<Theme> },
            { label: 'Con novedades', value: conFallas, sx: fallasSx },
            { label: 'Sin novedades', value: sinFallas, sx: statusSx('success') as SxProps<Theme> },
          ].map(({ label, value, sx }) => (
            <Paper key={label} elevation={0} sx={{ flex: 1, p: 2, borderRadius: 2, textAlign: 'center', ...sx }}>
              <Typography variant="h3" fontWeight={700} lineHeight={1}>{value}</Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5, opacity: 0.85 }}>{label}</Typography>
            </Paper>
          ))}
        </Stack>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Desde" type="date" size="small" InputLabelProps={{ shrink: true }}
            value={desde} onChange={(e) => setDesde(e.target.value)}
          />
          <TextField
            label="Hasta" type="date" size="small" InputLabelProps={{ shrink: true }}
            value={hasta} onChange={(e) => setHasta(e.target.value)}
          />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Aplicar
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained" startIcon={<DownloadIcon />}
            onClick={handleExport} disabled={exporting || rows.length === 0}
          >
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Viaje</TableCell>
              <TableCell>Fecha checklist</TableCell>
              <TableCell>Conductor</TableCell>
              <TableCell>Acompañante</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell align="right">Km salida</TableCell>
              <TableCell>Trailer</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Ver</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay checklists guardados en el rango seleccionado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((cl) => {
                const fallas = countFallas(cl);
                return (
                  <TableRow
                    key={cl.id} hover sx={{
                      cursor: 'pointer',
                      ...(fallas > 0 && {
                        borderLeft: '4px solid',
                        borderColor: 'error.main',
                        bgcolor: 'error.50',
                      }),
                    }}
                    onClick={() => setSelected(cl)}
                  >
                    <TableCell>{cl.numeroViaje ?? `#${cl.viajeId}`}</TableCell>
                    <TableCell>{fmt(cl.fechaChecklist)}</TableCell>
                    <TableCell>{cl.conductorNombre ?? '—'}</TableCell>
                    <TableCell>{cl.acompananteNombre ?? '—'}</TableCell>
                    <TableCell>{cl.vehiculoPatente ?? '—'}</TableCell>
                    <TableCell align="right">{cl.kmSalida != null ? cl.kmSalida.toLocaleString() : '—'}</TableCell>
                    <TableCell>{cl.trailer ?? '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        {cl.completado
                          ? <Chip size="small" color="success" label="Completo" />
                          : <Chip size="small" color="warning" label="Incompleto" />}
                        {fallas > 0 && (
                          <Tooltip title={`${fallas} ítem${fallas > 1 ? 's' : ''} con falla — hacé clic para ver el detalle`}>
                            <Chip
                              size="small"
                              color="error"
                              icon={<WarningAmberIcon />}
                              label={`${fallas} falla${fallas > 1 ? 's' : ''}`}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver checklist">
                        <VisibilityIcon fontSize="small" color="action" />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PreViajeChecklistDialog
        open={selected !== null}
        readOnly
        trip={selected ? ({ id: selected.viajeId, numeroViaje: selected.numeroViaje } as unknown as Viaje) : null}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
};

export default ChecklistsViajePage;
