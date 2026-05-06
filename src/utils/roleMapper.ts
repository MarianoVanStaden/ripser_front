import type { RolEmpresa } from '../types/tenant.types';
import type { TipoRol } from '../api/services/usuarioAdminApi';
import type { RolEmpresaOption } from '../types/usuario-enhanced.types';

/**
 * Available empresa roles with metadata for UI rendering
 */
export const ROLES_EMPRESA_OPTIONS: RolEmpresaOption[] = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super Administrador',
    description: 'Acceso completo al sistema, puede administrar todas las empresas',
    color: '#d32f2f',
    requiresSucursal: false,
    systemRole: 'ADMIN'
  },
  {
    value: 'ADMIN_EMPRESA',
    label: 'Administrador de Empresa',
    description: 'Administra una empresa específica y sus sucursales',
    color: '#f57c00',
    requiresSucursal: false,
    systemRole: 'ADMIN'
  },
  {
    value: 'GERENTE_SUCURSAL',
    label: 'Gerente de Sucursal',
    description: 'Gestiona una sucursal específica',
    color: '#1976d2',
    requiresSucursal: true,
    systemRole: 'VENDEDOR'
  },
  {
    value: 'SUPERVISOR',
    label: 'Supervisor',
    description: 'Supervisa operaciones en una sucursal',
    color: '#388e3c',
    requiresSucursal: true,
    systemRole: 'VENDEDOR'
  },
  {
    value: 'TALLER',
    label: 'Técnico de Taller',
    description: 'Acceso a módulo de taller, garantías y logística',
    color: '#5d4037',
    requiresSucursal: true,
    systemRole: 'TALLER'
  },
  {
    value: 'OFICINA',
    label: 'Personal de Oficina',
    description: 'Acceso a ventas, clientes, proveedores y logística',
    color: '#0288d1',
    requiresSucursal: true,
    systemRole: 'OFICINA'
  },
  {
    value: 'USUARIO_SUCURSAL',
    label: 'Usuario de Sucursal',
    description: 'Usuario básico de sucursal',
    color: '#7b1fa2',
    requiresSucursal: true,
    systemRole: 'USUARIO'
  },
  {
    value: 'COBRANZAS',
    label: 'Cobranzas',
    description: 'Acceso a Registro de Ventas, Gestión y Carpeta de Clientes, y módulo Cobranzas',
    color: '#00897b',
    requiresSucursal: false,
    systemRole: 'COBRANZAS'
  }
];

/**
 * Maps a tenant role (RolEmpresa) to its corresponding system role (TipoRol)
 *
 * @param rolEmpresa - The empresa role to map
 * @returns The corresponding system role
 */
export const mapRolEmpresaToSystemRole = (rolEmpresa: RolEmpresa): TipoRol => {
  const option = ROLES_EMPRESA_OPTIONS.find(opt => opt.value === rolEmpresa);
  return option?.systemRole || 'USUARIO';
};

/**
 * Gets the role option metadata for a given empresa role
 *
 * @param rol - The empresa role
 * @returns The role option with UI metadata, or undefined if not found
 */
export const getRolEmpresaOption = (rol: RolEmpresa): RolEmpresaOption | undefined => {
  return ROLES_EMPRESA_OPTIONS.find(opt => opt.value === rol);
};

/**
 * Gets the list of roles available to the current user based on their permissions
 *
 * @param isSuperAdmin - Whether the current user is a Super Admin
 * @returns Array of role options available to create
 */
export const getAvailableRolesForUser = (isSuperAdmin: boolean): RolEmpresaOption[] => {
  if (isSuperAdmin) {
    // Super Admins can create any role
    return ROLES_EMPRESA_OPTIONS;
  }
  // ADMIN_EMPRESA cannot create SUPER_ADMIN users
  return ROLES_EMPRESA_OPTIONS.filter(role => role.value !== 'SUPER_ADMIN');
};
