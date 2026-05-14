import React, { useEffect, useState, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Divider,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Skeleton,
  Tooltip,
} from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EngineeringIcon from '@mui/icons-material/Engineering';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import dayjs from 'dayjs';
import { equipoFabricadoApi } from '../../api/services';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import type {
  EquipoFabricadoListDTO,
  DesgloseModeloDTO,
  OrdenServicio,
} from '../../types';

const TallerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [equiposEnProceso, setEquiposEnProceso] = useState<EquipoFabricadoListDTO[]>([]);
  const [completadosMes, setCompletadosMes] = useState<EquipoFabricadoListDTO[]>([]);
  const [pendientesTerminacion, setPendientesTerminacion] = useState<EquipoFabricadoListDTO[]>([]);
  const [desglose, setDesglose] = useState<DesgloseModeloDTO[]>([]);
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenServicio[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      // El endpoint del backend exige LocalDateTime (ISO con tiempo), no LocalDate.
      const inicioMes = dayjs().startOf('month').format('YYYY-MM-DDTHH:mm:ss');
      const hoy = dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss');

      // allSettled para que una falla puntual (ej. 403/500 de un endpoint) no
      // tire el dashboard entero. Cada bloque que rechaza simplemente queda en [].
      const results = await Promise.allSettled([
        equipoFabricadoApi.findByEstado('EN_PROCESO'),
        equipoFabricadoApi.findCompletadosEntreFechas(inicioMes, hoy),
        equipoFabricadoApi.findPendientesTerminacion(),
        equipoFabricadoApi.getDesgloseModelo(),
        ordenServicioApi.getAll({ page: 0, size: 200, sort: 'id,desc' }),
      ]);

      if (cancelled) return;

      const unwrap = <T,>(r: PromiseSettledResult<T>, fallback: T, label: string): T => {
        if (r.status === 'fulfilled') return r.value;
        console.warn(`[TallerDashboard] ${label} falló:`, r.reason);
        return fallback;
      };

      setEquiposEnProceso(unwrap(results[0], [] as EquipoFabricadoListDTO[], 'equipos en proceso'));
      setCompletadosMes(unwrap(results[1], [] as EquipoFabricadoListDTO[], 'completados del mes'));
      setPendientesTerminacion(unwrap(results[2], [] as EquipoFabricadoListDTO[], 'pendientes terminación'));
      setDesglose(unwrap(results[3], [] as DesgloseModeloDTO[], 'desglose por modelo'));

      const ordPage = unwrap(results[4], null as any, 'órdenes de servicio');
      const ordenesList = Array.isArray(ordPage)
        ? (ordPage as OrdenServicio[])
        : (ordPage as any)?.content || [];
      const activas: OrdenServicio[] = ordenesList.filter(
        (o: OrdenServicio) => o.estado === 'PENDIENTE' || o.estado === 'EN_PROCESO'
      );
      setOrdenesActivas(activas);

      // Mostrar Alert sólo si TODO falló — fallas parciales se loguean nomás.
      if (results.every(r => r.status === 'rejected')) {
        setError('No se pudieron cargar los datos del dashboard');
      }

      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Métricas derivadas ────────────────────────────────────────────────
  const totalEquiposEnService = useMemo(
    () => desglose.reduce((sum, d) => sum + (d.enService || 0), 0),
    [desglose]
  );

  const totalEquiposEnDeposito = useMemo(
    () => desglose.reduce((sum, d) => sum + (d.total || 0), 0),
    [desglose]
  );

  const promedioProgreso = useMemo(() => {
    if (equiposEnProceso.length === 0) return 0;
    const sum = equiposEnProceso.reduce(
      (acc, eq) => acc + (eq.progresoFabricacion ?? 0),
      0
    );
    return Math.round(sum / equiposEnProceso.length);
  }, [equiposEnProceso]);

  // Top 8 equipos EN_PROCESO ordenados por progreso descendente (los más cerca de listos primero)
  const topEnProceso = useMemo(() => {
    return [...equiposEnProceso]
      .sort((a, b) => (b.progresoFabricacion ?? 0) - (a.progresoFabricacion ?? 0))
      .slice(0, 8);
  }, [equiposEnProceso]);

  // Top modelos por equipos disponibles (excluyendo los que tienen 0)
  const topDesglose = useMemo(() => {
    return [...desglose]
      .filter(d => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [desglose]);

  // Órdenes activas ordenadas por fecha de creación ascendente (las más viejas primero)
  const ordenesPrioritarias = useMemo(() => {
    return [...ordenesActivas]
      .sort((a, b) =>
        new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
      )
      .slice(0, 6);
  }, [ordenesActivas]);

  // Estimación de antigüedad para los chips
  const diasDesde = (fecha: string): number => {
    return dayjs().startOf('day').diff(dayjs(fecha).startOf('day'), 'day');
  };

  const getEstadoOSColor = (estado: string): 'default' | 'warning' | 'info' => {
    if (estado === 'EN_PROCESO') return 'info';
    if (estado === 'PENDIENTE') return 'warning';
    return 'default';
  };

  const getProgresoColor = (pct: number): 'success' | 'warning' | 'info' | 'error' => {
    if (pct >= 80) return 'success';
    if (pct >= 50) return 'info';
    if (pct >= 25) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: { xs: 0, sm: 1 } }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
        }}
      >
        Dashboard de Taller
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                  <PrecisionManufacturingIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {loading ? <Skeleton width={40} /> : equiposEnProceso.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Equipos en fabricación
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.main' }}>
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {loading ? <Skeleton width={40} /> : completadosMes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completados este mes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.main' }}>
                  <HourglassEmptyIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {loading ? <Skeleton width={40} /> : pendientesTerminacion.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes de terminación
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.light', color: 'error.main' }}>
                  <BuildIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {loading ? <Skeleton width={40} /> : totalEquiposEnService}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Equipos en service
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {/* Progreso de fabricación */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography
                variant="h6"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                <PrecisionManufacturingIcon color="primary" />
                Equipos en fabricación
              </Typography>
              <Chip
                label={`Avance promedio: ${promedioProgreso}%`}
                color={getProgresoColor(promedioProgreso)}
                size="small"
              />
            </Box>
            {loading ? (
              <Stack spacing={1.5}>
                {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={56} />)}
              </Stack>
            ) : topEnProceso.length === 0 ? (
              <Alert severity="info">No hay equipos en fabricación en este momento.</Alert>
            ) : (
              <Stack spacing={2}>
                {topEnProceso.map((eq) => {
                  const pct = eq.progresoFabricacion ?? 0;
                  return (
                    <Box key={eq.id}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Box>
                          <Typography variant="body2" fontWeight="600">
                            {eq.numeroHeladera}
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {eq.tipo} · {eq.modelo}
                            </Typography>
                          </Typography>
                          {eq.responsableNombre && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                              <EngineeringIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {eq.responsableNombre}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Chip
                          label={`${pct}%`}
                          color={getProgresoColor(pct)}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={getProgresoColor(pct)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  );
                })}
                {equiposEnProceso.length > topEnProceso.length && (
                  <Typography variant="caption" color="text.secondary" textAlign="center">
                    Mostrando {topEnProceso.length} de {equiposEnProceso.length} equipos.
                    Ver todos en Producción → Equipos Fabricados.
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>

          {/* Órdenes de servicio activas */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              <AssignmentIcon color="primary" />
              Órdenes de servicio activas
              <Chip label={ordenesActivas.length} size="small" sx={{ ml: 1 }} />
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={180} />
            ) : ordenesPrioritarias.length === 0 ? (
              <Alert severity="success">No hay órdenes activas pendientes.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Orden</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Antigüedad</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordenesPrioritarias.map((o) => {
                      const dias = diasDesde(o.fechaCreacion);
                      return (
                        <TableRow key={o.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{o.numeroOrden}</TableCell>
                          <TableCell>
                            {o.clienteNombre ||
                              [o.cliente?.nombre, o.cliente?.apellido].filter(Boolean).join(' ') ||
                              '—'}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 220,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Tooltip title={o.descripcionTrabajo || ''}>
                              <span>{o.descripcionTrabajo || '—'}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                              label={dias === 0 ? 'Hoy' : `${dias} d`}
                              size="small"
                              color={dias > 7 ? 'error' : dias > 3 ? 'warning' : 'default'}
                              variant={dias > 3 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={o.estado.replace('_', ' ')}
                              color={getEstadoOSColor(o.estado)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Panel lateral: stock y producción del mes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              <TrendingUpIcon color="primary" />
              Rendimiento del mes
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Avance promedio en fabricación
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {promedioProgreso}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={promedioProgreso}
                  color={getProgresoColor(promedioProgreso)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Estadísticas
                </Typography>
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Completados (mes)</Typography>
                    <Chip
                      label={loading ? '…' : completadosMes.length}
                      size="small"
                      color="success"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">En fabricación</Typography>
                    <Chip
                      label={loading ? '…' : equiposEnProceso.length}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Stock total</Typography>
                    <Chip
                      label={loading ? '…' : totalEquiposEnDeposito}
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      <WarningIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Pendientes terminación
                    </Typography>
                    <Chip
                      label={loading ? '…' : pendientesTerminacion.length}
                      size="small"
                      color={pendientesTerminacion.length > 0 ? 'warning' : 'default'}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Top modelos */}
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Stock por modelo
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={160} />
            ) : topDesglose.length === 0 ? (
              <Alert severity="info">Sin datos de stock.</Alert>
            ) : (
              <Stack spacing={1.5}>
                {topDesglose.map((d) => (
                  <Box key={`${d.tipo}-${d.modelo}`}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight="600">
                        {d.modelo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {d.total} u.
                      </Typography>
                    </Box>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      <Chip
                        label={`Disp: ${d.disponibles}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Chip
                        label={`Asig: ${d.asignados}`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                      {d.enService > 0 && (
                        <Chip
                          label={`Service: ${d.enService}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TallerDashboard;
