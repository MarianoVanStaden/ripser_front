import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import type { CajaAhorroDolares, DisponibleConversionDTO } from '../../../../types';
import { extractError, formatPesos, formatUSD, MONTH_NAMES } from '../utils';

interface Props {
  open: boolean;
  cajasActivas: CajaAhorroDolares[];
  onClose: () => void;
  onSuccess: () => void;
}

interface Step1FormData {
  montoPesos: string;
  valorDolar: string;
  cajaAhorroId: string;
  descripcion: string;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const max2dec = (v: unknown) =>
  v == null || v === '' || /^\d+(\.\d{1,2})?$/.test(String(v));

const ConvertirAmortizacionDialog: React.FC<Props> = ({
  open,
  cajasActivas,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<0 | 1>(0);
  const [anio, setAnio] = useState(currentYear);
  const [mes, setMes] = useState(currentMonth);
  const [disponibles, setDisponibles] = useState<DisponibleConversionDTO[]>([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [errorDisponibles, setErrorDisponibles] = useState<string | null>(null);
  const [selected, setSelected] = useState<DisponibleConversionDTO | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searched, setSearched] = useState(false);

  const schemaStep1 = useMemo(
    () =>
      yup.object({
        montoPesos: yup
          .string()
          .required('Requerido')
          .test('pos', 'Debe ser mayor a 0', (v) => parseFloat(v ?? '') > 0)
          .test('dec', 'Máximo 2 decimales', max2dec)
          .test('max', 'Supera el monto disponible', (v) => {
            if (!selected) return true;
            return parseFloat(v ?? '') <= selected.montoPesosDisponible;
          }),
        valorDolar: yup
          .string()
          .required('Requerido')
          .test('pos', 'Debe ser mayor a 0', (v) => parseFloat(v ?? '') > 0),
        cajaAhorroId: yup
          .string()
          .required('Seleccione una caja')
          .test('valid', 'Seleccione una caja', (v) => !!v && v !== ''),
        descripcion: yup.string(),
      }),
    [selected]
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
    setValue,
  } = useForm<Step1FormData>({
    resolver: yupResolver(schemaStep1) as any,
    defaultValues: { montoPesos: '', valorDolar: '', cajaAhorroId: '', descripcion: '' },
  });

  const montoPesosVal = useWatch({ control, name: 'montoPesos' });
  const valorDolarVal = useWatch({ control, name: 'valorDolar' });
  const cajaIdVal = useWatch({ control, name: 'cajaAhorroId' });

  // Reset todo al abrir/cerrar
  useEffect(() => {
    if (open) {
      setStep(0);
      setDisponibles([]);
      setSelected(null);
      setApiError(null);
      setErrorDisponibles(null);
      setSearched(false);
      resetForm({ montoPesos: '', valorDolar: '', cajaAhorroId: '', descripcion: '' });
    }
  }, [open, resetForm]);

  // Reset form al cambiar selección
  useEffect(() => {
    if (selected) {
      resetForm({
        montoPesos: '',
        valorDolar: selected.valorDolarSugerido != null
          ? String(selected.valorDolarSugerido)
          : '',
        cajaAhorroId: cajasActivas.length === 1 ? String(cajasActivas[0].id) : '',
        descripcion: '',
      });
    }
  }, [selected, cajasActivas, resetForm]);

  const buscarDisponibles = useCallback(async () => {
    setDisponibles([]);
    setSelected(null);
    setErrorDisponibles(null);
    setLoadingDisponibles(true);
    setSearched(true);
    try {
      const data = await cajasAhorroApi.getAmortizacionesDisponibles(anio, mes);
      setDisponibles(data);
    } catch (err) {
      setErrorDisponibles(extractError(err));
    } finally {
      setLoadingDisponibles(false);
    }
  }, [anio, mes]);

  const handleSelectRow = (row: DisponibleConversionDTO) => {
    setSelected(row);
    setApiError(null);
    setStep(1);
  };

  const handleBack = () => {
    setSelected(null);
    setStep(0);
  };

  const montoPesos = parseFloat(montoPesosVal);
  const valorDolar = parseFloat(valorDolarVal);
  const showPreview =
    !isNaN(montoPesos) && montoPesos > 0 && !isNaN(valorDolar) && valorDolar > 0;
  const previewUsd = showPreview
    ? Math.round((montoPesos / valorDolar) * 100) / 100
    : 0;

  const selectedCaja = cajasActivas.find((c) => String(c.id) === cajaIdVal);

  const onSubmit = async (data: Step1FormData) => {
    if (!selected) return;
    setSaving(true);
    setApiError(null);
    try {
      await cajasAhorroApi.convertirAmortizacion({
        amortizacionMensualId: selected.amortizacionMensualId,
        montoPesos: parseFloat(data.montoPesos),
        valorDolar: parseFloat(data.valorDolar),
        cajaAhorroId: Number(data.cajaAhorroId),
        descripcion: data.descripcion || undefined,
      });
      onSuccess();
    } catch (err) {
      setApiError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>
        Convertir amortización → USD
        {step === 1 && selected && (
          <Typography variant="body2" color="text.secondary">
            Paso 2: Configurar conversión
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {step === 0 && (
          <>
            <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
              <Grid size={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={anio}
                    label="Año"
                    onChange={(e) => {
                      setAnio(Number(e.target.value));
                      setSearched(false);
                      setDisponibles([]);
                    }}
                  >
                    {YEARS.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={mes}
                    label="Mes"
                    onChange={(e) => {
                      setMes(Number(e.target.value));
                      setSearched(false);
                      setDisponibles([]);
                    }}
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <MenuItem key={idx + 1} value={idx + 1}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={4}>
                <Button
                  variant="contained"
                  onClick={buscarDisponibles}
                  disabled={loadingDisponibles}
                  fullWidth
                >
                  {loadingDisponibles ? <CircularProgress size={20} /> : 'Buscar disponibles'}
                </Button>
              </Grid>
            </Grid>

            {errorDisponibles && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorDisponibles}
              </Alert>
            )}

            {searched && !loadingDisponibles && disponibles.length === 0 && !errorDisponibles && (
              <Alert severity="info">
                No hay amortizaciones disponibles para convertir en {MONTH_NAMES[mes - 1]}{' '}
                {anio}.
              </Alert>
            )}

            {disponibles.length > 0 && (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Activo</TableCell>
                      <TableCell>Período</TableCell>
                      <TableCell align="right">Amortizado</TableCell>
                      <TableCell align="right">Ya convertido</TableCell>
                      <TableCell align="right">Disponible</TableCell>
                      <TableCell align="right">TC sugerido</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {disponibles.map((row) => (
                      <TableRow
                        key={row.amortizacionMensualId}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleSelectRow(row)}
                      >
                        <TableCell>{row.activoNombre ?? `Activo #${row.activoId}`}</TableCell>
                        <TableCell>
                          {MONTH_NAMES[row.mes - 1]} {row.anio}
                        </TableCell>
                        <TableCell align="right">
                          {formatPesos(row.montoAmortizadoPesos)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPesos(row.montoPesosYaConvertido)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {formatPesos(row.montoPesosDisponible)}
                        </TableCell>
                        <TableCell align="right">
                          {row.valorDolarSugerido != null
                            ? formatPesos(row.valorDolarSugerido)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {step === 1 && selected && (
          <>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                Activo seleccionado
              </Typography>
              <Typography fontWeight={700}>
                {selected.activoNombre ?? `Activo #${selected.activoId}`}
              </Typography>
              <Typography variant="body2">
                Período: {MONTH_NAMES[selected.mes - 1]} {selected.anio} &nbsp;·&nbsp;
                Disponible:{' '}
                <strong>{formatPesos(selected.montoPesosDisponible)}</strong>
              </Typography>
            </Paper>

            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}

            <form id="convertir-form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Box display="flex" gap={1} alignItems="flex-start">
                    <Controller
                      name="montoPesos"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Monto a convertir (pesos) *"
                          type="number"
                          inputProps={{ step: '0.01', min: '0.01' }}
                          error={!!errors.montoPesos}
                          helperText={
                            errors.montoPesos?.message ??
                            `Máx: ${formatPesos(selected.montoPesosDisponible)}`
                          }
                        />
                      )}
                    />
                    <Button
                      variant="outlined"
                      sx={{ mt: 1, whiteSpace: 'nowrap', minWidth: 130 }}
                      onClick={() =>
                        setValue('montoPesos', String(selected.montoPesosDisponible))
                      }
                    >
                      Convertir todo
                    </Button>
                  </Box>
                </Grid>
                <Grid size={6}>
                  <Controller
                    name="valorDolar"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Tipo de cambio *"
                        type="number"
                        inputProps={{ step: '0.01', min: '0.01' }}
                        error={!!errors.valorDolar}
                        helperText={
                          errors.valorDolar?.message ?? 'Pesos por dólar (snapshot histórico)'
                        }
                      />
                    )}
                  />
                </Grid>
                <Grid size={6}>
                  <Controller
                    name="cajaAhorroId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.cajaAhorroId}>
                        <InputLabel>Caja destino *</InputLabel>
                        <Select {...field} label="Caja destino *">
                          <MenuItem value="">— Seleccionar —</MenuItem>
                          {cajasActivas.map((c) => (
                            <MenuItem key={c.id} value={String(c.id)}>
                              {c.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.cajaAhorroId && (
                          <FormHelperText>{errors.cajaAhorroId.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <Controller
                    name="descripcion"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} fullWidth label="Descripción" multiline rows={2} />
                    )}
                  />
                </Grid>
              </Grid>
            </form>

            {showPreview && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'info.50' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vista previa
                </Typography>
                <Typography variant="body1">
                  {formatPesos(montoPesos)} ÷ TC {formatPesos(valorDolar)}
                </Typography>
                <Typography variant="h6" fontWeight={700} color="info.main">
                  = {formatUSD(previewUsd)}
                </Typography>
                {selectedCaja && (
                  <Typography variant="body2" color="text.secondary">
                    Caja: {selectedCaja.nombre}
                  </Typography>
                )}
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        {step === 1 && (
          <>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} disabled={saving}>
              Cambiar selección
            </Button>
            <Button
              type="submit"
              form="convertir-form"
              variant="contained"
              color="info"
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : 'Confirmar conversión'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConvertirAmortizacionDialog;
