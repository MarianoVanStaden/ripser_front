import api from '../config';
import type {
  RegistroKmEmpleadoDTO,
  CreateRegistroKmEmpleadoDTO,
  ResumenKmEmpleadoDTO,
} from '../../types';

const BASE = '/api/transporte/km-empleado';

export const registroKmEmpleadoApi = {
  getByAnio: async (anio?: number): Promise<RegistroKmEmpleadoDTO[]> => {
    const response = await api.get<RegistroKmEmpleadoDTO[]>(BASE, { params: anio ? { anio } : {} });
    return response.data;
  },

  getResumen: async (anio?: number): Promise<ResumenKmEmpleadoDTO[]> => {
    const response = await api.get<ResumenKmEmpleadoDTO[]>(`${BASE}/resumen`, {
      params: anio ? { anio } : {},
    });
    return response.data;
  },

  getAnios: async (): Promise<number[]> => {
    const response = await api.get<number[]>(`${BASE}/anios`);
    return response.data;
  },

  getByEmpleado: async (empleadoId: number, anio?: number): Promise<RegistroKmEmpleadoDTO[]> => {
    const response = await api.get<RegistroKmEmpleadoDTO[]>(`${BASE}/empleado/${empleadoId}`, {
      params: anio ? { anio } : {},
    });
    return response.data;
  },

  upsert: async (data: CreateRegistroKmEmpleadoDTO): Promise<RegistroKmEmpleadoDTO> => {
    const response = await api.post<RegistroKmEmpleadoDTO>(BASE, data);
    return response.data;
  },

  update: async (id: number, data: CreateRegistroKmEmpleadoDTO): Promise<RegistroKmEmpleadoDTO> => {
    const response = await api.put<RegistroKmEmpleadoDTO>(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
