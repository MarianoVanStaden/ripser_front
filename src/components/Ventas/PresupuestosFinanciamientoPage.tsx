import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
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
  Grid,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  CardActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
} from "@mui/icons-material";
import type { Presupuesto, OpcionFinanciamiento } from "../../types";


const PresupuestosFinanciamientoPage: React.FC = () => {
  const [presupuestos] = useState<Presupuesto[]>([
    {
      id: 1,
      numeroDocumento: "PRE-001",
      clienteNombre: "Cliente Ejemplo S.A.",
      fechaEmision: "2025-01-15",
      estado: "PENDIENTE",
      subtotal: 100000,
      total: 100000,
      opcionesFinanciamiento: [
        {
          id: 1,
          nombre: "Contado - 10% descuento",
          metodoPago: "EFECTIVO",
          cantidadCuotas: 1,
          tasaInteres: -10,
          montoTotal: 90000,
          montoCuota: 90000,
          descripcion: "Pago al contado con descuento especial",
          ordenPresentacion: 1,
        },
        {
          id: 2,
          nombre: "3 cuotas sin interés",
          metodoPago: "TARJETA_CREDITO",
          cantidadCuotas: 3,
          tasaInteres: 0,
          montoTotal: 100000,
          montoCuota: 33333.33,
          descripcion: "Con tarjetas seleccionadas",
          ordenPresentacion: 2,
        },
        {
          id: 3,
          nombre: "6 cuotas - 15% interés",
          metodoPago: "TARJETA_CREDITO",
          cantidadCuotas: 6,
          tasaInteres: 15,
          montoTotal: 115000,
          montoCuota: 19166.67,
          descripcion: "Financiación con tarjeta",
          ordenPresentacion: 3,
        },
        {
          id: 4,
          nombre: "12 cuotas - 30% interés",
          metodoPago: "FINANCIACION_PROPIA",
          cantidadCuotas: 12,
          tasaInteres: 30,
          montoTotal: 130000,
          montoCuota: 10833.33,
          descripcion: "Financiación directa con la empresa",
          ordenPresentacion: 4,
        },
      ],
      numeroPresupuesto: "",
      cliente: undefined,
      fechaPresupuesto: "",
      fechaVencimiento: "",
      observaciones: "",
      detalles: []
    },
  ]);

  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);

  const handleOpenFinanciamiento = (presupuesto: Presupuesto) => {
    setSelectedPresupuesto(presupuesto);
    setSelectedOpcionId(presupuesto.opcionFinanciamientoSeleccionadaId || null);
    setFinanciamientoDialogOpen(true);
  };

  const handleSelectOpcion = () => {
    if (selectedPresupuesto && selectedOpcionId) {
      // Here you would call the API to save the selection
      console.log(`Opción ${selectedOpcionId} seleccionada para presupuesto ${selectedPresupuesto.id}`);
      setFinanciamientoDialogOpen(false);
    }
  };

  const getMetodoPagoIcon = (metodoPago: string) => {
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

  const getMetodoPagoLabel = (metodoPago: string) => {
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
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Presupuestos con Financiamiento
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nuevo Presupuesto
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Los presupuestos ahora incluyen múltiples opciones de financiamiento para ofrecer a sus clientes.
      </Alert>

      <Card>
        <CardContent>
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
                {presupuestos.map((presupuesto) => {
                  const opcionSeleccionada = presupuesto.opcionesFinanciamiento?.find(
                    (o) => o.id === presupuesto.opcionFinanciamientoSeleccionadaId
                  );
                  return (
                    <TableRow key={presupuesto.id}>
                      <TableCell>{presupuesto.numeroDocumento}</TableCell>
                      <TableCell>{presupuesto.clienteNombre}</TableCell>
                      <TableCell>{new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>
                        <Chip
                          label={presupuesto.estado}
                          color={presupuesto.estado === "PENDIENTE" ? "warning" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(presupuesto.subtotal)}</TableCell>
                      <TableCell>
                        {opcionSeleccionada ? (
                          <Chip
                            label={opcionSeleccionada.nombre}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
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
                        <Tooltip title="Ver">
                          <IconButton size="small" color="primary">
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Imprimir">
                          <IconButton size="small" color="success">
                            <PrintIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
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
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Presupuesto:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPresupuesto.numeroDocumento}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Cliente:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedPresupuesto.clienteNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal (sin financiamiento):
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(selectedPresupuesto.subtotal)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <RadioGroup
                value={selectedOpcionId}
                onChange={(e) => setSelectedOpcionId(Number(e.target.value))}
              >
                <Grid container spacing={2}>
                  {selectedPresupuesto.opcionesFinanciamiento
                    ?.sort((a, b) => (a.ordenPresentacion || 0) - (b.ordenPresentacion || 0))
                    .map((opcion) => (
                      <Grid item xs={12} key={opcion.id}>
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

                                  <Grid container spacing={2}>
                                    <Grid item xs={3}>
                                      <Typography variant="body2" color="text.secondary">
                                        Método de pago:
                                      </Typography>
                                      <Typography variant="body1">
                                        {getMetodoPagoLabel(opcion.metodoPago)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                      <Typography variant="body2" color="text.secondary">
                                        Cuotas:
                                      </Typography>
                                      <Typography variant="body1">
                                        {opcion.cantidadCuotas === 1
                                          ? "Pago único"
                                          : `${opcion.cantidadCuotas} cuotas`}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                      <Typography variant="body2" color="text.secondary">
                                        Valor cuota:
                                      </Typography>
                                      <Typography variant="body1" fontWeight="medium">
                                        {formatCurrency(opcion.montoCuota)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
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
                                    </Grid>
                                  </Grid>

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
                      </Grid>
                    ))}
                </Grid>
              </RadioGroup>

              {selectedOpcionId && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Resumen de la opción seleccionada:</strong>
                  </Typography>
                  {(() => {
                    const opcion = selectedPresupuesto.opcionesFinanciamiento?.find(
                      (o) => o.id === selectedOpcionId
                    );
                    return opcion ? (
                      <Typography variant="body2">
                        {opcion.nombre} - {opcion.cantidadCuotas}{" "}
                                                {opcion.nombre} - {opcion.cantidadCuotas} cuota(s) de {formatCurrency(opcion.montoCuota)}. Total: {formatCurrency(opcion.montoTotal)}.
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
            disabled={!selectedOpcionId}
            startIcon={<SendIcon />}
          >
            Confirmar Selección
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PresupuestosFinanciamientoPage;
