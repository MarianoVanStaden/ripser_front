import api from '../config';
import type { Product, CreateProductRequest } from '../../types';

export const productApi = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/api/productos');
    return response.data;
  },

  // Get product by ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/productos/${id}`);
    return response.data;
  },

  // Create new product
  create: async (product: CreateProductRequest): Promise<Product> => {
    const response = await api.post('/api/productos', product);
    return response.data;
  },

  // Update product
  update: async (id: number, product: Partial<CreateProductRequest>): Promise<Product> => {
    const response = await api.put(`/api/productos/${id}`, product);
    return response.data;
  },

  // Delete product
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/productos/${id}`);
  },

  // Get products by category
  getByCategory: async (categoryId: number): Promise<Product[]> => {
    const response = await api.get(`/api/productos/categoria/${categoryId}`);
    return response.data;
  },

  // Get products with low stock
  getLowStock: async (threshold: number): Promise<Product[]> => {
    const response = await api.get(`/api/productos/stock-bajo?threshold=${threshold}`);
    return response.data;
  }
};
