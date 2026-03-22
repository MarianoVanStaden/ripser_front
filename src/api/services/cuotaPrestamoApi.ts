import api from '../config';
import type { CuotaPrestamoDTO, RegistrarPagoCuotaDTO, RevertirPagoCuotaRequest } from '../../types/prestamo.types';

const BASE_PATH = '/api/cuotas-prestamo';

export const cuotaPrestamoApi = {
  getByPrestamo: async (prestamoId: number): Promise<CuotaPrestamoDTO[]> => {
    const response = await api.get<CuotaPrestamoDTO[]>(`${BASE_PATH}/prestamo/${prestamoId}`);
    return response.data;
  },

  registrarPago: async (data: RegistrarPagoCuotaDTO): Promise<CuotaPrestamoDTO> => {
    const response = await api.post<CuotaPrestamoDTO>(`${BASE_PATH}/pago`, data);
    return response.data;
  },

  revertirPago: async (data: RevertirPagoCuotaRequest): Promise<CuotaPrestamoDTO> => {
    const response = await api.post<CuotaPrestamoDTO>(`${BASE_PATH}/revertir-pago`, data);
    return response.data;
  },

  getProximasVencer: async (dias: number = 7): Promise<CuotaPrestamoDTO[]> => {
    const response = await api.get<CuotaPrestamoDTO[]>(`${BASE_PATH}/proximas-vencer`, {
      params: { dias },
    });
    return response.data;
  },

  getVencidas: async (): Promise<CuotaPrestamoDTO[]> => {
    const response = await api.get<CuotaPrestamoDTO[]>(`${BASE_PATH}/vencidas`);
    return response.data;
  },
};
