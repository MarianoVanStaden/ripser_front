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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmber as WarningIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import type { Viaje } from '../../types';
import type { RendicionViajeDTO, RendicionEntregaDTO, EstadoCobro } from '../../types/logistica.types';
import type { MetodoPago } from '../../types/venta.types';
import { METODO_PAGO_LABELS } from '../../types/venta.types';
import { viajeApi } from '../../api/services/viajeApi';
import { entregaViajeApi } from '../../api/services/entregaViajeApi';
import RendicionLineas, { type RendicionLineasPayload } from './RendicionLineas';

// ─── Constantes ───────────────────────────────────────────────────────────────

const METODOS_COBRO: MetodoPago[] = ['EFECTIVO', 'TRANSFERENCIA_BANCARIA', 'CHEQUE', 'TARJETA_DEBITO', 'TARJETA_CREDITO'];

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

const fmt = (n?: number | null) =>
  n != null
    ? `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

// ─── Tipos locales ────────────────────────────────────────────────────────────

/** Cobro por entrega con campos editables por el admin */
interface CobroEditable extends RendicionEntregaDTO {
  montoCobradoAdmin: string;          // input controlado (string para el TextField)
  metodoPagoAdmin: MetodoPago;
  guardando: boolean;
  guardado: boolean;
  errorGuardar: string | null;
}

// ─── Sub-componente: fila de entrega editable ─────────────────────────────────

interface FilaCobroProps {
  cobro: CobroEditable;
  idx: number;
  onChange: (id: number, field: 'montoCobradoAdmin' | 'metodoPagoAdmin', value: string) => void;
  onGuardar: (id: number) => void;
}

const FilaCobro: React.FC<FilaCobroProps> = ({ cobro, idx, onChange, onGuardar }) => {
  const montoNum = parseFloat(cobro.montoCobradoAdmin.replace(',', '.')) || 0;
  const esperado = cobro.montoEsperado ?? 0;
  const diff = montoNum - esperado;
  const isDirty = cobro.montoCobradoAdmin !== String(cobro.montoCobrado ?? '');

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderColor: cobro.guardado ? 'success.main' : cobro.errorGuardar ? 'error.main' : 'divider',
      }}
    >
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Encabezado */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              #{idx + 1} {cobro.clienteNombre ?? '—'}
            </Typography>
            {cobro.numeroDocumento && (
              <Typography variant="caption" color="text.secondary">
                {cobro.numeroDocumento}
              </Typography>
            )}
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary" display="block">
              A cobrar
            </Typography>
            <Typography variant="body2" fontWeight={600} color="success.dark">
              {fmt(esperado)}
            </Typography>
          </Box>
        </Box>

        {/* Campos editables */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
          <TextField
            label="Cobrado"
            type="number"
            size="small"
            value={cobro.montoCobradoAdmin}
            onChange={(e) => onChange(cobro.entregaId, 'montoCobradoAdmin', e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText={
              cobro.montoCobradoAdmin && Math.abs(diff) > 0.01
                ? diff > 0
                  ? `Excedente: ${fmt(diff)}`
                  : `Faltante: ${fmt(Math.abs(diff))}`
                : cobro.montoCobradoAdmin
                ? 'OK ✓'
                : 'Sin cobro registrado'
            }
            FormHelperTextProps={{
              sx: {
                color: !cobro.montoCobradoAdmin
                  ? 'text.secondary'
                  : Math.abs(diff) > 0.01
                  ? 'warning.main'
                  : 'success.main',
              },
            }}
          />

          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Método</InputLabel>
            <Select
              value={cobro.metodoPagoAdmin}
              label="Método"
              onChange={(e) => onChange(cobro.entregaId, 'metodoPagoAdmin', e.target.value)}
            >
              {METODOS_COBRO.map((m) => (
                <MenuItem key={m} value={m}>{METODO_PAGO_LABELS[m] ?? m}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant={cobro.guardado && !isDirty ? 'outlined' : 'contained'}
            color={cobro.guardado && !isDirty ? 'success' : 'primary'}
            size="small"
            onClick={() => onGuardar(cobro.entregaId)}
            disabled={cobro.guardando || !cobro.montoCobradoAdmin}
            startIcon={
              cobro.guardando
                ? <CircularProgress size={14} color="inherit" />
                : cobro.guardado && !isDirty
                ? <CheckIcon fontSize="small" />
                : <SaveIcon fontSize="small" />
            }
            sx={{ minWidth: 90, alignSelf: { xs: 'flex-end', sm: 'flex-start' }, mt: { xs: 0, sm: '4px' } }}
          >
            {cobro.guardando ? 'Guardando' : cobro.guardado && !isDirty ? 'Guardado' : 'Guardar'}
          </Button>
        </Stack>

        {cobro.errorGuardar && (
          <Alert severity="error" sx={{ mt: 1, py: 0 }}>{cobro.errorGuardar}</Alert>
        )}
      </CardContent>
    </Card>
  );
};

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

  // ── Paso activo: 0 = revisar cobros, 1 = confirmar rendición ──
  const [step, setStep] = useState(0);

  // ── Paso 1: cobros declarados por conductor ──
  const [, setResumen] = useState<RendicionViajeDTO | null>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [cobros, setCobros] = useState<CobroEditable[]>([]);

  // ── Paso 2: rendición multi-forma ──
  const [lineasPayload, setLineasPayload] = useState<RendicionLineasPayload>({
    detalles: [], totalArs: 0, totalUsd: 0, valid: false,
  });
  const [observaciones, setObservaciones] = useState('');
  const [totalDolaresDeclarado, setTotalDolaresDeclarado] = useState(0);

  // ── Submit ──
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState<string | null>(null);
  const [rendicionCreada, setRendicionCreada] = useState<RendicionViajeDTO | null>(null);

  // ── Reset al abrir ──
  useEffect(() => {
    if (!open || !viaje) return;
    setStep(0);
    setResumen(null);
    setRendicionCreada(null);
    setErrorSubmit(null);
    setObservaciones('');
    setLineasPayload({ detalles: [], totalArs: 0, totalUsd: 0, valid: false });
    setTotalDolaresDeclarado(0);

    setLoadingResumen(true);
    viajeApi.getResumenCobros(viaje.id)
      .then((data) => {
        setResumen(data);
        setTotalDolaresDeclarado(data.totalDolaresDeclarado ?? 0);
        // Inicializar cobros editables con los valores declarados por el conductor
        setCobros(
          data.entregas.map((e) => ({
            ...e,
            montoCobradoAdmin: e.montoCobrado != null ? String(e.montoCobrado) : '',
            metodoPagoAdmin: (e.metodoPagoEntrega as MetodoPago) ?? 'EFECTIVO',
            guardando: false,
            guardado: e.montoCobrado != null,
            errorGuardar: null,
          }))
        );
      })
      .catch(() => setErrorSubmit('No se pudo cargar el resumen de cobros'))
      .finally(() => setLoadingResumen(false));
  }, [open, viaje]);

  // ── Handlers paso 1 ──

  const handleCambioCobro = (id: number, field: 'montoCobradoAdmin' | 'metodoPagoAdmin', value: string) => {
    setCobros(prev => prev.map(c =>
      c.entregaId === id ? { ...c, [field]: value, guardado: false, errorGuardar: null } : c
    ));
  };

  const handleGuardarCobro = async (entregaId: number) => {
    const cobro = cobros.find(c => c.entregaId === entregaId);
    if (!cobro) return;

    const monto = parseFloat(cobro.montoCobradoAdmin.replace(',', '.'));
    if (isNaN(monto) || monto < 0) return;

    setCobros(prev => prev.map(c =>
      c.entregaId === entregaId ? { ...c, guardando: true, errorGuardar: null } : c
    ));

    try {
      await entregaViajeApi.registrarCobro(entregaId, {
        entregaId,
        detallesCobro: [{ metodoPago: cobro.metodoPagoAdmin, monto }],
      });
      setCobros(prev => prev.map(c =>
        c.entregaId === entregaId
          ? { ...c, guardando: false, guardado: true, montoCobrado: monto }
          : c
      ));
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? 'Error al guardar';
      setCobros(prev => prev.map(c =>
        c.entregaId === entregaId
          ? { ...c, guardando: false, errorGuardar: typeof msg === 'string' ? msg : JSON.stringify(msg) }
          : c
      ));
    }
  };

  const totalValidado = cobros
    .filter(c => c.guardado && c.montoCobrado != null)
    .reduce((sum, c) => sum + (c.montoCobrado ?? 0), 0);

  const todoGuardado = cobros.every(c => c.guardado || !c.montoCobradoAdmin);
  const hayAlgunCobro = cobros.some(c => c.guardado);

  // ── Handlers paso 2 ──

  const totalRecibidoNum = lineasPayload.totalArs;
  const diferencia = totalRecibidoNum - totalValidado;
  const hayDiferencia = Math.abs(diferencia) > 0.01;

  const totalRecibidoDolaresNum = lineasPayload.totalUsd;
  const hayDolares = totalDolaresDeclarado > 0 || totalRecibidoDolaresNum > 0;
  const difDolares = totalRecibidoDolaresNum - totalDolaresDeclarado;

  const canSubmit =
    !submitting &&
    lineasPayload.valid &&
    lineasPayload.detalles.length > 0;

  const handleSubmit = async () => {
    if (!viaje || !canSubmit) return;
    setSubmitting(true);
    setErrorSubmit(null);
    try {
      const result = await viajeApi.rendir(viaje.id, {
        detalles: lineasPayload.detalles,
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

  // ─── Renderizado del contenido según paso ────────────────────────────────────

  const contentPaso1 = (
    <Box>
      {errorSubmit && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorSubmit(null)}>
          {errorSubmit}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" mb={2}>
        Revisá los montos cobrados por el conductor. Corregí cualquier diferencia antes de continuar.
        Cada cambio se guarda individualmente.
      </Typography>

      {loadingResumen ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : cobros.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
          No hay cobros registrados para este viaje.
        </Typography>
      ) : (
        <>
          {cobros.map((cobro, i) => (
            <FilaCobro
              key={cobro.entregaId}
              cobro={cobro}
              idx={i}
              onChange={handleCambioCobro}
              onGuardar={handleGuardarCobro}
            />
          ))}

          {/* Resumen total validado */}
          <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.main', mt: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Total validado</Typography>
                <Typography variant="h6" fontWeight={700} color="success.dark">
                  {fmt(totalValidado)}
                </Typography>
              </Box>
              {!todoGuardado && (
                <Typography variant="caption" color="warning.main">
                  Hay cobros sin guardar — guardá todos antes de continuar.
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorSubmit(null)}>
          {errorSubmit}
        </Alert>
      )}

      {/* Resumen validado */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <WalletIcon color="primary" fontSize="small" />
            <Typography variant="subtitle2">Cobros validados por entrega</Typography>
          </Box>
          {cobros.filter(c => c.guardado).map((c, i) => (
            <Box
              key={c.entregaId}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              py={0.75}
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  #{i + 1} {c.clienteNombre ?? '—'}
                </Typography>
                {c.numeroDocumento && (
                  <Typography variant="caption" color="text.secondary">{c.numeroDocumento}</Typography>
                )}
              </Box>
              <Box textAlign="right">
                <Typography variant="body2" fontWeight={600}>
                  {fmt(c.montoCobrado)}
                </Typography>
                {c.estadoCobro && (
                  <Chip
                    label={COBRO_LABEL[c.estadoCobro]}
                    color={COBRO_COLOR[c.estadoCobro]}
                    size="small"
                    sx={{ mt: 0.25, height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            </Box>
          ))}
          <Box display="flex" justifyContent="space-between" mt={1.5}>
            <Typography variant="subtitle2">Total declarado</Typography>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              {fmt(totalValidado)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" mb={1.5} display="flex" alignItems="center" gap={0.5}>
        <ReceiptIcon fontSize="small" /> Lo que recibió administración
      </Typography>

      <Stack spacing={2}>
        {/* Líneas multi-forma: cada una a su caja (efectivo, dólares, cheque, transferencia…) */}
        <RendicionLineas onChange={setLineasPayload} />

        {/* Totales calculados a partir de las líneas */}
        <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Total recibido (ARS)</Typography>
              <Typography variant="h6" fontWeight={700}>{fmt(totalRecibidoNum)}</Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ color: hayDiferencia ? 'warning.main' : 'success.main' }}
            >
              {hayDiferencia
                ? diferencia > 0
                  ? `Excedente vs. declarado: ${fmt(diferencia)}`
                  : `Faltante vs. declarado: ${fmt(Math.abs(diferencia))}`
                : 'Coincide con el total declarado ✓'}
            </Typography>

            {hayDolares && (
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'success.dark' }}>
                    Total recibido (USD)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Declarado: U$D {totalDolaresDeclarado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    {Math.abs(difDolares) > 0.01 &&
                      ` · Diferencia: U$D ${Math.abs(difDolares).toFixed(2)}`}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="success.dark">
                  U$D {totalRecibidoDolaresNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <TextField
          label="Observaciones (opcional)"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          fullWidth
          size="small"
          multiline
          rows={2}
        />

        {hayDiferencia && (
          <Alert severity="warning" icon={<WarningIcon fontSize="small" />}>
            Hay una diferencia de <strong>{fmt(Math.abs(diferencia))}</strong>{' '}
            {diferencia > 0 ? '(conductor trajo de más)' : '(conductor trajo de menos)'}.
            La rendición quedará marcada como <strong>CON DIFERENCIA</strong>.
          </Alert>
        )}
      </Stack>
    </Box>
  );

  const contentExito = (
    <Box textAlign="center" py={2}>
      <CheckIcon sx={{ fontSize: 56, color: 'success.main' }} />
      <Typography variant="h6" fontWeight={700} mt={1}>
        Rendición registrada
      </Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>
        {rendicionCreada?.estadoRendicion === 'CONFIRMADA'
          ? 'El monto coincide exactamente con lo declarado.'
          : `Diferencia de ${fmt(rendicionCreada?.diferencia)}. Verificar con el conductor.`}
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" mt={2} flexWrap="wrap">
        <Box>
          <Typography variant="caption" color="text.secondary">Validado $</Typography>
          <Typography variant="h6" fontWeight={700}>{fmt(rendicionCreada?.totalDeclarado)}</Typography>
        </Box>
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

  // ─── Acciones del footer ──────────────────────────────────────────────────────

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
        Continuar a rendición
      </Button>
    </Stack>
  ) : (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width="100%">
      <Button variant="outlined" onClick={() => setStep(0)} startIcon={<BackIcon />} fullWidth>
        Volver a revisar
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

  const stepperLabels = ['Revisar cobros', 'Confirmar rendición'];

  const dialogContent = (
    <Box>
      {!rendicionCreada && (
        <Stepper activeStep={step} sx={{ mb: 3 }}>
          {stepperLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      {rendicionCreada ? contentExito : step === 0 ? contentPaso1 : contentPaso2}
    </Box>
  );

  // ─── Mobile: SwipeableDrawer ──────────────────────────────────────────────────
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
        <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>{dialogContent}</Box>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', bottom: 0 }}>
          {actions}
        </Box>
      </SwipeableDrawer>
    );
  }

  // ─── Desktop: Dialog ──────────────────────────────────────────────────────────
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
