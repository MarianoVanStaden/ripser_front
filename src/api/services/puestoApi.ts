import api from '../config';
import type { Puesto } from '../../types';

export const puestoApi = {
  // Get all puestos
  getAll: async (): Promise<Puesto[]> => {
    const response = await api.get('/api/puestos');
    return response.data;
  },

  // Get puesto by ID
  getById: async (id: number): Promise<Puesto> => {
    const response = await api.get(`/api/puestos/${id}`);
    return response.data;
  },

  // Get puesto by nombre
  getByNombre: async (nombre: string): Promise<Puesto> => {
    const response = await api.get(`/api/puestos/nombre/${nombre}`);
    return response.data;
  },

  // Get puestos by departamento
  getByDepartamento: async (departamento: string): Promise<Puesto[]> => {
    const response = await api.get(`/api/puestos/departamento/${departamento}`);
    return response.data;
  },

  // Create new puesto
  create: async (puesto: Puesto): Promise<Puesto> => {
    const response = await api.post('/api/puestos', puesto);
    return response.data;
  },

  // Update puesto
  update: async (id: number, puesto: Puesto): Promise<Puesto> => {
    const response = await api.put(`/api/puestos/${id}`, puesto);
    return response.data;
  },

  // Delete puesto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/puestos/${id}`);
  }
};
