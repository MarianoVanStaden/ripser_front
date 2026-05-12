import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Stack,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  DirectionsCar as DirectionsCarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../api/config';
import { resumenViajeApi, type ResumenViaje } from '../../api/services/resumenViajeApi';
import { useAuth } from '../../context/AuthContext';
import { getFirstName } from '../../utils/userDisplay';

// Counts por estado de asignación, calculados client-side desde el listado de
// equipos. El back ya expone /api/equipos-fabricados con paginación, alcanza
// con pedir un page grande y agrupar — son operaciones de lectura barata.
interface EquipoMetrics {
  reservado: number;
  facturado: number;
  enTransito: number;
  entregado: number;
  pendienteTerminacion: number;
}

const initialMetrics: EquipoMetrics = {
  reservado: 0,
  facturado: 0,
  enTransito: 0,
  entregado: 0,
  pendienteTerminacion: 0,
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
  const [metrics, setMetrics] = useState<EquipoMetrics>(initialMetrics);
  const [viajes, setViajes] = useState<ResumenViaje[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [equiposResp, viajesResp] = await Promise.all([
          api.get('/api/equipos-fabricados', { params: { page: 0, size: 10000 } }),
          resumenViajeApi.getAll(),
        ]);

        if (cancelled) return;

        const equipos: Array<{ estadoAsignacion?: string }> = equiposResp.data.content || [];
        const next: EquipoMetrics = { ...initialMetrics };
        for (const eq of equipos) {
          switch (eq.estadoAsignacion) {
            case 'RESERVADO': next.reservado++; break;
            case 'FACTURADO': next.facturado++; break;
            case 'EN_TRANSITO': next.enTransito++; break;
            case 'ENTREGADO': next.entregado++; break;
            case 'PENDIENTE_TERMINACION': next.pendienteTerminacion++; break;
          }
        }
        setMetrics(next);
        setViajes(viajesResp);
      } catch (err) {
        console.error('Error cargando dashboard de transporte', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const viajesEnCurso = viajes.filter(v => v.estado === 'EN_CURSO');
  const viajesPlanificados = viajes.filter(v => v.estado === 'PLANIFICADO');
  const entregasPendientes = viajesEnCurso.reduce(
    (acc, v) => acc + Math.max(0, v.totalEntregas - v.entregasCompletadas), 0
  );

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={600}>
          ¡Hola, {getFirstName(user) || 'transportista'}! 🚚
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Panel de control del módulo Transporte — {dayjs().format('DD/MM/YYYY')}
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Métricas de equipos */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Estado de equipos
      </Typography>
      <Grid container spacing={2} mb={4}>
        <MetricCard
          title="Reservados"
          value={metrics.reservado}
          color="#ff9800"
          icon={<AssignmentIcon />}
          subtitle="Asignados a cliente, aún en planta"
          onClick={() => navigate('/fabricacion/equipos')}
        />
        <MetricCard
          title="Facturados"
          value={metrics.facturado}
          color="#2196f3"
          icon={<ReceiptIcon />}
          subtitle="Facturados, pendientes de armar viaje"
          onClick={() => navigate('/logistica/distribucion/entregas-equipos')}
        />
        <MetricCard
          title="En Tránsito"
          value={metrics.enTransito}
          color="#9c27b0"
          icon={<LocalShippingIcon />}
          subtitle="Viajando hacia el cliente"
          onClick={() => navigate('/logistica/distribucion/viajes')}
        />
        <MetricCard
          title="Entregados"
          value={metrics.entregado}
          color="#4caf50"
          icon={<CheckCircleIcon />}
          subtitle="Entregas confirmadas"
          onClick={() => navigate('/logistica/distribucion/entregas-equipos')}
        />
        <MetricCard
          title="Pdte. Terminación"
          value={metrics.pendienteTerminacion}
          color="#795548"
          icon={<PendingIcon />}
          subtitle="Reservados sin color final"
        />
      </Grid>

      {/* Métricas de viajes */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Actividad logística
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

      {/* Tabla de viajes activos */}
      <Card sx={{ mb: 3 }}>
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
              Ir a Armado de Viajes
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
                  <TableCell>Vehículo</TableCell>
                  <TableCell align="center">Entregas</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...viajesEnCurso, ...viajesPlanificados].slice(0, 10).map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell>{v.numeroViaje}</TableCell>
                    <TableCell>{dayjs(v.fechaViaje).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>{v.destino}</TableCell>
                    <TableCell>{v.conductorNombre}</TableCell>
                    <TableCell>{v.vehiculoInfo}</TableCell>
                    <TableCell align="center">
                      {v.entregasCompletadas}/{v.totalEntregas}
                    </TableCell>
                    <TableCell>{estadoChip(v.estado)}</TableCell>
                  </TableRow>
                ))}
                {viajesEnCurso.length + viajesPlanificados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
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
  <Grid item xs={12} sm={6} md={4} lg={2.4}>
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
          <Box>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 32 }}>{icon}</Box>
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

export default TransporteDashboard;
