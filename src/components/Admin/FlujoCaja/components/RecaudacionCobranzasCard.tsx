import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Box, Stack, CircularProgress, Alert, Chip, Divider,
} from '@mui/material';
import { ReceiptLong, CheckCircle } from '@mui/icons-material';
import { pagoInformadoApi } from '../../../../api/services/pagoInformadoApi';
import type { RecaudacionCobranzaItem } from '../../../../api/services/adminFlujoCajaApi';
import { formatPrice } from '../../../../utils/priceCalculations';

interface Props {
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Seguimiento de la cobranza de préstamos personales en el flujo de caja.
 * Acumula por separado:
 *   - Informado (pendiente de ingreso): pagos declarados por cobranzas que
 *     aún esperan confirmación de admin. NO suma al flujo neto.
 *   - Informado y cobrado: pagos ya confirmados que ingresaron a caja. Ya
 *     están incluidos en el flujo neto; se muestran como métrica de cobranza.
 */
export const RecaudacionCobranzasCard: React.FC<Props> = ({ fechaDesde, fechaHasta }) => {
  const [pendientes, setPendientes] = useState<RecaudacionCobranzaItem[]>([]);
  const [confirmados, setConfirmados] = useState<RecaudacionCobranzaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [pend, conf] = await Promise.all([
          pagoInformadoApi.recaudacionPorCobranzas(fechaDesde, fechaHasta, 'PENDIENTE_CONFIRMACION'),
          pagoInformadoApi.recaudacionPorCobranzas(fechaDesde, fechaHasta, 'CONFIRMADO'),
        ]);
        if (!cancelled) {
          setPendientes(pend);
          setConfirmados(conf);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || 'No se pudo cargar la recaudación de cobranzas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fechaDesde, fechaHasta]);

  const totalPendiente = pendientes.reduce((sum, i) => sum + (i.totalInformado || 0), 0);
  const cantidadPendiente = pendientes.reduce((sum, i) => sum + (i.cantidadPagos || 0), 0);
  const totalConfirmado = confirmados.reduce((sum, i) => sum + (i.totalInformado || 0), 0);
  const cantidadConfirmado = confirmados.reduce((sum, i) => sum + (i.cantidadPagos || 0), 0);

  const renderTabla = (items: RecaudacionCobranzaItem[]) => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Agente de cobranzas</TableCell>
          <TableCell align="right">Cantidad</TableCell>
          <TableCell align="right">Total</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(i => (
          <TableRow key={i.usuarioId}>
            <TableCell>{i.nombreUsuario}</TableCell>
            <TableCell align="right">{i.cantidadPagos}</TableCell>
            <TableCell align="right"><strong>{formatPrice(i.totalInformado)}</strong></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card sx={{ borderLeft: '4px solid #FFC107', mt: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <ReceiptLong sx={{ color: '#FFC107' }} />
          <Typography variant="h6">Cobranza de préstamos personales</Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
        ) : (
          <>
            {/* ==================== INFORMADO (PENDIENTE DE INGRESO) ==================== */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">Informado (pendiente de ingreso)</Typography>
              <Chip size="small" label="No suma al flujo neto" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Pagos declarados por cobranzas en el rango que aún no fueron confirmados por administración.
              Confirmarlos los traslada al flujo de caja real.
            </Typography>
            <Stack direction="row" spacing={4} sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total pendiente</Typography>
                <Typography variant="h6" sx={{ color: '#FFC107' }}>{formatPrice(totalPendiente)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Cantidad de pagos</Typography>
                <Typography variant="h6">{cantidadPendiente}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Agentes</Typography>
                <Typography variant="h6">{pendientes.length}</Typography>
              </Box>
            </Stack>
            {pendientes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No hay pagos informados pendientes en el rango seleccionado.
              </Typography>
            ) : renderTabla(pendientes)}

            <Divider sx={{ my: 2 }} />

            {/* ==================== INFORMADO Y COBRADO (INGRESADO A CAJA) ==================== */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <CheckCircle sx={{ color: 'success.main' }} fontSize="small" />
              <Typography variant="subtitle1" fontWeight="bold">Informado y cobrado (ingresado a caja)</Typography>
              <Chip size="small" color="success" variant="outlined" label="Incluido en el flujo neto" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Pagos informados por cobranzas que administración ya confirmó e ingresaron a caja en el rango.
            </Typography>
            <Stack direction="row" spacing={4} sx={{ mb: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total cobrado</Typography>
                <Typography variant="h6" color="success.main">{formatPrice(totalConfirmado)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Cantidad de pagos</Typography>
                <Typography variant="h6">{cantidadConfirmado}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Agentes</Typography>
                <Typography variant="h6">{confirmados.length}</Typography>
              </Box>
            </Stack>
            {confirmados.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay pagos informados confirmados en el rango seleccionado.
              </Typography>
            ) : renderTabla(confirmados)}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecaudacionCobranzasCard;
