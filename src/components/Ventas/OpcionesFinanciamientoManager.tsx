import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Slider,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
} from "@mui/icons-material";

interface OpcionFinanciamiento {
  id?: number;
  nombre: string;
  metodoPago: string;
  cantidadCuotas: number;
  tasaInteres: number;
  montoTotal?: number;
  montoCuota?: number;
  descripcion?: string;
  ordenPresentacion?: number;
}

interface OpcionesFinanciamientoManagerProps {
  open: boolean;
  onClose: () => void;
  montoBase: number;
  opciones: OpcionFinanciamiento[];
  onSave: (opciones: OpcionFinanciamiento[]) => void;
}

const OpcionesFinanciamientoManager: React.FC<OpcionesFinanciamientoManagerProps> = ({
  open,
  onClose,
  montoBase,
  opciones: opcionesIniciales,
  onSave,
}) => {
  const [opciones, setOpciones] = useState<OpcionFinanciamiento[]>(opcionesIniciales);
  const [editingOpcion, setEditingOpcion] = useState<OpcionFinanciamiento | null>(null);
  const [formData, setFormData] = useState<OpcionFinanciamiento>({
    nombre: "",
    metodoPago: "EFECTIVO",
    cantidadCuotas: 1,
    tasaInteres: 0,
    descripcion: "",
  });
  const [formOpen, setFormOpen] = useState(false);

  const metodosPago = [
    { value: "EFECTIVO", label: "Efectivo" },
    { value: "TARJETA_CREDITO", label: "Tarjeta de Crédito" },
    { value: "TARJETA_DEBITO", label: "Tarjeta de Débito" },
    { value: "TRANSFERENCIA", label: "Transferencia Bancaria" },
    { value: "FINANCIACION_PROPIA", label: "Financiación Propia" },
    { value: "CHEQUE", label: "Cheque" },
  ];

  const calcularMontos = (cantidadCuotas: number, tasaInteres: number) => {
    const montoConInteres = montoBase * (1 + tasaInteres / 100);
    const montoCuota = montoConInteres / cantidadCuotas;
    return {
      montoTotal: montoConInteres,
      montoCuota: montoCuota,
    };
  };

  const handleAddOpcion = () => {
    setEditingOpcion(null);
    setFormData({
      nombre: "",
      metodoPago: "EFECTIVO",
      cantidadCuotas: 1,
      tasaInteres: 0,
      descripcion: "",
    });
    setFormOpen(true);
  };

  const handleEditOpcion = (opcion: OpcionFinanciamiento) => {
    setEditingOpcion(opcion);
    setFormData(opcion);
    setFormOpen(true);
  };

  const handleDeleteOpcion = (index: number) => {
    setOpciones(opciones.filter((_, i) => i !== index));
  };

  const handleSaveOpcion = () => {
    const { montoTotal, montoCuota } = calcularMontos(formData.cantidadCuotas, formData.tasaInteres);
    const opcionCompleta = {
      ...formData,
      montoTotal,
      montoCuota,
      ordenPresentacion: editingOpcion ? editingOpcion.ordenPresentacion : opciones.length + 1,
    };

    if (editingOpcion) {
      setOpciones(opciones.map((o) => (o === editingOpcion ? opcionCompleta : o)));
    } else {
      setOpciones([...opciones, opcionCompleta]);
    }

    setFormOpen(false);
  };

  const handleGenerarOpcionesAutomaticas = () => {
    const opcionesAutomaticas: OpcionFinanciamiento[] = [
      {
        nombre: "Contado - 10% descuento",
        metodoPago: "EFECTIVO",
        cantidadCuotas: 1,
        tasaInteres: -10,
        descripcion: "Descuento especial por pago al contado",
        ...calcularMontos(1, -10),
      },
      {
        nombre: "3 cuotas sin interés",
        metodoPago: "TARJETA_CREDITO",
        cantidadCuotas: 3,
        tasaInteres: 0,
        descripcion: "Con tarjetas seleccionadas",
        ...calcularMontos(3, 0),
      },
      {
        nombre: "6 cuotas - 15% interés",
        metodoPago: "TARJETA_CREDITO",
        cantidadCuotas: 6,
        tasaInteres: 15,
        descripcion: "Financiación con tarjeta",
        ...calcularMontos(6, 15),
      },
      {
        nombre: "12 cuotas - 30% interés",
        metodoPago: "FINANCIACION_PROPIA",
        cantidadCuotas: 12,
        tasaInteres: 30,
        descripcion: "Financiación directa con la empresa",
        ...calcularMontos(12, 30),
      },
      {
        nombre: "18 cuotas - 45% interés",
        metodoPago: "FINANCIACION_PROPIA",
        cantidadCuotas: 18,
        tasaInteres: 45,
        descripcion: "Plan extendido de financiación",
        ...calcularMontos(18, 45),
      },
    ];

    setOpciones(opcionesAutomaticas);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5">Gestionar Opciones de Financiamiento</Typography>
            <Typography variant="body1" color="text.secondary">
              Monto base: {formatCurrency(montoBase)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure las opciones de pago que desea ofrecer al cliente. Puede generar opciones automáticas o crear
              opciones personalizadas.
            </Alert>

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<CalculateIcon />}
                onClick={handleGenerarOpcionesAutomaticas}
              >
                Generar Opciones Automáticas
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddOpcion}>
                Agregar Opción Personalizada
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell align="center">Cuotas</TableCell>
                    <TableCell align="center">Interés (%)</TableCell>
                    <TableCell align="right">Valor Cuota</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {opciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No hay opciones de financiamiento configuradas
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    opciones.map((opcion, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {opcion.nombre}
                          </Typography>
                          {opcion.descripcion && (
                            <Typography variant="caption" color="text.secondary">
                              {opcion.descripcion}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{metodosPago.find((m) => m.value === opcion.metodoPago)?.label}</TableCell>
                        <TableCell align="center">{opcion.cantidadCuotas}</TableCell>
                        <TableCell align="center">
                          <Typography
                            color={opcion.tasaInteres < 0 ? "success.main" : opcion.tasaInteres > 0 ? "error.main" : "text.primary"}
                          >
                            {opcion.tasaInteres}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(opcion.montoCuota || 0)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="medium">{formatCurrency(opcion.montoTotal || 0)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleEditOpcion(opcion)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteOpcion(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={() => onSave(opciones)}>
            Guardar Opciones
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar opción */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingOpcion ? "Editar" : "Nueva"} Opción de Financiamiento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la opción"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: 6 cuotas sin interés"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Método de pago"
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
              >
                {metodosPago.map((metodo) => (
                  <MenuItem key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad de cuotas"
                value={formData.cantidadCuotas}
                onChange={(e) => setFormData({ ...formData, cantidadCuotas: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 48 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Tasa de interés"
                value={formData.tasaInteres}
                onChange={(e) => setFormData({ ...formData, tasaInteres: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                helperText="Use valores negativos para descuentos"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Interés: {formData.tasaInteres}%</Typography>
              <Slider
                value={formData.tasaInteres}
                onChange={(_, value) => setFormData({ ...formData, tasaInteres: value as number })}
                min={-20}
                max={100}
                marks={[
                  { value: -20, label: "-20%" },
                  { value: 0, label: "0%" },
                  { value: 50, label: "50%" },
                  { value: 100, label: "100%" },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción (opcional)"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Ej: Con tarjetas seleccionadas, válido hasta fin de mes"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Resumen del cálculo:</strong>
                </Typography>
                <Typography variant="body2">
                  Monto base: {formatCurrency(montoBase)}
                </Typography>
                <Typography variant="body2">
                  Interés ({formData.tasaInteres}%):{" "}
                  {formatCurrency((montoBase * formData.tasaInteres) / 100)}
                </Typography>
                <Typography variant="body2">
                  <strong>Total a financiar:</strong>{" "}
                  {formatCurrency(calcularMontos(formData.cantidadCuotas, formData.tasaInteres).montoTotal)}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor de cada cuota:</strong>{" "}
                  {formatCurrency(calcularMontos(formData.cantidadCuotas, formData.tasaInteres).montoCuota)}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveOpcion} disabled={!formData.nombre}>
            {editingOpcion ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OpcionesFinanciamientoManager;