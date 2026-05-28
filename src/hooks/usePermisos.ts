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

  // SUPERVISOR: unión de los accesos de VENDEDOR + COBRANZAS + TRANSPORTE.
  // Además ve Métrica de Leads (que VENDEDOR tiene denegado) y aterriza
  // ahí al iniciar sesión (ver DashboardEntry en App.tsx).
  // Filtrado fino por path: supervisorAllowedPaths en Sidebar.tsx.
  SUPERVISOR: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PRESTAMOS', 'ADMINISTRACION', 'GARANTIAS', 'TRANSPORTE', 'PRODUCCION', 'TALLER'],

  // El rol TALLER ve: Proveedores (sólo gestión y compras — filtrado fino en Sidebar),
  // Logística completa, Taller completo, Producción completa, Garantías completa.
  // El detalle por path se controla en tallerAllowedPaths en Sidebar.tsx.
  TALLER: ['DASHBOARD', 'TALLER', 'GARANTIAS', 'LOGISTICA', 'PROVEEDORES', 'PRODUCCION'],

  USER: ['DASHBOARD'],

  USUARIO: ['DASHBOARD'],

  ADMIN_EMPRESA: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH', 'ADMINISTRACION', 'PRESTAMOS'],

  // Administrador "empleado": ve casi todo el sistema. Dentro de RRHH sólo
  // accede a Sueldos, Adelantos y Config. Sueldos; el resto del módulo se
  // esconde por denylist en Sidebar (adminEmpresaLimitadoDeniedPaths) y se
  // bloquea por URL en RoleScopeGuard. NO incluye 'ADMIN' como systemRole para
  // no bypassear los guards de scope.
  ADMIN_EMPRESA_LIMITADO: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'PROVEEDORES', 'LOGISTICA', 'TALLER', 'PRODUCCION', 'GARANTIAS', 'RRHH', 'ADMINISTRACION', 'PRESTAMOS'],

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

  // Producción + Logística + Proveedores completos, más el subconjunto de
  // Administración visible para ADMIN_EMPRESA_LIMITADO. Filtrado fino por
  // allowlist en Sidebar (coordinadoraComprasAllowedPaths).
  COORDINADORA_COMPRAS: ['DASHBOARD', 'PRODUCCION', 'LOGISTICA', 'PROVEEDORES', 'ADMINISTRACION'],

  // Todo lo de TRANSPORTE, más el subconjunto de RRHH y Administración
  // visible para ADMIN_EMPRESA_LIMITADO. Filtrado fino por allowlist en
  // Sidebar (coordinadoraLogisticaAllowedPaths).
  COORDINADORA_LOGISTICA: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'TRANSPORTE', 'PRODUCCION', 'GARANTIAS', 'TALLER', 'RRHH', 'ADMINISTRACION'],

  // Todo lo de TRANSPORTE + Proveedores parcial + Logística parcial.
  // Filtrado fino por allowlist en Sidebar (logisticoAllowedPaths).
  LOGISTICO: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'TRANSPORTE', 'PRODUCCION', 'GARANTIAS', 'TALLER', 'PROVEEDORES', 'LOGISTICA'],

  // Personal post-venta: ve Registro de Ventas, Clientes/Leads completo,
  // Viajes y Control de Entregas, Garantías completas. Dashboard propio con KPIs operativos.
  // Filtrado fino por allowlist en Sidebar (postVentaAllowedPaths).
  POST_VENTA: ['DASHBOARD', 'VENTAS', 'CLIENTES', 'TRANSPORTE', 'GARANTIAS'],
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
