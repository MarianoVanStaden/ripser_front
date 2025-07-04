import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import type { Cliente } from '../../types';

interface CreditoPersonal {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  montoSolicitado: number;
  montoAprobado: number;
  tasaInteres: number;
  plazoMeses: number;
  cuotaMensual: number;
  estado: 'SOLICITADO' | 'EN_EVALUACION' | 'APROBADO' | 'RECHAZADO' | 'DESEMBOLSADO' | 'EN_CURSO' | 'FINALIZADO';
  fechaSolicitud: string;
  fechaAprobacion?: string;
  fechaDesembolso?: string;
  motivoRechazo?: string;
  observaciones?: string;
  garantias?: string;
  ingresosDeclados: number;
  scoring: number;
}

const CreditoPersonalPage: React.FC = () => {
  const [creditos, setCreditos] = useState<CreditoPersonal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCredito, setSelectedCredito] = useState<CreditoPersonal | null>(null);
  const [editingCredito, setEditingCredito] = useState<CreditoPersonal | null>(null);

  const [formData, setFormData] = useState({
    clienteId: '',
    montoSolicitado: 0,
    tasaInteres: 24.5,
    plazoMeses: 12,
    ingresosDeclados: 0,
    garantias: '',
    observaciones: '',
  });

  // Mock data for demonstration
  const mockCreditos: CreditoPersonal[] = [
    {
      id: 1,
      clienteId: 1,
      montoSolicitado: 100000,
      montoAprobado: 80000,
      tasaInteres: 24.5,
      plazoMeses: 12,
      cuotaMensual: 7500,
      estado: 'EN_CURSO',
      fechaSolicitud: '2024-01-15T10:00:00',
      fechaAprobacion: '2024-01-20T14:30:00',
      fechaDesembolso: '2024-01-25T09:00:00',
      ingresosDeclados: 150000,
      scoring: 85,
      garantias: 'Recibo de sueldo + Aval',
      observaciones: 'Cliente con buen historial crediticio',
    },
    {
      id: 2,
      clienteId: 3,
      montoSolicitado: 50000,
      montoAprobado: 0,
      tasaInteres: 0,
      plazoMeses: 24,
      cuotaMensual: 0,
      estado: 'EN_EVALUACION',
      fechaSolicitud: '2024-12-01T11:30:00',
      ingresosDeclados: 80000,
      scoring: 65,
      garantias: 'Recibo de sueldo',
      observaciones: 'Requiere evaluación adicional por scoring bajo',
    },
    {
      id: 3,
      clienteId: 2,
      montoSolicitado: 200000,
      montoAprobado: 0,
      tasaInteres: 0,
      plazoMeses: 36,
      cuotaMensual: 0,
      estado: 'RECHAZADO',
      fechaSolicitud: '2024-11-10T15:45:00',
      motivoRechazo: 'Ingresos insuficientes para el monto solicitado',
      ingresosDeclados: 120000,
      scoring: 45,
      garantias: 'Sin garantías adicionales',
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const clientesData = await clienteApi.getAll();
      setClientes(clientesData);
      
      // Load credits with client data
      const creditosWithClients = mockCreditos.map(credito => ({
        ...credito,
        cliente: clientesData.find(c => c.id === credito.clienteId)
      }));
      
      setCreditos(creditosWithClients);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calcularCuotaMensual = (monto: number, tasa: number, plazo: number) => {
    const tasaMensual = tasa / 100 / 12;
    const cuota = (monto * tasaMensual * Math.pow(1 + tasaMensual, plazo)) / 
                  (Math.pow(1 + tasaMensual, plazo) - 1);
    return Math.round(cuota);
  };

  const handleOpenDialog = (credito?: CreditoPersonal) => {
    if (credito) {
      setEditingCredito(credito);
      setFormData({
        clienteId: credito.clienteId.toString(),
        montoSolicitado: credito.montoSolicitado,
        tasaInteres: credito.tasaInteres,
        plazoMeses: credito.plazoMeses,
        ingresosDeclados: credito.ingresosDeclados,
        garantias: credito.garantias || '',
        observaciones: credito.observaciones || '',
      });
    } else {
      setEditingCredito(null);
      setFormData({
        clienteId: '',
        montoSolicitado: 0,
        tasaInteres: 24.5,
        plazoMeses: 12,
        ingresosDeclados: 0,
        garantias: '',
        observaciones: '',
      });
    }
    setDialogOpen(true);
  };

  const handleViewCredito = (credito: CreditoPersonal) => {
    setSelectedCredito(credito);
    setViewDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setDialogOpen(false);
    setViewDialogOpen(false);
    setEditingCredito(null);
    setSelectedCredito(null);
    setError(null);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = ['montoSolicitado', 'tasaInteres', 'plazoMeses', 'ingresosDeclados'].includes(field)
      ? Number(event.target.value)
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.clienteId || formData.montoSolicitado <= 0) {
      setError('Cliente y monto son obligatorios');
      return;
    }

    try {
      const cuotaMensual = calcularCuotaMensual(formData.montoSolicitado, formData.tasaInteres, formData.plazoMeses);
      const scoring = Math.min(100, Math.max(0, (formData.ingresosDeclados / formData.montoSolicitado) * 30 + Math.random() * 40));
      
      const creditoData: CreditoPersonal = {
        id: editingCredito?.id || Math.max(...creditos.map(c => c.id)) + 1,
        clienteId: Number(formData.clienteId),
        montoSolicitado: formData.montoSolicitado,
        montoAprobado: 0,
        tasaInteres: formData.tasaInteres,
        plazoMeses: formData.plazoMeses,
        cuotaMensual,
        estado: 'SOLICITADO',
        fechaSolicitud: editingCredito?.fechaSolicitud || new Date().toISOString(),
        ingresosDeclados: formData.ingresosDeclados,
        scoring: Math.round(scoring),
        garantias: formData.garantias,
        observaciones: formData.observaciones,
        cliente: clientes.find(c => c.id === Number(formData.clienteId)),
      };

      if (editingCredito) {
        setCreditos(prev => prev.map(c => c.id === editingCredito.id ? creditoData : c));
      } else {
        setCreditos(prev => [...prev, creditoData]);
      }
      
      handleCloseDialogs();
    } catch (err: any) {
      setError('Error al guardar el crédito');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'SOLICITADO':
        return 'info';
      case 'EN_EVALUACION':
        return 'warning';
      case 'APROBADO':
        return 'success';
      case 'RECHAZADO':
        return 'error';
      case 'DESEMBOLSADO':
        return 'primary';
      case 'EN_CURSO':
        return 'primary';
      case 'FINALIZADO':
        return 'default';
      default:
        return 'default';
    }
  };

  const getScoringColor = (scoring: number) => {
    if (scoring >= 80) return 'success';
    if (scoring >= 60) return 'warning';
    return 'error';
  };

  const getStepFromEstado = (estado: string) => {
    switch (estado) {
      case 'SOLICITADO': return 0;
      case 'EN_EVALUACION': return 1;
      case 'APROBADO': return 2;
      case 'DESEMBOLSADO': return 3;
      case 'EN_CURSO': return 4;
      case 'FINALIZADO': return 5;
      case 'RECHAZADO': return -1;
      default: return 0;
    }
  };

  const totalCreditos = creditos.length;
  const creditosAprobados = creditos.filter(c => ['APROBADO', 'DESEMBOLSADO', 'EN_CURSO', 'FINALIZADO'].includes(c.estado)).length;
  const montoTotalSolicitado = creditos.reduce((sum, c) => sum + c.montoSolicitado, 0);
  const montoTotalAprobado = creditos.reduce((sum, c) => sum + c.montoAprobado, 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Créditos Personales
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Solicitud
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <AssessmentIcon color="primary" />
              <Box>
                <Typography variant="h6" color="primary">
                  {totalCreditos}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Solicitudes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUpIcon color="success" />
              <Box>
                <Typography variant="h6" color="success.main">
                  {creditosAprobados}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aprobados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon color="info" />
              <Box>
                <Typography variant="h6" color="info.main">
                  ${montoTotalSolicitado.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto Total Solicitado
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 250 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <BankIcon color="secondary" />
              <Box>
                <Typography variant="h6" color="secondary.main">
                  ${montoTotalAprobado.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto Total Aprobado
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Credits Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell align="right">Monto Solicitado</TableCell>
              <TableCell align="right">Monto Aprobado</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell align="center">Scoring</TableCell>
              <TableCell>Fecha Solicitud</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {creditos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="text.secondary" py={4}>
                    No hay solicitudes de crédito registradas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              creditos.map((credito) => (
                <TableRow key={credito.id}>
                  <TableCell>
                    <Typography variant="body1">
                      {credito.cliente?.nombre || 'Cliente no encontrado'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {credito.clienteId}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      ${credito.montoSolicitado.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color={credito.montoAprobado > 0 ? 'success.main' : 'text.secondary'}>
                      ${credito.montoAprobado.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={credito.estado}
                      color={getEstadoColor(credito.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="body2" color={getScoringColor(credito.scoring) + '.main'}>
                        {credito.scoring}/100
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={credito.scoring}
                        color={getScoringColor(credito.scoring)}
                        sx={{ width: 60, height: 4 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(credito.fechaSolicitud).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleViewCredito(credito)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog(credito)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingCredito ? 'Editar Solicitud de Crédito' : 'Nueva Solicitud de Crédito'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <TextField
                select
                fullWidth
                label="Cliente"
                value={formData.clienteId}
                onChange={handleInputChange('clienteId')}
                required
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nombre} {cliente.apellido && `${cliente.apellido}`}
                  </MenuItem>
                ))}
              </TextField>
              
              <Box display="flex" gap={2}>
                <TextField
                  type="number"
                  label="Monto Solicitado"
                  value={formData.montoSolicitado}
                  onChange={handleInputChange('montoSolicitado')}
                  required
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
                <TextField
                  type="number"
                  label="Ingresos Declarados"
                  value={formData.ingresosDeclados}
                  onChange={handleInputChange('ingresosDeclados')}
                  required
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Box>

              <Box display="flex" gap={2}>
                <TextField
                  type="number"
                  label="Tasa de Interés (%)"
                  value={formData.tasaInteres}
                  onChange={handleInputChange('tasaInteres')}
                  required
                  sx={{ flex: 1 }}
                  inputProps={{ step: 0.1, min: 0 }}
                />
                <TextField
                  type="number"
                  label="Plazo (meses)"
                  value={formData.plazoMeses}
                  onChange={handleInputChange('plazoMeses')}
                  required
                  sx={{ flex: 1 }}
                  inputProps={{ min: 1, max: 60 }}
                />
              </Box>

              {formData.montoSolicitado > 0 && formData.tasaInteres > 0 && formData.plazoMeses > 0 && (
                <Box p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    Cuota mensual estimada: <strong>${calcularCuotaMensual(formData.montoSolicitado, formData.tasaInteres, formData.plazoMeses).toLocaleString()}</strong>
                  </Typography>
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Garantías"
                value={formData.garantias}
                onChange={handleInputChange('garantias')}
                placeholder="Describa las garantías ofrecidas..."
              />
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={formData.observaciones}
                onChange={handleInputChange('observaciones')}
                placeholder="Notas adicionales sobre la solicitud..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {editingCredito ? 'Actualizar' : 'Crear Solicitud'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={handleCloseDialogs} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de Crédito - {selectedCredito?.cliente?.nombre}
        </DialogTitle>
        <DialogContent>
          {selectedCredito && (
            <Box>
              {/* Process Stepper */}
              <Box mb={3}>
                <Stepper activeStep={getStepFromEstado(selectedCredito.estado)} orientation="vertical">
                  <Step>
                    <StepLabel>Solicitud Recibida</StepLabel>
                    <StepContent>
                      <Typography variant="body2">
                        Fecha: {new Date(selectedCredito.fechaSolicitud).toLocaleDateString()}
                      </Typography>
                    </StepContent>
                  </Step>
                  <Step>
                    <StepLabel>En Evaluación</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Aprobado</StepLabel>
                    {selectedCredito.fechaAprobacion && (
                      <StepContent>
                        <Typography variant="body2">
                          Fecha: {new Date(selectedCredito.fechaAprobacion).toLocaleDateString()}
                        </Typography>
                      </StepContent>
                    )}
                  </Step>
                  <Step>
                    <StepLabel>Desembolsado</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>En Curso</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Finalizado</StepLabel>
                  </Step>
                </Stepper>
              </Box>

              {/* Credit Details */}
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={4}>
                  <Box flex="1">
                    <Typography variant="h6" gutterBottom>Información del Crédito</Typography>
                    <Typography><strong>Monto Solicitado:</strong> ${selectedCredito.montoSolicitado.toLocaleString()}</Typography>
                    <Typography><strong>Monto Aprobado:</strong> ${selectedCredito.montoAprobado.toLocaleString()}</Typography>
                    <Typography><strong>Tasa de Interés:</strong> {selectedCredito.tasaInteres}%</Typography>
                    <Typography><strong>Plazo:</strong> {selectedCredito.plazoMeses} meses</Typography>
                    <Typography><strong>Cuota Mensual:</strong> ${selectedCredito.cuotaMensual.toLocaleString()}</Typography>
                  </Box>
                  <Box flex="1">
                    <Typography variant="h6" gutterBottom>Evaluación</Typography>
                    <Typography><strong>Ingresos Declarados:</strong> ${selectedCredito.ingresosDeclados.toLocaleString()}</Typography>
                    <Typography><strong>Scoring:</strong> {selectedCredito.scoring}/100</Typography>
                    <Typography><strong>Garantías:</strong> {selectedCredito.garantias || 'Sin garantías'}</Typography>
                  </Box>
                </Box>

                {selectedCredito.observaciones && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Observaciones</Typography>
                    <Typography>{selectedCredito.observaciones}</Typography>
                  </Box>
                )}

                {selectedCredito.motivoRechazo && (
                  <Box>
                    <Typography variant="h6" gutterBottom color="error">Motivo de Rechazo</Typography>
                    <Typography color="error">{selectedCredito.motivoRechazo}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditoPersonalPage;
