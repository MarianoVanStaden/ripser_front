import api from '../config';
import type {
  LeadDTO,
  ConversionLeadRequest,
  ConversionLeadResponse,
  EstadoLeadEnum
} from '../../types/lead.types';

const BASE_PATH = '/api/leads';

export const leadApi = {
  // Listar todos los leads
  getAll: async (): Promise<LeadDTO[]> => {
    const response = await api.get<LeadDTO[]>(BASE_PATH);
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

  // Crear nuevo lead
  create: async (leadData: Omit<LeadDTO, 'id' | 'dias' | 'fechaConversion'>): Promise<LeadDTO> => {
    const response = await api.post<LeadDTO>(BASE_PATH, leadData);
    return response.data;
  },

  // Actualizar lead
  update: async (id: number, leadData: LeadDTO): Promise<LeadDTO> => {
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
};
