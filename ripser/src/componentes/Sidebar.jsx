import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function SidebarSection({ title, children, isOpen, toggleOpen }) {
  return (
    <div className="section">
      <div className={`item ${isOpen ? 'open' : ''}`} onClick={toggleOpen}>
        {title}
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>  {/* Añadimos una flecha */}
      </div>
      <div className={`sub-items ${isOpen ? 'visible' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [openSection, setOpenSection] = useState(null);

  const handleToggle = (index) => {
    setOpenSection(openSection === index ? null : index);  // Cierra la sección si está abierta
  };

  return (
    <div className="sidebar">
      <h1 className="title">Panel de configuración</h1>

      <Link to="/" className="item">Inicio</Link>

      <SidebarSection
        title="Administración"
        isOpen={openSection === 0}
        toggleOpen={() => handleToggle(0)}
      >
        <Link to="/gastos" className="sub-item">Gastos</Link>
        <Link to="/cobros" className="sub-item">Cobros</Link>
        <Link to="/tesoreria" className="sub-item">Tesorería</Link>
        <Link to="/ventas" className="sub-item">Ventas</Link>
      </SidebarSection>

      <SidebarSection
        title="Tesorería"
        isOpen={openSection === 1}
        toggleOpen={() => handleToggle(1)}
      >
        <Link to="/mercado-pago" className="sub-item">Mercado Pago</Link>
        <Link to="/bancos" className="sub-item">Bancos</Link>
        <Link to="/cheques" className="sub-item">Cheques</Link>
        <Link to="/efectivo" className="sub-item">Efectivo</Link>
        <Link to="/amortizaciones" className="sub-item">Amortizaciones</Link>
      </SidebarSection>

      <SidebarSection
        title="Logística"
        isOpen={openSection === 2}
        toggleOpen={() => handleToggle(2)}
      >
        <Link to="/viajes" className="sub-item">Viajes</Link>
        <Link to="/rendicion" className="sub-item">Rendición de Viaje</Link>
        <Link to="/vehiculos" className="sub-item">Vehículos y Viajeros</Link>
        <Link to="/estacionamientos" className="sub-item">Estadías y Estacionamientos</Link>
        <Link to="/armado-viajes" className="sub-item">Armado de Viajes</Link>
        <Link to="/solucion-viaje" className="sub-item">Solución con Viaje</Link>
      </SidebarSection>

      <SidebarSection
        title="Garantías"
        isOpen={openSection === 3}
        toggleOpen={() => handleToggle(3)}
      >
        <Link to="/solucion-distancia" className="sub-item">Solución a Distancia</Link>
      </SidebarSection>

      <SidebarSection
        title="Clientes"
        isOpen={openSection === 4}
        toggleOpen={() => handleToggle(4)}
      >
        <Link to="/creditos-personales" className="sub-item">Créditos Personales</Link>
        <Link to="/cuenta-corriente" className="sub-item">Cuenta Corriente</Link>
        <Link to="/carpeta-cliente" className="sub-item">Carpeta del Cliente</Link>
      </SidebarSection>

      <SidebarSection
        title="RRHH"
        isOpen={openSection === 5}
        toggleOpen={() => handleToggle(5)}
      >
        <Link to="/capacitacion" className="sub-item">Capacitación</Link>
        <Link to="/vacaciones" className="sub-item">Vacaciones</Link>
        <Link to="/gestion-empleados" className="sub-item">Gestión de Empleados</Link>
        <Link to="/sueldos" className="sub-item">Sueldos y Aguinaldos</Link>
        <Link to="/contratacion" className="sub-item">Contratación</Link>
      </SidebarSection>

      <SidebarSection
        title="Taller"
        isOpen={openSection === 6}
        toggleOpen={() => handleToggle(6)}
      >
        <Link to="/pedido-materiales" className="sub-item">Pedido de Materiales</Link>
        <Link to="/stock-materiales" className="sub-item">Stock de Materiales</Link>
        <Link to="/pedidos-heladeras" className="sub-item">Pedidos de Heladeras</Link>
        <Link to="/stock-heladeras" className="sub-item">Stock de Heladeras</Link>
      </SidebarSection>

      <SidebarSection
        title="Compras"
        isOpen={openSection === 7}
        toggleOpen={() => handleToggle(7)}
      >
        <Link to="/nota-pedido" className="sub-item">Nota de Pedido</Link>
      </SidebarSection>

      <SidebarSection
        title="Proveedores"
        isOpen={openSection === 8}
        toggleOpen={() => handleToggle(8)}
      >
        <Link to="/proveedores" className="sub-item">Gestión de Proveedores</Link>
      </SidebarSection>
    </div>
  );
}
