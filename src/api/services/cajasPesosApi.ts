import api from '../config';
import type { PageResponse } from '../../types/pagination.types';
import type {
  CajaPesos,
  CreateCajaPesosDTO,
  MovimientoCajaPesos,
  DepositoExtraccionCajaPesosDTO,
} from '../../types';

const BASE = '/api/cajas-pesos';

export const cajasPesosApi = {
  getAll: async (): Promise<CajaPesos[]> => {
    const res = await api.get<CajaPesos[]>(BASE);
    return res.data;
  },

  getById: async (id: number): Promise<CajaPesos> => {
    const res = await api.get<CajaPesos>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (dto: CreateCajaPesosDTO): Promise<CajaPesos> => {
    const res = await api.post<CajaPesos>(BASE, dto);
    return res.data;
  },

  update: async (id: number, dto: CreateCajaPesosDTO): Promise<CajaPesos> => {
    const res = await api.put<CajaPesos>(`${BASE}/${id}`, dto);
    return res.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  depositar: async (
    id: number,
    dto: DepositoExtraccionCajaPesosDTO
  ): Promise<MovimientoCajaPesos> => {
    const res = await api.post<MovimientoCajaPesos>(`${BASE}/${id}/deposito`, dto);
    return res.data;
  },

  extraer: async (
    id: number,
    dto: DepositoExtraccionCajaPesosDTO
  ): Promise<MovimientoCajaPesos> => {
    const res = await api.post<MovimientoCajaPesos>(`${BASE}/${id}/extraccion`, dto);
    return res.data;
  },

  getMovimientos: async (
    id: number,
    params: { page: number; size: number; sort: string }
  ): Promise<PageResponse<MovimientoCajaPesos>> => {
    const res = await api.get<PageResponse<MovimientoCajaPesos>>(
      `${BASE}/${id}/movimientos`,
      { params }
    );
    return res.data;
  },
};
