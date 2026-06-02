import { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Alert, CircularProgress, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { Payment, Close } from '@mui/icons-material';
import dayjs from 'dayjs';
import { cuotaPrestamoApi } from '../../../api/services/cuotaPrestamoApi';
import {
  EstadoCuota, ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS,
} from '../../../types/prestamo.types';
import type { CuotaPrestamoDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { RegistrarPagoDialog } from '../RegistrarPagoDialog';

interface RegistrarCobroDialogProps {
  open: boolean;
  prestamoId: number;
  clienteId: number;
  clienteNombre: string;
  onClose: () => void;
  /** Se llama tras cada pago/informe para refrescar la agenda. */
  onSaved: () => void;
}

const COBRABLE = new Set<EstadoCuota>([
  EstadoCuota.PENDIENTE, EstadoCuota.VENCIDA, EstadoCuota.PARCIAL, EstadoCuota.PAGO_INFORMADO,
]);

const saldoCuota = (c: CuotaPrestamoDTO) => c.montoCuota - c.montoPagado;

export const RegistrarCobroDialog: React.FC<RegistrarCobroDialogProps> = ({
  open, prestamoId, clienteId, clienteNombre, onClose, onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuotas, setCuotas] = useState<CuotaPrestamoDTO[]>([]);
  const [pagoCuota, setPagoCuota] = useState<CuotaPrestamoDTO | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allCuotas = await cuotaPrestamoApi.getByPrestamo(prestamoId);
      setCuotas([...allCuotas].sort((a, b) => a.numeroCuota - b.numeroCuota));
    } catch {
      setCuotas([]);
      setError('No se pudieron cargar las cuotas del crédito.');
    } finally {
      setLoading(false);
    }
  }, [prestamoId]);

  useEffect(() => {
    if (open && prestamoId) load();
  }, [open, prestamoId, load]);

  const cobrables = cuotas.filter((c) => COBRABLE.has(c.estado) && saldoCuota(c) > 0);
  const totalVencido = cobrables
    .filter((c) => c.estado === EstadoCuota.VENCIDA || c.estado === EstadoCuota.PARCIAL)
    .reduce((s, c) => s + saldoCuota(c), 0);

  const handlePagoSaved = async () => {
    setPagoCuota(null);
    onSaved();              // refresca la agenda en el padre
    await load();           // recarga cuotas dentro del modal
  };

  return (
    <>
      <Dialog open={open && !pagoCuota} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Registrar cobro
          <br />
          <Typography component="span" variant="body2" color="text.secondary">{clienteNombre}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {cobrables.length === 0 ? 'Sin cuotas pendientes de cobro' : `${cobrables.length} cuota(s) a cobrar`}
                </Typography>
                {totalVencido > 0 && (
                  <Chip color="error" label={`Vencido: ${formatPrice(totalVencido)}`} sx={{ fontWeight: 700 }} />
                )}
              </Stack>
              <Divider sx={{ mb: 1 }} />

              {cobrables.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No hay cuotas pendientes. El crédito está al día.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cuota</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cobrables.map((c) => {
                      const vencida = c.estado === EstadoCuota.VENCIDA || c.estado === EstadoCuota.PARCIAL;
                      const informada = c.estado === EstadoCuota.PAGO_INFORMADO;
                      return (
                        <TableRow key={c.id} sx={vencida ? { bgcolor: 'error.50' } : undefined}>
                          <TableCell>N.º {c.numeroCuota}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color={vencida ? 'error.main' : 'text.primary'}>
                              {dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>{formatPrice(saldoCuota(c))}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={ESTADO_CUOTA_LABELS[c.estado]}
                              sx={{ bgcolor: ESTADO_CUOTA_COLORS[c.estado], color: '#fff', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Payment />}
                              disabled={informada}
                              onClick={() => setPagoCuota(c)}
                            >
                              {informada ? 'Informada' : 'Cobrar'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} startIcon={<Close />}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Flujo de pago reutilizado: maneja cobranzas=informar vs admin=caja, cheque, etc. */}
      <RegistrarPagoDialog
        open={!!pagoCuota}
        cuota={pagoCuota}
        clienteId={clienteId}
        prestamoId={prestamoId}
        allCuotas={cuotas}
        onClose={() => setPagoCuota(null)}
        onSaved={handlePagoSaved}
      />
    </>
  );
};
