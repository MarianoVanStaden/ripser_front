import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination, IconButton, Typography,
  Tooltip, Alert, TextField, InputAdornment, CircularProgress,
  Chip, Stack, Button, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
  Visibility, Edit, Delete, Add, Search, FilterList,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import type { PrestamoListParams } from '../../api/services/prestamoPersonalApi';
import {
  EstadoPrestamo, ESTADO_PRESTAMO_LABELS, ESTADO_PRESTAMO_COLORS,
  CategoriaPrestamo, CATEGORIA_PRESTAMO_LABELS, CATEGORIA_PRESTAMO_COLORS,
  TIPO_FINANCIACION_LABELS,
} from '../../types/prestamo.types';
import type { PrestamoPersonalDTO } from '../../types/prestamo.types';
import { formatPrice } from '../../utils/priceCalculations';
import { PrestamoFormDialog } from './PrestamoFormDialog';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlFilters } from '../../hooks/useUrlFilters';

const ESTADO_VALUES = new Set<EstadoPrestamo>(Object.values(EstadoPrestamo));
const CATEGORIA_VALUES = new Set<CategoriaPrestamo>(Object.values(CategoriaPrestamo));

const FILTER_SCHEMA = {
  term: 'string',
  estados: 'string[]',
  categorias: 'string[]',
} as const;

