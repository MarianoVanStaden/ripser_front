import api from '../config';
import type { Usuario } from '../../types';

export const usuarioApi = {
  // Get all usuarios. El backend devuelve Page<UsuarioDTO>; pedimos un size
  // grande para que los callers que esperan la lista completa (selectores,
  // autocompletes) la reciban sin paginar a mano.
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get('/api/admin/usuarios', {
      params: { page: 0, size: 1000 },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.content ?? []);
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

  // Get vendedores de la empresa actual (accesible para todos los roles autenticados)
  getVendedores: async (): Promise<Usuario[]> => {
    const response = await api.get('/api/admin/usuarios/vendedores');
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
