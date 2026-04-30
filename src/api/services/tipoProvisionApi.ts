import api from '../config';
import type {
  TipoProvisionDTO,
  CrearTipoProvisionDTO,
  ActualizarTipoProvisionDTO,
} from '../../types';

const BASE = '/api/tipos-provision';

export const tipoProvisionApi = {
  list: async (activo?: boolean): Promise<TipoProvisionDTO[]> => {
    const res = await api.get<TipoProvisionDTO[]>(BASE, {
      params: activo !== undefined ? { activo } : undefined,
    });
    return res.data;
  },

  getById: async (id: number): Promise<TipoProvisionDTO> => {
    const res = await api.get<TipoProvisionDTO>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (payload: CrearTipoProvisionDTO): Promise<TipoProvisionDTO> => {
    const res = await api.post<TipoProvisionDTO>(BASE, payload);
    return res.data;
  },

  update: async (id: number, payload: ActualizarTipoProvisionDTO): Promise<TipoProvisionDTO> => {
    const res = await api.patch<TipoProvisionDTO>(`${BASE}/${id}`, payload);
    return res.data;
  },
};
