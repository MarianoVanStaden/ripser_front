import api from "../config";
import type { Producto, CreateProductRequest } from "../../types";

export const productApi = {
  // Get all products

  getAll: async (page: number = 0, size: number = 10): Promise<Producto[]> => {
    try {
      const response = await api.get("/api/productos", {
        params: { page, size },
      });
      return response.data.content; // Handle Spring Page object
    } catch (error: any) {
      console.error("Error fetching products:", {
        status: error.response?.status,
        message: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  },
  getLowStock: async (): Promise<Producto[]> => {
    try {
      const response = await api.get("/api/productos/bajo-stock");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching low stock products:", {
        status: error.response?.status,
        message: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }

    // ... other methods
  },

  // Get product by ID
  getById: async (id: number): Promise<Producto> => {
    const response = await api.get(`/api/productos/${id}`);
    return response.data;
  },

  // Create new product
  create: async (product: CreateProductRequest): Promise<Producto> => {
    const response = await api.post("/api/productos", product);
    return response.data;
  },

  // Update product
  update: async (
    id: number,
    product: Partial<CreateProductRequest>
  ): Promise<Producto> => {
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

  search: async (term: string): Promise<Producto[]> => {
    const response = await api.get<Producto[]>(`/api/productos/search`, {
      params: { nombre: term },
    });
    return response.data;
  },
};
