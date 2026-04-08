import { useState, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, TableSortLabel, IconButton, Typography,
  Tooltip, CircularProgress, Alert, TextField, InputAdornment,
  Chip, Stack, Button, FormControlLabel, Switch,
} from '@mui/material';
import {
  Visibility, Add, Search, Phone,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { gestionCobranzaApi } from '../../../api/services/gestionCobranzaApi';
import {
  EstadoGestionCobranza,
  ESTADO_GESTION_COBRANZA_LABELS,
  ESTADO_GESTION_COBRANZA_COLORS,
  PrioridadCobranza,
  PRIORIDAD_COBRANZA_LABELS,
  PRIORIDAD_COBRANZA_COLORS,
} from '../../../types/cobranza.types';
import type { GestionCobranzaDTO } from '../../../types/cobranza.types';
import type { PaginationParams } from '../../../types/pagination.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { usePagination } from '../../../hooks/usePagination';
import { NuevaGestionDialog } from './NuevaGestionDialog';

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

interface CobranzaFilters {
  term?: string;
}

export const CobranzasListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstados, setSelectedEstados] = useState<EstadoGestionCobranza[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<PrioridadCobranza[]>([]);
  const [selectedFechaFiltro, setSelectedFechaFiltro] = useState<FechaGestionFiltro | null>(null);
  const [fechaDesde, setFechaDesde] = useState<Dayjs | null>(null);
  const [fechaHasta, setFechaHasta] = useState<Dayjs | null>(null);
  const [soloActivas, setSoloActivas] = useState(true);
  const [nuevaGestionOpen, setNuevaGestionOpen] = useState(false);


  const fetchGestiones = useCallback(
    (page: number, size: number, sort: string, filters: CobranzaFilters) => {
      const params = { page, size, sort, ...filters } as PaginationParams & CobranzaFilters;
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
    setFilters,
    setSort,
    refresh,
  } = usePagination<GestionCobranzaDTO, CobranzaFilters>({
    fetchFn: fetchGestiones,
    defaultSort: 'fechaApertura,desc',
    initialSize: 25,
  });

  const [sortField, sortDir] = sort.split(',') as [string, 'asc' | 'desc'];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSort(`${field},${sortDir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSort(`${field},asc`);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters(value ? { term: value } : {});
  };

  const toggleEstado = (estado: EstadoGestionCobranza) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  const togglePrioridad = (prioridad: PrioridadCobranza) => {
    setSelectedPrioridades((prev) =>
      prev.includes(prioridad) ? prev.filter((p) => p !== prioridad) : [...prev, prioridad]
    );
  };

  const hasCustomRange = fechaDesde != null || fechaHasta != null;

  // Filtrado client-side por estado, prioridad y fecha próxima gestión
  const gestionesFiltradas = gestiones.filter((g) => {
    if (selectedEstados.length > 0 && !selectedEstados.includes(g.estado)) return false;
    if (selectedPrioridades.length > 0 && (g.prioridad == null || !selectedPrioridades.includes(g.prioridad))) return false;

    if (hasCustomRange) {
      const fecha = g.fechaProximaGestion ? dayjs(g.fechaProximaGestion) : null;
      if (!fecha) return false;
      if (fechaDesde && fecha.isBefore(fechaDesde, 'day')) return false;
      if (fechaHasta && fecha.isAfter(fechaHasta, 'day')) return false;
    } else if (selectedFechaFiltro) {
      const today = dayjs().startOf('day');
      const fecha = g.fechaProximaGestion ? dayjs(g.fechaProximaGestion) : null;
      switch (selectedFechaFiltro) {
        case 'VENCIDAS':
          if (!fecha || !fecha.isBefore(today, 'day')) return false;
          break;
        case 'HOY':
          if (!fecha || !fecha.isSame(today, 'day')) return false;
          break;
        case 'MANANA':
          if (!fecha || !fecha.isSame(today.add(1, 'day'), 'day')) return false;
          break;
        case 'ESTA_SEMANA': {
          const startOfWeek = today.startOf('week');
          const endOfWeek = today.endOf('week');
          if (!fecha || fecha.isBefore(startOfWeek, 'day') || fecha.isAfter(endOfWeek, 'day')) return false;
          break;
        }
        case 'PROXIMOS_7':
          if (!fecha || fecha.isBefore(today, 'day') || fecha.isAfter(today.add(7, 'day'), 'day')) return false;
          break;
        case 'ESTE_MES': {
          const startOfMonth = today.startOf('month');
          const endOfMonth = today.endOf('month');
          if (!fecha || fecha.isBefore(startOfMonth, 'day') || fecha.isAfter(endOfMonth, 'day')) return false;
          break;
        }
        case 'SIN_FECHA':
          if (g.fechaProximaGestion != null) return false;
          break;
      }
    }
    return true;
  });

  const getProximaGestionLabel = (fecha: string | null) => {
    if (!fecha) return '-';
    const d = dayjs(fecha);
    const today = dayjs();
    if (d.isBefore(today, 'day')) return { label: d.format('DD/MM/YY'), color: 'error' as const };
    if (d.isSame(today, 'day')) return { label: 'Hoy', color: 'warning' as const };
    return { label: d.format('DD/MM/YY'), color: 'default' as const };
  };

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
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
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
                  onChange={(e) => {
                    setSoloActivas(e.target.checked);
                    refresh();
                  }}
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
                    setFechaDesde(null);
                    setFechaHasta(null);
                    setSelectedFechaFiltro(selected ? null : value);
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
                onChange={(v) => { setFechaDesde(v as Dayjs | null); setSelectedFechaFiltro(null); }}
                slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
                format="DD/MM/YYYY"
              />
              <DatePicker
                label="Hasta"
                value={fechaHasta}
                minDate={fechaDesde ?? undefined}
                onChange={(v) => { setFechaHasta(v as Dayjs | null); setSelectedFechaFiltro(null); }}
                slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
                format="DD/MM/YYYY"
              />
              {hasCustomRange && (
                <Button size="small" variant="text" color="inherit"
                  onClick={() => { setFechaDesde(null); setFechaHasta(null); }}
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
            {(selectedEstados.length > 0 || selectedPrioridades.length > 0 || selectedFechaFiltro != null) && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => {
                  setSelectedEstados([]);
                  setSelectedPrioridades([]);
                  setSelectedFechaFiltro(null);
                  setFilters({});
                }}
              >
                Limpiar
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

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
                {[
                  { label: 'Cliente', field: null },
                  { label: 'Teléfono', field: null },
                  { label: 'Días Mora', field: 'diasMoraReal', align: 'center' as const },
                  { label: 'Monto Pendiente', field: null, align: 'right' as const },
                  { label: 'Estado', field: 'estado' },
                  { label: 'Prioridad', field: 'prioridad' },
                  { label: 'Próxima Gestión', field: 'fechaProximaGestion' },
                  { label: 'Acciones', field: null, align: 'center' as const },
                  { label: 'Recordatorios', field: null, align: 'center' as const },
                  { label: 'Ver', field: null, align: 'center' as const },
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
              {gestionesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography color="text.secondary" py={4}>
                      No se encontraron gestiones
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                gestionesFiltradas.map((g) => {
                  const proximaInfo = getProximaGestionLabel(g.fechaProximaGestion);
                  return (
                    <TableRow
                      key={g.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/cobranzas/${g.id}`)}
                    >
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
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => navigate(`/cobranzas/${g.id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
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

      <NuevaGestionDialog
        open={nuevaGestionOpen}
        onClose={() => setNuevaGestionOpen(false)}
        onSaved={() => {
          setNuevaGestionOpen(false);
          refresh();
        }}
      />
    </Box>
  );
};
