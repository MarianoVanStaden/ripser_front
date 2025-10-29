import api from '../config';
import type { Venta, VentaSearchDTO } from '../../types';

export const ventaApi = {
  // Get all ventas
  getAll: async (): Promise<Venta[]> => {
    const response = await api.get('/api/ventas');
    return response.data;
  },

  // Get venta by ID
  getById: async (id: number): Promise<Venta> => {
    const response = await api.get(`/api/ventas/${id}`);
    return response.data;
  },

  // Get ventas by cliente
  getByCliente: async (clienteId: number): Promise<Venta[]> => {
    const response = await api.get(`/api/ventas/cliente/${clienteId}`);
    return response.data;
  },

  // Get ventas by estado
  getByEstado: async (estado: string): Promise<Venta[]> => {
    const response = await api.get(`/api/ventas/estado/${estado}`);
    return response.data;
  },

  // Get total ventas for a period
  getTotalPeriodo: async (fechaInicio: string, fechaFin: string): Promise<string> => {
    const response = await api.get('/api/ventas/total-periodo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Create new venta
  create: async (venta: Venta): Promise<Venta> => {
    const response = await api.post('/api/ventas', venta);
    return response.data;
  },

  // Update venta
  update: async (id: number, venta: Venta): Promise<Venta> => {
    const response = await api.put(`/api/ventas/${id}`, venta);
    return response.data;
  },
  search: async (query: string): Promise<VentaSearchDTO[]> => {
        try {
            const response = await api.get(`/api/ventas/search`, {
                params: { q: query }
            });
            // La API debe devolver un array de VentaSearchDTO
            return response.data || []; 
        } catch (error) {
            console.error("Error buscando ventas:", error);
            // Devolver un array vacío en caso de error para evitar que el Autocomplete falle
            return [];
        }
    },
};
