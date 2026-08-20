import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpcionFinanciamientoLabel from '../OpcionFinanciamientoLabel';
import { calcularFinanciamientoPropio, formatCurrencyARS } from '../../../utils/financiamiento';
import type { OpcionFinanciamientoDTO } from '../../../types';

// OpcionFinanciamientoLabel es presentacional (props) y delega el cálculo a
// utils/financiamiento (ya testeadas). Acá se verifica que el DESGLOSE de
// financiación propia (entrega 40% / saldo 60% / interés / cuota) se muestre con
// los importes correctos, y que el path no-propio muestre cuota/total del plan.

const opcion = (over: Partial<OpcionFinanciamientoDTO>): OpcionFinanciamientoDTO =>
  ({
    id: 1,
    nombre: 'Plan',
    metodoPago: 'EFECTIVO',
    tasaInteres: 0,
    cantidadCuotas: 1,
    montoCuota: 0,
    montoTotal: 0,
    ...over,
  }) as unknown as OpcionFinanciamientoDTO;

describe('OpcionFinanciamientoLabel', () => {
  it('financiación propia: muestra el desglose entrega/saldo/interés/cuota con los importes calculados', () => {
    const op = opcion({ metodoPago: 'FINANCIACION_PROPIA', nombre: 'Financiado', tasaInteres: 10, cantidadCuotas: 12 });
    const calc = calcularFinanciamientoPropio(1_000_000, 10, 12, 0.4, 50_000);
    // sanity de la fixture: entrega 450k, saldo 600k, saldoConInteres 660k, cuota 55k, total 1.110k
    expect([calc.entrega, calc.saldoConInteres, calc.cuotaEstimada, calc.totalEstimado])
      .toEqual([450_000, 660_000, 55_000, 1_110_000]);

    render(<OpcionFinanciamientoLabel opcion={op} baseImporte={1_000_000} costoEnvio={50_000} />);

    expect(screen.getByText('Plan de financiación propia')).toBeInTheDocument();
    expect(screen.getByText('Financiación propia')).toBeInTheDocument(); // chip
    expect(screen.getByText('Entrega inicial (40%)')).toBeInTheDocument();
    expect(screen.getByText('Saldo a financiar (60%)')).toBeInTheDocument();
    expect(screen.getByText('Interés 10% sobre saldo')).toBeInTheDocument();
    expect(screen.getByText('12 cuotas de')).toBeInTheDocument();
    // Importes (los únicos; la cuota 55k aparece 2 veces → getAllByText)
    expect(screen.getByText(formatCurrencyARS(450_000, 2))).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyARS(660_000, 2))).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyARS(1_110_000, 2))).toBeInTheDocument();
    expect(screen.getAllByText(formatCurrencyARS(55_000, 2)).length).toBeGreaterThanOrEqual(2);
  });

  it('no-propio con cuotas: muestra cuota y total del plan y el chip de interés, sin desglose', () => {
    const op = opcion({ metodoPago: 'TARJETA_CREDITO', tasaInteres: 15, cantidadCuotas: 6, montoCuota: 20_000, montoTotal: 120_000 });
    render(<OpcionFinanciamientoLabel opcion={op} baseImporte={100_000} />);

    expect(screen.getByText('Cuota')).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyARS(20_000, 2))).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText(formatCurrencyARS(120_000, 2))).toBeInTheDocument();
    expect(screen.getByText('15% interés')).toBeInTheDocument();
    expect(screen.queryByText('Plan de financiación propia')).not.toBeInTheDocument();
  });

  it('no-propio con 1 cuota: "Pago único" y label "Importe"', () => {
    const op = opcion({ metodoPago: 'EFECTIVO', tasaInteres: 0, cantidadCuotas: 1, montoCuota: 80_000, montoTotal: 80_000 });
    render(<OpcionFinanciamientoLabel opcion={op} baseImporte={80_000} />);

    expect(screen.getByText('Pago único')).toBeInTheDocument();
    expect(screen.getByText('Importe')).toBeInTheDocument();
    expect(screen.queryByText('Cuota')).not.toBeInTheDocument();
  });

  it('tasa negativa: muestra chip de descuento (% OFF)', () => {
    const op = opcion({ metodoPago: 'EFECTIVO', tasaInteres: -10, cantidadCuotas: 1, montoTotal: 90_000 });
    render(<OpcionFinanciamientoLabel opcion={op} baseImporte={100_000} />);
    expect(screen.getByText('10% OFF')).toBeInTheDocument();
  });

  it('el costoEnvio por prop tiene precedencia y entra en la entrega inicial', () => {
    const op = opcion({ metodoPago: 'FINANCIACION_PROPIA', tasaInteres: 0, cantidadCuotas: 6 });
    // costoEnvio prop = 30k → entrega = 40% de 1M + 30k = 430k (los detalles se ignoran)
    render(
      <OpcionFinanciamientoLabel
        opcion={op}
        baseImporte={1_000_000}
        costoEnvio={30_000}
        detalles={[{ tipoItem: 'ENVIO', subtotal: 999_999 } as never]}
      />,
    );
    expect(screen.getByText(formatCurrencyARS(430_000, 2))).toBeInTheDocument(); // entrega con envío 30k
  });
});
