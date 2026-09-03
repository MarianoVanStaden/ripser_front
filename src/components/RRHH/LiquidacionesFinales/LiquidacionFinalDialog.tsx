// Alta y detalle de una liquidación final. En BORRADOR la cabecera y los ítems
// son editables; CONFIRMADA/PAGADA son inmutables (se anulan, no se editan).
// Confirmar da de baja al empleado (INACTIVO + fechaEgreso) en la misma
// transacción del backend.

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Autocomplete, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, MenuItem, Stack, TextField, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Block as BlockIcon,
  PictureAsPdf as PdfIcon,
  PlaylistAdd as PlaylistAddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {
  liquidacionFinalApi,
  MOTIVOS_EGRESO,
  type ConceptoLiquidacion,
  type LiquidacionFinal,
  type LiquidacionFinalItemRequest,
  type MotivoEgreso,
} from '../../../api/services/liquidacionFinalApi';
import { employeeApi } from '../../../api/services/employeeApi';
import ItemsLiquidacionTable, { type ItemDraft } from './ItemsLiquidacionTable';
import PagoLiquidacionDialog from './PagoLiquidacionDialog';
import { generarLiquidacionFinalPDF } from '../../../services/pdfService';

interface Props {
  open: boolean;
  /** null = crear nueva */
  liquidacionId: number | null;
  onClose: () => void;
}

const ESTADO_COLOR: Record<string, 'default' | 'info' | 'success' | 'error' | 'warning'> = {
  BORRADOR: 'info',
  CONFIRMADA: 'warning',
  PAGADA: 'success',
  ANULADA: 'error',
};

