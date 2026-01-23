import api from '../config';
import type {
  CreateMovimientoExtraDTO,
  UpdateMovimientoExtraDTO,
  FlujoCajaMovimientoEnhanced,
  CategoriasDisponiblesDTO,
} from '../../types';

export const movimientoExtraApi = {
  /**
   * Creates a new extra movement (gasto or cobro extra).
   * @param dto - Data transfer object with movement details
   * @returns Promise<FlujoCajaMovimientoEnhanced> - Created movement
   */
  crear: async (dto: CreateMovimientoExtraDTO): Promise<FlujoCajaMovimientoEnhanced> => {
    const response = await api.post('/api/movimientos-extra', dto);
    return response.data;
  },

  /**
   * Updates an existing extra movement.
   * @param id - Movement ID
   * @param dto - Data transfer object with updated fields
   * @returns Promise<FlujoCajaMovimientoEnhanced> - Updated movement
   */
  actualizar: async (
    id: number,
    dto: UpdateMovimientoExtraDTO
  ): Promise<FlujoCajaMovimientoEnhanced> => {
    const response = await api.put(`/api/movimientos-extra/${id}`, dto);
    return response.data;
  },

  /**
   * Fetches a single extra movement by ID.
   * @param id - Movement ID
   * @returns Promise<FlujoCajaMovimientoEnhanced> - Movement details
   */
  obtenerPorId: async (id: number): Promise<FlujoCajaMovimientoEnhanced> => {
    const response = await api.get(`/api/movimientos-extra/${id}`);
    return response.data;
  },

  /**
   * Lists all extra movements for the current company.
   * @returns Promise<FlujoCajaMovimientoEnhanced[]> - Array of movements
   */
  listar: async (): Promise<FlujoCajaMovimientoEnhanced[]> => {
    const response = await api.get('/api/movimientos-extra');
    return response.data;
  },

  /**
   * Cancels (soft delete) an extra movement.
   * @param id - Movement ID
   * @returns Promise<FlujoCajaMovimientoEnhanced> - Canceled movement
   */
  anular: async (id: number): Promise<FlujoCajaMovimientoEnhanced> => {
    const response = await api.put(`/api/movimientos-extra/${id}/anular`);
    return response.data;
  },

  /**
   * Permanently deletes an extra movement (use with caution).
   * @param id - Movement ID
   * @returns Promise<void>
   */
  eliminar: async (id: number): Promise<void> => {
    await api.delete(`/api/movimientos-extra/${id}`);
  },

  /**
   * Fetches available categories for gastos and cobros extras.
   * @returns Promise<CategoriasDisponiblesDTO> - Available categories
   */
  obtenerCategorias: async (): Promise<CategoriasDisponiblesDTO> => {
    const response = await api.get('/api/movimientos-extra/categorias');
    return response.data;
  },

  /**
   * Filters extra movements by date range.
   * @param fechaDesde - Start date in YYYY-MM-DD format
   * @param fechaHasta - End date in YYYY-MM-DD format
   * @returns Promise<FlujoCajaMovimientoEnhanced[]> - Filtered movements
   */
  filtrarPorFecha: async (
    fechaDesde: string,
    fechaHasta: string
  ): Promise<FlujoCajaMovimientoEnhanced[]> => {
    const params = new URLSearchParams();
    params.append('fechaDesde', fechaDesde);
    params.append('fechaHasta', fechaHasta);

    const response = await api.get(`/api/movimientos-extra/por-fecha?${params.toString()}`);
    return response.data;
  },
};
