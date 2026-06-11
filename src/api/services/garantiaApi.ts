import api from '../api';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

// ==================== TYPES ====================
export type TipoGarantia = 'DESPERFECTO_FABRICA' | 'DESPERFECTO_ELECTRICO';

export interface GarantiaDTO {
  id: number;
  equipoFabricadoId: number;
  equipoFabricadoModelo: string;
  ventaId: number;
  numeroSerie: string;
  fechaCompra: string; // LocalDate
  fechaVencimiento: string; // LocalDate (la más lejana)
  fechaVencimientoFabrica?: string; // LocalDate
  fechaVencimientoElectrico?: string; // LocalDate
  estado: 'VIGENTE' | 'VENCIDA' | 'ANULADA';
  tiposGarantia?: string; // "DESPERFECTO_FABRICA,DESPERFECTO_ELECTRICO"
  observaciones?: string;
  clienteNombre?: string;
  clienteApellido?: string;
  reclamos?: any[];
}

// ==================== LABELS & CONSTANTS ====================
export const tipoGarantiaLabel: Record<TipoGarantia, string> = {
  DESPERFECTO_FABRICA: 'Desperfecto de Fábrica (1 año)',
  DESPERFECTO_ELECTRICO: 'Desperfecto Eléctrico (6 meses)',
};

export const tipoGarantiaMonths: Record<TipoGarantia, number> = {
  DESPERFECTO_FABRICA: 12,
  DESPERFECTO_ELECTRICO: 6,
};

export interface GarantiaCreateDTO {
  equipoFabricadoId: number;
  ventaId: number;
  numeroSerie: string;
  fechaCompra: string;
  fechaVencimientoFabrica?: string;
  fechaVencimientoElectrico?: string;
  estado: 'VIGENTE' | 'VENCIDA' | 'ANULADA';
  observaciones?: string;
}

// ==================== GARANTIAS API ====================
export const garantiaApi = {
  // GET /api/garantias
  findAll: async (pagination: PaginationParams = {}): Promise<PageResponse<GarantiaDTO>> => {
    const response = await api.get<PageResponse<GarantiaDTO>>('/api/garantias', {
      params: { ...pagination },
    });
    return response.data;
  },

  // GET /api/garantias/{id}
  findById: async (id: number): Promise<GarantiaDTO> => {
    const response = await api.get(`/api/garantias/${id}`);
    return response.data;
  },

  // POST /api/garantias
  create: async (data: GarantiaCreateDTO): Promise<GarantiaDTO> => {
    const response = await api.post('/api/garantias', data);
    return response.data;
  },

  // PUT /api/garantias/{id}/anular
  anular: async (id: number): Promise<GarantiaDTO> => {
    const response = await api.put(`/api/garantias/${id}/anular`);
    return response.data;
  },

  // GET /api/garantias/equipo-fabricado/{equipoFabricadoId}
  findByEquipoFabricadoId: async (equipoFabricadoId: number): Promise<GarantiaDTO[]> => {
    const response = await api.get(`/api/garantias/equipo-fabricado/${equipoFabricadoId}`);
    return response.data;
  },

  // GET /api/garantias/venta/{ventaId}
  findByVentaId: async (ventaId: number): Promise<GarantiaDTO[]> => {
    const response = await api.get(`/api/garantias/venta/${ventaId}`);
    return response.data;
  },
};
