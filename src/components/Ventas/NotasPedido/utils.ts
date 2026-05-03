// FRONT-003: extracted from NotasPedidoPage.tsx — pure helpers, no JSX,
// no React state. Anything that returns JSX lives in
// [paymentMethodIcons.tsx](./paymentMethodIcons.tsx) (file extension `.tsx`).
import type { DeudaClienteError } from '../../../types';
import type { TipoIva } from './types';

/**
 * Inspect an axios-style error and pull out the structured "cliente con
 * deuda pendiente" payload the backend returns when blocking a sale.
 * Returns null for any other error shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseDeudaError = (err: any): DeudaClienteError | null => {
  const data = err?.response?.data;
  if (!data) return null;
  if (data.requiereConfirmacion || data.cuotasPendientes != null) {
    return {
      error: data.error || 'Cliente con deuda pendiente',
      message: data.message || '',
      cuotasPendientes: data.cuotasPendientes ?? 0,
      montoCuotasPendientes: data.montoCuotasPendientes ?? null,
      deudaCuentaCorriente: data.deudaCuentaCorriente ?? null,
      requiereConfirmacion: true,
    };
  }
  // Fallback: detect by message content (backend may send plain 500/400
  // without structured fields).
  if (typeof data.message === 'string' && data.message.toLowerCase().includes('deuda pendiente')) {
    return {
      error: 'Cliente con deuda pendiente',
      message: data.message,
      cuotasPendientes: 0,
      deudaCuentaCorriente: null,
      requiereConfirmacion: true,
    };
  }
  return null;
};

export const getTipoIvaLabel = (tipo: TipoIva): string => {
  const labels: Record<TipoIva, string> = {
    IVA_21: 'IVA 21%',
    IVA_10_5: 'IVA 10.5%',
    EXENTO: 'Exento',
  };
  return labels[tipo] || tipo;
};
