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
import { Link, useLocation } from 'react-router-dom';

const drawerWidth = 240;

const navigation = [
  {
    title: 'PRINCIPAL',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    ],
  },
  {
    title: 'VENTAS',
    items: [
      { text: 'Presupuestos', icon: <AssignmentIcon />, path: '/ventas/presupuestos' },
      { text: 'Registro Ventas', icon: <AssignmentIcon />, path: '/ventas/registro' },
      { text: 'Facturación', icon: <AssignmentIcon />, path: '/ventas/facturacion' },
      { text: 'Informes', icon: <AssignmentIcon />, path: '/ventas/informes' },
    ],
  },
  {
    title: 'CLIENTES',
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
    items: [
      { text: 'Gestión Proveedores', icon: <StoreIcon />, path: '/proveedores/gestion' },
      { text: 'Compras/Pedidos', icon: <StoreIcon />, path: '/proveedores/compras' },
      { text: 'Contactos', icon: <StoreIcon />, path: '/proveedores/contactos' },
      { text: 'Historial Compras', icon: <StoreIcon />, path: '/proveedores/historial' },
      { text: 'Evaluación', icon: <StoreIcon />, path: '/proveedores/evaluacion' },
    ],
  },
  {
    title: 'GARANTÍAS',
    items: [
      { text: 'Registro Garantías', icon: <AssignmentIcon />, path: '/garantias/registro' },
      { text: 'Seguimiento Reclamos', icon: <AssignmentIcon />, path: '/garantias/reclamos' },
      { text: 'Estado Garantías', icon: <AssignmentIcon />, path: '/garantias/estado' },
    ],
  },
  {
    title: 'RRHH',
    items: [
      { text: 'Empleados', icon: <WorkIcon />, path: '/rrhh/empleados' },
      { text: 'Legajos', icon: <AssignmentIcon />, path: '/rrhh/legajos' },
      { text: 'Sueldos', icon: <AssignmentIcon />, path: '/rrhh/sueldos' },
      { text: 'Asistencia', icon: <AssignmentIcon />, path: '/rrhh/asistencia' },
      { text: 'Capacitaciones', icon: <AssignmentIcon />, path: '/rrhh/capacitaciones' },
    ],
  },
  {
    title: 'LOGÍSTICA',
    items: [
      { text: 'Gestión Stock', icon: <LocalShippingIcon />, path: '/logistica/stock' },
      { text: 'Armado Viajes', icon: <LocalShippingIcon />, path: '/logistica/viajes' },
      { text: 'Inventario', icon: <LocalShippingIcon />, path: '/logistica/inventario' },
      { text: 'Control Entregas', icon: <LocalShippingIcon />, path: '/logistica/entregas' },
    ],
  },
  {
    title: 'TALLER',
    items: [
      { text: 'Trabajos Realizados', icon: <CategoryIcon />, path: '/taller/trabajos' },
      { text: 'Órdenes Servicio', icon: <CategoryIcon />, path: '/taller/ordenes' },
      { text: 'Control Materiales', icon: <CategoryIcon />, path: '/taller/materiales' },
      { text: 'Asignación Tareas', icon: <CategoryIcon />, path: '/taller/tareas' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
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
        {navigation.map((section, idx) => (
          <React.Fragment key={section.title}>
            {idx > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />}
            <ListSubheader sx={{ bgcolor: 'inherit', color: '#00B8A9', fontWeight: 700, fontSize: 13, pl: 2, py: 1 }}>
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
