import api from '../config';
import type { Viaje, ViajeCreateDTO } from '../../types';

export const viajeApi = {
  // Get all viajes
  getAll: async (): Promise<Viaje[]> => {
    const response = await api.get('/viajes');
    return response.data;
  },

  // Get viaje by ID
  getById: async (id: number): Promise<Viaje> => {
    const response = await api.get(`/viajes/${id}`);
    return response.data;
  },

  // Create new viaje
  create: async (viaje: ViajeCreateDTO): Promise<Viaje> => {
    const response = await api.post('/viajes', viaje);
    return response.data;
  },

  // Update viaje
  update: async (id: number, viaje: ViajeCreateDTO): Promise<Viaje> => {
    const response = await api.put(`/viajes/${id}`, viaje);
    return response.data;
  },

  // Delete viaje
  delete: async (id: number): Promise<void> => {
    await api.delete(`/viajes/${id}`);
  },

  // Get viajes by conductor
  getByConductor: async (conductorId: number): Promise<Viaje[]> => {
    const response = await api.get(`/viajes/conductor/${conductorId}`);
    return response.data;
  },

  // Get viajes by vehiculo
  getByVehiculo: async (vehiculoId: number): Promise<Viaje[]> => {
    const response = await api.get(`/viajes/vehiculo/${vehiculoId}`);
    return response.data;
  },

  // Change viaje estado
  changeEstado: async (id: number, estado: string): Promise<Viaje> => {
    const response = await api.patch(`/viajes/${id}/estado`, null, {
      params: { estado }
    });
    return response.data;
  }
};
