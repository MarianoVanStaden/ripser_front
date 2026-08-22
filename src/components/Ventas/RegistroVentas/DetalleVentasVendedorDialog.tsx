import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { documentoApi } from '../../../api/services';
import type { VentaEquipoDetalle } from '../../../api/services/documentoApi';
import { useTenant } from '../../../context/TenantContext';

interface Props {
  open: boolean;
  onClose: () => void;
  usuarioId: number | null;
  vendedorNombre: string;
  /** 'YYYY-MM' */
  mes: string;
}

const MOVIMIENTO_CHIP: Record<
  VentaEquipoDetalle['tipoMovimiento'],
  { label: string; color: 'success' | 'error' | 'warning' }
> = {
  VENTA: { label: 'Venta', color: 'success' },
  ANULACION_NC: { label: 'Nota de Crédito', color: 'error' },
  RECHAZO: { label: 'Rechazo NP', color: 'warning' },
};

const esResta = (mov: VentaEquipoDetalle['tipoMovimiento']) => mov !== 'VENTA';

/**
 * Detalle de una celda vendedor+mes del reporte Unidades por Vendedor: cada
 * equipo vendido (NP aprobada en el mes) y cada anulación (NC/rechazo) que
 * resta, con su documento.
 */
const DetalleVentasVendedorDialog: React.FC<Props> = ({
  open,
  onClose,
  usuarioId,
  vendedorNombre,
  mes,
}) => {
  const { empresaId } = useTenant();
  const anio = dayjs(mes, 'YYYY-MM').year();
  const mesNum = dayjs(mes, 'YYYY-MM').month() + 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ventas-equipos-vendedor-detalle', { empresaId, usuarioId, anio, mes: mesNum }],
    queryFn: () => documentoApi.getDetalleVentasEquiposVendedor(usuarioId!, anio, mesNum),
    enabled: open && usuarioId !== null,
  });

  const neto = (data ?? []).reduce(
    (acc, d) => acc + (esResta(d.tipoMovimiento) ? -d.cantidad : d.cantidad),
    0
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 6 }}>
        <Box>
          {vendedorNombre} — {dayjs(mes, 'YYYY-MM').format('MMMM YYYY')}
          <Typography variant="body2" color="text.secondary">
            Equipos vendidos y anulaciones del mes
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isError && <Alert severity="error">Error al cargar el detalle.</Alert>}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        {!isLoading && !isError && (data ?? []).length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" py={2}>
            Sin movimientos en el mes.
          </Typography>
        )}
        {!isLoading && !isError && (data ?? []).length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Movimiento</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Documento</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Equipo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Tipo
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  Cantidad
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((d, i) => {
                const chip = MOVIMIENTO_CHIP[d.tipoMovimiento];
                const resta = esResta(d.tipoMovimiento);
                return (
                  <TableRow key={`${d.documentoId}-${i}`} hover>
                    <TableCell>{dayjs(d.fecha).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>
                      <Chip size="small" label={chip.label} color={chip.color} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {d.numeroDocumento}
                      {d.tipoMovimiento === 'ANULACION_NC' && d.documentoOrigenNumero && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          sobre Factura {d.documentoOrigenNumero}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{d.recetaNombre}</TableCell>
                    <TableCell>
                      {d.codigoVenta ? (
                        d.codigoVenta.split(',').map((c) => (
                          <Chip
                            key={c.trim()}
                            size="small"
                            label={c.trim()}
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5, fontFamily: 'monospace' }}
                          />
                        ))
                      ) : d.tipoMovimiento === 'VENTA' && d.facturaNumero ? (
                        <Typography variant="caption" color="text.secondary">
                          {d.facturaNumero}
                          {d.facturaAnulada ? ' (anulada)' : ''}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          {d.tipoMovimiento === 'VENTA' ? 'Sin facturar' : '—'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">{d.tipoEquipo === 'HELADERA' ? 'H' : 'C'}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: resta ? 'error.main' : 'text.primary', fontWeight: 600 }}
                    >
                      {resta ? `−${d.cantidad}` : d.cantidad}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ '& td': { fontWeight: 600, borderTop: 2, borderColor: 'divider' } }}>
                <TableCell colSpan={6}>Neto del mes</TableCell>
                <TableCell align="right" sx={{ color: neto < 0 ? 'error.main' : 'text.primary' }}>
                  {neto < 0 ? `−${Math.abs(neto)}` : neto}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetalleVentasVendedorDialog;
