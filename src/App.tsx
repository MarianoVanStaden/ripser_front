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
import { LeadMetricasPage } from './pages/leads/LeadMetricasPage';
import { GestionGlobalRecordatoriosPage } from './pages/leads/GestionGlobalRecordatoriosPage';
import { VentasDashboard } from './pages/ventas/VentasDashboard';
import NotasPedidoPage from './components/Ventas/NotasPedidoPage';
import PresupuestosPage from './components/Ventas/PresupuestosPage';
import OpcionesFinanciamientoPage from './components/Ventas/OpcionesFinanciamientoPage';
import ConfiguracionFinanciamiento from './components/Ventas/ConfiguracionFinanciamiento';
import RegistroVentasPage from './components/Ventas/RegistroVentasPage';
import FacturacionPage from './components/Ventas/FacturacionPage';
import InformesVentasPage from './components/Ventas/InformesVentasPage';
import NotasCreditoPage from './components/Ventas/NotasCreditoPage';
import { ChequesPage } from './components/Cheques';
import { BancosPage } from './components/Bancos';
import { CuentasBancariasPage } from './components/CuentasBancarias';
import UsersPage from './components/Admin/UsersPage';
import RolesPage from './components/Admin/RolesPage';
import SettingsPage from './components/Admin/SettingsPage';
import FlujoCajaPage from './components/Admin/FlujoCaja/FlujoCajaPage';
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
import IncidenciasVehiculoPage from './components/Logistica/IncidenciasVehiculoPage';
import TrabajosRealizadosPage from './components/Taller/TrabajosRealizadosPage';
import OrdenesServicioPage from './components/Taller/OrdenesServicioPage';
import ControlMaterialesPage from './components/Taller/ControlMaterialesPage';
import AsignacionTareasPage from './components/Taller/AsignacionTareasPage';
import ConfiguracionTallerPage from './components/Taller/ConfiguracionTallerPage';
import { EmpleadosPage, PuestosPage, PuestoDetailPage, AsistenciasPage, LicenciasPage, CapacitacionesPage, SueldosPage, LegajosPage, UsuariosPage } from './components/RRHH';
import {
  RecetasList,
  RecetaDetail,
  RecetaForm,
  EquiposList,
  EquipoDetail,
  EquipoForm,
  DashboardFabricacion,
  StockPlanificacionPage,
} from './components/Fabricacion';
import ReportesEstadosPage from './components/Fabricacion/ReportesEstadosPage';
import {
  DepositosPage,
  InventarioDepositoPage,
  UbicacionEquiposPage,
  AuditoriaPage,
  TransferenciasPage,
  ReconciliacionStockPage
} from './components/Logistica/Depositos';
import {
  PrestamosResumenPage,
  PrestamosListPage,
  PrestamoDetailPage,
} from './components/Prestamos';
import {
  CobranzasResumenPage,
  CobranzasListPage,
  GestionCobranzaDetailPage,
} from './components/Prestamos/Cobranzas';
import { BalanceAnualPage, BalanceMesPage } from './components/Admin/BalanceAnual';
import { AmortizacionesPage, AmortizacionMesPage } from './components/Admin/Amortizaciones';
import PosicionPatrimonialPage from './components/Admin/PosicionPatrimonial';


const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
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

const SuperAdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, esSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Cargando...</Typography>
      </Box>
    );
  }

  if (!user) {
    console.warn('⚠️ SuperAdminRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!esSuperAdmin) {
    console.warn('⚠️ SuperAdminRoute: User is not super admin, redirecting to dashboard');
    return <Navigate to="/" replace />;
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
              <Route path="admin/bancos" element={<PrivateRoute><BancosPage /></PrivateRoute>} />
              <Route path="admin/cuentas-bancarias" element={<PrivateRoute><CuentasBancariasPage /></PrivateRoute>} />
              {/* Multi-Tenant Admin */}
              <Route path="admin/empresas" element={<PrivateRoute><EmpresasPage /></PrivateRoute>} />
              <Route path="admin/sucursales" element={<PrivateRoute><SucursalesPage /></PrivateRoute>} />
              {/* Selector de contexto - Solo SUPER_ADMIN */}
              <Route path="admin/tenant-selector" element={<SuperAdminRoute><TenantSelector /></SuperAdminRoute>} />
              {/* Balance Anual + Amortizaciones */}
              <Route path="admin/balance" element={<PrivateRoute><BalanceAnualPage /></PrivateRoute>} />
              <Route path="admin/balance/:anio/:mes" element={<PrivateRoute><BalanceMesPage /></PrivateRoute>} />
              <Route path="admin/amortizaciones" element={<PrivateRoute><AmortizacionesPage /></PrivateRoute>} />
              <Route path="admin/amortizaciones/:anio/:mes" element={<PrivateRoute><AmortizacionMesPage /></PrivateRoute>} />
              <Route path="admin/patrimonio" element={<PrivateRoute><PosicionPatrimonialPage /></PrivateRoute>} />
              {/* VENTAS Module */}
              <Route path="ventas/dashboard" element={<PrivateRoute><VentasDashboard /></PrivateRoute>} />
              <Route path="ventas/notas-pedido" element={<PrivateRoute><NotasPedidoPage /></PrivateRoute>} />
              <Route path="ventas/presupuestos" element={<PrivateRoute><PresupuestosPage /></PrivateRoute>} />
              {/* Financing routes (aliases to match sidebar paths) */}
              <Route path="ventas/opciones-financiamiento" element={<PrivateRoute><OpcionesFinanciamientoPage /></PrivateRoute>} />
              <Route path="ventas/configuracion-financiamiento" element={<PrivateRoute><ConfiguracionFinanciamiento /></PrivateRoute>} />
              <Route path="ventas/registro" element={<PrivateRoute><RegistroVentasPage /></PrivateRoute>} />
              <Route path="ventas/facturacion" element={<PrivateRoute><FacturacionPage /></PrivateRoute>} />
              <Route path="ventas/notas-credito" element={<PrivateRoute><NotasCreditoPage /></PrivateRoute>} />
              <Route path="ventas/informes" element={<PrivateRoute><InformesVentasPage /></PrivateRoute>} />
              <Route path="ventas/cheques" element={<PrivateRoute><ChequesPage /></PrivateRoute>} />

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
              {/* PRESTAMOS Module */}
              <Route path="prestamos/resumen" element={<PrivateRoute><PrestamosResumenPage /></PrivateRoute>} />
              <Route path="prestamos/lista" element={<PrivateRoute><PrestamosListPage /></PrivateRoute>} />
              <Route path="prestamos/:id" element={<PrivateRoute><PrestamoDetailPage /></PrivateRoute>} />
              {/* COBRANZAS Module */}
              <Route path="cobranzas/resumen" element={<PrivateRoute><CobranzasResumenPage /></PrivateRoute>} />
              <Route path="cobranzas/lista" element={<PrivateRoute><CobranzasListPage /></PrivateRoute>} />
              <Route path="cobranzas/:id" element={<PrivateRoute><GestionCobranzaDetailPage /></PrivateRoute>} />
              {/* LEADS Module */}
              <Route path="leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
              <Route path="leads/table" element={<PrivateRoute><LeadsTablePage /></PrivateRoute>} />
              <Route path="leads/metricas" element={<PrivateRoute><LeadMetricasPage /></PrivateRoute>} />
              <Route path="leads/recordatorios" element={<PrivateRoute><GestionGlobalRecordatoriosPage /></PrivateRoute>} />
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
              <Route path="rrhh/puestos/:id" element={<PrivateRoute><PuestoDetailPage /></PrivateRoute>} />
              <Route path="rrhh/asistencia" element={<PrivateRoute><AsistenciasPage /></PrivateRoute>} />
              <Route path="rrhh/licencias" element={<PrivateRoute><LicenciasPage /></PrivateRoute>} />
              <Route path="rrhh/capacitaciones" element={<PrivateRoute><CapacitacionesPage /></PrivateRoute>} />
              <Route path="rrhh/sueldos" element={<PrivateRoute><SueldosPage /></PrivateRoute>} />
              <Route path="rrhh/legajos" element={<PrivateRoute><LegajosPage /></PrivateRoute>} />
              {/* LOGÍSTICA Module - Reorganizado en submódulos */}

              {/* INVENTARIO - Gestión de stock, productos y conteo */}
              <Route path="logistica/stock" element={<PrivateRoute><StockPage /></PrivateRoute>} />
              <Route path="logistica/inventario/depositos" element={<PrivateRoute><InventarioDepositoPage /></PrivateRoute>} />
              <Route path="logistica/inventario/stock-equipos" element={<PrivateRoute><StockEquiposPage /></PrivateRoute>} />
              <Route path="logistica/inventario/ubicaciones" element={<PrivateRoute><UbicacionEquiposPage /></PrivateRoute>} />
              <Route path="logistica/inventario/recuentos" element={<PrivateRoute><RecountTasksPage /></PrivateRoute>} />
              <Route path="logistica/inventario/reconciliacion" element={<PrivateRoute><ReconciliacionStockPage /></PrivateRoute>} />
              <Route path="logistica/inventario/stock-productos" element={<PrivateRoute><StockPage /></PrivateRoute>} />
              
              {/* DISTRIBUCIÓN - Logística de salida y última milla */}
              <Route path="logistica/distribucion/viajes" element={<PrivateRoute><TripsPage /></PrivateRoute>} />
              <Route path="logistica/distribucion/entregas-productos" element={<PrivateRoute><DeliveriesPage /></PrivateRoute>} />
              <Route path="logistica/distribucion/entregas-equipos" element={<PrivateRoute><EntregasEquiposPage /></PrivateRoute>} />
              <Route path="logistica/vehiculos/incidencias" element={<PrivateRoute><IncidenciasVehiculoPage /></PrivateRoute>} />

              {/* MOVIMIENTOS - Trazabilidad y transferencias internas */}
              <Route path="logistica/movimientos/transferencias" element={<PrivateRoute><TransferenciasPage /></PrivateRoute>} />
              <Route path="logistica/movimientos/auditoria" element={<PrivateRoute><AuditoriaPage /></PrivateRoute>} />

              {/* CONFIGURACIÓN - Administración de infraestructura */}
              <Route path="logistica/configuracion/depositos" element={<PrivateRoute><DepositosPage /></PrivateRoute>} />

              {/* REDIRECTS LEGACY - Mantener URLs antiguas funcionando */}
              <Route path="logistica/stock" element={<Navigate to="/logistica/inventario/stock-productos" replace />} />
              <Route path="logistica/stock-equipos" element={<Navigate to="/logistica/inventario/stock-equipos" replace />} />
              <Route path="logistica/inventario" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
              <Route path="logistica/recuentos" element={<Navigate to="/logistica/inventario/recuentos" replace />} />
              <Route path="logistica/viajes" element={<Navigate to="/logistica/distribucion/viajes" replace />} />
              <Route path="logistica/entregas" element={<Navigate to="/logistica/distribucion/entregas-productos" replace />} />
              <Route path="logistica/entregas-equipos" element={<Navigate to="/logistica/distribucion/entregas-equipos" replace />} />
              <Route path="logistica/depositos" element={<Navigate to="/logistica/configuracion/depositos" replace />} />
              <Route path="logistica/inventario-deposito" element={<Navigate to="/logistica/inventario/depositos" replace />} />
              <Route path="logistica/ubicacion-equipos" element={<Navigate to="/logistica/inventario/ubicaciones" replace />} />
              <Route path="logistica/auditoria" element={<Navigate to="/logistica/movimientos/auditoria" replace />} />
              <Route path="logistica/transferencias" element={<Navigate to="/logistica/movimientos/transferencias" replace />} />
              <Route path="logistica/reconciliacion" element={<Navigate to="/logistica/inventario/reconciliacion" replace />} />
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
              <Route path="fabricacion/stock-planificacion" element={<PrivateRoute><StockPlanificacionPage /></PrivateRoute>} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;