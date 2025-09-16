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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
} from "@mui/icons-material";
import type { Presupuesto } from "../../types"; // OpcionFinanciamiento si lo necesitás en otras partes

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
      // Acá iría tu llamada a la API para guardar la selección
      console.log(`Opción ${selectedOpcionId} seleccionada para presupuesto ${selectedPresupuesto.id}`);
      setFinanciamientoDialogOpen(false);
    }
  };

  const getMetodoPagoIcon = (metodoPago: string) => {
    switch (metodoPago) {
      case "EFECTIVO":
        return <MoneyIcon fontSize="small" />;
      case "TARJETA_CREDITO":
        return <CreditCardIcon fontSize="small" />;
      case "FINANCIACION_PROPIA":
        return <BankIcon fontSize="small" />;
      default:
        return <MoneyIcon fontSize="small" />;
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }} maxWidth="xl" mx="auto">
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          Presupuestos con Financiamiento
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nuevo Presupuesto
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Los presupuestos ahora incluyen múltiples opciones de financiamiento para ofrecer a sus clientes.
      </Alert>

      {/* Tabla - optimizada para escritorio */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 0,
              overflowX: "auto",
              maxHeight: { xs: 560, md: "calc(100vh - 320px)" },
            }}
          >
            <Table stickyHeader size="small" aria-label="tabla-presupuestos" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Número</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }} align="right">
                    Total Base
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Financiamiento</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {presupuestos.map((presupuesto) => {
                  const opcionSeleccionada = presupuesto.opcionesFinanciamiento?.find(
                    (o) => o.id === presupuesto.opcionFinanciamientoSeleccionadaId
                  );

                  return (
                    <TableRow hover key={presupuesto.id}>
                      <TableCell>{presupuesto.numeroDocumento}</TableCell>
                      <TableCell>
                        <Tooltip title={presupuesto.clienteNombre}>
                          <Typography noWrap maxWidth={260}>
                            {presupuesto.clienteNombre}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={presupuesto.estado}
                          color={presupuesto.estado === "PENDIENTE" ? "warning" : "default"}
                          size="small"
                          variant="outlined"
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
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
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
                        </Box>
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
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Opciones de Financiamiento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seleccione la opción de pago más conveniente para el cliente
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {selectedPresupuesto && (
            <>
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Presupuesto:
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedPresupuesto.numeroDocumento}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Cliente:
                    </Typography>
                    <Typography variant="body1" fontWeight={600} noWrap>
                      {selectedPresupuesto.clienteNombre}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal (sin financiamiento):
                    </Typography>
                    <Typography variant="h6" fontWeight={800}>
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
                      <Grid item xs={12} md={6} key={opcion.id}>
                        <Card
                          variant="outlined"
                          sx={{
                            height: "100%",
                            borderWidth: selectedOpcionId === opcion.id ? 2 : 1,
                            borderColor: selectedOpcionId === opcion.id ? "primary.main" : "divider",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: "primary.main",
                              bgcolor: "action.hover",
                            },
                          }}
                        >
                          <CardContent sx={{ pb: 1.5 }}>
                            <FormControlLabel
                              value={opcion.id}
                              control={<Radio />}
                              sx={{ m: 0, width: "100%" }}
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
                                        sx={{ ml: 1 }}
                                      />
                                    )}
                                  </Box>

                                  <Grid container spacing={1.5}>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Método de pago
                                      </Typography>
                                      <Typography variant="body1">
                                        {getMetodoPagoLabel(opcion.metodoPago)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Cuotas
                                      </Typography>
                                      <Typography variant="body1">
                                        {opcion.cantidadCuotas === 1
                                          ? "Pago único"
                                          : `${opcion.cantidadCuotas} cuotas`}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Valor cuota
                                      </Typography>
                                      <Typography variant="body1" fontWeight={600}>
                                        {formatCurrency(opcion.montoCuota)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="body2" color="text.secondary">
                                        Total a pagar
                                      </Typography>
                                      <Typography
                                        variant="h6"
                                        fontWeight={800}
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
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </RadioGroup>

              {selectedOpcionId && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Resumen de la opción seleccionada:
                  </Typography>
                  {(() => {
                    const opcion = selectedPresupuesto.opcionesFinanciamiento?.find(
                      (o) => o.id === selectedOpcionId
                    );
                    return opcion ? (
                      <Typography variant="body2">
                        {opcion.nombre} — {opcion.cantidadCuotas}{" "}
                        {opcion.cantidadCuotas === 1 ? "cuota" : "cuotas"} de{" "}
                        {formatCurrency(opcion.montoCuota)}. Total:{" "}
                        {formatCurrency(opcion.montoTotal)}.
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
