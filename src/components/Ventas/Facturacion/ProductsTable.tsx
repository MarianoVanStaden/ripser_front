import React from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { Producto, RecetaFabricacionDTO } from '../../../types';
import ColorPicker from '../../common/ColorPicker';
import type { CartItem, NotaCartItem } from './types';

// Memoized so React keeps a stable component reference across re-renders,
// preventing input focus loss when editing cart fields.
export const ProductsTable = React.memo(
  ({
    items,
    onUpdate,
    onRemove,
    editable = true,
    products,
    recetas,
  }: {
    items: CartItem[] | NotaCartItem[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (index: number, field: any, value: any) => void;
    onRemove: (index: number) => void;
    editable?: boolean;
    products: Producto[];
    recetas: RecetaFabricacionDTO[];
  }) => {
    type TipoEquipoFiltro = '' | 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO';
    const [tipoEquipoFiltro, setTipoEquipoFiltro] = React.useState<TipoEquipoFiltro>('');

    const recetasCountPorTipo = React.useMemo(() => {
      const counts: Record<'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO', number> = {
        HELADERA: 0, COOLBOX: 0, EXHIBIDOR: 0, OTRO: 0,
      };
      recetas.forEach((r) => {
        const t = r.tipoEquipo as 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO' | undefined;
        if (t && t in counts) counts[t]++;
      });
      return counts;
    }, [recetas]);

    const recetasFiltradas = React.useMemo(
      () => (tipoEquipoFiltro ? recetas.filter((r) => r.tipoEquipo === tipoEquipoFiltro) : recetas),
      [recetas, tipoEquipoFiltro],
    );

    return (
      <Box>
        {editable && recetas.length > 0 && (
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Filtrar equipos por tipo"
              value={tipoEquipoFiltro}
              onChange={(e) => setTipoEquipoFiltro(e.target.value as TipoEquipoFiltro)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Todos ({recetas.length})</MenuItem>
              <MenuItem value="HELADERA" disabled={recetasCountPorTipo.HELADERA === 0}>
                Heladera ({recetasCountPorTipo.HELADERA})
              </MenuItem>
              <MenuItem value="COOLBOX" disabled={recetasCountPorTipo.COOLBOX === 0}>
                Coolbox ({recetasCountPorTipo.COOLBOX})
              </MenuItem>
              <MenuItem value="EXHIBIDOR" disabled={recetasCountPorTipo.EXHIBIDOR === 0}>
                Exhibidor ({recetasCountPorTipo.EXHIBIDOR})
              </MenuItem>
              <MenuItem value="OTRO" disabled={recetasCountPorTipo.OTRO === 0}>
                Otro ({recetasCountPorTipo.OTRO})
              </MenuItem>
            </TextField>
            {tipoEquipoFiltro && (
              <Button size="small" variant="text" onClick={() => setTipoEquipoFiltro('')}>
                Limpiar filtro
              </Button>
            )}
          </Box>
        )}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ overflowX: 'auto', width: '100%', maxWidth: '100%' }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: { xs: 700, md: 900 }, width: '100%' }}>
            <TableHead>
              <TableRow>
                {editable && <TableCell sx={{ minWidth: { xs: 100, md: 120 } }}>Tipo</TableCell>}
                <TableCell sx={{ minWidth: { xs: 180, md: 220 } }}>Producto/Equipo</TableCell>
                <TableCell sx={{ minWidth: { xs: 90, md: 100 } }}>Color</TableCell>
                <TableCell sx={{ minWidth: { xs: 90, md: 100 } }}>Medida</TableCell>
                <TableCell align="center" sx={{ minWidth: { xs: 90, md: 120 } }}>Cantidad</TableCell>
                <TableCell align="right" sx={{ minWidth: { xs: 120, md: 160 } }}>Precio Unit.</TableCell>
                <TableCell align="right" sx={{ minWidth: { xs: 90, md: 120 } }}>Desc. %</TableCell>
                <TableCell align="right" sx={{ minWidth: { xs: 120, md: 160 } }}>Subtotal</TableCell>
                {editable && <TableCell align="center" sx={{ minWidth: { xs: 90, md: 120 } }}>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const subtotal = item.cantidad * item.precioUnitario * (1 - item.descuento / 100);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemAny = item as any;
                return (
                  <TableRow key={index} hover>
                    {editable && (
                      <TableCell>
                        <Select
                          fullWidth
                          size="small"
                          value={itemAny.tipoItem || 'PRODUCTO'}
                          onChange={(e) => onUpdate(index, 'tipoItem', e.target.value)}
                        >
                          <MenuItem value="PRODUCTO">Producto</MenuItem>
                          <MenuItem value="EQUIPO">Equipo</MenuItem>
                        </Select>
                      </TableCell>
                    )}
                    <TableCell>
                      {editable ? (
                        itemAny.tipoItem === 'EQUIPO' ? (
                          <Select
                            fullWidth
                            size="small"
                            value={itemAny.recetaId || ''}
                            onChange={(e) => onUpdate(index, 'recetaId', e.target.value)}
                          >
                            {recetasFiltradas.length === 0 ? (
                              <MenuItem disabled>
                                {recetas.length === 0
                                  ? 'No hay equipos disponibles'
                                  : `No hay equipos del tipo ${tipoEquipoFiltro}`}
                              </MenuItem>
                            ) : (
                              recetasFiltradas.map((r) => (
                                <MenuItem key={r.id} value={r.id}>
                                  {r.nombre} - {r.modelo} ({r.tipoEquipo})
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        ) : (
                          <Select
                            fullWidth
                            size="small"
                            value={itemAny.productoId || ''}
                            onChange={(e) => onUpdate(index, 'productoId', e.target.value)}
                          >
                            {products
                              .filter((p) => p && p.id)
                              .map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.nombre || 'Producto sin nombre'}
                                </MenuItem>
                              ))}
                          </Select>
                        )
                      ) : (
                        <Typography noWrap maxWidth={360}>
                          {itemAny.tipoItem === 'EQUIPO'
                            ? `${itemAny.recetaNombre || ''} ${
                                itemAny.recetaModelo ? `- ${itemAny.recetaModelo}` : ''
                              }`
                            : item.productoNombre}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editable && itemAny.tipoItem === 'EQUIPO' ? (
                        <ColorPicker
                          value={itemAny.colorId ?? undefined}
                          onChange={(id) => onUpdate(index, 'colorId', id ?? '')}
                          label=""
                        />
                      ) : (
                        <Typography>{itemAny.colorNombre || '-'}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography>{itemAny.medidaNombre || '-'}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                        {editable ? (
                          <TextField
                            type="number"
                            size="small"
                            value={item.cantidad}
                            onChange={(e) => onUpdate(index, 'cantidad', e.target.value)}
                            inputProps={{ min: 1 }}
                            sx={{ width: 90 }}
                          />
                        ) : (
                          <Typography align="center">{item.cantidad}</Typography>
                        )}
                        {itemAny.tipoItem === 'EQUIPO' && itemAny.stockVerificado && (
                          <Tooltip
                            title={`Stock disponible: ${itemAny.stockDisponible || 0} unidades`}
                            arrow
                          >
                            <Chip
                              size="small"
                              label={
                                itemAny.requiereFabricacion
                                  ? `Stock: ${itemAny.stockDisponible}`
                                  : '✓ Stock OK'
                              }
                              color={itemAny.requiereFabricacion ? 'warning' : 'success'}
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {editable ? (
                        <TextField
                          type="number"
                          size="small"
                          value={item.precioUnitario}
                          onChange={(e) => onUpdate(index, 'precioUnitario', e.target.value)}
                          inputProps={{ min: 0, step: 0.01 }}
                          sx={{ width: 140 }}
                        />
                      ) : (
                        <Typography align="right">${item.precioUnitario.toFixed(2)}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editable ? (
                        <TextField
                          type="number"
                          size="small"
                          value={item.descuento}
                          onChange={(e) => onUpdate(index, 'descuento', e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: 100 }}
                        />
                      ) : (
                        <Typography align="right">{item.descuento}%</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ${subtotal.toFixed(2)}
                      </Typography>
                    </TableCell>
                    {editable && (
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => onRemove(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  },
);

ProductsTable.displayName = 'ProductsTable';
