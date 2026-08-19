// Calculadora pura de remuneraciones. Replica la lógica de la planilla
// CALCULADORA.csv: arma un sueldo a partir de la categoría salarial,
// los datos de asistencia del mes, los bonos por producción/ventas
// configurados y los descuentos. Todo en frontend para que el form de
// Sueldo pueda mostrar un preview en tiempo real sin round-trip; el
// backend revalida al persistir.

import type {
  BonoProduccionTabla,
  CategoriaSalarial,
} from '../types';

export interface RemuneracionInput {
  categoria: CategoriaSalarial;

  // Prorrateo por ingreso/egreso a mitad de mes: días corridos computados
  // del período. Afecta básico y presentismo.
  diasComputados?: number;      // 1..diasBase, default = diasBase
  // Divisor del prorrateo = días del mes del período (28..31); AGUINALDO usa 30.
  // Default 30 por compatibilidad; el form pasa diasDelMes(periodo).
  diasBase?: number;            // 28-31 (o 30 para aguinaldo), default 30

  // Asistencia
  presentismoPct: number;       // 0-100, % de asistencia del mes
  horasExtraCant: number;
  horasAusenteCant: number;
  kmCant: number;

  // Bono de producción: automático por umbral de unidades producidas.
  unidadesProducidas?: number;
  bonosProduccion?: BonoProduccionTabla[];
  // Bono de ventas: monto ya resuelto por las metas mensuales (backend), editable.
  bonoVentas?: number;

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
 * Cantidad de días del mes del período (28..31). El prorrateo del básico usa
 * este valor como divisor, así que "mes completo" vale los días reales del mes
 * (agosto 31, febrero 28). Devuelve 30 si el período es inválido.
 */
export function diasDelMes(periodo: string): number {
  const [anio, mes] = periodo.split('-').map(Number);
  if (!anio || !mes) return 30;
  return new Date(anio, mes, 0).getDate(); // día 0 del mes siguiente = último del mes
}

/**
 * Días corridos computados del período según ingreso/egreso del empleado.
 * Regla de negocio: el básico mensual se prorratea por días corridos sobre los
 * días reales del mes, así que cubrir el mes completo devuelve los días del mes
 * (agosto 31, febrero 28). Devuelve 0 si el empleado no se solapa con el
 * período (ingreso posterior o egreso anterior).
 */
export function calcularDiasComputados(
  periodo: string,               // 'YYYY-MM'
  fechaIngreso?: string | null,
  fechaEgreso?: string | null,
): number {
  const [anio, mes] = periodo.split('-').map(Number);
  if (!anio || !mes) return 30;
  const ini = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0); // último día del mes
  const diasMes = fin.getDate();

  // Las fechas vienen como 'YYYY-MM-DD'; parseamos manual para evitar UTC.
  const parse = (s?: string | null): Date | null => {
    if (!s) return null;
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
  };
  const ingreso = parse(fechaIngreso);
  const egreso = parse(fechaEgreso);

  const effIni = ingreso && ingreso > ini ? ingreso : ini;
  const effFin = egreso && egreso < fin ? egreso : fin;
  if (effIni > effFin) return 0;
  if (effIni.getTime() === ini.getTime() && effFin.getTime() === fin.getTime()) return diasMes;

  const dias = Math.round((effFin.getTime() - effIni.getTime()) / 86_400_000) + 1;
  return Math.min(dias, diasMes);
}

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
 *   - Bono producción: tomar el monto del mayor umbral <= unidades producidas.
 *   - Bono ventas: monto ya resuelto por las metas mensuales (backend), editable.
 */
export function calcularRemuneracion(input: RemuneracionInput): RemuneracionOutput {
  const cat = input.categoria;
  const diasBase = Math.max(1, Number(input.diasBase ?? 30));
  const diasComputados = Math.max(0, Math.min(diasBase, Number(input.diasComputados ?? diasBase)));
  const sueldoBasico = round2((Number(cat.sueldoFijo) || 0) * (diasComputados / diasBase));

  const presentismoPct = Math.max(0, Math.min(100, Number(input.presentismoPct) || 0));
  const presentismoMonto = round2(sueldoBasico * 0.08 * (presentismoPct / 100));

  const horasExtraCant = Number(input.horasExtraCant) || 0;
  const horasExtraMonto = round2(horasExtraCant * (Number(cat.horaExtraValor) || 0));

  const horasAusenteCant = Number(input.horasAusenteCant) || 0;
  const horasAusenteMonto = round2(horasAusenteCant * (Number(cat.horaAusenteValor) || 0));

  const kmCant = Number(input.kmCant) || 0;
  const kmMonto = round2(kmCant * (Number(cat.kmValor) || 0));

  const bonoProduccion = pickBonoPorUmbral(input.bonosProduccion, input.unidadesProducidas);
  // El bono de ventas ya viene resuelto por las metas mensuales (backend); es editable.
  const bonoVentas = round2(Number(input.bonoVentas) || 0);

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
