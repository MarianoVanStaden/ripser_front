// Export balance and amortizacion types
export * from './balance.types';
export * from './amortizacion.types';

// Export new multi-tenant types
export * from './auth.types';
export * from './tenant.types';

// Export lead types
export * from './lead.types';
export type { LeadDTO as Lead } from './lead.types';

// Export prestamo types
export * from './prestamo.types';

// Export pagination types
export * from './pagination.types';

// Export shared enums
export * from './shared.enums';
import type { ProvinciaEnum } from './shared.enums';

// --- Garantía (Warranty) Aliases for Frontend Consistency ---
export type Garantia = Warranty;
export type ReclamoGarantia = WarrantyClaim;
// Core Business Entities
// Client entity interface (extended to match backend)
export interface Cliente {
  id: number;
  empresaId: number;        // Multi-tenant: empresa ID
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  telefonoAlternativo?: string;
  whatsapp?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: ProvinciaEnum;
  codigoPostal?: string;
  tipo: TipoCliente;
  estado: EstadoCliente;
  segmento?: SegmentoCliente;
  esClienteCorporativo?: boolean;
  limiteCredito?: number;
  saldoActual: number;
  diasCredito?: number;
  condicionPago?: CondicionPago;
  totalCompras?: number;
  cantidadCompras?: number;
  ticketPromedio?: number;
  lifetimeValue?: number;
  fechaUltimaCompra?: string;
  diasDesdeUltimaCompra?: number;
  frecuenciaCompraDias?: number;
  leadId?: number;
  fechaConversion?: string;
  productoComprado?: ProductoSimple;
  montoConversion?: number;
  canalAdquisicion?: string;
  aceptaMarketing?: boolean;
  preferenciaContacto?: PreferenciaContacto;
  horarioPreferidoContacto?: string;
  calificacion?: number; // 0.00 to 5.00
  observaciones?: string;
  usuarioAsignadoId?: number;
  creadoPorId?: number;
  modificadoPorId?: number;
  fechaAlta: string; // ISO 8601 string
  fechaActualizacion?: string; // ISO 8601 string
  fechaBaja?: string;
  enRiesgoChurn?: boolean;
  segmentoAutomatico?: SegmentoCliente;
  contactos?: ContactoCliente[];
  cuentaCorriente?: CuentaCorriente[];
  ventas?: Venta[];
}

export interface ProductoSimple {
  id: number;
  nombre: string;
  precio: number;
}

export type SegmentoCliente = 'VIP' | 'PREMIUM' | 'STANDARD' | 'BASICO';
export type CondicionPago = 'CONTADO' | 'CREDITO';
export type PreferenciaContacto = 'TELEFONO' | 'EMAIL' | 'WHATSAPP';

export interface CreateMovimientoPayload {
  clienteId: number;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
  documentoComercialId?: number;
  opcionFinanciamientoId?: number;
  metodoPago?: MetodoPago;
  chequeId?: number;
}


export interface ContactoProveedorDTO {
  id?: number;
  proveedorId: number;
  fechaContacto?: string; // ISO string
  tipoContacto?: string;
  descripcion?: string;
  resultado?: string;
  proximoContacto?: string; // ISO string
  usuarioId?: number;
}
  
// Client Contact entity
export interface ContactoCliente {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  fechaContacto: string;
  tipoContacto: TipoContacto;
  descripcion: string;
  resultado?: string;
  proximoContacto?: string;
  usuarioId?: number;
  usuario?: User;
}

// Current Account entity
export interface CuentaCorriente {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
  saldo: number;
  documentoComercialId?: number;
  documentoComercial?: DocumentoComercial;
  opcionFinanciamientoId?: number;
  opcionFinanciamiento?: OpcionFinanciamientoDTO;
  metodoPago?: MetodoPago;
  chequeId?: number;
  usuarioNombre?: string | null;
}

// Client related enums
export type TipoCliente = 'PERSONA_FISICA' | 'PERSONA_JURIDICA';
export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'MOROSO';
export type TipoContacto = 'VISITA' | 'LLAMADA' | 'EMAIL';
export type TipoMovimiento = 'DEBITO' | 'CREDITO';

// Create Client Request
export interface CreateClienteRequest {
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: ProvinciaEnum;
  codigoPostal?: string;
  tipo: TipoCliente;
  estado: EstadoCliente;
  limiteCredito: number;
  calificacion?: number;
}

// Create Contact Request
export interface CreateContactoClienteRequest {
  clienteId: number;
  fechaContacto: string;
  tipoContacto: TipoContacto;
  descripcion: string;
  resultado?: string;
  proximoContacto?: string;
}

// Create Current Account Movement Request
export interface CreateCuentaCorrienteRequest {
  clienteId: number;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
}

