import api from '../config';
import type { OrdenServicio } from '../../types';

export const ordenServicioApi = {
  // Get all ordenes de servicio
  getAll: async (): Promise<OrdenServicio[]> => {
    const response = await api.get('/api/ordenes-servicio');
    // Backend returns paginated response: { content: [], totalPages, totalElements, ... }
    // Extract the content array from the paginated response
    return response.data.content || response.data;
  },

  // Get orden by ID
  getById: async (id: number): Promise<OrdenServicio> => {
    const response = await api.get(`/api/ordenes-servicio/${id}`);
    return response.data;
  },

  // Create new orden de servicio
  create: async (orden: OrdenServicio): Promise<OrdenServicio> => {
    const response = await api.post('/api/ordenes-servicio', orden);
    return response.data;
  },

  // Update orden de servicio
  update: async (id: number, orden: OrdenServicio): Promise<OrdenServicio> => {
    const response = await api.put(`/api/ordenes-servicio/${id}`, orden);
    return response.data;
  },

  // Delete orden de servicio
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ordenes-servicio/${id}`);
  },

  // Get ordenes by cliente
  getByCliente: async (clienteId: number): Promise<OrdenServicio[]> => {
    const response = await api.get(`/api/ordenes-servicio/cliente/${clienteId}`);
    return response.data;
  },

  // Get ordenes by estado
  getByEstado: async (estado: string): Promise<OrdenServicio[]> => {
    const response = await api.get(`/api/ordenes-servicio/estado/${estado}`);
    return response.data;
  },

  // Get ordenes by responsable
  getByResponsable: async (responsableId: number): Promise<OrdenServicio[]> => {
    const response = await api.get(`/api/ordenes-servicio/responsable/${responsableId}`);
    return response.data;
  },

  // Get ordenes retrasadas
  getRetrasadas: async (): Promise<OrdenServicio[]> => {
    const response = await api.get('/api/ordenes-servicio/retrasadas');
    return response.data;
  },

  // Get ordenes by fecha
  getByFecha: async (fechaInicio: string, fechaFin: string): Promise<OrdenServicio[]> => {
    const response = await api.get('/api/ordenes-servicio/por-fecha', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Cambiar estado de orden
  cambiarEstado: async (id: number, nuevoEstado: string): Promise<OrdenServicio> => {
    const response = await api.patch(`/api/ordenes-servicio/${id}/estado`, null, {
      params: { nuevoEstado }
    });
    return response.data;
  }
};
