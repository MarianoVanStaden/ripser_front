import api from '../config';
import type { RecordatorioCuotaDTO } from '../../types/prestamo.types';

const BASE_PATH = '/api/recordatorios-cuota';

export const recordatorioCuotaApi = {
  getByCuota: async (cuotaId: number): Promise<RecordatorioCuotaDTO[]> => {
    const response = await api.get<RecordatorioCuotaDTO[]>(`${BASE_PATH}/cuota/${cuotaId}`);
    return response.data;
  },

  getById: async (id: number): Promise<RecordatorioCuotaDTO> => {
    const response = await api.get<RecordatorioCuotaDTO>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: RecordatorioCuotaDTO): Promise<RecordatorioCuotaDTO> => {
    const response = await api.post<RecordatorioCuotaDTO>(BASE_PATH, data);
    return response.data;
  },

  update: async (id: number, data: RecordatorioCuotaDTO): Promise<RecordatorioCuotaDTO> => {
    const response = await api.put<RecordatorioCuotaDTO>(`${BASE_PATH}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  marcarEnviado: async (id: number): Promise<RecordatorioCuotaDTO> => {
    const response = await api.patch<RecordatorioCuotaDTO>(`${BASE_PATH}/${id}/enviado`);
    return response.data;
  },

  marcarPagado: async (id: number): Promise<RecordatorioCuotaDTO> => {
    const response = await api.patch<RecordatorioCuotaDTO>(`${BASE_PATH}/${id}/pagado`);
    return response.data;
  },

  getPendientes: async (): Promise<RecordatorioCuotaDTO[]> => {
    const response = await api.get<RecordatorioCuotaDTO[]>(`${BASE_PATH}/pendientes`);
    return response.data;
  },
};
