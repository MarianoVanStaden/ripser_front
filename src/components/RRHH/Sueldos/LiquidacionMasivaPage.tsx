// Liquidación masiva del mes: grilla editable con todos los empleados activos.
// Cada fila representa un sueldo a generar / actualizar. Los bonos por
// producción y ventas se disparan automáticamente desde los inputs globales
// de "Unidades producidas" y "Unidades vendidas" arriba. Adelantos del
// período se autocargan desde el módulo Adelantos. El usuario edita lo que
// haga falta (presentismo, HE, HA, KM, bono especial, descuentos) y guarda
// todo en una sola operación que hace upsert por empleado+período.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Checkbox, Chip,
  CircularProgress, FormControl, Grid, IconButton, InputAdornment, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Group as GroupIcon,
  CalendarMonth as CalendarIcon,
  AutoFixHigh as AutoFixHighIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { sueldoApi } from '../../../api/services/sueldoApi';
import { employeeApi } from '../../../api/services/employeeApi';
import { categoriaSalarialApi } from '../../../api/services/categoriaSalarialApi';
import { bonoProduccionApi } from '../../../api/services/bonoProduccionApi';
import { bonoVentasApi } from '../../../api/services/bonoVentasApi';
import { adelantoApi } from '../../../api/services/adelantoApi';
import type {
  Adelanto, BonoProduccionTabla, BonoVentasTabla,
  CategoriaSalarial, ConceptoSueldo, Empleado, Sueldo,
} from '../../../types';
import { CONCEPTO_SUELDO_LABELS, CONCEPTOS_SUELDO } from '../../../types/remuneraciones.types';
import { calcularRemuneracion } from '../../../utils/remuneracionesCalc';
import LoadingOverlay from '../../common/LoadingOverlay';

/** Estado editable por fila (un empleado). */
interface RowState {
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  categoriaSalarialId: number | null;
  concepto: ConceptoSueldo;
  presentismoPct: number;
  horasExtraCant: number;
  horasAusenteCant: number;
  kmCant: number;
  bonoEspecial: number;
  bonificaciones: number;
  comisiones: number;
  descuentosLegales: number;
  descuentosOtros: number;
  adelantos: number;
  fechaPago: string;
  observaciones: string;
  /** Si ya hay un Sueldo existente para este empleado+período (vamos a updatear, no crear). */
  existingId?: number;
  /** Marca para incluir o no en el bulk submit. */
  incluir: boolean;
}

const LiquidacionMasivaPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // ─── Filtros globales del período ───────────────────────────────────────
  const [periodo, setPeriodo] = useState<string>(dayjs().format('YYYY-MM'));
  const [concepto, setConcepto] = useState<ConceptoSueldo>('SALARIO');
  const [fechaPagoDefault, setFechaPagoDefault] = useState<string>('');
  const [unidadesProducidas, setUnidadesProducidas] = useState<number>(0);
  const [unidadesVendidas, setUnidadesVendidas] = useState<number>(0);
  // Auto-conteo del backend (referencia para mostrar al usuario y permitir override).
  const [unidadesAutoProducidas, setUnidadesAutoProducidas] = useState<number | null>(null);
  const [unidadesAutoVendidas, setUnidadesAutoVendidas] = useState<number | null>(null);
  const [loadingUnidades, setLoadingUnidades] = useState<boolean>(false);

  // Filtros de filtrado de filas
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaSalarial | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ocultarLiquidados, setOcultarLiquidados] = useState<boolean>(false);

  // ─── Data ──────────────────────────────────────────────────────────────
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [categorias, setCategorias] = useState<CategoriaSalarial[]>([]);
  const [bonosProduccion, setBonosProduccion] = useState<BonoProduccionTabla[]>([]);
  const [bonosVentas, setBonosVentas] = useState<BonoVentasTabla[]>([]);
  const [sueldosExistentes, setSueldosExistentes] = useState<Sueldo[]>([]);
  const [adelantosPeriodo, setAdelantosPeriodo] = useState<Adelanto[]>([]);

  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ─── Carga de datos ────────────────────────────────────────────────────
  const loadEverything = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [empleadosData, catsData, bonosP, bonosV] = await Promise.all([
        employeeApi.getAllList(),
        categoriaSalarialApi.getAll().catch(() => [] as CategoriaSalarial[]),
        bonoProduccionApi.getAll().catch(() => [] as BonoProduccionTabla[]),
        bonoVentasApi.getAll().catch(() => [] as BonoVentasTabla[]),
      ]);
      setEmpleados(Array.isArray(empleadosData) ? empleadosData : []);
      setCategorias(Array.isArray(catsData) ? catsData : []);
      setBonosProduccion(Array.isArray(bonosP) ? bonosP : []);
      setBonosVentas(Array.isArray(bonosV) ? bonosV : []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEverything(); }, [loadEverything]);

  // Recargo sueldos existentes + adelantos cuando cambia el período.
  const loadPeriodo = useCallback(async () => {
    if (!periodo) return;
    try {
      setError(null);
      const [sueldos, adelantos] = await Promise.all([
        sueldoApi.getByPeriodo(periodo).catch(() => [] as Sueldo[]),
        adelantoApi.getAll().catch(() => [] as Adelanto[]),
      ]);
      setSueldosExistentes(Array.isArray(sueldos) ? sueldos : []);
      const adelantosFiltrados = (Array.isArray(adelantos) ? adelantos : [])
        .filter(a => a.periodo === periodo);
      setAdelantosPeriodo(adelantosFiltrados);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el período');
    }
  }, [periodo]);

  useEffect(() => { loadPeriodo(); }, [loadPeriodo]);

  // Carga automática de unidades del mes (equipos fabricados + notas pedido
  // aprobadas) cuando cambia el período. El usuario puede sobreescribir los
  // valores con el input — eso queda registrado y NO recargamos al editar.
  useEffect(() => {
    if (!periodo) return;
    let cancelado = false;
    setLoadingUnidades(true);
    sueldoApi.getUnidadesMes(periodo)
      .then(r => {
        if (cancelado) return;
        setUnidadesAutoProducidas(r.producidas);
        setUnidadesAutoVendidas(r.vendidas);
        setUnidadesProducidas(r.producidas);
        setUnidadesVendidas(r.vendidas);
      })
      .catch(() => {/* mantener 0 si falla */})
      .finally(() => { if (!cancelado) setLoadingUnidades(false); });
    return () => { cancelado = true; };
  }, [periodo]);

  const resetUnidadesAuto = () => {
    if (unidadesAutoProducidas != null) setUnidadesProducidas(unidadesAutoProducidas);
    if (unidadesAutoVendidas != null) setUnidadesVendidas(unidadesAutoVendidas);
  };

  // Cuando tengo empleados + sueldosExistentes + adelantos → armar filas.
  // Sólo regenero la grilla cuando cambia el período o se recargan datos —
  // así no piso las ediciones del usuario en cada keystroke.
  useEffect(() => {
    if (empleados.length === 0) {
      setRows([]);
      return;
    }
    const activos = empleados.filter(e => e.estado === 'ACTIVO');
    const newRows: RowState[] = activos.map(emp => {
      const sueldoExistente = sueldosExistentes.find(s =>
        (s.empleadoId ?? s.empleado?.id) === emp.id,
      );
      const adelantoTotal = adelantosPeriodo
        .filter(a => a.empleadoId === emp.id)
        .reduce((sum, a) => sum + Number(a.monto || 0), 0);

      if (sueldoExistente) {
        // Ya tiene sueldo del mes — lo mostramos con sus valores actuales
        // pero DESMARCADO. Si el usuario quiere re-liquidar (corrección)
        // tilda manualmente; así evitamos sobreescribir sin querer.
        return {
          empleadoId: emp.id,
          empleadoNombre: emp.nombre,
          empleadoApellido: emp.apellido,
          categoriaSalarialId: sueldoExistente.categoriaSalarialId
            ?? emp.categoriaSalarialId
            ?? null,
          concepto: sueldoExistente.concepto ?? concepto,
          presentismoPct: Number(sueldoExistente.presentismoPct ?? 100),
          horasExtraCant: Number(sueldoExistente.horasExtraCant ?? 0),
          horasAusenteCant: Number(sueldoExistente.horasAusenteCant ?? 0),
          kmCant: Number(sueldoExistente.kmCant ?? 0),
          bonoEspecial: Number(sueldoExistente.bonoEspecial ?? 0),
          bonificaciones: Number(sueldoExistente.bonificaciones ?? 0),
          comisiones: Number(sueldoExistente.comisiones ?? 0),
          descuentosLegales: Number(sueldoExistente.descuentosLegales ?? 0),
          descuentosOtros: Number(sueldoExistente.descuentosOtros ?? 0),
          adelantos: Number(sueldoExistente.adelantos ?? adelantoTotal),
          fechaPago: sueldoExistente.fechaPago ?? fechaPagoDefault,
          observaciones: sueldoExistente.observaciones ?? '',
          existingId: sueldoExistente.id,
          incluir: false,
        };
      }
      // Empleado nuevo en el período: por default lo incluimos, salvo que no
      // tenga categoría salarial asignada (ahí no se puede liquidar igual).
      const tieneCategoria = emp.categoriaSalarialId != null;
      return {
        empleadoId: emp.id,
        empleadoNombre: emp.nombre,
        empleadoApellido: emp.apellido,
        categoriaSalarialId: emp.categoriaSalarialId ?? null,
        concepto,
        presentismoPct: 100,
        horasExtraCant: 0,
        horasAusenteCant: 0,
        kmCant: 0,
        bonoEspecial: 0,
        bonificaciones: 0,
        comisiones: 0,
        descuentosLegales: 0,
        descuentosOtros: 0,
        adelantos: adelantoTotal,
        fechaPago: fechaPagoDefault,
        observaciones: '',
        incluir: tieneCategoria,
      };
    });
    setRows(newRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleados, sueldosExistentes, adelantosPeriodo, periodo]);

  // ─── Helpers ───────────────────────────────────────────────────────────
  const updateRow = (idx: number, patch: Partial<RowState>) => {
    setRows(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  };

  const getCategoria = useCallback(
    (id: number | null): CategoriaSalarial | null =>
      id ? (categorias.find(c => c.id === id) ?? null) : null,
    [categorias],
  );

  const computeRow = useCallback((row: RowState) => {
    const categoria = getCategoria(row.categoriaSalarialId);
    if (!categoria) return null;
    const bonosProdCat = bonosProduccion.filter(b => b.categoriaSalarialId === categoria.id);
    const bonosVentasCat = bonosVentas.filter(b => b.categoriaSalarialId === categoria.id);
    return calcularRemuneracion({
      categoria,
      presentismoPct: row.presentismoPct,
      horasExtraCant: row.horasExtraCant,
      horasAusenteCant: row.horasAusenteCant,
      kmCant: row.kmCant,
      unidadesProducidas,
      unidadesVendidas,
      bonosProduccion: bonosProdCat,
      bonosVentas: bonosVentasCat,
      bonificaciones: row.bonificaciones,
      comisiones: row.comisiones,
      bonoEspecial: row.bonoEspecial,
      descuentosLegales: row.descuentosLegales,
      descuentosOtros: row.descuentosOtros,
      adelantos: row.adelantos,
    });
  }, [getCategoria, bonosProduccion, bonosVentas, unidadesProducidas, unidadesVendidas]);

  // Filas filtradas para mostrar
  const filteredRows = useMemo(() => {
    return rows
      .map((row, idx) => ({ row, idx }))   // mantengo el índice real para updates
      .filter(({ row }) => {
        if (ocultarLiquidados && row.existingId) return false;
        if (categoriaFiltro && row.categoriaSalarialId !== categoriaFiltro.id) return false;
        if (searchTerm) {
          const full = `${row.empleadoNombre} ${row.empleadoApellido}`.toLowerCase();
          if (!full.includes(searchTerm.toLowerCase())) return false;
        }
        return true;
      });
  }, [rows, categoriaFiltro, searchTerm, ocultarLiquidados]);

  // KPIs de las filas incluidas
  const totales = useMemo(() => {
    let bruto = 0;
    let descuentos = 0;
    let neto = 0;
    let conCategoria = 0;
    let incluidos = 0;
    rows.forEach(row => {
      if (!row.incluir) return;
      incluidos++;
      const calc = computeRow(row);
      if (!calc) return;
      conCategoria++;
      bruto += calc.totalBruto;
      descuentos += calc.totalDescuentos;
      neto += calc.sueldoNeto;
    });
    return { bruto, descuentos, neto, conCategoria, incluidos };
  }, [rows, computeRow]);

  // ─── Acciones globales ─────────────────────────────────────────────────
  const handleAplicarFechaPago = () => {
    if (!fechaPagoDefault) return;
    setRows(prev => prev.map(r => ({ ...r, fechaPago: fechaPagoDefault })));
  };
  const handleAplicarConcepto = () => {
    setRows(prev => prev.map(r => ({ ...r, concepto })));
  };
  const handleSelectAll = (checked: boolean) => {
    setRows(prev => prev.map(r => ({ ...r, incluir: checked })));
  };

  const handleLiquidar = async () => {
    setError(null);
    setSuccess(null);

    const aLiquidar = rows.filter(r => r.incluir);
    if (aLiquidar.length === 0) {
      setError('No hay empleados seleccionados para liquidar');
      return;
    }
    const sinCategoria = aLiquidar.filter(r => !r.categoriaSalarialId);
    if (sinCategoria.length > 0) {
      setError(`Hay ${sinCategoria.length} empleado(s) sin categoría salarial. Asignala en su ficha o quitalos del lote.`);
      return;
    }

    try {
      setSubmitting(true);
      const items = aLiquidar.map(row => {
        const calc = computeRow(row)!;
        return {
          empleadoId: row.empleadoId,
          categoriaSalarialId: row.categoriaSalarialId,
          periodo,
          concepto: row.concepto,
          sueldoBasico: calc.sueldoBasico,
          bonificaciones: calc.bonificaciones,
          horasExtras: calc.horasExtraMonto,
          horasExtraCant: row.horasExtraCant,
          comisiones: calc.comisiones,
          presentismoPct: row.presentismoPct,
          presentismoMonto: calc.presentismoMonto,
          kmCant: row.kmCant,
          kmMonto: calc.kmMonto,
          bonoProduccion: calc.bonoProduccion,
          bonoVentas: calc.bonoVentas,
          bonoEspecial: calc.bonoEspecial,
          totalBruto: calc.totalBruto,
          descuentosLegales: calc.descuentosLegales,
          descuentosOtros: calc.descuentosOtros,
          horasAusenteCant: row.horasAusenteCant,
          horasAusenteMonto: calc.horasAusenteMonto,
          adelantos: calc.adelantos,
          totalDescuentos: calc.totalDescuentos,
          sueldoNeto: calc.sueldoNeto,
          fechaPago: row.fechaPago || null,
          observaciones: row.observaciones?.trim() || null,
        };
      });

      const result = await sueldoApi.liquidarMasivo(items);
      setSuccess(`Liquidación masiva OK — ${result.length} sueldo(s) procesados (creados o actualizados).`);
      await loadPeriodo();   // refresca para que aparezcan los existingId
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Error al ejecutar la liquidación masiva');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  const renderNumCell = (
    idx: number,
    key: keyof RowState,
    width = 90,
    suffix?: string,
  ) => (
    <TextField
      size="small"
      type="number"
      value={(rows[idx] as any)[key]}
      onChange={(e) => {
        const v = e.target.value;
        updateRow(idx, { [key]: v === '' ? 0 : Number(v) } as Partial<RowState>);
      }}
      sx={{ width }}
      InputProps={{
        endAdornment: suffix ? <InputAdornment position="end">{suffix}</InputAdornment> : undefined,
      }}
    />
  );

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <LoadingOverlay open={loading} message="Cargando datos..." />

      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={() => navigate('/rrhh/sueldos')}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" fontWeight={700} color="primary" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          Liquidación masiva del mes
        </Typography>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Parámetros globales del lote */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
            Parámetros del mes
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                fullWidth size="small" type="month" label="Período *"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Concepto default</InputLabel>
                <Select
                  label="Concepto default"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value as ConceptoSueldo)}
                  endAdornment={
                    <Tooltip title="Aplicar a todas las filas">
                      <span>
                        <IconButton size="small" sx={{ mr: 2 }} onClick={handleAplicarConcepto}>
                          <AutoFixHighIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                >
                  {CONCEPTOS_SUELDO.map(c => (
                    <MenuItem key={c} value={c}>{CONCEPTO_SUELDO_LABELS[c]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                fullWidth size="small" type="date" label="Fecha de pago"
                value={fechaPagoDefault}
                onChange={(e) => setFechaPagoDefault(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Aplicar a todas las filas">
                        <span>
                          <IconButton size="small" onClick={handleAplicarFechaPago} disabled={!fechaPagoDefault}>
                            <AutoFixHighIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField
                fullWidth size="small" type="number" label="Unidades producidas"
                value={unidadesProducidas}
                onChange={(e) => setUnidadesProducidas(Number(e.target.value) || 0)}
                helperText={
                  loadingUnidades
                    ? 'Cargando...'
                    : unidadesAutoProducidas != null
                      ? `Auto: ${unidadesAutoProducidas} equipos fabricados`
                      : 'Dispara bono producción'
                }
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField
                fullWidth size="small" type="number" label="Unidades vendidas"
                value={unidadesVendidas}
                onChange={(e) => setUnidadesVendidas(Number(e.target.value) || 0)}
                helperText={
                  loadingUnidades
                    ? 'Cargando...'
                    : unidadesAutoVendidas != null
                      ? `Auto: ${unidadesAutoVendidas} unid. en notas aprobadas`
                      : 'Dispara bono ventas'
                }
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => { loadEverything(); loadPeriodo(); }}
                  size="small"
                >
                  Recargar
                </Button>
                {(unidadesAutoProducidas != null || unidadesAutoVendidas != null) && (
                  <Tooltip title="Restaurar valores auto (equipos fabricados / notas aprobadas)">
                    <span>
                      <Button
                        variant="text"
                        size="small"
                        onClick={resetUnidadesAuto}
                        disabled={loadingUnidades}
                      >
                        <AutoFixHighIcon fontSize="small" />
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPIs del lote */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">{totales.incluidos}</Typography>
                  <Typography variant="caption" color="textSecondary">Empleados a liquidar</Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 36, color: 'success.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    ${totales.bruto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Total bruto</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 36, color: 'primary.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color="error.main">
                    ${totales.descuentos.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Total descuentos</Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 36, color: 'error.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main', boxShadow: 1 }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" fontWeight={700} color="warning.main">
                    ${totales.neto.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">Total a pagar</Typography>
                </Box>
                <AccountBalanceIcon sx={{ fontSize: 36, color: 'warning.main', opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros de la grilla */}
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent sx={{ py: 1.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              size="small" label="Buscar empleado"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <Autocomplete
              size="small"
              options={categorias}
              value={categoriaFiltro}
              onChange={(_, v) => setCategoriaFiltro(v)}
              getOptionLabel={(c) => c.nombre}
              renderInput={(p) => <TextField {...p} label="Filtrar por categoría" />}
              sx={{ minWidth: 240 }}
            />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Checkbox
                size="small"
                checked={ocultarLiquidados}
                onChange={(e) => setOcultarLiquidados(e.target.checked)}
              />
              <Typography variant="body2">Ocultar ya liquidados</Typography>
            </Stack>
            <Typography variant="caption" color="textSecondary" alignSelf="center">
              Mostrando {filteredRows.length} de {rows.length} empleados activos
              {rows.filter(r => r.existingId).length > 0 && (
                <> · <strong>{rows.filter(r => r.existingId).length}</strong> ya tienen sueldo del mes</>
              )}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Grilla editable */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: '60vh' }}>
            <Table size="small" stickyHeader sx={{ minWidth: 1600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white' }} padding="checkbox">
                    <Checkbox
                      sx={{ color: 'white' }}
                      indeterminate={rows.some(r => r.incluir) && rows.some(r => !r.incluir)}
                      checked={rows.length > 0 && rows.every(r => r.incluir)}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>Empleado</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>Categoría</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">Pres %</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">HE cant</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">HA cant</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">KM</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="right">B.Prod (auto)</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="right">B.Ventas (auto)</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">B.Especial</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">Desc. legales</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">Otros desc.</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">Adelantos</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="right">Bruto</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="right">Neto</TableCell>
                  <TableCell sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }} align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        {rows.length === 0 ? 'Sin empleados activos.' : 'Ningún empleado coincide con el filtro.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map(({ row, idx }) => {
                  const calc = computeRow(row);
                  const categoria = getCategoria(row.categoriaSalarialId);
                  return (
                    <TableRow key={row.empleadoId} hover sx={{ opacity: row.incluir ? 1 : 0.5 }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={row.incluir}
                          onChange={(e) => updateRow(idx, { incluir: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {row.empleadoApellido}, {row.empleadoNombre}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          options={categorias.filter(c => c.activo !== false)}
                          value={categoria}
                          onChange={(_, v) => updateRow(idx, { categoriaSalarialId: v?.id ?? null })}
                          getOptionLabel={(c) => c.nombre}
                          renderInput={(p) => <TextField {...p} placeholder="—" />}
                          sx={{ minWidth: 170 }}
                        />
                      </TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'presentismoPct', 80, '%')}</TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'horasExtraCant', 70)}</TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'horasAusenteCant', 70)}</TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'kmCant', 70)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={calc && calc.bonoProduccion > 0 ? 'success.main' : 'textSecondary'} fontWeight={calc && calc.bonoProduccion > 0 ? 600 : 400}>
                          ${(calc?.bonoProduccion ?? 0).toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={calc && calc.bonoVentas > 0 ? 'success.main' : 'textSecondary'} fontWeight={calc && calc.bonoVentas > 0 ? 600 : 400}>
                          ${(calc?.bonoVentas ?? 0).toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'bonoEspecial', 100)}</TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'descuentosLegales', 100)}</TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'descuentosOtros', 100)}</TableCell>
                      <TableCell align="center">{renderNumCell(idx, 'adelantos', 100)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          ${(calc?.totalBruto ?? 0).toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          ${(calc?.sueldoNeto ?? 0).toLocaleString('es-AR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {!categoria ? (
                          <Chip label="Sin categoría" size="small" color="error" variant="outlined" />
                        ) : row.existingId ? (
                          <Chip label="Actualizar" size="small" color="warning" />
                        ) : (
                          <Chip label="Nuevo" size="small" color="success" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Acción final */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} flexWrap="wrap" gap={2}>
        <Typography variant="body2" color="textSecondary">
          <CalendarIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
          Liquidando período <strong>{dayjs(periodo).format('MMMM YYYY')}</strong> — {totales.incluidos} empleado(s) seleccionado(s), {totales.conCategoria} con categoría.
        </Typography>
        <Button
          variant="contained"
          size={isMobile ? 'medium' : 'large'}
          color="primary"
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          disabled={submitting || totales.incluidos === 0}
          onClick={handleLiquidar}
        >
          {submitting ? 'Liquidando...' : `Liquidar ${totales.incluidos} sueldo(s)`}
        </Button>
      </Box>
    </Box>
  );
};

export default LiquidacionMasivaPage;
