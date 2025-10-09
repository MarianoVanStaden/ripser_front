import api from '../config';
import type { Category, CreateCategoryRequest } from '../../types';

export const categoryApi = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/api/categorias-productos');
    return response.data;
  },

  // Get category by ID
  getById: async (id: number): Promise<Category> => {
    const response = await api.get(`/api/categorias-productos/${id}`);
    return response.data;
  },

  // Create new category
  create: async (category: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post('/api/categorias-productos', category);
    return response.data;
  },

  // Update category
  update: async (id: number, category: Partial<CreateCategoryRequest>): Promise<Category> => {
    const response = await api.put(`/api/categorias-productos/${id}`, category);
    return response.data;
  },

  // Delete category
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/categorias-productos/${id}`);
  }
};
