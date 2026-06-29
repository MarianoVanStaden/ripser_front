import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermisos } from '../../hooks/usePermisos';
import { adminEmpresaLimitadoDeniedPaths } from '../../navigation/navAccess';

interface Props {
  children: React.ReactNode;
}

// Roles operativos restringidos a un sub-conjunto del sistema. Cada uno tiene
// una "home" propia y una allowlist de prefijos de path que sí puede tocar.
// Si entra manualmente a una URL fuera de su scope, lo mandamos al landing
// del rol (no a la pantalla de "acceso denegado") — es UX más suave para
// usuarios que vienen de un bookmark viejo o un link compartido.
type RestrictedRole = {
  rol: 'RECURSOS_HUMANOS' | 'COBRANZAS' | 'TRANSPORTE' | 'TALLER' | 'SUPERVISOR' | 'COORDINADORA_COMPRAS' | 'COORDINADORA_LOGISTICA' | 'LOGISTICO' | 'POST_VENTA' | 'CONDUCTOR';
  home: string;
  // Prefijos permitidos. Se chequea con startsWith para cubrir sub-rutas
  // (ej. /rrhh/empleados/123/editar).
  allowedPrefixes: string[];
  // Prefijos explícitamente denegados, aunque caigan dentro de un allowedPrefix
  // más amplio (ej. denegar /logistica/vehiculos/km-empleados pero permitir el
  // resto de /logistica/vehiculos). Tiene prioridad sobre allowedPrefixes.
  deniedPrefixes?: string[];
};

const RESTRICTED_ROLES: RestrictedRole[] = [
  {
    rol: 'RECURSOS_HUMANOS',
    home: '/rrhh/dashboard',
    allowedPrefixes: ['/rrhh'],
  },
  {
    // SUPERVISOR: combina accesos de VENDEDOR + COBRANZAS + TRANSPORTE, su
    // pantalla de inicio es la Métrica de Leads. Si entra a cualquier ruta
    // fuera de su scope (ej. /dashboard genérico) lo tiramos al landing.
    // Los prefijos cubren las rutas listadas en supervisorAllowedPaths de
    // Sidebar.tsx (mantener ambos en sync si se amplía el scope).
    rol: 'SUPERVISOR',
    home: '/leads/metricas',
    allowedPrefixes: [
      '/leads',
      // Única ruta /admin/* habilitada: reasignación de leads (scope sucursal).
      '/admin/reasignacion-leads',
      '/ventas',
      '/clientes',
      '/prestamos',
      '/cobranzas',
      '/garantias',
      '/postventa',
      '/logistica/distribucion',
      '/logistica/vehiculos',
      '/fabricacion/equipos',
      '/fabricacion/ficha-equipo',
      '/taller/ordenes',
      '/taller/materiales',
      '/taller/tareas',
      '/taller/trabajos',
    ],
  },
  {
    rol: 'COORDINADORA_COMPRAS',
    home: '/',
    allowedPrefixes: [
      '/',
      '/fabricacion',
      '/logistica',
      '/proveedores',
      // ADMINISTRACION (subconjunto ADMIN_EMPRESA_LIMITADO)
      '/admin/flujo-caja',
      '/admin/balance',
      '/admin/amortizaciones',
      '/admin/provisiones',
      '/admin/tipos-provision',
      '/admin/cajas-ahorro',
      '/admin/cajas-pesos',
      '/admin/liquidaciones-tarjeta',
      '/admin/bancos',
      '/admin/cuentas-bancarias',
      '/admin/catalogos-globales',
      '/admin/catalogos-equipos',
      '/admin/precios-ofertas',
    ],
  },
  {
    rol: 'COORDINADORA_LOGISTICA',
    home: '/',
    allowedPrefixes: [
      '/',
      '/ventas/registro',
      '/clientes/gestion',
      '/clientes/carpeta',
      '/logistica/distribucion',
      '/logistica/vehiculos',
      '/logistica/transporte',
      '/fabricacion/equipos',
      '/fabricacion/ficha-equipo',
      '/garantias',
      '/postventa',
      '/taller/ordenes',
      '/taller/materiales',
      '/taller/tareas',
      '/taller/trabajos',
      // RRHH (subconjunto ADMIN_EMPRESA_LIMITADO)
      '/rrhh/sueldos',
      '/rrhh/adelantos',
      '/rrhh/config-sueldos',
      '/rrhh/organigrama',
      // ADMINISTRACION (subconjunto ADMIN_EMPRESA_LIMITADO)
      '/admin/flujo-caja',
      '/admin/balance',
      '/admin/amortizaciones',
      '/admin/provisiones',
      '/admin/tipos-provision',
      '/admin/cajas-ahorro',
      '/admin/cajas-pesos',
      '/admin/liquidaciones-tarjeta',
      '/admin/bancos',
      '/admin/cuentas-bancarias',
      '/admin/catalogos-globales',
      '/admin/catalogos-equipos',
      '/admin/precios-ofertas',
    ],
  },
  {
    rol: 'LOGISTICO',
    home: '/',
    allowedPrefixes: [
      '/',
      '/ventas/registro',
      '/clientes/gestion',
      '/clientes/carpeta',
      '/logistica/distribucion',
      '/logistica/vehiculos',
      '/fabricacion/equipos',
      '/fabricacion/ficha-equipo',
      '/fabricacion/requerimientos-stock',
      '/garantias',
      '/postventa',
      '/taller/ordenes',
      '/taller/materiales',
      '/taller/tareas',
      '/taller/trabajos',
      // PROVEEDORES quitado: LOGISTICO ya no accede al módulo Proveedores.
      // LOGISTICA (parcial)
      '/logistica/stock',
      '/logistica/inventario/stock-equipos',
      '/logistica/inventario/ubicaciones',
    ],
  },
  {
    // POST_VENTA: personal de post-venta que ve Registro de Ventas, Clientes
    // completos (menos Cuenta Corriente y Agenda de Visitas), Viajes y
    // Control de Entregas, más su dashboard propio.
    rol: 'POST_VENTA',
    home: '/',
    allowedPrefixes: [
      '/',
      '/ventas/registro',
      '/clientes/gestion',
      '/clientes/carpeta',
      '/clientes/nuevo',
      '/clientes/editar',
      '/clientes/detalle',
      '/leads',
      '/leads/recordatorios',
      '/leads/metricas',
      '/logistica/distribucion/viajes',
      '/logistica/distribucion/entregas-productos',
      '/garantias',
      '/postventa',
    ],
  },
  {
    // CONDUCTOR: rol operativo mínimo. Sólo el módulo Transporte (Dashboard de
    // Transporte, Armado de Viajes, Control de Entregas, Legajo de Vehículos).
    // Aterriza en el dashboard de transporte (/).
    // Mantener en sync con conductorAllowedPaths en Sidebar.tsx.
    rol: 'CONDUCTOR',
    home: '/',
    allowedPrefixes: [
      '/',
      '/logistica/distribucion',
      '/logistica/vehiculos',
    ],
    // 'Km por Empleado' queda fuera del scope del conductor aunque cuelgue de
    // /logistica/vehiculos. Mantener en sync con conductorAllowedPaths en Sidebar.
    deniedPrefixes: [
      '/logistica/vehiculos/km-empleados',
    ],
  },
];

