// Tipos para la reasignación masiva de leads. Espejo de los DTOs del backend
// (com.ripser_back.dto.lead.reasignacion).

export type ReasignacionModo =
  | 'LEADS_SELECCIONADOS'
  | 'TODOS_DE_VENDEDOR'
  | 'TODOS_DE_SUCURSAL';

export type MotivoReasignacion =
  | 'ROTACION_PERSONAL'
  | 'REBALANCEO_CARGA'
  | 'LICENCIA_VACACIONES'
  | 'CIERRE_SUCURSAL'
  | 'BAJA_VENDEDOR'
  | 'CORRECCION_ASIGNACION'
  | 'OTRO';

export const MOTIVO_LABELS: Record<MotivoReasignacion, string> = {
  ROTACION_PERSONAL: 'Rotación de personal',
  REBALANCEO_CARGA: 'Rebalanceo de carga',
  LICENCIA_VACACIONES: 'Licencia / vacaciones',
  CIERRE_SUCURSAL: 'Cierre de sucursal',
  BAJA_VENDEDOR: 'Baja de vendedor',
  CORRECCION_ASIGNACION: 'Corrección de asignación',
  OTRO: 'Otro',
};

export interface ReasignacionRequest {
  modo: ReasignacionModo;
  leadIds?: number[];
  vendedorOrigenId?: number | null;
  sucursalOrigenId?: number | null;
  vendedorDestinoId?: number | null;
  sucursalDestinoId?: number | null;
  motivo: MotivoReasignacion;
  observaciones?: string;
  /** Conteo mostrado en el preview — guard anti-carrera al ejecutar. */
  expectedCount?: number;
}

export interface LeadResumenDTO {
  id: number;
  nombre: string;
  apellido?: string;
  telefono?: string;
  usuarioAsignadoId?: number | null;
  sucursalId?: number | null;
}

export interface ReasignacionPreviewResponse {
  total: number;
  yaEnDestino: number;
  vendedorDestinoNombre?: string | null;
  sucursalDestinoNombre?: string | null;
  muestra: LeadResumenDTO[];
  advertencias: string[];
}

export interface ReasignacionFailure {
  id: number;
  error: string;
}

export interface ReasignacionResultado {
  loteId: string;
  cantidadAfectada: number;
  cantidadOmitida: number;
  reasignados: number[];
  omitidos: number[];
  fallas: ReasignacionFailure[];
}

export interface HistorialReasignacionLeadDTO {
  id: number;
  loteId: string;
  leadId: number;
  vendedorAnteriorId?: number | null;
  vendedorAnteriorNombre?: string | null;
  vendedorNuevoId?: number | null;
  vendedorNuevoNombre?: string | null;
  sucursalAnteriorId?: number | null;
  sucursalAnteriorNombre?: string | null;
  sucursalNuevaId?: number | null;
  sucursalNuevaNombre?: string | null;
  motivo?: MotivoReasignacion | null;
  observaciones?: string | null;
  cantidadTotalLote?: number | null;
  usuarioId?: number | null;
  usuarioNombre?: string | null;
  ipAddress?: string | null;
  fecha: string;
}

export interface HistorialFilterParams {
  sucursalId?: number;
  vendedorId?: number;
  leadId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}
