// Multi-tenant types for empresas, sucursales, and user assignments

export interface Empresa {
  id: number;
  nombre: string;
  cuit?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  logo?: string;
  configuracion?: string;
  estado: EstadoEmpresa;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export type EstadoEmpresa = 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO';

export interface Sucursal {
  id: number;
  empresaId: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  esPrincipal: boolean;
  estado: EstadoSucursal;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export type EstadoSucursal = 'ACTIVO' | 'INACTIVO';

export interface UsuarioEmpresa {
  id: number;
  usuarioId: number;
  empresaId: number;
  sucursalId?: number;
  rol: RolEmpresa;
  permisos?: string;
  esActivo: boolean;
  sucursalDefectoId?: number;
  fechaAsignacion: string;
  fechaActualizacion?: string;
  fechaDesactivacion?: string;
  observaciones?: string;
}

export type RolEmpresa =
  | 'SUPER_ADMIN'
  | 'ADMIN_EMPRESA'
  | 'GERENTE_SUCURSAL'
  | 'SUPERVISOR'
  | 'TALLER'
  | 'OFICINA'
  | 'USUARIO_SUCURSAL'
  | 'COBRANZAS';

export interface CreateEmpresaDTO {
  nombre: string;
  cuit?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  estado: EstadoEmpresa;
}

export interface UpdateEmpresaDTO {
  nombre?: string;
  cuit?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  estado?: EstadoEmpresa;
  logo?: string;
  configuracion?: string;
}

export interface CreateSucursalDTO {
  empresaId: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  esPrincipal: boolean;
  estado: EstadoSucursal;
}

export interface UpdateSucursalDTO {
  codigo?: string;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado?: EstadoSucursal;
}

export interface AsignarUsuarioDTO {
  usuarioId: number;
  empresaId: number;
  sucursalId?: number;
  sucursalDefectoId?: number;
  rol: RolEmpresa;
  observaciones?: string;
}

export interface UpdateUsuarioEmpresaDTO {
  sucursalId?: number;
  rol?: RolEmpresa;
  sucursalDefectoId?: number;
  observaciones?: string;
}

export interface CambiarRolDTO {
  rol: RolEmpresa;
}
