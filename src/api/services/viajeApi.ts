import api from '../config';
import type { Viaje } from '../../types';

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
  create: async (viaje: Viaje): Promise<Viaje> => {
    const response = await api.post('/viajes', viaje);
    return response.data;
  },

  // Update viaje
  update: async (id: number, viaje: Viaje): Promise<Viaje> => {
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

  // Get viajes by estado
  getByEstado: async (estado: string): Promise<Viaje[]> => {
    const response = await api.get(`/viajes/estado/${estado}`);
    return response.data;
  },

  // Get viajes by fecha
  getByFecha: async (fechaInicio: string, fechaFin: string): Promise<Viaje[]> => {
    const response = await api.get('/viajes/por-fecha', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Get viajes programados
  getProgramados: async (): Promise<Viaje[]> => {
    const response = await api.get('/viajes/programados');
    return response.data;
  },

  // Iniciar viaje
  iniciar: async (id: number): Promise<Viaje> => {
    const response = await api.patch(`/viajes/${id}/iniciar`);
    return response.data;
  },

  // Completar viaje
  completar: async (id: number): Promise<Viaje> => {
    const response = await api.patch(`/viajes/${id}/completar`);
    return response.data;
  },

  // Cancelar viaje
  cancelar: async (id: number, motivo?: string): Promise<Viaje> => {
    const response = await api.patch(`/viajes/${id}/cancelar`, null, {
      params: motivo ? { motivo } : undefined
    });
    return response.data;
  }
};
