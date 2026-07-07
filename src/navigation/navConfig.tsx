import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HotelIcon from '@mui/icons-material/Hotel';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BarChartIcon from '@mui/icons-material/BarChart';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import TuneIcon from '@mui/icons-material/Tune';
import SavingsIcon from '@mui/icons-material/Savings';
import HistoryIcon from '@mui/icons-material/History';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import BackupIcon from '@mui/icons-material/Backup';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import type { NavModule } from './navConfig.types';

/**
 * Fuente de verdad de la navegación del sidebar.
 *
 * Antes vivía hardcodeada dentro de `Sidebar.tsx`. Se extrajo a este módulo
 * para separar los DATOS de navegación de la UI y de la lógica de permisos
 * (ver `navAccess.ts` y `useNavigation.ts`). El filtrado por rol NO ocurre
 * acá: este array describe TODAS las pantallas; `useNavigation()` aplica los
 * permisos y devuelve el árbol visible.
 */
export const navigation: NavModule[] = [
  {
    title: 'PRINCIPAL',
    modulo: 'DASHBOARD',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    ],
  },
  {
    title: 'VENTAS',
    modulo: 'VENTAS',
    items: [
      { text: 'Dashboard de Ventas', icon: <BarChartIcon />, path: '/ventas/dashboard' },
      { text: 'Presupuestos', icon: <AssignmentIcon />, path: '/ventas/presupuestos' },
      { text: 'Notas de Pedido', icon: <AssignmentIcon />, path: '/ventas/notas-pedido' },
      { text: 'Facturación', icon: <AssignmentIcon />, path: '/ventas/facturacion' },
      { text: 'Notas de Crédito', icon: <AssignmentIcon />, path: '/ventas/notas-credito' },
      { text: 'Anulaciones', icon: <BarChartIcon />, path: '/ventas/anulaciones' },
      { text: 'Registro Ventas', icon: <AssignmentIcon />, path: '/ventas/registro' },
      { text: 'Informes', icon: <AssignmentIcon />, path: '/ventas/informes' },
      { text: 'Cheques', icon: <AccountBalanceIcon />, path: '/ventas/cheques' },
      { text: 'Opción Financiamiento Particular', icon: <AssignmentIcon />, path: '/ventas/opciones-financiamiento' },
      { text: 'Configuración Financiamiento', icon: <SettingsIcon />, path: '/ventas/configuracion-financiamiento' },
    ],
  },
  {
    title: 'CLIENTES',
    modulo: 'CLIENTES',
    items: [
      { text: 'Gestión Leads', icon: <PeopleIcon />, path: '/leads' },
      { text: 'Recordatorios', icon: <PeopleIcon />, path: '/leads/recordatorios' },
      { text: 'Gestión Clientes', icon: <PeopleIcon />, path: '/clientes/gestion' },
      { text: 'Carpeta Cliente', icon: <PeopleIcon />, path: '/clientes/carpeta' },
      { text: 'Agenda Visitas', icon: <PeopleIcon />, path: '/clientes/agenda' },
      { text: 'Cuenta Corriente', icon: <PeopleIcon />, path: '/clientes/cuenta-corriente' },
      { text: 'Métricas de Leads', icon: <AssignmentIcon />, path: '/leads/metricas' },
    ],
  },
  {
    title: 'CRÉDITOS Y COBRANZAS',
    modulo: 'PRESTAMOS',
    items: [
      { text: 'Resumen Créditos', icon: <AccountBalanceIcon />, path: '/prestamos/resumen' },
      { text: 'Gestión Créditos Personales', icon: <AssignmentIcon />, path: '/prestamos/lista' },
      { text: 'Resumen Cobranzas', icon: <AssessmentIcon />, path: '/cobranzas/resumen', modulo: 'ADMINISTRACION' },
      { text: 'Gestiones Cobranzas', icon: <PhoneCallbackIcon />, path: '/cobranzas/lista', modulo: 'ADMINISTRACION' },
      { text: 'Pagos Informados', icon: <ReceiptLongIcon />, path: '/prestamos/pagos-informados', modulo: 'ADMINISTRACION' },
    ],
  },
  {
    title: 'PROVEEDORES',
    modulo: 'PROVEEDORES',
    items: [
      { text: 'Gestión Proveedores', icon: <StoreIcon />, path: '/proveedores/gestion' },
      { text: 'Compras/Pedidos', icon: <StoreIcon />, path: '/proveedores/compras' },
      { text: 'Cuenta Corriente', icon: <StoreIcon />, path: '/proveedores/cuenta-corriente' },
      { text: 'Contactos', icon: <StoreIcon />, path: '/proveedores/contactos' },
      { text: 'Historial Compras', icon: <StoreIcon />, path: '/proveedores/historial' },
      { text: 'Evaluación', icon: <StoreIcon />, path: '/proveedores/evaluacion' },
    ],
  },
  {
    title: 'LOGÍSTICA',
    modulo: 'LOGISTICA',
    items: [
      // INVENTARIO - Gestión de stock, productos y conteo SIDEBAR
      { text: 'Gestión Stock', icon: <AssignmentIcon />, path: '/logistica/stock' },
      { text: 'Stock de Equipos', icon: <AssignmentIcon />, path: '/logistica/inventario/stock-equipos' },
      { text: 'Ubicación Equipos', icon: <AssignmentIcon />, path: '/logistica/inventario/ubicaciones' },
      { text: 'Recuento Manual', icon: <AssignmentIcon />, path: '/logistica/inventario' },
      { text: 'Tareas de Recuento', icon: <AssignmentIcon />, path: '/logistica/inventario/recuentos' },
      // Reconciliación Stock: deshabilitada mientras la empresa opera con un solo depósito vigente.
      // { text: 'Reconciliación Stock', icon: <SyncIcon />, path: '/logistica/inventario/reconciliacion' },
      // MOVIMIENTOS - Trazabilidad
      { text: 'Auditoría', icon: <AssignmentIcon />, path: '/logistica/movimientos/auditoria' },
    ],
  },
  {
    title: 'TRANSPORTE',
    modulo: 'TRANSPORTE',
    items: [
      // DISTRIBUCIÓN - Logística de salida
      { text: 'Armado de Viajes', icon: <LocalShippingIcon />, path: '/logistica/distribucion/viajes' },
      { text: 'Checklists de Viaje', icon: <FactCheckIcon />, path: '/logistica/distribucion/checklists-viaje' },
      { text: 'Control Entregas', icon: <LocalShippingIcon />, path: '/logistica/distribucion/entregas-productos' },
      { text: 'Importar Facturas Históricas', icon: <LocalShippingIcon />, path: '/logistica/distribucion/importar-facturas' },
      // { text: 'Entregas Equipos', icon: <LocalShippingIcon />, path: '/logistica/distribucion/entregas-equipos' },
      { text: 'Legajo de Vehículos', icon: <DirectionsCarIcon />, path: '/logistica/vehiculos/incidencias' },
      { text: 'Km por Empleado', icon: <DirectionsCarIcon />, path: '/logistica/vehiculos/km-empleados' },
      { text: 'Hospedajes / Estadías', icon: <HotelIcon />, path: '/logistica/transporte/hospedajes' },
    ],
  },
  {
    // Sección unificada Garantías + Taller: el fin (gestionar un reclamo/servicio)
    // es el mismo. El módulo de la sección es GARANTIAS, pero cada ítem declara
    // su propio `modulo` para que el filtro `tienePermiso(item.modulo ?? section.modulo)`
    // esconda los ítems de Taller a quien no tiene acceso a Taller (y viceversa).
    // Si todos los ítems se filtran, la sección entera se elimina más abajo.
    title: 'POSTVENTA',
    modulo: 'GARANTIAS',
    items: [
      { text: 'Dashboard Postventa', icon: <BarChartIcon />, path: '/postventa/dashboard', modulo: 'GARANTIAS' },
      // GARANTÍAS
      { text: 'Registro Garantías', icon: <AssignmentIcon />, path: '/garantias/registro', modulo: 'GARANTIAS' },
      { text: 'Seguimiento Reclamos', icon: <AssignmentIcon />, path: '/garantias/reclamos', modulo: 'GARANTIAS' },
      { text: 'Reporte de Garantías', icon: <BarChartIcon />, path: '/garantias/reporte', modulo: 'GARANTIAS' },
      // TALLER
      { text: 'Órdenes Servicio', icon: <CategoryIcon />, path: '/taller/ordenes', modulo: 'TALLER' },
      { text: 'Control Materiales', icon: <CategoryIcon />, path: '/taller/materiales', modulo: 'TALLER' },
      { text: 'Asignación Tareas', icon: <CategoryIcon />, path: '/taller/tareas', modulo: 'TALLER' },
      { text: 'Trabajos Realizados', icon: <CategoryIcon />, path: '/taller/trabajos', modulo: 'TALLER' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/taller/configuracion', modulo: 'TALLER' },
    ],
  },
  {
    title: 'PRODUCCIÓN',
    modulo: 'PRODUCCION',
    items: [
      { text: 'Tablero de Producción', icon: <PrecisionManufacturingIcon />, path: '/fabricacion/dashboard' },
      { text: 'Estructura de Producción', icon: <AssignmentIcon />, path: '/fabricacion/recetas' },
      { text: 'Equipos Fabricados', icon: <CategoryIcon />, path: '/fabricacion/equipos' },
      { text: 'Ficha + QR', icon: <AssignmentIcon />, path: '/fabricacion/ficha-equipo' },
      { text: 'Reportes de Estados', icon: <AssignmentIcon />, path: '/fabricacion/reportes-estados' },
      { text: 'Stock Preventivo', icon: <InventoryIcon />, path: '/fabricacion/stock-planificacion' },
      { text: 'Pedidos de Materiales', icon: <InventoryIcon />, path: '/fabricacion/requerimientos-stock' },
    ],
  },
  {
    title: 'RRHH',
    modulo: 'RRHH',
    items: [
      { text: 'Dashboard RRHH', icon: <DashboardIcon />, path: '/rrhh/dashboard' },
      { text: 'Empleados', icon: <WorkIcon />, path: '/rrhh/empleados' },
      { text: 'Sueldos', icon: <AssignmentIcon />, path: '/rrhh/sueldos' },
      { text: 'Adelantos', icon: <PaymentsIcon />, path: '/rrhh/adelantos' },
      { text: 'Config. Sueldos', icon: <TuneIcon />, path: '/rrhh/config-sueldos' },
      { text: 'Asistencia', icon: <AssignmentIcon />, path: '/rrhh/asistencia' },
      { text: 'Fichadas / Terminal', icon: <FingerprintIcon />, path: '/rrhh/asistencia-terminal' },
      { text: 'Capacitaciones', icon: <AssignmentIcon />, path: '/rrhh/capacitaciones' },
      { text: 'Puestos', icon: <AssignmentIcon />, path: '/rrhh/puestos' },
      { text: 'Organigrama', icon: <AssignmentIcon />, path: '/rrhh/organigrama' },
      { text: 'Licencias', icon: <AssignmentIcon />, path: '/rrhh/licencias' },
      { text: 'Disciplina', icon: <AssignmentIcon />, path: '/rrhh/disciplina' },
      { text: 'Catálogos RRHH', icon: <SettingsIcon />, path: '/admin/catalogos-rrhh', modulo: 'RRHH' },
    ],
  },
  {
    // Sección gateada por módulo 'ADMINISTRACION' (no 'ADMIN'): así
    // ADMIN_EMPRESA_LIMITADO la ve (tiene 'ADMINISTRACION' en su lista
    // de módulos pero no 'ADMIN'). ADMIN / ADMIN_EMPRESA siguen pasando
    // por el bypass de roles.includes('ADMIN') en usePermisos. SUPERVISOR
    // y COBRANZAS también tienen 'ADMINISTRACION', pero sus allowlists
    // no contienen rutas /admin/*, así que el filtro de items deja la
    // sección vacía y se elimina más abajo.
    title: 'ADMINISTRACIÓN',
    modulo: 'ADMINISTRACION',
    items: [
      { text: 'Flujo de Caja', icon: <BarChartIcon />, path: '/admin/flujo-caja' },
      { text: 'Balance Anual', icon: <AssessmentIcon />, path: '/admin/balance' },
      { text: 'Amortizaciones', icon: <ReceiptLongIcon />, path: '/admin/amortizaciones' },
      { text: 'Provisiones RRHH', icon: <SavingsIcon />, path: '/admin/provisiones' },
      { text: 'Tipos de Provisión', icon: <SettingsIcon />, path: '/admin/tipos-provision' },
      { text: 'Posición Patrimonial', icon: <AccountBalanceIcon />, path: '/admin/patrimonio' },
      { text: 'Cajas de Ahorro USD', icon: <SavingsIcon />, path: '/admin/cajas-ahorro' },
      { text: 'Cajas en Pesos', icon: <SavingsIcon />, path: '/admin/cajas-pesos' },
      { text: 'Liquidaciones Tarjeta', icon: <SwapHorizIcon />, path: '/admin/liquidaciones-tarjeta' },
      { text: 'Bancos', icon: <AccountBalanceIcon />, path: '/admin/bancos' },
      { text: 'Cuentas Bancarias', icon: <AccountBalanceIcon />, path: '/admin/cuentas-bancarias' },
      { text: 'Empresas', icon: <BusinessIcon />, path: '/admin/empresas' },
      { text: 'Sucursales', icon: <AccountBalanceIcon />, path: '/admin/sucursales' },
      { text: 'Cambiar Contexto', icon: <SwapHorizIcon />, path: '/admin/tenant-selector' },
      { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users' },
      { text: 'Reasignación de Leads', icon: <SwapHorizIcon />, path: '/admin/reasignacion-leads' },
      { text: 'Catálogos RRHH', icon: <SettingsIcon />, path: '/admin/catalogos-rrhh' },
      { text: 'Catálogos Globales', icon: <SettingsIcon />, path: '/admin/catalogos-globales' },
      // Unifica Fichas técnicas + Medidas + Colores en una sola pantalla con tabs.
      // Las rutas viejas siguen vivas (compat con links externos y bookmarks).
      { text: 'Catálogos de Equipos', icon: <SettingsIcon />, path: '/admin/catalogos-equipos' },
      // Unifica Ofertas Mensuales + Importador de Precios.
      { text: 'Precios y Ofertas', icon: <SettingsIcon />, path: '/admin/precios-ofertas' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/admin/settings' },
      { text: 'Actividad del sistema', icon: <HistoryIcon />, path: '/admin/actividad' },
      { text: 'Backups', icon: <BackupIcon />, path: '/admin/backups' },
    ],
  },
];
