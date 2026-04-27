import { describe, it, expect } from 'vitest';
import type { DocumentoComercial } from '../../../../types';
import {
  calcularKPIs,
  formatARS,
  formatFechaCorta,
  formatFechaLarga,
  formatMetodoPago,
  getEstadoChipProps,
  getTipoChipProps,
} from '../utils';

const baseDoc: DocumentoComercial = {
  id: 0,
  numeroDocumento: '',
  tipoDocumento: 'PRESUPUESTO',
  usuarioId: 1,
  usuarioNombre: 'Tester',
  fechaEmision: '2026-01-01T10:00:00',
  fechaVencimiento: '2026-02-01T10:00:00',
  subtotal: 0,
  iva: 0,
  total: 0,
  tipoIva: 'IVA_21',
  estado: 'APROBADO',
  metodoPago: 'EFECTIVO',
  detalles: [],
  usuarioCreadorPresupuestoId: null,
  usuarioCreadorPresupuestoNombre: null,
  usuarioConvertidorNotaPedidoId: null,
  usuarioConvertidorNotaPedidoNombre: null,
  usuarioFacturadorId: null,
  usuarioFacturadorNombre: null,
};

const mkDoc = (override: Partial<DocumentoComercial>): DocumentoComercial => ({
  ...baseDoc,
  ...override,
});

describe('formatARS', () => {
  it('formats integer amounts without decimals', () => {
    const res = formatARS(1234);
    // Permitir variaciones del símbolo $ según ICU
    expect(res).toMatch(/1\.234/);
    expect(res).not.toMatch(/,\d/);
  });

  it('formats decimal amounts with 2 decimals', () => {
    const res = formatARS(1234.5);
    expect(res).toMatch(/1\.234,50/);
  });

  it('coerces null/undefined/NaN to 0', () => {
    expect(formatARS(null)).toMatch(/0/);
    expect(formatARS(undefined)).toMatch(/0/);
    expect(formatARS(Number.NaN)).toMatch(/0/);
  });
});

describe('getTipoChipProps', () => {
  it('maps each tipo to expected color', () => {
    expect(getTipoChipProps('PRESUPUESTO')).toEqual({ label: 'Presupuesto', color: 'info' });
    expect(getTipoChipProps('NOTA_PEDIDO')).toEqual({ label: 'Nota de Pedido', color: 'warning' });
    expect(getTipoChipProps('FACTURA')).toEqual({ label: 'Factura', color: 'success' });
    expect(getTipoChipProps('NOTA_CREDITO')).toEqual({ label: 'Nota de Crédito', color: 'error' });
  });
});

describe('getEstadoChipProps', () => {
  it('maps known estados to color', () => {
    expect(getEstadoChipProps('PENDIENTE').color).toBe('warning');
    expect(getEstadoChipProps('APROBADO').color).toBe('info');
    expect(getEstadoChipProps('PAGADA').color).toBe('success');
    expect(getEstadoChipProps('FACTURADA').color).toBe('success');
    expect(getEstadoChipProps('RECHAZADO').color).toBe('error');
    expect(getEstadoChipProps('VENCIDA').color).toBe('error');
    expect(getEstadoChipProps('CONFIRMADA').color).toBe('primary');
  });
});

describe('formatMetodoPago', () => {
  it('humanizes underscore-separated enums', () => {
    expect(formatMetodoPago('TARJETA_CREDITO')).toBe('Tarjeta Credito');
    expect(formatMetodoPago('EFECTIVO')).toBe('Efectivo');
    expect(formatMetodoPago('CUENTA_CORRIENTE')).toBe('Cuenta Corriente');
  });

  it('handles null/empty', () => {
    expect(formatMetodoPago(null)).toBe('-');
    expect(formatMetodoPago('')).toBe('-');
  });
});

describe('formatFechaCorta / formatFechaLarga', () => {
  it('returns "-" for invalid input', () => {
    expect(formatFechaCorta(null)).toBe('-');
    expect(formatFechaCorta('not-a-date')).toBe('-');
    expect(formatFechaLarga(undefined)).toBe('-');
  });

  it('returns a non-empty string for a valid ISO date', () => {
    const corta = formatFechaCorta('2026-04-26T12:00:00');
    expect(corta).not.toBe('-');
    expect(corta.length).toBeGreaterThan(0);
  });
});

