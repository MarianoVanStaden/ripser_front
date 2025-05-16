import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Users,
  Settings,
  Banknote,
  Truck,
  ShieldCheck,
  User,
  Wrench,
  ShoppingBag,
  Boxes
} from 'lucide-react';
import './Sidebar.css';
import { useSidebar } from './SidebarContext'; // ajusta ruta


export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    setOpenSection(null);
  };

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="logo-container">
        <span className="logo-circle">RP</span>
        {!collapsed && <span className="logo-text">Ripser</span>}
      </div>

      <div className="nav-items">
        <Link to="/" className="nav-item home-item">
          <div className="icon-container">
            <Home size={20} strokeWidth={1.5} />
          </div>
          {!collapsed && <span className="item-text">Inicio</span>}
        </Link>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(0)}>
            <div className="icon-container">
              <Settings size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Administración</span>
                <span className="arrow-icon">{openSection === 0 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 0 ? 'visible' : ''}`}>
            <Link to="/gastos" className="sub-item">Gastos</Link>
            <Link to="/cobros" className="sub-item">Cobros</Link>
            <Link to="/tesoreria" className="sub-item">Tesorería</Link>
            <Link to="/ventas" className="sub-item">Ventas</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(1)}>
            <div className="icon-container">
              <Banknote size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Tesorería</span>
                <span className="arrow-icon">{openSection === 1 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 1 ? 'visible' : ''}`}>
            <Link to="/mercado-pago" className="sub-item">Mercado Pago</Link>
            <Link to="/bancos" className="sub-item">Bancos</Link>
            <Link to="/cheques" className="sub-item">Cheques</Link>
            <Link to="/efectivo" className="sub-item">Efectivo</Link>
            <Link to="/amortizaciones" className="sub-item">Amortizaciones</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(2)}>
            <div className="icon-container">
              <Truck size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Logística</span>
                <span className="arrow-icon">{openSection === 2 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 2 ? 'visible' : ''}`}>
            <Link to="/viajes" className="sub-item">Viajes</Link>
            <Link to="/rendicion" className="sub-item">Rendición de Viaje</Link>
            <Link to="/vehiculos" className="sub-item">Vehículos y Viajeros</Link>
            <Link to="/estacionamientos" className="sub-item">Estadías y Estacionamientos</Link>
            <Link to="/armado-viajes" className="sub-item">Armado de Viajes</Link>
            <Link to="/solucion-viaje" className="sub-item">Solución con Viaje</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(3)}>
            <div className="icon-container">
              <ShieldCheck size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Garantías</span>
                <span className="arrow-icon">{openSection === 3 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 3 ? 'visible' : ''}`}>
            <Link to="/solucion-distancia" className="sub-item">Solución a Distancia</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(4)}>
            <div className="icon-container">
              <User size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Clientes</span>
                <span className="arrow-icon">{openSection === 4 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 4 ? 'visible' : ''}`}>
            <Link to="/creditos-personales" className="sub-item">Créditos Personales</Link>
            <Link to="/cuenta-corriente" className="sub-item">Cuenta Corriente</Link>
            <Link to="/carpeta-cliente" className="sub-item">Carpeta del Cliente</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(5)}>
            <div className="icon-container">
              <Users size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">RRHH</span>
                <span className="arrow-icon">{openSection === 5 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 5 ? 'visible' : ''}`}>
            <Link to="/capacitacion" className="sub-item">Capacitación</Link>
            <Link to="/vacaciones" className="sub-item">Vacaciones</Link>
            <Link to="/gestion-empleados" className="sub-item">Gestión de Empleados</Link>
            <Link to="/sueldos" className="sub-item">Sueldos y Aguinaldos</Link>
            <Link to="/contratacion" className="sub-item">Contratación</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(6)}>
            <div className="icon-container">
              <Wrench size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Taller</span>
                <span className="arrow-icon">{openSection === 6 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 6 ? 'visible' : ''}`}>
            <Link to="/pedido-materiales" className="sub-item">Pedido de Materiales</Link>
            <Link to="/stock-materiales" className="sub-item">Stock de Materiales</Link>
            <Link to="/pedidos-heladeras" className="sub-item">Pedidos de Heladeras</Link>
            <Link to="/stock-heladeras" className="sub-item">Stock de Heladeras</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(7)}>
            <div className="icon-container">
              <ShoppingBag size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Compras</span>
                <span className="arrow-icon">{openSection === 7 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 7 ? 'visible' : ''}`}>
            <Link to="/nota-pedido" className="sub-item">Nota de Pedido</Link>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-item" onClick={() => toggleSection(8)}>
            <div className="icon-container">
              <Boxes size={20} strokeWidth={1.5} />
            </div>
            {!collapsed && (
              <>
                <span className="item-text">Proveedores</span>
                <span className="arrow-icon">{openSection === 8 ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          <div className={`sub-items ${openSection === 8 ? 'visible' : ''}`}>
            <Link to="/proveedores" className="sub-item">Gestión de Proveedores</Link>
          </div>
        </div>
      </div>

      <button className="toggle-btn" onClick={toggleSidebar}>
        {collapsed ? '→' : '←'}
      </button>
    </div>
  );
}
