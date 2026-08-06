import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks de APIs usadas por el componente
const mockGetResumenCobros = vi.fn();
vi.mock('../../../api/services/viajeApi', () => ({
  viajeApi: { getResumenCobros: (...args: unknown[]) => mockGetResumenCobros(...args) },
}));
vi.mock('../../../api/services/cajasApi', () => ({
  cajasApi: { getByMetodoPago: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../../api/services/bancoApi', () => ({
  bancoApi: { getActivos: vi.fn().mockResolvedValue([{ id: 1, nombre: 'Banco Nación' }]) },
}));
const mockGetByCliente = vi.fn().mockResolvedValue([]);
vi.mock('../../../api/services/prestamoPersonalApi', () => ({
  prestamoPersonalApi: { getByCliente: (...args: unknown[]) => mockGetByCliente(...args) },
}));

// ClienteAutocomplete real hace fetch server-side con debounce; acá solo importa
// el contrato value/onChange, así que se reemplaza por un stub clickeable.
vi.mock('../../common/ClienteAutocomplete', () => ({
  default: ({ onChange, helperText }: {
    onChange: (c: { id: number; nombre: string } | null) => void;
    helperText?: React.ReactNode;
  }) => (
    <div>
      <button onClick={() => onChange({ id: 55, nombre: 'Cliente Elegido' })}>
        stub-elegir-cliente
      </button>
      {helperText && <span>{helperText}</span>}
    </div>
  ),
}));

import RendicionConfirmar, { type RendicionConfirmarPayload } from '../RendicionConfirmar';

const resumenConCheque = (clienteId: number | null) => ({
  entregas: [
    {
      clienteId,
      clienteNombre: 'Ovaluna SA',
      detallesCobro: [{ metodoPago: 'CHEQUE', monto: 872062, cantidadCheques: 1 }],
    },
  ],
});

const renderConfirmar = () => {
  let lastPayload: RendicionConfirmarPayload | null = null;
  render(
    <RendicionConfirmar viajeId={97} onChange={(p) => { lastPayload = p; }} />
  );
  return { getPayload: () => lastPayload };
};

describe('RendicionConfirmar — cliente obligatorio en líneas CHEQUE', () => {
  beforeEach(() => {
    mockGetResumenCobros.mockReset();
    mockGetByCliente.mockClear();
  });

  it('entrega CON cliente: no muestra el picker de cliente', async () => {
    mockGetResumenCobros.mockResolvedValue(resumenConCheque(2388));
    renderConfirmar();

    await screen.findByText(/Cheques a registrar en cartera/);
    expect(screen.queryByText('stub-elegir-cliente')).not.toBeInTheDocument();
  });

  it('entrega SIN cliente: muestra el picker con el aviso y el payload sale inválido', async () => {
    mockGetResumenCobros.mockResolvedValue(resumenConCheque(null));
    const { getPayload } = renderConfirmar();

    await screen.findByText(/Cheques a registrar en cartera/);
    expect(screen.getByText('stub-elegir-cliente')).toBeInTheDocument();
    expect(screen.getByText(/La entrega no tiene cliente asociado/)).toBeInTheDocument();

    // Sin cliente el cheque no es válido y la línea sale sin clienteId
    expect(getPayload()!.valid).toBe(false);
    const linea = getPayload()!.detalles.find((d) => d.metodoPago === 'CHEQUE');
    expect(linea?.clienteId).toBeUndefined();
  });

  it('elegir cliente setea clienteId en el payload y dispara la carga de sus créditos', async () => {
    mockGetResumenCobros.mockResolvedValue(resumenConCheque(null));
    const { getPayload } = renderConfirmar();

    await screen.findByText('stub-elegir-cliente');
    fireEvent.click(screen.getByText('stub-elegir-cliente'));

    await waitFor(() => {
      const linea = getPayload()!.detalles.find((d) => d.metodoPago === 'CHEQUE');
      expect(linea?.clienteId).toBe(55);
    });
    expect(mockGetByCliente).toHaveBeenCalledWith(55);
  });
});
