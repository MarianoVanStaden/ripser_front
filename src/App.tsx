import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import DevKPIs from './components/Dashboard/DevKPIs';
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./components/Auth/LoginPage";
import { useAuth } from "./context/AuthContext";
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
import NotasPedidoPage from './components/Ventas/NotasPedidoPage';
import PresupuestosPage from './components/Ventas/PresupuestosPage';
import PresupuestosFinanciamientoPage from './components/Ventas/PresupuestosFinanciamientoPage';
import OpcionesFinanciamientoPage from './components/Ventas/OpcionesFinanciamientoPage';
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
import { EmpleadosPage, PuestosPage, AsistenciasPage, LicenciasPage, CapacitacionesPage, SueldosPage, LegajosPage } from './components/RRHH';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '24px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Esta página está en desarrollo</p>
  </div>
);

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>; // Replace with a proper loading component if needed
  }
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              {/* Explicit dashboard path so navigating to /dashboard works */}
              <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              {/* Dev KPIs */}
              <Route path="dashboard/dev-kpis" element={<PrivateRoute><DevKPIs /></PrivateRoute>} />
              {/* ADMIN Module */}
              <Route path="admin/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
              <Route path="admin/roles" element={<PrivateRoute><RolesPage /></PrivateRoute>} />
              <Route path="admin/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
              {/* VENTAS Module */}
              <Route path="ventas/notasPedido" element={<PrivateRoute><NotasPedidoPage /></PrivateRoute>} />
              <Route path="ventas/presupuestos" element={<PrivateRoute><PresupuestosPage /></PrivateRoute>} />
              {/* Financing routes (aliases to match sidebar paths) */}
              <Route path="ventas/presupuestos-financiamiento" element={<PrivateRoute><PresupuestosFinanciamientoPage /></PrivateRoute>} />
              <Route path="ventas/presupuestos-financiamiento/:id" element={<PrivateRoute><PresupuestosFinanciamientoPage /></PrivateRoute>} />
              <Route path="ventas/opciones-financiamiento" element={<PrivateRoute><OpcionesFinanciamientoPage /></PrivateRoute>} />
              <Route path="ventas/registro" element={<PrivateRoute><RegistroVentasPage /></PrivateRoute>} />
              <Route path="ventas/facturacion" element={<PrivateRoute><FacturacionPage /></PrivateRoute>} />
              <Route path="ventas/informes" element={<PrivateRoute><InformesVentasPage /></PrivateRoute>} />
              <Route path="ventas/presupuestoFinanciamiento/:id" element={<PrivateRoute><PresupuestosFinanciamientoPage /></PrivateRoute>} />
              <Route path="ventas/presupuestoFinanciamiento" element={<PrivateRoute><PresupuestosFinanciamientoPage /></PrivateRoute>} />
              {/* CLIENTES Module */}
              <Route path="clientes/gestion" element={<PrivateRoute><ClientesPage /></PrivateRoute>} />
              <Route path="clientes/nuevo" element={<PrivateRoute><ClienteFormPage /></PrivateRoute>} />
              <Route path="clientes/editar/:id" element={<PrivateRoute><ClienteFormPage /></PrivateRoute>} />
              <Route path="clientes/detalle/:id" element={<PrivateRoute><ClienteDetailPage /></PrivateRoute>} />
              <Route path="clientes/carpeta" element={<PrivateRoute><CarpetaClienteSelector /></PrivateRoute>} />
              <Route path="clientes/carpeta/:id" element={<PrivateRoute><CarpetaClientePage /></PrivateRoute>} />
              <Route path="clientes/agenda" element={<PrivateRoute><AgendaVisitasPage /></PrivateRoute>} />
              <Route path="clientes/cuenta-corriente" element={<PrivateRoute><CuentaCorrientePage /></PrivateRoute>} />
              <Route path="clientes/credito" element={<PrivateRoute><CreditoPersonalPage /></PrivateRoute>} />
              {/* PROVEEDORES Module */}
              <Route path="proveedores/gestion" element={<PrivateRoute><SuppliersPage /></PrivateRoute>} />
              <Route path="proveedores/compras" element={<PrivateRoute><ComprasPedidosPage /></PrivateRoute>} />
              <Route path="proveedores/contactos" element={<PrivateRoute><ContactosCondicionesPage /></PrivateRoute>} />
              <Route path="proveedores/historial" element={<PrivateRoute><HistorialComprasPage /></PrivateRoute>} />
              <Route path="proveedores/evaluacion" element={<PrivateRoute><EvaluacionDesempenoPage /></PrivateRoute>} />
              {/* GARANTÍAS Module */}
              <Route path="garantias/registro" element={<PrivateRoute><GarantiasPage /></PrivateRoute>} />
              <Route path="garantias/reclamos" element={<PrivateRoute><ReclamosGarantiaPage /></PrivateRoute>} />
              <Route path="garantias/estado" element={<PrivateRoute><GarantiasPage /></PrivateRoute>} />
              {/* RRHH Module */}
              <Route path="rrhh/empleados" element={<PrivateRoute><EmpleadosPage /></PrivateRoute>} />
              <Route path="rrhh/puestos" element={<PrivateRoute><PuestosPage /></PrivateRoute>} />
              <Route path="rrhh/asistencia" element={<PrivateRoute><AsistenciasPage /></PrivateRoute>} />
              <Route path="rrhh/licencias" element={<PrivateRoute><LicenciasPage /></PrivateRoute>} />
              <Route path="rrhh/capacitaciones" element={<PrivateRoute><CapacitacionesPage /></PrivateRoute>} />
              <Route path="rrhh/sueldos" element={<PrivateRoute><SueldosPage /></PrivateRoute>} />
              <Route path="rrhh/legajos" element={<PrivateRoute><LegajosPage /></PrivateRoute>} />
              {/* LOGÍSTICA Module */}
              <Route path="logistica/stock" element={<PrivateRoute><StockPage /></PrivateRoute>} />
              <Route path="logistica/viajes" element={<PrivateRoute><TripsPage /></PrivateRoute>} />
              <Route path="logistica/inventario" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
              <Route path="logistica/entregas" element={<PrivateRoute><DeliveriesPage /></PrivateRoute>} />
              {/* TALLER Module */}
              <Route path="taller/trabajos" element={<PrivateRoute><TrabajosRealizadosPage /></PrivateRoute>} />
              <Route path="taller/ordenes" element={<PrivateRoute><OrdenesServicioPage /></PrivateRoute>} />
              <Route path="taller/materiales" element={<PrivateRoute><ControlMaterialesPage /></PrivateRoute>} />
              <Route path="taller/tareas" element={<PrivateRoute><AsignacionTareasPage /></PrivateRoute>} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;