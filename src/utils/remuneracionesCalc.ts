// Calculadora pura de remuneraciones. Replica la lógica de la planilla
// CALCULADORA.csv: arma un sueldo a partir de la categoría salarial,
// los datos de asistencia del mes, los bonos por producción/ventas
// configurados y los descuentos. Todo en frontend para que el form de
// Sueldo pueda mostrar un preview en tiempo real sin round-trip; el
// backend revalida al persistir.

import type {
  BonoProduccionTabla,
  BonoVentasTabla,
  CategoriaSalarial,
} from '../types';

export interface RemuneracionInput {
  categoria: CategoriaSalarial;

  // Asistencia
  presentismoPct: number;       // 0-100, % de asistencia del mes
  horasExtraCant: number;
  horasAusenteCant: number;
  kmCant: number;

  // Bonos automáticos por umbrales
  unidadesProducidas?: number;
  unidadesVendidas?: number;
  bonosProduccion?: BonoProduccionTabla[];
  bonosVentas?: BonoVentasTabla[];

  // Manuales
  bonificaciones?: number;  // bonificación libre adicional
  comisiones?: number;
  bonoEspecial?: number;

  // Descuentos manuales
  descuentosLegales?: number;
  descuentosOtros?: number;
  adelantos?: number;
}

export interface RemuneracionOutput {
  // Conceptos (SUMA)
  sueldoBasico: number;
  presentismoMonto: number;
  horasExtraMonto: number;
  kmMonto: number;
  bonoProduccion: number;
  bonoVentas: number;
  bonoEspecial: number;
  bonificaciones: number;
  comisiones: number;
  totalBruto: number;

  // Conceptos (RESTA)
  horasAusenteMonto: number;
  descuentosLegales: number;
  descuentosOtros: number;
  adelantos: number;
  totalDescuentos: number;

  sueldoNeto: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Selecciona el monto del bono que aplica para una cantidad de unidades:
 * el del mayor umbral menor o igual al valor observado. Si no hay tabla
 * o ninguno aplica, devuelve 0.
 */
function pickBonoPorUmbral(
  tabla: Array<{ umbralUnidades: number; monto: number }> | undefined,
  unidades: number | undefined,
): number {
  if (!tabla || tabla.length === 0 || unidades === undefined || unidades === null) return 0;
  const aplicables = tabla.filter(b => b.umbralUnidades <= unidades);
  if (aplicables.length === 0) return 0;
  // Tomar el de mayor umbral
  const ganador = aplicables.reduce((max, b) => (b.umbralUnidades > max.umbralUnidades ? b : max));
  return Number(ganador.monto) || 0;
}

/**
 * Calcula el desglose de un sueldo a partir de la categoría + parámetros.
 *
 * Reglas (derivadas de los CSV de la planilla original):
 *   - Presentismo: 8% del básico mensual prorrateado por % de asistencia
 *     (la planilla guarda el "diario" como básico*0.08/22, pero usamos la
 *     fórmula directa para no perder precisión con redondeos de día).
 *   - Hora extra: tarifa de la categoría × cantidad de horas.
 *   - Hora ausente: tarifa de la categoría × cantidad de horas (descuento).
 *   - KM: tarifa × cantidad de km recorridos.
 *   - Bono producción/ventas: tomar el monto del mayor umbral <= unidades.
 */
export function calcularRemuneracion(input: RemuneracionInput): RemuneracionOutput {
  const cat = input.categoria;
  const sueldoBasico = Number(cat.sueldoFijo) || 0;

  const presentismoPct = Math.max(0, Math.min(100, Number(input.presentismoPct) || 0));
  const presentismoMonto = round2(sueldoBasico * 0.08 * (presentismoPct / 100));

  const horasExtraCant = Number(input.horasExtraCant) || 0;
  const horasExtraMonto = round2(horasExtraCant * (Number(cat.horaExtraValor) || 0));

  const horasAusenteCant = Number(input.horasAusenteCant) || 0;
  const horasAusenteMonto = round2(horasAusenteCant * (Number(cat.horaAusenteValor) || 0));

  const kmCant = Number(input.kmCant) || 0;
  const kmMonto = round2(kmCant * (Number(cat.kmValor) || 0));

  const bonoProduccion = pickBonoPorUmbral(input.bonosProduccion, input.unidadesProducidas);
  const bonoVentas = pickBonoPorUmbral(input.bonosVentas, input.unidadesVendidas);

  const bonificaciones = Number(input.bonificaciones) || 0;
  const comisiones = Number(input.comisiones) || 0;
  const bonoEspecial = Number(input.bonoEspecial) || 0;

  const totalBruto = round2(
    sueldoBasico +
      presentismoMonto +
      horasExtraMonto +
      kmMonto +
      bonoProduccion +
      bonoVentas +
      bonoEspecial +
      bonificaciones +
      comisiones,
  );

  const descuentosLegales = Number(input.descuentosLegales) || 0;
  const descuentosOtros = Number(input.descuentosOtros) || 0;
  const adelantos = Number(input.adelantos) || 0;

  const totalDescuentos = round2(
    descuentosLegales + descuentosOtros + horasAusenteMonto + adelantos,
  );

  const sueldoNeto = round2(totalBruto - totalDescuentos);

  return {
    sueldoBasico,
    presentismoMonto,
    horasExtraMonto,
    kmMonto,
    bonoProduccion,
    bonoVentas,
    bonoEspecial,
    bonificaciones,
    comisiones,
    totalBruto,
    horasAusenteMonto,
    descuentosLegales,
    descuentosOtros,
    adelantos,
    totalDescuentos,
    sueldoNeto,
  };
}
