import api from '../config';
import type { MaterialUtilizado } from '../../types';

export const materialUtilizadoApi = {
  // Get all materiales utilizados
  getAll: async (): Promise<MaterialUtilizado[]> => {
    const response = await api.get('/api/materiales-utilizados');
    // Backend returns paginated response: { content: [], totalPages, totalElements, ... }
    // Extract the content array from the paginated response
    return response.data.content || response.data;
  },

  // Get material by ID
  getById: async (id: number): Promise<MaterialUtilizado> => {
    const response = await api.get(`/api/materiales-utilizados/${id}`);
    return response.data;
  },

  // Create new material utilizado
  create: async (material: MaterialUtilizado): Promise<MaterialUtilizado> => {
    const response = await api.post('/api/materiales-utilizados', material);
    return response.data;
  },

  // Update material utilizado
  update: async (id: number, material: MaterialUtilizado): Promise<MaterialUtilizado> => {
    const response = await api.put(`/api/materiales-utilizados/${id}`, material);
    return response.data;
  },

  // Delete material utilizado
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/materiales-utilizados/${id}`);
  },

  // Get materiales by orden de servicio
  getByOrden: async (ordenId: number): Promise<MaterialUtilizado[]> => {
    const response = await api.get(`/api/materiales-utilizados/orden/${ordenId}`);
    return response.data;
  },

  // Get materiales by producto
  getByProducto: async (productoId: number): Promise<MaterialUtilizado[]> => {
    const response = await api.get(`/api/materiales-utilizados/producto/${productoId}`);
    return response.data;
  },

  // Get cantidad utilizada por periodo
  getCantidadPorPeriodo: async (productoId: number, fechaInicio: string, fechaFin: string): Promise<number> => {
    const response = await api.get(`/api/materiales-utilizados/producto/${productoId}/consumo`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  }
};
