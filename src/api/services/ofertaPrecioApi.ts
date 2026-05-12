import api from '../config';

export type TipoReferenciaOferta = 'PRODUCTO' | 'RECETA';

export interface OfertaPrecioDTO {
  id: number;
  empresaId: number;
  tipo: TipoReferenciaOferta;
  referenciaId: number;
  referenciaNombre: string;
  precioOferta: number;
  precioOriginal: number;
  descuentoPct: number | null;
  fechaInicio: string;        // YYYY-MM-DD
  fechaFin: string;
  motivo: string | null;
  activo: boolean;
  creadoPorId: number | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  vigente: boolean;
}

export interface OfertaPrecioCreateDTO {
  tipo: TipoReferenciaOferta;
  referenciaId: number;
  precioOferta: number;
  descuentoPct?: number | null;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
  activo?: boolean;
}

export interface PrecioEfectivoDTO {
  precioBase: number;
  precioEfectivo: number;
  hayOferta: boolean;
  ofertaId: number | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  motivo: string | null;
}

export const ofertaPrecioApi = {
  findAll: async (): Promise<OfertaPrecioDTO[]> => {
    const r = await api.get<OfertaPrecioDTO[]>('/api/ofertas-precio');
    return r.data;
  },

  findVigentes: async (): Promise<OfertaPrecioDTO[]> => {
    const r = await api.get<OfertaPrecioDTO[]>('/api/ofertas-precio/vigentes');
    return r.data;
  },

  findById: async (id: number): Promise<OfertaPrecioDTO> => {
    const r = await api.get<OfertaPrecioDTO>(`/api/ofertas-precio/${id}`);
    return r.data;
  },

  precioEfectivo: async (tipo: TipoReferenciaOferta, id: number): Promise<PrecioEfectivoDTO> => {
    const r = await api.get<PrecioEfectivoDTO>('/api/ofertas-precio/efectivo', {
      params: { tipo, id },
    });
    return r.data;
  },

  create: async (dto: OfertaPrecioCreateDTO): Promise<OfertaPrecioDTO> => {
    const r = await api.post<OfertaPrecioDTO>('/api/ofertas-precio', dto);
    return r.data;
  },

  update: async (id: number, dto: OfertaPrecioCreateDTO): Promise<OfertaPrecioDTO> => {
    const r = await api.put<OfertaPrecioDTO>(`/api/ofertas-precio/${id}`, dto);
    return r.data;
  },

  desactivar: async (id: number): Promise<OfertaPrecioDTO> => {
    const r = await api.patch<OfertaPrecioDTO>(`/api/ofertas-precio/${id}/desactivar`);
    return r.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ofertas-precio/${id}`);
  },
};
