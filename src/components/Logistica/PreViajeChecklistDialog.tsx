// Checklist de pre-viaje: revisión obligatoria (mecánica, seguridad,
// documentación, carga) que el chofer completa y firma ANTES de iniciar el
// viaje. Persiste vía PUT /api/viajes/{id}/checklist; el backend bloquea el
// inicio y las entregas hasta que quede `completado`.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  FactCheck as FactCheckIcon,
} from '@mui/icons-material';
import { viajeApi } from '../../api/services/viajeApi';
import type { Viaje, ChecklistViaje, ChecklistViajeUpsert } from '../../types/logistica.types';

// ── Configuración de ítems agrupados (la clave mapea a `${key}Ok` / `${key}Obs`) ──
interface ItemDef { key: string; label: string }
interface GroupDef { title: string; items: ItemDef[] }

const GROUPS: GroupDef[] = [
  {
    title: 'Fluidos y mecánica',
    items: [
      { key: 'agua', label: 'Agua' },
      { key: 'aceite', label: 'Aceite' },
    ],
  },
  {
    title: 'Luces',
    items: [
      { key: 'lucesCamioneta', label: 'Luces camioneta' },
      { key: 'lucesTrailer', label: 'Luces trailer' },
    ],
  },
  {
    title: 'Seguridad y emergencia',
    items: [
      { key: 'auxilioCamioneta', label: 'Auxilio camioneta' },
      { key: 'auxilioTrailer', label: 'Auxilio trailer' },
      { key: 'llaveCruz', label: 'Llave cruz' },
      { key: 'matafuego', label: 'Matafuego' },
      { key: 'kitEmergencia', label: 'KIT de emergencia' },
    ],
  },
  {
    title: 'Estado del vehículo',
    items: [
      { key: 'rayonesAbolladuras', label: 'Rayones / abolladuras' },
      { key: 'parabrisas', label: 'Estado del parabrisas' },
      { key: 'tapizados', label: 'Tapizados' },
      { key: 'cubiertas', label: 'Cubiertas' },
    ],
  },
  {
    title: 'Documentación',
    items: [
      { key: 'seguro', label: 'Seguro' },
      { key: 'vencCarnet', label: 'Vencimiento del carnet' },
      { key: 'dni', label: 'DNI' },
      { key: 'cedulaVerde', label: 'Cédula verde' },
    ],
  },
  {
    title: 'Herramientas y carga',
    items: [
      { key: 'valijaHerramientas', label: 'Control de valija de herramientas' },
      { key: 'zunchos', label: 'Zunchos (cantidad y estado)' },
    ],
  },
];

const ALL_ITEMS: ItemDef[] = GROUPS.flatMap((g) => g.items);

type ItemState = { ok: boolean | null; obs: string };
type ItemsState = Record<string, ItemState>;

const emptyItems = (): ItemsState =>
  ALL_ITEMS.reduce((acc, it) => {
    acc[it.key] = { ok: null, obs: '' };
    return acc;
  }, {} as ItemsState);

interface Props {
  open: boolean;
  /** Viaje al que pertenece el checklist. En modo lectura basta con { id, numeroViaje }. */
  trip: Viaje | null;
  onClose: () => void;
  /** Se llama tras guardar un checklist `completado`. El padre inicia el viaje. */
  onCompleted?: (viajeId: number) => void;
  /** Solo lectura: muestra el checklist guardado sin poder editarlo ni iniciar el viaje. */
  readOnly?: boolean;
}

