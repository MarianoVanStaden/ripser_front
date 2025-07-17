import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  clienteApi,
  presupuestoApi,
  usuarioApi,
  productApi,
} from "../../api/services";
import type {
  Presupuesto,
  Cliente,
  Usuario,
  Producto,
  PresupuestoStatus,
  CreatePresupuestoRequest,
} from "../../types";
import { PresupuestoStatus as PresupuestoStatusEnum } from "../../types";

const PresupuestosPage: React.FC = () => {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] =
    useState<Presupuesto | null>(null);
  const [formData, setFormData] = useState({
    clienteId: "",
    usuarioId: "",
    fechaPresupuesto: new Date().toISOString().split("T")[0],
    fechaVencimiento: "",
    observaciones: "",
    estado: PresupuestoStatusEnum.PENDIENTE as PresupuestoStatus,
  });
  const [detalles, setDetalles] = useState<
    Array<{
      id?: number;
      productoId: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      subtotal: number;
    }>
  >([]);
  const [readOnly, setReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presupuestoToDelete, setPresupuestoToDelete] = useState<Presupuesto | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [clientesData, usuariosData, presupuestosData, productosData] =
        await Promise.all([
          clienteApi.getAll(),
          usuarioApi.getAll().catch(() => []), // usuarios might not be available
          presupuestoApi.getAll(),
          productApi.getAll().catch(() => {
            // If productos API is not available, return mock data
            console.warn("Productos API not available, using empty array");
            return [];
          }),
        ]);

      setClientes(clientesData);
      setUsuarios(usuariosData);
      setPresupuestos(presupuestosData);
      setProductos(productosData);
    } catch (err: unknown) {
      console.error("Error fetching data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(`Error al cargar los datos: ${errorMessage}`);

      // Try to load individual endpoints if the full load fails
      try {
        const clientesData = await clienteApi.getAll();
        setClientes(clientesData);
      } catch (clientError) {
        console.error("Error loading clientes:", clientError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    estado: PresupuestoStatus
  ):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (estado) {
      case PresupuestoStatusEnum.PENDIENTE:
        return "warning";
      case PresupuestoStatusEnum.APROBADO:
        return "success";
      case PresupuestoStatusEnum.RECHAZADO:
        return "error";
      case PresupuestoStatusEnum.VENCIDO:
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (estado: PresupuestoStatus): string => {
    switch (estado) {
      case PresupuestoStatusEnum.PENDIENTE:
        return "Pendiente";
      case PresupuestoStatusEnum.APROBADO:
        return "Aprobado";
      case PresupuestoStatusEnum.RECHAZADO:
        return "Rechazado";
      case PresupuestoStatusEnum.VENCIDO:
        return "Vencido";
      default:
        return estado;
    }
  };

  const calculateTotal = () => {
    return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  };

  const addDetalle = () => {
    if (readOnly) return;
    setDetalles([
      ...detalles,
      {
        productoId: "",
        descripcion: "",
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0,
      },
    ]);
  };

  const updateDetalle = (
    index: number,
    field: string,
    value: string | number
  ) => {
    if (readOnly) return;
    const newDetalles = [...detalles];
    const detalle = newDetalles[index];

    if (field === "productoId") detalle.productoId = value as string;
    else if (field === "descripcion") detalle.descripcion = value as string;
    else if (field === "cantidad") detalle.cantidad = value as number;
    else if (field === "precioUnitario")
      detalle.precioUnitario = value as number;

    // Recalculate subtotal when cantidad or precioUnitario changes
    if (field === "cantidad" || field === "precioUnitario") {
      detalle.subtotal = detalle.cantidad * detalle.precioUnitario;
    }

    // Update description when product changes
    if (field === "productoId" && value) {
      const producto = productos.find(
        (p) => p.id === parseInt(value as string)
      );
      if (producto) {
        detalle.descripcion = producto.nombre;
        detalle.precioUnitario = producto.precio || 0;
        detalle.subtotal = detalle.cantidad * (producto.precio || 0);
      }
    }

    setDetalles(newDetalles);
  };

  const removeDetalle = (index: number) => {
    if (readOnly) return;
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleOpenDialog = (
    presupuesto?: Presupuesto,
    readOnlyMode = false
  ) => {
    setReadOnly(readOnlyMode);
    if (presupuesto) {
      setEditingPresupuesto(presupuesto);
      setFormData({
        clienteId: presupuesto.cliente?.id?.toString() || "",
        usuarioId: presupuesto.usuario?.id?.toString() || "",
        fechaPresupuesto: presupuesto.fechaPresupuesto?.split("T")[0] || "",
        fechaVencimiento: presupuesto.fechaVencimiento?.split("T")[0] || "",
        observaciones: presupuesto.observaciones || "",
        estado: presupuesto.estado,
      });
      setDetalles(
        Array.isArray(presupuesto.detalles)
          ? presupuesto.detalles.map((detalle) => ({
              id: detalle.id,
              productoId: detalle.producto?.id?.toString() || "",
              descripcion: detalle.descripcion,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
            }))
          : []
      );
    } else {
      setEditingPresupuesto(null);
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
      setFormData({
        clienteId: "",
        usuarioId: "",
        fechaPresupuesto: new Date().toISOString().split("T")[0],
        fechaVencimiento: fechaVencimiento.toISOString().split("T")[0],
        observaciones: "",
        estado: PresupuestoStatusEnum.PENDIENTE,
      });
      setDetalles([]);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPresupuesto(null);
  };
  const handleDeletePresupuesto = async (presupuestoId: number) => {
    if (!window.confirm("¿Está seguro que desea eliminar este presupuesto?"))
      return;
    try {
      await presupuestoApi.delete(presupuestoId);
      setPresupuestos(presupuestos.filter((p) => p.id !== presupuestoId));
    } catch (err) {
      setError("Error al eliminar el presupuesto");
      console.error(err);
    }
  };
  const handleSavePresupuesto = async () => {
    try {
      // Validate required fields
      if (!formData.clienteId || formData.clienteId === "") {
        setError("Debe seleccionar un cliente");
        return;
      }

      if (!formData.fechaPresupuesto) {
        setError("Debe especificar la fecha del presupuesto");
        return;
      }

      if (!formData.fechaVencimiento) {
        setError("Debe especificar la fecha de vencimiento");
        return;
      }

      // Validate that cliente ID is a valid number
      const clienteId = parseInt(formData.clienteId);
      if (isNaN(clienteId) || clienteId <= 0) {
        setError("Debe seleccionar un cliente válido");
        return;
      }

      setFormLoading(true);
      setError(null);

      const totalCalculado = calculateTotal();

      const presupuestoData: CreatePresupuestoRequest = {
        cliente: {
          id: clienteId,
        },
        fechaPresupuesto: `${formData.fechaPresupuesto}T00:00:00`,
        fechaVencimiento: `${formData.fechaVencimiento}T23:59:59`,
        estado: formData.estado,
        total: totalCalculado,
        observaciones: formData.observaciones || "",
        detalles: detalles.map((detalle) => ({
          ...(detalle.productoId && {
            producto: {
              id: parseInt(detalle.productoId),
            },
          }),
          descripcion: detalle.descripcion,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.subtotal,
        })),
        ...(formData.usuarioId &&
          formData.usuarioId !== "" && {
            usuario: {
              id: parseInt(formData.usuarioId),
            },
          }),
      };

      console.log("Sending presupuesto data:", presupuestoData); // Debug log

      let savedPresupuesto: Presupuesto;

      if (editingPresupuesto) {
        savedPresupuesto = await presupuestoApi.update(
          editingPresupuesto.id,
          presupuestoData
        );
        setPresupuestos(
          presupuestos.map((p) =>
            p.id === editingPresupuesto.id ? savedPresupuesto : p
          )
        );
      } else {
        savedPresupuesto = await presupuestoApi.create(presupuestoData);
        setPresupuestos([savedPresupuesto, ...presupuestos]);
      }

      handleCloseDialog();
    } catch (err: unknown) {
      console.error("Error saving presupuesto:", err);
      let errorMessage = "Error desconocido";

      if (err instanceof Error) {
        errorMessage = err.message;
        // If it's an axios error, try to get more details
        if ("response" in err && err.response) {
          const axiosError = err as Error & {
            response?: { status?: number; data?: unknown };
          };
          console.error("Response status:", axiosError.response?.status);
          console.error("Response data:", axiosError.response?.data);

          if (
            axiosError.response?.data &&
            typeof axiosError.response.data === "object" &&
            "message" in axiosError.response.data
          ) {
            errorMessage = String(
              (axiosError.response.data as { message: string }).message
            );
          } else if (axiosError.response?.data) {
            errorMessage = `Error ${
              axiosError.response.status
            }: ${JSON.stringify(axiosError.response.data)}`;
          }
        }
      }

      setError(`Error al guardar el presupuesto: ${errorMessage}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Presupuestos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={productos.length === 0 || loading}
        >
          Nuevo Presupuesto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
                  <TableCell>Fecha</TableCell>
                  <TableCell>Vence</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presupuestos.map((presupuesto) => (
                  <TableRow key={presupuesto.id}>
                    <TableCell>{presupuesto.numeroPresupuesto}</TableCell>
                    <TableCell>{presupuesto.cliente?.nombre}</TableCell>
                    <TableCell>
                      {new Date(
                        presupuesto.fechaPresupuesto
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        presupuesto.fechaVencimiento
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(presupuesto.estado)}
                        color={getStatusColor(presupuesto.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      $
                      {presupuesto.total.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(presupuesto, true)}
                        aria-label="Ver presupuesto"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(presupuesto, false)}
                        aria-label="Editar presupuesto"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="success">
                        <PrintIcon />
                      </IconButton>
                      <IconButton size="small" color="info">
                        <SendIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setPresupuestoToDelete(presupuesto);
                          setDeleteDialogOpen(true);
                        }}
                        aria-label="Eliminar presupuesto"
                      >
                        <DeleteIcon />
                      </IconButton>
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
      >
        <DialogTitle>
          {editingPresupuesto
            ? readOnly
              ? "Ver Presupuesto"
              : "Editar Presupuesto"
            : "Nuevo Presupuesto"}
        </DialogTitle>
        <DialogContent sx={{ minHeight: "500px" }}>
          <Box sx={{ pt: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                select
                label="Cliente"
                value={formData.clienteId}
                onChange={(e) =>
                  setFormData({ ...formData, clienteId: e.target.value })
                }
                margin="normal"
                required
                disabled={readOnly}
              >
                <MenuItem value="">Seleccionar cliente</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nombre}
                  </MenuItem>
                ))}
              </TextField>

              {usuarios.length > 0 && (
                <TextField
                  fullWidth
                  select
                  label="Usuario"
                  value={formData.usuarioId}
                  onChange={(e) =>
                    setFormData({ ...formData, usuarioId: e.target.value })
                  }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estado: e.target.value as PresupuestoStatus,
                  })
                }
                margin="normal"
                required
                disabled={readOnly}
              >
                <MenuItem value={PresupuestoStatusEnum.PENDIENTE}>
                  Pendiente
                </MenuItem>
                <MenuItem value={PresupuestoStatusEnum.APROBADO}>
                  Aprobado
                </MenuItem>
                <MenuItem value={PresupuestoStatusEnum.RECHAZADO}>
                  Rechazado
                </MenuItem>
                <MenuItem value={PresupuestoStatusEnum.VENCIDO}>
                  Vencido
                </MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Fecha del Presupuesto"
                type="date"
                value={formData.fechaPresupuesto}
                onChange={(e) =>
                  setFormData({ ...formData, fechaPresupuesto: e.target.value })
                }
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                disabled={readOnly}
              />

              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={formData.fechaVencimiento}
                onChange={(e) =>
                  setFormData({ ...formData, fechaVencimiento: e.target.value })
                }
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
                disabled={readOnly}
              />
            </Box>

            <TextField
              fullWidth
              label="Observaciones"
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
              disabled={readOnly}
            />

            {/* Detalles Section */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Detalles del Presupuesto
            </Typography>

            {productos.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay productos disponibles. Contacte al administrador para
                configurar el catálogo de productos.
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell width="100px">Cantidad</TableCell>
                    <TableCell width="120px">Precio Unit.</TableCell>
                    <TableCell width="120px">Subtotal</TableCell>
                    {!readOnly && <TableCell width="60px">Acciones</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles && detalles.length > 0 ? (
                    detalles.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={detalle.productoId}
                            onChange={(e) =>
                              updateDetalle(index, "productoId", e.target.value)
                            }
                            disabled={readOnly}
                          >
                            <MenuItem value="">Sin producto</MenuItem>
                            {productos.length === 0 ? (
                              <MenuItem disabled>
                                No hay productos disponibles
                              </MenuItem>
                            ) : (
                              productos.map((producto) => (
                                <MenuItem
                                  key={producto.id}
                                  value={producto.id.toString()}
                                >
                                  {producto.nombre} - $
                                  {producto.precio?.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                  })}
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
                            onChange={(e) =>
                              updateDetalle(
                                index,
                                "descripcion",
                                e.target.value
                              )
                            }
                            disabled={readOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={detalle.cantidad}
                            onChange={(e) =>
                              updateDetalle(
                                index,
                                "cantidad",
                                parseInt(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 1 }}
                            disabled={readOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            value={detalle.precioUnitario}
                            onChange={(e) =>
                              updateDetalle(
                                index,
                                "precioUnitario",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            disabled={readOnly}
                          />
                        </TableCell>
                        <TableCell>
                          $
                          {detalle.subtotal.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        {!readOnly && (
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeDetalle(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={readOnly ? 5 : 6} align="center">
                        No hay detalles para este presupuesto.
                      </TableCell>
                    </TableRow>
                   )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                display: "flex",yContent: "space-between",
                justifyContent: "space-between",alignItems: "center",
                alignItems: "center",   mb: 2,
                mb: 2,
              }}
            >
              {!readOnly && (
                <Button
  variant="outlined"
  startIcon={<AddIcon />}
  onClick={addDetalle}
>
  Agregar Detalle
</Button>
              )}
              <Typography variant="h6">
  Total: ${calculateTotal().toLocaleString("es-AR", { minimumFractionDigits: 2 })}
</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
  <Button onClick={handleCloseDialog}>Cerrar</Button>
  {!readOnly && (
    <Button
      variant="contained"
      onClick={handleSavePresupuesto}
      disabled={
        !formData.clienteId ||
        !formData.fechaPresupuesto ||
        !formData.fechaVencimiento ||
        formLoading
      }
    >
      {editingPresupuesto ? "Actualizar" : "Crear"}
    </Button>
  )}
</DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Eliminar presupuesto</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar el presupuesto{' '}
            <b>{presupuestoToDelete?.numeroPresupuesto}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (presupuestoToDelete) {
                try {
                  await presupuestoApi.delete(presupuestoToDelete.id);
                  setPresupuestos(presupuestos.filter(p => p.id !== presupuestoToDelete.id));
                } catch (err) {
                  setError("Error al eliminar el presupuesto");
                  console.error(err);
                }
              }
              setDeleteDialogOpen(false);
              setPresupuestoToDelete(null);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};



export default PresupuestosPage;
