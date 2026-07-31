import api from '../config';
import type { NivelFidelizacion, NivelFidelizacionRequest } from '../../types';

const BASE_PATH = '/api/niveles-fidelizacion';

export const nivelFidelizacionApi = {
  // Config de niveles de la empresa (ordenada por nivel asc)
  list: async (): Promise<NivelFidelizacion[]> => {
    const response = await api.get<NivelFidelizacion[]>(BASE_PATH);
    return response.data;
  },

  create: async (dto: NivelFidelizacionRequest): Promise<NivelFidelizacion> => {
    const response = await api.post<NivelFidelizacion>(BASE_PATH, dto);
    return response.data;
  },

  update: async (id: number, dto: NivelFidelizacionRequest): Promise<NivelFidelizacion> => {
    const response = await api.put<NivelFidelizacion>(`${BASE_PATH}/${id}`, dto);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },
};
