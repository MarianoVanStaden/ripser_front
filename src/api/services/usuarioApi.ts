import api from '../config';
import type { Usuario } from '../../types';

export const usuarioApi = {
  // Get all usuarios
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get('/api/admin/usuarios');
    return response.data;
  },

  // Get usuarios activos
  getActivos: async (): Promise<Usuario[]> => {
    const response = await api.get('/api/admin/usuarios/activos');
    return response.data;
  },

  // Get usuario by ID
  getById: async (id: number): Promise<Usuario> => {
    const response = await api.get(`/api/admin/usuarios/${id}`);
    return response.data;
  },

  // Get usuario by username
  getByUsername: async (username: string): Promise<Usuario> => {
    const response = await api.get(`/api/admin/usuarios/username/${username}`);
    return response.data;
  },

  // Get usuarios by rol
  getByRol: async (rolNombre: string): Promise<Usuario[]> => {
    const response = await api.get(`/api/admin/usuarios/rol/${rolNombre}`);
    return response.data;
  },

  // Create new usuario
  create: async (usuario: Usuario): Promise<Usuario> => {
    const response = await api.post('/api/admin/usuarios', usuario);
    return response.data;
  },

  // Update usuario
  update: async (id: number, usuario: Usuario): Promise<Usuario> => {
    const response = await api.put(`/api/admin/usuarios/${id}`, usuario);
    return response.data;
  },

  // Delete usuario
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/usuarios/${id}`);
  }
};
