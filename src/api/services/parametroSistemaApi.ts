import api from '../config';
import type { ParametroSistema } from '../../types';

export const parametroSistemaApi = {
  // Get all parametros
  getAll: async (): Promise<ParametroSistema[]> => {
    const response = await api.get('/api/admin/parametros');
    return response.data;
  },

  // Get parametro by clave
  getByClave: async (clave: string): Promise<ParametroSistema> => {
    const response = await api.get(`/api/admin/parametros/clave/${clave}`);
    return response.data;
  },

  // Create new parametro
  create: async (parametro: ParametroSistema): Promise<ParametroSistema> => {
    const response = await api.post('/api/admin/parametros', parametro);
    return response.data;
  },

  // Update parametro
  update: async (id: number, parametro: ParametroSistema): Promise<ParametroSistema> => {
    const response = await api.put(`/api/admin/parametros/${id}`, parametro);
    return response.data;
  }
};
