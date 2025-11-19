// --- Garantía (Warranty) Aliases for Frontend Consistency ---
export type Garantia = Warranty;
export type ReclamoGarantia = WarrantyClaim;
// Core Business Entities
// Client entity interface (extended to match backend)
export interface Cliente {
  id: number;
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  cuit?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  tipo: TipoCliente;
  estado: EstadoCliente;
  limiteCredito?: number;
  saldoActual: number;
  fechaAlta: string; // ISO 8601 string
  fechaActualizacion: string; // ISO 8601 string
  contactos?: ContactoCliente[];
  cuentaCorriente?: CuentaCorriente[];
  ventas?: Venta[];
  creditos?: CreditoCliente[]; // New field
  calificacion?: number; // New field (e.g., 0.00 to 5.00)
}

export interface CreateMovimientoPayload {
  clienteId: number;
  fecha: string;
  tipo: TipoMovimiento;
  importe: number;
  concepto: string;
  numeroComprobante?: string;
  documentoComercialId?: number;
  opcionFinanciamientoId?: number;
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
  
export interface CreditoCliente {
  id: number;
  montoOtorgado: number;
  saldoPendiente: number;
  fechaOtorgamiento: string; // ISO 8601 string
  estado: 'VIGENTE' | 'PAGADO' | 'VENCIDO';
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
  provincia?: string;
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

export interface Puesto {
  id: number;
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase: number;
}

export interface Empleado {
  id: number;
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
  salario: number;
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
  descripcionEquipo?: string;

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
  createdAt?: string;
  updatedAt?: string;
  detalleVentas: DetalleVenta[];
}
export type MetodoPago = 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA_BANCARIA' | 'CHEQUE'| 'FINANCIACION_PROPIA' | 'OTRO';

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
  patente: string;
  marca: string;
  modelo: string;
  año: number;
  estado: string;
  capacidad?: number;
  observaciones?: string;
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

export type EstadoViaje = 'PLANIFICADO' | 'EN_CURSO' | 'COMPLETADO' | 'CANCELADO';

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
  viaje?: Viaje;
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

// Puesto (Job Position)
export interface Puesto {
  id: number;
  nombre: string;
  descripcion?: string;
  departamento?: string;
  salarioBase: number;
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
  provincia: string;
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
  provincia?: string;
  codigoPostal?: string;
}
export interface Proveedor {
  id: number;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado: string;
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
  categoria?: string;
  tipoDato: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  fechaActualizacion: string;
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
  VENCIDA: "VENCIDA"
} as const;
export type EstadoDocumento = typeof EstadoDocumento[keyof typeof EstadoDocumento];

export interface DocumentoComercial {
  id: number;
  numeroDocumento: string;
  tipoDocumento: 'PRESUPUESTO' | 'NOTA_PEDIDO' | 'FACTURA';
  clienteId: number;
  clienteNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fechaEmision: string; // ISO string
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

export interface Presupuesto {
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
  clienteId: number;
  usuarioId: number;
  detalles: DetalleDocumentoDTO[];
  observaciones?: string;
}

export interface ConvertToFacturaDTO {
  notaPedidoId: number;
  descuento?: number;
  equiposAsignaciones?: { [detalleId: number]: number[] }; // Map of DetalleDocumento ID to List of EquipoFabricado IDs
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
export interface EquipoFabricadoDTO {
  id: number;
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
  estado: EstadoFabricacion;
  fechaFinalizacion?: string;
  responsableId?: number;
  responsableNombre?: string;
  clienteId?: number;
  clienteNombre?: string;
}

export interface EquipoFabricadoListDTO {
  id: number;
  tipo: TipoEquipo;
  modelo: string;
  numeroHeladera: string;
  color?: string;
  cantidad: number;
  asignado: boolean;
  estado: EstadoFabricacion;
  fechaCreacion: string;
  fechaFinalizacion?: string;
  responsableNombre?: string;
  clienteNombre?: string;
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
export type EstadoFabricacion = 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';

// Response for batch equipment creation
export interface EquipoCreationResponseDTO {
  cantidadCreada: number;
  equipos: EquipoFabricadoDTO[];
  mensaje: string;
}

// Validación de stock para fabricación
export interface ValidacionStockDTO {
  stockSuficiente: boolean;
  productosInsuficientes?: string[];
  mensaje: string;
}

// --- Sistema de Roles y Permisos ---
export type TipoRol = 'ADMIN' | 'USER' | 'VENDEDOR' | 'TALLER' | 'OFICINA' | 'USUARIO';

export type Modulo =
  | 'DASHBOARD'
  | 'VENTAS'
  | 'CLIENTES'
  | 'PROVEEDORES'
  | 'LOGISTICA'
  | 'TALLER'
  | 'PRODUCCION'
  | 'GARANTIAS'
  | 'RRHH'
  | 'ADMIN';
