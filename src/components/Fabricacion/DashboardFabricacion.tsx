import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Card, CardContent, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Stack, TextField,
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle,
  Cancel,
  Inventory,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import LoadingOverlay from '../common/LoadingOverlay';

interface KPI {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const DashboardFabricacion: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState(
    dayjs().subtract(30, 'days').format('YYYY-MM-DD')
  );
  const [fechaFin, setFechaFin] = useState(dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const equiposRes = await equipoFabricadoApi.findAll({ page: 0, size: 1000 });

      const equiposData = equiposRes.content || [];

      setEquipos(equiposData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs
  const totalEquipos = equipos.length;
  const enProceso = equipos.filter((e) => e.estado === 'EN_PROCESO').length;
  const completados = equipos.filter((e) => e.estado === 'COMPLETADO').length;
  const cancelados = equipos.filter((e) => e.estado === 'CANCELADO').length;

  const kpis: KPI[] = [
    {
      label: 'Total Equipos',
      value: totalEquipos,
      icon: <Inventory fontSize="large" />,
      color: '#2196f3',
    },
    {
      label: 'En Proceso',
      value: enProceso,
      icon: <BuildIcon fontSize="large" />,
      color: '#ff9800',
    },
    {
      label: 'Completados',
      value: completados,
      icon: <CheckCircle fontSize="large" />,
      color: '#4caf50',
    },
    {
      label: 'Cancelados',
      value: cancelados,
      icon: <Cancel fontSize="large" />,
      color: '#f44336',
    },
  ];

  // Agrupar equipos por tipo
  const equiposPorTipo = equipos.reduce((acc: any, eq) => {
    acc[eq.tipo] = (acc[eq.tipo] || 0) + 1;
    return acc;
  }, {});

  // Equipos recientes (últimos 10)
  const equiposRecientes = [...equipos]
    .sort((a, b) => dayjs(b.fechaCreacion).diff(dayjs(a.fechaCreacion)))
    .slice(0, 10);

  // Modelos más usados (ya que no hay recetas asignadas)
  // Primero intentamos agrupar por receta, si no hay, agrupamos por modelo
  const equiposConReceta = equipos.filter((e) => e.recetaId);
  
  let modelosUsados: any = {};
  
  if (equiposConReceta.length > 0) {
    // Si hay equipos con receta, agrupar por receta
    modelosUsados = equiposConReceta.reduce((acc: any, eq) => {
      const key = eq.recetaId;
      if (!acc[key]) {
        acc[key] = { 
          count: 0, 
          nombre: eq.recetaNombre || eq.modelo,
          codigo: eq.recetaCodigo || 'N/A'
        };
      }
      acc[key].count++;
      return acc;
    }, {});
  } else {
    // Si no hay recetas, agrupar por modelo + tipo
    modelosUsados = equipos.reduce((acc: any, eq) => {
      const key = `${eq.tipo}-${eq.modelo}`;
      if (!acc[key]) {
        acc[key] = { 
          count: 0, 
          nombre: eq.modelo || 'Sin modelo',
          codigo: eq.tipo || 'N/A'
        };
      }
      acc[key].count++;
      return acc;
    }, {});
  }

  const recetasOrdenadas = Object.entries(modelosUsados)
    .sort(([, a]: any, [, b]: any) => b.count - a.count)
    .slice(0, 5);

  return (
    <Box p={3}>
      <LoadingOverlay open={loading} message="Cargando dashboard de fabricación..." />
      <Typography variant="h5" fontWeight="600" mb={3}>
        Dashboard de Fabricación
      </Typography>

      {/* KPIs */}
      <Grid container spacing={3} mb={3}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h4" fontWeight="600">
                      {kpi.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos y Tablas */}
      <Grid container spacing={3}>
        {/* Equipos por Tipo */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Equipos por Tipo
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(equiposPorTipo).map(([tipo, cantidad]: any) => (
                    <TableRow key={tipo}>
                      <TableCell>
                        <Chip label={tipo} color="primary" size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="500">{cantidad}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recetas/Modelos Más Usados */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {equiposConReceta.length > 0 ? 'Recetas Más Usadas' : 'Modelos Más Fabricados'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{equiposConReceta.length > 0 ? 'Receta' : 'Modelo'}</TableCell>
                    <TableCell>{equiposConReceta.length > 0 ? 'Código' : 'Tipo'}</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recetasOrdenadas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No hay datos disponibles
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recetasOrdenadas.map(([id, data]: any) => (
                      <TableRow key={id}>
                        <TableCell>{data.nombre || 'N/A'}</TableCell>
                        <TableCell>{data.codigo || 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Chip label={data.count} color="success" size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Equipos Recientes */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Equipos Recientes</Typography>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  size="small"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Fecha Fin"
                  type="date"
                  size="small"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Stack>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equiposRecientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No hay equipos disponibles
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    equiposRecientes.map((equipo) => (
                      <TableRow key={equipo.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {equipo.numeroHeladera}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={equipo.tipo} color="primary" size="small" />
                        </TableCell>
                        <TableCell>{equipo.modelo}</TableCell>
                        <TableCell>
                          <Chip
                            label={equipo.estado.replace('_', ' ')}
                            color={
                              equipo.estado === 'COMPLETADO'
                                ? 'success'
                                : equipo.estado === 'CANCELADO'
                                ? 'error'
                                : 'info'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{equipo.clienteNombre || '-'}</TableCell>
                        <TableCell>
                          {dayjs(equipo.fechaCreacion).format('DD/MM/YYYY')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardFabricacion;
