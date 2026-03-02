import api from '../config';
import type {
  BalanceAnualResponseDTO,
  BalanceMensualDTO,
  GuardarBalanceMensualDTO,
} from '../../types';

const BASE = '/api/admin/balance-anual';

export const balanceAnualApi = {
  getAnual: async (anio: number, sucursalId?: number | null): Promise<BalanceAnualResponseDTO> => {
    const params: Record<string, unknown> = { anio };
    if (sucursalId != null) params.sucursalId = sucursalId;
    const res = await api.get<BalanceAnualResponseDTO>(BASE, { params });
    return res.data;
  },

  getMes: async (anio: number, mes: number): Promise<BalanceMensualDTO> => {
    const res = await api.get<BalanceMensualDTO>(`${BASE}/${anio}/mes/${mes}`);
    return res.data;
  },

  calcular: async (anio: number, mes: number, valorDolar: number): Promise<BalanceMensualDTO> => {
    const res = await api.post<BalanceMensualDTO>(
      `${BASE}/${anio}/mes/${mes}/calcular`,
      null,
      { params: { valorDolar } }
    );
    return res.data;
  },

  guardar: async (anio: number, mes: number, dto: GuardarBalanceMensualDTO): Promise<BalanceMensualDTO> => {
    const res = await api.post<BalanceMensualDTO>(`${BASE}/${anio}/mes/${mes}`, dto);
    return res.data;
  },

  cerrar: async (anio: number, mes: number): Promise<void> => {
    await api.patch(`${BASE}/${anio}/mes/${mes}/cerrar`);
  },
};
