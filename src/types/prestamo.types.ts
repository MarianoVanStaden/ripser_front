import type { TipoRecordatorioEnum } from './lead.types';

// ==================== ENUMS ====================

export const TipoFinanciacion = {
  SEMANAL: 'SEMANAL',
  QUINCENAL: 'QUINCENAL',
  MENSUAL: 'MENSUAL',
  PLAN_PP: 'PLAN_PP',
  CONTADO: 'CONTADO',
  CHEQUES: 'CHEQUES',
} as const;
export type TipoFinanciacion = typeof TipoFinanciacion[keyof typeof TipoFinanciacion];

export const EstadoPrestamo = {
  ACTIVO: 'ACTIVO',
  FINALIZADO: 'FINALIZADO',
  EN_MORA: 'EN_MORA',
  EN_LEGAL: 'EN_LEGAL',
  CANCELADO: 'CANCELADO',
} as const;
export type EstadoPrestamo = typeof EstadoPrestamo[keyof typeof EstadoPrestamo];

export const CategoriaPrestamo = {
  NORMAL: 'NORMAL',
  LEGALES: 'LEGALES',
  PAGO_CON_MORA: 'PAGO_CON_MORA',
  ALTO_RIESGO: 'ALTO_RIESGO',
} as const;
export type CategoriaPrestamo = typeof CategoriaPrestamo[keyof typeof CategoriaPrestamo];

export const EstadoCuota = {
  PENDIENTE: 'PENDIENTE',
  PAGADA: 'PAGADA',
  VENCIDA: 'VENCIDA',
  PARCIAL: 'PARCIAL',
} as const;
export type EstadoCuota = typeof EstadoCuota[keyof typeof EstadoCuota];

// Prestamo-specific interaccion enum (adds VIDEOLLAMADA on top of lead's TipoInteraccionEnum)
export const TipoInteraccionPrestamo = {
  LLAMADA: 'LLAMADA',
  EMAIL: 'EMAIL',
  WHATSAPP: 'WHATSAPP',
  REUNION: 'REUNION',
  VISITA: 'VISITA',
  VIDEOLLAMADA: 'VIDEOLLAMADA',
} as const;
export type TipoInteraccionPrestamo = typeof TipoInteraccionPrestamo[keyof typeof TipoInteraccionPrestamo];

// ==================== LABELS ====================

export const TIPO_FINANCIACION_LABELS: Record<TipoFinanciacion, string> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
  PLAN_PP: 'Plan PP',
  CONTADO: 'Contado',
  CHEQUES: 'Cheques',
};

export const ESTADO_PRESTAMO_LABELS: Record<EstadoPrestamo, string> = {
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado',
  EN_MORA: 'En Mora',
  EN_LEGAL: 'En Legal',
  CANCELADO: 'Cancelado',
};

export const CATEGORIA_PRESTAMO_LABELS: Record<CategoriaPrestamo, string> = {
  NORMAL: 'Normal',
  LEGALES: 'Legales',
  PAGO_CON_MORA: 'Pago con Mora',
  ALTO_RIESGO: 'Alto Riesgo',
};

export const ESTADO_CUOTA_LABELS: Record<EstadoCuota, string> = {
  PENDIENTE: 'Pendiente',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  PARCIAL: 'Parcial',
};

export const TIPO_INTERACCION_PRESTAMO_LABELS: Record<TipoInteraccionPrestamo, string> = {
  LLAMADA: 'Llamada',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  REUNION: 'Reunión',
  VISITA: 'Visita',
  VIDEOLLAMADA: 'Videollamada',
};

// ==================== COLORS ====================

export const ESTADO_PRESTAMO_COLORS: Record<EstadoPrestamo, string> = {
  ACTIVO: '#4CAF50',
  FINALIZADO: '#2196F3',
  EN_MORA: '#FF9800',
  EN_LEGAL: '#F44336',
  CANCELADO: '#9E9E9E',
};

export const CATEGORIA_PRESTAMO_COLORS: Record<CategoriaPrestamo, string> = {
  NORMAL: '#4CAF50',
  LEGALES: '#F44336',
  PAGO_CON_MORA: '#FF9800',
  ALTO_RIESGO: '#E91E63',
};