// Legacy Client interface (keeping for compatibility)
export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  documentType: 'DNI' | 'CUIT' | 'PASSPORT';
  documentNumber: string;
  clientType: 'INDIVIDUAL' | 'COMPANY';
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

// User entity interface for admin module
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

// Role entity interface
export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

// Permission entity interface
export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  action: string;
}

// System parameters interface
export interface SystemParameter {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  updatedAt: string;
}

// Presupuesto (Budget/Quote) entity
export interface Presupuesto {
  id: number;
  numeroPresupuesto: string;
  cliente: Cliente;
  fechaPresupuesto: string;
  fechaVencimiento: string;
  estado: PresupuestoStatus;
  total: number;
  observaciones: string;
  detalles: DetallePresupuesto[];
  usuario?: Usuario;
}

export interface DetallePresupuesto {
  id: number;
  presupuesto?: Presupuesto;
  producto?: Producto;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Warranty entity
export interface Warranty {
  id: number;
  productId: number;
  product?: Product;
  clientId: number;
  client?: Client;
  tipoIva?: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  saleId?: number;
  sale?: Sale;
  warrantyNumber: string;
  startDate: string;
  endDate: string;
  status: WarrantyStatus;
  type: WarrantyType;
  description: string;
  claims: WarrantyClaim[];
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyClaim {
  id: number;
  warrantyId: number;
  claimNumber: string;
  claimDate: string;
  description: string;
  status: ClaimStatus;
  solution: ClaimSolution;
  employeeId: number;
  employee?: Employee;
  resolution: string;
  resolutionDate?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

// Purchase/Supplier entities
export interface Purchase {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  employeeId: number;
  employee?: Employee;
  purchaseNumber: string;
  purchaseDate: string;
  deliveryDate?: string;
  status: PurchaseStatus;
  subtotal: number;
  tax: number;
  total: number;
  paymentTerms: string;
  observations: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  received: number;
  pending: number;
}

// HR entities
export interface EmployeePayroll {
  id: number;
  employeeId: number;
  employee?: Employee;
  period: string; // YYYY-MM
  basicSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  paymentDate: string;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employee?: Employee;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  hoursWorked: number;
  observations: string;
}

export interface Training {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  instructor: string;
  status: TrainingStatus;
  employees: Employee[];
  cost: number;
  createdAt: string;
  updatedAt: string;
}

// Logistics entities
export interface StockMovement {
  id: number;
  productId: number;
  product?: Product;
  type: MovementType;
  quantity: number;
  reason: string;
  employeeId: number;
  employee?: Employee;
  warehouseId?: number;
  warehouse?: Warehouse;
  date: string;
  createdAt: string;
}

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

// Workshop entities
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

// Employee entity interface
export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category entity interface
export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Supplier entity interface
export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  rating: number;
  isActive: boolean;
  observations: string;
  createdAt: string;
  updatedAt: string;
}

// Product entity interface
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  category?: Category;
  supplierId: number;
  supplier?: Supplier;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Producto interface matches ProductoDTO from backend
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo: number | null;
  stockActual: number;
  stockMinimo: number;
  codigo?: string;
  categoriaProducto?: CategoriaProducto;
  categoriaProductoId?: number;
  categoriaProductoNombre?: string;
  activo: boolean;
  fechaCreacion?: string; // ISO string
}

// ProductoCreateDTO interface for product creation
export interface CreateProductRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number | null;
  stockActual: number;
  stockMinimo: number;
  codigo?: string;
  categoriaProductoId: number;
}

// --- Product DTOs matching backend ---
// ProductoCreateDTO
export interface ProductoCreateDTO {
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number | null;
  stockActual: number;
  stockMinimo: number;
  codigo?: string;
  categoriaProductoId: number;
}

// ProductoUpdateDTO
export interface ProductoUpdateDTO {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  costo?: number | null;
  stockMinimo?: number;
  categoriaProductoId?: number;
  activo?: boolean;
}

// ProductoDTO
export interface ProductoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo: number | null;
  stockActual: number;
  stockMinimo: number;
  codigo?: string;
  categoriaProductoId: number;
  categoriaProductoNombre?: string;
  activo: boolean;
  fechaCreacion: string;
}

// ProductoListDTO
export interface ProductoListDTO {
  id: number;
  nombre: string;
  codigo?: string;
  precio: number;
  costo: number | null;
  stockActual: number;
  stockMinimo: number;
  categoriaProductoNombre?: string;
  activo: boolean;
}

// Removed Order and OrderItem interfaces: backend does not support /api/ordenes

