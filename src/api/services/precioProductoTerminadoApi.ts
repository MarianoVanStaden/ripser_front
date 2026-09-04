import api from '../config';
import type { PageResponse } from '../../types/pagination.types';

// Espejo de precioRecetaApi para productos terminados (reventa).
export type TipoCambioPrecio = 'MANUAL' | 'MASIVO_PCT' | 'MASIVO_MONTO' | 'REVERSION';
export type ModoRedondeo = 'CEIL' | 'HALF_UP';
export type AlcanceAjusteReventa = 'TODOS' | 'CATEGORIA' | 'IDS';
export type TipoAjuste = 'PCT' | 'MONTO';

export interface CambioPrecioRequest {
  precioNuevo: number;
  motivo: string;
  version: number;
}

export interface AjusteMasivoReventaPreviewRequest {
  alcance: AlcanceAjusteReventa;
  categoriaId?: number;
  productoIds?: number[];
  tipoAjuste: TipoAjuste;
  valor: number;
  pasoRedondeo?: number;
  modoRedondeo?: ModoRedondeo;
  margenMinimoPct?: number;
}

export interface AjusteMasivoReventaPreviewRow {
  productoId: number;
  codigo: string;
  nombre: string;
  categoriaNombre: string | null;
  precioActual: number;
  precioNuevo: number;
  costo: number;
  margenNuevoPct: number | null;
  alertaMargen: boolean;
  version: number;
}

export interface AjusteMasivoReventaAplicarRequest {
  motivo: string;
  tipoCambio: 'MASIVO_PCT' | 'MASIVO_MONTO';
  parametrosAjuste?: string;
  lineas: Array<{ productoId: number; precioNuevo: number; version: number }>;
}

export interface AjusteMasivoResultadoDTO {
  loteId: string;
  cantidadAplicada: number;
}

export interface HistorialPrecioProductoTerminadoDTO {
  id: number;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  precioAnterior: number | null;
  precioNuevo: number;
  tipoCambio: TipoCambioPrecio;
  motivo: string;
  usuarioId: number | null;
  usuarioNombre: string | null;
  fechaCambio: string;
  loteId: string | null;
  parametrosAjuste: string | null;
  productoVersion: number | null;
}

export interface HistorialPrecioReventaFilters {
  productoId?: number;
  usuarioId?: number;
  tipoCambio?: TipoCambioPrecio;
  desde?: string; // ISO datetime
  hasta?: string;
  page?: number;
  size?: number;
}

const BASE = '/api/productos-terminados';

export const precioProductoTerminadoApi = {
  cambiarPrecio: async (
    productoId: number,
    req: CambioPrecioRequest,
  ): Promise<HistorialPrecioProductoTerminadoDTO> => {
    const r = await api.patch<HistorialPrecioProductoTerminadoDTO>(`${BASE}/${productoId}/precio`, req);
    return r.data;
  },

  previewAjusteMasivo: async (
    req: AjusteMasivoReventaPreviewRequest,
  ): Promise<AjusteMasivoReventaPreviewRow[]> => {
    const r = await api.post<AjusteMasivoReventaPreviewRow[]>(`${BASE}/precios/ajuste-masivo/preview`, req);
    return r.data;
  },

  aplicarAjusteMasivo: async (
    req: AjusteMasivoReventaAplicarRequest,
  ): Promise<AjusteMasivoResultadoDTO> => {
    const r = await api.post<AjusteMasivoResultadoDTO>(`${BASE}/precios/ajuste-masivo`, req);
    return r.data;
  },

  historial: async (
    filters: HistorialPrecioReventaFilters = {},
  ): Promise<PageResponse<HistorialPrecioProductoTerminadoDTO>> => {
    const r = await api.get<PageResponse<HistorialPrecioProductoTerminadoDTO>>(`${BASE}/precios/historial`, {
      params: filters,
    });
    return r.data;
  },

  revertir: async (historialId: number): Promise<HistorialPrecioProductoTerminadoDTO> => {
    const r = await api.post<HistorialPrecioProductoTerminadoDTO>(
      `${BASE}/precios/historial/${historialId}/revertir`,
    );
    return r.data;
  },
};

export default precioProductoTerminadoApi;
