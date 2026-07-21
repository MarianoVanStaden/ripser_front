import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../types/prestamo.types';

// Capturamos las opciones de cada llamada a autoTable para inspeccionar el body
// de la tabla de cuotas sin renderizar un PDF real. El default export es la fn.
const autoTableCalls: Array<{ head?: unknown[][]; body?: unknown[][] }> = [];
vi.mock('jspdf-autotable', () => ({
  default: (doc: unknown, opts: { head?: unknown[][]; body?: unknown[][] }) => {
    autoTableCalls.push(opts);
    // generarCreditoPDF lee lastAutoTable.finalY después de cada tabla.
    (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable = { finalY: 100 };
  },
}));

import { generarCreditoPDF } from '../pdfService';

// Réplica local del formateo de moneda de pdfService (no exportado) para
// comparar montos sin acoplarnos a la representación interna.
const money = (v: number): string =>
  `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const basePrestamo = {
  id: 1831,
  empresaId: 1,
  clienteId: 1,
  clienteNombre: 'Vanina',
  clienteApellido: 'Sosa',
  tipoFinanciacion: 'SEMANAL',
  cantidadCuotas: 3,
  valorCuota: 164850,
  montoTotal: 494550,
  cuotaActual: 1,
  diasVencido: 0,
  estado: 'ACTIVO',
  categoria: 'NORMAL',
  finalizado: false,
  fechaCreacion: '2026-04-28',
  fechaActualizacion: '2026-04-28',
  cuotasPagadas: 0,
  cuotasPendientes: 3,
  montoPagado: 0,
  saldoPendiente: 494550,
} as unknown as PrestamoPersonalDTO;

const cuota = (over: Partial<CuotaPrestamoDTO>): CuotaPrestamoDTO => ({
  id: 0,
  prestamoId: 1831,
  numeroCuota: 1,
  montoCuota: 164850,
  montoPagado: 0,
  fechaVencimiento: '2026-06-10',
  estado: 'PENDIENTE',
  ...over,
});

// Devuelve las filas (body) de la tabla de cuotas del último PDF generado.
const cuotaRows = (): string[][] => {
  const call = autoTableCalls.find((c) => c.head?.[0]?.[0] === '#');
  if (!call) throw new Error('No se encontró la tabla de cuotas en el PDF');
  return (call.body ?? []) as string[][];
};

// Índices de columna en la tabla de cuotas:
// ['#','Vencimiento','Fecha pago','Monto','Pagado','Saldo','Comprobante','Estado','Días mora']
const COL = { pagado: 4, saldo: 5, estado: 7 } as const;

describe('generarCreditoPDF — pagos informados en el estado de cuenta', () => {
  beforeEach(() => {
    autoTableCalls.length = 0;
  });

  it('muestra un pago informado PARCIAL como "Pago parcial" con el acumulado y su saldo', () => {
    // Cuota de $164.850 con $60.000 informados (montoPagado no lo toca informar()).
    const cuotas = [
      cuota({ id: 2, numeroCuota: 2, estado: 'PAGO_INFORMADO', montoPagado: 0, montoInformado: 60000 }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const row = cuotaRows()[0];
    expect(row[COL.estado]).toBe('Pago parcial');
    expect(row[COL.pagado]).toBe(money(60000));
    expect(row[COL.saldo]).toBe(money(104850)); // 164850 - 60000
  });

  it('acumula montoPagado previo + montoInformado en un parcial sobre cuota ya PARCIAL', () => {
    const cuotas = [
      cuota({ id: 2, numeroCuota: 2, estado: 'PAGO_INFORMADO', montoPagado: 40000, montoInformado: 60000 }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const row = cuotaRows()[0];
    expect(row[COL.estado]).toBe('Pago parcial');
    expect(row[COL.pagado]).toBe(money(100000)); // 40000 + 60000
    expect(row[COL.saldo]).toBe(money(64850));   // 164850 - 100000
  });

  it('muestra un pago informado TOTAL como "Pagada" con saldo cero (comportamiento previo)', () => {
    const cuotas = [
      cuota({ id: 1, numeroCuota: 1, estado: 'PAGO_INFORMADO', montoPagado: 0, montoInformado: 164850 }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const row = cuotaRows()[0];
    expect(row[COL.estado]).toBe('Pagada');
    expect(row[COL.pagado]).toBe(money(164850));
    expect(row[COL.saldo]).toBe(money(0));
  });

  it('no altera el estado de una cuota vencida sin pago informado', () => {
    const cuotas = [cuota({ id: 3, numeroCuota: 2, estado: 'VENCIDA', montoPagado: 0 })];
    generarCreditoPDF(basePrestamo, cuotas);

    expect(cuotaRows()[0][COL.estado]).toBe('Vencida');
  });
});
