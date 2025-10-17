import axios from '../config';
import type { Sueldo } from '../../types';

const BASE_URL = '/api/sueldos';

export const sueldoApi = {
  // Get all sueldos
  getAll: async (): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(BASE_URL);
    return response.data;
  },

  // Get sueldo by ID
  getById: async (id: number): Promise<Sueldo> => {
    const response = await axios.get<Sueldo>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Get sueldos by empleado
  getByEmpleado: async (empleadoId: number): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/empleado/${empleadoId}`);
    return response.data;
  },

  // Get sueldos by periodo
  getByPeriodo: async (periodo: string): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/periodo/${periodo}`);
    return response.data;
  },

  // Get sueldos by periodo range
  getByPeriodoRange: async (periodoInicio: string, periodoFin: string): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/periodo-range`, {
      params: { periodoInicio, periodoFin }
    });
    return response.data;
  },

  // Get sueldos pendientes de pago
  getPendientesPago: async (): Promise<Sueldo[]> => {
    const response = await axios.get<Sueldo[]>(`${BASE_URL}/pendientes-pago`);
    return response.data;
  },

  // Create new sueldo
  create: async (sueldo: Omit<Sueldo, 'id'>): Promise<Sueldo> => {
    const response = await axios.post<Sueldo>(BASE_URL, sueldo);
    return response.data;
  },

  // Update existing sueldo
  update: async (id: number, sueldo: Partial<Sueldo>): Promise<Sueldo> => {
    const response = await axios.put<Sueldo>(`${BASE_URL}/${id}`, sueldo);
    return response.data;
  },

  // Delete sueldo
  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  }
};

export default sueldoApi;
