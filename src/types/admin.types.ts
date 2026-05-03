// Catálogos de sistema: usuarios, roles, permisos, parámetros, módulos, dashboard, búsqueda.

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
export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  modulo?: string;
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
export interface SearchSuggestion {
  id: number;
  label: string;
  codigo?: string;
  tipo: 'PRODUCTO' | 'CATEGORIA';
}

export interface ProveedorOfertaDTO {
  proveedorId: number;
  razonSocial: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  provincia?: string;
  productoId: number;
  productoNombre: string;
  productoCodigo?: string;
  precioProveedor: number | null;
  activo: boolean;
}
