import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import {
  AssignmentTurnedIn as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { garantiaApi, type GarantiaDTO } from '../../api/services/garantiaApi';
import { reclamoGarantiaApi, type ReclamoGarantiaDTO } from '../../api/services/reclamoGarantiaApi';

const GarantiaReportPage: React.FC = () => {
  const [garantias, setGarantias] = useState<GarantiaDTO[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoGarantiaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'30' | '90' | '180' | '365' | 'all'>('365');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [garantiasData, reclamosData] = await Promise.allSettled([
        garantiaApi.findAll(),
        reclamoGarantiaApi.findAll()
      ]);

      if (garantiasData.status === 'fulfilled') {
        setGarantias(Array.isArray(garantiasData.value) ? garantiasData.value : []);
      } else {
        console.error('Error loading garantias:', garantiasData.reason);
        setError('Error al cargar las garantías');
      }

      if (reclamosData.status === 'fulfilled') {
        setReclamos(Array.isArray(reclamosData.value) ? reclamosData.value : []);
      } else {
        console.error('Error loading reclamos:', reclamosData.reason);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Filter data by period
  const getFilteredGarantias = () => {
    if (periodFilter === 'all') return garantias;

    const daysAgo = parseInt(periodFilter);
    const cutoffDate = dayjs().subtract(daysAgo, 'day');

    return garantias.filter(g =>
      dayjs(g.fechaCompra).isAfter(cutoffDate)
    );
  };

  const filteredGarantias = getFilteredGarantias();

  // Calculate statistics
  const stats = {
    total: filteredGarantias.length,
    vigentes: filteredGarantias.filter(g => g.estado === 'VIGENTE').length,
    vencidas: filteredGarantias.filter(g => g.estado === 'VENCIDA').length,
    anuladas: filteredGarantias.filter(g => g.estado === 'ANULADA').length,
    porVencer: filteredGarantias.filter(g => {
      if (g.estado !== 'VIGENTE') return false;
      const diasRestantes = dayjs(g.fechaVencimiento).diff(dayjs(), 'day');
      return diasRestantes >= 0 && diasRestantes <= 30;
    }).length,
    totalReclamos: reclamos.length,
    reclamosPendientes: reclamos.filter(r => r.estado === 'PENDIENTE').length,
    reclamosEnProceso: reclamos.filter(r => r.estado === 'EN_PROCESO').length,
    reclamosResueltos: reclamos.filter(r => r.estado === 'RESUELTO').length,
    reclamosRechazados: reclamos.filter(r => r.estado === 'RECHAZADO').length,
  };

  // Calculate guarantee rate by model
  const garantiasByModel = filteredGarantias.reduce((acc, g) => {
    const modelo = g.equipoFabricadoModelo || 'Sin modelo';
    if (!acc[modelo]) {
      acc[modelo] = { total: 0, conReclamos: 0 };
    }
    acc[modelo].total++;
    if (reclamos.some(r => r.garantiaId === g.id)) {
      acc[modelo].conReclamos++;
    }
    return acc;
  }, {} as Record<string, { total: number; conReclamos: number }>);

  const modelStats = Object.entries(garantiasByModel)
    .map(([modelo, data]) => ({
      modelo,
      total: data.total,
      conReclamos: data.conReclamos,
      sinReclamos: data.total - data.conReclamos,
      tasaReclamos: ((data.conReclamos / data.total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Recent guarantees about to expire
  const garantiasPorVencer = filteredGarantias
    .filter(g => {
      if (g.estado !== 'VIGENTE') return false;
      const diasRestantes = dayjs(g.fechaVencimiento).diff(dayjs(), 'day');
      return diasRestantes >= 0 && diasRestantes <= 30;
    })
    .sort((a, b) => dayjs(a.fechaVencimiento).diff(dayjs(b.fechaVencimiento)))
    .slice(0, 10);

  // Recent claims
  const reclamosRecientes = reclamos
    .sort((a, b) => dayjs(b.fechaReclamo).diff(dayjs(a.fechaReclamo)))
    .slice(0, 10);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Reporte de Garantías
        </Typography>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={periodFilter}
            label="Período"
            onChange={(e) => setPeriodFilter(e.target.value as any)}
          >
            <MenuItem value="30">Últimos 30 días</MenuItem>
            <MenuItem value="90">Últimos 90 días</MenuItem>
            <MenuItem value="180">Últimos 6 meses</MenuItem>
            <MenuItem value="365">Último año</MenuItem>
            <MenuItem value="all">Todo el período</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Statistics Cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.50', borderLeft: '4px solid', borderColor: 'primary.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Garantías
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.vigentes}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vigentes
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.porVencer}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Por Vencer (30d)
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'error.50', borderLeft: '4px solid', borderColor: 'error.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CancelIcon sx={{ fontSize: 40, color: 'error.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.vencidas}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vencidas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Claims Statistics */}
      <Grid container spacing={2} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BuildIcon sx={{ fontSize: 40, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.totalReclamos}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Reclamos
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50', borderLeft: '4px solid', borderColor: 'warning.main', height: '100%' }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.reclamosPendientes}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Reclamos Pendientes
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.50', borderLeft: '4px solid', borderColor: 'info.main', height: '100%' }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {stats.reclamosEnProceso}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  En Proceso
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.50', borderLeft: '4px solid', borderColor: 'success.main', height: '100%' }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {stats.reclamosResueltos}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Resueltos
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Guarantees by Model */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Garantías por Modelo de Equipo
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Modelo</strong></TableCell>
                      <TableCell align="center"><strong>Total</strong></TableCell>
                      <TableCell align="center"><strong>Con Reclamos</strong></TableCell>
                      <TableCell align="center"><strong>Tasa %</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modelStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary" py={2}>
                            No hay datos disponibles
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      modelStats.map((stat, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500">
                              {stat.modelo}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={stat.total} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={stat.conReclamos}
                              size="small"
                              color={stat.conReclamos > 0 ? "warning" : "default"}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              fontWeight="600"
                              color={
                                parseFloat(stat.tasaReclamos) > 20 ? 'error.main' :
                                parseFloat(stat.tasaReclamos) > 10 ? 'warning.main' :
                                'success.main'
                              }
                            >
                              {stat.tasaReclamos}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Guarantees About to Expire */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Garantías por Vencer (Próximos 30 días)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>N° Serie</strong></TableCell>
                      <TableCell><strong>Modelo</strong></TableCell>
                      <TableCell align="center"><strong>Vencimiento</strong></TableCell>
                      <TableCell align="center"><strong>Días</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {garantiasPorVencer.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary" py={2}>
                            No hay garantías por vencer en los próximos 30 días
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      garantiasPorVencer.map((g) => {
                        const diasRestantes = dayjs(g.fechaVencimiento).diff(dayjs(), 'day');
                        return (
                          <TableRow key={g.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {g.numeroSerie}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {g.equipoFabricadoModelo || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {dayjs(g.fechaVencimiento).format('DD/MM/YYYY')}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${diasRestantes}d`}
                                size="small"
                                color={diasRestantes <= 7 ? 'error' : diasRestantes <= 15 ? 'warning' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Claims */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Reclamos Recientes (Últimos 10)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>N° Reclamo</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Garantía</strong></TableCell>
                      <TableCell><strong>Problema</strong></TableCell>
                      <TableCell align="center"><strong>Estado</strong></TableCell>
                      <TableCell><strong>Técnico</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reclamosRecientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="textSecondary" py={2}>
                            No hay reclamos registrados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reclamosRecientes.map((r) => {
                        const getEstadoColor = (estado: string) => {
                          switch (estado) {
                            case 'RESUELTO': return 'success';
                            case 'RECHAZADO': return 'error';
                            case 'EN_PROCESO': return 'info';
                            case 'PENDIENTE': return 'warning';
                            default: return 'default';
                          }
                        };

                        return (
                          <TableRow key={r.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {r.numeroReclamo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {dayjs(r.fechaReclamo).format('DD/MM/YYYY HH:mm')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {r.garantiaEquipoModelo || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                                {r.descripcionProblema}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={r.estado?.replace('_', ' ') || 'SIN ESTADO'}
                                color={getEstadoColor(r.estado)}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {r.tecnicoNombre && r.tecnicoApellido
                                  ? `${r.tecnicoNombre} ${r.tecnicoApellido}`
                                  : '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
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

export default GarantiaReportPage;
