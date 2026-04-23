import type { EstadoCajaAhorro } from './cajasAhorro.types';

export type TipoMovimientoCajaPesos =
  | 'DEPOSITO'
  | 'EXTRACCION'
  | 'AJUSTE'
  | 'CONVERSION_AMORTIZACION';

export interface CajaPesos {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  descripcion: string | null;
  saldoActual: number;
  estado: EstadoCajaAhorro;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateCajaPesosDTO {
  nombre: string;
  descripcion?: string;
  sucursalId?: number;
}

export interface MovimientoCajaPesos {
  id: number;
  cajaPesosId: number;
  cajaPesosNombre: string;
  tipo: TipoMovimientoCajaPesos;
  monto: number;
  amortizacionMensualId: number | null;
  conversionId: number | null;
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
