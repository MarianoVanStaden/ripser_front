import api from '../config';
import type { Vehiculo } from '../../types';

export const vehiculoApi = {
  // Get all vehiculos
  getAll: async (): Promise<Vehiculo[]> => {
    const response = await api.get('/api/vehiculos');
    return response.data;
  },

  // Get vehiculo by ID
  getById: async (id: number): Promise<Vehiculo> => {
    const response = await api.get(`/api/vehiculos/${id}`);
    return response.data;
  },

  // Create new vehiculo
  create: async (vehiculo: Vehiculo): Promise<Vehiculo> => {
    const response = await api.post('/api/vehiculos', vehiculo);
    return response.data;
  },

  // Update vehiculo
  update: async (id: number, vehiculo: Vehiculo): Promise<Vehiculo> => {
    const response = await api.put(`/api/vehiculos/${id}`, vehiculo);
    return response.data;
  },

  // Delete vehiculo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/vehiculos/${id}`);
  },

  // Get vehiculo by patente
  getByPatente: async (patente: string): Promise<Vehiculo> => {
    const response = await api.get(`/api/vehiculos/patente/${patente}`);
    return response.data;
  },

  // Get vehiculos by estado
  getByEstado: async (estado: string): Promise<Vehiculo[]> => {
    const response = await api.get(`/api/vehiculos/estado/${estado}`);
    return response.data;
  },

  // Get vehiculos by marca
  getByMarca: async (marca: string): Promise<Vehiculo[]> => {
    const response = await api.get(`/api/vehiculos/marca/${marca}`);
    return response.data;
  },

  // Get vehiculos disponibles
  getDisponibles: async (): Promise<Vehiculo[]> => {
    const response = await api.get('/api/vehiculos/disponibles');
    return response.data;
  },

  // Cambiar estado del vehiculo
  cambiarEstado: async (id: number, nuevoEstado: string): Promise<Vehiculo> => {
    const response = await api.patch(`/api/vehiculos/${id}/estado`, null, {
      params: { nuevoEstado }
    });
    return response.data;
  }
};