const PreViajeChecklistDialog: React.FC<Props> = ({ open, trip, onClose, onCompleted, readOnly = false }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [items, setItems] = useState<ItemsState>(emptyItems);
  const [trailer, setTrailer] = useState('');
  const [kmSalida, setKmSalida] = useState('');
  const [zunchosCantidad, setZunchosCantidad] = useState('');
  const [firmaChofer, setFirmaChofer] = useState('');
  const [firmado, setFirmado] = useState(false);
  const [loadedChecklist, setLoadedChecklist] = useState<ChecklistViaje | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill: carga el checklist existente (si lo hay) al abrir.
  useEffect(() => {
    if (!open || !trip) return;
    setError(null);
    setItems(emptyItems());
    setTrailer('');
    setKmSalida('');
    setZunchosCantidad('');
    setFirmaChofer(trip.conductorNombre ?? '');
    setFirmado(false);
    setLoadedChecklist(null);

    let cancelled = false;
    setLoading(true);
    viajeApi
      .getChecklist(trip.id)
      .then((cl: ChecklistViaje | null) => {
        if (cancelled || !cl) return;
        setLoadedChecklist(cl);
        const next = emptyItems();
        const raw = cl as unknown as Record<string, unknown>;
        ALL_ITEMS.forEach((it) => {
          const ok = raw[`${it.key}Ok`];
          const obs = raw[`${it.key}Obs`];
          next[it.key] = {
            ok: ok === true ? true : ok === false ? false : null,
            obs: typeof obs === 'string' ? obs : '',
          };
        });
        setItems(next);
        setTrailer(cl.trailer ?? '');
        setKmSalida(cl.kmSalida != null ? String(cl.kmSalida) : '');
        setZunchosCantidad(cl.zunchosCantidad != null ? String(cl.zunchosCantidad) : '');
        setFirmaChofer(cl.firmaChofer ?? trip.conductorNombre ?? '');
        setFirmado(!!cl.firmado);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [open, trip]);

  const setItem = (key: string, patch: Partial<ItemState>) =>
    setItems((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const reviewedCount = useMemo(
    () => ALL_ITEMS.filter((it) => items[it.key]?.ok != null).length,
    [items],
  );
  const allReviewed = reviewedCount === ALL_ITEMS.length;
  const isValid =
    allReviewed &&
    trailer.trim() !== '' &&
    kmSalida.trim() !== '' &&
    Number(kmSalida) >= 0 &&
    firmaChofer.trim() !== '' &&
    firmado;

  const handleSubmit = async () => {
    if (!trip || !isValid) return;
    setSaving(true);
    setError(null);

    const payload: ChecklistViajeUpsert = {
      trailer: trailer.trim(),
      kmSalida: Number(kmSalida),
      firmaChofer: firmaChofer.trim(),
      firmado: true,
      ...(zunchosCantidad.trim() !== '' ? { zunchosCantidad: Number(zunchosCantidad) } : {}),
    };
    const rawPayload = payload as unknown as Record<string, unknown>;
    ALL_ITEMS.forEach((it) => {
      const st = items[it.key];
      rawPayload[`${it.key}Ok`] = st.ok;
      if (st.obs.trim() !== '') rawPayload[`${it.key}Obs`] = st.obs.trim();
    });

    try {
      const saved = await viajeApi.saveChecklist(trip.id, payload);
      if (saved.completado) {
        onCompleted?.(trip.id);
        onClose();
      } else {
        setError('El checklist se guardó pero quedó incompleto. Revisá que todos los ítems estén marcados y firmado.');
      }
    } catch (err) {
      const e = err as { response?: { data?: unknown }; message?: string };
      const data = e.response?.data;
      const msg =
        typeof data === 'string'
          ? data
          : (data as { message?: string })?.message ?? e.message ?? 'No se pudo guardar el checklist';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // En modo lectura los datos vienen del snapshot firmado (checklist); en edición,
  // del viaje actual.
  const generales: [string, string][] = !trip
    ? []
    : readOnly && loadedChecklist
    ? [
        ['Viaje', trip.numeroViaje ?? loadedChecklist.numeroViaje ?? `#${trip.id}`],
        ['Conductor', loadedChecklist.conductorNombre ?? '—'],
        ['Acompañante', loadedChecklist.acompananteNombre ?? '—'],
        ['Vehículo', loadedChecklist.vehiculoPatente ?? '—'],
        ['Firmado por', loadedChecklist.usuarioNombre ?? '—'],
        ['Fecha', loadedChecklist.fechaChecklist ? new Date(loadedChecklist.fechaChecklist).toLocaleString() : '—'],
      ]
    : [
        ['Viaje', trip.numeroViaje ?? `#${trip.id}`],
        ['Destino', trip.destino ?? '—'],
        ['Conductor', trip.conductorNombre ?? '—'],
        ['Acompañante', trip.acompananteNombre ?? '—'],
        ['Vehículo', trip.vehiculoPatente ?? '—'],
      ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 6 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <FactCheckIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>Checklist de pre-viaje</Typography>
          {readOnly && <Chip size="small" label="Solo lectura" variant="outlined" />}
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Datos generales */}
        <Grid container spacing={1.5} sx={{ mb: 1 }}>
          {generales.map(([label, value]) => (
            <Grid item xs={6} sm={4} key={label}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={500} noWrap>{value}</Typography>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1.5} sx={{ mt: 0 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Trailer" required={!readOnly} fullWidth size="small" disabled={readOnly}
              value={trailer} onChange={(e) => setTrailer(e.target.value)}
              placeholder="Identificación del trailer"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Kilómetros de salida" required={!readOnly} fullWidth size="small" type="number" disabled={readOnly}
              value={kmSalida} onChange={(e) => setKmSalida(e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Revisión</Typography>
          <Chip
            size="small"
            color={allReviewed ? 'success' : 'default'}
            label={`${reviewedCount}/${ALL_ITEMS.length} revisados`}
          />
        </Box>

        {loading ? (
          <Typography variant="body2" color="text.secondary">Cargando checklist…</Typography>
        ) : (
          GROUPS.map((group) => {
            const groupReviewed = group.items.filter((it) => items[it.key]?.ok != null).length;
            const groupComplete = groupReviewed === group.items.length;
            return (
              <Accordion key={group.title} defaultExpanded disableGutters sx={{ mb: 0.5 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    {groupComplete
                      ? <CheckCircleIcon fontSize="small" color="success" />
                      : <ErrorOutlineIcon fontSize="small" color="disabled" />}
                    <Typography variant="body2" fontWeight={600}>{group.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {groupReviewed}/{group.items.length}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {group.items.map((it) => {
                      const st = items[it.key] ?? { ok: null, obs: '' };
                      const isZunchos = it.key === 'zunchos';
                      return (
                        <Box key={it.key}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={5}>
                              <Typography variant="body2">{it.label}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={7}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <ToggleButtonGroup
                                  size="small"
                                  exclusive
                                  disabled={readOnly}
                                  value={st.ok === true ? 'ok' : st.ok === false ? 'no' : null}
                                  onChange={(_e, val) =>
                                    setItem(it.key, { ok: val === 'ok' ? true : val === 'no' ? false : null })
                                  }
                                >
                                  <ToggleButton value="ok" color="success">Conforme</ToggleButton>
                                  <ToggleButton value="no" color="error">Falla</ToggleButton>
                                </ToggleButtonGroup>
                                {isZunchos && (
                                  <TextField
                                    label="Cant." size="small" type="number" sx={{ width: 90 }} disabled={readOnly}
                                    value={zunchosCantidad}
                                    onChange={(e) => setZunchosCantidad(e.target.value)}
                                    inputProps={{ min: 0 }}
                                  />
                                )}
                              </Stack>
                            </Grid>
                          </Grid>
                          <TextField
                            placeholder="Observaciones (opcional)"
                            fullWidth size="small" variant="standard" sx={{ mt: 0.5 }} disabled={readOnly}
                            value={st.obs}
                            onChange={(e) => setItem(it.key, { obs: e.target.value })}
                            error={!readOnly && st.ok === false && st.obs.trim() === ''}
                            helperText={!readOnly && st.ok === false && st.obs.trim() === '' ? 'Detallá la falla' : undefined}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}

        <Divider sx={{ my: 2 }} />

        {/* Firma */}
        <TextField
          label="Firma del chofer (nombre y apellido)" required={!readOnly} fullWidth size="small" disabled={readOnly}
          value={firmaChofer} onChange={(e) => setFirmaChofer(e.target.value)}
        />
        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Checkbox checked={firmado} disabled={readOnly} onChange={(e) => setFirmado(e.target.checked)} />}
          label="Confirmo que realicé la revisión y firmo este checklist."
        />

        {!readOnly && !allReviewed && !loading && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Marcá todos los ítems (Conforme o Falla) para poder iniciar el viaje. Una falla no impide salir: queda registrada.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>{error}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>{readOnly ? 'Cerrar' : 'Cancelar'}</Button>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isValid || saving || loading}
            startIcon={<CheckCircleIcon />}
          >
            {saving ? 'Guardando…' : 'Guardar e iniciar viaje'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PreViajeChecklistDialog;
