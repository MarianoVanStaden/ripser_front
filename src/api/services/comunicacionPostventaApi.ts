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
  /** Si la factura también es tarea de COBRANZAS (financiación propia sin cheques). */
  aplicaCobranzas: boolean;
  fechaEntrega?: string; // LocalDate
  equipos: EquipoResumen[];
  /** Check de la perspectiva del rol que consulta (post-venta o cobranzas). */
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
  // `canal` fija la perspectiva a marcar (post-venta vs cobranzas); los roles
  // operativos la ignoran (el backend la deriva del rol), los admins la envían.
  marcarContacto: async (
    id: number,
    body: { realizada: boolean; observaciones?: string },
    canal?: CanalComunicacionPostventa
  ): Promise<ComunicacionInicialPostventaDTO> => {
    const response = await api.patch<ComunicacionInicialPostventaDTO>(
      `/api/comunicaciones-postventa/${id}/marcar`,
      body,
      { params: canal ? { canal } : {} }
    );
    return response.data;
  },
};
