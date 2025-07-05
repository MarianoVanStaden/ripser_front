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

  // Get garantias by producto
  getByProducto: async (productoId: number): Promise<Garantia[]> => {
    const response = await api.get(`/api/garantias/producto/${productoId}`);
    return response.data;
  },

  // Get garantias by venta
  getByVenta: async (ventaId: number): Promise<Garantia[]> => {
    const response = await api.get(`/api/garantias/venta/${ventaId}`);
    return response.data;
  },

  // Get garantias by estado
  getByEstado: async (estado: string): Promise<Garantia[]> => {
    const response = await api.get(`/api/garantias/estado/${estado}`);
    return response.data;
  },

  // Get garantia by numero de serie
  getByNumeroSerie: async (numeroSerie: string): Promise<Garantia> => {
    const response = await api.get(`/api/garantias/numero-serie/${numeroSerie}`);
    return response.data;
  },

  // Get garantias vencidas
  getVencidas: async (): Promise<Garantia[]> => {
    const response = await api.get('/api/garantias/vencidas');
    return response.data;
  },

  // Get garantias por vencer (fechaLimite as yyyy-MM-dd)
  getPorVencer: async (fechaLimite: string): Promise<Garantia[]> => {
    const response = await api.get('/api/garantias/por-vencer', { params: { fechaLimite } });
    return response.data;
  },

  // Create new garantia
  create: async (garantia: Garantia): Promise<Garantia> => {
    const response = await api.post('/api/garantias', garantia);
    return response.data;
  },

  // Update garantia
  update: async (id: number, garantia: Garantia): Promise<Garantia> => {
    const response = await api.put(`/api/garantias/${id}`, garantia);
    return response.data;
  },

  // Delete garantia
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/garantias/${id}`);
  }
};
