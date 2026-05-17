// Tipos del módulo de Remuneraciones (categorías salariales, bonos por
// producción/ventas, adelantos). El detalle por concepto del Sueldo vive
// en rrhh.types.ts (extendido) para no romper imports existentes.

export type ConceptoSueldo = 'SALARIO' | 'AGUINALDO';

export const CONCEPTO_SUELDO_LABELS: Record<ConceptoSueldo, string> = {
  SALARIO: 'Salario',
  AGUINALDO: 'Aguinaldo (SAC)',
};

export const CONCEPTOS_SUELDO: readonly ConceptoSueldo[] = ['SALARIO', 'AGUINALDO'] as const;

/**
 * Categoría salarial — equivalente a una fila de la tabla BASICOS.csv.
 *
 * - sueldoFijo: básico mensual de la categoría
 * - presentismoDia: monto diario del presentismo (= 8% del básico / 22)
 * - horaExtraValor: precio de cada hora extra
 * - horaAusenteValor: descuento por cada hora ausente
 * - kmValor: reintegro por km
 */
export interface CategoriaSalarial {
  id: number;
  nombre: string;
  sueldoFijo: number;
  presentismoDia: number;
  horaExtraValor: number;
  horaAusenteValor: number;
  kmValor: number;
  activo: boolean;
}

export interface CategoriaSalarialCreateDTO {
  nombre: string;
  sueldoFijo: number;
  presentismoDia: number;
  horaExtraValor: number;
  horaAusenteValor: number;
  kmValor: number;
  activo?: boolean;
}

/**
 * Escalón de bono por producción para una categoría.
 * El bono efectivo es el monto del mayor umbral <= unidadesProducidas.
 */
export interface BonoProduccionTabla {
  id: number;
  categoriaSalarialId: number;
  categoriaSalarialNombre?: string;
  umbralUnidades: number;
  monto: number;
}

export interface BonoProduccionTablaCreateDTO {
  categoriaSalarialId: number;
  umbralUnidades: number;
  monto: number;
}

/**
 * Escalón de bono por ventas para una categoría.
 * Misma semántica que BonoProduccionTabla pero contra unidadesVendidas.
 */
export interface BonoVentasTabla {
  id: number;
  categoriaSalarialId: number;
  categoriaSalarialNombre?: string;
  umbralUnidades: number;
  monto: number;
}

export interface BonoVentasTablaCreateDTO {
  categoriaSalarialId: number;
  umbralUnidades: number;
  monto: number;
}

/**
 * Adelanto individual entregado a un empleado dentro de un período.
 * El total de adelantos del período se descuenta del sueldo neto.
 */
export interface Adelanto {
  id: number;
  empleadoId: number;
  empleadoNombre?: string;
  empleadoApellido?: string;
  periodo: string;       // YYYY-MM
  fecha: string;         // YYYY-MM-DD
  monto: number;
  observaciones?: string | null;
}

export interface AdelantoCreateDTO {
  empleadoId: number;
  periodo: string;
  fecha: string;
  monto: number;
  observaciones?: string | null;
}
