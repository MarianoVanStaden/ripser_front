import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config', () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mockApi };
});

import api from '../../config';
import { productoTerminadoApi } from '../productoTerminadoApi';

const mockedApi = vi.mocked(api, true);

const mockProductoTerminado = {
  id: 42,
  nombre: 'Freezer 400L',
  descripcion: 'Freezer horizontal de reventa',
  precio: 850000,
  costo: 600000,
  stockActual: 5,
  stockMinimo: 2,
  codigo: 'REV-FRE001',
  categoriaProductoId: 9,
  categoriaProductoNombre: 'Equipos de Reventa',
  activo: true,
  fechaCreacion: '2026-01-15T10:00:00Z',
};

describe('productoTerminadoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('endpoint routing', () => {
    it('NEVER targets /api/productos (the materials endpoint)', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });
      mockedApi.post.mockResolvedValue({ data: mockProductoTerminado });
      mockedApi.put.mockResolvedValue({ data: mockProductoTerminado });
      mockedApi.delete.mockResolvedValue({});

      await productoTerminadoApi.getAll();
      await productoTerminadoApi.getActivos();
      await productoTerminadoApi.getById(1);
      await productoTerminadoApi.getByCodigo('X');
      await productoTerminadoApi.getByCategoria(1);
      await productoTerminadoApi.getBajoStock();
      await productoTerminadoApi.create(mockProductoTerminado as any);
      await productoTerminadoApi.update(1, mockProductoTerminado);
      await productoTerminadoApi.delete(1);

      const allCalls = [
        ...mockedApi.get.mock.calls,
        ...mockedApi.post.mock.calls,
        ...mockedApi.put.mock.calls,
        ...mockedApi.delete.mock.calls,
      ].map((c) => c[0] as string);

      // Every URL must hit /api/productos-terminados, never bare /api/productos.
      for (const url of allCalls) {
        expect(url.startsWith('/api/productos-terminados')).toBe(true);
        expect(url.startsWith('/api/productos/')).toBe(false);
        expect(url === '/api/productos').toBe(false);
      }
    });
  });

  describe('getAll', () => {
    it('sends GET to /api/productos-terminados', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockProductoTerminado] });

      const result = await productoTerminadoApi.getAll();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados');
      expect(result).toEqual([mockProductoTerminado]);
    });
  });

  describe('getActivos', () => {
    it('sends GET to /api/productos-terminados/activos', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockProductoTerminado] });

      const result = await productoTerminadoApi.getActivos();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados/activos');
      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('sends GET to /api/productos-terminados/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: mockProductoTerminado });

      const result = await productoTerminadoApi.getById(42);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados/42');
      expect(result.id).toBe(42);
    });
  });

  describe('getByCodigo', () => {
    it('sends GET to /api/productos-terminados/codigo/:codigo', async () => {
      mockedApi.get.mockResolvedValue({ data: mockProductoTerminado });

      await productoTerminadoApi.getByCodigo('REV-FRE001');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados/codigo/REV-FRE001');
    });
  });

  describe('getByCategoria', () => {
    it('sends GET to /api/productos-terminados/categoria/:id', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockProductoTerminado] });

      await productoTerminadoApi.getByCategoria(9);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados/categoria/9');
    });
  });

  describe('getBajoStock', () => {
    it('sends GET to /api/productos-terminados/bajo-stock', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockProductoTerminado] });

      await productoTerminadoApi.getBajoStock();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados/bajo-stock');
    });
  });

  describe('create', () => {
    it('sends POST to /api/productos-terminados with the body', async () => {
      mockedApi.post.mockResolvedValue({ data: mockProductoTerminado });

      const payload = {
        nombre: 'Balanza digital',
        descripcion: '20kg',
        precio: 95000,
        costo: 60000,
        stockActual: 3,
        stockMinimo: 1,
        codigo: 'REV-BAL001',
        categoriaProductoId: 9,
        categoriaProductoNombre: 'Equipos de Reventa',
        activo: true,
      };

      const result = await productoTerminadoApi.create(payload as any);

      expect(mockedApi.post).toHaveBeenCalledWith('/api/productos-terminados', payload);
      expect(result.id).toBe(42);
    });
  });

  describe('update', () => {
    it('sends PUT to /api/productos-terminados/:id with the partial body', async () => {
      mockedApi.put.mockResolvedValue({
        data: { ...mockProductoTerminado, precio: 999999 },
      });

      const result = await productoTerminadoApi.update(42, { precio: 999999 });

      expect(mockedApi.put).toHaveBeenCalledWith('/api/productos-terminados/42', { precio: 999999 });
      expect(result.precio).toBe(999999);
    });
  });

  describe('delete', () => {
    it('sends DELETE to /api/productos-terminados/:id', async () => {
      mockedApi.delete.mockResolvedValue({});

      await productoTerminadoApi.delete(42);

      expect(mockedApi.delete).toHaveBeenCalledWith('/api/productos-terminados/42');
    });
  });

  describe('error propagation', () => {
    it('propagates errors from the underlying api', async () => {
      const err = new Error('Network down');
      mockedApi.get.mockRejectedValue(err);

      await expect(productoTerminadoApi.getById(1)).rejects.toThrow('Network down');
    });
  });
});
