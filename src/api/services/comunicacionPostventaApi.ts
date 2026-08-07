import api from '../api';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export type CanalComunicacionPostventa = 'POST_VENTA' | 'COBRANZAS';

export interface EquipoResumen {
  id: number;
  numeroHeladera?: string;
  modelo?: string;
  medida?: string;
}

export interface ComunicacionInicialPostventaDTO {
  id: number;
  documentoComercialId: number;
  facturaNumero?: string;
  clienteId?: number;
  clienteNombreCompleto?: string;
  clienteWhatsapp?: string;
  clienteTelefono?: string;
  canal: CanalComunicacionPostventa;
  fechaEntrega?: string; // LocalDate
  equipos: EquipoResumen[];
  realizada: boolean;
  fechaContacto?: string; // LocalDateTime
  usuarioContactoId?: number;
  observaciones?: string;
}

export interface ComunicacionPostventaFilters extends PaginationParams {
  canal?: CanalComunicacionPostventa;
  realizada?: boolean;
  search?: string;
}

export const comunicacionPostventaApi = {
  // GET /api/comunicaciones-postventa — paginado; el backend fuerza el canal por rol.
  findAll: async (
    filters: ComunicacionPostventaFilters = {}
  ): Promise<PageResponse<ComunicacionInicialPostventaDTO>> => {
    const response = await api.get<PageResponse<ComunicacionInicialPostventaDTO>>(
      '/api/comunicaciones-postventa',
      { params: { ...filters } }
    );
    return response.data;
  },

  // PATCH /api/comunicaciones-postventa/{id}/marcar
  marcarContacto: async (
    id: number,
    body: { realizada: boolean; observaciones?: string }
  ): Promise<ComunicacionInicialPostventaDTO> => {
    const response = await api.patch<ComunicacionInicialPostventaDTO>(
      `/api/comunicaciones-postventa/${id}/marcar`,
      body
    );
    return response.data;
  },
};
