// Barrel exports per domain. Originally a 3,898-LOC monolith — split by
// FRONT-004 audit. Domain split is approximate; cross-domain types use
// `import type` to keep the boundary loose.

export * from './balance.types';
export * from './amortizacion.types';
export * from './provision.types';
export * from './tipoProvision.types';
export * from './auth.types';
export * from './tenant.types';
export * from './lead.types';
export type { LeadDTO as Lead } from './lead.types';
// prestamo.types renames its narrow MetodoPago/METODO_PAGO_LABELS to *Prestamo
// suffix so the wider declarations from venta.types win the barrel resolution.
export * from './prestamo.types';
export * from './pagination.types';
export * from './shared.enums';

// Domain types (ex-monolith).
export * from './admin.types';
export * from './cliente.types';
export * from './producto.types';
export * from './venta.types';
export * from './compra.types';
export * from './garantia.types';
export * from './rrhh.types';
export * from './logistica.types';
export * from './taller.types';
export * from './fabricacion.types';
export * from './documentoComercial.types';
export * from './deposito.types';
export * from './cheque.types';
export * from './reconciliacion-stock.types';
export * from './flujoCaja.types';

export * from './stockPlanificacion.types';
export * from './posicionPatrimonial.types';
export * from './cajasAhorro.types';
export * from './cajasPesos.types';
export * from './caja.types';
