import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegistrarCobroDialog } from '../RegistrarCobroDialog';
import { EstadoCuota } from '../../../../types/prestamo.types';
import type { CuotaPrestamoDTO, PrestamoPersonalDTO } from '../../../../types/prestamo.types';
import { formatPrice } from '../../../../utils/priceCalculations';

// APIs consumidas por el diálogo (usa fetch directo, no react-query → sin provider).
const mockGetByPrestamo = vi.fn();
const mockGetPrestamoById = vi.fn();
vi.mock('../../../../api/services/cuotaPrestamoApi', () => ({
  cuotaPrestamoApi: { getByPrestamo: (...a: unknown[]) => mockGetByPrestamo(...a) },
}));
vi.mock('../../../../api/services/prestamoPersonalApi', () => ({
  prestamoPersonalApi: { getById: (...a: unknown[]) => mockGetPrestamoById(...a) },
}));
vi.mock('../../../../api/services/clienteApi', () => ({
  clienteApi: { getById: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../../../../api/services/documentoApi', () => ({
  documentoApi: { getById: vi.fn() },
}));
// pdfService son 2.200 líneas; lo stubbeamos para no arrastrarlo al bundle de test.
vi.mock('../../../../services/pdfService', () => ({ generarCreditoPDF: vi.fn() }));
// El sub-diálogo de pago tiene sus propias deps; lo reemplazamos por un stub.
vi.mock('../../RegistrarPagoDialog', () => ({
  RegistrarPagoDialog: ({ open, cuota }: { open: boolean; cuota: { numeroCuota: number } | null }) =>
    open ? <div data-testid="pago-dialog">pago cuota {cuota?.numeroCuota}</div> : null,
}));

const makeCuota = (over: Partial<CuotaPrestamoDTO>): CuotaPrestamoDTO => ({
  id: 1,
  prestamoId: 1,
  numeroCuota: 1,
  montoCuota: 1_000,
  montoPagado: 0,
  fechaVencimiento: '2026-08-10',
  estado: EstadoCuota.PENDIENTE,
  ...over,
});

const prestamo = { id: 1, documentoId: null } as unknown as PrestamoPersonalDTO;

const renderDialog = () =>
  render(
    <RegistrarCobroDialog
      open
      prestamoId={1}
      clienteId={2}
      clienteNombre="Cliente Test"
      onClose={vi.fn()}
      onSaved={vi.fn()}
    />,
  );

describe('RegistrarCobroDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrestamoById.mockResolvedValue(prestamo);
  });

  it('lista cobrables + pagadas, calcula el total vencido y muestra el botón Cobrar sólo en las no pagadas', async () => {
    mockGetByPrestamo.mockResolvedValue([
      makeCuota({ id: 1, numeroCuota: 1, montoCuota: 1_000, montoPagado: 0, estado: EstadoCuota.PENDIENTE }),
      makeCuota({ id: 2, numeroCuota: 2, montoCuota: 1_000, montoPagado: 400, estado: EstadoCuota.VENCIDA }),
      makeCuota({ id: 3, numeroCuota: 3, montoCuota: 1_000, montoPagado: 1_000, estado: EstadoCuota.PAGADA }),
    ]);

    renderDialog();

    // Header: 2 cobrables (c1 + c2, ambas con saldo > 0), 1 pagada (c3).
    expect(await screen.findByText('2 cuota(s) a cobrar')).toBeInTheDocument();
    expect(screen.getByText('· 1 pagada(s)')).toBeInTheDocument();

    // Total vencido = sólo la VENCIDA con saldo (600); la PENDIENTE no cuenta.
    expect(screen.getByText(`Vencido: ${formatPrice(600)}`)).toBeInTheDocument();

    // Las 3 filas aparecen; sólo las no pagadas tienen botón Cobrar.
    expect(screen.getByText('N.º 1')).toBeInTheDocument();
    expect(screen.getByText('N.º 3')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /cobrar/i })).toHaveLength(2); // c1 y c2
  });

  it('filtra las cobrables con saldo 0 (no aparecen aunque el estado sea cobrable)', async () => {
    mockGetByPrestamo.mockResolvedValue([
      // PENDIENTE pero ya saldada (montoPagado == montoCuota) → saldo 0 → fuera.
      makeCuota({ id: 1, numeroCuota: 1, montoCuota: 1_000, montoPagado: 1_000, estado: EstadoCuota.PENDIENTE }),
    ]);

    renderDialog();

    expect(await screen.findByText('Sin cuotas pendientes de cobro')).toBeInTheDocument();
    expect(
      screen.getByText(/no tiene cuotas pendientes de cobro/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cobrar/i })).not.toBeInTheDocument();
  });

  it('avisa cuando el crédito no tiene cuotas cargadas', async () => {
    mockGetByPrestamo.mockResolvedValue([]);

    renderDialog();

    expect(await screen.findByText(/no tiene cuotas cargadas/i)).toBeInTheDocument();
  });

  it('muestra error con Reintentar si la carga falla (tras el retry interno)', async () => {
    mockGetByPrestamo.mockRejectedValue(new Error('boom'));

    renderDialog();

    expect(await screen.findByText(/no se pudieron cargar las cuotas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    // Se reintentó: 2 llamadas (el loop interno intenta dos veces antes de rendirse).
    expect(mockGetByPrestamo).toHaveBeenCalledTimes(2);
  });

  it('el botón Cobrar abre el sub-diálogo de pago con la cuota elegida', async () => {
    mockGetByPrestamo.mockResolvedValue([
      makeCuota({ id: 7, numeroCuota: 5, montoCuota: 1_000, montoPagado: 0, estado: EstadoCuota.PENDIENTE }),
    ]);

    renderDialog();

    const cobrar = await screen.findByRole('button', { name: /cobrar/i });
    fireEvent.click(cobrar);

    await waitFor(() => {
      expect(screen.getByTestId('pago-dialog')).toHaveTextContent('pago cuota 5');
    });
  });
});
