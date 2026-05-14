import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Typography,
  Tooltip,
  Alert,
  Chip,
  Stack,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  Skeleton,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as ConvertIcon,
  WhatsApp as WhatsAppIcon,
  Add as AddIcon,
  Search as SearchIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { leadApi, type LeadFilterParams } from '../../api/services/leadApi';
import {
  EstadoLeadEnum,
  PrioridadLeadEnum,
  PROVINCIA_LABELS,
  ESTADO_LABELS,
  PRIORIDAD_LABELS
} from '../../types/lead.types';
import type { LeadListItemDTO, RecordatorioLeadDTO } from '../../types/lead.types';
import { RUBRO_LABELS } from '../../types/rubro.types';
import type { PageResponse } from '../../types/pagination.types';
import { CanalBadge } from '../../components/leads/CanalBadge';
import { RecordatorioStatusBadge } from '../../components/leads/RecordatorioStatusBadge';
import { PriorityQuickEdit } from '../../components/leads/PriorityQuickEdit';
import { EstadoQuickEdit } from '../../components/leads/EstadoQuickEdit';
import { useTenant } from '../../context/TenantContext';
import { usePermisos } from '../../hooks/usePermisos';
import { SuperAdminContextModal, useSuperAdminContextCheck } from '../../components/shared';
import { useDebounce } from '../../hooks/useDebounce';
import { openWhatsAppWeb } from '../../utils/whatsapp';

const PAGE_SIZE = 100;
const ROW_HEIGHT = 44;

type Order = 'asc' | 'desc';
type OrderBy =
  | 'nombre'
  | 'telefono'
  | 'provincia'
  | 'canal'
  | 'estadoLead'
  | 'prioridad'
  | 'dias'
  | 'fechaPrimerContacto'
  | 'fechaUltimoContacto';

const SORT_FIELD: Record<OrderBy, string> = {
  nombre: 'nombre',
  telefono: 'telefono',
  provincia: 'provincia',
  canal: 'canal',
  estadoLead: 'estadoLead',
  prioridad: 'prioridad',
  dias: 'fechaPrimerContacto',
  fechaPrimerContacto: 'fechaPrimerContacto',
  fechaUltimoContacto: 'fechaUltimoContacto'
};

const buildSort = (orderBy: OrderBy, order: Order): string => {
  const field = SORT_FIELD[orderBy];
  // 'dias' = hoy − fechaPrimerContacto, así que sort asc/desc se invierte.
  const dir = orderBy === 'dias' ? (order === 'desc' ? 'asc' : 'desc') : order;
  return `${field},${dir}`;
};

type DatePreset = 'todos' | 'ayer' | 'hoy' | 'semana' | 'mes' | 'personalizado';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ayer', label: 'Ayer' },
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'personalizado', label: 'Personalizado' },
];

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Devuelve [desde, hasta] en formato YYYY-MM-DD según el preset.
// "semana" = lunes a domingo de la semana en curso. "mes" = primer y último
// día del mes en curso. "todos" y "personalizado" se resuelven en el caller.
const resolveDatePreset = (preset: DatePreset): { fechaDesde?: string; fechaHasta?: string } => {
  const today = new Date();
  switch (preset) {
    case 'ayer': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const d = toDateStr(yesterday);
      return { fechaDesde: d, fechaHasta: d };
    }
    case 'hoy': {
      const d = toDateStr(today);
      return { fechaDesde: d, fechaHasta: d };
    }
    case 'semana': {
      const day = today.getDay(); // 0=dom..6=sab
      const offsetToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(today);
      monday.setDate(today.getDate() + offsetToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { fechaDesde: toDateStr(monday), fechaHasta: toDateStr(sunday) };
    }
    case 'mes': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { fechaDesde: toDateStr(first), fechaHasta: toDateStr(last) };
    }
    default:
      return {};
  }
};

