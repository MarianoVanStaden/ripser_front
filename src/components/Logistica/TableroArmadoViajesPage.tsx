import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import RefreshIcon from '@mui/icons-material/Refresh';

import { usePagination } from '../../hooks/usePagination';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useClienteSearch } from '../../hooks/useClienteSearch';
import tableroViajesApi, { type TableroFilterParams } from '../../api/services/tableroViajesApi';
import { documentoApi } from '../../api/services/documentoApi';
import type { TableroPendienteRow, EstadoTablero, TipoOrigenTablero } from '../../types/tablero.types';
import { PROVINCIA_LABELS, type ProvinciaEnum } from '../../types/shared.enums';
import type { Cliente } from '../../types';
import { useTripWizard, type DeliveryPrefill } from './tripWizard/useTripWizard';
import TripWizardDialog from './tripWizard/TripWizardDialog';

// ── Helpers ──────────────────────────────────────────────────────────────────

// Clave estable de fila (una factura y una OS pueden compartir id numérico).
const rowKey = (row: TableroPendienteRow): string =>
  `${row.tipoOrigen}:${row.documentoComercialId ?? row.ordenServicioId}`;

const provinciaLabel = (provincia: string | null): string =>
  provincia ? (PROVINCIA_LABELS[provincia as ProvinciaEnum] ?? provincia) : '—';

