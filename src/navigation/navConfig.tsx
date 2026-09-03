import DashboardIcon from '@mui/icons-material/Dashboard';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import HotelIcon from '@mui/icons-material/Hotel';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
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
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import InsightsIcon from '@mui/icons-material/Insights';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarRateIcon from '@mui/icons-material/StarRate';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import PinDropIcon from '@mui/icons-material/PinDrop';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedIcon from '@mui/icons-material/Verified';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HandymanIcon from '@mui/icons-material/Handyman';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import BadgeIcon from '@mui/icons-material/Badge';
import PaidIcon from '@mui/icons-material/Paid';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SchoolIcon from '@mui/icons-material/School';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import GavelIcon from '@mui/icons-material/Gavel';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import type { NavModule } from './navConfig.types';

/**
 * Fuente de verdad de la navegación del sidebar.
 *
 * Antes vivía hardcodeada dentro de `Sidebar.tsx`. Se extrajo a este módulo
 * para separar los DATOS de navegación de la UI y de la lógica de permisos
 * (ver `navAccess.ts` y `useNavigation.ts`). El filtrado por rol NO ocurre
 * acá: este array describe TODAS las pantallas; `useNavigation()` aplica los
 * permisos y devuelve el árbol visible.
 *
 * Convención de iconos (normalización UX ago 2026):
 * - `DashboardIcon` reservado al Dashboard global (sección PRINCIPAL).
 * - `SpaceDashboardIcon` para el overview/dashboard/tablero de cada módulo,
 *   y siempre como PRIMER ítem del módulo.
 * - Un icono semántico distinto por ítem (no repetir el mismo icono en todo
 *   un módulo).
 * - Config / catálogos / settings al FINAL de su módulo.
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
      { text: 'Dashboard de Ventas', icon: <SpaceDashboardIcon />, path: '/ventas/dashboard' },
      { text: 'Presupuestos', icon: <RequestQuoteIcon />, path: '/ventas/presupuestos' },
      { text: 'Notas de Pedido', icon: <ListAltIcon />, path: '/ventas/notas-pedido' },
      { text: 'Facturación', icon: <ReceiptLongIcon />, path: '/ventas/facturacion' },
      { text: 'Notas de Crédito', icon: <AssignmentReturnIcon />, path: '/ventas/notas-credito' },
      { text: 'Registro Ventas', icon: <PointOfSaleIcon />, path: '/ventas/registro' },
      { text: 'Opción Financiamiento Particular', icon: <AccountBalanceWalletIcon />, path: '/ventas/opciones-financiamiento' },
      { text: 'Informes', icon: <AssessmentIcon />, path: '/ventas/informes' },
      { text: 'Configuración Financiamiento', icon: <TuneIcon />, path: '/ventas/configuracion-financiamiento' },
    ],
  },
  {
    title: 'CLIENTES',
    modulo: 'CLIENTES',
    items: [
      { text: 'Gestión Leads', icon: <PersonSearchIcon />, path: '/leads' },
      { text: 'Recordatorios', icon: <NotificationsActiveIcon />, path: '/leads/recordatorios' },
      { text: 'Métricas de Leads', icon: <InsightsIcon />, path: '/leads/metricas' },
      { text: 'Gestión Clientes', icon: <PeopleIcon />, path: '/clientes/gestion' },
      { text: 'Carpeta Cliente', icon: <FolderSharedIcon />, path: '/clientes/carpeta' },
      { text: 'Cuenta Corriente', icon: <AccountBalanceWalletIcon />, path: '/clientes/cuenta-corriente' },
    ],
  },
  {
    title: 'CRÉDITOS Y COBRANZAS',
    modulo: 'PRESTAMOS',
    items: [
      { text: 'Resumen Créditos', icon: <AssessmentIcon />, path: '/prestamos/resumen' },
      { text: 'Gestión Créditos Personales', icon: <CreditScoreIcon />, path: '/prestamos/lista' },
      { text: 'Gestiones Cobranzas', icon: <PhoneCallbackIcon />, path: '/cobranzas/lista', modulo: 'ADMINISTRACION' },
      { text: 'Pagos Informados', icon: <ReceiptLongIcon />, path: '/prestamos/pagos-informados', modulo: 'ADMINISTRACION' },
    ],
  },
  {
    title: 'PROVEEDORES',
    modulo: 'PROVEEDORES',
    items: [
      { text: 'Gestión Proveedores', icon: <StoreIcon />, path: '/proveedores/gestion' },
      { text: 'Contactos', icon: <ContactPhoneIcon />, path: '/proveedores/contactos' },
      { text: 'Compras/Pedidos', icon: <ShoppingCartIcon />, path: '/proveedores/compras' },
      { text: 'Historial Compras', icon: <HistoryIcon />, path: '/proveedores/historial' },
      { text: 'Cuenta Corriente', icon: <AccountBalanceWalletIcon />, path: '/proveedores/cuenta-corriente' },
      { text: 'Evaluación', icon: <StarRateIcon />, path: '/proveedores/evaluacion' },
    ],
  },
  {
    title: 'LOGÍSTICA',
    modulo: 'LOGISTICA',
    items: [
      // INVENTARIO - Gestión de stock, productos y conteo SIDEBAR
      { text: 'Gestión Stock', icon: <Inventory2Icon />, path: '/logistica/stock' },
      { text: 'Stock de Equipos', icon: <WarehouseIcon />, path: '/logistica/inventario/stock-equipos' },
      { text: 'Ubicación Equipos', icon: <PinDropIcon />, path: '/logistica/inventario/ubicaciones' },
      { text: 'Recuento Manual', icon: <PlaylistAddCheckIcon />, path: '/logistica/inventario' },
      { text: 'Tareas de Recuento', icon: <FactCheckIcon />, path: '/logistica/inventario/recuentos' },
      // Reconciliación Stock: deshabilitada mientras la empresa opera con un solo depósito vigente.
      // { text: 'Reconciliación Stock', icon: <SyncIcon />, path: '/logistica/inventario/reconciliacion' },
      // MOVIMIENTOS - Trazabilidad
      { text: 'Auditoría', icon: <ManageSearchIcon />, path: '/logistica/movimientos/auditoria' },
    ],
  },
  {
    title: 'TRANSPORTE',
    modulo: 'TRANSPORTE',
    items: [
      // DISTRIBUCIÓN - Logística de salida
      { text: 'Armado de Viajes', icon: <LocalShippingIcon />, path: '/logistica/distribucion/viajes' },
      // Tablero de pendientes de entrega: acceso restringido server-side a
      // SUPER_ADMIN/ADMIN/ADMIN_EMPRESA_LIMITADO/COORDINADORA_LOGISTICA/TRANSPORTE
      // (SecurityConfig TABLERO_VIAJES_ROLES) — mantener en sync con navAccess.
      { text: 'Tablero de Pendientes', icon: <PendingActionsIcon />, path: '/logistica/distribucion/tablero-pendientes' },
      { text: 'Checklists de Viaje', icon: <FactCheckIcon />, path: '/logistica/distribucion/checklists-viaje' },
      { text: 'Control Entregas', icon: <AssignmentTurnedInIcon />, path: '/logistica/distribucion/entregas-productos' },
      // Deshabilitado temporalmente (ago 2026) — página fuera de circulación, componente conservado.
      // { text: 'Importar Facturas Históricas', icon: <LocalShippingIcon />, path: '/logistica/distribucion/importar-facturas' },
      // { text: 'Entregas Equipos', icon: <LocalShippingIcon />, path: '/logistica/distribucion/entregas-equipos' },
      { text: 'Legajo de Vehículos', icon: <DirectionsCarIcon />, path: '/logistica/vehiculos/incidencias' },
      { text: 'Km por Empleado', icon: <SpeedIcon />, path: '/logistica/vehiculos/km-empleados' },
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
      { text: 'Dashboard Postventa', icon: <SpaceDashboardIcon />, path: '/postventa/dashboard', modulo: 'GARANTIAS' },
      { text: 'Control de Calidad', icon: <VerifiedIcon />, path: '/postventa/comunicaciones-iniciales', modulo: 'GARANTIAS' },
      // GARANTÍAS
      { text: 'Registro Garantías', icon: <VerifiedUserIcon />, path: '/garantias/registro', modulo: 'GARANTIAS' },
      { text: 'Seguimiento Reclamos', icon: <SupportAgentIcon />, path: '/garantias/reclamos', modulo: 'GARANTIAS' },
      { text: 'Reporte de Garantías', icon: <AssessmentIcon />, path: '/garantias/reporte', modulo: 'GARANTIAS' },
      // TALLER
      { text: 'Órdenes Servicio', icon: <HandymanIcon />, path: '/taller/ordenes', modulo: 'TALLER' },
      { text: 'Control Materiales', icon: <CategoryIcon />, path: '/taller/materiales', modulo: 'TALLER' },
      { text: 'Asignación Tareas', icon: <AssignmentIndIcon />, path: '/taller/tareas', modulo: 'TALLER' },
      { text: 'Trabajos Realizados', icon: <TaskAltIcon />, path: '/taller/trabajos', modulo: 'TALLER' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/taller/configuracion', modulo: 'TALLER' },
    ],
  },
  {
    title: 'PRODUCCIÓN',
    modulo: 'PRODUCCION',
    items: [
      { text: 'Tablero de Producción', icon: <SpaceDashboardIcon />, path: '/fabricacion/dashboard' },
      { text: 'Estructura de Producción', icon: <AccountTreeIcon />, path: '/fabricacion/recetas' },
      { text: 'Equipos Fabricados', icon: <PrecisionManufacturingIcon />, path: '/fabricacion/equipos' },
      { text: 'Ficha + QR', icon: <QrCode2Icon />, path: '/fabricacion/ficha-equipo' },
      { text: 'Reportes de Estados', icon: <AssessmentIcon />, path: '/fabricacion/reportes-estados' },
      { text: 'Stock Preventivo', icon: <InventoryIcon />, path: '/fabricacion/stock-planificacion' },
      { text: 'Pedidos de Materiales', icon: <Inventory2Icon />, path: '/fabricacion/requerimientos-stock' },
    ],
  },
  {
    title: 'RRHH',
    modulo: 'RRHH',
    items: [
      { text: 'Dashboard RRHH', icon: <SpaceDashboardIcon />, path: '/rrhh/dashboard' },
      { text: 'Empleados', icon: <BadgeIcon />, path: '/rrhh/empleados' },
      { text: 'Sueldos', icon: <PaidIcon />, path: '/rrhh/sueldos' },
      { text: 'Liquidaciones finales', icon: <PaymentsIcon />, path: '/rrhh/liquidaciones-finales' },
      { text: 'Adelantos', icon: <PaymentsIcon />, path: '/rrhh/adelantos' },
      { text: 'Config. Sueldos', icon: <TuneIcon />, path: '/rrhh/config-sueldos' },
      { text: 'Asistencia', icon: <EventAvailableIcon />, path: '/rrhh/asistencia' },
      { text: 'Fichadas / Terminal', icon: <FingerprintIcon />, path: '/rrhh/asistencia-terminal' },
      { text: 'Capacitaciones', icon: <SchoolIcon />, path: '/rrhh/capacitaciones' },
      { text: 'Puestos', icon: <WorkOutlineIcon />, path: '/rrhh/puestos' },
      { text: 'Organigrama', icon: <AccountTreeIcon />, path: '/rrhh/organigrama' },
      { text: 'Licencias', icon: <BeachAccessIcon />, path: '/rrhh/licencias' },
      { text: 'Disciplina', icon: <GavelIcon />, path: '/rrhh/disciplina' },
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
      { text: 'Flujo de Caja', icon: <AccountBalanceWalletIcon />, path: '/admin/flujo-caja' },
      { text: 'Posición Patrimonial', icon: <AccountBalanceIcon />, path: '/admin/patrimonio' },
      { text: 'Balance Anual', icon: <AssessmentIcon />, path: '/admin/balance' },
      { text: 'Amortizaciones', icon: <TrendingDownIcon />, path: '/admin/amortizaciones' },
      { text: 'Provisiones RRHH', icon: <SavingsIcon />, path: '/admin/provisiones' },
      { text: 'Tipos de Provisión', icon: <TuneIcon />, path: '/admin/tipos-provision' },
      { text: 'Cajas en Pesos', icon: <PaymentsIcon />, path: '/admin/cajas-pesos' },
      { text: 'Cajas de Ahorro USD', icon: <SavingsIcon />, path: '/admin/cajas-ahorro' },
      // Cheques: reubicado desde el módulo VENTAS al sidebar de Administración.
      // Conserva su path y su gating por módulo VENTAS (item override) para no
      // alterar la visibilidad actual (sigue oculto para VENDEDOR vía navAccess).
      { text: 'Cheques', icon: <PaymentIcon />, path: '/ventas/cheques', modulo: 'VENTAS' },
      { text: 'Bancos', icon: <AccountBalanceIcon />, path: '/admin/bancos' },
      { text: 'Cuentas Bancarias', icon: <CreditCardIcon />, path: '/admin/cuentas-bancarias' },
      // Liquidaciones Tarjeta: deshabilitado temporalmente (ago 2026) — página
      // fuera de circulación, componente y ruta conservados (comentados).
      // { text: 'Liquidaciones Tarjeta', icon: <SwapHorizIcon />, path: '/admin/liquidaciones-tarjeta' },
      { text: 'Empresas', icon: <BusinessIcon />, path: '/admin/empresas' },
      { text: 'Sucursales', icon: <ApartmentIcon />, path: '/admin/sucursales' },
      { text: 'Usuarios', icon: <ManageAccountsIcon />, path: '/admin/users' },
      { text: 'Cambiar Contexto', icon: <SwapHorizIcon />, path: '/admin/tenant-selector' },
      { text: 'Reasignación de Leads', icon: <MoveDownIcon />, path: '/admin/reasignacion-leads' },
      { text: 'Catálogos Globales', icon: <SettingsIcon />, path: '/admin/catalogos-globales' },
      // Unifica Fichas técnicas + Medidas + Colores en una sola pantalla con tabs.
      // Las rutas viejas siguen vivas (compat con links externos y bookmarks).
      { text: 'Catálogos de Equipos', icon: <SettingsIcon />, path: '/admin/catalogos-equipos' },
      { text: 'Catálogos RRHH', icon: <SettingsIcon />, path: '/admin/catalogos-rrhh' },
      // Unifica Ofertas Mensuales + Importador de Precios.
      { text: 'Precios y Ofertas', icon: <LocalOfferIcon />, path: '/admin/precios-ofertas' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/admin/settings' },
      { text: 'Actividad del sistema', icon: <HistoryIcon />, path: '/admin/actividad' },
      { text: 'Backups', icon: <BackupIcon />, path: '/admin/backups' },
      // Solo visible para el platform owner (filtrado en useNavigation por
      // platformOwnerOnlyPaths + guard PlatformOwnerRoute en App.tsx).
      { text: 'Mantenimiento SaaS', icon: <AdminPanelSettingsIcon />, path: '/platform/ops' },
    ],
  },
];
