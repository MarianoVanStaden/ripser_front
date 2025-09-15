// OpcionesFinanciamientoManager.tsx
import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import opcionFinanciamientoApi from "../../api/services/opcionFinanciamientoApi";
import type { OpcionFinanciamientoDTO } from "../../types";

interface OpcionesFinanciamientoManagerProps {
  open: boolean;
  onClose: () => void;
  montoBase: number;
  documentoId?: number; // optional: we guard at runtime
  onSave?: (opciones: OpcionFinanciamientoDTO[]) => void;
}

const OpcionesFinanciamientoManager: React.FC<OpcionesFinanciamientoManagerProps> = ({
  open,
  onClose,
  montoBase,
  documentoId,
  onSave,
}) => {
  const [opciones, setOpciones] = useState<OpcionFinanciamientoDTO[]>([]);
  const [editingOpcion, setEditingOpcion] = useState<OpcionFinanciamientoDTO | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState<Partial<OpcionFinanciamientoDTO>>({
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

  // Load existing options when dialog opens
  useEffect(() => {
    if (open && documentoId) {
      cargarOpciones();
    } else if (open && !documentoId) {
      setOpciones([]);
    }
  }, [open, documentoId]);

  const cargarOpciones = async () => {
    setLoading(true);
    try {
      const opcionesCargadas = await opcionFinanciamientoApi.obtenerOpcionesPorDocumento(documentoId);
      setOpciones(opcionesCargadas);
    } catch (error) {
      console.error('Error cargando opciones:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error al cargar las opciones de financiamiento', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularMontos = (cantidadCuotas: number, tasaInteres: number) => {
    const montoConInteres = montoBase * (1 + tasaInteres / 100);
    const montoCuota = montoConInteres / cantidadCuotas;
    return {
      montoTotal: Number(montoConInteres.toFixed(2)),
      montoCuota: Number(montoCuota.toFixed(2)),
    };
  };

  const handleAddOpcion = () => {
    setEditingOpcion(null);
    setEditingIndex(null);
    setFormData({
      nombre: "",
      metodoPago: "EFECTIVO",
      cantidadCuotas: 1,
      tasaInteres: 0,
      descripcion: "",
    });
    setFormOpen(true);
  };

  const handleEditOpcion = (opcion: OpcionFinanciamientoDTO, index: number) => {
    setEditingOpcion(opcion);
    setEditingIndex(index);
    setFormData(opcion);
    setFormOpen(true);
  };

  const handleDeleteOpcion = async (opcion: OpcionFinanciamientoDTO, index: number) => {
    if (opcion.id) {
      // If it has an ID, it exists in the database
      try {
        await opcionFinanciamientoApi.eliminar(opcion.id);
        setSnackbar({ 
          open: true, 
          message: 'Opción eliminada correctamente', 
          severity: 'success' 
        });
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: 'Error al eliminar la opción', 
          severity: 'error' 
        });
        return;
      }
    }
    // Remove from local state
    setOpciones(opciones.filter((_, i) => i !== index));
  };

  const handleSaveOpcion = () => {
    const { montoTotal, montoCuota } = calcularMontos(
      formData.cantidadCuotas || 1, 
      formData.tasaInteres || 0
    );
    
    const opcionCompleta: OpcionFinanciamientoDTO = {
      ...formData as OpcionFinanciamientoDTO,
      montoTotal,
      montoCuota,
      ordenPresentacion: editingIndex !== null ? editingIndex + 1 : opciones.length + 1,
    };

    if (editingIndex !== null) {
      const nuevasOpciones = [...opciones];
      nuevasOpciones[editingIndex] = opcionCompleta;
      setOpciones(nuevasOpciones);
    } else {
      setOpciones([...opciones, opcionCompleta]);
    }

    setFormOpen(false);
  };

  const handleGenerarOpcionesAutomaticas = () => {
    const opcionesAutomaticas: OpcionFinanciamientoDTO[] = [
      {
        nombre: "Contado - 10% descuento",
        metodoPago: "EFECTIVO",
        cantidadCuotas: 1,
        tasaInteres: -10,
        descripcion: "Descuento especial por pago al contado",
        ordenPresentacion: 1,
        ...calcularMontos(1, -10),
      },
      {
        nombre: "3 cuotas sin interés",
        metodoPago: "TARJETA_CREDITO",
        cantidadCuotas: 3,
        tasaInteres: 0,
        descripcion: "Con tarjetas seleccionadas",
        ordenPresentacion: 2,
        ...calcularMontos(3, 0),
      },
      {
        nombre: "6 cuotas - 15% interés",
        metodoPago: "TARJETA_CREDITO",
        cantidadCuotas: 6,
        tasaInteres: 15,
        descripcion: "Financiación con tarjeta",
        ordenPresentacion: 3,
        ...calcularMontos(6, 15),
      },
      {
        nombre: "12 cuotas - 30% interés",
        metodoPago: "FINANCIACION_PROPIA",
        cantidadCuotas: 12,
        tasaInteres: 30,
        descripcion: "Financiación directa con la empresa",
        ordenPresentacion: 4,
        ...calcularMontos(12, 30),
      },
      {
        nombre: "18 cuotas - 45% interés",
        metodoPago: "FINANCIACION_PROPIA",
        cantidadCuotas: 18,
        tasaInteres: 45,
        descripcion: "Plan extendido de financiación",
        ordenPresentacion: 5,
        ...calcularMontos(18, 45),
      },
    ];

    setOpciones(opcionesAutomaticas);
  };

  const handleSaveToBackend = async () => {
    if (!documentoId) {
      setSnackbar({
        open: true,
        message: 'No se puede guardar: falta el documento asociado',
        severity: 'error'
      });
      return;
    }
    setSaving(true);
    try {
      // Replace all options for this document
      const opcionesGuardadas = await opcionFinanciamientoApi.reemplazarOpciones(documentoId, opciones);
      setOpciones(opcionesGuardadas);
      setSnackbar({ 
        open: true, 
        message: 'Opciones guardadas correctamente', 
        severity: 'success' 
      });
      if (onSave) {
        onSave(opcionesGuardadas);
      }
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'Error al guardar las opciones', 
        severity: 'error' 
      });
    } finally {
      setSaving(false);
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
          {!documentoId && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No hay documento seleccionado. Seleccione o cree un documento antes de guardar opciones de financiamiento.
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                        <TableRow key={opcion.id || index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {opcion.nombre}
                            </Typography>
                            {opcion.descripcion && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {opcion.descripcion}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {metodosPago.find((m) => m.value === opcion.metodoPago)?.label}
                          </TableCell>
                          <TableCell align="center">{opcion.cantidadCuotas}</TableCell>
                          <TableCell align="center">
                            <Typography
                              color={
                                opcion.tasaInteres < 0 
                                  ? "success.main" 
                                  : opcion.tasaInteres > 0 
                                  ? "error.main" 
                                  : "text.primary"
                              }
                            >
                              {opcion.tasaInteres}%
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(opcion.montoCuota || 0)}</TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="medium">
                              {formatCurrency(opcion.montoTotal || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleEditOpcion(opcion, index)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteOpcion(opcion, index)}
                            >
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveToBackend}
            disabled={saving || opciones.length === 0}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {saving ? 'Guardando...' : 'Guardar Opciones'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear/editar opción */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOpcion ? "Editar" : "Nueva"} Opción de Financiamiento
        </DialogTitle>
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
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as any })}
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
                value={formData.tasaInteres || 0}
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
                  {formatCurrency((montoBase * (formData.tasaInteres || 0)) / 100)}
                </Typography>
                <Typography variant="body2">
                  <strong>Total a financiar:</strong>{" "}
                  {formatCurrency(
                    calcularMontos(formData.cantidadCuotas || 1, formData.tasaInteres || 0).montoTotal
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor de cada cuota:</strong>{" "}
                  {formatCurrency(
                    calcularMontos(formData.cantidadCuotas || 1, formData.tasaInteres || 0).montoCuota
                  )}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

export default OpcionesFinanciamientoManager;