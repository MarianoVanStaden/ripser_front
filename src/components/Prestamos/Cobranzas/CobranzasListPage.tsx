import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, TablePagination, TableSortLabel, IconButton, Typography,
  Tooltip, CircularProgress, Alert, TextField, InputAdornment,
  Chip, Stack, Button, FormControlLabel, Switch, Checkbox,
  Toolbar, Menu, MenuItem, Snackbar, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import { StickyScrollTable } from '../../common/StickyScrollTable';
import {
  sxStickyCheckboxHead,
  sxStickyCheckboxBody,
  sxStickyClienteHead,
  sxStickyClienteBody,
} from '../../common/stickyScrollTableStyles';
import {
  Visibility, Add, Search, Phone,
  PhoneInTalk, Alarm, CheckCircleOutline, Clear,
  Lock, FlagOutlined, WhatsApp as WhatsAppIcon, AttachMoney,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate, useLocation } from 'react-router-dom';
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
  TIPO_ORIGEN_COBRANZA_LABELS,
} from '../../../types/cobranza.types';
import type { GestionCobranzaDTO } from '../../../types/cobranza.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { openWhatsAppWeb } from '../../../utils/whatsapp';
import { usePagination } from '../../../hooks/usePagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { useUrlFilters } from '../../../hooks/useUrlFilters';
import { useSseEvent } from '../../../hooks/useSseEvent';
import { SSE_EVENTS } from '../../../lib/sse-contract';
import { NuevaGestionDialog } from './NuevaGestionDialog';
import { RegistrarAccionDialog } from './RegistrarAccionDialog';
import { RegistrarCobroDialog } from './RegistrarCobroDialog';
import { RecordatorioCobranzaDialog } from './RecordatorioCobranzaDialog';
import ConfirmDialog from '../../common/ConfirmDialog';

type FechaGestionFiltro =
  | 'HOY_Y_VENCIDAS' | 'VENCIDAS' | 'AYER' | 'HOY' | 'MANANA' | 'ESTA_SEMANA'
  | 'PROXIMOS_7' | 'ESTE_MES' | 'MORA_PROLONGADA' | 'SIN_FECHA' | 'TODAS';

/** Preset por defecto de la lista: la agenda de gestiones que toca atender hoy. */
const FECHA_FILTRO_DEFAULT: FechaGestionFiltro = 'HOY_Y_VENCIDAS';

