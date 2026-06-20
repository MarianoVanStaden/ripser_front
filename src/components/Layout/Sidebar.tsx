import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
  ListSubheader,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  AppBar,
} from '@mui/material';
import './Sidebar.css';
import ListItemButton from '@mui/material/ListItemButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BarChartIcon from '@mui/icons-material/BarChart';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
// import SyncIcon from '@mui/icons-material/Sync'; // usado solo por Reconciliación Stock (deshabilitada)
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import TuneIcon from '@mui/icons-material/Tune';
import SavingsIcon from '@mui/icons-material/Savings';
import HistoryIcon from '@mui/icons-material/History';
// import GavelIcon from '@mui/icons-material/Gavel';
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import type { Modulo } from '../../types';
import SucursalSelector from '../Sucursal/SucursalSelector';
import { prefetch } from '../../utils/prefetch';

const drawerWidth = 240;

// Prefetch registry for high-traffic routes. Populate on measurement, not
// intuition: only routes that > ~30% of sessions visit belong here.
// Adding too many wastes bandwidth and can stampede the backend on hover.
const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/': () => import('../Dashboard/Dashboard'),
  '/ventas/dashboard':   () => import('../../pages/ventas/VentasDashboard'),
  '/ventas/facturacion': () => import('../Ventas/FacturacionPage'),
  '/clientes/gestion':   () => import('../Clientes/ClientesPage'),
  '/prestamos/resumen':  () => import('../Prestamos/PrestamosResumenPage'),
  '/cobranzas/resumen':  () => import('../Prestamos/Cobranzas/CobranzasResumenPage'),
};

interface NavigationSection {
  title: string;
  modulo: Modulo;
  items: Array<{
    text: string;
    icon: React.ReactNode;
    path: string;
    modulo?: Modulo;
  }>;
}

const navigation: NavigationSection[] = [
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
      { text: 'Control Entregas', icon: <LocalShippingIcon />, path: '/logistica/distribucion/entregas-productos' },
      // { text: 'Entregas Equipos', icon: <LocalShippingIcon />, path: '/logistica/distribucion/entregas-equipos' },
      { text: 'Legajo de Vehículos', icon: <DirectionsCarIcon />, path: '/logistica/vehiculos/incidencias' },
      { text: 'Km por Empleado', icon: <DirectionsCarIcon />, path: '/logistica/vehiculos/km-empleados' },
    ],
  },
  {
    // Sección unificada Garantías + Taller: el fin (gestionar un reclamo/servicio)
    // es el mismo. El módulo de la sección es GARANTIAS, pero cada ítem declara
    // su propio `modulo` para que el filtro `tienePermiso(item.modulo ?? section.modulo)`
    // esconda los ítems de Taller a quien no tiene acceso a Taller (y viceversa).
    // Si todos los ítems se filtran, la sección entera se elimina más abajo.
    title: 'SERVICIO TÉCNICO / POSTVENTA',
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
    ],
  },
];

interface SidebarProps {
  open?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open = false, onToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const { user, esSuperAdmin, logout } = useAuth();
  const { sucursalFiltro, setSucursalFiltro, sucursales, canSelectSucursal, usuarioEmpresa, cambiarSucursal } = useTenant();
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const { tieneRol } = usePermisos(); // Extract tieneRol

  // Rutas que solo pueden ver los SUPER_ADMIN
  const superAdminOnlyPaths = ['/admin/tenant-selector'];
  
  // Rutas denegadas para el rol VENDEDOR
  const vendedorDeniedPaths = [
    '/ventas/facturacion',
    '/ventas/notas-credito',
    '/ventas/informes',
    '/ventas/cheques',
    '/ventas/opciones-financiamiento',
    '/ventas/configuracion-financiamiento',
    '/clientes/cuenta-corriente',
    '/leads/metricas',
    '/ventas/registro'
  ];

