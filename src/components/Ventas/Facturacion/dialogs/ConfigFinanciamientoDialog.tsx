import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { MetodoPago, OpcionFinanciamientoDTO } from '../../../../types';
import { PAYMENT_METHODS } from '../constants';
import { getMetodoPagoIcon, getMetodoPagoLabel } from '../paymentMethodIcons';

interface NewOpcionForm {
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  descripcion: string;
}

const EMPTY_FORM: NewOpcionForm = {
  nombre: '',
  metodoPago: 'EFECTIVO',
  cantidadCuotas: 1,
  tasaInteres: 0,
  descripcion: '',
};

interface Props {
  open: boolean;
  onClose: () => void;
  totalVenta: number;
  opciones: OpcionFinanciamientoDTO[];
  selectedOpcionId: number | null;
  onSelectOpcion: (id: number) => void;
  onAddOpcion: (opcion: OpcionFinanciamientoDTO) => void;
  onError: (msg: string) => void;
}

const ConfigFinanciamientoDialog: React.FC<Props> = ({
  open,
  onClose,
  totalVenta,
  opciones,
  selectedOpcionId,
  onSelectOpcion,
  onAddOpcion,
  onError,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<NewOpcionForm>(EMPTY_FORM);

  // Reset internal state on each open so previous draft doesn't persist.
  useEffect(() => {
    if (open) {
      setShowNewForm(false);
      setForm(EMPTY_FORM);
    }
  }, [open]);

  const handleAdd = () => {
    if (!form.nombre.trim()) {
      onError('Debe ingresar un nombre para la opción');
      return;
    }
    const tasaDecimal = form.tasaInteres / 100;
    const pagoAnticipo = totalVenta * 0.4;
    const pagoFinanciado = totalVenta * 0.6 * (1 + tasaDecimal);
    const montoTotal = pagoAnticipo + pagoFinanciado;
    const montoCuota = pagoFinanciado / form.cantidadCuotas;

    onAddOpcion({
      nombre: form.nombre,
      metodoPago: form.metodoPago,
      cantidadCuotas: form.cantidadCuotas,
      tasaInteres: form.tasaInteres,
      montoTotal,
      montoCuota,
      descripcion: form.descripcion,
      ordenPresentacion: opciones.length + 1,
    });
    setShowNewForm(false);
    setForm(EMPTY_FORM);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Opciones de Financiamiento</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            Total de la venta: <strong>${totalVenta.toFixed(2)}</strong>
          </Typography>
        </Box>

        {!showNewForm && (
          <Box mb={2}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowNewForm(true)} size="small">
              Agregar Nueva Opción
            </Button>
          </Box>
        )}

        {showNewForm && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Nueva Opción de Financiamiento
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth size="small" label="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={form.metodoPago}
                    onChange={(e) => setForm({ ...form, metodoPago: e.target.value as MetodoPago })}
                    label="Método de Pago"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth size="small" type="number" label="Cantidad de Cuotas"
                  value={form.cantidadCuotas}
                  onChange={(e) => setForm({ ...form, cantidadCuotas: Number(e.target.value) })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth size="small" type="number" label="Tasa de Interés (%)"
                  value={form.tasaInteres}
                  onChange={(e) => setForm({ ...form, tasaInteres: Number(e.target.value) })}
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Total con interés:</Typography>
                <Typography variant="h6">
                  ${(totalVenta * 0.4 + totalVenta * 0.6 * (1 + form.tasaInteres / 100)).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth size="small" label="Descripción" multiline rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  <Button size="small" onClick={() => setShowNewForm(false)}>Cancelar</Button>
                  <Button size="small" variant="contained" onClick={handleAdd}>Agregar</Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <RadioGroup
          value={selectedOpcionId !== null ? String(selectedOpcionId) : ''}
          onChange={(e) => onSelectOpcion(Number(e.target.value))}
        >
          <Grid container spacing={2}>
            {opciones.map((opcion, index) => {
              const optionValue = opcion.id !== undefined ? opcion.id : index;
              const isSelected = selectedOpcionId === optionValue;
              return (
                <Grid item xs={12} sm={6} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2, cursor: 'pointer',
                      border: isSelected ? '2px solid' : '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                    }}
                    onClick={() => onSelectOpcion(optionValue)}
                  >
                    <FormControlLabel
                      value={optionValue}
                      control={<Radio />}
                      label={
                        <Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getMetodoPagoIcon(opcion.metodoPago)}
                            <Typography variant="subtitle1" fontWeight="bold">{opcion.nombre}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {getMetodoPagoLabel(opcion.metodoPago)}
                          </Typography>
                          <Typography variant="body2">
                            {opcion.cantidadCuotas} cuota(s) - {opcion.tasaInteres}% interés
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="h6" color="primary">
                            Total: ${opcion.montoTotal.toFixed(2)}
                          </Typography>
                          {opcion.cantidadCuotas > 1 && (
                            <Typography variant="body2" color="text.secondary">
                              ${opcion.montoCuota.toFixed(2)} por cuota
                            </Typography>
                          )}
                          {opcion.descripcion && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                              {opcion.descripcion}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button onClick={onClose} variant="contained" disabled={selectedOpcionId === null}>
          Confirmar Selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigFinanciamientoDialog;