describe('calcularKPIs', () => {
  it('returns zeros for empty list', () => {
    const k = calcularKPIs([]);
    expect(k).toEqual({
      totalFacturado: 0,
      cantidadPresupuestos: 0,
      cantidadNotasPedido: 0,
      cantidadFacturas: 0,
      cantidadNotasCredito: 0,
      ticketPromedioFacturas: 0,
      tasaConversionPresupuestoFactura: 0,
    });
  });

  it('counts by tipo and totals only vigent facturas', () => {
    const docs: DocumentoComercial[] = [
      mkDoc({ id: 1, tipoDocumento: 'PRESUPUESTO', total: 100 }),
      mkDoc({ id: 2, tipoDocumento: 'NOTA_PEDIDO', total: 200 }),
      mkDoc({ id: 3, tipoDocumento: 'FACTURA', total: 1000, estado: 'PAGADA' }),
      mkDoc({ id: 4, tipoDocumento: 'FACTURA', total: 500, estado: 'RECHAZADO' }),
      mkDoc({ id: 5, tipoDocumento: 'NOTA_CREDITO', total: 50 }),
    ];
    const k = calcularKPIs(docs);
    expect(k.cantidadPresupuestos).toBe(1);
    expect(k.cantidadNotasPedido).toBe(1);
    expect(k.cantidadFacturas).toBe(2);
    expect(k.cantidadNotasCredito).toBe(1);
    expect(k.totalFacturado).toBe(1000);
    expect(k.ticketPromedioFacturas).toBe(1000);
  });

  it('computes conversion via explicit chain (factura -> nota_pedido -> presupuesto)', () => {
    const docs: DocumentoComercial[] = [
      mkDoc({ id: 1, tipoDocumento: 'PRESUPUESTO', total: 100 }),
      mkDoc({ id: 2, tipoDocumento: 'NOTA_PEDIDO', total: 100, documentoOrigenId: 1 }),
      mkDoc({
        id: 3,
        tipoDocumento: 'FACTURA',
        total: 100,
        estado: 'PAGADA',
        documentoOrigenId: 2,
      }),
      mkDoc({ id: 4, tipoDocumento: 'PRESUPUESTO', total: 50 }), // sin convertir
    ];
    const k = calcularKPIs(docs);
    expect(k.tasaConversionPresupuestoFactura).toBeCloseTo(0.5, 4);
  });

  it('falls back to amount+date heuristic when factura has no origen', () => {
    const docs: DocumentoComercial[] = [
      mkDoc({
        id: 1,
        tipoDocumento: 'PRESUPUESTO',
        total: 5000,
        fechaEmision: '2026-03-01T10:00:00',
      }),
      mkDoc({
        id: 2,
        tipoDocumento: 'FACTURA',
        total: 5000,
        estado: 'PAGADA',
        fechaEmision: '2026-03-15T10:00:00', // 14 días después => match
      }),
    ];
    const k = calcularKPIs(docs);
    expect(k.tasaConversionPresupuestoFactura).toBe(1);
  });

  it('does not match heuristic outside the 60-day window', () => {
    const docs: DocumentoComercial[] = [
      mkDoc({
        id: 1,
        tipoDocumento: 'PRESUPUESTO',
        total: 5000,
        fechaEmision: '2025-01-01T10:00:00',
      }),
      mkDoc({
        id: 2,
        tipoDocumento: 'FACTURA',
        total: 5000,
        estado: 'PAGADA',
        fechaEmision: '2026-01-01T10:00:00', // 1 año después => no match
      }),
    ];
    const k = calcularKPIs(docs);
    expect(k.tasaConversionPresupuestoFactura).toBe(0);
  });

  it('does not double-count a presupuesto matched by chain when an unrelated factura matches by amount', () => {
    const docs: DocumentoComercial[] = [
      mkDoc({ id: 1, tipoDocumento: 'PRESUPUESTO', total: 1000, fechaEmision: '2026-04-01T10:00:00' }),
      mkDoc({
        id: 2,
        tipoDocumento: 'FACTURA',
        total: 1000,
        estado: 'PAGADA',
        documentoOrigenId: 1,
        fechaEmision: '2026-04-10T10:00:00',
      }),
      // Otra factura sin origen pero mismo total/fecha cercana — no debe inflar la tasa
      mkDoc({
        id: 3,
        tipoDocumento: 'FACTURA',
        total: 1000,
        estado: 'PAGADA',
        fechaEmision: '2026-04-15T10:00:00',
      }),
    ];
    const k = calcularKPIs(docs);
    expect(k.cantidadPresupuestos).toBe(1);
    // 1 presupuesto convertido / 1 presupuesto total = 1.0; nunca > 1.
    expect(k.tasaConversionPresupuestoFactura).toBe(1);
  });
});
