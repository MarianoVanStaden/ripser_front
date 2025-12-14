import api from '../config';
import type { Factura } from '../../types';

// Interfaz de parámetros de filtro
export interface FacturaFilterParams {
  sucursalId?: number | null;
  estado?: string;
}

export const facturaApi = {
  // Get all facturas with optional filters
  getAll: async (params?: FacturaFilterParams): Promise<Factura[]> => {
    const response = await api.get('/api/facturas', { params });
    return response.data;
  },

  // Get factura by ID
  getById: async (id: number): Promise<Factura> => {
    const response = await api.get(`/api/facturas/${id}`);
    return response.data;
  },

  // Get facturas by cliente
  getByCliente: async (clienteId: number): Promise<Factura[]> => {
    const response = await api.get(`/api/facturas/cliente/${clienteId}`);
    return response.data;
  },

  // Get facturas by estado
  getByEstado: async (estado: string): Promise<Factura[]> => {
    const response = await api.get(`/api/facturas/estado/${estado}`);
    return response.data;
  },

  // Get facturas vencidas
  getVencidas: async (): Promise<Factura[]> => {
    const response = await api.get('/api/facturas/vencidas');
    return response.data;
  },

  // Create new factura
  create: async (factura: Factura): Promise<Factura> => {
    const response = await api.post('/api/facturas', factura);
    return response.data;
  },

  // Update factura
  update: async (id: number, factura: Factura): Promise<Factura> => {
    const response = await api.put(`/api/facturas/${id}`, factura);
    return response.data;
  }
};