export const PrestamosListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Al abrir un detalle guardamos el query string actual (term + filtros, que
  // useUrlFilters mantiene en la URL) para que "Volver" restaure la búsqueda.
  const openDetalle = (id: number) =>
    navigate(`/prestamos/${id}`, { state: { fromSearch: location.search } });

  const { filters: urlFilters, setFilters: setUrlFilters, resetFilters } = useUrlFilters(FILTER_SCHEMA);

  const selectedEstados = useMemo(
    () => (urlFilters.estados ?? []).filter((e): e is EstadoPrestamo => ESTADO_VALUES.has(e as EstadoPrestamo)),
    [urlFilters.estados]
  );
  const selectedCategorias = useMemo(
    () => (urlFilters.categorias ?? []).filter((c): c is CategoriaPrestamo => CATEGORIA_VALUES.has(c as CategoriaPrestamo)),
    [urlFilters.categorias]
  );

  // Search input mirrors URL term with debounce.
  const [searchInput, setSearchInput] = useState<string>(urlFilters.term ?? '');
  const debouncedTerm = useDebounce(searchInput, 300);

  useEffect(() => {
    setSearchInput(urlFilters.term ?? '');
  }, [urlFilters.term]);

  useEffect(() => {
    if ((urlFilters.term ?? '') === debouncedTerm) return;
    setUrlFilters({ term: debouncedTerm || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrestamo, setEditingPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prestamoToDelete, setPrestamoToDelete] = useState<PrestamoPersonalDTO | null>(null);

  // Estado change menu
  const [estadoMenuAnchor, setEstadoMenuAnchor] = useState<null | HTMLElement>(null);
  const [estadoMenuPrestamo, setEstadoMenuPrestamo] = useState<PrestamoPersonalDTO | null>(null);

  const backendFilters = useMemo<PrestamoListParams>(() => ({
    term: urlFilters.term || undefined,
    estados: selectedEstados.length > 0 ? selectedEstados : undefined,
    categorias: selectedCategorias.length > 0 ? selectedCategorias : undefined,
  }), [urlFilters.term, selectedEstados, selectedCategorias]);

  const fetchPrestamos = useCallback(
    (page: number, size: number, sort: string, filters: PrestamoListParams) =>
      prestamoPersonalApi.getAll({ page, size, sort, ...filters }),
    []
  );

  const {
    data: prestamos,
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
  } = usePagination<PrestamoPersonalDTO, PrestamoListParams>({
    fetchFn: fetchPrestamos,
    defaultSort: 'diasVencido,desc',
    initialSize: 25,
    initialFilters: backendFilters,
  });

  useEffect(() => {
    setBackendFilters(backendFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendFilters]);

  const [sortField, sortDir] = sort.split(',') as [string, 'asc' | 'desc'];
  const handleSort = (field: string) => {
    if (sortField === field) setSort(`${field},${sortDir === 'asc' ? 'desc' : 'asc'}`);
    else setSort(`${field},asc`);
  };

  const toggleEstado = (estado: EstadoPrestamo) => {
    const next = selectedEstados.includes(estado)
      ? selectedEstados.filter((e) => e !== estado)
      : [...selectedEstados, estado];
    setUrlFilters({ estados: next });
  };
  const toggleCategoria = (cat: CategoriaPrestamo) => {
    const next = selectedCategorias.includes(cat)
      ? selectedCategorias.filter((c) => c !== cat)
      : [...selectedCategorias, cat];
    setUrlFilters({ categorias: next });
  };

  const hasAnyFilter = !!urlFilters.term || selectedEstados.length > 0 || selectedCategorias.length > 0;

  const handleDelete = async () => {
    if (!prestamoToDelete) return;
    try {
      await prestamoPersonalApi.delete(prestamoToDelete.id);
      setDeleteDialogOpen(false);
      setPrestamoToDelete(null);
      refresh();
    } catch (err) {
      console.error('Error deleting prestamo:', err);
    }
  };

  const handleEstadoChange = async (estado: EstadoPrestamo) => {
    if (!estadoMenuPrestamo) return;
    try {
      await prestamoPersonalApi.cambiarEstado(estadoMenuPrestamo.id, estado);
      setEstadoMenuAnchor(null);
      setEstadoMenuPrestamo(null);
      refresh();
    } catch (err) {
      console.error('Error changing estado:', err);
    }
  };

  const sortableHeader = (label: string, field: string, align: 'left' | 'right' | 'center' = 'left') => (
    <TableCell align={align}>
      <TableSortLabel
        active={sortField === field}
        direction={sortField === field ? sortDir : 'asc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Créditos Personales</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setEditingPrestamo(null); setFormOpen(true); }}
        >
          Nuevo Crédito Personal
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre, apellido, CUIT/DNI o teléfono..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterList fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Estado:</Typography>
            {(Object.keys(ESTADO_PRESTAMO_LABELS) as EstadoPrestamo[]).map((key) => {
              const selected = selectedEstados.includes(key);
              return (
                <Chip
                  key={key}
                  label={ESTADO_PRESTAMO_LABELS[key]}
                  size="small"
                  variant={selected ? 'filled' : 'outlined'}
                  onClick={() => toggleEstado(key)}
                  sx={{
                    bgcolor: selected ? ESTADO_PRESTAMO_COLORS[key] : 'transparent',
                    color: selected ? 'white' : ESTADO_PRESTAMO_COLORS[key],
                    borderColor: ESTADO_PRESTAMO_COLORS[key],
                  }}
                />
              );
            })}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5, mr: 0.5 }}>Categoría:</Typography>
            {(Object.keys(CATEGORIA_PRESTAMO_LABELS) as CategoriaPrestamo[]).map((key) => {
              const selected = selectedCategorias.includes(key);
              return (
                <Chip
                  key={key}
                  label={CATEGORIA_PRESTAMO_LABELS[key]}
                  size="small"
                  variant={selected ? 'filled' : 'outlined'}
                  onClick={() => toggleCategoria(key)}
                  sx={{
                    bgcolor: selected ? CATEGORIA_PRESTAMO_COLORS[key] : 'transparent',
                    color: selected ? 'white' : CATEGORIA_PRESTAMO_COLORS[key],
                    borderColor: CATEGORIA_PRESTAMO_COLORS[key],
                  }}
                />
              );
            })}
            {hasAnyFilter && (
              <Button size="small" variant="text" color="inherit"
                onClick={() => { resetFilters(); setSearchInput(''); }}>
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                {sortableHeader('Cliente', 'cliente.nombre')}
                <TableCell align="right">Financiación</TableCell>
                {sortableHeader('Cuotas', 'cuotaActual', 'center')}
                {sortableHeader('Monto Total', 'montoTotal', 'right')}
                <TableCell align="right">Saldo Pendiente</TableCell>
                {sortableHeader('Estado', 'estado', 'center')}
                {sortableHeader('Categoría', 'categoria', 'center')}
                {sortableHeader('Días Vencido', 'diasVencido', 'right')}
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prestamos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={4}>
                      No hay créditos personales que mostrar
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prestamos.map(p => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetalle(p.id)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {p.clienteNombre}{p.clienteApellido ? ` ${p.clienteApellido}` : ''}
                      </Typography>
                      {p.codigoClienteRojas && (
                        <Typography variant="caption" color="text.secondary">Cód: {p.codigoClienteRojas}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {TIPO_FINANCIACION_LABELS[p.tipoFinanciacion] || p.tipoFinanciacion}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{p.cuotaActual}/{p.cantidadCuotas}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatPrice(p.valorCuota)}/cuota
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatPrice(p.montoTotal)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold"
                        color={p.saldoPendiente > 0 ? 'error.main' : 'success.main'}>
                        {formatPrice(p.saldoPendiente)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={ESTADO_PRESTAMO_LABELS[p.estado]}
                        size="small"
                        sx={{ bgcolor: ESTADO_PRESTAMO_COLORS[p.estado], color: 'white', cursor: 'pointer' }}
                        onClick={(e) => { setEstadoMenuAnchor(e.currentTarget); setEstadoMenuPrestamo(p); }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={CATEGORIA_PRESTAMO_LABELS[p.categoria]}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: CATEGORIA_PRESTAMO_COLORS[p.categoria], color: CATEGORIA_PRESTAMO_COLORS[p.categoria] }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {p.diasVencido > 0 ? (
                        <Typography variant="body2" color="error.main" fontWeight="bold">{p.diasVencido}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0}>
                        <Tooltip title="Ver detalle">
                          <IconButton size="small" onClick={() => openDetalle(p.id)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => { setEditingPrestamo(p); setFormOpen(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => { setPrestamoToDelete(p); setDeleteDialogOpen(true); }}>
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Estado Change Menu */}
      <Menu
        anchorEl={estadoMenuAnchor}
        open={Boolean(estadoMenuAnchor)}
        onClose={() => { setEstadoMenuAnchor(null); setEstadoMenuPrestamo(null); }}
      >
        {(Object.keys(ESTADO_PRESTAMO_LABELS) as EstadoPrestamo[]).map((key) => (
          <MenuItem key={key} onClick={() => handleEstadoChange(key)} disabled={estadoMenuPrestamo?.estado === key}>
            <Chip label={ESTADO_PRESTAMO_LABELS[key]} size="small"
              sx={{ bgcolor: ESTADO_PRESTAMO_COLORS[key], color: 'white', mr: 1 }} />
          </MenuItem>
        ))}
      </Menu>

      {/* Create/Edit Dialog */}
      <PrestamoFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingPrestamo(null); }}
        onSaved={refresh}
        prestamo={editingPrestamo}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar Crédito Personal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el crédito personal de <strong>{prestamoToDelete?.clienteNombre}{prestamoToDelete?.clienteApellido ? ` ${prestamoToDelete.clienteApellido}` : ''}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
