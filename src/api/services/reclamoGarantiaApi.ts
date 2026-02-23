import api from '../api';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

// ==================== TYPES ====================
export interface ReclamoGarantiaDTO {
  id: number;
  garantiaId: number;
  garantiaNumeroSerie: string;
  garantiaEquipoModelo?: string;
  numeroReclamo: string;
  fechaReclamo: string; // LocalDateTime
  descripcionProblema: string;
  tipoSolucion?: 'REPARACION_LOCAL' | 'REPARACION_REMOTA' | 'REEMPLAZO';
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
  solucionAplicada?: string;
  fechaResolucion?: string; // LocalDateTime
  costoSolucion?: number; // BigDecimal
  tecnicoId?: number;
  tecnicoNombre?: string;
  tecnicoApellido?: string;
}

export interface ReclamoGarantiaCreateDTO {
  garantiaId: number;
  descripcionProblema: string;
  tipoSolucion?: 'REPARACION_LOCAL' | 'REPARACION_REMOTA' | 'REEMPLAZO';
}

export interface ReclamoGarantiaUpdateDTO {
  descripcionProblema?: string;
  tipoSolucion?: 'REPARACION_LOCAL' | 'REPARACION_REMOTA' | 'REEMPLAZO';
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
  solucionAplicada?: string;
  costoSolucion?: number;
  tecnicoId?: number;
}

// ==================== RECLAMOS API ====================
export const reclamoGarantiaApi = {
  // GET /api/reclamos-garantia
  findAll: async (pagination: PaginationParams = {}): Promise<PageResponse<ReclamoGarantiaDTO>> => {
    const response = await api.get<PageResponse<ReclamoGarantiaDTO>>('/api/reclamos-garantia', {
      params: { ...pagination },
    });
    return response.data;
  },

  // GET /api/reclamos-garantia/{id}
  findById: async (id: number): Promise<ReclamoGarantiaDTO> => {
    const response = await api.get(`/api/reclamos-garantia/${id}`);
    return response.data;
  },

  // POST /api/reclamos-garantia
  create: async (data: ReclamoGarantiaCreateDTO): Promise<ReclamoGarantiaDTO> => {
    const response = await api.post('/api/reclamos-garantia', data);
    return response.data;
  },

  // PUT /api/reclamos-garantia/{id}
  update: async (id: number, data: ReclamoGarantiaUpdateDTO): Promise<ReclamoGarantiaDTO> => {
    const response = await api.put(`/api/reclamos-garantia/${id}`, data);
    return response.data;
  },

  // DELETE /api/reclamos-garantia/{id}
  deleteById: async (id: number): Promise<void> => {
    await api.delete(`/api/reclamos-garantia/${id}`);
  },

  // GET /api/reclamos-garantia/garantia/{garantiaId}
  findByGarantiaId: async (garantiaId: number): Promise<ReclamoGarantiaDTO[]> => {
    const response = await api.get(`/api/reclamos-garantia/garantia/${garantiaId}`);
    return response.data;
  },
};
