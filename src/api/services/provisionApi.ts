import api from '../config';
import type {
  ProvisionMensualDTO,
  ResumenProvisionAnualDTO,
  GuardarProvisionDTO,
  RegistrarPagoProvisionDTO,
  TipoProvision,
} from '../../types';

const BASE = '/api/provisiones';

export const provisionApi = {
  getByMes: async (anio: number, mes: number): Promise<ProvisionMensualDTO[]> => {
    const res = await api.get<ProvisionMensualDTO[]>(`${BASE}/${anio}/mes/${mes}`);
    return res.data;
  },

  guardar: async (
    tipo: TipoProvision,
    anio: number,
    mes: number,
    dto: GuardarProvisionDTO
  ): Promise<ProvisionMensualDTO> => {
    const res = await api.post<ProvisionMensualDTO>(`${BASE}/${tipo}/${anio}/mes/${mes}`, dto);
    return res.data;
  },

  registrarPago: async (
    tipo: TipoProvision,
    anio: number,
    mes: number,
    dto: RegistrarPagoProvisionDTO
  ): Promise<ProvisionMensualDTO> => {
    const res = await api.put<ProvisionMensualDTO>(`${BASE}/${tipo}/${anio}/mes/${mes}/pago`, dto);
    return res.data;
  },

  getResumenAnual: async (tipo: TipoProvision, anio: number): Promise<ResumenProvisionAnualDTO> => {
    const res = await api.get<ResumenProvisionAnualDTO>(`${BASE}/${tipo}/${anio}/resumen`);
    return res.data;
  },
};
