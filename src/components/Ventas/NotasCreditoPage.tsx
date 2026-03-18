import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, Grid, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions, Chip, Alert,
  Autocomplete, Card, CardContent, Divider, CircularProgress,
  Paper, Checkbox, Tooltip, alpha, useTheme,
} from '@mui/material';
import {
  CheckCircle, Receipt, Inventory, Warning,
  CreditCard, Description,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/config';
import { documentoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
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

interface SuccessData {
  notaCredito: any;
  equiposDevueltos: number;
  facturaNumero: string;
  montoCalculado: number;
  totalEquiposFactura: number;
}

const NotasCreditoPage: React.FC = () => {
  const theme = useTheme();
  const { empresaId } = useTenant();
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [equiposFactura, setEquiposFactura] = useState<EquipoFabricadoDTO[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<DocumentoComercial | null>(null);
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
    data: SuccessData | null;
  }>({ open: false, data: null });

  // Calcular monto proporcional según equipos seleccionados
  const montoCalculado = useMemo(() => {
    if (!facturaSeleccionada || equiposFactura.length === 0 || form.equiposSeleccionados.length === 0) {
      return 0;
    }
    const totalFactura = facturaSeleccionada.total || facturaSeleccionada.subtotal || 0;
    const totalEquipos = equiposFactura.length;
    const equiposSeleccionados = form.equiposSeleccionados.length;

    // Calcular monto proporcional
    return (totalFactura / totalEquipos) * equiposSeleccionados;
  }, [facturaSeleccionada, equiposFactura.length, form.equiposSeleccionados.length]);

  useEffect(() => {
    loadFacturas();
  }, [empresaId]); // Re-fetch when tenant changes

  const loadFacturas = async () => {
    try {
      setLoadingFacturas(true);
      const allFacturas = await documentoApi.getByTipo('FACTURA');

      // Ordenar en orden inverso (más recientes primero)
      const sortedFacturas = allFacturas.sort((a, b) => {
        // Primero por fecha de emisión
        const dateA = new Date(a.fechaEmision).getTime();
        const dateB = new Date(b.fechaEmision).getTime();
        if (dateB !== dateA) return dateB - dateA;
        // Si misma fecha, por ID descendente
        return (b.id || 0) - (a.id || 0);
      });

      setFacturas(sortedFacturas);

      if (sortedFacturas.length === 0) {
        setAlert({
          open: true,
          message: 'No se encontraron facturas disponibles',
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
      setFacturaSeleccionada(null);
      setErrors({ ...errors, factura: '' });
      return;
    }

    setFacturaSeleccionada(factura);
    setForm({
      ...form,
      facturaId: factura.id,
      facturaNumero: factura.numeroDocumento,
      clienteId: factura.clienteId || 0,
      clienteNombre: factura.clienteNombre || '',
      equiposSeleccionados: [],
    });
    setErrors({ ...errors, factura: '' });

    await loadEquiposFactura(factura.id);
  };

  const loadEquiposFactura = async (facturaId: number) => {
    try {
      setLoadingEquipos(true);
      const factura = await documentoApi.getById(facturaId);

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

      const equiposPromises = equiposIds.map((id: number) =>
        api.get(`/api/equipos-fabricados/${id}`)
      );
      const equiposResponses = await Promise.all(equiposPromises);
      const equipos = equiposResponses.map(res => res.data);

      // Filtrar solo equipos ENTREGADOS
      const equiposEntregados = equipos.filter(
        (equipo: EquipoFabricadoDTO) => equipo.estadoAsignacion === 'ENTREGADO'
      );

      if (equiposEntregados.length === 0) {
        setAlert({
          open: true,
          message: 'No hay equipos en estado ENTREGADO disponibles para devolver',
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

  const handleSelectAll = () => {
    if (form.equiposSeleccionados.length === equiposFactura.length) {
      setForm({ ...form, equiposSeleccionados: [] });
    } else {
      setForm({ ...form, equiposSeleccionados: [...equiposFactura] });
    }
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
      newErrors.equipos = 'Debe seleccionar al menos un equipo para devolver';
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

      const currentUser = localStorage.getItem('user');
      const usuarioId = currentUser ? JSON.parse(currentUser).id : 1;

      const equiposADevolver = form.equiposSeleccionados.map(e => e.id);

      // Guardar datos ANTES de resetear el formulario
      const datosParaDialog: Omit<SuccessData, 'notaCredito'> = {
        equiposDevueltos: form.equiposSeleccionados.length,
        facturaNumero: form.facturaNumero,
        montoCalculado: montoCalculado,
        totalEquiposFactura: equiposFactura.length,
      };

      const notaCreditoData = {
        facturaId: form.facturaId!,
        usuarioId: usuarioId,
        observaciones: `${form.motivo}. ${form.observaciones || ''}`.trim(),
        equiposADevolver: equiposADevolver,
      };

      const notaCredito = await documentoApi.createNotaCredito(notaCreditoData);

      // Mostrar diálogo con los datos guardados
      setSuccessDialog({
        open: true,
        data: {
          notaCredito,
          ...datosParaDialog,
        },
      });

      // Resetear formulario DESPUÉS de guardar los datos
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
      setFacturaSeleccionada(null);

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
    setSuccessDialog({ open: false, data: null });
    loadFacturas();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          pb: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard sx={{ fontSize: 28, color: 'warning.main' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="600">
              Notas de Crédito
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generar notas de crédito por devolución de equipos
            </Typography>
          </Box>
        </Box>
      </Box>

      {alert.open && (
        <Alert
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Paso 1: Selección de Factura */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  1
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Receipt sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Seleccionar Factura
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Autocomplete
                options={facturas}
                getOptionLabel={(option) =>
                  `${option.numeroDocumento} - ${option.clienteNombre} (${dayjs(option.fechaEmision).format('DD/MM/YYYY')})`
                }
                loading={loadingFacturas}
                onChange={(_, value) => handleFacturaChange(value)}
                value={facturaSeleccionada}
                renderOption={({ key, ...props }, option) => (
                  <li key={key} {...props}>
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">
                        {option.numeroDocumento}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.clienteNombre} - {dayjs(option.fechaEmision).format('DD/MM/YYYY')} - {formatCurrency(option.total || 0)}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar factura por número o cliente"
                    error={!!errors.factura}
                    helperText={errors.factura || 'Las facturas se muestran de más reciente a más antigua'}
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

              {facturaSeleccionada && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Cliente</Typography>
                      <Typography variant="body2" fontWeight="600">{form.clienteNombre}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Factura</Typography>
                      <Typography variant="body2" fontWeight="600">{form.facturaNumero}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Fecha</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {dayjs(facturaSeleccionada.fechaEmision).format('DD/MM/YYYY')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Total Factura</Typography>
                      <Typography variant="body2" fontWeight="600" color="primary.main">
                        {formatCurrency(facturaSeleccionada.total || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Paso 2: Selección de Equipos */}
        {form.facturaId && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      2
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Inventory sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="600">
                        Seleccionar Equipos a Devolver
                      </Typography>
                    </Box>
                  </Box>

                  {equiposFactura.length > 0 && (
                    <Button
                      size="small"
                      onClick={handleSelectAll}
                      variant="outlined"
                    >
                      {form.equiposSeleccionados.length === equiposFactura.length
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {loadingEquipos ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : equiposFactura.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No hay equipos en estado ENTREGADO disponibles para devolver en esta factura.
                  </Alert>
                ) : (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={
                                  form.equiposSeleccionados.length > 0 &&
                                  form.equiposSeleccionados.length < equiposFactura.length
                                }
                                checked={form.equiposSeleccionados.length === equiposFactura.length}
                                onChange={handleSelectAll}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>N° Heladera</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Modelo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Medida</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
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
                                selected={isSelected}
                                sx={{
                                  cursor: 'pointer',
                                  '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  },
                                  '&.Mui-selected:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  },
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={isSelected} />
                                </TableCell>
                                <TableCell>
                                  <Typography fontWeight="600">{equipo.numeroHeladera}</Typography>
                                </TableCell>
                                <TableCell>{equipo.tipo}</TableCell>
                                <TableCell>{equipo.modelo}</TableCell>
                                <TableCell>{equipo.color || '-'}</TableCell>
                                <TableCell>{equipo.medida || '-'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={equipo.estadoAsignacion}
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {errors.equipos && (
                      <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        {errors.equipos}
                      </Alert>
                    )}

                    {/* Resumen de selección */}
                    {form.equiposSeleccionados.length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 2,
                          p: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.08),
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Equipos seleccionados
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="success.main">
                              {form.equiposSeleccionados.length} de {equiposFactura.length}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">
                              Monto a acreditar (proporcional)
                            </Typography>
                            <Typography variant="h6" fontWeight="600" color="primary.main">
                              {formatCurrency(montoCalculado)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Tooltip title="El monto se calcula proporcionalmente según la cantidad de equipos devueltos respecto al total de la factura">
                              <Alert severity="info" sx={{ py: 0.5, borderRadius: 1 }}>
                                <Typography variant="caption">
                                  {form.equiposSeleccionados.length === equiposFactura.length
                                    ? 'Devolución total'
                                    : 'Devolución parcial'}
                                </Typography>
                              </Alert>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Paso 3: Motivo y Observaciones */}
        {form.equiposSeleccionados.length > 0 && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    3
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Description sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="600">
                      Motivo de la Devolución
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
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
                      label="Observaciones adicionales"
                      value={form.observaciones}
                      onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                      placeholder="Describa detalladamente el motivo de la devolución..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Resumen y botones de acción */}
        {form.equiposSeleccionados.length > 0 && form.motivo && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: `2px solid ${theme.palette.warning.main}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.04),
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Warning sx={{ color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Confirmar Nota de Crédito
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Factura</Typography>
                    <Typography variant="body1" fontWeight="600">{form.facturaNumero}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Cliente</Typography>
                    <Typography variant="body1" fontWeight="600">{form.clienteNombre}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Equipos a devolver</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {form.equiposSeleccionados.length} de {equiposFactura.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Monto a acreditar</Typography>
                    <Typography variant="h6" fontWeight="600" color="primary.main">
                      {formatCurrency(montoCalculado)}
                    </Typography>
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Atención:</strong> Esta acción generará una nota de crédito,
                    acreditará {formatCurrency(montoCalculado)} en la cuenta corriente del cliente
                    y devolverá {form.equiposSeleccionados.length} equipo(s) al inventario.
                  </Typography>
                </Alert>

                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    color="inherit"
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
                      setFacturaSeleccionada(null);
                      setErrors({ factura: '', equipos: '', motivo: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleSubmit}
                    disabled={creating}
                    startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                    sx={{ minWidth: 200 }}
                  >
                    {creating ? 'Creando...' : 'Crear Nota de Crédito'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
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
            borderRadius: 3,
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
                bgcolor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <CheckCircle sx={{ fontSize: 50, color: 'success.main' }} />
            </Box>

            <Typography variant="h5" fontWeight="600" gutterBottom>
              Nota de Crédito Generada
            </Typography>

            {successDialog.data && (
              <>
                <Typography variant="body1" color="text.secondary" paragraph>
                  La nota de crédito ha sido creada exitosamente
                </Typography>

                <Alert
                  severity="success"
                  sx={{
                    mb: 3,
                    textAlign: 'left',
                    width: '100%',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    Acciones realizadas:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <li>
                      <Typography variant="body2">
                        Crédito de <strong>{formatCurrency(successDialog.data.montoCalculado)}</strong> aplicado
                        a la cuenta corriente del cliente
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        <strong>{successDialog.data.equiposDevueltos}</strong> equipo(s) devuelto(s) al
                        inventario (estado: DISPONIBLE)
                      </Typography>
                    </li>
                  </Box>
                </Alert>

                <Paper
                  elevation={0}
                  sx={{
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    p: 2.5,
                    width: '100%',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        N° Nota de Crédito
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {successDialog.data.notaCredito?.numeroDocumento || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {successDialog.data.notaCredito?.clienteNombre}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Monto Acreditado
                      </Typography>
                      <Typography variant="body1" fontWeight="600" color="success.main">
                        {formatCurrency(successDialog.data.montoCalculado)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Equipos Devueltos
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {successDialog.data.equiposDevueltos} de {successDialog.data.totalEquiposFactura}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Factura de Referencia
                      </Typography>
                      <Typography variant="body1" fontWeight="600">
                        {successDialog.data.facturaNumero}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {successDialog.data.equiposDevueltos < successDialog.data.totalEquiposFactura && (
                  <Alert
                    severity="info"
                    sx={{
                      mt: 2,
                      width: '100%',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Nota:</strong> Esta fue una devolución parcial.
                      Quedan {successDialog.data.totalEquiposFactura - successDialog.data.equiposDevueltos} equipo(s)
                      de la factura original sin devolver.
                    </Typography>
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSuccessClose}
            sx={{ minWidth: 150, borderRadius: 2 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotasCreditoPage;
