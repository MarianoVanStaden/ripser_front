import api from '../config';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';
import type {
  ReasignacionRequest,
  ReasignacionPreviewResponse,
  ReasignacionResultado,
  HistorialReasignacionLeadDTO,
  HistorialFilterParams,
} from '../../types/leadReasignacion.types';

const BASE_PATH = '/api/leads/reasignacion';

export const leadReasignacionApi = {
  /** Vista previa: cuenta + muestra + advertencias. No muta nada. */
  preview: async (req: ReasignacionRequest): Promise<ReasignacionPreviewResponse> => {
    const response = await api.post<ReasignacionPreviewResponse>(`${BASE_PATH}/preview`, req);
    return response.data;
  },

  /** Ejecuta la reasignación. */
  ejecutar: async (req: ReasignacionRequest): Promise<ReasignacionResultado> => {
    const response = await api.post<ReasignacionResultado>(BASE_PATH, req);
    return response.data;
  },

  /** Revierte un lote completo (genera un lote inverso auditado). */
  revertirLote: async (loteId: string): Promise<ReasignacionResultado> => {
    const response = await api.post<ReasignacionResultado>(
      `${BASE_PATH}/historial/${encodeURIComponent(loteId)}/revertir`,
    );
    return response.data;
  },

  /** Historial auditable, paginado y filtrable. */
  getHistorial: async (
    pagination: PaginationParams = {},
    filters: HistorialFilterParams = {},
  ): Promise<PageResponse<HistorialReasignacionLeadDTO>> => {
    const response = await api.get<PageResponse<HistorialReasignacionLeadDTO>>(`${BASE_PATH}/historial`, {
      params: { ...filters, ...pagination },
    });
    return response.data;
  },
};
