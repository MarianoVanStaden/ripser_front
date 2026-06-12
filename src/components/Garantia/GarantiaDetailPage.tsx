import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Divider, Chip, Stack, Button,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Block as BlockIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { type GarantiaDTO, tipoGarantiaLabel } from '../../api/services/garantiaApi';
import {
  reclamoGarantiaApi,
  type ReclamoGarantiaDTO
} from '../../api/services/reclamoGarantiaApi';
import ReclamoFormDialog from './ReclamoFormDialog';
import GarantiaVigenciaBar from './GarantiaVigenciaBar';

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

  // Parse tipos de garantía
  const tiposGarantia = garantia.tiposGarantia
    ? garantia.tiposGarantia.split(',').map(t => t.trim())
    : [];

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
                    <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                      Tipos de Garantía
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {tiposGarantia.map((tipo) => (
                        <Chip
                          key={tipo}
                          label={tipoGarantiaLabel[tipo as keyof typeof tipoGarantiaLabel] || tipo}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ))}
                    </Stack>
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

                  {garantia.observaciones && (
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Observaciones
                      </Typography>
                      <Typography variant="body2">
                        {garantia.observaciones}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Vigencia por Tipo */}
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

                  {/* Vigencia para Desperfecto de Fábrica */}
                  {garantia.fechaVencimientoFabrica && (
                    <GarantiaVigenciaBar
                      tipo="DESPERFECTO_FABRICA"
                      fechaCompra={garantia.fechaCompra}
                      fechaVencimiento={garantia.fechaVencimientoFabrica}
                      estado={garantia.estado}
                    />
                  )}

                  {/* Vigencia para Desperfecto Eléctrico */}
                  {garantia.fechaVencimientoElectrico && (
                    <GarantiaVigenciaBar
                      tipo="DESPERFECTO_ELECTRICO"
                      fechaCompra={garantia.fechaCompra}
                      fechaVencimiento={garantia.fechaVencimientoElectrico}
                      estado={garantia.estado}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Reclamos */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Reclamos
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedReclamo(null);
                      setReclamoFormOpen(true);
                    }}
                  >
                    Nuevo Reclamo
                  </Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />

                {loading ? (
                  <CircularProgress />
                ) : reclamos.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No hay reclamos registrados
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>N° Reclamo</strong></TableCell>
                          <TableCell><strong>Fecha</strong></TableCell>
                          <TableCell><strong>Descripción</strong></TableCell>
                          <TableCell><strong>Estado</strong></TableCell>
                          <TableCell align="center"><strong>Acciones</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reclamos.map((reclamo) => (
                          <TableRow key={reclamo.id}>
                            <TableCell>{reclamo.numeroReclamo}</TableCell>
                            <TableCell>{dayjs(reclamo.fechaReclamo).format('DD/MM/YYYY')}</TableCell>
                            <TableCell>{reclamo.descripcionProblema}</TableCell>
                            <TableCell>
                              <Chip
                                label={reclamo.estado}
                                color={getReclamoEstadoColor(reclamo.estado)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedReclamo(reclamo);
                                  setReclamoFormOpen(true);
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
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Reclamo Form Dialog */}
      <ReclamoFormDialog
        open={reclamoFormOpen}
        onClose={() => {
          setReclamoFormOpen(false);
          setSelectedReclamo(null);
        }}
        garantiaId={garantia.id}
        garantias={[garantia]}
        onSave={() => {
          loadReclamos();
          setReclamoFormOpen(false);
        }}
        reclamo={selectedReclamo}
      />
    </Box>
  );
};

export default GarantiaDetailPage;
