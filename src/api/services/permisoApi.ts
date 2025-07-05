import api from '../config';
import type { Permiso } from '../../types';

export const permisoApi = {
  // Obtener todos los permisos
  getAll: async (): Promise<Permiso[]> => {
    const response = await api.get('/api/admin/permisos');
    return response.data;
  },

  // Obtener permisos por módulo
  getByModulo: async (modulo: string): Promise<Permiso[]> => {
    const response = await api.get(`/api/admin/permisos/modulo/${modulo}`);
    return response.data;
  },

  // Crear permiso
  create: async (permiso: Partial<Permiso>): Promise<Permiso> => {
    const response = await api.post('/api/admin/permisos', permiso);
    return response.data;
  }
};
