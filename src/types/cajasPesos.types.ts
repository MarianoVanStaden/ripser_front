import type { EstadoCajaAhorro } from './cajasAhorro.types';
import type { MetodoPago } from './prestamo.types';

export type TipoMovimientoCajaPesos =
  | 'DEPOSITO'
  | 'EXTRACCION'
  | 'AJUSTE'
  | 'CONVERSION_AMORTIZACION'
  | 'TRANSFERENCIA_EGRESO'
  | 'TRANSFERENCIA_INGRESO';

export interface CajaMetodoPagoConfig {
  metodoPago: MetodoPago;
  esDefault: boolean;
}

/**
 * Clasifica la caja: OPERATIVA = efectivo/banco real (suma al efectivo
 * disponible); CREDITO = cuenta de financiamiento que vive en negativo
 * (deuda) y se reporta aparte del efectivo operativo.
 */
export type TipoCajaPesos = 'OPERATIVA' | 'CREDITO';

export interface CajaPesos {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  descripcion: string | null;
  saldoActual: number;
  estado: EstadoCajaAhorro;
  /** OPERATIVA (efectivo/banco) o CREDITO (financiamiento/deuda). */
  tipo: TipoCajaPesos;
  /** Métodos que acepta esta caja con sus flags de default. */
  metodosAceptados: CajaMetodoPagoConfig[];
  /** Derivado del back: primer método marcado como default, o null. */
  metodoPagoPrincipal: MetodoPago | null;
  /** Derivado del back: true si algún método aceptado es default. */
  tieneMetodoDefault: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateCajaPesosDTO {
  nombre: string;
  descripcion?: string;
  sucursalId?: number;
  /** Default OPERATIVA si se omite. Inmutable: solo se setea al crear. */
  tipo?: TipoCajaPesos;
  metodosAceptados?: CajaMetodoPagoConfig[];
}

export interface MovimientoCajaPesos {
  id: number;
  cajaPesosId: number;
  cajaPesosNombre: string;
  tipo: TipoMovimientoCajaPesos;
  monto: number;
  amortizacionMensualId: number | null;
  conversionId: number | null;
  transferenciaId: number | null;
  descripcion: string | null;
  fecha: string;
  usuarioId: number | null;
  fechaCreacion: string;
}

export interface DepositoExtraccionCajaPesosDTO {
  monto: number;
  fecha: string;
  descripcion?: string;
}

export interface CorreccionCajaPesosDTO {
  saldoObjetivo: number;
  motivo: string;
}

export interface TransferenciaCajaPesosRequestDTO {
  cajaOrigenId: number;
  cajaDestinoId: number;
  monto: number;
  descripcion?: string;
  fecha?: string;
}

export interface TransferenciaCajaPesosResponseDTO {
  transferenciaId: number;
  cajaOrigenId: number;
  cajaOrigenNombre: string;
  cajaOrigenSaldoPost: number;
  cajaDestinoId: number;
  cajaDestinoNombre: string;
  cajaDestinoSaldoPost: number;
  monto: number;
  descripcion: string | null;
  fecha: string;
  fechaCreacion: string;
  movimientoEgresoId: number;
  movimientoIngresoId: number;
}
