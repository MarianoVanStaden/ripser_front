/**
 * Reglas de visibilidad de rutas por rol para el sidebar.
 *
 * Antes vivían inline dentro de `Sidebar.tsx`. Se extrajeron acá como DATOS
 * para que `useNavigation()` las consuma sin acoplarse a la UI. La lógica de
 * cómo se aplican (allowlist vs denylist, "puramente rol X y no Admin") vive
 * en `useNavigation.ts` y reproduce 1:1 el comportamiento previo.
 *
 * Nota de coherencia: estas listas se solapan con las de `RoleScopeGuard.tsx`
 * (control por prefijo de URL). La unificación de ambas fuentes está prevista
 * para una fase posterior; por ahora se mantienen en paralelo, igual que antes.
 */

// Rutas que solo pueden ver los SUPER_ADMIN.
export const superAdminOnlyPaths = ['/admin/tenant-selector'];

// Rutas denegadas para el rol VENDEDOR.
export const vendedorDeniedPaths = [
  '/ventas/facturacion',
  '/ventas/notas-credito',
  '/ventas/informes',
  '/ventas/cheques',
  '/ventas/opciones-financiamiento',
  '/ventas/configuracion-financiamiento',
  '/clientes/cuenta-corriente',
  '/leads/metricas',
  '/ventas/registro',
];

// Rutas permitidas para el rol COBRANZAS (allowlist: rol muy acotado).
export const cobranzasAllowedPaths = [
  '/clientes/gestion',
  '/clientes/carpeta',
  '/clientes/cuenta-corriente',
  '/prestamos/resumen',
  '/prestamos/lista',
  '/cobranzas/resumen',
  '/cobranzas/lista',
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
];

// Rutas permitidas para el rol TALLER (allowlist):
// - LOGISTICA, TALLER, PRODUCCION, GARANTIAS: todo el módulo.
// (PROVEEDORES quitado: el taller no gestiona proveedores; usa Pedidos de Materiales.)
export const tallerAllowedPaths = [
  '/',
  // LOGISTICA (todo)
  '/logistica/stock',
  '/logistica/inventario/stock-equipos',
  '/logistica/inventario/ubicaciones',
  '/logistica/inventario',
  '/logistica/inventario/recuentos',
  // '/logistica/inventario/reconciliacion', // deshabilitada: un solo depósito vigente
  '/logistica/movimientos/auditoria',
  // TALLER (todo)
  '/taller/ordenes',
  '/taller/materiales',
  '/taller/tareas',
  '/taller/trabajos',
  '/taller/configuracion',
  // PRODUCCION (todo)
  '/fabricacion/dashboard',
  '/fabricacion/recetas',
  '/fabricacion/equipos',
  '/fabricacion/ficha-equipo',
  '/fabricacion/reportes-estados',
  '/fabricacion/stock-planificacion',
  '/fabricacion/requerimientos-stock',
  // GARANTIAS (todo)
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
];

// Rutas permitidas para el rol RECURSOS_HUMANOS (allowlist estricta):
// sólo el módulo RRHH; cualquier otra cosa queda fuera del menú y
// bloqueada por usePermisos + ProtectedRoute en App.tsx.
export const rrhhAllowedPaths = [
  '/rrhh/dashboard',
  '/rrhh/empleados',
  '/rrhh/legajos',
  '/rrhh/sueldos',
  '/rrhh/sueldos/liquidacion-masiva',
  '/rrhh/sueldos/pago-masivo',
  '/rrhh/adelantos',
  '/rrhh/config-sueldos',
  '/rrhh/asistencia',
  '/rrhh/capacitaciones',
  '/rrhh/puestos',
  '/rrhh/licencias',
  '/rrhh/disciplina',
  '/admin/catalogos-rrhh',
];

