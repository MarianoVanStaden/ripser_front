export type TipoActivoAmortizable =
  | 'VEHICULO'
  | 'HERRAMIENTAS'
  | 'INFRAESTRUCTURA'
  | 'MATERIA_PRIMA'
  | 'AGUINALDOS'
  | 'DESEMPLEO'
  | 'OTRO';

export type MetodoAmortizacion =
  | 'PORCENTAJE_FIJO'
  | 'POR_KILOMETROS'
  | 'MONTO_FIJO_MENSUAL';

export interface ActivoAmortizableDTO {
  id: number;
  empresaId: number;
  sucursalId: number | null;
  nombre: string;
  tipo: TipoActivoAmortizable;
  metodo: MetodoAmortizacion;
  tasaMensual: number | null;
  montoFijoMensual: number | null;
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
