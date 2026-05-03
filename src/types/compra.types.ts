import type { ProvinciaEnum } from './shared.enums';
import type { Producto, Product, Supplier } from './producto.types';
import type { TipoMovimiento } from './cliente.types';
import type { MetodoPago } from './venta.types';
import type { Employee } from './rrhh.types';
// Compras, proveedores, órdenes de compra y cuenta corriente proveedor.

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
  cajaPesosId?: number | null;
  cajaAhorroId?: number | null;
}

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
export const PurchaseStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  ORDERED: 'ORDERED',
  PARTIAL_RECEIVED: 'PARTIAL_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED'
} as const;
export type PurchaseStatus = typeof PurchaseStatus[keyof typeof PurchaseStatus];
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
  metodoPago?: MetodoPago;
  cajaPesosId?: number | null;
  cajaAhorroId?: number | null;
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
