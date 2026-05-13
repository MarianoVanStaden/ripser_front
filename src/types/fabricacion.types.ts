import type { ColorEquipo, MedidaEquipo } from './venta.types';
import type { Producto } from './producto.types';
import type { UnidadMedida } from './logistica.types';
// Recetas de fabricación, equipos fabricados, terminaciones, costeo.

export interface RecetaItem {
  id: number;
  recetaId: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  unidadMedidaId: number;
  unidadMedida?: UnidadMedida;
  instrucciones?: string;
}
export interface DetalleRecetaDTO {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  observaciones?: string;
}

export interface DetalleRecetaCreateDTO {
  productoId: number;
  cantidad: number;
  costoUnitario?: number;
  observaciones?: string;
}

export interface RecetaFabricacionDTO {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipoEquipo: TipoEquipo;
  modelo?: string;
  medida?: MedidaEquipo;
  color?: ColorEquipo;
  observaciones?: string;
  precioVenta?: number;
  costoFabricacion: number;
  disponibleParaVenta?: boolean;
  activo: boolean;
  fechaCreacion: string;
  detalles: DetalleRecetaDTO[];
}

export type RecetaFabricacionListDTO = {
  id: number;
  codigo: string;
  nombre: string;
  tipoEquipo: TipoEquipo;
  modelo?: string;
  medida?: MedidaEquipo;
  color?: ColorEquipo;
  costoFabricacion: number;
  activo: boolean;
  fechaCreacion: string;
  cantidadDetalles: number;
};

export interface RecetaFabricacionCreateDTO {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipoEquipo: TipoEquipo;
  modelo?: string;
  medidaId?: number | null;
  colorId?: number | null;
  observaciones?: string;
  precioVenta?: number;
  disponibleParaVenta?: boolean;
  detalles?: DetalleRecetaCreateDTO[];
}

export interface RecetaFabricacionUpdateDTO {
  nombre?: string;
  descripcion?: string;
  tipoEquipo?: TipoEquipo;
  modelo?: string;
  medidaId?: number | null;
  colorId?: number | null;
  observaciones?: string;
  precioVenta?: number;
  disponibleParaVenta?: boolean;
  activo?: boolean;
}
export type TipoEquipo = 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO';

export type EstadoAsignacionEquipo = 'DISPONIBLE' | 'RESERVADO' | 'FACTURADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'PENDIENTE_TERMINACION' | 'EN_SERVICE';

export interface HistorialEstadoEquipo {
  id: number;
  equipoFabricadoId: number;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  observaciones?: string;
  usuarioNombre?: string;
  documentoId?: number;
  tipoDocumento?: string;
}

export interface EquipoFabricadoDTO {
  id: number;
  empresaId: number;         // Multi-tenant: empresa ID
  recetaId?: number;
  recetaNombre?: string;
  recetaCodigo?: string;
  tipo: TipoEquipo;
  modelo: string;
  equipo?: string;
  medida?: MedidaEquipo;
  color?: ColorEquipo;
  observaciones?: string;
  fechaCreacion: string;
  numeroHeladera: string;
  cantidad: number;
  asignado: boolean;
  estadoAsignacion?: EstadoAsignacionEquipo;
  estado: EstadoFabricacion;
  fechaFinalizacion?: string;
  fechaTerminacion?: string;  // YYYY-MM-DD — fecha en que se aplicó el color/revestimiento
  responsableId?: number;
  responsableNombre?: string;
  clienteId?: number;
  clienteNombre?: string;
  // Campos de entrega
  receptorNombre?: string;
  receptorDni?: string;
  fechaEntrega?: string;
  usuarioCreadorId:     number | null;
  usuarioCreadorNombre: string | null;
  progresoFabricacion?: number;
  etapasFabricacion?: EtapaFabricacionDTO[];
}

export type TipoEtapaFabricacion = 'AISLACION' | 'CHAPA' | 'MOTOR' | 'VIDRIOS';

export interface EtapaFabricacionDTO {
  id: number;
  tipoEtapa: TipoEtapaFabricacion;
  tipoEtapaLabel: string;
  completado: boolean;
  responsableId?: number;
  responsableNombre?: string;
  observaciones?: string;
  fechaCompletado?: string;
}

export interface ActualizarEtapaFabricacionDTO {
  responsableId?: number;
  observaciones?: string;
  completado: boolean;
}

