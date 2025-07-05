import api from '../config';
import type { Licencia } from '../../types';

export const licenciaApi = {
  // Obtener todas las licencias
  getAll: async (): Promise<Licencia[]> => {
    const response = await api.get('/api/licencias');
    return response.data;
  },

  // Obtener licencia por ID
  getById: async (id: number): Promise<Licencia> => {
    const response = await api.get(`/api/licencias/${id}`);
    return response.data;
  },

  // Obtener licencias por empleado
  getByEmpleado: async (empleadoId: number): Promise<Licencia[]> => {
    const response = await api.get(`/api/licencias/empleado/${empleadoId}`);
    return response.data;
  },

  // Obtener licencias por tipo
  getByTipo: async (tipo: string): Promise<Licencia[]> => {
    const response = await api.get(`/api/licencias/tipo/${tipo}`);
    return response.data;
  },

  // Obtener licencias por estado
  getByEstado: async (estado: string): Promise<Licencia[]> => {
    const response = await api.get(`/api/licencias/estado/${estado}`);
    return response.data;
  },

  // Obtener licencias activas por fecha
  getActivas: async (fecha: string): Promise<Licencia[]> => {
    const response = await api.get(`/api/licencias/activas`, {
      params: { fecha }
    });
    return response.data;
  },

  // Crear licencia
  create: async (licencia: Partial<Licencia>): Promise<Licencia> => {
    const response = await api.post('/api/licencias', licencia);
    return response.data;
  },

  // Actualizar licencia
  update: async (id: number, licencia: Partial<Licencia>): Promise<Licencia> => {
    const response = await api.put(`/api/licencias/${id}`, licencia);
    return response.data;
  },

  // Eliminar licencia
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/licencias/${id}`);
  }
};
