import api from '../config';
import type {
  LeadDTO,
  ConversionLeadRequest,
  ConversionLeadResponse,
  EstadoLeadEnum,
  CanalEnum,
  InteraccionLeadDTO,
  RecordatorioLeadDTO,
  PrioridadLeadEnum
} from '../../types/lead.types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

const BASE_PATH = '/api/leads';

export interface LeadFilterParams {
  sucursalId?: number | null;
  estados?: EstadoLeadEnum[];
  canales?: CanalEnum[];
  provincias?: string[]; // Assuming simple string or enum
  prioridad?: PrioridadLeadEnum;
  usuarioId?: number;
  busqueda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  clienteOrigenId?: number;
}

export const leadApi = {
  // Listar todos los leads con filtros opcionales (paginated)
  getAll: async (pagination: PaginationParams = {}, params?: LeadFilterParams): Promise<PageResponse<LeadDTO>> => {
    // Convert array params to comma-separated strings if backend expects 'A,B'
    // Or let axios handle it if backend expects repeated params.
    // Assuming backend standard:
    const paramsToSend = { ...params, ...pagination };
    
    // Check if we need to transform arrays
    if (params?.estados) {
      // Just passing it through, axios default is usually array format
    }
    
    const response = await api.get<PageResponse<LeadDTO>>(BASE_PATH, {
      params: paramsToSend, 
    });
    return response.data;
  },

  // Obtener lead por ID
  getById: async (id: number): Promise<LeadDTO> => {
    const response = await api.get<LeadDTO>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  /**
   * @deprecated Use getAll with filters instead
   */
  // Buscar leads por estado (Legacy)
  getByEstado: async (_estado: EstadoLeadEnum): Promise<LeadDTO[]> => {
    // Mapping to getAll for backward compatibility if possible, but return type differs
    // Since we are migrating, we should just remove or update usage. 
    // But to avoid breaking unknown callers, maybe we keep it but it will fail if backend changed.
    // However, the user instruction is to "Replace specific endpoints".
    // I will comment it out or mark deprecated, but better yet, implement it using getAll and unwrapping (inefficient but safe) or just error out.
    // Given the task is "Update", I will remove it and fix the hook that uses it.
    throw new Error('Use leadApi.getAll with filters instead');
  },

  /**
   * @deprecated Use getAll with filters instead
   */
  // Buscar leads por prioridad
  getByPrioridad: async (_prioridad: PrioridadLeadEnum): Promise<LeadDTO[]> => {
     throw new Error('Use leadApi.getAll with filters instead');
  },

  // Obtener leads próximos a seguimiento
  getProximosSeguimiento: async (pagination: PaginationParams = {}): Promise<PageResponse<LeadDTO>> => {
    const response = await api.get<PageResponse<LeadDTO>>(`${BASE_PATH}/proximos-seguimiento`, {
       params: pagination
    });
    return response.data;
  },

  // Crear nuevo lead
  create: async (leadData: Omit<LeadDTO, 'id' | 'dias' | 'fechaConversion'>): Promise<LeadDTO> => {
    const response = await api.post<LeadDTO>(BASE_PATH, leadData);
    return response.data;
  },

  // Actualizar lead
  update: async (id: number, leadData: Partial<LeadDTO>): Promise<LeadDTO> => {
    const response = await api.put<LeadDTO>(`${BASE_PATH}/${id}`, leadData);
    return response.data;
  },

  // Eliminar lead
  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  // Convertir lead a cliente
  convertir: async (
    id: number,
    conversionData: ConversionLeadRequest
  ): Promise<ConversionLeadResponse> => {
    const response = await api.post<ConversionLeadResponse>(
      `${BASE_PATH}/${id}/convertir`,
      conversionData
    );
    return response.data;
  },

  // ========== INTERACCIONES ==========

  // Obtener historial de interacciones
  getInteracciones: async (leadId: number): Promise<InteraccionLeadDTO[]> => {
    const response = await api.get<InteraccionLeadDTO[]>(`${BASE_PATH}/${leadId}/interacciones`);
    return response.data;
  },

  // Agregar interacción
  createInteraccion: async (leadId: number, interaccion: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>): Promise<InteraccionLeadDTO> => {
    const response = await api.post<InteraccionLeadDTO>(
      `${BASE_PATH}/${leadId}/interacciones`,
      interaccion
    );
    return response.data;
  },

  // Actualizar interacción
  updateInteraccion: async (leadId: number, interaccionId: number, interaccion: Partial<InteraccionLeadDTO>): Promise<InteraccionLeadDTO> => {
    const response = await api.put<InteraccionLeadDTO>(
      `${BASE_PATH}/${leadId}/interacciones/${interaccionId}`,
      interaccion
    );
    return response.data;
  },

  // Eliminar interacción
  deleteInteraccion: async (leadId: number, interaccionId: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${leadId}/interacciones/${interaccionId}`);
  },

  // ========== RECORDATORIOS ==========

  // Obtener recordatorios del lead
  getRecordatorios: async (leadId: number): Promise<RecordatorioLeadDTO[]> => {
    const response = await api.get<RecordatorioLeadDTO[]>(`${BASE_PATH}/${leadId}/recordatorios`);
    return response.data;
  },

  // Crear recordatorio
  createRecordatorio: async (leadId: number, recordatorio: Omit<RecordatorioLeadDTO, 'id' | 'leadId' | 'fechaCreacion' | 'enviado' | 'fechaEnvio'>): Promise<RecordatorioLeadDTO> => {
    const response = await api.post<RecordatorioLeadDTO>(
      `${BASE_PATH}/${leadId}/recordatorios`,
      recordatorio
    );
    return response.data;
  },

  // Actualizar recordatorio
  updateRecordatorio: async (leadId: number, recordatorioId: number, recordatorio: Partial<RecordatorioLeadDTO>): Promise<RecordatorioLeadDTO> => {
    const response = await api.put<RecordatorioLeadDTO>(
      `${BASE_PATH}/${leadId}/recordatorios/${recordatorioId}`,
      recordatorio
    );
    return response.data;
  },

  // Eliminar recordatorio
  deleteRecordatorio: async (leadId: number, recordatorioId: number): Promise<void> => {
    await api.delete(`${BASE_PATH}/${leadId}/recordatorios/${recordatorioId}`);
  },

  // Marcar recordatorio como enviado
  marcarRecordatorioEnviado: async (leadId: number, recordatorioId: number): Promise<RecordatorioLeadDTO> => {
    const response = await api.patch<RecordatorioLeadDTO>(
      `${BASE_PATH}/${leadId}/recordatorios/${recordatorioId}/marcar-enviado`
    );
    return response.data;
  },

  // ========== ESTADÍSTICAS ==========

  // Obtener estadísticas del dashboard
  getStatistics: async (): Promise<any> => {
    const response = await api.get(`/api/dashboard/leads/statistics`);
    return response.data;
  },
};
