import api from '../config';
import type {
  AuditoriaMovimientoDTO,
  AuditoriaMovimientoFiltroDTO,
  TipoMovimientoStockDeposito,
} from '../../types';

export const auditoriaApi = {
  // Obtener movimientos con filtros
  getMovimientos: async (
    filtros: AuditoriaMovimientoFiltroDTO,
    page?: number,
    size?: number
  ): Promise<{
    content: AuditoriaMovimientoDTO[];
    totalElements: number;
    totalPages: number;
    pageNumber: number;
    pageSize: number;
  }> => {
    const response = await api.get('/auditoria/movimientos', {
      params: {
        ...filtros,
        page,
        size,
      },
    });
    return response.data;
  },

  // Obtener movimientos de un producto específico
  getMovimientosProducto: async (
    productoId: number,
    params?: {
      fechaDesde?: string;
      fechaHasta?: string;
      depositoId?: number;
    }
  ): Promise<AuditoriaMovimientoDTO[]> => {
    const response = await api.get<AuditoriaMovimientoDTO[]>(
      `/auditoria/movimientos/producto/${productoId}`,
      { params }
    );
    return response.data;
  },

  // Obtener movimientos de un equipo específico
  getMovimientosEquipo: async (equipoFabricadoId: number): Promise<AuditoriaMovimientoDTO[]> => {
    const response = await api.get<AuditoriaMovimientoDTO[]>(
      `/auditoria/movimientos/equipo/${equipoFabricadoId}`
    );
    return response.data;
  },

  // Obtener movimientos por tipo
  getMovimientosPorTipo: async (
    tipo: 'PRODUCTO' | 'EQUIPO',
    params?: {
      empresaId: number;
      tipoMovimiento?: TipoMovimientoStockDeposito;
      fechaDesde?: string;
      fechaHasta?: string;
    }
  ): Promise<AuditoriaMovimientoDTO[]> => {
    const response = await api.get<AuditoriaMovimientoDTO[]>('/auditoria/movimientos', {
      params: {
        ...params,
        tipo,
      },
    });
    return response.data;
  },

  // Obtener movimientos por depósito
  getMovimientosDeposito: async (
    depositoId: number,
    params?: {
      fechaDesde?: string;
      fechaHasta?: string;
      tipo?: 'PRODUCTO' | 'EQUIPO';
      tipoMovimiento?: TipoMovimientoStockDeposito;
    }
  ): Promise<AuditoriaMovimientoDTO[]> => {
    const response = await api.get<AuditoriaMovimientoDTO[]>('/auditoria/movimientos', {
      params: {
        ...params,
        depositoId,
      },
    });
    return response.data;
  },

  // Obtener movimientos por documento de referencia
  getMovimientosPorDocumento: async (
    documentoReferencia: string
  ): Promise<AuditoriaMovimientoDTO[]> => {
    const response = await api.get<AuditoriaMovimientoDTO[]>('/auditoria/movimientos', {
      params: {
        documentoReferencia,
      },
    });
    return response.data;
  },

  // Exportar a PDF
  exportarPDF: async (filtros: AuditoriaMovimientoFiltroDTO): Promise<Blob> => {
    const response = await api.get('/auditoria/movimientos/export/pdf', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  },

  // Exportar a Excel
  exportarExcel: async (filtros: AuditoriaMovimientoFiltroDTO): Promise<Blob> => {
    const response = await api.get('/auditoria/movimientos/export/excel', {
      params: filtros,
      responseType: 'blob',
    });
    return response.data;
  },

  // Obtener resumen de movimientos
  getResumen: async (params: {
    empresaId: number;
    fechaDesde: string;
    fechaHasta: string;
    depositoId?: number;
  }): Promise<{
    totalMovimientos: number;
    ingresos: number;
    egresos: number;
    transferencias: number;
    ajustes: number;
    porTipo: { [key: string]: number };
    porDeposito: { [key: string]: number };
  }> => {
    const response = await api.get('/auditoria/movimientos/resumen', { params });
    return response.data;
  },
};

export default auditoriaApi;
