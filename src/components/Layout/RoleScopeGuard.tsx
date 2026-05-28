import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermisos } from '../../hooks/usePermisos';

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
      '/ventas',
      '/clientes',
      '/prestamos',
      '/cobranzas',
      '/garantias',
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
      '/fabricacion/equipos',
      '/fabricacion/ficha-equipo',
      '/garantias',
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
      '/garantias',
      '/taller/ordenes',
      '/taller/materiales',
      '/taller/tareas',
      '/taller/trabajos',
      // PROVEEDORES (sin Cuenta Corriente)
      '/proveedores/gestion',
      '/proveedores/compras',
      '/proveedores/contactos',
      '/proveedores/evaluacion',
      '/proveedores/historial',
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
    ],
  },
  {
    // CONDUCTOR: rol operativo mínimo. Sólo el módulo Transporte (Armado de
    // Viajes, Control de Entregas, Legajo de Vehículos). Aterriza directo en el
    // armado de viajes. Mantener en sync con conductorAllowedPaths en Sidebar.tsx.
    rol: 'CONDUCTOR',
    home: '/logistica/distribucion/viajes',
    allowedPrefixes: [
      '/logistica/distribucion',
      '/logistica/vehiculos',
    ],
  },
];

// ADMIN_EMPRESA_LIMITADO: admin "empleado" que ve casi todo el sistema pero
// no debe entrar a pantallas reservadas al dueño (configs, usuarios, etc.) ni
// al resto de RRHH (sólo accede a Sueldos / Adelantos / Config. Sueldos).
// Usamos denylist (no allowlist) porque su scope es prácticamente todo el
// sistema. Acceso por URL directa a estos prefijos → redirect al dashboard.
// Mantener en sync con adminEmpresaLimitadoDeniedPaths en Sidebar.tsx.
const ADMIN_EMPRESA_LIMITADO_DENIED_PREFIXES = [
  '/taller/configuracion',
  // RRHH: sólo Sueldos, Adelantos y Config. Sueldos quedan accesibles.
  '/rrhh/dashboard',
  '/rrhh/empleados',
  '/rrhh/legajos',
  '/rrhh/asistencia',
  '/rrhh/capacitaciones',
  '/rrhh/puestos',
  '/rrhh/licencias',
  '/rrhh/disciplina',
  '/admin/catalogos-rrhh',
  // ADMIN: pantallas reservadas al dueño.
  '/admin/actividad',
  '/admin/settings',
  '/admin/users',
  '/admin/empresas',
  '/admin/sucursales',
  '/admin/patrimonio',
  // Cambiar contexto (sólo SuperAdmin): ya bloqueado por SuperAdminRoute en
  // App.tsx, lo replicamos acá para mantener la denylist de Sidebar y guard
  // sincronizadas (UX coherente y defensa en profundidad).
  '/admin/tenant-selector',
];

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
