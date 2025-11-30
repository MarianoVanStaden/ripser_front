import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider, Box, Typography, ListSubheader } from '@mui/material';
import './Sidebar.css';
import ListItemButton from '@mui/material/ListItemButton';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import SettingsIcon from '@mui/icons-material/Settings';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BarChartIcon from '@mui/icons-material/BarChart';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Link, useLocation } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import type { Modulo } from '../../types';

const drawerWidth = 240;

interface NavigationSection {
  title: string;
  modulo: Modulo;
  items: Array<{
    text: string;
    icon: React.ReactNode;
    path: string;
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
      { text: 'Presupuestos', icon: <AssignmentIcon />, path: '/ventas/presupuestos' },
      { text: 'Notas de Pedido', icon: <AssignmentIcon />, path: '/ventas/notasPedido' },
      { text: 'Facturación', icon: <AssignmentIcon />, path: '/ventas/facturacion' },
      { text: 'Notas de Crédito', icon: <AssignmentIcon />, path: '/ventas/notas-credito' },
      { text: 'Registro Ventas', icon: <AssignmentIcon />, path: '/ventas/registro' },
      { text: 'Informes', icon: <AssignmentIcon />, path: '/ventas/informes' },
      { text: 'Opción Financiamiento Particular', icon: <AssignmentIcon />, path: '/ventas/opciones-financiamiento' },
      { text: 'Configuración Financiamiento', icon: <SettingsIcon />, path: '/ventas/configuracion-financiamiento' },
    ],
  },
  {
    title: 'CLIENTES',
    modulo: 'CLIENTES',
    items: [
      { text: 'Gestión Clientes', icon: <PeopleIcon />, path: '/clientes/gestion' },
      { text: 'Carpeta Cliente', icon: <PeopleIcon />, path: '/clientes/carpeta' },
      { text: 'Agenda Visitas', icon: <PeopleIcon />, path: '/clientes/agenda' },
      { text: 'Cuenta Corriente', icon: <PeopleIcon />, path: '/clientes/cuenta-corriente' },
      { text: 'Crédito Personal', icon: <PeopleIcon />, path: '/clientes/credito' },
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
      { text: 'Gestión Stock', icon: <LocalShippingIcon />, path: '/logistica/stock' },
      { text: 'Stock de Equipos', icon: <LocalShippingIcon />, path: '/logistica/stock-equipos' },
      { text: 'Inventario', icon: <LocalShippingIcon />, path: '/logistica/inventario' },
      { text: 'Tareas de Recuento', icon: <LocalShippingIcon />, path: '/logistica/recuentos' },
      { text: 'Armado Viajes', icon: <LocalShippingIcon />, path: '/logistica/viajes' },
      { text: 'Control Entregas', icon: <LocalShippingIcon />, path: '/logistica/entregas' },
      { text: 'Entregas de Equipos', icon: <LocalShippingIcon />, path: '/logistica/entregas-equipos' },
    ],
  },
  {
    title: 'TALLER',
    modulo: 'TALLER',
    items: [
      { text: 'Órdenes Servicio', icon: <CategoryIcon />, path: '/taller/ordenes' },
      { text: 'Control Materiales', icon: <CategoryIcon />, path: '/taller/materiales' },
      { text: 'Asignación Tareas', icon: <CategoryIcon />, path: '/taller/tareas' },
      { text: 'Trabajos Realizados', icon: <CategoryIcon />, path: '/taller/trabajos' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/taller/configuracion' },
    ],
  },
  {
    title: 'PRODUCCIÓN',
    modulo: 'PRODUCCION',
    items: [
      { text: 'Tablero de Producción', icon: <PrecisionManufacturingIcon />, path: '/fabricacion/dashboard' },
      { text: 'Estructura de Producción', icon: <AssignmentIcon />, path: '/fabricacion/recetas' },
      { text: 'Equipos Fabricados', icon: <CategoryIcon />, path: '/fabricacion/equipos' },
      { text: 'Reportes de Estados', icon: <AssignmentIcon />, path: '/fabricacion/reportes-estados' },
    ],
  },
  {
    title: 'GARANTÍAS',
    modulo: 'GARANTIAS',
    items: [
      { text: 'Registro Garantías', icon: <AssignmentIcon />, path: '/garantias/registro' },
      { text: 'Seguimiento Reclamos', icon: <AssignmentIcon />, path: '/garantias/reclamos' },
      { text: 'Reporte de Garantías', icon: <BarChartIcon />, path: '/garantias/reporte' },
    ],
  },
  {
    title: 'RRHH',
    modulo: 'RRHH',
    items: [
      { text: 'Empleados', icon: <WorkIcon />, path: '/rrhh/empleados' },
      { text: 'Usuarios del Sistema', icon: <PeopleIcon />, path: '/rrhh/usuarios' },
      { text: 'Legajos', icon: <AssignmentIcon />, path: '/rrhh/legajos' },
      { text: 'Sueldos', icon: <AssignmentIcon />, path: '/rrhh/sueldos' },
      { text: 'Asistencia', icon: <AssignmentIcon />, path: '/rrhh/asistencia' },
      { text: 'Capacitaciones', icon: <AssignmentIcon />, path: '/rrhh/capacitaciones' },
      { text: 'Puestos', icon: <AssignmentIcon />, path: '/rrhh/puestos' },
      { text: 'Licencias', icon: <AssignmentIcon />, path: '/rrhh/licencias' },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    modulo: 'ADMIN',
    items: [
      { text: 'Flujo de Caja', icon: <BarChartIcon />, path: '/admin/flujo-caja' },
      { text: 'Empresas', icon: <BusinessIcon />, path: '/admin/empresas' },
      { text: 'Sucursales', icon: <AccountBalanceIcon />, path: '/admin/sucursales' },
      { text: 'Cambiar Contexto', icon: <SwapHorizIcon />, path: '/admin/tenant-selector' },
      { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users' },
      { text: 'Roles', icon: <SettingsIcon />, path: '/admin/roles' },
      { text: 'Configuración', icon: <SettingsIcon />, path: '/admin/settings' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { tienePermiso } = usePermisos();

  // Filtrar las secciones según los permisos del usuario
  const seccionesFiltradas = navigation.filter((section) => tienePermiso(section.modulo));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#212A3E', color: '#fff' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
          Ripser
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
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
                  component={Link}
                  to={item.path}
                  selected={location.pathname === item.path}
                  sx={{
                    color: location.pathname === item.path ? '#00B8A9' : '#fff',
                    '&:hover': { background: 'rgba(0,184,169,0.15)' },
                    borderRadius: 1,
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
      <Box flexGrow={1} />
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box p={2}>
        <Typography variant="caption" color="#aaa">
          © {new Date().getFullYear()} Ripser
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
