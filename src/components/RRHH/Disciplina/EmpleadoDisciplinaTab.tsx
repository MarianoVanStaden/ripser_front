import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Gavel as GavelIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { sancionApi } from '../../../api/services/sancionApi';
import {
  ESTADO_SANCION_COLOR,
  ESTADO_SANCION_LABEL,
  NIVEL_GRAVEDAD_COLOR,
  TIPO_SANCION_COLOR,
  TIPO_SANCION_LABEL,
  type SancionDTO,
  type SancionEmpleadoResumenDTO,
} from '../../../types/sancion.types';
import type { Empleado } from '../../../types';
import SancionFormDialog from './SancionFormDialog';
import SancionDetailDrawer from './SancionDetailDrawer';

interface EmpleadoDisciplinaTabProps {
  empleado: Empleado;
}

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
  hint?: string;
}> = ({ icon, label, value, color = 'primary.main', hint }) => (
  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: '100%' }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{
        width: 40, height: 40, borderRadius: 1.5,
        bgcolor: 'background.default', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Typography>
        <Typography variant="h6" fontWeight={700} lineHeight={1.1}>{value}</Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">{hint}</Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

const EmpleadoDisciplinaTab: React.FC<EmpleadoDisciplinaTabProps> = ({ empleado }) => {
  const [resumen, setResumen] = useState<SancionEmpleadoResumenDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SancionDTO | null>(null);
  const [drawerSancion, setDrawerSancion] = useState<SancionDTO | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sancionApi.getResumenEmpleado(empleado.id);
      setResumen(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo cargar el historial disciplinario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [empleado.id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !resumen) {
    return <Alert severity="error">{error ?? 'Sin datos'}</Alert>;
  }

  const motivosTop = Object.entries(resumen.motivosAcumulados ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Stack spacing={3}>
      {/* Header con score */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5, borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(25,118,210,0.08), rgba(25,118,210,0.02))',
          border: 1, borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between" spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <WarningIcon sx={{ color: `${NIVEL_GRAVEDAD_COLOR[resumen.nivelGravedad]}.main` }} />
              <Typography variant="h6" fontWeight={700}>
                Nivel de gravedad disciplinaria
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Score basado en sanciones de los últimos 12 meses ponderadas por gravedad.
            </Typography>
          </Box>
          <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.5}>
            <Chip
              label={resumen.nivelGravedad}
              color={NIVEL_GRAVEDAD_COLOR[resumen.nivelGravedad]}
              sx={{ fontWeight: 700, fontSize: '0.95rem' }}
            />
            <Typography variant="caption" color="text.secondary">
              Puntaje: <strong>{resumen.puntajeReincidencia}</strong>
            </Typography>
          </Stack>
        </Stack>
        <Box mt={1.5}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, resumen.puntajeReincidencia * 10)}
            color={NIVEL_GRAVEDAD_COLOR[resumen.nivelGravedad]}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      </Paper>

      {/* Métricas rápidas */}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <MetricCard
            icon={<GavelIcon />} label="Total sanciones"
            value={resumen.totalSanciones}
            hint={`${resumen.sancionesUltimos12Meses} en últimos 12m`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            icon={<AccessTimeIcon />} label="Días susp. totales"
            value={resumen.diasSuspensionTotales}
            hint={`${resumen.suspensiones} suspensión(es)`}
            color="error.main"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            icon={<TrendingUpIcon />} label="Última sanción"
            value={resumen.ultimaSancion ? dayjs(resumen.ultimaSancion).format('DD/MM/YYYY') : '—'}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <MetricCard
            icon={<WarningIcon />} label="Motivos distintos"
            value={Object.keys(resumen.motivosAcumulados ?? {}).length}
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Motivos frecuentes */}
      {motivosTop.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>
            MOTIVOS RECURRENTES
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {motivosTop.map(([motivo, count]) => (
              <Chip
                key={motivo}
                label={`${motivo} · ${count}`}
                color={count >= 3 ? 'error' : count >= 2 ? 'warning' : 'default'}
                variant={count >= 2 ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Timeline */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle2" fontWeight={700} color="primary">
            TIMELINE DE EVENTOS ({resumen.historial.length})
          </Typography>
          <Button
            size="small" startIcon={<AddIcon />} variant="contained"
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            Nueva sanción
          </Button>
        </Stack>

        {resumen.historial.length === 0 ? (
          <Alert severity="success" variant="outlined">
            Este empleado no registra sanciones disciplinarias.
          </Alert>
        ) : (
          <Stack spacing={0}>
            {resumen.historial.map((s, idx) => (
              <Box key={s.id}>
                <Stack direction="row" spacing={2} sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{
                      width: 12, height: 12, borderRadius: '50%',
                      bgcolor: `${TIPO_SANCION_COLOR[s.tipo]}.main`,
                      border: 2, borderColor: 'background.paper',
                      boxShadow: 1,
                    }} />
                    {idx < resumen.historial.length - 1 && (
                      <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.5 }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Typography variant="body2" fontWeight={600}>
                        {dayjs(s.fecha).format('DD/MM/YYYY')}
                      </Typography>
                      <Chip size="small" color={TIPO_SANCION_COLOR[s.tipo]} label={TIPO_SANCION_LABEL[s.tipo]} />
                      {s.dias > 0 && <Chip size="small" variant="outlined" label={`${s.dias} día(s)`} />}
                      <Chip size="small" variant="outlined"
                        color={ESTADO_SANCION_COLOR[s.estado]}
                        label={ESTADO_SANCION_LABEL[s.estado]} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {s.motivo}
                    </Typography>
                    {s.motivoAcumulado && (
                      <Typography variant="caption" color="text.secondary">
                        Motivo acumulado: <strong>{s.motivoAcumulado}</strong>
                        {s.pedidaPor ? ` · Pedida por ${s.pedidaPor}` : ''}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title="Ver detalle">
                    <IconButton size="small" onClick={() => setDrawerSancion(s)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {idx < resumen.historial.length - 1 && <Divider />}
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <SancionFormDialog
        open={formOpen}
        empleados={[empleado]}
        empleadoFijo={empleado}
        initial={editing}
        motivosAcumuladosSugeridos={Object.keys(resumen.motivosAcumulados ?? {})}
        onClose={() => setFormOpen(false)}
        onSubmit={async (dto) => {
          if (editing) await sancionApi.update(editing.id, dto);
          else await sancionApi.create(dto);
          await load();
        }}
      />

      <SancionDetailDrawer
        open={!!drawerSancion}
        sancion={drawerSancion}
        onClose={() => setDrawerSancion(null)}
        onEdit={(s) => { setEditing(s); setDrawerSancion(null); setFormOpen(true); }}
        onDelete={async (s) => {
          if (window.confirm('¿Eliminar la sanción?')) {
            await sancionApi.delete(s.id);
            setDrawerSancion(null);
            await load();
          }
        }}
      />
    </Stack>
  );
};

export default EmpleadoDisciplinaTab;
