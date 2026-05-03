import type { Empleado, Employee } from './rrhh.types';
import type { Usuario } from './admin.types';
// Productos, categorías, inventario y movimientos de stock.

export interface ProductoSimple {
  id: number;
  nombre: string;
  precio: number;
}
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
export const TipoEntidadProducto = {
  MATERIAL: 'MATERIAL',
  PRODUCTO_TERMINADO: 'PRODUCTO_TERMINADO',
} as const;
export type TipoEntidadProducto = typeof TipoEntidadProducto[keyof typeof TipoEntidadProducto];

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
  tipoEntidad?: TipoEntidadProducto;
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
export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  esReventa?: boolean;
}
export const MovementType = {
  ENTRY: 'ENTRY',
  EXIT: 'EXIT',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
  DAMAGED: 'DAMAGED',
  LOST: 'LOST'
} as const;
export type MovementType = typeof MovementType[keyof typeof MovementType];
export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  supplierId: number;
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
export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
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
