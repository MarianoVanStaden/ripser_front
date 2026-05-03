import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from '@mui/material';

export interface BillingFormValues {
  cantidadCuotas: number;
  tipoFinanciacion: string;
  primerVencimiento: string;
  entregarInicial: boolean;
  usePorcentaje: boolean;
  porcentajeEntregaInicial: number;
  montoEntregaInicial: number;
  tasaInteres: number;
}

const TIPO_FINANCIACION_OPTIONS = ['SEMANAL', 'QUINCENAL', 'MENSUAL', 'PLAN_PP', 'CONTADO', 'CHEQUES'];

interface Props {
  open: boolean;
  baseTotal: number;
  defaultValues: BillingFormValues;
  onClose: () => void;
  onConfirm: (values: BillingFormValues) => void;
}

const BillingDialog: React.FC<Props> = ({ open, baseTotal, defaultValues, onClose, onConfirm }) => {
  const [form, setForm] = useState<BillingFormValues>(defaultValues);

  // Re-seed when the dialog opens (parent passes fresh defaults per opening).
  useEffect(() => {
    if (open) setForm(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const entregaInicial = form.entregarInicial
    ? form.usePorcentaje
      ? baseTotal * (form.porcentajeEntregaInicial / 100)
      : form.montoEntregaInicial
    : 0;
  const saldoFinanciado = baseTotal - entregaInicial;
  const interesTotal = saldoFinanciado * (form.tasaInteres / 100);
  const montoConInteres = saldoFinanciado + interesTotal;
  const valorCuota = form.cantidadCuotas > 0 ? montoConInteres / form.cantidadCuotas : 0;
  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Datos de Financiación Propia</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Cantidad de Cuotas"
            type="number"
            fullWidth
            value={form.cantidadCuotas}
            onChange={(e) => setForm((p) => ({ ...p, cantidadCuotas: parseInt(e.target.value) || 1 }))}
            inputProps={{ min: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Tipo de Financiación</InputLabel>
            <Select
              value={form.tipoFinanciacion}
              onChange={(e) => setForm((p) => ({ ...p, tipoFinanciacion: e.target.value }))}
              label="Tipo de Financiación"
            >
              {TIPO_FINANCIACION_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Primer Vencimiento"
            type="date"
            fullWidth
            value={form.primerVencimiento}
            onChange={(e) => setForm((p) => ({ ...p, primerVencimiento: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={<Checkbox checked={form.entregarInicial} onChange={(e) => setForm((p) => ({ ...p, entregarInicial: e.target.checked }))} />}
            label="Entrega inicial"
          />
          {form.entregarInicial && (
            <Box sx={{ pl: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <RadioGroup
                row
                value={form.usePorcentaje ? 'porcentaje' : 'monto'}
                onChange={(e) => setForm((p) => ({ ...p, usePorcentaje: e.target.value === 'porcentaje' }))}
              >
                <FormControlLabel value="porcentaje" control={<Radio />} label="Por porcentaje" />
                <FormControlLabel value="monto" control={<Radio />} label="Monto fijo" />
              </RadioGroup>
              {form.usePorcentaje ? (
                <TextField
                  label="Porcentaje de entrega"
                  type="number"
                  value={form.porcentajeEntregaInicial}
                  onChange={(e) => setForm((p) => ({ ...p, porcentajeEntregaInicial: parseFloat(e.target.value) || 0 }))}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              ) : (
                <TextField
                  label="Monto de entrega"
                  type="number"
                  value={form.montoEntregaInicial}
                  onChange={(e) => setForm((p) => ({ ...p, montoEntregaInicial: parseFloat(e.target.value) || 0 }))}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              )}
            </Box>
          )}
          <TextField
            label="Tasa de interés"
            type="number"
            fullWidth
            value={form.tasaInteres}
            onChange={(e) => setForm((p) => ({ ...p, tasaInteres: parseFloat(e.target.value) || 0 }))}
            inputProps={{ min: 0, max: 999, step: 0.5 }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            helperText="Interés simple sobre el saldo financiado. 0% = sin interés."
          />
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Resumen del financiamiento</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              <Typography variant="body2">Total documento:</Typography>
              <Typography variant="body2" fontWeight={600}>${fmt(baseTotal)}</Typography>
              <Typography variant="body2">Entrega inicial:</Typography>
              <Typography variant="body2">${fmt(entregaInicial)}</Typography>
              <Typography variant="body2">Saldo financiado:</Typography>
              <Typography variant="body2">${fmt(saldoFinanciado)}</Typography>
              {form.tasaInteres > 0 && (
                <>
                  <Typography variant="body2">Interés ({form.tasaInteres}%):</Typography>
                  <Typography variant="body2" color="warning.main">${fmt(interesTotal)}</Typography>
                  <Typography variant="body2">Total a financiar:</Typography>
                  <Typography variant="body2" fontWeight={600}>${fmt(montoConInteres)}</Typography>
                </>
              )}
              <Typography variant="body2">Valor cuota ({form.cantidadCuotas}x):</Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">${fmt(valorCuota)}</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onConfirm(form)}>Confirmar Facturación</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillingDialog;
