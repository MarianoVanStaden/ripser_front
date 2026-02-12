import api from '../config';
import type { SeguimientoPrestamoDTO, CreateSeguimientoPrestamoDTO } from '../../types/prestamo.types';

const BASE_PATH = '/api/seguimientos-prestamo';

export const seguimientoPrestamoApi = {
  getByPrestamo: async (prestamoId: number): Promise<SeguimientoPrestamoDTO[]> => {
    const response = await api.get<SeguimientoPrestamoDTO[]>(`${BASE_PATH}/prestamo/${prestamoId}`);
    return response.data;
  },

  create: async (data: CreateSeguimientoPrestamoDTO): Promise<SeguimientoPrestamoDTO> => {
    const response = await api.post<SeguimientoPrestamoDTO>(BASE_PATH, data);
    return response.data;
  },
};
