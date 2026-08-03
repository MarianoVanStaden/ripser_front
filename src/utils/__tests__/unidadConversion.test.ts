import { describe, it, expect } from 'vitest';
import { unidadFisicaLabel, formatEquivalencia } from '../unidadConversion';

describe('unidadConversion', () => {
  describe('unidadFisicaLabel', () => {
    it('mapea las unidades conocidas', () => {
      expect(unidadFisicaLabel('METROS')).toBe('m');
      expect(unidadFisicaLabel('KG')).toBe('kg');
      expect(unidadFisicaLabel('M2')).toBe('m²');
      expect(unidadFisicaLabel('LITROS')).toBe('l');
    });

    it('cae a lowercase para unidades desconocidas', () => {
      expect(unidadFisicaLabel('FOO')).toBe('foo');
    });

    it('devuelve string vacío para null/undefined', () => {
      expect(unidadFisicaLabel(null)).toBe('');
      expect(unidadFisicaLabel(undefined)).toBe('');
    });
  });

  describe('formatEquivalencia', () => {
    it('convierte cantidad física a unidades de inventario dividiendo por el factor', () => {
      // 45 m con factor 22,5 (m por rollo) = 2 rollos
      expect(formatEquivalencia(45, 'METROS', 'Rollo', 22.5)).toBe('≈ 2 Rollo');
    });

    it('formatea fracciones con hasta 6 decimales en es-AR', () => {
      const r = formatEquivalencia(1, 'METROS', 'Rollo', 22.5);
      // 1 / 22,5 = 0,0444... → coma decimal es-AR
      expect(r).toMatch(/^≈ 0,0444/);
      expect(r).toContain('Rollo');
    });

    it('usa "u. compra" cuando no se pasa unidad de inventario', () => {
      expect(formatEquivalencia(10, 'METROS', null, 5)).toBe('≈ 2 u. compra');
    });

    it('devuelve null cuando no hay factor o el factor es <= 0', () => {
      expect(formatEquivalencia(10, 'METROS', 'Rollo', null)).toBeNull();
      expect(formatEquivalencia(10, 'METROS', 'Rollo', 0)).toBeNull();
      expect(formatEquivalencia(10, 'METROS', 'Rollo', -3)).toBeNull();
    });

    it('devuelve null para materiales por UNIDAD (no aplica conversión)', () => {
      expect(formatEquivalencia(10, 'UNIDAD', 'Caja', 12)).toBeNull();
    });
  });
});
