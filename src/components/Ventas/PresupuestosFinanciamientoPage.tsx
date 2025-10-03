import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  Snackbar,
  DialogActions,
  DialogContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from "@mui/material";
import {
  Print as PrintIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import SendIcon from "@mui/icons-material/Send";
import { documentoApi } from "../../api/services/documentoApi";
import opcionFinanciamientoApi from "../../api/services/opcionFinanciamientoApi";
import type { DocumentoComercial, OpcionFinanciamientoDTO, MetodoPago } from "../../types";

// API real

const PresupuestosFinanciamientoPage: React.FC = () => {

  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [loadingOpciones, setLoadingOpciones] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
  loadPresupuestos();
  }, []);

  const loadPresupuestos = async () => {
    setLoading(true);
    setError(null);
    try {
  const data = await documentoApi.getPresupuestos();
      setPresupuestos(data);
    } catch (e) {
      console.error('Error al cargar presupuestos:', e);
      setError('No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFinanciamiento = async (presupuesto: DocumentoComercial) => {
    setSelectedPresupuesto(presupuesto);
    setSelectedOpcionId(presupuesto.opcionFinanciamientoSeleccionadaId || null);
    setFinanciamientoDialogOpen(true);
    setLoadingOpciones(true);

    try {
    const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(presupuesto.id);
      setOpcionesFinanciamiento(opciones);
      
      const opcionSeleccionada = opciones.find(o => o.esSeleccionada);
      if (opcionSeleccionada) {
        setSelectedOpcionId(opcionSeleccionada.id ?? null);
      }
    } catch (err) {
      console.error('Error al cargar opciones de financiamiento:', err);
      setSnackbar({
        open: true,
        message: 'Error al cargar las opciones de financiamiento',
        severity: 'error'
      });
    } finally {
      setLoadingOpciones(false);
    }
  };

  const handleSelectOpcion = async () => {
    if (selectedPresupuesto && selectedOpcionId) {
      setLoading(true);
      try {
    await documentoApi.selectFinanciamiento(selectedPresupuesto.id, selectedOpcionId);
        
        // Actualizar el estado local
    setPresupuestos(prev => prev.map(p => 
          p.id === selectedPresupuesto.id 
      ? { ...p, opcionFinanciamientoSeleccionadaId: selectedOpcionId }
      : p
        ));
        
        setSnackbar({
          open: true,
          message: 'Opción de financiamiento seleccionada correctamente',
          severity: 'success'
        });
        
        setFinanciamientoDialogOpen(false);
        await loadPresupuestos();
      } catch (err) {
        console.error('Error al seleccionar opción:', err);
        setSnackbar({
          open: true,
          message: 'Error al seleccionar la opción de financiamiento',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handlePrint = (presupuesto: DocumentoComercial) => {
    // Simular impresión
    console.log('Imprimiendo presupuesto:', presupuesto);
    setSnackbar({
      open: true,
      message: `Preparando impresión del presupuesto ${presupuesto.numeroDocumento}`,
      severity: 'info'
    });
  };

  const getMetodoPagoIcon = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case "EFECTIVO":
        return <MoneyIcon />;
      case "TARJETA_CREDITO":
        return <CreditCardIcon />;
      case "FINANCIACION_PROPIA":
        return <BankIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  const getMetodoPagoLabel = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case "EFECTIVO":
        return "Efectivo";
      case "TARJETA_CREDITO":
        return "Tarjeta de Crédito";
      case "FINANCIACION_PROPIA":
        return "Financiación Propia";
      default:
        return metodoPago;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined) return "$0.00";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "warning";
      case "APROBADO":
        return "success";
      case "RECHAZADO":
        return "error";
      case "PAGADA":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Presupuestos con Financiamiento
        </Typography>
        <Box>
          <IconButton onClick={loadPresupuestos} sx={{ mr: 2 }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Los presupuestos ahora incluyen múltiples opciones de financiamiento para ofrecer a sus clientes.
        Al crear un presupuesto, se generan automáticamente 4 opciones de pago predefinidas.
      </Alert>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Total Base</TableCell>
                    <TableCell>Financiamiento</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {presupuestos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay presupuestos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    presupuestos.map((presupuesto) => (
                      <TableRow key={presupuesto.id}>
                        <TableCell>{presupuesto.numeroDocumento}</TableCell>
                        <TableCell>{presupuesto.clienteNombre || 'Sin cliente'}</TableCell>
                        <TableCell>
                          {presupuesto.fechaEmision
                            ? new Date(presupuesto.fechaEmision).toLocaleDateString('es-AR')
                            : 'Sin fecha'}
                        </TableCell>
                        <TableCell>
                          <Chip label={presupuesto.estado} color={getEstadoColor(presupuesto.estado)} size="small" />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(presupuesto.subtotal)}</TableCell>
                        <TableCell>
                          {presupuesto.opcionFinanciamientoSeleccionadaId ? (
                            <Chip label="Opción seleccionada" size="small" color="primary" variant="outlined" />
                          ) : (
                            <Chip label="Sin seleccionar" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Ver opciones de financiamiento">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenFinanciamiento(presupuesto)}
                            >
                              <MoneyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir">
                            <IconButton size="small" color="success" onClick={() => handlePrint(presupuesto)}>
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Opciones de Financiamiento */}
      <Dialog
        open={financiamientoDialogOpen}
        onClose={() => setFinanciamientoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5">Opciones de Financiamiento</Typography>
          <Typography variant="body2" color="text.secondary">
            Seleccione la opción de pago más conveniente para el cliente
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPresupuesto && (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Presupuesto:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPresupuesto.numeroDocumento}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Cliente:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPresupuesto.clienteNombre || 'Sin cliente'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal (sin financiamiento):
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(selectedPresupuesto.subtotal)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {loadingOpciones ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <RadioGroup
                  value={selectedOpcionId}
                  onChange={(e) => setSelectedOpcionId(Number(e.target.value))}
                >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {opcionesFinanciamiento
                      .sort((a, b) => (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0))
                      .map((opcion) => (
        <Box key={opcion.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              border: selectedOpcionId === opcion.id ? 2 : 1,
                              borderColor: selectedOpcionId === opcion.id ? "primary.main" : "divider",
                              transition: "all 0.3s",
                              "&:hover": {
                                borderColor: "primary.main",
                                bgcolor: "action.hover",
                              },
                            }}
                          >
                            <CardContent>
                              <FormControlLabel
                                value={opcion.id}
                                control={<Radio />}
                                label={
                                  <Box sx={{ width: "100%" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                      {getMetodoPagoIcon(opcion.metodoPago)}
                                      <Typography variant="h6" sx={{ ml: 1 }}>
                                        {opcion.nombre}
                                      </Typography>
                                      {opcion.tasaInteres < 0 && (
                                        <Chip
                                          label={`${Math.abs(opcion.tasaInteres)}% OFF`}
                                          color="success"
                                          size="small"
                                          sx={{ ml: 2 }}
                                        />
                                      )}
                                    </Box>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2 }}>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Método de pago:
                                        </Typography>
                                        <Typography variant="body1">
                                          {getMetodoPagoLabel(opcion.metodoPago)}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Cuotas:
                                        </Typography>
                                        <Typography variant="body1">
                                          {opcion.cantidadCuotas === 1
                                            ? "Pago único"
                                            : `${opcion.cantidadCuotas} cuotas`}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Valor cuota:
                                        </Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                          {formatCurrency(opcion.montoCuota)}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Total a pagar:
                                        </Typography>
                                        <Typography
                                          variant="h6"
                                          fontWeight="bold"
                                          color={opcion.tasaInteres < 0 ? "success.main" : "text.primary"}
                                        >
                                          {formatCurrency(opcion.montoTotal)}
                                        </Typography>
                                      </Box>
                                    </Box>

                                    {opcion.descripcion && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {opcion.descripcion}
                                      </Typography>
                                    )}

                                    {opcion.tasaInteres > 0 && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Interés aplicado: {opcion.tasaInteres}% (
                                          {formatCurrency(opcion.montoTotal - selectedPresupuesto.subtotal)})
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                                sx={{ width: "100%", m: 0 }}
                              />
                            </CardContent>
                          </Card>
        </Box>
                      ))}
      </Box>
                </RadioGroup>
              )}

              {selectedOpcionId && opcionesFinanciamiento.length > 0 && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Resumen de la opción seleccionada:</strong>
                  </Typography>
                  {(() => {
                    const opcion = opcionesFinanciamiento.find((o) => o.id === selectedOpcionId);
                    return opcion ? (
                      <Typography variant="body2">
                        {opcion.nombre} - {opcion.cantidadCuotas} cuota(s) de {formatCurrency(opcion.montoCuota)}. 
                        Total: {formatCurrency(opcion.montoTotal)}.
                      </Typography>
                    ) : null;
                  })()}
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setFinanciamientoDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleSelectOpcion}
            variant="contained"
            color="primary"
            disabled={!selectedOpcionId || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {loading ? 'Guardando...' : 'Confirmar Selección'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PresupuestosFinanciamientoPage;