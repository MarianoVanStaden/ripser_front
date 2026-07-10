// Sección de cobro mixto (varias líneas: efectivo + transferencia + cheques +
// pagaré, etc.) compartida entre ConfirmDeliveryDialog y el diálogo standalone
// de "Registrar/Corregir cobro" en DeliveriesPage.
import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
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
  AttachMoney as AttachMoneyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { DetalleCobroDTO } from '../../../../types';
import type { CobroData, DetalleCobro } from '../types';

export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia bancaria' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de débito' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de crédito' },
  { value: 'PAGARE', label: 'Pagaré' },
  { value: 'DOLARES', label: 'Dólares (USD)' },
];

const fmt = (n?: number | null) =>
  n != null
    ? `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

let nextLocalId = 0;
const newDetalle = (overrides?: Partial<DetalleCobro>): DetalleCobro => ({
  id: `det-${Date.now()}-${nextLocalId++}`,
  metodoPago: 'EFECTIVO',
  monto: '',
  comprobante: '',
  ...overrides,
});

/** Crea el CobroData inicial con una sola línea vacía. */
export const initialCobroData = (): CobroData => ({ detalles: [newDetalle()] });

/** Reconstruye el CobroData desde líneas ya guardadas (para precargar y corregir). */
export const fromDetalleCobroDTOs = (detalles?: DetalleCobroDTO[] | null): CobroData => {
  if (!detalles || detalles.length === 0) return initialCobroData();
  return {
    detalles: detalles.map((d) =>
      newDetalle({
        metodoPago: d.metodoPago,
        monto: d.monto != null ? String(d.monto) : '',
        comprobante: d.comprobanteCobro ?? '',
        cantidadCheques: d.cantidadCheques != null ? String(d.cantidadCheques) : undefined,
      })
    ),
  };
};

/** Subtotal de una línea: para CHEQUE es monto (por cheque) × cantidad. */
export const subtotalLinea = (d: DetalleCobro): number => {
  const monto = parseFloat(d.monto);
  if (isNaN(monto)) return 0;
  if (d.metodoPago === 'CHEQUE') {
    const cant = parseInt(d.cantidadCheques ?? '', 10);
    return isNaN(cant) ? 0 : monto * cant;
  }
  return monto;
};

export const sumaCobro = (cobro: CobroData): number =>
  cobro.detalles.reduce((acc, d) => acc + subtotalLinea(d), 0);

/** Una línea de cheque exige cantidad ≥ 1; el resto solo un monto numérico válido. */
const lineaValida = (d: DetalleCobro): boolean => {
  if (d.monto.trim() === '' || isNaN(parseFloat(d.monto))) return false;
  if (d.metodoPago === 'CHEQUE') {
    const cant = parseInt(d.cantidadCheques ?? '', 10);
    return !isNaN(cant) && cant >= 1;
  }
  return true;
};

export const hasMontoValido = (cobro: CobroData): boolean =>
  cobro.detalles.length > 0 && cobro.detalles.every(lineaValida);

/** Convierte el form state a las líneas que espera el backend (DetalleCobroDTO[]).
 *  Para CHEQUE se manda el monto unitario + cantidad; el backend calcula el total. */
export const toDetalleCobroDTOs = (cobro: CobroData): DetalleCobroDTO[] =>
  cobro.detalles
    .filter(lineaValida)
    .map((d) => ({
      metodoPago: d.metodoPago,
      monto: parseFloat(d.monto),
      comprobanteCobro: d.comprobante || undefined,
      cantidadCheques: d.cantidadCheques ? parseInt(d.cantidadCheques, 10) : undefined,
    }));

interface Props {
  cobro: CobroData;
  setCobro: (d: CobroData) => void;
  montoEsperado?: number | null;
}

const CobroSection: React.FC<Props> = ({ cobro, setCobro, montoEsperado }) => {
  const total = useMemo(() => sumaCobro(cobro), [cobro]);

  // El diff solo aplica cuando NO hay líneas en dólares (no mezclar monedas).
  const tieneDolares = cobro.detalles.some((d) => d.metodoPago === 'DOLARES');

  const diff = useMemo(() => {
    if (montoEsperado == null || tieneDolares) return null;
    if (cobro.detalles.every((d) => !d.monto)) return null;
    return total - montoEsperado;
  }, [total, montoEsperado, cobro.detalles, tieneDolares]);

  const diffLabel = diff == null ? null : diff === 0
    ? { label: 'Cobro exacto ✓', color: 'success' as const }
    : diff > 0
    ? { label: `+${fmt(diff)} de más`, color: 'warning' as const }
    : { label: `${fmt(diff)} de menos`, color: 'error' as const };

  const updateDetalle = (id: string, changes: Partial<DetalleCobro>) => {
    setCobro({
      detalles: cobro.detalles.map((d) => (d.id === id ? { ...d, ...changes } : d)),
    });
  };

  const removeDetalle = (id: string) => {
    if (cobro.detalles.length <= 1) return;
    setCobro({ detalles: cobro.detalles.filter((d) => d.id !== id) });
  };

  const addDetalle = () => {
    const restante = montoEsperado != null ? montoEsperado - total : null;
    setCobro({
      detalles: [
        ...cobro.detalles,
        newDetalle(restante != null && restante > 0 ? { monto: restante.toFixed(2) } : undefined),
      ],
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <AttachMoneyIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={600}>
          Cobro al cliente
        </Typography>
        {montoEsperado != null && (
          <Typography variant="caption" color="text.secondary">
            (esperado: {fmt(montoEsperado)})
          </Typography>
        )}
      </Box>

      <Stack spacing={1.5}>
        {cobro.detalles.map((detalle) => (
          <Stack
            key={detalle.id}
            spacing={1}
            sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Método de pago</InputLabel>
                <Select
                  value={detalle.metodoPago}
                  label="Método de pago"
                  onChange={(e) => updateDetalle(detalle.id, { metodoPago: e.target.value })}
                >
                  {METODOS_PAGO.map((mp) => (
                    <MenuItem key={mp.value} value={mp.value}>
                      {mp.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {cobro.detalles.length > 1 && (
                <IconButton size="small" onClick={() => removeDetalle(detalle.id)} aria-label="Quitar forma de pago">
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <TextField
              label={
                detalle.metodoPago === 'CHEQUE' ? 'Monto por cheque' :
                detalle.metodoPago === 'DOLARES' ? 'Monto en USD' : 'Monto'
              }
              value={detalle.monto}
              onChange={(e) => updateDetalle(detalle.id, { monto: e.target.value })}
              fullWidth
              size="small"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {detalle.metodoPago === 'DOLARES' ? 'U$D' : '$'}
                  </InputAdornment>
                ),
              }}
            />

            {detalle.metodoPago === 'CHEQUE' ? (
              <>
                <TextField
                  label="Cantidad de cheques"
                  required
                  value={detalle.cantidadCheques ?? ''}
                  onChange={(e) => updateDetalle(detalle.id, { cantidadCheques: e.target.value })}
                  fullWidth
                  size="small"
                  type="number"
                  inputMode="numeric"
                  placeholder="Ej: 3"
                  error={
                    detalle.monto.trim() !== '' &&
                    (!detalle.cantidadCheques || parseInt(detalle.cantidadCheques, 10) < 1)
                  }
                  helperText={
                    detalle.monto.trim() !== '' &&
                    (!detalle.cantidadCheques || parseInt(detalle.cantidadCheques, 10) < 1)
                      ? 'Obligatorio (mínimo 1)'
                      : ' '
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  Subtotal de esta línea: <strong>{fmt(subtotalLinea(detalle))}</strong>
                </Typography>
              </>
            ) : (
              <TextField
                label={
                  detalle.metodoPago === 'PAGARE'
                    ? 'Nota (opcional) — Ej: pagaré firmado por el cliente'
                    : 'N.º de comprobante / transferencia (opcional)'
                }
                value={detalle.comprobante}
                onChange={(e) => updateDetalle(detalle.id, { comprobante: e.target.value })}
                fullWidth
                size="small"
              />
            )}
          </Stack>
        ))}

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addDetalle}
          sx={{ alignSelf: 'flex-start' }}
        >
          Agregar forma de pago
        </Button>

        {cobro.detalles.length > 1 && (
          <Typography variant="body2" color="text.secondary">
            Total ingresado: <strong>{fmt(total)}</strong>
          </Typography>
        )}

        {diffLabel && (
          <Chip
            label={diffLabel.label}
            color={diffLabel.color}
            size="small"
            sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default CobroSection;