const ESTADOS_DISPONIBLES: EstadoLeadEnum[] = [
  EstadoLeadEnum.PRIMER_CONTACTO,
  EstadoLeadEnum.MOSTRO_INTERES,
  EstadoLeadEnum.CLIENTE_POTENCIAL,
  EstadoLeadEnum.CLIENTE_POTENCIAL_CALIFICADO,
  EstadoLeadEnum.VENTA,
  EstadoLeadEnum.CONVERTIDO,
  EstadoLeadEnum.DESCARTADO,
  EstadoLeadEnum.PERDIDO,
  EstadoLeadEnum.LEAD_DUPLICADO,
  EstadoLeadEnum.PRECIO_ELEVADO,
  EstadoLeadEnum.COMPRA_ANULADA
];

// Estados ofrecidos en el selector inline. Excluye CONVERTIDO porque la
// conversión a cliente es un flujo dedicado (botón Convertir) que pide datos
// extra (monto, producto, dirección) y no se puede cubrir con un simple PATCH.
const ESTADOS_QUICK_EDIT: EstadoLeadEnum[] = [
  EstadoLeadEnum.PRIMER_CONTACTO,
  EstadoLeadEnum.MOSTRO_INTERES,
  EstadoLeadEnum.CLIENTE_POTENCIAL,
  EstadoLeadEnum.CLIENTE_POTENCIAL_CALIFICADO,
  EstadoLeadEnum.VENTA,
  EstadoLeadEnum.DESCARTADO,
  EstadoLeadEnum.PERDIDO,
  EstadoLeadEnum.LEAD_DUPLICADO,
  EstadoLeadEnum.PRECIO_ELEVADO,
  EstadoLeadEnum.COMPRA_ANULADA
];

const PRIORIDADES_DISPONIBLES: PrioridadLeadEnum[] = [
  PrioridadLeadEnum.HOT,
  PrioridadLeadEnum.WARM,
  PrioridadLeadEnum.COLD
];

