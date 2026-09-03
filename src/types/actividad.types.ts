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
  | 'PRESTAMO_ELIMINADO'
  | 'AMORTIZACION_EJECUTADA'
  | 'AMORTIZACION_CONVERTIDA'
  | 'LEAD_CREADO'
  | 'LEADS_REASIGNADOS'
  | 'USUARIO_CREADO'
  | 'USUARIO_ELIMINADO'
  | 'USUARIO_ROL_CAMBIADO'
  | 'USUARIO_DESACTIVADO'
  | 'USUARIO_REACTIVADO'
  | 'PASSWORD_RESETEADA'
  | 'LIQUIDACION_FINAL_CREADA'
  | 'LIQUIDACION_FINAL_ACTUALIZADA'
  | 'LIQUIDACION_FINAL_ELIMINADA'
  | 'LIQUIDACION_FINAL_CONFIRMADA'
  | 'LIQUIDACION_FINAL_PAGADA'
  | 'LIQUIDACION_FINAL_ANULADA'
  | 'CONCEPTO_LIQUIDACION_CREADO'
  | 'CONCEPTO_LIQUIDACION_ACTUALIZADO'
  | 'CONCEPTO_LIQUIDACION_DESACTIVADO';

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
  LEAD_CREADO: 'Lead creado',
  LEADS_REASIGNADOS: 'Leads reasignados',
  PRESTAMO_ELIMINADO: 'Préstamo eliminado',
  USUARIO_CREADO: 'Usuario creado',
  USUARIO_ELIMINADO: 'Usuario eliminado',
  USUARIO_ROL_CAMBIADO: 'Rol de usuario cambiado',
  USUARIO_DESACTIVADO: 'Usuario desactivado',
  USUARIO_REACTIVADO: 'Usuario reactivado',
  PASSWORD_RESETEADA: 'Contraseña reseteada',
  LIQUIDACION_FINAL_CREADA: 'Liquidación final creada',
  LIQUIDACION_FINAL_ACTUALIZADA: 'Liquidación final actualizada',
  LIQUIDACION_FINAL_ELIMINADA: 'Liquidación final eliminada',
  LIQUIDACION_FINAL_CONFIRMADA: 'Liquidación final confirmada',
  LIQUIDACION_FINAL_PAGADA: 'Liquidación final pagada',
  LIQUIDACION_FINAL_ANULADA: 'Liquidación final anulada',
  CONCEPTO_LIQUIDACION_CREADO: 'Concepto de liquidación creado',
  CONCEPTO_LIQUIDACION_ACTUALIZADO: 'Concepto de liquidación actualizado',
  CONCEPTO_LIQUIDACION_DESACTIVADO: 'Concepto de liquidación desactivado',
};

/**
 * Familia visual para colorear el chip en la tabla. Mantiene la consistencia
 * con el resto del sistema (verde = monetario / éxito, rojo = anulación / fallo,
 * info = navegación / no destructivo).
 */
export type AccionFamilia = 'acceso' | 'documento' | 'pago' | 'anulacion' | 'fallo' | 'seguridad';

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
  LEAD_CREADO: 'documento',
  LEADS_REASIGNADOS: 'documento',
  PRESTAMO_ELIMINADO: 'anulacion',
  USUARIO_CREADO: 'seguridad',
  USUARIO_ELIMINADO: 'seguridad',
  USUARIO_ROL_CAMBIADO: 'seguridad',
  USUARIO_DESACTIVADO: 'seguridad',
  USUARIO_REACTIVADO: 'seguridad',
  PASSWORD_RESETEADA: 'seguridad',
  LIQUIDACION_FINAL_CREADA: 'documento',
  LIQUIDACION_FINAL_ACTUALIZADA: 'documento',
  LIQUIDACION_FINAL_ELIMINADA: 'anulacion',
  LIQUIDACION_FINAL_CONFIRMADA: 'documento',
  LIQUIDACION_FINAL_PAGADA: 'pago',
  LIQUIDACION_FINAL_ANULADA: 'anulacion',
  CONCEPTO_LIQUIDACION_CREADO: 'documento',
  CONCEPTO_LIQUIDACION_ACTUALIZADO: 'documento',
  CONCEPTO_LIQUIDACION_DESACTIVADO: 'anulacion',
};

/**
 * Etiqueta del grupo (módulo) para el dropdown de tipos. Claves = valores de
 * `enums/Modulo` del backend; `Record<string,...>` a propósito para tolerar un
 * módulo nuevo (cae al valor crudo en la UI).
 */
export const MODULO_LABELS: Record<string, string> = {
  DASHBOARD: 'Acceso / General',
  VENTAS: 'Ventas',
  CLIENTES: 'Clientes / Cobranzas',
  PROVEEDORES: 'Proveedores',
  LOGISTICA: 'Logística',
  TALLER: 'Taller',
  PRODUCCION: 'Producción',
  GARANTIAS: 'Garantías',
  RRHH: 'RRHH',
  ADMINISTRACION: 'Administración',
};

/** Item de GET /api/admin/actividad/tipos: valor del enum + su módulo. */
export interface TipoAccionMeta {
  /** Puede ser un valor que este front todavía no conoce (el backend agrega tipos sin migración). */
  value: string;
  categoria: string; // Modulo
}

/**
 * Lookups tolerantes: un tipo/categoría que el backend agregó y el front aún no
 * conoce NO rompe el render — cae al valor crudo (label) o color neutro (familia).
 */
export const labelForTipo = (t: string): string =>
  TIPO_ACCION_LABELS[t as TipoAccionActividad] ?? t;

export const familiaForTipo = (t: string): AccionFamilia | undefined =>
  TIPO_ACCION_FAMILIA[t as TipoAccionActividad];

export interface RegistroActividadDTO {
  id: number;
  empresaId: number | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  tipoAccion: TipoAccionActividad;
  entidadTipo: string | null;
  entidadId: number | null;
  descripcion: string | null;
  /** Metadata estructurada opcional (JSON crudo): {monto, estadoAnterior, ...}. */
  detalle: string | null;
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
  tipoAccion?: string; // un value de TipoAccionMeta (tolerante a tipos nuevos)
  fueraHorario?: boolean;
}
