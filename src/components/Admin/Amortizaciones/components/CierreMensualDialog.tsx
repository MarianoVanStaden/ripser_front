import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { amortizacionApi } from '../../../../api/services/amortizacionApi';
import { adminFlujoCajaApi } from '../../../../api/services/adminFlujoCajaApi';
import type {
  ActivoAmortizableDTO,
  ResultadoCierreMensualDTO,
  TipoActivoAmortizable,
} from '../../../../types';

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const TIPO_LABEL: Record<TipoActivoAmortizable, string> = {
  VEHICULO: 'Vehículo',
  HERRAMIENTAS: 'Herramientas',
  INFRAESTRUCTURA: 'Infraestructura',
  MATERIA_PRIMA: 'Materia prima',
  AGUINALDOS: 'Aguinaldos',
  DESEMPLEO: 'Desempleo',
  OTRO: 'Otro',
};

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(anio: number, mes: number): string {
  const d = new Date(anio, mes, 0);
  return `${anio}-${pad(mes)}-${pad(d.getDate())}`;
}

interface Props {
  open: boolean;
  anio: number;
  mes: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CierreMensualDialog({ open, anio, mes, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [activos, setActivos] = useState<ActivoAmortizableDTO[]>([]);
  const [flujoCajaMensual, setFlujoCajaMensual] = useState('');
  const [valorDolar, setValorDolar] = useState('');
  const [kmPorActivo, setKmPorActivo] = useState<Record<string, string>>({});
  const [calculando, setCalculando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCierreMensualDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const activosKm = activos.filter((a) => a.metodo === 'POR_KILOMETROS');

  useEffect(() => {
    if (!open) return;

    setResultado(null);
    setError(null);
    setConfirmado(false);
    setValorDolar('');
    setKmPorActivo({});
    setFlujoCajaMensual('');

    const fechaDesde = `${anio}-${pad(mes)}-01`;
    const fechaHasta = lastDayOfMonth(anio, mes);

    setLoading(true);
    Promise.all([
      amortizacionApi.getActivos(),
      adminFlujoCajaApi.getFlujoCaja(fechaDesde, fechaHasta),
    ])
      .then(([activosData, flujoData]) => {
        const activos = activosData.filter((a) => a.activo);
        setActivos(activos);
        setFlujoCajaMensual(String(flujoData.totalIngresos));
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message ?? 'Error al cargar los datos del mes');
      })
      .finally(() => setLoading(false));
  }, [open, anio, mes]);

  const handleCalcular = async () => {
    const flujo = parseFloat(flujoCajaMensual);
    const dolar = parseFloat(valorDolar);

    if (!flujoCajaMensual || isNaN(flujo) || flujo < 0) {
      setError('El flujo de caja mensual es obligatorio');
      return;
    }
    if (!valorDolar || isNaN(dolar) || dolar <= 0) {
      setError('El valor del dólar es obligatorio y debe ser positivo');
      return;
    }

    const kmMap: Record<string, number> = {};
    for (const a of activosKm) {
      const val = kmPorActivo[String(a.id)];
      if (val && val.trim() !== '') {
        const n = parseFloat(val);
        if (!isNaN(n) && n >= 0) {
          kmMap[String(a.id)] = n;
        }
      }
    }

    setCalculando(true);
    setError(null);
    try {
      const res = await amortizacionApi.procesarCierreMensual({
        anio,
        mes,
        flujoCajaMensual: flujo,
        valorDolar: dolar,
        kmPorActivo: Object.keys(kmMap).length > 0 ? kmMap : undefined,
      });
      setResultado(res);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? 'Error al procesar el cierre mensual';
      setError(msg);
    } finally {
      setCalculando(false);
    }
  };

  const handleConfirmar = () => {
    setConfirmado(true);
    onSuccess();
  };

  const handleRecalcular = () => {
    setResultado(null);
    setError(null);
    setConfirmado(false);
  };

  return (
    <Dialog open={open} onClose={() => !calculando && !loading && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AssignmentTurnedInIcon color="primary" />
          <Typography variant="h6" component="span" fontWeight={700}>
            Cierre de Mes — {MESES[mes]} {anio}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* FORMULARIO */}
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Datos del cierre
            </Typography>
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Flujo de caja bruto del mes ($)"
                  type="number"
                  fullWidth
                  size="small"
                  value={flujoCajaMensual}
                  onChange={(e) => { setFlujoCajaMensual(e.target.value); setError(null); }}
                  inputProps={{ step: '0.01', min: '0' }}
                  disabled={calculando}
                  helperText="Pre-llenado desde flujo de caja del mes"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Valor del dólar *"
                  type="number"
                  fullWidth
                  size="small"
                  value={valorDolar}
                  onChange={(e) => { setValorDolar(e.target.value); setError(null); }}
                  inputProps={{ step: '0.01', min: '0.01' }}
                  disabled={calculando}
                />
              </Grid>

              {activosKm.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Kilómetros por vehículo (activos POR_KILOMETROS)
                  </Typography>
                  <Grid container spacing={2}>
                    {activosKm.map((a) => (
                      <Grid key={a.id} size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label={`Km — ${a.nombre}${a.vehiculoPatente ? ` (${a.vehiculoPatente})` : ''}`}
                          type="number"
                          fullWidth
                          size="small"
                          value={kmPorActivo[String(a.id)] ?? ''}
                          onChange={(e) =>
                            setKmPorActivo((prev) => ({ ...prev, [String(a.id)]: e.target.value }))
                          }
                          inputProps={{ step: '1', min: '0' }}
                          disabled={calculando}
                          helperText="Dejar vacío = backend usará 0 y emitirá advertencia"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {!resultado && (
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleCalcular}
                  disabled={calculando}
                  startIcon={calculando ? <CircularProgress size={16} color="inherit" /> : <AssignmentTurnedInIcon />}
                >
                  {calculando ? 'Calculando...' : 'Calcular preview'}
                </Button>
              </Box>
            )}

            {/* RESULTADO */}
            {resultado && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Resultado del proceso
                  </Typography>
                  {confirmado && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Proceso confirmado"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>

                <Grid container spacing={2} mb={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary">Total amortizado ($)</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>${fmt(resultado.totalAmortizadoPesos)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary">Total amortizado (USD)</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>USD {fmt(resultado.totalAmortizadoDolares)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary">% del flujo</Typography>
                        <Typography variant="subtitle1" fontWeight={700} color={resultado.porcentajeTotalDelFlujo > 50 ? 'error.main' : 'text.primary'}>
                          {fmt(resultado.porcentajeTotalDelFlujo)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" color="text.secondary">Flujo disponible ($)</Typography>
                        <Typography variant="subtitle1" fontWeight={700} color="success.main">
                          ${fmt(resultado.flujoDisponiblePesos)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {resultado.advertencias.length > 0 && (
                  <Box mb={2}>
                    {resultado.advertencias.map((adv, i) => (
                      <Alert key={i} severity="warning" sx={{ mb: 1 }}>{adv}</Alert>
                    ))}
                  </Box>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Activo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Amortizado ($)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Amortizado (USD)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Fondo acumulado ($)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">Km</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resultado.registros.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell>{r.activoNombre}</TableCell>
                          <TableCell>{TIPO_LABEL[r.activoTipo]}</TableCell>
                          <TableCell align="right">${fmt(r.montoAmortizadoPesos)}</TableCell>
                          <TableCell align="right">USD {fmt(r.montoAmortizadoDolares)}</TableCell>
                          <TableCell align="right">${fmt(r.fondoAcumuladoPesos)}</TableCell>
                          <TableCell align="right">
                            {r.kmRecorridos != null
                              ? new Intl.NumberFormat('es-AR').format(r.kmRecorridos)
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>${fmt(resultado.totalAmortizadoPesos)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>USD {fmt(resultado.totalAmortizadoDolares)}</TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={calculando || loading}>
          {confirmado ? 'Cerrar' : 'Cancelar'}
        </Button>
        {resultado && !confirmado && (
          <Button onClick={handleRecalcular} disabled={calculando}>
            Recalcular
          </Button>
        )}
        {resultado && !confirmado && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleConfirmar}
          >
            Confirmar cierre
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
