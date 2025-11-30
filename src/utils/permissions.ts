import type { AuthResponse, RolEmpresa } from '../types';

/**
 * Check if user can access multiple empresas
 */
export const canAccessMultipleEmpresas = (user: AuthResponse | null): boolean => {
  return user?.esSuperAdmin === true;
};

/**
 * Check if user can manage empresas (create, update, delete)
 */
export const canManageEmpresas = (user: AuthResponse | null): boolean => {
  return user?.esSuperAdmin === true;
};

/**
 * Check if user can manage sucursales (create, update, delete)
 */
export const canManageSucursales = (user: AuthResponse | null): boolean => {
  if (!user) return false;
  return (
    user.esSuperAdmin === true ||
    user.roles?.includes('ADMIN_EMPRESA') ||
    user.roles?.includes('ADMIN')
  );
};

/**
 * Check if user can view consolidated reports across empresa or sucursales
 */
export const canViewConsolidatedReports = (user: AuthResponse | null): boolean => {
  if (!user) return false;
  return (
    user.esSuperAdmin === true ||
    user.roles?.includes('ADMIN_EMPRESA') ||
    user.roles?.includes('ADMIN')
  );
};

/**
 * Check if user can manage other users
 */
export const canManageUsuarios = (user: AuthResponse | null): boolean => {
  if (!user) return false;
  return (
    user.esSuperAdmin === true ||
    user.roles?.includes('ADMIN_EMPRESA') ||
    user.roles?.includes('GERENTE_SUCURSAL') ||
    user.roles?.includes('ADMIN')
  );
};

/**
 * Check if user has access to a specific sucursal
 */
export const hasAccessToSucursal = (
  user: AuthResponse | null,
  sucursalId: number
): boolean => {
  if (!user) return false;
  if (user.esSuperAdmin) return true;
  if (!user.sucursalId) return true; // Has access to all sucursales
  return user.sucursalId === sucursalId;
};

/**
 * Check if user has access to a specific empresa
 */
export const hasAccessToEmpresa = (
  user: AuthResponse | null,
  empresaId: number
): boolean => {
  if (!user) return false;
  if (user.esSuperAdmin) return true;
  return user.empresaId === empresaId;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: AuthResponse | null): boolean => {
  return user?.esSuperAdmin === true;
};

/**
 * Check if user is admin of their empresa
 */
export const isAdminEmpresa = (user: AuthResponse | null): boolean => {
  if (!user) return false;
  return (
    user.esSuperAdmin === true ||
    user.roles?.includes('ADMIN_EMPRESA') ||
    user.roles?.includes('ADMIN')
  );
};

/**
 * Check if user is gerente of a sucursal
 */
export const isGerenteSucursal = (user: AuthResponse | null): boolean => {
  if (!user) return false;
  return (
    user.esSuperAdmin === true ||
    user.roles?.includes('ADMIN_EMPRESA') ||
    user.roles?.includes('GERENTE_SUCURSAL') ||
    user.roles?.includes('ADMIN')
  );
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role: RolEmpresa | string): string => {
  const roleMap: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrador',
    ADMIN_EMPRESA: 'Administrador de Empresa',
    GERENTE_SUCURSAL: 'Gerente de Sucursal',
    SUPERVISOR: 'Supervisor',
    USUARIO_SUCURSAL: 'Usuario de Sucursal',
    ADMIN: 'Administrador',
    USER: 'Usuario',
    VENDEDOR: 'Vendedor',
    TALLER: 'Taller',
    OFICINA: 'Oficina',
    USUARIO: 'Usuario'
  };
  return roleMap[role] || role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (
  user: AuthResponse | null,
  roles: string[]
): boolean => {
  if (!user || !user.roles) return false;
  return roles.some((role) => user.roles?.includes(role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (
  user: AuthResponse | null,
  roles: string[]
): boolean => {
  if (!user || !user.roles) return false;
  return roles.every((role) => user.roles?.includes(role));
};
