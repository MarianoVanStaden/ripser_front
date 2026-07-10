// Lista de líneas de ingreso de la rendición: el admin distribuye el dinero
// recibido del conductor en varias formas de pago (efectivo, dólares, cheque,
// transferencia…), cada una imputada a su propia caja. Espejo, a nivel de
// rendición, del patrón de cobro mixto de CobroSection.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  Close as CloseIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import type { MetodoPago } from '../../types/prestamo.types';
import type { Banco, DetalleRendicion } from '../../types';
import { METODO_PAGO_LABELS } from '../../types/venta.types';
import { cajaEsDefaultPara, type CajaUnificada } from '../../types/caja.types';
import { cajasApi } from '../../api/services/cajasApi';
import { bancoApi } from '../../api/services/bancoApi';

// Métodos que el admin puede usar para rendir.
const METODOS_RENDICION: MetodoPago[] = [
  'EFECTIVO',
  'TRANSFERENCIA_BANCARIA',
  'DOLARES',
  'CHEQUE',
  'TARJETA_DEBITO',
  'TARJETA_CREDITO',
];

export interface RendicionLineasPayload {
  detalles: DetalleRendicion[];
  totalArs: number;
  totalUsd: number;
  valid: boolean;
}

interface LineaForm {
  id: string;
  metodoPago: MetodoPago;
  monto: string;
  cajaId: number | '';
  comprobante: string;
  // Campos de cheque (solo si metodoPago === 'CHEQUE')
  chNumero: string;
  chBancoId: number | '';
  chTitular: string;
  chCuit: string;
  chFechaEmision: string;
  chFechaCobro: string;
}

let nextId = 0;
const newLinea = (metodoPago: MetodoPago = 'EFECTIVO'): LineaForm => ({
  id: `lin-${Date.now()}-${nextId++}`,
  metodoPago,
  monto: '',
  cajaId: '',
  comprobante: '',
  chNumero: '',
  chBancoId: '',
  chTitular: '',
  chCuit: '',
  chFechaEmision: '',
  chFechaCobro: '',
});

const requiereCaja = (m: MetodoPago) => m !== 'CHEQUE';

const lineaValida = (l: LineaForm): boolean => {
  const monto = parseFloat(l.monto.replace(',', '.'));
  if (isNaN(monto) || monto <= 0) return false;
  if (l.metodoPago === 'CHEQUE') {
    return (
      l.chNumero.trim() !== '' &&
      l.chBancoId !== '' &&
      l.chTitular.trim() !== '' &&
      l.chFechaEmision !== '' &&
      l.chFechaCobro !== ''
    );
  }
  return l.cajaId !== '';
};

interface Props {
  onChange: (payload: RendicionLineasPayload) => void;
}

