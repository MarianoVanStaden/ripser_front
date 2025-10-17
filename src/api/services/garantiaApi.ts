import api from '../config';
import type { Garantia } from '../../types';

export const garantiaApi = {
  // Get all garantias
  getAll: async (): Promise<Garantia[]> => {
    const response = await api.get('/api/garantias');
    return response.data;
  },

  // Get garantia by ID
  getById: async (id: number): Promise<Garantia> => {
    const response = await api.get(`/api/garantias/${id}`);
    return response.data;
  },

  // Create new garantia
  create: async (garantia: Garantia): Promise<Garantia> => {
    try {
      console.log('garantiaApi.create -> POST /api/garantias', garantia);
      const response = await api.post('/api/garantias', garantia);
      console.log('garantiaApi.create response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('garantiaApi.create error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  // Update garantia
  update: async (id: number, garantia: Garantia): Promise<Garantia> => {
    try {
      console.log('garantiaApi.update -> PUT /api/garantias/' + id, garantia);
      const response = await api.put(`/api/garantias/${id}`, garantia);
      console.log('garantiaApi.update response:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('garantiaApi.update error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  // Delete garantia
  delete: async (id: number): Promise<void> => {
    try {
      console.log('garantiaApi.delete -> DELETE /api/garantias/' + id);
      await api.delete(`/api/garantias/${id}`);
    } catch (error: any) {
      console.error('garantiaApi.delete error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  // Lecturas adicionales
  getByProducto: async (productoId: number): Promise<Garantia[]> => {
    const response = await api.get(`/api/garantias/producto/${productoId}`);
    return response.data;
  },

  getByVenta: async (ventaId: number): Promise<Garantia[]> => {
    const response = await api.get(`/api/garantias/venta/${ventaId}`);
    return response.data;
  },

  getByEstado: async (estado: string): Promise<Garantia[]> => {
    const response = await api.get(`/api/garantias/estado/${estado}`);
    return response.data;
  },

  getByNumeroSerie: async (numeroSerie: string): Promise<Garantia> => {
    const response = await api.get(`/api/garantias/numero-serie/${numeroSerie}`);
    return response.data;
  },

  getVencidas: async (): Promise<Garantia[]> => {
    const response = await api.get('/api/garantias/vencidas');
    return response.data;
  },

  getPorVencer: async (fechaLimite: string): Promise<Garantia[]> => {
    const response = await api.get('/api/garantias/por-vencer', { params: { fechaLimite } });
    return response.data;
  },
};
