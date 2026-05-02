import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Alert,
  Button, TextField, MenuItem, FormControl, InputLabel, Select,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Divider, Skeleton, Chip, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, Accordion,
  AccordionSummary, AccordionDetails, FormHelperText,
} from '@mui/material';
import { ArrowBack, ExpandMore, Autorenew } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { prestamoPersonalApi } from '../../api/services/prestamoPersonalApi';
import { refinanciacionApi } from '../../api/services/refinanciacionApi';
import {
  TIPO_FINANCIACION_LABELS, ESTADO_CUOTA_LABELS, ESTADO_CUOTA_COLORS,
} from '../../types/prestamo.types';
import type { PrestamoPersonalDTO, TipoFinanciacion } from '../../types/prestamo.types';
import type {
  RefinanciacionRequest, RefinanciacionPreviewResponse,
  CuotaARefinanciarDTO,
} from '../../types/refinanciacion.types';
import { TipoIncremento, TIPO_INCREMENTO_LABELS } from '../../types/refinanciacion.types';
import { useDebounce } from '../../hooks/useDebounce';
import LoadingOverlay from '../common/LoadingOverlay';

// ==================== HELPERS ====================

function primerDiaMesSiguiente(): string {
  return dayjs().add(1, 'month').startOf('month').format('YYYY-MM-DD');
}

function hoy(): string {
  return dayjs().format('YYYY-MM-DD');
}

function fmt(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function extraerMensajeError(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } } };
  return err?.response?.data?.message ?? 'Error al procesar la solicitud';
}

interface FormState {
  entregaInicial: number;
  tipoIncremento: TipoIncremento | '';
  valorIncremento: number;
  cantidadCuotas: number;
  fechaPrimeraCuota: string;
  tipoFinanciacion: TipoFinanciacion | '';
  observaciones: string;
}

function validarFormulario(form: FormState, deudaTotal: number): Record<string, string> {
  const errs: Record<string, string> = {};
  if (form.entregaInicial < 0) errs.entregaInicial = 'No puede ser negativa';
  if (form.entregaInicial >= deudaTotal && deudaTotal > 0)
    errs.entregaInicial = 'La entrega cubre o supera la deuda total';
  if (!form.tipoIncremento) errs.tipoIncremento = 'Requerido';
  if (form.valorIncremento < 0) errs.valorIncremento = 'No puede ser negativo';
  if (form.tipoIncremento === 'PORCENTAJE' && form.valorIncremento > 999)
    errs.valorIncremento = 'Máx 999%';
  if (!form.cantidadCuotas || form.cantidadCuotas < 1) errs.cantidadCuotas = 'Mínimo 1 cuota';
  if (form.cantidadCuotas > 120) errs.cantidadCuotas = 'Máximo 120 cuotas';
  if (form.fechaPrimeraCuota && form.fechaPrimeraCuota < hoy())
    errs.fechaPrimeraCuota = 'No puede ser en el pasado';
  return errs;
}

function buildRequest(form: FormState, prestamoId: number): RefinanciacionRequest {
  const req: RefinanciacionRequest = {
    prestamoId,
    entregaInicial: form.entregaInicial || 0,
    tipoIncremento: form.tipoIncremento as TipoIncremento,
    valorIncremento: form.valorIncremento,
    cantidadCuotas: form.cantidadCuotas,
  };
  if (form.fechaPrimeraCuota) req.fechaPrimeraCuota = form.fechaPrimeraCuota;
  if (form.tipoFinanciacion) req.tipoFinanciacion = form.tipoFinanciacion as TipoFinanciacion;
  if (form.observaciones.trim()) req.observaciones = form.observaciones.trim();
  return req;
}

const ESTADOS_REFINANCIABLES = ['ACTIVO', 'EN_MORA', 'EN_LEGAL'];

// ==================== CUOTA ROW COLOR ====================

function getCuotaRowSx(estado: CuotaARefinanciarDTO['estado']) {
  if (estado === 'VENCIDA') return { bgcolor: 'error.50', '&:hover': { bgcolor: 'error.100' } };
  if (estado === 'PARCIAL') return { bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } };
  return {};
}

// ==================== COMPONENT ====================

