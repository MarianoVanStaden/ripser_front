import api from '../config';
import type { Vehiculo } from '../../types';

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
  create: async (vehiculo: Vehiculo): Promise<Vehiculo> => {
    const response = await api.post('/vehiculos', vehiculo);
    return response.data;
  },

  // Update vehiculo
  update: async (id: number, vehiculo: Vehiculo): Promise<Vehiculo> => {
    const response = await api.put(`/vehiculos/${id}`, vehiculo);
    return response.data;
  },

  // Delete vehiculo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/vehiculos/${id}`);
  },

  // Get vehiculo by patente
  getByPatente: async (patente: string): Promise<Vehiculo> => {
    const response = await api.get(`/vehiculos/patente/${patente}`);
    return response.data;
  },

  // Get vehiculos by estado
  getByEstado: async (estado: string): Promise<Vehiculo[]> => {
    const response = await api.get(`/vehiculos/estado/${estado}`);
    return response.data;
  },

  // Get vehiculos by marca
  getByMarca: async (marca: string): Promise<Vehiculo[]> => {
    const response = await api.get(`/vehiculos/marca/${marca}`);
    return response.data;
  },

  // Get vehiculos disponibles
  getDisponibles: async (): Promise<Vehiculo[]> => {
    const response = await api.get('/vehiculos/disponibles');
    return response.data;
  },

  // Cambiar estado del vehiculo
  cambiarEstado: async (id: number, nuevoEstado: string): Promise<Vehiculo> => {
    const response = await api.patch(`/vehiculos/${id}/estado`, null, {
      params: { nuevoEstado }
    });
    return response.data;
  }
};
