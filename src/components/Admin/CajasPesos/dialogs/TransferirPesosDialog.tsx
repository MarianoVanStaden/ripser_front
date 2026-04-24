import React, { useEffect, useMemo, useState } from 'react';
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
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type { CajaPesos } from '../../../../types';
import { extractError, formatPesos, todayString } from '../../CajasAhorro/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Cajas activas precargadas por el caller. Si no vienen, el dialog las carga. */
  cajasActivas?: CajaPesos[];
  /** Caja preseleccionada como origen (ej: al abrir desde la card de una caja). */
  defaultOrigenId?: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const TransferirPesosDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  cajasActivas: cajasInjected,
  defaultOrigenId,
}) => {
  const [cajas, setCajas] = useState<CajaPesos[]>(cajasInjected ?? []);
  const [loading, setLoading] = useState(false);

  const [origenId, setOrigenId] = useState<string>('');
  const [destinoId, setDestinoId] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [fecha, setFecha] = useState<string>(todayString());
  const [descripcion, setDescripcion] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setApiError(null);
    setOrigenId(defaultOrigenId != null ? String(defaultOrigenId) : '');
    setDestinoId('');
    setMonto('');
    setFecha(todayString());
    setDescripcion('');

    if (cajasInjected && cajasInjected.length > 0) {
      setCajas(cajasInjected);
      return;
    }
    setLoading(true);
    cajasPesosApi
      .getAll()
      .then((data) => setCajas(data.filter((c) => c.estado === 'ACTIVA')))
      .catch((e) => setApiError(extractError(e)))
      .finally(() => setLoading(false));
  }, [open, cajasInjected, defaultOrigenId]);

  const cajasActivas = useMemo(
    () => cajas.filter((c) => c.estado === 'ACTIVA'),
    [cajas]
  );
  const cajasById = useMemo(
    () => new Map(cajasActivas.map((c) => [c.id, c])),
    [cajasActivas]
  );

  const origen = origenId ? cajasById.get(Number(origenId)) : undefined;
  const destino = destinoId ? cajasById.get(Number(destinoId)) : undefined;

  const montoNum = parseFloat(monto);
  const montoValido = !isNaN(montoNum) && montoNum > 0;

  // Preview client-side — saldo resultante inmediato mientras el usuario tipea.
  const saldoOrigenPost = origen && montoValido
    ? round2(origen.saldoActual - montoNum)
    : null;
  const saldoDestinoPost = destino && montoValido
    ? round2(destino.saldoActual + montoNum)
    : null;

  const mismasCajas = origenId !== '' && origenId === destinoId;
  const origenOverdraft = saldoOrigenPost != null && saldoOrigenPost < 0;

  const canSubmit =
    !!origenId &&
    !!destinoId &&
    !mismasCajas &&
    montoValido &&
    !saving;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setApiError(null);
    try {
      await cajasPesosApi.transferir({
        cajaOrigenId: Number(origenId),
        cajaDestinoId: Number(destinoId),
        monto: round2(montoNum),
        descripcion: descripcion || undefined,
        fecha: fecha || undefined,
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
        <Box display="flex" alignItems="center" gap={1}>
          <SwapHorizIcon color="primary" />
          <span>Transferir entre cajas en pesos</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && cajasActivas.length < 2 && (
          <Alert severity="warning">
            Necesitás al menos <strong>2 cajas activas</strong> para transferir. Actualmente
            hay {cajasActivas.length}.
          </Alert>
        )}

        {!loading && cajasActivas.length >= 2 && (
          <>
            <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={mismasCajas}>
                  <InputLabel>Caja origen *</InputLabel>
                  <Select
                    value={origenId}
                    label="Caja origen *"
                    onChange={(e) => setOrigenId(String(e.target.value))}
                  >
                    <MenuItem value="">— Seleccionar —</MenuItem>
                    {cajasActivas.map((c) => (
                      <MenuItem
                        key={c.id}
                        value={String(c.id)}
                        disabled={String(c.id) === destinoId}
                      >
                        {c.nombre} ({formatPesos(c.saldoActual)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={mismasCajas}>
                  <InputLabel>Caja destino *</InputLabel>
                  <Select
                    value={destinoId}
                    label="Caja destino *"
                    onChange={(e) => setDestinoId(String(e.target.value))}
                  >
                    <MenuItem value="">— Seleccionar —</MenuItem>
                    {cajasActivas.map((c) => (
                      <MenuItem
                        key={c.id}
                        value={String(c.id)}
                        disabled={String(c.id) === origenId}
                      >
                        {c.nombre} ({formatPesos(c.saldoActual)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Monto $ *"
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  inputProps={{ step: '0.01', min: '0.01' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  error={monto !== '' && !montoValido}
                  helperText={monto !== '' && !montoValido ? 'Monto > 0' : ' '}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha *"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            {/* Preview client-side: saldos post-impacto */}
            {origen && destino && montoValido && (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 1,
                  bgcolor: origenOverdraft ? 'warning.50' : 'info.50',
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Impacto inmediato (sin consultar backend)
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mt={1}>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {origen.nombre} (origen)
                    </Typography>
                    <Typography variant="body2">
                      {formatPesos(origen.saldoActual)} −{' '}
                      {formatPesos(montoNum)} ={' '}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={origenOverdraft ? 'error.main' : 'success.main'}
                    >
                      {formatPesos(saldoOrigenPost!)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SwapHorizIcon color="action" />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {destino.nombre} (destino)
                    </Typography>
                    <Typography variant="body2">
                      {formatPesos(destino.saldoActual)} +{' '}
                      {formatPesos(montoNum)} ={' '}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {formatPesos(saldoDestinoPost!)}
                    </Typography>
                  </Box>
                </Stack>
                {origenOverdraft && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    La caja origen quedará en <strong>saldo negativo</strong> (overdraft).
                    Está permitido, pero confirmá que corresponde.
                  </Alert>
                )}
              </Paper>
            )}

            {mismasCajas && (
              <Alert severity="error" sx={{ mt: 1 }}>
                La caja origen y destino no pueden ser la misma.
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SwapHorizIcon />}
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {saving ? <CircularProgress size={20} /> : 'Confirmar transferencia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferirPesosDialog;
