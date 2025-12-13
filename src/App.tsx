import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import DevKPIs from './components/Dashboard/DevKPIs';
import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";
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
import { LeadsPage } from './pages/leads/LeadsPage';
import { LeadsTablePage } from './pages/leads/LeadsTablePage';
import { LeadFormPage } from './pages/leads/LeadFormPage';
import { LeadDetailPage } from './pages/leads/LeadDetailPage';
import { ConvertLeadPage } from './pages/leads/ConvertLeadPage';
import NotasPedidoPage from './components/Ventas/NotasPedidoPage';
import PresupuestosPage from './components/Ventas/PresupuestosPage';
import OpcionesFinanciamientoPage from './components/Ventas/OpcionesFinanciamientoPage';
import ConfiguracionFinanciamiento from './components/Ventas/ConfiguracionFinanciamiento';
import RegistroVentasPage from './components/Ventas/RegistroVentasPage';
import FacturacionPage from './components/Ventas/FacturacionPage';
import InformesVentasPage from './components/Ventas/InformesVentasPage';
import NotasCreditoPage from './components/Ventas/NotasCreditoPage';
import UsersPage from './components/Admin/UsersPage';
import RolesPage from './components/Admin/RolesPage';
import SettingsPage from './components/Admin/SettingsPage';
import FlujoCajaPage from './components/Admin/FlujoCajaPage';
import { EmpresasPage } from './components/Admin/EmpresasPage';
import { SucursalesPage } from './components/Admin/SucursalesPage';
import { TenantSelector } from './components/Tenant';
import {
  SuppliersPage,
  ComprasPedidosPage,
  ContactosCondicionesPage,
  HistorialComprasPage,
  EvaluacionDesempenoPage
} from './components/Proveedores';
import CuentaCorrienteProveedoresPage from './components/Proveedores/CuentaCorrienteProveedoresPage';
import GarantiasPage from './components/Garantia/GarantiasPage';
import ReclamosGarantiaPage from './components/Garantia/ReclamosGarantiaPage';
import GarantiaReportPage from './components/Garantia/GarantiaReportPage';
import StockPage from './components/Logistica/StockPage';
import StockEquiposPage from './components/Logistica/StockEquiposPage';
import InventoryPage from './components/Logistica/InventoryPage';
import RecountTasksPage from './components/Logistica/RecountTasksPage';
import TripsPage from './components/Logistica/TripsPage';
import DeliveriesPage from './components/Logistica/DeliveriesPage';
import EntregasEquiposPage from './components/Logistica/EntregasEquiposPage';
import TrabajosRealizadosPage from './components/Taller/TrabajosRealizadosPage';
import OrdenesServicioPage from './components/Taller/OrdenesServicioPage';
import ControlMaterialesPage from './components/Taller/ControlMaterialesPage';
import AsignacionTareasPage from './components/Taller/AsignacionTareasPage';
import ConfiguracionTallerPage from './components/Taller/ConfiguracionTallerPage';
import { EmpleadosPage, PuestosPage, AsistenciasPage, LicenciasPage, CapacitacionesPage, SueldosPage, LegajosPage, UsuariosPage } from './components/RRHH';
import {
  RecetasList,
  RecetaDetail,
  RecetaForm,
  EquiposList,
  EquipoDetail,
  EquipoForm,
  DashboardFabricacion
} from './components/Fabricacion';
import ReportesEstadosPage from './components/Fabricacion/ReportesEstadosPage';


