import api from '../config';
import type {
  ProvisionMensualDTO,
  ResumenProvisionAnualDTO,
  GuardarProvisionDTO,
  RegistrarPagoProvisionDTO,
} from '../../types';

const BASE = '/api/provisiones';

export const provisionApi = {
  getByMes: async (anio: number, mes: number): Promise<ProvisionMensualDTO[]> => {
    const res = await api.get<ProvisionMensualDTO[]>(`${BASE}/${anio}/mes/${mes}`);
    return res.data;
  },

  guardar: async (
    tipoId: number,
    anio: number,
    mes: number,
    dto: GuardarProvisionDTO
  ): Promise<ProvisionMensualDTO> => {
    const res = await api.post<ProvisionMensualDTO>(
      `${BASE}/tipo/${tipoId}/${anio}/mes/${mes}`,
      dto
    );
    return res.data;
  },

  registrarPago: async (
    tipoId: number,
    anio: number,
    mes: number,
    dto: RegistrarPagoProvisionDTO
  ): Promise<ProvisionMensualDTO> => {
    const res = await api.put<ProvisionMensualDTO>(
      `${BASE}/tipo/${tipoId}/${anio}/mes/${mes}/pago`,
      dto
    );
    return res.data;
  },

  getResumenAnual: async (tipoId: number, anio: number): Promise<ResumenProvisionAnualDTO> => {
    const res = await api.get<ResumenProvisionAnualDTO>(
      `${BASE}/tipo/${tipoId}/${anio}/resumen`
    );
    return res.data;
  },
};
