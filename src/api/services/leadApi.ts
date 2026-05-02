import api from '../config';
import type {
  LeadDTO,
  LeadListItemDTO,
  ConversionLeadRequest,
  ConversionLeadResponse,
  EstadoLeadEnum,
  CanalEnum,
  InteraccionLeadDTO,
  RecordatorioLeadDTO,
  PrioridadLeadEnum,
  ProvinciaEnum,
  TelefonoCheckResponse
} from '../../types/lead.types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

const BASE_PATH = '/api/leads';

export interface LeadFilterParams {
  sucursalId?: number | null;
  /** Filtro multi-valor — el backend hace `IN (:estados)`. */
  estados?: EstadoLeadEnum[];
  /** Filtro multi-valor — el backend hace `IN (:canales)`. */
  canales?: CanalEnum[];
  /** Filtro multi-valor — el backend hace `IN (:provincias)`. */
  provincias?: ProvinciaEnum[];
  /** Búsqueda case-insensitive sobre nombre y teléfono (LIKE %x%). */
  busqueda?: string;
  prioridad?: PrioridadLeadEnum;
  usuarioId?: number;
  empresaId?: number;
  /** Si true, el backend reemplaza usuarioId con el del usuario actual. */
  soloMisLeads?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  clienteOrigenId?: number;
}

// Spring bindea `?estados=A,B` directamente a List<EstadoLeadEnum>. Joineamos
// explícitamente porque la serialización por defecto de axios v1 emite
// `?estados[]=A&estados[]=B` (con brackets), que Spring no parsea como esperamos.
const ARRAY_KEYS = ['estados', 'canales', 'provincias'] as const;

const buildParams = (
  pagination: PaginationParams,
  filters: LeadFilterParams | undefined
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...filters, ...pagination };
  for (const k of ARRAY_KEYS) {
    const v = merged[k];
    if (Array.isArray(v)) {
      if (v.length === 0) delete merged[k];
      else merged[k] = v.join(',');
    }
  }
  return merged;
};

export const leadApi = {
  // Listar leads con filtros opcionales (paginated). El backend devuelve
  // LeadListItemDTO (proyección reducida con próximo recordatorio embebido).
  // Para el detalle completo, usar getById.
  getAll: async (pagination: PaginationParams = {}, params?: LeadFilterParams): Promise<PageResponse<LeadListItemDTO>> => {
    const response = await api.get<PageResponse<LeadListItemDTO>>(BASE_PATH, {
      params: buildParams(pagination, params),
    });
    return response.data;
  },

  // Actualización rápida de prioridad (PATCH). Antes había que mandar el LeadDTO
  // completo via PUT; ahora la lista solo recibe el DTO chico, así que este
  // endpoint permite cambiar prioridad sin cargar el lead completo.
  updatePrioridad: async (id: number, prioridad: PrioridadLeadEnum): Promise<LeadDTO> => {
    const response = await api.patch<LeadDTO>(`${BASE_PATH}/${id}/prioridad`, null, {
      params: { prioridad },
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

  // Chequeo en vivo de duplicados de teléfono. Soporta AbortSignal para cancelar
  // requests stale cuando el usuario tabbing rápido entre campos.
  checkTelefono: async (
    telefono: string,
    excludeId?: number,
    signal?: AbortSignal,
  ): Promise<TelefonoCheckResponse> => {
    const response = await api.get<TelefonoCheckResponse>(`${BASE_PATH}/check-telefono`, {
      params: { telefono, excludeId },
      signal,
    });
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
