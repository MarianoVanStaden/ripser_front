import { faker } from '@faker-js/faker';
import type {
  FlujoCajaMovimientoEnhanced,
  MetodoPago,
  EstadoChequeType,
} from '../types';

// Seed fijo → datos reproducibles entre corridas (dev y CI). Reseteá con
// faker.seed(n) dentro de un test si necesitás otra secuencia.
faker.seed(20260802);

/** Movimiento de flujo de caja. Pasá overrides para fijar lo que el test asserta. */
export const makeMovimiento = (
  overrides: Partial<FlujoCajaMovimientoEnhanced> = {},
): FlujoCajaMovimientoEnhanced => ({
  id: faker.number.int({ min: 1, max: 100_000 }),
  fecha: '2026-07-15',
  tipo: 'INGRESO',
  origen: 'CLIENTE',
  entidad: faker.person.fullName(),
  concepto: faker.commerce.productName(),
  importe: faker.number.int({ min: 1_000, max: 500_000 }),
  metodoPago: 'EFECTIVO' as MetodoPago,
  ...overrides,
});

/** Movimiento con cheque en un estado dado (para aggregateChequeStatus). */
export const makeMovimientoCheque = (
  estado: EstadoChequeType,
  overrides: Partial<FlujoCajaMovimientoEnhanced> = {},
): FlujoCajaMovimientoEnhanced =>
  makeMovimiento({
    metodoPago: 'CHEQUE' as MetodoPago,
    chequeEstado: estado,
    chequeNumero: faker.string.numeric(8),
    ...overrides,
  });

/** Detalle de documento comercial mínimo (tipoItem + subtotal). */
export interface DetalleFactory {
  tipoItem: string;
  subtotal: number;
  [k: string]: unknown;
}
export const makeDetalle = (overrides: Partial<DetalleFactory> = {}): DetalleFactory => ({
  tipoItem: 'PRODUCTO',
  subtotal: faker.number.int({ min: 1_000, max: 1_000_000 }),
  ...overrides,
});
