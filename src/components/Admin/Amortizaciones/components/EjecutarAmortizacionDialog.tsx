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
  ListSubheader,
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
import { cajasPesosApi } from '../../../../api/services/cajasPesosApi';
import type {
  AmortizacionMensualDTO,
  CajaAhorroDolares,
  CajaPesos,
  OrigenFondoDTO,
  TipoCajaOrigen,
} from '../../../../types';

interface Props {
  open: boolean;
  amortizacion: AmortizacionMensualDTO;
  onClose: () => void;
  onSuccess: () => void;
}

/** Los ids de cajas USD y pesos viven en tablas distintas → key compuesta. */
interface OpcionCaja {
  key: string;
  tipo: TipoCajaOrigen;
  id: number;
  nombre: string;
  saldoActual: number;
}

interface FilaOrigen {
  cajaKey: string;
  monto: string;
}

const nuevaFila = (): FilaOrigen => ({ cajaKey: '', monto: '' });

const fmtNum = (n: number) =>
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
  const [cajasUsd, setCajasUsd] = useState<CajaAhorroDolares[]>([]);
  const [cajasPesos, setCajasPesos] = useState<CajaPesos[]>([]);
  const [destinoId, setDestinoId] = useState<string>('');
  const [origenes, setOrigenes] = useState<FilaOrigen[]>([nuevaFila()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const target = amortizacion.montoAmortizadoDolares;
  const tipoCambio = amortizacion.valorDolar;
  const tcValido = typeof tipoCambio === 'number' && tipoCambio > 0;

  useEffect(() => {
    if (!open) return;
    setDestinoId('');
    setOrigenes([nuevaFila()]);
    setApiError(null);
    setLoading(true);
    Promise.all([cajasAhorroApi.getAll(), cajasPesosApi.getAll()])
      .then(([usd, pesos]) => {
        setCajasUsd(usd.filter((c) => c.estado === 'ACTIVA'));
        setCajasPesos(pesos.filter((c) => c.estado === 'ACTIVA'));
      })
      .catch((e) =>
        setApiError(e?.response?.data?.message ?? 'Error cargando cajas')
      )
      .finally(() => setLoading(false));
  }, [open]);

  const opciones = useMemo<OpcionCaja[]>(() => {
    const usd = cajasUsd.map<OpcionCaja>((c) => ({
      key: `USD-${c.id}`,
      tipo: 'USD',
      id: c.id,
      nombre: c.nombre,
      saldoActual: c.saldoActual,
    }));
    const pesos = tcValido
      ? cajasPesos.map<OpcionCaja>((c) => ({
          key: `PESOS-${c.id}`,
          tipo: 'PESOS',
          id: c.id,
          nombre: c.nombre,
          saldoActual: c.saldoActual,
        }))
      : [];
    return [...usd, ...pesos];
  }, [cajasUsd, cajasPesos, tcValido]);

  const opcionByKey = useMemo(() => {
    const m = new Map<string, OpcionCaja>();
    opciones.forEach((o) => m.set(o.key, o));
    return m;
  }, [opciones]);

  const cajasOrigenPosibles = useMemo(() => {
    const usadas = new Set(origenes.map((o) => o.cajaKey).filter(Boolean));
    return (filaActual: string) =>
      opciones.filter((o) => {
        if (o.key === `USD-${destinoId}`) return false;
        if (o.key === filaActual) return true;
        return !usadas.has(o.key);
      });
  }, [opciones, destinoId, origenes]);

  /** Aporte en USD de una fila (misma fórmula que el backend: redondeo por fila). */
  const aporteUsd = (f: FilaOrigen): number => {
    const monto = parseFloat(f.monto);
    if (isNaN(monto) || monto <= 0) return 0;
    const opcion = opcionByKey.get(f.cajaKey);
    if (!opcion) return 0;
    if (opcion.tipo === 'PESOS') {
      return tcValido ? round2(monto / tipoCambio) : 0;
    }
    return monto;
  };

  const hayFilasPesos = origenes.some(
    (f) => opcionByKey.get(f.cajaKey)?.tipo === 'PESOS'
  );

  const totalIngresado = useMemo(
    () => origenes.reduce((acc, f) => acc + aporteUsd(f), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [origenes, opcionByKey, tipoCambio]
  );
  const diferencia = round2(target - totalIngresado);
  const coincide = Math.abs(diferencia) < 0.005;
  /** Diferencia expresada en pesos al TC de la amortización (0 si no aplica). */
  const pesosFaltantes =
    !coincide && diferencia > 0 && tcValido
      ? round2(diferencia * tipoCambio)
      : 0;

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
    if (!f.cajaKey) return 'Seleccione caja';
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
        origenes: origenes.map<OrigenFondoDTO>((f) => {
          const opcion = opcionByKey.get(f.cajaKey)!;
          return {
            cajaId: opcion.id,
            monto: round2(parseFloat(f.monto)),
            tipoCaja: opcion.tipo,
          };
        }),
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

  const renderOpcion = (o: OpcionCaja) => (
    <MenuItem key={o.key} value={o.key}>
      {o.nombre}{' '}
      {o.tipo === 'USD'
        ? `(USD ${fmtNum(o.saldoActual)})`
        : `($ ${fmtNum(o.saldoActual)} — pesos)`}
    </MenuItem>
  );

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
          Monto objetivo: <strong>USD {fmtNum(target)}</strong>
          {tcValido && (
            <>
              {' '}
              · Cotización: <strong>$ {fmtNum(tipoCambio)}</strong>
            </>
          )}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {!tcValido && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Para usar cajas en pesos como origen, primero cargá el valor del
            dólar en «Editar amortización».
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
            {cajasUsd.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>
                {c.nombre} (saldo USD {fmtNum(c.saldoActual)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Paper variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Caja origen</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 260 }} align="right">
                  Monto
                </TableCell>
                <TableCell sx={{ width: 60 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {origenes.map((fila, idx) => {
                const err = erroresFilas[idx];
                const opcion = opcionByKey.get(fila.cajaKey);
                const esPesos = opcion?.tipo === 'PESOS';
                const posibles = cajasOrigenPosibles(fila.cajaKey);
                const posiblesUsd = posibles.filter((o) => o.tipo === 'USD');
                const posiblesPesos = posibles.filter((o) => o.tipo === 'PESOS');
                const equivalente = esPesos ? aporteUsd(fila) : 0;
                // Monto que debería tener ESTA fila para que el total cierre
                // exacto, dado lo cargado en las demás filas.
                const faltanteFilaUsd = round2(
                  target - (totalIngresado - aporteUsd(fila))
                );
                const montoSugerido =
                  opcion && !coincide && faltanteFilaUsd > 0
                    ? esPesos
                      ? round2(faltanteFilaUsd * tipoCambio)
                      : faltanteFilaUsd
                    : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <FormControl
                        fullWidth
                        size="small"
                        error={!!err && !fila.cajaKey}
                        disabled={saving}
                      >
                        <Select
                          value={fila.cajaKey}
                          displayEmpty
                          onChange={(e) =>
                            updateFila(idx, { cajaKey: String(e.target.value) })
                          }
                        >
                          <MenuItem value="">— Seleccionar —</MenuItem>
                          {posiblesPesos.length > 0 && (
                            <ListSubheader>Cajas USD</ListSubheader>
                          )}
                          {posiblesUsd.map(renderOpcion)}
                          {posiblesPesos.length > 0 && (
                            <ListSubheader>Cajas en pesos</ListSubheader>
                          )}
                          {posiblesPesos.map(renderOpcion)}
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
                        helperText={
                          err ??
                          ([
                            esPesos && equivalente > 0
                              ? `≈ USD ${fmtNum(equivalente)} @ TC $ ${fmtNum(tipoCambio)}`
                              : null,
                            esPesos && pesosFaltantes > 0
                              ? `Faltan $ ${fmtNum(pesosFaltantes)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') ||
                            ' ')
                        }
                        disabled={saving}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {esPesos ? '$' : 'USD'}
                            </InputAdornment>
                          ),
                        }}
                      />
                      {montoSugerido > 0 && (
                        <Box>
                          <Button
                            size="small"
                            sx={{ textTransform: 'none', p: 0, minWidth: 0 }}
                            onClick={() =>
                              updateFila(idx, { monto: String(montoSugerido) })
                            }
                            disabled={saving}
                          >
                            Completar con {esPesos ? '$' : 'USD'}{' '}
                            {fmtNum(montoSugerido)}
                          </Button>
                        </Box>
                      )}
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
                USD {fmtNum(target)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Ingresado
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                USD {fmtNum(totalIngresado)}
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
                USD {fmtNum(diferencia)}
              </Typography>
              {pesosFaltantes > 0 && (
                <Typography variant="caption" color="warning.main">
                  Faltan ≈ $ {fmtNum(pesosFaltantes)} al TC
                </Typography>
              )}
              {!coincide && diferencia < 0 && tcValido && (
                <Typography variant="caption" color="warning.main">
                  Sobran ≈ $ {fmtNum(round2(-diferencia * tipoCambio))} al TC
                </Typography>
              )}
            </Box>
          </Stack>
          {hayFilasPesos && (
            <Typography variant="caption" color="text.secondary">
              Los montos en pesos se convierten a USD con la cotización $
              {fmtNum(tipoCambio)} de esta amortización.
            </Typography>
          )}
          {!coincide && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              La suma de orígenes (en USD, con los pesos convertidos) debe
              coincidir exactamente con el monto amortizado.
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
