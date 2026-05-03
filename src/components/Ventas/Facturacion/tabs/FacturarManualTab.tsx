import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import type { Cliente, MetodoPago, Producto, RecetaFabricacionDTO, Usuario } from '../../../../types';
import { metodoPagoRequiereCaja, type CajaRef } from '../../../../types/caja.types';
import ClienteAutocomplete from '../../../common/ClienteAutocomplete';
import { CajaSelector } from '../../../common/CajaSelector';
import { ProductsTable } from '../ProductsTable';
import { PAYMENT_METHODS, IVA_OPTIONS, type TipoIva } from '../constants';
import type { CartItem } from '../types';
import { isFinanciamiento } from '../utils';

type DescuentoTipo = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

interface Totals {
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
}

interface Props {
  // cliente
  selectedCliente: Cliente | null;
  onChangeCliente: (cliente: Cliente | null) => void;
  // vendedor
  selectedUsuarioId: number | '';
  onChangeUsuario: (id: number | '') => void;
  usuarios: Usuario[];
  // payment + caja + iva
  paymentMethod: MetodoPago;
  onChangePaymentMethod: (m: MetodoPago) => void;
  cajaContadoRef: CajaRef | null;
  onChangeCajaContado: (ref: CajaRef | null) => void;
  selectedIva: TipoIva;
  onChangeIva: (next: TipoIva) => void;
  dueDate: string;
  onChangeDueDate: (next: string) => void;
  // discount
  descuentoTipo: DescuentoTipo;
  onChangeDescuentoTipo: (next: DescuentoTipo) => void;
  descuentoValor: number;
  onChangeDescuentoValor: (next: number) => void;
  // notes
  notes: string;
  onChangeNotes: (next: string) => void;
  // cart
  cart: CartItem[];
  onAddItem: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateCartItem: (index: number, field: any, value: any) => void;
  onRemoveCartItem: (index: number) => void;
  products: Producto[];
  recetas: RecetaFabricacionDTO[];
  // totals
  totals: Totals;
  // actions
  loading: boolean;
  selectedClientId: number | '';
  onClear: () => void;
  onOpenFinanciamiento: () => void;
  onSubmit: () => void;
}

