import api from '../config';
import type { MovimientoStockDeposito, MovimientoEquipo } from '../../types';

export const movimientoStockDepositoApi = {
  getAll: async (): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get('/api/movimientos-stock');
    return response.data;
  },

  getRecientes: async (): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get('/api/movimientos-stock/recientes');
    return response.data;
  },

  getByProducto: async (productoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`/api/movimientos-stock/producto/${productoId}`);
    return response.data;
  },

  getByDeposito: async (depositoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`/api/movimientos-stock/deposito/${depositoId}`);
    return response.data;
  },

  getByDepositoOrigen: async (depositoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`/api/movimientos-stock/deposito-origen/${depositoId}`);
    return response.data;
  },

  getByDepositoDestino: async (depositoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`/api/movimientos-stock/deposito-destino/${depositoId}`);
    return response.data;
  },

  getByUsuario: async (usuarioId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`/api/movimientos-stock/usuario/${usuarioId}`);
    return response.data;
  },

  getByFechaRange: async (fechaInicio: string, fechaFin: string): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get('/api/movimientos-stock/fecha-range', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  getByProductoAndFechaRange: async (
    productoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`/api/movimientos-stock/producto/${productoId}/fecha-range`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },
};

export const movimientoEquipoApi = {
  getAll: async (): Promise<MovimientoEquipo[]> => {
    const response = await api.get('/api/movimientos-equipo');
    return response.data;
  },

  getRecientes: async (): Promise<MovimientoEquipo[]> => {
    const response = await api.get('/api/movimientos-equipo/recientes');
    return response.data;
  },

  getByEquipo: async (equipoId: number): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/equipo/${equipoId}`);
    return response.data;
  },

  getHistorialEquipo: async (equipoId: number): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/equipo/${equipoId}/historial`);
    return response.data;
  },

  getUltimoMovimiento: async (equipoId: number): Promise<MovimientoEquipo> => {
    const response = await api.get(`/api/movimientos-equipo/equipo/${equipoId}/ultimo`);
    return response.data;
  },

  getByNumeroHeladera: async (numeroHeladera: string): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/numero-heladera/${encodeURIComponent(numeroHeladera)}`);
    return response.data;
  },

  getByDeposito: async (depositoId: number): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/deposito/${depositoId}`);
    return response.data;
  },

  getByDepositoOrigen: async (depositoId: number): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/deposito-origen/${depositoId}`);
    return response.data;
  },

  getByDepositoDestino: async (depositoId: number): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/deposito-destino/${depositoId}`);
    return response.data;
  },

  getByUsuario: async (usuarioId: number): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/usuario/${usuarioId}`);
    return response.data;
  },

  getByFechaRange: async (fechaInicio: string, fechaFin: string): Promise<MovimientoEquipo[]> => {
    const response = await api.get('/api/movimientos-equipo/fecha-range', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  getByEquipoAndFechaRange: async (
    equipoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<MovimientoEquipo[]> => {
    const response = await api.get(`/api/movimientos-equipo/equipo/${equipoId}/fecha-range`, {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },
};
