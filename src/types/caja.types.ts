import type { MetodoPago } from './prestamo.types';
import type { CajaPesos } from './cajasPesos.types';
import type { CajaAhorroDolares } from './cajasAhorro.types';

export type Moneda = 'ARS' | 'USD';

export const MONEDAS_POR_METODO_PAGO: Record<MetodoPago, readonly Moneda[]> = {
  EFECTIVO: ['ARS', 'USD'],
  TRANSFERENCIA_BANCARIA: ['ARS', 'USD'],
  // CHEQUE no impacta caja al momento del cobro: el cheque entra al pipeline
  // dedicado (EN_CARTERA → DEPOSITADO → COBRADO/RECHAZADO) y solo al pasar
  // a COBRADO el backend impacta una caja de tipo TRANSFERENCIA_BANCARIA.
  CHEQUE: [],
  TARJETA_CREDITO: ['ARS'],
  TARJETA_DEBITO: ['ARS'],
  MERCADO_PAGO: ['ARS'],
  CUENTA_CORRIENTE: [],
  FINANCIACION_PROPIA: [],
};

/**
 * Normaliza valores legacy ('TRANSFERENCIA' → 'TRANSFERENCIA_BANCARIA',
 * 'FINANCIAMIENTO' → 'FINANCIACION_PROPIA') a la enum canónica del backend.
 * Devuelve null si el valor no corresponde a un método válido.
 */
export const normalizeMetodoPago = (m: string | null | undefined): MetodoPago | null => {
  if (!m) return null;
  if (m === 'TRANSFERENCIA') return 'TRANSFERENCIA_BANCARIA';
  if (m === 'FINANCIAMIENTO') return 'FINANCIACION_PROPIA';
  return (m in MONEDAS_POR_METODO_PAGO) ? (m as MetodoPago) : null;
};

export const metodoPagoRequiereCaja = (metodo: string | null | undefined): boolean => {
  const canon = normalizeMetodoPago(metodo);
  return canon ? MONEDAS_POR_METODO_PAGO[canon].length > 0 : false;
};

export type CajaTipo = 'PESOS' | 'AHORRO';

export interface CajaRef {
  id: number;
  tipo: CajaTipo;
}

import type { CajaMetodoPagoConfig } from './cajasPesos.types';

export interface CajaUnificada {
  id: number;
  tipo: CajaTipo;
  moneda: Moneda;
  nombre: string;
  saldoActual: number;
  /** Lista de métodos que acepta la caja con sus flags de default. */
  metodosAceptados: CajaMetodoPagoConfig[];
  /** Primer método marcado como default (derivado del back). */
  metodoPagoPrincipal: MetodoPago | null;
  /** True si algún método aceptado es default. */
  tieneMetodoDefault: boolean;
  sucursalId: number | null;
}

export const toCajaUnificada = (
  caja: CajaPesos | CajaAhorroDolares,
  tipo: CajaTipo
): CajaUnificada => ({
  id: caja.id,
  tipo,
  moneda: tipo === 'PESOS' ? 'ARS' : 'USD',
  nombre: caja.nombre,
  saldoActual: caja.saldoActual,
  metodosAceptados: caja.metodosAceptados ?? [],
  metodoPagoPrincipal: caja.metodoPagoPrincipal ?? null,
  tieneMetodoDefault: caja.tieneMetodoDefault ?? false,
  sucursalId: caja.sucursalId,
});

/** True si la caja acepta el método (sea o no default). */
export const cajaAceptaMetodo = (caja: CajaUnificada, metodo: MetodoPago): boolean =>
  caja.metodosAceptados?.some((m) => m.metodoPago === metodo) ?? false;

/** True si la caja es default para el método en su empresa. */
export const cajaEsDefaultPara = (caja: CajaUnificada, metodo: MetodoPago): boolean =>
  caja.metodosAceptados?.some((m) => m.metodoPago === metodo && m.esDefault) ?? false;

export interface CobroCajaFields {
  cajaPesosId?: number | null;
  cajaAhorroId?: number | null;
}
