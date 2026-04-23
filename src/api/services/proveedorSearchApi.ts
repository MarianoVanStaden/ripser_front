import api from '../config';
import type { ProveedorOfertaDTO, SearchSuggestion, PageResponse } from '../../types';

// Log de error limitado para no inundar consola mientras el backend /search no está listo.
let searchErrorWarned = false;
const warnSearchError = (endpoint: string, err: unknown) => {
  if (searchErrorWarned) return;
  searchErrorWarned = true;
  console.warn(
    `[proveedorSearchApi] ${endpoint} no está disponible, devolviendo []. ` +
      `Verificá que el backend tenga el endpoint implementado.`,
    err,
  );
};

export const proveedorSearchApi = {
  searchProductos: async (q: string, limit = 10): Promise<SearchSuggestion[]> => {
    if (!q || q.trim().length < 2) return [];
    try {
      const { data } = await api.get('/api/productos/search', { params: { q: q.trim(), limit } });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      warnSearchError('/api/productos/search', err);
      return [];
    }
  },

  searchCategorias: async (q: string, limit = 10): Promise<SearchSuggestion[]> => {
    if (!q || q.trim().length < 2) return [];
    try {
      const { data } = await api.get('/api/categorias-productos/search', { params: { q: q.trim(), limit } });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      warnSearchError('/api/categorias-productos/search', err);
      return [];
    }
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
