import api from '../config';
import type { MovimientoStock } from '../../types';

// Recount request/response types
export interface RecuentoRequest {
  categoriaId?: number | null;
  notas?: string;
  usuarioId?: number;
}

export interface RecuentoResponse {
  recuentoId: number;
  totalProductos: number;
  categoriaSeleccionada: string;
  notas?: string;
  fechaInicio: string;
  movimientos: MovimientoStock[];
}

export const movimientoStockApi = {
  // Get all movimientos
  getAll: async (): Promise<MovimientoStock[]> => {
    const response = await api.get('/api/movimientos-stock');
    return response.data;
  },

  // Get movimiento by ID
  getById: async (id: number): Promise<MovimientoStock> => {
    const response = await api.get(`/api/movimientos-stock/${id}`);
    return response.data;
  },

  // Get movimientos by materia prima
  getByMateriaPrima: async (materiaPrimaId: number): Promise<MovimientoStock[]> => {
    const response = await api.get(`/api/movimientos-stock/materia-prima/${materiaPrimaId}`);
    return response.data;
  },

  // Get movimientos by tipo
  getByTipo: async (tipo: string): Promise<MovimientoStock[]> => {
    const response = await api.get(`/api/movimientos-stock/tipo/${tipo}`);
    return response.data;
  },

  // Get movimientos by periodo
  getByPeriodo: async (fechaInicio: string, fechaFin: string): Promise<MovimientoStock[]> => {
    const response = await api.get('/api/movimientos-stock/periodo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Get stock calculado producto
  getStockCalculadoProducto: async (productoId: number): Promise<number> => {
    const response = await api.get(`/api/movimientos-stock/stock-calculado/producto/${productoId}`);
    return response.data;
  },

  // Get stock calculado materia prima
  getStockCalculadoMateriaPrima: async (materiaPrimaId: number): Promise<string> => {
    const response = await api.get(`/api/movimientos-stock/stock-calculado/materia-prima/${materiaPrimaId}`);
    return response.data;
  },

  // Create new movimiento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: async (movimiento: MovimientoStock | any): Promise<MovimientoStock> => {
    const response = await api.post('/api/movimientos-stock', movimiento);
    return response.data;
  },

  // Update movimiento
  update: async (id: number, movimiento: MovimientoStock): Promise<MovimientoStock> => {
    const response = await api.put(`/api/movimientos-stock/${id}`, movimiento);
    return response.data;
  },

  // Delete movimiento
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/movimientos-stock/${id}`);
  },

  // Recount operations
  /**
   * Inicia un recuento de inventario
   */
  iniciarRecuento: async (request: RecuentoRequest): Promise<RecuentoResponse> => {
    const response = await api.post<RecuentoResponse>('/api/movimientos-stock/iniciar-recuento', request);
    return response.data;
  },

  /**
   * Completa un item de recuento
   */
  completarRecuento: async (movimientoId: number, cantidadReal: number): Promise<MovimientoStock> => {
    const response = await api.put<MovimientoStock>(
      `/api/movimientos-stock/completar-recuento/${movimientoId}`,
      null,
      { params: { cantidadReal } }
    );
    return response.data;
  },

  /**
   * Obtiene recuentos pendientes
   */
  getRecuentosPendientes: async (): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>('/api/movimientos-stock/recuentos-pendientes');
    return response.data;
  }
};
