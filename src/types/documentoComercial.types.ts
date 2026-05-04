import type { ColorEquipo, MedidaEquipo, MetodoPago } from './venta.types';
import type { EstadoFabricacion } from './fabricacion.types';
// Documentos comerciales: presupuesto, nota de pedido, factura, nota de crédito.

export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
}
export type TipoItemDocumento = 'PRODUCTO' | 'EQUIPO';

export const EstadoDocumento = {
  PENDIENTE: "PENDIENTE",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
  CONFIRMADA: "CONFIRMADA",
  PAGADA: "PAGADA",
  VENCIDA: "VENCIDA",
  FACTURADA: "FACTURADA",
  ANULADA: "ANULADA"
} as const;
export type EstadoDocumento = typeof EstadoDocumento[keyof typeof EstadoDocumento];

export type TipoDocumento = 'PRESUPUESTO' | 'NOTA_PEDIDO' | 'FACTURA' | 'NOTA_CREDITO';
export interface DocumentoComercial {
  id: number;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  clienteId?: number;
  clienteNombre?: string;
  leadId?: number;
  leadNombre?: string;
  usuarioId: number;
  usuarioNombre: string;
  fechaEmision: string; // ISO string
  fecha?: string; // Alias for backward compatibility
  fechaVencimiento: string; // ISO string
  subtotal: number;
  iva: number;
  total: number;
  tipoIva: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  /** Modalidad del descuento a nivel documento. */
  descuentoTipo?: 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';
  /** Valor crudo del descuento (porcentaje 0..100 o monto fijo según `descuentoTipo`). */
  descuentoValor?: number;
  /** Monto de descuento ya calculado (total = subtotal - descuentoMonto + iva). */
  descuentoMonto?: number;
  estado: EstadoDocumento;
  metodoPago: MetodoPago;
  observaciones?: string;
  detalles: DetalleDocumento[];
  opcionesFinanciamiento?: OpcionFinanciamiento[];
  opcionFinanciamientoSeleccionadaId?: number;
  documentoOrigenId?: number;
  documentoOrigenNumero?: string;
  documentoOrigenTipo?: TipoDocumento;
  documentoSiguienteId?: number;
  documentoSiguienteNumero?: string;
  documentoSiguienteTipo?: TipoDocumento;
  numeroReferencia?: string;
  usuarioCreadorPresupuestoId:        number | null;
  usuarioCreadorPresupuestoNombre:    string | null;
  usuarioConvertidorNotaPedidoId:     number | null;
  usuarioConvertidorNotaPedidoNombre: string | null;
  usuarioFacturadorId:                number | null;
  usuarioFacturadorNombre:            string | null;
  prestamoId?: number | null;
}

export interface CreateNotaCreditoDTO {
  facturaId: number;
  usuarioId: number;
  observaciones?: string;
  equiposADevolver?: number[];
}
// En types/index.ts agregar:
export interface CreateOpcionFinanciamientoDTO {
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  montoTotal: number;
  montoCuota: number;
  descripcion?: string;
  ordenPresentacion?: number;
}

export interface OpcionFinanciamiento {
  id?: number;
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  montoTotal: number;
  montoCuota: number;
  descripcion?: string;
  esSeleccionada?: boolean;
  ordenPresentacion?: number;
}

export interface PresupuestoSimple {
  id: number;
  numeroDocumento: string;
  clienteNombre: string;
  fechaEmision: string;
  estado: string;
  subtotal: number;
  total: number;
  opcionesFinanciamiento?: OpcionFinanciamiento[];
  opcionFinanciamientoSeleccionadaId?: number;
}

export interface DetalleDocumento {
  id: number;
  documentoComercialId: number;
  tipoItem: TipoItemDocumento;

  // For PRODUCTO type
  productoId?: number;
  productoNombre?: string; // For display purposes

  // For EQUIPO type
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  recetaTipo?: string;
  descripcionEquipo?: string;
  color?: ColorEquipo;
  medida?: MedidaEquipo;

  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
  descripcion?: string; // Optional description for the item

  // For EQUIPO items in Factura - list of assigned equipos
  equiposFabricadosIds?: number[];
  equiposNumerosHeladera?: string[];
}
export interface DetalleDocumentoDTO {
  id?: number; // Opcional al crear
  tipoItem?: TipoItemDocumento; // Defaults to PRODUCTO if not specified

  // For PRODUCTO type
  productoId?: number;
  productoNombre?: string;

  // For EQUIPO type
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  recetaTipo?: string;
  descripcionEquipo?: string;
  color?: ColorEquipo;
  medida?: MedidaEquipo;

  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal?: number;
  descripcion?: string;

  // For EQUIPO items in Factura - list of assigned equipos
  equiposFabricadosIds?: number[];
  equiposNumerosHeladera?: string[];
}

export interface CreatePresupuestoRequest {
  clienteId?: number;
  leadId?: number;
  usuarioId: number;
  detalles: DetalleDocumentoDTO[];
  observaciones?: string;
}

export interface ConvertToFacturaDTO {
  notaPedidoId: number;
  descuento?: number;
  descuentoTipo?: 'NONE' | 'PORCENTAJE' | 'MONTO_FIJO';
  descuentoValor?: number;
  equiposAsignaciones?: { [detalleId: number]: number[] }; // Map of DetalleDocumento ID to List of EquipoFabricado IDs
  cantidadCuotas?: number;
  tipoFinanciacion?: string;
  primerVencimiento?: string;
  porcentajeEntregaInicial?: number | null;
  montoEntregaInicial?: number | null;
  tasaInteres?: number;
  confirmarConDeudaPendiente?: boolean;
  cajaPesosId?: number | null;
  cajaAhorroId?: number | null;
}

export type ResolucionEquipoModo =
  | 'STOCK_TERMINADO'
  | 'BASE_RESERVADA'
  | 'NUEVA_FABRICACION'
  | 'ERROR';

export interface ResolucionEquipo {
  detalleId: number;
  detalleNombre: string;
  colorSolicitado: string | null;
  equipoId: number | null;
  numeroHeladera: string | null;
  estadoEquipo: EstadoFabricacion;
  modo: ResolucionEquipoModo;
  exito: boolean;
  mensaje: string;
}

export interface ConvertToNotaPedidoResult {
  documento: DocumentoComercial;
  resolucionesEquipo: ResolucionEquipo[];
}

export interface DeudaClienteError {
  error: string;
  message: string;
  cuotasPendientes: number;
  montoCuotasPendientes?: number | null;
  deudaCuentaCorriente: number | null;
  requiereConfirmacion: true;
}
export interface OpcionFinanciamientoDTO {
  id?: number;
  nombre: string;
  metodoPago: MetodoPago;
  cantidadCuotas: number;
  tasaInteres: number;
  montoTotal: number;
  montoCuota: number;
  descripcion?: string;
  ordenPresentacion?: number;
  esSeleccionada?: boolean;
}
