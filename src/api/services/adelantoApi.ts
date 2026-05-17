import axios from '../config';
import type { Adelanto, AdelantoCreateDTO } from '../../types';

const BASE_URL = '/api/adelantos';

export const adelantoApi = {
  getAll: async (): Promise<Adelanto[]> => {
    const { data } = await axios.get<Adelanto[]>(BASE_URL);
    return data;
  },

  getById: async (id: number): Promise<Adelanto> => {
    const { data } = await axios.get<Adelanto>(`${BASE_URL}/${id}`);
    return data;
  },

  getByEmpleadoPeriodo: async (empleadoId: number, periodo: string): Promise<Adelanto[]> => {
    const { data } = await axios.get<Adelanto[]>(`${BASE_URL}/empleado/${empleadoId}/periodo/${periodo}`);
    return data;
  },

  getTotalByEmpleadoPeriodo: async (empleadoId: number, periodo: string): Promise<number> => {
    const { data } = await axios.get<number | string>(`${BASE_URL}/empleado/${empleadoId}/periodo/${periodo}/total`);
    return Number(data) || 0;
  },

  create: async (dto: AdelantoCreateDTO): Promise<Adelanto> => {
    const { data } = await axios.post<Adelanto>(BASE_URL, dto);
    return data;
  },

  update: async (id: number, dto: Partial<Adelanto>): Promise<Adelanto> => {
    const { data } = await axios.put<Adelanto>(`${BASE_URL}/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },
};

export default adelantoApi;
