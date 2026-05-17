import axios from '../config';
import type { BonoVentasTabla, BonoVentasTablaCreateDTO } from '../../types';

const BASE_URL = '/api/bonos-ventas';

export const bonoVentasApi = {
  getAll: async (): Promise<BonoVentasTabla[]> => {
    const { data } = await axios.get<BonoVentasTabla[]>(BASE_URL);
    return data;
  },

  getByCategoria: async (categoriaId: number): Promise<BonoVentasTabla[]> => {
    const { data } = await axios.get<BonoVentasTabla[]>(`${BASE_URL}/categoria/${categoriaId}`);
    return data;
  },

  getById: async (id: number): Promise<BonoVentasTabla> => {
    const { data } = await axios.get<BonoVentasTabla>(`${BASE_URL}/${id}`);
    return data;
  },

  create: async (dto: BonoVentasTablaCreateDTO): Promise<BonoVentasTabla> => {
    const { data } = await axios.post<BonoVentasTabla>(BASE_URL, dto);
    return data;
  },

  update: async (id: number, dto: Partial<BonoVentasTabla>): Promise<BonoVentasTabla> => {
    const { data } = await axios.put<BonoVentasTabla>(`${BASE_URL}/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },
};

export default bonoVentasApi;
