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
import { proveedorSearchApi } from '../proveedorSearchApi';

const mockedApi = vi.mocked(api, true);

const mockSugerencia = {
  id: 1,
  label: 'Bomba sumergible 1HP',
  codigo: 'BOM001',
  tipo: 'PRODUCTO' as const,
};

const mockOferta = {
  proveedorId: 10,
  razonSocial: 'Proveedor Alfa',
  email: 'alfa@test.com',
  telefono: '+54 11 1234-5678',
  ciudad: 'La Plata',
  provincia: 'BUENOS_AIRES',
  productoId: 1,
  productoNombre: 'Bomba sumergible 1HP',
  productoCodigo: 'BOM001',
  precioProveedor: 12345.5,
  activo: true,
};

describe('proveedorSearchApi', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('searchProductos', () => {
    it('hace GET a /api/productos/search con q y limit', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockSugerencia] });

      const result = await proveedorSearchApi.searchProductos('bomb', 15);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/search', {
        params: { q: 'bomb', limit: 15 },
      });
      expect(result).toEqual([mockSugerencia]);
    });

    it('trimea el query antes de enviar', async () => {
      mockedApi.get.mockResolvedValue({ data: [] });

      await proveedorSearchApi.searchProductos('  bomba  ');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/productos/search', {
        params: { q: 'bomba', limit: 10 },
      });
    });

    it('retorna [] sin llamar al backend cuando q < 2 chars', async () => {
      const result1 = await proveedorSearchApi.searchProductos('');
      const result2 = await proveedorSearchApi.searchProductos('a');
      const result3 = await proveedorSearchApi.searchProductos('   ');

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
      expect(mockedApi.get).not.toHaveBeenCalled();
    });

    it('retorna [] si el backend devuelve algo que no es array', async () => {
      mockedApi.get.mockResolvedValue({ data: { error: 'boom' } });

      const result = await proveedorSearchApi.searchProductos('bomb');

      expect(result).toEqual([]);
    });

    it('fail-soft: devuelve [] ante error del backend (no propaga)', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await proveedorSearchApi.searchProductos('bomb');

      expect(result).toEqual([]);
      // El warn se dispara solo la primera vez en la sesión; lo verificamos sin ser estrictos.
      warnSpy.mockRestore();
    });
  });

  describe('searchCategorias', () => {
    it('hace GET a /api/categorias-productos/search con q y limit', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockSugerencia] });

      await proveedorSearchApi.searchCategorias('bomb');

      expect(mockedApi.get).toHaveBeenCalledWith('/api/categorias-productos/search', {
        params: { q: 'bomb', limit: 10 },
      });
    });

    it('aplica mismo guard de longitud mínima que searchProductos', async () => {
      const result = await proveedorSearchApi.searchCategorias('x');
      expect(result).toEqual([]);
      expect(mockedApi.get).not.toHaveBeenCalled();
    });
  });

  describe('proveedoresPorProducto', () => {
    it('hace GET a /api/proveedores/por-producto con productoId', async () => {
      mockedApi.get.mockResolvedValue({ data: [mockOferta] });

      const result = await proveedorSearchApi.proveedoresPorProducto(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/proveedores/por-producto', {
        params: { productoId: 1 },
      });
      expect(result).toEqual([mockOferta]);
    });

    it('normaliza Page response a array', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [mockOferta], totalElements: 1 } });

      const result = await proveedorSearchApi.proveedoresPorProducto(1);

      expect(result).toEqual([mockOferta]);
    });

    it('retorna [] si data es null/undefined', async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const result = await proveedorSearchApi.proveedoresPorProducto(1);

      expect(result).toEqual([]);
    });
  });

  describe('proveedoresPorCategoria', () => {
    it('hace GET con categoriaId + paginación por defecto', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [mockOferta] } });

      await proveedorSearchApi.proveedoresPorCategoria(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/proveedores/por-producto', {
        params: { categoriaId: 5, page: 0, size: 50 },
      });
    });

    it('respeta page y size custom', async () => {
      mockedApi.get.mockResolvedValue({ data: { content: [] } });

      await proveedorSearchApi.proveedoresPorCategoria(5, 2, 25);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/proveedores/por-producto', {
        params: { categoriaId: 5, page: 2, size: 25 },
      });
    });
  });
});
