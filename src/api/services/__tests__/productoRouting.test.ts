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
import { TipoEntidadProducto } from '../../../types';
import {
  isCategoriaReventa,
  isReventa,
  getTipoEntidadByCategoria,
  getProductoEndpoint,
  fetchProductoById,
  updateProducto,
  deleteProducto,
  fetchProductosUnificados,
} from '../productoRouting';

const mockedApi = vi.mocked(api, true);

const materialBackend = {
  id: 1,
  nombre: 'Caño de cobre',
  descripcion: 'Por metro',
  precio: 1200,
  costo: 800,
  stockActual: 100,
  stockMinimo: 10,
  codigo: 'MAT-CAN001',
  categoriaProductoId: 3,
  categoriaProductoNombre: 'Materias primas',
  activo: true,
  fechaCreacion: '2026-01-01T00:00:00Z',
};

const reventaBackend = {
  id: 2,
  nombre: 'Freezer 400L',
  descripcion: 'Reventa',
  precio: 850000,
  costo: 600000,
  stockActual: 5,
  stockMinimo: 2,
  codigo: 'REV-FRE001',
  categoriaProductoId: 9,
  categoriaProductoNombre: 'Equipos Reventa',
  activo: true,
  fechaCreacion: '2026-01-15T00:00:00Z',
};

