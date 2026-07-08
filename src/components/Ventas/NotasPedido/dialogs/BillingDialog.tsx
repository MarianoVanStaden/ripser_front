// FRONT-003: extracted from NotasPedidoPage.tsx — pre-facturación dialog
// for notas con FINANCIAMIENTO / FINANCIACION_PROPIA.  All persistence is
// owned by the orchestrator; this component is a controlled form view.
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
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
import type { DocumentoComercial } from '../../../../types';
import type { BillingForm } from '../types';

const TIPO_FINANCIACION_OPTIONS = [
  'SEMANAL',
  'QUINCENAL',
  'MENSUAL',
  'PLAN_PP',
  'CONTADO',
  'CHEQUES',
] as const;

const fmtMoney = (n: number) =>
  n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  nota: DocumentoComercial | null;
  form: BillingForm;
  setForm: Dispatch<SetStateAction<BillingForm>>;
}

const BillingDialog: React.FC<Props> = ({ open, onClose, onSubmit, nota, form, setForm }) => {
  // Para notas al contado el diálogo sólo pide la fecha estimada de entrega
  // (opcional); los campos de financiación no aplican.
  const esFinanciamiento =
    nota?.metodoPago === 'FINANCIAMIENTO' || nota?.metodoPago === 'FINANCIACION_PROPIA';

  // Calcular el total real considerando descuentos aplicables
  // descuentoMonto ya excluye items ENVIO en el backend, por eso lo sumamos de nuevo después
  const descuentoMonto = Number(nota?.descuentoMonto) || 0;
  const ivaAmount = nota?.iva ?? 0;
  const montoTotal = (nota?.subtotal ?? 0) - descuentoMonto + ivaAmount;

  // Shipping cost is never financed: % or fixed amount applies only to equipment base.
  const costoEnvio = (nota?.detalles ?? [])
    .filter((d: any) => d.tipoItem === 'ENVIO')
    .reduce((s: number, d: any) => s + (Number(d.subtotal) || 0), 0);
  const baseEquipos = montoTotal - costoEnvio;
  const entregaEquipos = form.entregarInicial
    ? form.usePorcentaje
      ? baseEquipos * (form.porcentajeEntregaInicial / 100)
      : form.montoEntregaInicial
    : 0;
  const entregaInicial = costoEnvio + entregaEquipos;
  const saldoFinanciado = baseEquipos - entregaEquipos;
  const interesTotal = saldoFinanciado * (form.tasaInteres / 100);
  const montoConInteres = saldoFinanciado + interesTotal;
  const valorCuota = form.cantidadCuotas > 0 ? montoConInteres / form.cantidadCuotas : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{esFinanciamiento ? 'Datos de Financiación Propia' : 'Confirmar Facturación'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Fecha Estimada de Entrega"
            type="date"
            fullWidth
            value={form.fechaEstimadaEntrega}
            onChange={(e) => setForm((prev) => ({ ...prev, fechaEstimadaEntrega: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            helperText="Opcional — vacío = lo antes posible"
          />
          {esFinanciamiento && (<>
          <TextField
            label="Cantidad de Cuotas"
            type="number"
            fullWidth
            value={form.cantidadCuotas}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, cantidadCuotas: parseInt(e.target.value, 10) || 1 }))
            }
            inputProps={{ min: 1 }}
          />
          <FormControl fullWidth>
            <InputLabel>Tipo de Financiación</InputLabel>
            <Select
              value={form.tipoFinanciacion}
              onChange={(e) => setForm((prev) => ({ ...prev, tipoFinanciacion: e.target.value }))}
              label="Tipo de Financiación"
            >
              {TIPO_FINANCIACION_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.entregarInicial}
                onChange={(e) => setForm((prev) => ({ ...prev, entregarInicial: e.target.checked }))}
              />
            }
            label="Entrega inicial"
          />
          {form.entregarInicial && (
            <Box sx={{ pl: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <RadioGroup
                row
                value={form.usePorcentaje ? 'porcentaje' : 'monto'}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, usePorcentaje: e.target.value === 'porcentaje' }))
                }
              >
                <FormControlLabel value="porcentaje" control={<Radio />} label="Por porcentaje" />
                <FormControlLabel value="monto" control={<Radio />} label="Monto fijo" />
              </RadioGroup>
              {form.usePorcentaje ? (
                <TextField
                  label="Porcentaje de entrega"
                  type="number"
                  value={form.porcentajeEntregaInicial}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      porcentajeEntregaInicial: parseFloat(e.target.value) || 0,
                    }))
                  }
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              ) : (
                <TextField
                  label="Monto de entrega"
                  type="number"
                  value={form.montoEntregaInicial}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      montoEntregaInicial: parseFloat(e.target.value) || 0,
                    }))
                  }
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
            onChange={(e) =>
              setForm((prev) => ({ ...prev, tasaInteres: parseFloat(e.target.value) || 0 }))
            }
            inputProps={{ min: 0, max: 999, step: 0.5 }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            helperText="Interés simple sobre el saldo financiado. 0% = sin interés."
          />
          <Box
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Resumen del financiamiento
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              <Typography variant="body2">Total documento:</Typography>
              <Typography variant="body2" fontWeight={600}>
                ${fmtMoney(montoTotal)}
              </Typography>
              <Typography variant="body2">Entrega inicial:</Typography>
              <Typography variant="body2">${fmtMoney(entregaInicial)}</Typography>
              {costoEnvio > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>— Envío (no se financia):</Typography>
                  <Typography variant="caption" color="text.secondary">${fmtMoney(costoEnvio)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>— {form.usePorcentaje ? `${form.porcentajeEntregaInicial}% sobre equipos` : 'Monto fijo equipos'}:</Typography>
                  <Typography variant="caption" color="text.secondary">${fmtMoney(entregaEquipos)}</Typography>
                </>
              )}
              <Typography variant="body2">Saldo financiado:</Typography>
              <Typography variant="body2">${fmtMoney(saldoFinanciado)}</Typography>
              {form.tasaInteres > 0 && (
                <>
                  <Typography variant="body2">Interés ({form.tasaInteres}%):</Typography>
                  <Typography variant="body2" color="warning.main">
                    ${fmtMoney(interesTotal)}
                  </Typography>
                  <Typography variant="body2">Total a financiar:</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${fmtMoney(montoConInteres)}
                  </Typography>
                </>
              )}
              <Typography variant="body2">Valor cuota ({form.cantidadCuotas}x):</Typography>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                ${fmtMoney(valorCuota)}
              </Typography>
            </Box>
          </Box>
          </>)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={onSubmit}>
          Confirmar Facturación
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillingDialog;
