import { useState, useCallback } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, Typography,
  Tooltip, CircularProgress, Alert, TextField, InputAdornment,
  Chip, Stack, Button, FormControlLabel, Switch,
} from '@mui/material';
import {
  Visibility, Add, Search, Phone,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
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

interface CobranzaFilters {
  term?: string;
}

export const CobranzasListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstados, setSelectedEstados] = useState<EstadoGestionCobranza[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<PrioridadCobranza[]>([]);
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
    handleChangePage,
    handleChangeRowsPerPage,
    setFilters,
    refresh,
  } = usePagination<GestionCobranzaDTO, CobranzaFilters>({
    fetchFn: fetchGestiones,
    defaultSort: 'prioridad,asc',
    initialSize: 25,
  });

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

  // Filtrado client-side por estado y prioridad
  const gestionesFiltradas = gestiones.filter((g) => {
    if (selectedEstados.length > 0 && !selectedEstados.includes(g.estado)) return false;
    if (selectedPrioridades.length > 0 && (g.prioridad == null || !selectedPrioridades.includes(g.prioridad))) return false;
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
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
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
            {(selectedEstados.length > 0 || selectedPrioridades.length > 0) && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                onClick={() => {
                  setSelectedEstados([]);
                  setSelectedPrioridades([]);
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
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Días Vencido</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Monto Pendiente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Próxima Gestión</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Acciones</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Recordatorios</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Ver</TableCell>
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
                          color={g.diasVencido > 60 ? 'error.main' : g.diasVencido > 30 ? 'warning.main' : 'text.primary'}
                        >
                          {g.diasVencido}
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
