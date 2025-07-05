import api from '../config';
import type { RegistroAsistencia } from '../../types';

export const registroAsistenciaApi = {
  // Get all registros
  getAll: async (): Promise<RegistroAsistencia[]> => {
    const response = await api.get('/api/registro-asistencia');
    return response.data;
  },

  // Get registro by ID
  getById: async (id: number): Promise<RegistroAsistencia> => {
    const response = await api.get(`/api/registro-asistencia/${id}`);
    return response.data;
  },

  // Get registros by empleado
  getByEmpleado: async (empleadoId: number): Promise<RegistroAsistencia[]> => {
    const response = await api.get(`/api/registro-asistencia/empleado/${empleadoId}`);
    return response.data;
  },

  // Get registros by periodo
  getByPeriodo: async (fechaInicio: string, fechaFin: string): Promise<RegistroAsistencia[]> => {
    const response = await api.get('/api/registro-asistencia/periodo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Get registros by empleado and periodo
  getByEmpleadoAndPeriodo: async (empleadoId: number, fechaInicio: string, fechaFin: string): Promise<RegistroAsistencia[]> => {
    const response = await api.get(`/api/registro-asistencia/empleado/${empleadoId}/periodo`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Get total horas trabajadas
  getTotalHorasTrabajadas: async (empleadoId: number, fechaInicio: string, fechaFin: string): Promise<number> => {
    const response = await api.get(`/api/registro-asistencia/empleado/${empleadoId}/total-horas`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Create new registro
  create: async (registro: RegistroAsistencia): Promise<RegistroAsistencia> => {
    const response = await api.post('/api/registro-asistencia', registro);
    return response.data;
  },

  // Update registro
  update: async (id: number, registro: RegistroAsistencia): Promise<RegistroAsistencia> => {
    const response = await api.put(`/api/registro-asistencia/${id}`, registro);
    return response.data;
  },

  // Delete registro
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/registro-asistencia/${id}`);
  }
};
