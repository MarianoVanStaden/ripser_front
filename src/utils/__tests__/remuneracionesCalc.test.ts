import { describe, it, expect } from 'vitest';
import {
  diasDelMes,
  calcularDiasComputados,
  calcularRemuneracion,
  type RemuneracionInput,
} from '../remuneracionesCalc';
import type { BonoProduccionTabla, CategoriaSalarial } from '../../types';

// Caracterización del money-math de sueldos (prorrateo por ingreso/egreso a
// mitad de mes, presentismo 8%, bonos por umbral, descuentos). Módulo puro sin
// cobertura previa. Fija los números exactos que hoy ve el form de Sueldo; el
// backend revalida al persistir, así que un drift acá = preview mintiendo.

const makeCategoria = (over: Partial<CategoriaSalarial> = {}): CategoriaSalarial => ({
  id: 1,
  nombre: 'Operario',
  sueldoFijo: 660000,
  presentismoDia: 0,
  horaExtraValor: 5000,
  horaAusenteValor: 3000,
  kmValor: 100,
  activo: true,
  ...over,
});

const baseInput = (over: Partial<RemuneracionInput> = {}): RemuneracionInput => ({
  categoria: makeCategoria(),
  presentismoPct: 0,
  horasExtraCant: 0,
  horasAusenteCant: 0,
  kmCant: 0,
  ...over,
});

