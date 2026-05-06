import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { prestamoPersonalApi } from '../prestamoPersonalApi';
import type {
  PrestamoPersonalDTO,
  CuotaPrestamoDTO,
  UpdateFechaEntregaDTO,
  UpdateFechaVencimientoCuotaDTO,
} from '../../../types/prestamo.types';

const mockedApi = vi.mocked(api, true);

const samplePrestamo: PrestamoPersonalDTO = {
  id: 100,
  empresaId: 10,
  clienteId: 1,
  clienteNombre: 'Juan Perez',
  tipoFinanciacion: 'MENSUAL',
  cantidadCuotas: 12,
  valorCuota: 5000,
  montoTotal: 60000,
  cuotaActual: 1,
  diasVencido: 0,
  estado: 'ACTIVO',
  categoria: 'NORMAL',
  finalizado: false,
  fechaCreacion: '2026-01-01T00:00:00',
  fechaActualizacion: '2026-01-01T00:00:00',
  cuotasPagadas: 0,
  cuotasPendientes: 12,
  montoPagado: 0,
  saldoPendiente: 60000,
  version: 0,
};

const sampleCuota: CuotaPrestamoDTO = {
  id: 200,
  prestamoId: 100,
  numeroCuota: 3,
  montoCuota: 5000,
  montoPagado: 0,
  fechaVencimiento: '2026-06-01',
  estado: 'PENDIENTE',
};

describe('prestamoPersonalApi — fecha edits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('actualizarFechaEntrega: hits PATCH .../{id}/fecha-entrega with the body', async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { ...samplePrestamo, fechaEntrega: '2026-05-06' } });

    const dto: UpdateFechaEntregaDTO = {
      nuevaFecha: '2026-05-06',
      motivo: 'Recibió 5 días tarde',
      aplicarDesplazamientoCuotas: true,
      version: 0,
    };

    const result = await prestamoPersonalApi.actualizarFechaEntrega(100, dto);

    expect(mockedApi.patch).toHaveBeenCalledTimes(1);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/api/prestamos-personales/100/fecha-entrega',
      dto,
    );
    expect(result.fechaEntrega).toBe('2026-05-06');
  });

  it('actualizarFechaVencimientoCuota: hits PATCH .../{prestamoId}/cuotas/{cuotaId}/fecha-vencimiento', async () => {
    mockedApi.patch.mockResolvedValueOnce({ data: { ...sampleCuota, fechaVencimiento: '2026-06-04' } });

    const dto: UpdateFechaVencimientoCuotaDTO = {
      nuevaFecha: '2026-06-04',
      motivo: 'Cliente solicitó',
      propagarSiguientes: false,
      prestamoVersion: 0,
    };

    const result = await prestamoPersonalApi.actualizarFechaVencimientoCuota(100, 200, dto);

    expect(mockedApi.patch).toHaveBeenCalledTimes(1);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      '/api/prestamos-personales/100/cuotas/200/fecha-vencimiento',
      dto,
    );
    expect(result.fechaVencimiento).toBe('2026-06-04');
  });

  it('propaga errores 409 al caller (version conflict)', async () => {
    mockedApi.patch.mockRejectedValueOnce({
      response: { status: 409, data: { code: 'VERSION_CONFLICT' } },
    });

    await expect(
      prestamoPersonalApi.actualizarFechaEntrega(100, {
        nuevaFecha: '2026-05-06',
        motivo: 'concurrente',
        aplicarDesplazamientoCuotas: false,
        version: 0,
      }),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });
});
