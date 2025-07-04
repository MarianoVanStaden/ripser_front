import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import ClientsPage from './components/Clients/ClientsPage';
import PresupuestosPage from './components/Ventas/PresupuestosPage';
import RegistroVentasPage from './components/Ventas/RegistroVentasPage';
import UsersPage from './components/Admin/UsersPage';
import RolesPage from './components/Admin/RolesPage';
import SettingsPage from './components/Admin/SettingsPage';
import SuppliersPage from './components/Proveedores/SuppliersPage';
import StockPage from './components/Logistica/StockPage';
import InventoryPage from './components/Logistica/InventoryPage';
import TripsPage from './components/Logistica/TripsPage';
import DeliveriesPage from './components/Logistica/DeliveriesPage';

// Placeholder component for unimplemented pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '24px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Esta página está en desarrollo</p>
  </div>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            {/* ADMIN Module */}
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/roles" element={<RolesPage />} />
            <Route path="admin/settings" element={<SettingsPage />} />
            
            {/* VENTAS Module */}
            <Route path="ventas/presupuestos" element={<PresupuestosPage />} />
            <Route path="ventas/registro" element={<RegistroVentasPage />} />
            <Route path="ventas/facturacion" element={<PlaceholderPage title="Facturación" />} />
            <Route path="ventas/informes" element={<PlaceholderPage title="Informes de Ventas" />} />
            
            {/* CLIENTES Module */}
            <Route path="clientes/gestion" element={<ClientsPage />} />
            <Route path="clientes/carpeta" element={<PlaceholderPage title="Carpeta de Cliente" />} />
            <Route path="clientes/agenda" element={<PlaceholderPage title="Agenda de Visitas" />} />
            <Route path="clientes/cuenta-corriente" element={<PlaceholderPage title="Cuenta Corriente" />} />
            <Route path="clientes/credito" element={<PlaceholderPage title="Crédito Personal" />} />
            
            {/* PROVEEDORES Module */}
            <Route path="proveedores/gestion" element={<SuppliersPage />} />
            <Route path="proveedores/compras" element={<PlaceholderPage title="Compras/Pedidos" />} />
            <Route path="proveedores/contactos" element={<PlaceholderPage title="Contactos y Condiciones" />} />
            <Route path="proveedores/historial" element={<PlaceholderPage title="Historial de Compras" />} />
            <Route path="proveedores/evaluacion" element={<PlaceholderPage title="Evaluación de Desempeño" />} />
            
            {/* GARANTÍAS Module */}
            <Route path="garantias/registro" element={<PlaceholderPage title="Registro de Garantías" />} />
            <Route path="garantias/reclamos" element={<PlaceholderPage title="Seguimiento de Reclamos" />} />
            <Route path="garantias/estado" element={<PlaceholderPage title="Estado de Garantías" />} />
            
            {/* RRHH Module */}
            <Route path="rrhh/empleados" element={<PlaceholderPage title="Registro de Empleados" />} />
            <Route path="rrhh/legajos" element={<PlaceholderPage title="Gestión de Legajos" />} />
            <Route path="rrhh/sueldos" element={<PlaceholderPage title="Carga de Sueldos" />} />
            <Route path="rrhh/asistencia" element={<PlaceholderPage title="Asistencia y Licencias" />} />
            <Route path="rrhh/capacitaciones" element={<PlaceholderPage title="Capacitaciones" />} />
            
            {/* LOGÍSTICA Module */}
            <Route path="logistica/stock" element={<StockPage />} />
            <Route path="logistica/viajes" element={<TripsPage />} />
            <Route path="logistica/inventario" element={<InventoryPage />} />
            <Route path="logistica/entregas" element={<DeliveriesPage />} />
            
            {/* TALLER Module */}
            <Route path="taller/trabajos" element={<PlaceholderPage title="Trabajos Realizados" />} />
            <Route path="taller/ordenes" element={<PlaceholderPage title="Órdenes de Servicio" />} />
            <Route path="taller/materiales" element={<PlaceholderPage title="Control de Materiales" />} />
            <Route path="taller/tareas" element={<PlaceholderPage title="Asignación de Tareas" />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
