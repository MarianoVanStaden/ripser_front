import api from '../config';
import type { Vehiculo, VehiculoCreateDTO } from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const vehiculoApi = {
  // Get all vehiculos
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Vehiculo>> => {
    const response = await api.get<PageResponse<Vehiculo>>('/api/vehiculos', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get vehiculo by ID
  getById: async (id: number): Promise<Vehiculo> => {
    const response = await api.get(`/api/vehiculos/${id}`);
    return response.data;
  },

  // Create new vehiculo
  create: async (vehiculo: VehiculoCreateDTO): Promise<Vehiculo> => {
    const response = await api.post('/api/vehiculos', vehiculo);
    return response.data;
  },

  // Update vehiculo
  update: async (id: number, vehiculo: VehiculoCreateDTO): Promise<Vehiculo> => {
    const response = await api.put(`/api/vehiculos/${id}`, vehiculo);
    return response.data;
  },

  // Delete vehiculo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/vehiculos/${id}`);
  },

  // Get vehiculos by estado
  getByEstado: async (estado: string): Promise<Vehiculo[]> => {
    const response = await api.get(`/api/vehiculos/estado/${estado}`);
    return response.data;
  }
};