describe('remuneracionesCalc', () => {
  describe('diasDelMes', () => {
    it('devuelve los días reales de cada mes', () => {
      expect(diasDelMes('2026-08')).toBe(31); // agosto
      expect(diasDelMes('2026-04')).toBe(30); // abril
      expect(diasDelMes('2026-02')).toBe(28); // febrero no bisiesto
      expect(diasDelMes('2024-02')).toBe(29); // febrero bisiesto
      expect(diasDelMes('2026-12')).toBe(31);
    });

    it('devuelve 30 ante un período inválido', () => {
      expect(diasDelMes('')).toBe(30);
      expect(diasDelMes('basura')).toBe(30);
      expect(diasDelMes('2026-')).toBe(30);
    });
  });

  describe('calcularDiasComputados', () => {
    it('mes completo (sin ingreso/egreso) = días del mes', () => {
      expect(calcularDiasComputados('2026-08')).toBe(31);
      expect(calcularDiasComputados('2026-02')).toBe(28);
    });

    it('ingreso a mitad de mes: cuenta desde el ingreso hasta fin de mes, inclusive', () => {
      // Del 16 al 31 de agosto = 16 días.
      expect(calcularDiasComputados('2026-08', '2026-08-16', null)).toBe(16);
    });

    it('egreso a mitad de mes: cuenta desde inicio de mes hasta el egreso, inclusive', () => {
      // Del 1 al 10 de agosto = 10 días.
      expect(calcularDiasComputados('2026-08', null, '2026-08-10')).toBe(10);
    });

    it('ingreso y egreso ambos a mitad de mes: rango inclusive', () => {
      // Del 11 al 20 de agosto = 10 días.
      expect(calcularDiasComputados('2026-08', '2026-08-11', '2026-08-20')).toBe(10);
    });

    it('ingreso día 1 y egreso último día exactos = mes completo (atajo de borde)', () => {
      expect(calcularDiasComputados('2026-08', '2026-08-01', '2026-08-31')).toBe(31);
    });

    it('ingreso anterior al mes se trata como inicio de mes', () => {
      expect(calcularDiasComputados('2026-08', '2026-07-01', null)).toBe(31);
    });

    it('egreso posterior al mes se trata como fin de mes', () => {
      expect(calcularDiasComputados('2026-08', null, '2026-09-30')).toBe(31);
    });

    it('sin solapamiento devuelve 0 (ingreso posterior al período o egreso anterior)', () => {
      expect(calcularDiasComputados('2026-08', '2026-09-01', null)).toBe(0);
      expect(calcularDiasComputados('2026-08', null, '2026-07-15')).toBe(0);
    });

    it('devuelve 30 ante período inválido', () => {
      expect(calcularDiasComputados('nope', '2026-08-01', null)).toBe(30);
    });
  });

  describe('calcularRemuneracion — básico y presentismo', () => {
    it('mes completo con presentismo 100%: básico intacto + 8%', () => {
      const r = calcularRemuneracion(baseInput({ presentismoPct: 100 }));
      expect(r.sueldoBasico).toBe(660000);
      expect(r.presentismoMonto).toBe(52800); // 660000 * 0.08
      expect(r.totalBruto).toBe(712800);
      expect(r.totalDescuentos).toBe(0);
      expect(r.sueldoNeto).toBe(712800);
    });

    it('prorratea el básico por días computados / días base', () => {
      const r = calcularRemuneracion(baseInput({
        presentismoPct: 100, diasComputados: 15, diasBase: 30,
      }));
      expect(r.sueldoBasico).toBe(330000); // 660000 * 15/30
      expect(r.presentismoMonto).toBe(26400); // sobre el básico prorrateado
      expect(r.totalBruto).toBe(356400);
    });

    it('presentismo parcial: 8% del básico escalado por % de asistencia', () => {
      const r = calcularRemuneracion(baseInput({ presentismoPct: 50 }));
      expect(r.presentismoMonto).toBe(26400); // 660000 * 0.08 * 0.5
    });

    it('presentismo clamp a [0, 100]', () => {
      expect(calcularRemuneracion(baseInput({ presentismoPct: 150 })).presentismoMonto).toBe(52800);
      expect(calcularRemuneracion(baseInput({ presentismoPct: -10 })).presentismoMonto).toBe(0);
    });

    it('días computados nunca superan días base (clamp)', () => {
      const r = calcularRemuneracion(baseInput({ diasComputados: 40, diasBase: 30 }));
      expect(r.sueldoBasico).toBe(660000); // 40 recortado a 30 → mes completo
    });

    it('diasBase 0 se protege a 1 (no divide por cero)', () => {
      const r = calcularRemuneracion(baseInput({ diasBase: 0 }));
      expect(r.sueldoBasico).toBe(660000); // sueldoFijo * 1/1
    });
  });

  describe('calcularRemuneracion — horas, km y descuentos', () => {
    it('hora extra, hora ausente y km usan las tarifas de la categoría', () => {
      const r = calcularRemuneracion(baseInput({
        presentismoPct: 100,
        horasExtraCant: 10,     // × 5000 = 50000 (suma)
        horasAusenteCant: 4,    // × 3000 = 12000 (resta)
        kmCant: 120,            // × 100 = 12000 (suma)
      }));
      expect(r.horasExtraMonto).toBe(50000);
      expect(r.kmMonto).toBe(12000);
      expect(r.horasAusenteMonto).toBe(12000);
      expect(r.totalBruto).toBe(774800); // 660000 + 52800 + 50000 + 12000
      expect(r.totalDescuentos).toBe(12000); // solo la hora ausente
      expect(r.sueldoNeto).toBe(762800);
    });

    it('suma legales + otros + horas ausentes + adelantos en descuentos', () => {
      const r = calcularRemuneracion(baseInput({
        presentismoPct: 100,
        horasAusenteCant: 2, // 6000
        descuentosLegales: 10000,
        descuentosOtros: 5000,
        adelantos: 20000,
      }));
      expect(r.totalDescuentos).toBe(41000); // 10000+5000+6000+20000
      expect(r.sueldoNeto).toBe(671800); // 712800 - 41000
    });
  });

  describe('calcularRemuneracion — bonos', () => {
    const tabla: BonoProduccionTabla[] = [
      { id: 1, categoriaSalarialId: 1, umbralUnidades: 10, monto: 5000 },
      { id: 2, categoriaSalarialId: 1, umbralUnidades: 20, monto: 12000 },
      { id: 3, categoriaSalarialId: 1, umbralUnidades: 30, monto: 20000 },
    ];

    it('bono de producción = monto del mayor umbral <= unidades', () => {
      expect(calcularRemuneracion(baseInput({ bonosProduccion: tabla, unidadesProducidas: 25 })).bonoProduccion).toBe(12000);
      expect(calcularRemuneracion(baseInput({ bonosProduccion: tabla, unidadesProducidas: 30 })).bonoProduccion).toBe(20000);
      expect(calcularRemuneracion(baseInput({ bonosProduccion: tabla, unidadesProducidas: 100 })).bonoProduccion).toBe(20000);
    });

    it('bono de producción 0 si ningún umbral aplica, tabla vacía o unidades indefinidas', () => {
      expect(calcularRemuneracion(baseInput({ bonosProduccion: tabla, unidadesProducidas: 5 })).bonoProduccion).toBe(0);
      expect(calcularRemuneracion(baseInput({ bonosProduccion: [], unidadesProducidas: 50 })).bonoProduccion).toBe(0);
      expect(calcularRemuneracion(baseInput({ bonosProduccion: tabla })).bonoProduccion).toBe(0);
    });

    it('bono de ventas y montos manuales pasan directo al bruto', () => {
      const r = calcularRemuneracion(baseInput({
        presentismoPct: 100,
        bonoVentas: 15000,
        bonificaciones: 3000,
        comisiones: 2000,
        bonoEspecial: 1000,
      }));
      expect(r.bonoVentas).toBe(15000);
      expect(r.totalBruto).toBe(733800); // 660000 + 52800 + 15000 + 3000 + 2000 + 1000
    });
  });

  describe('calcularRemuneracion — redondeo y entradas inválidas', () => {
    it('redondea a 2 decimales el prorrateo no exacto', () => {
      const r = calcularRemuneracion(baseInput({
        categoria: makeCategoria({ sueldoFijo: 100000 }),
        presentismoPct: 100,
        diasComputados: 7,
        diasBase: 30,
      }));
      expect(r.sueldoBasico).toBe(23333.33); // 100000 * 7/30 = 23333.33...
      expect(r.presentismoMonto).toBe(1866.67); // 23333.33 * 0.08 = 1866.6664
    });

    it('trata NaN/undefined numéricos como 0', () => {
      const r = calcularRemuneracion({
        categoria: makeCategoria(),
        presentismoPct: 0,
        horasExtraCant: Number.NaN,
        horasAusenteCant: Number.NaN,
        kmCant: Number.NaN,
      });
      expect(r.horasExtraMonto).toBe(0);
      expect(r.horasAusenteMonto).toBe(0);
      expect(r.kmMonto).toBe(0);
      expect(r.totalBruto).toBe(660000); // solo el básico
      expect(r.sueldoNeto).toBe(660000);
    });
  });
});
