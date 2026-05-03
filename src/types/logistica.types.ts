import type { Client } from './cliente.types';
import type { Empleado, Employee } from './rrhh.types';
import type { Venta } from './venta.types';
import type { OrdenServicio } from './taller.types';
import type { DocumentoComercial } from './documentoComercial.types';
import type { EquipoFabricadoDTO, EstadoAsignacionEquipo } from './fabricacion.types';
// Viajes, vehículos, entregas, incidencias, depósito (warehouse genérico).

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  manager: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: number;
  numeroViaje?: string;
  tripNumber?: string; // Kept for backward compatibility
  fechaViaje: string;
  destino: string;
  conductorId: number;
  driverId?: number; // Kept for backward compatibility
  conductorNombre?: string;
  driver?: Employee;
  vehiculoId: number;
  vehicleId?: number; // Kept for backward compatibility
  vehiculoPatente?: string;
  vehicle?: Vehicle;
  estado: TripStatus;
  status?: TripStatus; // Kept for backward compatibility
  observaciones?: string;
  observations?: string; // Kept for backward compatibility
  entregas?: Delivery[];
  deliveries?: Delivery[]; // Kept for backward compatibility
  startDate?: string; // Kept for backward compatibility
  endDate?: string;
  totalDistance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  isActive: boolean;
  lastMaintenance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: number;
  tripId?: number;
  orderId?: number;
  clientId: number;
  client?: Client;
  address: string;
  scheduledDate: string;
  deliveredDate?: string;
  status: DeliveryStatus;
  observations: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}
export const TripStatus = {
  PLANIFICADO: 'PLANIFICADO',
  EN_CURSO: 'EN_CURSO',
  COMPLETADO: 'COMPLETADO',
  CANCELADO: 'CANCELADO',
  // Legacy values for backward compatibility
  PLANNED: 'PLANIFICADO',
  IN_PROGRESS: 'EN_CURSO',
  COMPLETED: 'COMPLETADO',
  CANCELLED: 'CANCELADO'
} as const;
export type TripStatus = typeof TripStatus[keyof typeof TripStatus];

export const DeliveryStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const;
export type DeliveryStatus = typeof DeliveryStatus[keyof typeof DeliveryStatus];
export interface CreateWarehouseRequest {
  name: string;
  address: string;
  manager: string;
  capacity: number;
  isActive: boolean;
}

// Vehicle Create Request
export interface CreateVehicleRequest {
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  isActive: boolean;
  lastMaintenance?: string;
}
export interface CreateTripRequest {
  fechaViaje: string;
  destino: string;
  conductorId: number;
  vehiculoId: number;
  estado: TripStatus;
  observaciones?: string;
  entregas?: any[]; // EntregaViajeDTO[]
  // Legacy fields for backward compatibility
  tripNumber?: string;
  driverId?: number;
  vehicleId?: number;
  startDate?: string;
  endDate?: string;
  status?: TripStatus;
  totalDistance?: number;
  observations?: string;
}

