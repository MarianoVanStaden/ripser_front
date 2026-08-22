import api from '../config';
import type { MovimientoStockDeposito, MovimientoEquipo } from '../../types';

// Etapa 7-I: la base path correcta es /api/movimientos-stock-depositos (antes
// apuntaba a /api/movimientos-stock → 404, con las pantallas de auditoría e
// inventario de depósitos rotas). Además el back devuelve Page<...>, no un array
// pelado: desempaquetamos .content. Pedimos un size alto (no el default 20) para
// no truncar la auditoría en silencio; migrar a paginación real es el fix definitivo.
const DEPOSITO_BASE = '/api/movimientos-stock-depositos';
const PAGE_SIZE_ALTO = 1000;

export const movimientoStockDepositoApi = {
  getAll: async (): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/all`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getRecientes: async (): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/recientes`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getByProducto: async (productoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/por-producto/${productoId}`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getByDeposito: async (depositoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/por-deposito/${depositoId}`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getByDepositoOrigen: async (depositoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/deposito-origen/${depositoId}`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getByDepositoDestino: async (depositoId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/deposito-destino/${depositoId}`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getByUsuario: async (usuarioId: number): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/por-usuario/${usuarioId}`, { params: { size: PAGE_SIZE_ALTO } });
    return response.data.content;
  },

  getByFechaRange: async (fechaInicio: string, fechaFin: string): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/fecha-range`, {
      params: { fechaInicio, fechaFin, size: PAGE_SIZE_ALTO }
    });
    return response.data.content;
  },

  getByProductoAndFechaRange: async (
    productoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Promise<MovimientoStockDeposito[]> => {
    const response = await api.get(`${DEPOSITO_BASE}/por-producto/${productoId}/rango-fechas`, {
      params: { fechaInicio, fechaFin, size: PAGE_SIZE_ALTO }
    });
    return response.data.content;
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
