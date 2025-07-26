import axios from 'axios';
import type { ProveedorDTO, CreateProveedorDTO } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export const supplierApi = {
  // Get all suppliers
  getAll: async (): Promise<ProveedorDTO[]> => {
    const res = await axios.get(`${API_URL}/api/proveedores`);
    return res.data;
  },

  // Get supplier by ID
  getById: async (id: number): Promise<ProveedorDTO> => {
    const res = await axios.get(`${API_URL}/api/proveedores/${id}`);
    return res.data;
  },

  // Create new supplier
  create: async (data: CreateProveedorDTO): Promise<ProveedorDTO> => {
    const res = await axios.post(`${API_URL}/api/proveedores`, data);
    return res.data;
  },

  // Update supplier
  update: async (id: number, data: CreateProveedorDTO): Promise<ProveedorDTO> => {
    const res = await axios.put(`${API_URL}/api/proveedores/${id}`, data);
    return res.data;
  },

  // Delete supplier
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/api/proveedores/${id}`);
  },
};
