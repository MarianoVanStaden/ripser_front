import api from '../config';
import type { Sale, CreateSaleRequest } from '../../types';

export const saleApi = {
  // Get all sales
  getAll: async (): Promise<Sale[]> => {
    const response = await api.get('/api/sales');
    return response.data;
  },

  // Get sale by ID
  getById: async (id: number): Promise<Sale> => {
    const response = await api.get(`/api/sales/${id}`);
    return response.data;
  },

  // Create new sale
  create: async (sale: CreateSaleRequest): Promise<Sale> => {
    const response = await api.post('/api/sales', sale);
    return response.data;
  },

  // Update sale
  update: async (id: number, sale: Partial<CreateSaleRequest>): Promise<Sale> => {
    const response = await api.put(`/api/sales/${id}`, sale);
    return response.data;
  },

  // Delete sale
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/sales/${id}`);
  },

  // Get sales by client
  getByClient: async (clientId: number): Promise<Sale[]> => {
    const response = await api.get(`/api/sales/client/${clientId}`);
    return response.data;
  },

  // Get sales by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<Sale[]> => {
    const response = await api.get(`/api/sales/date-range?start=${startDate}&end=${endDate}`);
    return response.data;
  }
};
