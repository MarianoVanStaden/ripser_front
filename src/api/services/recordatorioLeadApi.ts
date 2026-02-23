import api from '../config';
import type {
  RecordatorioLeadDTO,
  TipoRecordatorioEnum,
  PrioridadLeadEnum,
  EstadoLeadEnum,
} from '../../types/lead.types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export interface LeadResumenDTO {
  id: number;
  nombre: string;
  apellido?: string;
  telefono: string;
  email?: string;
  estadoLead: EstadoLeadEnum;
  prioridad?: PrioridadLeadEnum;
  score?: number;
  usuarioAsignadoId?: number;
}

export interface RecordatorioConLeadDTO extends RecordatorioLeadDTO {
  lead?: LeadResumenDTO;
}

export interface RecordatorioGlobalFilterParams {
  enviado?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: number;
  prioridad?: PrioridadLeadEnum;
  tipo?: TipoRecordatorioEnum;
  sucursalId?: number;
}

export interface ConteosRecordatoriosDTO {
  totalPendientes: number;
  vencidos: number;
  hoy: number;
}

const BASE_PATH = '/api/recordatorios';

export const recordatorioLeadApi = {
  getAll: async (
    pagination: PaginationParams = {},
    params?: RecordatorioGlobalFilterParams
  ): Promise<PageResponse<RecordatorioConLeadDTO>> => {
    const response = await api.get<PageResponse<RecordatorioConLeadDTO>>(BASE_PATH, {
      params: { ...params, ...pagination },
    });
    return response.data;
  },

  getConteos: async (params?: {
    sucursalId?: number;
    usuarioId?: number;
  }): Promise<ConteosRecordatoriosDTO> => {
    const response = await api.get<ConteosRecordatoriosDTO>(`${BASE_PATH}/conteos`, {
      params,
    });
    return response.data;
  },

  marcarEnviado: async (recordatorioId: number): Promise<RecordatorioConLeadDTO> => {
    const response = await api.patch<RecordatorioConLeadDTO>(
      `${BASE_PATH}/${recordatorioId}/marcar-enviado`
    );
    return response.data;
  },

  update: async (
    recordatorioId: number,
    data: Partial<RecordatorioLeadDTO>
  ): Promise<RecordatorioConLeadDTO> => {
    const response = await api.put<RecordatorioConLeadDTO>(
      `${BASE_PATH}/${recordatorioId}`,
      data
    );
    return response.data;
  },
};
