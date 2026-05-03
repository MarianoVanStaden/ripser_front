import type { MetodoPago } from '../../../types';

// Aligned with backend enum com.ripser_back.enums.MetodoPago. Order = display
// order in the Select. Keep consistent with NotasPedido/Presupuestos pages.
export const PAYMENT_METHODS: { value: MetodoPago; label: string }[] = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
  { value: 'TRANSFERENCIA_BANCARIA', label: 'Transferencia Bancaria' },
  { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
  { value: 'FINANCIACION_PROPIA', label: 'Financiación Propia' },
];

export type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';

export const IVA_OPTIONS: { value: TipoIva; label: string; rate: number }[] = [
  { value: 'IVA_21', label: 'IVA 21%', rate: 0.21 },
  { value: 'IVA_10_5', label: 'IVA 10.5%', rate: 0.105 },
  { value: 'EXENTO', label: 'Exento 0%', rate: 0 },
];

export const ESTADO_OPTIONS: Record<
  string,
  { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }
> = {
  PENDIENTE: { label: 'Pendiente', color: 'warning' },
  APROBADO: { label: 'Aprobado', color: 'success' },
  RECHAZADO: { label: 'Rechazado', color: 'secondary' },
  PAGADA: { label: 'Pagada', color: 'primary' },
  VENCIDA: { label: 'Vencida', color: 'error' },
  ANULADA: { label: 'Anulada', color: 'default' },
  FACTURADA: { label: 'Facturada', color: 'info' },
};
