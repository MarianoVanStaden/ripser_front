import api from '../config';
import type { Product, CreateProductRequest } from '../../types';

export const productApi = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/api/products');
    return response.data;
  },

  // Get product by ID
  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  // Create new product
  create: async (product: CreateProductRequest): Promise<Product> => {
    const response = await api.post('/api/products', product);
    return response.data;
  },

  // Update product
  update: async (id: number, product: Partial<CreateProductRequest>): Promise<Product> => {
    const response = await api.put(`/api/products/${id}`, product);
    return response.data;
  },

  // Delete product
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/products/${id}`);
  },

  // Get products by category
  getByCategory: async (categoryId: number): Promise<Product[]> => {
    const response = await api.get(`/api/products/category/${categoryId}`);
    return response.data;
  },

  // Get products with low stock
  getLowStock: async (threshold: number): Promise<Product[]> => {
    const response = await api.get(`/api/products/low-stock?threshold=${threshold}`);
    return response.data;
  }
};