const fmt = (n: number | undefined | null) =>
  `$${Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

// Conceptos que corresponden en (casi) todo egreso: proporcionales del mes,
// SAC y vacaciones no gozadas (arts. 123 y 156 LCT).
const CODIGOS_SIEMPRE = ['DIAS_TRABAJADOS', 'SAC_PROPORCIONAL', 'VACACIONES_PROP', 'SAC_VACACIONES'];
// Rubros indemnizatorios que se suman en un despido sin causa
// (arts. 233, 245, 231/232 LCT).
const CODIGOS_DESPIDO_SIN_CAUSA = [
  'INTEGRACION_MES', 'SAC_INTEGRACION', 'INDEM_ANTIGUEDAD', 'INDEM_PREAVISO', 'SAC_PREAVISO',
];

const LiquidacionFinalDialog: React.FC<Props> = ({ open, liquidacionId, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const isCreate = liquidacionId == null;

  const [error, setError] = useState<string | null>(null);
  const [empleadoId, setEmpleadoId] = useState<number | ''>('');
  const [fechaEgreso, setFechaEgreso] = useState<string>(dayjs().format('YYYY-MM-DD'));
  // '' = sin especificar: el motivo es opcional y editable mientras esté en BORRADOR.
  const [motivoEgreso, setMotivoEgreso] = useState<MotivoEgreso | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [drafts, setDrafts] = useState<ItemDraft[]>([]);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [confirmarOpen, setConfirmarOpen] = useState(false);
  const [eliminarOpen, setEliminarOpen] = useState(false);

  const { data: liquidacion, isLoading } = useQuery({
    queryKey: ['liquidacion-final', liquidacionId],
    queryFn: () => liquidacionFinalApi.getById(liquidacionId as number),
    enabled: open && liquidacionId != null,
  });

  const { data: conceptos = [] } = useQuery({
    queryKey: ['conceptos-liquidacion', { activo: true }],
    queryFn: () => liquidacionFinalApi.getConceptos(true),
    enabled: open,
  });

  // Liquidables = todo empleado sin finiquito previo (flag empleado.liquidado):
  // activos, en licencia, e INACTIVOS dados de baja sin liquidación (los
  // históricos ya liquidados en papel vienen con liquidado=true del backfill).
  const { data: empleadosLiquidables = [] } = useQuery({
    queryKey: ['empleados', 'liquidables'],
    queryFn: async () => {
      const todos = await employeeApi.getAllList();
      return (Array.isArray(todos) ? todos : []).filter(e => !e.liquidado);
    },
    enabled: open && isCreate,
  });

  // Sincronizar formulario de cabecera al cargar una liquidación existente.
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isCreate) {
      setEmpleadoId('');
      setFechaEgreso(dayjs().format('YYYY-MM-DD'));
      setMotivoEgreso('');
      setObservaciones('');
      setDrafts([]);
    } else if (liquidacion) {
      setFechaEgreso(liquidacion.fechaEgreso ?? '');
      setMotivoEgreso(liquidacion.motivoEgreso ?? '');
      setObservaciones(liquidacion.observaciones ?? '');
    }
  }, [open, isCreate, liquidacion]);

  const esBorrador = isCreate || liquidacion?.estado === 'BORRADOR';
  const estado = isCreate ? 'BORRADOR' : liquidacion?.estado;

  const invalidate = (updated?: LiquidacionFinal) => {
    if (updated) queryClient.setQueryData(['liquidacion-final', updated.id], updated);
    queryClient.invalidateQueries({ queryKey: ['liquidaciones-finales'] });
  };

  const onError = (err: any) =>
    setError(err?.response?.data?.message || 'Ocurrió un error, reintentá');

  const createMutation = useMutation({
    mutationFn: liquidacionFinalApi.create,
    onSuccess: (created) => { invalidate(created); onClose(); },
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: () => liquidacionFinalApi.update(liquidacionId as number, {
      fechaEgreso, motivoEgreso: motivoEgreso || undefined, observaciones,
    }),
    onSuccess: invalidate,
    onError,
  });

  const addItemMutation = useMutation({
    mutationFn: (item: LiquidacionFinalItemRequest) =>
      liquidacionFinalApi.addItem(liquidacionId as number, item),
    onSuccess: invalidate,
    onError,
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, item }: { itemId: number; item: LiquidacionFinalItemRequest }) =>
      liquidacionFinalApi.updateItem(liquidacionId as number, itemId, item),
    onSuccess: invalidate,
    onError,
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      liquidacionFinalApi.deleteItem(liquidacionId as number, itemId),
    onSuccess: invalidate,
    onError,
  });

  const confirmarMutation = useMutation({
    mutationFn: () => liquidacionFinalApi.confirmar(liquidacionId as number),
    onSuccess: (updated) => { invalidate(updated); setConfirmarOpen(false); },
    onError: (err: any) => { setConfirmarOpen(false); onError(err); },
  });

  const anularMutation = useMutation({
    mutationFn: () => liquidacionFinalApi.anular(liquidacionId as number, motivoAnulacion.trim()),
    onSuccess: (updated) => { invalidate(updated); setAnularOpen(false); setMotivoAnulacion(''); },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => liquidacionFinalApi.delete(liquidacionId as number),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['liquidaciones-finales'] }); onClose(); },
    onError,
  });

  // ── Totales: en modo creación se calculan localmente solo a modo de preview;
  //    el server SIEMPRE recalcula al persistir. ──────────────────────────────
  const totales = useMemo(() => {
    if (!isCreate && liquidacion) {
      return {
        haberes: liquidacion.totalHaberes,
        descuentos: liquidacion.totalDescuentos,
        neto: liquidacion.totalNeto,
      };
    }
    const haberes = drafts.filter(d => d.signo === 'HABER')
      .reduce((s, d) => s + (Number(d.monto) || 0), 0);
    const descuentos = drafts.filter(d => d.signo === 'DESCUENTO')
      .reduce((s, d) => s + (Number(d.monto) || 0), 0);
    return { haberes, descuentos, neto: haberes - descuentos };
  }, [isCreate, liquidacion, drafts]);

  const handleCrear = () => {
    setError(null);
    if (empleadoId === '') {
      setError('Elegí el empleado a liquidar');
      return;
    }
    if (!fechaEgreso) {
      setError('Indicá la fecha de egreso');
      return;
    }
    createMutation.mutate({
      empleadoId: empleadoId as number,
      fechaEgreso,
      motivoEgreso: motivoEgreso || undefined,
      observaciones: observaciones.trim() || undefined,
      items: drafts,
    });
  };

  const empleadoYaInactivo = liquidacion?.empleadoEstado === 'INACTIVO';

  // Precarga los conceptos habituales del finiquito con monto $0 para que
  // RRHH solo complete importes. Con despido sin causa suma los rubros
  // indemnizatorios; el resto de los motivos precarga solo los proporcionales.
  const precargarConceptos = async () => {
    const codigos = motivoEgreso === 'DESPIDO_SIN_CAUSA'
      ? [...CODIGOS_SIEMPRE, ...CODIGOS_DESPIDO_SIN_CAUSA]
      : CODIGOS_SIEMPRE;
    const seleccion = codigos
      .map(cod => conceptos.find(c => c.codigo === cod))
      .filter((c): c is ConceptoLiquidacion => Boolean(c));
    if (seleccion.length === 0) {
      setError('No se encontraron conceptos habituales en el catálogo');
      return;
    }
    const nuevos: LiquidacionFinalItemRequest[] = seleccion.map((c, i) => ({
      conceptoId: c.id,
      descripcion: c.nombre,
      signo: c.signo,
      monto: 0,
      orden: (i + 1) * 10,
    }));
    if (isCreate) {
      setDrafts(prev => [...prev, ...nuevos]);
      return;
    }
    try {
      for (const item of nuevos) {
        await liquidacionFinalApi.addItem(liquidacionId as number, item);
      }
    } catch (err: any) {
      onError(err);
    } finally {
      queryClient.invalidateQueries({ queryKey: ['liquidacion-final', liquidacionId] });
      queryClient.invalidateQueries({ queryKey: ['liquidaciones-finales'] });
    }
  };

  const handlePdf = () => {
    if (!liquidacion) return;
    try {
      // Formato corporativo Ripser (mismo estilo que el Recibo de Haberes).
      generarLiquidacionFinalPDF(liquidacion);
    } catch {
      setError('No se pudo generar el PDF');
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending
    || confirmarMutation.isPending || deleteMutation.isPending;

  const antiguedad = useMemo(() => {
    const ingreso = liquidacion?.empleadoFechaIngreso;
    if (!ingreso || !fechaEgreso) return null;
    const anos = dayjs(fechaEgreso).diff(dayjs(ingreso), 'year');
    const meses = dayjs(fechaEgreso).diff(dayjs(ingreso).add(anos, 'year'), 'month');
    return `${anos} año${anos === 1 ? '' : 's'}, ${meses} mes${meses === 1 ? '' : 'es'}`;
  }, [liquidacion, fechaEgreso]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600}>
            {isCreate
              ? 'Nueva liquidación final'
              : `Liquidación final #${liquidacion?.id ?? ''} — ${liquidacion?.empleadoApellido ?? ''}, ${liquidacion?.empleadoNombre ?? ''}`}
          </Typography>
          {estado && (
            <Chip label={estado} color={ESTADO_COLOR[estado] ?? 'default'} size="small"
              sx={{ fontWeight: 700, bgcolor: 'background.paper' }} variant="outlined" />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

        {!isCreate && isLoading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <>
            {/* ── Cabecera ── */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
              {isCreate ? (
                <Autocomplete
                  size="small" sx={{ minWidth: 280 }}
                  options={empleadosLiquidables}
                  getOptionLabel={(e) => `${e.apellido ?? ''}, ${e.nombre ?? ''}`
                    + `${e.dni ? ` — DNI ${e.dni}` : ''}`
                    + `${e.estado === 'INACTIVO' ? ' (dado de baja)' : ''}`}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  value={empleadosLiquidables.find(e => e.id === empleadoId) ?? null}
                  onChange={(_, v) => setEmpleadoId(v?.id ?? '')}
                  renderInput={(p) => (
                    <TextField {...p} label="Empleado" placeholder="Escribí nombre o apellido..." />
                  )}
                  noOptionsText="Sin empleados liquidables que coincidan"
                />
              ) : (
                <Box sx={{ minWidth: 260 }}>
                  <Typography variant="caption" color="textSecondary" display="block">Empleado</Typography>
                  <Typography fontWeight={600}>
                    {liquidacion?.empleadoApellido}, {liquidacion?.empleadoNombre}
                    {liquidacion?.empleadoDni ? ` — DNI ${liquidacion.empleadoDni}` : ''}
                  </Typography>
                  {liquidacion?.empleadoFechaIngreso && (
                    <Typography variant="caption" color="textSecondary">
                      Ingreso: {dayjs(liquidacion.empleadoFechaIngreso).format('DD/MM/YYYY')}
                      {antiguedad ? ` · Antigüedad: ${antiguedad}` : ''}
                    </Typography>
                  )}
                </Box>
              )}
              <TextField
                size="small" type="date" label="Fecha de egreso"
                value={fechaEgreso}
                onChange={(e) => setFechaEgreso(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!esBorrador}
                sx={{ minWidth: 180 }}
              />
              <TextField
                select size="small" label="Motivo de egreso (opcional)" sx={{ minWidth: 240 }}
                value={motivoEgreso}
                onChange={(e) => setMotivoEgreso(e.target.value as MotivoEgreso | '')}
                disabled={!esBorrador}
              >
                <MenuItem value=""><em>Sin especificar</em></MenuItem>
                {MOTIVOS_EGRESO.map(m => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small" label="Observaciones" sx={{ flex: 1, minWidth: 200 }}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={!esBorrador}
              />
              {!isCreate && esBorrador && (
                <Button
                  variant="outlined" size="small" startIcon={<SaveIcon />}
                  onClick={() => updateMutation.mutate()}
                  disabled={busy}
                >
                  Guardar cabecera
                </Button>
              )}
            </Stack>

            {liquidacion?.estado === 'ANULADA' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Anulada por {liquidacion.anuladaPor ?? '—'}
                {liquidacion.fechaAnulacion ? ` el ${dayjs(liquidacion.fechaAnulacion).format('DD/MM/YYYY HH:mm')}` : ''}
                — Motivo: {liquidacion.motivoAnulacion}
              </Alert>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* ── Ítems ── */}
            {esBorrador && (isCreate ? drafts : (liquidacion?.items ?? [])).length === 0 && (
              <Box mb={1.5}>
                <Button
                  size="small" variant="outlined" startIcon={<PlaylistAddIcon />}
                  onClick={precargarConceptos}
                >
                  Precargar conceptos habituales
                  {motivoEgreso === 'DESPIDO_SIN_CAUSA' ? ' (incluye indemnizaciones)' : ''}
                </Button>
                <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>
                  Agrega los rubros típicos del finiquito en $0 para completar los importes a mano.
                </Typography>
              </Box>
            )}
            <ItemsLiquidacionTable
              items={isCreate ? drafts : (liquidacion?.items ?? [])}
              conceptos={conceptos}
              readOnly={!esBorrador}
              onAdd={(item) => {
                if (isCreate) setDrafts(prev => [...prev, item]);
                else addItemMutation.mutate(item);
              }}
              onUpdate={(itemId, item) => {
                if (isCreate) setDrafts(prev => prev.map((d, i) => (i === itemId ? item : d)));
                else updateItemMutation.mutate({ itemId, item });
              }}
              onDelete={(itemId) => {
                if (isCreate) setDrafts(prev => prev.filter((_, i) => i !== itemId));
                else deleteItemMutation.mutate(itemId);
              }}
            />

            {/* ── Totales (server-side; en creación es solo preview) ── */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mt={2} justifyContent="flex-end">
              <Box textAlign="right">
                <Typography variant="caption" color="textSecondary">Total haberes</Typography>
                <Typography fontWeight={700} color="success.main">{fmt(totales.haberes)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="textSecondary">Total descuentos</Typography>
                <Typography fontWeight={700} color="error.main">{fmt(totales.descuentos)}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="textSecondary">Neto a pagar</Typography>
                <Typography variant="h6" fontWeight={800}
                  color={totales.neto < 0 ? 'error.main' : 'success.main'}>
                  {fmt(totales.neto)}
                </Typography>
              </Box>
            </Stack>

            {!isCreate && liquidacion?.fechaPago && (
              <Typography variant="body2" color="textSecondary" mt={1} textAlign="right">
                Pagada el {dayjs(liquidacion.fechaPago).format('DD/MM/YYYY')}
                {liquidacion.pagadaPor ? ` por ${liquidacion.pagadaPor}` : ''}
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        {!isCreate && liquidacion && (
          <Button startIcon={<PdfIcon />} onClick={handlePdf}>PDF</Button>
        )}
        <Box flex={1} />
        <Button variant="outlined" onClick={onClose} disabled={busy}>Cerrar</Button>

        {isCreate && (
          <Button
            variant="contained" startIcon={<SaveIcon />}
            onClick={handleCrear} disabled={busy}
          >
            {createMutation.isPending ? 'Guardando...' : 'Crear borrador'}
          </Button>
        )}

        {!isCreate && liquidacion?.estado === 'BORRADOR' && (
          <>
            <Button
              color="error" startIcon={<DeleteIcon />}
              onClick={() => setEliminarOpen(true)} disabled={busy}
            >
              Eliminar
            </Button>
            <Button
              variant="contained" color="success" startIcon={<CheckCircleIcon />}
              onClick={() => setConfirmarOpen(true)}
              disabled={busy || (liquidacion.items?.length ?? 0) === 0}
            >
              {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar y dar de baja'}
            </Button>
          </>
        )}

        {!isCreate && liquidacion?.estado === 'CONFIRMADA' && (
          <>
            <Button
              color="error" startIcon={<BlockIcon />}
              onClick={() => setAnularOpen(true)} disabled={busy}
            >
              Anular
            </Button>
            <Button
              variant="contained" startIcon={<PaymentIcon />}
              onClick={() => setPagoOpen(true)} disabled={busy}
            >
              Pagar
            </Button>
          </>
        )}

        {!isCreate && liquidacion?.estado === 'PAGADA' && (
          <Button
            color="error" startIcon={<BlockIcon />}
            onClick={() => setAnularOpen(true)} disabled={busy}
          >
            Anular
          </Button>
        )}
      </DialogActions>

      {/* ── Pago ── */}
      <PagoLiquidacionDialog
        open={pagoOpen}
        liquidacion={liquidacion ?? null}
        onClose={() => setPagoOpen(false)}
        onSuccess={() => {
          setPagoOpen(false);
          queryClient.invalidateQueries({ queryKey: ['liquidacion-final', liquidacionId] });
          queryClient.invalidateQueries({ queryKey: ['liquidaciones-finales'] });
        }}
      />

      {/* ── Confirmar (modal con aviso adaptado al estado del empleado) ── */}
      <Dialog open={confirmarOpen} onClose={() => setConfirmarOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar liquidación final</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Al confirmar, la liquidación queda <strong>inmutable</strong>: no se puede editar,
            solo anular.
          </Typography>
          {empleadoYaInactivo ? (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              El empleado <strong>ya está dado de baja</strong>. No se vuelve a desactivar nada:
              solo se actualiza su ficha con la fecha de egreso
              {liquidacion?.motivoEgreso ? ' y el motivo' : ''} de este documento, y queda
              marcado como liquidado.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              El empleado será <strong>dado de baja</strong>: pasa a INACTIVO con la fecha de
              egreso del documento, se desactivan sus accesos al sistema y se cierra su legajo.
            </Alert>
          )}
          <Typography variant="body2" mt={1.5}>
            Neto a pagar: <strong>{fmt(liquidacion?.totalNeto)}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarOpen(false)} disabled={confirmarMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained" color="success" startIcon={<CheckCircleIcon />}
            disabled={confirmarMutation.isPending}
            onClick={() => confirmarMutation.mutate()}
          >
            {confirmarMutation.isPending ? 'Confirmando...' : 'Confirmar liquidación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Eliminar borrador ── */}
      <Dialog open={eliminarOpen} onClose={() => setEliminarOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar borrador</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Se elimina el borrador y sus ítems. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEliminarOpen(false)} disabled={deleteMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="contained" color="error" startIcon={<DeleteIcon />}
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Anular (motivo obligatorio) ── */}
      <Dialog open={anularOpen} onClose={() => setAnularOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Anular liquidación final</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Anular NO revierte la baja del empleado ni los egresos de caja de una
            liquidación pagada — esas correcciones se hacen a mano si corresponden.
          </Alert>
          <TextField
            autoFocus fullWidth multiline rows={2} size="small"
            label="Motivo de anulación (obligatorio)"
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnularOpen(false)}>Cancelar</Button>
          <Button
            variant="contained" color="error"
            disabled={!motivoAnulacion.trim() || anularMutation.isPending}
            onClick={() => anularMutation.mutate()}
          >
            {anularMutation.isPending ? 'Anulando...' : 'Anular'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default LiquidacionFinalDialog;
