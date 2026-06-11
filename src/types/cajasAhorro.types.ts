import type { MetodoPago } from './prestamo.types';

export type EstadoCajaAhorro = 'ACTIVA' | 'INACTIVA';
export type TipoMovimientoCaja =
  | 'DEPOSITO'
  | 'EXTRACCION'
  | 'CONVERSION_AMORTIZACION'
  | 'TRANSFERENCIA_EGRESO'
  | 'TRANSFERENCIA_INGRESO';

import type { CajaMetodoPagoConfig } from './cajasPesos.types';
export type { CajaMetodoPagoConfig };

export interface CajaAhorroDolares {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  descripcion: string | null;
  saldoActual: number;
  estado: EstadoCajaAhorro;
  metodosAceptados: CajaMetodoPagoConfig[];
  metodoPagoPrincipal: MetodoPago | null;
  tieneMetodoDefault: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateCajaAhorroDolaresDTO {
  nombre: string;
  descripcion?: string;
  sucursalId?: number;
  metodosAceptados?: CajaMetodoPagoConfig[];
}

export interface MovimientoCajaAhorro {
  id: number;
  cajaAhorroId: number;
  cajaAhorroNombre: string;
  tipo: TipoMovimientoCaja;
  montoUsd: number;
  montoPesosOriginal: number | null;
  valorDolar: number;
  amortizacionMensualId: number | null;
  transferenciaId: number | null;
  descripcion: string | null;
  fecha: string;
  usuarioId: number | null;
  fechaCreacion: string;
}

export interface DepositoExtraCajaDTO {
  montoUsd: number;
  valorDolar: number;
  fecha: string;
  descripcion?: string;
}

export interface TransferenciaCajaAhorroRequestDTO {
  cajaOrigenId: number;
  cajaDestinoId: number;
  montoUsd: number;
  descripcion?: string;
  fecha?: string;
}

export interface TransferenciaCajaAhorroResponseDTO {
  transferenciaId: number;
  cajaOrigenId: number;
  cajaOrigenNombre: string;
  cajaOrigenSaldoPost: number;
  cajaDestinoId: number;
  cajaDestinoNombre: string;
  cajaDestinoSaldoPost: number;
  montoUsd: number;
  descripcion: string | null;
  fecha: string;
  fechaCreacion: string;
  movimientoEgresoId: number;
  movimientoIngresoId: number;
}

export interface DisponibleConversionDTO {
  amortizacionMensualId: number;
  activoId: number;
  activoNombre: string | null;
  anio: number;
  mes: number;
  montoAmortizadoPesos: number;
  montoPesosYaConvertido: number;
  montoPesosDisponible: number;
  valorDolarSugerido: number | null;
}