  // Rutas permitidas para el rol COBRANZAS (allowlist: rol muy acotado).
  const cobranzasAllowedPaths = [
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
  const tallerAllowedPaths = [
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
  const rrhhAllowedPaths = [
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
  const coordinadoraComprasAllowedPaths = [
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
  const coordinadoraLogisticaAllowedPaths = [
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
  const logisticoAllowedPaths = [
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
  const postVentaAllowedPaths = [
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
  // excepto Sueldos / Adelantos / Config. Sueldos. Mantener en sync con
  // ADMIN_EMPRESA_LIMITADO_DENIED_PREFIXES en RoleScopeGuard.tsx.
  const adminEmpresaLimitadoDeniedPaths = [
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
  const supervisorAllowedPaths = [
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
  const transporteAllowedPaths = [
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
  const conductorAllowedPaths = [
    '/',
    '/logistica/distribucion/viajes',
    '/logistica/distribucion/entregas-productos',
    '/logistica/distribucion/entregas-equipos',
    '/logistica/vehiculos/incidencias',
    // 'Km por Empleado' (/logistica/vehiculos/km-empleados) NO va: es gestión de
    // datos de RRHH/transporte, fuera del scope operativo del conductor.
  ];

  // Filtrar las secciones según los permisos del usuario.
  // Un ítem puede declarar su propio `modulo` para sobreescribir el de la sección
  // (útil cuando una sección agrupa rutas gateadas por permisos distintos).
  const seccionesFiltradas = navigation
    .map((section) => {
      let filteredItems = section.items.filter(item =>
        tienePermiso(item.modulo ?? section.modulo)
      );

      // Si es la sección de ADMIN, filtrar items según el rol
      if (section.modulo === 'ADMIN' && !esSuperAdmin) {
        filteredItems = filteredItems.filter(item => !superAdminOnlyPaths.includes(item.path));
      }

      // Si el rol es puramente VENDEDOR (y no Admin), ocultar rutas específicas
      const isVendedor = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('VENDEDOR');
      if (isVendedor) {
        filteredItems = filteredItems.filter(item => !vendedorDeniedPaths.includes(item.path));
      }

      // Si el rol es puramente COBRANZAS (y no Admin), aplicar allowlist estricta.
      const isCobranzasOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('COBRANZAS');
      if (isCobranzasOnly) {
        filteredItems = filteredItems.filter(item => cobranzasAllowedPaths.includes(item.path));
      }

      // Si el rol es puramente SUPERVISOR (y no Admin), aplicar allowlist estricta.
      // Su menú es la unión de VENDEDOR + COBRANZAS + TRANSPORTE + Métricas de Leads.
      const isSupervisorOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('SUPERVISOR');
      if (isSupervisorOnly) {
        filteredItems = filteredItems.filter(item => supervisorAllowedPaths.includes(item.path));
      }

      // Si el rol es puramente TRANSPORTE (y no Admin), aplicar allowlist estricta.
      const isTransporteOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('TRANSPORTE');
      if (isTransporteOnly) {
        filteredItems = filteredItems.filter(item => transporteAllowedPaths.includes(item.path));
      }

      // Si el rol es puramente CONDUCTOR (y no Admin), aplicar allowlist estricta:
      // sólo el módulo Transporte.
      const isConductorOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('CONDUCTOR');
      if (isConductorOnly) {
        filteredItems = filteredItems.filter(item => conductorAllowedPaths.includes(item.path));
      }

      // Si el rol es puramente TALLER (y no Admin), aplicar allowlist estricta.
      const isTallerOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('TALLER');
      if (isTallerOnly) {
        filteredItems = filteredItems.filter(item => tallerAllowedPaths.includes(item.path));
      }

      // Si el rol es puramente RECURSOS_HUMANOS (y no Admin), aplicar allowlist estricta.
      const isRrhhOnly = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('RECURSOS_HUMANOS');
      if (isRrhhOnly) {
        filteredItems = filteredItems.filter(item => rrhhAllowedPaths.includes(item.path));
      }

      // ADMIN_EMPRESA_LIMITADO: admin "empleado" sin acceso a RRHH (ya filtrado
      // por módulo) ni a pantallas sensibles puntuales. Denylist específica.
      const isAdminEmpresaLimitado = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('ADMIN_EMPRESA_LIMITADO');
      if (isAdminEmpresaLimitado) {
        filteredItems = filteredItems.filter(item => !adminEmpresaLimitadoDeniedPaths.includes(item.path));
      }

      const isCoordinadoraCompras = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('COORDINADORA_COMPRAS');
      if (isCoordinadoraCompras) {
        filteredItems = filteredItems.filter(item => coordinadoraComprasAllowedPaths.includes(item.path));
      }

      const isCoordinadoraLogistica = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('COORDINADORA_LOGISTICA');
      if (isCoordinadoraLogistica) {
        filteredItems = filteredItems.filter(item => coordinadoraLogisticaAllowedPaths.includes(item.path));
      }

      const isLogistico = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('LOGISTICO');
      if (isLogistico) {
        filteredItems = filteredItems.filter(item => logisticoAllowedPaths.includes(item.path));
      }

      const isPostVenta = !esSuperAdmin && !tieneRol('ADMIN') && tieneRol('POST_VENTA');
      if (isPostVenta) {
        filteredItems = filteredItems.filter(item => postVentaAllowedPaths.includes(item.path));
      }

      return {
        ...section,
        items: filteredItems
      };
    })
    .filter((section) => section.items.length > 0); // Eliminar secciones sin items

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setOpenLogoutDialog(false);
    logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setOpenLogoutDialog(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar after navigation on mobile, keep open on desktop
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
          Ripser App
        </Typography>
        <IconButton
          onClick={onToggle}
          sx={{ color: '#fff' }}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      {/* User Profile Section */}
      <Box sx={{ p: 2, bgcolor: 'rgba(0,184,169,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#00B8A9',
              fontSize: '1rem',
            }}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.username || 'Usuario'}
            </Typography>
            {esSuperAdmin && (
              <Chip
                icon={<AdminPanelSettingsIcon sx={{ fontSize: '0.875rem' }} />}
                label="Super Admin"
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.65rem',
                  bgcolor: '#FF6B6B',
                  color: '#fff',
                  fontWeight: 700,
                  '& .MuiChip-icon': {
                    color: '#fff',
                    fontSize: '0.875rem',
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      {/* Selector de Sucursal */}
      {(() => {
        const show = canSelectSucursal && sucursales.length > 0;
        if (!show) {
          console.log('🔍 Selector de sucursales NO mostrado:', { canSelectSucursal, sucursalesLength: sucursales.length });
        }
        return show ? (
          <>
            <Box sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
              <SucursalSelector
                sucursales={sucursales}
                sucursalActual={sucursalFiltro}
                sucursalDefecto={usuarioEmpresa?.sucursalDefectoId ?? null}
                onChange={setSucursalFiltro}
                onChangeBackend={cambiarSucursal}
              />
            </Box>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          </>
        ) : null;
      })()}

      {/* Scrollable menu section */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List>
          {seccionesFiltradas.map((section, idx) => (
            <React.Fragment key={section.title}>
              {idx > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />}
              <ListSubheader
                sx={{
                  bgcolor: 'inherit',
                  color: '#00B8A9',
                  fontWeight: 700,
                  fontSize: 13,
                  pl: 2,
                  py: 1,
                  position: 'relative'
                }}
              >
                {section.title}
              </ListSubheader>
              {section.items.map(item => (
                <ListItem
                  key={item.text}
                  disablePadding
                  sx={{
                    background: location.pathname === item.path ? 'rgba(0,184,169,0.08)' : 'inherit',
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    onMouseEnter={ROUTE_PREFETCH[item.path] ? prefetch(ROUTE_PREFETCH[item.path]) : undefined}
                    onFocus={ROUTE_PREFETCH[item.path] ? prefetch(ROUTE_PREFETCH[item.path]) : undefined}
                    selected={location.pathname === item.path}
                    sx={{
                      color: location.pathname === item.path ? '#00B8A9' : '#fff',
                      '&:hover': { background: 'rgba(0,184,169,0.15)' },
                      borderRadius: 1,
                      minHeight: 48, // Touch-friendly height for mobile
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Fixed bottom section with logout button */}
      <Box
        sx={{
          position: 'relative',
          height: 56,
          overflow: 'hidden',
          '&:hover .logout-button': {
            transform: 'translateY(0)',
            opacity: 1,
          },
        }}
      >
        <Tooltip title="Cerrar sesión" placement="top" arrow>
          <IconButton
            className="logout-button"
            onClick={handleLogoutClick}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '100%',
              borderRadius: 0,
              bgcolor: 'rgba(244, 67, 54, 0.08)',
              color: '#f44336',
              transform: isMobile ? 'translateY(0)' : 'translateY(100%)',
              opacity: isMobile ? 1 : 0,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'rgba(244, 67, 54, 0.15)',
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Copyright */}
      <Box p={2} pt={1}>
        <Typography variant="caption" color="#aaa">
          © {new Date().getFullYear()} Ripser
        </Typography>
      </Box>
    </>
  );

  return (
    <>
      {/* AppBar with hamburger menu - visible on all devices */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: '#212A3E',
          boxShadow: 1,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={onToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Ripser
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Collapsible Drawer - same behavior on all devices */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: '#212A3E',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            top: { xs: 0, md: '64px' }, // Below AppBar on desktop
            height: { xs: '100%', md: 'calc(100% - 64px)' },
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: isMobile ? 'auto' : 400,
            mx: 2,
          },
        }}
      >
        <DialogTitle id="logout-dialog-title" sx={{ pb: 1 }}>
          Confirmar cierre de sesión
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            ¿Está seguro que desea cerrar sesión?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleLogoutCancel}
            color="inherit"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleLogoutConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;
