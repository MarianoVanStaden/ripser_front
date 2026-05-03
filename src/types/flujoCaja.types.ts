import type { MetodoPago } from './venta.types';
import type { EstadoChequeType, ChequeStatusAggregation, ResumenChequesDTO } from './cheque.types';
// Flujo de caja: movimientos enriquecidos, KPIs, agregaciones por método de pago.

export type OrigenMovimiento = 'CLIENTE' | 'PROVEEDOR' | 'GASTO_EXTRA' | 'COBRO_EXTRA';

// Categorías de gastos extras (must match backend enum)
export type CategoriaGastoExtra =
  | 'VIATICOS'
  | 'REPARACION_VEHICULO'
  | 'SERVICE_MANTENIMIENTO'
  | 'GASTOS_OPERATIVOS'
  | 'SUELDOS_SALARIOS'
  | 'SERVICIOS_PUBLICOS'
  | 'ALQUILER'
  | 'IMPUESTOS'
  | 'HONORARIOS_PROFESIONALES'
  | 'SEGUROS'
  | 'PUBLICIDAD_MARKETING'
  | 'GASTOS_BANCARIOS'
  | 'OTROS';

// Categorías de cobros extras (must match backend enum)
export type CategoriaCobroExtra =
  | 'COBRO_MANUAL'
  | 'AJUSTE_POSITIVO'
  | 'INGRESO_EXTRAORDINARIO'
  | 'VENTA_ACTIVO'
  | 'REEMBOLSO'
  | 'INTERESES_GANADOS'
  | 'SUBSIDIO'
  | 'DONACION'
  | 'OTROS';

// Estado del movimiento
export type EstadoMovimiento = 'ACTIVO' | 'ANULADO';

// Movimiento de flujo de caja con información mejorada
export interface FlujoCajaMovimientoEnhanced {
  id: number;
  fecha: string;
  tipo: 'INGRESO' | 'EGRESO';
  origen: OrigenMovimiento; // ACTUALIZADO para soportar movimientos extras
  entidad: string;
  concepto: string;
  importe: number;
  numeroComprobante?: string;

  // Campos mejorados (cheques)
  metodoPago?: MetodoPago | null;
  chequeId?: number | null;
  chequeNumero?: string | null;
  chequeEstado?: EstadoChequeType | null;
  chequeFechaCobro?: string | null;
  documentoComercialId?: number;

  // Nuevos campos para movimientos extras
  categoriaGasto?: CategoriaGastoExtra | null;
  categoriaCobro?: CategoriaCobroExtra | null;
  responsableNombre?: string | null;
  estado?: EstadoMovimiento;
  observaciones?: string | null;
  movimientoExtraId?: number | null; // Referencia a la entidad MovimientoExtra
  liquidacionTarjetaId?: number | null; // Si es comisión de liquidación tarjeta, FK a esa liquidación

  // Audit fields (para movimientos extras) - matching backend naming
  fechaCreacion?: string; // ISO datetime string from backend
  fechaActualizacion?: string; // ISO datetime string from backend
  createdAt?: string; // Alias for fechaCreacion (for backward compatibility)
  updatedAt?: string; // Alias for fechaActualizacion (for backward compatibility)
}

// Saldo por método de pago (del backend)
export interface SaldoPorMetodoPagoDTO {
  metodoPago: MetodoPago;
  ingresos: number;
  egresos: number;
  saldo: number;
  porcentaje: number;
  cantidadMovimientos: number;
}

// Agregación de datos por método de pago (para compatibilidad frontend)
export interface PaymentMethodAggregation {
  metodoPago: MetodoPago;
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  cantidadMovimientos: number;
  porcentajeDelTotal: number;
}
export interface EvolucionDiariaDTO {
  fecha: string;
  ingresos: number;
  egresos: number;
  saldo: number;
}

// Datos de evolución temporal (para compatibilidad frontend)
export interface TimeSeriesData {
  fecha: string; // YYYY-MM-DD
  ingresos: number;
  egresos: number;
  flujoNeto: number;
}

// Respuesta mejorada del endpoint de flujo de caja (del backend)
export interface FlujoCajaResponseEnhanced {
  // Datos básicos
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  totalMovimientos: number;
  fechaCorte?: string;
  movimientos: FlujoCajaMovimientoEnhanced[];

  // Datos del backend mejorado
  saldosPorMetodoPago?: SaldoPorMetodoPagoDTO[];
  resumenCheques?: ResumenChequesDTO;
  evolucionDiaria?: EvolucionDiariaDTO[];

  // Campos legacy para compatibilidad
  desglosePorMetodoPago?: PaymentMethodAggregation[];
  desgloseCheques?: ChequeStatusAggregation[];
  evolucionTemporal?: TimeSeriesData[];
}

// KPIs calculados del flujo de caja
export interface FlujoCajaKPIs {
  // Básicos
  totalIngresos: number;
  totalEgresos: number;
  flujoNeto: number;
  totalMovimientos: number;

  // Avanzados
  ticketPromedio: number;
  medianaTransaccion: number;
  mayorIngreso: {
    importe: number;
    entidad: string;
    metodoPago?: MetodoPago;
    fecha: string;
  };
  mayorEgreso: {
    importe: number;
    entidad: string;
    metodoPago?: MetodoPago;
    fecha: string;
  };

  // Análisis por método de pago
  metodoPagoMasUsado: {
    metodo: MetodoPago;
    cantidad: number;
    porcentaje: number;
  };

  // Análisis temporal
  tendenciaSemanal?: number; // % change from previous week
  promedioIngresoDiario: number;
  promedioEgresoDiario: number;

  // Cheques (del resumen de backend)
  chequesEnCartera?: {
    cantidad: number;
    monto: number;
  };
  chequesVencidos?: {
    cantidad: number;
    monto: number;
  };
  chequesPorVencer7Dias?: {
    cantidad: number;
    monto: number;
  };
}
// ==================== MOVIMIENTOS EXTRAS ====================

// Tipo de movimiento para el backend (diferente al usado en UI)
// CREDITO = Ingreso/Cobro Extra
// DEBITO = Egreso/Gasto Extra
export type TipoMovimientoBackend = 'CREDITO' | 'DEBITO';

// DTO para crear movimiento extra (estructura que espera el backend)
export interface CreateMovimientoExtraDTO {
  sucursalId?: number;
  tipo: TipoMovimientoBackend; // CREDITO = ingreso, DEBITO = egreso
  categoriaGasto?: CategoriaGastoExtra;
  categoriaCobro?: CategoriaCobroExtra;
  descripcion: string;
  monto: number; // Backend espera 'monto', no 'importe'
  fecha: string; // YYYY-MM-DD
  metodoPago: MetodoPago;
  numeroComprobante?: string;
  vehiculoId?: number;
  empleadoId?: number;
  clienteId?: number;
  proveedorId?: number;
  chequeId?: number;
  observaciones?: string;
  cajaPesosId?: number | null;
  cajaAhorroId?: number | null;
}

// DTO para actualizar movimiento extra
export interface UpdateMovimientoExtraDTO extends Partial<CreateMovimientoExtraDTO> {
  id: number;
}

// Respuesta de categorías disponibles
export interface CategoriasDisponiblesDTO {
  gastosExtras: CategoriaGastoExtra[];
  cobrosExtras: CategoriaCobroExtra[];
}
