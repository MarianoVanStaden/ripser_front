// FRONT-003: extracted from NotasPedidoPage.tsx — read-only view of a
// nota de pedido with an inline editor for observaciones.  All state lives
// in the orchestrator; the dialog only renders + relays callbacks.
import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import type {
  DetalleDocumento,
  DocumentoComercial,
  EstadoDocumento,
} from '../../../../types';
import { calculateCostoEnvio } from '../../../../utils/financiamiento';
import AuditoriaFlujo from '../../../common/AuditoriaFlujo';
import { getMetodoPagoLabel } from '../paymentMethodIcons';
import { getTipoIvaLabel } from '../utils';
import type { TipoIva } from '../types';

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

interface Props {
  open: boolean;
  onClose: () => void;
  nota: DocumentoComercial | null;

  // Status display helpers — defined in the orchestrator and shared with
  // the table row, so we receive them as props rather than re-implement.
  getStatusColor: (estado: EstadoDocumento) => ChipColor;
  getStatusLabel: (estado: EstadoDocumento) => string;

  // Inline observaciones editor (state owned by orchestrator).
  editingObservaciones: boolean;
  observacionesValue: string;
  onStartEditObservaciones: (initialValue: string) => void;
  onChangeObservacionesValue: (val: string) => void;
  onSaveObservaciones: () => void;
  onCancelEditObservaciones: () => void;
}

const VerNotaPedidoDialog: React.FC<Props> = ({
  open,
  onClose,
  nota,
  getStatusColor,
  getStatusLabel,
  editingObservaciones,
  observacionesValue,
  onStartEditObservaciones,
  onChangeObservacionesValue,
  onSaveObservaciones,
  onCancelEditObservaciones,
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
      <DialogTitle>
        Nota de Pedido {nota?.numeroDocumento}
      </DialogTitle>
      <DialogContent>
        {nota && (
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
                <Typography>{nota.clienteNombre}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Usuario</Typography>
                <Typography>{nota.usuarioNombre}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Fecha de Emisión</Typography>
                <Typography>
                  {new Date(nota.fechaEmision).toLocaleDateString('es-AR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Fecha de Vencimiento</Typography>
                <Typography>
                  {nota.fechaVencimiento
                    ? new Date(nota.fechaVencimiento).toLocaleDateString('es-AR')
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Método de Pago</Typography>
                <Typography>
                  {nota.metodoPago ? getMetodoPagoLabel(nota.metodoPago) : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Tipo de IVA</Typography>
                <Typography>
                  {nota.tipoIva ? getTipoIvaLabel(nota.tipoIva as TipoIva) : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
                <Chip
                  label={getStatusLabel(nota.estado)}
                  color={getStatusColor(nota.estado)}
                  size="small"
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                {!editingObservaciones && (
                  <IconButton
                    size="small"
                    onClick={() => onStartEditObservaciones(nota.observaciones ?? '')}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {editingObservaciones ? (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={observacionesValue}
                    onChange={(e) => onChangeObservacionesValue(e.target.value)}
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="contained" onClick={onSaveObservaciones}>
                      Guardar
                    </Button>
                    <Button size="small" onClick={onCancelEditObservaciones}>
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography color={nota.observaciones ? 'text.primary' : 'text.secondary'}>
                  {nota.observaciones || 'Sin observaciones'}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>Detalles</Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 500, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>Producto/Equipo</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Color</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Medida</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Descripción</TableCell>
                    <TableCell align="center" sx={{ minWidth: 80 }}>Cantidad</TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>Precio Unit.</TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nota.detalles?.map((detalle: DetalleDocumento, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {detalle.tipoItem === 'EQUIPO'
                          ? `${detalle.recetaNombre || ''} ${detalle.recetaModelo ? `- ${detalle.recetaModelo}` : ''}`
                          : detalle.productoNombre || '-'}
                      </TableCell>
                      <TableCell>{detalle.color?.nombre || '-'}</TableCell>
                      <TableCell>{detalle.medida?.nombre || '-'}</TableCell>
                      <TableCell>{detalle.descripcion}</TableCell>
                      <TableCell align="center">{detalle.cantidad}</TableCell>
                      <TableCell align="right">
                        ${detalle.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        ${detalle.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Box>
                {(() => {
                  const costoEnvio = calculateCostoEnvio(nota.detalles ?? []);
                  const equipoBase = nota.subtotal - costoEnvio;
                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ mr: 4, color: 'text.secondary' }}>Equipo:</Typography>
                        <Typography variant="body2">
                          ${equipoBase.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      {nota.descuentoTipo &&
                        nota.descuentoTipo !== 'NONE' &&
                        Number(nota.descuentoValor) > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ mr: 4 }}>
                              Descuento{' '}
                              {nota.descuentoTipo === 'PORCENTAJE'
                                ? `(${nota.descuentoValor}%)`
                                : '(monto fijo)'}
                              :
                            </Typography>
                            <Typography color="error.main">
                              -$
                              {Number(nota.descuentoMonto ?? 0).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                              })}
                            </Typography>
                          </Box>
                        )}
                      {costoEnvio > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ mr: 4, color: 'text.secondary' }}>Envío:</Typography>
                          <Typography variant="body2">
                            ${costoEnvio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ mr: 4 }}>Subtotal:</Typography>
                        <Typography>
                          ${nota.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ mr: 4 }}>IVA:</Typography>
                        <Typography>
                          ${nota.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                    </>
                  );
                })()}

                {/* Calcular el total correcto del documento */}
                {(() => {
                  const subtotal = nota.subtotal ?? 0;
                  const descuento = Number(nota.descuentoMonto) ?? 0;
                  const iva = nota.iva ?? 0;
                  const totalCalculado = subtotal - descuento + iva;
                  const totalEnBD = nota.total ?? 0;
                  const hayInconsistencia = Math.abs(totalCalculado - totalEnBD) > 0.01;

                  return (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ mr: 4 }}>
                          Total del documento:
                        </Typography>
                        <Typography variant="h6" color={hayInconsistencia ? 'warning.main' : 'primary'}>
                          ${totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>

                      {/* Mostrar advertencia si hay inconsistencia con BD */}
                      {hayInconsistencia && (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          sx={{ mb: 2, display: 'block', fontStyle: 'italic' }}
                        >
                          ⚠️ Nota: El valor en la base de datos (${totalEnBD.toLocaleString('es-AR', { minimumFractionDigits: 2 })}) no coincide con el cálculo correcto.
                        </Typography>
                      )}

                      {/* Si hay opción de financiamiento, mostrar desglose */}
                      {nota.opcionFinanciamientoSeleccionadaId && (nota as any).opcionesFinanciamiento && (nota as any).opcionesFinanciamiento.length > 0 && (() => {
                        const opcionSeleccionada = (nota as any).opcionesFinanciamiento.find(
                          (o: any) => o.id === nota.opcionFinanciamientoSeleccionadaId
                        );
                        return opcionSeleccionada ? (
                          <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                              Resumen del financiamiento seleccionado:
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">
                                {opcionSeleccionada.nombre || `${opcionSeleccionada.cantidadCuotas} cuota(s)`}:
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="primary.main">
                                ${opcionSeleccionada.montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </Typography>
                            </Box>
                            {opcionSeleccionada.tasaInteres > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                (Incluye {opcionSeleccionada.tasaInteres}% de interés)
                              </Typography>
                            )}
                          </>
                        ) : null;
                      })()}
                    </>
                  );
                })()}
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Trazabilidad del flujo
            </Typography>
            <AuditoriaFlujo documento={nota} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerNotaPedidoDialog;
