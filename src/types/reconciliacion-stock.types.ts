// Reconciliación de stock V2: ajustes por depósito, diferencias, aprobaciones.

export type EstadoReconciliacionType = 
  | 'EN_PROCESO'            // Reconciliación en proceso de ajuste
  | 'PENDIENTE_APROBACION'  // Esperando aprobación
  | 'APROBADA'              // Reconciliación completada y aplicada
  | 'CANCELADA';            // Reconciliación cancelada

// DTO para iniciar reconciliación
export interface IniciarReconciliacionDTO {
  periodo: string; // Formato: "Enero 2024" o "YYYY-MM"
  observaciones?: string;
}

// DTO básico de reconciliación
export interface ReconciliacionStockDTO {
  id: number;
  empresaId: number;
  codigoReconciliacion: string;
  periodo: string;
  fechaInicio: string;
  fechaFinalizacion?: string;
  estado: EstadoReconciliacionType;
  observaciones?: string;
  totalProductosRevisados?: number;
  totalDiferenciasEncontradas?: number;
  totalAjustesAplicados?: number;
}

// DTO detallado de reconciliación (incluye ajustes)
export interface ReconciliacionDetalladaDTO extends ReconciliacionStockDTO {
  ajustes?: AjusteStockDepositoDTO[];           // Campo legacy
  ajustesDepositos?: AjusteStockDepositoDTO[];  // Campo real del backend
  detalles?: ReconciliacionDetalleProductoDTO[];
  diferencias?: DiferenciaProductoDTO[];
  usuarioInicioId?: number;
  usuarioInicioNombre?: string;
  usuarioAprobacionId?: number;
  usuarioAprobacionNombre?: string;
}

// DTO de detalle de producto en reconciliación
export interface ReconciliacionDetalleProductoDTO {
  id: number;
  reconciliacionId: number;
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  stockInicialSistema?: number;
  stockFinalSistema?: number;
  cantidadContada?: number;
  diferencia?: number;
  ajustado?: boolean;
}

// DTO para registrar ajuste de stock por depósito
export interface AjusteStockDepositoRequestDTO {
  productoId: number;
  depositoId: number;
  cantidadFisicaContada: number;
  tipoAjuste?: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'SIN_CAMBIO';
  motivo?: string;
  observaciones?: string;
}

// DTO de respuesta de ajuste de stock
export interface AjusteStockDepositoDTO {
  id: number;
  reconciliacionId: number;
  reconciliacionCodigo?: string;
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  depositoId: number;
  depositoNombre: string;
  cantidadAnterior: number;
  cantidadFisicaContada: number;
  diferencia: number;
  tipoAjuste?: string;
  usuarioAjusteId?: number;
  usuarioAjusteNombre?: string;
  fechaAjuste: string;
  observaciones?: string;
  motivo?: string;
  empresaId?: number;
}

// Tipo de diferencia
export type TipoDiferenciaType = 'SOBRANTE' | 'FALTANTE' | 'SIN_DIFERENCIA';

// DTO de detalle de diferencia por depósito
export interface DetalleDiferenciaDepositoDTO {
  depositoId: number;
  depositoNombre: string;
  stockSistema: number;
  cantidadContada: number | null;
  diferencia: number | null;
  ajusteRegistrado: boolean;
}

// DTO de diferencia por producto (respuesta real del backend)
export interface DiferenciaProductoDTO {
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  stockGeneralInicial: number;      // Stock en Producto.stockActual
  sumaDepositosInicial: number;     // Suma de todos los depósitos al iniciar
  sumaDepositosAjustada: number;    // Suma después de ajustes
  diferencia: number;               // sumaDepositosAjustada - stockGeneralInicial
  tipoDiferencia: TipoDiferenciaType;
  detallesPorDeposito: DetalleDiferenciaDepositoDTO[];
}

// DTO de diferencias completo (respuesta real del backend)
export interface ReconciliacionDiferenciasDTO {
  reconciliacionId: number;
  codigoReconciliacion: string;
  periodo: string;
  totalProductos: number;
  productosConDiferencias: number;
  productosSinDiferencias: number;
  totalDiferenciaPositiva: number;  // Sobrante total
  totalDiferenciaNegativa: number;  // Faltante total
  totalDiferenciaAbsoluta: number;
  diferencias: DiferenciaProductoDTO[];
}

// DTO para aprobar reconciliación (request)
export interface AprobacionReconciliacionDTO {
  aplicarAjustes?: boolean;  // Por defecto true
  observaciones?: string;
}

// DTO de respuesta de aprobación
export interface ReconciliacionAprobacionDTO {
  reconciliacionId: number;
  codigoReconciliacion?: string;
  fechaAprobacion: string;
  usuarioAprobacionNombre?: string;
  totalAjustesAplicados?: number;
  productosAjustados?: number;
  ajustesAplicadosAlStock: boolean;  // Indica si se aplicaron ajustes al stock
  mensaje: string;
}

// DTO para cancelar reconciliación
export interface CancelarReconciliacionDTO {
  motivo: string;
}

// DTO para distribución manual de compra
export interface DistribucionManualDTO {
  depositos: DistribucionDepositoDTO[];
  observaciones?: string;
}

export interface DistribucionDepositoDTO {
  depositoId: number;
  detalles: DistribucionDetalleDTO[];
}

export interface DistribucionDetalleDTO {
  productoId: number;
  cantidad: number;
}
