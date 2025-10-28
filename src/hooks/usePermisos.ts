import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { TipoRol, Modulo } from '../types';

export type { Modulo } from '../types';

type PermisosMap = Record<TipoRol, Modulo[]>;

// Matriz de permisos: debe coincidir con la configuración del backend
const PERMISOS_POR_ROL: PermisosMap = {
  ADMIN: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH'],

  OFICINA: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'GARANTIAS'],

  VENDEDOR: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'GARANTIAS'],

  TALLER: ['DASHBOARD', 'TALLER', 'GARANTIAS', 'LOGISTICA'],

  USER: ['DASHBOARD'],

  USUARIO: ['DASHBOARD'],
};

export const usePermisos = () => {
  const { user } = useAuth();

  const roles = useMemo(() => user?.roles || [], [user]);

  /**
   * Verifica si el usuario tiene permiso para acceder a un módulo
   */
  const tienePermiso = (modulo: Modulo): boolean => {
    if (!roles || roles.length === 0) {
      return false;
    }

    // Si es ADMIN, tiene acceso a todo
    if (roles.includes('ADMIN')) {
      return true;
    }

    // Verifica si alguno de los roles del usuario tiene permiso
    return roles.some((rol) => {
      const modulosPermitidos = PERMISOS_POR_ROL[rol] || [];
      return modulosPermitidos.includes(modulo);
    });
  };

  /**
   * Obtiene todos los módulos permitidos para el usuario actual
   */
  const modulosPermitidos = useMemo((): Modulo[] => {
    if (!roles || roles.length === 0) {
      return [];
    }

    // Si es ADMIN, retorna todos los módulos
    if (roles.includes('ADMIN')) {
      return ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH'];
    }

    // Combina módulos de todos los roles del usuario
    const modulos = new Set<Modulo>();
    roles.forEach((rol) => {
      const permisos = PERMISOS_POR_ROL[rol] || [];
      permisos.forEach((modulo) => modulos.add(modulo));
    });

    return Array.from(modulos);
  }, [roles]);

  /**
   * Verifica si el usuario tiene al menos uno de los roles especificados
   */
  const tieneRol = (...rolesRequeridos: TipoRol[]): boolean => {
    if (!roles || roles.length === 0) {
      return false;
    }
    return rolesRequeridos.some((rol) => roles.includes(rol));
  };

  /**
   * Verifica si el usuario es administrador
   */
  const esAdmin = useMemo(() => roles.includes('ADMIN'), [roles]);

  return {
    tienePermiso,
    modulosPermitidos,
    tieneRol,
    esAdmin,
    roles,
  };
};
