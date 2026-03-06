import api from '../config';
import type {
  IncidenciaVehiculoDTO,
  CreateIncidenciaVehiculoDTO,
  UpdateIncidenciaVehiculoDTO,
} from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';

export const incidenciaVehiculoApi = {
  getByVehiculo: async (
    vehiculoId: number,
    pagination: PaginationParams = {}
  ): Promise<PageResponse<IncidenciaVehiculoDTO>> => {
    const response = await api.get<PageResponse<IncidenciaVehiculoDTO>>(
      `/api/incidencias-vehiculo/vehiculo/${vehiculoId}`,
      { params: { ...pagination } }
    );
    return response.data;
  },

  getAbiertas: async (): Promise<IncidenciaVehiculoDTO[]> => {
    const response = await api.get<IncidenciaVehiculoDTO[]>('/api/incidencias-vehiculo/abiertas');
    return response.data;
  },

  getVencimientos: async (dias = 30): Promise<IncidenciaVehiculoDTO[]> => {
    const response = await api.get<IncidenciaVehiculoDTO[]>('/api/incidencias-vehiculo/vencimientos', {
      params: { dias },
    });
    return response.data;
  },

  getById: async (id: number): Promise<IncidenciaVehiculoDTO> => {
    const response = await api.get<IncidenciaVehiculoDTO>(`/api/incidencias-vehiculo/${id}`);
    return response.data;
  },

  create: async (data: CreateIncidenciaVehiculoDTO): Promise<IncidenciaVehiculoDTO> => {
    const response = await api.post<IncidenciaVehiculoDTO>('/api/incidencias-vehiculo', data);
    return response.data;
  },

  update: async (id: number, data: UpdateIncidenciaVehiculoDTO): Promise<IncidenciaVehiculoDTO> => {
    const response = await api.put<IncidenciaVehiculoDTO>(`/api/incidencias-vehiculo/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/incidencias-vehiculo/${id}`);
  },
};