// Sale entity interface
export interface Sale {
  id: number;
  clientId: number;
  client?: Client;
  employeeId: number;
  employee?: Employee;
  saleNumber: string;
  saleDate: string;
  status: SaleStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  observations: string;
  items: SaleItem[];
  saleItems: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

// Sale Item entity interface
export interface SaleItem {
  id: number;
  saleId: number;
  productId?: number;
  serviceId?: number;
  product?: Product;
  service?: Service;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  totalPrice: number;
}

// Service entity interface
export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  categoryId: number;
  category?: Category;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Stock Movement entity interface
export interface StockMovement {
  id: number;
  productId: number;
  product?: Product;
  type: MovementType;
  quantity: number;
  reason: string;
  reference: string;
  employeeId: number;
  employee?: Employee;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Service Appointment entity interface
export interface ServiceAppointment {
  id: number;
  serviceId: number;
  service?: Service;
  clientId: number;
  client?: Client;
  employeeId: number;
  employee?: Employee;
  appointmentDate: string;
  status: AppointmentStatus;
  notes: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Inventory Adjustment interface for inventory management
export interface InventoryAdjustment {
  id: number;
  productId: number;
  product?: Product;
  type: 'RECOUNT' | 'DAMAGE' | 'THEFT' | 'ADJUSTMENT';
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  reason: string;
  employeeId: number;
  employee?: Employee;
  date: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// --- Taller (Workshop) Entities ---
export interface ProductoTerminado {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  codigo: string;
  categoriaProducto?: CategoriaProducto;
  activo: boolean;
  fechaCreacion: string;
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
}

export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

// Enum types using const assertions
export const OrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHECK: 'CHECK'
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const SaleStatus = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type SaleStatus = typeof SaleStatus[keyof typeof SaleStatus];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
} as const;

export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

// Enum types using const assertions for all business entities

export const PresupuestoStatus = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO', 
  RECHAZADO: 'RECHAZADO',
  VENCIDO: 'VENCIDO'
} as const;
export type PresupuestoStatus = typeof PresupuestoStatus[keyof typeof PresupuestoStatus];

export const WarrantyStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  VOIDED: 'VOIDED',
  CLAIMED: 'CLAIMED'
} as const;
export type WarrantyStatus = typeof WarrantyStatus[keyof typeof WarrantyStatus];

export const WarrantyType = {
  MANUFACTURER: 'MANUFACTURER',
  EXTENDED: 'EXTENDED',
  SERVICE: 'SERVICE'
} as const;
export type WarrantyType = typeof WarrantyType[keyof typeof WarrantyType];

export const ClaimStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED'
} as const;
export type ClaimStatus = typeof ClaimStatus[keyof typeof ClaimStatus];

export const ClaimSolution = {
  REPAIR: 'REPAIR',
  REPLACEMENT: 'REPLACEMENT',
  REFUND: 'REFUND',
  REMOTE_SUPPORT: 'REMOTE_SUPPORT'
} as const;
export type ClaimSolution = typeof ClaimSolution[keyof typeof ClaimSolution];

export const PurchaseStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ORDERED: 'ORDERED',
  PARTIAL_RECEIVED: 'PARTIAL_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
} as const;
export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  SICK_LEAVE: 'SICK_LEAVE',
  VACATION: 'VACATION',
  PERSONAL_LEAVE: 'PERSONAL_LEAVE'
} as const;
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const TrainingStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;
export type TrainingStatus = typeof TrainingStatus[keyof typeof TrainingStatus];

export const MovementType = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
  DAMAGED: 'DAMAGED',
  LOST: 'LOST'
} as const;
export type MovementType = typeof MovementType[keyof typeof MovementType];

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

// Form interfaces for creating/updating entities
export interface CreateClientRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  hireDate: string;
  isActive: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  supplierId: number;
}

