import api from '../config';
import type { MetodoPago } from '../../types';

export interface OpcionFinanciamientoTemplateDTO {
  id?: number;
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  descripcion?: string;
  ordenPresentacion: number;
  activa: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateOpcionFinanciamientoTemplateDTO {
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  descripcion?: string;
  ordenPresentacion: number;
  activa: boolean;
}

export interface UpdateOpcionFinanciamientoTemplateDTO {
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  descripcion?: string;
  ordenPresentacion: number;
  activa: boolean;
}

const BASE_URL = '/api/opciones-financiamiento-templates';

/**
 * API service for managing financing option templates
 */
const opcionFinanciamientoTemplateApi = {
  /**
   * Get all templates
   */
  obtenerTodas: async (): Promise<OpcionFinanciamientoTemplateDTO[]> => {
    const response = await api.get<OpcionFinanciamientoTemplateDTO[]>(BASE_URL);
    return response.data;
  },

  /**
   * Get only active templates
   */
  obtenerActivas: async (): Promise<OpcionFinanciamientoTemplateDTO[]> => {
    const response = await api.get<OpcionFinanciamientoTemplateDTO[]>(`${BASE_URL}/activas`);
    return response.data;
  },

  /**
   * Get template by ID
   */
  obtenerPorId: async (id: number): Promise<OpcionFinanciamientoTemplateDTO> => {
    const response = await api.get<OpcionFinanciamientoTemplateDTO>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new template
   */
  crear: async (dto: CreateOpcionFinanciamientoTemplateDTO): Promise<OpcionFinanciamientoTemplateDTO> => {
    const response = await api.post<OpcionFinanciamientoTemplateDTO>(BASE_URL, dto);
    return response.data;
  },

  /**
   * Update existing template
   */
  actualizar: async (id: number, dto: UpdateOpcionFinanciamientoTemplateDTO): Promise<OpcionFinanciamientoTemplateDTO> => {
    const response = await api.put<OpcionFinanciamientoTemplateDTO>(`${BASE_URL}/${id}`, dto);
    return response.data;
  },

  /**
   * Delete template
   */
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Toggle template active status
   */
  toggleActiva: async (id: number, activa: boolean): Promise<OpcionFinanciamientoTemplateDTO> => {
    const response = await api.patch<OpcionFinanciamientoTemplateDTO>(
      `${BASE_URL}/${id}/toggle-activa`,
      { activa }
    );
    return response.data;
  },

  /**
   * Create default system templates
   */
  crearTemplatesPorDefecto: async (): Promise<OpcionFinanciamientoTemplateDTO[]> => {
    const response = await api.post<OpcionFinanciamientoTemplateDTO[]>(`${BASE_URL}/crear-defaults`);
    return response.data;
  },

  /**
   * Count active templates
   */
  contarActivas: async (): Promise<number> => {
    const response = await api.get<{ count: number }>(`${BASE_URL}/count/activas`);
    return response.data.count;
  },
};

export default opcionFinanciamientoTemplateApi;
