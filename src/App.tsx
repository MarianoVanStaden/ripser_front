import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import { 
  ClientesPage, 
  ClienteFormPage, 
  ClienteDetailPage,
  AgendaVisitasPage,
  CreditoPersonalPage,
  CarpetaClientePage,
  CarpetaClienteSelector,
  CuentaCorrientePage
} from './components/Clientes';
import PresupuestosPage from './components/Ventas/PresupuestosPage';
import RegistroVentasPage from './components/Ventas/RegistroVentasPage';
import FacturacionPage from './components/Ventas/FacturacionPage';
import InformesVentasPage from './components/Ventas/InformesVentasPage';
import UsersPage from './components/Admin/UsersPage';
import RolesPage from './components/Admin/RolesPage';
import SettingsPage from './components/Admin/SettingsPage';
import { 
  SuppliersPage, 
  ComprasPedidosPage, 
  ContactosCondicionesPage, 
  HistorialComprasPage, 
  EvaluacionDesempenoPage 
} from './components/Proveedores';
import GarantiasPage from './components/Garantia/GarantiasPage';
import ReclamosGarantiaPage from './components/Garantia/ReclamosGarantiaPage';
import StockPage from './components/Logistica/StockPage';
import InventoryPage from './components/Logistica/InventoryPage';
import TripsPage from './components/Logistica/TripsPage';
import DeliveriesPage from './components/Logistica/DeliveriesPage';
import TrabajosRealizadosPage from './components/Taller/TrabajosRealizadosPage';
import OrdenesServicioPage from './components/Taller/OrdenesServicioPage';
import ControlMaterialesPage from './components/Taller/ControlMaterialesPage';
import AsignacionTareasPage from './components/Taller/AsignacionTareasPage';
// RRHH pages
import { EmpleadosPage, PuestosPage, AsistenciasPage, LicenciasPage, CapacitacionesPage, SueldosPage, LegajosPage } from './components/RRHH';

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
            <Route path="ventas/facturacion" element={<FacturacionPage />} />
            <Route path="ventas/informes" element={<InformesVentasPage />} />
            
            {/* CLIENTES Module */}
            <Route path="clientes/gestion" element={<ClientesPage />} />
            <Route path="clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="clientes/editar/:id" element={<ClienteFormPage />} />
            <Route path="clientes/detalle/:id" element={<ClienteDetailPage />} />
            <Route path="clientes/carpeta" element={<CarpetaClienteSelector />} />
            <Route path="clientes/carpeta/:id" element={<CarpetaClientePage />} />
            <Route path="clientes/agenda" element={<AgendaVisitasPage />} />
            <Route path="clientes/cuenta-corriente" element={<CuentaCorrientePage />} />
            <Route path="clientes/credito" element={<CreditoPersonalPage />} />
            
            {/* PROVEEDORES Module */}
            <Route path="proveedores/gestion" element={<SuppliersPage />} />
            <Route path="proveedores/compras" element={<ComprasPedidosPage />} />
            <Route path="proveedores/contactos" element={<ContactosCondicionesPage />} />
            <Route path="proveedores/historial" element={<HistorialComprasPage />} />
            <Route path="proveedores/evaluacion" element={<EvaluacionDesempenoPage />} />
            
            {/* GARANTÍAS Module */}
            <Route path="garantias/registro" element={<GarantiasPage />} />
            <Route path="garantias/reclamos" element={<ReclamosGarantiaPage />} />
            <Route path="garantias/estado" element={<GarantiasPage />} />
            
            {/* RRHH Module */}
            <Route path="rrhh/empleados" element={<EmpleadosPage />} />
            <Route path="rrhh/puestos" element={<PuestosPage />} />
            <Route path="rrhh/asistencia" element={<AsistenciasPage />} />
            <Route path="rrhh/licencias" element={<LicenciasPage />} />
            <Route path="rrhh/capacitaciones" element={<CapacitacionesPage />} />
            <Route path="rrhh/sueldos" element={<SueldosPage />} />
            <Route path="rrhh/legajos" element={<LegajosPage />} />
            
            {/* LOGÍSTICA Module */}
            <Route path="logistica/stock" element={<StockPage />} />
            <Route path="logistica/viajes" element={<TripsPage />} />
            <Route path="logistica/inventario" element={<InventoryPage />} />
            <Route path="logistica/entregas" element={<DeliveriesPage />} />
            
            {/* TALLER Module */}
            <Route path="taller/trabajos" element={<TrabajosRealizadosPage />} />
            <Route path="taller/ordenes" element={<OrdenesServicioPage />} />
            <Route path="taller/materiales" element={<ControlMaterialesPage />} />
            <Route path="taller/tareas" element={<AsignacionTareasPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
