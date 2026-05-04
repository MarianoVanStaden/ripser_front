// FRONT-003: extracted from PresupuestosPage.tsx — read-only view de un
// presupuesto.  Permite editar observaciones inline (la única mutación
// que el dialog de view soporta — el resto del documento es read-only).
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
import type { DetalleDocumento, DocumentoComercial } from '../../../../types';
import AuditoriaFlujo from '../../../common/AuditoriaFlujo';
import { getStatusColor, getStatusLabel } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  presupuesto: DocumentoComercial | null;
  editingObservaciones: boolean;
  setEditingObservaciones: (value: boolean) => void;
  observacionesValue: string;
  setObservacionesValue: (value: string) => void;
  onSaveObservaciones: () => void;
}

const VerPresupuestoDialog: React.FC<Props> = ({
  open,
  onClose,
  presupuesto,
  editingObservaciones,
  setEditingObservaciones,
  observacionesValue,
  setObservacionesValue,
  onSaveObservaciones,
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
      <DialogTitle>Presupuesto {presupuesto?.numeroDocumento}</DialogTitle>
      <DialogContent>
        {presupuesto && (
          <Box sx={{ pt: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {presupuesto.clienteNombre ? 'Cliente' : 'Lead'}
                </Typography>
                <Typography>
                  {presupuesto.clienteNombre || presupuesto.leadNombre || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Usuario
                </Typography>
                <Typography>{presupuesto.usuarioNombre || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha de Emisión
                </Typography>
                <Typography>
                  {presupuesto.fechaEmision
                    ? new Date(presupuesto.fechaEmision).toLocaleDateString('es-AR')
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha de Vencimiento
                </Typography>
                <Typography>
                  {presupuesto.fechaVencimiento
                    ? new Date(presupuesto.fechaVencimiento).toLocaleDateString('es-AR')
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de IVA
                </Typography>
                <Typography>
                  {(() => {
                    // Backend doesn't surface tipoIva in the type yet; the field
                    // exists at runtime on returned presupuestos.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tipoIva = (presupuesto as any).tipoIva;
                    if (tipoIva === 'IVA_21') return 'IVA 21%';
                    if (tipoIva === 'IVA_10_5') return 'IVA 10.5%';
                    if (tipoIva === 'EXENTO') return 'Exento';
                    return '-';
                  })()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Estado
                </Typography>
                <Chip
                  label={getStatusLabel(presupuesto.estado)}
                  color={getStatusColor(presupuesto.estado)}
                  size="small"
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Observaciones
                </Typography>
                {!editingObservaciones && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setObservacionesValue(presupuesto.observaciones ?? '');
                      setEditingObservaciones(true);
                    }}
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
                    onChange={(e) => setObservacionesValue(e.target.value)}
                    size="small"
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="contained" onClick={onSaveObservaciones}>
                      Guardar
                    </Button>
                    <Button size="small" onClick={() => setEditingObservaciones(false)}>
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography
                  color={presupuesto.observaciones ? 'text.primary' : 'text.secondary'}
                >
                  {presupuesto.observaciones || 'Sin observaciones'}
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Detalles
            </Typography>
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 500, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>Producto/Equipo</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Color</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Medida</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Descripción</TableCell>
                    <TableCell align="center" sx={{ minWidth: 80 }}>
                      Cantidad
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      Precio Unit.
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 100 }}>
                      Subtotal
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {presupuesto.detalles?.map((detalle: DetalleDocumento, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {detalle.tipoItem === 'EQUIPO'
                          ? `${detalle.recetaNombre || ''} ${
                              detalle.recetaModelo ? `- ${detalle.recetaModelo}` : ''
                            }`
                          : detalle.productoNombre || '-'}
                      </TableCell>
                      <TableCell>{detalle.color?.nombre || '-'}</TableCell>
                      <TableCell>{detalle.medida?.nombre || '-'}</TableCell>
                      <TableCell>{detalle.descripcion}</TableCell>
                      <TableCell align="center">{detalle.cantidad}</TableCell>
                      <TableCell align="right">
                        $
                        {detalle.precioUnitario.toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell align="right">
                        $
                        {detalle.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ mr: 4 }}>Subtotal:</Typography>
                  <Typography>
                    $
                    {presupuesto.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                {presupuesto.descuentoTipo &&
                  presupuesto.descuentoTipo !== 'NONE' &&
                  Number(presupuesto.descuentoValor) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ mr: 4 }}>
                        Descuento{' '}
                        {presupuesto.descuentoTipo === 'PORCENTAJE'
                          ? `(${presupuesto.descuentoValor}%)`
                          : '(monto fijo)'}
                        :
                      </Typography>
                      <Typography color="error.main">
                        -$
                        {Number(presupuesto.descuentoMonto ?? 0).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>
                  )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ mr: 4 }}>IVA:</Typography>
                  <Typography>
                    ${presupuesto.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ mr: 4 }}>
                    Total:
                  </Typography>
                  <Typography variant="h6">
                    ${presupuesto.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Trazabilidad del flujo
            </Typography>
            <AuditoriaFlujo documento={presupuesto} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VerPresupuestoDialog;
