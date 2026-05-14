import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Stack,
  Alert,
  FormControlLabel,
  Switch,
  CircularProgress,
  TextField,
  Autocomplete,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  WarningAmber as WarningAmberIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { registroActividadApi } from '../../api/services/registroActividadApi';
import { usuarioApi } from '../../api/services';
import { usePagination } from '../../hooks/usePagination';
import { usePermisos } from '../../hooks/usePermisos';
import type {
  ActividadFilters,
  RegistroActividadDTO,
  TipoAccionActividad,
} from '../../types/actividad.types';
import {
  TIPO_ACCION_FAMILIA,
  TIPO_ACCION_LABELS,
} from '../../types/actividad.types';
import type { Usuario } from '../../types';
import { HorarioLaboralDialog } from './HorarioLaboralDialog';

type DatePreset = 'hoy' | 'ayer' | 'semana' | 'mes' | 'todo' | 'personalizado';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'todo', label: 'Todo' },
  { value: 'personalizado', label: 'Personalizado' },
];

const TIPOS_DISPONIBLES: TipoAccionActividad[] = [
  'LOGIN_OK',
  'LOGIN_FAIL',
  'LOGOUT',
  'PRESUPUESTO_CREADO',
  'PRESUPUESTO_CONVERTIDO_A_NOTA',
  'NOTA_PEDIDO_CONVERTIDA_A_FACTURA',
  'NOTA_PEDIDO_ESTADO_CAMBIADO',
  'FACTURA_CREADA',
  'FACTURA_ANULADA',
  'PAGO_REGISTRADO',
  'MOVIMIENTO_EXTRA_CREADO',
  'MOVIMIENTO_EXTRA_ANULADO',
  'GESTION_COBRANZA_CERRADA',
  'AMORTIZACION_EJECUTADA',
  'AMORTIZACION_CONVERTIDA',
];

const FAMILIA_COLOR: Record<string, 'default' | 'primary' | 'success' | 'error' | 'info' | 'warning'> = {
  acceso: 'info',
  documento: 'primary',
  pago: 'success',
  anulacion: 'error',
  fallo: 'warning',
};

// Resuelve fechas según el preset elegido. "todo" devuelve sin límites.
const resolveDatePreset = (
  preset: DatePreset,
  custom: { desde: Dayjs | null; hasta: Dayjs | null }
): { fechaDesde?: string; fechaHasta?: string } => {
  if (preset === 'todo') return {};
  if (preset === 'personalizado') {
    return {
      fechaDesde: custom.desde?.startOf('day').toISOString() ?? undefined,
      fechaHasta: custom.hasta?.endOf('day').toISOString() ?? undefined,
    };
  }
  const now = dayjs();
  switch (preset) {
    case 'hoy':
      return {
        fechaDesde: now.startOf('day').toISOString(),
        fechaHasta: now.endOf('day').toISOString(),
      };
    case 'ayer': {
      const ayer = now.subtract(1, 'day');
      return {
        fechaDesde: ayer.startOf('day').toISOString(),
        fechaHasta: ayer.endOf('day').toISOString(),
      };
    }
    case 'semana':
      return {
        fechaDesde: now.startOf('week').toISOString(),
        fechaHasta: now.endOf('week').toISOString(),
      };
    case 'mes':
      return {
        fechaDesde: now.startOf('month').toISOString(),
        fechaHasta: now.endOf('month').toISOString(),
      };
    default:
      return {};
  }
};

const formatFecha = (iso: string): string => {
  const d = dayjs(iso);
  return `${d.format('DD/MM/YYYY')} ${d.format('HH:mm:ss')}`;
};

