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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { clienteApi, usuarioApi, productApi } from "../../api/services";
import { documentoApi } from "../../api/documentoApi";
import type { DocumentoComercial, Cliente, Usuario, Producto, EstadoDocumento, CreatePresupuestoRequest, DetalleDocumento } from "../../types";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import { useAuth } from "../../context/AuthContext";

// Define interfaces for clarity
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

// Initial states
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

// Configurable default user ID (set to a valid ID or null if not applicable)
const DEFAULT_USER_ID = null; // Replace with a valid user ID if known (e.g., 1 for a system user)

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

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientesData, usuariosData, presupuestosData, productosData] = await Promise.all([
        clienteApi.getAll().catch((err) => {
          console.error("Error fetching clientes:", err);
          setError("Error al cargar clientes");
          return [];
        }),
        usuarioApi.getAll().catch((err) => {
          console.error("Error fetching usuarios:", err);
          setError("Error al cargar usuarios");
          return [];
        }),
        documentoApi.getByTipo("PRESUPUESTO").catch((err) => {
          console.error("Error fetching presupuestos:", err);
          setError("Error al cargar presupuestos");
          return [];
        }),
        productApi.getAll().catch((err) => {
          console.error("Error fetching productos:", err);
          setError("Error al cargar productos");
          return [];
        }),
      ]);

      console.log("Fetched data:", { clientesData, usuariosData, presupuestosData, productosData });

      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      setPresupuestos(Array.isArray(presupuestosData) ? presupuestosData : []);
      setProductos(Array.isArray(productosData.content) ? productosData.content : Array.isArray(productosData) ? productosData : []);
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

  // Auto-select first user or default for new presupuesto
  useEffect(() => {
    if (dialogOpen && !editingPresupuesto && !formData.usuarioId) {
      if (usuarios.length > 0) {
        setFormData((prev) => ({ ...prev, usuarioId: usuarios[0].id.toString() }));
      } else if (DEFAULT_USER_ID) {
        setFormData((prev) => ({ ...prev, usuarioId: DEFAULT_USER_ID.toString() }));
      }
    }
  }, [dialogOpen, editingPresupuesto, usuarios]);

  // Memoized status helpers
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

  // Memoized total calculation
  const total = useMemo(() => detalles.reduce((sum, detalle) => sum + detalle.subtotal, 0), [detalles]);

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
        usuarioId: presupuesto.usuarioId.toString() || "",
        fechaEmision: presupuesto.fechaEmision?.split("T")[0] || new Date().toISOString().split("T")[0],
        observaciones: presupuesto.observaciones || "",
        estado: presupuesto.estado,
      });
      setDetalles(
        Array.isArray(presupuesto.detalles)
          ? presupuesto.detalles.map((detalle: DetalleDocumento) => ({
              id: detalle.id,
              productoId: detalle.productoId?.toString() || "",
              descripcion: detalle.descripcion,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
            }))
          : []
      );
    } else {
      setEditingPresupuesto(null);
      setFormData({ ...initialFormData, usuarioId: DEFAULT_USER_ID?.toString() || "" });
      setDetalles([]);
    }
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (hasUnsavedChanges && !window.confirm("¿Descartar cambios no guardados?")) return;
    setDialogOpen(false);
    setEditingPresupuesto(null);
    setFormData({ ...initialFormData, usuarioId: DEFAULT_USER_ID?.toString() || "" });
    setDetalles([]);
    setError(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  const handleSavePresupuesto = useCallback(async () => {
    if (!user) { setError("Debe iniciar sesión"); return; }
    const payload: CreatePresupuestoRequest = {
      clienteId: Number(formData.clienteId),
      usuarioId: user.id, // tomado del contexto
      observaciones: formData.observaciones,
      detalles: detalles.map(d=>({
        productoId: Number(d.productoId),
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        descripcion: d.descripcion
      }))
    };
    try {
      // Validate form fields
      if (!formData.clienteId) {
        setError("Debe seleccionar un cliente");
        return;
      }
      if (!formData.usuarioId && usuarios.length > 0) {
        setError("Debe seleccionar un usuario");
        return;
      }
      if (!formData.usuarioId && !DEFAULT_USER_ID) {
        setError("No hay usuarios disponibles y no se configuró un usuario por defecto");
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
    } catch (err: any) {
      console.error("Error saving presupuesto:", err);
      let errorMessage = "Error al guardar el presupuesto";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = `${err.response.data.error}: ${err.response.data.message || ""}`;
      } else if (err.response?.data) {
        errorMessage = `Error ${err.response.status}: ${JSON.stringify(err.response.data)}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }, [user, formData, detalles, editingPresupuesto, usuarios, handleCloseDialog]);

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

      {(usuarios.length === 0 || productos.length === 0) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {usuarios.length === 0 && productos.length === 0
            ? "No hay usuarios ni productos disponibles. Contacte al administrador para configurar usuarios y productos."
            : usuarios.length === 0
            ? "No hay usuarios disponibles. Contacte al administrador para configurar usuarios."
            : "No hay productos disponibles. Contacte al administrador para configurar productos."}
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
            {usuarios.length === 0 && !editingPresupuesto && !DEFAULT_USER_ID && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay usuarios disponibles. Configure un usuario por defecto o contacte al administrador.
              </Alert>
            )}
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
                required={usuarios.length > 0 && !DEFAULT_USER_ID}
                disabled={readOnly || !!editingPresupuesto || (usuarios.length === 0 && !DEFAULT_USER_ID)}
                error={!formData.usuarioId && hasUnsavedChanges && usuarios.length > 0 && !DEFAULT_USER_ID}
                helperText={!formData.usuarioId && hasUnsavedChanges && usuarios.length > 0 && !DEFAULT_USER_ID ? "Seleccione un usuario" : ""}
              >
                {usuarios.length > 0 ? (
                  <>
                    <MenuItem value="">Seleccionar usuario</MenuItem>
                    {usuarios.map((usuario) => (
                      <MenuItem key={usuario.id} value={usuario.id.toString()}>
                        {usuario.nombre}
                      </MenuItem>
                    ))}
                  </>
                ) : (
                  <MenuItem value={DEFAULT_USER_ID?.toString() || ""} disabled>
                    {DEFAULT_USER_ID ? "Usuario por defecto" : "No hay usuarios disponibles"}
                  </MenuItem>
                )}
              </TextField>

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
              disabled={formLoading || !formData.clienteId || detalles.length === 0 || (!formData.usuarioId && usuarios.length > 0 && !DEFAULT_USER_ID)}
              aria-label={editingPresupuesto ? "Actualizar presupuesto" : "Crear presupuesto"}
            >
              {formLoading ? <CircularProgress size={24} /> : editingPresupuesto ? "Actualizar" : "Crear"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PresupuestosPage;