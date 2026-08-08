export type TipoActivoAmortizable =
  | 'VEHICULO'
  | 'HERRAMIENTAS'
  | 'INFRAESTRUCTURA'
  | 'MATERIA_PRIMA'
  | 'AGUINALDOS'
  | 'DESEMPLEO'
  | 'MAQUINARIA'
  | 'OTRO';

export type MetodoAmortizacion =
  | 'PORCENTAJE_FIJO'
  | 'POR_KILOMETROS'
  | 'MONTO_FIJO_MENSUAL'
  | 'SIN_AMORTIZACION';

export interface ActivoAmortizableDTO {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  tipo: TipoActivoAmortizable;
  metodo: MetodoAmortizacion;
  tasaMensual: number | null;
  montoFijoMensual: number | null;
  costoPorKmUsd?: number | null;
  vidaUtilKm: number | null;
  valorInicial: number;
  fechaAdquisicion: string;
  activo: boolean;
  vehiculoId: number | null;
  vehiculoPatente: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateActivoAmortizableDTO {
  nombre: string;
  tipo: TipoActivoAmortizable;
  metodo: MetodoAmortizacion;
  tasaMensual?: number | null;
  montoFijoMensual?: number | null;
  vidaUtilKm?: number | null;
  valorInicial: number;
  fechaAdquisicion: string;
  sucursalId?: number | null;
  vehiculoId?: number | null;
}

export interface AmortizacionMensualDTO {
  id: number;
  empresaId: number;
  activoId: number;
  activoNombre: string;
  activoTipo: TipoActivoAmortizable;
  anio: number;
  mes: number;
  montoAmortizadoPesos: number;
  montoAmortizadoDolares: number;
  fondoAcumuladoPesos: number;
  kmRecorridos: number | null;
  valorDolar: number;
  comprasPesos: number;
  fechaCreacion: string;
  ejecutadaAt?: string | null;
  cajaDestinoId?: number | null;
}

export interface ResumenAmortizacionAnualDTO {
  anio: number;
  empresaId: number;
  totalPesos: number;
  totalDolares: number;
  detalle: AmortizacionMensualDTO[];
}

export interface RegistrarAmortizacionDTO {
  valorDolar: number;
  kmRecorridos?: number | null;
  comprasPesos?: number;
}

export interface ProcesarCierreMensualDTO {
  anio: number;
  mes: number;
  flujoCajaMensual: number;
  valorDolar: number;
  kmPorActivo?: Record<string, number>;
}

export interface RegistroCierreMensualDTO {
  id: number;
  activoId: number;
  activoNombre: string;
  activoTipo: TipoActivoAmortizable;
  anio: number;
  mes: number;
  montoAmortizadoPesos: number;
  montoAmortizadoDolares: number;
  fondoAcumuladoPesos: number;
  kmRecorridos: number | null;
  valorDolar: number;
}

export interface ResultadoCierreMensualDTO {
  empresaId: number;
  anio: number;
  mes: number;
  flujoCajaMensual: number;
  valorDolar: number;
  totalAmortizadoPesos: number;
  totalAmortizadoDolares: number;
  porcentajeTotalDelFlujo: number;
  flujoDisponiblePesos: number;
  registros: RegistroCierreMensualDTO[];
  advertencias: string[];
}

export type TipoCajaOrigen = 'USD' | 'PESOS';

export interface OrigenFondoDTO {
  cajaId: number;
  /** Monto en la moneda de la caja: USD para tipoCaja USD, pesos para PESOS. */
  monto: number;
  /** Omitido = USD (retrocompatible). */
  tipoCaja?: TipoCajaOrigen;
}

export interface EjecutarAmortizacionRequest {
  destinoCajaId: number;
  origenes: OrigenFondoDTO[];
}

export interface OrigenEjecutadoDTO {
  cajaId: number;
  cajaNombre: string;
  /** Aporte en USD (para orígenes en pesos, el equivalente convertido). */
  monto: number;
  movimientoSalidaId: number;
  tipoCaja?: TipoCajaOrigen;
  /** Solo orígenes en pesos: monto retirado en pesos. */
  montoPesos?: number | null;
}

export interface AmortizacionEjecucionResponse {
  amortizacionId: number;
  destinoCajaId: number;
  montoTotalUsd: number;
  ejecutadaAt: string;
  origenes: OrigenEjecutadoDTO[];
}

export interface OrigenConversionItemDTO {
  cajaId: number;
  monto: number;
}

export interface ConvertirAmortizacionMultiDTO {
  montoPesosTotal: number;
  tipoCambio: number;
  destinoCajaUsdId: number;
  origenes: OrigenConversionItemDTO[];
  descripcion?: string;
}

export interface OrigenEjecutadoPesosDTO {
  cajaId: number;
  cajaNombre: string;
  monto: number;
  movimientoEgresoPesosId: number;
}

export interface ConversionAmortizacionResponseDTO {
  conversionId: number;
  amortizacionMensualId: number;
  destinoCajaUsdId: number;
  destinoCajaUsdNombre: string;
  montoPesosTotal: number;
  tipoCambio: number;
  montoUsd: number;
  fecha: string;
  fechaCreacion: string;
  origenes: OrigenEjecutadoPesosDTO[];
}
