import api from '../config';
import type { UnidadMedida } from '../../types';

export const unidadMedidaApi = {
  // Get all unidades de medida
  getAll: async (): Promise<UnidadMedida[]> => {
    const response = await api.get('/unidades-medida');
    return response.data;
  },

  // Create new unidad de medida
  create: async (unidad: UnidadMedida): Promise<UnidadMedida> => {
    const response = await api.post('/unidades-medida', unidad);
    return response.data;
  }
};
