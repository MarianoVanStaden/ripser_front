import api from '../config';
import type { TareaServicio } from '../../types';

export const tareaServicioApi = {
  // Get all tareas
  getAll: async (): Promise<TareaServicio[]> => {
    const response = await api.get('/tareas-servicio');
    return response.data;
  },

  // Get tarea by ID
  getById: async (id: number): Promise<TareaServicio> => {
    const response = await api.get(`/tareas-servicio/${id}`);
    return response.data;
  },

  // Create new tarea
  create: async (tarea: TareaServicio): Promise<TareaServicio> => {
    const response = await api.post('/tareas-servicio', tarea);
    return response.data;
  },

  // Update tarea
  update: async (id: number, tarea: TareaServicio): Promise<TareaServicio> => {
    const response = await api.put(`/tareas-servicio/${id}`, tarea);
    return response.data;
  },

  // Delete tarea
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tareas-servicio/${id}`);
  },

  // Get tareas by orden de servicio
  getByOrden: async (ordenId: number): Promise<TareaServicio[]> => {
    const response = await api.get(`/tareas-servicio/orden/${ordenId}`);
    return response.data;
  },

  // Get tareas by empleado
  getByEmpleado: async (empleadoId: number): Promise<TareaServicio[]> => {
    const response = await api.get(`/tareas-servicio/empleado/${empleadoId}`);
    return response.data;
  },

  // Get tareas by estado
  getByEstado: async (estado: string): Promise<TareaServicio[]> => {
    const response = await api.get(`/tareas-servicio/estado/${estado}`);
    return response.data;
  },

  // Get tareas en proceso by empleado
  getEnProcesoByEmpleado: async (empleadoId: number): Promise<TareaServicio[]> => {
    const response = await api.get(`/tareas-servicio/empleado/${empleadoId}/en-proceso`);
    return response.data;
  },

  // Iniciar tarea
  iniciar: async (id: number): Promise<TareaServicio> => {
    const response = await api.patch(`/tareas-servicio/${id}/iniciar`);
    return response.data;
  },

  // Completar tarea
  completar: async (id: number, horasReales?: number): Promise<TareaServicio> => {
    const response = await api.patch(`/tareas-servicio/${id}/completar`, null, {
      params: horasReales !== undefined ? { horasReales } : undefined
    });
    return response.data;
  }
};
