// FRONT-003: extracted from NotasPedidoPage.tsx — pure constants used by
// the page and (eventually) by extracted sub-components.
import type { MetodoPago } from '../../../types';
import type { ConvertFormData, TipoIva } from './types';

/** Default state for the "Convertir Presupuesto" dialog form. */
export const initialConvertForm: ConvertFormData = {
  presupuestoId: '',
  metodoPago: 'EFECTIVO' as MetodoPago,
  tipoIva: 'EXENTO',
  descuentoTipo: 'NONE',
  descuentoValor: 0,
};

/**
 * IVA rate per category. Kept here (instead of a global enum) because
 * the wider app uses these same labels in other places with subtly
 * different rates depending on the operation; we don't want to couple
 * that logic to the nota-pedido flow.
 */
export const IVA_RATES: Record<TipoIva, number> = {
  IVA_21: 0.21,
  IVA_10_5: 0.105,
  EXENTO: 0,
};