export interface EquipoFabricadoListDTO {
  id: number;
  empresaId: number;         // Multi-tenant: empresa ID
  tipo: TipoEquipo;
  modelo: string;
  medida?: MedidaEquipo;
  numeroHeladera: string;
  color?: ColorEquipo;
  observaciones?: string;    // e.g. "Color previsto: PLATA (detalle #354)" for PENDIENTE_TERMINACION bases
  cantidad: number;
  asignado: boolean;
  estadoAsignacion?: EstadoAsignacionEquipo;
  estado: EstadoFabricacion;
  fechaCreacion: string;
  fechaFinalizacion?: string;
  fechaTerminacion?: string;  // YYYY-MM-DD — fecha en que se aplicó el color/revestimiento
  responsableNombre?: string;
  clienteNombre?: string;
  usuarioCreadorId:     number | null;
  usuarioCreadorNombre: string | null;
  progresoFabricacion?: number;
}

export interface EquipoFabricadoCreateDTO {
  recetaId?: number;
  tipo: TipoEquipo;
  modelo: string;
  equipo?: string;
  medidaId?: number | null;
  colorId?: number | null;
  observaciones?: string;
  numeroHeladera: string; // Required - use 'AUTO' for auto-generation
  cantidad: number;
  estado?: EstadoFabricacion;
  responsableId?: number;
  clienteId?: number;
}

export interface EquipoFabricadoUpdateDTO {
  recetaId?: number;
  tipo?: TipoEquipo;
  modelo?: string;
  equipo?: string;
  medidaId?: number | null;
  colorId?: number | null;
  observaciones?: string;
  cantidad?: number;
  asignado?: boolean;
  estado?: EstadoFabricacion;
  responsableId?: number;
  clienteId?: number;
}
export type EstadoFabricacion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO' | 'FABRICADO_SIN_TERMINACION';

// Response for batch equipment creation
export interface EquipoCreationResponseDTO {
  cantidadCreada: number;
  equipos: EquipoFabricadoDTO[];
  mensaje: string;
}

// Flujo de fabricación base + terminación
export type TipoTerminacion = 'COLOR_PINTURA' | 'GALVANIZADO' | 'TAPIZADO' | 'PLASTIFICADO' | 'OTRO';

export interface FabricacionBaseRequestDTO {
  recetaId?: number;
  tipo: TipoEquipo;
  modelo: string;
  equipo?: string;
  medidaId?: number | null;
  cantidad: number;
  responsableId?: number;
  observaciones?: string;
}

export interface AplicarTerminacionDTO {
  tipoTerminacion: TipoTerminacion;
  valor: string;
  completarAlTerminar: boolean;
  responsableId?: number;
  observaciones?: string;
}

export interface EtapaTerminacionDTO {
  id: number;
  tipoTerminacion: TipoTerminacion;
  valor: string;
  fechaAplicacion: string;
  completado: boolean;
  responsableNombre?: string;
}

export interface HistorialFabricacionDTO {
  id: number;
  estadoAnterior: EstadoFabricacion;
  estadoNuevo: EstadoFabricacion;
  descripcion: string;
  fecha: string;
  usuarioNombre?: string;
}

// Validación de stock para fabricación
export interface ValidacionStockDTO {
  stockSuficiente: boolean;
  productosInsuficientes?: string[];
  mensaje: string;
}
// ── Desglose por Modelo (Ubicación de Equipos — Tab server-side) ──────────
/**
 * Agrupación de equipos físicos por tipo y modelo con conteos calculados
 * server-side en una sola query SQL (endpoint GET /api/equipos-fabricados/desglose-modelo).
 */
export interface DesgloseModeloDTO {
  tipo: string;
  modelo: string;
  total: number;
  /** Equipos en pipeline comercial: RESERVADO | FACTURADO */
  asignados: number;
  /** Equipos con OrdenServicio activa (PENDIENTE | EN_PROCESO) */
  enService: number;
  /** Equipos estadoAsignacion=DISPONIBLE sin orden activa */
  disponibles: number;
  /** Lista de numeroHeladera de los equipos disponibles (para columna NUMEROS) */
  numerosDisponibles: string[];
  /** Lista de numeroHeladera de los equipos con OrdenServicio activa (se muestran en naranja) */
  numerosEnService?: string[];
}

/** Equipo físico asociado a una OrdenServicio (dentro de OrdenServicioDTO) */
export interface EquipoEnOrdenDTO {
  equipoFabricadoId: number;
  numeroHeladera: string;
  modelo: string;
  tipo: string;
  descripcionFalla?: string;
  fechaIngresoServicio: string;
}
export interface CosteoRecetaDTO {
  recetaId: number;
  codigo: string;
  nombre: string;
  costoMaterial: number;
  costoManoObra: number;
  costoVariosMateriales: number;
  costosFijos: number;
  costoVenta: number;
  costoTraslado: number;
  costoTotalFabricacion: number;
  ganancia: number;
  precioSugerido: number;
}
