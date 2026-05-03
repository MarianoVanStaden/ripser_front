import type { DetalleCompraDTO } from './compra.types';
import type { TipoEquipo } from './fabricacion.types';
// Depósitos, ubicaciones, movimientos por depósito, transferencias, auditoría, recepciones.

export interface Deposito {
  id: number;
  empresaId: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  descripcion?: string;
  activo: boolean;
  esPrincipal: boolean;
  sucursalId?: number;
  sucursalNombre?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface DepositoCreateDTO {
  codigo: string;
  nombre: string;
  direccion?: string;
  descripcion?: string;
  sucursalId?: number;
  esPrincipal?: boolean;
}

// Stock por Depósito
export interface StockDeposito {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  depositoId: number;
  depositoNombre: string;
  cantidad: number;
  stockMinimo: number;
  stockMaximo?: number;
  bajoMinimo: boolean;
  sobreMaximo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface StockDepositoCreateDTO {
  productoId: number;
  depositoId: number;
  cantidad: number;
  stockMinimo?: number;
  stockMaximo?: number;
}
// Ubicación de Equipos Fabricados
export interface UbicacionEquipo {
  id: number;
  equipoFabricadoId: number;
  equipoNumeroHeladera: string;
  equipoModelo: string;
  equipoTipo: TipoEquipo;
  depositoId: number;
  depositoNombre: string;
  ubicacionInterna?: string;
  observaciones?: string;
  fechaIngreso: string;
  fechaActualizacion: string;
  usuarioRegistroId?: number;
  usuarioRegistroNombre?: string;
}

export interface UbicacionEquipoCreateDTO {
  equipoFabricadoId: number;
  depositoId: number;
  ubicacionInterna?: string;
  observaciones?: string;
  usuarioRegistroId?: number;
}

// Movimientos de Stock entre Depósitos (Auditoría)
export type TipoMovimientoStockDeposito = 'INGRESO' | 'EGRESO' | 'TRANSFERENCIA' | 'AJUSTE' | 'CONSUMO';
export interface MovimientoStockDeposito {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  depositoOrigenId?: number;
  depositoOrigenNombre?: string;
  depositoDestinoId?: number;
  depositoDestinoNombre?: string;
  cantidad: number;
  tipoMovimiento: TipoMovimientoStockDeposito;
  motivo?: string;
  observaciones?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  fechaMovimiento: string;
  documentoReferencia?: string;
}

// Movimientos de Equipos entre Depósitos (Auditoría)
export type TipoMovimientoEquipo = 'INGRESO_INICIAL' | 'TRASLADO' | 'SALIDA_ENTREGA' | 'SALIDA_BAJA' | 'RETORNO';

export interface MovimientoEquipo {
  id: number;
  equipoFabricadoId: number;
  equipoNumeroHeladera: string;
  equipoModelo: string;
  equipoTipo: TipoEquipo;
  depositoOrigenId?: number;
  depositoOrigenNombre?: string;
  depositoDestinoId?: number;
  depositoDestinoNombre?: string;
  tipoMovimiento: TipoMovimientoEquipo;
  motivo?: string;
  observaciones?: string;
  ubicacionInterna?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  fechaMovimiento: string;
  documentoReferencia?: string;
}
export interface DistribucionDepositoItem {
  depositoId: number;
  depositoNombre?: string;
  cantidad: number;
  recibido?: number; // Cantidad recibida parcialmente
  pendiente?: number; // Cantidad pendiente de recibir
}

export interface DetalleCompraConDistribucion extends DetalleCompraDTO {
  distribucionDepositos?: DistribucionDepositoItem[];
}

// Recepción de Compras por Depósito
export interface RecepcionCompraDTO {
  compraId: number;
  fechaRecepcion: string;
  recepciones: RecepcionItemDTO[];
  observaciones?: string;
  usuarioRecepcionId?: number;
}

export interface RecepcionItemDTO {
  detalleCompraId: number;
  productoId: number;
  depositoId?: number; // Opcional - Backend asigna automáticamente al depósito principal
  cantidadRecibida: number;
  esRecepcionParcial: boolean;
  observaciones?: string;
}

export interface RecepcionResponseDTO {
  success: boolean;
  message: string;
  movimientosCreados: number;
}

// Transferencias entre Depósitos
export type EstadoTransferencia = 'PENDIENTE' | 'EN_TRANSITO' | 'RECIBIDA' | 'CANCELADA';

export interface TransferenciaDepositoDTO {
  id?: number;
  numero?: string;
  empresaId: number;
  depositoOrigenId: number;
  depositoOrigenNombre?: string;
  depositoDestinoId: number;
  depositoDestinoNombre?: string;
  fechaTransferencia: string;
  fechaRecepcion?: string;
  estado: EstadoTransferencia;
  items: TransferenciaItemDTO[];
  observaciones?: string;
  usuarioSolicitudId: number;
  usuarioSolicitudNombre?: string;
  usuarioRecepcionId?: number;
  usuarioRecepcionNombre?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface TransferenciaItemDTO {
  id?: number;
  productoId?: number;
  productoNombre?: string;
  productoCodigo?: string;
  equipoFabricadoId?: number;
  equipoNumero?: string;
  cantidadSolicitada: number;
  cantidadRecibida?: number;
  observaciones?: string;
}

export interface TransferenciaCreateDTO {
  depositoOrigenId: number;
  depositoDestinoId: number;
  fechaTransferencia: string;
  items: Array<{
    productoId?: number;
    equipoFabricadoId?: number;
    cantidadSolicitada?: number; // Solo para productos
  }>;
  observaciones?: string;
  usuarioSolicitudId: number;
}

export interface ConfirmarRecepcionDTO {
  transferenciaId: number;
  fechaRecepcion: string;
  items: ItemRecepcionDTO[];
  usuarioRecepcionId: number;
}

export interface ItemRecepcionDTO {
  id: number; // ID del TransferenciaItem
  cantidadRecibida: number;
  observaciones?: string;
  distribucionDepositos?: Array<{
    depositoId: number;
    cantidad: number;
  }>;
}

export interface AuditoriaMovimientoDTO {
  id?: number;
  empresaId: number;
  tipo: 'PRODUCTO' | 'EQUIPO';
  productoId?: number;
  productoNombre?: string;
  productoCodigo?: string;
  equipoFabricadoId?: number;
  equipoNumero?: string;
  tipoMovimiento: TipoMovimientoStockDeposito;
  depositoOrigenId?: number;
  depositoOrigenNombre?: string;
  depositoDestinoId?: number;
  depositoDestinoNombre?: string;
  cantidad?: number;
  documentoReferencia?: string;
  compraId?: number;
  transferenciaId?: number;
  ventaId?: number;
  motivo?: string;
  observaciones?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  fechaMovimiento: string;
}

export interface AuditoriaMovimientoFiltroDTO {
  empresaId: number;
  tipo?: 'PRODUCTO' | 'EQUIPO';
  tipoMovimiento?: TipoMovimientoStockDeposito;
  productoId?: number;
  equipoFabricadoId?: number;
  depositoId?: number;
  depositoOrigenId?: number;
  depositoDestinoId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioId?: number;
  documentoReferencia?: string;
}
export interface StockGlobalProductoDTO {
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  stockTotal: number;
  stockMinimo: number;
  stockPorDeposito: StockDeposito[];
  bajoMinimo: boolean;
  depositosBajoMinimo: string[];
}

// Resumen de Stock por Depósito
export interface ResumenStockDepositoDTO {
  totalProductos: number;
  totalDepositos: number;
  alertasBajoMinimo: number;
  stockPorDeposito: ResumenDepositoDTO[];
}

export interface ResumenDepositoDTO {
  depositoId: number;
  depositoNombre: string;
  totalProductos: number;
  productosConStock: number;
  alertasBajoMinimo: number;
  valorTotalStock: number;
}

// Sincronización y Reconciliación
export interface SincronizacionStockDTO {
  productoId: number;
  stockGlobalAnterior: number;
  stockGlobalNuevo: number;
  diferencia: number;
  sincronizado: boolean;
}

export interface ReconciliacionResultDTO {
  totalProductosRevisados: number;
  inconsistenciasEncontradas: number;
  inconsistenciasCorregidas: number;
  productos: ReconciliacionProductoDTO[];
}

export interface ReconciliacionProductoDTO {
  productoId: number;
  productoNombre: string;
  stockGlobal: number;
  stockSumaDepositos: number;
  diferencia: number;
  corregido: boolean;
}
