import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Divider,
  CircularProgress, Alert, List, ListItemButton, ListItemText, Button,
} from '@mui/material';
import {
  AssignmentLate as AssignmentLateIcon,
  WarningAmber as WarningIcon,
  Build as BuildIcon,
  VerifiedUser as VerifiedUserIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import { garantiaApi, type GarantiaDTO } from '../../api/services/garantiaApi';
import { reclamoGarantiaApi, type ReclamoGarantiaDTO } from '../../api/services/reclamoGarantiaApi';
import { ordenServicioApi } from '../../api/services/ordenServicioApi';
import type { OrdenServicio } from '../../types';

const PROXIMO_VENCER_DIAS = 30;

const PostventaDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const verTaller = tienePermiso('TALLER');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [garantias, setGarantias] = useState<GarantiaDTO[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoGarantiaDTO[]>([]);
  const [ordenesAbiertas, setOrdenesAbiertas] = useState<OrdenServicio[]>([]);
  const [ordenesRetrasadas, setOrdenesRetrasadas] = useState<OrdenServicio[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verTaller]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const requests: Promise<unknown>[] = [
        garantiaApi.findAll({ page: 0, size: 1000 }),
        reclamoGarantiaApi.findAll({ page: 0, size: 1000 }),
      ];
      // Sólo pedimos datos de Taller si el usuario tiene acceso a ese módulo.
      if (verTaller) {
        requests.push(ordenServicioApi.getByEstado('PENDIENTE'));
        requests.push(ordenServicioApi.getByEstado('EN_PROCESO'));
        requests.push(ordenServicioApi.getRetrasadas());
      }

      const results = await Promise.allSettled(requests);

      const [garantiasRes, reclamosRes] = results;
      if (garantiasRes.status === 'fulfilled') {
        const v = garantiasRes.value as { content?: GarantiaDTO[] } | GarantiaDTO[];
        setGarantias(Array.isArray(v) ? v : v.content || []);
      }
      if (reclamosRes.status === 'fulfilled') {
        const v = reclamosRes.value as { content?: ReclamoGarantiaDTO[] } | ReclamoGarantiaDTO[];
        setReclamos(Array.isArray(v) ? v : v.content || []);
      }

      if (verTaller) {
        const [, , pendRes, procRes, retraRes] = results;
        const pend = pendRes?.status === 'fulfilled' ? (pendRes.value as OrdenServicio[]) : [];
        const proc = procRes?.status === 'fulfilled' ? (procRes.value as OrdenServicio[]) : [];
        setOrdenesAbiertas([...(pend || []), ...(proc || [])]);
        setOrdenesRetrasadas(retraRes?.status === 'fulfilled' ? (retraRes.value as OrdenServicio[]) : []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar el panel de postventa');
    } finally {
      setLoading(false);
    }
  };

  // ----- Derivados de garantías -----
  const garantiasVigentes = garantias.filter(g => g.estado === 'VIGENTE');
  const garantiasPorVencer = garantiasVigentes
    .map(g => ({ g, dias: dayjs(g.fechaVencimiento).diff(dayjs(), 'day') }))
    .filter(({ dias }) => dias >= 0 && dias <= PROXIMO_VENCER_DIAS)
    .sort((a, b) => a.dias - b.dias);
  const garantiasVencidas = garantias.filter(g => g.estado === 'VENCIDA').length;

  const reclamosPendientes = reclamos.filter(
    r => r.estado === 'PENDIENTE' || r.estado === 'EN_PROCESO'
  );

  const KpiCard = ({
    icon, value, label, color, onClick,
  }: { icon: React.ReactNode; value: number; label: string; color: string; onClick?: () => void }) => (
    <Card
      sx={{
        bgcolor: `${color}.50`,
        borderLeft: '4px solid',
        borderColor: `${color}.main`,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color: `${color}.main`, display: 'flex' }}>{icon}</Box>
          <Box>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Panel de Postventa
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            value={garantiasPorVencer.length}
            label={`Garantías por vencer (≤${PROXIMO_VENCER_DIAS} días)`}
            color="warning"
            onClick={() => navigate('/garantias/registro')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<VerifiedUserIcon sx={{ fontSize: 40 }} />}
            value={garantiasVencidas}
            label="Garantías vencidas"
            color="error"
            onClick={() => navigate('/garantias/registro')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            icon={<AssignmentLateIcon sx={{ fontSize: 40 }} />}
            value={reclamosPendientes.length}
            label="Reclamos pendientes"
            color="primary"
            onClick={() => navigate('/garantias/reclamos')}
          />
        </Grid>
        {verTaller && (
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              icon={<BuildIcon sx={{ fontSize: 40 }} />}
              value={ordenesRetrasadas.length}
              label="Órdenes retrasadas"
              color="error"
              onClick={() => navigate('/taller/ordenes')}
            />
          </Grid>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Garantías por vencer */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight="bold">Garantías por vencer</Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/garantias/registro')}>
                  Ver todas
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {garantiasPorVencer.length === 0 ? (
                <Typography variant="body2" color="textSecondary" py={2}>
                  No hay garantías próximas a vencer.
                </Typography>
              ) : (
                <List dense>
                  {garantiasPorVencer.slice(0, 8).map(({ g, dias }) => (
                    <ListItemButton key={g.id} onClick={() => navigate('/garantias/registro')}>
                      <ListItemText
                        primary={`${g.equipoFabricadoModelo || 'Equipo'} · N° ${g.numeroSerie}`}
                        secondary={
                          g.clienteNombre
                            ? `${g.clienteNombre} ${g.clienteApellido || ''}`.trim()
                            : undefined
                        }
                      />
                      <Chip
                        size="small"
                        label={`${dias} días`}
                        color={dias <= 7 ? 'error' : 'warning'}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Reclamos pendientes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight="bold">Reclamos abiertos</Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/garantias/reclamos')}>
                  Ver todos
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {reclamosPendientes.length === 0 ? (
                <Typography variant="body2" color="textSecondary" py={2}>
                  No hay reclamos abiertos.
                </Typography>
              ) : (
                <List dense>
                  {reclamosPendientes.slice(0, 8).map((r) => (
                    <ListItemButton key={r.id} onClick={() => navigate('/garantias/reclamos')}>
                      <ListItemText
                        primary={`${r.numeroReclamo} · ${r.garantiaEquipoModelo || r.garantiaNumeroSerie}`}
                        secondary={r.descripcionProblema}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                      <Chip
                        size="small"
                        label={r.estado}
                        color={r.estado === 'EN_PROCESO' ? 'info' : 'warning'}
                      />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Órdenes de servicio (sólo con acceso a Taller) */}
        {verTaller && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight="bold">
                    Órdenes de servicio abiertas ({ordenesAbiertas.length})
                  </Typography>
                  <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/taller/ordenes')}>
                    Ir al taller
                  </Button>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {ordenesAbiertas.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" py={2}>
                    No hay órdenes de servicio abiertas.
                  </Typography>
                ) : (
                  <List dense>
                    {ordenesAbiertas.slice(0, 10).map((o) => {
                      const retrasada = ordenesRetrasadas.some(r => r.id === o.id);
                      return (
                        <ListItemButton key={o.id} onClick={() => navigate('/taller/ordenes')}>
                          <ListItemText
                            primary={`${o.numeroOrden} · ${o.clienteNombre || ''}`}
                            secondary={
                              o.fechaEstimada
                                ? `Estimada: ${dayjs(o.fechaEstimada).format('DD/MM/YYYY')}`
                                : undefined
                            }
                          />
                          <Stack direction="row" spacing={1}>
                            {retrasada && <Chip size="small" label="Retrasada" color="error" />}
                            <Chip
                              size="small"
                              label={o.estado}
                              color={o.estado === 'EN_PROCESO' ? 'info' : 'warning'}
                            />
                          </Stack>
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PostventaDashboard;
