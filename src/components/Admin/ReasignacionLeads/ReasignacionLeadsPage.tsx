import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, LinearProgress,
  MenuItem, Paper, Stack, Step, StepLabel, Stepper, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import UndoIcon from '@mui/icons-material/Undo';
import { TablePagination } from '@mui/material';

import { useAuth } from '../../../context/AuthContext';
import { useTenant } from '../../../context/TenantContext';
import { usuarioApi } from '../../../api/services/usuarioApi';
import { leadApi } from '../../../api/services/leadApi';
import { leadReasignacionApi } from '../../../api/services/leadReasignacionApi';
import {
  MOTIVO_LABELS,
  type MotivoReasignacion,
  type ReasignacionModo,
  type ReasignacionRequest,
  type ReasignacionPreviewResponse,
  type ReasignacionResultado,
  type HistorialReasignacionLeadDTO,
} from '../../../types/leadReasignacion.types';
import type { LeadListItemDTO } from '../../../types/lead.types';
import { useSseEvent } from '../../../hooks/useSseEvent';
import { SSE_EVENTS } from '../../../lib/sse-contract';

interface Vendedor { id: number; nombre?: string; apellido?: string; username?: string }

const vendedorLabel = (v: Vendedor): string => {
  const full = `${v.nombre ?? ''} ${v.apellido ?? ''}`.trim();
  return full || v.username || `Usuario #${v.id}`;
};

const extractError = (err: any): string =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error desconocido';

const STEPS = ['Origen', 'Destino', 'Confirmar'];

