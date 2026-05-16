import { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { puestoApi } from '../../api/services/puestoApi';
import { fetchCatalogosSnapshot } from '../../api/services/catalogosCache';
import type {
  CreatePuestoDTO,
  PuestoResponseDTO,
  UpdatePuestoDTO,
  ObjetivoPuestoDTO,
  ResponsabilidadPuestoDTO,
  HabilidadPuestoDTO,
  ConocimientoPuestoDTO,
  ContactoPuestoDTO,
  PuestoCompetenciaDTO,
  PuestoRiesgoDTO,
  PuestoEppDTO,
  PuestoListDTO,
} from '../../types';
import type {
  Area,
  BandaJerarquica,
  Competencia,
  Departamento,
  Epp,
  LugarTrabajo,
  NivelEducacion,
  NivelExperiencia,
  NivelJerarquico,
  Riesgo,
  Sector,
  TipoFormacion,
  UnidadNegocio,
} from '../../types/catalogos.types';
import ListaSimpleEditor from './PuestoForm/ListaSimpleEditor';
import CatalogoMNSelector from './PuestoForm/CatalogoMNSelector';

interface Props {
  open: boolean;
  puestoId: number | null;
  onClose: () => void;
  onSave: () => void;
}

// Estado plano del formulario. Mantenemos las listas como arrays nullables
// porque el backend interpreta null=no tocar y array=replace.
interface FormState {
  // Identificación
  nombre: string;
  descripcion: string;
  departamentoLegacy: string;
  salarioBase: number | '';
  ciuo: string;
  volumenDotacion: number | '';

  // FKs
  unidadNegocioId: number | '';
  lugarTrabajoId: number | '';
  areaId: number | '';
  departamentoId: number | '';
  sectorId: number | '';
  bandaJerarquicaId: number | '';
  nivelJerarquicoId: number | '';
  reportaAPuestoId: number | '';
  nivelEducacionId: number | '';
  tipoFormacionId: number | '';
  nivelExperienciaId: number | '';

  // Manual
  mision: string;
  objetivoGeneral: string;
  requisitos: string;
  observacionesRequisitos: string;
  fechaRevision: string;

  // Listas
  objetivos: ObjetivoPuestoDTO[];
  responsabilidades: ResponsabilidadPuestoDTO[];
  habilidades: HabilidadPuestoDTO[];
  conocimientos: ConocimientoPuestoDTO[];
  contactos: ContactoPuestoDTO[];

  // M:N
  competencias: PuestoCompetenciaDTO[];
  riesgos: PuestoRiesgoDTO[];
  epps: PuestoEppDTO[];
  reemplazaPuestoIds: number[];

  // Meta
  activo: boolean;
  motivoCambio: string;
}

const EMPTY_FORM: FormState = {
  nombre: '',
  descripcion: '',
  departamentoLegacy: '',
  salarioBase: '',
  ciuo: '',
  volumenDotacion: '',
  unidadNegocioId: '',
  lugarTrabajoId: '',
  areaId: '',
  departamentoId: '',
  sectorId: '',
  bandaJerarquicaId: '',
  nivelJerarquicoId: '',
  reportaAPuestoId: '',
  nivelEducacionId: '',
  tipoFormacionId: '',
  nivelExperienciaId: '',
  mision: '',
  objetivoGeneral: '',
  requisitos: '',
  observacionesRequisitos: '',
  fechaRevision: '',
  objetivos: [],
  responsabilidades: [],
  habilidades: [],
  conocimientos: [],
  contactos: [],
  competencias: [],
  riesgos: [],
  epps: [],
  reemplazaPuestoIds: [],
  activo: true,
  motivoCambio: '',
};

interface Catalogos {
  unidadesNegocio: UnidadNegocio[];
  lugaresTrabajo: LugarTrabajo[];
  areas: Area[];
  departamentos: Departamento[];
  sectores: Sector[];
  bandas: BandaJerarquica[];
  niveles: NivelJerarquico[];
  competencias: Competencia[];
  riesgos: Riesgo[];
  epp: Epp[];
  nivelesEducacion: NivelEducacion[];
  tiposFormacion: TipoFormacion[];
  nivelesExperiencia: NivelExperiencia[];
  puestos: PuestoListDTO[];
}

const EMPTY_CATS: Catalogos = {
  unidadesNegocio: [], lugaresTrabajo: [], areas: [], departamentos: [], sectores: [],
  bandas: [], niveles: [], competencias: [], riesgos: [], epp: [],
  nivelesEducacion: [], tiposFormacion: [], nivelesExperiencia: [], puestos: [],
};

export default function PuestoFormDialog({ open, puestoId, onClose, onSave }: Props) {
  const isEditing = puestoId !== null;
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [cats, setCats] = useState<Catalogos>(EMPTY_CATS);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upd = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ─── Carga inicial: catálogos + (si edita) el puesto ─────────
  useEffect(() => {
    if (!open) return;
    setTab(0);
    setError(null);
    setForm(EMPTY_FORM);

    const loadCatalogos = async () => {
      try {
        const [snapshot, puestos] = await Promise.all([
          fetchCatalogosSnapshot(),
          puestoApi.getActivos(),
        ]);
        setCats({ ...snapshot, puestos });
      } catch {
        setError('No se pudieron cargar los catálogos de referencia');
      }
    };
    void loadCatalogos();

    if (puestoId) {
      setLoadingData(true);
      puestoApi
        .getById(puestoId)
        .then((d: PuestoResponseDTO) => {
          setForm({
            nombre: d.nombre ?? '',
            descripcion: d.descripcion ?? '',
            departamentoLegacy: d.departamento ?? '',
            salarioBase: d.salarioBase ?? '',
            ciuo: d.ciuo ?? '',
            volumenDotacion: d.volumenDotacion ?? '',
            unidadNegocioId: d.unidadNegocioId ?? '',
            lugarTrabajoId: d.lugarTrabajoId ?? '',
            areaId: d.areaId ?? '',
            departamentoId: d.departamentoId ?? '',
            sectorId: d.sectorId ?? '',
            bandaJerarquicaId: d.bandaJerarquicaId ?? '',
            nivelJerarquicoId: d.nivelJerarquicoId ?? '',
            reportaAPuestoId: d.reportaAPuestoId ?? '',
            nivelEducacionId: d.nivelEducacionId ?? '',
            tipoFormacionId: d.tipoFormacionId ?? '',
            nivelExperienciaId: d.nivelExperienciaId ?? '',
            mision: d.mision ?? '',
            objetivoGeneral: d.objetivoGeneral ?? '',
            requisitos: d.requisitos ?? '',
            observacionesRequisitos: d.observacionesRequisitos ?? '',
            fechaRevision: d.fechaRevision ?? '',
            objetivos: d.objetivos ?? [],
            responsabilidades: d.responsabilidades ?? [],
            habilidades: d.habilidades ?? [],
            conocimientos: d.conocimientos ?? [],
            contactos: d.contactos ?? [],
            competencias: d.competencias ?? [],
            riesgos: d.riesgos ?? [],
            epps: d.epps ?? [],
            reemplazaPuestoIds: (d.reemplaza ?? []).map((r) => r.puestoRelacionadoId),
            activo: d.activo ?? true,
            motivoCambio: '',
          });
        })
        .catch(() => setError('Error al cargar el puesto'))
        .finally(() => setLoadingData(false));
    }
  }, [open, puestoId]);

  // ─── Submit ─────────────────────────────────────────────────
  const buildPayload = (): CreatePuestoDTO | UpdatePuestoDTO => {
    const base: UpdatePuestoDTO = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || undefined,
      departamento: form.departamentoLegacy || undefined,
      salarioBase: form.salarioBase === '' ? undefined : Number(form.salarioBase),
      requisitos: form.requisitos || undefined,
      objetivoGeneral: form.objetivoGeneral || undefined,
      activo: form.activo,
      mision: form.mision || undefined,
      ciuo: form.ciuo || undefined,
      volumenDotacion: form.volumenDotacion === '' ? undefined : Number(form.volumenDotacion),
      fechaRevision: form.fechaRevision || undefined,
      observacionesRequisitos: form.observacionesRequisitos || undefined,
      unidadNegocioId: form.unidadNegocioId === '' ? undefined : Number(form.unidadNegocioId),
      lugarTrabajoId: form.lugarTrabajoId === '' ? undefined : Number(form.lugarTrabajoId),
      areaId: form.areaId === '' ? undefined : Number(form.areaId),
      departamentoId: form.departamentoId === '' ? undefined : Number(form.departamentoId),
      sectorId: form.sectorId === '' ? undefined : Number(form.sectorId),
      bandaJerarquicaId: form.bandaJerarquicaId === '' ? undefined : Number(form.bandaJerarquicaId),
      nivelJerarquicoId: form.nivelJerarquicoId === '' ? undefined : Number(form.nivelJerarquicoId),
      nivelEducacionId: form.nivelEducacionId === '' ? undefined : Number(form.nivelEducacionId),
      tipoFormacionId: form.tipoFormacionId === '' ? undefined : Number(form.tipoFormacionId),
      nivelExperienciaId: form.nivelExperienciaId === '' ? undefined : Number(form.nivelExperienciaId),
      reportaAPuestoId: form.reportaAPuestoId === '' ? undefined : Number(form.reportaAPuestoId),
      objetivos: form.objetivos,
      responsabilidades: form.responsabilidades,
      habilidades: form.habilidades,
      conocimientos: form.conocimientos,
      contactos: form.contactos,
      competencias: form.competencias,
      riesgos: form.riesgos,
      epps: form.epps,
      reemplazaPuestoIds: form.reemplazaPuestoIds,
      motivoCambio: isEditing ? (form.motivoCambio || undefined) : undefined,
    };
    return base;
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre del puesto es obligatorio');
      setTab(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (isEditing) {
        await puestoApi.update(puestoId!, payload as UpdatePuestoDTO);
      } else {
        await puestoApi.create(payload as CreatePuestoDTO);
      }
      onSave();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Error al guardar el puesto';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Sectores filtrados por departamento elegido ──────────────
  const sectoresFiltrados = useMemo(() => {
    if (form.departamentoId === '') return cats.sectores;
    return cats.sectores.filter((s) => s.departamentoId === Number(form.departamentoId));
  }, [cats.sectores, form.departamentoId]);

  // ─── Departamentos filtrados por área elegida ─────────────────
  const departamentosFiltrados = useMemo(() => {
    if (form.areaId === '') return cats.departamentos;
    return cats.departamentos.filter((d) => d.areaId === Number(form.areaId));
  }, [cats.departamentos, form.areaId]);

  // ─── Puestos disponibles como reporta/reemplaza (excluye al propio) ──
  const puestosDisponibles = useMemo(
    () => cats.puestos.filter((p) => p.id !== puestoId),
    [cats.puestos, puestoId]
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {isEditing ? `Editar puesto — ${form.nombre || '...'}` : 'Nuevo puesto'}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
      >
        <Tab label="Identificación" />
        <Tab label="Misión y Objetivos" />
        <Tab label="Responsabilidad y Autoridad" />
        <Tab label="Competencias" />
        <Tab label="Habilidades y Conocimientos" />
        <Tab label="Interacción Social" />
        <Tab label="Riesgos y EPP" />
        <Tab label="Requerimientos" />
        <Tab label="Reemplazos" />
        <Tab label="Revisión" />
      </Tabs>

      <DialogContent dividers sx={{ minHeight: 420 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loadingData ? (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
        ) : (
          <>
            {/* ============ 1. IDENTIFICACIÓN ============ */}
            {tab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth required label="Nombre del puesto"
                    value={form.nombre} onChange={(e) => upd('nombre', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="CIUO"
                    value={form.ciuo} onChange={(e) => upd('ciuo', e.target.value)}
                    helperText="Código CIUO (opcional)"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Unidad de Negocio"
                    value={form.unidadNegocioId}
                    onChange={(e) => upd('unidadNegocioId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.unidadesNegocio.map((u) => <MenuItem key={u.id} value={u.id}>{u.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Lugar de Trabajo"
                    value={form.lugarTrabajoId}
                    onChange={(e) => upd('lugarTrabajoId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.lugaresTrabajo.map((l) => <MenuItem key={l.id} value={l.id}>{l.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="Volumen de dotación" type="number"
                    value={form.volumenDotacion}
                    onChange={(e) => upd('volumenDotacion', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Área"
                    value={form.areaId}
                    onChange={(e) => {
                      upd('areaId', e.target.value === '' ? '' : Number(e.target.value));
                      // si cambia el área, limpiamos depto y sector
                      upd('departamentoId', ''); upd('sectorId', '');
                    }}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.areas.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Departamento"
                    value={form.departamentoId}
                    onChange={(e) => {
                      upd('departamentoId', e.target.value === '' ? '' : Number(e.target.value));
                      upd('sectorId', '');
                    }}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {departamentosFiltrados.map((d) => <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Sector"
                    value={form.sectorId}
                    onChange={(e) => upd('sectorId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {sectoresFiltrados.map((s) => <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Banda Jerárquica"
                    value={form.bandaJerarquicaId}
                    onChange={(e) => upd('bandaJerarquicaId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.bandas.map((b) => (
                      <MenuItem key={b.id} value={b.id}>{b.codigo} — {b.nombre}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Nivel Jerárquico"
                    value={form.nivelJerarquicoId}
                    onChange={(e) => upd('nivelJerarquicoId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.niveles.map((n) => <MenuItem key={n.id} value={n.id}>{n.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="Salario base" type="number"
                    value={form.salarioBase}
                    onChange={(e) => upd('salarioBase', e.target.value === '' ? '' : Number(e.target.value))}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select fullWidth label="Reporta a (puesto)"
                    value={form.reportaAPuestoId}
                    onChange={(e) => upd('reportaAPuestoId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>— Sin superior —</em></MenuItem>
                    {puestosDisponibles.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={2} label="Descripción / Resumen"
                    value={form.descripcion} onChange={(e) => upd('descripcion', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Departamento (texto libre legacy)"
                    value={form.departamentoLegacy}
                    onChange={(e) => upd('departamentoLegacy', e.target.value)}
                    helperText="Compatibilidad: se llena automáticamente con el nombre del departamento elegido si está vacío."
                  />
                </Grid>
              </Grid>
            )}

            {/* ============ 2. MISIÓN Y OBJETIVOS ============ */}
            {tab === 1 && (
              <Stack spacing={3}>
                <TextField
                  fullWidth multiline rows={4} label="Misión del puesto"
                  value={form.mision} onChange={(e) => upd('mision', e.target.value)}
                  helperText="Frase única que sintetiza el propósito del puesto."
                />
                <TextField
                  fullWidth multiline rows={3} label="Objetivo general"
                  value={form.objetivoGeneral} onChange={(e) => upd('objetivoGeneral', e.target.value)}
                />
                <Divider />
                <ListaSimpleEditor<ObjetivoPuestoDTO>
                  titulo="Objetivos específicos"
                  items={form.objetivos}
                  onChange={(items) => upd('objetivos', items)}
                  placeholder="Ej: Cumplir objetivos comerciales mensuales"
                  factoryItem={() => ({ descripcion: '', orden: form.objetivos.length, activo: true })}
                />
              </Stack>
            )}

            {/* ============ 3. RESPONSABILIDADES Y AUTORIDAD ============ */}
            {tab === 2 && (
              <ListaSimpleEditor<ResponsabilidadPuestoDTO>
                titulo="Responsabilidad y Autoridad"
                items={form.responsabilidades}
                onChange={(items) => upd('responsabilidades', items)}
                tipoOptions={[
                  { value: 'RESPONSABILIDAD', label: 'Responsabilidad' },
                  { value: 'AUTORIDAD', label: 'Autoridad' },
                ]}
                tipoKey="tipo"
                placeholder="Ej: Aprobar gastos de hasta $X"
                factoryItem={() => ({
                  tipo: 'RESPONSABILIDAD',
                  descripcion: '',
                  orden: form.responsabilidades.length,
                  activo: true,
                })}
              />
            )}

            {/* ============ 4. COMPETENCIAS ============ */}
            {tab === 3 && (
              <CatalogoMNSelector<PuestoCompetenciaDTO>
                titulo="Competencias requeridas"
                items={form.competencias}
                getCatalogoId={(it) => it.competenciaId}
                getCatalogoLabel={(it) =>
                  `${it.competenciaNombre ?? '—'}${it.competenciaTipo ? ` (${it.competenciaTipo})` : ''}`
                }
                options={cats.competencias.map((c) => ({ id: c.id, nombre: c.nombre, badge: c.tipo }))}
                onAdd={(id, label, badge) => ({
                  competenciaId: id,
                  competenciaNombre: label,
                  competenciaTipo: badge,
                  nivelRequerido: 3,
                })}
                onChange={(items) => upd('competencias', items)}
                renderItemExtras={(item, update) => (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="caption">Nivel: {item.nivelRequerido ?? 3}</Typography>
                    <Slider
                      value={item.nivelRequerido ?? 3} min={1} max={5} step={1}
                      marks valueLabelDisplay="auto"
                      onChange={(_, v) => update({ nivelRequerido: v as number })}
                      sx={{ maxWidth: 240 }}
                    />
                    <TextField
                      size="small" placeholder="Observaciones"
                      value={item.observaciones ?? ''}
                      onChange={(e) => update({ observaciones: e.target.value })}
                      sx={{ flexGrow: 1 }}
                    />
                  </Stack>
                )}
              />
            )}

            {/* ============ 5. HABILIDADES Y CONOCIMIENTOS ============ */}
            {tab === 4 && (
              <Stack spacing={3}>
                <ListaSimpleEditor<HabilidadPuestoDTO>
                  titulo="Habilidades"
                  items={form.habilidades}
                  onChange={(items) => upd('habilidades', items)}
                  placeholder="Ej: Comunicación efectiva"
                  factoryItem={() => ({ descripcion: '', orden: form.habilidades.length, activo: true })}
                />
                <Divider />
                <ListaSimpleEditor<ConocimientoPuestoDTO>
                  titulo="Conocimientos"
                  items={form.conocimientos}
                  onChange={(items) => upd('conocimientos', items)}
                  placeholder="Ej: Excel avanzado"
                  factoryItem={() => ({ descripcion: '', orden: form.conocimientos.length, activo: true })}
                />
              </Stack>
            )}

            {/* ============ 6. INTERACCIÓN SOCIAL ============ */}
            {tab === 5 && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Jerarquía (sólo lectura)</Typography>
                  <Stack direction="row" spacing={2}>
                    <Chip
                      label={`Reporta a: ${
                        cats.puestos.find((p) => p.id === Number(form.reportaAPuestoId))?.nombre ?? '— Sin asignar —'
                      }`}
                      variant="outlined"
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Para cambiar quién reporta a quién, usá la pestaña "Identificación".
                  </Typography>
                </Box>
                <Divider />
                <ListaSimpleEditor<ContactoPuestoDTO>
                  titulo="Contactos (internos y externos)"
                  items={form.contactos}
                  onChange={(items) => upd('contactos', items)}
                  tipoOptions={[
                    { value: 'INTERNO', label: 'Interno' },
                    { value: 'EXTERNO', label: 'Externo' },
                  ]}
                  tipoKey="tipo"
                  placeholder="Ej: Coordinación con Logística para entregas"
                  factoryItem={() => ({
                    tipo: 'INTERNO',
                    descripcion: '',
                    orden: form.contactos.length,
                    activo: true,
                  })}
                />
              </Stack>
            )}

            {/* ============ 7. RIESGOS Y EPP ============ */}
            {tab === 6 && (
              <Stack spacing={3}>
                <CatalogoMNSelector<PuestoRiesgoDTO>
                  titulo="Riesgos asociados al puesto"
                  items={form.riesgos}
                  getCatalogoId={(it) => it.riesgoId}
                  getCatalogoLabel={(it) =>
                    `${it.riesgoNombre ?? '—'}${it.nivelSeveridad ? ` — ${it.nivelSeveridad}` : ''}`
                  }
                  options={cats.riesgos.map((r) => ({ id: r.id, nombre: r.nombre, badge: r.nivelSeveridad }))}
                  onAdd={(id, label, badge) => ({
                    riesgoId: id, riesgoNombre: label, nivelSeveridad: badge,
                  })}
                  onChange={(items) => upd('riesgos', items)}
                  renderItemExtras={(item, update) => (
                    <TextField
                      size="small" fullWidth placeholder="Observaciones / controles"
                      value={item.observaciones ?? ''}
                      onChange={(e) => update({ observaciones: e.target.value })}
                    />
                  )}
                />
                <Divider />
                <CatalogoMNSelector<PuestoEppDTO>
                  titulo="Elementos de protección personal"
                  items={form.epps}
                  getCatalogoId={(it) => it.eppId}
                  getCatalogoLabel={(it) => it.eppNombre ?? '—'}
                  options={cats.epp.map((e) => ({ id: e.id, nombre: e.nombre }))}
                  onAdd={(id, label) => ({ eppId: id, eppNombre: label, obligatorio: true })}
                  onChange={(items) => upd('epps', items)}
                  renderItemExtras={(item, update) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={item.obligatorio ?? true}
                          onChange={(_, v) => update({ obligatorio: v })}
                        />
                      }
                      label="Obligatorio"
                    />
                  )}
                />
              </Stack>
            )}

            {/* ============ 8. REQUERIMIENTOS ============ */}
            {tab === 7 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Nivel de educación"
                    value={form.nivelEducacionId}
                    onChange={(e) => upd('nivelEducacionId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.nivelesEducacion.map((n) => <MenuItem key={n.id} value={n.id}>{n.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Tipo de formación"
                    value={form.tipoFormacionId}
                    onChange={(e) => upd('tipoFormacionId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.tiposFormacion.map((t) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select fullWidth label="Nivel de experiencia"
                    value={form.nivelExperienciaId}
                    onChange={(e) => upd('nivelExperienciaId', e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <MenuItem value=""><em>—</em></MenuItem>
                    {cats.nivelesExperiencia.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.nombre}{n.aniosMinimos ? ` (${n.aniosMinimos}+ años)` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={3} label="Requisitos (texto libre legacy)"
                    value={form.requisitos} onChange={(e) => upd('requisitos', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={3} label="Observaciones / requisitos adicionales"
                    value={form.observacionesRequisitos}
                    onChange={(e) => upd('observacionesRequisitos', e.target.value)}
                  />
                </Grid>
              </Grid>
            )}

            {/* ============ 9. REEMPLAZOS ============ */}
            {tab === 8 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Puestos que este puesto reemplaza cuando no está su titular
                </Typography>
                <Autocomplete
                  multiple
                  options={puestosDisponibles}
                  getOptionLabel={(o) => o.nombre}
                  value={puestosDisponibles.filter((p) => form.reemplazaPuestoIds.includes(p.id))}
                  onChange={(_, value) => upd('reemplazaPuestoIds', value.map((v) => v.id))}
                  renderInput={(p) => <TextField {...p} label="Puestos a reemplazar" />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option.nombre} {...getTagProps({ index })} key={option.id} />
                    ))
                  }
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  La relación inversa ("reemplazado por") se calcula automáticamente y se muestra en el detalle del puesto.
                </Typography>
              </Box>
            )}

            {/* ============ 10. REVISIÓN ============ */}
            {tab === 9 && (
              <Stack spacing={2}>
                <TextField
                  type="date" fullWidth label="Fecha de revisión"
                  InputLabelProps={{ shrink: true }}
                  value={form.fechaRevision}
                  onChange={(e) => upd('fechaRevision', e.target.value)}
                />
                {isEditing && (
                  <TextField
                    fullWidth label="Motivo del cambio"
                    value={form.motivoCambio}
                    onChange={(e) => upd('motivoCambio', e.target.value)}
                    helperText="Se registra en el historial de versiones (PuestoVersion)."
                  />
                )}
                <FormControlLabel
                  control={
                    <Switch checked={form.activo} onChange={(_, v) => upd('activo', v)} />
                  }
                  label="Puesto activo"
                />
                {isEditing && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Al guardar se incrementa la versión del puesto y se crea un snapshot completo
                      en el historial. Las listas (objetivos, competencias, etc.) que se modifiquen
                      acá reemplazarán el contenido actual.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || loadingData}>
          {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear puesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
