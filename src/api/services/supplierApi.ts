import api from '../config';
import type { Supplier, CreateSupplierRequest } from '../../types';

export const supplierApi = {
  // Get all suppliers
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get('/api/suppliers');
    return response.data;
  },

  // Get supplier by ID
  getById: async (id: number): Promise<Supplier> => {
    const response = await api.get(`/api/suppliers/${id}`);
    return response.data;
  },

  // Create new supplier
  create: async (supplier: CreateSupplierRequest): Promise<Supplier> => {
    const response = await api.post('/api/suppliers', supplier);
    return response.data;
  },

  // Update supplier
  update: async (id: number, supplier: Partial<CreateSupplierRequest>): Promise<Supplier> => {
    const response = await api.put(`/api/suppliers/${id}`, supplier);
    return response.data;
  },

  // Delete supplier
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/suppliers/${id}`);
  }
};