const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '24px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Esta página está en desarrollo</p>
  </div>
);

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }
  
  if (!user) {
    console.warn('⚠️ PrivateRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
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
              <Route path="admin/flujo-caja" element={<PrivateRoute><FlujoCajaPage /></PrivateRoute>} />
              {/* Multi-Tenant Admin */}
              <Route path="admin/empresas" element={<PrivateRoute><EmpresasPage /></PrivateRoute>} />
              <Route path="admin/sucursales" element={<PrivateRoute><SucursalesPage /></PrivateRoute>} />
              <Route path="admin/tenant-selector" element={<PrivateRoute><TenantSelector /></PrivateRoute>} />
              {/* VENTAS Module */}
              <Route path="ventas/notas-pedido" element={<PrivateRoute><NotasPedidoPage /></PrivateRoute>} />
              <Route path="ventas/presupuestos" element={<PrivateRoute><PresupuestosPage /></PrivateRoute>} />
              {/* Financing routes (aliases to match sidebar paths) */}
              <Route path="ventas/opciones-financiamiento" element={<PrivateRoute><OpcionesFinanciamientoPage /></PrivateRoute>} />
              <Route path="ventas/configuracion-financiamiento" element={<PrivateRoute><ConfiguracionFinanciamiento /></PrivateRoute>} />
              <Route path="ventas/registro" element={<PrivateRoute><RegistroVentasPage /></PrivateRoute>} />
              <Route path="ventas/facturacion" element={<PrivateRoute><FacturacionPage /></PrivateRoute>} />
              <Route path="ventas/notas-credito" element={<PrivateRoute><NotasCreditoPage /></PrivateRoute>} />
              <Route path="ventas/informes" element={<PrivateRoute><InformesVentasPage /></PrivateRoute>} />
             
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
              {/* LEADS Module */}
              <Route path="leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
              <Route path="leads/table" element={<PrivateRoute><LeadsTablePage /></PrivateRoute>} />
              <Route path="leads/nuevo" element={<PrivateRoute><LeadFormPage /></PrivateRoute>} />
              <Route path="leads/:id" element={<PrivateRoute><LeadDetailPage /></PrivateRoute>} />
              <Route path="leads/:id/editar" element={<PrivateRoute><LeadFormPage /></PrivateRoute>} />
              <Route path="leads/:id/convertir" element={<PrivateRoute><ConvertLeadPage /></PrivateRoute>} />
              {/* PROVEEDORES Module */}
              <Route path="proveedores/gestion" element={<PrivateRoute><SuppliersPage /></PrivateRoute>} />
              <Route path="proveedores/compras" element={<PrivateRoute><ComprasPedidosPage /></PrivateRoute>} />
              <Route path="proveedores/cuenta-corriente" element={<PrivateRoute><CuentaCorrienteProveedoresPage /></PrivateRoute>} />
              <Route path="proveedores/contactos" element={<PrivateRoute><ContactosCondicionesPage /></PrivateRoute>} />
              <Route path="proveedores/historial" element={<PrivateRoute><HistorialComprasPage /></PrivateRoute>} />
              <Route path="proveedores/evaluacion" element={<PrivateRoute><EvaluacionDesempenoPage /></PrivateRoute>} />
              {/* GARANTÍAS Module */}
              <Route path="garantias/registro" element={<PrivateRoute><GarantiasPage /></PrivateRoute>} />
              <Route path="garantias/reclamos" element={<PrivateRoute><ReclamosGarantiaPage /></PrivateRoute>} />
              <Route path="garantias/reporte" element={<PrivateRoute><GarantiaReportPage /></PrivateRoute>} />
              {/* RRHH Module */}
              <Route path="rrhh/empleados" element={<PrivateRoute><EmpleadosPage /></PrivateRoute>} />
              <Route path="rrhh/usuarios" element={<PrivateRoute><UsuariosPage /></PrivateRoute>} />
              <Route path="rrhh/puestos" element={<PrivateRoute><PuestosPage /></PrivateRoute>} />
              <Route path="rrhh/asistencia" element={<PrivateRoute><AsistenciasPage /></PrivateRoute>} />
              <Route path="rrhh/licencias" element={<PrivateRoute><LicenciasPage /></PrivateRoute>} />
              <Route path="rrhh/capacitaciones" element={<PrivateRoute><CapacitacionesPage /></PrivateRoute>} />
              <Route path="rrhh/sueldos" element={<PrivateRoute><SueldosPage /></PrivateRoute>} />
              <Route path="rrhh/legajos" element={<PrivateRoute><LegajosPage /></PrivateRoute>} />
              {/* LOGÍSTICA Module */}
              <Route path="logistica/stock" element={<PrivateRoute><StockPage /></PrivateRoute>} />
              <Route path="logistica/stock-equipos" element={<PrivateRoute><StockEquiposPage /></PrivateRoute>} />
              <Route path="logistica/viajes" element={<PrivateRoute><TripsPage /></PrivateRoute>} />
              <Route path="logistica/inventario" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
              <Route path="logistica/recuentos" element={<PrivateRoute><RecountTasksPage /></PrivateRoute>} />
              <Route path="logistica/entregas" element={<PrivateRoute><DeliveriesPage /></PrivateRoute>} />
              <Route path="logistica/entregas-equipos" element={<PrivateRoute><EntregasEquiposPage /></PrivateRoute>} />
              {/* TALLER Module */}
              <Route path="taller/trabajos" element={<PrivateRoute><TrabajosRealizadosPage /></PrivateRoute>} />
              <Route path="taller/ordenes" element={<PrivateRoute><OrdenesServicioPage /></PrivateRoute>} />
              <Route path="taller/materiales" element={<PrivateRoute><ControlMaterialesPage /></PrivateRoute>} />
              <Route path="taller/tareas" element={<PrivateRoute><AsignacionTareasPage /></PrivateRoute>} />
              <Route path="taller/configuracion" element={<PrivateRoute><ConfiguracionTallerPage /></PrivateRoute>} />
              {/* FABRICACIÓN Module */}
              <Route path="fabricacion/dashboard" element={<PrivateRoute><DashboardFabricacion /></PrivateRoute>} />
              <Route path="fabricacion/recetas" element={<PrivateRoute><RecetasList /></PrivateRoute>} />
              <Route path="fabricacion/recetas/:id" element={<PrivateRoute><RecetaDetail /></PrivateRoute>} />
              <Route path="fabricacion/recetas/nueva" element={<PrivateRoute><RecetaForm /></PrivateRoute>} />
              <Route path="fabricacion/recetas/editar/:id" element={<PrivateRoute><RecetaForm /></PrivateRoute>} />
              <Route path="fabricacion/equipos" element={<PrivateRoute><EquiposList /></PrivateRoute>} />
              <Route path="fabricacion/equipos/:id" element={<PrivateRoute><EquipoDetail /></PrivateRoute>} />
              <Route path="fabricacion/equipos/nuevo" element={<PrivateRoute><EquipoForm /></PrivateRoute>} />
              <Route path="fabricacion/equipos/editar/:id" element={<PrivateRoute><EquipoForm /></PrivateRoute>} />
              <Route path="fabricacion/reportes-estados" element={<PrivateRoute><ReportesEstadosPage /></PrivateRoute>} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;