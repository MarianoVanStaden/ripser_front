import api from '../config';
import type {
  ReconciliacionStockDTO,
  ReconciliacionDetalladaDTO,
  ReconciliacionDiferenciasDTO,
  ReconciliacionAprobacionDTO,
  AjusteStockDepositoDTO,
  IniciarReconciliacionDTO,
  AjusteStockDepositoRequestDTO,
  AprobacionReconciliacionDTO,
  CancelarReconciliacionDTO,
} from '../../types';

const BASE_URL = '/api/stock/reconciliacion';

export const reconciliacionApi = {
  /**
   * Iniciar una nueva reconciliación mensual
   */
  iniciar: async (data: IniciarReconciliacionDTO): Promise<ReconciliacionStockDTO> => {
    const response = await api.post<ReconciliacionStockDTO>(`${BASE_URL}/iniciar`, data);
    return response.data;
  },

  /**
   * Registrar ajuste de depósito (recuento físico)
   */
  ajustarDeposito: async (
    reconciliacionId: number,
    data: AjusteStockDepositoRequestDTO
  ): Promise<AjusteStockDepositoDTO> => {
    const response = await api.post<AjusteStockDepositoDTO>(
      `${BASE_URL}/${reconciliacionId}/ajustar-deposito`,
      data
    );
    return response.data;
  },

  /**
   * Calcular y obtener diferencias
   */
  getDiferencias: async (reconciliacionId: number): Promise<ReconciliacionDiferenciasDTO> => {
    const response = await api.get<ReconciliacionDiferenciasDTO>(
      `${BASE_URL}/${reconciliacionId}/diferencias`
    );
    return response.data;
  },

  /**
   * Finalizar revisión - cambia estado a PENDIENTE_APROBACION
   */
  finalizarRevision: async (
    reconciliacionId: number,
    observaciones?: string
  ): Promise<ReconciliacionDiferenciasDTO> => {
    const response = await api.post<ReconciliacionDiferenciasDTO>(
      `${BASE_URL}/${reconciliacionId}/finalizar-revision`,
      observaciones ? { observaciones } : {}
    );
    return response.data;
  },

  /**
   * Aprobar reconciliación y aplicar ajustes
   * Se puede aprobar desde EN_PROCESO o PENDIENTE_APROBACION
   */
  aprobar: async (
    reconciliacionId: number,
    data: AprobacionReconciliacionDTO
  ): Promise<ReconciliacionAprobacionDTO> => {
    const response = await api.post<ReconciliacionAprobacionDTO>(
      `${BASE_URL}/${reconciliacionId}/aprobar`,
      data
    );
    return response.data;
  },

  /**
   * Cancelar reconciliación
   */
  cancelar: async (reconciliacionId: number, data: CancelarReconciliacionDTO): Promise<void> => {
    await api.post(`${BASE_URL}/${reconciliacionId}/cancelar`, data);
  },

  /**
   * Obtener reconciliación activa
   */
  getActiva: async (): Promise<ReconciliacionDetalladaDTO | null> => {
    try {
      const response = await api.get<ReconciliacionDetalladaDTO>(`${BASE_URL}/activa`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Verificar si existe reconciliación activa
   */
  existeActiva: async (): Promise<boolean> => {
    const response = await api.get<boolean>(`${BASE_URL}/existe-activa`);
    return response.data;
  },

  /**
   * Obtener detalle completo de una reconciliación
   */
  getById: async (id: number): Promise<ReconciliacionDetalladaDTO> => {
    const response = await api.get<ReconciliacionDetalladaDTO>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Obtener ajustes de una reconciliación
   */
  getAjustes: async (reconciliacionId: number): Promise<AjusteStockDepositoDTO[]> => {
    const response = await api.get<AjusteStockDepositoDTO[]>(`${BASE_URL}/${reconciliacionId}/ajustes`);
    return response.data;
  },

  /**
   * Listar todas las reconciliaciones (paginado)
   */
  getAll: async (page = 0, size = 10): Promise<{
    content: ReconciliacionStockDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
  }> => {
    const response = await api.get(`${BASE_URL}/`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Obtener historial de reconciliaciones
   */
  getHistorial: async (page = 0, size = 10): Promise<{
    content: ReconciliacionStockDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
  }> => {
    const response = await api.get(`${BASE_URL}/historial`, {
      params: { page, size },
    });
    return response.data;
  },
};

export default reconciliacionApi;
