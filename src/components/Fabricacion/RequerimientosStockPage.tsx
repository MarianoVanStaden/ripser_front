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
  DialogContentText,
  DialogActions,
  Autocomplete,
  InputAdornment,
  FormControlLabel,
  Switch,
  Badge,
  Card,
  CardActionArea,
  LinearProgress,
  Skeleton,
  Menu,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  LocalShipping as LocalShippingIcon,
  Storefront as StorefrontIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Inventory2 as Inventory2Icon,
  WarningAmber as WarningAmberIcon,
  ReportProblem as ReportProblemIcon,
  Assignment as AssignmentIcon,
  MoveToInbox as MoveToInboxIcon,
  Search as SearchIcon,
  Bolt as BoltIcon,
  ScheduleOutlined as ScheduleIcon,
} from '@mui/icons-material';
import { requerimientoStockApi } from '../../api/services/requerimientoStockApi';
import { productApi } from '../../api/services/productApi';
import { supplierApi } from '../../api/services/supplierApi';
import { proveedorProductoApi } from '../../api/services/proveedorProductoApi';
import { categoriaProductoApi } from '../../api/services/categoriaProductoApi';
import { usePermisos } from '../../hooks/usePermisos';
import type {
  RequerimientoStockDTO,
  EstadoRequerimientoStock,
  Producto,
  ProveedorDTO,
  CategoriaProducto,
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

/** Días transcurridos desde una fecha ISO (0 si no se puede parsear). */
const diasDesde = (iso?: string | null): number => {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 86_400_000) : 0;
};

/** Antigüedad en lenguaje natural ("hoy", "hace 3 días"). */
const antiguedad = (iso?: string | null): string => {
  const d = diasDesde(iso);
  if (d <= 0) return 'hoy';
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
};

/** Un pedido sin gestionar se vuelve urgente a partir de estos días. */
const DIAS_URGENTE = 5;

const proveedorLabel = (p: ProveedorDTO) => p.razonSocial || `Proveedor #${p.id}`;

const formatMoneda = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });

// ── Estado de stock de un producto ──────────────────────────────────────────
type NivelStock = 'SIN_STOCK' | 'BAJO' | 'OK';

const nivelStock = (p: { stockActual?: number | null; stockMinimo?: number | null }): NivelStock => {
  const actual = p.stockActual ?? 0;
  const minimo = p.stockMinimo ?? 0;
  if (actual <= 0) return 'SIN_STOCK';
  if (actual < minimo) return 'BAJO';
  return 'OK';
};

const nivelMeta: Record<NivelStock, { label: string; color: 'error' | 'warning' | 'success' }> = {
  SIN_STOCK: { label: 'Sin stock', color: 'error' },
  BAJO: { label: 'Bajo', color: 'warning' },
  OK: { label: 'OK', color: 'success' },
};

/** Cantidad sugerida para reponer hasta el mínimo (al menos 1). */
const cantidadSugerida = (p: { stockActual?: number | null; stockMinimo?: number | null }) =>
  Math.max(1, (p.stockMinimo ?? 0) - (p.stockActual ?? 0));

const StockChip: React.FC<{ producto: { stockActual?: number | null; stockMinimo?: number | null } }> = ({
  producto,
}) => {
  const nivel = nivelStock(producto);
  const meta = nivelMeta[nivel];
  return (
    <Tooltip title={`Stock actual ${producto.stockActual ?? 0} · mínimo ${producto.stockMinimo ?? 0}`}>
      <Chip
        size="small"
        color={meta.color}
        variant={nivel === 'OK' ? 'outlined' : 'filled'}
        label={`${producto.stockActual ?? 0} / ${producto.stockMinimo ?? 0}`}
      />
    </Tooltip>
  );
};

