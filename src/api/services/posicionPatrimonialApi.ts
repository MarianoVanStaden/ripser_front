import api from '../config';
import type { PosicionPatrimonialDTO } from '../../types';

const BASE = '/api/admin/patrimonio';

export const posicionPatrimonialApi = {
  getPosicion: async (): Promise<PosicionPatrimonialDTO> => {
    const res = await api.get<PosicionPatrimonialDTO>(`${BASE}/posicion`);
    return res.data;
  },
};
