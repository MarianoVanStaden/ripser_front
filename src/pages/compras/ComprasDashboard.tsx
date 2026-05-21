import React, { useEffect, useState } from 'react';
import {
  Box, Grid2 as Grid, Card, CardContent, Typography, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Stack, Divider, Alert,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as Inventory2Icon,
  LocalShipping as LocalShippingIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { compraApi } from '../../api/services/compraApi';
import { proveedorApi } from '../../api/services/proveedorApi';
import { productApi } from '../../api/services/productApi';
import { stockObjetivoApi } from '../../api/services/stockObjetivoApi';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';

interface CompraLite {
  id: number;
  proveedorId?: number;
  fechaCompra?: string;
  fechaCreacion?: string;
  fechaEntrega?: string;
  estado?: string;
  total?: number;
  numero?: string;
  proveedor?: { nombre?: string };
}

interface ProveedorLite {
  id: number;
  nombre: string;
  saldoActual?: number;
  estado?: string;
}

interface ProductoLite {
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  categoriaProductoNombre?: string;
  activo?: boolean;
}

interface EvaluacionLite {
  stockObjetivoId: number;
  modelo: string;
  cantidadObjetivo: number;
  stockDisponible: number;
  cantidadAFabricar: number;
  accionSugerida: 'FABRICAR' | 'TERMINAR_BASE' | 'OK';
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

const compraEstadoChip = (estado?: string) => {
  switch (estado) {
    case 'PENDIENTE':
      return <Chip label="Pendiente" color="warning" size="small" />;
    case 'CONFIRMADA':
      return <Chip label="Confirmada" color="info" size="small" />;
    case 'EN_TRANSITO':
      return <Chip label="En tránsito" color="primary" size="small" />;
    case 'RECIBIDA':
      return <Chip label="Recibida" color="success" size="small" />;
    case 'RECIBIDA_PARCIAL':
      return <Chip label="Recibida parcial" color="success" size="small" variant="outlined" />;
    case 'CANCELADA':
      return <Chip label="Cancelada" color="default" size="small" />;
    default:
      return <Chip label={estado || '-'} size="small" />;
  }
};

const ComprasDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const [compras, setCompras] = useState<CompraLite[]>([]);
  const [pendientesRecepcion, setPendientesRecepcion] = useState<CompraLite[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorLite[]>([]);
  const [stockBajo, setStockBajo] = useState<ProductoLite[]>([]);
  const [stockBajoUnavailable, setStockBajoUnavailable] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionLite[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const errs: string[] = [];

      const comprasReq = compraApi
        .getAll({ page: 0, size: 500 })
        .then((r) => (r.content ?? []) as CompraLite[])
        .catch((e) => {
          console.warn('No se pudieron cargar compras', e);
          errs.push('compras');
          return [] as CompraLite[];
        });

      // El endpoint /pendientes-recepcion devuelve directamente las que faltan
      // recibir — más confiable que filtrar por estado client-side.
      const pendientesReq = compraApi
        .getPendientesRecepcion()
        .then((r) => (r as unknown as CompraLite[]) ?? [])
        .catch((e) => {
          console.warn('No se pudieron cargar pendientes de recepción', e);
          errs.push('pendientes de recepción');
          return [] as CompraLite[];
        });

      const proveedoresReq = proveedorApi
        .getAll({ page: 0, size: 500 })
        .then((r) => (r.content ?? []) as ProveedorLite[])
        .catch((e) => {
          console.warn('No se pudieron cargar proveedores', e);
          errs.push('proveedores');
          return [] as ProveedorLite[];
        });

      const stockReq = productApi
        .getLowStock()
        .then((r) => {
          const arr = Array.isArray(r) ? r : (r as { content?: ProductoLite[] }).content ?? [];
          return arr as ProductoLite[];
        })
        .catch((e) => {
          console.warn('No se pudo cargar stock bajo', e);
          if (!cancelled) setStockBajoUnavailable(true);
          return [] as ProductoLite[];
        });

      const evaluacionesReq = stockObjetivoApi
        .getEvaluacion()
        .then((r) => (r as unknown as EvaluacionLite[]) ?? [])
        .catch((e) => {
          console.warn('No se pudo cargar evaluación de stock objetivo', e);
          return [] as EvaluacionLite[];
        });

      const [cs, pend, provs, stock, evals] = await Promise.all([
        comprasReq, pendientesReq, proveedoresReq, stockReq, evaluacionesReq,
      ]);

      if (cancelled) return;

      setCompras(cs);
      setPendientesRecepcion(pend);
      setProveedores(provs);
      setStockBajo(stock.filter((p) => p.activo !== false).slice(0, 10));
      setEvaluaciones(evals);
      setErrors(errs);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Derivados
  const monthStart = dayjs().startOf('month');
  const monthEnd = dayjs().endOf('month');

  const comprasMes = compras.filter((c) => {
    const f = dayjs(c.fechaCompra || c.fechaCreacion || '');
    return f.isValid() && !f.isBefore(monthStart) && !f.isAfter(monthEnd);
  });
  const montoComprasMes = comprasMes.reduce((s, c) => s + Number(c.total || 0), 0);

  const proveedoresActivos = proveedores.filter(
    (p) => !p.estado || p.estado.toUpperCase() === 'ACTIVO',
  );
  const saldoTotalProveedores = proveedores.reduce(
    (s, p) => s + Number(p.saldoActual || 0),
    0,
  );
  const proveedoresConSaldo = [...proveedores]
    .filter((p) => Number(p.saldoActual || 0) > 0)
    .sort((a, b) => Number(b.saldoActual || 0) - Number(a.saldoActual || 0))
    .slice(0, 5);

  const stockCritico = stockBajo.filter((p) => p.stockActual === 0).length;
  const evaluacionesFabricar = evaluaciones.filter((e) => e.accionSugerida === 'FABRICAR');
  const evaluacionesOk = evaluaciones.filter((e) => e.accionSugerida === 'OK').length;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={600}>
          ¡Hola, {getFirstName(user) || 'compras'}! 🛒
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel de coordinación de compras — {dayjs().format('DD/MM/YYYY')}
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {errors.length > 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se pudieron cargar algunos indicadores: {errors.join(', ')}.
        </Alert>
      )}

      {/* Compras del mes */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Compras del mes
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Órdenes de compra"
          value={comprasMes.length}
          color="#1976d2"
          icon={<ShoppingCartIcon />}
          subtitle="Creadas este mes"
          onClick={() => navigate('/proveedores/compras')}
        />
        <MetricCard
          title="Monto comprado"
          value={montoComprasMes}
          color="#2e7d32"
          icon={<TrendingUpIcon />}
          subtitle="Total mes en curso"
          isMoney
        />
        <MetricCard
          title="Pendientes de recepción"
          value={pendientesRecepcion.length}
          color="#ed6c02"
          icon={<HourglassEmptyIcon />}
          subtitle="Compras sin ingresar a depósito"
          onClick={() => navigate('/proveedores/compras')}
        />
        <MetricCard
          title="Ticket promedio"
          value={comprasMes.length > 0 ? Math.round(montoComprasMes / comprasMes.length) : 0}
          color="#7b1fa2"
          icon={<TrendingUpIcon />}
          subtitle="Promedio por orden del mes"
          isMoney
        />
      </Grid>

      {/* Proveedores y cuenta corriente */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Proveedores
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Proveedores activos"
          value={proveedoresActivos.length}
          color="#0288d1"
          icon={<BusinessIcon />}
          subtitle={`${proveedores.length} totales`}
          onClick={() => navigate('/proveedores/gestion')}
        />
        <MetricCard
          title="Saldo a pagar"
          value={saldoTotalProveedores}
          color="#d32f2f"
          icon={<AccountBalanceIcon />}
          subtitle="Cta. cte. proveedores"
          isMoney
          onClick={() => navigate('/proveedores/cuenta-corriente')}
        />
        <MetricCard
          title="Stock crítico (0)"
          value={stockCritico}
          color="#c62828"
          icon={<WarningIcon />}
          subtitle="Productos sin stock"
        />
        <MetricCard
          title="Modelos a fabricar"
          value={evaluacionesFabricar.length}
          color="#ef6c00"
          icon={<BuildIcon />}
          subtitle="Stock objetivo bajo mínimo"
          onClick={() => navigate('/fabricacion/stock-planificacion')}
        />
        <MetricCard
          title="Stock objetivo OK"
          value={evaluacionesOk}
          color="#2e7d32"
          icon={<CheckCircleIcon />}
          subtitle="Sin acción requerida"
          onClick={() => navigate('/fabricacion/stock-planificacion')}
        />
      </Grid>

      <Grid container spacing={3}>
        {/* Compras pendientes de recepción */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalShippingIcon color="warning" /> Pendientes de recepción ({pendientesRecepcion.length})
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/proveedores/compras')}
                >
                  Ver compras
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nº Orden</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Fecha entrega</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendientesRecepcion.slice(0, 10).map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.numero || `#${c.id}`}</TableCell>
                        <TableCell>{c.proveedor?.nombre || '-'}</TableCell>
                        <TableCell>
                          {c.fechaEntrega ? dayjs(c.fechaEntrega).format('DD/MM/YYYY') : '-'}
                        </TableCell>
                        <TableCell>{compraEstadoChip(c.estado)}</TableCell>
                        <TableCell align="right">{fmtMoney(Number(c.total || 0))}</TableCell>
                      </TableRow>
                    ))}
                    {pendientesRecepcion.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            No hay compras pendientes de recepción.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top proveedores con saldo */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceIcon color="error" /> Top saldos a pagar
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/proveedores/cuenta-corriente')}
                >
                  Ver cta. cte.
                </Button>
              </Stack>
              {proveedoresConSaldo.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle1" color="success.main">
                    Sin saldos pendientes
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {proveedoresConSaldo.map((p) => (
                    <Stack
                      key={p.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ flex: 1, minWidth: 0 }}>
                        {p.nombre}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        {fmtMoney(Number(p.saldoActual || 0))}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stock bajo */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" /> Stock bajo / materia prima
                </Typography>
                {!stockBajoUnavailable && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/logistica/stock')}
                  >
                    Ver stock
                  </Button>
                )}
              </Stack>

              {stockBajoUnavailable ? (
                <Alert severity="info">
                  No tenés acceso a la información de stock. Pedile a un administrador
                  los permisos del módulo de productos.
                </Alert>
              ) : stockBajo.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle1" color="success.main" gutterBottom>
                    ¡Stock en orden!
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sin productos por debajo del mínimo.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {stockBajo.map((p) => {
                    const pct = p.stockMinimo > 0
                      ? Math.min(100, (p.stockActual / (p.stockMinimo * 2)) * 100)
                      : 0;
                    return (
                      <Box key={p.id}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {p.nombre}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.categoriaProductoNombre || 'Sin categoría'}
                            </Typography>
                          </Box>
                          <Box textAlign="right" ml={1}>
                            <Chip
                              size="small"
                              icon={<Inventory2Icon />}
                              label={`${p.stockActual} / ${p.stockMinimo}`}
                              color={p.stockActual === 0 ? 'error' : 'warning'}
                            />
                          </Box>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          color={p.stockActual === 0 ? 'error' : 'warning'}
                          sx={{ height: 6, borderRadius: 3, mt: 0.75 }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Modelos a fabricar (stock objetivo) */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BuildIcon color="warning" /> Modelos a fabricar
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/fabricacion/stock-planificacion')}
                >
                  Planificación
                </Button>
              </Stack>
              {evaluacionesFabricar.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle1" color="success.main">
                    Todos los modelos en objetivo
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {evaluacionesFabricar.slice(0, 8).map((e) => (
                    <Stack
                      key={e.stockObjetivoId}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box flex={1} minWidth={0}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {e.modelo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Disponible: {e.stockDisponible} / Objetivo: {e.cantidadObjetivo}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`Fabricar ${e.cantidadAFabricar}`}
                        color="warning"
                      />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
  isMoney?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color, icon, subtitle, onClick, isMoney }) => (
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        borderTop: `4px solid ${color}`,
        transition: 'transform 0.15s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : undefined,
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box minWidth={0}>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{ color, fontSize: { xs: '1.4rem', md: '1.6rem' }, lineHeight: 1.2, wordBreak: 'break-word' }}
            >
              {isMoney ? fmtMoney(value) : value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 32, flexShrink: 0 }}>{icon}</Box>
        </Stack>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>
);

export default ComprasDashboard;