export const RefinanciacionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prestamoId = parseInt(id || '0');

  // Prestamo
  const [prestamo, setPrestamo] = useState<PrestamoPersonalDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState<FormState>({
    entregaInicial: 0,
    tipoIncremento: '',
    valorIncremento: 0,
    cantidadCuotas: 12,
    fechaPrimeraCuota: primerDiaMesSiguiente(),
    tipoFinanciacion: '',
    observaciones: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Preview
  const [preview, setPreview] = useState<RefinanciacionPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // ── Load prestamo ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!prestamoId) return;
    setLoading(true);
    prestamoPersonalApi.getById(prestamoId)
      .then((p) => {
        setPrestamo(p);
        // Pre-populate tipoFinanciacion from the loan
        setForm(prev => ({ ...prev, tipoFinanciacion: p.tipoFinanciacion ?? '' }));
      })
      .catch(() => setLoadError('No se pudo cargar el crédito personal'))
      .finally(() => setLoading(false));
  }, [prestamoId]);

  // ── Debounced preview ──────────────────────────────────────────────────────
  const debouncedForm = useDebounce(form, 400);

  useEffect(() => {
    if (!prestamo) return;
    // Sin deuda posible — no llamar al backend
    if (prestamo.cuotasPendientes === 0 && prestamo.saldoPendiente <= 0) return;
    if (!debouncedForm.tipoIncremento || debouncedForm.cantidadCuotas < 1) return;
    const deudaTotal = preview?.deudaTotal ?? prestamo.saldoPendiente;
    const formErrors = validarFormulario(debouncedForm, deudaTotal);
    if (Object.keys(formErrors).length > 0) return;

    setPreviewLoading(true);
    setPreviewError(null);
    refinanciacionApi.preview(buildRequest(debouncedForm, prestamo.id))
      .then(setPreview)
      .catch((e) => setPreviewError(extraerMensajeError(e)))
      .finally(() => setPreviewLoading(false));
  }, [debouncedForm, prestamo]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleFieldChange = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const handleConfirmar = async () => {
    if (!prestamo || !preview) return;
    const formErrors = validarFormulario(form, preview.deudaTotal);
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }

    setSubmitting(true);
    try {
      const result = await refinanciacionApi.confirmar(buildRequest(form, prestamo.id));
      setSnackbar({ open: true, message: 'Crédito personal refinanciado exitosamente', severity: 'success' });
      setConfirmOpen(false);
      navigate(`/prestamos/${result.nuevoPrestamo.id}`);
    } catch (e) {
      setSnackbar({ open: true, message: extraerMensajeError(e), severity: 'error' });
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!preview) return;
    const deudaTotal = preview.deudaTotal;
    const formErrors = validarFormulario(form, deudaTotal);
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }
    setConfirmOpen(true);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const estaRefinanciable = prestamo ? ESTADOS_REFINANCIABLES.includes(prestamo.estado) : false;
  const sinDeuda = prestamo ? (prestamo.cuotasPendientes === 0 && prestamo.saldoPendiente <= 0) : false;
  const esMigrada = prestamo ? (prestamo.cuotasPendientes === 0 && prestamo.saldoPendiente > 0) : false;
  const deudaDisplay = preview?.deudaTotal ?? prestamo?.saldoPendiente ?? 0;

  const tipoIncrementoLabel = form.tipoIncremento === 'PORCENTAJE'
    ? `(+) Recargo (${form.valorIncremento}%)`
    : '(+) Recargo fijo';

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loadError || !prestamo) {
    return (
      <Box>
        <LoadingOverlay open={loading} message="Cargando crédito personal..." />
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/prestamos/lista')} sx={{ mb: 2 }}>
          Volver
        </Button>
        <Alert severity="error">{loadError ?? 'Crédito personal no encontrado'}</Alert>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ pb: 8 }}>
      <LoadingOverlay open={loading} message="Cargando crédito personal..." />
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/prestamos/${prestamoId}`)}>
          Volver
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Autorenew color="warning" />
          <Typography variant="h5">
            Refinanciar Crédito Personal #{prestamoId} — {prestamo.clienteNombre}
          </Typography>
        </Box>
      </Box>

      {/* Banner si el préstamo no es refinanciable */}
      {!estaRefinanciable && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Este crédito personal no puede refinanciarse (estado: {prestamo.estado}). Solo se pueden
          refinanciar créditos personales en estado Activo, En Mora o En Legal.
        </Alert>
      )}

      {/* Banner sin deuda posible */}
      {estaRefinanciable && sinDeuda && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Este crédito personal no tiene deuda pendiente para refinanciar.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Panel izquierdo: formulario ── */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Parámetros de refinanciación</Typography>

              {/* Deuda actual readonly */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Deuda actual (saldo pendiente)</Typography>
                <Typography variant="h5" color="error.main" fontWeight={700}>
                  ${fmt(deudaDisplay)}
                </Typography>
                {esMigrada ? (
                  <Chip label="Deuda migrada" size="small" color="warning" sx={{ mt: 0.5 }} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {prestamo.cuotasPendientes} cuota{prestamo.cuotasPendientes !== 1 ? 's' : ''} pendiente{prestamo.cuotasPendientes !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Paper>

              {/* Entrega inicial */}
              <TextField
                label="Entrega inicial"
                type="number"
                fullWidth
                value={form.entregaInicial}
                onChange={(e) => handleFieldChange('entregaInicial', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 100 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                error={!!errors.entregaInicial}
                helperText={errors.entregaInicial ?? '0 = sin entrega inicial'}
                disabled={!estaRefinanciable || sinDeuda}
              />

              {/* Tipo de incremento */}
              <FormControl fullWidth error={!!errors.tipoIncremento} disabled={!estaRefinanciable || sinDeuda}>
                <InputLabel>Tipo de incremento *</InputLabel>
                <Select
                  value={form.tipoIncremento}
                  onChange={(e) => handleFieldChange('tipoIncremento', e.target.value as TipoIncremento)}
                  label="Tipo de incremento *"
                >
                  {Object.values(TipoIncremento).map((t) => (
                    <MenuItem key={t} value={t}>{TIPO_INCREMENTO_LABELS[t]}</MenuItem>
                  ))}
                </Select>
                {errors.tipoIncremento && <FormHelperText>{errors.tipoIncremento}</FormHelperText>}
              </FormControl>

              {/* Valor del incremento */}
              <TextField
                label="Valor del incremento *"
                type="number"
                fullWidth
                value={form.valorIncremento}
                onChange={(e) => handleFieldChange('valorIncremento', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: form.tipoIncremento === 'PORCENTAJE' ? 0.5 : 100 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {form.tipoIncremento === 'MONTO_FIJO' ? '$' : '%'}
                    </InputAdornment>
                  ),
                }}
                error={!!errors.valorIncremento}
                helperText={errors.valorIncremento ?? (form.tipoIncremento === 'MONTO_FIJO' ? 'Monto fijo de recargo' : 'Porcentaje sobre el saldo base')}
                disabled={!estaRefinanciable || sinDeuda}
              />

              {/* Cantidad de cuotas */}
              <TextField
                label="Cantidad de cuotas *"
                type="number"
                fullWidth
                value={form.cantidadCuotas}
                onChange={(e) => handleFieldChange('cantidadCuotas', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 120 }}
                error={!!errors.cantidadCuotas}
                helperText={errors.cantidadCuotas}
                disabled={!estaRefinanciable || sinDeuda}
              />

              {/* Fecha primera cuota */}
              <TextField
                label="Fecha primera cuota"
                type="date"
                fullWidth
                value={form.fechaPrimeraCuota}
                onChange={(e) => handleFieldChange('fechaPrimeraCuota', e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: hoy() }}
                error={!!errors.fechaPrimeraCuota}
                helperText={errors.fechaPrimeraCuota}
                disabled={!estaRefinanciable || sinDeuda}
              />

              {/* Tipo de financiación */}
              <FormControl fullWidth disabled={!estaRefinanciable || sinDeuda}>
                <InputLabel>Tipo de financiación</InputLabel>
                <Select
                  value={form.tipoFinanciacion}
                  onChange={(e) => handleFieldChange('tipoFinanciacion', e.target.value as TipoFinanciacion)}
                  label="Tipo de financiación"
                >
                  {Object.entries(TIPO_FINANCIACION_LABELS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Observaciones colapsable */}
              <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" color="text.secondary">Observaciones (opcional)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Motivo de la refinanciación, acuerdos, etc."
                    value={form.observaciones}
                    onChange={(e) => handleFieldChange('observaciones', e.target.value)}
                    inputProps={{ maxLength: 500 }}
                    helperText={`${form.observaciones.length}/500`}
                    disabled={!estaRefinanciable || sinDeuda}
                  />
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Panel derecho: proyección + tabla ── */}
        <Grid item xs={12} md={7}>
          {/* Resumen */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Resumen de refinanciación
              </Typography>

              {previewLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[...Array(6)].map((_, i) => <Skeleton key={i} height={24} />)}
                </Box>
              )}

              {previewError && !previewLoading && (
                <Alert severity="warning" sx={{ mt: 1 }}>{previewError}</Alert>
              )}

              {!preview && !previewLoading && !previewError && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Completá los campos requeridos para ver la proyección
                </Typography>
              )}

              {preview && !previewLoading && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Deuda total</Typography>
                  <Typography variant="body2" fontWeight={600} textAlign="right">${fmt(preview.deudaTotal)}</Typography>

                  <Typography variant="body2" color="text.secondary">(-) Entrega inicial</Typography>
                  <Typography variant="body2" textAlign="right">${fmt(preview.entregaInicial)}</Typography>

                  <Typography variant="body2" color="text.secondary">(=) Saldo base</Typography>
                  <Typography variant="body2" textAlign="right">${fmt(preview.saldoBase)}</Typography>

                  <Typography variant="body2" color="text.secondary">{tipoIncrementoLabel}</Typography>
                  <Typography variant="body2" color="warning.main" textAlign="right">${fmt(preview.interesGenerado)}</Typography>

                  <Box sx={{ gridColumn: '1 / -1' }}><Divider /></Box>

                  <Typography variant="body2" fontWeight={700}>(=) Monto financiado</Typography>
                  <Typography variant="body2" fontWeight={700} textAlign="right">${fmt(preview.montoFinalFinanciado)}</Typography>

                  <Typography variant="body2" color="text.secondary">Cuotas nuevas</Typography>
                  <Typography variant="body2" textAlign="right">{preview.cantidadCuotas}</Typography>

                  <Typography variant="body2" fontWeight={700} color="primary.main">Valor de cuota</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main" textAlign="right">
                    ${fmt(preview.valorCuotaEstimado)}
                  </Typography>

                  {form.fechaPrimeraCuota && (
                    <>
                      <Typography variant="body2" color="text.secondary">Primera cuota</Typography>
                      <Typography variant="body2" textAlign="right">
                        {dayjs(form.fechaPrimeraCuota).format('DD/MM/YYYY')}
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Banner deuda migrada */}
          {preview?.deudaMigrada && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Este crédito personal no tiene cuotas registradas. La deuda de <strong>${fmt(preview.deudaTotal)}</strong> fue
              tomada del saldo pendiente del crédito personal. Podés refinanciarla normalmente.
            </Alert>
          )}

          {/* Tabla de cuotas a refinanciar */}
          {preview && !preview.deudaMigrada && preview.cuotasARefinanciar.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="subtitle2" mb={1}>
                  Cuotas a refinanciar ({preview.totalCuotasARefinanciar})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Vencimiento</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell align="right">Pagado</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Mora</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.cuotasARefinanciar.map((c) => (
                        <TableRow key={c.id} sx={getCuotaRowSx(c.estado)}>
                          <TableCell>{c.numeroCuota}</TableCell>
                          <TableCell>{dayjs(c.fechaVencimiento).format('DD/MM/YYYY')}</TableCell>
                          <TableCell align="right">${fmt(c.montoCuota)}</TableCell>
                          <TableCell align="right">${fmt(c.montoPagado)}</TableCell>
                          <TableCell align="right">${fmt(c.saldoPendiente)}</TableCell>
                          <TableCell>
                            <Chip
                              label={ESTADO_CUOTA_LABELS[c.estado] ?? c.estado}
                              size="small"
                              sx={{
                                bgcolor: ESTADO_CUOTA_COLORS[c.estado] ?? '#9E9E9E',
                                color: 'white',
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {c.diasMora > 0 ? (
                              <Typography variant="caption" color="error.main">{c.diasMora}d</Typography>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Bottom action bar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="warning"
          size="large"
          startIcon={<Autorenew />}
          disabled={previewLoading || !preview || !estaRefinanciable || sinDeuda}
          onClick={handleOpenConfirm}
        >
          Confirmar refinanciación por ${fmt(preview?.montoFinalFinanciado ?? 0)}
        </Button>
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Autorenew color="warning" />
          ¿Confirmar refinanciación?
        </DialogTitle>
        <DialogContent>
          {preview && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Alert severity="warning" sx={{ mb: 1 }}>
                Esta acción cerrará las cuotas pendientes del crédito personal original y creará un nuevo crédito personal.
              </Alert>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px 16px' }}>
                  <Typography variant="body2" color="text.secondary">Deuda original</Typography>
                  <Typography variant="body2" textAlign="right">${fmt(preview.deudaTotal)}</Typography>
                  <Typography variant="body2" color="text.secondary">Entrega inicial</Typography>
                  <Typography variant="body2" textAlign="right">${fmt(preview.entregaInicial)}</Typography>
                  <Typography variant="body2" color="text.secondary">Monto a financiar</Typography>
                  <Typography variant="body2" fontWeight={700} textAlign="right">${fmt(preview.montoFinalFinanciado)}</Typography>
                  <Typography variant="body2" color="text.secondary">Cuotas nuevas</Typography>
                  <Typography variant="body2" textAlign="right">{preview.cantidadCuotas} x ${fmt(preview.valorCuotaEstimado)}</Typography>
                  {form.tipoFinanciacion && (
                    <>
                      <Typography variant="body2" color="text.secondary">Tipo</Typography>
                      <Typography variant="body2" textAlign="right">
                        {TIPO_FINANCIACION_LABELS[form.tipoFinanciacion as keyof typeof TIPO_FINANCIACION_LABELS] ?? form.tipoFinanciacion}
                      </Typography>
                    </>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleConfirmar}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Autorenew />}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
