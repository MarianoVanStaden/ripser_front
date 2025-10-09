import api from '../config';
import type { Vehiculo, VehiculoCreateDTO } from '../../types';

export const vehiculoApi = {
  // Get all vehiculos
  getAll: async (): Promise<Vehiculo[]> => {
    const response = await api.get('/vehiculos');
    return response.data;
  },

  // Get vehiculo by ID
  getById: async (id: number): Promise<Vehiculo> => {
    const response = await api.get(`/vehiculos/${id}`);
    return response.data;
  },

  // Create new vehiculo
  create: async (vehiculo: VehiculoCreateDTO): Promise<Vehiculo> => {
    const response = await api.post('/vehiculos', vehiculo);
    return response.data;
  },

  // Update vehiculo
  update: async (id: number, vehiculo: VehiculoCreateDTO): Promise<Vehiculo> => {
    const response = await api.put(`/vehiculos/${id}`, vehiculo);
    return response.data;
  },

  // Delete vehiculo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
  },

  // Get vehiculos by estado
  getByEstado: async (estado: string): Promise<Vehiculo[]> => {
    const response = await api.get(`/vehiculos/estado/${estado}`);
    return response.data;
  }
};
