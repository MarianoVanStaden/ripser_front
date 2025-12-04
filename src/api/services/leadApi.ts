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

const BASE_PATH = '/api/leads';

export const leadApi = {
  // Listar todos los leads con filtros opcionales
  getAll: async (params?: {
    sucursalId?: number | null;
    estado?: EstadoLeadEnum;
    canal?: CanalEnum;
  }): Promise<LeadDTO[]> => {
    const queryParams = new URLSearchParams();

    if (params?.sucursalId !== undefined && params.sucursalId !== null) {
      queryParams.append('sucursalId', params.sucursalId.toString());
    }
    if (params?.estado) {
      queryParams.append('estado', params.estado);
    }
    if (params?.canal) {
      queryParams.append('canal', params.canal);
    }

    const url = `${BASE_PATH}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get<LeadDTO[]>(url);
    return response.data;
  },

  // Obtener lead por ID
  getById: async (id: number): Promise<LeadDTO> => {
    const response = await api.get<LeadDTO>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  // Buscar leads por estado
  getByEstado: async (estado: EstadoLeadEnum): Promise<LeadDTO[]> => {
    const response = await api.get<LeadDTO[]>(`${BASE_PATH}/estado/${estado}`);
    return response.data;
  },

  // Buscar leads por prioridad
  getByPrioridad: async (prioridad: PrioridadLeadEnum): Promise<LeadDTO[]> => {
    const response = await api.get<LeadDTO[]>(`${BASE_PATH}/prioridad/${prioridad}`);
    return response.data;
  },

  // Obtener leads próximos a seguimiento
  getProximosSeguimiento: async (): Promise<LeadDTO[]> => {
    const response = await api.get<LeadDTO[]>(`${BASE_PATH}/proximos-seguimiento`);
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
