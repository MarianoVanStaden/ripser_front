import api from '../config';
import type { Rol } from '../../types';

export const rolApi = {
  // Get all roles
  getAll: async (): Promise<Rol[]> => {
    const response = await api.get('/api/admin/roles');
    return response.data;
  },

  // Get role by ID
  getById: async (id: number): Promise<Rol> => {
    const response = await api.get(`/api/admin/roles/${id}`);
    return response.data;
  },

  // Get roles by modulo
  getByModulo: async (modulo: string): Promise<Rol[]> => {
    const response = await api.get(`/api/admin/roles/modulo/${modulo}`);
    return response.data;
  },

  // Create new role
  create: async (rol: Rol): Promise<Rol> => {
    const response = await api.post('/api/admin/roles', rol);
    return response.data;
  },

  // Update role
  update: async (id: number, rol: Rol): Promise<Rol> => {
    const response = await api.put(`/api/admin/roles/${id}`, rol);
    return response.data;
  },

  // Delete role
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/roles/${id}`);
  }
};
