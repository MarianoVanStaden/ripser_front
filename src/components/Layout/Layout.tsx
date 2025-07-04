import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
  ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  RoomService as RoomServiceIcon,
  Category as CategoryIcon,
  LocalShipping as LocalShippingIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  category?: string;
}

interface NavigationCategory {
  title: string;
  items: NavigationItem[];
}

const navigationCategories: NavigationCategory[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    ]
  },
  {
    title: 'ADMIN',
    items: [
      { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users' },
      { text: 'Roles y Permisos', icon: <BusinessIcon />, path: '/admin/roles' },
      { text: 'Parámetros Sistema', icon: <CategoryIcon />, path: '/admin/settings' },
    ]
  },
  {
    title: 'VENTAS',
    items: [
      { text: 'Presupuestos', icon: <InventoryIcon />, path: '/ventas/presupuestos' },
      { text: 'Registro Ventas', icon: <PointOfSaleIcon />, path: '/ventas/registro' },
      { text: 'Facturación', icon: <ShoppingCartIcon />, path: '/ventas/facturacion' },
      { text: 'Informes', icon: <RoomServiceIcon />, path: '/ventas/informes' },
    ]
  },
  {
    title: 'CLIENTES',
    items: [
      { text: 'Gestión Clientes', icon: <PeopleIcon />, path: '/clientes/gestion' },
      { text: 'Carpeta Cliente', icon: <BusinessIcon />, path: '/clientes/carpeta' },
      { text: 'Agenda Visitas', icon: <CategoryIcon />, path: '/clientes/agenda' },
      { text: 'Cuenta Corriente', icon: <LocalShippingIcon />, path: '/clientes/cuenta-corriente' },
      { text: 'Crédito Personal', icon: <InventoryIcon />, path: '/clientes/credito' },
    ]
  },
  {
    title: 'PROVEEDORES',
    items: [
      { text: 'Gestión Proveedores', icon: <LocalShippingIcon />, path: '/proveedores/gestion' },
      { text: 'Compras/Pedidos', icon: <ShoppingCartIcon />, path: '/proveedores/compras' },
      { text: 'Contactos', icon: <PeopleIcon />, path: '/proveedores/contactos' },
      { text: 'Historial Compras', icon: <RoomServiceIcon />, path: '/proveedores/historial' },
      { text: 'Evaluación', icon: <CategoryIcon />, path: '/proveedores/evaluacion' },
    ]
  },
  {
    title: 'GARANTÍAS',
    items: [
      { text: 'Registro Garantías', icon: <InventoryIcon />, path: '/garantias/registro' },
      { text: 'Seguimiento Reclamos', icon: <RoomServiceIcon />, path: '/garantias/reclamos' },
      { text: 'Estado Garantías', icon: <CategoryIcon />, path: '/garantias/estado' },
    ]
  },
  {
    title: 'RRHH',
    items: [
      { text: 'Empleados', icon: <BusinessIcon />, path: '/rrhh/empleados' },
      { text: 'Legajos', icon: <PeopleIcon />, path: '/rrhh/legajos' },
      { text: 'Sueldos', icon: <PointOfSaleIcon />, path: '/rrhh/sueldos' },
      { text: 'Asistencia', icon: <CategoryIcon />, path: '/rrhh/asistencia' },
      { text: 'Capacitaciones', icon: <RoomServiceIcon />, path: '/rrhh/capacitaciones' },
    ]
  },
  {
    title: 'LOGÍSTICA',
    items: [
      { text: 'Gestión Stock', icon: <InventoryIcon />, path: '/logistica/stock' },
      { text: 'Armado Viajes', icon: <LocalShippingIcon />, path: '/logistica/viajes' },
      { text: 'Inventario', icon: <CategoryIcon />, path: '/logistica/inventario' },
      { text: 'Control Entregas', icon: <ShoppingCartIcon />, path: '/logistica/entregas' },
    ]
  },
  {
    title: 'TALLER',
    items: [
      { text: 'Trabajos Realizados', icon: <RoomServiceIcon />, path: '/taller/trabajos' },
      { text: 'Órdenes Servicio', icon: <BusinessIcon />, path: '/taller/ordenes' },
      { text: 'Control Materiales', icon: <InventoryIcon />, path: '/taller/materiales' },
      { text: 'Asignación Tareas', icon: <PeopleIcon />, path: '/taller/tareas' },
    ]
  },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" color="primary">
          Ripser
        </Typography>
      </Toolbar>
      <List sx={{ py: 0 }}>
        {navigationCategories.map((category, categoryIndex) => (
          <React.Fragment key={category.title}>
            {categoryIndex > 0 && <Divider />}
            <ListSubheader 
              component="div" 
              sx={{ 
                bgcolor: 'background.paper',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              {category.title}
            </ListSubheader>
            {category.items.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main + '20',
                      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Service Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
