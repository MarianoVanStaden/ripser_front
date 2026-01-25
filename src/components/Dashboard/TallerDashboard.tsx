import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, Chip, LinearProgress, Stack, Divider, Alert } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EngineeringIcon from '@mui/icons-material/Engineering';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface TallerMetrics {
  ordenesActivas: number;
  ordenesPendientes: number;
  ordenesCompletadasHoy: number;
  ordenesCompletadasMes: number;
  materialesUsados: number;
  materialesBajos: number;
  tiempoPromedioReparacion: number;
  eficienciaDelMes: number;
}

interface OrdenServicio {
  id: number;
  numeroOrden: string;
  cliente: string;
  equipo: string;
  estado: string;
  prioridad: string;
  fechaIngreso: string;
  tecnicoAsignado?: string;
}

const TallerDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<TallerMetrics>({
    ordenesActivas: 0,
    ordenesPendientes: 0,
    ordenesCompletadasHoy: 0,
    ordenesCompletadasMes: 0,
    materialesUsados: 0,
    materialesBajos: 0,
    tiempoPromedioReparacion: 0,
    eficienciaDelMes: 0,
  });

  const [ordenesUrgentes, setOrdenesUrgentes] = useState<OrdenServicio[]>([]);

  useEffect(() => {
    fetchTallerMetrics();
  }, []);

  const fetchTallerMetrics = async () => {
    try {
      // TODO: Fetch real data from API
      // Ejemplo: const response = await tallerApi.getMetrics();
      
      // Datos de ejemplo
      setMetrics({
        ordenesActivas: 12,
        ordenesPendientes: 8,
        ordenesCompletadasHoy: 5,
        ordenesCompletadasMes: 87,
        materialesUsados: 45,
        materialesBajos: 3,
        tiempoPromedioReparacion: 3.5,
        eficienciaDelMes: 85,
      });

      setOrdenesUrgentes([
        {
          id: 1,
          numeroOrden: 'OS-2024-001',
          cliente: 'Juan Pérez',
          equipo: 'Equipo Industrial A',
          estado: 'EN_PROCESO',
          prioridad: 'ALTA',
          fechaIngreso: '2024-12-01',
          tecnicoAsignado: 'Carlos Gomez',
        },
        {
          id: 2,
          numeroOrden: 'OS-2024-002',
          cliente: 'María López',
          equipo: 'Sistema de Enfriamiento',
          estado: 'PENDIENTE',
          prioridad: 'URGENTE',
          fechaIngreso: '2024-12-01',
        },
        {
          id: 3,
          numeroOrden: 'OS-2024-003',
          cliente: 'Empresa XYZ',
          equipo: 'Motor Industrial',
          estado: 'EN_PROCESO',
          prioridad: 'ALTA',
          fechaIngreso: '2024-11-30',
          tecnicoAsignado: 'Roberto Silva',
        },
      ]);
    } catch (error) {
      console.error('Error fetching taller metrics:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'warning';
      case 'EN_PROCESO':
        return 'info';
      case 'COMPLETADO':
        return 'success';
      case 'CANCELADO':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'error';
      case 'ALTA':
        return 'warning';
      case 'MEDIA':
        return 'info';
      case 'BAJA':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 0, sm: 1 } }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
        }}
      >
        Dashboard de Taller
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                  }}
                >
                  <BuildIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.ordenesActivas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Órdenes Activas
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
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'warning.light',
                    color: 'warning.main',
                  }}
                >
                  <ScheduleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.ordenesPendientes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pendientes
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
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'success.light',
                    color: 'success.main',
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.ordenesCompletadasHoy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completadas Hoy
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
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'error.light',
                    color: 'error.main',
                  }}
                >
                  <WarningIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {metrics.materialesBajos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Materiales Bajos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {/* Órdenes Urgentes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              <AssignmentIcon color="primary" />
              Órdenes Prioritarias
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {ordenesUrgentes.length === 0 ? (
                <Alert severity="success">
                  No hay órdenes urgentes en este momento
                </Alert>
              ) : (
                ordenesUrgentes.map((orden) => (
                  <Card key={orden.id} variant="outlined">
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">
                            {orden.numeroOrden}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cliente: {orden.cliente}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Equipo: {orden.equipo}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Chip
                            label={orden.prioridad}
                            color={getPrioridadColor(orden.prioridad) as any}
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                          <Chip
                            label={orden.estado.replace('_', ' ')}
                            color={getEstadoColor(orden.estado) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Ingreso: {new Date(orden.fechaIngreso).toLocaleDateString()}
                        </Typography>
                        {orden.tecnicoAsignado && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <EngineeringIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {orden.tecnicoAsignado}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Indicadores de Rendimiento */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              <TrendingUpIcon color="primary" />
              Rendimiento del Mes
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Órdenes Completadas
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {metrics.ordenesCompletadasMes}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (metrics.ordenesCompletadasMes / 100) * 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Eficiencia del Taller
                  </Typography>
                  <Typography variant="body2" fontWeight="600">
                    {metrics.eficienciaDelMes}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metrics.eficienciaDelMes}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="success"
                />
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Estadísticas
                </Typography>
                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Tiempo Promedio</Typography>
                    <Chip label={`${metrics.tiempoPromedioReparacion} días`} size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Materiales Usados</Typography>
                    <Chip label={metrics.materialesUsados} size="small" color="primary" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">
                      <WarningIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Stock Bajo
                    </Typography>
                    <Chip 
                      label={metrics.materialesBajos} 
                      size="small" 
                      color={metrics.materialesBajos > 0 ? 'error' : 'success'} 
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Paper>

          {/* Alertas */}
          {metrics.materialesBajos > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight="600" gutterBottom>
                Atención requerida
              </Typography>
              <Typography variant="body2">
                Hay {metrics.materialesBajos} materiales con stock bajo. Revisar inventario.
              </Typography>
            </Alert>
          )}

          {metrics.ordenesPendientes > 10 && (
            <Alert severity="info">
              <Typography variant="body2" fontWeight="600" gutterBottom>
                Alta carga de trabajo
              </Typography>
              <Typography variant="body2">
                {metrics.ordenesPendientes} órdenes pendientes de asignación.
              </Typography>
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default TallerDashboard;
