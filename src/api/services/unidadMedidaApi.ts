import api from '../config';
import type { UnidadMedida } from '../../types';

export const unidadMedidaApi = {
  // Get all unidades de medida
  getAll: async (): Promise<UnidadMedida[]> => {
    const response = await api.get('/api/unidades-medida');
    return response.data;
  },

  // Create new unidad de medida
  create: async (unidad: UnidadMedida): Promise<UnidadMedida> => {
    const response = await api.post('/api/unidades-medida', unidad);
    return response.data;
  }
};
