// FRONT-003: extracted from ComprasPedidosPage.tsx — vista read-only de
// la orden de compra (info general + items + total).  Botón "Imprimir PDF"
// delegado al padre via callback.
import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import type { OrdenCompra, Producto } from '../../../../types';
import { IVA_RATE, IVA_LABEL } from '../../../../types/compra.types';
import { getEstadoColor, getEstadoIcon } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onPrintPdf: () => void;
  orden: OrdenCompra | null;
  productos: Producto[];
}

const METODO_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  TARJETA_DEBITO: 'Tarjeta de Débito',
  TRANSFERENCIA: 'Transferencia Bancaria',
  CHEQUE: 'Cheque',
  FINANCIACION_PROPIA: 'Financiación Propia',
};

const ViewOrdenDialog: React.FC<Props> = ({ open, onClose, onPrintPdf, orden, productos }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Orden de Compra {orden?.numero}</DialogTitle>
      <DialogContent>
        {orden && (
          <Box pt={2}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Proveedor
                  </Typography>
                  <Typography variant="body1">{orden.proveedor?.razonSocial}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    icon={getEstadoIcon(orden.estado)}
                    label={orden.estado}
                    color={getEstadoColor(orden.estado)}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fecha Creación
                  </Typography>
                  <Typography variant="body1">
                    {new Date(orden.fechaCreacion).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Entrega Estimada
                  </Typography>
                  <Typography variant="body1">
                    {new Date(orden.fechaEntregaEstimada).toLocaleDateString()}
                  </Typography>
                </Box>
                {orden.fechaEntregaReal && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Entrega Real
                    </Typography>
                    <Typography variant="body1">
                      {new Date(orden.fechaEntregaReal).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
                {orden.metodoPago && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Forma de Pago
                    </Typography>
                    <Typography variant="body1">
                      {METODO_PAGO_LABELS[orden.metodoPago] ?? orden.metodoPago}
                    </Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    IVA
                  </Typography>
                  <Typography variant="body1">
                    {IVA_LABEL[orden.tipoIva ?? 'EXENTO']}
                  </Typography>
                </Box>
              </Box>
              {orden.observaciones && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">{orden.observaciones}</Typography>
                </Box>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Items de la Orden
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Subtotal neto</TableCell>
                    <TableCell align="right">Subtotal c/IVA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orden.items.map((item) => {
                    const producto = item.productoId
                      ? productos.find((p) => p.id === Number(item.productoId))
                      : null;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const itemAny = item as any;
                    const productName =
                      item.nombreProductoTemporal ||
                      itemAny.nombre ||
                      itemAny.productoNombre ||
                      producto?.nombre ||
                      item.descripcion ||
                      'Producto sin nombre';
                    const productCode =
                      item.codigoProductoTemporal || itemAny.codigo || producto?.codigo || '';

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {productName}
                          </Typography>
                          {productCode && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Código: {productCode}
                            </Typography>
                          )}
                          {item.descripcionProductoTemporal &&
                            item.descripcionProductoTemporal !== productName && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                {item.descripcionProductoTemporal}
                              </Typography>
                            )}
                          {item.observaciones && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              display="block"
                              sx={{ fontStyle: 'italic' }}
                            >
                              Obs: {item.observaciones}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell align="right">
                          ${item.precioUnitario.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">${item.subtotal.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          ${(item.subtotal * (1 + (IVA_RATE[orden.tipoIva ?? 'EXENTO'] ?? 0))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(() => {
                    const tasa = IVA_RATE[orden.tipoIva ?? 'EXENTO'] ?? 0;
                    const neto = orden.subtotalNeto
                      ?? orden.items.reduce((sum, it) => sum + it.subtotal, 0);
                    const iva = orden.montoIva ?? Math.round(neto * tasa * 100) / 100;
                    const total = orden.total ?? neto + iva;
                    const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return (
                      <>
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ borderBottom: 'none' }}>
                            Subtotal neto
                          </TableCell>
                          <TableCell colSpan={2} align="right" sx={{ borderBottom: 'none' }}>
                            ${fmt(neto)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ borderBottom: 'none' }}>
                            {IVA_LABEL[orden.tipoIva ?? 'EXENTO']}
                          </TableCell>
                          <TableCell colSpan={2} align="right" sx={{ borderBottom: 'none' }}>
                            ${fmt(iva)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                            Total
                          </TableCell>
                          <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>
                            ${fmt(total)}
                          </TableCell>
                        </TableRow>
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={onPrintPdf}>
          Imprimir PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewOrdenDialog;
