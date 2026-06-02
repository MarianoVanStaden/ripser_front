import api from '../config';

/** Mapeo modelo de equipo → sigla para el código de venta (ej. "Heladera Gala" → "HG"). */
export interface ModeloCodigoEquipo {
  id: number;
  empresaId: number;
  modelo: string;
  codigo: string;
  activo: boolean;
}

export interface ModeloCodigoEquipoInput {
  modelo: string;
  codigo: string;
  activo?: boolean;
}

/** CRUD del catálogo modelo→código (`/api/admin/modelo-codigo`). Por empresa. */
export const modeloCodigoEquipoApi = {
  list: async (): Promise<ModeloCodigoEquipo[]> => {
    const res = await api.get<ModeloCodigoEquipo[]>('/api/admin/modelo-codigo');
    return res.data;
  },

  create: async (payload: ModeloCodigoEquipoInput): Promise<ModeloCodigoEquipo> => {
    const res = await api.post<ModeloCodigoEquipo>('/api/admin/modelo-codigo', payload);
    return res.data;
  },

  update: async (id: number, payload: ModeloCodigoEquipoInput): Promise<ModeloCodigoEquipo> => {
    const res = await api.put<ModeloCodigoEquipo>(`/api/admin/modelo-codigo/${id}`, payload);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/api/admin/modelo-codigo/${id}`);
  },
};