export const LeadsTablePage = () => {
  const navigate = useNavigate();
  const { sucursalFiltro, esSuperAdmin } = useTenant();
  const { showModal, closeModal } = useSuperAdminContextCheck();
  const queryClient = useQueryClient();
  const { tieneRol } = usePermisos();
  // Solo gerencia/admin puede eliminar, restaurar y ver papelera. El backend
  // también lo enforce con @PreAuthorize — esto es para la UX (ocultar acciones).
  const canManageDeleted = esSuperAdmin || tieneRol('ADMIN', 'GERENTE_SUCURSAL');

  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('dias');
  const [undoSnack, setUndoSnack] = useState<{ id: number; nombre: string } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nombre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorSnack, setErrorSnack] = useState<string | null>(null);
  const [selectedEstados, setSelectedEstados] = useState<EstadoLeadEnum[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<PrioridadLeadEnum[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [soloMisLeads, setSoloMisLeads] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [customFechaDesde, setCustomFechaDesde] = useState('');
  const [customFechaHasta, setCustomFechaHasta] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filters: LeadFilterParams = useMemo(() => {
    const dateRange =
      datePreset === 'personalizado'
        ? {
            ...(customFechaDesde ? { fechaDesde: customFechaDesde } : {}),
            ...(customFechaHasta ? { fechaHasta: customFechaHasta } : {}),
          }
        : resolveDatePreset(datePreset);

    return {
      ...(sucursalFiltro != null ? { sucursalId: sucursalFiltro } : {}),
      ...(selectedEstados.length > 0 ? { estados: selectedEstados } : {}),
      ...(selectedPrioridades.length === 1 ? { prioridad: selectedPrioridades[0] } : {}),
      ...(debouncedSearch.trim() ? { busqueda: debouncedSearch.trim() } : {}),
      ...(soloMisLeads ? { soloMisLeads: true } : {}),
      ...dateRange,
    };
  }, [
    sucursalFiltro,
    selectedEstados,
    selectedPrioridades,
    debouncedSearch,
    soloMisLeads,
    datePreset,
    customFechaDesde,
    customFechaHasta,
  ]);

  const sort = buildSort(orderBy, order);
  const queryKey = ['leads', { filters, sort }] as const;

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam = 0 }) =>
      leadApi.getAll({ page: pageParam, size: PAGE_SIZE, sort }, filters),
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1)
  });

  const leads: LeadListItemDTO[] = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data]
  );
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  // El próximo recordatorio pendiente viene embebido en cada LeadListItemDTO
  // (campo `proximoRecordatorio`). Ya no necesitamos una query secundaria.

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8
  });

  // Dispara fetchNextPage cuando el usuario está cerca del final del scroll virtual.
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    if (items.length === 0) return;
    const lastVisible = items[items.length - 1];
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      lastVisible.index >= leads.length - 20
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    leads.length,
    fetchNextPage
  ]);

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const toggleEstado = (estado: EstadoLeadEnum) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  const togglePrioridad = (prioridad: PrioridadLeadEnum) => {
    setSelectedPrioridades((prev) =>
      prev.includes(prioridad) ? prev.filter((p) => p !== prioridad) : [...prev, prioridad]
    );
  };

  const invalidateLeads = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  // Aplica un parche local sobre todas las páginas cacheadas del listado para
  // que el cambio se vea inmediato (sin esperar al refetch). El invalidate
  // posterior queda como safety net por si el back devolvió algo distinto.
  const patchLeadInCache = (leadId: number, patch: Partial<LeadListItemDTO>) => {
    queryClient.setQueriesData<InfiniteData<PageResponse<LeadListItemDTO>>>(
      { queryKey: ['leads'] },
      (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            content: page.content.map((item) =>
              item.id === leadId ? { ...item, ...patch } : item
            ),
          })),
        };
      }
    );
  };

  const handleDelete = (id: number) => {
    const lead = leads.find((l) => l.id === id);
    setDeleteTarget({ id, nombre: lead?.nombre ?? 'Lead' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await leadApi.delete(deleteTarget.id);
      invalidateLeads();
      setUndoSnack({ id: deleteTarget.id, nombre: deleteTarget.nombre });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Error al eliminar lead:', err);
      setErrorSnack('No se pudo eliminar el lead');
    } finally {
      setDeleting(false);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoSnack || restoring) return;
    setRestoring(true);
    try {
      await leadApi.restore(undoSnack.id);
      invalidateLeads();
      setUndoSnack(null);
    } catch (err) {
      console.error('Error al restaurar lead:', err);
      setErrorSnack('No se pudo restaurar el lead');
    } finally {
      setRestoring(false);
    }
  };

  const handleUpdatePriority = async (leadId: number, newPriority: PrioridadLeadEnum) => {
    try {
      // PATCH dedicado — no necesita el LeadDTO completo (que ya no viene en la lista).
      await leadApi.updatePrioridad(leadId, newPriority);
      patchLeadInCache(leadId, { prioridad: newPriority });
      invalidateLeads();
    } catch (err) {
      console.error('Error al actualizar prioridad:', err);
      setErrorSnack('Error al actualizar la prioridad del lead');
    }
  };

  const handleUpdateEstado = async (leadId: number, newEstado: EstadoLeadEnum) => {
    try {
      await leadApi.updateEstado(leadId, newEstado);
      patchLeadInCache(leadId, { estadoLead: newEstado });
      invalidateLeads();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setErrorSnack('Error al actualizar el estado del lead');
    }
  };

  const canConvert = (lead: LeadListItemDTO): boolean =>
    lead.estadoLead !== EstadoLeadEnum.CONVERTIDO &&
    lead.estadoLead !== EstadoLeadEnum.DESCARTADO &&
    !lead.clienteOrigenId;

  // Considera fechas razonables solo entre 2000 y año actual + 1 (margen).
  // Una fecha como 5026-03-03 (typo de carga) genera resultados absurdos
  // (-1095663 días) — descartarla y mostrar "-" en su lugar.
  const isFechaRazonable = (fecha?: string): boolean => {
    if (!fecha) return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
    if (!match) return false;
    const year = Number(match[1]);
    const currentYear = new Date().getFullYear();
    return year >= 2000 && year <= currentYear + 1;
  };

  const calcularDias = (fechaPrimerContacto?: string): number => {
    if (!isFechaRazonable(fechaPrimerContacto)) return 0;
    const hoy = new Date();
    const fechaContacto = new Date(fechaPrimerContacto!);
    return Math.floor((hoy.getTime() - fechaContacto.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatearFecha = (fecha?: string): string => {
    if (!fecha) return '-';
    if (!isFechaRazonable(fecha)) return 'Fecha inválida';
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  const getRowColor = (lead: LeadListItemDTO): string => {
    const dias = calcularDias(lead.fechaPrimerContacto);
    if (lead.estadoLead === EstadoLeadEnum.CONVERTIDO) return 'rgba(5, 150, 105, 0.08)';
    if (lead.estadoLead === EstadoLeadEnum.DESCARTADO || lead.estadoLead === EstadoLeadEnum.PERDIDO) {
      return 'rgba(107, 114, 128, 0.08)';
    }
    if (dias > 30) return 'rgba(239, 68, 68, 0.1)';
    if (dias > 15) return 'rgba(245, 158, 11, 0.1)';
    if (dias > 7) return 'rgba(59, 130, 246, 0.08)';
    return '';
  };

  const errorMessage = (() => {
    if (!error) return null;
    const e = error as { response?: { data?: { message?: string } }; message?: string };
    return e?.response?.data?.message || e?.message || 'Error al cargar leads';
  })();

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          📊 Gestión de Leads
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Total: {totalElements} leads
          </Typography>
          {canManageDeleted && (
            <Tooltip title="Ver papelera">
              <Button
                variant="outlined"
                startIcon={<DeleteSweepIcon />}
                onClick={() => navigate('/leads/papelera')}
              >
                Papelera
              </Button>
            </Tooltip>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/leads/nuevo')}>
            Nuevo Lead
          </Button>
        </Box>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button size="small" onClick={() => refetch()}>Reintentar</Button>
        }>
          {errorMessage}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por fecha de primer contacto:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {DATE_PRESETS.map((preset) => (
                <Chip
                  key={preset.value}
                  label={preset.label}
                  size="small"
                  onClick={() => setDatePreset(preset.value)}
                  color={datePreset === preset.value ? 'primary' : 'default'}
                  variant={datePreset === preset.value ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
            {datePreset === 'personalizado' && (
              <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                <TextField
                  label="Desde"
                  type="date"
                  size="small"
                  value={customFechaDesde}
                  onChange={(e) => setCustomFechaDesde(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 180 }}
                />
                <TextField
                  label="Hasta"
                  type="date"
                  size="small"
                  value={customFechaHasta}
                  onChange={(e) => setCustomFechaHasta(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 180 }}
                />
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por estado:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {ESTADOS_DISPONIBLES.map((estado) => (
                <Chip
                  key={estado}
                  label={ESTADO_LABELS[estado]}
                  size="small"
                  onClick={() => toggleEstado(estado)}
                  color={selectedEstados.includes(estado) ? 'primary' : 'default'}
                  variant={selectedEstados.includes(estado) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Filtrar por prioridad:
              {selectedPrioridades.length > 1 && (
                <Typography variant="caption" component="span" color="warning.main" sx={{ ml: 1 }}>
                  (sólo se aplica una a la vez en el server)
                </Typography>
              )}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {PRIORIDADES_DISPONIBLES.map((prioridad) => (
                <Chip
                  key={prioridad}
                  label={PRIORIDAD_LABELS[prioridad]}
                  size="small"
                  onClick={() => togglePrioridad(prioridad)}
                  color={selectedPrioridades.includes(prioridad) ? 'primary' : 'default'}
                  variant={selectedPrioridades.includes(prioridad) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={soloMisLeads}
                  onChange={(_, checked) => setSoloMisLeads(checked)}
                  size="small"
                />
              }
              label="Solo mis leads"
            />
          </Box>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        ref={scrollRef}
        sx={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '12%', minWidth: 120 }}>
                <TableSortLabel
                  active={orderBy === 'nombre'}
                  direction={orderBy === 'nombre' ? order : 'asc'}
                  onClick={() => handleRequestSort('nombre')}
                >
                  Nombre
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '8%', minWidth: 100 }}>
                <TableSortLabel
                  active={orderBy === 'telefono'}
                  direction={orderBy === 'telefono' ? order : 'asc'}
                  onClick={() => handleRequestSort('telefono')}
                >
                  Teléfono
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 80, display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'provincia'}
                  direction={orderBy === 'provincia' ? order : 'asc'}
                  onClick={() => handleRequestSort('provincia')}
                >
                  Prov.
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: 44, minWidth: 44, display: { xs: 'none', md: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'canal'}
                  direction={orderBy === 'canal' ? order : 'asc'}
                  onClick={() => handleRequestSort('canal')}
                >
                  Canal
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '8%', minWidth: 90 }}>
                <TableSortLabel
                  active={orderBy === 'estadoLead'}
                  direction={orderBy === 'estadoLead' ? order : 'asc'}
                  onClick={() => handleRequestSort('estadoLead')}
                >
                  Estado
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 70 }}>
                <TableSortLabel
                  active={orderBy === 'prioridad'}
                  direction={orderBy === 'prioridad' ? order : 'asc'}
                  onClick={() => handleRequestSort('prioridad')}
                >
                  Prior.
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', py: 1, width: '12%', minWidth: 120, display: { xs: 'none', lg: 'table-cell' } }}>
                Interés
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '6%', minWidth: 70, display: { xs: 'none', md: 'table-cell' } }}>
                Rec.
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '7%', minWidth: 80, display: { xs: 'none', lg: 'table-cell' } }}>
                <TableSortLabel
                  active={orderBy === 'fechaPrimerContacto'}
                  direction={orderBy === 'fechaPrimerContacto' ? order : 'asc'}
                  onClick={() => handleRequestSort('fechaPrimerContacto')}
                >
                  1er Cont.
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '4%', minWidth: 50 }}>
                <TableSortLabel
                  active={orderBy === 'dias'}
                  direction={orderBy === 'dias' ? order : 'asc'}
                  onClick={() => handleRequestSort('dias')}
                >
                  Días
                </TableSortLabel>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', py: 1, width: '10%', minWidth: 120 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={11} sx={{ py: 0.75 }}>
                    <Skeleton variant="rectangular" height={28} />
                  </TableCell>
                </TableRow>
              ))
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron leads con los filtros seleccionados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paddingTop > 0 && (
                  <TableRow style={{ height: paddingTop }}>
                    <TableCell colSpan={11} sx={{ p: 0, border: 0 }} />
                  </TableRow>
                )}
                {virtualItems.map((vi) => {
                  const lead = leads[vi.index];
                  if (!lead) return null;
                  // El próximo recordatorio viene embebido. Lo envolvemos como
                  // array de un elemento para que RecordatorioStatusBadge no cambie.
                  const recordatorios: RecordatorioLeadDTO[] = lead.proximoRecordatorio
                    ? [{
                        id: lead.proximoRecordatorio.id,
                        leadId: lead.id,
                        fechaRecordatorio: lead.proximoRecordatorio.fechaRecordatorio,
                        tipo: lead.proximoRecordatorio.tipo as RecordatorioLeadDTO['tipo'],
                        prioridad: lead.proximoRecordatorio.prioridad as RecordatorioLeadDTO['prioridad'],
                        enviado: false,
                      } as RecordatorioLeadDTO]
                    : [];
                  return (
                    <TableRow
                      key={lead.id}
                      data-index={vi.index}
                      hover
                      sx={{
                        height: ROW_HEIGHT,
                        bgcolor: getRowColor(lead),
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>
                        {lead.nombre}
                        {lead.rubro && (
                          <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.1 }}>
                            {RUBRO_LABELS[lead.rubro]}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.875rem' }}>{lead.telefono}</TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.875rem', display: { xs: 'none', lg: 'table-cell' } }}>
                        {lead.provincia ? PROVINCIA_LABELS[lead.provincia] : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75, px: 0.5, display: { xs: 'none', md: 'table-cell' } }}>
                        <CanalBadge canal={lead.canal} iconOnly />
                      </TableCell>
                      <TableCell sx={{ py: 0.75 }}>
                        <EstadoQuickEdit
                          leadId={lead.id!}
                          currentEstado={lead.estadoLead}
                          options={ESTADOS_QUICK_EDIT}
                          onUpdate={handleUpdateEstado}
                          disabled={lead.estadoLead === EstadoLeadEnum.CONVERTIDO}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75 }}>
                        <PriorityQuickEdit
                          leadId={lead.id!}
                          currentPriority={lead.prioridad}
                          onUpdate={handleUpdatePriority}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, fontSize: '0.75rem', maxWidth: 150, display: { xs: 'none', lg: 'table-cell' } }}>
                        {lead.productoInteresNombre ? (
                          <Typography variant="caption" display="block" noWrap title={lead.productoInteresNombre}>
                            {lead.productoInteresNombre}
                          </Typography>
                        ) : lead.modeloRecetaInteres || lead.modeloEquipoInteres ? (
                          <Typography
                            variant="caption"
                            display="block"
                            noWrap
                            title={lead.modeloRecetaInteres || lead.modeloEquipoInteres}
                          >
                            {lead.modeloRecetaInteres || lead.modeloEquipoInteres}
                          </Typography>
                        ) : lead.equipoInteresadoNombre ? (
                          <Typography variant="caption" display="block" noWrap title={lead.equipoInteresadoNombre}>
                            {lead.equipoInteresadoNombre}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75, display: { xs: 'none', md: 'table-cell' } }}>
                        <RecordatorioStatusBadge recordatorios={recordatorios} />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75, fontSize: '0.75rem', display: { xs: 'none', lg: 'table-cell' } }}>
                        {formatearFecha(lead.fechaPrimerContacto)}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.75, fontSize: '0.875rem' }}>
                        {calcularDias(lead.fechaPrimerContacto) || '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" sx={{ p: 0.5 }} onClick={() => navigate(`/leads/${lead.id}`)}>
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {lead.telefono && (
                            <Tooltip title="WhatsApp">
                              <IconButton
                                size="small"
                                sx={{ p: 0.5, color: '#25D366' }}
                                onClick={() => openWhatsAppWeb(lead.telefono)}
                              >
                                <WhatsAppIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {lead.estadoLead !== EstadoLeadEnum.CONVERTIDO && (
                            <Tooltip title="Editar">
                              <IconButton size="small" sx={{ p: 0.5 }} onClick={() => navigate(`/leads/${lead.id}/editar`)}>
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canConvert(lead) && (
                            <Tooltip title="Convertir">
                              <IconButton
                                size="small"
                                sx={{ p: 0.5, color: 'success.main' }}
                                onClick={() => navigate(`/leads/${lead.id}/convertir`)}
                              >
                                <ConvertIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {canManageDeleted && lead.estadoLead !== EstadoLeadEnum.CONVERTIDO && (
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                sx={{ p: 0.5, color: 'error.main' }}
                                onClick={() => handleDelete(lead.id!)}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <TableRow style={{ height: paddingBottom }}>
                    <TableCell colSpan={11} sx={{ p: 0, border: 0 }} />
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        {leads.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            Mostrando {leads.length} de {totalElements} leads
          </Typography>
        )}
        {isFetchingNextPage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">
              Cargando más…
            </Typography>
          </Box>
        )}
      </Box>

      <SuperAdminContextModal
        autoOpen={showModal}
        onClose={closeModal}
        customMessage="Para gestionar leads correctamente, necesitas seleccionar una empresa.
          Esto asegura que los leads se registren y filtren según el contexto de la empresa seleccionada."
      />

      <Snackbar
        open={Boolean(undoSnack)}
        autoHideDuration={6000}
        onClose={(_, reason) => { if (reason !== 'clickaway') setUndoSnack(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={undoSnack ? `Lead "${undoSnack.nombre}" enviado a papelera` : ''}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleUndoDelete}
            disabled={restoring}
          >
            {restoring ? 'Restaurando…' : 'Deshacer'}
          </Button>
        }
      />

      <Snackbar
        open={Boolean(errorSnack)}
        autoHideDuration={5000}
        onClose={() => setErrorSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setErrorSnack(null)}>
          {errorSnack}
        </Alert>
      </Snackbar>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => { if (!deleting) setDeleteTarget(null); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar lead</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que querés eliminar a <strong>{deleteTarget?.nombre}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, fontSize: '0.875rem' }}>
            Vas a poder restaurarlo desde la <strong>Papelera</strong> (botón arriba a la derecha) o
            apretando "Deshacer" en el aviso que aparece después de eliminar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={<DeleteIcon />}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
