import axios from '../config';
import type { CategoriaSalarial, CategoriaSalarialCreateDTO } from '../../types';

const BASE_URL = '/api/categorias-salariales';

export const categoriaSalarialApi = {
  getAll: async (): Promise<CategoriaSalarial[]> => {
    const { data } = await axios.get<CategoriaSalarial[]>(BASE_URL);
    return data;
  },

  getById: async (id: number): Promise<CategoriaSalarial> => {
    const { data } = await axios.get<CategoriaSalarial>(`${BASE_URL}/${id}`);
    return data;
  },

  create: async (dto: CategoriaSalarialCreateDTO): Promise<CategoriaSalarial> => {
    const { data } = await axios.post<CategoriaSalarial>(BASE_URL, dto);
    return data;
  },

  update: async (id: number, dto: Partial<CategoriaSalarial>): Promise<CategoriaSalarial> => {
    const { data } = await axios.put<CategoriaSalarial>(`${BASE_URL}/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },
};

export default categoriaSalarialApi;
