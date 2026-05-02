import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TableSortLabel, IconButton, Typography,
  Tooltip, CircularProgress, Alert, TextField, InputAdornment,
  Chip, Stack, Button, FormControlLabel, Switch, Checkbox,
  Toolbar, Menu, MenuItem, Snackbar, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import {
  Visibility, Add, Search, Phone,
  PhoneInTalk, Alarm, CheckCircleOutline, Clear,
  Lock, FlagOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import type { GestionCobranzaListParams } from '../../../api/services/gestionCobranzaApi';
import {
  EstadoGestionCobranza,
  ESTADO_GESTION_COBRANZA_LABELS,
  ESTADO_GESTION_COBRANZA_COLORS,
  PrioridadCobranza,
  PRIORIDAD_COBRANZA_LABELS,
  PRIORIDAD_COBRANZA_COLORS,
  ESTADOS_CIERRE,
  EstadoPromesaPago,
} from '../../../types/cobranza.types';
import type { GestionCobranzaDTO } from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { NuevaGestionDialog } from './NuevaGestionDialog';
import { RegistrarAccionDialog } from './RegistrarAccionDialog';
import { RecordatorioCobranzaDialog } from './RecordatorioCobranzaDialog';

type FechaGestionFiltro = 'VENCIDAS' | 'HOY' | 'MANANA' | 'ESTA_SEMANA' | 'PROXIMOS_7' | 'ESTE_MES' | 'SIN_FECHA';

const FECHA_FILTRO_OPTIONS: { value: FechaGestionFiltro; label: string; color: string }[] = [
  { value: 'VENCIDAS',     label: 'Vencidas',       color: '#d32f2f' },
  { value: 'HOY',          label: 'Hoy',             color: '#ed6c02' },
  { value: 'MANANA',       label: 'Mañana',          color: '#0288d1' },
  { value: 'ESTA_SEMANA',  label: 'Esta semana',     color: '#7b1fa2' },
  { value: 'PROXIMOS_7',   label: 'Próximos 7 días', color: '#2e7d32' },
  { value: 'ESTE_MES',     label: 'Este mes',        color: '#00796b' },
  { value: 'SIN_FECHA',    label: 'Sin fecha',       color: '#757575' },
];

const FECHA_VALUES = new Set<FechaGestionFiltro>(FECHA_FILTRO_OPTIONS.map((o) => o.value));
const isFechaFiltro = (v: unknown): v is FechaGestionFiltro =>
  typeof v === 'string' && FECHA_VALUES.has(v as FechaGestionFiltro);

const ESTADO_VALUES = new Set<EstadoGestionCobranza>(Object.values(EstadoGestionCobranza));
const PRIORIDAD_VALUES = new Set<PrioridadCobranza>(Object.values(PrioridadCobranza));
const PROMESA_ESTADO_VALUES = new Set<EstadoPromesaPago>(Object.values(EstadoPromesaPago));
const isPromesaEstado = (v: unknown): v is EstadoPromesaPago =>
  typeof v === 'string' && PROMESA_ESTADO_VALUES.has(v as EstadoPromesaPago);

const FILTER_SCHEMA = {
  estados: 'string[]',
  prioridades: 'string[]',
  fechaFiltro: 'string',
  desde: 'string',
  hasta: 'string',
  soloActivas: 'boolean',
  term: 'string',
  promesaEstado: 'string',
  promesaIncumplida: 'boolean',
  promesaVenceHoy: 'boolean',
  recordatoriosPendientes: 'boolean',
  conMora: 'boolean',
} as const;

export const CobranzasListPage: React.FC = () => {
  const navigate = useNavigate();

  const { filters: urlFilters, setFilters: setUrlFilters, resetFilters: resetUrlFilters } = useUrlFilters(
    FILTER_SCHEMA,
    { soloActivas: true }
  );

  // Narrow URL strings/arrays into the typed enums the UI / API expect.
  const selectedEstados = useMemo(
    () => (urlFilters.estados ?? []).filter((e): e is EstadoGestionCobranza => ESTADO_VALUES.has(e as EstadoGestionCobranza)),
    [urlFilters.estados]
  );
  const selectedPrioridades = useMemo(
    () => (urlFilters.prioridades ?? []).filter((p): p is PrioridadCobranza => PRIORIDAD_VALUES.has(p as PrioridadCobranza)),
    [urlFilters.prioridades]
  );
  const selectedFechaFiltro = isFechaFiltro(urlFilters.fechaFiltro) ? urlFilters.fechaFiltro : null;
  const fechaDesde: Dayjs | null = urlFilters.desde ? dayjs(urlFilters.desde) : null;
  const fechaHasta: Dayjs | null = urlFilters.hasta ? dayjs(urlFilters.hasta) : null;
  const soloActivas = urlFilters.soloActivas !== false; // default true
  const promesaEstado = isPromesaEstado(urlFilters.promesaEstado) ? urlFilters.promesaEstado : undefined;
  const promesaIncumplida = urlFilters.promesaIncumplida === true;
  const promesaVenceHoy = urlFilters.promesaVenceHoy === true;
  const recordatoriosPendientes = urlFilters.recordatoriosPendientes === true;
  const conMora = urlFilters.conMora === true;

  // Local UI state — search input mirrors URL but with debounce.
  const [searchInput, setSearchInput] = useState<string>(urlFilters.term ?? '');
  const debouncedTerm = useDebounce(searchInput, 300);

  // Keep input in sync if URL changes externally (e.g. resetFilters or deep link).
  useEffect(() => {
    setSearchInput(urlFilters.term ?? '');
  }, [urlFilters.term]);

  useEffect(() => {
    if ((urlFilters.term ?? '') === debouncedTerm) return;
    setUrlFilters({ term: debouncedTerm || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  const [nuevaGestionOpen, setNuevaGestionOpen] = useState(false);
  const [accionDialog, setAccionDialog] = useState<{ id: number; nombre: string } | null>(null);
  const [recordatorioDialog, setRecordatorioDialog] = useState<{ id: number; nombre: string } | null>(null);
  const [cierreMenuAnchor, setCierreMenuAnchor] = useState<{ el: HTMLElement; id: number } | null>(null);

  // Bulk selection state.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkPrioridadAnchor, setBulkPrioridadAnchor] = useState<HTMLElement | null>(null);
  const [bulkCierreAnchor, setBulkCierreAnchor] = useState<HTMLElement | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const showSnack = useCallback((message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  // Build the filters object the backend understands. Memoized so usePagination doesn't refetch on every render.
  const backendFilters = useMemo<GestionCobranzaListParams>(() => ({
    term: urlFilters.term || undefined,
    estados: selectedEstados.length > 0 ? selectedEstados : undefined,
    prioridades: selectedPrioridades.length > 0 ? selectedPrioridades : undefined,
    fechaDesde: urlFilters.desde || undefined,
    fechaHasta: urlFilters.hasta || undefined,
    fechaFiltro: selectedFechaFiltro || undefined,
    promesaEstado,
    promesaIncumplida: promesaIncumplida || undefined,
    promesaVenceHoy: promesaVenceHoy || undefined,
    recordatoriosPendientes: recordatoriosPendientes || undefined,
    conMora: conMora || undefined,
  }), [
    urlFilters.term, urlFilters.desde, urlFilters.hasta,
    selectedEstados, selectedPrioridades, selectedFechaFiltro,
    promesaEstado, promesaIncumplida, promesaVenceHoy, recordatoriosPendientes, conMora,
  ]);

  const fetchGestiones = useCallback(
    (page: number, size: number, sort: string, filters: GestionCobranzaListParams) => {
      const params: GestionCobranzaListParams = { page, size, sort, ...filters };
      return soloActivas
        ? gestionCobranzaApi.getAll(params)
        : gestionCobranzaApi.getHistorial(params);
    },
    [soloActivas]
  );

  const {
    data: gestiones,
    totalElements,
    loading,
    error,
    page,
    size: rowsPerPage,
    sort,
    handleChangePage,
    handleChangeRowsPerPage,
    setFilters: setBackendFilters,
    setSort,
    refresh,
  } = usePagination<GestionCobranzaDTO, GestionCobranzaListParams>({
    fetchFn: fetchGestiones,
    defaultSort: 'fechaApertura,desc',
    initialSize: 25,
    initialFilters: backendFilters,
  });

  // Push filter changes into the pagination hook (resets to page 0).
  useEffect(() => {
    setBackendFilters(backendFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendFilters]);

  const [sortField, sortDir] = sort.split(',') as [string, 'asc' | 'desc'];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSort(`${field},${sortDir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSort(`${field},asc`);
    }
  };

  const toggleEstado = (estado: EstadoGestionCobranza) => {
    const next = selectedEstados.includes(estado)
      ? selectedEstados.filter((e) => e !== estado)
      : [...selectedEstados, estado];
    setUrlFilters({ estados: next });
  };

  const togglePrioridad = (prioridad: PrioridadCobranza) => {
    const next = selectedPrioridades.includes(prioridad)
      ? selectedPrioridades.filter((p) => p !== prioridad)
      : [...selectedPrioridades, prioridad];
    setUrlFilters({ prioridades: next });
  };

  const hasCustomRange = fechaDesde != null || fechaHasta != null;

  // Drop selections that are no longer visible (filters narrowed them out).
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const visibleIds = new Set(gestiones.map((g) => g.id));
    let changed = false;
    const next = new Set<number>();
    selectedIds.forEach((id) => {
      if (visibleIds.has(id)) next.add(id);
      else changed = true;
    });
    if (changed) setSelectedIds(next);
  }, [gestiones, selectedIds]);

  const visibleSelectableIds = useMemo(
    () => gestiones.filter((g) => g.activa).map((g) => g.id),
    [gestiones]
  );
  const allVisibleSelected =
    visibleSelectableIds.length > 0 && visibleSelectableIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    visibleSelectableIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  const toggleRowSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visibleSelectableIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleSelectableIds.forEach((id) => next.add(id));
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const reportBulkResult = useCallback(
    (result: { success: number[]; failures: { id: number; error: string }[] }, successLabel: string) => {
      const ok = result.success.length;
      const fail = result.failures.length;
      if (fail === 0) showSnack(`${ok} ${successLabel}`, 'success');
      else if (ok === 0) showSnack(`Falló la operación en las ${fail} gestiones`, 'error');
      else showSnack(`${ok} ${successLabel}, ${fail} fallaron`, 'info');
    },
    [showSnack]
  );

  const handleBulkPrioridad = async (prioridad: PrioridadCobranza) => {
    setBulkPrioridadAnchor(null);
    setBulkBusy(true);
    try {
      const result = await gestionCobranzaApi.bulkPrioridad(Array.from(selectedIds), prioridad);
      reportBulkResult(result, `gestiones marcadas como ${PRIORIDAD_COBRANZA_LABELS[prioridad].toLowerCase()}`);
      clearSelection();
      refresh();
    } catch (e) {
      showSnack('No se pudo aplicar la operación', 'error');
      console.error(e);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkCierre = async (estado: EstadoGestionCobranza) => {
    setBulkCierreAnchor(null);
    if (!window.confirm(`¿Cerrar ${selectedIds.size} gestión(es) como "${ESTADO_GESTION_COBRANZA_LABELS[estado]}"?`)) return;
    setBulkBusy(true);
    try {
      const result = await gestionCobranzaApi.bulkCerrar(Array.from(selectedIds), estado);
      reportBulkResult(result, `gestiones cerradas como ${ESTADO_GESTION_COBRANZA_LABELS[estado].toLowerCase()}`);
      clearSelection();
      refresh();
    } catch (e) {
      showSnack('No se pudo aplicar la operación', 'error');
      console.error(e);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleCerrarSingle = async (id: number, estado: EstadoGestionCobranza) => {
    setCierreMenuAnchor(null);
    try {
      await gestionCobranzaApi.cerrar(id, estado);
      showSnack(`Gestión cerrada como ${ESTADO_GESTION_COBRANZA_LABELS[estado].toLowerCase()}`, 'success');
      refresh();
    } catch (e) {
      showSnack('No se pudo cerrar la gestión', 'error');
      console.error(e);
    }
  };

  const getProximaGestionLabel = (fecha: string | null) => {
    if (!fecha) return '-';
    const d = dayjs(fecha);
    const today = dayjs();
    if (d.isBefore(today, 'day')) return { label: d.format('DD/MM/YY'), color: 'error' as const };
    if (d.isSame(today, 'day')) return { label: 'Hoy', color: 'warning' as const };
    return { label: d.format('DD/MM/YY'), color: 'default' as const };
  };

  const hasAnyFilter =
    selectedEstados.length > 0 ||
    selectedPrioridades.length > 0 ||
    selectedFechaFiltro != null ||
    hasCustomRange ||
    !!urlFilters.term ||
    !!promesaEstado ||
    promesaIncumplida ||
    promesaVenceHoy ||
    recordatoriosPendientes ||
    conMora;

  const cierreMenuId = cierreMenuAnchor?.id ?? null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestiones de Cobranza</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setNuevaGestionOpen(true)}
        >
          Nueva Gestión
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar por cliente..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                },
              }}
              sx={{ minWidth: 220 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={soloActivas}
                  onChange={(e) => setUrlFilters({ soloActivas: e.target.checked })}
                  size="small"
                />
              }
              label={<Typography variant="body2">Solo activas</Typography>}
            />
          </Box>

          {/* Estado chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Estado:</Typography>
            {(Object.keys(EstadoGestionCobranza) as (keyof typeof EstadoGestionCobranza)[]).map((key) => {
              const estado = EstadoGestionCobranza[key];
              const selected = selectedEstados.includes(estado);
              return (
                <Chip
                  key={estado}
                  label={ESTADO_GESTION_COBRANZA_LABELS[estado]}
                  size="small"
                  onClick={() => toggleEstado(estado)}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: ESTADO_GESTION_COBRANZA_COLORS[estado],
                    color: selected ? 'white' : ESTADO_GESTION_COBRANZA_COLORS[estado],
                    bgcolor: selected ? ESTADO_GESTION_COBRANZA_COLORS[estado] : 'transparent',
                  }}
                />
              );
            })}
          </Box>

          {/* Fecha próxima gestión chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Próxima gestión:</Typography>
            {FECHA_FILTRO_OPTIONS.map(({ value, label, color }) => {
              const selected = !hasCustomRange && selectedFechaFiltro === value;
              return (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  onClick={() => {
                    setUrlFilters({
                      desde: undefined,
                      hasta: undefined,
                      fechaFiltro: selected ? undefined : value,
                    });
                  }}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: color,
                    color: selected ? 'white' : color,
                    bgcolor: selected ? color : 'transparent',
                    opacity: hasCustomRange ? 0.45 : 1,
                  }}
                />
              );
            })}
          </Box>

          {/* Rango personalizado */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">Rango personalizado:</Typography>
              <DatePicker
                label="Desde"
                value={fechaDesde}
                onChange={(v) => setUrlFilters({
                  desde: v ? (v as Dayjs).format('YYYY-MM-DD') : undefined,
                  fechaFiltro: undefined,
                })}
                slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                label="Hasta"
                value={fechaHasta}
                minDate={fechaDesde ?? undefined}
                onChange={(v) => setUrlFilters({
                  hasta: v ? (v as Dayjs).format('YYYY-MM-DD') : undefined,
                  fechaFiltro: undefined,
                })}
                slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
                format="DD/MM/YYYY"
              />
              {hasCustomRange && (
                <Button size="small" variant="text" color="inherit"
                  onClick={() => setUrlFilters({ desde: undefined, hasta: undefined })}
                >
                  Limpiar rango
                </Button>
              )}
            </Box>
          </LocalizationProvider>

          {/* Prioridad chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Prioridad:</Typography>
            {(Object.keys(PrioridadCobranza) as (keyof typeof PrioridadCobranza)[]).map((key) => {
              const prioridad = PrioridadCobranza[key];
              const selected = selectedPrioridades.includes(prioridad);
              return (
                <Chip
                  key={prioridad}
                  label={PRIORIDAD_COBRANZA_LABELS[prioridad]}
                  size="small"
                  onClick={() => togglePrioridad(prioridad)}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: PRIORIDAD_COBRANZA_COLORS[prioridad],
                    color: selected ? 'white' : PRIORIDAD_COBRANZA_COLORS[prioridad],
                    bgcolor: selected ? PRIORIDAD_COBRANZA_COLORS[prioridad] : 'transparent',
                  }}
                />
              );
            })}
            {hasAnyFilter && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => {
                  resetUrlFilters();
                  setSearchInput('');
                }}
              >
                Limpiar
              </Button>
            )}
          </Box>

          {/* Active flag chips for the filters that come from the Resumen deep-links.
              Read-only here — the user removes them via "Limpiar" or by clicking back. */}
          {(promesaEstado || promesaIncumplida || promesaVenceHoy || recordatoriosPendientes || conMora) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Filtro activo:</Typography>
              {promesaIncumplida && (
                <Chip size="small" color="error" label="Promesas incumplidas"
                  onDelete={() => setUrlFilters({ promesaIncumplida: undefined })} />
              )}
              {promesaVenceHoy && (
                <Chip size="small" color="warning" label="Promesas vencen hoy"
                  onDelete={() => setUrlFilters({ promesaVenceHoy: undefined })} />
              )}
              {promesaEstado && (
                <Chip size="small" label={`Promesa: ${promesaEstado}`}
                  onDelete={() => setUrlFilters({ promesaEstado: undefined })} />
              )}
              {recordatoriosPendientes && (
                <Chip size="small" color="secondary" label="Con recordatorios pendientes"
                  onDelete={() => setUrlFilters({ recordatoriosPendientes: undefined })} />
              )}
              {conMora && (
                <Chip size="small" color="info" label="Con mora"
                  onDelete={() => setUrlFilters({ conMora: undefined })} />
              )}
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Bulk action toolbar (sticky on top of table when items selected) */}
      {selectedIds.size > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'sticky',
            top: 8,
            zIndex: 2,
            mb: 1,
            bgcolor: 'primary.50',
            border: (t) => `1px solid ${t.palette.primary.main}`,
          }}
        >
          <Toolbar variant="dense" sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={600} sx={{ flexShrink: 0 }}>
              {selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              variant="outlined"
              startIcon={<FlagOutlined />}
              disabled={bulkBusy}
              onClick={(e) => setBulkPrioridadAnchor(e.currentTarget)}
            >
              Cambiar prioridad
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Lock />}
              disabled={bulkBusy}
              onClick={(e) => setBulkCierreAnchor(e.currentTarget)}
            >
              Cerrar selección
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<Clear />}
              onClick={clearSelection}
              disabled={bulkBusy}
            >
              Limpiar
            </Button>
          </Toolbar>
        </Paper>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    color="primary"
                    indeterminate={someVisibleSelected}
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={visibleSelectableIds.length === 0}
                    inputProps={{ 'aria-label': 'Seleccionar todas las gestiones visibles' }}
                  />
                </TableCell>
                {[
                  { label: 'Cliente', field: null },
                  { label: 'Teléfono', field: null },
                  { label: 'Días Mora', field: 'diasMoraReal', align: 'center' as const },
                  { label: 'Monto Pendiente', field: 'montoPendiente', align: 'right' as const },
                  { label: 'Estado', field: 'estado' },
                  { label: 'Prioridad', field: 'prioridad' },
                  { label: 'Próxima Gestión', field: 'fechaProximaGestion' },
                  { label: 'Acc.', field: null, align: 'center' as const },
                  { label: 'Recor.', field: null, align: 'center' as const },
                  { label: 'Acciones', field: null, align: 'center' as const },
                ].map(({ label, field, align }) => (
                  <TableCell key={label} sx={{ fontWeight: 700 }} align={align}>
                    {field ? (
                      <TableSortLabel
                        active={sortField === field}
                        direction={sortField === field ? sortDir : 'asc'}
                        onClick={() => handleSort(field)}
                      >
                        {label}
                      </TableSortLabel>
                    ) : label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {gestiones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography color="text.secondary" py={4}>
                      No se encontraron gestiones
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                gestiones.map((g) => {
                  const proximaInfo = getProximaGestionLabel(g.fechaProximaGestion);
                  const isSelected = selectedIds.has(g.id);
                  return (
                    <TableRow
                      key={g.id}
                      hover
                      selected={isSelected}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/cobranzas/${g.id}`)}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          color="primary"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(g.id)}
                          disabled={!g.activa}
                          inputProps={{ 'aria-label': `Seleccionar gestión ${g.id}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {g.clienteNombre} {g.clienteApellido}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {g.clienteTelefono ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2">{g.clienteTelefono}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={g.diasMoraReal > 60 ? 'error.main' : g.diasMoraReal > 30 ? 'warning.main' : 'text.primary'}
                        >
                          {g.diasMoraReal}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatPrice(g.montoPendiente)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ESTADO_GESTION_COBRANZA_LABELS[g.estado]}
                          size="small"
                          sx={{
                            bgcolor: ESTADO_GESTION_COBRANZA_COLORS[g.estado],
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {g.prioridad ? (
                          <Chip
                            label={PRIORIDAD_COBRANZA_LABELS[g.prioridad]}
                            size="small"
                            sx={{
                              bgcolor: PRIORIDAD_COBRANZA_COLORS[g.prioridad],
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem',
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof proximaInfo === 'string' ? (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        ) : (
                          <Chip
                            label={proximaInfo.label}
                            size="small"
                            color={proximaInfo.color}
                            variant={proximaInfo.color === 'default' ? 'outlined' : 'filled'}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{g.totalAcciones}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        {g.recordatoriosPendientes > 0 ? (
                          <Chip
                            label={g.recordatoriosPendientes}
                            size="small"
                            color="warning"
                          />
                        ) : (
                          <Typography variant="body2" color="text.disabled">0</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          <Tooltip title="Registrar acción">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setAccionDialog({ id: g.id, nombre: `${g.clienteNombre} ${g.clienteApellido}` })}
                                disabled={!g.activa}
                              >
                                <PhoneInTalk fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Crear recordatorio">
                            <span>
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => setRecordatorioDialog({ id: g.id, nombre: `${g.clienteNombre} ${g.clienteApellido}` })}
                                disabled={!g.activa}
                              >
                                <Alarm fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={g.activa ? 'Cerrar gestión' : 'Cerrada'}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => setCierreMenuAnchor({ el: e.currentTarget, id: g.id })}
                                disabled={!g.activa}
                              >
                                <CheckCircleOutline fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => navigate(`/cobranzas/${g.id}`)}>
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Single-row close menu */}
      <Menu
        anchorEl={cierreMenuAnchor?.el ?? null}
        open={!!cierreMenuAnchor}
        onClose={() => setCierreMenuAnchor(null)}
      >
        <MenuItem disabled dense>
          <ListItemText primaryTypographyProps={{ variant: 'caption' }}>
            Cerrar gestión como…
          </ListItemText>
        </MenuItem>
        <Divider />
        {ESTADOS_CIERRE.map((estado) => (
          <MenuItem
            key={estado}
            onClick={() => cierreMenuId != null && handleCerrarSingle(cierreMenuId, estado)}
          >
            <ListItemIcon>
              <CheckCircleOutline
                fontSize="small"
                sx={{ color: ESTADO_GESTION_COBRANZA_COLORS[estado] }}
              />
            </ListItemIcon>
            <ListItemText>{ESTADO_GESTION_COBRANZA_LABELS[estado]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Bulk: cambiar prioridad menu */}
      <Menu
        anchorEl={bulkPrioridadAnchor}
        open={!!bulkPrioridadAnchor}
        onClose={() => setBulkPrioridadAnchor(null)}
      >
        {(Object.keys(PrioridadCobranza) as (keyof typeof PrioridadCobranza)[]).map((key) => {
          const prioridad = PrioridadCobranza[key];
          return (
            <MenuItem key={prioridad} onClick={() => handleBulkPrioridad(prioridad)}>
              <ListItemIcon>
                <FlagOutlined fontSize="small" sx={{ color: PRIORIDAD_COBRANZA_COLORS[prioridad] }} />
              </ListItemIcon>
              <ListItemText>{PRIORIDAD_COBRANZA_LABELS[prioridad]}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>

      {/* Bulk: cerrar menu */}
      <Menu
        anchorEl={bulkCierreAnchor}
        open={!!bulkCierreAnchor}
        onClose={() => setBulkCierreAnchor(null)}
      >
        {ESTADOS_CIERRE.map((estado) => (
          <MenuItem key={estado} onClick={() => handleBulkCierre(estado)}>
            <ListItemIcon>
              <CheckCircleOutline fontSize="small" sx={{ color: ESTADO_GESTION_COBRANZA_COLORS[estado] }} />
            </ListItemIcon>
            <ListItemText>{ESTADO_GESTION_COBRANZA_LABELS[estado]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <NuevaGestionDialog
        open={nuevaGestionOpen}
        onClose={() => setNuevaGestionOpen(false)}
        onSaved={() => {
          setNuevaGestionOpen(false);
          refresh();
        }}
      />

      {accionDialog && (
        <RegistrarAccionDialog
          open
          gestionId={accionDialog.id}
          clienteNombre={accionDialog.nombre}
          onClose={() => setAccionDialog(null)}
          onSaved={() => {
            setAccionDialog(null);
            refresh();
          }}
        />
      )}

      {recordatorioDialog && (
        <RecordatorioCobranzaDialog
          open
          gestionId={recordatorioDialog.id}
          clienteNombre={recordatorioDialog.nombre}
          onClose={() => setRecordatorioDialog(null)}
          onSaved={() => {
            setRecordatorioDialog(null);
            refresh();
          }}
        />
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ minWidth: 280 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
