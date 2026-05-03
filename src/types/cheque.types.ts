// Bancos, cuentas bancarias, cheques (propios y de terceros), endosos.

export interface Banco {
  id: number;
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  activo: boolean;
  fechaAlta: string;
  fechaActualizacion?: string;
}

// DTO para crear/actualizar bancos - Coincide con CreateBancoDTO del backend
export interface BancoCreateDTO {
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  activo?: boolean;
}

// ==================== CUENTAS BANCARIAS ====================

export interface CuentaBancaria {
  id: number;
  empresaId: number;
  bancoId: number;
  bancoNombre: string;
  cbu?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  alias?: string;
  observaciones?: string;
  activo: boolean;
  creadoPorId?: number;
  modificadoPorId?: number;
  fechaAlta: string;
  fechaActualizacion?: string;
  fechaBaja?: string;
}

export interface CuentaBancariaCreateDTO {
  bancoId: number;
  cbu?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  alias?: string;
  observaciones?: string;
  activo?: boolean;
}
export type TipoChequeType = 'PROPIO' | 'TERCEROS';

// Estado del cheque (Backend: EstadoCheque enum)
export type EstadoChequeType =
  | 'RECIBIDO'      // Cheque recibido
  | 'EN_CARTERA'    // Cheque en cartera, pendiente de cobro
  | 'DEPOSITADO'    // Cheque depositado en banco
  | 'COBRADO'       // Cheque cobrado exitosamente
  | 'RECHAZADO'     // Cheque rechazado
  | 'ANULADO';      // Cheque anulado

// Entidad Cheque - Coincide con ChequeDTO del backend
export interface Cheque {
  id: number;
  empresaId: number;
  sucursalId?: number;

  // Información del cheque
  numeroCheque: string;
  bancoId: number;  // Relación con Banco
  bancoNombre?: string;  // Nombre del banco desde el DTO
  titular: string;
  cuitTitular?: string;
  monto: number;
  fechaEmision: string;
  fechaCobro: string;
  fechaDeposito?: string;
  fechaCobrado?: string;
  fechaRechazo?: string;

  // Estado y tipo
  estado: EstadoChequeType;
  tipo: TipoChequeType;

  // Relaciones (solo IDs y nombres)
  clienteId?: number;
  clienteNombre?: string;
  proveedorId?: number;
  proveedorNombre?: string;

  // Información adicional
  observaciones?: string;
  motivoRechazo?: string;
  numeroCuenta?: string;
  cbu?: string;
  endosado?: boolean;
  endosadoA?: string;
  esEcheq?: boolean;

  // Auditoría
  creadoPorId?: number;
  creadoPorNombre?: string;
  modificadoPorId?: number;
  fechaAlta?: string;
  fechaActualizacion?: string;
  fechaBaja?: string;

  // Información calculada (del backend)
  vencido?: boolean;
  puedeDepositarse?: boolean;
  puedeCobrarse?: boolean;
  diasParaCobro?: number;
}

// DTO para crear cheques (coincide con CreateChequeDTO del backend)
export interface ChequeCreateDTO {
  numeroCheque: string;
  bancoId: number;  // Relación con Banco
  titular: string;
  cuitTitular?: string;
  monto: number;
  fechaEmision: string;  // LocalDate format: YYYY-MM-DD
  fechaCobro: string;    // LocalDate format: YYYY-MM-DD
  estado: EstadoChequeType;
  tipo: TipoChequeType;
  clienteId?: number;
  proveedorId?: number;
  sucursalId?: number;
  observaciones?: string;
  numeroCuenta?: string;
  cbu?: string;
  endosado?: boolean;
  endosadoA?: string;
  esEcheq?: boolean;
}

// DTO para actualizar cheques (coincide con UpdateChequeDTO del backend)
export interface ChequeUpdateDTO {
  numeroCheque: string;
  bancoId: number;  // Relación con Banco
  titular: string;
  cuitTitular?: string;
  monto: number;
  fechaEmision: string;
  fechaCobro: string;
  clienteId?: number;
  proveedorId?: number;
  sucursalId?: number;
  observaciones?: string;
  numeroCuenta?: string;
  cbu?: string;
  endosado?: boolean;
  endosadoA?: string;
  esEcheq?: boolean;
}

// DTO para cambio de estado (coincide con CambioEstadoChequeDTO del backend)
export interface CambioEstadoChequeDTO {
  nuevoEstado: EstadoChequeType;
  motivo?: string;
  observaciones?: string;
  fechaDeposito?: string;
  fechaCobrado?: string;
  fechaRechazo?: string;
  motivoRechazo?: string;
}

// DTO para historial de cambios de estado
export interface HistorialEstadoChequeDTO {
  id: number;
  chequeId: number;
  estadoAnterior: EstadoChequeType;
  estadoNuevo: EstadoChequeType;
  motivo?: string;
  observaciones?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  fechaCambio: string;
}

// Parámetros de filtro para el endpoint principal GET /api/cheques/buscar
export interface ChequeFilterParams {
  search?: string;       // Texto libre: numeroCheque, titular, banco, cliente, proveedor
  tipo?: TipoChequeType;
  estado?: EstadoChequeType;
}

// Resumen estadístico de cheques
export interface ChequeEstadoResumenItem {
  cantidad: number;
  monto: number;
}

export interface ChequeResumenDTO {
  total: number;
  propios: number;
  terceros: number;
  porEstado: Record<string, ChequeEstadoResumenItem>;
  montoTotal: number;
  montoEnCartera: number;
}

// ==================== ENDORSEMENT TYPES ====================

export interface EndosoChequeCreateDTO {
  chequeId: number;
  proveedorDestinoId: number;
  observaciones?: string;
}

export interface EndosoChequeDTO {
  id: number;
  chequeId: number;
  chequeNumero: string;
  chequeMonto: number;
  proveedorOrigenId?: number;
  proveedorOrigenNombre?: string;
  proveedorDestinoId: number;
  proveedorDestinoNombre: string;
  fechaEndoso: string;
  observaciones?: string;
  nivel: number;
  usuarioId?: number;
  usuarioNombre?: string;
}

export interface CadenaEndososDTO {
  chequeId: number;
  chequeNumero: string;
  chequeMonto: number;
  clienteOrigenNombre?: string;
  totalEndosos: number;
  endosos: EndosoChequeDTO[];
}

export interface ChequeDisponibleEndosoDTO {
  id: number;
  numeroCheque: string;
  bancoNombre: string;
  monto: number;
  fechaCobro: string;
  clienteNombre?: string;
  estado: EstadoChequeType;
  diasParaCobro?: number;
}
export interface ChequeEstadoResumenDTO {
  cantidad: number;
  monto: number;
}

// Resumen completo de cheques del backend
export interface ResumenChequesDTO {
  enCartera: ChequeEstadoResumenDTO;
  depositados: ChequeEstadoResumenDTO;
  cobrados: ChequeEstadoResumenDTO;
  rechazados: ChequeEstadoResumenDTO;
  porVencer7Dias: ChequeEstadoResumenDTO;
  emitidos: ChequeEstadoResumenDTO;
  anulados: ChequeEstadoResumenDTO;
  totalEnCartera: number;
  totalPorCobrar: number;
  chequesVencidos: number;
}

// Agregación de estados de cheques (para compatibilidad frontend)
export interface ChequeStatusAggregation {
  estado: EstadoChequeType;
  cantidad: number;
  montoTotal: number;
}