// ADMIN_EMPRESA_LIMITADO: admin "empleado" que ve casi todo el sistema pero
// no debe entrar a pantallas reservadas al dueño (configs, usuarios, etc.) ni
// al resto de RRHH (sólo accede a Sueldos / Adelantos / Config. Sueldos).
// Usamos denylist (no allowlist) porque su scope es prácticamente todo el
// sistema. Acceso por URL directa a estos prefijos → redirect al dashboard.
//
// Fuente de verdad única: `adminEmpresaLimitadoDeniedPaths` en navAccess.ts,
// compartida con el filtrado del menú (Sidebar/useNavigation). Acá se usan los
// mismos paths como PREFIJOS (cubren sub-rutas vía startsWith); en el menú se
// usan como paths exactos. Mismo dato, una sola lista para mantener.
const ADMIN_EMPRESA_LIMITADO_DENIED_PREFIXES = adminEmpresaLimitadoDeniedPaths;

const RoleScopeGuard: React.FC<Props> = ({ children }) => {
  const { esSuperAdmin } = useAuth();
  const { tieneRol } = usePermisos();
  const location = useLocation();

  // Los administradores no están limitados por scope.
  if (esSuperAdmin || tieneRol('ADMIN')) {
    return <>{children}</>;
  }

  const path = location.pathname;

  // ADMIN_EMPRESA_LIMITADO: chequear denylist primero. Si pega contra alguno
  // de los prefijos denegados, redirigir al dashboard (no a "acceso denegado":
  // el sidebar ni siquiera muestra el ítem, así que llegar acá es un link viejo
  // o una URL escrita a mano).
  if (tieneRol('ADMIN_EMPRESA_LIMITADO')) {
    const denegado = ADMIN_EMPRESA_LIMITADO_DENIED_PREFIXES.some(
      prefix => path === prefix || path.startsWith(prefix + '/'),
    );
    if (denegado) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  const restricted = RESTRICTED_ROLES.find(r => tieneRol(r.rol));
  if (!restricted) return <>{children}</>;

  // Denylist tiene prioridad: una ruta denegada explícitamente redirige al home
  // aunque caiga dentro de un allowedPrefix más amplio.
  const denegado = (restricted.deniedPrefixes ?? []).some(
    prefix => path === prefix || path.startsWith(prefix + '/'),
  );
  if (denegado) {
    return <Navigate to={restricted.home} replace />;
  }

  const dentroDeScope = restricted.allowedPrefixes.some(
    prefix => path === prefix || path.startsWith(prefix + '/'),
  );

  // Cualquier ruta fuera de scope (incluido "/") → redirect al home del rol.
  // Sin pantalla de "acceso denegado": para estos usuarios todo lo que existe
  // es su módulo, así que aterrizar siempre en su dashboard es la UX correcta.
  if (!dentroDeScope) {
    return <Navigate to={restricted.home} replace />;
  }

  return <>{children}</>;
};

export default RoleScopeGuard;
