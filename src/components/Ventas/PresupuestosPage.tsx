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
  AppBar,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { clienteApi, usuarioApi, productApi } from "../../api/services";
import { documentoApi } from "../../api/documentoApi";
import type {
  DocumentoComercial,
  Cliente,
  Usuario,
  Producto,
  EstadoDocumento,
  CreatePresupuestoRequest,
  DetalleDocumento,
} from "../../types";
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

const money = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PresupuestosPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientesData, usuariosData, presupuestosData, productosData] = await Promise.all([
        clienteApi.getAll().catch((err: any) => {
          console.error("Error fetching clientes:", err);
          setError("Error al cargar clientes: " + (err.response?.data?.message || err.message));
          return [];
        }),
        usuarioApi.getAll().catch((err: any) => {
          console.error("Error fetching usuarios:", err);
          setError("Error al cargar usuarios: " + (err.response?.data?.message || err.message));
          return [];
        }),
        documentoApi.getByTipo("PRESUPUESTO").catch((err: any) => {
          console.error("Error fetching presupuestos:", err);
          const errorMessage =
            err.response?.status === 403
              ? "No tiene permisos para ver los presupuestos. Contacte al administrador."
              : "Error al cargar presupuestos: " + (err.response?.data?.message || err.message);
          setError(errorMessage);
          return [];
        }),
        productApi.getAll().catch((err: any) => {
          console.error("Error fetching productos:", err);
          setError("Error al cargar productos: " + (err.response?.data?.message || err.message));
          return [];
        }),
      ]);

      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      setPresupuestos(Array.isArray(presupuestosData) ? presupuestosData : []);
      setProductos(
        Array.isArray((productosData as any)?.content)
          ? (productosData as any).content
          : Array.isArray(productosData)
          ? (productosData as any)
          : []
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar los datos: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = useCallback(
    (estado: EstadoDocumento): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
      switch (estado) {
        case EstadoDocumentoEnum.PENDIENTE:
          return "warning";
        case EstadoDocumentoEnum.APROBADO:
          return "success";
        case EstadoDocumentoEnum.RECHAZADO:
          return "error";
        default:
          return "default";
      }
    },
    []
  );

  const getStatusLabel = useCallback((estado: EstadoDocumento): string => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE:
        return "Pendiente";
      case EstadoDocumentoEnum.APROBADO:
        return "Aprobado";
      case EstadoDocumentoEnum.RECHAZADO:
        return "Rechazado";
      default:
        return estado as string;
    }
  }, []);

  const total = useMemo(() => detalles.reduce((sum, d) => sum + d.subtotal, 0), [detalles]);

  const addDetalle = useCallback(() => {
    if (readOnly) return;
    setDetalles((prev) => [...prev, { ...initialDetalle }]);
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const updateDetalle = useCallback(
    (index: number, field: keyof DetalleForm, value: string | number) => {
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
            detalle.precioUnitario = (producto as any).precio || 0;
            detalle.subtotal = detalle.cantidad * ((producto as any).precio || 0);
          }
        }

        return newDetalles;
      });
      setHasUnsavedChanges(true);
    },
    [readOnly, productos]
  );

  const removeDetalle = useCallback(
    (index: number) => {
      if (readOnly) return;
      setDetalles((prev) => prev.filter((_, i) => i !== index));
      setHasUnsavedChanges(true);
    },
    [readOnly]
  );

  const handleOpenDialog = useCallback(
    (presupuesto?: DocumentoComercial, readOnlyMode = false) => {
      setReadOnly(readOnlyMode);
      setHasUnsavedChanges(false);
      if (presupuesto) {
        setEditingPresupuesto(presupuesto);
        setFormData({
          clienteId: presupuesto.clienteId?.toString?.() || "",
          usuarioId: presupuesto.usuarioId?.toString?.() || user?.id?.toString?.() || "",
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
        setFormData({ ...initialFormData, usuarioId: user?.id?.toString?.() || "" });
        setDetalles([]);
      }
      setDialogOpen(true);
    },
    [user]
  );

  const handleCloseDialog = useCallback(() => {
    if (hasUnsavedChanges && !window.confirm("¿Descartar cambios no guardados?")) return;
    setDialogOpen(false);
    setEditingPresupuesto(null);
    setFormData({ ...initialFormData, usuarioId: user?.id?.toString?.() || "" });
    setDetalles([]);
    setError(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, user]);

  const handleSavePresupuesto = useCallback(async () => {
    if (!user) {
      setError("Debe iniciar sesión");
      return;
    }
    const payload: CreatePresupuestoRequest = {
      clienteId: Number(formData.clienteId),
      usuarioId: Number(formData.usuarioId) || (user as any).id,
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
        // Actualiza solo el estado (según tu API actual)
        savedPresupuesto = await documentoApi.updateEstado(editingPresupuesto.id, formData.estado);
        setPresupuestos((prev) => prev.map((p) => (p.id === editingPresupuesto!.id ? savedPresupuesto : p)));
      } else {
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
  }, [user, formData, detalles, editingPresupuesto, handleCloseDialog]);

  // --- MOBILE CARDS VIEW (xs) ---
  const MobileCards: React.FC = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {presupuestos.map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mr: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.numeroDocumento}
              </Typography>
              <Chip size="small" label={getStatusLabel(p.estado)} color={getStatusColor(p.estado)} />
            </Box>
            <Typography variant="body2" sx={{ mb: 0.25 }}>
              <strong>Cliente:</strong> {p.clienteNombre}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.25 }}>
              <strong>Fecha:</strong> {new Date(p.fechaEmision).toLocaleDateString("es-AR")}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Total:</strong> ${money(p.total)}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Tooltip title="Ver">
                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(p, true)} aria-label={`Ver presupuesto ${p.numeroDocumento}`}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(p, false)} aria-label={`Editar presupuesto ${p.numeroDocumento}`}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Imprimir">
                <IconButton size="small" color="success" aria-label={`Imprimir presupuesto ${p.numeroDocumento}`}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Enviar">
                <IconButton size="small" color="info" aria-label={`Enviar presupuesto ${p.numeroDocumento}`}>
                  <SendIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: { xs: 280, sm: 360, md: 400 }, px: 2 }}>
        <CircularProgress aria-label="Cargando datos" />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }}>
      {/* Header responsive */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          mb: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ m: 0, fontSize: { xs: "1.6rem", sm: "1.8rem", md: "2rem" } }}>
          Presupuestos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} disabled={loading} aria-label="Crear nuevo presupuesto" sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
          Nuevo Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {productos.length === 0 && (
        <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 } }}>
          No hay productos disponibles. Contacte al administrador para configurar productos.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {/* List view on mobile; table on >= sm */}
          {isMobile ? (
            <MobileCards />
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: "auto", maxWidth: "100%", "&::-webkit-scrollbar": { height: 8 } }}>
              <Table aria-label="Tabla de presupuestos" size="small" stickyHeader sx={{ minWidth: 760, tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140 }}>Número</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell sx={{ width: 140 }}>Fecha</TableCell>
                    <TableCell sx={{ width: 130 }}>Estado</TableCell>
                    <TableCell sx={{ width: 140, textAlign: "right" }}>Total</TableCell>
                    <TableCell sx={{ width: 200 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {presupuestos.map((presupuesto) => (
                    <TableRow key={presupuesto.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {presupuesto.numeroDocumento}
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                        {presupuesto.clienteNombre}
                      </TableCell>
                      <TableCell>{new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel(presupuesto.estado)} color={getStatusColor(presupuesto.estado)} size="small" />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        ${money(presupuesto.total)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {presupuestos.length === 0 && (
            <Box sx={{ textAlign: "center", py: { xs: 5, md: 8 }, px: { xs: 2 } }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay presupuestos registrados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Comience creando su primer presupuesto
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} disabled={loading} aria-label="Crear primer presupuesto">
                Crear Presupuesto
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth fullScreen={isMobile} aria-labelledby="presupuesto-dialog-title">
        {/* AppBar only on mobile */}
        {isMobile && (
          <AppBar position="sticky" elevation={0} color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Toolbar sx={{ gap: 1 }}>
              <IconButton edge="start" onClick={handleCloseDialog} aria-label="Cerrar">
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {editingPresupuesto ? (readOnly ? "Ver Presupuesto" : "Editar Presupuesto") : "Nuevo Presupuesto"}
              </Typography>
              {!readOnly && (
                <Button startIcon={<SaveIcon />} onClick={handleSavePresupuesto} disabled={formLoading || !formData.clienteId || detalles.length === 0}>
                  {editingPresupuesto ? "Actualizar" : "Crear"}
                </Button>
              )}
            </Toolbar>
          </AppBar>
        )}

        {!isMobile && (
          <DialogTitle id="presupuesto-dialog-title" sx={{ pr: { xs: 2, sm: 3 } }}>
            {editingPresupuesto ? (readOnly ? "Ver Presupuesto" : "Editar Presupuesto") : "Nuevo Presupuesto"}
          </DialogTitle>
        )}

        <DialogContent sx={{ minHeight: { xs: "auto", sm: 500 }, px: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ pt: { xs: 0.5, sm: 2 } }}>
            {/* Form header responsive */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(240px, 1fr))" }, gap: { xs: 1.5, sm: 2 } }}>
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

            {/* Tabla detalles responsive */}
            <TableContainer component={Paper} sx={{ mb: 2, overflowX: "auto" }}>
              <Table size="small" aria-label="Tabla de detalles del presupuesto" stickyHeader sx={{ minWidth: 760, tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: { xs: 220, sm: 240 } }}>Producto</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell sx={{ width: 120 }}>Cantidad</TableCell>
                    <TableCell sx={{ width: 140 }}>Precio Unit.</TableCell>
                    <TableCell sx={{ width: 140 }}>Subtotal</TableCell>
                    {!readOnly && !editingPresupuesto && <TableCell sx={{ width: 80 }}>Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => (
                      <TableRow key={index} hover>
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
                                  {producto.nombre} - ${money((producto as any).precio || 0)}
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
                            inputProps={{ min: 1, inputMode: "numeric", pattern: "[0-9]*" }}
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
                            inputProps={{ min: 0, step: 0.01, inputMode: "decimal" }}
                            disabled={readOnly || !!editingPresupuesto}
                            error={detalle.precioUnitario <= 0 && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          ${money(detalle.subtotal)}
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

            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2 }}>
              {!readOnly && !editingPresupuesto && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addDetalle} disabled={productos.length === 0} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
                  Agregar Detalle
                </Button>
              )}
              <Typography variant="h6" sx={{ textAlign: { xs: "right", sm: "left" } }}>
                Total: ${money(total)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        {!isMobile && (
          <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1, sm: 1.5 }, display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button onClick={handleCloseDialog} disabled={formLoading}>Cerrar</Button>
            {!readOnly && (
              <Button variant="contained" onClick={handleSavePresupuesto} disabled={formLoading || !formData.clienteId || detalles.length === 0} aria-label={editingPresupuesto ? "Actualizar presupuesto" : "Crear presupuesto"}>
                {formLoading ? <CircularProgress size={22} /> : editingPresupuesto ? "Actualizar" : "Crear"}
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default PresupuestosPage;
