/**
 * SSE Contract — single source of truth for event names, types, and mappings.
 *
 * This file mirrors the backend contract exactly.
 * When the backend adds a new event:
 *   1. Add its name to SSE_EVENTS
 *   2. Add its payload interface (if any)
 *   3. Add it to EVENT_QUERY_MAP
 *
 * No other file needs to change.
 */

// ---------------------------------------------------------------------------
// Event names
// ---------------------------------------------------------------------------

export const SSE_EVENTS = {
  /** Emitted once when the SSE connection is established. Log only, no action. */
  CONNECTED: 'connected',
  /** Keep-alive heartbeat sent every ~15–30s. No business logic. */
  PING: 'ping',
  /** A loan payment was recorded. */
  PAGO_REGISTRADO: 'financial.pago.registrado',
  /** Cash-flow data changed. */
  FLUJO_CAJA_ACTUALIZADO: 'financial.flujoCaja.actualizado',
  /** A client's current account changed. */
  CUENTA_CORRIENTE_ACTUALIZADO: 'financial.cuentaCorriente.actualizado',
  /** A loan installment was updated. */
  CUOTA_ACTUALIZADA: 'loan.cuota.actualizada',
} as const;

export type SseEventName = (typeof SSE_EVENTS)[keyof typeof SSE_EVENTS];

// ---------------------------------------------------------------------------
// Base envelope — every SSE event is wrapped in this shape
// ---------------------------------------------------------------------------

export interface BaseEvent<TPayload = unknown> {
  /** Mirrors the SSE event field. */
  type: string;
  /** Multi-tenant isolation: the company this event belongs to. */
  empresaId: number;
  /** ISO-8601 timestamp set by the backend. */
  timestamp: string;
  /** Optional domain-specific payload. */
  payload?: TPayload;
}

// ---------------------------------------------------------------------------
// Typed payload interfaces
// ---------------------------------------------------------------------------

export interface ConnectedPayload {
  empresaId: number;
}

export interface PagoRegistradoPayload {
  cuotaId: number;
  prestamoId: number;
}

export interface CuentaCorrientePayload {
  clienteId: number;
}

// Flujo caja and cuota events carry no payload beyond the base envelope.

// ---------------------------------------------------------------------------
// Discriminated union of all known events (useful for typed handlers)
// ---------------------------------------------------------------------------

export type SsePayloadMap = {
  [SSE_EVENTS.CONNECTED]:                BaseEvent<ConnectedPayload>;
  [SSE_EVENTS.PING]:                     BaseEvent;
  [SSE_EVENTS.PAGO_REGISTRADO]:          BaseEvent<PagoRegistradoPayload>;
  [SSE_EVENTS.FLUJO_CAJA_ACTUALIZADO]:   BaseEvent;
  [SSE_EVENTS.CUENTA_CORRIENTE_ACTUALIZADO]: BaseEvent<CuentaCorrientePayload>;
  [SSE_EVENTS.CUOTA_ACTUALIZADA]:        BaseEvent;
};

// ---------------------------------------------------------------------------
// Event → React Query invalidation map
//
// Keys must match the first segment of queryKey arrays used in useQuery calls:
//   useQuery({ queryKey: ['flujoCaja', ...] })   ← first segment is 'flujoCaja'
//
// Add new events here — the hook picks them up automatically.
// ---------------------------------------------------------------------------

export const EVENT_QUERY_MAP: Partial<Record<SseEventName, readonly string[]>> = {
  [SSE_EVENTS.PAGO_REGISTRADO]:              ['prestamos', 'flujoCaja', 'cuentaCorrienteCliente'],
  [SSE_EVENTS.FLUJO_CAJA_ACTUALIZADO]:       ['flujoCaja'],
  [SSE_EVENTS.CUENTA_CORRIENTE_ACTUALIZADO]: ['cuentaCorrienteCliente'],
  [SSE_EVENTS.CUOTA_ACTUALIZADA]:            ['prestamos'],
};

// Flat list of every unique query key touched by SSE — used for bulk
// invalidation when the tab regains visibility after being hidden.
export const ALL_SSE_QUERY_KEYS: readonly string[] = [
  ...new Set(
    (Object.values(EVENT_QUERY_MAP) as ReadonlyArray<readonly string[]>).flat()
  ),
];

// ---------------------------------------------------------------------------
// Helper: parse a raw SSE data string into a typed BaseEvent envelope.
// Returns null on malformed JSON so callers can handle gracefully.
// ---------------------------------------------------------------------------

export function parseSseData<T = unknown>(raw: string): BaseEvent<T> | null {
  try {
    return JSON.parse(raw) as BaseEvent<T>;
  } catch {
    return null;
  }
}
