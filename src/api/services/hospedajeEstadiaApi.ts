import api from '../config';
import type { HospedajeEstadiaDTO, CreateHospedajeEstadiaDTO } from '../../types';

const BASE = '/api/transporte/hospedajes';

export interface FiltrosHospedajeParams {
  nombre?: string;
  provincia?: string;
  localidad?: string;
  calificacion?: number;
  cochera?: boolean;
  desayuno?: boolean;
  pileta?: boolean;
}

export const hospedajeEstadiaApi = {
  getAll: async (params?: FiltrosHospedajeParams): Promise<HospedajeEstadiaDTO[]> => {
    const response = await api.get<HospedajeEstadiaDTO[]>(BASE, { params });
    return response.data;
  },

  getProvincias: async (): Promise<string[]> => {
    const response = await api.get<string[]>(`${BASE}/provincias`);
    return response.data;
  },

  getLocalidades: async (provincia: string): Promise<string[]> => {
    const response = await api.get<string[]>(`${BASE}/localidades`, { params: { provincia } });
    return response.data;
  },

  getById: async (id: number): Promise<HospedajeEstadiaDTO> => {
    const response = await api.get<HospedajeEstadiaDTO>(`${BASE}/${id}`);
    return response.data;
  },

  create: async (data: CreateHospedajeEstadiaDTO): Promise<HospedajeEstadiaDTO> => {
    const response = await api.post<HospedajeEstadiaDTO>(BASE, data);
    return response.data;
  },

  update: async (id: number, data: CreateHospedajeEstadiaDTO): Promise<HospedajeEstadiaDTO> => {
    const response = await api.put<HospedajeEstadiaDTO>(`${BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
