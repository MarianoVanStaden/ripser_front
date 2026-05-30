import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  InputAdornment,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmber as WarningIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import type { Viaje } from '../../types';
import type { RendicionViajeDTO, RendicionEntregaDTO, EstadoCobro } from '../../types/logistica.types';
import type { MetodoPago } from '../../types/venta.types';
import { cajaEsDefaultPara, type CajaUnificada } from '../../types/caja.types';
import { METODO_PAGO_LABELS } from '../../types/venta.types';
import { cajasApi } from '../../api/services/cajasApi';
import { viajeApi } from '../../api/services/viajeApi';

// Métodos de pago válidos para una rendición (excluye los no-caja)
const METODOS_RENDICION: MetodoPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA_BANCARIA',
  'CHEQUE',
];

interface Props {
  open: boolean;
  viaje: Viaje | null;
  onClose: () => void;
  onSuccess: () => void;
}

const fmt = (n?: number | null) =>
  n != null
    ? `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

const COBRO_COLOR: Record<EstadoCobro, 'success' | 'warning' | 'error' | 'default'> = {
  COBRADO: 'success',
  COBRADO_PARCIAL: 'warning',
  COBRO_EXCEDENTE: 'warning',
  SIN_COBRO: 'default',
  PENDIENTE: 'error',
};

const COBRO_LABEL: Record<EstadoCobro, string> = {
  COBRADO: 'Cobrado',
  COBRADO_PARCIAL: 'Parcial',
  COBRO_EXCEDENTE: 'Excedente',
  SIN_COBRO: 'Sin cobro',
  PENDIENTE: 'Pendiente',
};

/** Fila de detalle por entrega */
const EntregaCobroRow: React.FC<{ entrega: RendicionEntregaDTO; idx: number }> = ({ entrega, idx }) => (
  <Box
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    py={0.75}
    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
  >
    <Box>
      <Typography variant="body2" fontWeight={500}>
        #{idx + 1} {entrega.clienteNombre ?? '—'}
      </Typography>
      {entrega.numeroDocumento && (
        <Typography variant="caption" color="text.secondary">{entrega.numeroDocumento}</Typography>
      )}
    </Box>
    <Box textAlign="right">
      <Typography variant="body2" fontWeight={600}>
        {fmt(entrega.montoCobrado ?? entrega.montoEsperado)}
      </Typography>
      {entrega.estadoCobro && (
        <Chip
          label={COBRO_LABEL[entrega.estadoCobro]}
          color={COBRO_COLOR[entrega.estadoCobro]}
          size="small"
          sx={{ mt: 0.25, height: 18, fontSize: '0.65rem' }}
        />
      )}
    </Box>
  </Box>
);

const RendicionDialog: React.FC<Props> = ({ open, viaje, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [resumen, setResumen] = useState<RendicionViajeDTO | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // Form
  const [totalRecibido, setTotalRecibido] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [cajas, setCajas] = useState<CajaUnificada[]>([]);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<CajaUnificada | null>(null);
  const [comprobante, setComprobante] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rendicionCreada, setRendicionCreada] = useState<RendicionViajeDTO | null>(null);

  // Cargar resumen de cobros al abrir
  useEffect(() => {
    if (!open || !viaje) return;
    setResumen(null);
    setRendicionCreada(null);
    setError(null);
    setTotalRecibido('');
    setComprobante('');
    setObservaciones('');
    setCajaSeleccionada(null);
    setMetodoPago('EFECTIVO');

    setLoadingResumen(true);
    viajeApi.getResumenCobros(viaje.id)
      .then(setResumen)
      .catch(() => setError('No se pudo cargar el resumen de cobros'))
      .finally(() => setLoadingResumen(false));
  }, [open, viaje]);

  // Cargar cajas al cambiar método de pago
  useEffect(() => {
    if (!open) return;
    setCajaSeleccionada(null);
    setCajas([]);
    setLoadingCajas(true);
    cajasApi.getByMetodoPago(metodoPago)
      .then((lista) => {
        setCajas(lista);
        const def = lista.find(c => cajaEsDefaultPara(c, metodoPago)) ?? lista[0] ?? null;
        setCajaSeleccionada(def);
      })
      .catch(() => {})
      .finally(() => setLoadingCajas(false));
  }, [metodoPago, open]);

  const totalDeclarado = resumen?.totalDeclarado ?? 0;
  const totalRecibidoNum = parseFloat(totalRecibido.replace(',', '.')) || 0;
  const diferencia = totalRecibidoNum - totalDeclarado;
  const hayDiferencia = Math.abs(diferencia) > 0.01;

  const canSubmit =
    !submitting &&
    !loadingResumen &&
    totalRecibidoNum >= 0 &&
    totalRecibido !== '' &&
    (cajaSeleccionada !== null || metodoPago === 'CUENTA_CORRIENTE');

  const handleSubmit = async () => {
    if (!viaje || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await viajeApi.rendir(viaje.id, {
        totalRecibido: totalRecibidoNum,
        cajaPesosId: cajaSeleccionada?.tipo === 'PESOS' ? cajaSeleccionada.id : null,
        cajaAhorroId: cajaSeleccionada?.tipo === 'AHORRO' ? cajaSeleccionada.id : null,
        metodoPagoRendicion: metodoPago,
        comprobanteRendicion: comprobante || undefined,
        observaciones: observaciones || undefined,
      });
      setRendicionCreada(result);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Error al registrar la rendición';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estado de éxito */}
      {rendicionCreada && (
        <Box textAlign="center" py={2}>
          <CheckIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h6" fontWeight={700} mt={1}>
            Rendición registrada
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {rendicionCreada.estadoRendicion === 'CONFIRMADA'
              ? 'El monto coincide exactamente con lo declarado.'
              : `Diferencia de ${fmt(rendicionCreada.diferencia)}. Verificar con el conductor.`}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">Declarado</Typography>
              <Typography variant="h6" fontWeight={700}>{fmt(rendicionCreada.totalDeclarado)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Recibido</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                {fmt(rendicionCreada.totalRecibido)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Formulario */}
      {!rendicionCreada && (
        <>
          {/* Resumen de cobros declarados */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WalletIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2">Lo que declaró el conductor</Typography>
              </Box>

              {loadingResumen ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : resumen ? (
                <>
                  {resumen.entregas.map((e, i) => (
                    <EntregaCobroRow key={e.entregaId} entrega={e} idx={i} />
                  ))}
                  <Box display="flex" justifyContent="space-between" mt={1.5}>
                    <Typography variant="subtitle2">Total declarado</Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                      {fmt(totalDeclarado)}
                    </Typography>
                  </Box>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Divider sx={{ mb: 2 }} />

          {/* Formulario de rendición */}
          <Typography variant="subtitle2" mb={1.5} display="flex" alignItems="center" gap={0.5}>
            <ReceiptIcon fontSize="small" /> Lo que recibió administración
          </Typography>

          <Stack spacing={2}>
            {/* Total recibido */}
            <TextField
              label="Monto recibido del conductor"
              type="number"
              value={totalRecibido}
              onChange={(e) => setTotalRecibido(e.target.value)}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText={
                totalRecibido && hayDiferencia
                  ? diferencia > 0
                    ? `Excedente: ${fmt(diferencia)}`
                    : `Faltante: ${fmt(Math.abs(diferencia))}`
                  : totalRecibido
                  ? 'Monto coincide exactamente ✓'
                  : 'Ingresá el total contado físicamente'
              }
              FormHelperTextProps={{
                sx: {
                  color: !totalRecibido
                    ? 'text.secondary'
                    : hayDiferencia
                    ? 'warning.main'
                    : 'success.main',
                },
              }}
            />

            {/* Método de pago */}
            <FormControl size="small" fullWidth>
              <InputLabel>Método de pago</InputLabel>
              <Select
                value={metodoPago}
                label="Método de pago"
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
              >
                {METODOS_RENDICION.map((m) => (
                  <MenuItem key={m} value={m}>{METODO_PAGO_LABELS[m]}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Caja destino */}
            <FormControl size="small" fullWidth disabled={loadingCajas || cajas.length === 0}>
              <InputLabel>Caja destino</InputLabel>
              <Select
                value={cajaSeleccionada?.id ?? ''}
                label="Caja destino"
                onChange={(e) => {
                  const found = cajas.find(c => c.id === Number(e.target.value)) ?? null;
                  setCajaSeleccionada(found);
                }}
              >
                {cajas.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                    {cajaEsDefaultPara(c, metodoPago) && (
                      <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                        (default)
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Comprobante */}
            <TextField
              label="N° comprobante / recibo (opcional)"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              fullWidth
              size="small"
            />

            {/* Observaciones */}
            <TextField
              label="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={2}
            />

            {/* Alerta de diferencia */}
            {totalRecibido && hayDiferencia && (
              <Alert severity="warning" icon={<WarningIcon fontSize="small" />}>
                Hay una diferencia de <strong>{fmt(Math.abs(diferencia))}</strong>{' '}
                {diferencia > 0 ? '(conductor trajo de más)' : '(conductor trajo de menos)'}. La rendición
                quedará marcada como <strong>CON DIFERENCIA</strong> para su seguimiento.
              </Alert>
            )}
          </Stack>
        </>
      )}
    </Box>
  );

  const actions = rendicionCreada ? (
    <Button variant="contained" fullWidth onClick={onClose}>
      Cerrar
    </Button>
  ) : (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%">
      <Button variant="outlined" onClick={onClose} disabled={submitting} fullWidth>
        Cancelar
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={!canSubmit}
        fullWidth
        startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
      >
        {submitting ? 'Registrando…' : 'Confirmar rendición'}
      </Button>
    </Stack>
  );

  const title = rendicionCreada
    ? 'Rendición completada'
    : `Rendir viaje ${viaje?.numeroViaje ? `#${viaje.numeroViaje}` : ''}`;

  // Mobile: SwipeableDrawer
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '95vh' },
        }}
      >
        <Box sx={{ width: 40, height: 4, bgcolor: 'grey.300', borderRadius: 2, mx: 'auto', mt: 1.5, mb: 1 }} />
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
            position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1,
          }}
        >
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>{content}</Box>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0 }}>
          {actions}
        </Box>
      </SwipeableDrawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog
      open={open}
      onClose={rendicionCreada ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{title}</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>{content}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>
    </Dialog>
  );
};

export default RendicionDialog;
