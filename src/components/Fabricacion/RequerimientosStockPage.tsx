import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Alert,
  Chip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  MenuItem,
  TextField,
  CircularProgress,
  Tooltip,
  Button,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalShipping as LocalShippingIcon,
  ShoppingCartCheckout as ShoppingCartCheckoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { requerimientoStockApi } from '../../api/services/requerimientoStockApi';
import type {
  RequerimientoStockDTO,
  EstadoRequerimientoStock,
} from '../../types';

const ESTADOS: EstadoRequerimientoStock[] = ['PENDIENTE', 'PARCIAL', 'RESUELTO', 'CANCELADO'];

const estadoColor: Record<EstadoRequerimientoStock, 'warning' | 'info' | 'success' | 'default'> = {
  PENDIENTE: 'warning',
  PARCIAL: 'info',
  RESUELTO: 'success',
  CANCELADO: 'default',
};

const formatFecha = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const RequerimientoRow: React.FC<{
  req: RequerimientoStockDTO;
  generando: boolean;
  onCambiarEstado: (id: number, estado: EstadoRequerimientoStock) => void;
  onEliminar: (id: number) => void;
  onGenerarOrden: (id: number) => void;
}> = ({ req, generando, onCambiarEstado, onEliminar, onGenerarOrden }) => {
  const [open, setOpen] = useState(false);
  const totalUnidades = req.detalles.reduce((s, d) => s + d.cantidadRequerida, 0);
  const puedeGenerar = req.estado === 'PENDIENTE' || req.estado === 'PARCIAL';

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen((o) => !o)}>
            {open ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>#{req.id}</TableCell>
        <TableCell>{formatFecha(req.fechaCreacion)}</TableCell>
        <TableCell>
          <Chip
            label={req.origen === 'FABRICACION' ? 'Fabricación' : 'Manual'}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell align="center">{req.detalles.length}</TableCell>
        <TableCell align="center">{totalUnidades}</TableCell>
        <TableCell>
          <TextField
            select
            size="small"
            value={req.estado}
            onChange={(e) => onCambiarEstado(req.id, e.target.value as EstadoRequerimientoStock)}
            sx={{ minWidth: 130 }}
          >
            {ESTADOS.map((e) => (
              <MenuItem key={e} value={e}>
                <Chip label={e} size="small" color={estadoColor[e]} sx={{ height: 20 }} />
              </MenuItem>
            ))}
          </TextField>
        </TableCell>
        <TableCell align="right">
          {puedeGenerar && (
            <Tooltip title="Generar orden(es) de compra">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={generando}
                  onClick={() => onGenerarOrden(req.id)}
                >
                  {generando ? (
                    <CircularProgress size={18} />
                  ) : (
                    <ShoppingCartCheckoutIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Eliminar requerimiento">
            <IconButton size="small" color="error" onClick={() => onEliminar(req.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2 }}>
              {req.observaciones && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {req.observaciones}
                </Typography>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Código</TableCell>
                    <TableCell align="center">Requerido</TableCell>
                    <TableCell align="center">Comprado</TableCell>
                    <TableCell>Proveedor sugerido</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {req.detalles.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.productoNombre ?? `#${d.productoId}`}</TableCell>
                      <TableCell>{d.productoCodigo ?? '—'}</TableCell>
                      <TableCell align="center">{d.cantidadRequerida}</TableCell>
                      <TableCell align="center">{d.cantidadComprada}</TableCell>
                      <TableCell>
                        {d.proveedorSugeridoNombre ? (
                          <Chip
                            icon={<LocalShippingIcon />}
                            size="small"
                            variant="outlined"
                            color="primary"
                            label={d.proveedorSugeridoNombre}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export const RequerimientosStockPage: React.FC = () => {
  const [requerimientos, setRequerimientos] = useState<RequerimientoStockDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generandoId, setGenerandoId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoRequerimientoStock | ''>('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requerimientoStockApi.findAll(filtroEstado || undefined);
      setRequerimientos(data);
    } catch (err) {
      const axiosLike = err as { response?: { data?: { message?: string } } };
      setError(axiosLike?.response?.data?.message ?? 'Error al cargar los requerimientos de stock');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCambiarEstado = async (id: number, estado: EstadoRequerimientoStock) => {
    try {
      await requerimientoStockApi.cambiarEstado(id, estado);
      await load();
    } catch {
      setError('No se pudo cambiar el estado del requerimiento');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm(`¿Eliminar el requerimiento #${id}?`)) return;
    try {
      await requerimientoStockApi.eliminar(id);
      setRequerimientos((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('No se pudo eliminar el requerimiento');
    }
  };

  const handleGenerarOrden = async (id: number) => {
    setGenerandoId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await requerimientoStockApi.generarOrdenesCompra(id);
      let msg = res.mensaje;
      if (res.productosSinProveedor.length > 0) {
        msg += ` Sin proveedor (quedan pendientes): ${res.productosSinProveedor.join(', ')}.`;
      }
      setSuccess(msg);
      await load();
    } catch (err) {
      const axiosLike = err as { response?: { data?: { message?: string } } };
      setError(axiosLike?.response?.data?.message ?? 'No se pudieron generar las órdenes de compra');
    } finally {
      setGenerandoId(null);
    }
  };

  const pendientes = useMemo(
    () => requerimientos.filter((r) => r.estado === 'PENDIENTE').length,
    [requerimientos],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Requerimientos de Stock
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pedidos internos de reposición generados desde fabricación. Insumo para armar las compras a
            proveedores.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoRequerimientoStock | '')}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {ESTADOS.map((e) => (
              <MenuItem key={e} value={e}>
                {e}
              </MenuItem>
            ))}
          </TextField>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refrescar
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {!loading && requerimientos.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={`${pendientes} pendiente${pendientes === 1 ? '' : 's'}`}
            color={pendientes > 0 ? 'warning' : 'default'}
            variant={pendientes > 0 ? 'filled' : 'outlined'}
          />
          <Chip label={`${requerimientos.length} en total`} variant="outlined" />
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/proveedores/compras')}>
              Ver compras
            </Button>
          }
        >
          {success}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>N°</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell align="center">Productos</TableCell>
              <TableCell align="center">Unidades</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : requerimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay requerimientos de stock cargados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requerimientos.map((req) => (
                <RequerimientoRow
                  key={req.id}
                  req={req}
                  generando={generandoId === req.id}
                  onCambiarEstado={handleCambiarEstado}
                  onEliminar={handleEliminar}
                  onGenerarOrden={handleGenerarOrden}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RequerimientosStockPage;
