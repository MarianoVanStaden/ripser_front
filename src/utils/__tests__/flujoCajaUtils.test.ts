import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dayjs from 'dayjs';
import {
  formatCurrency,
  formatPercentage,
  aggregateByPaymentMethod,
  aggregateChequeStatus,
  prepareTimeSeriesData,
  calculateWeeklyTrend,
  getOptimalGranularity,
} from '../flujoCajaUtils';
import { makeMovimiento, makeMovimientoCheque } from '../../test/factories';

describe('flujoCajaUtils', () => {
  describe('formatCurrency / formatPercentage', () => {
    it('formatea moneda es-AR sin decimales', () => {
      expect(formatCurrency(1_234_567)).toBe('$1.234.567');
    });
    it('formatea porcentaje con 1 decimal', () => {
      expect(formatPercentage(12.34)).toBe('12.3%');
    });
  });

  describe('aggregateByPaymentMethod', () => {
    it('agrega ingresos/egresos/flujoNeto y % por método, filtrando los vacíos', () => {
      const movs = [
        makeMovimiento({ metodoPago: 'EFECTIVO', tipo: 'INGRESO', importe: 100 }),
        makeMovimiento({ metodoPago: 'EFECTIVO', tipo: 'EGRESO', importe: 40 }),
        makeMovimiento({ metodoPago: 'CHEQUE', tipo: 'INGRESO', importe: 60 }),
      ];
      const agg = aggregateByPaymentMethod(movs);

      const efectivo = agg.find((a) => a.metodoPago === 'EFECTIVO')!;
      expect(efectivo.totalIngresos).toBe(100);
      expect(efectivo.totalEgresos).toBe(40);
      expect(efectivo.flujoNeto).toBe(60);
      expect(efectivo.cantidadMovimientos).toBe(2);
      expect(efectivo.porcentajeDelTotal).toBeCloseTo(70, 5); // 140 / 200

      // Métodos sin movimientos no aparecen (p. ej. TARJETA_CREDITO).
      expect(agg.some((a) => a.cantidadMovimientos === 0)).toBe(false);
      expect(agg.find((a) => a.metodoPago === 'CHEQUE')!.porcentajeDelTotal).toBeCloseTo(30, 5);
    });
  });

  describe('aggregateChequeStatus', () => {
    it('cuenta sólo movimientos CHEQUE con estado, agrupando por estado', () => {
      const movs = [
        makeMovimientoCheque('EN_CARTERA', { importe: 100 }),
        makeMovimientoCheque('EN_CARTERA', { importe: 200 }),
        makeMovimientoCheque('DEPOSITADO', { importe: 50 }),
        makeMovimiento({ metodoPago: 'EFECTIVO', importe: 999 }), // ignorado
      ];
      const agg = aggregateChequeStatus(movs);

      const enCartera = agg.find((a) => a.estado === 'EN_CARTERA')!;
      expect(enCartera.cantidad).toBe(2);
      expect(enCartera.montoTotal).toBe(300);
      expect(agg.find((a) => a.estado === 'DEPOSITADO')!.montoTotal).toBe(50);
      expect(agg.some((a) => a.estado === 'COBRADO')).toBe(false); // sin cheques → filtrado
    });
  });

  describe('prepareTimeSeriesData', () => {
    it('agrupa por día y ordena ascendente', () => {
      const movs = [
        makeMovimiento({ fecha: '2026-07-16T10:00:00', tipo: 'EGRESO', importe: 30 }),
        makeMovimiento({ fecha: '2026-07-15T10:00:00', tipo: 'INGRESO', importe: 100 }),
        makeMovimiento({ fecha: '2026-07-15T18:00:00', tipo: 'INGRESO', importe: 50 }),
      ];
      const serie = prepareTimeSeriesData(movs, 'day');
      expect(serie.map((s) => s.fecha)).toEqual(['2026-07-15', '2026-07-16']);
      expect(serie[0].ingresos).toBe(150);
      expect(serie[0].flujoNeto).toBe(150);
      expect(serie[1].egresos).toBe(30);
    });

    it('colapsa todo el mes en un bucket con granularidad month', () => {
      const movs = [
        makeMovimiento({ fecha: '2026-07-02T10:00:00', importe: 100 }),
        makeMovimiento({ fecha: '2026-07-28T10:00:00', importe: 200 }),
      ];
      const serie = prepareTimeSeriesData(movs, 'month');
      expect(serie).toHaveLength(1);
      expect(serie[0].fecha).toBe('2026-07-01');
      expect(serie[0].ingresos).toBe(300);
    });
  });

  describe('getOptimalGranularity', () => {
    it('elige día / semana / mes según el rango', () => {
      const d = (s: string) => dayjs(s);
      expect(getOptimalGranularity(d('2026-07-01'), d('2026-07-20'))).toBe('day');   // 19d
      expect(getOptimalGranularity(d('2026-07-01'), d('2026-09-15'))).toBe('week');  // 76d
      expect(getOptimalGranularity(d('2026-01-01'), d('2026-07-01'))).toBe('month'); // >90d
      expect(getOptimalGranularity(null, d('2026-07-01'))).toBe('day');
    });
  });

  describe('calculateWeeklyTrend', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-20T12:00:00'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('compara la última semana contra la anterior en %', () => {
      const movs = [
        makeMovimiento({ fecha: '2026-07-18T12:00:00', tipo: 'INGRESO', importe: 200 }), // últ. semana
        makeMovimiento({ fecha: '2026-07-08T12:00:00', tipo: 'INGRESO', importe: 100 }), // sem. previa
      ];
      // (200 - 100) / |100| * 100 = 100%
      expect(calculateWeeklyTrend(movs)).toBeCloseTo(100, 5);
    });

    it('devuelve 0 cuando la semana previa no tuvo movimientos', () => {
      const movs = [makeMovimiento({ fecha: '2026-07-18T12:00:00', tipo: 'INGRESO', importe: 200 })];
      expect(calculateWeeklyTrend(movs)).toBe(0);
    });
  });
});
