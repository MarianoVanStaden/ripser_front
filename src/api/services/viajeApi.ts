import api from '../config';
import type { Viaje, ViajeCreateDTO } from '../../types';
import type { RendicionViajeDTO, RendicionRequest } from '../../types/logistica.types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const viajeApi = {
  // Get all viajes
  getAll: async (pagination: PaginationParams = {}): Promise<PageResponse<Viaje>> => {
    const response = await api.get<PageResponse<Viaje>>('/api/viajes', {
      params: { ...pagination },
    });
    return response.data;
  },

  // Get viaje by ID
  getById: async (id: number): Promise<Viaje> => {
    const response = await api.get(`/api/viajes/${id}`);
    return response.data;
  },

  // Create new viaje
  create: async (viaje: ViajeCreateDTO): Promise<Viaje> => {
    const response = await api.post('/api/viajes', viaje);
    return response.data;
  },

  // Update viaje
  update: async (id: number, viaje: ViajeCreateDTO): Promise<Viaje> => {
    const response = await api.put(`/api/viajes/${id}`, viaje);
    return response.data;
  },

  // Delete viaje
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/viajes/${id}`);
  },

  // Get viajes by conductor
  getByConductor: async (conductorId: number): Promise<Viaje[]> => {
    const response = await api.get(`/api/viajes/conductor/${conductorId}`);
    return response.data;
  },

  // Get viajes by vehiculo
  getByVehiculo: async (vehiculoId: number): Promise<Viaje[]> => {
    const response = await api.get(`/api/viajes/vehiculo/${vehiculoId}`);
    return response.data;
  },

  // Change viaje estado
  changeEstado: async (id: number, estado: string): Promise<Viaje> => {
    const response = await api.patch(`/api/viajes/${id}/estado`, null, {
      params: { estado },
    });
    return response.data;
  },

  // ── Rendición de viaje ──────────────────────────────────────────────────────

  /** Conductor cierra el viaje → PENDIENTE_RENDICION */
  cerrarViaje: async (id: number): Promise<RendicionViajeDTO> => {
    const response = await api.patch<RendicionViajeDTO>(`/api/viajes/${id}/cerrar`);
    return response.data;
  },

  /** Resumen de cobros del viaje (totalDeclarado por entrega) para que admin verifique */
  getResumenCobros: async (id: number): Promise<RendicionViajeDTO> => {
    const response = await api.get<RendicionViajeDTO>(`/api/viajes/${id}/resumen-cobros`);
    return response.data;
  },

  /** Admin registra la rendición: impacta caja y marca viaje como RENDIDO */
  rendir: async (id: number, request: RendicionRequest): Promise<RendicionViajeDTO> => {
    const response = await api.post<RendicionViajeDTO>(`/api/viajes/${id}/rendir`, request);
    return response.data;
  },

  /** Devuelve la rendición ya creada, o null si aún no existe */
  getRendicion: async (id: number): Promise<RendicionViajeDTO | null> => {
    try {
      const response = await api.get<RendicionViajeDTO>(`/api/viajes/${id}/rendicion`);
      return response.data;
    } catch {
      return null;
    }
  },
};
