import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
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
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { documentoApi } from "../../api/services";
import type { 
  DocumentoComercial, 
  EstadoDocumento,
  MetodoPago,
  DetalleDocumento 
} from "../../types";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
// Removed useAuth (unused)

type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';

interface ConvertFormData {
  presupuestoId: string;
  metodoPago: MetodoPago;
  tipoIva: TipoIva;
}

const initialConvertForm: ConvertFormData = {
  presupuestoId: "",
  metodoPago: "EFECTIVO" as MetodoPago,
  tipoIva: "IVA_21",
};

const NotasPedidoPage: React.FC = () => {
  const [notasPedido, setNotasPedido] = useState<DocumentoComercial[]>([]);
  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<DocumentoComercial | null>(null);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [convertForm, setConvertForm] = useState<ConvertFormData>(initialConvertForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [notasData, presupuestosData] = await Promise.all([
        documentoApi.getByTipo("NOTA_PEDIDO").catch((err) => {
          console.error("Error fetching notas de pedido:", err);
          return [];
        }),
        documentoApi.getByTipo("PRESUPUESTO").catch((err) => {
          console.error("Error fetching presupuestos:", err);
          return [];
        }),
      ]);

      setNotasPedido(Array.isArray(notasData) ? notasData : []);
      // Backend requires PRESUPUESTO in PENDIENTE state for conversion
      const pendientes = Array.isArray(presupuestosData)
        ? presupuestosData.filter(p => p.estado === EstadoDocumentoEnum.PENDIENTE)
        : [];
      setPresupuestos(pendientes);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = useCallback((estado: EstadoDocumento): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "warning";
      case EstadoDocumentoEnum.APROBADO: return "success";
      case EstadoDocumentoEnum.PAGADA: return "primary";
      case EstadoDocumentoEnum.VENCIDA: return "error";
      default: return "default";
    }
  }, []);

  const getStatusLabel = useCallback((estado: EstadoDocumento): string => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "Pendiente";
      case EstadoDocumentoEnum.APROBADO: return "Aprobado";
      case EstadoDocumentoEnum.PAGADA: return "Pagada";
      case EstadoDocumentoEnum.VENCIDA: return "Vencida";
      default: return estado;
    }
  }, []);

  const getMetodoPagoLabel = (metodo: MetodoPago): string => {
    const labels: Record<string, string> = {
      EFECTIVO: "Efectivo",
      TARJETA_CREDITO: "Tarjeta de Crédito",
      TARJETA_DEBITO: "Tarjeta de Débito",
  TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
  // Backward-compatibility if old values slip through
  TRANSFERENCIA: "Transferencia Bancaria",
      CHEQUE: "Cheque",
    };
    return labels[metodo] || metodo;
  };

  const getTipoIvaLabel = (tipo: TipoIva): string => {
    const labels: Record<TipoIva, string> = {
      IVA_21: "IVA 21%",
      IVA_10_5: "IVA 10.5%",
      EXENTO: "Exento",
    };
    return labels[tipo] || tipo;
  };

  const handleOpenConvertDialog = useCallback(() => {
    setConvertForm(initialConvertForm);
    setSelectedPresupuesto(null);
    setConvertDialogOpen(true);
  }, []);

  const handleCloseConvertDialog = useCallback(() => {
    setConvertDialogOpen(false);
    setConvertForm(initialConvertForm);
    setSelectedPresupuesto(null);
    setError(null);
  }, []);

  const handlePresupuestoSelect = useCallback((presupuestoId: string) => {
    const presupuesto = presupuestos.find(p => p.id.toString() === presupuestoId);
    setSelectedPresupuesto(presupuesto || null);
    setConvertForm(prev => ({ ...prev, presupuestoId }));
  }, [presupuestos]);

  const handleConvertToNotaPedido = useCallback(async () => {
    if (!convertForm.presupuestoId) {
      setError("Debe seleccionar un presupuesto");
      return;
    }

    try {
      setFormLoading(true);
      setError(null);

      const payload = {
        presupuestoId: Number(convertForm.presupuestoId),
        metodoPago: convertForm.metodoPago,
        tipoIva: convertForm.tipoIva,
      };

      const nuevaNota = await documentoApi.convertToNotaPedido(payload);
      setNotasPedido(prev => [nuevaNota, ...prev]);
      
      // Remove converted presupuesto from available list
      setPresupuestos(prev => prev.filter(p => p.id !== Number(convertForm.presupuestoId)));
      
      handleCloseConvertDialog();
    } catch (err: any) {
      console.error("Error converting to nota de pedido:", err);
      let errorMessage = "Error al convertir el presupuesto";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }, [convertForm, handleCloseConvertDialog]);

  const handleViewNota = useCallback((nota: DocumentoComercial) => {
    setSelectedNota(nota);
    setViewDialogOpen(true);
  }, []);

  const handleCloseViewDialog = useCallback(() => {
    setViewDialogOpen(false);
    setSelectedNota(null);
  }, []);

  const handleConvertToFactura = useCallback(async (notaId: number) => {
    if (!window.confirm("¿Está seguro de convertir esta Nota de Pedido en Factura?")) {
      return;
    }

    try {
      setError(null);
      await documentoApi.convertToFactura({ notaPedidoId: notaId });
      // Refresh data after conversion
      fetchData();
    } catch (err: any) {
      console.error("Error converting to factura:", err);
      let errorMessage = "Error al convertir a factura";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    }
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Notas de Pedido
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenConvertDialog}
          disabled={loading || presupuestos.length === 0}
        >
          Convertir Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {presupuestos.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay presupuestos pendientes disponibles para convertir en Nota de Pedido.
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha Emisión</TableCell>
                  <TableCell>Fecha Vencimiento</TableCell>
                  <TableCell>Método de Pago</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notasPedido.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell>{nota.numeroDocumento}</TableCell>
                    <TableCell>{nota.clienteNombre}</TableCell>
                    <TableCell>{new Date(nota.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>
                      {nota.fechaVencimiento 
                        ? new Date(nota.fechaVencimiento).toLocaleDateString("es-AR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {nota.metodoPago ? getMetodoPagoLabel(nota.metodoPago) : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(nota.estado)}
                        color={getStatusColor(nota.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${nota.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleViewNota(nota)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Convertir a Factura">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleConvertToFactura(nota.id)}
                          disabled={nota.estado !== EstadoDocumentoEnum.APROBADO && nota.estado !== EstadoDocumentoEnum.PENDIENTE}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Imprimir">
                        <IconButton size="small" color="info">
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Enviar">
                        <IconButton size="small" color="primary">
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {notasPedido.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay notas de pedido registradas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Convierta un presupuesto aprobado para crear una nota de pedido
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenConvertDialog}
                disabled={presupuestos.length === 0}
              >
                Convertir Presupuesto
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Convert Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={handleCloseConvertDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Convertir Presupuesto a Nota de Pedido</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              select
              label="Presupuesto Pendiente"
              value={convertForm.presupuestoId}
              onChange={(e) => handlePresupuestoSelect(e.target.value)}
              margin="normal"
              required
              error={!convertForm.presupuestoId && formLoading}
              helperText="Seleccione un presupuesto pendiente para convertir"
            >
              <MenuItem value="">Seleccionar presupuesto</MenuItem>
              {presupuestos.map((presupuesto) => (
                <MenuItem key={presupuesto.id} value={presupuesto.id.toString()}>
                  {presupuesto.numeroDocumento} - {presupuesto.clienteNombre} - 
                  ${presupuesto.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </MenuItem>
              ))}
            </TextField>

            {selectedPresupuesto && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: "grey.50" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detalles del Presupuesto
                </Typography>
                <Typography variant="body2">
                  Cliente: {selectedPresupuesto.clienteNombre}
                </Typography>
                <Typography variant="body2">
                  Fecha: {new Date(selectedPresupuesto.fechaEmision).toLocaleDateString("es-AR")}
                </Typography>
                <Typography variant="body2">
                  Total: ${selectedPresupuesto.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Typography>
                {selectedPresupuesto.observaciones && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Observaciones: {selectedPresupuesto.observaciones}
                  </Typography>
                )}
              </Paper>
            )}

            <TextField
              fullWidth
              select
              label="Método de Pago"
              value={convertForm.metodoPago}
              onChange={(e) => setConvertForm(prev => ({ 
                ...prev, 
                metodoPago: e.target.value as MetodoPago 
              }))}
              margin="normal"
              required
            >
              <MenuItem value="EFECTIVO">Efectivo</MenuItem>
              <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
              <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
              <MenuItem value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
            </TextField>

            <TextField
              fullWidth
              select
              label="Tipo de IVA"
              value={convertForm.tipoIva}
              onChange={(e) => setConvertForm(prev => ({ 
                ...prev, 
                tipoIva: e.target.value as TipoIva 
              }))}
              margin="normal"
              required
            >
              <MenuItem value="IVA_21">IVA 21%</MenuItem>
              <MenuItem value="IVA_10_5">IVA 10.5%</MenuItem>
              <MenuItem value="EXENTO">Exento</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConvertDialog} disabled={formLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConvertToNotaPedido}
            disabled={formLoading || !convertForm.presupuestoId}
            startIcon={formLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {formLoading ? "Convirtiendo..." : "Convertir"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nota de Pedido {selectedNota?.numeroDocumento}
        </DialogTitle>
        <DialogContent>
          {selectedNota && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography>{selectedNota.clienteNombre}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Usuario
                  </Typography>
                  <Typography>{selectedNota.usuarioNombre}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Emisión
                  </Typography>
                  <Typography>
                    {new Date(selectedNota.fechaEmision).toLocaleDateString("es-AR")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha de Vencimiento
                  </Typography>
                  <Typography>
                    {selectedNota.fechaVencimiento 
                      ? new Date(selectedNota.fechaVencimiento).toLocaleDateString("es-AR")
                      : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Método de Pago
                  </Typography>
                  <Typography>
                    {selectedNota.metodoPago ? getMetodoPagoLabel(selectedNota.metodoPago) : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipo de IVA
                  </Typography>
                  <Typography>
                    {selectedNota.tipoIva ? getTipoIvaLabel(selectedNota.tipoIva as TipoIva) : "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedNota.estado)}
                    color={getStatusColor(selectedNota.estado)}
                    size="small"
                  />
                </Box>
              </Box>

              {selectedNota.observaciones && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography>{selectedNota.observaciones}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Detalles
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="center">Cantidad</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedNota.detalles?.map((detalle: DetalleDocumento, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{detalle.productoNombre || "-"}</TableCell>
                        <TableCell>{detalle.descripcion}</TableCell>
                        <TableCell align="center">{detalle.cantidad}</TableCell>
                        <TableCell align="right">
                          ${detalle.precioUnitario.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right">
                          ${detalle.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ mr: 4 }}>Subtotal:</Typography>
                    <Typography>
                      ${selectedNota.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ mr: 4 }}>IVA:</Typography>
                    <Typography>
                      ${selectedNota.iva.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="h6" sx={{ mr: 4 }}>Total:</Typography>
                    <Typography variant="h6">
                      ${selectedNota.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotasPedidoPage;