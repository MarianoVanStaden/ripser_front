// FRONT-003: extracted from NotasPedidoPage.tsx — edit-only dialog for
// descuento + observaciones on a PENDIENTE nota.  All state stays in the
// orchestrator; this component renders + relays callbacks.
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type { DocumentoComercial } from '../../../../types';
import type { EditNotaForm, TipoDescuento } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
  nota: DocumentoComercial | null;
  form: EditNotaForm;
  setForm: Dispatch<SetStateAction<EditNotaForm>>;
  canAprobar?: boolean;
}

const EditarNotaPedidoDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  loading,
  nota,
  form,
  setForm,
  canAprobar = true,
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Editar Nota de Pedido {nota?.numeroDocumento}
      </DialogTitle>
      <DialogContent>
        {nota && (() => {
          const subtotal = Number(nota.subtotal) || 0;
          const tipo = form.descuentoTipo;
          const valor = form.descuentoValor;
          let descuentoMonto = 0;
          if (tipo === 'PORCENTAJE') {
            const pct = Math.min(100, Math.max(0, valor || 0));
            descuentoMonto = subtotal * (pct / 100);
          } else if (tipo === 'MONTO_FIJO') {
            descuentoMonto = Math.min(subtotal, Math.max(0, valor || 0));
          }
          const subtotalNeto = Math.max(0, subtotal - descuentoMonto);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tipoIvaActual = (nota as any).tipoIva || 'IVA_21';
          const ivaPct = tipoIvaActual === 'IVA_21' ? 0.21 : tipoIvaActual === 'IVA_10_5' ? 0.105 : 0;
          const ivaPreview = subtotalNeto * ivaPct;
          const totalPreview = subtotalNeto + ivaPreview;
          return (
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Solo podés editar descuento, observaciones y estado cuando la nota está en PENDIENTE.
                Cambiar el descuento regenera las opciones de financiamiento.
              </Alert>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo de descuento</InputLabel>
                <Select
                  label="Tipo de descuento"
                  value={form.descuentoTipo}
                  onChange={(e) => {
                    const next = e.target.value as TipoDescuento;
                    setForm((prev) => ({
                      ...prev,
                      descuentoTipo: next,
                      descuentoValor: next === 'NONE' ? 0 : prev.descuentoValor,
                    }));
                  }}
                >
                  <MenuItem value="NONE">Sin descuento</MenuItem>
                  <MenuItem value="PORCENTAJE">Porcentaje</MenuItem>
                  <MenuItem value="MONTO_FIJO">Monto fijo</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="number"
                label={form.descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
                value={form.descuentoTipo === 'NONE' ? '' : form.descuentoValor}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setForm((prev) => ({
                    ...prev,
                    descuentoValor: prev.descuentoTipo === 'PORCENTAJE' ? Math.min(100, v) : v,
                  }));
                }}
                disabled={form.descuentoTipo === 'NONE'}
                inputProps={{
                  min: 0,
                  max: form.descuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                  step: form.descuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
                }}
                error={form.descuentoTipo === 'MONTO_FIJO' && form.descuentoValor > subtotal}
                helperText={
                  form.descuentoTipo === 'MONTO_FIJO' && form.descuentoValor > subtotal
                    ? `El descuento no puede superar el subtotal (${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`
                    : ' '
                }
                fullWidth
              />
              <TextField
                size="small"
                label="Observaciones"
                value={form.observaciones}
                onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />
              {canAprobar && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.aprobar}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, aprobar: e.target.checked }))
                      }
                    />
                  }
                  label="Aprobar nota al guardar (pasa de PENDIENTE a APROBADO)"
                />
              )}
              <Divider />
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">
                    ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                {tipo !== 'NONE' && descuentoMonto > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      Descuento {tipo === 'PORCENTAJE' ? `(${valor}%)` : '(monto fijo)'}:
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      -${descuentoMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    IVA ({tipoIvaActual === 'IVA_21' ? '21%' : tipoIvaActual === 'IVA_10_5' ? '10.5%' : '0%'}):
                  </Typography>
                  <Typography variant="body2">
                    ${ivaPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={600}>Total estimado:</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>
                    ${totalPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  El backend recalcula el total exacto al guardar.
                </Typography>
              </Box>
            </Box>
          );
        })()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={
            loading ||
            (form.descuentoTipo === 'MONTO_FIJO' &&
              form.descuentoValor > (Number(nota?.subtotal) || 0))
          }
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarNotaPedidoDialog;
