import api from '../config';
import type { PageResponse } from '../../types/pagination.types';
import type {
  LiquidacionTarjeta,
  CreateLiquidacionTarjetaDTO,
} from '../../types/liquidacionTarjeta.types';

const BASE = '/api/admin/liquidaciones-tarjeta';

export const liquidacionesTarjetaApi = {
  liquidar: async (dto: CreateLiquidacionTarjetaDTO): Promise<LiquidacionTarjeta> => {
    const res = await api.post<LiquidacionTarjeta>(BASE, dto);
    return res.data;
  },

  getById: async (id: number): Promise<LiquidacionTarjeta> => {
    const res = await api.get<LiquidacionTarjeta>(`${BASE}/${id}`);
    return res.data;
  },

  search: async (params: {
    cajaOrigenId?: number;
    desde?: string;
    hasta?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<LiquidacionTarjeta>> => {
    const res = await api.get<PageResponse<LiquidacionTarjeta>>(BASE, { params });
    return res.data;
  },
};
