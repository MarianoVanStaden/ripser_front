import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Typography,
  Box,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { FlujoCajaMovimientoEnhanced, MetodoPago } from '../../../../types';
import {
  getPaymentMethodLabel,
  getPaymentMethodIcon,
  getPaymentMethodColor,
  getOrigenIcon,
  getOrigenLabel,
  getCategoriaGastoLabel,
  getCategoriaCobroLabel,
} from '../../../../utils/flujoCajaUtils';
import IconButton from '@mui/material/IconButton';

interface FlujoCajaMovimientosTableProps {
  movimientos: FlujoCajaMovimientoEnhanced[];
  loading?: boolean;
  onEdit?: (movimiento: FlujoCajaMovimientoEnhanced) => void;
  onAnular?: (movimientoExtraId: number) => void;
}

const FlujoCajaMovimientosTable: React.FC<FlujoCajaMovimientosTableProps> = ({
  movimientos,
  loading: _loading = false,
  onEdit,
  onAnular,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<MetodoPago | 'ALL'>('ALL');

  // Filtrar movimientos
  const filteredMovimientos = movimientos.filter((mov) => {
    // Filtro por método de pago
    if (selectedMetodoPago !== 'ALL' && mov.metodoPago !== selectedMetodoPago) {
      return false;
    }

    // Filtro por búsqueda de texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        mov.entidad.toLowerCase().includes(searchLower) ||
        mov.concepto.toLowerCase().includes(searchLower) ||
        (mov.numeroComprobante && mov.numeroComprobante.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Ordenar por fecha (desc) y luego por createdAt o ID (desc) para mostrar los más recientes primero
  const sortedMovimientos = [...filteredMovimientos].sort((a, b) => {
    // Primero comparar por fecha
    const fechaCompare = dayjs(b.fecha).valueOf() - dayjs(a.fecha).valueOf();
    if (fechaCompare !== 0) return fechaCompare;

    // Si tienen la misma fecha, usar fechaCreacion/createdAt si está disponible (para movimientos extras)
    const aCreatedAt = a.fechaCreacion || a.createdAt;
    const bCreatedAt = b.fechaCreacion || b.createdAt;
    if (aCreatedAt && bCreatedAt) {
      const createdAtCompare = dayjs(bCreatedAt).valueOf() - dayjs(aCreatedAt).valueOf();
      if (createdAtCompare !== 0) return createdAtCompare;
    }

    // Si no hay createdAt o son iguales, ordenar por ID descendente (más reciente primero)
    return b.id - a.id;
  });

  // Paginar
  const paginatedMovimientos = sortedMovimientos.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleMetodoPagoChange = (event: any) => {
    setSelectedMetodoPago(event.target.value);
    setPage(0);
  };

  // Obtener métodos de pago únicos
  const uniqueMetodosPago = Array.from(
    new Set(movimientos.map((m) => m.metodoPago).filter(Boolean))
  ) as MetodoPago[];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Movimientos Detallados
      </Typography>

      {/* Filtros */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Entidad, concepto, comprobante..."
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Método de Pago</InputLabel>
          <Select
            value={selectedMetodoPago}
            label="Método de Pago"
            onChange={handleMetodoPagoChange}
          >
            <MenuItem value="ALL">Todos</MenuItem>
            {uniqueMetodosPago.map((metodo) => (
              <MenuItem key={metodo} value={metodo}>
                {getPaymentMethodLabel(metodo)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" alignSelf="center" ml="auto">
          {filteredMovimientos.length} de {movimientos.length} movimientos
        </Typography>
      </Box>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Entidad</TableCell>
              <TableCell>Concepto</TableCell>
              <TableCell>Método de Pago</TableCell>
              <TableCell>Comprobante</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMovimientos.map((movimiento) => {
              const MetodoPagoIconComponent = movimiento.metodoPago
                ? getPaymentMethodIcon(movimiento.metodoPago)
                : null;

              return (
                <TableRow
                  key={`${movimiento.origen}-${movimiento.id}`}
                  sx={{
                    bgcolor:
                      movimiento.tipo === 'INGRESO' ? 'success.lighter' : 'error.lighter',
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1,
                      boxShadow: 1,
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {dayjs(movimiento.fecha).format('DD/MM/YYYY')}
                    </Typography>
                    {/* Mostrar hora según el origen del movimiento */}
                    {(movimiento.origen === 'CLIENTE' || movimiento.origen === 'PROVEEDOR') && (
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(movimiento.fecha).format('HH:mm')}
                      </Typography>
                    )}
                    {/* Para movimientos extras, mostrar hora de creación si está disponible */}
                    {(movimiento.origen === 'GASTO_EXTRA' || movimiento.origen === 'COBRO_EXTRA') &&
                      (movimiento.fechaCreacion || movimiento.createdAt) && (
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(movimiento.fechaCreacion || movimiento.createdAt).format('HH:mm')}
                        </Typography>
                      )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={movimiento.tipo}
                      color={movimiento.tipo === 'INGRESO' ? 'success' : 'error'}
                      size="small"
                      icon={
                        movimiento.tipo === 'INGRESO' ? (
                          <TrendingUpIcon />
                        ) : (
                          <TrendingDownIcon />
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {(() => {
                      const OrigenIconComponent = getOrigenIcon(movimiento.origen);
                      let chipColor: 'primary' | 'secondary' | 'error' | 'success' = 'default' as any;

                      if (movimiento.origen === 'CLIENTE') chipColor = 'primary';
                      else if (movimiento.origen === 'PROVEEDOR') chipColor = 'secondary';
                      else if (movimiento.origen === 'GASTO_EXTRA') chipColor = 'error';
                      else if (movimiento.origen === 'COBRO_EXTRA') chipColor = 'success';

                      return (
                        <Chip
                          icon={<OrigenIconComponent />}
                          label={getOrigenLabel(movimiento.origen)}
                          color={chipColor}
                          size="small"
                          variant="outlined"
                        />
                      );
                    })()}
                  </TableCell>

                  <TableCell>
                    {movimiento.categoriaGasto || movimiento.categoriaCobro ? (
                      <Typography variant="body2" fontWeight="500">
                        {movimiento.categoriaGasto
                          ? getCategoriaGastoLabel(movimiento.categoriaGasto)
                          : movimiento.categoriaCobro
                          ? getCategoriaCobroLabel(movimiento.categoriaCobro)
                          : '-'}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {movimiento.entidad}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{movimiento.concepto}</Typography>
                  </TableCell>

                  <TableCell>
                    {movimiento.metodoPago ? (
                      <Chip
                        icon={MetodoPagoIconComponent ? <MetodoPagoIconComponent /> : undefined}
                        label={getPaymentMethodLabel(movimiento.metodoPago)}
                        size="small"
                        sx={{
                          bgcolor: `${getPaymentMethodColor(movimiento.metodoPago)}20`,
                          color: getPaymentMethodColor(movimiento.metodoPago),
                          fontWeight: 'bold',
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {movimiento.numeroComprobante || '-'}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={movimiento.tipo === 'INGRESO' ? 'success.main' : 'error.main'}
                    >
                      {movimiento.tipo === 'INGRESO' ? '+' : '-'}$
                      {movimiento.importe.toLocaleString('es-AR')}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    {movimiento.origen === 'GASTO_EXTRA' ||
                    movimiento.origen === 'COBRO_EXTRA' ? (
                      movimiento.estado === 'ANULADO' ? (
                        <Chip label="Anulado" size="small" color="default" />
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEdit && onEdit(movimiento)}
                            title="Editar"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              onAnular && movimiento.movimientoExtraId && onAnular(movimiento.movimientoExtraId)
                            }
                            title="Anular"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedMovimientos.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="text.secondary" py={4}>
                    {searchTerm || selectedMetodoPago !== 'ALL'
                      ? 'No se encontraron movimientos con los filtros aplicados'
                      : 'No hay movimientos en el período seleccionado'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredMovimientos.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default React.memo(FlujoCajaMovimientosTable);