// Delivery Create Request
export interface CreateDeliveryRequest {
  tripId?: number;
  orderId?: number;
  clientId: number;
  address: string;
  scheduledDate: string;
  deliveredDate?: string;
  status: DeliveryStatus;
  observations: string;
  signature?: string;
}
export interface Vehiculo {
  id: number;
  empresaId: number;         // Multi-tenant: empresa ID
  sucursalId?: number;       // Multi-tenant: sucursal ID (optional)
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  estado: string;
  capacidad?: number;
  observaciones?: string;
  totalIncidencias?: number;
  incidenciasAbiertas?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Viaje (Trip)
export interface Viaje {
  id: number;
  fechaViaje: string;
  destino: string;
  conductorId: number;
  conductor?: Empleado;
  vehiculoId: number;
  vehiculo?: Vehiculo;
  estado: EstadoViaje;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ViajeCreateDTO {
  fechaViaje: string;
  destino: string;
  conductorId: number;
  vehiculoId: number;
  estado?: EstadoViaje;
  observaciones?: string;
}

export interface VehiculoCreateDTO {
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  estado?: string;
  capacidad?: number;
  observaciones?: string;
}

// ── Incidencias Vehículo ──────────────────────────────────────────────────────

export type TipoIncidenciaVehiculo =
  | 'ACCIDENTE'
  | 'INFRACCION_TRANSITO'
  | 'FALLA_MECANICA'
  | 'DAÑO_CARROCERIA'
  | 'MANTENIMIENTO_PREVENTIVO'
  | 'VENCIMIENTO_DOCUMENTACION'
  | 'ROBO_PARCIAL'
  | 'OTRO';

export type GravedadIncidencia = 'LEVE' | 'MODERADA' | 'GRAVE' | 'CRITICA';
export type EstadoIncidencia = 'ABIERTA' | 'EN_PROCESO' | 'RESUELTA' | 'CERRADA';

export const TIPO_INCIDENCIA_LABELS: Record<TipoIncidenciaVehiculo, string> = {
  ACCIDENTE: 'Accidente',
  INFRACCION_TRANSITO: 'Infracción de tránsito',
  FALLA_MECANICA: 'Falla mecánica',
  DAÑO_CARROCERIA: 'Daño carrocería',
  MANTENIMIENTO_PREVENTIVO: 'Mantenimiento preventivo',
  VENCIMIENTO_DOCUMENTACION: 'Vencimiento documentación',
  ROBO_PARCIAL: 'Robo parcial',
  OTRO: 'Otro',
};

export const GRAVEDAD_INCIDENCIA_LABELS: Record<GravedadIncidencia, string> = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  GRAVE: 'Grave',
  CRITICA: 'Crítica',
};

export const ESTADO_INCIDENCIA_LABELS: Record<EstadoIncidencia, string> = {
  ABIERTA: 'Abierta',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
};

export interface IncidenciaVehiculoDTO {
  id: number;
  vehiculoId: number;
  vehiculo?: Vehiculo;
  tipo: TipoIncidenciaVehiculo;
  gravedad: GravedadIncidencia;
  estado: EstadoIncidencia;
  fecha: string;
  kmVehiculo?: number;
  lugar?: string;
  descripcion: string;
  numeroExpediente?: string;
  terceroInvolucrado?: string;
  fechaVencimientoDoc?: string;
  fechaResolucion?: string;
  observacionesResolucion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIncidenciaVehiculoDTO {
  vehiculoId: number;
  tipo: TipoIncidenciaVehiculo;
  gravedad: GravedadIncidencia;
  fecha: string;
  kmVehiculo?: number;
  lugar?: string;
  descripcion: string;
  numeroExpediente?: string;
  terceroInvolucrado?: string;
  fechaVencimientoDoc?: string;
}

export interface UpdateIncidenciaVehiculoDTO {
  tipo?: TipoIncidenciaVehiculo;
  gravedad?: GravedadIncidencia;
  estado?: EstadoIncidencia;
  fecha?: string;
  kmVehiculo?: number;
  lugar?: string;
  descripcion?: string;
  numeroExpediente?: string;
  terceroInvolucrado?: string;
  fechaVencimientoDoc?: string;
  fechaResolucion?: string;
  observacionesResolucion?: string;
}
export interface EntregaViaje {
  id: number;
  viajeId?: number;
  ventaId?: number; // Deprecated - usar documentoComercialId
  venta?: Venta;
  documentoComercialId?: number; // Nuevo campo - ID del documento comercial
  documentoComercial?: any; // Objeto completo del documento (si el backend lo popula)
  ordenServicioId?: number;
  ordenServicio?: OrdenServicio;
  direccionEntrega: string;
  fechaEntrega: string;
  estado: EstadoEntrega;
  observaciones?: string;
  receptorNombre?: string;
  receptorDni?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EstadoEntrega = 'PENDIENTE' | 'ENTREGADA' | 'NO_ENTREGADA';

// UnidadMedida (Unit of Measure)
export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  descripcion?: string;
}
export type EstadoEntregaEquipo = 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'RECHAZADO' | 'REPROGRAMADO';

export type EstadoViaje = 'PLANIFICADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';

export interface EntregaViajeDetalle {
  id: number;
  viajeId: number;
  facturaId: number;
  equipoFabricadoId: number;
  ordenEntrega: number;
  estadoEntrega: EstadoEntregaEquipo;
  
  // Datos de entrega
  receptorNombre?: string;
  receptorDni?: string;
  fechaEntregaPlanificada?: string;
  fechaEntregaReal?: string;
  
  // Ubicación
  direccionEntrega?: string;
  latitud?: number;
  longitud?: number;
  
  // Observaciones y evidencias
  observaciones?: string;
  motivoRechazo?: string;
  fotoEntregaUrl?: string;
  firmaDigitalUrl?: string;
  
  // Auditoría
  usuarioConfirmacionId?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  
  // Relaciones populadas
  equipo?: EquipoFabricadoDTO;
  factura?: DocumentoComercial;
}

export interface ViajeExtendido {
  id: number;
  fechaViaje: string;
  estadoViaje: EstadoViaje;
  conductorId?: number;
  conductorNombre?: string;
  vehiculoId?: number;
  vehiculoPatente?: string;
  totalEquipos: number;
  equiposEntregados: number;
  totalFacturas?: number;
  totalParadas?: number;
  paradasCompletadas?: number;
  paradasPendientes?: number;
  paradasRechazadas?: number;
  observaciones?: string;
  horaInicio?: string;
  horaFin?: string;
  detalles?: EntregaViajeDetalle[];
}

export interface EquipoPendienteViaje {
  equipoId: number;
  numeroHeladera: string;
  estadoAsignacion: EstadoAsignacionEquipo;
  clienteId: number;
  clienteNombre: string;
  clienteDireccion?: string;
  clienteTelefono?: string;
  facturaId: number;
  numeroDocumento: string;
  fechaFactura: string;
  detalleId: number;
}

export interface AgregarFacturaViajeDTO {
  viajeId: number;
  facturaId: number;
  ordenEntrega: number;
}

export interface ConfirmarEntregaEquipoDTO {
  detalleId: number;
  receptorNombre: string;
  receptorDni?: string;
  observaciones?: string;
  usuarioId: number;
  fotoEntregaUrl?: string;
  firmaDigitalUrl?: string;
}
