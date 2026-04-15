import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress,
  TextField, MenuItem, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Inventory, Assignment, CheckCircle, LocalShipping,
  TrendingUp, PieChart as PieChartIcon, GetApp as GetAppIcon,
} from '@mui/icons-material';
import { generateReportesEstadosPDF, captureElementAsImage } from '../../utils/pdfExportUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';
import api from '../../api/config';
import type { EquipoFabricadoDTO, EstadoAsignacionEquipo } from '../../types';

interface EstadisticasEstados {
  DISPONIBLE: number;
  RESERVADO: number;
  FACTURADO: number;
  EN_TRANSITO: number;
  ENTREGADO: number;
  PENDIENTE_TERMINACION: number;
  total: number;
}


const ReportesEstadosPage: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasEstados>({
    DISPONIBLE: 0,
    RESERVADO: 0,
    FACTURADO: 0,
    EN_TRANSITO: 0,
    ENTREGADO: 0,
    PENDIENTE_TERMINACION: 0,
    total: 0,
  });
  const [equipos, setEquipos] = useState<EquipoFabricadoDTO[]>([]);
  const [filteredEquipos, setFilteredEquipos] = useState<EquipoFabricadoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoAsignacionEquipo | 'TODOS'>('TODOS');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [filtroModelo, setFiltroModelo] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [equipos, filtroEstado, filtroTipo, filtroModelo, fechaDesde, fechaHasta]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/equipos-fabricados', {
        params: {
          page: 0,
          size: 10000,
        },
      });
      
      const equiposData = response.data.content || [];
      setEquipos(equiposData);
      
      console.log('📊 Total equipos cargados:', equiposData.length);
      console.log('📊 Primer equipo (muestra):', equiposData[0]);
      
      // Calcular estadísticas basadas en estado y asignación
      const stats: EstadisticasEstados = {
        DISPONIBLE: 0,   // Completado y no asignado
        RESERVADO: 0,    // Asignado en nota de pedido
        FACTURADO: 0,    // Incluido en factura
        EN_TRANSITO: 0,  // En viaje hacia el cliente
        ENTREGADO: 0,    // Entregado al cliente
        total: equiposData.length,
      };

      equiposData.forEach((equipo: EquipoFabricadoDTO) => {
        // Si tiene estadoAsignacion explícito (versión completa del DTO)
        if (equipo.estadoAsignacion) {
          stats[equipo.estadoAsignacion]++;
        } else {
          // Inferir estado de asignación basado en estado y flag asignado
          if (equipo.estado === 'COMPLETADO') {
            if (equipo.asignado) {
              stats.ENTREGADO++;
            } else {
              stats.DISPONIBLE++;
            }
          }
          // Los equipos EN_PROCESO o CANCELADO no cuentan para estados de asignación
        }
      });

      console.log('📊 Estadísticas calculadas:', stats);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...equipos];

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      filtered = filtered.filter(e => e.estadoAsignacion === filtroEstado);
    }

    // Filtro por tipo
    if (filtroTipo !== 'TODOS') {
      filtered = filtered.filter(e => e.tipo === filtroTipo);
    }

    // Filtro por modelo
    if (filtroModelo) {
      filtered = filtered.filter(e => 
        e.modelo.toLowerCase().includes(filtroModelo.toLowerCase())
      );
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      filtered = filtered.filter(e => 
        dayjs(e.fechaCreacion).isAfter(dayjs(fechaDesde)) || 
        dayjs(e.fechaCreacion).isSame(dayjs(fechaDesde), 'day')
      );
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      filtered = filtered.filter(e => 
        dayjs(e.fechaCreacion).isBefore(dayjs(fechaHasta)) || 
        dayjs(e.fechaCreacion).isSame(dayjs(fechaHasta), 'day')
      );
    }

    setFilteredEquipos(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFiltroEstado('TODOS');
    setFiltroTipo('TODOS');
    setFiltroModelo('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const getEstadoColor = (estado: EstadoAsignacionEquipo) => {
    switch (estado) {
      case 'ENTREGADO': return 'success';
      case 'FACTURADO': return 'primary';
      case 'RESERVADO': return 'warning';
      case 'DISPONIBLE': return 'default';
      default: return 'default';
    }
  };

  const getEstadoIcon = (estado: EstadoAsignacionEquipo) => {
    switch (estado) {
      case 'ENTREGADO': return <LocalShipping />;
      case 'FACTURADO': return <CheckCircle />;
      case 'RESERVADO': return <Assignment />;
      case 'DISPONIBLE': return <Inventory />;
      default: return <Inventory />;
    }
  };

  // Datos para gráficos - Filtrar solo valores > 0 para mejor visualización
  const pieChartData = [
    { name: 'Disponible', value: estadisticas.DISPONIBLE, color: '#9e9e9e' },
    { name: 'Reservado', value: estadisticas.RESERVADO, color: '#ff9800' },
    { name: 'Facturado', value: estadisticas.FACTURADO, color: '#2196f3' },
    { name: 'En Tránsito', value: estadisticas.EN_TRANSITO, color: '#9c27b0' },
    { name: 'Entregado', value: estadisticas.ENTREGADO, color: '#4caf50' },
  ].filter(item => item.value > 0);

  const barChartData = [
    { estado: 'Disponible', cantidad: estadisticas.DISPONIBLE },
    { estado: 'Reservado', cantidad: estadisticas.RESERVADO },
    { estado: 'Facturado', cantidad: estadisticas.FACTURADO },
    { estado: 'En Tránsito', cantidad: estadisticas.EN_TRANSITO },
    { estado: 'Entregado', cantidad: estadisticas.ENTREGADO },
  ];

  const hasAsignacionData = estadisticas.total > 0 && 
    (estadisticas.DISPONIBLE > 0 || estadisticas.RESERVADO > 0 || 
     estadisticas.FACTURADO > 0 || estadisticas.EN_TRANSITO > 0 || estadisticas.ENTREGADO > 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const handleExportPDF = async () => {
    try {
      const [pieImg, barImg] = await Promise.all([
        captureElementAsImage('estados-pie-chart'),
        captureElementAsImage('estados-bar-chart'),
      ]);
      await generateReportesEstadosPDF(
        estadisticas,
        filteredEquipos,
        { estado: filtroEstado, tipo: filtroTipo, modelo: filtroModelo, fechaDesde, fechaHasta },
        { pieChartImgData: pieImg, barChartImgData: barImg }
      );
    } catch (err) {
      console.error('Error al generar PDF:', err);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="600">
          Dashboard de Estados de Equipos
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={loadData}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleExportPDF}>
            Exportar PDF
          </Button>
        </Box>
      </Box>

      {/* Cards de resumen */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Equipos
                  </Typography>
                  <Typography variant="h4" fontWeight="600">
                    {estadisticas.total}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'grey.600' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Disponibles
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="grey.700">
                    {estadisticas.DISPONIBLE}
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 40, color: 'grey.600' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Reservados
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="warning.main">
                    {estadisticas.RESERVADO}
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Facturados
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="primary.main">
                    {estadisticas.FACTURADO}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    En Tránsito
                  </Typography>
                  <Typography variant="h4" fontWeight="600" sx={{ color: '#9c27b0' }}>
                    {estadisticas.EN_TRANSITO}
                  </Typography>
                </Box>
                <LocalShipping sx={{ fontSize: 40, color: '#9c27b0' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Entregados
                  </Typography>
                  <Typography variant="h4" fontWeight="600" color="success.main">
                    {estadisticas.ENTREGADO}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos de Estados de Asignación */}
      <Typography variant="h5" fontWeight="600" mb={2}>
        Estados de Asignación de Equipos
      </Typography>
      <Grid container spacing={3} mb={4}>
        {hasAsignacionData ? (
          <>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <PieChartIcon /> Distribución por Estado de Asignación
                  </Typography>
                  {pieChartData.length > 0 ? (
                    <div id="estados-pie-chart" style={{ background: '#fff' }}>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                      <Typography color="text.secondary">
                        No hay datos de estados de asignación disponibles
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cantidad por Estado de Asignación
                  </Typography>
                  <div id="estados-bar-chart" style={{ background: '#fff' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="estado" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={4}>
                  <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No hay equipos con estados de asignación
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Los gráficos de asignación aparecerán cuando los equipos tengan estados asignados
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  label="Estado"
                  onChange={(e) => setFiltroEstado(e.target.value as any)}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="DISPONIBLE">Disponible</MenuItem>
                  <MenuItem value="RESERVADO">Reservado</MenuItem>
                  <MenuItem value="FACTURADO">Facturado</MenuItem>
                  <MenuItem value="EN_TRANSITO">En Tránsito</MenuItem>
                  <MenuItem value="ENTREGADO">Entregado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filtroTipo}
                  label="Tipo"
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <MenuItem value="TODOS">Todos</MenuItem>
                  <MenuItem value="HELADERA">Heladera</MenuItem>
                  <MenuItem value="COOLBOX">Coolbox</MenuItem>
                  <MenuItem value="EXHIBIDOR">Exhibidor</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Modelo"
                value={filtroModelo}
                onChange={(e) => setFiltroModelo(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Desde"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                size="small"
                label="Hasta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button variant="outlined" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de equipos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Lista de Equipos ({filteredEquipos.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>N° Heladera</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Estado Asignación</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEquipos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((equipo) => (
                    <TableRow key={equipo.id} hover>
                      <TableCell>{equipo.numeroHeladera}</TableCell>
                      <TableCell>{equipo.tipo}</TableCell>
                      <TableCell>{equipo.modelo}</TableCell>
                      <TableCell>{equipo.color || '-'}</TableCell>
                      <TableCell>
                        {equipo.estadoAsignacion ? (
                          <Chip
                            label={equipo.estadoAsignacion}
                            color={getEstadoColor(equipo.estadoAsignacion)}
                            size="small"
                            icon={getEstadoIcon(equipo.estadoAsignacion)}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{equipo.clienteNombre || '-'}</TableCell>
                      <TableCell>
                        {dayjs(equipo.fechaCreacion).format('DD/MM/YYYY')}
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredEquipos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay equipos que coincidan con los filtros
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredEquipos.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportesEstadosPage;
