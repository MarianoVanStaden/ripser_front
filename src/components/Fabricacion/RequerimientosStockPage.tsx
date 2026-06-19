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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalShipping as LocalShippingIcon,
  Storefront as StorefrontIcon,
  Add as AddIcon,
  Inventory2 as Inventory2Icon,
} from '@mui/icons-material';
import { requerimientoStockApi } from '../../api/services/requerimientoStockApi';
import { productApi } from '../../api/services/productApi';
import { supplierApi } from '../../api/services/supplierApi';
import { proveedorProductoApi } from '../../api/services/proveedorProductoApi';
import { usePermisos } from '../../hooks/usePermisos';
import type {
  RequerimientoStockDTO,
  EstadoRequerimientoStock,
  Producto,
  ProveedorDTO,
} from '../../types';

const ESTADOS: EstadoRequerimientoStock[] = [
  'PENDIENTE',
  'PARCIAL',
  'EN_COMPRA',
  'RECIBIDO',
  'RESUELTO',
  'CANCELADO',
];

const estadoColor: Record<EstadoRequerimientoStock, 'warning' | 'info' | 'success' | 'default'> = {
  PENDIENTE: 'warning',
  PARCIAL: 'info',
  EN_COMPRA: 'info',
  RECIBIDO: 'success',
  RESUELTO: 'success',
  CANCELADO: 'default',
};

const estadoLabel: Record<EstadoRequerimientoStock, string> = {
  PENDIENTE: 'Pendiente',
  PARCIAL: 'Parcial',
  EN_COMPRA: 'En compra',
  RECIBIDO: 'Recibido',
  RESUELTO: 'Resuelto',
  CANCELADO: 'Cancelado',
};

