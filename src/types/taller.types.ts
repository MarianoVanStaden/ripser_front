import type { Cliente, Client } from './cliente.types';
import type { Empleado, Employee } from './rrhh.types';
import type { Product, CategoriaProducto, TipoEntidadProducto } from './producto.types';
import type { EquipoEnOrdenDTO } from './fabricacion.types';
// Órdenes de servicio, tareas, materiales utilizados, productos terminados.

export interface WorkOrder {
  id: number;
  workOrderNumber: string;
  clientId: number;
  client?: Client;
  employeeId: number;
  employee?: Employee;
  equipmentId?: number;
  equipment?: Equipment;
  description: string;
  priority: WorkPriority;
  status: WorkStatus;
  estimatedHours: number;
  actualHours: number;
  startDate: string;
  endDate?: string;
  tasks: WorkTask[];
  materials: WorkMaterial[];
  totalCost: number;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkTask {
  id: number;
  workOrderId: number;
  employeeId: number;
  employee?: Employee;
  description: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  startDate: string;
  endDate?: string;
  observations: string;
}

export interface WorkMaterial {
  id: number;
  workOrderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Equipment {
  id: number;
  serialNumber: string;
  brand: string;
  model: string;
  clientId: number;
  client?: Client;
  status: EquipmentStatus;
  lastService?: string;
  warrantyEndDate?: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
}
export interface ProductoTerminado {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number | null;
  stockActual: number;
  stockMinimo: number;
  codigo: string;
  categoriaProducto?: CategoriaProducto;
  categoriaProductoId?: number;
  categoriaProductoNombre?: string;
  activo: boolean;
  fechaCreacion: string;
  tipoEntidad?: TipoEntidadProducto;
}

export interface MaterialUtilizado {
  id: number;
  ordenServicioId: number;
  productoId: number; // El backend usa 'productoId'
  productoTerminadoId?: number; // Alias para compatibilidad
  productoTerminado?: ProductoTerminado;
  productoNombre?: string; // Nombre del producto desde el backend DTO
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface TareaServicio {
  id: number;
  ordenServicioId: number;
  descripcion: string;
  horasEstimadas: number;
  horasReales: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA';
  empleadoId?: number;
  empleado?: Empleado;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
}

export interface OrdenServicio {
  id: number;
  numeroOrden: string;
  clienteId: number;
  cliente?: Cliente;
  clienteNombre?: string; // Nombre del cliente desde el backend DTO
  fechaCreacion: string;
  fechaEstimada?: string;
  fechaFinalizacion?: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA';
  descripcionTrabajo: string;
  observaciones?: string;
  costoManoObra: number;
  costoMateriales: number;
  total: number;
  responsableId?: number;
  responsable?: Empleado;
  responsableNombre?: string; // Nombre del responsable desde el backend DTO
  materiales: MaterialUtilizado[];
  tareas: TareaServicio[];
  /** Equipos físicos vinculados a esta orden (poblado desde OrdenServicioEquipo) */
  equipos?: EquipoEnOrdenDTO[];
}
export const WorkPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;
export type WorkPriority = typeof WorkPriority[keyof typeof WorkPriority];

export const WorkStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_PARTS: 'WAITING_PARTS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type WorkStatus = typeof WorkStatus[keyof typeof WorkStatus];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const EquipmentStatus = {
  ACTIVE: 'ACTIVE',
  IN_SERVICE: 'IN_SERVICE',
  DAMAGED: 'DAMAGED',
  DECOMMISSIONED: 'DECOMMISSIONED'
} as const;
export type EquipmentStatus = typeof EquipmentStatus[keyof typeof EquipmentStatus];
