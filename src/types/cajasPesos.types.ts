import type { EstadoCajaAhorro } from './cajasAhorro.types';
import type { MetodoPago } from './prestamo.types';

export type TipoMovimientoCajaPesos =
  | 'DEPOSITO'
  | 'EXTRACCION'
  | 'AJUSTE'
  | 'CONVERSION_AMORTIZACION'
  | 'TRANSFERENCIA_EGRESO'
  | 'TRANSFERENCIA_INGRESO';

export interface CajaPesos {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  descripcion: string | null;
  saldoActual: number;
  estado: EstadoCajaAhorro;
  metodoPagoDefault: MetodoPago | null;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateCajaPesosDTO {
  nombre: string;
  descripcion?: string;
  sucursalId?: number;
  metodoPagoDefault?: MetodoPago | null;
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
