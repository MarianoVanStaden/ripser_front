// Tipos para el registro de actividad del sistema.
// Espejo de los DTOs en ripser_back/src/main/java/com/ripser_back/dto/actividad/.

export type TipoAccionActividad =
  | 'LOGIN_OK'
  | 'LOGIN_FAIL'
  | 'LOGOUT'
  | 'PRESUPUESTO_CREADO'
  | 'PRESUPUESTO_CONVERTIDO_A_NOTA'
  | 'NOTA_PEDIDO_CREADA'
  | 'NOTA_PEDIDO_CONVERTIDA_A_FACTURA'
  | 'NOTA_PEDIDO_ESTADO_CAMBIADO'
  | 'FACTURA_CREADA'
  | 'FACTURA_ANULADA'
  | 'PAGO_REGISTRADO'
  | 'MOVIMIENTO_EXTRA_CREADO'
  | 'MOVIMIENTO_EXTRA_ANULADO'
  | 'GESTION_COBRANZA_CERRADA'
  | 'AMORTIZACION_EJECUTADA'
  | 'AMORTIZACION_CONVERTIDA';

export const TIPO_ACCION_LABELS: Record<TipoAccionActividad, string> = {
  LOGIN_OK: 'Login',
  LOGIN_FAIL: 'Login fallido',
  LOGOUT: 'Cierre de sesión',
  PRESUPUESTO_CREADO: 'Presupuesto creado',
  PRESUPUESTO_CONVERTIDO_A_NOTA: 'Presupuesto → nota',
  NOTA_PEDIDO_CREADA: 'Nota de pedido creada',
  NOTA_PEDIDO_CONVERTIDA_A_FACTURA: 'Nota → factura',
  NOTA_PEDIDO_ESTADO_CAMBIADO: 'Cambio de estado de nota',
  FACTURA_CREADA: 'Factura creada',
  FACTURA_ANULADA: 'Factura anulada',
  PAGO_REGISTRADO: 'Pago registrado',
  MOVIMIENTO_EXTRA_CREADO: 'Movimiento extra creado',
  MOVIMIENTO_EXTRA_ANULADO: 'Movimiento extra anulado',
  GESTION_COBRANZA_CERRADA: 'Gestión de cobranza cerrada',
  AMORTIZACION_EJECUTADA: 'Amortización ejecutada',
  AMORTIZACION_CONVERTIDA: 'Amortización convertida',
};

/**
 * Familia visual para colorear el chip en la tabla. Mantiene la consistencia
 * con el resto del sistema (verde = monetario / éxito, rojo = anulación / fallo,
 * info = navegación / no destructivo).
 */
export type AccionFamilia = 'acceso' | 'documento' | 'pago' | 'anulacion' | 'fallo';

export const TIPO_ACCION_FAMILIA: Record<TipoAccionActividad, AccionFamilia> = {
  LOGIN_OK: 'acceso',
  LOGIN_FAIL: 'fallo',
  LOGOUT: 'acceso',
  PRESUPUESTO_CREADO: 'documento',
  PRESUPUESTO_CONVERTIDO_A_NOTA: 'documento',
  NOTA_PEDIDO_CREADA: 'documento',
  NOTA_PEDIDO_CONVERTIDA_A_FACTURA: 'documento',
  NOTA_PEDIDO_ESTADO_CAMBIADO: 'documento',
  FACTURA_CREADA: 'documento',
  FACTURA_ANULADA: 'anulacion',
  PAGO_REGISTRADO: 'pago',
  MOVIMIENTO_EXTRA_CREADO: 'pago',
  MOVIMIENTO_EXTRA_ANULADO: 'anulacion',
  GESTION_COBRANZA_CERRADA: 'pago',
  AMORTIZACION_EJECUTADA: 'pago',
  AMORTIZACION_CONVERTIDA: 'pago',
};

export interface RegistroActividadDTO {
  id: number;
  empresaId: number | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  tipoAccion: TipoAccionActividad;
  entidadTipo: string | null;
  entidadId: number | null;
  descripcion: string | null;
  ipAddress: string | null;
  fecha: string; // ISO 8601 LocalDateTime
  fueraHorario: boolean;
}

/** Configuración del horario laboral de la empresa. Format del backend. */
export interface HorarioLaboralDTO {
  horarioInicio: string; // "HH:mm:ss"
  horarioFin: string;
  diasLaborables: number; // bitmask: bit 0 = lunes ... bit 6 = domingo
}

/** Filtros para el endpoint GET /api/admin/actividad. */
export interface ActividadFilters {
  fechaDesde?: string;     // ISO LocalDateTime
  fechaHasta?: string;
  usuarioId?: number;
  tipoAccion?: TipoAccionActividad;
  fueraHorario?: boolean;
}
