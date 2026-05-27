import React, { useEffect, useState } from 'react';
import {
  Box, Grid2 as Grid, Card, CardContent, Typography, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Stack, Alert,
} from '@mui/material';
import {
  LocalShipping as LocalShippingIcon,
  DirectionsCar as DirectionsCarIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import { viajeApi } from '../../api/services/viajeApi';
import { reclamoGarantiaApi } from '../../api/services/reclamoGarantiaApi';
import { documentoApi } from '../../api/services/documentoApi';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';

interface EntregaResponse {
  id: number;
  numeroEntrega?: string;
  cliente?: string;
  clienteNombre?: string;
  estado: 'PENDIENTE' | 'ENTREGADA' | 'NO_ENTREGADA' | 'RECHAZADA';
  fechaEntrega?: string;
  fecha?: string;
  numeroViaje?: number;
}

interface ViajeResponse {
  id: number;
  numeroViaje?: string;
  fechaViaje: string;
  destino: string;
  conductorNombre?: string;
  estado: 'PLANIFICADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';
}

interface SaleResponse {
  id: number;
  numeroDocumento?: string;
  clienteNombre?: string;
  cliente?: string;
  fechaEmision?: string;
  fecha?: string;
  estado?: string;
  total?: number;
}

interface ReclamoResponse {
  id: number;
  numeroReclamo?: string;
  equipoNombre?: string;
  equipoNumero?: string;
  problema?: string;
  estado: 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO';
  fechaReclamo?: string;
  fecha?: string;
}

interface EntregaMetrics {
  total: number;
  completadas: number;
  pendientes: number;
  rechazadas: number;
}

const initialEntregaMetrics: EntregaMetrics = {
  total: 0,
  completadas: 0,
  pendientes: 0,
  rechazadas: 0,
};

const estadoReclamoChip = (estado: string) => {
  switch (estado) {
    case 'ABIERTO':
      return <Chip label="Abierto" color="error" size="small" />;
    case 'EN_PROCESO':
      return <Chip label="En proceso" color="warning" size="small" />;
    case 'RESUELTO':
    case 'CERRADO':
      return <Chip label="Resuelto" color="success" size="small" />;
    default:
      return <Chip label={estado} size="small" />;
  }
};

const PostVentaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const [entregaMetrics, setEntregaMetrics] = useState<EntregaMetrics>(initialEntregaMetrics);
  const [viajes, setViajes] = useState<ViajeResponse[]>([]);
  const [ventas, setVentas] = useState<SaleResponse[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoResponse[]>([]);

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const errs: string[] = [];

      // Entregas del día
      const entregasReq = entregaViajeApi
        .getAll()
        .then((r: EntregaResponse[]) => {
          return r.filter(
            (e) => e.fechaEntrega && e.fechaEntrega.startsWith(today)
          );
        })
        .catch((e: Error) => {
          console.warn('No se pudieron cargar entregas del día', e);
          errs.push('entregas');
          return [] as EntregaResponse[];
        });

      // Viajes del día
      const viajesReq = viajeApi
        .getAll({ page: 0, size: 500 })
        .then((r: ViajeResponse[]) => {
          return r.filter(
            (v) => v.fechaViaje && v.fechaViaje.startsWith(today)
          );
        })
        .catch((e: Error) => {
          console.warn('No se pudieron cargar viajes del día', e);
          errs.push('viajes');
          return [] as ViajeResponse[];
        });

      // Últimas ventas registradas
      const ventasReq = documentoApi
        .getByTipoPaginated('REGISTRO_VENTA', { page: 0, size: 10 })
        .then((r) => {
          return (r.content ?? []) as SaleResponse[];
        })
        .catch((e: Error) => {
          console.warn('No se pudieron cargar ventas', e);
          errs.push('ventas');
          return [] as SaleResponse[];
        });

      // Reclamos recientes
      const reclamosReq = reclamoGarantiaApi
        .findAll({ page: 0, size: 10 })
        .then((r) => {
          const data = r.content ?? [];
          return (data as ReclamoResponse[]).sort((a, b) => {
            const dateA = dayjs(a.fechaReclamo || a.fecha);
            const dateB = dayjs(b.fechaReclamo || b.fecha);
            return dateB.diff(dateA);
          });
        })
        .catch((e: Error) => {
          console.warn('No se pudieron cargar reclamos', e);
          errs.push('reclamos');
          return [] as ReclamoResponse[];
        });

      const [entregasData, viajesData, ventasData, reclamosData] = await Promise.all([
        entregasReq,
        viajesReq,
        ventasReq,
        reclamosReq,
      ]);

      if (cancelled) return;

      // Calcular métricas de entregas
      const nextMetrics: EntregaMetrics = { ...initialEntregaMetrics };
      for (const e of entregasData) {
        nextMetrics.total++;
        if (e.estado === 'ENTREGADA') {
          nextMetrics.completadas++;
        } else if (e.estado === 'PENDIENTE') {
          nextMetrics.pendientes++;
        } else if (e.estado === 'RECHAZADA' || e.estado === 'NO_ENTREGADA') {
          nextMetrics.rechazadas++;
        }
      }
      setEntregaMetrics(nextMetrics);

      setEntregas(entregasData);
      setViajes(viajesData);
      setVentas(ventasData);
      setReclamos(reclamosData);
      setErrors(errs);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [today]);

  // Derivados
  const viajesEnCurso = viajes.filter((v) => v.estado === 'EN_CURSO');
  const viajesPlanificados = viajes.filter((v) => v.estado === 'PLANIFICADO');
  const viajesCompletados = viajes.filter((v) => v.estado === 'COMPLETADO');

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={600}>
          ¡Hola, {getFirstName(user) || 'post-venta'}! 📋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel de post-venta — {dayjs().format('DD/MM/YYYY')}
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {errors.length > 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No se pudieron cargar algunos indicadores: {errors.join(', ')}.
        </Alert>
      )}

      {/* Entregas del día */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Entregas del día
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Total entregas"
          value={entregaMetrics.total}
          color="#1976d2"
          icon={<LocalShippingIcon />}
          subtitle={`${dayjs().format('DD/MM/YYYY')}`}
          onClick={() => navigate('/logistica/distribucion/entregas-productos')}
        />
        <MetricCard
          title="Completadas"
          value={entregaMetrics.completadas}
          color="#4caf50"
          icon={<CheckCircleIcon />}
          subtitle="Entregas exitosas"
          onClick={() => navigate('/logistica/distribucion/entregas-productos')}
        />
        <MetricCard
          title="Pendientes"
          value={entregaMetrics.pendientes}
          color="#ff9800"
          icon={<PendingIcon />}
          subtitle="Aún en ruta"
          onClick={() => navigate('/logistica/distribucion/entregas-productos')}
        />
        <MetricCard
          title="Rechazadas"
          value={entregaMetrics.rechazadas}
          color="#d32f2f"
          icon={<ErrorIcon />}
          subtitle="No entregadas"
          onClick={() => navigate('/logistica/distribucion/entregas-productos')}
        />
      </Grid>

      {/* Viajes del día */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Viajes del día
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Planificados"
          value={viajesPlanificados.length}
          color="#1976d2"
          icon={<DirectionsCarIcon />}
          subtitle="Listos para salir"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
        <MetricCard
          title="En curso"
          value={viajesEnCurso.length}
          color="#ff9800"
          icon={<DirectionsCarIcon />}
          subtitle="En ruta ahora"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
        <MetricCard
          title="Completados"
          value={viajesCompletados.length}
          color="#4caf50"
          icon={<CheckCircleIcon />}
          subtitle="Finalizados"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
      </Grid>

      <Grid container spacing={3}>
        {/* Últimas ventas registradas */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Últimas ventas registradas
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/ventas/registro')}
                >
                  Ver todas
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nº Documento</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventas.length > 0 ? (
                      ventas.slice(0, 8).map((v) => (
                        <TableRow key={v.id} hover>
                          <TableCell>{v.numeroDocumento || `#${v.id}`}</TableCell>
                          <TableCell>{v.clienteNombre || v.cliente || '-'}</TableCell>
                          <TableCell>
                            {dayjs(v.fechaEmision || v.fecha).format('DD/MM/YYYY')}
                          </TableCell>
                          <TableCell align="right">
                            {v.total ? `$${v.total.toLocaleString('es-AR')}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            No hay ventas registradas.
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

        {/* Reclamos / Garantías recientes */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Reclamos recientes
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/garantias/reclamos')}
                >
                  Ver todos
                </Button>
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nº Reclamo</TableCell>
                      <TableCell>Equipo</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reclamos.length > 0 ? (
                      reclamos.slice(0, 8).map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>{r.numeroReclamo || `#${r.id}`}</TableCell>
                          <TableCell>
                            {r.equipoNombre || r.equipoNumero || '-'}
                          </TableCell>
                          <TableCell>
                            {dayjs(r.fechaReclamo || r.fecha).format('DD/MM/YYYY')}
                          </TableCell>
                          <TableCell>{estadoReclamoChip(r.estado)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary" py={2}>
                            No hay reclamos registrados.
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

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  color,
  icon,
  subtitle,
  onClick,
}) => (
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
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
              sx={{
                color,
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                lineHeight: 1.2,
              }}
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

export default PostVentaDashboard;
