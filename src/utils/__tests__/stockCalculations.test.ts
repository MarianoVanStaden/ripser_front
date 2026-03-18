import { describe, it, expect } from 'vitest';
import type { ProductoDTO, StockDeposito } from '../../types';
import {
  calcularStockDisponible,
  calcularStockAsignado,
  validarAsignacionStock,
  getAlertaStock,
  formatearErrorBackend,
  detectarDesincronizacion,
} from '../stockCalculations';

const makeProducto = (overrides: Partial<ProductoDTO> = {}): ProductoDTO => ({
  id: 1,
  nombre: 'Producto Test',
  precio: 100,
  costo: 50,
  stockActual: 100,
  stockMinimo: 10,
  categoriaProductoId: 1,
  activo: true,
  fechaCreacion: '2024-01-01',
  ...overrides,
});

const makeStockDeposito = (overrides: Partial<StockDeposito> = {}): StockDeposito => ({
  id: 1,
  productoId: 1,
  productoNombre: 'Producto Test',
  productoCodigo: 'P001',
  depositoId: 1,
  depositoNombre: 'Depósito 1',
  cantidad: 30,
  stockMinimo: 5,
  bajoMinimo: false,
  sobreMaximo: false,
  fechaCreacion: '2024-01-01',
  fechaActualizacion: '2024-01-01',
  ...overrides,
});

describe('stockCalculations', () => {
  describe('calcularStockDisponible', () => {
    it('returns stock not assigned to any deposit', () => {
      const producto = makeProducto({ stockActual: 100 });
      const stocks = [
        makeStockDeposito({ productoId: 1, cantidad: 30 }),
        makeStockDeposito({ id: 2, productoId: 1, cantidad: 20, depositoId: 2 }),
      ];
      // 100 - 30 - 20 = 50
      expect(calcularStockDisponible(producto, stocks)).toBe(50);
    });

    it('returns 0 when all stock is assigned', () => {
      const producto = makeProducto({ stockActual: 50 });
      const stocks = [makeStockDeposito({ productoId: 1, cantidad: 50 })];
      expect(calcularStockDisponible(producto, stocks)).toBe(0);
    });

    it('returns 0 (not negative) when assigned exceeds total', () => {
      const producto = makeProducto({ stockActual: 10 });
      const stocks = [makeStockDeposito({ productoId: 1, cantidad: 20 })];
      expect(calcularStockDisponible(producto, stocks)).toBe(0);
    });

    it('ignores stock deposits from other products', () => {
      const producto = makeProducto({ id: 1, stockActual: 100 });
      const stocks = [
        makeStockDeposito({ productoId: 1, cantidad: 30 }),
        makeStockDeposito({ productoId: 2, cantidad: 50 }),
      ];
      expect(calcularStockDisponible(producto, stocks)).toBe(70);
    });

    it('handles empty stock deposits', () => {
      const producto = makeProducto({ stockActual: 100 });
      expect(calcularStockDisponible(producto, [])).toBe(100);
    });
  });

  describe('calcularStockAsignado', () => {
    it('sums quantities for a specific product', () => {
      const stocks = [
        makeStockDeposito({ productoId: 1, cantidad: 30 }),
        makeStockDeposito({ productoId: 1, cantidad: 20, id: 2 }),
        makeStockDeposito({ productoId: 2, cantidad: 50, id: 3 }),
      ];
      expect(calcularStockAsignado(1, stocks)).toBe(50);
    });

    it('returns 0 when no deposits exist for the product', () => {
      expect(calcularStockAsignado(99, [])).toBe(0);
    });
  });

  describe('validarAsignacionStock', () => {
    it('valid when cantidad is within available stock', () => {
      expect(validarAsignacionStock(10, 50)).toEqual({ valid: true });
    });

    it('invalid for zero quantity', () => {
      const result = validarAsignacionStock(0, 50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mayor a 0');
    });

    it('invalid for negative quantity', () => {
      const result = validarAsignacionStock(-5, 50);
      expect(result.valid).toBe(false);
    });

    it('invalid when exceeding available stock', () => {
      const result = validarAsignacionStock(60, 50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Stock insuficiente');
      expect(result.error).toContain('50');
      expect(result.error).toContain('60');
    });

    it('valid when quantity equals available', () => {
      expect(validarAsignacionStock(50, 50)).toEqual({ valid: true });
    });
  });

  describe('getAlertaStock', () => {
    it('returns BAJO_MINIMO when below minimum', () => {
      expect(getAlertaStock(makeStockDeposito({ cantidad: 2, stockMinimo: 5 }))).toBe('BAJO_MINIMO');
    });

    it('returns SOBRE_MAXIMO when above maximum', () => {
      expect(getAlertaStock(makeStockDeposito({ cantidad: 200, stockMaximo: 100 }))).toBe('SOBRE_MAXIMO');
    });

    it('returns null when in normal range', () => {
      expect(getAlertaStock(makeStockDeposito({ cantidad: 50, stockMinimo: 5, stockMaximo: 100 }))).toBeNull();
    });

    it('returns null when no limits set', () => {
      expect(getAlertaStock(makeStockDeposito({ cantidad: 50, stockMinimo: 0 }))).toBeNull();
    });
  });

  describe('formatearErrorBackend', () => {
    it('extracts message from response.data.message', () => {
      const error = { response: { data: { message: 'Stock insuficiente' } } };
      expect(formatearErrorBackend(error)).toBe('Stock insuficiente');
    });

    it('falls back to error.message', () => {
      const error = new Error('Network error');
      expect(formatearErrorBackend(error)).toBe('Network error');
    });

    it('returns default for unknown error', () => {
      expect(formatearErrorBackend({})).toBe('Error desconocido');
    });
  });

  describe('detectarDesincronizacion', () => {
    it('detects synchronized stock', () => {
      const producto = makeProducto({ stockActual: 50 });
      const stocks = [makeStockDeposito({ productoId: 1, cantidad: 50 })];
      const result = detectarDesincronizacion(producto, stocks);
      expect(result.sincronizado).toBe(true);
      expect(result.diferencia).toBe(0);
    });

    it('detects unassigned stock as synchronized', () => {
      const producto = makeProducto({ stockActual: 100 });
      const stocks = [makeStockDeposito({ productoId: 1, cantidad: 50 })];
      const result = detectarDesincronizacion(producto, stocks);
      // diferencia = 100-50 = 50 (positive = stock disponible, not desync)
      expect(result.sincronizado).toBe(true);
      expect(result.diferencia).toBe(50);
    });

    it('detects over-allocation as desynchronized', () => {
      const producto = makeProducto({ stockActual: 10 });
      const stocks = [makeStockDeposito({ productoId: 1, cantidad: 20 })];
      const result = detectarDesincronizacion(producto, stocks);
      expect(result.sincronizado).toBe(false);
      expect(result.diferencia).toBe(-10);
      expect(result.mensaje).toContain('ALERTA');
    });
  });
});
