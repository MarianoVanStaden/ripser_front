import api from '../config';
import type { Sale, CreateSaleRequest } from '../../types';

export const saleApi = {
  // Get all sales
  getAll: async (): Promise<Sale[]> => {
    const response = await api.get('/api/ventas');
    return response.data;
  },

  // Get sale by ID
  getById: async (id: number): Promise<Sale> => {
    const response = await api.get(`/api/ventas/${id}`);
    return response.data;
  },

  // Create new sale
  create: async (sale: CreateSaleRequest): Promise<Sale> => {
    const response = await api.post('/api/ventas', sale);
    return response.data;
  },

  // Update sale
  update: async (id: number, sale: Partial<CreateSaleRequest>): Promise<Sale> => {
    const response = await api.put(`/api/ventas/${id}`, sale);
    return response.data;
  },

  // Delete sale
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ventas/${id}`);
  },

  // Get sales by client
  getByClient: async (clientId: number): Promise<Sale[]> => {
    const response = await api.get(`/api/ventas/cliente/${clientId}`);
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
  }
};