const RendicionLineas: React.FC<Props> = ({ onChange }) => {
  const [lineas, setLineas] = useState<LineaForm[]>([newLinea()]);
  // Cajas cacheadas por método (una consulta por método usado).
  const [cajasPorMetodo, setCajasPorMetodo] = useState<Record<string, CajaUnificada[]>>({});
  const [bancos, setBancos] = useState<Banco[]>([]);

  // Cargar bancos una sola vez (para líneas de cheque).
  useEffect(() => {
    bancoApi.getActivos().then(setBancos).catch(() => setBancos([]));
  }, []);

  // Cargar cajas para cada método usado que aún no esté cacheado.
  useEffect(() => {
    const metodos = Array.from(
      new Set(lineas.filter((l) => requiereCaja(l.metodoPago)).map((l) => l.metodoPago))
    );
    metodos.forEach((m) => {
      if (cajasPorMetodo[m] !== undefined) return;
      cajasApi
        .getByMetodoPago(m)
        .then((lista) => setCajasPorMetodo((prev) => ({ ...prev, [m]: lista })))
        .catch(() => setCajasPorMetodo((prev) => ({ ...prev, [m]: [] })));
    });
  }, [lineas, cajasPorMetodo]);

  const cajasDe = (m: MetodoPago): CajaUnificada[] => cajasPorMetodo[m] ?? [];

  const updateLinea = (id: string, changes: Partial<LineaForm>) => {
    setLineas((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...changes };
        // Al cambiar de método, resetear la caja (las cajas dependen del método).
        if (changes.metodoPago && changes.metodoPago !== l.metodoPago) {
          next.cajaId = '';
        }
        return next;
      })
    );
  };

  const removeLinea = (id: string) => {
    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const addLinea = () => setLineas((prev) => [...prev, newLinea()]);

  // Auto-seleccionar caja default cuando llegan las cajas de un método.
  useEffect(() => {
    setLineas((prev) =>
      prev.map((l) => {
        if (!requiereCaja(l.metodoPago) || l.cajaId !== '') return l;
        const lista = cajasPorMetodo[l.metodoPago];
        if (!lista || lista.length === 0) return l;
        const def =
          lista.find((c) => cajaEsDefaultPara(c, l.metodoPago)) ?? lista[0];
        return { ...l, cajaId: def.id };
      })
    );
  }, [cajasPorMetodo]);

  // Derivar el payload y reportarlo al padre.
  const payload = useMemo<RendicionLineasPayload>(() => {
    const detalles: DetalleRendicion[] = lineas.filter(lineaValida).map((l) => {
      const monto = parseFloat(l.monto.replace(',', '.'));
      if (l.metodoPago === 'CHEQUE') {
        return {
          metodoPago: l.metodoPago,
          monto,
          cheque: {
            numeroCheque: l.chNumero.trim(),
            bancoId: l.chBancoId === '' ? null : Number(l.chBancoId),
            titular: l.chTitular.trim(),
            cuitTitular: l.chCuit.trim() || undefined,
            fechaEmision: l.chFechaEmision,
            fechaCobro: l.chFechaCobro,
          },
        };
      }
      const caja = cajasDe(l.metodoPago).find((c) => c.id === l.cajaId);
      return {
        metodoPago: l.metodoPago,
        monto,
        cajaPesosId: caja?.tipo === 'PESOS' ? caja.id : null,
        cajaAhorroId: caja?.tipo === 'AHORRO' ? caja.id : null,
        comprobanteCobro: l.comprobante.trim() || undefined,
      };
    });
    const totalArs = detalles
      .filter((d) => d.metodoPago !== 'DOLARES')
      .reduce((s, d) => s + d.monto, 0);
    const totalUsd = detalles
      .filter((d) => d.metodoPago === 'DOLARES')
      .reduce((s, d) => s + d.monto, 0);
    const valid = lineas.length > 0 && lineas.every(lineaValida);
    return { detalles, totalArs, totalUsd, valid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineas, cajasPorMetodo]);

  useEffect(() => {
    onChange(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <WalletIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={600}>
          Formas de pago recibidas
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {lineas.map((l) => {
          const esCheque = l.metodoPago === 'CHEQUE';
          const esDolar = l.metodoPago === 'DOLARES';
          const cajas = cajasDe(l.metodoPago);
          return (
            <Stack
              key={l.id}
              spacing={1}
              sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Forma de pago</InputLabel>
                  <Select
                    value={l.metodoPago}
                    label="Forma de pago"
                    onChange={(e) => updateLinea(l.id, { metodoPago: e.target.value as MetodoPago })}
                  >
                    {METODOS_RENDICION.map((m) => (
                      <MenuItem key={m} value={m}>
                        {METODO_PAGO_LABELS[m] ?? m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {lineas.length > 1 && (
                  <IconButton size="small" onClick={() => removeLinea(l.id)} aria-label="Quitar forma de pago">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <TextField
                label={esDolar ? 'Monto en USD' : 'Monto'}
                value={l.monto}
                onChange={(e) => updateLinea(l.id, { monto: e.target.value })}
                fullWidth
                size="small"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{esDolar ? 'U$D' : '$'}</InputAdornment>
                  ),
                }}
              />

              {requiereCaja(l.metodoPago) && (
                <FormControl fullWidth size="small" disabled={cajas.length === 0}>
                  <InputLabel>Caja destino</InputLabel>
                  <Select
                    value={l.cajaId}
                    label="Caja destino"
                    onChange={(e) => updateLinea(l.id, { cajaId: Number(e.target.value) })}
                  >
                    {cajas.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.nombre}
                        {cajaEsDefaultPara(c, l.metodoPago) && (
                          <Typography component="span" variant="caption" color="text.secondary" ml={0.5}>
                            (default)
                          </Typography>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {esCheque ? (
                <Stack spacing={1}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="N° cheque"
                      value={l.chNumero}
                      onChange={(e) => updateLinea(l.id, { chNumero: e.target.value })}
                      fullWidth
                      size="small"
                      required
                    />
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Banco</InputLabel>
                      <Select
                        value={l.chBancoId}
                        label="Banco"
                        onChange={(e) => updateLinea(l.id, { chBancoId: Number(e.target.value) })}
                      >
                        {bancos.map((b) => (
                          <MenuItem key={b.id} value={b.id}>
                            {b.nombreCorto ?? b.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Titular"
                      value={l.chTitular}
                      onChange={(e) => updateLinea(l.id, { chTitular: e.target.value })}
                      fullWidth
                      size="small"
                      required
                    />
                    <TextField
                      label="CUIT (opcional)"
                      value={l.chCuit}
                      onChange={(e) => updateLinea(l.id, { chCuit: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Fecha emisión"
                      type="date"
                      value={l.chFechaEmision}
                      onChange={(e) => updateLinea(l.id, { chFechaEmision: e.target.value })}
                      fullWidth
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Fecha cobro"
                      type="date"
                      value={l.chFechaCobro}
                      onChange={(e) => updateLinea(l.id, { chFechaCobro: e.target.value })}
                      fullWidth
                      size="small"
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Stack>
              ) : (
                <TextField
                  label="N° comprobante / transferencia (opcional)"
                  value={l.comprobante}
                  onChange={(e) => updateLinea(l.id, { comprobante: e.target.value })}
                  fullWidth
                  size="small"
                />
              )}
            </Stack>
          );
        })}

        <Button size="small" startIcon={<AddIcon />} onClick={addLinea} sx={{ alignSelf: 'flex-start' }}>
          Agregar forma de pago
        </Button>

        {Object.keys(cajasPorMetodo).length === 0 && (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">
              Cargando cajas…
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default RendicionLineas;
