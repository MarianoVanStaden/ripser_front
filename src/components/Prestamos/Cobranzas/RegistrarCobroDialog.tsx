import { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Alert, CircularProgress, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { Payment, Close, PictureAsPdf } from '@mui/icons-material';
import dayjs from 'dayjs';
import { cuotaPrestamoApi } from '../../../api/services/cuotaPrestamoApi';
import { prestamoPersonalApi } from '../../../api/services/prestamoPersonalApi';
import {
  EstadoCuota, ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS,
} from '../../../types/prestamo.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';
import { generarCreditoPDF } from '../../../services/pdfService';
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
  const [prestamo, setPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  const [pagoCuota, setPagoCuota] = useState<CuotaPrestamoDTO | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    for (let intento = 0; intento < 2; intento++) {
      try {
        const [allCuotas, prestamoData] = await Promise.all([
          cuotaPrestamoApi.getByPrestamo(prestamoId),
          prestamoPersonalApi.getById(prestamoId),
        ]);
        setCuotas([...allCuotas].sort((a, b) => a.numeroCuota - b.numeroCuota));
        setPrestamo(prestamoData);
        setLoading(false);
        return;
      } catch {
        if (intento === 0) continue;
        setCuotas([]);
        setPrestamo(null);
        setError('No se pudieron cargar las cuotas. Reintentá en unos segundos.');
      }
    }
    setLoading(false);
  }, [prestamoId]);

  useEffect(() => {
    if (open && prestamoId) load();
  }, [open, prestamoId, load]);

  const cobrables = cuotas.filter((c) => COBRABLE.has(c.estado) && saldoCuota(c) > 0);
  const pagadas = cuotas.filter((c) => c.estado === EstadoCuota.PAGADA);
  const totalVencido = cobrables
    .filter((c) => c.estado === EstadoCuota.VENCIDA || c.estado === EstadoCuota.PARCIAL)
    .reduce((s, c) => s + saldoCuota(c), 0);

  const handlePagoSaved = async () => {
    setPagoCuota(null);
    onSaved();
    await load();
  };

  const handleExportarPDF = async () => {
    if (!prestamo) return;
    setExportingPdf(true);
    try {
      const doc = generarCreditoPDF(prestamo, cuotas);
      doc.save(`credito-${prestamo.id}-${clienteNombre.replace(/\s+/g, '_')}-${dayjs().format('YYYYMMDD')}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  // cuotas ya viene ordenado por numeroCuota; filtramos las visibles manteniendo ese orden
  const filasVisibles = cuotas.filter(
    (c) => (COBRABLE.has(c.estado) && saldoCuota(c) > 0) || c.estado === EstadoCuota.PAGADA,
  );

  return (
    <>
      <Dialog open={open && !pagoCuota} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Registrar cobro
          <br />
          <Typography component="span" variant="body2" color="text.secondary">{clienteNombre}</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : error ? (
            <Box sx={{ py: 2 }}>
              <Alert
                severity="error"
                action={<Button color="inherit" size="small" onClick={load}>Reintentar</Button>}
              >
                {error}
              </Alert>
            </Box>
          ) : (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {cobrables.length === 0 ? 'Sin cuotas pendientes de cobro' : `${cobrables.length} cuota(s) a cobrar`}
                  {pagadas.length > 0 && (
                    <Typography component="span" variant="body2" color="success.main" sx={{ ml: 1 }}>
                      · {pagadas.length} pagada(s)
                    </Typography>
                  )}
                </Typography>
                {totalVencido > 0 && (
                  <Chip color="error" label={`Vencido: ${formatPrice(totalVencido)}`} sx={{ fontWeight: 700 }} />
                )}
              </Stack>
              <Divider sx={{ mb: 1 }} />

              {filasVisibles.length === 0 ? (
                cuotas.length === 0 ? (
                  <Alert severity="warning" sx={{ my: 1 }}>
                    Este crédito no tiene cuotas cargadas. Puede ser un dato incompleto de
                    migración o un préstamo refinanciado/cancelado — revisá el crédito.
                  </Alert>
                ) : (
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Este crédito no tiene cuotas pendientes de cobro (todas pagadas, refinanciadas
                    o sin saldo).
                  </Typography>
                )
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
                    {filasVisibles.map((c) => {
                      const vencida = c.estado === EstadoCuota.VENCIDA || c.estado === EstadoCuota.PARCIAL;
                      const informada = c.estado === EstadoCuota.PAGO_INFORMADO;
                      const pagada = c.estado === EstadoCuota.PAGADA;
                      return (
                        <TableRow
                          key={c.id}
                          sx={
                            pagada
                              ? { bgcolor: 'success.50', opacity: 0.85 }
                              : vencida
                              ? { bgcolor: 'error.50' }
                              : undefined
                          }
                        >
                          <TableCell>N.º {c.numeroCuota}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color={vencida ? 'error.main' : pagada ? 'success.main' : 'text.primary'}>
                              {dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {pagada ? formatPrice(0) : formatPrice(saldoCuota(c))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={ESTADO_CUOTA_LABELS[c.estado]}
                              sx={{ bgcolor: ESTADO_CUOTA_COLORS[c.estado], color: '#fff', fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {pagada ? (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<Payment />}
                                disabled={informada}
                                onClick={() => setPagoCuota(c)}
                              >
                                {informada ? 'Informada' : 'Cobrar'}
                              </Button>
                            )}
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
          <Button
            onClick={handleExportarPDF}
            startIcon={<PictureAsPdf />}
            disabled={!prestamo || exportingPdf || loading}
            color="primary"
            variant="outlined"
          >
            {exportingPdf ? 'Generando…' : 'Exportar PDF'}
          </Button>
          <Box sx={{ flex: 1 }} />
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