// Rutas permitidas para COORDINADORA_COMPRAS (allowlist):
// Producción + Logística + Proveedores completos, más el subconjunto de
// Administración visible para ADMIN_EMPRESA_LIMITADO.
export const coordinadoraComprasAllowedPaths = [
  '/',
  // PRODUCCION (todo)
  '/fabricacion/dashboard',
  '/fabricacion/recetas',
  '/fabricacion/equipos',
  '/fabricacion/ficha-equipo',
  '/fabricacion/reportes-estados',
  '/fabricacion/stock-planificacion',
  '/fabricacion/requerimientos-stock',
  // LOGISTICA (todo)
  '/logistica/stock',
  '/logistica/inventario/stock-equipos',
  '/logistica/inventario/ubicaciones',
  '/logistica/inventario',
  '/logistica/inventario/recuentos',
  // '/logistica/inventario/reconciliacion', // deshabilitada: un solo depósito vigente
  '/logistica/movimientos/auditoria',
  // PROVEEDORES (todo)
  '/proveedores/gestion',
  '/proveedores/compras',
  '/proveedores/cuenta-corriente',
  '/proveedores/contactos',
  '/proveedores/historial',
  '/proveedores/evaluacion',
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
];

// Rutas permitidas para COORDINADORA_LOGISTICA (allowlist):
// Todo lo de TRANSPORTE + subconjunto de RRHH y Administración de ADMIN_EMPRESA_LIMITADO.
export const coordinadoraLogisticaAllowedPaths = [
  '/',
  // TRANSPORTE (igual que transporteAllowedPaths)
  '/ventas/registro',
  '/clientes/gestion',
  '/clientes/carpeta',
  '/logistica/distribucion/viajes',
  '/logistica/distribucion/entregas-productos',
  '/logistica/distribucion/entregas-equipos',
  '/logistica/vehiculos/incidencias',
  '/logistica/vehiculos/km-empleados',
  '/fabricacion/equipos',
  '/fabricacion/ficha-equipo',
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
  '/taller/ordenes',
  '/taller/materiales',
  '/taller/tareas',
  '/taller/trabajos',
  // RRHH (subconjunto ADMIN_EMPRESA_LIMITADO: Sueldos, Adelantos, Config, Organigrama)
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
];

// Rutas permitidas para LOGISTICO (allowlist):
// Todo lo de TRANSPORTE + Proveedores parcial (sin Cuenta Corriente) +
// Logística parcial (Gestión Stock, Stock Equipos, Ubicación Equipos).
export const logisticoAllowedPaths = [
  '/',
  // TRANSPORTE (igual que transporteAllowedPaths)
  '/ventas/registro',
  '/clientes/gestion',
  '/clientes/carpeta',
  '/logistica/distribucion/viajes',
  '/logistica/distribucion/entregas-productos',
  '/logistica/distribucion/entregas-equipos',
  '/logistica/vehiculos/incidencias',
  '/logistica/vehiculos/km-empleados',
  '/fabricacion/equipos',
  '/fabricacion/ficha-equipo',
  '/fabricacion/requerimientos-stock',
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
  '/taller/ordenes',
  '/taller/materiales',
  '/taller/tareas',
  '/taller/trabajos',
  // PROVEEDORES quitado: LOGISTICO ya no accede al módulo Proveedores.
  // LOGISTICA (parcial)
  '/logistica/stock',
  '/logistica/inventario/stock-equipos',
  '/logistica/inventario/ubicaciones',
];

// Rutas permitidas para POST_VENTA (allowlist):
// - VENTAS: solo Registro Ventas.
// - CLIENTES: Gestión + Carpeta + Leads (todo el módulo CLIENTES excepto Cuenta Corriente y Agenda).
// - TRANSPORTE: Viajes y Entregas-Productos solo (no Entregas-Equipos).
// - GARANTÍAS: todo el módulo.
export const postVentaAllowedPaths = [
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
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
];

// Rutas denegadas para el rol ADMIN_EMPRESA_LIMITADO (denylist):
// Tiene acceso casi total como un ADMIN_EMPRESA, pero se le ocultan pantallas
// sensibles que sólo debería tocar el dueño (configuración de costos,
// gestión de usuarios/empresas, posición patrimonial, etc.) y todo RRHH
// excepto Sueldos / Adelantos / Config. Sueldos.
//
// FUENTE DE VERDAD ÚNICA: la consume el menú (useNavigation, como paths
// exactos) y también RoleScopeGuard.tsx (como prefijos, vía startsWith). Editar
// sólo acá.
export const adminEmpresaLimitadoDeniedPaths = [
  '/taller/configuracion',
  // RRHH: ve sólo Sueldos, Adelantos y Config. Sueldos.
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
  '/admin/tenant-selector',
];

