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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  StarRate as StarRateIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { supplierApiWithFallback } from '../../api/services/apiWithFallback';
import type { Supplier } from '../../types';

interface SupplierEvaluation {
  id: string;
  supplierId: string;
  evaluationDate: string;
  evaluatedBy: string;
  qualityRating: number;
  deliveryRating: number;
  communicationRating: number;
  pricingRating: number;
  serviceRating: number;
  overallRating: number;
  strengths: string[];
  improvements: string[];
  comments: string;
}

const EvaluacionDesempenoPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [evaluations, setEvaluations] = useState<SupplierEvaluation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<SupplierEvaluation | null>(null);

  // Mock data
  const mockEvaluations: SupplierEvaluation[] = [
    {
      id: '1',
      supplierId: '1',
      evaluationDate: '2024-01-15',
      evaluatedBy: 'Ana García',
      qualityRating: 4.5,
      deliveryRating: 4.0,
      communicationRating: 4.2,
      pricingRating: 3.8,
      serviceRating: 4.3,
      overallRating: 4.1,
      strengths: ['Productos de alta calidad', 'Comunicación efectiva'],
      improvements: ['Mejorar precios competitivos'],
      comments: 'Proveedor confiable con productos de calidad consistente.',
    },
    {
      id: '2',
      supplierId: '2',
      evaluationDate: '2024-01-20',
      evaluatedBy: 'Carlos Ruiz',
      qualityRating: 3.5,
      deliveryRating: 3.2,
      communicationRating: 3.8,
      pricingRating: 4.5,
      serviceRating: 3.6,
      overallRating: 3.7,
      strengths: ['Precios competitivos'],
      improvements: ['Mejorar calidad del producto'],
      comments: 'Buen proveedor para productos básicos.',
    }
  ];

  useEffect(() => {
    loadSuppliers();
    setEvaluations(mockEvaluations);
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierApiWithFallback.getAll();
      setSuppliers(data);
      if (data.length > 0) {
        setSelectedSupplier(data[0].id?.toString() || '1');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierEvaluations = (supplierId: string) => {
    return evaluations.filter(evaluation => evaluation.supplierId === supplierId);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewEvaluation = () => {
    setCurrentEvaluation({
      id: '',
      supplierId: selectedSupplier,
      evaluationDate: new Date().toISOString().split('T')[0],
      evaluatedBy: '',
      qualityRating: 0,
      deliveryRating: 0,
      communicationRating: 0,
      pricingRating: 0,
      serviceRating: 0,
      overallRating: 0,
      strengths: [],
      improvements: [],
      comments: '',
    });
    setDialogOpen(true);
  };

  const handleSaveEvaluation = () => {
    if (currentEvaluation) {
      const overallRating = (
        currentEvaluation.qualityRating +
        currentEvaluation.deliveryRating +
        currentEvaluation.communicationRating +
        currentEvaluation.pricingRating +
        currentEvaluation.serviceRating
      ) / 5;

      const updatedEvaluation = {
        ...currentEvaluation,
        overallRating,
        id: currentEvaluation.id || Date.now().toString(),
      };

      if (currentEvaluation.id) {
        setEvaluations(prev => prev.map(evaluation => 
          evaluation.id === currentEvaluation.id ? updatedEvaluation : evaluation
        ));
      } else {
        setEvaluations(prev => [...prev, updatedEvaluation]);
      }
    }
    setDialogOpen(false);
    setCurrentEvaluation(null);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 4) return <CheckCircleIcon color="success" />;
    if (rating >= 3) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const renderOverviewTab = () => {
    const supplierEvals = getSupplierEvaluations(selectedSupplier);
    if (supplierEvals.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay evaluaciones disponibles para este proveedor.
        </Alert>
      );
    }

    const avgRating = supplierEvals.reduce((sum, evaluation) => sum + evaluation.overallRating, 0) / supplierEvals.length;

    return (
      <Box>
        <Box display="flex" flexWrap="wrap" gap={3}>
          <Box sx={{ minWidth: 250, flex: '1 1 300px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StarRateIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Calificación General</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="h3" color="primary">
                    {avgRating.toFixed(1)}
                  </Typography>
                  <Rating value={avgRating} precision={0.1} readOnly />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Basado en {supplierEvals.length} evaluación{supplierEvals.length !== 1 ? 'es' : ''}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ minWidth: 400, flex: '2 1 500px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Métricas de Desempeño</Typography>
                <Stack spacing={2}>
                  {supplierEvals.length > 0 && (
                    [
                      { label: 'Calidad', value: avgRating },
                      { label: 'Entrega', value: avgRating },
                      { label: 'Comunicación', value: avgRating },
                      { label: 'Precios', value: avgRating },
                      { label: 'Servicio', value: avgRating }
                    ].map((metric) => (
                      <Box key={metric.label}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{metric.label}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {metric.value.toFixed(1)}/5
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(metric.value / 5) * 100}
                          color={getRatingColor(metric.value) as any}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
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
                <TableCell>Calidad</TableCell>
                <TableCell>Entrega</TableCell>
                <TableCell>General</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierEvals.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>
                    {new Date(evaluation.evaluationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{evaluation.evaluatedBy}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getRatingIcon(evaluation.qualityRating)}
                      {evaluation.qualityRating.toFixed(1)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getRatingIcon(evaluation.deliveryRating)}
                      {evaluation.deliveryRating.toFixed(1)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getRatingIcon(evaluation.overallRating)}
                      <Typography fontWeight="bold">
                        {evaluation.overallRating.toFixed(1)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCurrentEvaluation(evaluation);
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
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay evaluaciones disponibles para este proveedor. 
            <Button onClick={handleNewEvaluation} sx={{ ml: 1 }}>
              Crear primera evaluación
            </Button>
          </Alert>
        )}
      </Box>
    );
  };

  const renderHistoryTab = () => {
    const supplierEvals = getSupplierEvaluations(selectedSupplier);
    
    const historyData = supplierEvals.map((evaluation, index) => ({
      period: new Date(evaluation.evaluationDate).toLocaleDateString(),
      overall: evaluation.overallRating,
      trend: index > 0 ? evaluation.overallRating - supplierEvals[index - 1].overallRating : 0
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <Box sx={{ minWidth: 300, flex: '1 1 auto' }}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Proveedor</InputLabel>
                <Select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  label="Seleccionar Proveedor"
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id?.toString() || ''}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
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
          {currentEvaluation?.id ? 'Editar Evaluación' : 'Nueva Evaluación'}
        </DialogTitle>
        <DialogContent>
          {currentEvaluation && (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={2} sx={{ mt: 1 }}>
                <Box sx={{ minWidth: 250, flex: '1 1 auto' }}>
                  <TextField
                    fullWidth
                    label="Evaluado por"
                    value={currentEvaluation.evaluatedBy}
                    onChange={(e) => setCurrentEvaluation({
                      ...currentEvaluation,
                      evaluatedBy: e.target.value
                    })}
                  />
                </Box>
                <Box sx={{ minWidth: 250, flex: '1 1 auto' }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Evaluación"
                    value={currentEvaluation.evaluationDate}
                    onChange={(e) => setCurrentEvaluation({
                      ...currentEvaluation,
                      evaluationDate: e.target.value
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              <Typography variant="h6" mt={2} mb={2}>Calificaciones</Typography>
              
              <Box display="flex" flexWrap="wrap" gap={2}>
                {[
                  { key: 'qualityRating', label: 'Calidad' },
                  { key: 'deliveryRating', label: 'Entrega' },
                  { key: 'communicationRating', label: 'Comunicación' },
                  { key: 'pricingRating', label: 'Precios' },
                  { key: 'serviceRating', label: 'Servicio' }
                ].map((field) => (
                  <Box key={field.key} sx={{ minWidth: 200, flex: '1 1 auto' }}>
                    <Box>
                      <Typography variant="body2" mb={1}>{field.label}</Typography>
                      <Rating
                        value={currentEvaluation[field.key as keyof SupplierEvaluation] as number}
                        onChange={(_event, newValue) => {
                          setCurrentEvaluation({
                            ...currentEvaluation,
                            [field.key]: newValue || 0
                          });
                        }}
                        precision={0.5}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Comentarios"
                  value={currentEvaluation.comments}
                  onChange={(e) => setCurrentEvaluation({
                    ...currentEvaluation,
                    comments: e.target.value
                  })}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEvaluation}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvaluacionDesempenoPage;
