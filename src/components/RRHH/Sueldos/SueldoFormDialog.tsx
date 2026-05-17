import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  TextField, Grid, Autocomplete, InputAdornment, Card, Divider, MenuItem,
  useMediaQuery, useTheme, Stack, Tooltip, IconButton,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type {
  Adelanto, BonoProduccionTabla, BonoVentasTabla, CategoriaSalarial,
  ConceptoSueldo, Empleado, Sueldo,
} from '../../../types';
import { CONCEPTO_SUELDO_LABELS, CONCEPTOS_SUELDO } from '../../../types/remuneraciones.types';
import { calcularRemuneracion } from '../../../utils/remuneracionesCalc';
import { adelantoApi } from '../../../api/services/adelantoApi';

interface Props {
  open: boolean;
  empleados: Empleado[];
  categorias: CategoriaSalarial[];
  bonosProduccion: BonoProduccionTabla[];
  bonosVentas: BonoVentasTabla[];
  editing: Sueldo | null;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}

interface FormState {
  empleadoId: number | null;
  categoriaSalarialId: number | null;
  periodo: string;
  concepto: ConceptoSueldo;
  presentismoPct: number;
  horasExtraCant: number;
  horasAusenteCant: number;
  kmCant: number;
  unidadesProducidas: number;
  unidadesVendidas: number;
  bonificaciones: number;
  comisiones: number;
  bonoEspecial: number;
  descuentosLegales: number;
  descuentosOtros: number;
  adelantos: number;
  fechaPago: string;
  observaciones: string;
}

const buildEmptyForm = (): FormState => ({
  empleadoId: null,
  categoriaSalarialId: null,
  periodo: dayjs().format('YYYY-MM'),
  concepto: 'SALARIO',
  presentismoPct: 100,
  horasExtraCant: 0,
  horasAusenteCant: 0,
  kmCant: 0,
  unidadesProducidas: 0,
  unidadesVendidas: 0,
  bonificaciones: 0,
  comisiones: 0,
  bonoEspecial: 0,
  descuentosLegales: 0,
  descuentosOtros: 0,
  adelantos: 0,
  fechaPago: '',
  observaciones: '',
});

