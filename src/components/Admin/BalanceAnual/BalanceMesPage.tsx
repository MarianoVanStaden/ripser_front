import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalculateIcon from '@mui/icons-material/Calculate';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import { balanceAnualApi } from '../../../api/services/balanceAnualApi';
import type { BalanceMensualDTO, GuardarBalanceMensualDTO } from '../../../types';
import EstadoBalanceBadge from './components/EstadoBalanceBadge';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function numField(v: number | undefined | null): string {
  if (v == null) return '';
  return String(v);
}

type FormValues = Omit<GuardarBalanceMensualDTO, 'sucursalId'>;

// Converts null (from API) to undefined so undefined fields are omitted in JSON.stringify
const n = (v: number | null | undefined): number | undefined => v ?? undefined;

function dtoToForm(dto: BalanceMensualDTO): FormValues {
  return {
    valorDolar: n(dto.valorDolar),
    saldoInicialPesos: n(dto.saldoInicialPesos),
    totalCobradoPesos: n(dto.totalCobradoPesos),
    totalGastosPesos: n(dto.totalGastosPesos),
    totalAmortizadoPesos: n(dto.totalAmortizadoPesos),
    saldoNetoMesPesos: n(dto.saldoNetoMesPesos),
    saldoFinalPesos: n(dto.saldoFinalPesos),
    cuentasXCobrarPesos: n(dto.cuentasXCobrarPesos),
    stockMaterialesPesos: n(dto.stockMaterialesPesos),
    stockFabricacionPesos: n(dto.stockFabricacionPesos),
    stockComercializacionPesos: n(dto.stockComercializacionPesos),
    cuentasXPagarPesos: n(dto.cuentasXPagarPesos),
    patrimonioPesos: n(dto.patrimonioPesos),
    resultadoPesos: n(dto.resultadoPesos),
    saldoInicialDolares: n(dto.saldoInicialDolares),
    totalCobradoDolares: n(dto.totalCobradoDolares),
    totalGastosDolares: n(dto.totalGastosDolares),
    totalAmortizadoDolares: n(dto.totalAmortizadoDolares),
    saldoNetoMesDolares: n(dto.saldoNetoMesDolares),
    saldoFinalDolares: n(dto.saldoFinalDolares),
    cuentasXCobrarDolares: n(dto.cuentasXCobrarDolares),
    stockMaterialesDolares: n(dto.stockMaterialesDolares),
    stockFabricacionDolares: n(dto.stockFabricacionDolares),
    stockComercializacionDolares: n(dto.stockComercializacionDolares),
    cuentasXPagarDolares: n(dto.cuentasXPagarDolares),
    patrimonioDolares: n(dto.patrimonioDolares),
    resultadoDolares: n(dto.resultadoDolares),
  };
}

const EMPTY_FORM: FormValues = {
  valorDolar: undefined,
  saldoInicialPesos: undefined,
  totalCobradoPesos: undefined,
  totalGastosPesos: undefined,
  totalAmortizadoPesos: undefined,
  saldoNetoMesPesos: undefined,
  saldoFinalPesos: undefined,
  cuentasXCobrarPesos: undefined,
  stockMaterialesPesos: undefined,
  stockFabricacionPesos: undefined,
  stockComercializacionPesos: undefined,
  cuentasXPagarPesos: undefined,
  patrimonioPesos: undefined,
  resultadoPesos: undefined,
  saldoInicialDolares: undefined,
  totalCobradoDolares: undefined,
  totalGastosDolares: undefined,
  totalAmortizadoDolares: undefined,
  saldoNetoMesDolares: undefined,
  saldoFinalDolares: undefined,
  cuentasXCobrarDolares: undefined,
  stockMaterialesDolares: undefined,
  stockFabricacionDolares: undefined,
  stockComercializacionDolares: undefined,
  cuentasXPagarDolares: undefined,
  patrimonioDolares: undefined,
  resultadoDolares: undefined,
};