const FECHA_FILTRO_OPTIONS: { value: FechaGestionFiltro; label: string; color: string; tip: string }[] = [
  { value: 'HOY_Y_VENCIDAS', label: 'Agenda de hoy',   color: '#ed6c02', tip: 'Lo que toca gestionar hoy: próxima gestión de hoy o anterior, excluyendo mora prolongada y legales.' },
  { value: 'VENCIDAS',       label: 'Gestión atrasada', color: '#d32f2f', tip: 'Gestiones cuya fecha de PRÓXIMA GESTIÓN ya pasó (es la fecha de contacto, NO la mora del préstamo).' },
  { value: 'AYER',           label: 'Ayer',             color: '#c2185b', tip: 'Próxima gestión agendada para ayer.' },
  { value: 'HOY',            label: 'Solo hoy',         color: '#f57c00', tip: 'Próxima gestión agendada exactamente para hoy (sin tope de mora).' },
  { value: 'MANANA',         label: 'Mañana',           color: '#0288d1', tip: 'Próxima gestión agendada para mañana.' },
  { value: 'ESTA_SEMANA',    label: 'Esta semana',      color: '#7b1fa2', tip: 'Próxima gestión dentro de esta semana.' },
  { value: 'PROXIMOS_7',     label: 'Próximos 7 días',  color: '#2e7d32', tip: 'Próxima gestión en los próximos 7 días.' },
  { value: 'ESTE_MES',       label: 'Este mes',         color: '#00796b', tip: 'Próxima gestión dentro de este mes.' },
  { value: 'MORA_PROLONGADA',label: 'Mora prolongada',  color: '#6a1b9a', tip: 'Préstamos con muchos días de mora (sobre el umbral configurado) o en legal. Se trabajan aparte de la agenda diaria.' },
  { value: 'SIN_FECHA',      label: 'Sin fecha',        color: '#757575', tip: 'Gestiones sin próxima gestión agendada.' },
  { value: 'TODAS',          label: 'Todas',            color: '#455a64', tip: 'Todas las gestiones activas, sin filtrar por fecha.' },
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
  const location = useLocation();
  // Al abrir un detalle guardamos el query string actual (term + filtros, que
  // useUrlFilters mantiene en la URL) para que "Volver" restaure la búsqueda.
  const openDetalle = (id: number) =>
    navigate(`/cobranzas/${id}`, { state: { fromSearch: location.search } });
  // Click en la fila → Crédito Personal de la gestión. Pasamos `from` para que
  // el "Volver" del crédito regrese a esta agenda con los filtros actuales.
  const openCredito = (prestamoId: number) =>
    navigate(`/prestamos/${prestamoId}`, { state: { from: `/cobranzas/lista${location.search}` } });

  const { filters: urlFilters, setFilters: setUrlFilters, resetFilters: resetUrlFilters } = useUrlFilters(
    FILTER_SCHEMA,
    { soloActivas: true, fechaFiltro: FECHA_FILTRO_DEFAULT }
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
  const [cobroDialog, setCobroDialog] = useState<{ prestamoId: number; clienteId: number; nombre: string } | null>(null);
  const [accionDialog, setAccionDialog] = useState<{ id: number; nombre: string } | null>(null);
  const [recordatorioDialog, setRecordatorioDialog] = useState<{ id: number; nombre: string } | null>(null);
  const [cierreMenuAnchor, setCierreMenuAnchor] = useState<{ el: HTMLElement; id: number } | null>(null);

  // Bulk selection state.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkPrioridadAnchor, setBulkPrioridadAnchor] = useState<HTMLElement | null>(null);
  const [bulkCierreAnchor, setBulkCierreAnchor] = useState<HTMLElement | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  // Diálogo de confirmación para cerrar gestiones en bulk.
  const [confirmCierre, setConfirmCierre] = useState<{ estado: EstadoGestionCobranza; cantidad: number } | null>(null);

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

  // Auto-refresh en tiempo real: cuando admin confirma/rechaza un pago informado o se
  // registra un pago (otra pantalla/usuario), el backend emite estos eventos SSE y la
  // agenda se actualiza sola. Reusa la conexión SSE global (no abre una nueva).
  useSseEvent([SSE_EVENTS.CUOTA_ACTUALIZADA, SSE_EVENTS.PAGO_REGISTRADO], refresh);

  // Conteo para el chip "Mora prolongada" (query liviano: size=1, sólo se lee totalElements).
  // Se recalcula cada vez que cambia la lista (acciones del usuario, filtros, refresh por SSE).
  const [moraProlongadaCount, setMoraProlongadaCount] = useState<number | null>(null);
  const fetchMoraProlongadaCount = useCallback(async () => {
    try {
      const res = await gestionCobranzaApi.getAll({ fechaFiltro: 'MORA_PROLONGADA', page: 0, size: 1 });
      setMoraProlongadaCount(res.totalElements);
    } catch {
      /* no crítico: el chip simplemente no muestra el conteo */
    }
  }, []);
  useEffect(() => { fetchMoraProlongadaCount(); }, [gestiones, fetchMoraProlongadaCount]);

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

  const handleBulkCierre = (estado: EstadoGestionCobranza) => {
    setBulkCierreAnchor(null);
    if (selectedIds.size === 0) return;
    setConfirmCierre({ estado, cantidad: selectedIds.size });
  };

  const handleConfirmBulkCierre = async () => {
    if (!confirmCierre) return;
    const { estado } = confirmCierre;
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
      setConfirmCierre(null);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4">Gestiones de Cobranza</Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFechaFiltro === 'HOY_Y_VENCIDAS' && !hasCustomRange
              ? 'Agenda de hoy (gestiones de hoy y atrasadas, sin mora prolongada ni legales). Mirá «Mora prolongada» o «Todas» para el resto.'
              : selectedFechaFiltro === 'MORA_PROLONGADA' && !hasCustomRange
              ? 'Mora prolongada: gestiones que superan el umbral de días de mora o derivadas a Legal.'
              : 'Filtrá por fecha de próxima gestión, estado, prioridad y promesas.'}
          </Typography>
        </Box>
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
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
              Próxima gestión <em>(fecha de contacto, no la mora)</em>:
            </Typography>
            {FECHA_FILTRO_OPTIONS.map(({ value, label, color, tip }) => {
              const selected = !hasCustomRange && selectedFechaFiltro === value;
              const chipLabel = value === 'MORA_PROLONGADA' && moraProlongadaCount != null
                ? `${label} (${moraProlongadaCount})`
                : label;
              return (
                <Tooltip key={value} title={tip} arrow>
                  <Chip
                    label={chipLabel}
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
                </Tooltip>
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
      <StickyScrollTable
        minWidth={1200}
        pagination={
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
        }
      >
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell padding="checkbox" sx={sxStickyCheckboxHead}>
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
                  { label: 'Cliente', field: null, sticky: true },
                  { label: 'Teléfono', field: null },
                  { label: 'Días Mora', field: 'diasMoraReal', align: 'center' as const },
                  { label: 'Monto Pendiente', field: 'montoPendiente', align: 'right' as const },
                  { label: 'Estado', field: 'estado' },
                  { label: 'Prioridad', field: 'prioridad' },
                  { label: 'Próxima Gestión', field: 'fechaProximaGestion' },
                  { label: 'Próx. Vencimiento', field: 'proximaCuotaVencimiento' },
                  { label: 'Acc.', field: null, align: 'center' as const },
                  { label: 'Recor.', field: null, align: 'center' as const },
                  { label: 'Acciones', field: null, align: 'center' as const },
                ].map(({ label, field, align, sticky }) => (
                  <TableCell
                    key={label}
                    align={align}
                    sx={{ fontWeight: 700, ...(sticky ? sxStickyClienteHead : {}) }}
                  >
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
                  <TableCell colSpan={12} align="center">
                    <Stack spacing={1} alignItems="center" py={4}>
                      <Typography color="text.secondary">
                        {selectedFechaFiltro === 'HOY_Y_VENCIDAS' && !hasCustomRange
                          ? 'No hay gestiones para hoy. ¡Agenda al día!'
                          : 'No se encontraron gestiones con los filtros actuales'}
                      </Typography>
                      {selectedFechaFiltro === 'HOY_Y_VENCIDAS' && !hasCustomRange && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setUrlFilters({ fechaFiltro: 'TODAS' })}
                        >
                          Ver todas las gestiones
                        </Button>
                      )}
                    </Stack>
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
                      onClick={() => (g.prestamoId != null ? openCredito(g.prestamoId) : openDetalle(g.id))}
                    >
                      <TableCell padding="checkbox" sx={sxStickyCheckboxBody} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="small"
                          color="primary"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(g.id)}
                          disabled={!g.activa}
                          inputProps={{ 'aria-label': `Seleccionar gestión ${g.id}` }}
                        />
                      </TableCell>
                      <TableCell sx={sxStickyClienteBody}>
                        <Typography variant="body2" fontWeight={600}>
                          {g.clienteNombre} {g.clienteApellido}
                        </Typography>
                        {g.tipoOrigen && g.tipoOrigen !== 'CREDITO' && (
                          <Chip
                            label={TIPO_ORIGEN_COBRANZA_LABELS[g.tipoOrigen]}
                            size="small"
                            variant="outlined"
                            color="warning"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        )}
                        {g.cuotasInformadasCount > 0 && (
                          <Tooltip title="Tiene pago(s) informado(s) esperando confirmación de administración">
                            <Chip
                              size="small"
                              color="warning"
                              variant="outlined"
                              label="Pago informado"
                              sx={{ height: 18, fontSize: '0.65rem', mt: 0.25 }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {g.clienteTelefono ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2">{g.clienteTelefono}</Typography>
                            <Tooltip title="WhatsApp">
                              <IconButton
                                size="small"
                                sx={{ color: '#25D366', p: 0.25 }}
                                onClick={() => openWhatsAppWeb(g.clienteTelefono)}
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
                      <TableCell>
                        {g.proximaCuotaVencimiento ? (
                          <Typography variant="body2">
                            {dayjs(g.proximaCuotaVencimiento).format('DD/MM/YYYY')}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
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
                          <Tooltip title={g.prestamoId != null ? 'Registrar cobro' : 'Cobro libre: informar desde el detalle de la gestión'}>
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => { if (g.prestamoId != null) setCobroDialog({ prestamoId: g.prestamoId, clienteId: g.clienteId, nombre: [g.clienteNombre, g.clienteApellido].filter(Boolean).join(' ') }); }}
                                disabled={!g.activa || g.prestamoId == null}
                              >
                                <AttachMoney fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
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
                            <IconButton size="small" onClick={() => openDetalle(g.id)}>
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
      </StickyScrollTable>

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

      {cobroDialog && (
        <RegistrarCobroDialog
          open
          prestamoId={cobroDialog.prestamoId}
          clienteId={cobroDialog.clienteId}
          clienteNombre={cobroDialog.nombre}
          onClose={() => setCobroDialog(null)}
          onSaved={refresh}
        />
      )}

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

      <ConfirmDialog
        open={!!confirmCierre}
        onClose={() => { if (!bulkBusy) setConfirmCierre(null); }}
        onConfirm={handleConfirmBulkCierre}
        title="Cerrar gestiones"
        severity="warning"
        description={
          confirmCierre
            ? `Vas a cerrar ${confirmCierre.cantidad} gestión(es) con el estado seleccionado. Las gestiones cerradas dejan de aparecer en la vista de activas.`
            : ''
        }
        itemDetails={
          confirmCierre && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary">Nuevo estado:</Typography>
              <Chip
                size="small"
                label={ESTADO_GESTION_COBRANZA_LABELS[confirmCierre.estado]}
                sx={{
                  bgcolor: ESTADO_GESTION_COBRANZA_COLORS[confirmCierre.estado],
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
              <Typography variant="body2" sx={{ ml: 'auto' }}>
                <strong>{confirmCierre.cantidad}</strong> gestión(es)
              </Typography>
            </Stack>
          )
        }
        confirmLabel="Cerrar gestiones"
        loadingLabel="Cerrando…"
        loading={bulkBusy}
      />

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
