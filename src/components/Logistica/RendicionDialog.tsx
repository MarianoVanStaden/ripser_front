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
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  SwipeableDrawer,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  Save as SaveIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import type { Viaje } from '../../types';
import type { RendicionViajeDTO, RendicionEntregaDTO } from '../../types/logistica.types';
import { viajeApi } from '../../api/services/viajeApi';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import type { CobroData } from './Deliveries/types';
import CobroSection, {
  fromDetalleCobroDTOs,
  toDetalleCobroDTOs,
  sumaCobro,
  hasMontoValido,
} from './Deliveries/components/CobroSection';
import RendicionConfirmar, { type RendicionConfirmarPayload } from './RendicionConfirmar';

const fmt = (n?: number | null) =>
  n != null
    ? `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

const tieneContenido = (cobro: CobroData) => cobro.detalles.some((d) => d.monto.trim() !== '');

// ─── Estado de cobro por entrega (Paso 1) ──────────────────────────────────────

interface CobroEntregaState {
  entregaId: number;
  clienteNombre?: string;
  numeroDocumento?: string;
  montoEsperado?: number | null;
  cobro: CobroData;
  guardando: boolean;
  guardado: boolean;
  errorGuardar: string | null;
}

// ─── Dialog principal ─────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  viaje: Viaje | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RendicionDialog: React.FC<Props> = ({ open, viaje, onClose, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [step, setStep] = useState(0);

  // ── Paso 1: cobros por entrega ──
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [cobros, setCobros] = useState<CobroEntregaState[]>([]);

  // ── Paso 2: confirmación / imputación a cajas ──
  const [confirmPayload, setConfirmPayload] = useState<RendicionConfirmarPayload>({
    detalles: [], totalArs: 0, totalUsd: 0, valid: false, loading: true,
  });
  const [observaciones, setObservaciones] = useState('');

  // ── Submit ──
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [rendicionCreada, setRendicionCreada] = useState<RendicionViajeDTO | null>(null);

  // ── Reset al abrir ──
  useEffect(() => {
    if (!open || !viaje) return;
    setStep(0);
    setRendicionCreada(null);
    setErrorSubmit(null);
    setObservaciones('');
    setConfirmPayload({ detalles: [], totalArs: 0, totalUsd: 0, valid: false, loading: true });

    setLoadingResumen(true);
    viajeApi.getResumenCobros(viaje.id)
      .then((data) => {
        setCobros(
          (data.entregas ?? []).map((e: RendicionEntregaDTO) => ({
            entregaId: e.entregaId,
            clienteNombre: e.clienteNombre,
            numeroDocumento: e.numeroDocumento,
            montoEsperado: e.montoEsperado,
            // Precargar las formas de pago ya cargadas (por el conductor o antes).
            cobro: fromDetalleCobroDTOs(e.detallesCobro),
            guardando: false,
            guardado: (e.detallesCobro?.length ?? 0) > 0,
            errorGuardar: null,
          }))
        );
      })
      .catch(() => setErrorSubmit('No se pudo cargar el resumen de cobros'))
      .finally(() => setLoadingResumen(false));
  }, [open, viaje]);

  // ── Handlers paso 1 ──

  const updateCobro = (entregaId: number, cobro: CobroData) => {
    setCobros((prev) => prev.map((c) =>
      c.entregaId === entregaId ? { ...c, cobro, guardado: false, errorGuardar: null } : c
    ));
  };

  const guardarCobro = async (entregaId: number) => {
    const item = cobros.find((c) => c.entregaId === entregaId);
    if (!item || !hasMontoValido(item.cobro)) return;

    setCobros((prev) => prev.map((c) =>
      c.entregaId === entregaId ? { ...c, guardando: true, errorGuardar: null } : c
    ));
    try {
      await entregaViajeApi.registrarCobro(entregaId, {
        entregaId,
        detallesCobro: toDetalleCobroDTOs(item.cobro),
      });
      setCobros((prev) => prev.map((c) =>
        c.entregaId === entregaId ? { ...c, guardando: false, guardado: true } : c
      ));
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Error al guardar';
      setCobros((prev) => prev.map((c) =>
        c.entregaId === entregaId
          ? { ...c, guardando: false, errorGuardar: typeof msg === 'string' ? msg : JSON.stringify(msg) }
          : c
      ));
    }
  };

  const totalValidado = cobros
    .filter((c) => c.guardado)
    .reduce((sum, c) => sum + sumaCobro(c.cobro), 0);

  const hayAlgunCobro = cobros.some((c) => c.guardado);
  const todoGuardado = cobros.every((c) => c.guardado || !tieneContenido(c.cobro));

  // ── Submit (paso 2) ──

  const canSubmit = !submitting && confirmPayload.valid && confirmPayload.detalles.length > 0;

  const handleSubmit = async () => {
    if (!viaje || !canSubmit) return;
    setSubmitting(true);
    setErrorSubmit(null);
    try {
      const result = await viajeApi.rendir(viaje.id, {
        detalles: confirmPayload.detalles,
        observaciones: observaciones || undefined,
      });
      setRendicionCreada(result);
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Error al registrar la rendición';
      setErrorSubmit(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Contenido por paso ───────────────────────────────────────────────────────

  const contentPaso1 = (
    <Box>
      {errorSubmit && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorSubmit(null)}>{errorSubmit}</Alert>
      )}

      <Typography variant="body2" color="text.secondary" mb={2}>
        Registrá, por cada entrega, cómo cobró el conductor. Podés cargar varias formas de pago
        (efectivo, cheque, transferencia, dólares…) con "Agregar forma de pago". Cada entrega se guarda por separado.
      </Typography>

      {loadingResumen ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : cobros.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No hay entregas para rendir en este viaje.
        </Typography>
      ) : (
        <>
          {cobros.map((c, i) => {
            const isDirty = !c.guardado && tieneContenido(c.cobro);
            return (
              <Card
                key={c.entregaId}
                variant="outlined"
                sx={{ mb: 1.5, borderColor: c.guardado ? 'success.main' : c.errorGuardar ? 'error.main' : 'divider' }}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        #{i + 1} {c.clienteNombre ?? '—'}
                      </Typography>
                      {c.numeroDocumento && (
                        <Typography variant="caption" color="text.secondary">{c.numeroDocumento}</Typography>
                      )}
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" display="block">A cobrar</Typography>
                      <Typography variant="body2" fontWeight={600} color="success.dark">
                        {fmt(c.montoEsperado)}
                      </Typography>
                    </Box>
                  </Box>

                  <CobroSection
                    cobro={c.cobro}
                    setCobro={(d) => updateCobro(c.entregaId, d)}
                    montoEsperado={c.montoEsperado}
                  />

                  <Box display="flex" justifyContent="flex-end" mt={1.5}>
                    <Button
                      variant={c.guardado && !isDirty ? 'outlined' : 'contained'}
                      color={c.guardado && !isDirty ? 'success' : 'primary'}
                      size="small"
                      onClick={() => guardarCobro(c.entregaId)}
                      disabled={c.guardando || !hasMontoValido(c.cobro)}
                      startIcon={
                        c.guardando ? <CircularProgress size={14} color="inherit" />
                          : c.guardado && !isDirty ? <CheckIcon fontSize="small" />
                          : <SaveIcon fontSize="small" />
                      }
                    >
                      {c.guardando ? 'Guardando' : c.guardado && !isDirty ? 'Guardado' : 'Guardar'}
                    </Button>
                  </Box>

                  {c.errorGuardar && (
                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>{c.errorGuardar}</Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.main', mt: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Total cobrado (guardado)</Typography>
                <Typography variant="h6" fontWeight={700} color="success.dark">{fmt(totalValidado)}</Typography>
              </Box>
              {!todoGuardado && (
                <Typography variant="caption" color="warning.main">
                  Hay entregas con cobro sin guardar — guardalas antes de continuar.
                </Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );

  const contentPaso2 = (
    <Box>
      {errorSubmit && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorSubmit(null)}>{errorSubmit}</Alert>
      )}

      {viaje && (
        <RendicionConfirmar viajeId={viaje.id} onChange={setConfirmPayload} />
      )}

      <Divider sx={{ my: 2 }} />

      <TextField
        label="Observaciones (opcional)"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        fullWidth
        size="small"
        multiline
        rows={2}
      />
    </Box>
  );

  const contentExito = (
    <Box textAlign="center" py={2}>
      <CheckIcon sx={{ fontSize: 56, color: 'success.main' }} />
      <Typography variant="h6" fontWeight={700} mt={1}>Rendición registrada</Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        La imputación a cajas se registró correctamente.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" mt={2} flexWrap="wrap">
        <Box>
          <Typography variant="caption" color="text.secondary">Recibido $</Typography>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {fmt(rendicionCreada?.totalRecibido)}
          </Typography>
        </Box>
        {(rendicionCreada?.totalDolaresRecibido ?? 0) > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">Recibido U$D</Typography>
            <Typography variant="h6" fontWeight={700} color="success.dark">
              U$D {rendicionCreada?.totalDolaresRecibido?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );

  // ─── Footer ───────────────────────────────────────────────────────────────────

  const actions = rendicionCreada ? (
    <Button variant="contained" fullWidth onClick={onClose}>Cerrar</Button>
  ) : step === 0 ? (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%">
      <Button variant="outlined" onClick={onClose} fullWidth>Cancelar</Button>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setStep(1)}
        disabled={loadingResumen || (!hayAlgunCobro && cobros.length > 0)}
        endIcon={<NextIcon />}
        fullWidth
      >
        Continuar a cajas
      </Button>
    </Stack>
  ) : (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%">
      <Button variant="outlined" onClick={() => setStep(0)} startIcon={<BackIcon />} fullWidth>
        Volver a cobros
      </Button>
      <Button
        variant="contained"
        color="success"
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

  const stepperLabels = ['Cobros por entrega', 'Imputar a cajas'];

  const dialogContent = (
    <Box>
      {!rendicionCreada && (
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {stepperLabels.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      )}
      {rendicionCreada ? contentExito : step === 0 ? contentPaso1 : contentPaso2}
    </Box>
  );

  // ─── Mobile ─────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '95vh' } }}
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
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>{dialogContent}</Box>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0 }}>
          {actions}
        </Box>
      </SwipeableDrawer>
    );
  }

  // ─── Desktop ────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={rendicionCreada ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{title}</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>{dialogContent}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>
    </Dialog>
  );
};

export default RendicionDialog;
