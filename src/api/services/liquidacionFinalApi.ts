import axios from '../config';
import type { PageResponse } from '../../types/pagination.types';

const BASE_URL = '/api/liquidaciones-finales';
const CONCEPTOS_URL = '/api/conceptos-liquidacion';

export type EstadoLiquidacionFinal = 'BORRADOR' | 'CONFIRMADA' | 'PAGADA' | 'ANULADA';
export type SignoConceptoLiquidacion = 'HABER' | 'DESCUENTO';
export type MotivoEgreso =
  | 'RENUNCIA'
  | 'DESPIDO_SIN_CAUSA'
  | 'DESPIDO_CON_CAUSA'
  | 'MUTUO_ACUERDO'
  | 'FIN_CONTRATO_PLAZO_FIJO'
  | 'PERIODO_PRUEBA'
  | 'JUBILACION'
  | 'FALLECIMIENTO'
  | 'ABANDONO_TRABAJO';

export const MOTIVOS_EGRESO: { value: MotivoEgreso; label: string }[] = [
  { value: 'RENUNCIA', label: 'Renuncia' },
  { value: 'DESPIDO_SIN_CAUSA', label: 'Despido sin causa' },
  { value: 'DESPIDO_CON_CAUSA', label: 'Despido con causa' },
  { value: 'MUTUO_ACUERDO', label: 'Mutuo acuerdo (art. 241)' },
  { value: 'FIN_CONTRATO_PLAZO_FIJO', label: 'Fin contrato a plazo fijo' },
  { value: 'PERIODO_PRUEBA', label: 'Período de prueba' },
  { value: 'JUBILACION', label: 'Jubilación' },
  { value: 'FALLECIMIENTO', label: 'Fallecimiento' },
  { value: 'ABANDONO_TRABAJO', label: 'Abandono de trabajo' },
];

export interface ConceptoLiquidacion {
  id: number;
  codigo: string;
  nombre: string;
  signo: SignoConceptoLiquidacion;
  activo: boolean;
  orden: number;
}

export interface LiquidacionFinalItem {
  id: number;
  conceptoId: number | null;
  descripcion: string;
  signo: SignoConceptoLiquidacion;
  cantidad: number | null;
  monto: number;
  orden: number;
  observacion: string | null;
}

export interface LiquidacionFinal {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  empleadoId: number;
  empleadoNombre: string;
  empleadoApellido: string;
  empleadoDni: string | null;
  empleadoFechaIngreso: string | null;
  fechaEgreso: string;
  motivoEgreso: MotivoEgreso;
  estado: EstadoLiquidacionFinal;
  totalHaberes: number;
  totalDescuentos: number;
  totalNeto: number;
  fechaPago: string | null;
  observaciones: string | null;
  motivoAnulacion: string | null;
  creadoPor: string | null;
  fechaCreacion: string;
  confirmadaPor: string | null;
  fechaConfirmacion: string | null;
  pagadaPor: string | null;
  anuladaPor: string | null;
  fechaAnulacion: string | null;
  items: LiquidacionFinalItem[];
}

export interface LiquidacionFinalItemRequest {
  conceptoId?: number | null;
  descripcion?: string;
  signo?: SignoConceptoLiquidacion;
  cantidad?: number | null;
  monto: number;
  orden?: number;
  observacion?: string;
}

export interface LiquidacionFinalCreateRequest {
  empleadoId: number;
  sucursalId?: number | null;
  fechaEgreso: string;
  motivoEgreso: MotivoEgreso;
  observaciones?: string;
  items?: LiquidacionFinalItemRequest[];
}

export interface LiquidacionFinalUpdateRequest {
  sucursalId?: number | null;
  fechaEgreso?: string;
  motivoEgreso?: MotivoEgreso;
  observaciones?: string;
}

export interface PagoLiquidacionRequest {
  fecha: string;
  items: Array<{ cajaPesosId: number; monto: number; metodoPago?: string; observaciones?: string }>;
  observaciones?: string;
}

export const liquidacionFinalApi = {
  getAll: async (params: {
    empleadoId?: number;
    estado?: EstadoLiquidacionFinal;
    page?: number;
    size?: number;
  } = {}): Promise<PageResponse<LiquidacionFinal>> => {
    const { data } = await axios.get<PageResponse<LiquidacionFinal>>(BASE_URL, { params });
    return data;
  },

  getById: async (id: number): Promise<LiquidacionFinal> => {
    const { data } = await axios.get<LiquidacionFinal>(`${BASE_URL}/${id}`);
    return data;
  },

  create: async (payload: LiquidacionFinalCreateRequest): Promise<LiquidacionFinal> => {
    const { data } = await axios.post<LiquidacionFinal>(BASE_URL, payload);
    return data;
  },

  update: async (id: number, payload: LiquidacionFinalUpdateRequest): Promise<LiquidacionFinal> => {
    const { data } = await axios.put<LiquidacionFinal>(`${BASE_URL}/${id}`, payload);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
  },

  addItem: async (id: number, item: LiquidacionFinalItemRequest): Promise<LiquidacionFinal> => {
    const { data } = await axios.post<LiquidacionFinal>(`${BASE_URL}/${id}/items`, item);
    return data;
  },

  updateItem: async (id: number, itemId: number, item: LiquidacionFinalItemRequest): Promise<LiquidacionFinal> => {
    const { data } = await axios.put<LiquidacionFinal>(`${BASE_URL}/${id}/items/${itemId}`, item);
    return data;
  },

  deleteItem: async (id: number, itemId: number): Promise<LiquidacionFinal> => {
    const { data } = await axios.delete<LiquidacionFinal>(`${BASE_URL}/${id}/items/${itemId}`);
    return data;
  },

  confirmar: async (id: number): Promise<LiquidacionFinal> => {
    const { data } = await axios.post<LiquidacionFinal>(`${BASE_URL}/${id}/confirmar`);
    return data;
  },

  pagar: async (id: number, payload: PagoLiquidacionRequest): Promise<LiquidacionFinal> => {
    const { data } = await axios.post<LiquidacionFinal>(`${BASE_URL}/${id}/pagar`, payload);
    return data;
  },

  anular: async (id: number, motivo: string): Promise<LiquidacionFinal> => {
    const { data } = await axios.post<LiquidacionFinal>(`${BASE_URL}/${id}/anular`, { motivo });
    return data;
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const { data } = await axios.get(`${BASE_URL}/${id}/pdf`, { responseType: 'blob' });
    return data as Blob;
  },

  // ── Catálogo de conceptos (por empresa) ──────────────────────────────────
  getConceptos: async (soloActivos = true): Promise<ConceptoLiquidacion[]> => {
    const { data } = await axios.get<ConceptoLiquidacion[]>(CONCEPTOS_URL, {
      params: soloActivos ? { activo: true } : {},
    });
    return data;
  },
};

export default liquidacionFinalApi;
