import api from '../config';
import type { TipoEquipo } from '../../types';
import type { PageResponse } from '../../types/pagination.types';

export type TipoCambioPrecio = 'MANUAL' | 'MASIVO_PCT' | 'MASIVO_MONTO' | 'REVERSION';
export type ModoRedondeo = 'CEIL' | 'HALF_UP';
export type AlcanceAjuste = 'TODOS' | 'TIPO_EQUIPO' | 'IDS';
export type TipoAjuste = 'PCT' | 'MONTO';

export interface CambioPrecioRequest {
  precioNuevo: number;
  motivo: string;
  version: number;
}

export interface AjusteMasivoPreviewRequest {
  alcance: AlcanceAjuste;
  tipoEquipo?: TipoEquipo;
  recetaIds?: number[];
  tipoAjuste: TipoAjuste;
  valor: number;
  pasoRedondeo?: number;
  modoRedondeo?: ModoRedondeo;
  margenMinimoPct?: number;
}

export interface AjusteMasivoPreviewRow {
  recetaId: number;
  codigo: string;
  nombre: string;
  tipoEquipo: TipoEquipo;
  precioActual: number;
  precioNuevo: number;
  costo: number;
  margenNuevoPct: number | null;
  alertaMargen: boolean;
  version: number;
}

export interface AjusteMasivoAplicarRequest {
  motivo: string;
  tipoCambio: 'MASIVO_PCT' | 'MASIVO_MONTO';
  parametrosAjuste?: string;
  lineas: Array<{ recetaId: number; precioNuevo: number; version: number }>;
}

export interface AjusteMasivoResultadoDTO {
  loteId: string;
  cantidadAplicada: number;
}

export interface HistorialPrecioRecetaDTO {
  id: number;
  recetaId: number;
  recetaCodigo: string;
  recetaNombre: string;
  precioAnterior: number | null;
  precioNuevo: number;
  tipoCambio: TipoCambioPrecio;
  motivo: string;
  usuarioId: number | null;
  usuarioNombre: string | null;
  fechaCambio: string;
  loteId: string | null;
  parametrosAjuste: string | null;
  recetaVersion: number | null;
}

export interface HistorialPrecioFilters {
  recetaId?: number;
  usuarioId?: number;
  tipoCambio?: TipoCambioPrecio;
  desde?: string; // ISO datetime
  hasta?: string;
  page?: number;
  size?: number;
}

export const precioRecetaApi = {
  cambiarPrecio: async (recetaId: number, req: CambioPrecioRequest): Promise<HistorialPrecioRecetaDTO> => {
    const r = await api.patch<HistorialPrecioRecetaDTO>(`/api/recetas-fabricacion/${recetaId}/precio`, req);
    return r.data;
  },

  previewAjusteMasivo: async (req: AjusteMasivoPreviewRequest): Promise<AjusteMasivoPreviewRow[]> => {
    const r = await api.post<AjusteMasivoPreviewRow[]>('/api/recetas-fabricacion/precios/ajuste-masivo/preview', req);
    return r.data;
  },

  aplicarAjusteMasivo: async (req: AjusteMasivoAplicarRequest): Promise<AjusteMasivoResultadoDTO> => {
    const r = await api.post<AjusteMasivoResultadoDTO>('/api/recetas-fabricacion/precios/ajuste-masivo', req);
    return r.data;
  },

  historial: async (filters: HistorialPrecioFilters = {}): Promise<PageResponse<HistorialPrecioRecetaDTO>> => {
    const r = await api.get<PageResponse<HistorialPrecioRecetaDTO>>('/api/recetas-fabricacion/precios/historial', {
      params: filters,
    });
    return r.data;
  },

  revertir: async (historialId: number): Promise<HistorialPrecioRecetaDTO> => {
    const r = await api.post<HistorialPrecioRecetaDTO>(
      `/api/recetas-fabricacion/precios/historial/${historialId}/revertir`
    );
    return r.data;
  },
};
