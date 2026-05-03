// FRONT-003: extracted from NotasPedidoPage.tsx — presentational dialog for
// converting a Presupuesto into a Nota de Pedido.  All state stays in the
// orchestrator; this component only renders + relays callbacks.
import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type {
  DocumentoComercial,
  MetodoPago,
  OpcionFinanciamientoDTO,
} from '../../../../types';
import type { ConvertFormData, TipoDescuento, TipoIva } from '../types';
import { IVA_RATES } from '../constants';
import { getTipoIvaLabel } from '../utils';
import { getMetodoPagoIcon, getMetodoPagoLabel } from '../paymentMethodIcons';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  presupuestos: DocumentoComercial[];
  selectedPresupuesto: DocumentoComercial | null;
  onPresupuestoSelect: (presupuestoId: string) => void;
  form: ConvertFormData;
  setForm: Dispatch<SetStateAction<ConvertFormData>>;
  opcionesFinanciamiento: OpcionFinanciamientoDTO[];
  selectedOpcionId: number | null;
  onSelectOpcion: (id: number) => void;
}

const ConvertirPresupuestoDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  loading,
  presupuestos,
  selectedPresupuesto,
  onPresupuestoSelect,
  form,
  setForm,
  opcionesFinanciamiento,
  selectedOpcionId,
  onSelectOpcion,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: { xs: '100%', sm: '90vh' },
          m: { xs: 0, sm: 2 },
        },
      }}
    >
      <DialogTitle>Convertir Presupuesto a Nota de Pedido</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Autocomplete
            fullWidth
            options={presupuestos}
            value={presupuestos.find((p) => p.id.toString() === form.presupuestoId) || null}
            onChange={(_, newValue) => {
              onPresupuestoSelect(newValue ? newValue.id.toString() : '');
            }}
            getOptionLabel={(option) =>
              `${option.numeroDocumento} - ${option.clienteNombre || option.leadNombre} - $${option.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
            }
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase().trim();
              if (!searchTerm) return options;
              return options.filter((option) => {
                const numero = (option.numeroDocumento || '').toLowerCase();
                const cliente = (option.clienteNombre || '').toLowerCase();
                const lead = (option.leadNombre || '').toLowerCase();
                return numero.includes(searchTerm) || cliente.includes(searchTerm) || lead.includes(searchTerm);
              });
            }}
            renderOption={({ key, ...props }, option) => (
              <Box component="li" key={key} {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {option.numeroDocumento} - {option.clienteNombre || option.leadNombre} -
                    ${option.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                  {option.clienteNombre && (
                    <Chip label="Cliente" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                  {option.leadNombre && (
                    <Chip label="Lead" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                  )}
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Presupuesto"
                placeholder="Escriba número de presupuesto o nombre de cliente/lead..."
                margin="normal"
                required
                error={!form.presupuestoId && loading}
                helperText="Busque por número de presupuesto, nombre de cliente o lead"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            noOptionsText="No se encontraron presupuestos"
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />

          {selectedPresupuesto && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Detalles del Presupuesto
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2">
                  {selectedPresupuesto.clienteNombre ? 'Cliente:' : 'Lead:'} {selectedPresupuesto.clienteNombre || selectedPresupuesto.leadNombre}
                </Typography>
                {selectedPresupuesto.clienteNombre && (
                  <Chip label="Cliente" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
                {selectedPresupuesto.leadNombre && (
                  <Chip label="Lead" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Box>
              <Typography variant="body2">
                Fecha: {new Date(selectedPresupuesto.fechaEmision).toLocaleDateString('es-AR')}
              </Typography>
              <Typography variant="body2">
                Total: ${selectedPresupuesto.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </Typography>
              {selectedPresupuesto.tipoIva && (
                <Typography variant="body2">
                  Tipo de IVA: {getTipoIvaLabel(selectedPresupuesto.tipoIva as TipoIva)}
                </Typography>
              )}
              {selectedPresupuesto.observaciones && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Observaciones: {selectedPresupuesto.observaciones}
                </Typography>
              )}
            </Paper>
          )}

          {opcionesFinanciamiento.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Opción de Financiamiento</Typography>
              <RadioGroup
                value={selectedOpcionId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  onSelectOpcion(id);
                  const opcion = opcionesFinanciamiento.find((o) => o.id === id);
                  if (opcion) setForm((prev) => ({ ...prev, metodoPago: opcion.metodoPago }));
                }}
              >
                {opcionesFinanciamiento.map((opcion) => (
                  <Box key={opcion.id} sx={{ p: 1.5, border: '1px solid', borderColor: selectedOpcionId === opcion.id ? 'primary.main' : 'divider', borderRadius: 1, mb: 1 }}>
                    <FormControlLabel
                      value={opcion.id}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            {getMetodoPagoIcon(opcion.metodoPago)}
                            <Typography variant="subtitle2">{opcion.nombre}</Typography>
                            {opcion.tasaInteres < 0 && (
                              <Chip size="small" color="success" label={`${Math.abs(opcion.tasaInteres)}% OFF`} />
                            )}
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
                            <Typography variant="caption">Método: {getMetodoPagoLabel(opcion.metodoPago)}</Typography>
                            <Typography variant="caption">Cuotas: {opcion.cantidadCuotas}</Typography>
                            <Typography variant="caption">Cuota: ${opcion.montoCuota.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                            <Typography variant="caption">Total: ${opcion.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                          </Box>
                          {opcion.descripcion && (
                            <Typography variant="caption" color="text.secondary">{opcion.descripcion}</Typography>
                          )}
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </RadioGroup>
            </Box>
          ) : (
            <TextField
              fullWidth
              select
              label="Método de Pago"
              value={form.metodoPago}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  metodoPago: e.target.value as MetodoPago,
                }))
              }
              margin="normal"
              required
            >
              <MenuItem value="EFECTIVO">Efectivo</MenuItem>
              <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
              <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
              <MenuItem value="TRANSFERENCIA">Transferencia Bancaria</MenuItem>
              <MenuItem value="CHEQUE">Cheque</MenuItem>
              <MenuItem value="FINANCIAMIENTO">Financiamiento</MenuItem>
              <MenuItem value="CUENTA_CORRIENTE">Cuenta Corriente</MenuItem>
            </TextField>
          )}

          <TextField
            fullWidth
            select
            label="Tipo de IVA"
            value={form.tipoIva}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tipoIva: e.target.value as TipoIva,
              }))
            }
            margin="normal"
            required
            helperText={
              selectedPresupuesto?.tipoIva
                ? `Heredado del presupuesto (${getTipoIvaLabel(selectedPresupuesto.tipoIva as TipoIva)}). Puede modificarse.`
                : 'Seleccione el tipo de IVA'
            }
          >
            <MenuItem value="IVA_21">IVA 21%</MenuItem>
            <MenuItem value="IVA_10_5">IVA 10.5%</MenuItem>
            <MenuItem value="EXENTO">Exento</MenuItem>
          </TextField>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 1 }}>
            <TextField
              fullWidth
              select
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
              margin="normal"
            >
              <MenuItem value="NONE">Sin descuento</MenuItem>
              <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
              <MenuItem value="MONTO_FIJO">Monto fijo ($)</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="number"
              label={form.descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
              value={form.descuentoTipo === 'NONE' ? '' : form.descuentoValor}
              onChange={(e) => {
                const raw = parseFloat(e.target.value);
                const valor = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                setForm((prev) => ({
                  ...prev,
                  descuentoValor: prev.descuentoTipo === 'PORCENTAJE' ? Math.min(100, valor) : valor,
                }));
              }}
              inputProps={{
                min: 0,
                max: form.descuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                step: form.descuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
              }}
              margin="normal"
              disabled={form.descuentoTipo === 'NONE'}
            />
          </Box>

          {selectedPresupuesto && (() => {
            const baseSubtotal = selectedPresupuesto.subtotal ?? 0;
            const descAmt = form.descuentoTipo === 'PORCENTAJE'
              ? baseSubtotal * (Math.min(100, Math.max(0, form.descuentoValor || 0)) / 100)
              : form.descuentoTipo === 'MONTO_FIJO'
                ? Math.min(baseSubtotal, Math.max(0, form.descuentoValor || 0))
                : 0;
            const subNeto = Math.max(0, baseSubtotal - descAmt);
            const ivaRate = IVA_RATES[form.tipoIva];
            const ivaAmt = subNeto * ivaRate;
            const totalPreview = subNeto + ivaAmt;
            return (
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>Resumen de totales</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">${baseSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                </Box>
                {descAmt > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="error.main">
                      Descuento {form.descuentoTipo === 'PORCENTAJE' ? `(${form.descuentoValor}%)` : '(monto fijo)'}:
                    </Typography>
                    <Typography variant="body2" color="error.main">-${descAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">IVA ({(ivaRate * 100).toFixed(ivaRate === 0.105 ? 1 : 0)}%):</Typography>
                  <Typography variant="body2">${ivaAmt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    ${totalPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            );
          })()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading || !form.presupuestoId}
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
        >
          {loading ? 'Convirtiendo...' : 'Convertir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertirPresupuestoDialog;
