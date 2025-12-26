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
  Avatar
} from '@mui/material';
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
import LogoutIcon from '@mui/icons-material/Logout';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import type { Modulo } from '../../types';
import SucursalSelector from '../Sucursal/SucursalSelector';

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
      { text: 'Gestión Leads', icon: <PeopleIcon />, path: '/leads/table' },
      { text: 'Gestión Clientes', icon: <PeopleIcon />, path: '/clientes/gestion' },
      { text: 'Carpeta Cliente', icon: <PeopleIcon />, path: '/clientes/carpeta' },
      { text: 'Agenda Visitas', icon: <PeopleIcon />, path: '/clientes/agenda' },
      { text: 'Cuenta Corriente', icon: <PeopleIcon />, path: '/clientes/cuenta-corriente' },
      { text: 'Crédito Personal', icon: <PeopleIcon />, path: '/clientes/credito' },
       { text: 'Métricas de Leads', icon: <AssignmentIcon />, path: '/leads/metricas' },
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
      { text: 'Depósitos', icon: <LocalShippingIcon />, path: '/logistica/depositos' },
      { text: 'Inventario Depósito', icon: <LocalShippingIcon />, path: '/logistica/inventario-deposito' },
      { text: 'Ubicación Equipos', icon: <LocalShippingIcon />, path: '/logistica/ubicacion-equipos' },
      { text: 'Auditoría Movimientos', icon: <LocalShippingIcon />, path: '/logistica/auditoria' },
      { text: 'Transferencias', icon: <SwapHorizIcon />, path: '/logistica/transferencias' },
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
      { text: 'Bancos', icon: <AccountBalanceIcon />, path: '/admin/bancos' },
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
  const navigate = useNavigate();
  const { tienePermiso } = usePermisos();
  const { user, esSuperAdmin, logout } = useAuth();
  const { sucursalFiltro, setSucursalFiltro, sucursales, canSelectSucursal, usuarioEmpresa, cambiarSucursal } = useTenant();
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  // Rutas que solo pueden ver los SUPER_ADMIN
  const superAdminOnlyPaths = ['/admin/tenant-selector'];

  // Filtrar las secciones según los permisos del usuario
  const seccionesFiltradas = navigation
    .filter((section) => tienePermiso(section.modulo))
    .map((section) => {
      // Si es la sección de ADMIN, filtrar items según el rol
      if (section.modulo === 'ADMIN' && !esSuperAdmin) {
        return {
          ...section,
          items: section.items.filter(item => !superAdminOnlyPaths.includes(item.path))
        };
      }
      return section;
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

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box', 
            background: '#212A3E', 
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
            Ripser
          </Typography>
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
        {canSelectSucursal && sucursales.length > 0 && (
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
        )}

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
        </Box>

        {/* Fixed bottom section with minimal logout button */}
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
                transform: 'translateY(100%)',
                opacity: 0,
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
            minWidth: 400,
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