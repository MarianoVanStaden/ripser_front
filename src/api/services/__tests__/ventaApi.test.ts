import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { ventaApi } from '../ventaApi';

const mockedApi = vi.mocked(api, true);

const mockVenta = {
  id: 1,
  clienteId: 10,
  total: 5000,
  estado: 'PENDIENTE',
};

describe('ventaApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sends GET to /ventas with filter params', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockVenta] });

      const result = await ventaApi.getAll({ estado: 'PENDIENTE', sucursalId: 1 });

      expect(mockedApi.get).toHaveBeenCalledWith('/ventas', {
        params: { estado: 'PENDIENTE', sucursalId: 1 },
      });
      expect(result).toEqual([mockVenta]);
    });

    it('works without params', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      await ventaApi.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/ventas', { params: undefined });
    });
  });

  describe('getById', () => {
    it('sends GET to /ventas/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockVenta });

      const result = await ventaApi.getById(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/ventas/1');
      expect(result.id).toBe(1);
    });
  });

  describe('getByCliente', () => {
    it('sends GET to /ventas/cliente/:clienteId', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockVenta] });

      const result = await ventaApi.getByCliente(10);

      expect(mockedApi.get).toHaveBeenCalledWith('/ventas/cliente/10');
      expect(result).toEqual([mockVenta]);
    });
  });

  describe('getByEstado', () => {
    it('sends GET to /ventas/estado/:estado', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockVenta] });

      const result = await ventaApi.getByEstado('PENDIENTE');

      expect(mockedApi.get).toHaveBeenCalledWith('/ventas/estado/PENDIENTE');
      expect(result).toEqual([mockVenta]);
    });
  });

  describe('getTotalPeriodo', () => {
    it('sends GET with date params', async () => {
      mockedApi.get.mockResolvedValue({ data: '50000.00' });

      const result = await ventaApi.getTotalPeriodo('2024-01-01', '2024-01-31');

      expect(mockedApi.get).toHaveBeenCalledWith('/ventas/total-periodo', {
        params: { fechaInicio: '2024-01-01', fechaFin: '2024-01-31' },
      });
      expect(result).toBe('50000.00');
    });
  });

  describe('create', () => {
    it('sends POST to /ventas', async () => {
      mockedApi.post.mockResolvedValue({ data: mockVenta });

      const result = await ventaApi.create(mockVenta as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/ventas', mockVenta);
      expect(result.id).toBe(1);
    });
  });

  describe('update', () => {
    it('sends PUT to /ventas/:id', async () => {
      const updated = { ...mockVenta, estado: 'COMPLETADA' };
      mockedApi.put.mockResolvedValue({ data: updated });

      const result = await ventaApi.update(1, updated as any);

      expect(mockedApi.put).toHaveBeenCalledWith('/ventas/1', updated);
      expect(result.estado).toBe('COMPLETADA');
    });
  });
});
