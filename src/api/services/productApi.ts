import api from '../config';
import type { Producto, ProductoCreateDTO, ProductoUpdateDTO, PageResponse, PaginationParams } from '../../types';

export const productApi = {
  // Get all products (paginated)
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Producto>> => {
    const response = await api.get<PageResponse<Producto>>('/api/productos', {
      params: { ...pagination },
    });
    return response.data;
  },
  getLowStock: async (): Promise<Producto[]> => {
    try {
      const response = await api.get('/api/productos/bajo-stock');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching low stock products:', {
        status: error.response?.status,
        message: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }

  // ... other methods
  },

  // Get active products
  getActivos: async (): Promise<Producto[]> => {
    const response = await api.get('/api/productos/activos');
    return response.data;
  },

  // Get product by ID
  getById: async (id: number): Promise<Producto> => {
    const response = await api.get(`/api/productos/${id}`);
    return response.data;
  },

  // Create new product
  create: async (product: ProductoCreateDTO): Promise<Producto> => {
    const response = await api.post('/api/productos', product);
    return response.data;
  },

  // Update product
  update: async (id: number, product: Partial<ProductoUpdateDTO>): Promise<Producto> => {
    const response = await api.put(`/api/productos/${id}`, product);
    return response.data;
  },

  // Delete product
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/productos/${id}`);
  },

  // Get products by category
  getByCategory: async (categoryId: number): Promise<Producto[]> => {
    const response = await api.get(`/api/productos/categoria/${categoryId}`);
    return response.data;
  },


};
