import api from '../config';
import type { ProveedorDTO, CreateProveedorDTO } from '../../types';

export const supplierApi = {
  // Get all suppliers
  getAll: async (): Promise<ProveedorDTO[]> => {
    const res = await api.get('/api/proveedores');
    return res.data;
  },

  // Get supplier by ID
  getById: async (id: number): Promise<ProveedorDTO> => {
    const res = await api.get(`/api/proveedores/${id}`);
    return res.data;
  },

  // Create new supplier
  create: async (data: CreateProveedorDTO): Promise<ProveedorDTO> => {
    const res = await api.post('/api/proveedores', data);
    return res.data;
  },

  // Update supplier
  update: async (id: number, data: CreateProveedorDTO): Promise<ProveedorDTO> => {
    const res = await api.put(`/api/proveedores/${id}`, data);
    return res.data;
  },

  // Delete supplier
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/proveedores/${id}`);
  },
};