// Helpers puros del cobro mixto (varias líneas: efectivo + transferencia +
// cheques + pagaré, etc.). Separados de CobroSection.tsx para que ese archivo
// exporte solo el componente (react-refresh/only-export-components).
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

export const fmt = (n?: number | null) =>
  n != null
    ? `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

let nextLocalId = 0;
export const newDetalle = (overrides?: Partial<DetalleCobro>): DetalleCobro => ({
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
