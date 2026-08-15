import React from 'react';
import {
  Box, Button, Card, CardContent, Chip, Divider,
  Stack, Typography,
} from '@mui/material';
import { AttachMoney as AttachMoneyIcon, AccountBalanceWallet as WalletIcon } from '@mui/icons-material';
import type { ResumenFinancieroViaje } from '../../../types';

// ── Helper ────────────────────────────────────────────────────────────────────
const fmt = (n?: number | null) =>
  n != null ? `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

// ── Componentes de Resumen de Cobros ─────────────────────────────────────────

const COBRO_COLOR_MAP: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  COBRADO: 'success',
  COBRADO_PARCIAL: 'warning',
  COBRO_EXCEDENTE: 'warning',
  SIN_COBRO: 'default',
  PENDIENTE: 'error',
};
const COBRO_LABEL_MAP: Record<string, string> = {
  COBRADO: 'Cobrado',
  COBRADO_PARCIAL: 'Parcial',
  COBRO_EXCEDENTE: 'Excedente',
  SIN_COBRO: 'Sin cobro',
  PENDIENTE: 'Pendiente',
};

interface ResumenCobrosProps {
  resumen: ResumenFinancieroViaje | null | undefined;
  estadoViaje?: string;
  puedeRendir?: boolean;
  onRendir?: () => void;
}

/** Versión mobile: lista compacta de tarjetas */
export const ResumenCobrosMobile: React.FC<ResumenCobrosProps> = ({ resumen, estadoViaje, puedeRendir, onRendir }) => {
  if (resumen === undefined) {
    return (
      <Box textAlign="center" py={3}>
        <Typography variant="body2" color="text.secondary">Cargando cobros…</Typography>
      </Box>
    );
  }
  if (resumen === null || resumen.cantidadEntregas === 0) {
    return (
      <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
        Sin entregas con información financiera
      </Typography>
    );
  }

  const totalCobrado = resumen.totalCobradoConductor ?? 0;
  const hayCobrosPendientes = puedeRendir
    && (estadoViaje === 'COMPLETADO' || estadoViaje === 'PENDIENTE_RENDICION')
    && totalCobrado > 0;

  return (
    <Stack spacing={1.5}>
      {/* Totales del viaje */}
      <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.main' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <WalletIcon color="success" fontSize="small" />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              RESUMEN DEL VIAJE
            </Typography>
          </Box>
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">A recaudar</Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                {fmt(resumen.totalEntregasIniciales)}
              </Typography>
            </Box>
            {totalCobrado > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Cobrado</Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {fmt(totalCobrado)}
                </Typography>
              </Box>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {resumen.cantidadEntregas} entregas
          </Typography>
        </CardContent>
      </Card>

      {/* Detalle por entrega */}
      {resumen.entregas.map((ef, i) => (
        <Card key={ef.entregaId} variant="outlined">
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1} mr={1}>
                <Typography variant="subtitle2">
                  Entrega #{i + 1}
                  {ef.clienteNombre ? ` — ${ef.clienteNombre}` : ''}
                </Typography>
                {ef.numeroDocumento && (
                  <Typography variant="caption" color="text.secondary">
                    {ef.numeroDocumento}
                    {ef.tieneFinanciacion && (
                      <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 0.5 }}>
                        · Financiado ({ef.cantidadCuotas} × {fmt(ef.montoCuota)})
                      </Typography>
                    )}
                  </Typography>
                )}
                {ef.direccionEntrega && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {ef.direccionEntrega}
                  </Typography>
                )}
              </Box>
              <Box textAlign="right">
                {/* A cobrar */}
                <Typography variant="caption" color="text.secondary" display="block">A cobrar</Typography>
                <Typography variant="body2" fontWeight={700} color={ef.montoEntregaInicial != null ? 'success.dark' : 'text.disabled'}>
                  {fmt(ef.montoEntregaInicial)}
                </Typography>
                {/* Cobrado */}
                {ef.montoCobrado != null && (
                  <>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Cobrado</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {fmt(ef.montoCobrado)}
                    </Typography>
                  </>
                )}
                {/* Estado cobro */}
                {ef.estadoCobro ? (
                  <Chip
                    label={COBRO_LABEL_MAP[ef.estadoCobro] ?? ef.estadoCobro}
                    color={COBRO_COLOR_MAP[ef.estadoCobro] ?? 'default'}
                    size="small"
                    sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
                  />
                ) : (
                  <Chip
                    label={ef.estado === 'ENTREGADA' ? 'Entregada' : ef.estado === 'NO_ENTREGADA' ? 'No entregada' : 'Pendiente'}
                    size="small"
                    color={ef.estado === 'ENTREGADA' ? 'success' : ef.estado === 'NO_ENTREGADA' ? 'error' : 'warning'}
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {/* Botón rendir */}
      {hayCobrosPendientes && (
        <Button
          variant="contained"
          color="success"
          fullWidth
          startIcon={<AttachMoneyIcon />}
          onClick={onRendir}
          sx={{ mt: 1 }}
        >
          Rendir cobros ({fmt(totalCobrado)})
        </Button>
      )}
    </Stack>
  );
};

/** Versión desktop: tabla compacta dentro del drawer */
export const ResumenCobrosDesktop: React.FC<ResumenCobrosProps> = ({ resumen, estadoViaje, puedeRendir, onRendir }) => {
  if (resumen === undefined) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AttachMoneyIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Cobros del viaje</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">Cargando…</Typography>
        </CardContent>
      </Card>
    );
  }
  if (resumen === null || resumen.cantidadEntregas === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <AttachMoneyIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Cobros del viaje</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Sin información financiera disponible
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const totalCobrado = resumen.totalCobradoConductor ?? 0;
  const hayCobrosPendientes = puedeRendir
    && (estadoViaje === 'COMPLETADO' || estadoViaje === 'PENDIENTE_RENDICION')
    && totalCobrado > 0;

  return (
    <Card variant="outlined" sx={{ borderColor: 'success.main' }}>
      <CardContent>
        {/* Header con totales */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <WalletIcon color="success" />
            <Typography variant="subtitle1" fontWeight={700}>
              Cobros del viaje
            </Typography>
          </Box>
          <Stack direction="row" spacing={3} alignItems="flex-end">
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" display="block">
                A recaudar
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                {fmt(resumen.totalEntregasIniciales)}
              </Typography>
            </Box>
            {totalCobrado > 0 && (
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  Cobrado por conductor
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary.main">
                  {fmt(totalCobrado)}
                </Typography>
              </Box>
            )}
            {hayCobrosPendientes && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<AttachMoneyIcon />}
                onClick={onRendir}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Rendir cobros
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Tabla de entregas */}
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <Box component="thead">
            <Box component="tr">
              {['#', 'Cliente', 'Documento', 'A cobrar', 'Cobrado', 'Estado cobro'].map(h => (
                <Box
                  key={h}
                  component="th"
                  sx={{
                    textAlign: (h === 'A cobrar' || h === 'Cobrado') ? 'right' : 'left',
                    py: 0.5,
                    px: 1,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {h}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {resumen.entregas.map((ef, i) => (
              <Box
                key={ef.entregaId}
                component="tr"
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: i < resumen.entregas.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Box component="td" sx={{ py: 1, px: 1, fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  #{i + 1}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>
                  {ef.clienteNombre ?? '—'}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, fontSize: '0.85rem' }}>
                  <Typography variant="caption" display="block">{ef.numeroDocumento ?? '—'}</Typography>
                  {ef.tieneFinanciacion && ef.cantidadCuotas && (
                    <Typography variant="caption" color="primary.main">
                      {ef.cantidadCuotas} × {fmt(ef.montoCuota)}
                    </Typography>
                  )}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={ef.montoEntregaInicial != null ? 'success.dark' : 'text.disabled'}
                  >
                    {fmt(ef.montoEntregaInicial)}
                  </Typography>
                </Box>
                <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {ef.montoCobrado != null ? (
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {fmt(ef.montoCobrado)}
                      </Typography>
                      {ef.diferenciaCobro != null && ef.diferenciaCobro !== 0 && (
                        <Typography
                          variant="caption"
                          color={ef.diferenciaCobro > 0 ? 'warning.main' : 'error.main'}
                        >
                          {ef.diferenciaCobro > 0 ? '+' : ''}{fmt(ef.diferenciaCobro)}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </Box>
                <Box component="td" sx={{ py: 1, px: 1 }}>
                  {ef.estadoCobro ? (
                    <Chip
                      label={COBRO_LABEL_MAP[ef.estadoCobro] ?? ef.estadoCobro}
                      color={COBRO_COLOR_MAP[ef.estadoCobro] ?? 'default'}
                      size="small"
                    />
                  ) : (
                    <Chip
                      label={ef.estado === 'ENTREGADA' ? 'Entregada' : ef.estado === 'NO_ENTREGADA' ? 'No entregada' : 'Pendiente'}
                      size="small"
                      color={ef.estado === 'ENTREGADA' ? 'success' : ef.estado === 'NO_ENTREGADA' ? 'error' : 'warning'}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
          {/* Footer con totales */}
          <Box component="tfoot">
            <Box component="tr" sx={{ bgcolor: 'action.hover' }}>
              <Box component="td" colSpan={3} sx={{ py: 1, px: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                Total viaje ({resumen.cantidadEntregas} entregas)
              </Box>
              <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right' }}>
                <Typography variant="body1" fontWeight={700} color="success.dark">
                  {fmt(resumen.totalEntregasIniciales)}
                </Typography>
              </Box>
              <Box component="td" sx={{ py: 1, px: 1, textAlign: 'right' }}>
                {totalCobrado > 0 && (
                  <Typography variant="body1" fontWeight={700} color="primary.main">
                    {fmt(totalCobrado)}
                  </Typography>
                )}
              </Box>
              <Box component="td" />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
