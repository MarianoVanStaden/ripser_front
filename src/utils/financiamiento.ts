import type { MetodoPago, OpcionFinanciamientoDTO } from '../types';

export const PORCENTAJE_ENTREGA_PROPIO = 0.4;

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  TARJETA_DEBITO: 'Tarjeta de Débito',
  TRANSFERENCIA: 'Transferencia Bancaria',
  TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
  CHEQUE: 'Cheque',
  MERCADO_PAGO: 'Mercado Pago',
  FINANCIAMIENTO: 'Financiamiento Propio',
  FINANCIACION_PROPIA: 'Financiamiento Propio',
  CUENTA_CORRIENTE: 'Cuenta Corriente',
};

export const getMetodoPagoLabel = (metodo?: MetodoPago | string | null): string => {
  if (!metodo) return '—';
  return METODO_PAGO_LABELS[metodo as MetodoPago] ?? String(metodo);
};

export const isFinanciamientoPropio = (metodo?: MetodoPago | string | null): boolean =>
  metodo === 'FINANCIAMIENTO' || metodo === 'FINANCIACION_PROPIA';

export interface FinanciamientoPropioCalc {
  entrega: number;
  saldo: number;
  saldoConInteres: number;
  cuotaEstimada: number;
  totalEstimado: number;
  porcentajeEntrega: number;
  tasaInteres: number;
  cuotas: number;
}

export const calcularFinanciamientoPropio = (
  base: number,
  tasaInteres: number,
  cuotas: number,
  porcentajeEntrega: number = PORCENTAJE_ENTREGA_PROPIO
): FinanciamientoPropioCalc => {
  const entrega = Math.round(base * porcentajeEntrega);
  const saldo = base - entrega;
  const saldoConInteres = Math.round(saldo * (1 + (tasaInteres || 0) / 100));
  const cuotaEstimada = cuotas > 0 ? Math.round(saldoConInteres / cuotas) : 0;
  const totalEstimado = entrega + saldoConInteres;
  return {
    entrega,
    saldo,
    saldoConInteres,
    cuotaEstimada,
    totalEstimado,
    porcentajeEntrega,
    tasaInteres,
    cuotas,
  };
};

/**
 * Verdadero cuando una opción de financiamiento debe mostrar el desglose
 * de entrega + saldo + cuota (financiamiento propio con más de una cuota).
 */
export const debeDesglosarFinanciamientoPropio = (opcion: OpcionFinanciamientoDTO): boolean =>
  isFinanciamientoPropio(opcion.metodoPago) && opcion.cantidadCuotas > 1;

export const formatCurrencyARS = (value: number | null | undefined, decimals = 0): string => {
  return `$${Number(value ?? 0).toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
