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
  /** Unidad física en la que se carga 'cantidad' (m, kg, l). */
  unidadMedida?: string | null;
  /** Unidad de inventario/compra en la que vive el stock (Rollo, Bolsa). */
  unidadInventario?: string | null;
  /** Contenido físico por unidad de inventario (ej. 45 => 1 Rollo = 45 m). */
  factorConversion?: number | null;
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
  codigoVenta?: string | null;   // código de venta/despacho (se asigna al vender)
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
export type EtapaFabricacionEstado = 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO';

export interface EtapaFabricacionDTO {
  id: number;
  tipoEtapa: TipoEtapaFabricacion;
  tipoEtapaLabel: string;
  completado: boolean;
  estado?: EtapaFabricacionEstado;
  responsableId?: number;
  responsableNombre?: string;
  observaciones?: string;
  motivoRechazo?: string;
  usuarioRechazo?: string;
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
  codigoVenta?: string | null;   // código de venta/despacho (se asigna al vender)
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

/**
 * Filtros combinables (opcionales) del listado server-side de equipos fabricados.
 * `estados` y `estadosAsignacion` se envían como parámetros repetidos.
 */
export interface EquipoFabricadoFilterParams {
  page?: number;
  size?: number;
  sort?: string;
  tipo?: TipoEquipo;
  modelo?: string;
  estados?: EstadoFabricacion[];
  estadosAsignacion?: EstadoAsignacionEquipo[];
  colorId?: number;
  medidaId?: number;
  asignado?: boolean;
  search?: string;
}

/**
 * Conteos agregados globales (de la empresa) usados por las tarjetas y KPIs.
 * Espejo de `EquipoResumenEstadosDTO` del backend.
 */
export interface EquipoResumenEstadosDTO {
  total: number;
  pendientes: number;
  enProceso: number;
  pendienteControlCalidad: number;
  completados: number;
  cancelados: number;
  sinTerminacion: number;
  asignados: number;
  noAsignados: number;
  disponibles: number;
  entregados: number;
  porTipo: Record<string, number>;
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
export type EstadoFabricacion = 'PENDIENTE' | 'EN_PROCESO' | 'PENDIENTE_CONTROL_CALIDAD' | 'COMPLETADO' | 'CANCELADO' | 'FABRICADO_SIN_TERMINACION';

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
  evento?: string;
  estadoAnterior: EstadoFabricacion;
  estadoNuevo: EstadoFabricacion;
  descripcion: string;
  fecha: string;
  fechaCambio?: string;
  observaciones?: string;
  usuarioNombre?: string;
}

// Detalle estructurado de un producto faltante para fabricar (insumo del modal y del requerimiento)
export interface ProductoFaltanteDTO {
  productoId: number;
  nombre: string;
  codigo?: string;
  /** Unidades de compra necesarias (planchas, barras, bolsas, piezas). */
  necesario: number;
  disponible: number;
  faltante: number;
  proveedorSugeridoId?: number | null;
  proveedorSugeridoNombre?: string | null;
  unidadMedida?: string;
  factorConversion?: number | null;
  /** Cantidad en unidades base (m², metros, kg). Igual a necesario si unidadMedida=UNIDAD. */
  necesarioBaseUnits?: number;
}

// Validación de stock para fabricación
export interface ValidacionStockDTO {
  stockSuficiente: boolean;
  productosInsuficientes?: string[];
  faltantes?: ProductoFaltanteDTO[];
  mensaje: string;
}

// ── Requerimientos de stock (pedidos internos de reposición) ──────────────
export type EstadoRequerimientoStock =
  | 'PENDIENTE'
  | 'PARCIAL'
  | 'EN_COMPRA'
  | 'RECIBIDO'
  | 'RESUELTO'
  | 'CANCELADO';
export type OrigenRequerimiento = 'FABRICACION' | 'MANUAL';

/** Una orden de compra generada para una línea del requerimiento (qué se pidió y a quién). */
export interface LineaCompraGeneradaDTO {
  detalleCompraId: number;
  compraId: number;
  numeroCompra?: string | null;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  cantidadPedida: number;
  cantidadRecibida: number;
  estadoCompra?: string | null;
  fechaEntrega?: string | null;
}

export interface DetalleRequerimientoStockDTO {
  id: number;
  productoId: number;
  productoNombre?: string;
  productoCodigo?: string;
  cantidadRequerida: number;
  cantidadComprada: number;
  cantidadRecibida: number;
  proveedorSugeridoId?: number | null;
  proveedorSugeridoNombre?: string | null;
  /** Aclaración para el proveedor a nivel de línea (color/terminación). */
  observaciones?: string | null;
  ordenesGeneradas?: LineaCompraGeneradaDTO[];
}

export interface RequerimientoStockDTO {
  id: number;
  estado: EstadoRequerimientoStock;
  origen: OrigenRequerimiento;
  recetaId?: number | null;
  cantidadEquipos?: number | null;
  observaciones?: string | null;
  usuarioCreadorId?: number | null;
  usuarioCreadorNombre?: string | null;
  fechaCreacion: string;
  fechaActualizacion?: string | null;
  detalles: DetalleRequerimientoStockDTO[];
}

export interface CreateDetalleRequerimientoStockDTO {
  productoId: number;
  cantidadRequerida: number;
  proveedorSugeridoId?: number | null;
  observaciones?: string | null;
}

export interface CreateRequerimientoStockDTO {
  origen?: OrigenRequerimiento;
  recetaId?: number | null;
  cantidadEquipos?: number | null;
  observaciones?: string | null;
  detalles: CreateDetalleRequerimientoStockDTO[];
}

export interface GenerarOrdenesCompraResponseDTO {
  ordenesCreadas: Array<{ id: number; numero?: string; estado?: string; total?: number }>;
  productosSinProveedor: string[];
  mensaje: string;
}

/** Asignación de proveedores por el admin de compras (permite dividir cantidades). */
export interface AsignarProveedoresDTO {
  asignaciones: Array<{
    detalleRequerimientoId: number;
    proveedorId: number;
    cantidad: number;
    precioUnitario?: number | null;
  }>;
}

/** Recepción registrada por el taller sobre su pedido. */
export interface RecibirRequerimientoDTO {
  fechaRecepcion?: string | null;
  observaciones?: string | null;
  items: Array<{
    detalleCompraId: number;
    cantidadRecibida: number;
    depositoId?: number | null;
  }>;
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

/**
 * Desglose de equipos VENDIDOS y EN TRÁNSITO agrupados por tipo+modelo.
 * Complementa a {@link DesgloseModeloDTO} con los equipos fuera del depósito.
 */
export interface DesgloseModeloVendidosDTO {
  tipo: string;
  modelo: string;
  /** enTransito + entregados */
  total: number;
  /** Equipos que salieron en un viaje inicializado pero no fueron entregados aún */
  enTransito: number;
  /** Equipos entregados al cliente final */
  entregados: number;
  numerosEnTransito: string[];
  numerosEntregados: string[];
}

/** Equipo físico asociado a una OrdenServicio (dentro de OrdenServicioDTO) */
export interface EquipoEnOrdenDTO {
  equipoFabricadoId: number;
  numeroHeladera: string;
  modelo: string;
  tipo: string;
  descripcionFalla?: string;
  fechaIngresoServicio: string;
  recetaId?: number;
  recetaNombre?: string;
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
