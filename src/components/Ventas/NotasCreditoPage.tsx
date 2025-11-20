import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Grid, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions, Chip, Alert,
  Autocomplete, Card, CardContent, Divider, CircularProgress,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/config';
import { documentoApi } from '../../api/services';
import type { DocumentoComercial, EquipoFabricadoDTO } from '../../types';

interface NotaCreditoForm {
  facturaId: number | null;
  facturaNumero: string;
  clienteId: number | null;
  clienteNombre: string;
  equiposSeleccionados: EquipoFabricadoDTO[];
  observaciones: string;
  motivo: string;
}

const NotasCreditoPage: React.FC = () => {
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [equiposFactura, setEquiposFactura] = useState<EquipoFabricadoDTO[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [form, setForm] = useState<NotaCreditoForm>({
    facturaId: null,
    facturaNumero: '',
    clienteId: null,
    clienteNombre: '',
    equiposSeleccionados: [],
    observaciones: '',
    motivo: '',
  });

  const [errors, setErrors] = useState({
    factura: '',
    equipos: '',
    motivo: '',
  });

  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    notaCredito: any;
  }>({ open: false, notaCredito: null });

  useEffect(() => {
    loadFacturas();
  }, []);

  const loadFacturas = async () => {
    try {
      setLoadingFacturas(true);
      // Usar documentoApi que maneja mejor los permisos
      const facturas = await documentoApi.getByTipo('FACTURA');
      setFacturas(facturas);
      
      if (facturas.length === 0) {
        setAlert({
          open: true,
          message: 'No se encontraron facturas o no tiene permisos para acceder a ellas',
          severity: 'info',
        });
      }
    } catch (error) {
      console.error('Error loading facturas:', error);
      setAlert({
        open: true,
        message: 'Error al cargar las facturas. Verifique sus permisos.',
        severity: 'error',
      });
    } finally {
      setLoadingFacturas(false);
    }
  };

  const handleFacturaChange = async (factura: DocumentoComercial | null) => {
    if (!factura) {
      setForm({
        ...form,
        facturaId: null,
        facturaNumero: '',
        clienteId: null,
        clienteNombre: '',
        equiposSeleccionados: [],
      });
      setEquiposFactura([]);
      setErrors({ ...errors, factura: '' });
      return;
    }

    setForm({
      ...form,
      facturaId: factura.id,
      facturaNumero: factura.numeroDocumento,
      clienteId: factura.clienteId,
      clienteNombre: factura.clienteNombre,
      equiposSeleccionados: [],
    });
    setErrors({ ...errors, factura: '' });

    // Cargar equipos de la factura
    await loadEquiposFactura(factura.id);
  };

  const loadEquiposFactura = async (facturaId: number) => {
    try {
      setLoadingEquipos(true);
      // Obtener los detalles de la factura para extraer los equipos
      const factura = await documentoApi.getById(facturaId);
      
      // Extraer IDs de equipos desde equiposFabricadosIds en detalles
      const equiposIds: number[] = [];
      factura.detalles.forEach(detalle => {
        if (detalle.tipoItem === 'EQUIPO' && detalle.equiposFabricadosIds) {
          equiposIds.push(...detalle.equiposFabricadosIds);
        }
      });

      if (equiposIds.length === 0) {
        setEquiposFactura([]);
        setAlert({
          open: true,
          message: 'Esta factura no tiene equipos asociados',
          severity: 'warning',
        });
        return;
      }

      // Cargar información completa de cada equipo
      const equiposPromises = equiposIds.map((id: number) =>
        api.get(`/api/equipos-fabricados/${id}`)
      );
      const equiposResponses = await Promise.all(equiposPromises);
      const equipos = equiposResponses.map(res => res.data);

      // Filtrar solo equipos ENTREGADOS (elegibles para devolución)
      const equiposEntregados = equipos.filter(
        (equipo: EquipoFabricadoDTO) => equipo.estadoAsignacion === 'ENTREGADO'
      );

      if (equiposEntregados.length === 0) {
        setAlert({
          open: true,
          message: 'Esta factura no tiene equipos en estado ENTREGADO. Solo se pueden crear Notas de Crédito para equipos entregados.',
          severity: 'warning',
        });
      }

      setEquiposFactura(equiposEntregados);
    } catch (error) {
      console.error('Error loading equipos:', error);
      setAlert({
        open: true,
        message: 'Error al cargar los equipos de la factura',
        severity: 'error',
      });
      setEquiposFactura([]);
    } finally {
      setLoadingEquipos(false);
    }
  };

  const handleEquipoToggle = (equipo: EquipoFabricadoDTO) => {
    const isSelected = form.equiposSeleccionados.some(e => e.id === equipo.id);
    
    if (isSelected) {
      setForm({
        ...form,
        equiposSeleccionados: form.equiposSeleccionados.filter(e => e.id !== equipo.id),
      });
    } else {
      setForm({
        ...form,
        equiposSeleccionados: [...form.equiposSeleccionados, equipo],
      });
    }
    setErrors({ ...errors, equipos: '' });
  };

  const validateForm = (): boolean => {
    const newErrors = {
      factura: '',
      equipos: '',
      motivo: '',
    };

    if (!form.facturaId) {
      newErrors.factura = 'Debe seleccionar una factura';
    }

    if (form.equiposSeleccionados.length === 0) {
      newErrors.equipos = 'Debe seleccionar al menos un equipo';
    }

    if (!form.motivo.trim()) {
      newErrors.motivo = 'Debe especificar el motivo de la nota de crédito';
    }

    setErrors(newErrors);
    return !newErrors.factura && !newErrors.equipos && !newErrors.motivo;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setAlert({
        open: true,
        message: 'Por favor complete todos los campos requeridos',
        severity: 'error',
      });
      return;
    }

    try {
      setCreating(true);
      
      // Get current user ID from localStorage or context
      const currentUser = localStorage.getItem('user');
      const usuarioId = currentUser ? JSON.parse(currentUser).id : 1;

      // Extract equipos IDs to return
      const equiposADevolver = form.equiposSeleccionados.map(e => e.id);

      // Create nota de credito using the correct backend endpoint
      const notaCreditoData = {
        facturaId: form.facturaId!,
        usuarioId: usuarioId,
        observaciones: `${form.motivo}. ${form.observaciones || ''}`.trim(),
        equiposADevolver: equiposADevolver,
      };

      const notaCredito = await documentoApi.createNotaCredito(notaCreditoData);
      
      setSuccessDialog({
        open: true,
        notaCredito: notaCredito,
      });

      // Resetear formulario
      setForm({
        facturaId: null,
        facturaNumero: '',
        clienteId: null,
        clienteNombre: '',
        equiposSeleccionados: [],
        observaciones: '',
        motivo: '',
      });
      setEquiposFactura([]);
      
    } catch (error: any) {
      console.error('Error creating nota credito:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data ||
                          'Error al crear la nota de crédito';
      setAlert({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialog({ open: false, notaCredito: null });
    loadFacturas();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="600">
          Notas de Crédito
        </Typography>
      </Box>

      {alert.open && (
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Selección de Factura */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                1. Seleccionar Factura
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Autocomplete
                options={facturas}
                getOptionLabel={(option) => 
                  `${option.numeroDocumento} - ${option.clienteNombre} - ${dayjs(option.fechaEmision).format('DD/MM/YYYY')}`
                }
                loading={loadingFacturas}
                onChange={(_, value) => handleFacturaChange(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Factura *"
                    error={!!errors.factura}
                    helperText={errors.factura}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingFacturas ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {form.facturaId && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Cliente: <strong>{form.clienteNombre}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Factura N°: <strong>{form.facturaNumero}</strong>
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Selección de Equipos */}
        {form.facturaId && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  2. Seleccionar Equipos a Acreditar
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {loadingEquipos ? (
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress />
                  </Box>
                ) : equiposFactura.length === 0 ? (
                  <Alert severity="info">
                    No hay equipos ENTREGADOS en esta factura disponibles para acreditar.
                  </Alert>
                ) : (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell>N° Heladera</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Modelo</TableCell>
                            <TableCell>Color</TableCell>
                            <TableCell>Medida</TableCell>
                            <TableCell>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {equiposFactura.map((equipo) => {
                            const isSelected = form.equiposSeleccionados.some(e => e.id === equipo.id);
                            return (
                              <TableRow
                                key={equipo.id}
                                hover
                                onClick={() => handleEquipoToggle(equipo)}
                                sx={{ cursor: 'pointer', bgcolor: isSelected ? 'action.selected' : 'inherit' }}
                              >
                                <TableCell padding="checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleEquipoToggle(equipo)}
                                  />
                                </TableCell>
                                <TableCell>{equipo.numeroHeladera}</TableCell>
                                <TableCell>{equipo.tipo}</TableCell>
                                <TableCell>{equipo.modelo}</TableCell>
                                <TableCell>{equipo.color || '-'}</TableCell>
                                <TableCell>{equipo.medida || '-'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={equipo.estadoAsignacion}
                                    color="success"
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {errors.equipos && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {errors.equipos}
                      </Alert>
                    )}

                    {form.equiposSeleccionados.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="body2" color="primary">
                          {form.equiposSeleccionados.length} equipo(s) seleccionado(s)
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Motivo y Observaciones */}
        {form.equiposSeleccionados.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  3. Motivo de la Nota de Crédito
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Motivo *"
                      value={form.motivo}
                      onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                      error={!!errors.motivo}
                      helperText={errors.motivo}
                    >
                      <MenuItem value="DEVOLUCION">Devolución de equipo</MenuItem>
                      <MenuItem value="ERROR_FACTURACION">Error en facturación</MenuItem>
                      <MenuItem value="GARANTIA">Garantía</MenuItem>
                      <MenuItem value="DESCUENTO">Descuento aplicado</MenuItem>
                      <MenuItem value="OTRO">Otro</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Observaciones"
                      value={form.observaciones}
                      onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                      placeholder="Descripción detallada del motivo de la nota de crédito..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Botones de acción */}
        {form.equiposSeleccionados.length > 0 && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  setForm({
                    facturaId: null,
                    facturaNumero: '',
                    clienteId: null,
                    clienteNombre: '',
                    equiposSeleccionados: [],
                    observaciones: '',
                    motivo: '',
                  });
                  setEquiposFactura([]);
                  setErrors({ factura: '', equipos: '', motivo: '' });
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {creating ? 'Creando...' : 'Crear Nota de Crédito'}
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Success Dialog */}
      <Dialog
        open={successDialog.open}
        onClose={handleSuccessClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'visible',
          },
        }}
      >
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: (theme) => theme.palette.success.main + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <CheckCircle sx={{ fontSize: 50, color: 'success.main' }} />
            </Box>

            <Typography variant="h5" fontWeight="600" gutterBottom>
              ¡Nota de Crédito Creada!
            </Typography>
            
            {successDialog.notaCredito && (
              <>
                <Typography variant="body1" color="text.secondary" paragraph>
                  La nota de crédito ha sido generada exitosamente
                </Typography>

                <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    Acciones automáticas realizadas:
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Crédito de ${successDialog.notaCredito.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })} aplicado a la cuenta corriente del cliente
                  </Typography>
                  <Typography variant="body2" component="div">
                    • {form.equiposSeleccionados.length} equipo(s) devuelto(s) al inventario (estado: DISPONIBLE)
                  </Typography>
                </Alert>

                <Box
                  sx={{
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                    p: 2,
                    width: '100%',
                    mt: 2,
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        N° Nota de Crédito
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {successDialog.notaCredito.numeroDocumento || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {successDialog.notaCredito.clienteNombre}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Monto Total
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        ${successDialog.notaCredito.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Equipos Devueltos
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {form.equiposSeleccionados.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Factura de Referencia
                      </Typography>
                      <Typography variant="body2" fontWeight="600">
                        {successDialog.notaCredito.numeroReferencia || form.facturaNumero}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSuccessClose}
            fullWidth
            sx={{ maxWidth: 200 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotasCreditoPage;