const ReasignacionLeadsPage: React.FC = () => {
  const { user, esSuperAdmin } = useAuth();
  const { sucursales } = useTenant();

  const esAdminGlobal = useMemo(() => {
    if (esSuperAdmin) return true;
    const roles = (user?.roles ?? []) as string[];
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  }, [esSuperAdmin, user]);

  // Sucursal fija a la que queda acotado el supervisor (bloquea los selectores).
  // Convención del sistema: sucursalId NULL = supervisa TODAS las sucursales de la
  // empresa → no se bloquea, puede elegir libremente como un admin. Admin global
  // también queda sin restricción.
  const supervisorSucursalId = !esAdminGlobal ? (user?.sucursalId ?? null) : null;

  const [tab, setTab] = useState(0);

  // ---- catálogos ----
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  useEffect(() => {
    usuarioApi.getVendedores()
      .then((vs) => setVendedores((vs as unknown as Vendedor[]) ?? []))
      .catch(() => setVendedores([]));
  }, []);

  // ---- estado del flujo ----
  const [activeStep, setActiveStep] = useState(0);
  const [modo, setModo] = useState<ReasignacionModo>('TODOS_DE_VENDEDOR');
  const [vendedorOrigen, setVendedorOrigen] = useState<Vendedor | null>(null);
  const [sucursalOrigenId, setSucursalOrigenId] = useState<number | ''>(supervisorSucursalId ?? '');

  const [sucursalDestinoId, setSucursalDestinoId] = useState<number | ''>('');
  const [vendedorDestino, setVendedorDestino] = useState<Vendedor | null>(null);
  const [motivo, setMotivo] = useState<MotivoReasignacion>('REBALANCEO_CARGA');
  const [observaciones, setObservaciones] = useState('');

  // ---- selección de leads (modo LEADS_SELECCIONADOS) ----
  const [leadSearch, setLeadSearch] = useState('');
  const [leadVendedorFiltro, setLeadVendedorFiltro] = useState<Vendedor | null>(null);
  const [leadOrden, setLeadOrden] = useState<'desc' | 'asc'>('desc');
  const [leadOptions, setLeadOptions] = useState<LeadListItemDTO[]>([]);
  const [leadTotal, setLeadTotal] = useState(0);
  const [leadPage, setLeadPage] = useState(0);
  const [leadRowsPerPage, setLeadRowsPerPage] = useState(25);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set());
  // Guardamos la info (no solo el id) para poder listar los seleccionados aunque
  // estén en otra página/filtro.
  const [selectedLeadInfo, setSelectedLeadInfo] = useState<Map<number, LeadListItemDTO>>(new Map());
  const [verSelOpen, setVerSelOpen] = useState(false);

  // ---- preview / ejecución ----
  const [preview, setPreview] = useState<ReasignacionPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [resultado, setResultado] = useState<ReasignacionResultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildRequest = (withExpected = false): ReasignacionRequest => ({
    modo,
    leadIds: modo === 'LEADS_SELECCIONADOS' ? Array.from(selectedLeadIds) : undefined,
    vendedorOrigenId: modo === 'TODOS_DE_VENDEDOR' ? vendedorOrigen?.id ?? null : null,
    sucursalOrigenId: modo === 'TODOS_DE_SUCURSAL' ? (sucursalOrigenId || null) : null,
    vendedorDestinoId: vendedorDestino?.id ?? null,
    sucursalDestinoId: sucursalDestinoId || null,
    motivo,
    observaciones: observaciones.trim() || undefined,
    expectedCount: withExpected && preview ? preview.total : undefined,
  });

  // Carga de leads para selección manual.
  useEffect(() => {
    if (modo !== 'LEADS_SELECCIONADOS' || activeStep !== 0) return;
    let cancelled = false;
    setLoadingLeads(true);
    leadApi.getAll(
      { page: leadPage, size: leadRowsPerPage, sort: `fechaPrimerContacto,${leadOrden}` },
      {
        ...(supervisorSucursalId != null ? { sucursalId: supervisorSucursalId } : {}),
        ...(leadVendedorFiltro ? { usuarioId: leadVendedorFiltro.id } : {}),
        ...(leadSearch.trim() ? { busqueda: leadSearch.trim() } : {}),
      },
    )
      .then((res) => { if (!cancelled) { setLeadOptions(res.content ?? []); setLeadTotal(res.totalElements ?? 0); } })
      .catch(() => { if (!cancelled) { setLeadOptions([]); setLeadTotal(0); } })
      .finally(() => { if (!cancelled) setLoadingLeads(false); });
    return () => { cancelled = true; };
  }, [modo, activeStep, leadSearch, supervisorSucursalId, leadVendedorFiltro, leadOrden, leadPage, leadRowsPerPage]);

  const toggleLead = (lead: LeadListItemDTO) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(lead.id)) { next.delete(lead.id); } else { next.add(lead.id); }
      return next;
    });
    setSelectedLeadInfo((prev) => {
      const next = new Map(prev);
      if (next.has(lead.id)) { next.delete(lead.id); } else { next.set(lead.id, lead); }
      return next;
    });
  };

  const removeSeleccionado = (id: number) => {
    setSelectedLeadIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setSelectedLeadInfo((prev) => { const n = new Map(prev); n.delete(id); return n; });
  };

  const limpiarSeleccion = () => {
    setSelectedLeadIds(new Set());
    setSelectedLeadInfo(new Map());
  };

  // ---- validación por paso ----
  const step0Valid = useMemo(() => {
    if (modo === 'TODOS_DE_VENDEDOR') return !!vendedorOrigen;
    if (modo === 'TODOS_DE_SUCURSAL') return !!sucursalOrigenId;
    return selectedLeadIds.size > 0;
  }, [modo, vendedorOrigen, sucursalOrigenId, selectedLeadIds]);

  const step1Valid = useMemo(() => {
    // Debe haber al menos un destino (vendedor o sucursal) y un motivo.
    const hayDestino = !!vendedorDestino || !!sucursalDestinoId;
    return hayDestino && !!motivo;
  }, [vendedorDestino, sucursalDestinoId, motivo]);

  const goPreview = async () => {
    setError(null);
    setLoadingPreview(true);
    setPreview(null);
    try {
      const res = await leadReasignacionApi.preview(buildRequest(false));
      setPreview(res);
      setActiveStep(2);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoadingPreview(false);
    }
  };

  const doEjecutar = async () => {
    setError(null);
    setEjecutando(true);
    try {
      const res = await leadReasignacionApi.ejecutar(buildRequest(true));
      setResultado(res);
      setConfirmOpen(false);
      // reset selección para evitar reejecución accidental
      limpiarSeleccion();
    } catch (err) {
      setError(extractError(err));
      setConfirmOpen(false);
    } finally {
      setEjecutando(false);
    }
  };

  const resetFlujo = () => {
    setActiveStep(0);
    setPreview(null);
    setResultado(null);
    setError(null);
    setVendedorOrigen(null);
    setVendedorDestino(null);
    setSucursalDestinoId('');
    setObservaciones('');
    limpiarSeleccion();
    if (supervisorSucursalId == null) setSucursalOrigenId('');
  };

  // ============ RENDER ============
  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <SwapHorizIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Reasignación de Leads</Typography>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Reasignar" />
        <Tab label="Historial" />
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          {resultado ? (
            <ResultadoView resultado={resultado} onNuevo={resetFlujo} />
          ) : (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
              </Stepper>

              {/* PASO 0 — ORIGEN */}
              {activeStep === 0 && (
                <Stack spacing={2}>
                  <TextField
                    select label="¿Qué leads reasignar?" value={modo} fullWidth
                    onChange={(e) => setModo(e.target.value as ReasignacionModo)}
                  >
                    <MenuItem value="TODOS_DE_VENDEDOR">Todos los de un vendedor</MenuItem>
                    <MenuItem value="TODOS_DE_SUCURSAL">Todos los de una sucursal</MenuItem>
                    <MenuItem value="LEADS_SELECCIONADOS">Leads seleccionados</MenuItem>
                  </TextField>

                  {modo === 'TODOS_DE_VENDEDOR' && (
                    <Autocomplete
                      options={vendedores}
                      value={vendedorOrigen}
                      onChange={(_, v) => setVendedorOrigen(v)}
                      getOptionLabel={vendedorLabel}
                      isOptionEqualToValue={(o, v) => o.id === v.id}
                      renderInput={(p) => <TextField {...p} label="Vendedor origen" required />}
                    />
                  )}

                  {modo === 'TODOS_DE_SUCURSAL' && (
                    <TextField
                      select label="Sucursal origen" required fullWidth
                      value={sucursalOrigenId}
                      disabled={supervisorSucursalId != null}
                      onChange={(e) => setSucursalOrigenId(Number(e.target.value))}
                    >
                      {sucursales.map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                    </TextField>
                  )}

                  {modo === 'LEADS_SELECCIONADOS' && (
                    <Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                        <Autocomplete
                          sx={{ minWidth: 220, flex: 1 }}
                          size="small"
                          options={vendedores}
                          value={leadVendedorFiltro}
                          onChange={(_, v) => { setLeadVendedorFiltro(v); setLeadPage(0); }}
                          getOptionLabel={vendedorLabel}
                          isOptionEqualToValue={(o, v) => o.id === v.id}
                          renderInput={(p) => <TextField {...p} label="Filtrar por vendedor" />}
                        />
                        <TextField
                          select size="small" label="Orden" sx={{ minWidth: 200 }}
                          value={leadOrden}
                          onChange={(e) => { setLeadOrden(e.target.value as 'desc' | 'asc'); setLeadPage(0); }}
                        >
                          <MenuItem value="desc">Más nuevos primero</MenuItem>
                          <MenuItem value="asc">Más viejos primero</MenuItem>
                        </TextField>
                      </Stack>
                      <TextField
                        fullWidth size="small" placeholder="Buscar por nombre o teléfono…"
                        value={leadSearch} onChange={(e) => { setLeadSearch(e.target.value); setLeadPage(0); }}
                        InputProps={{ startAdornment: <SearchIcon fontSize="small" color="action" sx={{ mr: 1 }} /> }}
                        sx={{ mb: 1 }}
                      />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {selectedLeadIds.size} seleccionado(s)
                        </Typography>
                        <Button size="small" disabled={selectedLeadIds.size === 0} onClick={() => setVerSelOpen(true)}>
                          Ver
                        </Button>
                        <Button size="small" color="error" disabled={selectedLeadIds.size === 0} onClick={limpiarSeleccion}>
                          Limpiar
                        </Button>
                      </Stack>
                      <TableContainer sx={{ maxHeight: 320, mt: 1 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell padding="checkbox" />
                              <TableCell>Nombre</TableCell>
                              <TableCell>Teléfono</TableCell>
                              <TableCell>Estado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {loadingLeads && (
                              <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={22} /></TableCell></TableRow>
                            )}
                            {!loadingLeads && leadOptions.length === 0 && (
                              <TableRow><TableCell colSpan={4} align="center">Sin leads</TableCell></TableRow>
                            )}
                            {!loadingLeads && leadOptions.map((l) => (
                              <TableRow key={l.id} hover onClick={() => toggleLead(l)} sx={{ cursor: 'pointer' }}>
                                <TableCell padding="checkbox">
                                  <Checkbox checked={selectedLeadIds.has(l.id)} />
                                </TableCell>
                                <TableCell>{`${l.nombre ?? ''} ${l.apellido ?? ''}`.trim()}</TableCell>
                                <TableCell>{l.telefono}</TableCell>
                                <TableCell>{l.estadoLead}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <TablePagination
                        component="div"
                        count={leadTotal}
                        page={leadPage}
                        onPageChange={(_, p) => setLeadPage(p)}
                        rowsPerPage={leadRowsPerPage}
                        onRowsPerPageChange={(e) => { setLeadRowsPerPage(parseInt(e.target.value, 10)); setLeadPage(0); }}
                        rowsPerPageOptions={[25, 50, 100]}
                        labelRowsPerPage="Filas por página"
                      />
                    </Box>
                  )}
                </Stack>
              )}

              {/* PASO 1 — DESTINO */}
              {activeStep === 1 && (
                <Stack spacing={2}>
                  <TextField
                    select label="Sucursal destino" fullWidth
                    value={sucursalDestinoId}
                    disabled={supervisorSucursalId != null}
                    onChange={(e) => setSucursalDestinoId(e.target.value === '' ? '' : Number(e.target.value))}
                    helperText="Dejar vacío para no cambiar la sucursal."
                  >
                    <MenuItem value="">— No cambiar sucursal —</MenuItem>
                    {sucursales.map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                  </TextField>

                  <Autocomplete
                    options={vendedores}
                    value={vendedorDestino}
                    onChange={(_, v) => setVendedorDestino(v)}
                    getOptionLabel={vendedorLabel}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    renderInput={(p) => (
                      <TextField {...p} label="Vendedor destino"
                        helperText="Dejar vacío para que los leads queden sin asignar." />
                    )}
                  />

                  <TextField
                    select label="Motivo" required fullWidth value={motivo}
                    onChange={(e) => setMotivo(e.target.value as MotivoReasignacion)}
                  >
                    {Object.entries(MOTIVO_LABELS).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Observaciones" fullWidth multiline minRows={2}
                    value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                    inputProps={{ maxLength: 500 }}
                  />
                </Stack>
              )}

              {/* PASO 2 — CONFIRMAR (preview) */}
              {activeStep === 2 && (
                <Box>
                  {loadingPreview && <LinearProgress sx={{ mb: 2 }} />}
                  {preview && (
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Chip color="primary" label={`${preview.total} leads afectados`} />
                        {preview.yaEnDestino > 0 && (
                          <Chip color="default" label={`${preview.yaEnDestino} ya en destino (se omiten)`} />
                        )}
                        {preview.vendedorDestinoNombre
                          ? <Chip variant="outlined" label={`→ ${preview.vendedorDestinoNombre}`} />
                          : <Chip variant="outlined" label="→ Sin asignar" />}
                        {preview.sucursalDestinoNombre && (
                          <Chip variant="outlined" label={`Sucursal: ${preview.sucursalDestinoNombre}`} />
                        )}
                      </Stack>

                      {preview.advertencias.length > 0 && (
                        <Alert severity="warning">
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {preview.advertencias.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </Alert>
                      )}

                      <Divider />
                      <Typography variant="subtitle2">Muestra ({preview.muestra.length})</Typography>
                      <TableContainer sx={{ maxHeight: 280 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>ID</TableCell>
                              <TableCell>Nombre</TableCell>
                              <TableCell>Teléfono</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {preview.muestra.map((l) => (
                              <TableRow key={l.id}>
                                <TableCell>{l.id}</TableCell>
                                <TableCell>{`${l.nombre ?? ''} ${l.apellido ?? ''}`.trim()}</TableCell>
                                <TableCell>{l.telefono}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Stack>
                  )}
                </Box>
              )}

              {/* NAVEGACIÓN */}
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
                {activeStep > 0 && (
                  <Button onClick={() => setActiveStep((s) => s - 1)} disabled={loadingPreview}>Atrás</Button>
                )}
                {activeStep === 0 && (
                  <Button variant="contained" disabled={!step0Valid} onClick={() => setActiveStep(1)}>Siguiente</Button>
                )}
                {activeStep === 1 && (
                  <Button variant="contained" disabled={!step1Valid || loadingPreview} onClick={goPreview}>
                    Ver previsualización
                  </Button>
                )}
                {activeStep === 2 && (
                  <Button
                    variant="contained" color="warning"
                    disabled={!preview || preview.total === 0 || ejecutando}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Reasignar {preview ? `(${preview.total})` : ''}
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Paper>
      )}

      {tab === 1 && <HistorialTab vendedores={vendedores} />}

      {/* CONFIRMACIÓN */}
      <Dialog open={confirmOpen} onClose={() => !ejecutando && setConfirmOpen(false)}>
        <DialogTitle>Confirmar reasignación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vas a reasignar <strong>{preview?.total ?? 0}</strong> lead(s)
            {preview?.vendedorDestinoNombre ? <> a <strong>{preview.vendedorDestinoNombre}</strong></> : <> dejándolos <strong>sin asignar</strong></>}
            {preview?.sucursalDestinoNombre ? <> en la sucursal <strong>{preview.sucursalDestinoNombre}</strong></> : null}.
            Esta acción queda auditada y puede revisarse en el historial.
          </DialogContentText>
          {ejecutando && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={ejecutando}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={doEjecutar} disabled={ejecutando}>
            {ejecutando ? <CircularProgress size={20} /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VER / LIMPIAR SELECCIONADOS */}
      <Dialog open={verSelOpen} onClose={() => setVerSelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Leads seleccionados ({selectedLeadInfo.size})</DialogTitle>
        <DialogContent dividers>
          {selectedLeadInfo.size === 0 ? (
            <DialogContentText>No hay leads seleccionados.</DialogContentText>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell align="right">Quitar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(selectedLeadInfo.values()).map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.id}</TableCell>
                    <TableCell>{`${l.nombre ?? ''} ${l.apellido ?? ''}`.trim()}</TableCell>
                    <TableCell>{l.telefono}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Quitar de la selección">
                        <span>
                          <Checkbox checked onChange={() => removeSeleccionado(l.id)} />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="error" disabled={selectedLeadInfo.size === 0}
            onClick={() => { limpiarSeleccion(); setVerSelOpen(false); }}>
            Limpiar todo
          </Button>
          <Button variant="contained" onClick={() => setVerSelOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ============ RESULTADO ============
const ResultadoView: React.FC<{ resultado: ReasignacionResultado; onNuevo: () => void }> = ({ resultado, onNuevo }) => {
  const exportCsv = () => {
    const rows = [
      ['tipo', 'leadId', 'detalle'],
      ...resultado.reasignados.map((id) => ['reasignado', String(id), '']),
      ...resultado.omitidos.map((id) => ['omitido', String(id), 'ya en destino']),
      ...resultado.fallas.map((f) => ['falla', String(f.id), f.error]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reasignacion_${resultado.loteId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={2}>
      <Alert severity="success">
        Reasignación completada. Lote <code>{resultado.loteId}</code>.
      </Alert>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Chip color="success" label={`${resultado.cantidadAfectada} reasignados`} />
        <Chip color="default" label={`${resultado.cantidadOmitida} omitidos`} />
        {resultado.fallas.length > 0 && <Chip color="error" label={`${resultado.fallas.length} fallas`} />}
      </Stack>
      {resultado.fallas.length > 0 && (
        <Alert severity="error">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {resultado.fallas.slice(0, 10).map((f) => <li key={f.id}>Lead #{f.id}: {f.error}</li>)}
          </ul>
        </Alert>
      )}
      <Stack direction="row" spacing={1.5}>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv}>Exportar CSV</Button>
        <Button variant="contained" onClick={onNuevo}>Nueva reasignación</Button>
      </Stack>
    </Stack>
  );
};

// ============ HISTORIAL ============
const HistorialTab: React.FC<{ vendedores: Vendedor[] }> = ({ vendedores }) => {
  const [rows, setRows] = useState<HistorialReasignacionLeadDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loteARevertir, setLoteARevertir] = useState<string | null>(null);
  const [revirtiendo, setRevirtiendo] = useState(false);

  // ---- filtros + paginación ----
  const [vendedorFiltro, setVendedorFiltro] = useState<Vendedor | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const load = React.useCallback(() => {
    let cancelled = false;
    setLoading(true);
    leadReasignacionApi.getHistorial(
      { page, size: rowsPerPage },
      {
        ...(vendedorFiltro ? { vendedorId: vendedorFiltro.id } : {}),
        ...(fechaDesde ? { fechaDesde: `${fechaDesde}T00:00:00` } : {}),
        ...(fechaHasta ? { fechaHasta: `${fechaHasta}T23:59:59` } : {}),
      },
    )
      .then((res) => { if (!cancelled) { setRows(res.content ?? []); setTotal(res.totalElements ?? 0); } })
      .catch((err) => { if (!cancelled) setError(extractError(err)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, rowsPerPage, vendedorFiltro, fechaDesde, fechaHasta]);

  useEffect(() => { return load(); }, [load]);

  // Tiempo real: refrescar el historial cuando otro usuario reasigna/revierte.
  useSseEvent([SSE_EVENTS.LEAD_REASIGNADO], load);

  // Al cambiar un filtro, volver a la primera página.
  const onFiltroChange = (fn: () => void) => { setPage(0); fn(); };

  const doRevertir = async () => {
    if (!loteARevertir) return;
    setRevirtiendo(true);
    setError(null);
    try {
      const res = await leadReasignacionApi.revertirLote(loteARevertir);
      setInfo(`Lote revertido: ${res.cantidadAfectada} restaurado(s), ${res.cantidadOmitida} omitido(s)`
        + (res.fallas.length ? `, ${res.fallas.length} falla(s)` : '') + '.');
      setLoteARevertir(null);
      load();
    } catch (err) {
      setError(extractError(err));
      setLoteARevertir(null);
    } finally {
      setRevirtiendo(false);
    }
  };

  // El botón "Revertir" se muestra una sola vez por lote (en su primera fila).
  const lotesVistos = new Set<string>();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {info && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInfo(null)}>{info}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <Autocomplete
          sx={{ minWidth: 240 }}
          size="small"
          options={vendedores}
          value={vendedorFiltro}
          onChange={(_, v) => onFiltroChange(() => setVendedorFiltro(v))}
          getOptionLabel={vendedorLabel}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(p) => <TextField {...p} label="Vendedor (anterior o nuevo)" />}
        />
        <TextField
          size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }}
          value={fechaDesde} onChange={(e) => onFiltroChange(() => setFechaDesde(e.target.value))}
        />
        <TextField
          size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }}
          value={fechaHasta} onChange={(e) => onFiltroChange(() => setFechaHasta(e.target.value))}
        />
        {(vendedorFiltro || fechaDesde || fechaHasta) && (
          <Button size="small" onClick={() => onFiltroChange(() => { setVendedorFiltro(null); setFechaDesde(''); setFechaHasta(''); })}>
            Limpiar
          </Button>
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <TableContainer sx={{ maxHeight: 560 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Lead</TableCell>
              <TableCell>Vendedor anterior</TableCell>
              <TableCell>Vendedor nuevo</TableCell>
              <TableCell>Sucursal</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Lote</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && rows.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center">Sin reasignaciones registradas</TableCell></TableRow>
            )}
            {rows.map((h) => {
              const primeraDelLote = !lotesVistos.has(h.loteId);
              if (primeraDelLote) lotesVistos.add(h.loteId);
              return (
                <TableRow key={h.id} hover>
                  <TableCell>{new Date(h.fecha).toLocaleString()}</TableCell>
                  <TableCell>#{h.leadId}</TableCell>
                  <TableCell>{h.vendedorAnteriorNombre ?? '—'}</TableCell>
                  <TableCell>{h.vendedorNuevoNombre ?? 'Sin asignar'}</TableCell>
                  <TableCell>
                    {h.sucursalAnteriorNombre === h.sucursalNuevaNombre
                      ? (h.sucursalNuevaNombre ?? '—')
                      : `${h.sucursalAnteriorNombre ?? '—'} → ${h.sucursalNuevaNombre ?? '—'}`}
                  </TableCell>
                  <TableCell>{h.motivo ? (MOTIVO_LABELS[h.motivo] ?? h.motivo) : '—'}</TableCell>
                  <TableCell>{h.usuarioNombre ?? '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={h.loteId}><span>{h.loteId.slice(0, 8)}…</span></Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {primeraDelLote && (
                      <Button size="small" color="warning" startIcon={<UndoIcon />}
                        onClick={() => setLoteARevertir(h.loteId)}>
                        Revertir lote
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[25, 50, 100]}
        labelRowsPerPage="Filas por página"
      />

      <Dialog open={loteARevertir != null} onClose={() => !revirtiendo && setLoteARevertir(null)}>
        <DialogTitle>Revertir lote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se restaurará el vendedor y la sucursal anteriores de los leads del lote{' '}
            <code>{loteARevertir?.slice(0, 8)}…</code> que sigan tal como los dejó esa operación.
            Los leads modificados o borrados luego se omiten. Queda auditado como un lote inverso.
          </DialogContentText>
          {revirtiendo && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoteARevertir(null)} disabled={revirtiendo}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={doRevertir} disabled={revirtiendo}>
            {revirtiendo ? <CircularProgress size={20} /> : 'Revertir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ReasignacionLeadsPage;