// Rutas permitidas para el rol SUPERVISOR (allowlist):
// Unión de lo que ven VENDEDOR + COBRANZAS + TRANSPORTE, más Métrica de
// Leads (que para VENDEDOR está denegada). Métrica de Leads es además su
// pantalla de inicio (ver DashboardEntry en App.tsx).
export const supervisorAllowedPaths = [
  '/',
  // VENTAS (lo que VENDEDOR ve, sin las pantallas denegadas) + Registro Ventas (de TRANSPORTE)
  '/ventas/dashboard',
  '/ventas/presupuestos',
  '/ventas/notas-pedido',
  '/ventas/registro',
  // CLIENTES
  '/clientes/gestion',
  '/clientes/carpeta',
  '/clientes/agenda',
  '/clientes/cuenta-corriente',
  // LEADS — VENDEDOR los ve; SUPERVISOR además ve Métricas
  '/leads',
  '/leads/recordatorios',
  '/leads/metricas',
  // ADMINISTRACIÓN — única ruta /admin/* habilitada para SUPERVISOR:
  // reasignación de leads (acotada a su sucursal server-side).
  '/admin/reasignacion-leads',
  // CRÉDITOS / COBRANZAS (de COBRANZAS)
  '/prestamos/resumen',
  '/prestamos/lista',
  '/cobranzas/resumen',
  '/cobranzas/lista',
  // GARANTÍAS (de COBRANZAS + TRANSPORTE)
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
  // TRANSPORTE
  '/logistica/distribucion/viajes',
  '/logistica/distribucion/entregas-productos',
  '/logistica/distribucion/entregas-equipos',
  '/logistica/vehiculos/incidencias',
  '/logistica/vehiculos/km-empleados',
  // PRODUCCIÓN (acotado, igual que TRANSPORTE)
  '/fabricacion/equipos',
  '/fabricacion/ficha-equipo',
  // TALLER (todo menos Configuración, igual que TRANSPORTE)
  '/taller/ordenes',
  '/taller/materiales',
  '/taller/tareas',
  '/taller/trabajos',
];

// Rutas permitidas para el rol TRANSPORTE (allowlist):
// - VENTAS: solo Registro Ventas.
// - CLIENTES: Gestión + Carpeta.
// - TRANSPORTE: todo el módulo.
// - PRODUCCION: solo Equipos Fabricados.
// - GARANTIAS: todo.
// - TALLER: todo menos Configuración.
export const transporteAllowedPaths = [
  '/',
  '/ventas/registro',
  '/clientes/gestion',
  '/clientes/carpeta',
  '/logistica/distribucion/viajes',
  '/logistica/distribucion/entregas-productos',
  '/logistica/distribucion/entregas-equipos',
  '/logistica/vehiculos/incidencias',
  '/logistica/vehiculos/km-empleados',
  '/fabricacion/equipos',
  '/fabricacion/ficha-equipo',
  '/fabricacion/requerimientos-stock',
  '/postventa/dashboard',
  '/garantias/registro',
  '/garantias/reclamos',
  '/garantias/reporte',
  '/taller/ordenes',
  '/taller/materiales',
  '/taller/tareas',
  '/taller/trabajos',
];

// Rutas permitidas para el rol CONDUCTOR (allowlist: rol mínimo).
// SÓLO el módulo Transporte: Dashboard Transporte, Armado de Viajes,
// Control de Entregas y Legajo de Vehículos.
export const conductorAllowedPaths = [
  '/',
  '/logistica/distribucion/viajes',
  '/logistica/distribucion/entregas-productos',
  '/logistica/distribucion/entregas-equipos',
  '/logistica/vehiculos/incidencias',
  // 'Km por Empleado' (/logistica/vehiculos/km-empleados) NO va: es gestión de
  // datos de RRHH/transporte, fuera del scope operativo del conductor.
];
