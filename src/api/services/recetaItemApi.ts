import api from '../config';
import type { RecetaItem } from '../../types';

export const recetaItemApi = {
  // Get receta by producto
  getByProducto: async (productoId: number): Promise<RecetaItem[]> => {
    const response = await api.get(`/api/recetas/producto/${productoId}`);
    return response.data;
  },

  // Create new receta item
  create: async (recetaItem: RecetaItem): Promise<RecetaItem> => {
    const response = await api.post('/api/recetas', recetaItem);
    return response.data;
  },

  // Delete receta by producto
  deleteByProducto: async (productoId: number): Promise<void> => {
    await api.delete(`/api/recetas/producto/${productoId}`);
  },

  // Delete receta item by ID
  deleteById: async (id: number): Promise<void> => {
    await api.delete(`/api/recetas/${id}`);
  }
};