interface NumFieldProps {
  label: string;
  fieldKey: keyof FormValues;
  form: FormValues;
  onChange: (key: keyof FormValues, val: number | undefined) => void;
  disabled: boolean;
}

function NumericField({ label, fieldKey, form, onChange, disabled }: NumFieldProps) {
  const raw = form[fieldKey];
  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      disabled={disabled}
      value={numField(raw as number | undefined | null)}
      onChange={(e) => {
        const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
        onChange(fieldKey, isNaN(v as number) ? undefined : v);
      }}
      type="number"
      inputProps={{ step: '0.01' }}
    />
  );
}

export default function BalanceMesPage() {
  const { anio, mes } = useParams<{ anio: string; mes: string }>();
  const navigate = useNavigate();

  const anioNum = Number(anio);
  const mesNum = Number(mes);

  const [saved, setSaved] = useState<BalanceMensualDTO | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [valorDolarCalc, setValorDolarCalc] = useState<string>('');

  const [loadingInit, setLoadingInit] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const [initError, setInitError] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isReadonly = saved?.estado === 'CERRADO' || saved?.estado === 'AUDITADO';

  const load = useCallback(async () => {
    setLoadingInit(true);
    setInitError(null);
    try {
      const dto = await balanceAnualApi.getMes(anioNum, mesNum);
      setSaved(dto);
      setForm(dtoToForm(dto));
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSaved(null);
        setForm(EMPTY_FORM);
      } else {
        setInitError(err?.response?.data?.message ?? 'Error al cargar el mes');
      }
    } finally {
      setLoadingInit(false);
    }
  }, [anioNum, mesNum]);

  useEffect(() => { load(); }, [load]);

  const handleFieldChange = (key: keyof FormValues, val: number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleCalcular = async () => {
    const vd = parseFloat(valorDolarCalc);
    if (!valorDolarCalc || isNaN(vd) || vd <= 0) {
      setCalcError('Ingresá un valor de dólar válido para calcular');
      return;
    }
    setCalculating(true);
    setCalcError(null);
    try {
      const result = await balanceAnualApi.calcular(anioNum, mesNum, vd);
      setForm(dtoToForm(result));
      // calcular may have persisted the record — sync saved state so a subsequent
      // guardar call knows the record already exists (avoids duplicate-create 400)
      setSaved(result);
    } catch (err: any) {
      const data = err?.response?.data;
      setCalcError(data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? 'Error al calcular');
    } finally {
      setCalculating(false);
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // anio + mes are @NotNull in the backend DTO even though they're also in the URL path
      const cleanBody: GuardarBalanceMensualDTO = {
        anio: anioNum,
        mes: mesNum,
        ...Object.fromEntries(Object.entries(form).filter(([, v]) => v != null)),
      };
      const dto = await balanceAnualApi.guardar(anioNum, mesNum, cleanBody);
      setSaved(dto);
      setForm(dtoToForm(dto));
      setSaveSuccess(true);
    } catch (err: any) {
      const data = err?.response?.data;
      console.error('Balance save 400 body:', JSON.stringify(data));
      const msg =
        data?.message ??
        data?.error ??
        (typeof data === 'string' ? data : null) ??
        (data ? JSON.stringify(data) : null) ??
        'Error al guardar';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCerrar = async () => {
    setCerrando(true);
    setSaveError(null);
    try {
      await balanceAnualApi.cerrar(anioNum, mesNum);
      load();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Error al cerrar el mes');
    } finally {
      setCerrando(false);
    }
  };

  if (loadingInit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/balance')} size="small">
          Balance Anual
        </Button>
      </Box>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Balance — {MESES[mesNum]} {anioNum}
        </Typography>
        {saved && <EstadoBalanceBadge estado={saved.estado} />}
        {!saved && <Chip label="Sin datos" size="small" />}
      </Box>

      {initError && <Alert severity="error" sx={{ mb: 2 }}>{initError}</Alert>}

      {/* Camino A: Cálculo automático */}
      {!isReadonly && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>
            Calcular desde flujo de caja
          </Typography>
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              label="Valor dólar del día"
              size="small"
              type="number"
              inputProps={{ step: '0.01', min: '0' }}
              value={valorDolarCalc}
              onChange={(e) => { setValorDolarCalc(e.target.value); setCalcError(null); }}
              sx={{ width: 200 }}
              disabled={calculating}
            />
            <Button
              variant="outlined"
              startIcon={<CalculateIcon />}
              onClick={handleCalcular}
              disabled={calculating}
            >
              {calculating ? 'Calculando...' : 'Calcular'}
            </Button>
          </Box>
          {calcError && <Alert severity="error" sx={{ mt: 1 }}>{calcError}</Alert>}
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            El resultado se carga en el formulario pero no se guarda automáticamente. Revisá y hacé clic en "Guardar".
          </Typography>
        </Paper>
      )}

      {isReadonly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Este mes está {saved?.estado === 'CERRADO' ? 'cerrado' : 'auditado'} y no puede modificarse.
        </Alert>
      )}

      {saveError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}
      {saveSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>Balance guardado correctamente.</Alert>}

      {/* Form: todos los campos */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>Datos del balance</Typography>

        <Grid container spacing={2}>
          <Grid size={12}>
            <NumericField label="Valor dólar" fieldKey="valorDolar" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>

          <Grid size={12}>
            <Divider><Typography variant="caption">Pesos — Ingresos y egresos</Typography></Divider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Saldo inicial ($)" fieldKey="saldoInicialPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Total cobrado ($)" fieldKey="totalCobradoPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Total gastos ($)" fieldKey="totalGastosPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Total amortizado ($)" fieldKey="totalAmortizadoPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Saldo neto del mes ($)" fieldKey="saldoNetoMesPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Saldo final ($)" fieldKey="saldoFinalPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>

          <Grid size={12}>
            <Divider><Typography variant="caption">Pesos — Posición patrimonial</Typography></Divider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Cuentas x cobrar ($)" fieldKey="cuentasXCobrarPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Stock materiales ($)" fieldKey="stockMaterialesPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Stock fabricación ($)" fieldKey="stockFabricacionPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Stock comercialización ($)" fieldKey="stockComercializacionPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Cuentas x pagar ($)" fieldKey="cuentasXPagarPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Patrimonio ($)" fieldKey="patrimonioPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Resultado ($)" fieldKey="resultadoPesos" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>

          <Grid size={12}>
            <Divider><Typography variant="caption">Dólares — Ingresos y egresos</Typography></Divider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Saldo inicial (USD)" fieldKey="saldoInicialDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Total cobrado (USD)" fieldKey="totalCobradoDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Total gastos (USD)" fieldKey="totalGastosDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Total amortizado (USD)" fieldKey="totalAmortizadoDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Saldo neto del mes (USD)" fieldKey="saldoNetoMesDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Saldo final (USD)" fieldKey="saldoFinalDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>

          <Grid size={12}>
            <Divider><Typography variant="caption">Dólares — Posición patrimonial</Typography></Divider>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Cuentas x cobrar (USD)" fieldKey="cuentasXCobrarDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Stock materiales (USD)" fieldKey="stockMaterialesDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Stock fabricación (USD)" fieldKey="stockFabricacionDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Stock comercialización (USD)" fieldKey="stockComercializacionDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Cuentas x pagar (USD)" fieldKey="cuentasXPagarDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Patrimonio (USD)" fieldKey="patrimonioDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <NumericField label="Resultado (USD)" fieldKey="resultadoDolares" form={form} onChange={handleFieldChange} disabled={isReadonly} />
          </Grid>
        </Grid>
      </Paper>

      {!isReadonly && (
        <Stack direction="row" spacing={2} mt={3}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleGuardar}
            disabled={saving || cerrando}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          {saved?.estado === 'BORRADOR' && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LockIcon />}
              onClick={handleCerrar}
              disabled={saving || cerrando}
            >
              {cerrando ? 'Cerrando...' : 'Cerrar mes'}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
