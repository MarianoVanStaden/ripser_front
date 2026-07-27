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

  it('cascadea el excedente de un informe a la cuota siguiente como "Pago parcial"', () => {
    // Informa $200.000 sobre una cuota de $164.850: excedente $35.150 a la cuota 2.
    const cuotas = [
      cuota({ id: 1, numeroCuota: 1, estado: 'PAGO_INFORMADO', montoInformado: 200000 }),
      cuota({ id: 2, numeroCuota: 2, estado: 'PENDIENTE' }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const [row1, row2] = cuotaRows();
    expect(row1[COL.estado]).toBe('Pagada');
    expect(row1[COL.pagado]).toBe(money(164850));
    expect(row1[COL.saldo]).toBe(money(0));
    expect(row2[COL.estado]).toBe('Pago parcial');
    expect(row2[COL.pagado]).toBe(money(35150));
    expect(row2[COL.saldo]).toBe(money(129700)); // 164850 - 35150
  });

  it('un excedente que cubre entera la cuota siguiente la marca "Pagada" y sigue cascadeando', () => {
    // $400.000 informados: cuota 1 pagada, cuota 2 pagada entera, $70.300 a la cuota 3.
    const cuotas = [
      cuota({ id: 1, numeroCuota: 1, estado: 'PAGO_INFORMADO', montoInformado: 400000 }),
      cuota({ id: 2, numeroCuota: 2, estado: 'PENDIENTE' }),
      cuota({ id: 3, numeroCuota: 3, estado: 'PENDIENTE' }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const [row1, row2, row3] = cuotaRows();
    expect(row1[COL.estado]).toBe('Pagada');
    expect(row2[COL.estado]).toBe('Pagada');
    expect(row2[COL.saldo]).toBe(money(0));
    expect(row3[COL.estado]).toBe('Pago parcial');
    expect(row3[COL.pagado]).toBe(money(70300)); // 400000 - 164850*2
    expect(row3[COL.saldo]).toBe(money(94550));  // 164850 - 70300
  });

  it('el excedente también alcanza a una cuota siguiente VENCIDA', () => {
    const cuotas = [
      cuota({ id: 1, numeroCuota: 1, estado: 'PAGO_INFORMADO', montoInformado: 200000 }),
      cuota({ id: 2, numeroCuota: 2, estado: 'VENCIDA' }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const row2 = cuotaRows()[1];
    expect(row2[COL.estado]).toBe('Pago parcial');
    expect(row2[COL.pagado]).toBe(money(35150));
  });

  it('el excedente en la última cuota se descarta sin agregar filas ni romper', () => {
    const cuotas = [
      cuota({ id: 3, numeroCuota: 3, estado: 'PAGO_INFORMADO', montoInformado: 300000 }),
    ];
    generarCreditoPDF(basePrestamo, cuotas);

    const rows = cuotaRows();
    expect(rows).toHaveLength(1);
    expect(rows[0][COL.estado]).toBe('Pagada');
    expect(rows[0][COL.pagado]).toBe(money(164850)); // capeado a la cuota
    expect(rows[0][COL.saldo]).toBe(money(0));
  });
});
