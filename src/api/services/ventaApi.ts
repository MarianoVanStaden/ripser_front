import api from '../config';
import type { Venta } from '../../types';

export const ventaApi = {
  // Get all ventas
  getAll: async (): Promise<Venta[]> => {
    const response = await api.get('/ventas');
    return response.data;
  },

  // Get venta by ID
  getById: async (id: number): Promise<Venta> => {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
  },

  // Get ventas by cliente
  getByCliente: async (clienteId: number): Promise<Venta[]> => {
    const response = await api.get(`/ventas/cliente/${clienteId}`);
    return response.data;
  },

  // Get ventas by estado
  getByEstado: async (estado: string): Promise<Venta[]> => {
    const response = await api.get(`/ventas/estado/${estado}`);
    return response.data;
  },

  // Get total ventas for a period
  getTotalPeriodo: async (fechaInicio: string, fechaFin: string): Promise<string> => {
    const response = await api.get('/ventas/total-periodo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Create new venta
  create: async (venta: Venta): Promise<Venta> => {
    const response = await api.post('/ventas', venta);
    return response.data;
  },

  // Update venta
  update: async (id: number, venta: Venta): Promise<Venta> => {
    const response = await api.put(`/ventas/${id}`, venta);
    return response.data;
  }
};
