import api from '../config';
import type { ProveedorOfertaDTO, SearchSuggestion, PageResponse } from '../../types';

export const proveedorSearchApi = {
  searchProductos: async (q: string, limit = 10): Promise<SearchSuggestion[]> => {
    if (!q || q.trim().length < 2) return [];
    const { data } = await api.get('/api/productos/search', { params: { q: q.trim(), limit } });
    return Array.isArray(data) ? data : [];
  },

  searchCategorias: async (q: string, limit = 10): Promise<SearchSuggestion[]> => {
    if (!q || q.trim().length < 2) return [];
    const { data } = await api.get('/api/categorias-productos/search', { params: { q: q.trim(), limit } });
    return Array.isArray(data) ? data : [];
  },

  proveedoresPorProducto: async (productoId: number): Promise<ProveedorOfertaDTO[]> => {
    const { data } = await api.get('/api/proveedores/por-producto', { params: { productoId } });
    return Array.isArray(data) ? data : (data?.content ?? []);
  },

  proveedoresPorCategoria: async (
    categoriaId: number,
    page = 0,
    size = 50,
  ): Promise<PageResponse<ProveedorOfertaDTO> | ProveedorOfertaDTO[]> => {
    const { data } = await api.get('/api/proveedores/por-producto', {
      params: { categoriaId, page, size },
    });
    return data;
  },
};
