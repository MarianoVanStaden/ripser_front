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

interface FacturaConEquipos {
  factura: DocumentoComercial;
  equiposPorEntregar: EquipoFabricadoDTO[];
  expanded: boolean;
}

const EntregasEquiposPage: React.FC = () => {
  const [facturasConEquipos, setFacturasConEquipos] = useState<FacturaConEquipos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Confirm delivery dialog
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<DocumentoComercial | null>(null);
  const [receptorNombre, setReceptorNombre] = useState('');
  const [receptorDni, setReceptorDni] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
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

      // Marcar cada equipo como ENTREGADO
      for (const equipoId of equiposIds) {
        try {
          // Verificar estado actual
          const equipo = await equipoFabricadoApi.findById(equipoId);
          if (equipo.estadoAsignacion === 'FACTURADO') {
            await equipoFabricadoApi.marcarComoEntregado(equipoId);
          }
        } catch (err) {
          console.error(`Error marcando equipo ${equipoId} como entregado:`, err);
        }
      }

      // Crear registro de entrega (opcional - si el backend lo requiere)
      try {
        await api.post('/api/entregas-viaje', {
          ventaId: selectedFactura.id,
          direccionEntrega: `Cliente: ${selectedFactura.clienteNombre}`,
          fechaEntrega: dayjs().format('YYYY-MM-DD'),
          estado: 'ENTREGADA',
          observaciones: observaciones || `Equipos entregados: ${equiposIds.length}`,
          receptorNombre: receptorNombre,
          receptorDni: receptorDni,
        });
      } catch (err) {
        console.warn('No se pudo crear registro de entrega:', err);
        // No es crítico si falla
      }

      setSuccess(`✅ Entrega confirmada: ${equiposIds.length} equipo(s) marcados como ENTREGADO`);
      setConfirmDialog(false);
      setSelectedFactura(null);
      
      // Recargar datos
      await loadFacturasConEquiposPorEntregar();
    } catch (err) {
      console.error('Error confirmando entrega:', err);
      setError('Error al confirmar la entrega');
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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="600" display="flex" alignItems="center" gap={1}>
          <ShippingIcon fontSize="large" />
          Entregas de Equipos Pendientes
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ShippingIcon />}
          onClick={loadFacturasConEquiposPorEntregar}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
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
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box flex={1}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6">
                        {factura.numeroDocumento || `FAC-${factura.id}`}
                      </Typography>
                      <Chip
                        icon={<PersonIcon />}
                        label={factura.clienteNombre}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<EquipoIcon />}
                        label={`${equiposPorEntregar.length} equipo(s) por entregar`}
                        color="warning"
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Fecha: {dayjs(factura.fechaEmision).format('DD/MM/YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleOpenConfirmDialog(factura)}
                    >
                      Confirmar Entrega
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
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>N° Equipo</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Modelo</TableCell>
                          <TableCell>Color</TableCell>
                          <TableCell>Medida</TableCell>
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
                            <TableCell>{equipo.color || '-'}</TableCell>
                            <TableCell>{equipo.medida || '-'}</TableCell>
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
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
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
              />
              <TextField
                fullWidth
                label="DNI del Receptor"
                value={receptorDni}
                onChange={(e) => setReceptorDni(e.target.value)}
                margin="normal"
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
    </Box>
  );
};

export default EntregasEquiposPage;