// ── Tarjeta de métrica ──────────────────────────────────────────────────────
const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'error' | 'warning' | 'info' | 'success' | 'primary';
  hint?: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ icon, label, value, color, hint, onClick, active }) => {
  const content = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.75, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: `${color}.main`,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" fontWeight={700} lineHeight={1.1}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.disabled" noWrap display="block">
            {hint}
          </Typography>
        )}
      </Box>
    </Box>
  );
  return (
    <Card
      variant="outlined"
      sx={{
        flex: '1 1 200px',
        minWidth: 200,
        borderColor: active ? `${color}.main` : undefined,
        borderWidth: active ? 2 : 1,
      }}
    >
      {onClick ? <CardActionArea onClick={onClick}>{content}</CardActionArea> : content}
    </Card>
  );
};

// ── Barra de avance de recepción ────────────────────────────────────────────
const FulfillmentBar: React.FC<{ recibido: number; total: number }> = ({ recibido, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((recibido / total) * 100)) : 0;
  const color = pct >= 100 ? 'success' : pct > 0 ? 'info' : 'inherit';
  return (
    <Box sx={{ minWidth: 110 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary">
          {recibido}/{total}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color === 'inherit' ? undefined : color}
        sx={{ height: 6, borderRadius: 3, ...(color === 'inherit' && { opacity: 0.35 }) }}
      />
    </Box>
  );
};

// ── Chip de antigüedad / urgencia ───────────────────────────────────────────
const AgeChip: React.FC<{ req: RequerimientoStockDTO }> = ({ req }) => {
  const dias = diasDesde(req.fechaCreacion);
  const sinGestionar = req.estado === 'PENDIENTE' || req.estado === 'PARCIAL';
  const urgente = sinGestionar && dias >= DIAS_URGENTE;
  return (
    <Chip
      size="small"
      variant={urgente ? 'filled' : 'outlined'}
      color={urgente ? 'warning' : 'default'}
      icon={urgente ? <ScheduleIcon /> : undefined}
      label={antiguedad(req.fechaCreacion)}
      sx={{ height: 22 }}
    />
  );
};

// ── Control de estado (chip clicable con menú para admin) ────────────────────
const EstadoControl: React.FC<{
  req: RequerimientoStockDTO;
  esAdminCompras: boolean;
  onCambiarEstado: (id: number, estado: EstadoRequerimientoStock) => void;
}> = ({ req, esAdminCompras, onCambiarEstado }) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const chip = (
    <Chip
      label={estadoLabel[req.estado]}
      size="small"
      color={estadoColor[req.estado]}
      onClick={esAdminCompras ? (e) => setAnchor(e.currentTarget) : undefined}
      onDelete={esAdminCompras ? (e) => setAnchor(e.currentTarget as HTMLElement) : undefined}
      deleteIcon={esAdminCompras ? <ArrowDownIcon /> : undefined}
    />
  );
  if (!esAdminCompras) return chip;
  return (
    <>
      {chip}
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {ESTADOS.map((e) => (
          <MenuItem
            key={e}
            selected={e === req.estado}
            onClick={() => {
              setAnchor(null);
              if (e !== req.estado) onCambiarEstado(req.id, e);
            }}
          >
            <Chip label={estadoLabel[e]} size="small" color={estadoColor[e]} sx={{ height: 20 }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// ── Detalle expandible (compartido entre fila y tarjeta) ─────────────────────
const DetalleRequerimiento: React.FC<{ req: RequerimientoStockDTO }> = ({ req }) => (
  <Box sx={{ m: { xs: 0, md: 2 } }}>
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
);

// ── Acciones de un pedido (compartidas entre fila y tarjeta) ─────────────────
const AccionesRequerimiento: React.FC<{
  req: RequerimientoStockDTO;
  esAdminCompras: boolean;
  onEliminar: (id: number) => void;
  onAsignar: (req: RequerimientoStockDTO) => void;
  onRecibir: (req: RequerimientoStockDTO) => void;
}> = ({ req, esAdminCompras, onEliminar, onAsignar, onRecibir }) => {
  const puedeGestionar = req.estado === 'PENDIENTE' || req.estado === 'PARCIAL';
  const puedeRecibir =
    req.estado !== 'CANCELADO' &&
    req.detalles.some((d) => (d.cantidadComprada ?? 0) > (d.cantidadRecibida ?? 0));
  return (
    <>
      {esAdminCompras && puedeGestionar && (
        <Tooltip title="Asignar proveedores y generar órdenes">
          <IconButton size="small" color="primary" aria-label="Asignar proveedores" onClick={() => onAsignar(req)}>
            <StorefrontIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {puedeRecibir && (
        <Tooltip title="Registrar recepción">
          <IconButton size="small" color="success" aria-label="Registrar recepción" onClick={() => onRecibir(req)}>
            <Inventory2Icon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Eliminar pedido">
        <IconButton size="small" color="error" aria-label="Eliminar pedido" onClick={() => onEliminar(req.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};

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

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox">
          <IconButton size="small" aria-label={open ? 'Contraer' : 'Ver detalle'} onClick={() => setOpen((o) => !o)}>
            {open ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>#{req.id}</TableCell>
        <TableCell>
          <Stack spacing={0.5} alignItems="flex-start">
            <Typography variant="body2">{formatFecha(req.fechaCreacion)}</Typography>
            <AgeChip req={req} />
          </Stack>
        </TableCell>
        <TableCell>
          <Chip
            label={req.origen === 'FABRICACION' ? 'Fabricación' : 'Manual'}
            size="small"
            variant="outlined"
          />
        </TableCell>
        <TableCell>{req.usuarioCreadorNombre ?? '—'}</TableCell>
        <TableCell align="center">{req.detalles.length}</TableCell>
        <TableCell>
          <FulfillmentBar recibido={totalRecibido} total={totalUnidades} />
        </TableCell>
        <TableCell>
          <EstadoControl req={req} esAdminCompras={esAdminCompras} onCambiarEstado={onCambiarEstado} />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          <AccionesRequerimiento
            req={req}
            esAdminCompras={esAdminCompras}
            onEliminar={onEliminar}
            onAsignar={onAsignar}
            onRecibir={onRecibir}
          />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <DetalleRequerimiento req={req} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ── Tarjeta de requerimiento (vista mobile) ─────────────────────────────────
const RequerimientoCard: React.FC<{
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
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2">#{req.id}</Typography>
          <Chip
            label={req.origen === 'FABRICACION' ? 'Fabricación' : 'Manual'}
            size="small"
            variant="outlined"
          />
        </Stack>
        <EstadoControl req={req} esAdminCompras={esAdminCompras} onCambiarEstado={onCambiarEstado} />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <AgeChip req={req} />
        <Typography variant="caption" color="text.secondary">
          {req.usuarioCreadorNombre ?? '—'} · {req.detalles.length} prod.
        </Typography>
      </Stack>
      <FulfillmentBar recibido={totalRecibido} total={totalUnidades} />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
        <Button size="small" onClick={() => setOpen((o) => !o)} endIcon={open ? <ArrowUpIcon /> : <ArrowDownIcon />}>
          {open ? 'Ocultar' : 'Detalle'}
        </Button>
        <Box>
          <AccionesRequerimiento
            req={req}
            esAdminCompras={esAdminCompras}
            onEliminar={onEliminar}
            onAsignar={onAsignar}
            onRecibir={onRecibir}
          />
        </Box>
      </Stack>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 1, overflowX: 'auto' }}>
          <DetalleRequerimiento req={req} />
        </Box>
      </Collapse>
    </Paper>
  );
};

// ── Diálogo: cargar pedido (catálogo + carrito) ─────────────────────────────
interface LineaPedido {
  producto: Producto;
  cantidad: number;
}

const MAX_CATALOGO = 120;

const CargarPedidoDialog: React.FC<{
  open: boolean;
  productos: Producto[];
  categorias: CategoriaProducto[];
  /** Si se abre desde la métrica de bajo stock, arranca filtrado a bajo stock. */
  soloBajoStockInicial?: boolean;
  /** Roles operativos (Taller/Transporte/Logístico) no ven costos. */
  puedeVerCostos: boolean;
  onClose: () => void;
  onGuardar: (lineas: LineaPedido[], observaciones: string) => Promise<void>;
}> = ({ open, productos, categorias, soloBajoStockInicial, puedeVerCostos, onClose, onGuardar }) => {
  // carrito: productoId → línea
  const [carrito, setCarrito] = useState<Record<number, LineaPedido>>({});
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // filtros del catálogo
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  useEffect(() => {
    if (open) {
      setCarrito({});
      setObservaciones('');
      setBusqueda('');
      setCategoriaId('');
      setSoloBajoStock(!!soloBajoStockInicial);
    }
  }, [open, soloBajoStockInicial]);

  const setCantidad = (producto: Producto, cantidad: number) =>
    setCarrito((prev) => {
      const next = { ...prev };
      if (cantidad <= 0) {
        delete next[producto.id];
      } else {
        next[producto.id] = { producto, cantidad };
      }
      return next;
    });

  // Catálogo filtrado en memoria (búsqueda por nombre/código + categoría + bajo stock).
  const catalogo = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos
      .filter((p) => p.activo !== false)
      .filter((p) => (categoriaId === '' ? true : p.categoriaProductoId === categoriaId))
      .filter((p) => (soloBajoStock ? nivelStock(p) !== 'OK' : true))
      .filter(
        (p) =>
          !q ||
          p.nombre.toLowerCase().includes(q) ||
          (p.codigo ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => {
        // Prioriza los más críticos: sin stock, luego bajo, luego el resto.
        const orden = { SIN_STOCK: 0, BAJO: 1, OK: 2 } as const;
        const d = orden[nivelStock(a)] - orden[nivelStock(b)];
        return d !== 0 ? d : a.nombre.localeCompare(b.nombre);
      });
  }, [productos, busqueda, categoriaId, soloBajoStock]);

  const visibles = catalogo.slice(0, MAX_CATALOGO);
  const lineas = Object.values(carrito);
  const totalUnidades = lineas.reduce((s, l) => s + l.cantidad, 0);
  // Costo estimado con el último costo conocido del producto (referencia, no precio de compra).
  const costoEstimado = lineas.reduce((s, l) => s + (l.producto.costo ?? 0) * l.cantidad, 0);
  const algunoSinCosto = lineas.some((l) => l.producto.costo == null);
  const puedeGuardar = lineas.length > 0;

  // Cantidad de productos bajo mínimo en el catálogo actual (para el botón de carga rápida).
  const bajosEnCatalogo = useMemo(
    () => catalogo.filter((p) => nivelStock(p) !== 'OK'),
    [catalogo],
  );

  const agregarTodosLosBajos = () =>
    setCarrito((prev) => {
      const next = { ...prev };
      bajosEnCatalogo.forEach((p) => {
        if (!next[p.id]) next[p.id] = { producto: p, cantidad: cantidadSugerida(p) };
      });
      return next;
    });

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onGuardar(lineas, observaciones);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Cargar pedido de materiales</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 420 }}>
          {/* ── Catálogo ─────────────────────────────────────────── */}
          <Box sx={{ flex: 1.5, p: 2, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por nombre o código…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                label="Categoría"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Todas</MenuItem>
                {categorias.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={soloBajoStock}
                    onChange={(e) => setSoloBajoStock(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Solo bajo stock
                    {bajosEnCatalogo.length > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        label={bajosEnCatalogo.length}
                        sx={{ ml: 0.75, height: 18 }}
                      />
                    )}
                  </Typography>
                }
              />
              {bajosEnCatalogo.length > 0 && (
                <Button size="small" startIcon={<BoltIcon />} onClick={agregarTodosLosBajos}>
                  Reponer bajos
                </Button>
              )}
            </Stack>
            <TableContainer sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="center">Stock / Mín.</TableCell>
                    <TableCell align="right">Pedir</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay productos que coincidan con los filtros.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibles.map((p) => {
                      const enCarrito = carrito[p.id];
                      return (
                        <TableRow key={p.id} hover selected={!!enCarrito}>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {p.nombre}
                            </Typography>
                            {p.codigo && (
                              <Typography variant="caption" color="text.secondary">
                                {p.codigo}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {p.categoriaProductoNombre ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <StockChip producto={p} />
                          </TableCell>
                          <TableCell align="right">
                            {enCarrito ? (
                              <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => setCantidad(p, enCarrito.cantidad - 1)}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={enCarrito.cantidad}
                                  onChange={(e) => setCantidad(p, Math.max(0, Number(e.target.value) || 0))}
                                  sx={{ width: 64 }}
                                  inputProps={{ min: 0, style: { textAlign: 'center', padding: 6 } }}
                                />
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setCantidad(p, enCarrito.cantidad + 1)}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setCantidad(p, cantidadSugerida(p))}
                              >
                                Agregar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {catalogo.length > MAX_CATALOGO && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Mostrando {MAX_CATALOGO} de {catalogo.length}. Refiná la búsqueda para ver más.
              </Typography>
            )}
          </Box>

          {/* ── Carrito ──────────────────────────────────────────── */}
          <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Badge badgeContent={lineas.length} color="primary">
                <Inventory2Icon color="action" />
              </Badge>
              <Typography variant="subtitle1" fontWeight={600}>
                Pedido
              </Typography>
              {totalUnidades > 0 && (
                <Chip size="small" label={`${totalUnidades} u.`} variant="outlined" />
              )}
            </Stack>
            <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
              {lineas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, color: 'text.disabled' }}>
                  <Inventory2Icon sx={{ fontSize: 40, opacity: 0.4 }} />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Agregá productos desde el catálogo.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {lineas.map((l) => (
                    <Paper key={l.producto.id} variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {l.producto.nombre}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StockChip producto={l.producto} />
                          <Typography variant="caption" color="text.secondary">
                            {l.cantidad} u.
                            {puedeVerCostos &&
                              (l.producto.costo != null
                                ? ` · ${formatMoneda(l.producto.costo * l.cantidad)}`
                                : ' · s/costo')}
                          </Typography>
                        </Stack>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Quitar ${l.producto.nombre}`}
                        onClick={() => setCantidad(l.producto, 0)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
            {puedeVerCostos && lineas.length > 0 && (
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="baseline"
                sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="body2" color="text.secondary">
                  Costo estimado
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatMoneda(costoEstimado)}
                  {algunoSinCosto && (
                    <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                      +s/costo
                    </Typography>
                  )}
                </Typography>
              </Stack>
            )}
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="Observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              sx={{ mt: 2 }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto', ml: 1 }}>
          {lineas.length} producto{lineas.length === 1 ? '' : 's'} · {totalUnidades} unidades
        </Typography>
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
  const { esAdminCompras, puedeVerCostos } = usePermisos();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [requerimientos, setRequerimientos] = useState<RequerimientoStockDTO[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoRequerimientoStock | ''>('');
  // Filtro rápido en memoria disparado desde las métricas (independiente del estado server-side).
  const [vistaRapida, setVistaRapida] = useState<'ACTIVOS' | 'POR_RECIBIR' | null>(null);

  const [cargarOpen, setCargarOpen] = useState(false);
  const [cargarBajoStock, setCargarBajoStock] = useState(false);
  const [asignarReq, setAsignarReq] = useState<RequerimientoStockDTO | null>(null);
  const [recibirReqId, setRecibirReqId] = useState<number | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirCargar = (soloBajoStock = false) => {
    setCargarBajoStock(soloBajoStock);
    setCargarOpen(true);
  };

  const toggleVista = (v: 'ACTIVOS' | 'POR_RECIBIR') =>
    setVistaRapida((prev) => (prev === v ? null : v));

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

  // Catálogos para los pickers (productos y categorías siempre; proveedores solo admin de compras).
  useEffect(() => {
    productApi
      .getAll({ size: 10000 })
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.content ?? []);
        setProductos(data as Producto[]);
      })
      .catch(() => undefined);
    categoriaProductoApi
      .getAll()
      .then((res) => setCategorias(Array.isArray(res) ? res.filter((c) => c.activo !== false) : []))
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

  const handleEliminar = async () => {
    if (confirmarEliminar == null) return;
    setEliminando(true);
    try {
      await requerimientoStockApi.eliminar(confirmarEliminar);
      setRequerimientos((prev) => prev.filter((r) => r.id !== confirmarEliminar));
      setConfirmarEliminar(null);
    } catch (err) {
      setError(apiError(err, 'No se pudo eliminar el pedido'));
    } finally {
      setEliminando(false);
    }
  };

  const handleCrearPedido = async (lineas: LineaPedido[], observaciones: string) => {
    try {
      await requerimientoStockApi.crear({
        origen: 'MANUAL',
        observaciones: observaciones || null,
        detalles: lineas.map((l) => ({
          productoId: l.producto.id,
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

  const metrics = useMemo(() => {
    const activos = productos.filter((p) => p.activo !== false);
    const sinStock = activos.filter((p) => nivelStock(p) === 'SIN_STOCK').length;
    const bajoStock = activos.filter((p) => nivelStock(p) === 'BAJO').length;

    const pedidosActivos = requerimientos.filter(
      (r) => r.estado === 'PENDIENTE' || r.estado === 'PARCIAL',
    ).length;
    // Unidades compradas que aún no se recibieron (en tránsito hacia el taller).
    const porRecibir = requerimientos.reduce(
      (s, r) =>
        s +
        r.detalles.reduce(
          (acc, d) => acc + Math.max(0, (d.cantidadComprada ?? 0) - (d.cantidadRecibida ?? 0)),
          0,
        ),
      0,
    );
    return { sinStock, bajoStock, pedidosActivos, porRecibir };
  }, [productos, requerimientos]);

  // Lista mostrada: aplica el filtro rápido de las métricas sobre lo que trajo el server.
  const requerimientosVisibles = useMemo(() => {
    if (vistaRapida === 'ACTIVOS') {
      return requerimientos.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'PARCIAL');
    }
    if (vistaRapida === 'POR_RECIBIR') {
      return requerimientos.filter((r) =>
        r.detalles.some((d) => (d.cantidadComprada ?? 0) > (d.cantidadRecibida ?? 0)),
      );
    }
    return requerimientos;
  }, [requerimientos, vistaRapida]);

  const vistaRapidaLabel = vistaRapida === 'ACTIVOS' ? 'Pedidos activos' : 'Por recibir';

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'flex-start' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Pedidos de materiales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cargá los materiales que necesitás. Compras asigna los proveedores y genera las órdenes;
            luego registrás lo que recibís.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirCargar(false)}>
            Cargar pedido
          </Button>
          <Tooltip title="Refrescar">
            <span>
              <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
                Refrescar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Métricas: foto rápida del estado de stock y los pedidos en curso. */}
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <MetricCard
          icon={<ReportProblemIcon />}
          label="Sin stock"
          value={metrics.sinStock}
          color="error"
          hint="Productos en quiebre · reponer"
          active={cargarOpen && cargarBajoStock}
          onClick={() => abrirCargar(true)}
        />
        <MetricCard
          icon={<WarningAmberIcon />}
          label="Stock bajo"
          value={metrics.bajoStock}
          color="warning"
          hint="Bajo el mínimo · reponer"
          onClick={() => abrirCargar(true)}
        />
        <MetricCard
          icon={<AssignmentIcon />}
          label="Pedidos activos"
          value={metrics.pedidosActivos}
          color="info"
          hint="Pendientes o parciales · filtrar"
          active={vistaRapida === 'ACTIVOS'}
          onClick={() => toggleVista('ACTIVOS')}
        />
        <MetricCard
          icon={<MoveToInboxIcon />}
          label="Por recibir"
          value={metrics.porRecibir}
          color="primary"
          hint="En tránsito · filtrar"
          active={vistaRapida === 'POR_RECIBIR'}
          onClick={() => toggleVista('POR_RECIBIR')}
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {!loading && requerimientos.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            label={`${requerimientosVisibles.length} pedido${requerimientosVisibles.length === 1 ? '' : 's'}`}
            variant="outlined"
          />
          {vistaRapida && (
            <Chip
              color="info"
              label={`Filtro: ${vistaRapidaLabel}`}
              onDelete={() => setVistaRapida(null)}
            />
          )}
          {!vistaRapida && (metrics.sinStock > 0 || metrics.bajoStock > 0) && (
            <Typography variant="body2" color="text.secondary">
              {metrics.sinStock + metrics.bajoStock} producto
              {metrics.sinStock + metrics.bajoStock === 1 ? '' : 's'} requieren reposición.
            </Typography>
          )}
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

      {/* Estado vacío: distingue "no hay nada" de "el filtro no devolvió resultados". */}
      {!loading && requerimientosVisibles.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <Inventory2Icon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          {requerimientos.length === 0 ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Todavía no hay pedidos de materiales
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Cargá el primer pedido con los materiales que necesita la fábrica.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirCargar(false)}>
                Cargar pedido
              </Button>
            </>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                No hay pedidos para este filtro
              </Typography>
              <Button
                onClick={() => {
                  setVistaRapida(null);
                  setFiltroEstado('');
                }}
              >
                Limpiar filtros
              </Button>
            </>
          )}
        </Paper>
      ) : isMobile ? (
        // ── Vista mobile: tarjetas apiladas ──────────────────────
        <Stack spacing={1.5}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={140} />
              ))
            : requerimientosVisibles.map((req) => (
                <RequerimientoCard
                  key={req.id}
                  req={req}
                  esAdminCompras={esAdminCompras}
                  onCambiarEstado={handleCambiarEstado}
                  onEliminar={setConfirmarEliminar}
                  onAsignar={setAsignarReq}
                  onRecibir={(r) => setRecibirReqId(r.id)}
                />
              ))}
        </Stack>
      ) : (
        // ── Vista desktop: tabla ─────────────────────────────────
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
                <TableCell>Recepción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton variant="rounded" height={36} />
                      </TableCell>
                    </TableRow>
                  ))
                : requerimientosVisibles.map((req) => (
                    <RequerimientoRow
                      key={req.id}
                      req={req}
                      esAdminCompras={esAdminCompras}
                      onCambiarEstado={handleCambiarEstado}
                      onEliminar={setConfirmarEliminar}
                      onAsignar={setAsignarReq}
                      onRecibir={(r) => setRecibirReqId(r.id)}
                    />
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CargarPedidoDialog
        open={cargarOpen}
        productos={productos}
        categorias={categorias}
        soloBajoStockInicial={cargarBajoStock}
        puedeVerCostos={puedeVerCostos}
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

      <Dialog open={confirmarEliminar != null} onClose={() => !eliminando && setConfirmarEliminar(null)}>
        <DialogTitle>Eliminar pedido</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que querés eliminar el pedido #{confirmarEliminar}? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarEliminar(null)} disabled={eliminando}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={handleEliminar} disabled={eliminando}>
            {eliminando ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequerimientosStockPage;
