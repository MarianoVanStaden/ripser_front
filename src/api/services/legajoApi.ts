import axios from '../config';
import type { Legajo } from '../../types';

const BASE_URL = '/api/legajos';

export const legajoApi = {
  // Get all legajos
  getAll: async (): Promise<Legajo[]> => {
    const response = await axios.get<Legajo[]>(BASE_URL);
    return response.data;
  },

  // Get legajo by ID
  getById: async (id: number): Promise<Legajo> => {
    const response = await axios.get<Legajo>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Get legajo by empleado
  getByEmpleado: async (empleadoId: number): Promise<Legajo> => {
    const response = await axios.get<Legajo>(`${BASE_URL}/empleado/${empleadoId}`);
    return response.data;
  },

  // Get legajo by numero
  getByNumero: async (numeroLegajo: string): Promise<Legajo> => {
    const response = await axios.get<Legajo>(`${BASE_URL}/numero/${numeroLegajo}`);
    return response.data;
  },

  // Get legajos activos
  getActivos: async (): Promise<Legajo[]> => {
    const response = await axios.get<Legajo[]>(`${BASE_URL}/activos`);
    return response.data;
  },

  // Get legajos inactivos
  getInactivos: async (): Promise<Legajo[]> => {
    const response = await axios.get<Legajo[]>(`${BASE_URL}/inactivos`);
    return response.data;
  },

  // Create new legajo
  create: async (legajo: Omit<Legajo, 'id'>): Promise<Legajo> => {
    const response = await axios.post<Legajo>(BASE_URL, legajo);
    return response.data;
  },

  // Update existing legajo
  update: async (id: number, legajo: Partial<Legajo>): Promise<Legajo> => {
    const response = await axios.put<Legajo>(`${BASE_URL}/${id}`, legajo);
    return response.data;
  },

  // Delete legajo
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  }
};

export default legajoApi;
