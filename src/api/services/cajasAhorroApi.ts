import api from '../config';
import type { PageResponse } from '../../types/pagination.types';
import type {
  CajaAhorroDolares,
  CreateCajaAhorroDolaresDTO,
  MovimientoCajaAhorro,
  DepositoExtraCajaDTO,
  DisponibleConversionDTO,
} from '../../types';

const BASE = '/api/cajas-ahorro';

export const cajasAhorroApi = {
  getAll: async (): Promise<CajaAhorroDolares[]> => {
    const res = await api.get<CajaAhorroDolares[]>(BASE);
    return res.data;
  },

  getById: async (id: number): Promise<CajaAhorroDolares> => {
    const res = await api.get<CajaAhorroDolares>(`${BASE}/${id}`);
    return res.data;
  },

  create: async (dto: CreateCajaAhorroDolaresDTO): Promise<CajaAhorroDolares> => {
    const res = await api.post<CajaAhorroDolares>(BASE, dto);
    return res.data;
  },

  update: async (id: number, dto: CreateCajaAhorroDolaresDTO): Promise<CajaAhorroDolares> => {
    const res = await api.put<CajaAhorroDolares>(`${BASE}/${id}`, dto);
    return res.data;
  },

  deactivate: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  depositar: async (id: number, dto: DepositoExtraCajaDTO): Promise<MovimientoCajaAhorro> => {
    const res = await api.post<MovimientoCajaAhorro>(`${BASE}/${id}/deposito`, dto);
    return res.data;
  },

  extraer: async (id: number, dto: DepositoExtraCajaDTO): Promise<MovimientoCajaAhorro> => {
    const res = await api.post<MovimientoCajaAhorro>(`${BASE}/${id}/extraccion`, dto);
    return res.data;
  },

  getMovimientos: async (
    id: number,
    params: { page: number; size: number; sort: string }
  ): Promise<PageResponse<MovimientoCajaAhorro>> => {
    const res = await api.get<PageResponse<MovimientoCajaAhorro>>(
      `${BASE}/${id}/movimientos`,
      { params }
    );
    return res.data;
  },

  getAmortizacionesDisponibles: async (
    anio: number,
    mes: number
  ): Promise<DisponibleConversionDTO[]> => {
    const res = await api.get<DisponibleConversionDTO[]>(
      `${BASE}/amortizaciones-disponibles`,
      { params: { anio, mes } }
    );
    return res.data;
  },
};
