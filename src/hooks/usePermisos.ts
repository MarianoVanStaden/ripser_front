import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { TipoRol, Modulo } from '../types';

export type { Modulo } from '../types';

type PermisosMap = Record<TipoRol, Modulo[]>;

// Matriz de permisos: debe coincidir con la configuración del backend
const PERMISOS_POR_ROL: PermisosMap = {
  ADMIN: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH', 'PRESTAMOS'],

  OFICINA: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'GARANTIAS', 'PRESTAMOS'],

  VENDEDOR: ['VENTAS', 'CLIENTES'], // Se removió GARANTIAS

  // El rol TALLER ve: Proveedores (sólo gestión y compras — filtrado fino en Sidebar),
  // Logística completa, Taller completo, Producción completa, Garantías completa.
  // El detalle por path se controla en tallerAllowedPaths en Sidebar.tsx.
  TALLER: ['DASHBOARD', 'TALLER', 'GARANTIAS', 'LOGISTICA', 'PROVEEDORES', 'PRODUCCION'],

  USER: ['DASHBOARD'],

  USUARIO: ['DASHBOARD'],

  ADMIN_EMPRESA: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH', 'ADMINISTRACION', 'PRESTAMOS'],

  // Administrador "empleado": ve lo mismo que ADMIN_EMPRESA salvo RRHH. El
  // filtrado fino por pantalla (ej. /taller/configuracion) se maneja en Sidebar
  // via adminEmpresaLimitadoDeniedPaths. NO incluye 'ADMIN' como systemRole para
  // no bypassear los guards de scope.
  ADMIN_EMPRESA_LIMITADO: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'ADMINISTRACION', 'PRESTAMOS'],

  GERENTE_SUCURSAL: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'GARANTIAS', 'RRHH', 'PRESTAMOS'],

  // Acceso restringido: el filtrado fino por path se hace en Sidebar (cobranzasAllowedPaths).
  COBRANZAS: ['CLIENTES', 'ADMINISTRACION', 'GARANTIAS', 'PRESTAMOS'],

  // Armado de viajes / entregas. Igual que COBRANZAS: declaramos los módulos
  // (secciones) que se ven y el detalle se filtra por allowlist en Sidebar
  // (transporteAllowedPaths) para esconder items dentro de cada sección.
  TRANSPORTE: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'TRANSPORTE', 'PRODUCCION', 'GARANTIAS', 'TALLER'],

  // Acceso EXCLUSIVO al módulo RRHH. No incluye DASHBOARD genérico — la home
  // (/) redirige a /rrhh/dashboard via DashboardEntry. Todo el resto queda
  // bloqueado por usePermisos + allowlist de Sidebar (rrhhAllowedPaths).
  RECURSOS_HUMANOS: ['RRHH'],
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
      return ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH', 'PRESTAMOS'];
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
