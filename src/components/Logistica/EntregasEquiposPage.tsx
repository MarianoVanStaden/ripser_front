import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Collapse,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Inventory as EquipoIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { documentoApi } from '../../api/services/documentoApi';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { DocumentoComercial, EquipoFabricadoDTO } from '../../types';
import api from '../../api/config';
import SuccessDialog from '../common/SuccessDialog';

interface FacturaConEquipos {
  factura: DocumentoComercial;
  equiposPorEntregar: EquipoFabricadoDTO[];
  expanded: boolean;
}

const EntregasEquiposPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [facturasConEquipos, setFacturasConEquipos] = useState<FacturaConEquipos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Confirm delivery dialog
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<DocumentoComercial | null>(null);
  const [receptorNombre, setReceptorNombre] = useState('');
  const [receptorDni, setReceptorDni] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Success dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [entregaConfirmada, setEntregaConfirmada] = useState<{
    facturaNumero: string;
    clienteNombre: string;
    cantidadEquipos: number;
  } | null>(null);

  // Removed: Add to trip dialog (not compatible with real API)

  useEffect(() => {
    loadFacturasConEquiposPorEntregar();
  }, []);

  const loadFacturasConEquiposPorEntregar = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener todas las facturas
      const facturas = await documentoApi.getByTipo('FACTURA');
      
      // 2. Por cada factura, obtener equipos FACTURADOS
      const facturasConEquiposData: FacturaConEquipos[] = [];

      for (const factura of facturas) {
        // Extraer IDs de equipos de los detalles tipo EQUIPO
        const equiposIds: number[] = [];
        
        factura.detalles?.forEach(detalle => {
          if (detalle.tipoItem === 'EQUIPO' && detalle.equiposFabricadosIds) {
            equiposIds.push(...detalle.equiposFabricadosIds);
          }
        });

        if (equiposIds.length === 0) continue;

        // Obtener información completa de cada equipo
        const equiposPromises = equiposIds.map(id => 
          equipoFabricadoApi.findById(id).catch(() => null)
        );
        const equipos = (await Promise.all(equiposPromises)).filter(Boolean) as EquipoFabricadoDTO[];

        // Filtrar solo equipos en estado FACTURADO (pendientes de entrega)
        const equiposPorEntregar = equipos.filter(
          equipo => equipo.estadoAsignacion === 'FACTURADO'
        );

        // Solo agregar facturas que tienen equipos por entregar
        if (equiposPorEntregar.length > 0) {
          facturasConEquiposData.push({
            factura,
            equiposPorEntregar,
            expanded: false,
          });
        }
      }

      setFacturasConEquipos(facturasConEquiposData);
    } catch (err) {
      console.error('Error loading facturas con equipos:', err);
      setError('Error al cargar facturas con equipos pendientes de entrega');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (facturaId: number) => {
    setFacturasConEquipos(prev =>
      prev.map(item =>
        item.factura.id === facturaId
          ? { ...item, expanded: !item.expanded }
          : item
      )
    );
  };

  const handleOpenConfirmDialog = (factura: DocumentoComercial) => {
    setSelectedFactura(factura);
    setReceptorNombre(factura.clienteNombre || '');
    setReceptorDni('');
    setObservaciones('');
    setConfirmDialog(true);
  };

  const handleConfirmEntrega = async () => {
    if (!selectedFactura) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener IDs de equipos de esta factura que están FACTURADOS
      const equiposIds: number[] = [];
      selectedFactura.detalles?.forEach(detalle => {
        if (detalle.tipoItem === 'EQUIPO' && detalle.equiposFabricadosIds) {
          equiposIds.push(...detalle.equiposFabricadosIds);
        }
      });

      // Paso 1: Crear registro de entrega con estado PENDIENTE
      const entregaResponse = await api.post('/api/entregas-viaje', {
        documentoComercialId: selectedFactura.id,
        direccionEntrega: selectedFactura.clienteDireccion || `Cliente: ${selectedFactura.clienteNombre}`,
        fechaEntrega: dayjs().toISOString(),
        estado: 'PENDIENTE',
        observaciones: observaciones || `Entrega directa. Equipos: ${equiposIds.length}`,
        receptorNombre: null,
        receptorDni: null,
      });

      console.log('✅ Entrega creada:', entregaResponse.data);

      // Paso 2: Confirmar la entrega (esto marca equipos como ENTREGADO y crea garantías)
      const confirmarResponse = await api.post('/api/entregas-viaje/confirmar-entrega', {
        entregaId: entregaResponse.data.id,
        estado: 'ENTREGADA',
        receptorNombre: receptorNombre,
        receptorDni: receptorDni,
        observaciones: observaciones,
      });

      console.log('✅ Entrega confirmada:', confirmarResponse.data);

      // Guardar datos de la entrega confirmada
      setEntregaConfirmada({
        facturaNumero: selectedFactura.numeroDocumento || `FAC-${selectedFactura.id}`,
        clienteNombre: selectedFactura.clienteNombre || 'Sin nombre',
        cantidadEquipos: equiposIds.length,
      });

      setConfirmDialog(false);
      setSelectedFactura(null);

      // Mostrar modal de éxito
      setSuccessDialogOpen(true);

      // Recargar datos
      await loadFacturasConEquiposPorEntregar();
    } catch (err: any) {
      console.error('Error confirmando entrega:', err);
      setError(err.response?.data?.message || err.response?.data || 'Error al confirmar la entrega');
    } finally {
      setLoading(false);
    }
  };

  // Removed: handleAgregarAViaje and handleConfirmarAgregarAViaje
  // These functions were designed for a different backend structure that doesn't match the real API

  const getEstadoColor = (estado?: string) => {
    if (!estado) return 'default';
    switch (estado) {
      case 'FACTURADO':
        return 'warning';
      case 'ENTREGADO':
        return 'success';
      case 'DISPONIBLE':
        return 'default';
      case 'RESERVADO':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading && facturasConEquipos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography ml={2}>Cargando entregas pendientes...</Typography>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1, sm: 2, md: 3 }}>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        gap={2}
        mb={3}
      >
        <Typography 
          variant={isMobile ? 'h5' : 'h4'} 
          fontWeight="600" 
          display="flex" 
          alignItems="center" 
          gap={1}
        >
          <ShippingIcon fontSize={isMobile ? 'medium' : 'large'} />
          {isMobile ? 'Entregas Pendientes' : 'Entregas de Equipos Pendientes'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ShippingIcon />}
          onClick={loadFacturasConEquiposPorEntregar}
          disabled={loading}
          fullWidth={isMobile}
          size={isMobile ? 'small' : 'medium'}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {facturasConEquipos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EquipoIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay equipos pendientes de entrega
          </Typography>
          <Typography color="text.secondary">
            Todos los equipos facturados han sido entregados
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {facturasConEquipos.map(({ factura, equiposPorEntregar, expanded }) => (
            <Card key={factura.id} variant="outlined">
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box 
                  display="flex" 
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between" 
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  gap={{ xs: 2, sm: 1 }}
                >
                  <Box flex={1}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={{ xs: 1, sm: 2 }} 
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      flexWrap="wrap"
                    >
                      <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight="bold">
                        {factura.numeroDocumento || `FAC-${factura.id}`}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        <Chip
                          icon={<PersonIcon />}
                          label={isMobile ? (factura.clienteNombre?.split(' ')[0] || 'Cliente') : factura.clienteNombre}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<EquipoIcon />}
                          label={`${equiposPorEntregar.length} equipo(s)`}
                          color="warning"
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(factura.fechaEmision).format('DD/MM/YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack 
                    direction={{ xs: 'row', sm: 'row' }} 
                    spacing={1}
                    justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleOpenConfirmDialog(factura)}
                      fullWidth={isMobile}
                      sx={{ flex: isMobile ? 1 : 'none' }}
                    >
                      {isMobile ? 'Confirmar' : 'Confirmar Entrega'}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => toggleExpand(factura.id)}
                    >
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Stack>
                </Box>

                <Collapse in={expanded}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Equipos a entregar:
                  </Typography>
                  {isMobile ? (
                    /* Vista de cards para móvil */
                    <Stack spacing={1}>
                      {equiposPorEntregar.map(equipo => (
                        <Card key={equipo.id} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  #{equipo.numeroHeladera || equipo.id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {equipo.tipo} - {equipo.modelo}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {equipo.color || '-'} | {equipo.medida || '-'}
                                </Typography>
                              </Box>
                              <Chip
                                label={equipo.estadoAsignacion}
                                color={getEstadoColor(equipo.estadoAsignacion) as any}
                                size="small"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    /* Vista de tabla para desktop/tablet */
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>N° Equipo</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Modelo</TableCell>
                            {!isTablet && <TableCell>Color</TableCell>}
                            {!isTablet && <TableCell>Medida</TableCell>}
                            <TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {equiposPorEntregar.map(equipo => (
                            <TableRow key={equipo.id}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="600">
                                  #{equipo.numeroHeladera || equipo.id}
                                </Typography>
                              </TableCell>
                              <TableCell>{equipo.tipo}</TableCell>
                              <TableCell>{equipo.modelo}</TableCell>
                              {!isTablet && <TableCell>{equipo.color || '-'}</TableCell>}
                              {!isTablet && <TableCell>{equipo.medida || '-'}</TableCell>}
                              <TableCell>
                                <Chip
                                  label={equipo.estadoAsignacion}
                                  color={getEstadoColor(equipo.estadoAsignacion) as any}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Confirm Delivery Dialog */}
      <Dialog 
        open={confirmDialog} 
        onClose={() => setConfirmDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Confirmar Entrega de Equipos</DialogTitle>
        <DialogContent>
          {selectedFactura && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Factura:</strong> {selectedFactura.numeroDocumento}
                </Typography>
                <Typography variant="body2">
                  <strong>Cliente:</strong> {selectedFactura.clienteNombre}
                </Typography>
                <Typography variant="body2">
                  <strong>Equipos a entregar:</strong>{' '}
                  {facturasConEquipos.find(f => f.factura.id === selectedFactura.id)?.equiposPorEntregar.length || 0}
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Nombre del Receptor"
                value={receptorNombre}
                onChange={(e) => setReceptorNombre(e.target.value)}
                margin="normal"
                required
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                fullWidth
                label="DNI del Receptor"
                value={receptorDni}
                onChange={(e) => setReceptorDni(e.target.value)}
                margin="normal"
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                fullWidth
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                placeholder="Notas sobre la entrega..."
                size={isMobile ? 'small' : 'medium'}
              />

              <Alert severity="warning" sx={{ mt: 2 }}>
                Esta acción cambiará el estado de todos los equipos a <strong>ENTREGADO</strong> y
                se registrará en el historial.
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmEntrega}
            disabled={!receptorNombre.trim() || loading}
            startIcon={<CheckIcon />}
          >
            Confirmar Entrega
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trip integration dialog removed - not compatible with real backend API */}

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialogOpen}
        onClose={() => {
          setSuccessDialogOpen(false);
          setEntregaConfirmada(null);
        }}
        title="¡Entrega Confirmada Exitosamente!"
        message={`${entregaConfirmada?.cantidadEquipos || 0} equipo(s) marcados como ENTREGADO`}
        details={entregaConfirmada ? [
          { label: 'Factura', value: entregaConfirmada.facturaNumero },
          { label: 'Cliente', value: entregaConfirmada.clienteNombre },
          { label: 'Equipos Entregados', value: entregaConfirmada.cantidadEquipos },
        ] : []}
      />
    </Box>
  );
};

export default EntregasEquiposPage;
