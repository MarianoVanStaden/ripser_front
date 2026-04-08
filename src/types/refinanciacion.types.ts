import type { TipoFinanciacion } from './prestamo.types';
import type { PrestamoPersonalDTO } from './prestamo.types';

// ==================== ENUMS ====================

export const TipoIncremento = {
  PORCENTAJE: 'PORCENTAJE',
  MONTO_FIJO: 'MONTO_FIJO',
} as const;
export type TipoIncremento = typeof TipoIncremento[keyof typeof TipoIncremento];

export const TIPO_INCREMENTO_LABELS: Record<TipoIncremento, string> = {
  PORCENTAJE: 'Porcentaje (%)',
  MONTO_FIJO: 'Monto fijo ($)',
};

// ==================== REQUEST ====================

export interface RefinanciacionRequest {
  prestamoId: number;
  entregaInicial?: number;
  tipoIncremento: TipoIncremento;
  valorIncremento: number;
  cantidadCuotas: number;
  fechaPrimeraCuota?: string;       // ISO "YYYY-MM-DD"
  tipoFinanciacion?: TipoFinanciacion;
  usuarioId?: number;
  observaciones?: string;
}

// ==================== DTOs ====================

export interface CuotaARefinanciarDTO {
  id: number;
  numeroCuota: number;
  montoCuota: number;
  montoPagado: number;
  saldoPendiente: number;
  fechaVencimiento: string;
  estado: 'PENDIENTE' | 'VENCIDA' | 'PARCIAL';
  diasMora: number;
}

export interface RefinanciacionPreviewResponse {
  prestamoId: number;
  deudaTotal: number;
  entregaInicial: number;
  saldoBase: number;
  tipoIncremento: TipoIncremento;
  valorIncremento: number;
  interesGenerado: number;
  montoFinalFinanciado: number;
  cantidadCuotas: number;
  valorCuotaEstimado: number;
  totalCuotasARefinanciar: number;
  cuotasARefinanciar: CuotaARefinanciarDTO[];
  deudaMigrada?: boolean;
}

export interface RefinanciacionResponse {
  refinanciacionId: number;
  prestamoOriginalId: number;
  nuevoPrestamo: PrestamoPersonalDTO;
  fechaRefinanciacion: string;
  fechaCreacion: string;
  montoDeudaOriginal: number;
  montoEntregado: number;
  saldoRefinanciado: number;
  tipoIncremento: TipoIncremento;
  valorIncremento: number;
  interesGenerado: number;
  montoFinalFinanciado: number;
  cantidadCuotas: number;
  valorCuota: number;
  totalRefinanciacionesDelPrestamo: number;
  observaciones?: string;
}
