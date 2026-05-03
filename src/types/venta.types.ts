import type { Cliente, Client } from './cliente.types';
import type { Empleado, Employee } from './rrhh.types';
import type { Usuario } from './admin.types';
import type { Producto, Product, Category } from './producto.types';
import type { TipoItemDocumento } from './documentoComercial.types';
// Ventas, presupuestos, facturas, métodos de pago, servicios y citas.

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
export const PresupuestoStatus = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO', 
  RECHAZADO: 'RECHAZADO',
  VENCIDO: 'VENCIDO'
} as const;
export type PresupuestoStatus = typeof PresupuestoStatus[keyof typeof PresupuestoStatus];
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
// Kept aligned with backend enum com.ripser_back.enums.MetodoPago:
//   EFECTIVO, TARJETA_CREDITO, TARJETA_DEBITO, TRANSFERENCIA_BANCARIA,
//   CUENTA_CORRIENTE, CHEQUE, MERCADO_PAGO, FINANCIACION_PROPIA
// 'TRANSFERENCIA' and 'FINANCIAMIENTO' are kept as legacy aliases used by older UI code
// (NotasPedidoPage Select, opciones-financiamiento lists) while the codebase converges.
export const MetodoPago = {
  EFECTIVO: 'EFECTIVO',
  TARJETA_CREDITO: 'TARJETA_CREDITO',
  TARJETA_DEBITO: 'TARJETA_DEBITO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  TRANSFERENCIA_BANCARIA: 'TRANSFERENCIA_BANCARIA',
  CHEQUE: 'CHEQUE',
  MERCADO_PAGO: 'MERCADO_PAGO',
  FINANCIAMIENTO: 'FINANCIAMIENTO',
  FINANCIACION_PROPIA: 'FINANCIACION_PROPIA',
  CUENTA_CORRIENTE: 'CUENTA_CORRIENTE',
} as const;
export type MetodoPago = typeof MetodoPago[keyof typeof MetodoPago];

// Color del equipo: ahora es una entidad parametrizable, no un enum.
// Mirror del DTO del backend (ver entities/Color.java + dto/color/ColorDTO.java).
// El catálogo se administra vía /api/colores.
export interface ColorEquipo {
  id: number;
  nombre: string;
  activo: boolean;
}

// Medida del equipo: ahora es una entidad parametrizable, no un union de strings.
// Mirror del DTO del backend (entities/Medida.java + dto/medida/MedidaDTO.java).
// El catálogo se administra vía /api/medidas.
export interface MedidaEquipo {
  id: number;
  nombre: string;
  activo: boolean;
}

// El listado de colores y medidas ya no vive en código: se cargan vía
// colorApi/medidaApi y se exponen vía ColoresContext / MedidasContext.

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
export interface VentaItem {
  id: number;
  ventaId: number;
  productoId: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA_CREDITO: 'Tarjeta de Crédito',
  TARJETA_DEBITO: 'Tarjeta de Débito',
  TRANSFERENCIA: 'Transferencia',
  TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
  CHEQUE: 'Cheque',
  MERCADO_PAGO: 'Mercado Pago',
  FINANCIAMIENTO: 'Financiamiento',
  FINANCIACION_PROPIA: 'Financiación Propia',
  CUENTA_CORRIENTE: 'Cuenta Corriente',
};