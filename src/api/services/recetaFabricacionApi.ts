import api from '../config';

// Enums
import type {
  TipoEquipo,
  RecetaFabricacionDTO,
  RecetaFabricacionListDTO,
  RecetaFabricacionCreateDTO,
  RecetaFabricacionUpdateDTO,
  DetalleRecetaCreateDTO,
} from '../../types';
import type { PageResponse, PaginationParams } from '../../types/pagination.types';


export const recetaFabricacionApi = {
  // CRUD básico
  findAll: async (pagination: PaginationParams = {}): Promise<PageResponse<RecetaFabricacionListDTO>> => {
    const response = await api.get<PageResponse<RecetaFabricacionListDTO>>('/api/recetas-fabricacion', {
      params: { ...pagination },
    });
    return response.data;
  },

  findAllActive: async () => {
    const response = await api.get<RecetaFabricacionListDTO[]>('/api/recetas-fabricacion/activas');
    return response.data;
  },

  findById: async (id: number) => {
    const response = await api.get<RecetaFabricacionDTO>(`/api/recetas-fabricacion/${id}`);
    return response.data;
  },

  findByCodigo: async (codigo: string) => {
    const response = await api.get<RecetaFabricacionDTO>(`/api/recetas-fabricacion/codigo/${codigo}`);
    return response.data;
  },

  create: async (receta: RecetaFabricacionCreateDTO) => {
    const response = await api.post<RecetaFabricacionDTO>('/api/recetas-fabricacion', receta);
    return response.data;
  },

  update: async (id: number, receta: RecetaFabricacionUpdateDTO) => {
    const response = await api.put<RecetaFabricacionDTO>(`/api/recetas-fabricacion/${id}`, receta);
    return response.data;
  },

  deactivate: async (id: number) => {
    await api.patch(`/api/recetas-fabricacion/${id}/desactivar`);
  },

  activate: async (id: number) => {
    await api.patch(`/api/recetas-fabricacion/${id}/activar`);
  },

  // Búsquedas específicas
  findByTipoEquipo: async (tipoEquipo: TipoEquipo) => {
    const response = await api.get<RecetaFabricacionListDTO[]>(`/api/recetas-fabricacion/tipo/${tipoEquipo}`);
    return response.data;
  },

  findByProducto: async (productoId: number) => {
    const response = await api.get<RecetaFabricacionListDTO[]>(`/api/recetas-fabricacion/producto/${productoId}`);
    return response.data;
  },

  // Gestión de detalles
  addDetalle: async (recetaId: number, detalle: DetalleRecetaCreateDTO) => {
    const response = await api.post<RecetaFabricacionDTO>(
      `/api/recetas-fabricacion/${recetaId}/detalles`,
      detalle
    );
    return response.data;
  },

  removeDetalle: async (recetaId: number, detalleId: number) => {
    const response = await api.delete<RecetaFabricacionDTO>(
      `/api/recetas-fabricacion/${recetaId}/detalles/${detalleId}`
    );
    return response.data;
  },

  updateDetalle: async (recetaId: number, detalleId: number, detalle: DetalleRecetaCreateDTO) => {
    const response = await api.put<RecetaFabricacionDTO>(
      `/api/recetas-fabricacion/${recetaId}/detalles/${detalleId}`,
      detalle
    );
    return response.data;
  },

  // Get recetas available for sale
  findDisponiblesParaVenta: async () => {
    const response = await api.get<RecetaFabricacionDTO[]>('/api/recetas-fabricacion/disponibles-venta');
    return response.data;
  },

  // Recalculate costs for all ingredients using current Producto.costo
  recalcularCostos: async (id: number): Promise<RecetaFabricacionDTO> => {
    const response = await api.patch<RecetaFabricacionDTO>(
      `/api/recetas-fabricacion/${id}/recalcular-costos`
    );
    return response.data;
  },
};
