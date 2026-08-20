import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RegistrarPagoDialog } from '../RegistrarPagoDialog';
import { EstadoCuota } from '../../../types/prestamo.types';
import type { CuotaPrestamoDTO } from '../../../types/prestamo.types';
import { formatPrice } from '../../../utils/priceCalculations';

// El form de pago tiene la lógica money-critical del cobro de cuotas: default de
// monto/método, validación de saldo (CUENTA_CORRIENTE), datos de cheque, y el
// modo COBRANZAS (informar) vs ADMIN (registrar en caja). El método se controla
// vía metodoPagoSugerido para no depender del MUI Select.

const mockRegistrarPago = vi.fn();
const mockGetByPrestamo = vi.fn();
const mockInformar = vi.fn();
const mockClientGetById = vi.fn();
const mockUsePermisos = vi.fn();

vi.mock('../../../api/services/cuotaPrestamoApi', () => ({
  cuotaPrestamoApi: {
    registrarPago: (...a: unknown[]) => mockRegistrarPago(...a),
    getByPrestamo: (...a: unknown[]) => mockGetByPrestamo(...a),
  },
}));
vi.mock('../../../api/services/pagoInformadoApi', () => ({
  pagoInformadoApi: { informar: (...a: unknown[]) => mockInformar(...a) },
}));
vi.mock('../../../api/services/clientApi', () => ({
  clientApi: { getById: (...a: unknown[]) => mockClientGetById(...a) },
}));
vi.mock('../../../api/services/bancoApi', () => ({
  bancoApi: { getActivos: vi.fn().mockResolvedValue([{ id: 1, nombre: 'Banco Nación' }]) },
}));
vi.mock('../../../hooks/usePermisos', () => ({ usePermisos: () => mockUsePermisos() }));
// Stubs de hijos pesados: caja (setter simple) y date field (input plano).
vi.mock('../../common/CajaSelector', () => ({
  CajaSelector: ({ onChange }: { onChange: (c: { tipo: string; id: number }) => void }) => (
    <button type="button" onClick={() => onChange({ tipo: 'PESOS', id: 1 })}>stub-set-caja</button>
  ),
}));
vi.mock('../../common/FechaField', () => ({
  default: ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <input aria-label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const ADMIN = { esAdmin: true, tieneRol: () => false };
const COBRANZAS = { esAdmin: false, tieneRol: (...r: string[]) => r.includes('COBRANZAS') };

const makeCuota = (over: Partial<CuotaPrestamoDTO>): CuotaPrestamoDTO => ({
  id: 1,
  prestamoId: 1,
  numeroCuota: 1,
  montoCuota: 10_000,
  montoPagado: 0,
  fechaVencimiento: '2026-08-10',
  estado: EstadoCuota.PENDIENTE,
  ...over,
});

const renderDialog = (cuota: CuotaPrestamoDTO, onSaved = vi.fn(), onClose = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <RegistrarPagoDialog
        open
        cuota={cuota}
        clienteId={2}
        prestamoId={1}
        allCuotas={[cuota]}
        onClose={onClose}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  );
  return { onSaved, onClose };
};

describe('RegistrarPagoDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermisos.mockReturnValue(ADMIN);
    mockGetByPrestamo.mockResolvedValue([]);
    mockRegistrarPago.mockResolvedValue({});
    mockInformar.mockResolvedValue({});
    mockClientGetById.mockResolvedValue({ saldoActual: 0 });
  });

  it('muestra saldo restante y defaultea el monto a lo que falta cubrir', () => {
    renderDialog(makeCuota({ montoCuota: 10_000, montoPagado: 2_000 }));
    expect(screen.getByText('Registrar Pago - Cuota N.1')).toBeInTheDocument();
    expect(screen.getByText(formatPrice(8_000))).toBeInTheDocument(); // saldo restante
    // Default del monto = montoCuota − montoPagado − montoInformado = 8000
    // (input numérico → role spinbutton, único; evita la ambigüedad del label MUI)
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('8000');
    // EFECTIVO requiere caja → aparece el selector y el submit está deshabilitado sin caja
    expect(screen.getByText('stub-set-caja')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar pago/i })).toBeDisabled();
  });

  it('defaultea el método al sugerido por el plan y muestra el aviso; con CHEQUE pide sus datos', () => {
    renderDialog(makeCuota({ metodoPagoSugerido: 'CHEQUE' }));
    expect(screen.getByText(/sugiere cobrar esta cuota con/i)).toBeInTheDocument();
    expect(screen.getByText('Datos del cheque recibido')).toBeInTheDocument();
    // Cheque sin completar → submit deshabilitado
    expect(screen.getByRole('button', { name: /registrar pago/i })).toBeDisabled();
  });

  it('modo COBRANZAS: informa el pago (no registra en caja) y exige comprobante', async () => {
    mockUsePermisos.mockReturnValue(COBRANZAS);
    const { onSaved, onClose } = renderDialog(makeCuota({ montoCuota: 10_000, montoPagado: 0 }));

    expect(screen.getByText('Informar Pago - Cuota N.1')).toBeInTheDocument();
    expect(screen.getByText(/estás informando un pago/i)).toBeInTheDocument();
    // Sin comprobante → deshabilitado
    const submit = screen.getByRole('button', { name: /informar pago/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/número de comprobante/i), { target: { value: 'REC-1' } });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    await waitFor(() => expect(mockInformar).toHaveBeenCalledTimes(1));
    expect(mockInformar).toHaveBeenCalledWith(expect.objectContaining({
      cuotaId: 1, montoInformado: 10_000, numeroComprobante: 'REC-1', metodoPago: 'EFECTIVO',
    }));
    expect(mockRegistrarPago).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalled();
  });

  it('modo ADMIN: registra el pago con la caja elegida (cajaPesosId)', async () => {
    const { onClose } = renderDialog(makeCuota({ id: 7, montoCuota: 5_000, montoPagado: 0 }));

    fireEvent.click(screen.getByText('stub-set-caja')); // elige caja pesos id 1
    const submit = screen.getByRole('button', { name: /registrar pago/i });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() => expect(mockRegistrarPago).toHaveBeenCalledTimes(1));
    expect(mockRegistrarPago).toHaveBeenCalledWith(expect.objectContaining({
      cuotaId: 7, montoPagado: 5_000, metodoPago: 'EFECTIVO', cajaPesosId: 1, cajaAhorroId: null,
    }));
    expect(mockInformar).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('CUENTA_CORRIENTE con saldo a favor insuficiente: alerta de error y submit deshabilitado', async () => {
    // saldoActual −3000 → saldo a favor 3000; el monto default (10000) lo supera.
    mockClientGetById.mockResolvedValue({ saldoActual: -3_000 });
    renderDialog(makeCuota({ metodoPagoSugerido: 'CUENTA_CORRIENTE', montoCuota: 10_000, montoPagado: 0 }));

    // Espera la carga async del saldo.
    expect(await screen.findByText(/insuficiente para cubrir/i)).toBeInTheDocument();
    expect(screen.getByText(/saldo a favor disponible/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar pago/i })).toBeDisabled();
  });

  it('rechaza monto ≤ 0 al guardar', async () => {
    mockUsePermisos.mockReturnValue(COBRANZAS); // sin caja, para aislar la validación de monto
    renderDialog(makeCuota({ montoCuota: 10_000, montoPagado: 0 }));

    fireEvent.change(screen.getByLabelText(/número de comprobante/i), { target: { value: 'REC-1' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } }); // → 0
    fireEvent.click(screen.getByRole('button', { name: /informar pago/i }));

    expect(await screen.findByText(/el monto debe ser mayor a 0/i)).toBeInTheDocument();
    expect(mockInformar).not.toHaveBeenCalled();
  });
});