describe('productoRouting helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Pure helpers ────────────────────────────────────────────────────────────

  describe('isCategoriaReventa', () => {
    it('returns true when esReventa is true', () => {
      expect(isCategoriaReventa({ esReventa: true })).toBe(true);
    });

    it('returns false when esReventa is false', () => {
      expect(isCategoriaReventa({ esReventa: false })).toBe(false);
    });

    it('returns false when esReventa is undefined', () => {
      expect(isCategoriaReventa({})).toBe(false);
    });

    it('returns false when categoria is null/undefined', () => {
      expect(isCategoriaReventa(null)).toBe(false);
      expect(isCategoriaReventa(undefined)).toBe(false);
    });
  });

  describe('getTipoEntidadByCategoria', () => {
    it('returns PRODUCTO_TERMINADO for reventa', () => {
      expect(getTipoEntidadByCategoria({ esReventa: true })).toBe(
        TipoEntidadProducto.PRODUCTO_TERMINADO,
      );
    });

    it('returns MATERIAL for non-reventa', () => {
      expect(getTipoEntidadByCategoria({ esReventa: false })).toBe(TipoEntidadProducto.MATERIAL);
      expect(getTipoEntidadByCategoria({})).toBe(TipoEntidadProducto.MATERIAL);
      expect(getTipoEntidadByCategoria(null)).toBe(TipoEntidadProducto.MATERIAL);
    });
  });

  describe('isReventa', () => {
    it('discriminates by tipoEntidad on the producto', () => {
      expect(isReventa({ tipoEntidad: TipoEntidadProducto.PRODUCTO_TERMINADO })).toBe(true);
      expect(isReventa({ tipoEntidad: TipoEntidadProducto.MATERIAL })).toBe(false);
      expect(isReventa({ tipoEntidad: undefined })).toBe(false);
    });
  });

  describe('getProductoEndpoint', () => {
    it('returns the productos-terminados base for reventa', () => {
      expect(getProductoEndpoint(true)).toBe('/api/productos-terminados');
    });

    it('returns the productos base for materials', () => {
      expect(getProductoEndpoint(false)).toBe('/api/productos');
    });
  });

  // ─── Side-effect helpers (route to the right endpoint) ───────────────────────

  describe('fetchProductoById', () => {
    it('hits /api/productos/:id for MATERIAL and stamps tipoEntidad', async () => {
      mockedApi.get.mockResolvedValue({ data: materialBackend });

      const result = await fetchProductoById(1, TipoEntidadProducto.MATERIAL);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/1');
      expect(result.tipoEntidad).toBe(TipoEntidadProducto.MATERIAL);
      expect(result.id).toBe(1);
    });

    it('hits /api/productos-terminados/:id for PRODUCTO_TERMINADO and stamps tipoEntidad', async () => {
      mockedApi.get.mockResolvedValue({ data: reventaBackend });

      const result = await fetchProductoById(2, TipoEntidadProducto.PRODUCTO_TERMINADO);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados/2');
      expect(result.tipoEntidad).toBe(TipoEntidadProducto.PRODUCTO_TERMINADO);
    });
  });

  describe('updateProducto', () => {
    it('PUTs to /api/productos/:id when tipoEntidad is MATERIAL', async () => {
      mockedApi.put.mockResolvedValue({ data: materialBackend });

      await updateProducto(1, { precio: 1500 }, TipoEntidadProducto.MATERIAL);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/productos/1', { precio: 1500 });
      // Critical: must NOT have hit the productos-terminados endpoint.
      expect(
        mockedApi.put.mock.calls.some((c) =>
          (c[0] as string).startsWith('/api/productos-terminados'),
        ),
      ).toBe(false);
    });

    it('PUTs to /api/productos-terminados/:id when tipoEntidad is PRODUCTO_TERMINADO', async () => {
      mockedApi.put.mockResolvedValue({ data: reventaBackend });

      await updateProducto(2, { precio: 999000 }, TipoEntidadProducto.PRODUCTO_TERMINADO);

      expect(mockedApi.put).toHaveBeenCalledWith('/api/productos-terminados/2', { precio: 999000 });
      // Critical: must NOT have hit the bare /api/productos endpoint (the backend would 400 it).
      expect(
        mockedApi.put.mock.calls.some(
          (c) => (c[0] as string) === '/api/productos/2',
        ),
      ).toBe(false);
    });

    it('returned object carries tipoEntidad to keep state consistent', async () => {
      mockedApi.put.mockResolvedValue({ data: reventaBackend });

      const result = await updateProducto(2, { precio: 1 }, TipoEntidadProducto.PRODUCTO_TERMINADO);

      expect(result.tipoEntidad).toBe(TipoEntidadProducto.PRODUCTO_TERMINADO);
    });
  });

  describe('deleteProducto', () => {
    it('DELETEs /api/productos/:id for MATERIAL', async () => {
      mockedApi.delete.mockResolvedValue({});
      await deleteProducto(1, TipoEntidadProducto.MATERIAL);
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/productos/1');
    });

    it('DELETEs /api/productos-terminados/:id for PRODUCTO_TERMINADO', async () => {
      mockedApi.delete.mockResolvedValue({});
      await deleteProducto(2, TipoEntidadProducto.PRODUCTO_TERMINADO);
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/productos-terminados/2');
    });
  });

  // ─── Unified listing ─────────────────────────────────────────────────────────

  describe('fetchProductosUnificados', () => {
    const matPage = {
      content: [materialBackend],
      totalElements: 1,
      totalPages: 1,
      size: 10000,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    };

    it('fetches both endpoints in parallel and stamps tipoEntidad on each item', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: matPage }) // /api/productos
        .mockResolvedValueOnce({ data: [reventaBackend] }); // /api/productos-terminados

      const list = await fetchProductosUnificados();

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos', {
        params: { page: 0, size: 10000 },
      });
      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos-terminados');

      const material = list.find((p) => p.id === 1);
      const reventa = list.find((p) => p.id === 2);

      expect(material?.tipoEntidad).toBe(TipoEntidadProducto.MATERIAL);
      expect(reventa?.tipoEntidad).toBe(TipoEntidadProducto.PRODUCTO_TERMINADO);
      expect(list).toHaveLength(2);
    });

    it('degrades gracefully when /api/productos-terminados fails (returns only materials)', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: matPage })
        .mockRejectedValueOnce(new Error('500 backend down'));

      const list = await fetchProductosUnificados();

      expect(list).toHaveLength(1);
      expect(list[0].tipoEntidad).toBe(TipoEntidadProducto.MATERIAL);
    });

    it('returns empty array when both endpoints return empty', async () => {
      mockedApi.get
        .mockResolvedValueOnce({ data: { ...matPage, content: [] } })
        .mockResolvedValueOnce({ data: [] });

      const list = await fetchProductosUnificados();

      expect(list).toEqual([]);
    });

    it('tolerates a paginated-shaped response from /api/productos-terminados (defensive)', async () => {
      // Algunos mocks/catch-alls devuelven {content: []} en vez de un array.
      const paginatedShape = { content: [reventaBackend], totalElements: 1 };

      mockedApi.get
        .mockResolvedValueOnce({ data: matPage })
        .mockResolvedValueOnce({ data: paginatedShape });

      const list = await fetchProductosUnificados();

      expect(list).toHaveLength(2);
      expect(list.find((p) => p.id === 2)?.tipoEntidad).toBe(TipoEntidadProducto.PRODUCTO_TERMINADO);
    });

    it('normalizes nested categoriaProducto into flat ids/names for productos-terminados', async () => {
      const nested = {
        ...reventaBackend,
        categoriaProductoId: undefined,
        categoriaProductoNombre: undefined,
        categoriaProducto: { id: 9, nombre: 'Equipos Reventa', activo: true, esReventa: true },
      };

      mockedApi.get
        .mockResolvedValueOnce({ data: { ...matPage, content: [] } })
        .mockResolvedValueOnce({ data: [nested] });

      const list = await fetchProductosUnificados();

      expect(list[0].categoriaProductoId).toBe(9);
      expect(list[0].categoriaProductoNombre).toBe('Equipos Reventa');
    });
  });
});