export interface CreateOrderRequest {
  clientId: number;
  employeeId: number;
  orderDate: string;
  status: OrderStatus;
  notes: string;
  orderItems: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleRequest {
  clientId: number;
  employeeId: number;
  saleDate: string;
  paymentMethod: PaymentMethod;
  notes: string;
  saleItems: CreateSaleItemRequest[];
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  price: number;
  duration: number;
  categoryId: number;
  isActive: boolean;
}

export interface CreateServiceAppointmentRequest {
  serviceId: number;
  clientId: number;
  employeeId: number;
  appointmentDate: string;
  status: AppointmentStatus;
  notes: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

// Stock Movement Create Request
export interface CreateStockMovementRequest {
  productId: number;
  type: MovementType;
  quantity: number;
  reason: string;
  reference: string;
  employeeId: number;
  warehouseId?: number;
  notes: string;
}

// Warehouse Create Request
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

// Trip Create Request
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

// Inventory Adjustment Create Request
export interface CreateInventoryAdjustmentRequest {
  productId: number;
  type: 'RECOUNT' | 'DAMAGE' | 'THEFT' | 'ADJUSTMENT';
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  reason: string;
  employeeId: number;
  date: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Legacy Presupuesto Create Request (legacy service)
export interface LegacyCreatePresupuestoRequest {
  numeroPresupuesto?: string;
  cliente: {
    id: number;
  };
  fechaPresupuesto: string;
  fechaVencimiento: string;
  estado?: PresupuestoStatus;
  total: number;
  observaciones: string;
  detalles: LegacyCreateDetallePresupuestoRequest[];
  usuario?: {
    id: number;
  };
}

export interface LegacyCreateDetallePresupuestoRequest {
  producto?: {
    id: number;
  };
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// --- RRHH (Human Resources) Entities ---
export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO' | 'LICENCIA';
export type TipoLicencia = 'VACACIONES' | 'ENFERMEDAD' | 'PERSONAL' | 'MATERNIDAD';
export type EstadoLicencia = 'SOLICITADA' | 'APROBADA' | 'RECHAZADA';

// Puestos de Trabajo - RRHH API
export interface SubtareaPuestoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  obligatoria: boolean;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface TareaPuestoDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  obligatoria: boolean;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  subtareas: SubtareaPuestoDTO[];
}

export interface PuestoListDTO {
  id: number;
  nombre: string;
  departamento?: string;
  salarioBase: number;
  version: number;
  activo: boolean;
  cantidadEmpleados: number;
  cantidadTareas: number;
}

export interface PuestoResponseDTO {
  id: number;
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase: number;
  version: number;
  activo: boolean;
  requisitos?: string;
  objetivoGeneral?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  cantidadEmpleados: number;
  tareas: TareaPuestoDTO[];
}

export interface CreatePuestoDTO {
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase?: number;
  requisitos?: string;
  objetivoGeneral?: string;
}

export interface UpdatePuestoDTO {
  nombre?: string;
  descripcion?: string;
  departamento?: string;
  salarioBase?: number;
  requisitos?: string;
  objetivoGeneral?: string;
  motivoCambio?: string;
}

export interface PuestoVersionDTO {
  id: number;
  version: number;
  snapshot: string;
  motivoCambio?: string;
  creadoPor?: string;
  fechaCreacion: string;
}

export interface CreateTareaPuestoDTO {
  nombre: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
}

export interface UpdateTareaPuestoDTO {
  nombre?: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
  activo?: boolean;
}

export interface CreateSubtareaPuestoDTO {
  nombre: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
}

export interface UpdateSubtareaPuestoDTO {
  nombre?: string;
  descripcion?: string;
  orden?: number;
  obligatoria?: boolean;
  activo?: boolean;
}

// Backward compat alias for Empleado.puesto
export type Puesto = PuestoListDTO;

export interface Empleado {
  id: number;
  empresaId: number;         // Multi-tenant: empresa ID
  sucursalId?: number;       // Multi-tenant: sucursal ID (optional)
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso?: string;
  fechaEgreso?: string;
  estado: EstadoEmpleado;
  puesto?: Puesto;
  puestoNombre?: string;
  salario: number;
  usuarioId: number | null;
  asistencias?: RegistroAsistencia[];
  licencias?: Licencia[];
  capacitaciones?: Capacitacion[];
}

export interface RegistroAsistencia {
  id: number;
  empleado: Empleado;
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  horasTrabajadas: number;
  horasExtras: number;
  observaciones?: string;
}

export interface Licencia {
  id: number;
  empleado: Empleado;
  tipo: TipoLicencia;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  motivo?: string;
  goceHaber: boolean;
  estado: EstadoLicencia;
}

export interface Capacitacion {
  id: number;
  empleado: Empleado;
  nombre: string;
  descripcion?: string;
  institucion?: string;
  fechaInicio: string;
  fechaFin: string;
  horas: number;
  certificado: boolean;
  costo: number;
}

export interface Sueldo {
  id: number;
  empleado: Empleado;
  periodo: string; // YYYY-MM format
  sueldoBasico: number;
  bonificaciones: number;
  horasExtras: number;
  comisiones: number;
  totalBruto: number;
  descuentosLegales: number;
  descuentosOtros: number;
  totalDescuentos: number;
  sueldoNeto: number;
  fechaPago?: string;
  observaciones?: string;
}

export interface Legajo {
  id: number;
  empleado: Empleado;
  numeroLegajo: string;
  fechaAlta: string;
  fechaBaja?: string;
  motivoBaja?: string;
  documentacion?: string; // JSON string with document references
  observaciones?: string;
  activo: boolean;
}

// Documentos
export interface DocumentoLegajo {
  id: number;
  legajoId: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanioBytes: number;
  descripcion?: string;
  categoria: string;
  fechaSubida: string;
  subidoPor: string;
}

export interface DocumentoCliente {
  id: number;
  clienteId: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanioBytes: number;
  descripcion?: string;
  categoria: string;
  fechaSubida: string;
  subidoPor: string;
}

export interface DocumentoEmpleado {
  id: number;
  empleadoId: number;
  nombreEmpleado?: string;
  nombreOriginal: string;
  extension?: string;
  mimeType?: string;
  sizeBytes: number;
  sizeLegible?: string;
  categoria: string;
  categoriaDescripcion?: string;
  descripcion?: string;
  fechaSubida: string;
  subidoPor?: string;
  urlDescarga?: string;
}

export interface UploadDocumentoRequest {
  file: File;
  categoria: string;
  descripcion?: string;
}

export interface UploadResponse {
  message: string;
  fileName: string | null;
  documentoId: number | null;
}

export interface Usuario {
  id: number;
  username: string;
  password: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  roles: any[];
}

// Venta (Sale)
export interface DetalleVenta {
  id: number;
  ventaId?: number;

