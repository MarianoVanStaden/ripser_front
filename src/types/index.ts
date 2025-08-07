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
  limiteCredito: number;
  saldoActual: number;
  fechaAlta: string;
  fechaActualizacion: string;
  contactos?: ContactoCliente[];
  cuentaCorriente?: CuentaCorriente[];
  ventas?: any[]; // Reference to sales
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
  ventaId?: number;
  venta?: any; // Reference to sale
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
  clientId: number;
  client?: Client;
  employeeId: number;
  employee?: Employee;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  status: PresupuestoStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  observations: string;
  items: PresupuestoItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PresupuestoItem {
  id: number;
  presupuestoId: number;
  productId?: number;
  serviceId?: number;
  product?: Product;
  service?: Service;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Warranty entity
export interface Warranty {
  id: number;
  productId: number;
  product?: Product;
  clientId: number;
  client?: Client;
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
  tripNumber: string;
  driverId: number;
  driver?: Employee;
  vehicleId: number;
  vehicle?: Vehicle;
  startDate: string;
  endDate?: string;
  status: TripStatus;
  deliveries: Delivery[];
  totalDistance: number;
  observations: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  productoTerminadoId: number;
  productoTerminado?: ProductoTerminado;
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
  empleado?: Employee;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
}

export interface OrdenServicio {
  id: number;
  numero: string;
  clienteId: number;
  cliente?: Cliente;
  fechaCreacion: string;
  estado: 'ABIERTA' | 'EN_PROCESO' | 'CERRADA';
  descripcion: string;
  materiales: MaterialUtilizado[];
  tareas: TareaServicio[];
  observaciones?: string;
}

export interface CategoriaProducto {
  id: number;
  nombre: string;
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
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CONVERTED: 'CONVERTED'
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
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
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
  tripNumber: string;
  driverId: number;
  vehicleId: number;
  startDate: string;
  endDate?: string;
  status: TripStatus;
  totalDistance: number;
  observations: string;
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

// Presupuesto Create Request
export interface CreatePresupuestoRequest {
  clientId: number;
  employeeId: number;
  quoteDate: string;
  validUntil: string;
  status?: PresupuestoStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  observations: string;
  items: CreatePresupuestoItemRequest[];
}

export interface CreatePresupuestoItemRequest {
  productId?: number;
  serviceId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
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
export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  rolNombre: string;
  // Add more fields as needed
}

// Venta (Sale)
export interface Venta {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  empleadoId: number;
  empleado?: Empleado;
  ventaNumero?: string;
  fechaVenta: string;
  estado: string;
  subtotal: number;
  impuesto?: number;
  descuento?: number;
  total: number;
  metodoPago?: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
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
  estado: string;
  observaciones?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  categoriaId?: number;
  categoria?: Categoria;
  proveedorId?: number;
  proveedor?: Proveedor;
  unidadMedidaId?: number;
  unidadMedida?: UnidadMedida;
}
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
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
export interface OrdenCompra {
  id: number;
  proveedorId: number;
  proveedor?: Proveedor;
  fechaOrden: string;
  estado: string;
  total: number;
  items: OrdenCompraItem[];
  observaciones?: string;
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
export type TipoDocumento = 'PRESUPUESTO' | 'NOTA_PEDIDO' | 'FACTURA';
export type EstadoDocumento = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PAGADA' | 'VENCIDA';
export type MetodoPago = 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'CHEQUE' | 'OTRO';
export type TipoIva = 'IVA_21' | 'IVA_10_5' | 'EXENTO';


export interface CreateDocumentoComercialDetalleDTO {
  productoId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

export interface CreateDocumentoComercialDTO {
  tipoDocumento: TipoDocumento;
  clienteId: number;
  usuarioId: number;
  fechaVencimiento: string; // ISO string
  observaciones?: string;
  tipoIva: TipoIva;
  metodoPago: MetodoPago;
  detalles: CreateDocumentoComercialDetalleDTO[];
}

export interface DocumentoComercialDetalleDTO {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface DocumentoComercialDTO {
  id: number;
  numeroDocumento: string;
  tipoDocumento: TipoDocumento;
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
  };
  usuario: {
    id: number;
    username: string;
  };
  fechaEmision: string;
  fechaVencimiento: string;
  subtotal: number;
  iva: number;
  total: number;
  tipoIva: TipoIva;
  estado: EstadoDocumento;
  metodoPago: MetodoPago;
  observaciones?: string;
  detalles: DocumentoComercialDetalleDTO[];
}