const formatFecha = (iso: string | null): string => {
  if (!iso) return 'Sin fecha';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const AtrasoChip: React.FC<{ diasAtraso: number | null }> = ({ diasAtraso }) => {
  if (diasAtraso === null) return <Typography variant="body2" color="text.secondary">—</Typography>;
  if (diasAtraso > 0) {
    return <Chip size="small" color="error" label={`${diasAtraso} ${diasAtraso === 1 ? 'día' : 'días'} de atraso`} />;
  }
  if (diasAtraso === 0) return <Chip size="small" color="warning" label="Vence hoy" />;
  return <Chip size="small" variant="outlined" label={`En ${-diasAtraso} ${diasAtraso === -1 ? 'día' : 'días'}`} />;
};

// ── Página ───────────────────────────────────────────────────────────────────

const FILTER_SCHEMA = {
  provincia: 'string',
  clienteId: 'number',
  tipoDocumento: 'string',
  fechaDesde: 'string',
  fechaHasta: 'string',
  soloAtrasados: 'boolean',
  conObservaciones: 'string', // 'SI' | 'NO' | ausente
  estadoTablero: 'string',
} as const;

const TableroArmadoViajesPage: React.FC = () => {
  const { filters: urlFilters, setFilter, resetFilters } = useUrlFilters(FILTER_SCHEMA);

  // Autocomplete de cliente (typeahead server-side, misma UX que otras pantallas).
  const clienteSearch = useClienteSearch();
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [wizardOpen, setWizardOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ severity: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Edición inline de fecha estimada (solo facturas).
  const [fechaDialog, setFechaDialog] = useState<{ row: TableroPendienteRow; value: string } | null>(null);
  const [savingFecha, setSavingFecha] = useState(false);

  const apiFilters: TableroFilterParams = useMemo(() => ({
    provincia: urlFilters.provincia,
    clienteId: urlFilters.clienteId,
    tipoDocumento: urlFilters.tipoDocumento as TipoOrigenTablero | undefined,
    fechaEstimadaDesde: urlFilters.fechaDesde,
    fechaEstimadaHasta: urlFilters.fechaHasta,
    soloAtrasados: urlFilters.soloAtrasados || undefined,
    conObservaciones:
      urlFilters.conObservaciones === 'SI' ? true : urlFilters.conObservaciones === 'NO' ? false : undefined,
    estadoTablero: urlFilters.estadoTablero as EstadoTablero | undefined,
  }), [urlFilters]);

  const pagination = usePagination<TableroPendienteRow, TableroFilterParams>({
    fetchFn: (page, size, sort, filters) => tableroViajesApi.getPendientes(page, size, sort, filters),
    initialSize: 25,
    defaultSort: 'fechaEstimada,asc',
    initialFilters: apiFilters,
  });
  const { setFilters } = pagination;

  // La URL es la fuente de verdad de los filtros; cada cambio re-consulta al backend.
  const apiFiltersKey = JSON.stringify(apiFilters);
  useEffect(() => {
    setFilters(apiFilters);
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFiltersKey, setFilters]);

  // ── Wizard de creación de viaje (reutiliza el de Armado de Viajes) ─────────
  const wizard = useTripWizard({
    onSaved: (_viaje, entregaErrors) => {
      setWizardOpen(false);
      setSelected(new Set());
      pagination.refresh();
      if (entregaErrors.length > 0) {
        setSnackbar({
          severity: 'warning',
          message: `Viaje creado, pero hubo errores en algunas entregas:\n${entregaErrors.join('\n')}`,
        });
      } else {
        setSnackbar({ severity: 'success', message: 'Viaje creado con las paradas seleccionadas' });
      }
    },
    onError: (msg) => setSnackbar({ severity: 'error', message: msg }),
  });

  const selectableRows = pagination.data.filter((r) => !r.asignadoAViaje);
  const selectedRows = pagination.data.filter((r) => selected.has(rowKey(r)));

  const toggleRow = (row: TableroPendienteRow) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = rowKey(row);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (selectableRows.length > 0 && selectableRows.every((r) => prev.has(rowKey(r)))) {
        return new Set();
      }
      return new Set(selectableRows.map(rowKey));
    });
  };

  const handleCrearViaje = () => {
    const prefill: DeliveryPrefill[] = selectedRows.map((row) => ({
      tipoEntrega: row.tipoOrigen,
      facturaId: row.documentoComercialId ?? undefined,
      ordenServicioId: row.ordenServicioId ?? undefined,
      direccionEntrega: [row.direccion, row.ciudad, provinciaLabel(row.provincia) !== '—' ? provinciaLabel(row.provincia) : null]
        .filter(Boolean)
        .join(', '),
      observaciones: row.observaciones ?? undefined,
      fechaProgramada: row.fechaEstimadaEntrega ?? undefined,
    }));
    wizard.startCreate(prefill);
    setWizardOpen(true);
  };

  const handleSaveFecha = async () => {
    if (!fechaDialog?.row.documentoComercialId) return;
    setSavingFecha(true);
    try {
      await documentoApi.updateFechaEstimadaEntrega(
        fechaDialog.row.documentoComercialId,
        fechaDialog.value || null
      );
      setFechaDialog(null);
      pagination.refresh();
    } catch {
      setSnackbar({ severity: 'error', message: 'No se pudo actualizar la fecha estimada de entrega' });
    } finally {
      setSavingFecha(false);
    }
  };

  const handleSort = (column: 'fechaEstimada' | 'cliente') => {
    const [currentBy, currentDir] = pagination.sort.split(',');
    const nextDir = currentBy === column && currentDir === 'asc' ? 'desc' : 'asc';
    pagination.setSort(`${column},${nextDir}`);
  };
  const [sortBy, sortDir] = pagination.sort.split(',') as [string, 'asc' | 'desc'];

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={600}>
          Tablero de Pendientes de Entrega
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Actualizar">
            <IconButton onClick={() => pagination.refresh()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<LocalShippingIcon />}
            disabled={selectedRows.length === 0}
            onClick={handleCrearViaje}
          >
            Crear viaje ({selectedRows.length} {selectedRows.length === 1 ? 'parada' : 'paradas'})
          </Button>
        </Box>
      </Box>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Provincia</InputLabel>
              <Select
                label="Provincia"
                value={urlFilters.provincia ?? ''}
                onChange={(e) => setFilter('provincia', e.target.value || undefined)}
              >
                <MenuItem value="">Todas</MenuItem>
                {Object.entries(PROVINCIA_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              size="small"
              options={clienteSearch.options}
              loading={clienteSearch.loading}
              value={selectedCliente}
              inputValue={clienteSearch.inputValue}
              onInputChange={(_e, value) => clienteSearch.setInputValue(value)}
              onChange={(_e, cliente) => {
                setSelectedCliente(cliente);
                setFilter('clienteId', cliente?.id ?? undefined);
              }}
              getOptionLabel={(c) => c.razonSocial || `${c.nombre}${c.apellido ? ` ${c.apellido}` : ''}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText="Escribí al menos 3 letras"
              renderInput={(params) => <TextField {...params} label="Cliente" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={urlFilters.tipoDocumento ?? ''}
                onChange={(e) => setFilter('tipoDocumento', e.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="FACTURA">Facturas</MenuItem>
                <MenuItem value="ORDEN_SERVICIO">Órdenes de servicio</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Estimada desde"
              InputLabelProps={{ shrink: true }}
              value={urlFilters.fechaDesde ?? ''}
              onChange={(e) => setFilter('fechaDesde', e.target.value || undefined)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Estimada hasta"
              InputLabelProps={{ shrink: true }}
              value={urlFilters.fechaHasta ?? ''}
              onChange={(e) => setFilter('fechaHasta', e.target.value || undefined)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Observaciones</InputLabel>
              <Select
                label="Observaciones"
                value={urlFilters.conObservaciones ?? ''}
                onChange={(e) => setFilter('conObservaciones', e.target.value || undefined)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="SI">Con observaciones</MenuItem>
                <MenuItem value="NO">Sin observaciones</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={urlFilters.estadoTablero ?? ''}
                onChange={(e) => setFilter('estadoTablero', e.target.value || undefined)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="PENDIENTE">Pendientes sin viaje</MenuItem>
                <MenuItem value="ASIGNADO">En viaje planificado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={urlFilters.soloAtrasados ?? false}
                  onChange={(e) => setFilter('soloAtrasados', e.target.checked || undefined)}
                />
              }
              label="Solo atrasados"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              startIcon={<FilterAltOffIcon />}
              onClick={() => {
                resetFilters();
                setSelectedCliente(null);
                clienteSearch.setInputValue('');
              }}
            >
              Limpiar filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {pagination.error && (
        <Alert severity="error" sx={{ mb: 2 }}>{pagination.error}</Alert>
      )}

      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      <Paper>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.size > 0 && selected.size < selectableRows.length}
                    checked={selectableRows.length > 0 && selectableRows.every((r) => selected.has(rowKey(r)))}
                    disabled={selectableRows.length === 0}
                    onChange={toggleAll}
                  />
                </TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Equipos</TableCell>
                <TableCell sortDirection={sortBy === 'cliente' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'cliente'}
                    direction={sortBy === 'cliente' ? sortDir : 'asc'}
                    onClick={() => handleSort('cliente')}
                  >
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell>Dirección / Localidad / Provincia</TableCell>
                <TableCell>Observaciones</TableCell>
                <TableCell sortDirection={sortBy === 'fechaEstimada' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'fechaEstimada'}
                    direction={sortBy === 'fechaEstimada' ? sortDir : 'asc'}
                    onClick={() => handleSort('fechaEstimada')}
                  >
                    Fecha estimada
                  </TableSortLabel>
                </TableCell>
                <TableCell>Atraso</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagination.loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : pagination.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No hay pendientes de entrega con los filtros aplicados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pagination.data.map((row) => {
                  const key = rowKey(row);
                  return (
                    <TableRow
                      key={key}
                      hover={!row.asignadoAViaje}
                      selected={selected.has(key)}
                      sx={row.asignadoAViaje ? { opacity: 0.6 } : undefined}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.has(key)}
                          disabled={row.asignadoAViaje}
                          onChange={() => toggleRow(row)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            variant="outlined"
                            color={row.tipoOrigen === 'FACTURA' ? 'primary' : 'secondary'}
                            label={row.tipoOrigen === 'FACTURA' ? 'FAC' : 'OS'}
                          />
                          <Typography variant="body2" fontWeight={500}>{row.numeroDocumento}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        {row.equipos.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {row.equipos.map((eq) => (
                              <Tooltip
                                key={eq.id}
                                title={`${eq.modelo ?? ''} ${eq.color?.nombre ? `· ${eq.color.nombre}` : ''} · ${eq.estadoAsignacion ?? ''}`}
                              >
                                <Chip size="small" label={eq.numeroHeladera ?? eq.codigoVenta ?? `#${eq.id}`} />
                              </Tooltip>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.clienteNombre ?? '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" noWrap title={[row.direccion, row.ciudad].filter(Boolean).join(', ')}>
                          {[row.direccion, row.ciudad].filter(Boolean).join(', ') || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {provinciaLabel(row.provincia)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        {row.observaciones ? (
                          <Tooltip title={row.observaciones}>
                            <Typography variant="body2" noWrap>{row.observaciones}</Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" color={row.fechaEstimadaEntrega ? 'text.primary' : 'text.secondary'}>
                            {formatFecha(row.fechaEstimadaEntrega)}
                          </Typography>
                          {row.tipoOrigen === 'FACTURA' && (
                            <Tooltip title="Editar fecha estimada de entrega">
                              <IconButton
                                size="small"
                                onClick={() => setFechaDialog({ row, value: row.fechaEstimadaEntrega ?? '' })}
                              >
                                <EditCalendarIcon fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <AtrasoChip diasAtraso={row.diasAtraso} />
                      </TableCell>
                      <TableCell>
                        {row.asignadoAViaje ? (
                          <Tooltip title="Ya asignado a un viaje planificado (no despachado)">
                            <Chip size="small" color="info" label={`En viaje ${row.numeroViaje ?? ''}`} />
                          </Tooltip>
                        ) : (
                          <Chip size="small" variant="outlined" label="Pendiente" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={pagination.totalElements}
          page={pagination.page}
          rowsPerPage={pagination.size}
          onPageChange={pagination.handleChangePage}
          onRowsPerPageChange={pagination.handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* ── Wizard de creación de viaje precargado ──────────────────────────── */}
      <TripWizardDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        wizard={wizard}
      />

      {/* ── Edición de fecha estimada (solo facturas) ───────────────────────── */}
      <Dialog open={fechaDialog !== null} onClose={() => setFechaDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Fecha estimada de entrega</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {fechaDialog?.row.numeroDocumento} — {fechaDialog?.row.clienteNombre}
          </Typography>
          <TextField
            fullWidth
            type="date"
            label="Fecha estimada"
            InputLabelProps={{ shrink: true }}
            value={fechaDialog?.value ?? ''}
            onChange={(e) => setFechaDialog((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
            helperText="Dejar vacío para borrar la fecha"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFechaDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveFecha} disabled={savingFecha}>
            {savingFecha ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar?.severity ?? 'success'}
          onClose={() => setSnackbar(null)}
          sx={{ whiteSpace: 'pre-line' }}
        >
          {snackbar?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TableroArmadoViajesPage;
