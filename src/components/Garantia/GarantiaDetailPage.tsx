import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Divider, Chip, Stack, Button, 
  Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, Alert, CircularProgress
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { type GarantiaDTO } from '../../api/services/garantiaApi';
import { 
  reclamoGarantiaApi, 
  type ReclamoGarantiaDTO 
} from '../../api/services/reclamoGarantiaApi';
import ReclamoFormDialog from './ReclamoFormDialog';

interface GarantiaDetailPageProps {
  garantia: GarantiaDTO;
  onBack: () => void;
  onAnular: () => void;
}

const GarantiaDetailPage: React.FC<GarantiaDetailPageProps> = ({ 
  garantia, 
  onBack, 
  onAnular 
}) => {
  const [reclamos, setReclamos] = useState<ReclamoGarantiaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclamoFormOpen, setReclamoFormOpen] = useState(false);
  const [selectedReclamo, setSelectedReclamo] = useState<ReclamoGarantiaDTO | null>(null);

  useEffect(() => {
    loadReclamos();
  }, [garantia.id]);

  const loadReclamos = async () => {
    try {
      setLoading(true);
      const data = await reclamoGarantiaApi.findByGarantiaId(garantia.id);
      setReclamos(data);
    } catch (err) {
      console.error('Error loading reclamos:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'VIGENTE':
        return 'success';
      case 'VENCIDA':
        return 'error';
      case 'ANULADA':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getReclamoEstadoColor = (estado: string) => {
    switch (estado) {
      case 'RESUELTO':
        return 'success';
      case 'RECHAZADO':
        return 'error';
      case 'EN_PROCESO':
        return 'info';
      case 'PENDIENTE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const diasRestantes = dayjs(garantia.fechaVencimiento).diff(dayjs(), 'day');
  const diasTranscurridos = dayjs().diff(dayjs(garantia.fechaCompra), 'day');
  const diasTotales = dayjs(garantia.fechaVencimiento).diff(dayjs(garantia.fechaCompra), 'day');
  const porcentajeUsado = Math.min(100, Math.max(0, (diasTranscurridos / diasTotales) * 100));

  return (
    <Box>
      {/* Header */}
      <Box p={3} borderBottom="1px solid" borderColor="divider">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Garantía #{garantia.id}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {garantia.numeroSerie}
              </Typography>
            </Box>
          </Stack>
          
          {garantia.estado === 'VIGENTE' && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<BlockIcon />}
              onClick={onAnular}
            >
              Anular Garantía
            </Button>
          )}
        </Stack>
      </Box>

      {/* Content */}
      <Box p={3}>
        <Grid container spacing={3}>
          {/* Información General */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} fontWeight="bold">
                  Información General
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Estado
                    </Typography>
                    <Box mt={0.5}>
                      <Chip 
                        label={garantia.estado} 
                        color={getEstadoColor(garantia.estado)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Modelo de Equipo
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {garantia.equipoFabricadoModelo || 'Sin equipo'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Número de Venta
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {garantia.ventaId ? `#${garantia.ventaId}` : '-'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Número de Serie
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {garantia.numeroSerie}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Fechas y Vigencia */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} fontWeight="bold">
                  Vigencia
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Fecha de Compra
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {dayjs(garantia.fechaCompra).format('DD/MM/YYYY')}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Fecha de Vencimiento
                    </Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="500"
                      color={
                        garantia.estado === 'VENCIDA' 
                          ? 'error.main' 
                          : diasRestantes < 30 
                            ? 'warning.main' 
                            : 'textPrimary'
                      }
                    >
                      {dayjs(garantia.fechaVencimiento).format('DD/MM/YYYY')}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="textSecondary" mb={1} display="block">
                      Tiempo Transcurrido
                    </Typography>
                    <Box 
                      sx={{ 
                        height: 12, 
                        bgcolor: 'grey.200', 
                        borderRadius: 1,
                        overflow: 'hidden',
                        mb: 1
                      }}
                    >
                      <Box 
                        sx={{ 
                          height: '100%', 
                          width: `${porcentajeUsado}%`,
                          bgcolor: 
                            porcentajeUsado >= 90 ? 'error.main' :
                            porcentajeUsado >= 70 ? 'warning.main' :
                            'success.main',
                          transition: 'width 0.3s'
                        }} 
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      {diasTranscurridos} de {diasTotales} días ({porcentajeUsado.toFixed(0)}%)
                      {garantia.estado === 'VIGENTE' && diasRestantes > 0 && (
                        <Typography component="span" variant="caption" ml={1}
                          color={diasRestantes < 30 ? 'warning.main' : 'textSecondary'}
                        >
                          • {diasRestantes} días restantes
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Observaciones */}
          {garantia.observaciones && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" mb={2} fontWeight="bold">
                    Observaciones
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body2">
                    {garantia.observaciones}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Reclamos */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Reclamos de Garantía ({reclamos.length})
                  </Typography>
                  {garantia.estado === 'VIGENTE' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setSelectedReclamo(null);
                        setReclamoFormOpen(true);
                      }}
                    >
                      Nuevo Reclamo
                    </Button>
                  )}
                </Stack>
                <Divider sx={{ mb: 2 }} />

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : reclamos.length === 0 ? (
                  <Alert severity="info">
                    No hay reclamos registrados para esta garantía
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>N° Reclamo</strong></TableCell>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell><strong>Problema</strong></TableCell>
                          <TableCell><strong>Tipo Solución</strong></TableCell>
                          <TableCell align="center"><strong>Estado</strong></TableCell>
                          <TableCell><strong>Técnico</strong></TableCell>
                          <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reclamos.map((reclamo) => (
                          <TableRow key={reclamo.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="500">
                                {reclamo.numeroReclamo}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {dayjs(reclamo.fechaReclamo).format('DD/MM/YYYY HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                {reclamo.descripcionProblema}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {reclamo.tipoSolucion?.replace('_', ' ') || '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={reclamo.estado?.replace('_', ' ') || 'SIN ESTADO'}
                                color={getReclamoEstadoColor(reclamo.estado)}
                                size="small"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              {reclamo.tecnico 
                                ? `${reclamo.tecnico.nombre} ${reclamo.tecnico.apellido}` 
                                : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedReclamo(reclamo);
                                  setReclamoFormOpen(true);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Reclamo Dialog */}
      <ReclamoFormDialog
        open={reclamoFormOpen}
        garantiaId={garantia.id}
        reclamo={selectedReclamo}
        garantias={[garantia]}
        onClose={() => {
          setReclamoFormOpen(false);
          setSelectedReclamo(null);
        }}
        onSave={() => {
          setReclamoFormOpen(false);
          setSelectedReclamo(null);
          loadReclamos();
        }}
      />
    </Box>
  );
};

export default GarantiaDetailPage;
