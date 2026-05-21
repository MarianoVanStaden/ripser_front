import React, { useEffect, useState } from 'react';
import {
  Box, Grid2 as Grid, Card, CardContent, Typography, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Stack, Divider, Alert,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  DirectionsCar as DirectionsCarIcon,
  Inventory2 as Inventory2Icon,
  Build as BuildIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  ShoppingCart as ShoppingCartIcon,
  Factory as FactoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/config';
import { documentoApi } from '../../api/services/documentoApi';
import { productApi } from '../../api/services/productApi';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';

// Shape mínima del ViajeDTO — sólo lo que consumimos acá. Importar el tipo
// completo de logistica.types.ts arrastra dependencias innecesarias.
interface ViajeResponse {
  id: number;
  numeroViaje?: string;
  fechaViaje: string;
  destino: string;
  conductorNombre?: string;
  vehiculoPatente?: string;
  estado: 'PLANIFICADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
  entregas?: Array<{ estado?: string }>;
}

interface EquipoLite {
  estado?: string;
  estadoAsignacion?: string;
  fechaFinalizacion?: string;
  fechaCreacion?: string;
}

interface DocumentoLite {
  id: number;
  numeroDocumento?: string;
  clienteNombre?: string;
  fechaEmision?: string;
  fecha?: string;
  estado?: string;
  tipoDocumento?: string;
  // Sólo necesitamos contar líneas tipo EQUIPO; total monetario no se usa.
  detalles?: Array<{ tipoItem?: string; cantidad?: number }>;
}

// Suma de equipos (líneas EQUIPO) para un documento.
const countEquiposEnDoc = (d: DocumentoLite): number =>
  (d.detalles ?? [])
    .filter((det) => det.tipoItem === 'EQUIPO')
    .reduce((acc, det) => acc + Number(det.cantidad || 0), 0);

const sumEquiposEnDocs = (docs: DocumentoLite[]): number =>
  docs.reduce((acc, d) => acc + countEquiposEnDoc(d), 0);

interface ProductoLite {
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  categoriaProductoNombre?: string;
  activo?: boolean;
}

interface EquipoMetrics {
  reservado: number;
  facturado: number;
  enTransito: number;
  entregado: number;
  pendienteTerminacion: number;
}

interface FabricacionMetrics {
  total: number;
  pendiente: number;
  enProceso: number;
  completado: number;
  sinTerminacion: number;
  completadosMes: number;
}

const initialEquipoMetrics: EquipoMetrics = {
  reservado: 0,
  facturado: 0,
  enTransito: 0,
  entregado: 0,
  pendienteTerminacion: 0,
};

const initialFabMetrics: FabricacionMetrics = {
  total: 0,
  pendiente: 0,
  enProceso: 0,
  completado: 0,
  sinTerminacion: 0,
  completadosMes: 0,
};

const estadoChip = (estado: string) => {
  switch (estado) {
    case 'EN_CURSO':
      return <Chip label="En curso" color="warning" size="small" />;
    case 'PLANIFICADO':
      return <Chip label="Planificado" color="info" size="small" />;
    case 'COMPLETADO':
      return <Chip label="Completado" color="success" size="small" />;
    case 'CANCELADO':
      return <Chip label="Cancelado" color="default" size="small" />;
    default:
      return <Chip label={estado} size="small" />;
  }
};

const TransporteDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const [equipoMetrics, setEquipoMetrics] = useState<EquipoMetrics>(initialEquipoMetrics);
  const [fabMetrics, setFabMetrics] = useState<FabricacionMetrics>(initialFabMetrics);
  const [viajes, setViajes] = useState<ViajeResponse[]>([]);

  const [notasPedidoMes, setNotasPedidoMes] = useState<DocumentoLite[]>([]);
  const [facturasMes, setFacturasMes] = useState<DocumentoLite[]>([]);

  const [stockBajo, setStockBajo] = useState<ProductoLite[]>([]);
  const [stockBajoUnavailable, setStockBajoUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const errs: string[] = [];

      const startMonth = dayjs().startOf('month').format('YYYY-MM-DD');
      const endMonth = dayjs().endOf('month').format('YYYY-MM-DD');

      // Equipos fabricados — alcanza con paginar grande, lectura barata.
      const equiposReq = api
        .get('/api/equipos-fabricados', { params: { page: 0, size: 10000 } })
        .then((r) => (r.data?.content ?? []) as EquipoLite[])
        .catch((e) => {
          console.warn('No se pudieron cargar equipos fabricados', e);
          errs.push('equipos fabricados');
          return [] as EquipoLite[];
        });

      const viajesReq = api
        .get('/api/viajes', { params: { page: 0, size: 500 } })
        .then((r) => (r.data?.content ?? []) as ViajeResponse[])
        .catch((e) => {
          console.warn('No se pudieron cargar viajes', e);
          errs.push('viajes');
          return [] as ViajeResponse[];
        });

      // Notas de pedido y facturas del mes — pegamos al endpoint paginado con
      // filtro server-side de fechas.
      const notasReq = documentoApi
        .getByTipoPaginated('NOTA_PEDIDO', { page: 0, size: 200 }, {
          fechaDesde: startMonth,
          fechaHasta: endMonth,
        })
        .then((r) => (r.content ?? []) as DocumentoLite[])
        .catch((e) => {
          console.warn('No se pudieron cargar notas de pedido', e);
          errs.push('notas de pedido');
          return [] as DocumentoLite[];
        });

      const facturasReq = documentoApi
        .getByTipoPaginated('FACTURA', { page: 0, size: 200 }, {
          fechaDesde: startMonth,
          fechaHasta: endMonth,
        })
        .then((r) => (r.content ?? []) as DocumentoLite[])
        .catch((e) => {
          console.warn('No se pudieron cargar facturas del mes', e);
          errs.push('facturas');
          return [] as DocumentoLite[];
        });

      // Stock bajo — el rol TRANSPORTE puede no tener este permiso. Si falla,
      // ocultamos la sección y seguimos sin marcar error duro.
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

      const [equipos, viajesData, notas, facturas, stock] = await Promise.all([
        equiposReq, viajesReq, notasReq, facturasReq, stockReq,
      ]);

      if (cancelled) return;

      // Equipos: estado de asignación y métricas de fabricación
      const nextEq: EquipoMetrics = { ...initialEquipoMetrics };
      const nextFab: FabricacionMetrics = { ...initialFabMetrics };
      const monthStart = dayjs().startOf('month');
      const monthEnd = dayjs().endOf('month');

      for (const eq of equipos) {
        switch (eq.estadoAsignacion) {
          case 'RESERVADO': nextEq.reservado++; break;
          case 'FACTURADO': nextEq.facturado++; break;
          case 'EN_TRANSITO': nextEq.enTransito++; break;
          case 'ENTREGADO': nextEq.entregado++; break;
          case 'PENDIENTE_TERMINACION': nextEq.pendienteTerminacion++; break;
        }
        // El cancelado no aporta al universo de fabricación visible.
        if (eq.estado && eq.estado !== 'CANCELADO') nextFab.total++;
        switch (eq.estado) {
          case 'PENDIENTE': nextFab.pendiente++; break;
          case 'EN_PROCESO': nextFab.enProceso++; break;
          case 'COMPLETADO': nextFab.completado++; break;
          case 'FABRICADO_SIN_TERMINACION': nextFab.sinTerminacion++; break;
        }
        if (eq.estado === 'COMPLETADO' && eq.fechaFinalizacion) {
          const f = dayjs(eq.fechaFinalizacion);
          if (f.isValid() && !f.isBefore(monthStart) && !f.isAfter(monthEnd)) {
            nextFab.completadosMes++;
          }
        }
      }
      setEquipoMetrics(nextEq);
      setFabMetrics(nextFab);

      setViajes(viajesData);
      setNotasPedidoMes(notas);
      setFacturasMes(facturas);

      const activeStock = stock.filter((p) => p.activo !== false).slice(0, 8);
      setStockBajo(activeStock);
      setErrors(errs);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Derivados
  const viajesEnCurso = viajes.filter((v) => v.estado === 'EN_CURSO');
  const viajesPlanificados = viajes.filter((v) => v.estado === 'PLANIFICADO');
  const countEntregas = (v: ViajeResponse) => ({
    total: v.entregas?.length ?? 0,
    completadas: v.entregas?.filter((e) => e.estado === 'ENTREGADA').length ?? 0,
  });
  const entregasPendientes = viajesEnCurso.reduce((acc, v) => {
    const { total, completadas } = countEntregas(v);
    return acc + Math.max(0, total - completadas);
  }, 0);

  // Cantidades de equipos (sin montos): el rol logístico/transporte sólo ve
  // volumen físico, no facturación en pesos.
  const equiposEnNotasMes = sumEquiposEnDocs(notasPedidoMes);
  const equiposEnFacturasMes = sumEquiposEnDocs(facturasMes);
  const promedioEquiposPorFactura = facturasMes.length > 0
    ? Math.round((equiposEnFacturasMes / facturasMes.length) * 10) / 10
    : 0;

  const pctEnProceso = fabMetrics.total > 0
    ? Math.round((fabMetrics.enProceso / fabMetrics.total) * 100)
    : 0;
  const pctCompletado = fabMetrics.total > 0
    ? Math.round((fabMetrics.completado / fabMetrics.total) * 100)
    : 0;
  const pctPendiente = fabMetrics.total > 0
    ? Math.round((fabMetrics.pendiente / fabMetrics.total) * 100)
    : 0;
  const pctSinTerminacion = fabMetrics.total > 0
    ? Math.round((fabMetrics.sinTerminacion / fabMetrics.total) * 100)
    : 0;

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={600}>
          ¡Hola, {getFirstName(user) || 'logística'}! 🚚
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel operativo de logística — {dayjs().format('DD/MM/YYYY')}
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {errors.length > 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se pudieron cargar algunos indicadores: {errors.join(', ')}.
        </Alert>
      )}

      {/* Ventas del mes — sólo cantidades de equipos, sin montos */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Ventas del mes (equipos)
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Notas de Pedido"
          value={notasPedidoMes.length}
          color="#1976d2"
          icon={<ShoppingCartIcon />}
          subtitle={`${equiposEnNotasMes} equipos pedidos`}
          onClick={() => navigate('/ventas/registro')}
        />
        <MetricCard
          title="Facturas emitidas"
          value={facturasMes.length}
          color="#2e7d32"
          icon={<ReceiptIcon />}
          subtitle={`${equiposEnFacturasMes} equipos facturados`}
          onClick={() => navigate('/ventas/registro')}
        />
        <MetricCard
          title="Promedio equipos / factura"
          value={promedioEquiposPorFactura}
          color="#ed6c02"
          icon={<TrendingUpIcon />}
          subtitle="Equipos por factura del mes"
        />
        <MetricCard
          title="Equipos fabricados (mes)"
          value={fabMetrics.completadosMes}
          color="#4caf50"
          icon={<FactoryIcon />}
          subtitle="Finalizados en este mes"
          onClick={() => navigate('/fabricacion/equipos')}
        />
      </Grid>

      {/* Fabricación */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Estado de fabricación
      </Typography>
      <Grid container spacing={2} mb={2}>
        <MetricCard
          title="Total en proceso"
          value={fabMetrics.total}
          color="#1976d2"
          icon={<BuildIcon />}
          subtitle="Equipos activos (sin cancelados)"
          onClick={() => navigate('/fabricacion/equipos')}
        />
        <MetricCard
          title="Pendientes"
          value={fabMetrics.pendiente}
          color="#9e9e9e"
          icon={<PendingIcon />}
          subtitle="Sin iniciar fabricación"
          onClick={() => navigate('/fabricacion/equipos')}
        />
        <MetricCard
          title="En proceso"
          value={fabMetrics.enProceso}
          color="#ff9800"
          icon={<BuildIcon />}
          subtitle={`${pctEnProceso}% del total`}
          onClick={() => navigate('/fabricacion/equipos')}
        />
        <MetricCard
          title="Completados"
          value={fabMetrics.completado}
          color="#4caf50"
          icon={<CheckCircleIcon />}
          subtitle={`${pctCompletado}% del total`}
          onClick={() => navigate('/fabricacion/equipos')}
        />
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Distribución de la cola de fabricación
          </Typography>
          <Stack spacing={2} mt={1}>
            <ProgressRow
              label="Pendientes"
              value={fabMetrics.pendiente}
              total={fabMetrics.total}
              pct={pctPendiente}
              color="inherit"
            />
            <ProgressRow
              label="En proceso"
              value={fabMetrics.enProceso}
              total={fabMetrics.total}
              pct={pctEnProceso}
              color="warning"
            />
            <ProgressRow
              label="Fabricados sin terminación (base lista)"
              value={fabMetrics.sinTerminacion}
              total={fabMetrics.total}
              pct={pctSinTerminacion}
              color="info"
            />
            <ProgressRow
              label="Completados"
              value={fabMetrics.completado}
              total={fabMetrics.total}
              pct={pctCompletado}
              color="success"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Estado de equipos (asignación) */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Estado de equipos (asignación)
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Reservados"
          value={equipoMetrics.reservado}
          color="#ff9800"
          icon={<AssignmentIcon />}
          subtitle="Asignados a cliente, en planta"
          onClick={() => navigate('/fabricacion/equipos')}
        />
        <MetricCard
          title="Facturados"
          value={equipoMetrics.facturado}
          color="#2196f3"
          icon={<ReceiptIcon />}
          subtitle="Facturados, pendientes de armar viaje"
          onClick={() => navigate('/logistica/distribucion/entregas-equipos')}
        />
        <MetricCard
          title="En Tránsito"
          value={equipoMetrics.enTransito}
          color="#9c27b0"
          icon={<LocalShippingIcon />}
          subtitle="Viajando hacia el cliente"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
        <MetricCard
          title="Entregados"
          value={equipoMetrics.entregado}
          color="#4caf50"
          icon={<CheckCircleIcon />}
          subtitle="Entregas confirmadas"
          onClick={() => navigate('/logistica/distribucion/entregas-equipos')}
        />
        <MetricCard
          title="Pdte. Terminación"
          value={equipoMetrics.pendienteTerminacion}
          color="#795548"
          icon={<PendingIcon />}
          subtitle="Reservados sin color final"
        />
      </Grid>

      {/* Transporte */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Actividad de transporte
      </Typography>
      <Grid container spacing={2} mb={3}>
        <MetricCard
          title="Viajes en curso"
          value={viajesEnCurso.length}
          color="#ff9800"
          icon={<DirectionsCarIcon />}
          subtitle="Vehículos en ruta ahora"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
        <MetricCard
          title="Viajes planificados"
          value={viajesPlanificados.length}
          color="#1976d2"
          icon={<AssignmentIcon />}
          subtitle="Listos para salir"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
        <MetricCard
          title="Entregas pendientes"
          value={entregasPendientes}
          color="#d32f2f"
          icon={<PendingIcon />}
          subtitle="En viajes en curso, sin confirmar"
          onClick={() => navigate('/logistica/distribucion/entregas-productos')}
        />
      </Grid>

      <Grid container spacing={3}>
        {/* Tabla de viajes activos */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Viajes activos ({viajesEnCurso.length + viajesPlanificados.length})
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/logistica/distribucion/viajes')}
                >
                  Armado de viajes
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nº Viaje</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Destino</TableCell>
                      <TableCell>Conductor</TableCell>
                      <TableCell align="center">Entregas</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...viajesEnCurso, ...viajesPlanificados].slice(0, 10).map((v) => {
                      const { total, completadas } = countEntregas(v);
                      return (
                        <TableRow key={v.id} hover>
                          <TableCell>{v.numeroViaje || `#${v.id}`}</TableCell>
                          <TableCell>{dayjs(v.fechaViaje).format('DD/MM/YYYY')}</TableCell>
                          <TableCell>{v.destino}</TableCell>
                          <TableCell>{v.conductorNombre || '-'}</TableCell>
                          <TableCell align="center">{completadas}/{total}</TableCell>
                          <TableCell>{estadoChip(v.estado)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {viajesEnCurso.length + viajesPlanificados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            No hay viajes activos en este momento.
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

        {/* Stock bajo / materia prima */}
        <Grid size={{ xs: 12, lg: 5 }}>
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
                  No tenés acceso a la información de stock bajo. Pedile a un administrador
                  los permisos del módulo de productos si necesitás este indicador.
                </Alert>
              ) : stockBajo.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle1" color="success.main" gutterBottom>
                    ¡Stock en orden!
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    No hay productos por debajo del mínimo.
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
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color, icon, subtitle, onClick }) => (
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
              sx={{ color, fontSize: { xs: '1.5rem', md: '1.75rem' }, lineHeight: 1.2 }}
            >
              {value}
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

interface ProgressRowProps {
  label: string;
  value: number;
  total: number;
  pct: number;
  color: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const ProgressRow: React.FC<ProgressRowProps> = ({ label, value, total, pct, color }) => (
  <Box>
    <Stack direction="row" justifyContent="space-between" mb={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value} / {total} ({pct}%)
      </Typography>
    </Stack>
    <LinearProgress
      variant="determinate"
      value={pct}
      color={color === 'inherit' ? undefined : color}
      sx={{ height: 8, borderRadius: 4 }}
    />
  </Box>
);

export default TransporteDashboard;