const FacturarManualTab: React.FC<Props> = ({
  selectedCliente, onChangeCliente,
  selectedUsuarioId, onChangeUsuario, usuarios,
  paymentMethod, onChangePaymentMethod, cajaContadoRef, onChangeCajaContado,
  selectedIva, onChangeIva, dueDate, onChangeDueDate,
  descuentoTipo, onChangeDescuentoTipo, descuentoValor, onChangeDescuentoValor,
  notes, onChangeNotes,
  cart, onAddItem, onUpdateCartItem, onRemoveCartItem, products, recetas,
  totals, loading, selectedClientId, onClear, onOpenFinanciamiento, onSubmit,
}) => {
  const showDescuentoCol = descuentoTipo !== 'NONE' && totals.descuento > 0;
  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Card sx={{ width: '100%' }}>
        <CardContent sx={{ width: '100%', boxSizing: 'border-box' }}>
          <Typography variant="h6" gutterBottom>Nueva Factura Manual</Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid item xs={12} md={6}>
              <ClienteAutocomplete
                value={selectedCliente}
                onChange={onChangeCliente}
                label="Cliente"
                placeholder="Escribí nombre, razón social o CUIT…"
                required
                size="medium"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={selectedUsuarioId}
                  onChange={(e) => onChangeUsuario(e.target.value as number | '')}
                  label="Vendedor"
                >
                  <MenuItem value="">Seleccionar Vendedor</MenuItem>
                  {usuarios.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre ? `${u.nombre} ${u.apellido || ''}`.trim() : u.username || u.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => onChangePaymentMethod(e.target.value as MetodoPago)}
                  label="Método de Pago"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de IVA</InputLabel>
                <Select
                  value={selectedIva}
                  onChange={(e) => onChangeIva(e.target.value as TipoIva)}
                  label="Tipo de IVA"
                >
                  {IVA_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth label="Fecha de Vencimiento" type="date"
                value={dueDate}
                onChange={(e) => onChangeDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de descuento</InputLabel>
                <Select
                  value={descuentoTipo}
                  onChange={(e) => {
                    const next = e.target.value as DescuentoTipo;
                    onChangeDescuentoTipo(next);
                    if (next === 'NONE') onChangeDescuentoValor(0);
                  }}
                  label="Tipo de descuento"
                >
                  <MenuItem value="NONE">Sin descuento</MenuItem>
                  <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
                  <MenuItem value="MONTO_FIJO">Monto fijo ($)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth type="number"
                label={descuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
                value={descuentoTipo === 'NONE' ? '' : descuentoValor}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  const valor = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                  onChangeDescuentoValor(descuentoTipo === 'PORCENTAJE' ? Math.min(100, valor) : valor);
                }}
                inputProps={{
                  min: 0,
                  max: descuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                  step: descuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
                }}
                disabled={descuentoTipo === 'NONE'}
              />
            </Grid>

            {isFinanciamiento(paymentMethod) && (
              <Grid item xs={12}>
                <Alert severity="info">
                  Los datos de financiación (cuotas, tasa, entrega inicial) se configuran al confirmar la factura.
                </Alert>
              </Grid>
            )}

            {!isFinanciamiento(paymentMethod) && metodoPagoRequiereCaja(paymentMethod) && (
              <Grid item xs={12}>
                <CajaSelector
                  metodoPago={paymentMethod}
                  value={cajaContadoRef}
                  onChange={onChangeCajaContado}
                  direccion="ingreso"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth multiline rows={2} label="Observaciones"
                value={notes}
                onChange={(e) => onChangeNotes(e.target.value)}
                placeholder="Notas adicionales para la factura..."
              />
            </Grid>
          </Grid>

          <Box mt={3} sx={{ width: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Items</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddItem}
                disabled={products.length === 0}
              >
                Agregar Item
              </Button>
            </Box>
            {cart.length > 0 ? (
              <ProductsTable
                items={cart}
                onUpdate={onUpdateCartItem}
                onRemove={onRemoveCartItem}
                products={products}
                recetas={recetas}
              />
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                <Typography color="text.secondary">No hay productos en el carrito</Typography>
              </Paper>
            )}
          </Box>

          {cart.length > 0 && (
            <Box mt={3} sx={{ width: '100%' }}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', width: '100%' }}>
                <Grid container spacing={2} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={showDescuentoCol ? 4 : 6}>
                    <Typography variant="subtitle2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="h6">${totals.subtotal.toFixed(2)}</Typography>
                  </Grid>
                  {showDescuentoCol && (
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Descuento {descuentoTipo === 'PORCENTAJE' ? `(${descuentoValor}%)` : '(monto fijo)'}:
                      </Typography>
                      <Typography variant="h6" color="error.main">-${totals.descuento.toFixed(2)}</Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={showDescuentoCol ? 4 : 6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      IVA ({IVA_OPTIONS.find((o) => o.value === selectedIva)?.label}):
                    </Typography>
                    <Typography variant="h6">${totals.iva.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">Total:</Typography>
                    <Typography variant="h5" color="primary">${totals.total.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          <Box mt={3} display="flex" justifyContent="flex-end" gap={2} sx={{ width: '100%' }}>
            <Button variant="outlined" startIcon={<ClearIcon />} onClick={onClear}>Limpiar</Button>
            {cart.length > 0 && (
              <Button variant="outlined" onClick={onOpenFinanciamiento}>
                Opciones de Financiamiento
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSubmit}
              disabled={loading || !selectedClientId || !selectedUsuarioId || cart.length === 0}
            >
              Crear Factura
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FacturarManualTab;
