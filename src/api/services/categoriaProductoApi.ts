import api from '../config';
import type { CategoriaProducto } from '../../types';

export const categoriaProductoApi = {
  getAll: async (): Promise<CategoriaProducto[]> => {
    const res = await api.get('/api/categorias-productos');
    return res.data;
  },

  getById: async (id: number): Promise<CategoriaProducto> => {
    const res = await api.get(`/api/categorias-productos/${id}`);
    return res.data;
  },

  create: async (categoria: Omit<CategoriaProducto, 'id'>): Promise<CategoriaProducto> => {
    const res = await api.post('/api/categorias-productos', categoria);
    return res.data;
  },

  update: async (id: number, categoria: Partial<CategoriaProducto>): Promise<CategoriaProducto> => {
    const res = await api.put(`/api/categorias-productos/${id}`, categoria);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/categorias-productos/${id}`);
  },
};