const formatFecha = (iso?: string | null) => {
  if (!iso) return '—';
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

const apiError = (err: unknown, fallback: string) => {
  const axiosLike = err as { response?: { data?: { message?: string } } };
  return axiosLike?.response?.data?.message ?? fallback;
};

const proveedorLabel = (p: ProveedorDTO) => p.razonSocial || `Proveedor #${p.id}`;
const productoLabel = (p: Producto) => (p.codigo ? `${p.nombre} (${p.codigo})` : p.nombre);

// ── Fila de requerimiento ───────────────────────────────────────────────────
const RequerimientoRow: React.FC<{
  req: RequerimientoStockDTO;
  esAdminCompras: boolean;
  onCambiarEstado: (id: number, estado: EstadoRequerimientoStock) => void;
  onEliminar: (id: number) => void;
  onAsignar: (req: RequerimientoStockDTO) => void;
  onRecibir: (req: RequerimientoStockDTO) => void;
}> = ({ req, esAdminCompras, onCambiarEstado, onEliminar, onAsignar, onRecibir }) => {
  const [open, setOpen] = useState(false);
  const totalUnidades = req.detalles.reduce((s, d) => s + d.cantidadRequerida, 0);
  const totalRecibido = req.detalles.reduce((s, d) => s + (d.cantidadRecibida ?? 0), 0);
  const puedeGestionar = req.estado === 'PENDIENTE' || req.estado === 'PARCIAL';
  const puedeRecibir =
    req.estado !== 'CANCELADO' &&
    req.detalles.some((d) => (d.cantidadComprada ?? 0) > (d.cantidadRecibida ?? 0));

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
        <TableCell>{req.usuarioCreadorNombre ?? '—'}</TableCell>
        <TableCell align="center">{req.detalles.length}</TableCell>
        <TableCell align="center">
          {totalRecibido}/{totalUnidades}
        </TableCell>
        <TableCell>
          {esAdminCompras ? (
            <TextField
              select
              size="small"
              value={req.estado}
              onChange={(e) => onCambiarEstado(req.id, e.target.value as EstadoRequerimientoStock)}
              sx={{ minWidth: 140 }}
            >
              {ESTADOS.map((e) => (
                <MenuItem key={e} value={e}>
                  <Chip label={estadoLabel[e]} size="small" color={estadoColor[e]} sx={{ height: 20 }} />
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Chip label={estadoLabel[req.estado]} size="small" color={estadoColor[req.estado]} />
          )}
        </TableCell>
        <TableCell align="right">
          {esAdminCompras && puedeGestionar && (
            <Tooltip title="Asignar proveedores y generar órdenes">
              <IconButton size="small" color="primary" onClick={() => onAsignar(req)}>
                <StorefrontIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {puedeRecibir && (
            <Tooltip title="Registrar recepción">
              <IconButton size="small" color="success" onClick={() => onRecibir(req)}>
                <Inventory2Icon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Eliminar pedido">
            <IconButton size="small" color="error" onClick={() => onEliminar(req.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={9}>
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
                    <TableCell align="center">Solicitado</TableCell>
                    <TableCell align="center">Pedido</TableCell>
                    <TableCell align="center">Recibido</TableCell>
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
                      <TableCell align="center">{d.cantidadRecibida ?? 0}</TableCell>
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

// ── Diálogo: cargar pedido (BOM sin proveedor) ──────────────────────────────
interface LineaPedido {
  producto: Producto | null;
  cantidad: number;
}

const CargarPedidoDialog: React.FC<{
  open: boolean;
  productos: Producto[];
  onClose: () => void;
  onGuardar: (lineas: LineaPedido[], observaciones: string) => Promise<void>;
}> = ({ open, productos, onClose, onGuardar }) => {
  const [lineas, setLineas] = useState<LineaPedido[]>([{ producto: null, cantidad: 1 }]);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setLineas([{ producto: null, cantidad: 1 }]);
      setObservaciones('');
    }
  }, [open]);

  const setLinea = (i: number, patch: Partial<LineaPedido>) =>
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const validas = lineas.filter((l) => l.producto && l.cantidad > 0);
  const puedeGuardar = validas.length > 0;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar(validas, observaciones);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Cargar pedido de materiales</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Listá los productos y cantidades que necesitás. Compras asignará los proveedores.
        </Typography>
        <Stack spacing={1.5}>
          {lineas.map((linea, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <Autocomplete
                sx={{ flex: 1 }}
                size="small"
                options={productos}
                value={linea.producto}
                getOptionLabel={productoLabel}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                onChange={(_, value) => setLinea(i, { producto: value })}
                renderInput={(params) => <TextField {...params} label="Producto" />}
              />
              <TextField
                size="small"
                type="number"
                label="Cantidad"
                value={linea.cantidad}
                onChange={(e) => setLinea(i, { cantidad: Math.max(1, Number(e.target.value) || 0) })}
                sx={{ width: 120 }}
                inputProps={{ min: 1 }}
              />
              <IconButton
                size="small"
                color="error"
                disabled={lineas.length === 1}
                onClick={() => setLineas((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button
          startIcon={<AddIcon />}
          size="small"
          sx={{ mt: 1 }}
          onClick={() => setLineas((prev) => [...prev, { producto: null, cantidad: 1 }])}
        >
          Agregar producto
        </Button>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={!puedeGuardar || guardando} onClick={handleGuardar}>
          {guardando ? <CircularProgress size={20} /> : 'Guardar pedido'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Diálogo: asignar proveedores (split) ────────────────────────────────────
interface FilaAsignacion {
  proveedor: ProveedorDTO | null;
  cantidad: number;
  precioUnitario: number | '';
  /** Precio de referencia guardado para ese proveedor+producto (null si no está catalogado). */
  precioGuardado?: number | null;
}

const formatMoneda = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });

const AsignarProveedoresDialog: React.FC<{
  req: RequerimientoStockDTO | null;
  proveedores: ProveedorDTO[];
  onClose: () => void;
  onAsignar: (
    asignaciones: Array<{ detalleRequerimientoId: number; proveedorId: number; cantidad: number; precioUnitario: number | null }>,
  ) => Promise<void>;
}> = ({ req, proveedores, onClose, onAsignar }) => {
  // mapa detalleId → filas de asignación
  const [filas, setFilas] = useState<Record<number, FilaAsignacion[]>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  // cache proveedorId → (productoId → precio guardado), para precargar precios de referencia
  const [catalogos, setCatalogos] = useState<Record<number, Record<number, number>>>({});

  // Trae (y cachea) el catálogo de precios de un proveedor; devuelve el precio del producto o null.
  const obtenerPrecioGuardado = useCallback(
    async (proveedorId: number, productoId: number): Promise<number | null> => {
      let mapa = catalogos[proveedorId];
      if (!mapa) {
        try {
          const items = await proveedorProductoApi.getActivosByProveedor(proveedorId);
          mapa = {};
          items.forEach((pp) => {
            if (pp.precioProveedor != null) mapa![pp.productoId] = pp.precioProveedor;
          });
          setCatalogos((prev) => ({ ...prev, [proveedorId]: mapa! }));
        } catch {
          mapa = {};
        }
      }
      return mapa[productoId] ?? null;
    },
    [catalogos],
  );

  useEffect(() => {
    if (req) {
      const inicial: Record<number, FilaAsignacion[]> = {};
      req.detalles.forEach((d) => {
        const pendiente = d.cantidadRequerida - (d.cantidadComprada ?? 0);
        if (pendiente > 0) {
          inicial[d.id] = [
            { proveedor: null, cantidad: pendiente, precioUnitario: '' },
          ];
        }
      });
      setFilas(inicial);
      setErrorLocal(null);
    }
  }, [req]);

  if (!req) return null;

  const pendienteDe = (detalleId: number) => {
    const d = req.detalles.find((x) => x.id === detalleId)!;
    return d.cantidadRequerida - (d.cantidadComprada ?? 0);
  };

  const setFila = (detalleId: number, i: number, patch: Partial<FilaAsignacion>) =>
    setFilas((prev) => ({
      ...prev,
      [detalleId]: prev[detalleId].map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    }));

  const addFila = (detalleId: number) =>
    setFilas((prev) => ({
      ...prev,
      [detalleId]: [...prev[detalleId], { proveedor: null, cantidad: 1, precioUnitario: '' }],
    }));

  const removeFila = (detalleId: number, i: number) =>
    setFilas((prev) => ({
      ...prev,
      [detalleId]: prev[detalleId].filter((_, idx) => idx !== i),
    }));

  // Al elegir proveedor, precarga el precio guardado como referencia (si existe).
  const handleProveedorChange = async (
    detalleId: number,
    i: number,
    productoId: number,
    proveedor: ProveedorDTO | null,
  ) => {
    setFila(detalleId, i, { proveedor, precioGuardado: undefined });
    if (!proveedor) {
      setFila(detalleId, i, { precioUnitario: '', precioGuardado: undefined });
      return;
    }
    const precio = await obtenerPrecioGuardado(proveedor.id, productoId);
    setFila(detalleId, i, {
      precioGuardado: precio,
      precioUnitario: precio ?? '',
    });
  };

  // % de variación entre el precio editado y el guardado de referencia.
  const variacionPct = (f: FilaAsignacion): number | null => {
    if (f.precioGuardado == null || f.precioGuardado === 0 || f.precioUnitario === '') return null;
    return ((Number(f.precioUnitario) - f.precioGuardado) / f.precioGuardado) * 100;
  };

  const handleAsignar = async () => {
    const asignaciones: Array<{
      detalleRequerimientoId: number;
      proveedorId: number;
      cantidad: number;
      precioUnitario: number | null;
    }> = [];

    for (const d of req.detalles) {
      const rows = filas[d.id] ?? [];
      const sum = rows.reduce((s, f) => s + (f.cantidad || 0), 0);
      if (sum > pendienteDe(d.id)) {
        setErrorLocal(
          `Para "${d.productoNombre ?? d.productoId}" asignaste ${sum} y solo hay ${pendienteDe(d.id)} pendiente.`,
        );
        return;
      }
      for (const f of rows) {
        if (f.proveedor && f.cantidad > 0) {
          asignaciones.push({
            detalleRequerimientoId: d.id,
            proveedorId: f.proveedor.id,
            cantidad: f.cantidad,
            precioUnitario: f.precioUnitario === '' ? null : Number(f.precioUnitario),
          });
        }
      }
    }

    if (asignaciones.length === 0) {
      setErrorLocal('Asigná al menos un proveedor a algún producto.');
      return;
    }

    setGuardando(true);
    setErrorLocal(null);
    try {
      await onAsignar(asignaciones);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={!!req} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Asignar proveedores — Pedido #{req.id}</DialogTitle>
      <DialogContent dividers>
        {errorLocal && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setErrorLocal(null)}>
            {errorLocal}
          </Alert>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Podés dividir la cantidad de un producto entre varios proveedores. Se genera una orden de
          compra por proveedor.
        </Typography>
        <Stack spacing={2.5}>
          {req.detalles.map((d) => {
            const pendiente = pendienteDe(d.id);
            if (pendiente <= 0) return null;
            const rows = filas[d.id] ?? [];
            const asignado = rows.reduce((s, f) => s + (f.cantidad || 0), 0);
            return (
              <Paper key={d.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">
                    {d.productoNombre ?? `#${d.productoId}`}{' '}
                    {d.productoCodigo ? `(${d.productoCodigo})` : ''}
                  </Typography>
                  <Chip
                    size="small"
                    label={`Asignado ${asignado} / Pendiente ${pendiente}`}
                    color={asignado > pendiente ? 'error' : asignado === pendiente ? 'success' : 'default'}
                  />
                </Stack>
                <Stack spacing={1.5}>
                  {rows.map((f, i) => {
                    const pct = variacionPct(f);
                    return (
                      <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                        <Autocomplete
                          sx={{ flex: 1 }}
                          size="small"
                          options={proveedores}
                          value={f.proveedor}
                          getOptionLabel={proveedorLabel}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          onChange={(_, value) => handleProveedorChange(d.id, i, d.productoId, value)}
                          renderInput={(params) => <TextField {...params} label="Proveedor" />}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Cantidad"
                          value={f.cantidad}
                          onChange={(e) =>
                            setFila(d.id, i, { cantidad: Math.max(0, Number(e.target.value) || 0) })
                          }
                          sx={{ width: 110 }}
                          inputProps={{ min: 1 }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Precio unit."
                          value={f.precioUnitario}
                          onChange={(e) =>
                            setFila(d.id, i, {
                              precioUnitario: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          sx={{ width: 150 }}
                          inputProps={{ min: 0, step: '0.01' }}
                          helperText={
                            f.proveedor == null
                              ? ' '
                              : f.precioGuardado == null
                                ? 'Sin precio guardado'
                                : pct == null || Math.abs(pct) < 0.01
                                  ? `Guardado ${formatMoneda(f.precioGuardado)}`
                                  : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}% vs ${formatMoneda(f.precioGuardado)}`
                          }
                          FormHelperTextProps={{
                            sx:
                              pct != null && Math.abs(pct) >= 0.01
                                ? { color: pct > 0 ? 'error.main' : 'success.main' }
                                : undefined,
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          disabled={rows.length === 1}
                          onClick={() => removeFila(d.id, i)}
                          sx={{ mt: 0.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    );
                  })}
                </Stack>
                <Button startIcon={<AddIcon />} size="small" sx={{ mt: 0.5 }} onClick={() => addFila(d.id)}>
                  Dividir entre otro proveedor
                </Button>
              </Paper>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={guardando} onClick={handleAsignar}>
          {guardando ? <CircularProgress size={20} /> : 'Generar órdenes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Diálogo: recibir (taller) ───────────────────────────────────────────────
const RecibirDialog: React.FC<{
  reqId: number | null;
  onClose: () => void;
  onRecibido: () => void;
  onError: (msg: string) => void;
}> = ({ reqId, onClose, onRecibido, onError }) => {
  const [detalle, setDetalle] = useState<RequerimientoStockDTO | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // detalleCompraId → cantidad a recibir ahora
  const [recibir, setRecibir] = useState<Record<number, number>>({});

  useEffect(() => {
    if (reqId == null) {
      setDetalle(null);
      return;
    }
    setCargando(true);
    requerimientoStockApi
      .findById(reqId)
      .then((d) => {
        setDetalle(d);
        const init: Record<number, number> = {};
        d.detalles.forEach((det) =>
          (det.ordenesGeneradas ?? []).forEach((l) => {
            init[l.detalleCompraId] = Math.max(0, l.cantidadPedida - l.cantidadRecibida);
          }),
        );
        setRecibir(init);
      })
      .catch((err) => onError(apiError(err, 'No se pudo cargar el detalle del pedido')))
      .finally(() => setCargando(false));
  }, [reqId, onError]);

  const handleRecibir = async () => {
    if (reqId == null) return;
    const items = Object.entries(recibir)
      .map(([detalleCompraId, cantidad]) => ({ detalleCompraId: Number(detalleCompraId), cantidadRecibida: cantidad }))
      .filter((i) => i.cantidadRecibida > 0);
    if (items.length === 0) {
      onError('Indicá al menos una cantidad recibida.');
      return;
    }
    setGuardando(true);
    try {
      await requerimientoStockApi.recibir(reqId, { items });
      onRecibido();
    } catch (err) {
      onError(apiError(err, 'No se pudo registrar la recepción'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={reqId != null} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Registrar recepción {reqId != null ? `— Pedido #${reqId}` : ''}</DialogTitle>
      <DialogContent dividers>
        {cargando ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !detalle ? null : (
          <Stack spacing={2}>
            {detalle.detalles.map((d) => {
              const ordenes = d.ordenesGeneradas ?? [];
              if (ordenes.length === 0) return null;
              return (
                <Paper key={d.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {d.productoNombre ?? `#${d.productoId}`}
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Orden</TableCell>
                        <TableCell>Proveedor</TableCell>
                        <TableCell align="center">Pedido</TableCell>
                        <TableCell align="center">Recibido</TableCell>
                        <TableCell align="center">Recibir ahora</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordenes.map((l) => {
                        const restante = Math.max(0, l.cantidadPedida - l.cantidadRecibida);
                        return (
                          <TableRow key={l.detalleCompraId}>
                            <TableCell>{l.numeroCompra ?? `#${l.compraId}`}</TableCell>
                            <TableCell>{l.proveedorNombre ?? '—'}</TableCell>
                            <TableCell align="center">{l.cantidadPedida}</TableCell>
                            <TableCell align="center">{l.cantidadRecibida}</TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={recibir[l.detalleCompraId] ?? 0}
                                disabled={restante <= 0}
                                onChange={(e) =>
                                  setRecibir((prev) => ({
                                    ...prev,
                                    [l.detalleCompraId]: Math.max(
                                      0,
                                      Math.min(restante, Number(e.target.value) || 0),
                                    ),
                                  }))
                                }
                                sx={{ width: 90 }}
                                inputProps={{ min: 0, max: restante }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="success" disabled={guardando || cargando} onClick={handleRecibir}>
          {guardando ? <CircularProgress size={20} /> : 'Confirmar recepción'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Página ──────────────────────────────────────────────────────────────────
export const RequerimientosStockPage: React.FC = () => {
  const { esAdminCompras } = usePermisos();
  const [requerimientos, setRequerimientos] = useState<RequerimientoStockDTO[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoRequerimientoStock | ''>('');

  const [cargarOpen, setCargarOpen] = useState(false);
  const [asignarReq, setAsignarReq] = useState<RequerimientoStockDTO | null>(null);
  const [recibirReqId, setRecibirReqId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requerimientoStockApi.findAll(filtroEstado || undefined);
      setRequerimientos(data);
    } catch (err) {
      setError(apiError(err, 'Error al cargar los pedidos de materiales'));
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    load();
  }, [load]);

  // Catálogos para los pickers (productos siempre; proveedores solo admin de compras).
  useEffect(() => {
    productApi
      .getAll({ size: 10000 })
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.content ?? []);
        setProductos(data as Producto[]);
      })
      .catch(() => undefined);
    if (esAdminCompras) {
      supplierApi
        .getAll()
        .then((res) => setProveedores(Array.isArray(res) ? res : []))
        .catch(() => undefined);
    }
  }, [esAdminCompras]);

  const handleCambiarEstado = async (id: number, estado: EstadoRequerimientoStock) => {
    try {
      await requerimientoStockApi.cambiarEstado(id, estado);
      await load();
    } catch (err) {
      setError(apiError(err, 'No se pudo cambiar el estado del pedido'));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm(`¿Eliminar el pedido #${id}?`)) return;
    try {
      await requerimientoStockApi.eliminar(id);
      setRequerimientos((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(apiError(err, 'No se pudo eliminar el pedido'));
    }
  };

  const handleCrearPedido = async (lineas: LineaPedido[], observaciones: string) => {
    try {
      await requerimientoStockApi.crear({
        origen: 'MANUAL',
        observaciones: observaciones || null,
        detalles: lineas.map((l) => ({
          productoId: l.producto!.id,
          cantidadRequerida: l.cantidad,
        })),
      });
      setCargarOpen(false);
      setSuccess('Pedido cargado correctamente.');
      await load();
    } catch (err) {
      setError(apiError(err, 'No se pudo cargar el pedido'));
    }
  };

  const handleAsignar = async (
    asignaciones: Array<{ detalleRequerimientoId: number; proveedorId: number; cantidad: number; precioUnitario: number | null }>,
  ) => {
    if (!asignarReq) return;
    try {
      const res = await requerimientoStockApi.asignarProveedores(asignarReq.id, { asignaciones });
      setAsignarReq(null);
      setSuccess(res.mensaje);
      await load();
    } catch (err) {
      setError(apiError(err, 'No se pudieron generar las órdenes de compra'));
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
            Pedidos de materiales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cargá los materiales que necesitás. Compras asigna los proveedores y genera las órdenes;
            luego registrás lo que recibís.
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
                {estadoLabel[e]}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCargarOpen(true)}>
            Cargar pedido
          </Button>
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
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
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
              <TableCell>Solicitante</TableCell>
              <TableCell align="center">Productos</TableCell>
              <TableCell align="center">Recibido</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : requerimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay pedidos de materiales cargados.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requerimientos.map((req) => (
                <RequerimientoRow
                  key={req.id}
                  req={req}
                  esAdminCompras={esAdminCompras}
                  onCambiarEstado={handleCambiarEstado}
                  onEliminar={handleEliminar}
                  onAsignar={setAsignarReq}
                  onRecibir={(r) => setRecibirReqId(r.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CargarPedidoDialog
        open={cargarOpen}
        productos={productos}
        onClose={() => setCargarOpen(false)}
        onGuardar={handleCrearPedido}
      />

      <AsignarProveedoresDialog
        req={asignarReq}
        proveedores={proveedores}
        onClose={() => setAsignarReq(null)}
        onAsignar={handleAsignar}
      />

      <RecibirDialog
        reqId={recibirReqId}
        onClose={() => setRecibirReqId(null)}
        onRecibido={() => {
          setRecibirReqId(null);
          setSuccess('Recepción registrada correctamente.');
          load();
        }}
        onError={setError}
      />
    </Box>
  );
};

export default RequerimientosStockPage;
