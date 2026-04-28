import type { TipoEquipo, MedidaEquipo, ColorEquipo } from './index';

export type AccionSugerida = 'FABRICAR' | 'TERMINAR_BASE' | 'OK';

export const ACCION_SUGERIDA_LABELS: Record<AccionSugerida, string> = {
  FABRICAR: 'Fabricar',
  TERMINAR_BASE: 'Terminar base',
  OK: 'Stock OK',
};

// ── Response DTOs (from GET /api/stock-objetivo and GET /api/stock-objetivo/{id}) ──

export interface StockObjetivoResponseDTO {
  id: number;
  tipo: TipoEquipo;
  modelo: string;
  medida: MedidaEquipo;  // entity, not string
  color?: ColorEquipo | null;
  cantidadObjetivo: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

// ── Evaluation DTO (from GET /api/stock-objetivo/evaluacion and /evaluacion/{id}) ──

export interface EvaluacionStockDTO {
  stockObjetivoId: number;
  tipo: TipoEquipo;
  modelo: string;
  medida: MedidaEquipo;
  /** null = equipo base (sin color). Mostrar como "Sin color / Base" en la UI */
  color?: ColorEquipo | null;
  cantidadObjetivo: number;
  /** Terminadas listas para usar (o bases si el objetivo es sin color) */
  stockDisponible: number;
  /** Bases sin terminar disponibles para revestir (solo relevante cuando el objetivo tiene color) */
  stockBaseDisponible: number;
  /** Equipos en estado PENDIENTE o EN_PROCESO actualmente en fabricación */
  stockEnProduccion: number;
  /** cantidadObjetivo − stockDisponible. Negativo = superávit */
  diferencia: number;
  /** Cantidad neta a fabricar, ya descontando stockEnProduccion */
  cantidadAFabricar: number;
  accionSugerida: AccionSugerida;
}

// ── Create / Update DTOs ──

export interface CreateStockObjetivoDTO {
  tipo: TipoEquipo;
  modelo: string;
  medidaId: number;
  /** null = objetivo de equipo BASE (sin color/terminación) */
  colorId?: number | null;
  cantidadObjetivo: number;
  activo: boolean;
}

export type UpdateStockObjetivoDTO = Partial<CreateStockObjetivoDTO>;

// ── Generar Orden DTO ──

export interface GenerarOrdenDTO {
  recetaId: number;
  depositoOrigenId: number;
  responsableId?: number | null;
  /** null → el sistema calcula el déficit neto automáticamente */
  cantidadSolicitada?: number | null;
  observaciones?: string;
}
