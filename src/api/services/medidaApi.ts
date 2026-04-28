import api from '../config';

export interface Medida {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CreateMedidaRequest {
  nombre: string;
}

export interface UpdateMedidaRequest {
  nombre?: string;
  activo?: boolean;
}

/**
 * CRUD over the parameterizable measures catalog (`/api/medidas`).
 * Mirrors the backend's MedidaController and replaces the old hard-coded
 * MEDIDAS_EQUIPO union type.
 */
export const medidaApi = {
  list: async (activo?: boolean): Promise<Medida[]> => {
    const response = await api.get<Medida[]>('/api/medidas', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Medida> => {
    const response = await api.get<Medida>(`/api/medidas/${id}`);
    return response.data;
  },

  create: async (payload: CreateMedidaRequest): Promise<Medida> => {
    const response = await api.post<Medida>('/api/medidas', payload);
    return response.data;
  },

  update: async (id: number, payload: UpdateMedidaRequest): Promise<Medida> => {
    const response = await api.patch<Medida>(`/api/medidas/${id}`, payload);
    return response.data;
  },
};
