import api from '../config';
import type { MovimientoStock } from '../../types';

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
  create: async (movimiento: MovimientoStock): Promise<MovimientoStock> => {
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
  }
};
