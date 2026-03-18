import { describe, it, expect } from 'vitest';
import {
  calculateSellingPrice,
  calculateMarginPercentage,
  formatPrice,
  PRECIO_PARAMETROS,
} from '../priceCalculations';

describe('priceCalculations', () => {
  describe('calculateSellingPrice', () => {
    it('applies profit margin and rounding correctly', () => {
      // costo=1000, ganancia=27.67%, redondeo=100
      // 1000 * 1.2767 = 1276.7 → round to nearest 100 = 1300
      expect(calculateSellingPrice(1000, 27.67, 100)).toBe(1300);
    });

    it('returns 0 for zero cost', () => {
      expect(calculateSellingPrice(0, 30, 100)).toBe(0);
    });

    it('returns 0 for negative cost', () => {
      expect(calculateSellingPrice(-100, 30, 100)).toBe(0);
    });

    it('returns 0 for non-finite cost', () => {
      expect(calculateSellingPrice(Infinity, 30, 100)).toBe(0);
      expect(calculateSellingPrice(NaN, 30, 100)).toBe(0);
    });

    it('rounds to nearest cent when redondeo is 0', () => {
      // costo=100, ganancia=33.33% → 133.33
      expect(calculateSellingPrice(100, 33.33, 0)).toBe(133.33);
    });

    it('handles 0% margin', () => {
      expect(calculateSellingPrice(500, 0, 100)).toBe(500);
    });

    it('handles large rounding values', () => {
      // 1000 * 1.5 = 1500, round to nearest 1000 = 2000
      expect(calculateSellingPrice(1000, 50, 1000)).toBe(2000);
    });

    it('handles small rounding values', () => {
      // 100 * 1.25 = 125, round to nearest 10 = 130
      expect(calculateSellingPrice(100, 25, 10)).toBe(130);
    });
  });

  describe('calculateMarginPercentage', () => {
    it('calculates correct margin', () => {
      // (200-100)/100 * 100 = 100%
      expect(calculateMarginPercentage(100, 200)).toBe(100);
    });

    it('calculates fractional margins', () => {
      // (130-100)/100 * 100 = 30%
      expect(calculateMarginPercentage(100, 130)).toBe(30);
    });

    it('returns 0 for zero cost', () => {
      expect(calculateMarginPercentage(0, 100)).toBe(0);
    });

    it('returns 0 for negative cost', () => {
      expect(calculateMarginPercentage(-50, 100)).toBe(0);
    });

    it('handles price lower than cost (negative margin)', () => {
      // (80-100)/100 * 100 = -20%
      expect(calculateMarginPercentage(100, 80)).toBe(-20);
    });
  });

  describe('formatPrice', () => {
    it('formats a number as Argentine pesos', () => {
      const result = formatPrice(1500.5);
      expect(result).toContain('$');
      // locale formatting varies by environment; just ensure it has digits
      expect(result).toMatch(/1[.,]?500/)
    });

    it('returns dash for null', () => {
      expect(formatPrice(null)).toBe('-');
    });

    it('returns dash for undefined', () => {
      expect(formatPrice(undefined)).toBe('-');
    });

    it('formats zero', () => {
      const result = formatPrice(0);
      expect(result).toContain('$');
      expect(result).toContain('0');
    });
  });

  describe('PRECIO_PARAMETROS', () => {
    it('has the expected parameter keys', () => {
      expect(PRECIO_PARAMETROS.PORCENTAJE_GANANCIA).toBe('PORCENTAJE_GANANCIA');
      expect(PRECIO_PARAMETROS.REDONDEO_PRECIO).toBe('REDONDEO_PRECIO');
    });
  });
});
