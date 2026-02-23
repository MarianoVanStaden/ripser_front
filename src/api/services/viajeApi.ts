import api from '../config';
import type { Viaje, ViajeCreateDTO } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const viajeApi = {
  // Get all viajes
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Viaje>> => {
    const response = await api.get<PageResponse<Viaje>>('/api/viajes', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get viaje by ID
  getById: async (id: number): Promise<Viaje> => {
    const response = await api.get(`/api/viajes/${id}`);
    return response.data;
  },

  // Create new viaje
  create: async (viaje: ViajeCreateDTO): Promise<Viaje> => {
    const response = await api.post('/api/viajes', viaje);
    return response.data;
  },

  // Update viaje
  update: async (id: number, viaje: ViajeCreateDTO): Promise<Viaje> => {
    const response = await api.put(`/api/viajes/${id}`, viaje);
    return response.data;
  },

  // Delete viaje
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/viajes/${id}`);
  },

  // Get viajes by conductor
  getByConductor: async (conductorId: number): Promise<Viaje[]> => {
    const response = await api.get(`/api/viajes/conductor/${conductorId}`);
    return response.data;
  },

  // Get viajes by vehiculo
  getByVehiculo: async (vehiculoId: number): Promise<Viaje[]> => {
    const response = await api.get(`/api/viajes/vehiculo/${vehiculoId}`);
    return response.data;
  },

  // Change viaje estado
  changeEstado: async (id: number, estado: string): Promise<Viaje> => {
    const response = await api.patch(`/api/viajes/${id}/estado`, null, {
      params: { estado }
    });
    return response.data;
  }
};
