import { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Box, Stack, CircularProgress, Alert, Chip,
} from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';
import { pagoInformadoApi } from '../../../../api/services/pagoInformadoApi';
import type { RecaudacionCobranzaItem } from '../../../../api/services/adminFlujoCajaApi';
import { formatPrice } from '../../../../utils/priceCalculations';

interface Props {
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Inciso informativo del flujo de caja: total cobrado por cobranzas en el
 * rango, pendiente de confirmación admin. NO suma al flujo neto — la plata
 * recién está formalmente ingresada cuando admin confirma cada PagoInformado.
 */
export const RecaudacionCobranzasCard: React.FC<Props> = ({ fechaDesde, fechaHasta }) => {
  const [items, setItems] = useState<RecaudacionCobranzaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await pagoInformadoApi.recaudacionPorCobranzas(fechaDesde, fechaHasta);
        if (!cancelled) setItems(data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || 'No se pudo cargar la recaudación de cobranzas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fechaDesde, fechaHasta]);

  const total = items.reduce((sum, i) => sum + (i.totalInformado || 0), 0);
  const cantidad = items.reduce((sum, i) => sum + (i.cantidadPagos || 0), 0);

  return (
    <Card sx={{ borderLeft: '4px solid #FFC107', mt: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <ReceiptLong sx={{ color: '#FFC107' }} />
          <Typography variant="h6">Cobrado por cobranzas (pendiente de ingreso)</Typography>
          <Chip size="small" label="Informativo — no suma al flujo neto" sx={{ ml: 1 }} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pagos declarados por cobranzas en el rango que aún no fueron confirmados por administración.
          Confirmarlos los traslada al flujo de caja real.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Total pendiente</Typography>
            <Typography variant="h6">{formatPrice(total)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Cantidad de pagos</Typography>
            <Typography variant="h6">{cantidad}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Agentes activos</Typography>
            <Typography variant="h6">{items.length}</Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay pagos informados pendientes en el rango seleccionado.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Agente de cobranzas</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Total informado</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
};

export default RecaudacionCobranzasCard;
