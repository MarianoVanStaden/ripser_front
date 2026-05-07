import api from '../config';
import type { EquipoFabricadoDTO, TipoEquipo } from '../../types';

export interface EspecificacionTecnicaModeloDTO {
  id: number;
  empresaId: number;
  tipo: TipoEquipo;
  modelo: string;

  motor?: string;
  gas?: string;
  humedad?: string;
  sistema?: string;
  estructura?: string;
  gabinete?: string;
  iluminacion?: string;
  transformador?: string;
  leds?: string;
  vidrios?: string;
  paneles?: string;
  puertas?: string;
  revestimiento?: string;

  estanteriasCantidad?: number;
  estanteriasFormato?: string;
  alto?: number;
  profundidad?: number;
  ancho?: number;

  activo: boolean;
}

export interface CreateEspecificacionTecnicaRequest {
  tipo: TipoEquipo;
  modelo: string;
  motor?: string;
  gas?: string;
  humedad?: string;
  sistema?: string;
  estructura?: string;
  gabinete?: string;
  iluminacion?: string;
  transformador?: string;
  leds?: string;
  vidrios?: string;
  paneles?: string;
  puertas?: string;
  revestimiento?: string;
  estanteriasCantidad?: number;
  estanteriasFormato?: string;
  alto?: number;
  profundidad?: number;
  ancho?: number;
}

export type UpdateEspecificacionTecnicaRequest = Partial<
  CreateEspecificacionTecnicaRequest
> & {
  activo?: boolean;
};

export interface FichaTecnicaEquipoDTO {
  equipo: EquipoFabricadoDTO;
  especificacion: EspecificacionTecnicaModeloDTO | null;
}

export const especificacionTecnicaApi = {
  list: async (activo?: boolean): Promise<EspecificacionTecnicaModeloDTO[]> => {
    const response = await api.get<EspecificacionTecnicaModeloDTO[]>(
      '/api/especificaciones-tecnicas',
      { params: activo !== undefined ? { activo } : undefined },
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<EspecificacionTecnicaModeloDTO>(
      `/api/especificaciones-tecnicas/${id}`,
    );
    return response.data;
  },

  /** Returns null when no spec exists for the (tipo, modelo) tuple. */
  findByTipoModelo: async (
    tipo: TipoEquipo,
    modelo: string,
  ): Promise<EspecificacionTecnicaModeloDTO | null> => {
    try {
      const response = await api.get<EspecificacionTecnicaModeloDTO>(
        '/api/especificaciones-tecnicas/buscar',
        { params: { tipo, modelo } },
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  create: async (payload: CreateEspecificacionTecnicaRequest) => {
    const response = await api.post<EspecificacionTecnicaModeloDTO>(
      '/api/especificaciones-tecnicas',
      payload,
    );
    return response.data;
  },

  update: async (id: number, payload: UpdateEspecificacionTecnicaRequest) => {
    const response = await api.patch<EspecificacionTecnicaModeloDTO>(
      `/api/especificaciones-tecnicas/${id}`,
      payload,
    );
    return response.data;
  },

  /**
   * Combined ficha técnica (equipo + spec del modelo) used by the QR/print page.
   * Backend returns `especificacion: null` when the (tipo, modelo) tuple has
   * no spec loaded yet — caller should handle that case explicitly.
   */
  getFichaTecnica: async (numeroHeladera: string) => {
    const response = await api.get<FichaTecnicaEquipoDTO>(
      `/api/equipos-fabricados/numero/${numeroHeladera}/ficha-tecnica`,
    );
    return response.data;
  },
};
