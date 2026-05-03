import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
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
import {
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type {
  DocumentoComercial,
  OpcionFinanciamientoDTO,
  Producto,
  RecetaFabricacionDTO,
} from '../../../../types';
import { ProductsTable } from '../ProductsTable';
import { isFinanciamiento } from '../utils';
import { getMetodoPagoIcon } from '../paymentMethodIcons';
import type { NotaCartItem } from '../types';

type DescuentoTipo = 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  selectedNotaPedido: DocumentoComercial | null;
  loadingOpciones: boolean;
  opcionesFinanciamiento: OpcionFinanciamientoDTO[];
  selectedOpcionId: number | null;
  onSelectOpcion: (id: number) => void;
  editingNotaItems: boolean;
  onStartEditItems: () => void;
  notaCart: NotaCartItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateNotaCartItem: (index: number, field: any, value: any) => void;
  products: Producto[];
  recetas: RecetaFabricacionDTO[];
  notaDescuentoTipo: DescuentoTipo;
  onChangeNotaDescuentoTipo: (next: DescuentoTipo) => void;
  notaDescuentoValor: number;
  onChangeNotaDescuentoValor: (next: number) => void;
  notaSubtotal: number;
  notaDescuentoAmount: number;
  notaIvaAmount: number;
  notaFinancingAdjustment: number;
  notaTotalVenta: number;
}

const ConvertToFacturaDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  loading,
  selectedNotaPedido,
  loadingOpciones,
  opcionesFinanciamiento,
  selectedOpcionId,
  onSelectOpcion,
  editingNotaItems,
  onStartEditItems,
  notaCart,
  onUpdateNotaCartItem,
  products,
  recetas,
  notaDescuentoTipo,
  onChangeNotaDescuentoTipo,
  notaDescuentoValor,
  onChangeNotaDescuentoValor,
  notaSubtotal,
  notaDescuentoAmount,
  notaIvaAmount,
  notaFinancingAdjustment,
  notaTotalVenta,
}) => {
  const selectedOption = selectedOpcionId !== null
    ? opcionesFinanciamiento.find(
        (o, idx) => (o.id !== undefined ? o.id : idx) === selectedOpcionId,
      )
    : undefined;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: { xs: '100%', sm: '90vh' },
          m: { xs: 0, sm: 2 },
        },
      }}
    >
      <DialogTitle>Convertir Nota de Pedido a Factura</DialogTitle>
      <DialogContent>
        {selectedNotaPedido && (
          <>
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cliente:
                  </Typography>
                  <Typography>{selectedNotaPedido.clienteNombre}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Número de Documento:
                  </Typography>
                  <Typography>#{selectedNotaPedido.numeroDocumento}</Typography>
                </Grid>
              </Grid>
            </Box>

            {loadingOpciones ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : opcionesFinanciamiento.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Opciones de Financiamiento
                </Typography>
                <RadioGroup
                  value={selectedOpcionId !== null ? String(selectedOpcionId) : ''}
                  onChange={(e) => onSelectOpcion(Number(e.target.value))}
                >
                  <Grid container spacing={2}>
                    {opcionesFinanciamiento.map((opcion, index) => {
                      const optionValue = opcion.id !== undefined ? opcion.id : index;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card
                            variant="outlined"
                            sx={{
                              p: 1,
                              border: selectedOpcionId === optionValue ? '2px solid' : '1px solid',
                              borderColor: selectedOpcionId === optionValue ? 'primary.main' : 'divider',
                              cursor: 'pointer',
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
                                    <Typography variant="body2" fontWeight="bold">
                                      {opcion.nombre}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {opcion.cantidadCuotas} cuota(s) - {opcion.tasaInteres}% interés
                                  </Typography>
                                  <Typography variant="body2" color="primary">
                                    Total: ${opcion.montoTotal?.toFixed(2)}
                                  </Typography>
                                  {opcion.cantidadCuotas > 1 && (
                                    <Typography variant="caption" color="text.secondary">
                                      ${opcion.montoCuota?.toFixed(2)}/cuota
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
              </Box>
            )}

            {selectedOpcionId !== null && selectedOpcionId !== undefined && opcionesFinanciamiento.length > 0 && (
              <Box mb={2}>
                <Alert severity="info" icon={<CreditCardIcon />}>
                  <Typography variant="body2">
                    <strong>Opción de Financiamiento Seleccionada:</strong> {selectedOption?.nombre}
                    {selectedOption && selectedOption.tasaInteres !== 0 && (
                      <> ({selectedOption.tasaInteres}% {selectedOption.tasaInteres > 0 ? 'recargo' : 'descuento'})</>
                    )}
                  </Typography>
                </Alert>
              </Box>
            )}

            {isFinanciamiento(selectedNotaPedido?.metodoPago ?? '') && (
              <Box mb={3}>
                <Alert severity="info">
                  Los datos de financiación (cuotas, tasa, entrega inicial) se configuran al confirmar la factura.
                </Alert>
              </Box>
            )}

            <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Items de la Nota</Typography>
              {!editingNotaItems && (
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={onStartEditItems}
                >
                  Editar Items
                </Button>
              )}
            </Box>

            <ProductsTable
              items={notaCart}
              onUpdate={onUpdateNotaCartItem}
              onRemove={() => {}}
              editable={editingNotaItems}
              products={products}
              recetas={recetas}
            />

            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de descuento</InputLabel>
                    <Select
                      value={notaDescuentoTipo}
                      onChange={(e) => onChangeNotaDescuentoTipo(e.target.value as DescuentoTipo)}
                      label="Tipo de descuento"
                    >
                      <MenuItem value="NONE">Sin descuento</MenuItem>
                      <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
                      <MenuItem value="MONTO_FIJO">Monto fijo ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label={notaDescuentoTipo === 'PORCENTAJE' ? 'Descuento (%)' : 'Descuento ($)'}
                    value={notaDescuentoTipo === 'NONE' ? '' : notaDescuentoValor}
                    onChange={(e) => {
                      const raw = parseFloat(e.target.value);
                      const valor = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                      onChangeNotaDescuentoValor(notaDescuentoTipo === 'PORCENTAJE' ? Math.min(100, valor) : valor);
                    }}
                    inputProps={{
                      min: 0,
                      max: notaDescuentoTipo === 'PORCENTAJE' ? 100 : undefined,
                      step: notaDescuentoTipo === 'PORCENTAJE' ? 0.5 : 0.01,
                    }}
                    disabled={notaDescuentoTipo === 'NONE'}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box mt={3}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="h6">${notaSubtotal.toFixed(2)}</Typography>
                  </Box>
                  {notaDescuentoAmount > 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="error.main">
                        Descuento {notaDescuentoTipo === 'PORCENTAJE' ? `(${notaDescuentoValor}%)` : '(monto fijo)'}:
                      </Typography>
                      <Typography variant="h6" color="error.main">-${notaDescuentoAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle2" color="text.secondary">IVA:</Typography>
                    <Typography variant="h6">${notaIvaAmount.toFixed(2)}</Typography>
                  </Box>
                  {notaFinancingAdjustment !== 0 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" color="text.secondary">
                        {notaFinancingAdjustment > 0 ? 'Recargo' : 'Descuento'} Financiamiento:
                      </Typography>
                      <Typography variant="h6" color={notaFinancingAdjustment > 0 ? 'error' : 'success'}>
                        {notaFinancingAdjustment > 0 ? '+' : ''}${notaFinancingAdjustment.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="text.secondary">Total:</Typography>
                    <Typography variant="h5" color="primary">
                      ${notaTotalVenta.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          startIcon={<CheckCircleIcon />}
        >
          Convertir a Factura
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToFacturaDialog;