export const ESTADO_CUOTA_COLORS: Record<EstadoCuota, string> = {
  PENDIENTE: '#2196F3',
  PAGADA: '#4CAF50',
  VENCIDA: '#F44336',
  PARCIAL: '#FF9800',
};

// ==================== DTOs ====================

export interface PrestamoPersonalDTO {
  id: number;
  empresaId: number;
  clienteId: number;
  clienteNombre: string;
  codigoClienteRojas?: string;
  tipoFinanciacion: TipoFinanciacion;
  cantidadCuotas: number;
  valorCuota: number;
  montoTotal: number;
  cuotaActual: number;
  vencimientoActual?: string;
  diasVencido: number;
  estado: EstadoPrestamo;
  categoria: CategoriaPrestamo;
  finalizado: boolean;
  fechaEntrega?: string;
  responsableSeguimientoId?: number | null;
  observaciones?: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  cuotasPagadas: number;
  cuotasPendientes: number;
  montoPagado: number;
  saldoPendiente: number;
  documentoId?: number | null;
}

export interface CreatePrestamoPersonalDTO {
  clienteId: number;
  cantidadCuotas: number;
  valorCuota: number;
  tipoFinanciacion?: TipoFinanciacion;
  primerVencimiento?: string;
  categoria?: CategoriaPrestamo;
  responsableSeguimientoId?: number;
  observaciones?: string;
  codigoClienteRojas?: string;
}

export interface ResumenPrestamosDTO {
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosFinalizados: number;
  prestamosEnMora: number;
  prestamosEnLegal: number;
  montoTotalPrestado: number;
  montoTotalCobrado: number;
  montoTotalPendiente: number;
  cuotasVencidas: number;
  cuotasProximasAVencer: number;
  prestamosNormales: number;
  prestamosLegales: number;
  prestamosPagoConMora: number;
  prestamosAltoRiesgo: number;
}

export interface CuotaPrestamoDTO {
  id: number;
  prestamoId: number;
  numeroCuota: number;
  montoCuota: number;
  montoPagado: number;
  fechaVencimiento: string;
  fechaPago?: string | null;
  estado: EstadoCuota;
}

export const MetodoPago = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA_BANCARIA: 'TRANSFERENCIA_BANCARIA',
  CHEQUE: 'CHEQUE',
  TARJETA_CREDITO: 'TARJETA_CREDITO',
  TARJETA_DEBITO: 'TARJETA_DEBITO',
  MERCADO_PAGO: 'MERCADO_PAGO',
  CUENTA_CORRIENTE: 'CUENTA_CORRIENTE',
  FINANCIACION_PROPIA: 'FINANCIACION_PROPIA',
} as const;
export type MetodoPago = typeof MetodoPago[keyof typeof MetodoPago];

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
  CHEQUE: 'Cheque',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  TARJETA_DEBITO: 'Tarjeta de Débito',
  MERCADO_PAGO: 'Mercado Pago',
  CUENTA_CORRIENTE: 'Cuenta Corriente',
  FINANCIACION_PROPIA: 'Financiación Propia',
};

export interface RegistrarPagoCuotaDTO {
  cuotaId: number;
  montoPagado: number;
  fechaPago?: string;
  metodoPago: MetodoPago;
}

export interface RevertirPagoCuotaRequest {
  cuotaId: number;
  motivo?: string;
}

export interface RecordatorioCuotaDTO {
  id?: number;
  cuotaId: number;
  fechaRecordatorio: string;
  tipo: TipoRecordatorioEnum;
  mensaje: string;
  enviado?: boolean;
  fechaEnvio?: string | null;
  pagado?: boolean;
  usuarioAsignadoId?: number;
  fechaCreacion?: string;
}

export interface CreateSeguimientoPrestamoDTO {
  prestamoId: number;
  tipo?: TipoInteraccionPrestamo;
  fecha?: string;
  descripcion?: string;
  resultado?: string;
  proximaAccion?: string;
}

export interface SeguimientoPrestamoDTO {
  id: number;
  prestamoId: number;
  usuarioId: number;
  tipo: TipoInteraccionPrestamo;
  fecha: string;
  descripcion?: string;
  resultado?: string;
  proximaAccion?: string;
  fechaCreacion: string;
}
