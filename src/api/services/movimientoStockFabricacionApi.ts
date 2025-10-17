import api from '../config';
import type { MovimientoStock } from '../../types';

export const movimientoStockFabricacionApi = {
  /**
   * Obtener todos los movimientos de stock
   */
  findAll: async (): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>('/api/movimientos-stock');
    return response.data;
  },

  /**
   * Obtener movimientos por equipo fabricado
   */
  findByEquipoFabricado: async (equipoId: number): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>(`/api/movimientos-stock/equipo-fabricado/${equipoId}`);
    return response.data;
  },

  /**
   * Obtener movimientos por producto
   */
  findByProducto: async (productoId: number): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>(`/api/movimientos-stock/producto/${productoId}`);
    return response.data;
  },

  /**
   * Obtener movimientos por tipo
   */
  findByTipo: async (tipo: string): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>(`/api/movimientos-stock/tipo/${tipo}`);
    return response.data;
  },

  /**
   * Obtener movimientos de fabricación
   */
  findMovimientosFabricacion: async (): Promise<MovimientoStock[]> => {
    const response = await api.get<MovimientoStock[]>('/api/movimientos-stock');
    // Filtrar solo movimientos relacionados con fabricación
    return response.data.filter(m =>
      m.tipo === 'SALIDA_FABRICACION' || m.tipo === 'REINGRESO_CANCELACION_FABRICACION'
    );
  },
};