const SueldoFormDialog: React.FC<Props> = ({
  open, empleados, categorias, bonosProduccion, bonosVentas,
  editing, onClose, onSubmit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [form, setForm] = useState<FormState>(buildEmptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAdelantos, setLoadingAdelantos] = useState(false);
  const [adelantosDelMes, setAdelantosDelMes] = useState<Adelanto[]>([]);

  // Reset form on open / editing change
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setForm({
        empleadoId: editing.empleado?.id ?? editing.empleadoId ?? null,
        categoriaSalarialId: editing.categoriaSalarialId ?? null,
        periodo: editing.periodo,
        concepto: editing.concepto ?? 'SALARIO',
        presentismoPct: Number(editing.presentismoPct ?? 100),
        horasExtraCant: Number(editing.horasExtraCant ?? 0),
        horasAusenteCant: Number(editing.horasAusenteCant ?? 0),
        kmCant: Number(editing.kmCant ?? 0),
        unidadesProducidas: 0,
        unidadesVendidas: 0,
        bonificaciones: Number(editing.bonificaciones ?? 0),
        comisiones: Number(editing.comisiones ?? 0),
        bonoEspecial: Number(editing.bonoEspecial ?? 0),
        descuentosLegales: Number(editing.descuentosLegales ?? 0),
        descuentosOtros: Number(editing.descuentosOtros ?? 0),
        adelantos: Number(editing.adelantos ?? 0),
        fechaPago: editing.fechaPago ?? '',
        observaciones: editing.observaciones ?? '',
      });
    } else {
      setForm(buildEmptyForm());
    }
  }, [open, editing]);

  // Cargar total de adelantos del empleado+período (autocompleta el campo).
  useEffect(() => {
    if (!form.empleadoId || !form.periodo) {
      setAdelantosDelMes([]);
      return;
    }
    let cancelado = false;
    setLoadingAdelantos(true);
    adelantoApi.getByEmpleadoPeriodo(form.empleadoId, form.periodo)
      .then(list => {
        if (cancelado) return;
        setAdelantosDelMes(list);
        // Solo auto-precargar si el form NO está editando un valor previo
        // o si el valor actual = 0 (es decir, no fue editado manualmente).
        if (!editing || Number(editing.adelantos ?? 0) === 0) {
          const total = list.reduce((s, a) => s + Number(a.monto || 0), 0);
          setForm(prev => ({ ...prev, adelantos: total }));
        }
      })
      .catch(() => {/* silencioso, sigue con el valor actual */})
      .finally(() => { if (!cancelado) setLoadingAdelantos(false); });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.empleadoId, form.periodo]);

  const categoria = useMemo(
    () => categorias.find(c => c.id === form.categoriaSalarialId) ?? null,
    [categorias, form.categoriaSalarialId],
  );

  const bonosProdCategoria = useMemo(
    () => bonosProduccion.filter(b => b.categoriaSalarialId === form.categoriaSalarialId),
    [bonosProduccion, form.categoriaSalarialId],
  );
  const bonosVentasCategoria = useMemo(
    () => bonosVentas.filter(b => b.categoriaSalarialId === form.categoriaSalarialId),
    [bonosVentas, form.categoriaSalarialId],
  );

  const calc = useMemo(() => {
    if (!categoria) return null;
    return calcularRemuneracion({
      categoria,
      presentismoPct: form.presentismoPct,
      horasExtraCant: form.horasExtraCant,
      horasAusenteCant: form.horasAusenteCant,
      kmCant: form.kmCant,
      unidadesProducidas: form.unidadesProducidas,
      unidadesVendidas: form.unidadesVendidas,
      bonosProduccion: bonosProdCategoria,
      bonosVentas: bonosVentasCategoria,
      bonificaciones: form.bonificaciones,
      comisiones: form.comisiones,
      bonoEspecial: form.bonoEspecial,
      descuentosLegales: form.descuentosLegales,
      descuentosOtros: form.descuentosOtros,
      adelantos: form.adelantos,
    });
  }, [categoria, form, bonosProdCategoria, bonosVentasCategoria]);

  const setNumberField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm(prev => ({ ...prev, [key]: v === '' ? 0 : Number(v) }));
  };

  const handleRefetchAdelantos = async () => {
    if (!form.empleadoId || !form.periodo) return;
    try {
      const total = await adelantoApi.getTotalByEmpleadoPeriodo(form.empleadoId, form.periodo);
      setForm(prev => ({ ...prev, adelantos: total }));
    } catch {/* noop */}
  };

  const handleSave = async () => {
    if (!form.empleadoId) { setError('Seleccione un empleado'); return; }
    if (!form.categoriaSalarialId) { setError('Seleccione una categoría salarial'); return; }
    if (!form.periodo) { setError('Indique un período'); return; }
    if (!calc) { setError('Calculadora no disponible'); return; }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        empleadoId: form.empleadoId,
        categoriaSalarialId: form.categoriaSalarialId,
        periodo: form.periodo,
        concepto: form.concepto,
        sueldoBasico: calc.sueldoBasico,
        bonificaciones: calc.bonificaciones,
        horasExtras: calc.horasExtraMonto,
        horasExtraCant: form.horasExtraCant,
        comisiones: calc.comisiones,
        presentismoPct: form.presentismoPct,
        presentismoMonto: calc.presentismoMonto,
        kmCant: form.kmCant,
        kmMonto: calc.kmMonto,
        bonoProduccion: calc.bonoProduccion,
        bonoVentas: calc.bonoVentas,
        bonoEspecial: calc.bonoEspecial,
        totalBruto: calc.totalBruto,
        descuentosLegales: calc.descuentosLegales,
        descuentosOtros: calc.descuentosOtros,
        horasAusenteCant: form.horasAusenteCant,
        horasAusenteMonto: calc.horasAusenteMonto,
        adelantos: calc.adelantos,
        totalDescuentos: calc.totalDescuentos,
        sueldoNeto: calc.sueldoNeto,
        fechaPago: form.fechaPago || null,
        observaciones: form.observaciones?.trim() || null,
      };

      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al guardar el sueldo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <MoneyIcon />
          <Typography variant="h6" fontWeight={600}>
            {editing ? 'Editar Sueldo' : 'Nuevo Sueldo'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Box mb={2}>
            <Card variant="outlined" sx={{ p: 1.5, bgcolor: 'error.lighter', borderColor: 'error.main' }}>
              <Typography color="error" variant="body2">{error}</Typography>
            </Card>
          </Box>
        )}

        <Grid container spacing={2}>
          {/* Empleado / Categoría / Período / Concepto */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={empleados}
              value={empleados.find(e => e.id === form.empleadoId) ?? null}
              onChange={(_, v) => {
                // Al elegir empleado, autoprecargar su categoría salarial por
                // default (si tiene). El usuario puede sobreescribir manual.
                // No sobreescribimos si ya hay un sueldo en edición.
                const nuevaCategoria = !editing && v?.categoriaSalarialId
                  ? v.categoriaSalarialId
                  : form.categoriaSalarialId;
                setForm({
                  ...form,
                  empleadoId: v?.id ?? null,
                  categoriaSalarialId: nuevaCategoria,
                });
              }}
              getOptionLabel={(e) => `${e.nombre} ${e.apellido}`}
              renderInput={(p) => (
                <TextField {...p} label="Empleado *"
                  helperText={
                    form.empleadoId
                      ? (empleados.find(e => e.id === form.empleadoId)?.categoriaSalarialNombre
                        ? `Categoría asignada: ${empleados.find(e => e.id === form.empleadoId)?.categoriaSalarialNombre}`
                        : 'Sin categoría asignada en su ficha — elegila manualmente')
                      : ' '
                  }
                />
              )}
              disabled={!!editing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={categorias.filter(c => c.activo !== false)}
              value={categorias.find(c => c.id === form.categoriaSalarialId) ?? null}
              onChange={(_, v) => setForm({ ...form, categoriaSalarialId: v?.id ?? null })}
              getOptionLabel={(c) => c.nombre}
              renderInput={(p) => <TextField {...p} label="Categoría salarial *" />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth type="month" label="Período *"
              value={form.periodo}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth select label="Concepto"
              value={form.concepto}
              onChange={(e) => setForm({ ...form, concepto: e.target.value as ConceptoSueldo })}
            >
              {CONCEPTOS_SUELDO.map(c => (
                <MenuItem key={c} value={c}>{CONCEPTO_SUELDO_LABELS[c]}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth type="date" label="Fecha de Pago"
              value={form.fechaPago}
              onChange={(e) => setForm({ ...form, fechaPago: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Asistencia */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" fontWeight={600}>Asistencia</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Presentismo (%)"
              value={form.presentismoPct}
              onChange={setNumberField('presentismoPct')}
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              helperText="0 a 100"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Horas Extra (cant.)"
              value={form.horasExtraCant} onChange={setNumberField('horasExtraCant')}
              helperText={categoria ? `${categoria.horaExtraValor.toLocaleString('es-AR')} $/h` : ''}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Horas Ausente (cant.)"
              value={form.horasAusenteCant} onChange={setNumberField('horasAusenteCant')}
              helperText={categoria ? `${categoria.horaAusenteValor.toLocaleString('es-AR')} $/h` : ''}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Km recorridos"
              value={form.kmCant} onChange={setNumberField('kmCant')}
              helperText={categoria ? `${categoria.kmValor.toLocaleString('es-AR')} $/km` : ''}
            />
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Bonos */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="primary" fontWeight={600}>Bonos del mes</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Heladeras producidas"
              value={form.unidadesProducidas} onChange={setNumberField('unidadesProducidas')}
              helperText={bonosProdCategoria.length > 0
                ? `Tabla: ${bonosProdCategoria.map(b => b.umbralUnidades).join(', ')}`
                : 'Sin tabla configurada'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Unidades vendidas"
              value={form.unidadesVendidas} onChange={setNumberField('unidadesVendidas')}
              helperText={bonosVentasCategoria.length > 0
                ? `Tabla: ${bonosVentasCategoria.map(b => b.umbralUnidades).join(', ')}`
                : 'Sin tabla configurada'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Bono Especial"
              value={form.bonoEspecial} onChange={setNumberField('bonoEspecial')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Comisiones"
              value={form.comisiones} onChange={setNumberField('comisiones')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth type="number" label="Bonificaciones (libre)"
              value={form.bonificaciones} onChange={setNumberField('bonificaciones')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          {/* Descuentos / Adelantos */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="error" fontWeight={600}>Descuentos y Adelantos</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth type="number" label="Descuentos Legales"
              value={form.descuentosLegales} onChange={setNumberField('descuentosLegales')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth type="number" label="Otros Descuentos"
              value={form.descuentosOtros} onChange={setNumberField('descuentosOtros')}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth type="number" label="Adelantos del período"
              value={form.adelantos} onChange={setNumberField('adelantos')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Refrescar desde módulo Adelantos">
                      <span>
                        <IconButton size="small" onClick={handleRefetchAdelantos} disabled={loadingAdelantos || !form.empleadoId}>
                          <AutoAwesomeIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              helperText={adelantosDelMes.length > 0
                ? `${adelantosDelMes.length} adelanto(s) cargados en /rrhh/adelantos`
                : 'Editable manualmente'}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={2} label="Observaciones"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </Grid>

          {/* Resumen calculado */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50', p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <CalculateIcon color="primary" />
                <Typography variant="subtitle2" fontWeight={700} color="primary">
                  Resumen calculado en tiempo real
                </Typography>
              </Stack>

              {!categoria ? (
                <Typography variant="body2" color="textSecondary">
                  Seleccione una categoría salarial para ver el desglose.
                </Typography>
              ) : calc && (
                <Grid container spacing={1.5}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Sueldo Básico</Typography>
                    <Typography variant="body2" fontWeight={600}>${calc.sueldoBasico.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Presentismo</Typography>
                    <Typography variant="body2">${calc.presentismoMonto.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Horas Extra</Typography>
                    <Typography variant="body2">${calc.horasExtraMonto.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">KM</Typography>
                    <Typography variant="body2">${calc.kmMonto.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Bono Producción</Typography>
                    <Typography variant="body2">${calc.bonoProduccion.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Bono Ventas</Typography>
                    <Typography variant="body2">${calc.bonoVentas.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Bono Especial</Typography>
                    <Typography variant="body2">${calc.bonoEspecial.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Comisiones + Bonif.</Typography>
                    <Typography variant="body2">${(calc.comisiones + calc.bonificaciones).toLocaleString('es-AR')}</Typography>
                  </Grid>

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Horas Ausente</Typography>
                    <Typography variant="body2" color="error.main">- ${calc.horasAusenteMonto.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Adelantos</Typography>
                    <Typography variant="body2" color="error.main">- ${calc.adelantos.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Descuentos Legales</Typography>
                    <Typography variant="body2" color="error.main">- ${calc.descuentosLegales.toLocaleString('es-AR')}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="textSecondary">Otros Descuentos</Typography>
                    <Typography variant="body2" color="error.main">- ${calc.descuentosOtros.toLocaleString('es-AR')}</Typography>
                  </Grid>

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">Total Bruto</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      ${calc.totalBruto.toLocaleString('es-AR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">Total Descuentos</Typography>
                    <Typography variant="h6" color="error.main" fontWeight={700}>
                      ${calc.totalDescuentos.toLocaleString('es-AR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="textSecondary">Sueldo Neto</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={700}>
                      ${calc.sueldoNeto.toLocaleString('es-AR')}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained" startIcon={<MoneyIcon />}
          onClick={handleSave}
          disabled={submitting || !categoria}
        >
          {editing ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SueldoFormDialog;
