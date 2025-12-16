import type { UsuarioDTO, TipoRol } from '../api/services/usuarioAdminApi';
import type { UsuarioEmpresa, RolEmpresa } from './tenant.types';

/**
 * Extended user type that includes empresa assignments
 */
export interface UsuarioWithEmpresa extends UsuarioDTO {
  usuarioEmpresas: UsuarioEmpresa[];
}

/**
 * DTO for creating a user with empresa assignment in a single operation
 */
export interface CreateUsuarioWithEmpresaDTO {
  // Global user data
  username: string;
  password: string;
  email: string;
  nombre?: string;
  apellido?: string;

  // Tenant assignment
  rolEmpresa: RolEmpresa;
  empresaId: number;  // Super Admin can choose, ADMIN_EMPRESA uses their own
  sucursalId?: number;  // Optional for branch-specific roles
  sucursalDefectoId?: number;  // Default branch
  observaciones?: string;
}

/**
 * Role option with UI metadata for empresa roles
 */
export interface RolEmpresaOption {
  value: RolEmpresa;
  label: string;
  description: string;
  color: string;
  requiresSucursal: boolean;  // True for GERENTE_SUCURSAL, SUPERVISOR, USUARIO_SUCURSAL
  systemRole: TipoRol;  // Mapped system role
}
