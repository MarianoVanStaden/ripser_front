import axios from '../config';
import type { BonoProduccionTabla, BonoProduccionTablaCreateDTO } from '../../types';

const BASE_URL = '/api/bonos-produccion';

export const bonoProduccionApi = {
  getAll: async (): Promise<BonoProduccionTabla[]> => {
    const { data } = await axios.get<BonoProduccionTabla[]>(BASE_URL);
    return data;
  },

  getByCategoria: async (categoriaId: number): Promise<BonoProduccionTabla[]> => {
    const { data } = await axios.get<BonoProduccionTabla[]>(`${BASE_URL}/categoria/${categoriaId}`);
    return data;
  },

  getById: async (id: number): Promise<BonoProduccionTabla> => {
    const { data } = await axios.get<BonoProduccionTabla>(`${BASE_URL}/${id}`);
    return data;
  },

  create: async (dto: BonoProduccionTablaCreateDTO): Promise<BonoProduccionTabla> => {
    const { data } = await axios.post<BonoProduccionTabla>(BASE_URL, dto);
    return data;
  },

  update: async (id: number, dto: Partial<BonoProduccionTabla>): Promise<BonoProduccionTabla> => {
    const { data } = await axios.put<BonoProduccionTabla>(`${BASE_URL}/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },
};

export default bonoProduccionApi;
