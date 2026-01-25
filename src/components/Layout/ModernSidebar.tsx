import React from "react";
import { Sidebar, Menu, MenuItem, Logo } from "react-mui-sidebar";
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ModernSidebar: React.FC = () => {
  const location = useLocation();
  const { user, esSuperAdmin } = useAuth();

  // Get user designation based on roles
  const getUserDesignation = () => {
    if (esSuperAdmin) return "Super Admin";
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0].toString();
    }
    return "Usuario";
  };

  const userName = user?.username || "Usuario";
  const userDesignation = getUserDesignation();
  const userAvatar = `https://ui-avatars.com/api/?name=${userName}`;

  return (
    <Sidebar
      width={"260px"}
      themeColor="#00B8A9"
      mode="dark"
      userName={userName}
      designation={userDesignation}
      showProfile={true}
      userimg={userAvatar}
    >
      <Logo
        component={Link}
        href="/"
        img="https://adminmart.com/wp-content/uploads/2024/03/logo-admin-mart-news.png"
      >
        Ripser
      </Logo>
      <Menu subHeading="PRINCIPAL">
        <MenuItem icon={<DashboardIcon />} component={Link} link="/" isSelected={location.pathname === "/"}>Dashboard</MenuItem>
        <MenuItem icon={<PeopleIcon />} component={Link} link="/clientes/gestion" isSelected={location.pathname.startsWith("/clientes")}>Clientes</MenuItem>
        <MenuItem icon={<WorkIcon />} component={Link} link="/rrhh/empleados" isSelected={location.pathname.startsWith("/rrhh/empleados")}>Empleados</MenuItem>
        <MenuItem icon={<AssignmentIcon />} component={Link} link="/rrhh/sueldos" isSelected={location.pathname.startsWith("/rrhh/sueldos")}>Sueldos</MenuItem>
        <MenuItem icon={<AssignmentIcon />} component={Link} link="/rrhh/legajos" isSelected={location.pathname.startsWith("/rrhh/legajos")}>Legajos</MenuItem>
        <MenuItem icon={<CategoryIcon />} component={Link} link="/taller/trabajos" isSelected={location.pathname.startsWith("/taller")}>Taller</MenuItem>
        <MenuItem icon={<PrecisionManufacturingIcon />} component={Link} link="/fabricacion/dashboard" isSelected={location.pathname.startsWith("/fabricacion")}>Fabricación</MenuItem>
        <MenuItem icon={<StoreIcon />} component={Link} link="/proveedores/gestion" isSelected={location.pathname.startsWith("/proveedores")}>Proveedores</MenuItem>
        <MenuItem icon={<LocalShippingIcon />} component={Link} link="/logistica/stock" isSelected={location.pathname.startsWith("/logistica")}>Logística</MenuItem>
      </Menu>
      <Menu subHeading="ADMINISTRACIÓN">
        <MenuItem icon={<BusinessIcon />} component={Link} link="/admin/empresas" isSelected={location.pathname.startsWith("/admin/empresas")}>Empresas</MenuItem>
        <MenuItem icon={<AccountBalanceIcon />} component={Link} link="/admin/sucursales" isSelected={location.pathname.startsWith("/admin/sucursales")}>Sucursales</MenuItem>
        <MenuItem icon={<SwapHorizIcon />} component={Link} link="/admin/tenant-selector" isSelected={location.pathname.startsWith("/admin/tenant-selector")}>Cambiar Contexto</MenuItem>
        <MenuItem component={Link} link="/admin/settings" isSelected={location.pathname.startsWith("/admin/settings")}>Configuración</MenuItem>
      </Menu>
    </Sidebar>
  );
};

export default ModernSidebar;
