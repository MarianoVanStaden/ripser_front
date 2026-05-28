import api from '../config';
import type {
  PagoInformadoDTO,
  CrearPagoInformadoDTO,
  ConfirmarPagoInformadoDTO,
  RechazarPagoInformadoDTO,
} from '../../types/prestamo.types';
import type { RecaudacionCobranzaItem } from './adminFlujoCajaApi';

const BASE_PATH = '/api/pagos-informados';

export const pagoInformadoApi = {
  /** Cobranzas informa que cobró una cuota. No impacta caja. */
  informar: async (data: CrearPagoInformadoDTO): Promise<PagoInformadoDTO> => {
    const response = await api.post<PagoInformadoDTO>(BASE_PATH, data);
    return response.data;
  },

  /** Bandeja admin: informes pendientes de confirmación. */
  listarPendientes: async (): Promise<PagoInformadoDTO[]> => {
    const response = await api.get<PagoInformadoDTO[]>(`${BASE_PATH}/pendientes`);
    return response.data;
  },

  /** Historial de informes para una cuota. */
  historialPorCuota: async (cuotaId: number): Promise<PagoInformadoDTO[]> => {
    const response = await api.get<PagoInformadoDTO[]>(`${BASE_PATH}/cuota/${cuotaId}`);
    return response.data;
  },

  /** Admin confirma → dispara el pago real (caja + CC + cheque + cascada). */
  confirmar: async (id: number, data: ConfirmarPagoInformadoDTO): Promise<PagoInformadoDTO> => {
    const response = await api.post<PagoInformadoDTO>(`${BASE_PATH}/${id}/confirmar`, data);
    return response.data;
  },

  /** Admin rechaza → restaura el estado previo de la cuota. */
  rechazar: async (id: number, data: RechazarPagoInformadoDTO): Promise<PagoInformadoDTO> => {
    const response = await api.post<PagoInformadoDTO>(`${BASE_PATH}/${id}/rechazar`, data);
    return response.data;
  },

  /** Agregado por agente: para inciso del flujo de caja. */
  recaudacionPorCobranzas: async (
    desde?: string,
    hasta?: string,
  ): Promise<RecaudacionCobranzaItem[]> => {
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    const qs = params.toString();
    const url = `${BASE_PATH}/recaudacion-cobranzas${qs ? `?${qs}` : ''}`;
    const response = await api.get<RecaudacionCobranzaItem[]>(url);
    return response.data;
  },
};
