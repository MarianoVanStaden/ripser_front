import api from '../config';
import type {
  RefinanciacionRequest,
  RefinanciacionPreviewResponse,
  RefinanciacionResponse,
} from '../../types/refinanciacion.types';

const BASE = '/api/refinanciaciones';

export const refinanciacionApi = {
  preview: async (data: RefinanciacionRequest): Promise<RefinanciacionPreviewResponse> => {
    const response = await api.post<RefinanciacionPreviewResponse>(`${BASE}/preview`, data);
    return response.data;
  },

  confirmar: async (data: RefinanciacionRequest): Promise<RefinanciacionResponse> => {
    const response = await api.post<RefinanciacionResponse>(BASE, data);
    return response.data;
  },

  getByPrestamo: async (prestamoId: number): Promise<RefinanciacionResponse[]> => {
    const response = await api.get<RefinanciacionResponse[]>(`${BASE}/prestamo/${prestamoId}`);
    return response.data;
  },
};