  // Type of item (PRODUCTO or EQUIPO)
  tipoItem?: TipoItemDocumento;

  // For PRODUCTO type
  productoId?: number;
  productoNombre?: string; // Add product name for display
  producto?: Producto; // Add product info for display

  // For EQUIPO type
  recetaId?: number;
  recetaNombre?: string;
  recetaModelo?: string;
  descripcionEquipo?: string;
  color?: string;
  medida?: string;

  // For EQUIPO items - list of assigned equipment numbers
  equiposNumerosHeladera?: string[];

  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  empleadoId: number;
  empleado?: Empleado;
  usuario?: Usuario; // Add for compatibility
  ventaNumero?: string;
  numeroVenta?: string; // Add for compatibility
  fechaVenta: string;
  estado: string;
  subtotal: number;
  impuesto?: number;
  descuento?: number;
  total: number;
  metodoPago?: MetodoPago;
  observaciones?: string;
  notas?: string; // Add for compatibility
  tipoDocumento?: string;
  createdAt?: string;
  updatedAt?: string;
  detalleVentas: DetalleVenta[];
  prestamoId?: number | null;
}
export type MetodoPago = 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'FINANCIAMIENTO' | 'FINANCIACION_PROPIA' | 'CUENTA_CORRIENTE';

// Enums para equipos fabricados
export type ColorEquipo =
  | 'BLANCO_LISO'
  | 'PLATA'
  | 'MARRON'
  | 'BEIGE'
  | 'DORADO'
  | 'PLATEADO'
  | 'BRONCE'
  | 'COBRE'
  | 'INOXIDABLE'
  | 'MADERA'
  | 'ACERO'
  | 'ATAKAMA'
  | 'FAPLAC_NORDICO'
  | 'GRIS_GRAFITO'
  | 'DAKAR'
  | 'HELSINKI'
  | 'LINO_TIERRA'
  | 'MADERA_CEREJEIRA'
  | 'ROBLE_KENDAL_ENCERADO'
  | 'NEGRO_LISO'
  | 'NEGRO_VETA'
  | 'NOGAL_LINCOLN'
  | 'PREMIUM'
  | 'ROBLE_DAKAR'
  | 'ROBLE_KAISEBERG'
  | 'TEKA_ARTICO'
  | 'TEKA_OSLO'
  | 'FAPLAC_TRIBAL'
  | 'FAPLAC_NORDICO_FINLANDES';

export type MedidaEquipo =
  | '0.5m'
  | '0.8m'
  | '0.9m'
  | '1.0m'
  | '1.1m'
  | '1.2m'
  | '1.3m'
  | '1.4m'
  | '1.5m'
  | '1.6m'
  | '1.7m'
  | '1.8m'
  | '1.9m'
  | '2.0m'
  | '2.2m'
  | '2.4m'
  | '2.5m'
  | '2.8m'
  | '3.0m'
  | '30x40x50m'
  | '25x32x6cm'
  | '60x40cm'
  | '70x45cm';

// Constantes para los selectores
export const COLORES_EQUIPO: readonly ColorEquipo[] = [
  'BLANCO_LISO',
  'PLATA',
  'MARRON',
  'BEIGE',
  'DORADO',
  'PLATEADO',
  'BRONCE',
  'COBRE',
  'INOXIDABLE',
  'MADERA',
  'ACERO',
  'ATAKAMA',
  'FAPLAC_NORDICO',
  'GRIS_GRAFITO',
  'DAKAR',
  'HELSINKI',
  'LINO_TIERRA',
  'MADERA_CEREJEIRA',
  'ROBLE_KENDAL_ENCERADO',
  'NEGRO_LISO',
  'NEGRO_VETA',
  'NOGAL_LINCOLN',
  'PREMIUM',
  'ROBLE_DAKAR',
  'ROBLE_KAISEBERG',
  'TEKA_ARTICO',
  'TEKA_OSLO',
  'FAPLAC_TRIBAL',
  'FAPLAC_NORDICO_FINLANDES'
] as const;

export const MEDIDAS_EQUIPO: readonly MedidaEquipo[] = [
  '0.8m',
  '0.9m',
  '1.0m',
  '1.1m',
  '1.2m',
  '1.3m',
  '1.4m',
  '1.5m',
  '1.6m',
  '1.7m',
  '1.8m',
  '1.9m',
  '2.0m',
  '2.2m',
  '2.4m',
  '2.5m',
  '2.8m',
  '3.0m',
  '30x40x50m',
  '25x32x6cm',
  '60x40cm',
  '70x45cm'
] as const;

// DTO para crear una Venta desde el frontend
export interface CreateVentaDTO {
  clienteId: number;
  empleadoId: number; // usamos el usuario seleccionado como empleado responsable
  usuarioId?: number; // opcional si el backend lo acepta
  fechaVenta: string; // YYYY-MM-DD
  metodoPago: MetodoPago;
  observaciones?: string;
  tipoIva?: 'IVA_21' | 'IVA_10_5' | 'EXENTO';
  detalleVentas: Array<{
    productoId: number;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
  }>;
}
// Vehiculo (Vehicle)
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

export interface EmpleadoCreateDTO {
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  puestoId?: number;
  salario: number;
  estado?: EstadoEmpleado;
  sucursalId?: number;
  crearUsuario?: boolean;
  usuarioPassword?: string;
}

export interface EmpleadoUpdateDTO {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaEgreso?: string;
  puestoId?: number;
  salario?: number;
  estado?: EstadoEmpleado;
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

// TareaServicio (Service Task)
export interface tareaServicioApi {
  id: number;
  ordenServicioId: number;
  descripcion: string;
  horasEstimadas: number;
  horasReales?: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA';
  empleadoId?: number;
  empleado?: Empleado;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
}

// Rol (Role)
export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  modulo?: string;
}
export interface Factura {
  id: number;
  clienteId: number;
  fecha: string;
  estado: string;
  total: number;
  // Add other fields as required by your backend DTO
}
export interface FacturaItem {
  id: number;
  facturaId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  total: number;
  // Add other fields as required by your backend DTO
}
// Duplicate removed - using the main Producto interface at line 530

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}
export interface ProveedorDTO {
  id: number;
  razonSocial: string;
  cuit: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia?: ProvinciaEnum;
  codigoPostal: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  fechaAlta: string;
  fechaActualizacion: string;
}

export interface CreateProveedorDTO {
  razonSocial: string;
  cuit: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: ProvinciaEnum;
  codigoPostal?: string;
}
export interface ProveedorProductoDTO {
  id: number;
  proveedorId: number;
  proveedorNombre: string;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  precioProveedor: number | null;
  activo: boolean;
  fechaAlta: string;
}

export interface CreateProveedorProductoDTO {
  proveedorId: number;
  productoId: number;
  precioProveedor?: number;
}

export interface Proveedor {
  id: number;
  nombre?: string;
  razonSocial?: string;
  cuit?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado?: string;
  observaciones?: string;
  saldoActual?: number;
}

export interface CuentaCorrienteProveedor {
  id: number;
  proveedorId: number;
  proveedorNombre?: string;
  fecha: string; // ISO string
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
  saldo: number;
  compraId?: number;
  usuarioNombre?: string | null;
}

export interface CreateMovimientoProveedorPayload {
  proveedorId: number;
  fecha?: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
  compraId?: number;
}

export interface ProductoTerminado {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  codigo: string;
  categoriaProducto?: CategoriaProducto;
  activo: boolean;
  fechaCreacion: string;
}
export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface DetalleCompraDTO {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  // Campos para productos temporales
  nombreProductoTemporal?: string;
  descripcionProductoTemporal?: string;
  codigoProductoTemporal?: string;
  categoriaProductoId?: number;
  esProductoNuevo?: boolean;
}
export interface OrdenCompra {
  id: number;
  numero: string;
  proveedor?: ProveedorDTO;
  supplierId?: string | number; // Allow string or number
  fechaCreacion: string;
  fechaEntregaEstimada: string;
  fechaEntregaReal?: string;
  estado: string;
  total: number;
  items: {
    id?: number;
    productoId?: string | number; // Allow string or number
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    // Campos para productos temporales
    nombreProductoTemporal?: string;
    descripcionProductoTemporal?: string;
    codigoProductoTemporal?: string;
    categoriaProductoId?: number;
    esProductoNuevo?: boolean;
  }[];
  observaciones?: string;
  metodoPago?: MetodoPago;
}

export interface CompraDTO {
  id: number;
  proveedorId: number;
  proveedor?: ProveedorDTO;
  numero?: string;
  fechaCreacion: string;
  fechaEntrega: string;
  estado: string;
  observaciones?: string;
  metodoPago?: MetodoPago;
  detalles: {
    id?: number;
    productoId?: number;
    nombreProductoTemporal?: string;
    descripcionProductoTemporal?: string;
    codigoProductoTemporal?: string;
    categoriaProductoId?: number;
    esProductoNuevo: boolean;
    cantidad: number;
    costoUnitario: number;
  }[];
}

export interface CreateCompraDTO {
  proveedorId: number;
  fechaEntrega: string;
  observaciones?: string;
  estado?: string; // Included for state updates
  metodoPago?: MetodoPago;
  detalles: Array<{
    id?: number; // For existing detalles
    productoId?: number;
    nombreProductoTemporal?: string;
    descripcionProductoTemporal?: string;
    codigoProductoTemporal?: string;
    categoriaProductoId?: number;
    esProductoNuevo: boolean;
    cantidad: number;
    costoUnitario: number;
  }>;
}

export interface OrdenCompraItem {
  id: number;
  ordenCompraId: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  total: number;
}
export interface Inventario {
  id: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  ubicacion: string;
  fechaUltimoMovimiento: string;
  observaciones?: string;
}
export interface InventarioMovimiento {
  id: number;
  inventarioId: number;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fechaMovimiento: string;
  observaciones?: string;
  empleadoId?: number;
  empleado?: Empleado;
}
export interface InventarioAjuste {
  id: number;
  inventarioId: number;
  cantidadEsperada: number;
  cantidadReal: number;
  diferencia: number;
  motivo: string;
  fechaAjuste: string;
  empleadoId?: number;
  empleado?: Empleado;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}
export interface InventarioRecuento {
  id: number;
  inventarioId: number;
  fechaRecuento: string;
  cantidadEsperada: number;
  cantidadReal: number;
  diferencia: number;
  motivo: string;
  empleadoId?: number;
  empleado?: Empleado;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
}
export interface InventarioReporte {
  id: number;
  inventarioId: number;
  fechaInicio: string;
  fechaFin: string;
  totalEntradas: number;
  totalSalidas: number;
  saldoFinal: number;
  observaciones?: string;
} 
export interface Compra {
  id: number;
  proveedorId: number;
  proveedor?: Proveedor;
  fechaCompra: string;
  estado: string;
  total: number;
  items: CompraItem[];
  observaciones?: string;
}
export interface CompraItem {
  id: number;
  compraId: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  total: number;
}
export interface VentaItem {
  id: number;
  ventaId: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  total: number;
}
export interface MovimientoStock {
  id?: number;
  productoId: number;
  productoNombre?: string; // Backend returns this
  productoCodigo?: string; // Backend returns this
  producto?: Producto; // Optional for compatibility
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'RECUENTO' | 'SALIDA_FABRICACION' | 'REINGRESO_CANCELACION_FABRICACION';
  cantidad: number;
  stockAnterior?: number;
  stockActual?: number;
  concepto?: string;
  numeroComprobante?: string;
  fecha: string;
  usuarioId?: number;
  usuarioNombre?: string; // Backend returns this
  usuario?: Usuario; // Optional for compatibility
  equipoFabricadoId?: number;
  equipoFabricadoNumero?: string;
}

// Legacy interface for backward compatibility
export interface MovimientoStockLegacy {
  id: number;
  productoId: number;
  producto?: Producto;
  tipoMovimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fechaMovimiento: string;
  observaciones?: string;
  empleadoId?: number;
  empleado?: Empleado;
}
export interface ParametroSistema {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  tipo: string; // STRING, INTEGER, BOOLEAN, DECIMAL
  fechaActualizacion?: string;
}
export interface Configuracion {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  categoria?: string;
  tipoDato: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  fechaActualizacion: string;
}
export interface Permiso {
  id: number; 
  nombre: string;
  descripcion?: string;
  modulo?: string;
  accion?: string;
  roles?: Rol[];
  createdAt?: string;
  updatedAt?: string;
}
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

export type TipoItemDocumento = 'PRODUCTO' | 'EQUIPO';

export const EstadoDocumento = {
  PENDIENTE: "PENDIENTE",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
  CONFIRMADA: "CONFIRMADA",
  PAGADA: "PAGADA",
  VENCIDA: "VENCIDA",
  FACTURADA: "FACTURADA"
} as const;
export type EstadoDocumento = typeof EstadoDocumento[keyof typeof EstadoDocumento];

export interface DocumentoComercial {
  id: number;
  numeroDocumento: string;
  tipoDocumento: 'PRESUPUESTO' | 'NOTA_PEDIDO' | 'FACTURA' | 'NOTA_CREDITO';
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
  estado: EstadoDocumento;
  metodoPago: MetodoPago;
  observaciones?: string;
  detalles: DetalleDocumento[];
  opcionesFinanciamiento?: OpcionFinanciamiento[];
  opcionFinanciamientoSeleccionadaId?: number;
  documentoOrigenId?: number;
  documentoOrigenNumero?: string;
  documentoOrigenTipo?: string;
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
  color?: string;
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
  color?: string;
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
  equiposAsignaciones?: { [detalleId: number]: number[] }; // Map of DetalleDocumento ID to List of EquipoFabricado IDs
  cantidadCuotas?: number;
  tipoFinanciacion?: string;
  primerVencimiento?: string;
  porcentajeEntregaInicial?: number | null;
  montoEntregaInicial?: number | null;
  tasaInteres?: number;
  confirmarConDeudaPendiente?: boolean;
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
  medida?: string;
  color?: string;
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
  medida?: string;
  color?: string;
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
  medida?: string;
  color?: string;
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
  medida?: string;
  color?: string;
  observaciones?: string;
  precioVenta?: number;
  disponibleParaVenta?: boolean;
  activo?: boolean;
}

export type TipoEquipo = 'HELADERA' | 'COOLBOX' | 'EXHIBIDOR' | 'OTRO';

export type EstadoAsignacionEquipo = 'DISPONIBLE' | 'RESERVADO' | 'FACTURADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'PENDIENTE_TERMINACION';

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
  color?: string;
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
}

export interface EquipoFabricadoListDTO {
  id: number;
  empresaId: number;         // Multi-tenant: empresa ID
  tipo: TipoEquipo;
  modelo: string;
  medida?: MedidaEquipo;
  numeroHeladera: string;
  color?: string;
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
}

export interface EquipoFabricadoCreateDTO {
  recetaId?: number;
  tipo: TipoEquipo;
  modelo: string;
  equipo?: string;
  medida?: MedidaEquipo;
  color?: string;
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
  medida?: MedidaEquipo;
  color?: string;
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
  medida?: MedidaEquipo;
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

// --- Sistema de Entregas Integrado ---

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

// --- Sistema de Roles y Permisos ---
export type TipoRol = 'ADMIN' | 'USER' | 'VENDEDOR' | 'TALLER' | 'OFICINA' | 'USUARIO' | 'ADMIN_EMPRESA' | 'GERENTE_SUCURSAL';

export type Modulo =
  | 'DASHBOARD'
  | 'VENTAS'
  | 'CLIENTES'
  | 'PROVEEDORES'
  | 'LOGISTICA'
  | 'TALLER'
  | 'PRODUCCION'
  | 'TRANSPORTE'
  | 'GARANTIAS'
  | 'RRHH'
  | 'ADMIN'
  | 'ADMINISTRACION'
  | 'PRESTAMOS';

export type UserRole = 
  | 'ADMIN'
  | 'GERENTE'
  | 'VENDEDOR'
  | 'PRODUCCION'
  | 'LOGISTICA'
  | 'TALLER'
  | 'RRHH';

export interface DashboardMetric {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// --- Sistema de Gestión de Depósitos ---

// Depósito (Warehouse/Storage Location)
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

// ============================================
// NUEVAS INTERFACES: Sistema Multi-Depósito
// ============================================

// Distribución por Depósito en Órdenes de Compra
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

// Auditoría de Movimientos Completa
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

// Stock Global con discriminación por depósito
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

// ============================================
// MÓDULO DE GESTIÓN DE CHEQUES
// ============================================

// ==================== BANCOS ====================

// Entidad Banco - Coincide con BancoDTO del backend
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

// ==================== CHEQUES ====================

// Tipo de cheque (Backend: TipoCheque enum)
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

// ============================================
// MÓDULO DE RECONCILIACIÓN DE STOCK V2
// ============================================

// Estado de reconciliación (Backend: EstadoReconciliacion enum)
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

// ==================== FLUJO DE CAJA MEJORADO ====================

// Tipos para movimientos extras
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

// Resumen por estado de cheque
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

// Evolución diaria del backend
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

// Stock Planificación de Fabricación
export * from './stockPlanificacion.types';

// Posición Patrimonial
export * from './posicionPatrimonial.types';
