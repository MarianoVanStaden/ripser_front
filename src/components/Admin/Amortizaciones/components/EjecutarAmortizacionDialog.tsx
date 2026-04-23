import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { amortizacionApi } from '../../../../api/services/amortizacionApi';
import { cajasAhorroApi } from '../../../../api/services/cajasAhorroApi';
import type {
  AmortizacionMensualDTO,
  CajaAhorroDolares,
  OrigenFondoDTO,
} from '../../../../types';

interface Props {
  open: boolean;
  amortizacion: AmortizacionMensualDTO;
  onClose: () => void;
  onSuccess: () => void;
}

interface FilaOrigen {
  cajaId: string;
  monto: string;
}

const nuevaFila = (): FilaOrigen => ({ cajaId: '', monto: '' });

const fmtUsd = (n: number) =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const round2 = (n: number) => Math.round(n * 100) / 100;

const EjecutarAmortizacionDialog: React.FC<Props> = ({
  open,
  amortizacion,
  onClose,
  onSuccess,
}) => {
  const [cajas, setCajas] = useState<CajaAhorroDolares[]>([]);
  const [destinoId, setDestinoId] = useState<string>('');
  const [origenes, setOrigenes] = useState<FilaOrigen[]>([nuevaFila()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const target = amortizacion.montoAmortizadoDolares;

  useEffect(() => {
    if (!open) return;
    setDestinoId('');
    setOrigenes([nuevaFila()]);
    setApiError(null);
    setLoading(true);
    cajasAhorroApi
      .getAll()
      .then((data) => setCajas(data.filter((c) => c.estado === 'ACTIVA')))
      .catch((e) =>
        setApiError(e?.response?.data?.message ?? 'Error cargando cajas')
      )
      .finally(() => setLoading(false));
  }, [open]);

  const cajasOrigenPosibles = useMemo(() => {
    const usadas = new Set(origenes.map((o) => o.cajaId).filter(Boolean));
    return (filaActual: string) =>
      cajas.filter((c) => {
        if (String(c.id) === destinoId) return false;
        if (String(c.id) === filaActual) return true;
        return !usadas.has(String(c.id));
      });
  }, [cajas, destinoId, origenes]);

  const totalIngresado = useMemo(
    () => origenes.reduce((acc, o) => acc + (parseFloat(o.monto) || 0), 0),
    [origenes]
  );
  const diferencia = round2(target - totalIngresado);
  const coincide = Math.abs(diferencia) < 0.005;

  const updateFila = (idx: number, patch: Partial<FilaOrigen>) => {
    setOrigenes((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, ...patch } : f))
    );
  };

  const agregarFila = () => setOrigenes((prev) => [...prev, nuevaFila()]);
  const eliminarFila = (idx: number) =>
    setOrigenes((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );

  const errorFila = (f: FilaOrigen): string | null => {
    if (!f.cajaId) return 'Seleccione caja';
    const monto = parseFloat(f.monto);
    if (isNaN(monto) || monto <= 0) return 'Monto > 0';
    return null;
  };

  const erroresFilas = origenes.map(errorFila);
  const hayErroresFilas = erroresFilas.some((e) => e !== null);

  const canSubmit = !!destinoId && !hayErroresFilas && coincide && !saving;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setApiError(null);
    try {
      const dto = {
        destinoCajaId: Number(destinoId),
        origenes: origenes.map<OrigenFondoDTO>((f) => ({
          cajaId: Number(f.cajaId),
          monto: round2(parseFloat(f.monto)),
        })),
      };
      await amortizacionApi.ejecutarAmortizacion(amortizacion.id, dto);
      onSuccess();
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.message ??
        data?.error ??
        (typeof data === 'string' ? data : null) ??
        'Error al ejecutar amortización';
      setApiError(
        `${err?.response?.status ? `(${err.response.status}) ` : ''}${msg}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Ejecutar amortización — {amortizacion.activoNombre}
        <Typography variant="body2" color="text.secondary">
          Monto objetivo: <strong>USD {fmtUsd(target)}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 2, mt: 1 }} disabled={loading || saving}>
          <InputLabel>Caja destino *</InputLabel>
          <Select
            value={destinoId}
            label="Caja destino *"
            onChange={(e) => setDestinoId(String(e.target.value))}
          >
            <MenuItem value="">— Seleccionar —</MenuItem>
            {cajas.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.nombre} (saldo USD {fmtUsd(c.saldoActual)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Paper variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Caja origen</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 240 }} align="right">
                  Monto USD
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
                          {cajasOrigenPosibles(fila.cajaId).map((c) => (
                            <MenuItem key={c.id} value={String(c.id)}>
                              {c.nombre} (USD {fmtUsd(c.saldoActual)})
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
                            <InputAdornment position="start">USD</InputAdornment>
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
          sx={{
            p: 2,
            bgcolor: coincide ? 'success.50' : 'warning.50',
          }}
        >
          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Requerido
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                USD {fmtUsd(target)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ingresado
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                USD {fmtUsd(totalIngresado)}
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
                USD {fmtUsd(diferencia)}
              </Typography>
            </Box>
          </Stack>
          {!coincide && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              La suma de orígenes debe coincidir exactamente con el monto
              amortizado.
            </Alert>
          )}
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {saving ? 'Ejecutando…' : 'Confirmar ejecución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EjecutarAmortizacionDialog;
