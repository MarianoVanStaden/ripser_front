import type { MetodoPago } from './prestamo.types';

export type EstadoCajaAhorro = 'ACTIVA' | 'INACTIVA';
export type TipoMovimientoCaja = 'DEPOSITO' | 'EXTRACCION' | 'CONVERSION_AMORTIZACION';

export interface CajaAhorroDolares {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  descripcion: string | null;
  saldoActual: number;
  estado: EstadoCajaAhorro;
  metodoPago: MetodoPago | null;
  esDefault: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CreateCajaAhorroDolaresDTO {
  nombre: string;
  descripcion?: string;
  sucursalId?: number;
  metodoPago?: MetodoPago | null;
  esDefault?: boolean;
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
