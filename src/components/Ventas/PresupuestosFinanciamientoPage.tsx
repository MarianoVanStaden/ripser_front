import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  AppBar,
  Toolbar,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { clienteApi, productApi, documentoApi, usuarioApi } from "../../api/services";
import type {
  DocumentoComercial,
  Cliente,
  Producto,
  EstadoDocumento,
  CreatePresupuestoRequest,
  DetalleDocumentoDTO,
  OpcionFinanciamiento,
  Usuario,
} from "../../types";
import { EstadoDocumento as EstadoDocumentoEnum } from "../../types";
import { useAuth } from "../../context/AuthContext";

interface PresupuestoFormData {
  clienteId: string;
  usuarioId: string;
  observaciones: string;
  detalles: DetalleDocumentoDTO[];
  estado: EstadoDocumento;
  fechaEmision: string;
}

const initialFormData: PresupuestoFormData = {
  clienteId: "",
  usuarioId: "",
  observaciones: "",
  detalles: [],
  estado: EstadoDocumentoEnum.PENDIENTE,
  fechaEmision: new Date().toISOString().split("T")[0],
};

const initialDetalle: DetalleDocumentoDTO = {
  productoId: "",
  descripcion: "",
  cantidad: 1,
  precioUnitario: 0,
  subtotal: 0,
};

const PresupuestosFinanciamientoPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();

  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [financiamientoDialogOpen, setFinanciamientoDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<DocumentoComercial | null>(null);
  const [selectedOpcionId, setSelectedOpcionId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PresupuestoFormData>(initialFormData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const total = useMemo(() => formData.detalles.reduce((sum, d) => sum + (d.subtotal || 0), 0), [formData.detalles]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [presupuestosData, clientesData, productosData, usuariosData] = await Promise.all([
        documentoApi.getByTipo('PRESUPUESTO').catch((err: any) => {
          setError(err.message || "Error al cargar presupuestos: " + (err.response?.data?.message || err.message));
          return [];
        }),
        clienteApi.getAll().catch((err: any) => {
          setError("Error al cargar clientes: " + (err.response?.data?.message || err.message));
          return [];
        }),
        productApi.getAll().catch((err: any) => {
          setError("Error al cargar productos: " + (err.response?.data?.message || err.message));
          return [];
        }),
        usuarioApi.getAll().catch((err: any) => {
          setError("Error al cargar usuarios: " + (err.response?.data?.message || err.message));
          return [];
        }),
      ]);

      setPresupuestos(Array.isArray(presupuestosData) ? presupuestosData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setProductos(Array.isArray(productosData) ? productosData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (err: any) {
      setError("Error al cargar los datos: " + (err.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenFinanciamiento = useCallback(async (presupuesto: DocumentoComercial) => {
    try {
      setFormLoading(true);
      const opciones = await documentoApi.getOpcionesFinanciamiento(presupuesto.id);
      setSelectedPresupuesto({ ...presupuesto, opcionesFinanciamiento: opciones });
      setSelectedOpcionId(presupuesto.opcionFinanciamientoSeleccionadaId || null);
      setFinanciamientoDialogOpen(true);
    } catch (err: any) {
      setError(err.message || "Error al cargar opciones de financiamiento: " + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  }, []);

  const handleSelectOpcion = useCallback(async () => {
    if (selectedPresupuesto && selectedOpcionId) {
      setFormLoading(true);
      try {
        const updatedPresupuesto = await documentoApi.selectFinanciamiento(selectedPresupuesto.id, selectedOpcionId);
        setPresupuestos(prev =>
          prev.map(p =>
            p.id === selectedPresupuesto.id
              ? {
                  ...updatedPresupuesto,
                  opcionesFinanciamiento: updatedPresupuesto.opcionesFinanciamiento?.map(op => ({
                    ...op,
                    esSeleccionada: op.id === selectedOpcionId,
                  })),
                }
              : p
          )
        );
        setSuccess('Opción de financiamiento seleccionada correctamente');
        setFinanciamientoDialogOpen(false);
      } catch (err: any) {
        setError(err.message || 'Error al seleccionar opción de financiamiento: ' + (err.response?.data?.message || err.message));
      } finally {
        setFormLoading(false);
      }
    }
  }, [selectedPresupuesto, selectedOpcionId]);

  const handleCreatePresupuesto = useCallback(async () => {
    if (!user) {
      setError('Debe iniciar sesión');
      return;
    }
    if (!formData.clienteId) {
      setError('Debe seleccionar un cliente');
      return;
    }
    if (formData.detalles.length === 0) {
      setError('Debe agregar al menos un detalle');
      return;
    }
    for (const detalle of formData.detalles) {
      if (!detalle.productoId || isNaN(Number(detalle.productoId))) {
        setError('Todos los detalles deben tener un producto válido');
        return;
      }
      if (!detalle.descripcion.trim()) {
        setError('Todos los detalles deben tener una descripción');
        return;
      }
      if (detalle.cantidad <= 0) {
        setError('La cantidad debe ser mayor a 0');
        return;
      }
      if (detalle.precioUnitario <= 0) {
        setError('El precio unitario debe ser mayor a 0');
        return;
      }
    }

    setFormLoading(true);
    try {
      const payload: CreatePresupuestoRequest = {
        clienteId: Number(formData.clienteId),
        usuarioId: Number(formData.usuarioId) || user.id,
        observaciones: formData.observaciones,
        detalles: formData.detalles.map(d => ({
          productoId: Number(d.productoId),
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          descripcion: d.descripcion,
        })),
      };
      const newPresupuesto = await documentoApi.createPresupuesto(payload);
      setPresupuestos(prev => [newPresupuesto, ...prev]);
      setSuccess('Presupuesto creado correctamente');
      setCreateDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al crear presupuesto: ' + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  }, [user, formData]);

  const handleEditPresupuesto = useCallback(async () => {
    if (!selectedPresupuesto || !user) {
      setError('Usuario no autenticado o presupuesto no seleccionado');
      return;
    }
    if (!formData.clienteId) {
      setError('Debe seleccionar un cliente');
      return;
    }
    if (formData.detalles.length === 0) {
      setError('Debe agregar al menos un detalle');
      return;
    }

    setFormLoading(true);
    try {
      const updatedPresupuesto = await documentoApi.updateEstado(selectedPresupuesto.id, formData.estado);
      setPresupuestos(prev =>
        prev.map(p => (p.id === selectedPresupuesto.id ? updatedPresupuesto : p))
      );
      setSuccess('Presupuesto actualizado correctamente');
      setEditDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar presupuesto: ' + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  }, [selectedPresupuesto, user, formData]);

  const handleConvertToNotaPedido = useCallback(async (metodoPago: string, tipoIva: string) => {
    if (selectedPresupuesto) {
      setFormLoading(true);
      try {
        const converted = await documentoApi.convertToNotaPedido({
          presupuestoId: selectedPresupuesto.id,
          metodoPago: metodoPago as MetodoPago,
          tipoIva: tipoIva as 'IVA_21' | 'IVA_10_5' | 'EXENTO',
        });
        setPresupuestos(prev =>
          prev.map(p => (p.id === selectedPresupuesto.id ? converted : p))
        );
        setSuccess('Presupuesto convertido a Nota de Pedido');
        setConvertDialogOpen(false);
      } catch (err: any) {
        setError(err.message || 'Error al convertir presupuesto: ' + (err.response?.data?.message || err.message));
      } finally {
        setFormLoading(false);
      }
    }
  }, [selectedPresupuesto]);

  const handleOpenDialog = useCallback((presupuesto?: DocumentoComercial, readOnlyMode = false) => {
    setReadOnly(readOnlyMode);
    setHasUnsavedChanges(false);
    if (presupuesto) {
      setSelectedPresupuesto(presupuesto);
      setFormData({
        clienteId: presupuesto.clienteId.toString(),
        usuarioId: user?.id.toString() || "",
        observaciones: presupuesto.observaciones || "",
        detalles: presupuesto.detalles.map(d => ({
          productoId: d.productoId.toString(),
          descripcion: d.descripcion || d.productoNombre || "",
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal || 0,
        })),
        estado: presupuesto.estado,
        fechaEmision: presupuesto.fechaEmision.split("T")[0],
      });
    } else {
      setSelectedPresupuesto(null);
      setFormData({ ...initialFormData, usuarioId: user?.id.toString() || "" });
    }
    setCreateDialogOpen(!presupuesto);
    setEditDialogOpen(!!presupuesto && !readOnlyMode);
  }, [user]);

  const handleCloseDialog = useCallback(() => {
    if (hasUnsavedChanges && !window.confirm("¿Descartar cambios no guardados?")) return;
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setFinanciamientoDialogOpen(false);
    setConvertDialogOpen(false);
    setFormData({ ...initialFormData, usuarioId: user?.id.toString() || "" });
    setSelectedPresupuesto(null);
    setError(null);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, user]);

  const addProductToForm = useCallback((producto: Producto) => {
    if (readOnly) return;
    const newDetalle: DetalleDocumentoDTO = {
      productoId: producto.id.toString(),
      descripcion: producto.nombre,
      cantidad: 1,
      precioUnitario: producto.precio,
      subtotal: producto.precio,
    };
    setFormData(prev => ({
      ...prev,
      detalles: [...prev.detalles, newDetalle],
    }));
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const removeProductFromForm = useCallback((index: number) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  }, [readOnly]);

  const updateDetalle = useCallback((index: number, field: keyof DetalleDocumentoDTO, value: string | number) => {
    if (readOnly) return;
    setFormData(prev => {
      const newDetalles = [...prev.detalles];
      const detalle = newDetalles[index];

      if (field === "productoId") detalle.productoId = value as string;
      else if (field === "descripcion") detalle.descripcion = value as string;
      else if (field === "cantidad") detalle.cantidad = Number(value) || 0;
      else if (field === "precioUnitario") detalle.precioUnitario = Number(value) || 0;

      if (field === "cantidad" || field === "precioUnitario") {
        detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
      }

      if (field === "productoId" && value) {
        const producto = productos.find(p => p.id === Number(value));
        if (producto) {
          detalle.descripcion = producto.nombre;
          detalle.precioUnitario = producto.precio;
          detalle.subtotal = detalle.cantidad * producto.precio;
        }
      }

      return { ...prev, detalles: newDetalles };
    });
    setHasUnsavedChanges(true);
  }, [readOnly, productos]);

  const resetForm = useCallback(() => {
    setFormData({ ...initialFormData, usuarioId: user?.id.toString() || "" });
    setSelectedPresupuesto(null);
    setHasUnsavedChanges(false);
  }, [user]);

  const getMetodoPagoIcon = (metodoPago: string) => {
    switch (metodoPago) {
      case 'EFECTIVO': return <MoneyIcon fontSize="small" />;
      case 'TARJETA_CREDITO': return <CreditCardIcon fontSize="small" />;
      case 'FINANCIACION_PROPIA': return <BankIcon fontSize="small" />;
      default: return <MoneyIcon fontSize="small" />;
    }
  };

  const getMetodoPagoLabel = (metodoPago: string) => {
    switch (metodoPago) {
      case 'EFECTIVO': return 'Efectivo';
      case 'TARJETA_CREDITO': return 'Tarjeta de Crédito';
      case 'FINANCIACION_PROPIA': return 'Financiación Propia';
      case 'TRANSFERENCIA': return 'Transferencia';
      default: return metodoPago;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);

  const getEstadoColor = useCallback((estado: string) => {
    switch (estado) {
      case EstadoDocumentoEnum.PENDIENTE: return 'warning';
      case EstadoDocumentoEnum.APROBADO: return 'success';
      case EstadoDocumentoEnum.RECHAZADO: return 'error';
      default: return 'default';
    }
  }, []);

  const MobileCards: React.FC = () => (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {presupuestos.map((p) => (
        <Card key={p.id} variant="outlined">
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mr: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.numeroDocumento}
              </Typography>
              <Chip size="small" label={p.estado} color={getEstadoColor(p.estado)} />
            </Box>
            <Typography variant="body2" sx={{ mb: 0.25 }}>
              <strong>Cliente:</strong> {p.clienteNombre}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.25 }}>
              <strong>Fecha:</strong> {new Date(p.fechaEmision).toLocaleDateString("es-AR")}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Total:</strong> {formatCurrency(p.total)}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Tooltip title="Opciones de financiamiento">
                <IconButton size="small" color="primary" onClick={() => handleOpenFinanciamiento(p)}>
                  <MoneyIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ver">
                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(p, true)}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Editar">
                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(p, false)} disabled={p.estado !== EstadoDocumentoEnum.PENDIENTE}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Convertir a Nota de Pedido">
                <IconButton size="small" color="success" onClick={() => { setSelectedPresupuesto(p); setConvertDialogOpen(true); }} disabled={p.estado !== EstadoDocumentoEnum.PENDIENTE}>
                  <ReceiptIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 2 } }} maxWidth="xl" mx="auto">
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ m: 0, fontSize: { xs: "1.6rem", sm: "1.8rem", md: "2rem" } }}>
          Presupuestos con Financiamiento
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} disabled={loading || !user}>
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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: { xs: 280, sm: 360, md: 400 }, px: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {isMobile ? (
              <MobileCards />
            ) : (
              <TableContainer component={Paper} sx={{ overflowX: "auto", maxWidth: "100%" }}>
                <Table aria-label="Tabla de presupuestos" size="small" stickyHeader sx={{ minWidth: 760, tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 140, fontWeight: 700 }}>Número</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                      <TableCell sx={{ width: 140, fontWeight: 700 }}>Fecha</TableCell>
                      <TableCell sx={{ width: 130, fontWeight: 700 }}>Estado</TableCell>
                      <TableCell sx={{ width: 140, fontWeight: 700, textAlign: "right" }}>Total</TableCell>
                      <TableCell sx={{ width: 140, fontWeight: 700 }}>Financiamiento</TableCell>
                      <TableCell sx={{ width: 200, fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {presupuestos.map((presupuesto) => {
                      const opcionSeleccionada = presupuesto.opcionesFinanciamiento?.find(o => o.id === presupuesto.opcionFinanciamientoSeleccionadaId);
                      return (
                        <TableRow hover key={presupuesto.id}>
                          <TableCell>{presupuesto.numeroDocumento}</TableCell>
                          <TableCell>{presupuesto.clienteNombre}</TableCell>
                          <TableCell>{new Date(presupuesto.fechaEmision).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>
                            <Chip label={presupuesto.estado} color={getEstadoColor(presupuesto.estado)} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(presupuesto.total)}</TableCell>
                          <TableCell>
                            {opcionSeleccionada ? (
                              <Chip icon={<CheckCircleIcon />} label={opcionSeleccionada.nombre} size="small" color="primary" variant="filled" />
                            ) : (
                              <Chip label="Sin seleccionar" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <Tooltip title="Opciones de financiamiento">
                                <IconButton size="small" color="primary" onClick={() => handleOpenFinanciamiento(presupuesto)}>
                                  <MoneyIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Ver">
                                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, true)}>
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(presupuesto, false)} disabled={presupuesto.estado !== EstadoDocumentoEnum.PENDIENTE}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Convertir a Nota de Pedido">
                                <IconButton size="small" color="success" onClick={() => { setSelectedPresupuesto(presupuesto); setConvertDialogOpen(true); }} disabled={presupuesto.estado !== EstadoDocumentoEnum.PENDIENTE}>
                                  <ReceiptIcon />
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
            )}
            {presupuestos.length === 0 && (
              <Box sx={{ textAlign: "center", py: { xs: 5, md: 8 }, px: { xs: 2 } }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No hay presupuestos registrados
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {error && error.includes("permisos")
                    ? "No tiene permisos para ver presupuestos. Contacte al administrador."
                    : "Comience creando su primer presupuesto"}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} disabled={loading || !user}>
                  Crear Presupuesto
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Opciones de Financiamiento */}
      <Dialog open={financiamientoDialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth fullScreen={isMobile}>
        {isMobile && (
          <AppBar position="sticky" elevation={0} color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Toolbar sx={{ gap: 1 }}>
              <IconButton edge="start" onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Opciones de Financiamiento
              </Typography>
              <Button startIcon={<SaveIcon />} onClick={handleSelectOpcion} disabled={formLoading || !selectedOpcionId}>
                Seleccionar
              </Button>
            </Toolbar>
          </AppBar>
        )}
        {!isMobile && (
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight={700}>Opciones de Financiamiento</Typography>
            <Typography variant="body2" color="text.secondary">Seleccione la opción de pago más conveniente para el cliente</Typography>
          </DialogTitle>
        )}
        <DialogContent dividers>
          {selectedPresupuesto && (
            <>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Presupuesto:</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedPresupuesto.numeroDocumento}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                    <Typography variant="body1" fontWeight={600}>{selectedPresupuesto.clienteNombre}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Total con IVA:</Typography>
                    <Typography variant="h6" fontWeight={800}>{formatCurrency(selectedPresupuesto.total)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              {formLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <RadioGroup value={selectedOpcionId} onChange={(e) => setSelectedOpcionId(Number(e.target.value))}>
                  <Grid container spacing={2}>
                    {selectedPresupuesto.opcionesFinanciamiento?.sort((a, b) => a.ordenPresentacion - b.ordenPresentacion).map((opcion) => (
                      <Grid item xs={12} md={6} key={opcion.id}>
                        <Card variant="outlined" sx={{ height: '100%', borderWidth: selectedOpcionId === opcion.id ? 2 : 1, borderColor: selectedOpcionId === opcion.id ? 'primary.main' : 'divider', bgcolor: opcion.esSeleccionada ? 'action.selected' : 'background.paper' }}>
                          <CardContent>
                            <FormControlLabel value={opcion.id} control={<Radio />} sx={{ m: 0, width: '100%' }} label={
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {getMetodoPagoIcon(opcion.metodoPago)}
                                  <Typography variant="h6" sx={{ ml: 1 }}>{opcion.nombre}</Typography>
                                  {opcion.tasaInteres < 0 && <Chip label={`${Math.abs(opcion.tasaInteres)}% OFF`} color="success" size="small" sx={{ ml: 1 }} />}
                                  {opcion.esSeleccionada && <Chip icon={<CheckCircleIcon />} label="Actual" color="primary" size="small" sx={{ ml: 'auto' }} />}
                                </Box>
                                <Grid container spacing={1.5}>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Cuotas</Typography>
                                    <Typography variant="body1">{opcion.cantidadCuotas === 1 ? 'Pago único' : `${opcion.cantidadCuotas} cuotas`}</Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Valor cuota</Typography>
                                    <Typography variant="body1" fontWeight={600}>{formatCurrency(opcion.montoCuota)}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">Total final</Typography>
                                    <Typography variant="h6" fontWeight={800}>{formatCurrency(opcion.montoTotal)}</Typography>
                                  </Grid>
                                </Grid>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}><strong>Método:</strong> {getMetodoPagoLabel(opcion.metodoPago)}</Typography>
                                {opcion.descripcion && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{opcion.descripcion}</Typography>}
                                {opcion.tasaInteres > 0 && <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>Interés aplicado: {opcion.tasaInteres}%</Typography>}
                              </Box>
                            } />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              )}
            </>
          )}
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button variant="contained" onClick={handleSelectOpcion} disabled={!selectedOpcionId || formLoading} startIcon={formLoading ? <CircularProgress size={20} /> : <SaveIcon />}>
              {formLoading ? 'Guardando...' : 'Seleccionar Opción'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Dialog de Crear/Editar Presupuesto */}
      <Dialog open={createDialogOpen || editDialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth fullScreen={isMobile}>
        {isMobile && (
          <AppBar position="sticky" elevation={0} color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Toolbar sx={{ gap: 1 }}>
              <IconButton edge="start" onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {editDialogOpen ? (readOnly ? "Ver Presupuesto" : "Editar Presupuesto") : "Nuevo Presupuesto"}
              </Typography>
              {!readOnly && (
                <Button startIcon={<SaveIcon />} onClick={editDialogOpen ? handleEditPresupuesto : handleCreatePresupuesto} disabled={formLoading || !formData.clienteId || formData.detalles.length === 0}>
                  {editDialogOpen ? "Actualizar" : "Crear"}
                </Button>
              )}
            </Toolbar>
          </AppBar>
        )}
        {!isMobile && (
          <DialogTitle>
            <Typography variant="h5" fontWeight={700}>{editDialogOpen ? (readOnly ? "Ver Presupuesto" : "Editar Presupuesto") : "Nuevo Presupuesto"}</Typography>
          </DialogTitle>
        )}
        <DialogContent sx={{ minHeight: { xs: "auto", sm: 500 }, px: { xs: 1.5, sm: 3 } }}>
          <Box sx={{ pt: { xs: 0.5, sm: 2 } }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fit, minmax(240px, 1fr))" }, gap: { xs: 1.5, sm: 2 } }}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.clienteId}
                  onChange={(e) => { setFormData({ ...formData, clienteId: e.target.value }); setHasUnsavedChanges(true); }}
                  label="Cliente"
                  disabled={readOnly || editDialogOpen}
                  error={!formData.clienteId && hasUnsavedChanges}
                >
                  <MenuItem value="">Seleccionar cliente</MenuItem>
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre} - {cliente.cuit}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {editDialogOpen && usuarios.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={formData.usuarioId}
                    onChange={(e) => { setFormData({ ...formData, usuarioId: e.target.value }); setHasUnsavedChanges(true); }}
                    label="Usuario"
                    disabled={readOnly}
                  >
                    <MenuItem value="">Seleccionar usuario</MenuItem>
                    {usuarios.map((usuario) => (
                      <MenuItem key={usuario.id} value={usuario.id.toString()}>
                        {usuario.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={(e) => { setFormData({ ...formData, estado: e.target.value as EstadoDocumento }); setHasUnsavedChanges(true); }}
                  label="Estado"
                  disabled={readOnly || !editDialogOpen}
                >
                  <MenuItem value={EstadoDocumentoEnum.PENDIENTE}>Pendiente</MenuItem>
                  <MenuItem value={EstadoDocumentoEnum.APROBADO}>Aprobado</MenuItem>
                  <MenuItem value={EstadoDocumentoEnum.RECHAZADO}>Rechazado</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Fecha de Emisión"
                type="date"
                value={formData.fechaEmision}
                onChange={(e) => { setFormData({ ...formData, fechaEmision: e.target.value }); setHasUnsavedChanges(true); }}
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) => { setFormData({ ...formData, observaciones: e.target.value }); setHasUnsavedChanges(true); }}
              margin="normal"
              disabled={readOnly || editDialogOpen}
            />
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Productos</Typography>
            <TableContainer component={Paper} sx={{ mb: 2, overflowX: "auto" }}>
              <Table size="small" aria-label="Tabla de detalles del presupuesto" stickyHeader sx={{ minWidth: 760, tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: { xs: 220, sm: 240 } }}>Producto</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell sx={{ width: 120 }}>Cantidad</TableCell>
                    <TableCell sx={{ width: 140 }}>Precio Unit.</TableCell>
                    <TableCell sx={{ width: 140 }}>Subtotal</TableCell>
                    {!readOnly && !editDialogOpen && <TableCell sx={{ width: 80 }}>Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.detalles.length > 0 ? (
                    formData.detalles.map((detalle, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={detalle.productoId}
                            onChange={(e) => updateDetalle(index, "productoId", e.target.value)}
                            disabled={readOnly || editDialogOpen}
                            error={!detalle.productoId && hasUnsavedChanges}
                          >
                            <MenuItem value="">Sin producto</MenuItem>
                            {productos.map((producto) => (
                              <MenuItem key={producto.id} value={producto.id.toString()}>
                                {producto.nombre} - {formatCurrency(producto.precio)}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={detalle.descripcion}
                            onChange={(e) => updateDetalle(index, "descripcion", e.target.value)}
                            disabled={readOnly || editDialogOpen}
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
                            disabled={readOnly || editDialogOpen}
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
                            disabled={readOnly || editDialogOpen}
                            error={detalle.precioUnitario <= 0 && hasUnsavedChanges}
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(detalle.subtotal)}</TableCell>
                        {!readOnly && !editDialogOpen && (
                          <TableCell>
                            <Tooltip title="Eliminar detalle">
                              <IconButton size="small" color="error" onClick={() => removeProductFromForm(index)}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={readOnly || editDialogOpen ? 5 : 6} align="center">
                        No hay detalles para este presupuesto.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2 }}>
              {!readOnly && !editDialogOpen && (
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => addProductToForm({ id: 0, nombre: "", precio: 0, stock: 0 })} disabled={productos.length === 0}>
                  Agregar Detalle
                </Button>
              )}
              <Typography variant="h6" sx={{ textAlign: { xs: "right", sm: "left" } }}>
                Total: {formatCurrency(total * 1.21)}
              </Typography>
            </Box>
            {!readOnly && !editDialogOpen && (
              <Paper variant="outlined" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 0 }}>Agregar productos:</Typography>
                <List dense>
                  {productos.map((producto) => (
                    <ListItem key={producto.id}>
                      <ListItemText primary={producto.nombre} secondary={`Stock: ${producto.stock} - ${formatCurrency(producto.precio)}`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => addProductToForm(producto)} size="small" color="primary">
                          <AddIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 1, sm: 1.5 }, display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Button onClick={handleCloseDialog} disabled={formLoading}>Cerrar</Button>
            {!readOnly && (
              <Button variant="contained" onClick={editDialogOpen ? handleEditPresupuesto : handleCreatePresupuesto} disabled={formLoading || !formData.clienteId || formData.detalles.length === 0}>
                {formLoading ? <CircularProgress size={22} /> : editDialogOpen ? "Actualizar" : "Crear"}
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>

      {/* Dialog de Conversión a Nota de Pedido */}
      <Dialog open={convertDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        {isMobile && (
          <AppBar position="sticky" elevation={0} color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Toolbar sx={{ gap: 1 }}>
              <IconButton edge="start" onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>Convertir a Nota de Pedido</Typography>
              <Button startIcon={<ReceiptIcon />} onClick={() => handleConvertToNotaPedido('EFECTIVO', 'IVA_21')} disabled={formLoading}>
                Convertir
              </Button>
            </Toolbar>
          </AppBar>
        )}
        {!isMobile && (
          <DialogTitle>
            <Typography variant="h5" fontWeight={700}>Convertir a Nota de Pedido</Typography>
            <Typography variant="body2" color="text.secondary">Esta acción convertirá el presupuesto en una nota de pedido confirmada</Typography>
          </DialogTitle>
        )}
        <DialogContent dividers>
          {selectedPresupuesto && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Se convertirá el presupuesto {selectedPresupuesto.numeroDocumento} por un total de {formatCurrency(selectedPresupuesto.total)}
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select defaultValue="EFECTIVO" label="Método de Pago">
                      <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                      <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                      <MenuItem value="TRANSFERENCIA">Transferencia Bancaria</MenuItem>
                      <MenuItem value="FINANCIACION_PROPIA">Financiación Propia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de IVA</InputLabel>
                    <Select defaultValue="IVA_21" label="Tipo de IVA">
                      <MenuItem value="IVA_21">IVA 21%</MenuItem>
                      <MenuItem value="IVA_10_5">IVA 10.5%</MenuItem>
                      <MenuItem value="EXENTO">Exento</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        {!isMobile && (
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button variant="contained" color="success" onClick={() => handleConvertToNotaPedido('EFECTIVO', 'IVA_21')} disabled={formLoading} startIcon={formLoading ? <CircularProgress size={20} /> : <ReceiptIcon />}>
              {formLoading ? 'Convirtiendo...' : 'Convertir'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSuccess(null)} severity="success">{success}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setError(null)} severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PresupuestosFinanciamientoPage;
