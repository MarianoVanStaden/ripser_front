import type { MetodoPago } from '../../../types';
import type { CajaRef } from '../../../types/caja.types';

// Backend enum has FINANCIACION_PROPIA; older plantillas/opciones may still
// emit the legacy 'FINANCIAMIENTO' alias. Treat both equivalently.
export const isFinanciamiento = (m: string) =>
  m === 'FINANCIAMIENTO' || m === 'FINANCIACION_PROPIA';

// Resuelve el payload de caja a spreadear en convertToFactura / convertToNotaPedido.
// Para ventas financiadas no se carga caja (el dinero entra cuota a cuota).
// Para ventas contado, la plata ingresa en la caja seleccionada por el usuario.
export const buildCajaPayload = (
  metodoPago: string,
  cajaRef: CajaRef | null,
): { cajaPesosId?: number | null; cajaAhorroId?: number | null } => {
  if (isFinanciamiento(metodoPago)) return {};
  if (!cajaRef) return {};
  return {
    cajaPesosId: cajaRef.tipo === 'PESOS' ? cajaRef.id : null,
    cajaAhorroId: cajaRef.tipo === 'AHORRO' ? cajaRef.id : null,
  };
};

// Plantillas come from prestamo.types' MetodoPago which uses
// TRANSFERENCIA_BANCARIA / MERCADO_PAGO (the canonical backend enum). Older
// UI places still emit 'TRANSFERENCIA' for the same concept, so we normalize
// to the backend value before writing into paymentMethod.
export const normalizeMetodoPagoToBackend = (
  m: string | undefined | null,
): MetodoPago | null => {
  if (!m) return null;
  if (m === 'TRANSFERENCIA') return 'TRANSFERENCIA_BANCARIA';
  return m as MetodoPago;
};

// When FINANCIAMIENTO and no explicit entrega is configured, default to 40%
// down payment so the backend always gets the correct split.
export function resolveEntregaFields(
  metodoPago: string,
  entregaActiva: boolean,
  usePorcentaje: boolean,
  porcentaje: number | null,
  montoFijo: number | null,
): { porcentajeEntregaInicial?: number; montoEntregaInicial?: number } {
  if (entregaActiva && usePorcentaje && porcentaje != null) {
    return { porcentajeEntregaInicial: porcentaje };
  }
  if (entregaActiva && !usePorcentaje && montoFijo != null) {
    return { montoEntregaInicial: montoFijo };
  }
  if (isFinanciamiento(metodoPago)) return { porcentajeEntregaInicial: 40 };
  return {};
}
