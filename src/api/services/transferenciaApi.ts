import api from '../config';
import type {
  TransferenciaDepositoDTO,
  TransferenciaCreateDTO,
  ConfirmarRecepcionDTO,
  EstadoTransferencia,
} from '../../types';

export const transferenciaApi = {
  // Obtener todas las transferencias
  getAll: async (params?: {
    empresaId?: number;
    estado?: EstadoTransferencia;
    depositoOrigenId?: number;
    depositoDestinoId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<TransferenciaDepositoDTO[]> => {
    const response = await api.get<TransferenciaDepositoDTO[]>('/transferencias', {
      params,
    });
    return response.data;
  },

  // Obtener transferencia por ID
  getById: async (id: number): Promise<TransferenciaDepositoDTO> => {
    const response = await api.get<TransferenciaDepositoDTO>(`/transferencias/${id}`);
    return response.data;
  },

  // Crear nueva transferencia
  create: async (data: TransferenciaCreateDTO): Promise<TransferenciaDepositoDTO> => {
    const response = await api.post<TransferenciaDepositoDTO>('/transferencias', data);
    return response.data;
  },

  // Confirmar envío (cambiar estado a EN_TRANSITO)
  confirmarEnvio: async (id: number): Promise<void> => {
    await api.post(`/transferencias/${id}/enviar`);
  },

  // Confirmar recepción (cambiar estado a RECIBIDA)
  confirmarRecepcion: async (data: ConfirmarRecepcionDTO): Promise<void> => {
    await api.post(`/transferencias/${data.transferenciaId}/recibir`, data);
  },

  // Cancelar transferencia
  cancelar: async (id: number, motivo: string): Promise<void> => {
    await api.post(`/transferencias/${id}/cancelar`, { motivo });
  },

  // Obtener transferencias pendientes de recepción
  getPendientes: async (depositoId?: number): Promise<TransferenciaDepositoDTO[]> => {
    const response = await api.get<TransferenciaDepositoDTO[]>('/transferencias', {
      params: {
        estado: 'EN_TRANSITO',
        depositoDestinoId: depositoId,
      },
    });
    return response.data;
  },

  // Obtener transferencias por depósito
  getByDeposito: async (
    depositoId: number,
    tipo: 'origen' | 'destino' = 'origen'
  ): Promise<TransferenciaDepositoDTO[]> => {
    const params =
      tipo === 'origen'
        ? { depositoOrigenId: depositoId }
        : { depositoDestinoId: depositoId };

    const response = await api.get<TransferenciaDepositoDTO[]>('/transferencias', {
      params,
    });
    return response.data;
  },

  // Obtener historial de transferencias
  getHistorial: async (params: {
    fechaDesde: string;
    fechaHasta: string;
    depositoId?: number;
    estado?: EstadoTransferencia;
  }): Promise<TransferenciaDepositoDTO[]> => {
    const response = await api.get<TransferenciaDepositoDTO[]>('/transferencias', {
      params,
    });
    return response.data;
  },
};

export default transferenciaApi;
