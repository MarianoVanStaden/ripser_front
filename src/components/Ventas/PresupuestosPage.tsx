import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Snackbar,
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
import { clienteApi, usuarioApi, productApi } from "../../api/services";
import { documentoApi } from "../../api/services/documentoApi";
import opcionFinanciamientoApi from "../../api/services/opcionFinanciamientoApi";
import type { DocumentoComercial, Cliente, Usuario, Producto, EstadoDocumento, DetalleDocumento, OpcionFinanciamientoDTO, MetodoPago, DetalleDocumentoDTO } from "../../types";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface DetalleForm {
  id?: number;
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface FormData {
  clienteId: string;
  usuarioId: string;
  fechaEmision: string;
  observaciones: string;
  estado: EstadoDocumento;
}

const initialFormData: FormData = {
  clienteId: "",
  usuarioId: "",
  fechaEmision: new Date().toISOString().split("T")[0],
  observaciones: "",
  estado: EstadoDocumentoEnum.PENDIENTE,
};

const initialDetalle: DetalleForm = {
  productoId: "",
  descripcion: "",
  cantidad: 1,
  precioUnitario: 0,
  subtotal: 0,
};

const PresupuestosPage: React.FC = () => {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<DocumentoComercial | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [detalles, setDetalles] = useState<DetalleForm[]>([]);
  const [readOnly, setReadOnly] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Financiamiento UI state
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [opcionesFinanciamiento, setOpcionesFinanciamiento] = useState<OpcionFinanciamientoDTO[]>([]);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [loadingOpciones, setLoadingOpciones] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientesData, usuariosData, presupuestosData, productosData] = await Promise.all([
        clienteApi.getAll().catch((err) => {
          console.error("Error fetching clientes:", err);
          setError("Error al cargar clientes: " + (err.response?.data?.message || err.message));
          return [];
        }),
        usuarioApi.getAll().catch((err) => {
          console.error("Error fetching usuarios:", err);
          console.log("Usuarios response:", err.response?.data, err.response?.status);
          setError("Error al cargar usuarios: " + (err.response?.data?.message || err.message));
          return [];
        }),
        documentoApi.getByTipo("PRESUPUESTO").catch((err) => {
          console.error("Error fetching presupuestos:", err);
          console.log("Presupuestos response:", err.response?.data, err.response?.status);
          const errorMessage = err.response?.status === 403
            ? "No tiene permisos para ver los presupuestos. Contacte al administrador."
            : "Error al cargar presupuestos: " + (err.response?.data?.message || err.message);
          setError(errorMessage);
          return [];
        }),
        productApi.getAll().catch((err) => {
          console.error("Error fetching productos:", err);
          setError("Error al cargar productos: " + (err.response?.data?.message || err.message));
          return [];
        }),
      ]);

  console.log("Fetched data:", { clientesData, usuariosData, presupuestosData, productosData });
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      setPresupuestos(Array.isArray(presupuestosData) ? presupuestosData : []);
  setProductos(Array.isArray(productosData) ? productosData : []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setLoading(false);
      console.log("Loading complete, loading:", false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = useCallback((estado: EstadoDocumento): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "warning";
      case EstadoDocumentoEnum.APROBADO: return "success";
      case EstadoDocumentoEnum.RECHAZADO: return "error";
      default: return "default";
    }
  }, []);

  const getStatusLabel = useCallback((estado: EstadoDocumento): string => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return "Pendiente";
      case EstadoDocumentoEnum.APROBADO: return "Aprobado";
      case EstadoDocumentoEnum.RECHAZADO: return "Rechazado";
      default: return estado;
    }
  }, []);

  const total = useMemo(() => detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0), [detalles]);

  const getMetodoPagoIcon = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case 'EFECTIVO':
        return <MoneyIcon fontSize="small" />;
      case 'TARJETA_CREDITO':
        return <CreditCardIcon fontSize="small" />;
      case 'TRANSFERENCIA_BANCARIA':
      case 'FINANCIACION_PROPIA':
        return <BankIcon fontSize="small" />;
      default:
        return <MoneyIcon fontSize="small" />;
    }
  };

  const getMetodoPagoLabel = (metodoPago: MetodoPago | string) => {
    switch (metodoPago) {
      case 'EFECTIVO':
        return 'Efectivo';
      case 'TARJETA_CREDITO':
        return 'Tarjeta de Crédito';
      case 'TARJETA_DEBITO':
        return 'Tarjeta de Débito';
      case 'TRANSFERENCIA_BANCARIA':
        return 'Transferencia bancaria';
      case 'FINANCIACION_PROPIA':
        return 'Financiación propia';
      case 'CHEQUE':
        return 'Cheque';
      default:
        return String(metodoPago);
    }
  };

  const addDetalle = useCallback(() => {
    if (readOnly) return;
    setDetalles((prev) => [...prev, { ...initialDetalle }]);
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const updateDetalle = useCallback((index: number, field: keyof DetalleForm, value: string | number) => {
    if (readOnly) return;
    setDetalles((prev) => {
      const newDetalles = [...prev];
      const detalle = newDetalles[index];

      if (field === "productoId") detalle.productoId = value as string;
      else if (field === "descripcion") detalle.descripcion = value as string;
      else if (field === "cantidad") detalle.cantidad = Number(value) || 0;
      else if (field === "precioUnitario") detalle.precioUnitario = Number(value) || 0;

      if (field === "cantidad" || field === "precioUnitario") {
        detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
      }

      if (field === "productoId" && value) {
        const producto = productos.find((p) => p.id === Number(value));
        if (producto) {
          detalle.descripcion = producto.nombre;
          detalle.precioUnitario = producto.precio || 0;
          detalle.subtotal = detalle.cantidad * (producto.precio || 0);
        }
      }

      return newDetalles;
    });
    setHasUnsavedChanges(true);
  }, [readOnly, productos]);

  const removeDetalle = useCallback((index: number) => {
    if (readOnly) return;
    setDetalles((prev) => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const handleOpenDialog = useCallback((presupuesto?: DocumentoComercial, readOnlyMode = false) => {
    setReadOnly(readOnlyMode);
    setHasUnsavedChanges(false);
    if (presupuesto) {
  setEditingPresupuesto(presupuesto);
      setFormData({
        clienteId: presupuesto.clienteId.toString() || "",
    usuarioId: presupuesto.usuarioId?.toString() || (user?.id ?? 0).toString(),
        fechaEmision: presupuesto.fechaEmision?.split("T")[0] || new Date().toISOString().split("T")[0],
        observaciones: presupuesto.observaciones || "",
        estado: presupuesto.estado,
      });
      setDetalles(
        Array.isArray(presupuesto.detalles)
          ? presupuesto.detalles.map((detalle: DetalleDocumento) => ({
              id: detalle.id,
      productoId: detalle.productoId?.toString() || "",
      descripcion: detalle.descripcion || "",
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
            }))
          : []
      );
    } else {
      setEditingPresupuesto(null);
  setFormData({ ...initialFormData, usuarioId: (user?.id ?? 0).toString() });
      setDetalles([]);
    }
    setDialogOpen(true);
  }, [user]);

  const handleCloseDialog = useCallback(() => {
    if (hasUnsavedChanges && !window.confirm("¿Descartar cambios no guardados?")) return;
  setDialogOpen(false);
    setEditingPresupuesto(null);
  setFormData({ ...initialFormData, usuarioId: (user?.id ?? 0).toString() });
    setDetalles([]);
    setError(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, user]);

  const handleSavePresupuesto = useCallback(async () => {
    if (!user) {
      setError("Debe iniciar sesión");
      return;
    }
    const payload: { clienteId: number; usuarioId: number; observaciones?: string; detalles: DetalleDocumentoDTO[] } = {
      clienteId: Number(formData.clienteId),
      usuarioId: Number(formData.usuarioId) || (user?.id ?? 0),
      observaciones: formData.observaciones,
      detalles: detalles.map((d) => ({
        productoId: Number(d.productoId),
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        descripcion: d.descripcion,
      })),
    };
    try {
      if (!formData.clienteId) {
        setError("Debe seleccionar un cliente");
        return;
      }
      if (detalles.length === 0) {
        setError("Debe agregar al menos un detalle");
        return;
      }
      for (const detalle of detalles) {
        if (!detalle.productoId || isNaN(Number(detalle.productoId)) || Number(detalle.productoId) <= 0) {
          setError("Todos los detalles deben tener un producto válido");
          return;
        }
        if (!detalle.descripcion.trim()) {
          setError("Todos los detalles deben tener una descripción");
          return;
        }
        if (detalle.cantidad <= 0) {
          setError("La cantidad debe ser mayor a 0");
          return;
        }
        if (detalle.precioUnitario <= 0) {
          setError("El precio unitario debe ser mayor a 0");
          return;
        }
      }

      setFormLoading(true);
      setError(null);

      let savedPresupuesto: DocumentoComercial;
      if (editingPresupuesto) {
        savedPresupuesto = await documentoApi.updateEstado(editingPresupuesto.id, formData.estado);
        setPresupuestos((prev) => prev.map((p) => (p.id === editingPresupuesto.id ? savedPresupuesto : p)));
      } else {
        console.log("Enviando datos:", JSON.stringify(payload));
        savedPresupuesto = await documentoApi.createPresupuesto(payload);
        setPresupuestos((prev) => [savedPresupuesto, ...prev]);
      }

      handleCloseDialog();
    } catch (err: unknown) {
      console.error("Error saving presupuesto:", err);
      let errorMessage = "Error al guardar el presupuesto";
      if (typeof err === 'object' && err && 'response' in err) {
        type Resp = { data?: unknown; status?: number };
        const r = (err as { response?: Resp }).response;
        if (r?.data) {
          const data = r.data as Record<string, unknown>;
          if (typeof data.message === 'string') errorMessage = data.message;
          else if (typeof data.error === 'string') errorMessage = `${data.error}: ${typeof data.message === 'string' ? data.message : ''}`;
          else errorMessage = `Error ${r.status}: ${JSON.stringify(r.data)}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }, [user, formData, detalles, editingPresupuesto, handleCloseDialog]);

  // Financiamiento handlers
  const handleOpenFinanciamiento = useCallback(async (presupuesto: DocumentoComercial) => {
    setSelectedPresupuesto(presupuesto);
    setSelectedOpcionId(presupuesto.opcionFinanciamientoSeleccionadaId || null);
    setFinanciamientoDialogOpen(true);
    setLoadingOpciones(true);
    try {
      const opciones = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(presupuesto.id);
      setOpcionesFinanciamiento(opciones);
      const seleccionada = opciones.find(o => o.esSeleccionada);
      if (seleccionada) setSelectedOpcionId(seleccionada.id ?? null);
    } catch (e) {
      console.error('Error cargando opciones:', e);
      setSnackbar({ open: true, message: 'Error al cargar opciones de financiamiento', severity: 'error' });
    } finally {
      setLoadingOpciones(false);
    }
  }, []);

  const handleSelectOpcion = useCallback(async () => {
    if (!selectedPresupuesto || !selectedOpcionId) return;
    try {
      await documentoApi.selectFinanciamiento(selectedPresupuesto.id, selectedOpcionId);
      setPresupuestos(prev => prev.map(p => p.id === selectedPresupuesto.id ? { ...p, opcionFinanciamientoSeleccionadaId: selectedOpcionId } : p));
      setSnackbar({ open: true, message: 'Financiamiento seleccionado', severity: 'success' });
      setFinanciamientoDialogOpen(false);
    } catch (e) {
      console.error('Error seleccionando opción:', e);
      setSnackbar({ open: true, message: 'No se pudo seleccionar la opción', severity: 'error' });
    }
  }, [selectedPresupuesto, selectedOpcionId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress aria-label="Cargando datos" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Presupuestos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
          aria-label="Crear nuevo presupuesto"
        >
          Nuevo Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {productos.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No hay productos disponibles. Contacte al administrador para configurar productos.
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table aria-label="Tabla de presupuestos">
              <TableHead>
                <TableRow>
                  <TableCell width="100px">Número</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell width="120px">Fecha</TableCell>
                  <TableCell width="100px">Estado</TableCell>
                  <TableCell width="120px" align="right">Total</TableCell>
                  <TableCell width="160px">Financiamiento</TableCell>
                  <TableCell width="150px">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presupuestos.map((presupuesto) => (
                  <TableRow key={presupuesto.id}>
                    <TableCell>{presupuesto.numeroDocumento}</TableCell>
                    <TableCell>{presupuesto.clienteNombre}</TableCell>
                    <TableCell>{new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(presupuesto.estado)}
                        color={getStatusColor(presupuesto.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${presupuesto.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {presupuesto.opcionFinanciamientoSeleccionadaId ? (
                        <Chip label="Opción seleccionada" size="small" color="primary" variant="outlined" />
                      ) : (
                        <Chip label="Sin seleccionar" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, true)} aria-label={`Ver presupuesto ${presupuesto.numeroDocumento}`}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, false)} aria-label={`Editar presupuesto ${presupuesto.numeroDocumento}`}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Opciones de financiamiento">
                        <IconButton size="small" color="secondary" onClick={() => handleOpenFinanciamiento(presupuesto)} aria-label={`Financiamiento presupuesto ${presupuesto.numeroDocumento}`}>
                          <MoneyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Imprimir">
                        <IconButton size="small" color="success" aria-label={`Imprimir presupuesto ${presupuesto.numeroDocumento}`}>
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Enviar">
                        <IconButton size="small" color="info" aria-label={`Enviar presupuesto ${presupuesto.numeroDocumento}`}>
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {presupuestos.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay presupuestos registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comience creando su primer presupuesto
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                disabled={loading}
                aria-label="Crear primer presupuesto"
              >
                Crear Presupuesto
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        aria-labelledby="presupuesto-dialog-title"
      >
        <DialogTitle id="presupuesto-dialog-title">
          {editingPresupuesto ? (readOnly ? "Ver Presupuesto" : "Editar Presupuesto") : "Nuevo Presupuesto"}
        </DialogTitle>
        <DialogContent sx={{ minHeight: "500px" }}>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(300px, 1fr))" }, gap: 2 }}>
              <TextField
                fullWidth
                select
                label="Cliente"
                value={formData.clienteId}
                onChange={(e) => {
                  setFormData({ ...formData, clienteId: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                margin="normal"
                required
                disabled={readOnly || !!editingPresupuesto}
                error={!formData.clienteId && hasUnsavedChanges}
                helperText={!formData.clienteId && hasUnsavedChanges ? "Seleccione un cliente" : ""}
              >
                <MenuItem value="">Seleccionar cliente</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nombre}
                  </MenuItem>
                ))}
              </TextField>

              {editingPresupuesto && usuarios.length > 0 && (
                <TextField
                  fullWidth
                  select
                  label="Usuario"
                  value={formData.usuarioId}
                  onChange={(e) => {
                    console.log("Usuario seleccionado:", e.target.value);
                    setFormData({ ...formData, usuarioId: e.target.value });
                    setHasUnsavedChanges(true);
                  }}
                  margin="normal"
                  disabled={readOnly}
                >
                  <MenuItem value="">Seleccionar usuario</MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                fullWidth
                select
                label="Estado"
                value={formData.estado}
                onChange={(e) => {
                  setFormData({ ...formData, estado: e.target.value as EstadoDocumento });
                  setHasUnsavedChanges(true);
                }}
                margin="normal"
                required
                disabled={readOnly || !editingPresupuesto}
              >
                <MenuItem value={EstadoDocumentoEnum.PENDIENTE}>Pendiente</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.APROBADO}>Aprobado</MenuItem>
                <MenuItem value={EstadoDocumentoEnum.RECHAZADO}>Rechazado</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Fecha de Emisión"
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => {
                  setFormData({ ...formData, fechaEmision: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Box>

            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => {
                setFormData({ ...formData, observaciones: e.target.value });
                setHasUnsavedChanges(true);
              }}
              margin="normal"
              multiline
              rows={3}
              disabled={readOnly || !!editingPresupuesto}
            />

            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Detalles del Presupuesto
            </Typography>

            {productos.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay productos disponibles. Contacte al administrador para configurar el catálogo de productos.
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small" aria-label="Tabla de detalles del presupuesto">
                <TableHead>
                  <TableRow>
                    <TableCell width="200px">Producto</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell width="100px">Cantidad</TableCell>
                    <TableCell width="120px">Precio Unit.</TableCell>
                    <TableCell width="120px">Subtotal</TableCell>
                    {!readOnly && !editingPresupuesto && <TableCell width="60px">Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={detalle.productoId}
                            onChange={(e) => updateDetalle(index, "productoId", e.target.value)}
                            disabled={readOnly || !!editingPresupuesto}
                            error={!detalle.productoId && hasUnsavedChanges}
                          >
                            <MenuItem value="">Sin producto</MenuItem>
                            {productos.length === 0 ? (
                              <MenuItem disabled>No hay productos disponibles</MenuItem>
                            ) : (
                              productos.map((producto) => (
                                <MenuItem key={producto.id} value={producto.id.toString()}>
                                  {producto.nombre} - ${producto.precio?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={detalle.descripcion}
                            onChange={(e) => updateDetalle(index, "descripcion", e.target.value)}
                            disabled={readOnly || !!editingPresupuesto}
                            error={!detalle.descripcion.trim() && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={detalle.cantidad}
                            onChange={(e) => updateDetalle(index, "cantidad", parseInt(e.target.value) || 0)}
                            inputProps={{ min: 1 }}
                            disabled={readOnly || !!editingPresupuesto}
                            error={detalle.cantidad <= 0 && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={detalle.precioUnitario}
                            onChange={(e) => updateDetalle(index, "precioUnitario", parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            disabled={readOnly || !!editingPresupuesto}
                            error={detalle.precioUnitario <= 0 && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell>
                          ${detalle.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        {!readOnly && !editingPresupuesto && (
                          <TableCell>
                            <Tooltip title="Eliminar detalle">
                              <IconButton size="small" color="error" onClick={() => removeDetalle(index)} aria-label="Eliminar detalle">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={readOnly || editingPresupuesto ? 5 : 6} align="center">
                        No hay detalles para este presupuesto.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              {!readOnly && !editingPresupuesto && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addDetalle} disabled={productos.length === 0}>
                  Agregar Detalle
                </Button>
              )}
              <Typography variant="h6">
                Total: ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={formLoading}>
            Cerrar
          </Button>
          {!readOnly && (
            <Button
              variant="contained"
              onClick={handleSavePresupuesto}
              disabled={formLoading || !formData.clienteId || detalles.length === 0}
              aria-label={editingPresupuesto ? "Actualizar presupuesto" : "Crear presupuesto"}
            >
              {formLoading ? <CircularProgress size={24} /> : editingPresupuesto ? "Actualizar" : "Crear"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog Opciones de Financiamiento */}
      <Dialog
        open={financiamientoDialogOpen}
        onClose={() => setFinanciamientoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Opciones de Financiamiento</Typography>
          <Typography variant="body2" color="text.secondary">Seleccione la opción de pago preferida</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPresupuesto && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Presupuesto: {selectedPresupuesto.numeroDocumento}</Typography>
              <Typography variant="body2" color="text.secondary">Cliente: {selectedPresupuesto.clienteNombre}</Typography>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Subtotal: ${selectedPresupuesto.subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
            </Box>
          )}
          <Divider sx={{ mb: 2 }} />
          {loadingOpciones ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <RadioGroup value={selectedOpcionId} onChange={(e) => setSelectedOpcionId(Number(e.target.value))}>
              {opcionesFinanciamiento.map((opcion) => (
                <Box key={opcion.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <FormControlLabel value={opcion.id} control={<Radio />} label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getMetodoPagoIcon(opcion.metodoPago)}
                        <Typography variant="subtitle1">{opcion.nombre}</Typography>
                        {opcion.tasaInteres < 0 && (
                          <Chip size="small" color="success" label={`${Math.abs(opcion.tasaInteres)}% OFF`} />
                        )}
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
                        <Typography variant="body2">Método: {getMetodoPagoLabel(opcion.metodoPago)}</Typography>
                        <Typography variant="body2">Cuotas: {opcion.cantidadCuotas}</Typography>
                        <Typography variant="body2">Cuota: ${opcion.montoCuota.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                        <Typography variant="body2">Total: ${opcion.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                      </Box>
                      {opcion.descripcion && <Typography variant="caption" color="text.secondary">{opcion.descripcion}</Typography>}
                    </Box>
                  } />
                </Box>
              ))}
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinanciamientoDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSelectOpcion} variant="contained" disabled={!selectedOpcionId}>
            Confirmar selección
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PresupuestosPage;
