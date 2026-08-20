import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dayjs from 'dayjs';
import {
  formatCurrency,
  formatPercentage,
  aggregateByPaymentMethod,
  aggregateChequeStatus,
  prepareTimeSeriesData,
  calculateWeeklyTrend,
  calculateKPIs,
  calculateKPIsFromBackend,
  getOptimalGranularity,
} from '../flujoCajaUtils';
import { makeMovimiento, makeMovimientoCheque } from '../../test/factories';
import type {
  ChequeEstadoResumenDTO,
  ChequeStatusAggregation,
  FlujoCajaMovimientoEnhanced,
  FlujoCajaResponseEnhanced,
  PaymentMethodAggregation,
  ResumenChequesDTO,
  SaldoPorMetodoPagoDTO,
} from '../../types';

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

  describe('calculateKPIs', () => {
    const movs: FlujoCajaMovimientoEnhanced[] = [
      makeMovimiento({ tipo: 'INGRESO', importe: 100_000, metodoPago: 'EFECTIVO', entidad: 'Cliente A', fecha: '2026-07-15' }),
      makeMovimiento({ tipo: 'INGRESO', importe: 300_000, metodoPago: 'CHEQUE', entidad: 'Cliente B', fecha: '2026-07-16' }),
      makeMovimiento({ tipo: 'EGRESO', importe: 50_000, metodoPago: 'EFECTIVO', entidad: 'Prov X', fecha: '2026-07-15' }),
      makeMovimiento({ tipo: 'EGRESO', importe: 200_000, metodoPago: 'TRANSFERENCIA_BANCARIA', entidad: 'Prov Y', fecha: '2026-07-17' }),
    ];
    const response: FlujoCajaResponseEnhanced = {
      totalIngresos: 400_000,
      totalEgresos: 250_000,
      flujoNeto: 150_000,
      totalMovimientos: 4,
      movimientos: movs,
    };

    it('pasa básicos y calcula ticket promedio, mediana, mayor ingreso/egreso y promedios diarios', () => {
      const kpi = calculateKPIs(response);
      expect(kpi.totalIngresos).toBe(400_000);
      expect(kpi.flujoNeto).toBe(150_000);
      expect(kpi.totalMovimientos).toBe(4);
      expect(kpi.ticketPromedio).toBe(162_500); // (400000 + 250000) / 4
      // Mediana = elemento en floor(n/2) del array ordenado (upper-middle en n par, NO el promedio de los dos centrales)
      expect(kpi.medianaTransaccion).toBe(200_000); // [50k,100k,200k,300k][2]
      expect(kpi.mayorIngreso.importe).toBe(300_000);
      expect(kpi.mayorIngreso.entidad).toBe('Cliente B');
      expect(kpi.mayorEgreso.importe).toBe(200_000);
      expect(kpi.mayorEgreso.entidad).toBe('Prov Y');
      // 3 fechas únicas (15/16/17) como divisor
      expect(kpi.promedioIngresoDiario).toBeCloseTo(133_333.33, 2); // 400000/3
      expect(kpi.promedioEgresoDiario).toBeCloseTo(83_333.33, 2);   // 250000/3
    });

    it('mediana en cantidad impar = elemento central', () => {
      const impar: FlujoCajaResponseEnhanced = { ...response, movimientos: movs.slice(0, 3), totalMovimientos: 3 };
      // importes [50k,100k,300k] → índice floor(3/2)=1 → 100k
      expect(calculateKPIs(impar).medianaTransaccion).toBe(100_000);
    });

    it('método de pago más usado = el de mayor cantidad del agregado por método', () => {
      const porMetodo: PaymentMethodAggregation[] = [
        { metodoPago: 'EFECTIVO', totalIngresos: 100_000, totalEgresos: 50_000, flujoNeto: 50_000, cantidadMovimientos: 2, porcentajeDelTotal: 50 },
        { metodoPago: 'CHEQUE', totalIngresos: 300_000, totalEgresos: 0, flujoNeto: 300_000, cantidadMovimientos: 1, porcentajeDelTotal: 25 },
      ];
      const kpi = calculateKPIs(response, porMetodo);
      expect(kpi.metodoPagoMasUsado.metodo).toBe('EFECTIVO');
      expect(kpi.metodoPagoMasUsado.cantidad).toBe(2);
      expect(kpi.metodoPagoMasUsado.porcentaje).toBe(50);
    });

    it('sin agregado por método, el más usado cae a EFECTIVO/0/0', () => {
      expect(calculateKPIs(response).metodoPagoMasUsado).toEqual({ metodo: 'EFECTIVO', cantidad: 0, porcentaje: 0 });
    });

    it('cheques en cartera salen del agregado de cheques (o undefined si no viene)', () => {
      const chequeData: ChequeStatusAggregation[] = [
        { estado: 'EN_CARTERA', cantidad: 2, montoTotal: 300_000 },
        { estado: 'DEPOSITADO', cantidad: 1, montoTotal: 50_000 },
      ];
      expect(calculateKPIs(response, undefined, chequeData).chequesEnCartera).toEqual({ cantidad: 2, monto: 300_000 });
      expect(calculateKPIs(response).chequesEnCartera).toBeUndefined();
    });

    it('respuesta vacía: ticket/mediana 0, mayor ingreso en 0 y promedios sin dividir por cero', () => {
      const vacia: FlujoCajaResponseEnhanced = {
        totalIngresos: 0, totalEgresos: 0, flujoNeto: 0, totalMovimientos: 0, movimientos: [],
      };
      const kpi = calculateKPIs(vacia);
      expect(kpi.ticketPromedio).toBe(0);
      expect(kpi.medianaTransaccion).toBe(0);
      expect(kpi.mayorIngreso.importe).toBe(0);
      expect(kpi.promedioIngresoDiario).toBe(0); // 0 / (0 || 1)
    });
  });

  describe('calculateKPIsFromBackend', () => {
    const cheq = (cantidad: number, monto: number): ChequeEstadoResumenDTO => ({ cantidad, monto });
    const makeResumen = (over: Partial<ResumenChequesDTO> = {}): ResumenChequesDTO => ({
      enCartera: cheq(0, 0), depositados: cheq(0, 0), cobrados: cheq(0, 0), rechazados: cheq(0, 0),
      porVencer7Dias: cheq(0, 0), emitidos: cheq(0, 0), anulados: cheq(0, 0),
      totalEnCartera: 0, totalPorCobrar: 0, chequesVencidos: 0, ...over,
    });
    const movs: FlujoCajaMovimientoEnhanced[] = [
      makeMovimiento({ tipo: 'INGRESO', importe: 100_000, entidad: 'Cliente A', fecha: '2026-07-15' }),
      makeMovimiento({ tipo: 'INGRESO', importe: 300_000, entidad: 'Cliente B', fecha: '2026-07-16' }),
      makeMovimiento({ tipo: 'EGRESO', importe: 250_000, entidad: 'Prov Y', fecha: '2026-07-17' }),
    ];
    const base: FlujoCajaResponseEnhanced = {
      totalIngresos: 400_000, totalEgresos: 250_000, flujoNeto: 150_000, totalMovimientos: 3, movimientos: movs,
    };

    it('método más usado sale de saldosPorMetodoPago del backend (usa .porcentaje, no .porcentajeDelTotal)', () => {
      const saldos: SaldoPorMetodoPagoDTO[] = [
        { metodoPago: 'EFECTIVO', ingresos: 100_000, egresos: 250_000, saldo: -150_000, porcentaje: 60, cantidadMovimientos: 3 },
        { metodoPago: 'CHEQUE', ingresos: 300_000, egresos: 0, saldo: 300_000, porcentaje: 40, cantidadMovimientos: 1 },
      ];
      const kpi = calculateKPIsFromBackend({ ...base, saldosPorMetodoPago: saldos });
      expect(kpi.metodoPagoMasUsado).toEqual({ metodo: 'EFECTIVO', cantidad: 3, porcentaje: 60 });
      expect(kpi.ticketPromedio).toBeCloseTo(216_666.67, 2); // 650000/3
      expect(kpi.mayorIngreso.importe).toBe(300_000);
      expect(kpi.mayorEgreso.importe).toBe(250_000);
    });

    it('cheques salen del resumen del backend (enCartera, vencidos con cantidad 0, por vencer 7 días)', () => {
      const resumen = makeResumen({
        enCartera: cheq(2, 300_000),
        porVencer7Dias: cheq(1, 100_000),
        chequesVencidos: 5_000,
      });
      const kpi = calculateKPIsFromBackend({ ...base, resumenCheques: resumen });
      expect(kpi.chequesEnCartera).toEqual({ cantidad: 2, monto: 300_000 });
      expect(kpi.chequesPorVencer7Dias).toEqual({ cantidad: 1, monto: 100_000 });
      // Quirk: chequesVencidos es un monto suelto → cantidad se reporta como 0.
      expect(kpi.chequesVencidos).toEqual({ cantidad: 0, monto: 5_000 });
    });

    it('sin vencidos (0) → chequesVencidos undefined; sin resumen/saldos → cheques undefined y EFECTIVO/0/0', () => {
      const conResumenSinVencidos = calculateKPIsFromBackend({ ...base, resumenCheques: makeResumen({ enCartera: cheq(1, 10) }) });
      expect(conResumenSinVencidos.chequesVencidos).toBeUndefined(); // chequesVencidos = 0

      const pelado = calculateKPIsFromBackend(base);
      expect(pelado.chequesEnCartera).toBeUndefined();
      expect(pelado.chequesVencidos).toBeUndefined();
      expect(pelado.metodoPagoMasUsado).toEqual({ metodo: 'EFECTIVO', cantidad: 0, porcentaje: 0 });
    });
  });
});
