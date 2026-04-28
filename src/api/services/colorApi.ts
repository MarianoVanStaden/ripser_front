import api from '../config';

export interface Color {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface CreateColorRequest {
  nombre: string;
}

export interface UpdateColorRequest {
  nombre?: string;
  activo?: boolean;
}

/**
 * CRUD over the parameterizable colors catalog (`/api/colores`).
 * Mirrors the backend's ColorController and replaces the old hard-coded
 * COLORES_EQUIPO union type.
 */
export const colorApi = {
  list: async (activo?: boolean): Promise<Color[]> => {
    const response = await api.get<Color[]>('/api/colores', {
      params: activo !== undefined ? { activo } : undefined,
    });
    return response.data;
  },

  getById: async (id: number): Promise<Color> => {
    const response = await api.get<Color>(`/api/colores/${id}`);
    return response.data;
  },

  create: async (payload: CreateColorRequest): Promise<Color> => {
    const response = await api.post<Color>('/api/colores', payload);
    return response.data;
  },

  update: async (id: number, payload: UpdateColorRequest): Promise<Color> => {
    const response = await api.patch<Color>(`/api/colores/${id}`, payload);
    return response.data;
  },
};
