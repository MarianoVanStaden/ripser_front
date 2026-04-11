import type { RolEmpresa, Sucursal } from '../types/tenant.types';

/**
 * Verifica si un usuario puede cambiar de sucursal temporalmente
 */
export const canChangeSucursal = (rol: RolEmpresa | null, esSuperAdmin: boolean): boolean => {
  if (esSuperAdmin) return true;
  if (!rol) return false;
  return rol === 'ADMIN_EMPRESA' || rol === 'GERENTE_SUCURSAL' || rol === 'SUPERVISOR';
};

/**
 * Verifica si un usuario puede ver todas las sucursales de su empresa
 */
export const canViewAllSucursales = (rol: RolEmpresa | null, esSuperAdmin: boolean): boolean => {
  return canChangeSucursal(rol, esSuperAdmin);
};

/**
 * Obtiene el label formateado para mostrar una sucursal
 */
export const getSucursalLabel = (sucursal: Sucursal | null, esDefecto: boolean): string => {
  if (!sucursal) return 'Todas las sucursales';
  return esDefecto ? `${sucursal.nombre} (Por defecto)` : sucursal.nombre;
};

/**
 * Verifica si un usuario puede gestionar sucursales (crear, editar, eliminar)
 */
export const canManageSucursales = (rol: RolEmpresa | null, esSuperAdmin: boolean): boolean => {
  if (esSuperAdmin) return true;
  if (!rol) return false;
  return rol === 'ADMIN_EMPRESA';
};
