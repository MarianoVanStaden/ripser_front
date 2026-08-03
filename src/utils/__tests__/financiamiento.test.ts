import { describe, it, expect } from 'vitest';
import {
  calcularFinanciamientoPropio,
  calculateCostoEnvio,
  formatCurrencyARS,
  getMetodoPagoLabel,
  isFinanciamientoPropio,
  PORCENTAJE_ENTREGA_PROPIO,
} from '../financiamiento';
import { makeDetalle } from '../../test/factories';
import type { DetalleDocumento } from '../../types';

describe('financiamiento', () => {
  describe('calcularFinanciamientoPropio', () => {
    it('descompone entrega/saldo/interés/cuota con números exactos', () => {
      // base=1.000.000, entrega=40%, tasa=10%, 12 cuotas, envío=50.000
      const r = calcularFinanciamientoPropio(1_000_000, 10, 12, 0.4, 50_000);
      expect(r.entrega).toBe(450_000);          // 400.000 (40% equipo) + 50.000 envío
      expect(r.saldo).toBe(600_000);            // financia sólo el equipo
      expect(r.saldoConInteres).toBe(660_000);  // 600.000 * 1,10
      expect(r.cuotaEstimada).toBe(55_000);     // 660.000 / 12
      expect(r.totalEstimado).toBe(1_110_000);  // entrega + saldoConInteres
    });

    it('el costo de envío entra en la entrega pero NO se financia', () => {
      const sinEnvio = calcularFinanciamientoPropio(1_000_000, 10, 12, 0.4, 0);
      const conEnvio = calcularFinanciamientoPropio(1_000_000, 10, 12, 0.4, 50_000);
      expect(conEnvio.entrega - sinEnvio.entrega).toBe(50_000);
      expect(conEnvio.saldoConInteres).toBe(sinEnvio.saldoConInteres); // saldo intacto
    });

    it('usa el porcentaje de entrega por defecto (40%) cuando no se pasa', () => {
      const r = calcularFinanciamientoPropio(1_000_000, 0, 6);
      expect(r.porcentajeEntrega).toBe(PORCENTAJE_ENTREGA_PROPIO);
      expect(r.entrega).toBe(400_000);
    });

    it('trata tasa null/undefined como 0% (no NaN)', () => {
      const r = calcularFinanciamientoPropio(1_000_000, undefined as unknown as number, 6);
      expect(r.saldoConInteres).toBe(600_000);
      expect(Number.isNaN(r.cuotaEstimada)).toBe(false);
    });

    it('cuotaEstimada = 0 cuando cuotas es 0 (no divide por cero)', () => {
      const r = calcularFinanciamientoPropio(1_000_000, 10, 0);
      expect(r.cuotaEstimada).toBe(0);
    });
  });

  describe('calculateCostoEnvio', () => {
    it('suma sólo los detalles con tipoItem ENVIO', () => {
      const detalles = [
        makeDetalle({ tipoItem: 'PRODUCTO', subtotal: 900_000 }),
        makeDetalle({ tipoItem: 'ENVIO', subtotal: 30_000 }),
        makeDetalle({ tipoItem: 'ENVIO', subtotal: 20_000 }),
      ] as unknown as DetalleDocumento[];
      expect(calculateCostoEnvio(detalles)).toBe(50_000);
    });

    it('devuelve 0 sin detalles de envío', () => {
      const detalles = [makeDetalle({ tipoItem: 'PRODUCTO', subtotal: 100 })] as unknown as DetalleDocumento[];
      expect(calculateCostoEnvio(detalles)).toBe(0);
    });

    it('tolera subtotal ausente (lo cuenta como 0)', () => {
      const detalles = [{ tipoItem: 'ENVIO' }] as unknown as DetalleDocumento[];
      expect(calculateCostoEnvio(detalles)).toBe(0);
    });
  });

  describe('formatCurrencyARS', () => {
    it('formatea con separador de miles es-AR sin decimales por defecto', () => {
      expect(formatCurrencyARS(1_234_567)).toBe('$1.234.567');
    });

    it('respeta la cantidad de decimales pedida', () => {
      expect(formatCurrencyARS(1_500.5, 2)).toBe('$1.500,50');
    });

    it('trata null/undefined como 0', () => {
      expect(formatCurrencyARS(null)).toBe('$0');
      expect(formatCurrencyARS(undefined)).toBe('$0');
    });
  });

  describe('getMetodoPagoLabel / isFinanciamientoPropio', () => {
    it('mapea el método a su etiqueta y cae al string crudo si es desconocido', () => {
      expect(getMetodoPagoLabel('EFECTIVO')).toBe('Efectivo');
      expect(getMetodoPagoLabel('METODO_RARO' as never)).toBe('METODO_RARO');
      expect(getMetodoPagoLabel(null)).toBe('—');
    });

    it('reconoce ambos alias de financiamiento propio', () => {
      expect(isFinanciamientoPropio('FINANCIAMIENTO')).toBe(true);
      expect(isFinanciamientoPropio('FINANCIACION_PROPIA')).toBe(true);
      expect(isFinanciamientoPropio('EFECTIVO')).toBe(false);
    });
  });
});
