import api from '../config';
import type { Supplier, CreateSupplierRequest } from '../../types';

export const supplierApi = {
  // Get all suppliers
  getAll: async (): Promise<Supplier[]> => {
    const response = await api.get('/api/proveedores');
    return response.data;
  },

  // Get supplier by ID
  getById: async (id: number): Promise<Supplier> => {
    const response = await api.get(`/api/proveedores/${id}`);
    return response.data;
  },

  // Create new supplier
  create: async (supplier: CreateSupplierRequest): Promise<Supplier> => {
    const response = await api.post('/api/proveedores', supplier);
    return response.data;
  },

  // Update supplier
  update: async (id: number, supplier: Partial<CreateSupplierRequest>): Promise<Supplier> => {
    const response = await api.put(`/api/proveedores/${id}`, supplier);
    return response.data;
  },

  // Delete supplier
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/proveedores/${id}`);
  },

  // Get suppliers by estado
  getByEstado: async (estado: string): Promise<Supplier[]> => {
    const response = await api.get(`/api/proveedores/estado/${estado}`);
    return response.data;
  },

  // Get suppliers by calificacion
  getByCalificacion: async (calificacionMinima: string): Promise<Supplier[]> => {
    const response = await api.get(`/api/proveedores/calificacion/${calificacionMinima}`);
    return response.data;
  },
};
