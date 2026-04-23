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
  Grid2 as Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { amortizacionApi } from '../../../../api/services/amortizacionApi';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type {
  CajaAhorroDolares,
  CajaPesos,
  DisponibleConversionDTO,
  OrigenConversionItemDTO,
} from '../../../../types';
import { extractError, formatPesos, formatUSD, MONTH_NAMES } from '../utils';

interface Props {
  open: boolean;
  cajasActivas: CajaAhorroDolares[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FilaOrigen {
  cajaId: string;
  monto: string;
}

const nuevaFila = (): FilaOrigen => ({ cajaId: '', monto: '' });

const round2 = (n: number) => Math.round(n * 100) / 100;

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
  const [searched, setSearched] = useState(false);

  const [cajasPesos, setCajasPesos] = useState<CajaPesos[]>([]);
  const [loadingCajasPesos, setLoadingCajasPesos] = useState(false);

  const [destinoId, setDestinoId] = useState<string>('');
  const [tipoCambio, setTipoCambio] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [origenes, setOrigenes] = useState<FilaOrigen[]>([nuevaFila()]);

  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDisponibles([]);
    setSelected(null);
    setSearched(false);
    setApiError(null);
    setErrorDisponibles(null);
    setDestinoId('');
    setTipoCambio('');
    setDescripcion('');
    setOrigenes([nuevaFila()]);
  }, [open]);

  // Cargar cajas pesos cuando entra al paso 1
  useEffect(() => {
    if (step !== 1) return;
    setLoadingCajasPesos(true);
    cajasPesosApi
      .getAll()
      .then((data) => setCajasPesos(data.filter((c) => c.estado === 'ACTIVA')))
      .catch((err) => setApiError(extractError(err)))
      .finally(() => setLoadingCajasPesos(false));
  }, [step]);

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
    setDestinoId(cajasActivas.length === 1 ? String(cajasActivas[0].id) : '');
    setTipoCambio(
      row.valorDolarSugerido != null ? String(row.valorDolarSugerido) : ''
    );
    setOrigenes([nuevaFila()]);
    setDescripcion('');
    setStep(1);
  };

  const handleBack = () => {
    setSelected(null);
    setStep(0);
  };

  // ── Derived state ───────────────────────────────────────────────
  const cajasPesosById = useMemo(
    () => new Map(cajasPesos.map((c) => [c.id, c])),
    [cajasPesos]
  );

  const cajasPesosDisponiblesFactory = useMemo(() => {
    const usadas = new Set(origenes.map((o) => o.cajaId).filter(Boolean));
    return (filaActual: string) =>
      cajasPesos.filter((c) => {
        if (String(c.id) === filaActual) return true;
        return !usadas.has(String(c.id));
      });
  }, [cajasPesos, origenes]);

  const totalIngresado = useMemo(
    () => origenes.reduce((acc, o) => acc + (parseFloat(o.monto) || 0), 0),
    [origenes]
  );

  const disponibleAmort = selected?.montoPesosDisponible ?? 0;
  const diferencia = round2(disponibleAmort - totalIngresado);
  const coincide = Math.abs(diferencia) < 0.005;

  const tc = parseFloat(tipoCambio);
  const previewUsd =
    totalIngresado > 0 && tc > 0 ? round2(totalIngresado / tc) : 0;

  const updateFila = (idx: number, patch: Partial<FilaOrigen>) =>
    setOrigenes((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    );
  const agregarFila = () =>
    setOrigenes((prev) => [...prev, nuevaFila()]);
  const eliminarFila = (idx: number) =>
    setOrigenes((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );

  const errorFila = (f: FilaOrigen): string | null => {
    if (!f.cajaId) return 'Seleccione caja';
    const monto = parseFloat(f.monto);
    if (isNaN(monto) || monto <= 0) return 'Monto > 0';
    const caja = cajasPesosById.get(Number(f.cajaId));
    if (caja && monto > caja.saldoActual)
      return `Excede saldo (${formatPesos(caja.saldoActual)})`;
    return null;
  };

  const erroresFilas = origenes.map(errorFila);
  const hayErroresFilas = erroresFilas.some((e) => e !== null);

  const tcValido = !isNaN(tc) && tc > 0;
  const canSubmit =
    !!selected &&
    !!destinoId &&
    tcValido &&
    !hayErroresFilas &&
    coincide &&
    totalIngresado > 0 &&
    !saving;

  const onSubmit = async () => {
    if (!canSubmit || !selected) return;
    setSaving(true);
    setApiError(null);
    try {
      const montoPesosTotal = round2(totalIngresado);
      await amortizacionApi.convertirUsd(selected.amortizacionMensualId, {
        montoPesosTotal,
        tipoCambio: round2(tc),
        destinoCajaUsdId: Number(destinoId),
        origenes: origenes.map<OrigenConversionItemDTO>((f) => ({
          cajaId: Number(f.cajaId),
          monto: round2(parseFloat(f.monto)),
        })),
        descripcion: descripcion || undefined,
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
            Paso 2: Orígenes (pesos) + destino (USD)
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
            <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                Activo seleccionado
              </Typography>
              <Typography fontWeight={700}>
                {selected.activoNombre ?? `Activo #${selected.activoId}`}
              </Typography>
              <Typography variant="body2">
                Período: {MONTH_NAMES[selected.mes - 1]} {selected.anio} &nbsp;·&nbsp;
                Disponible: <strong>{formatPesos(selected.montoPesosDisponible)}</strong>
              </Typography>
            </Paper>

            {apiError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {apiError}
              </Alert>
            )}

            {loadingCajasPesos && (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            {!loadingCajasPesos && cajasPesos.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No hay cajas en pesos activas. Creá al menos una desde{' '}
                <strong>Admin → Cajas en Pesos</strong> antes de convertir.
              </Alert>
            )}

            {!loadingCajasPesos && cajasPesos.length > 0 && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      label="Tipo de cambio *"
                      type="number"
                      value={tipoCambio}
                      onChange={(e) => setTipoCambio(e.target.value)}
                      inputProps={{ step: '0.01', min: '0.01' }}
                      helperText={tcValido ? `1 USD = ${formatPesos(tc)}` : 'Pesos por dólar'}
                      error={tipoCambio !== '' && !tcValido}
                    />
                  </Grid>
                  <Grid size={6}>
                    <FormControl fullWidth>
                      <InputLabel>Caja USD destino *</InputLabel>
                      <Select
                        value={destinoId}
                        label="Caja USD destino *"
                        onChange={(e) => setDestinoId(String(e.target.value))}
                      >
                        <MenuItem value="">— Seleccionar —</MenuItem>
                        {cajasActivas.map((c) => (
                          <MenuItem key={c.id} value={String(c.id)}>
                            {c.nombre} ({formatUSD(c.saldoActual)})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" fontWeight={700} mb={1}>
                  Orígenes en pesos
                </Typography>

                <Paper variant="outlined" sx={{ mb: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Caja</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 220 }} align="right">
                          Monto $
                        </TableCell>
                        <TableCell sx={{ width: 60 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {origenes.map((fila, idx) => {
                        const err = erroresFilas[idx];
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <FormControl
                                fullWidth
                                size="small"
                                error={!!err && !fila.cajaId}
                                disabled={saving}
                              >
                                <Select
                                  value={fila.cajaId}
                                  displayEmpty
                                  onChange={(e) =>
                                    updateFila(idx, { cajaId: String(e.target.value) })
                                  }
                                >
                                  <MenuItem value="">— Seleccionar —</MenuItem>
                                  {cajasPesosDisponiblesFactory(fila.cajaId).map((c) => (
                                    <MenuItem key={c.id} value={String(c.id)}>
                                      {c.nombre} ({formatPesos(c.saldoActual)})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={fila.monto}
                                onChange={(e) =>
                                  updateFila(idx, { monto: e.target.value })
                                }
                                inputProps={{ step: '0.01', min: '0.01' }}
                                error={!!err && fila.monto !== ''}
                                helperText={err ?? ' '}
                                disabled={saving}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">$</InputAdornment>
                                  ),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => eliminarFila(idx)}
                                disabled={origenes.length === 1 || saving}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>

                <Button
                  startIcon={<AddIcon />}
                  onClick={agregarFila}
                  size="small"
                  sx={{ mb: 2 }}
                  disabled={saving}
                >
                  Agregar origen
                </Button>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 2, bgcolor: coincide ? 'success.50' : 'warning.50' }}
                >
                  <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Disponible amortización
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatPesos(disponibleAmort)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Total ingresado
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatPesos(totalIngresado)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Diferencia
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={coincide ? 'success.main' : 'warning.main'}
                      >
                        {formatPesos(diferencia)}
                      </Typography>
                    </Box>
                    {tcValido && totalIngresado > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          USD a acreditar
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="info.main">
                          {formatUSD(previewUsd)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  {!coincide && totalIngresado > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      La suma de orígenes debe coincidir con el monto disponible de la amortización.
                    </Alert>
                  )}
                </Paper>

                <TextField
                  fullWidth
                  label="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  multiline
                  rows={2}
                  disabled={saving}
                />
              </>
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
              variant="contained"
              color="info"
              disabled={!canSubmit}
              onClick={onSubmit}
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
