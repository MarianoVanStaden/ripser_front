import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Rating,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Divider,
  Stack,
  CircularProgress,
  Grid,
  
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  StarRate as StarRateIcon,
  
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { supplierApiWithFallback } from '../../api/services/apiWithFallback';
import evaluacionProveedorApi, { CriterioEvaluacion } from '../../api/services/evaluacionProveedorApi';
import type {
  EvaluacionProveedorDTO,
  EvaluacionCreateDTO,
  EstadisticasEvaluacionDTO,
} from '../../api/services/evaluacionProveedorApi';
import type { ProveedorDTO } from '../../types';


const EvaluacionDesempenoPage = () => {
  const [suppliers, setSuppliers] = useState<ProveedorDTO[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionProveedorDTO[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasEvaluacionDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<EvaluacionCreateDTO>({
    proveedorId: 0,
    calificacion: 0,
    comentario: '',
    criterio: CriterioEvaluacion.CALIDAD,
    evaluadoPor: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Helper to get evaluations for the selected supplier (typed)
  const getSupplierEvaluations = (supplierId: number | ''): EvaluacionProveedorDTO[] => {
    if (!supplierId) return [];
    // Ensure evaluaciones is always an array
    if (!Array.isArray(evaluaciones)) {
      console.error('evaluaciones is not an array:', evaluaciones);
      return [];
    }
    return evaluaciones.filter((e) => e.proveedorId === Number(supplierId));
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      loadEvaluaciones();
      loadEstadisticas();
    }
  }, [selectedSupplier]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierApiWithFallback.getAll();
      console.log('Proveedores cargados:', data);
      // API returns ProveedorDTO[]
      setSuppliers(data as ProveedorDTO[]);
      if (data.length > 0) {
        setSelectedSupplier(data[0].id || '');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluaciones = async () => {
    if (!selectedSupplier) return;
    
    try {
      setLoading(true);
      const data = await evaluacionProveedorApi.obtenerPorProveedor(Number(selectedSupplier));
      console.log('Evaluaciones cargadas:', data);
      // Ensure data is an array
      setEvaluaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading evaluaciones:', error);
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    if (!selectedSupplier) return;
    
    try {
      const data = await evaluacionProveedorApi.obtenerEstadisticas(Number(selectedSupplier));
      setEstadisticas(data);
    } catch (error) {
      console.error('Error loading estadísticas:', error);
      // Si no hay evaluaciones, las estadísticas pueden fallar
      setEstadisticas(null);
    }
  };


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewEvaluation = () => {
    setFormData({
      proveedorId: Number(selectedSupplier),
      calificacion: 0,
      comentario: '',
      criterio: CriterioEvaluacion.CALIDAD,
      evaluadoPor: '',
    });
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleSaveEvaluation = async () => {
    try {
      if (editingId) {
        // La API no tiene endpoint de actualización, así que eliminamos y creamos
        await evaluacionProveedorApi.eliminar(editingId);
      }
      
      await evaluacionProveedorApi.crear(formData);
      
      // Recargar evaluaciones y estadísticas
      await loadEvaluaciones();
      await loadEstadisticas();
      
      setDialogOpen(false);
      setFormData({
        proveedorId: Number(selectedSupplier),
        calificacion: 0,
        comentario: '',
        criterio: CriterioEvaluacion.CALIDAD,
        evaluadoPor: '',
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Error al guardar la evaluación');
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };


  const renderOverviewTab = () => {
    const supplierName = suppliers.find(s => s.id === selectedSupplier)?.razonSocial || 'este proveedor';
    
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (evaluaciones.length === 0) {
      return (
        <Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay evaluaciones disponibles para <strong>{supplierName}</strong>.
            <Button onClick={handleNewEvaluation} sx={{ ml: 1 }}>
              Crear primera evaluación
            </Button>
          </Alert>
        </Box>
      );
    }

    return (
      <Box>
        <Grid container spacing={3}>
          {/* Calificación General */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StarRateIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Calificación General</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h3" color="primary">
                    {estadisticas?.calificacionGeneral?.toFixed(2) || '0.00'}
                  </Typography>
                  <Rating value={estadisticas?.calificacionGeneral || 0} precision={0.1} readOnly max={5} />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Basado en {estadisticas?.totalEvaluaciones || 0} evaluación{estadisticas?.totalEvaluaciones !== 1 ? 'es' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Calificaciones por Criterio */}
          <Grid item xs={12} md={6} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Métricas por Criterio</Typography>
                <Stack spacing={2}>
                  {estadisticas?.calificacionesPorCriterio && Object.entries(estadisticas.calificacionesPorCriterio).map(([criterio, calificacion]) => (
                    <Box key={criterio}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">{criterio}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {calificacion.toFixed(2)}/5.00
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(calificacion / 5) * 100} 
                        color={getRatingColor(calificacion)}
                      />
                    </Box>
                  ))}
                  {(!estadisticas?.calificacionesPorCriterio || Object.keys(estadisticas.calificacionesPorCriterio).length === 0) && (
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      No hay datos disponibles
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Rango de Calificaciones */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Rango de Calificaciones</Typography>
                <Stack spacing={2}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp color="success" />
                      <Typography variant="body2">Máxima</Typography>
                    </Box>
                    <Typography variant="h5" color="success.main">
                      {estadisticas?.calificacionMaxima?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingDown color="error" />
                      <Typography variant="body2">Mínima</Typography>
                    </Box>
                    <Typography variant="h5" color="error.main">
                      {estadisticas?.calificacionMinima?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
                        

  const renderEvaluationsTab = () => {
    const supplierEvals = getSupplierEvaluations(selectedSupplier);

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Evaluaciones del Proveedor</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewEvaluation}
          >
            Nueva Evaluación
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Evaluado por</TableCell>
                <TableCell>Calificación</TableCell>
                <TableCell>Criterio</TableCell>
                <TableCell>Comentario</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierEvals.map((evaluation) => (
                <TableRow key={evaluation.id}>
                    <TableCell>
                      {new Date(evaluation.fechaEvaluacion).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{evaluation.evaluadoPor}</TableCell>
                    <TableCell>{evaluation.calificacion.toFixed(2)}</TableCell>
                    <TableCell>{evaluation.criterio}</TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">{evaluation.comentario || '-'}</Typography>
                    </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFormData({
                          proveedorId: evaluation.proveedorId,
                          calificacion: evaluation.calificacion,
                          comentario: evaluation.comentario || '',
                          criterio: evaluation.criterio,
                          evaluadoPor: evaluation.evaluadoPor,
                        });
                        setEditingId(evaluation.id);
                        setDialogOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {supplierEvals.length === 0 && (
          <Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              No hay evaluaciones disponibles para este proveedor. 
              <Button onClick={handleNewEvaluation} sx={{ ml: 1 }}>
                Crear primera evaluación
              </Button>
            </Alert>
          </Box>
        )}
      </Box>
    );
  };

  const renderHistoryTab = () => {
    const supplierEvals = getSupplierEvaluations(selectedSupplier);
    
    const historyData = supplierEvals.map((evaluation, index) => ({
      period: new Date(evaluation.fechaEvaluacion).toLocaleDateString(),
      overall: evaluation.calificacion,
      trend: index > 0 ? evaluation.calificacion - supplierEvals[index - 1].calificacion : 0
    }));

    return (
      <Box>
        <Typography variant="h6" mb={3}>Historial de Desempeño</Typography>
        
        {historyData.length === 0 ? (
          <Alert severity="info">
            No hay datos históricos disponibles para este proveedor.
          </Alert>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Tendencia de Calificaciones</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Período</TableCell>
                      <TableCell align="center">Calificación</TableCell>
                      <TableCell align="center">Tendencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.map((data, index) => (
                      <TableRow key={index}>
                        <TableCell>{data.period}</TableCell>
                        <TableCell align="center">
                          <Typography fontWeight="bold" color={getRatingColor(data.overall) + '.main'}>
                            {data.overall.toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {data.trend !== 0 && (
                            <Box display="flex" alignItems="center" justifyContent="center">
                              {data.trend > 0 ? '↗️' : '↘️'}
                              <Typography 
                                variant="body2" 
                                color={data.trend > 0 ? 'success.main' : 'error.main'}
                                ml={0.5}
                              >
                                {Math.abs(data.trend).toFixed(1)}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Evaluación de Desempeño de Proveedores</Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>✓ Módulo conectado al backend</strong> - Las evaluaciones se almacenan en la base de datos del servidor.
        </Typography>
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <Box sx={{ minWidth: 300, flex: '1 1 auto' }}>
              <FormControl fullWidth>
                <InputLabel id="supplier-select-label">Seleccionar Proveedor</InputLabel>
                <Select
                  labelId="supplier-select-label"
                  value={selectedSupplier}
                  onChange={(e) => {
                    const val = e.target.value as string | number;
                    setSelectedSupplier(val === '' ? '' : Number(val));
                  }}
                  label="Seleccionar Proveedor"
                >
                  {suppliers.length === 0 ? (
                    <MenuItem value="" disabled>
                      No hay proveedores disponibles
                    </MenuItem>
                  ) : (
                    suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id || ''}>
                        {supplier.razonSocial || 'Sin nombre'}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Box>
            {suppliers.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Proveedor seleccionado: {suppliers.find(s => s.id === selectedSupplier)?.razonSocial || 'N/A'}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Resumen" />
            <Tab label="Evaluaciones" />
            <Tab label="Historial" />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          {tabValue === 0 && renderOverviewTab()}
          {tabValue === 1 && renderEvaluationsTab()}
          {tabValue === 2 && renderHistoryTab()}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Editar Evaluación' : 'Nueva Evaluación'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Evaluado por"
                value={formData.evaluadoPor}
                onChange={(e) => setFormData({
                  ...formData,
                  evaluadoPor: e.target.value
                })}
                required
              />

              <FormControl fullWidth required>
                <InputLabel>Criterio</InputLabel>
                <Select
                  value={formData.criterio}
                  label="Criterio"
                  onChange={(e) => setFormData({
                    ...formData,
                    criterio: e.target.value as CriterioEvaluacion
                  })}
                >
                  <MenuItem value={CriterioEvaluacion.CALIDAD}>Calidad</MenuItem>
                  <MenuItem value={CriterioEvaluacion.PUNTUALIDAD}>Puntualidad</MenuItem>
                  <MenuItem value={CriterioEvaluacion.PRECIO}>Precio</MenuItem>
                  <MenuItem value={CriterioEvaluacion.SERVICIO}>Servicio</MenuItem>
                  <MenuItem value={CriterioEvaluacion.COMUNICACION}>Comunicación</MenuItem>
                  <MenuItem value={CriterioEvaluacion.FLEXIBILIDAD}>Flexibilidad</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="body2" mb={1}>
                  Calificación (0-5): {formData.calificacion.toFixed(1)}
                </Typography>
                <Rating
                  value={formData.calificacion}
                  onChange={(_event, newValue) => {
                    setFormData({
                      ...formData,
                      calificacion: newValue || 0
                    });
                  }}
                  precision={0.5}
                  max={5}
                  size="large"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comentario (opcional)"
                value={formData.comentario}
                onChange={(e) => setFormData({
                  ...formData,
                  comentario: e.target.value
                })}
                inputProps={{ maxLength: 1000 }}
                helperText={`${formData.comentario?.length || 0}/1000 caracteres`}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEvaluation}
            disabled={!formData.evaluadoPor || formData.calificacion === 0}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvaluacionDesempenoPage;
