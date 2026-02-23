import { useState, useCallback, useEffect } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TablePagination, IconButton, Typography,
  Tooltip, CircularProgress, Alert, TextField, InputAdornment,
  Chip, Stack, Button, Menu, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
  Visibility, Edit, Delete, Add, Search, FilterList,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import {
  EstadoPrestamo, ESTADO_PRESTAMO_LABELS, ESTADO_PRESTAMO_COLORS,
  CategoriaPrestamo, CATEGORIA_PRESTAMO_LABELS, CATEGORIA_PRESTAMO_COLORS,
  TIPO_FINANCIACION_LABELS,
} from '../../types/prestamo.types';
import type { PrestamoPersonalDTO } from '../../types/prestamo.types';
import type { PaginationParams } from '../../types/pagination.types';
import { formatPrice } from '../../utils/priceCalculations';
import { PrestamoFormDialog } from './PrestamoFormDialog';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';

type Order = 'asc' | 'desc';
type OrderBy = 'clienteNombre' | 'montoTotal' | 'cuotaActual' | 'estado' | 'categoria' | 'diasVencido' | 'saldoPendiente';

interface PrestamoFilters {
  term?: string;
  estado?: string;
  categoria?: string;
}

export const PrestamosListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstados, setSelectedEstados] = useState<EstadoPrestamo[]>(() => {
    const e = searchParams.get('estado');
    return e ? [e as EstadoPrestamo] : [];
  });
  const [selectedCategorias, setSelectedCategorias] = useState<CategoriaPrestamo[]>(() => {
    const c = searchParams.get('categoria');
    return c ? [c as CategoriaPrestamo] : [];
  });
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('diasVencido');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrestamo, setEditingPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prestamoToDelete, setPrestamoToDelete] = useState<PrestamoPersonalDTO | null>(null);

  // Estado change menu
  const [estadoMenuAnchor, setEstadoMenuAnchor] = useState<null | HTMLElement>(null);
  const [estadoMenuPrestamo, setEstadoMenuPrestamo] = useState<PrestamoPersonalDTO | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const fetchPrestamos = useCallback(
    (page: number, size: number, sort: string, filters: PrestamoFilters) =>
      prestamoPersonalApi.getAll({ page, size, sort, ...filters } as PaginationParams & PrestamoFilters),
    []
  );

  const {
    data: prestamos,
    totalElements,
    loading,
    error,
    page,
    size: rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    setFilters,
    setSort,
    refresh,
  } = usePagination<PrestamoPersonalDTO, PrestamoFilters>({
    fetchFn: fetchPrestamos,
    initialSize: 25,
    defaultSort: 'diasVencido,desc',
  });

  // Update filters when search/filter values change
  useEffect(() => {
    setFilters({
      ...(debouncedSearch ? { term: debouncedSearch } : {}),
      ...(selectedEstados.length === 1 ? { estado: selectedEstados[0] } : {}),
      ...(selectedCategorias.length === 1 ? { categoria: selectedCategorias[0] } : {}),
    });
  }, [debouncedSearch, selectedEstados, selectedCategorias, setFilters]);

  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    setSort(`${property},${newOrder}`);
  };

  const toggleEstado = (estado: EstadoPrestamo) => {
    setSelectedEstados(prev =>
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const toggleCategoria = (cat: CategoriaPrestamo) => {
    setSelectedCategorias(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Préstamos</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setEditingPrestamo(null); setFormOpen(true); }}
        >
          Nuevo Préstamo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search & Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterList fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Estado:</Typography>
          {Object.entries(ESTADO_PRESTAMO_LABELS).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              size="small"
              variant={selectedEstados.includes(key as EstadoPrestamo) ? 'filled' : 'outlined'}
              onClick={() => toggleEstado(key as EstadoPrestamo)}
              sx={{
                bgcolor: selectedEstados.includes(key as EstadoPrestamo)
                  ? ESTADO_PRESTAMO_COLORS[key as EstadoPrestamo]
                  : 'transparent',
                color: selectedEstados.includes(key as EstadoPrestamo) ? 'white' : 'inherit',
                borderColor: ESTADO_PRESTAMO_COLORS[key as EstadoPrestamo],
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mr: 1 }}>Categoría:</Typography>
          {Object.entries(CATEGORIA_PRESTAMO_LABELS).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              size="small"
              variant={selectedCategorias.includes(key as CategoriaPrestamo) ? 'filled' : 'outlined'}
              onClick={() => toggleCategoria(key as CategoriaPrestamo)}
              sx={{
                bgcolor: selectedCategorias.includes(key as CategoriaPrestamo)
                  ? CATEGORIA_PRESTAMO_COLORS[key as CategoriaPrestamo]
                  : 'transparent',
                color: selectedCategorias.includes(key as CategoriaPrestamo) ? 'white' : 'inherit',
                borderColor: CATEGORIA_PRESTAMO_COLORS[key as CategoriaPrestamo],
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel active={orderBy === 'clienteNombre'} direction={orderBy === 'clienteNombre' ? order : 'asc'} onClick={() => handleSort('clienteNombre')}>
                    Cliente
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Financiación</TableCell>
                <TableCell align="center">Cuotas</TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'montoTotal'} direction={orderBy === 'montoTotal' ? order : 'asc'} onClick={() => handleSort('montoTotal')}>
                    Monto Total
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'saldoPendiente'} direction={orderBy === 'saldoPendiente' ? order : 'asc'} onClick={() => handleSort('saldoPendiente')}>
                    Saldo Pendiente
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel active={orderBy === 'estado'} direction={orderBy === 'estado' ? order : 'asc'} onClick={() => handleSort('estado')}>
                    Estado
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <TableSortLabel active={orderBy === 'categoria'} direction={orderBy === 'categoria' ? order : 'asc'} onClick={() => handleSort('categoria')}>
                    Categoría
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'diasVencido'} direction={orderBy === 'diasVencido' ? order : 'asc'} onClick={() => handleSort('diasVencido')}>
                    Días Vencido
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prestamos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box py={4}>
                      <Typography color="text.secondary">No hay préstamos que mostrar</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                prestamos.map(p => (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/prestamos/${p.id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{p.clienteNombre}</Typography>
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
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={p.saldoPendiente > 0 ? 'error.main' : 'success.main'}
                      >
                        {formatPrice(p.saldoPendiente)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={ESTADO_PRESTAMO_LABELS[p.estado]}
                        size="small"
                        sx={{
                          bgcolor: ESTADO_PRESTAMO_COLORS[p.estado],
                          color: 'white',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          setEstadoMenuAnchor(e.currentTarget);
                          setEstadoMenuPrestamo(p);
                        }}
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
                          <IconButton size="small" onClick={() => navigate(`/prestamos/${p.id}`)}>
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
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={totalElements}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />

      {/* Estado Change Menu */}
      <Menu
        anchorEl={estadoMenuAnchor}
        open={Boolean(estadoMenuAnchor)}
        onClose={() => { setEstadoMenuAnchor(null); setEstadoMenuPrestamo(null); }}
      >
        {Object.entries(ESTADO_PRESTAMO_LABELS).map(([key, label]) => (
          <MenuItem
            key={key}
            onClick={() => handleEstadoChange(key as EstadoPrestamo)}
            disabled={estadoMenuPrestamo?.estado === key}
          >
            <Chip
              label={label}
              size="small"
              sx={{ bgcolor: ESTADO_PRESTAMO_COLORS[key as EstadoPrestamo], color: 'white', mr: 1 }}
            />
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
        <DialogTitle>Eliminar Préstamo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro que desea eliminar el préstamo de <strong>{prestamoToDelete?.clienteNombre}</strong>?
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
