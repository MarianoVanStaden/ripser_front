import api from '../config';
import type { Capacitacion } from '../../types';

export const capacitacionApi = {
  // Obtener todas las capacitaciones
  getAll: async (): Promise<Capacitacion[]> => {
    const response = await api.get('/api/capacitaciones');
    return response.data;
  },

  // Obtener capacitacion por ID
  getById: async (id: number): Promise<Capacitacion> => {
    const response = await api.get(`/api/capacitaciones/${id}`);
    return response.data;
  },

  // Obtener capacitaciones por empleado
  getByEmpleado: async (empleadoId: number): Promise<Capacitacion[]> => {
    const response = await api.get(`/api/capacitaciones/empleado/${empleadoId}`);
    return response.data;
  },

  // Obtener capacitaciones por institucion
  getByInstitucion: async (institucion: string): Promise<Capacitacion[]> => {
    const response = await api.get(`/api/capacitaciones/institucion/${institucion}`);
    return response.data;
  },

  // Obtener capacitaciones por periodo
  getByPeriodo: async (fechaInicio: string, fechaFin: string): Promise<Capacitacion[]> => {
    const response = await api.get(`/api/capacitaciones/periodo`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Crear capacitacion
  create: async (capacitacion: Partial<Capacitacion>): Promise<Capacitacion> => {
    const response = await api.post('/api/capacitaciones', capacitacion);
    return response.data;
  },

  // Actualizar capacitacion
  update: async (id: number, capacitacion: Partial<Capacitacion>): Promise<Capacitacion> => {
    const response = await api.put(`/api/capacitaciones/${id}`, capacitacion);
    return response.data;
  },

  // Eliminar capacitacion
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/capacitaciones/${id}`);
  }
};
