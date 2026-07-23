import { useCallback, useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Tooltip, CircularProgress, Alert, Stack,
} from '@mui/material';
import { CheckCircle, Block, Refresh, ReceiptLong } from '@mui/icons-material';
import dayjs from 'dayjs';
import { pagoInformadoApi } from '../../../api/services/pagoInformadoApi';
import type { PagoInformadoDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';

const formatFecha = (v?: string | null): string => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
import { ConfirmarPagoInformadoDialog } from './ConfirmarPagoInformadoDialog';
import { RechazarPagoInformadoDialog } from './RechazarPagoInformadoDialog';

export const BandejaPagosInformadosPage: React.FC = () => {
  const [pagos, setPagos] = useState<PagoInformadoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PagoInformadoDTO | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pagoInformadoApi.listarPendientes();
      setPagos(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'No se pudieron cargar los pagos informados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openConfirm = (p: PagoInformadoDTO) => { setSelected(p); setConfirmOpen(true); };
  const openReject = (p: PagoInformadoDTO) => { setSelected(p); setRejectOpen(true); };

  const totalPendiente = pagos.reduce((sum, p) => sum + (p.montoInformado || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLong /> Pagos Informados por Cobranzas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pagos declarados por cobranzas que esperan confirmación de ingreso a caja.
          </Typography>
        </Box>
        <Tooltip title="Recargar"><IconButton onClick={load}><Refresh /></IconButton></Tooltip>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">Informes pendientes</Typography>
              <Typography variant="h6">{pagos.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Monto total pendiente</Typography>
              <Typography variant="h6">{formatPrice(totalPendiente)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : pagos.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay pagos informados pendientes.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Préstamo / Cuota</TableCell>
                  <TableCell>Comprobante</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Fecha informada</TableCell>
                  <TableCell>Informado por</TableCell>
                  <TableCell>Estado previo</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagos.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.clienteNombre}</TableCell>
                    <TableCell>
                      {p.cuotaId != null
                        ? `#${p.prestamoId} — ${p.numeroCuota}`
                        : (
                          <Chip
                            size="small"
                            variant="outlined"
                            color="warning"
                            label={`Gestión libre${p.descripcionOrigen ? `: ${p.descripcionOrigen}` : ''}`}
                          />
                        )}
                    </TableCell>
                    <TableCell>{p.numeroComprobante}</TableCell>
                    <TableCell>{p.metodoPago}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {formatPrice(p.montoInformado)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatFecha(p.fechaPagoInformada)}</TableCell>
                    <TableCell>{p.usuarioCobranzasNombre}</TableCell>
                    <TableCell>{p.cuotaId != null ? <Chip size="small" label={p.estadoCuotaPrevio} /> : '—'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Confirmar ingreso">
                        <IconButton color="success" onClick={() => openConfirm(p)}>
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rechazar">
                        <IconButton color="error" onClick={() => openReject(p)}>
                          <Block />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmarPagoInformadoDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirmado={load}
        pago={selected}
      />
      <RechazarPagoInformadoDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onRechazado={load}
        pago={selected}
      />
    </Box>
  );
};

export default BandejaPagosInformadosPage;
