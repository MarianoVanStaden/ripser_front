import api from '../config';
import type { Sale, CreateSaleRequest } from '../../types';

export const saleApi = {
  // Get all sales
  getAll: async (): Promise<Sale[]> => {
    const response = await api.get('/api/ventas'); // <-- updated to match backend
    return response.data;
  },

  // Get sale by ID
  getById: async (id: number): Promise<Sale> => {
    const response = await api.get(`/api/ventas/${id}`); // <-- updated
    return response.data;
  },

  // Create new sale
  create: async (sale: CreateSaleRequest): Promise<Sale> => {
    const response = await api.post('/api/ventas', sale); // <-- updated
    return response.data;
  },

  // Update sale
  update: async (id: number, sale: Partial<CreateSaleRequest>): Promise<Sale> => {
    const response = await api.put(`/api/ventas/${id}`, sale); // <-- updated
    return response.data;
  },

  // Delete sale
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ventas/${id}`);
  },

  // Get sales by client
  getByClient: async (clientId: number): Promise<Sale[]> => {
    const response = await api.get(`/api/ventas/cliente/${clientId}`); // <-- updated
    return response.data;
  },

  // Get sales by estado
  getByEstado: async (estado: string): Promise<Sale[]> => {
    const response = await api.get(`/api/ventas/estado/${estado}`);
    return response.data;
  },

  // Get total sales in a period
  getTotalPeriodo: async (fechaInicio: string, fechaFin: string): Promise<number> => {
    const response = await api.get(`/api/ventas/total-periodo?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`);
    return response.data;
  },

  // Search sales (used by GarantiaFormDialog Autocomplete)
  search: async (term: string): Promise<Sale[]> => {
    try {
      const response = await api.get<Sale[]>('/api/ventas/search', { params: { q: term } });
      return response.data;
    } catch (err: any) {
      console.warn('saleApi.search failed', { term, err });
      throw err;
    }
  }
};
