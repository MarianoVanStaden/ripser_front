import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Chip,
  Rating,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
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
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  StarRate as StarRateIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { supplierApiWithFallback } from '../../api/services/apiWithFallback';
import type { Supplier } from '../../types';

interface PerformanceMetric {
  id: string;
  supplierId: string;
  period: string;
  qualityRating: number;
  deliveryRating: number;
  serviceRating: number;
  priceRating: number;
  overallRating: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  defectRate: number;
  responseTime: number;
  compliance: number;
  notes: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

interface PerformanceGoal {
  id: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
}

const EvaluacionDesempenoPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [evaluations, setEvaluations] = useState<PerformanceMetric[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<PerformanceMetric | null>(null);

  // Mock data for evaluations
  const mockEvaluations: PerformanceMetric[] = [
    {
      id: '1',
      supplierId: '1',
      period: '2024-Q4',
      qualityRating: 4.5,
      deliveryRating: 4.2,
      serviceRating: 4.8,
      priceRating: 3.9,
      overallRating: 4.35,
      onTimeDeliveries: 18,
      totalDeliveries: 20,
      defectRate: 2.1,
      responseTime: 4.5,
      compliance: 95.5,
      notes: 'Excelente calidad de productos, entregas puntuales',
      evaluatedBy: 'Juan Pérez',
      evaluatedAt: '2024-12-15',
    },
    {
      id: '2',
      supplierId: '1',
      period: '2024-Q3',
      qualityRating: 4.2,
      deliveryRating: 3.8,
      serviceRating: 4.5,
      priceRating: 4.1,
      overallRating: 4.15,
      onTimeDeliveries: 15,
      totalDeliveries: 18,
      defectRate: 3.2,
      responseTime: 6.2,
      compliance: 92.3,
      notes: 'Mejoras en atención al cliente, algunos retrasos menores',
      evaluatedBy: 'María García',
      evaluatedAt: '2024-09-30',
    }
  ];

  // Mock data for performance goals
  const mockGoals: PerformanceGoal[] = [
    {
      id: '1',
      metric: 'Entregas a Tiempo',
      target: 95,
      current: 90,
      unit: '%',
      priority: 'high',
    },
    {
      id: '2',
      metric: 'Tasa de Defectos',
      target: 2,
      current: 2.8,
      unit: '%',
      priority: 'medium',
    }
  ];

  useEffect(() => {
    loadSuppliers();
    setEvaluations(mockEvaluations);
    setGoals(mockGoals);
  }, [mockEvaluations, mockGoals]);

  const loadSuppliers = async () => {
    try {
      const response = await supplierApiWithFallback.getAll();
      setSuppliers(response || []);
      if (response && response.length > 0) {
        setSelectedSupplier(response[0].id?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const getSupplierEvaluations = (supplierId: string) => {
    return evaluations.filter(evaluation => evaluation.supplierId === supplierId);
  };

  const getLatestEvaluation = (supplierId: string) => {
    const supplierEvals = getSupplierEvaluations(supplierId);
    return supplierEvals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())[0];
  };

  const getGoalStatus = (goal: PerformanceGoal) => {
    const progress = (goal.current / goal.target) * 100;
    if (progress >= 100) return { status: 'achieved', color: '#4caf50', icon: <CheckCircleIcon /> };
    if (progress >= 80) return { status: 'on-track', color: '#ff9800', icon: <WarningIcon /> };
    return { status: 'behind', color: '#f44336', icon: <ErrorIcon /> };
  };

  const handleAddEvaluation = () => {
    setEditingEvaluation(null);
    setOpenDialog(true);
  };

  const handleSaveEvaluation = () => {
    setOpenDialog(false);
  };

  const renderOverviewTab = () => {
    const supplierEvals = getSupplierEvaluations(selectedSupplier);
    const latestEval = getLatestEvaluation(selectedSupplier);
    const avgRating = supplierEvals.reduce((sum, evaluation) => sum + evaluation.overallRating, 0) / supplierEvals.length;

    return (
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <StarRateIcon color="primary" />
                  <Typography variant="h6" ml={1}>
                    Calificación Promedio
                  </Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {avgRating ? avgRating.toFixed(1) : 'N/A'}
                </Typography>
                <Rating value={avgRating || 0} readOnly precision={0.1} />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="h6" ml={1}>
                    Evaluaciones
                  </Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {supplierEvals.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total realizadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={3}>Objetivos de Desempeño</Typography>
                <Stack spacing={2}>
                  {goals.map((goal) => {
                    const goalStatus = getGoalStatus(goal);
                    return (
                      <Box key={goal.id}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">{goal.metric}</Typography>
                          <Box display="flex" alignItems="center">
                            {goalStatus.icon}
                            <Typography variant="body2" ml={1}>
                              {goal.current}/{goal.target} {goal.unit}
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((goal.current / goal.target) * 100, 100)}
                          sx={{ 
                            height: 8, 
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: goalStatus.color
                            }
                          }}
                        />
                      </Box>
                    );
                  })}
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
          <Typography variant="h6">Historial de Evaluaciones</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEvaluation}
          >
            Nueva Evaluación
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Período</TableCell>
                <TableCell>Calificación General</TableCell>
                <TableCell>Calidad</TableCell>
                <TableCell>Entregas</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Evaluado por</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {supplierEvals.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell>{evaluation.period}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Rating value={evaluation.overallRating} readOnly size="small" />
                      <Typography variant="body2" ml={1}>
                        {evaluation.overallRating.toFixed(1)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{evaluation.qualityRating.toFixed(1)}</TableCell>
                  <TableCell>{evaluation.deliveryRating.toFixed(1)}</TableCell>
                  <TableCell>{evaluation.serviceRating.toFixed(1)}</TableCell>
                  <TableCell>{evaluation.priceRating.toFixed(1)}</TableCell>
                  <TableCell>{evaluation.evaluatedBy}</TableCell>
                  <TableCell>{evaluation.evaluatedAt}</TableCell>
                  <TableCell>
                    <IconButton size="small">
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
            No hay evaluaciones registradas para este proveedor.
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Evaluación de Desempeño
      </Typography>

      {/* Supplier Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Proveedor</InputLabel>
                <Select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  label="Seleccionar Proveedor"
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id?.toString() || ''}>
                      {supplier.name} - {supplier.contactPerson}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Resumen" />
            <Tab label="Evaluaciones" />
            <Tab label="Comparación" />
          </Tabs>

          <Divider sx={{ my: 2 }} />

          {tabValue === 0 && renderOverviewTab()}
          {tabValue === 1 && renderEvaluationsTab()}
          {tabValue === 2 && <Typography>Comparación en desarrollo</Typography>}
        </CardContent>
      </Card>

      {/* Evaluation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Período"
                defaultValue={'2024-Q4'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Evaluado por"
                defaultValue={'Usuario Actual'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" mt={2} mb={2}>Calificaciones</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography component="legend">Calidad</Typography>
              <Rating defaultValue={4} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography component="legend">Entregas</Typography>
              <Rating defaultValue={4} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas y Comentarios"
                defaultValue={''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSaveEvaluation}>
            {editingEvaluation ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EvaluacionDesempenoPage;
