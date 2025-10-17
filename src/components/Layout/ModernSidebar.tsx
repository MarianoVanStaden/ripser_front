import React from "react";
import { Sidebar, Menu, MenuItem, Submenu, Logo } from "react-mui-sidebar";
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';
import { Link, useLocation } from "react-router-dom";

const ModernSidebar: React.FC = () => {
  const location = useLocation();
  return (
    <Sidebar width={"260px"} themeColor="#00B8A9" mode="dark" userName="Usuario" designation="Admin" showProfile={true} userimg="https://ui-avatars.com/api/?name=Usuario" >
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
        <MenuItem icon={<StoreIcon />} component={Link} link="/proveedores/gestion" isSelected={location.pathname.startsWith("/proveedores")}>Proveedores</MenuItem>
        <MenuItem icon={<LocalShippingIcon />} component={Link} link="/logistica/stock" isSelected={location.pathname.startsWith("/logistica")}>Logística</MenuItem>
      </Menu>
      <Menu subHeading="OTROS">
        <MenuItem component={Link} link="/admin/settings" isSelected={location.pathname.startsWith("/admin/settings")}>Configuración</MenuItem>
      </Menu>
    </Sidebar>
  );
};

export default ModernSidebar;
