import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Box, Typography, Button, TextField, Grid, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogActions, Chip, Alert,
  Autocomplete, Card, CardContent, Divider, CircularProgress,
  Paper, Checkbox, Tooltip, alpha, useTheme, IconButton,
} from '@mui/material';
import {
  CheckCircle, Receipt, Inventory, Warning,
  CreditCard, Description, ErrorOutline, SwapHoriz,
  AddCircleOutline, RemoveCircleOutline,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/config';
import { documentoApi } from '../../api/services';
import { useTenant } from '../../context/TenantContext';
import type { DocumentoComercial, EquipoFabricadoDTO, DetalleDocumento, TipoItemDocumento, MotivoNotaCredito } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';

// ────────────────────────── Types ──────────────────────────

type ModoCredito = 'DEVOLUCION_EQUIPO' | 'ERROR_FACTURACION';

/** Represents one selectable line in ERROR mode. EQUIPO items are expanded 1-per-unit. */
interface ItemErrorSeleccionado {
  key: string;
  detalleDocumentoId: number;
  tipoItem: TipoItemDocumento;
  descripcion: string;
  /** Total quantity of the original detalle (e.g., 2 for a detalle with qty=2 equipos). */
  cantidadOriginal: number;
  /** Full subtotal of the original detalle (before any credit). */
  subtotalOriginal: number;
  // Controlled fields
  seleccionado: boolean;
  cantidadAcreditar: number;
  // EQUIPO only
  equipoFabricadoId?: number;
  equipoNumero?: string;
  equipoEstado?: string;
  /** Whether to return this equipo to DISPONIBLE when credited. */
  retornarInventario: boolean;
}

interface NotaCreditoForm {
  facturaId: number | null;
  facturaNumero: string;
  clienteId: number | null;
  clienteNombre: string;
  observaciones: string;
  // DEVOLUCION mode
  equiposSeleccionados: EquipoFabricadoDTO[];
}

interface SuccessData {
  notaCredito: any;
  facturaNumero: string;
  montoCalculado: number;
  modoCredito: ModoCredito;
  // DEVOLUCION
  equiposDevueltos?: number;
  totalEquiposFactura?: number;
  // ERROR
  itemsAcreditados?: number;
}

// ────────────────────────── Component ──────────────────────────

const NotasCreditoPage: React.FC = () => {
  const theme = useTheme();
  const { empresaId } = useTenant();

  // Factura search
  const [facturas, setFacturas] = useState<DocumentoComercial[]>([]);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<DocumentoComercial | null>(null);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [facturaInput, setFacturaInput] = useState('');
  const debouncedFacturaInput = useDebounce(facturaInput, 300);
  const abortRef = useRef<AbortController | null>(null);

  // Factura content
  const [facturaDetalles, setFacturaDetalles] = useState<DetalleDocumento[]>([]);
  const [equiposFactura, setEquiposFactura] = useState<EquipoFabricadoDTO[]>([]);
  const [itemsError, setItemsError] = useState<ItemErrorSeleccionado[]>([]);
  const [loadingContenido, setLoadingContenido] = useState(false);

  // Mode
  const [modoCredito, setModoCredito] = useState<ModoCredito | null>(null);

  // Form
  const [form, setForm] = useState<NotaCreditoForm>({
    facturaId: null,
    facturaNumero: '',
    clienteId: null,
    clienteNombre: '',
    observaciones: '',
    equiposSeleccionados: [],
  });

  const [errors, setErrors] = useState({ factura: '', items: '' });

  const [alert, setAlert] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const [creating, setCreating] = useState(false);

  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    data: SuccessData | null;
  }>({ open: false, data: null });

  // ── Facturas load / search ──

  useEffect(() => {
    let cancelled = false;
    setLoadingFacturas(true);
    documentoApi.getByTipoPaginated('FACTURA', { page: 0, size: 20, sort: 'fechaEmision,desc' }, {})
      .then((res) => { if (!cancelled) setFacturas(res.content); })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading facturas:', err);
        setAlert({ open: true, message: 'Error al cargar las facturas.', severity: 'error' });
      })
      .finally(() => { if (!cancelled) setLoadingFacturas(false); });
    return () => { cancelled = true; };
  }, [empresaId]);

  useEffect(() => {
    if (debouncedFacturaInput.trim().length === 0) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoadingFacturas(true);
    documentoApi.getByTipoPaginated(
      'FACTURA',
      { page: 0, size: 20, sort: 'fechaEmision,desc' },
      { busqueda: debouncedFacturaInput.trim() }
    )
      .then((res) => setFacturas(res.content))
      .catch((err) => { if ((err as any)?.code !== 'ERR_CANCELED') console.error(err); })
      .finally(() => setLoadingFacturas(false));
  }, [debouncedFacturaInput]);

  // ── Handlers ──

  const resetForm = () => {
    setForm({ facturaId: null, facturaNumero: '', clienteId: null, clienteNombre: '', observaciones: '', equiposSeleccionados: [] });
    setFacturaSeleccionada(null);
    setFacturaDetalles([]);
    setEquiposFactura([]);
    setItemsError([]);
    setModoCredito(null);
    setErrors({ factura: '', items: '' });
  };

  const handleFacturaChange = async (factura: DocumentoComercial | null) => {
    if (!factura) { resetForm(); return; }
    setFacturaSeleccionada(factura);
    setForm({
      facturaId: factura.id,
      facturaNumero: factura.numeroDocumento,
      clienteId: factura.clienteId || null,
      clienteNombre: factura.clienteNombre || '',
      observaciones: '',
      equiposSeleccionados: [],
    });
    setModoCredito(null);
    setItemsError([]);
    setErrors({ factura: '', items: '' });
    await loadFacturaContenido(factura.id);
  };

  /** Loads full factura details and all assigned equipos (all states). */
  const loadFacturaContenido = async (facturaId: number) => {
    try {
      setLoadingContenido(true);
      const factura = await documentoApi.getById(facturaId);
      setFacturaDetalles(factura.detalles || []);

      // Collect all equipo IDs from EQUIPO detalles
      const allEquipoIds: number[] = [];
      (factura.detalles || []).forEach((d: DetalleDocumento) => {
        if (d.tipoItem === 'EQUIPO' && d.equiposFabricadosIds) {
          allEquipoIds.push(...d.equiposFabricadosIds);
        }
      });

      // Fetch all equipos (no state filter — ERROR mode needs all, DEVOLUCION filters in render)
      const equiposPorId = new Map<number, EquipoFabricadoDTO>();
      if (allEquipoIds.length > 0) {
        const responses = await Promise.all(allEquipoIds.map(id => api.get(`/api/equipos-fabricados/${id}`)));
        responses.forEach(res => equiposPorId.set(res.data.id, res.data));
      }

      const allEquipos = Array.from(equiposPorId.values());
      setEquiposFactura(allEquipos);

      // Build ERROR mode item list: expand EQUIPO detalles per unit, one row per PRODUTO/ENVIO line
      const items: ItemErrorSeleccionado[] = [];
      (factura.detalles || []).forEach((detalle: DetalleDocumento) => {
        if (detalle.tipoItem === 'EQUIPO') {
          const ids = detalle.equiposFabricadosIds || [];
          const nums = detalle.equiposNumerosHeladera || [];
          ids.forEach((equipoId: number, idx: number) => {
            const equipo = equiposPorId.get(equipoId);
            items.push({
              key: `${detalle.id}-${equipoId}`,
              detalleDocumentoId: detalle.id,
              tipoItem: 'EQUIPO',
              descripcion: detalle.descripcionEquipo || detalle.recetaNombre || 'Equipo',
              cantidadOriginal: detalle.cantidad || ids.length,
              subtotalOriginal: detalle.subtotal || 0,
              seleccionado: false,
              cantidadAcreditar: 1,
              equipoFabricadoId: equipoId,
              equipoNumero: nums[idx] || equipo?.numeroHeladera || String(equipoId),
              equipoEstado: equipo?.estadoAsignacion as string | undefined,
              retornarInventario: true,
            });
          });
        } else if (detalle.tipoItem === 'PRODUCTO') {
          items.push({
            key: `${detalle.id}-prod`,
            detalleDocumentoId: detalle.id,
            tipoItem: 'PRODUCTO',
            descripcion: detalle.productoNombre || 'Producto',
            cantidadOriginal: detalle.cantidad || 1,
            subtotalOriginal: detalle.subtotal || 0,
            seleccionado: false,
            cantidadAcreditar: detalle.cantidad || 1,
            retornarInventario: false,
          });
        } else if (detalle.tipoItem === 'ENVIO') {
          items.push({
            key: `${detalle.id}-envio`,
            detalleDocumentoId: detalle.id,
            tipoItem: 'ENVIO',
            descripcion: detalle.descripcion || 'Envío',
            cantidadOriginal: 1,
            subtotalOriginal: detalle.subtotal || 0,
            seleccionado: false,
            cantidadAcreditar: 1,
            retornarInventario: false,
          });
        }
      });
      setItemsError(items);

    } catch (error) {
      console.error('Error loading factura contenido:', error);
      setAlert({ open: true, message: 'Error al cargar los detalles de la factura.', severity: 'error' });
    } finally {
      setLoadingContenido(false);
    }
  };

  const handleModoChange = (modo: ModoCredito) => {
    setModoCredito(modo);
    setForm(f => ({ ...f, equiposSeleccionados: [] }));
    setItemsError(prev => prev.map(i => ({ ...i, seleccionado: false })));
    setErrors({ factura: '', items: '' });
  };

  // DEVOLUCION mode
  const handleEquipoToggle = (equipo: EquipoFabricadoDTO) => {
    const isSelected = form.equiposSeleccionados.some(e => e.id === equipo.id);
    setForm(f => ({
      ...f,
      equiposSeleccionados: isSelected
        ? f.equiposSeleccionados.filter(e => e.id !== equipo.id)
        : [...f.equiposSeleccionados, equipo],
    }));
    setErrors(e => ({ ...e, items: '' }));
  };

  const handleSelectAllEquipos = () => {
    const eligible = equiposElegiblesDevolucion;
    const allSelected = form.equiposSeleccionados.length === eligible.length;
    setForm(f => ({ ...f, equiposSeleccionados: allSelected ? [] : [...eligible] }));
  };

  // ERROR mode
  const handleItemErrorToggle = (key: string) => {
    setItemsError(prev => prev.map(i =>
      i.key === key ? { ...i, seleccionado: !i.seleccionado } : i
    ));
    setErrors(e => ({ ...e, items: '' }));
  };

  const handleItemErrorCantidad = (key: string, delta: number) => {
    setItemsError(prev => prev.map(i => {
      if (i.key !== key) return i;
      const next = Math.max(1, Math.min(i.cantidadOriginal, i.cantidadAcreditar + delta));
      return { ...i, cantidadAcreditar: next };
    }));
  };

  const handleItemErrorRetornarChange = (key: string, value: boolean) => {
    setItemsError(prev => prev.map(i =>
      i.key === key ? { ...i, retornarInventario: value } : i
    ));
  };

  const handleSelectAllErrorItems = () => {
    const anySelected = itemsError.some(i => i.seleccionado);
    setItemsError(prev => prev.map(i => ({ ...i, seleccionado: !anySelected })));
  };

  // ── Computed values ──

  const equiposElegiblesDevolucion = useMemo(
    () => equiposFactura.filter(e => ['FACTURADO', 'EN_TRANSITO', 'ENTREGADO'].includes(e.estadoAsignacion as string)),
    [equiposFactura]
  );

  const totalEquiposEnFactura = useMemo(
    () => itemsError.filter(i => i.tipoItem === 'EQUIPO').length,
    [itemsError]
  );

  const totalEquiposSubtotal = useMemo(
    () => facturaDetalles.filter(d => d.tipoItem === 'EQUIPO').reduce((acc, d) => acc + (d.subtotal || 0), 0),
    [facturaDetalles]
  );

  const montoDevolucion = useMemo(() => {
    if (!facturaSeleccionada || totalEquiposEnFactura === 0 || form.equiposSeleccionados.length === 0) return 0;
    const ivaRate = facturaSeleccionada.subtotal > 0 ? facturaSeleccionada.iva / facturaSeleccionada.subtotal : 0;
    const subtotalProporcional = (totalEquiposSubtotal / totalEquiposEnFactura) * form.equiposSeleccionados.length;
    return subtotalProporcional * (1 + ivaRate);
  }, [facturaSeleccionada, totalEquiposEnFactura, totalEquiposSubtotal, form.equiposSeleccionados.length]);

  const montoError = useMemo(() => {
    return itemsError
      .filter(i => i.seleccionado)
      .reduce((acc, i) => {
        const precioUnit = i.cantidadOriginal > 0 ? i.subtotalOriginal / i.cantidadOriginal : 0;
        return acc + precioUnit * i.cantidadAcreditar;
      }, 0);
  }, [itemsError]);

  const itemsErrorSeleccionados = useMemo(() => itemsError.filter(i => i.seleccionado), [itemsError]);

  const hayItemsSeleccionados = modoCredito === 'DEVOLUCION_EQUIPO'
    ? form.equiposSeleccionados.length > 0
    : itemsErrorSeleccionados.length > 0;

  const montoActual = modoCredito === 'DEVOLUCION_EQUIPO' ? montoDevolucion : montoError;

  // ── Submit ──

  const validateForm = (): boolean => {
    const newErrors = { factura: '', items: '' };
    if (!form.facturaId) newErrors.factura = 'Debe seleccionar una factura';
    if (!hayItemsSeleccionados) newErrors.items = 'Debe seleccionar al menos un ítem a acreditar';
    setErrors(newErrors);
    return !newErrors.factura && !newErrors.items;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setAlert({ open: true, message: 'Complete los campos requeridos.', severity: 'error' });
      return;
    }
    try {
      setCreating(true);
      const currentUser = localStorage.getItem('user');
      const usuarioId = currentUser ? JSON.parse(currentUser).id : 1;

      const observacionesTexto = form.observaciones.trim() || undefined;
      const motivo: MotivoNotaCredito = modoCredito === 'ERROR_FACTURACION' ? 'ERROR_FACTURACION' : 'DEVOLUCION_EQUIPO';

      let payload: any;
      if (modoCredito === 'DEVOLUCION_EQUIPO') {
        payload = {
          facturaId: form.facturaId,
          usuarioId,
          observaciones: observacionesTexto,
          motivo,
          equiposADevolver: form.equiposSeleccionados.map(e => e.id),
        };
      } else {
        payload = {
          facturaId: form.facturaId,
          usuarioId,
          observaciones: observacionesTexto,
          motivo,
          itemsAcreditar: itemsErrorSeleccionados.map(i => ({
            detalleDocumentoId: i.detalleDocumentoId,
            cantidadAcreditar: i.cantidadAcreditar,
            ...(i.tipoItem === 'EQUIPO' && i.retornarInventario && i.equipoFabricadoId
              ? { equipoFabricadoId: i.equipoFabricadoId }
              : {}),
          })),
        };
      }

      const successSnap = {
        facturaNumero: form.facturaNumero,
        montoCalculado: montoActual,
        modoCredito: modoCredito!,
        equiposDevueltos: modoCredito === 'DEVOLUCION_EQUIPO' ? form.equiposSeleccionados.length : undefined,
        totalEquiposFactura: modoCredito === 'DEVOLUCION_EQUIPO' ? equiposElegiblesDevolucion.length : undefined,
        itemsAcreditados: modoCredito === 'ERROR_FACTURACION' ? itemsErrorSeleccionados.length : undefined,
      };

      const notaCredito = await documentoApi.createNotaCredito(payload);

      setSuccessDialog({ open: true, data: { notaCredito, ...successSnap } });
      resetForm();
    } catch (error: any) {
      console.error('Error creating nota credito:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Error al crear la nota de crédito';
      setAlert({ open: true, message: msg, severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialog({ open: false, data: null });
    setFacturaInput(v => v);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  // ── Render helpers ──

  const StepBadge = ({ n }: { n: number }) => (
    <Box sx={{
      width: 28, height: 28, borderRadius: '50%',
      bgcolor: 'primary.main', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: '0.875rem', flexShrink: 0,
    }}>
      {n}
    </Box>
  );

  const equipoEstadoColor = (estado?: string) => {
    if (estado === 'ENTREGADO') return 'success';
    if (estado === 'EN_TRANSITO') return 'warning';
    if (estado === 'FACTURADO') return 'info';
    return 'default';
  };

  // ── JSX ──

  return (
    <Box>
      <LoadingOverlay open={creating} message="Creando nota de crédito..." />

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3} pb={2}
        sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard sx={{ fontSize: 28, color: 'warning.main' }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight="600">Notas de Crédito</Typography>
          <Typography variant="body2" color="text.secondary">
            Generar notas de crédito por devolución de equipos o error de facturación
          </Typography>
        </Box>
      </Box>

      {alert.open && (
        <Alert severity={alert.severity} onClose={() => setAlert(a => ({ ...a, open: false }))} sx={{ mb: 3, borderRadius: 2 }}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── Paso 1: Factura ── */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <StepBadge n={1} />
                <Box display="flex" alignItems="center" gap={1}>
                  <Receipt sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="600">Seleccionar Factura</Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Autocomplete
                options={facturas}
                getOptionLabel={(o) => `${o.numeroDocumento} - ${o.clienteNombre} (${dayjs(o.fechaEmision).format('DD/MM/YYYY')})`}
                loading={loadingFacturas}
                onChange={(_, v) => handleFacturaChange(v)}
                value={facturaSeleccionada}
                inputValue={facturaInput}
                onInputChange={(_, v) => setFacturaInput(v)}
                filterOptions={opts => opts}
                renderOption={({ key, ...props }, option) => (
                  <li key={key} {...props}>
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">{option.numeroDocumento}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.clienteNombre} · {dayjs(option.fechaEmision).format('DD/MM/YYYY')} · {formatCurrency(option.total || 0)}
                      </Typography>
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar factura por número o cliente"
                    error={!!errors.factura}
                    helperText={errors.factura || 'Facturas de más reciente a más antigua'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>{loadingFacturas ? <CircularProgress size={20} /> : null}{params.InputProps.endAdornment}</>
                      ),
                    }}
                  />
                )}
              />

              {facturaSeleccionada && (
                <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                  <Grid container spacing={2}>
                    {[
                      ['Cliente', form.clienteNombre],
                      ['Factura', form.facturaNumero],
                      ['Fecha', dayjs(facturaSeleccionada.fechaEmision).format('DD/MM/YYYY')],
                      ['Total', formatCurrency(facturaSeleccionada.total || 0)],
                    ].map(([label, value]) => (
                      <Grid item xs={6} sm={3} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight="600" color={label === 'Total' ? 'primary.main' : undefined}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Paso 2: Tipo de nota de crédito ── */}
        {form.facturaId && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <StepBadge n={2} />
                  <Box display="flex" alignItems="center" gap={1}>
                    <SwapHoriz sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="600">Tipo de Nota de Crédito</Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Grid container spacing={2}>
                  {/* DEVOLUCION card */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      onClick={() => handleModoChange('DEVOLUCION_EQUIPO')}
                      sx={{
                        p: 2.5, borderRadius: 2, cursor: 'pointer',
                        border: `2px solid ${modoCredito === 'DEVOLUCION_EQUIPO' ? theme.palette.primary.main : theme.palette.divider}`,
                        bgcolor: modoCredito === 'DEVOLUCION_EQUIPO' ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: theme.palette.primary.light, bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={1.5}>
                        <Inventory sx={{ color: modoCredito === 'DEVOLUCION_EQUIPO' ? 'primary.main' : 'text.secondary', mt: 0.2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">Devolución de equipo(s)</Typography>
                          <Typography variant="caption" color="text.secondary">
                            El cliente devuelve físicamente uno o más equipos. Los equipos deben estar
                            en estado FACTURADO, EN_TRANSITO o ENTREGADO y volverán al inventario.
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* ERROR card */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      onClick={() => handleModoChange('ERROR_FACTURACION')}
                      sx={{
                        p: 2.5, borderRadius: 2, cursor: 'pointer',
                        border: `2px solid ${modoCredito === 'ERROR_FACTURACION' ? theme.palette.warning.main : theme.palette.divider}`,
                        bgcolor: modoCredito === 'ERROR_FACTURACION' ? alpha(theme.palette.warning.main, 0.06) : 'transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: theme.palette.warning.light, bgcolor: alpha(theme.palette.warning.main, 0.04) },
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={1.5}>
                        <ErrorOutline sx={{ color: modoCredito === 'ERROR_FACTURACION' ? 'warning.main' : 'text.secondary', mt: 0.2 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">Error de facturación</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Se facturaron equipos o productos por error. Permite seleccionar ítems
                            específicos (incluyendo productos) y definir cantidad exacta a acreditar.
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Paso 3A: Selección de equipos (DEVOLUCION) ── */}
        {modoCredito === 'DEVOLUCION_EQUIPO' && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <StepBadge n={3} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <Inventory sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="600">Seleccionar Equipos a Devolver</Typography>
                    </Box>
                  </Box>
                  {equiposElegiblesDevolucion.length > 0 && (
                    <Button size="small" variant="outlined" onClick={handleSelectAllEquipos}>
                      {form.equiposSeleccionados.length === equiposElegiblesDevolucion.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {loadingContenido ? (
                  <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                ) : equiposElegiblesDevolucion.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No hay equipos elegibles para devolución física en esta factura
                    (se permiten estados: FACTURADO, EN_TRANSITO, ENTREGADO).
                    Si se trata de un error de facturación, seleccione ese modo en el paso anterior.
                  </Alert>
                ) : (
                  <>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                indeterminate={form.equiposSeleccionados.length > 0 && form.equiposSeleccionados.length < equiposElegiblesDevolucion.length}
                                checked={form.equiposSeleccionados.length === equiposElegiblesDevolucion.length}
                                onChange={handleSelectAllEquipos}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>N° Heladera</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Modelo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Medida</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {equiposElegiblesDevolucion.map((equipo) => {
                            const isSelected = form.equiposSeleccionados.some(e => e.id === equipo.id);
                            return (
                              <TableRow
                                key={equipo.id} hover selected={isSelected}
                                onClick={() => handleEquipoToggle(equipo)}
                                sx={{
                                  cursor: 'pointer',
                                  '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                                  '&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                                }}
                              >
                                <TableCell padding="checkbox"><Checkbox checked={isSelected} /></TableCell>
                                <TableCell><Typography fontWeight="600">{equipo.numeroHeladera}</Typography></TableCell>
                                <TableCell>{equipo.tipo}</TableCell>
                                <TableCell>{equipo.modelo}</TableCell>
                                <TableCell>{equipo.color?.nombre || '—'}</TableCell>
                                <TableCell>{equipo.medida?.nombre || '—'}</TableCell>
                                <TableCell>
                                  <Chip label={equipo.estadoAsignacion} color={equipoEstadoColor(equipo.estadoAsignacion as string)} size="small" variant="outlined" />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {errors.items && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{errors.items}</Alert>}

                    {form.equiposSeleccionados.length > 0 && (
                      <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.success.main, 0.08), borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Equipos seleccionados</Typography>
                            <Typography variant="h6" fontWeight="600" color="success.main">
                              {form.equiposSeleccionados.length} de {equiposElegiblesDevolucion.length}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Monto a acreditar (estimado)</Typography>
                            <Typography variant="h6" fontWeight="600" color="primary.main">{formatCurrency(montoDevolucion)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Tooltip title="Monto proporcional sobre los ítems de equipo de la factura">
                              <Alert severity="info" sx={{ py: 0.5, borderRadius: 1 }}>
                                <Typography variant="caption">
                                  {form.equiposSeleccionados.length === equiposElegiblesDevolucion.length ? 'Devolución total' : 'Devolución parcial'}
                                </Typography>
                              </Alert>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Paso 3B: Ítems a acreditar (ERROR) ── */}
        {modoCredito === 'ERROR_FACTURACION' && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <StepBadge n={3} />
                    <Box display="flex" alignItems="center" gap={1}>
                      <ErrorOutline sx={{ color: 'warning.main' }} />
                      <Typography variant="h6" fontWeight="600">Seleccionar Ítems a Acreditar</Typography>
                    </Box>
                  </Box>
                  {itemsError.length > 0 && (
                    <Button size="small" variant="outlined" color="warning" onClick={handleSelectAllErrorItems}>
                      {itemsError.some(i => i.seleccionado) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                {loadingContenido ? (
                  <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                ) : itemsError.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>Esta factura no tiene ítems para acreditar.</Alert>
                ) : (
                  <>
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                      Seleccione los ítems que fueron facturados por error. Para productos puede ajustar la cantidad.
                      Para equipos, marque "devolver stock" si el equipo debe volver al inventario.
                    </Alert>

                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell padding="checkbox" />
                            <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Cant. original</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Cant. a acreditar</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Subtotal</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="center">Dev. stock</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {itemsError.map((item) => {
                            const precioUnit = item.cantidadOriginal > 0 ? item.subtotalOriginal / item.cantidadOriginal : 0;
                            const montoItem = precioUnit * item.cantidadAcreditar;
                            return (
                              <TableRow
                                key={item.key} hover selected={item.seleccionado}
                                sx={{
                                  '&.Mui-selected': { bgcolor: alpha(theme.palette.warning.main, 0.07) },
                                  '&.Mui-selected:hover': { bgcolor: alpha(theme.palette.warning.main, 0.12) },
                                  opacity: item.seleccionado ? 1 : 0.65,
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox checked={item.seleccionado} onChange={() => handleItemErrorToggle(item.key)} />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.tipoItem}
                                    size="small"
                                    color={item.tipoItem === 'EQUIPO' ? 'primary' : item.tipoItem === 'PRODUCTO' ? 'success' : 'default'}
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={item.seleccionado ? 600 : 400}>
                                    {item.descripcion}
                                  </Typography>
                                  {item.tipoItem === 'EQUIPO' && item.equipoNumero && (
                                    <Typography variant="caption" color="text.secondary">
                                      N°: {item.equipoNumero}
                                      {item.equipoEstado && (
                                        <Chip label={item.equipoEstado} size="small" color={equipoEstadoColor(item.equipoEstado) as any} variant="outlined" sx={{ ml: 1, height: 16, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 } }} />
                                      )}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">{item.cantidadOriginal}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {item.tipoItem === 'PRODUCTO' && item.seleccionado ? (
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                      <IconButton size="small" onClick={() => handleItemErrorCantidad(item.key, -1)} disabled={item.cantidadAcreditar <= 1}>
                                        <RemoveCircleOutline fontSize="small" />
                                      </IconButton>
                                      <Typography variant="body2" fontWeight="600" minWidth={20} textAlign="center">{item.cantidadAcreditar}</Typography>
                                      <IconButton size="small" onClick={() => handleItemErrorCantidad(item.key, 1)} disabled={item.cantidadAcreditar >= item.cantidadOriginal}>
                                        <AddCircleOutline fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    <Typography variant="body2" color={item.seleccionado ? 'text.primary' : 'text.disabled'}>
                                      {item.cantidadAcreditar}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color={item.seleccionado ? 'primary.main' : 'text.disabled'} fontWeight={item.seleccionado ? 600 : 400}>
                                    {formatCurrency(item.seleccionado ? montoItem : item.subtotalOriginal)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  {item.tipoItem === 'EQUIPO' ? (
                                    <Tooltip title="Si está marcado, el equipo vuelve al inventario como DISPONIBLE">
                                      <Checkbox
                                        size="small"
                                        checked={item.retornarInventario}
                                        disabled={!item.seleccionado}
                                        onChange={e => handleItemErrorRetornarChange(item.key, e.target.checked)}
                                        color="warning"
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Typography variant="caption" color="text.disabled">—</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {errors.items && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{errors.items}</Alert>}

                    {itemsErrorSeleccionados.length > 0 && (
                      <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.07), borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Ítems seleccionados</Typography>
                            <Typography variant="h6" fontWeight="600" color="warning.dark">{itemsErrorSeleccionados.length}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2" color="text.secondary">Monto a acreditar (exacto)</Typography>
                            <Typography variant="h6" fontWeight="600" color="primary.main">{formatCurrency(montoError)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Alert severity="warning" sx={{ py: 0.5, borderRadius: 1 }}>
                              <Typography variant="caption">Sin IVA incluido — el backend lo calcula al guardar</Typography>
                            </Alert>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Paso 4: Observaciones ── */}
        {hayItemsSeleccionados && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <StepBadge n={4} />
                  <Box display="flex" alignItems="center" gap={1}>
                    <Description sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="600">Observaciones</Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />
                <TextField
                  fullWidth multiline rows={3}
                  label="Observaciones adicionales (opcional)"
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Describa el motivo con más detalle si es necesario..."
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ── Confirmar ── */}
        {hayItemsSeleccionados && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: `2px solid ${theme.palette.warning.main}`, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Warning sx={{ color: 'warning.main' }} />
                  <Typography variant="h6" fontWeight="600">Confirmar Nota de Crédito</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Factura</Typography>
                    <Typography variant="body1" fontWeight="600">{form.facturaNumero}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Cliente</Typography>
                    <Typography variant="body1" fontWeight="600">{form.clienteNombre}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      {modoCredito === 'DEVOLUCION_EQUIPO' ? 'Equipos a devolver' : 'Ítems a acreditar'}
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {modoCredito === 'DEVOLUCION_EQUIPO'
                        ? `${form.equiposSeleccionados.length} de ${equiposElegiblesDevolucion.length}`
                        : itemsErrorSeleccionados.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Monto estimado</Typography>
                    <Typography variant="h6" fontWeight="600" color="primary.main">{formatCurrency(montoActual)}</Typography>
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Atención:</strong> Esta acción acreditará{' '}
                    {modoCredito === 'DEVOLUCION_EQUIPO' ? 'en la cuenta corriente del cliente y retornará los equipos al inventario' : 'en la cuenta corriente del cliente'}
                    . La operación no puede revertirse desde esta pantalla.
                  </Typography>
                </Alert>

                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button variant="outlined" color="inherit" onClick={resetForm}>Cancelar</Button>
                  <Button
                    variant="contained" color="warning"
                    onClick={handleSubmit} disabled={creating}
                    startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                    sx={{ minWidth: 210 }}
                  >
                    {creating ? 'Creando...' : 'Crear Nota de Crédito'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ── Success Dialog ── */}
      <Dialog open={successDialog.open} onClose={handleSuccessClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'visible' } }}>
        <DialogContent sx={{ pt: 4, pb: 3 }}>
          <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <CheckCircle sx={{ fontSize: 50, color: 'success.main' }} />
            </Box>
            <Typography variant="h5" fontWeight="600" gutterBottom>Nota de Crédito Generada</Typography>

            {successDialog.data && (
              <>
                <Typography variant="body1" color="text.secondary" paragraph>
                  La nota de crédito ha sido creada exitosamente
                </Typography>

                <Alert severity="success" sx={{ mb: 3, textAlign: 'left', width: '100%', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>Acciones realizadas:</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <li>
                      <Typography variant="body2">
                        Crédito de <strong>{formatCurrency(successDialog.data.montoCalculado)}</strong> aplicado a la cuenta corriente del cliente
                      </Typography>
                    </li>
                    {successDialog.data.modoCredito === 'DEVOLUCION_EQUIPO' && successDialog.data.equiposDevueltos != null && (
                      <li>
                        <Typography variant="body2">
                          <strong>{successDialog.data.equiposDevueltos}</strong> equipo(s) retornados al inventario (estado: DISPONIBLE)
                        </Typography>
                      </li>
                    )}
                    {successDialog.data.modoCredito === 'ERROR_FACTURACION' && (
                      <li>
                        <Typography variant="body2">
                          <strong>{successDialog.data.itemsAcreditados}</strong> ítem(s) acreditados por error de facturación
                        </Typography>
                      </li>
                    )}
                  </Box>
                </Alert>

                <Paper elevation={0} sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2.5, width: '100%', border: `1px solid ${theme.palette.divider}` }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">N° Nota de Crédito</Typography>
                      <Typography variant="body1" fontWeight="600">{successDialog.data.notaCredito?.numeroDocumento || '—'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Cliente</Typography>
                      <Typography variant="body1" fontWeight="600">{successDialog.data.notaCredito?.clienteNombre}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Monto Acreditado</Typography>
                      <Typography variant="body1" fontWeight="600" color="success.main">{formatCurrency(successDialog.data.montoCalculado)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Factura de Referencia</Typography>
                      <Typography variant="body1" fontWeight="600">{successDialog.data.facturaNumero}</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {successDialog.data.modoCredito === 'DEVOLUCION_EQUIPO' &&
                  successDialog.data.equiposDevueltos != null &&
                  successDialog.data.totalEquiposFactura != null &&
                  successDialog.data.equiposDevueltos < successDialog.data.totalEquiposFactura && (
                    <Alert severity="info" sx={{ mt: 2, width: '100%', borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>Devolución parcial:</strong> Quedan{' '}
                        {successDialog.data.totalEquiposFactura - successDialog.data.equiposDevueltos} equipo(s) de la factura original sin devolver.
                      </Typography>
                    </Alert>
                  )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
          <Button variant="contained" onClick={handleSuccessClose} sx={{ minWidth: 150, borderRadius: 2 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotasCreditoPage;