export const RegistroActividadPage = () => {
  const { tienePermiso } = usePermisos();

  const [datePreset, setDatePreset] = useState<DatePreset>('hoy');
  const [customDesde, setCustomDesde] = useState<Dayjs | null>(null);
  const [customHasta, setCustomHasta] = useState<Dayjs | null>(null);
  const [tiposSel, setTiposSel] = useState<TipoAccionActividad[]>([]);
  const [soloFueraHorario, setSoloFueraHorario] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSel, setUsuarioSel] = useState<Usuario | null>(null);
  const [horarioOpen, setHorarioOpen] = useState(false);

  // Carga usuarios para el filtro Autocomplete. Si falla, dejamos vacío y
  // el usuario igual puede filtrar por otros campos.
  useEffect(() => {
    if (!tienePermiso('ADMINISTRACION')) return;
    usuarioApi
      .getAll()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, [tienePermiso]);

  // backendFilters: se reconstruye solo cuando cambia algún filtro real.
  // El switch a múltiples tipos es client-side via 1 query por tipo (raro);
  // por ahora solo permitimos 1 tipo a la vez en el server.
  const backendFilters = useMemo<ActividadFilters>(() => {
    const dates = resolveDatePreset(datePreset, { desde: customDesde, hasta: customHasta });
    return {
      ...dates,
      usuarioId: usuarioSel?.id,
      tipoAccion: tiposSel.length === 1 ? tiposSel[0] : undefined,
      fueraHorario: soloFueraHorario || undefined,
    };
  }, [datePreset, customDesde, customHasta, usuarioSel, tiposSel, soloFueraHorario]);

  const fetchActividad = useCallback(
    (page: number, size: number, _sort: string, filters: ActividadFilters) => {
      return registroActividadApi.list(page, size, filters);
    },
    []
  );

  const {
    data: registros,
    totalElements,
    page,
    size,
    loading,
    error,
    handleChangePage,
    handleChangeRowsPerPage,
    setFilters,
    refresh,
  } = usePagination<RegistroActividadDTO, ActividadFilters>({
    fetchFn: fetchActividad,
    initialSize: 50,
    initialFilters: backendFilters,
  });

  // Cada vez que cambian los filtros UI, los pusheamos al hook.
  useEffect(() => {
    setFilters(backendFilters);
  }, [backendFilters, setFilters]);

  if (!tienePermiso('ADMINISTRACION')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para ver el registro de actividad</Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <HistoryIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main' }} />
          <Typography
            variant="h4"
            component="h1"
            sx={{ flexGrow: 1, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            Actividad del sistema
          </Typography>
          <Tooltip title="Configurar horario laboral">
            <IconButton onClick={() => setHorarioOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refrescar">
            <IconButton onClick={refresh} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Rango de fecha:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {DATE_PRESETS.map((p) => (
                  <Chip
                    key={p.value}
                    label={p.label}
                    size="small"
                    onClick={() => setDatePreset(p.value)}
                    color={datePreset === p.value ? 'primary' : 'default'}
                    variant={datePreset === p.value ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
              {datePreset === 'personalizado' && (
                <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                  <DatePicker
                    label="Desde"
                    value={customDesde}
                    onChange={setCustomDesde}
                    slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                  />
                  <DatePicker
                    label="Hasta"
                    value={customHasta}
                    onChange={setCustomHasta}
                    slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
                  />
                </Stack>
              )}
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Tipo de acción (elegí uno para filtrar):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {TIPOS_DISPONIBLES.map((t) => (
                  <Chip
                    key={t}
                    label={TIPO_ACCION_LABELS[t]}
                    size="small"
                    onClick={() => {
                      // Comportamiento: solo 1 a la vez (el backend solo
                      // acepta uno). Click sobre el seleccionado lo limpia.
                      setTiposSel((prev) => (prev[0] === t ? [] : [t]));
                    }}
                    color={tiposSel.includes(t) ? FAMILIA_COLOR[TIPO_ACCION_FAMILIA[t]] : 'default'}
                    variant={tiposSel.includes(t) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
              {tiposSel.length > 1 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                  Solo se aplica un tipo a la vez en el server.
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Autocomplete
                size="small"
                sx={{ width: { xs: '100%', sm: 320 } }}
                options={usuarios}
                value={usuarioSel}
                onChange={(_, val) => setUsuarioSel(val)}
                getOptionLabel={(u) =>
                  u ? `${u.nombre ?? ''} ${u.apellido ?? ''} (${u.username})`.trim() : ''
                }
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderInput={(params) => <TextField {...params} label="Filtrar por usuario" />}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={soloFueraHorario}
                    onChange={(_, c) => setSoloFueraHorario(c)}
                    size="small"
                  />
                }
                label="Solo fuera de horario laboral"
              />
              {(usuarioSel || tiposSel.length > 0 || soloFueraHorario || datePreset !== 'hoy') && (
                <Button
                  size="small"
                  onClick={() => {
                    setDatePreset('hoy');
                    setCustomDesde(null);
                    setCustomHasta(null);
                    setTiposSel([]);
                    setUsuarioSel(null);
                    setSoloFueraHorario(false);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: 180 }}>Fecha y hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 200 }}>Acción</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 130 }}>IP</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 80 }} align="center">
                  Horario
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && registros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : registros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay actividad para los filtros seleccionados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                registros.map((r) => {
                  const familia = TIPO_ACCION_FAMILIA[r.tipoAccion];
                  return (
                    <TableRow
                      key={r.id}
                      hover
                      sx={{
                        bgcolor: r.fueraHorario ? 'rgba(239, 68, 68, 0.06)' : undefined,
                      }}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatFecha(r.fecha)}
                      </TableCell>
                      <TableCell>
                        {r.usuarioNombre ?? (
                          <Typography component="span" variant="caption" color="text.secondary">
                            (anónimo)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={TIPO_ACCION_LABELS[r.tipoAccion]}
                          size="small"
                          color={FAMILIA_COLOR[familia]}
                          variant={familia === 'fallo' || familia === 'anulacion' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {r.descripcion || '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {r.ipAddress ?? '—'}
                      </TableCell>
                      <TableCell align="center">
                        {r.fueraHorario && (
                          <Tooltip title="Acción fuera del horario laboral configurado">
                            <Chip
                              icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                              label="Fuera"
                              size="small"
                              color="error"
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={size}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[25, 50, 100, 200]}
            labelRowsPerPage="Filas por página:"
          />
        </TableContainer>

        <HorarioLaboralDialog open={horarioOpen} onClose={() => setHorarioOpen(false)} />
      </Box>
    </LocalizationProvider>
  );
};

export default RegistroActividadPage;
