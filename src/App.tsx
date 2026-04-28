import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography, CircularProgress } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import LoginPage from './components/Auth/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ColoresProvider } from './context/ColoresContext';
import { MedidasProvider } from './context/MedidasContext';

// ---------------------------------------------------------------------------
// Lazy route helpers
// ---------------------------------------------------------------------------
// React.lazy needs a module with a `default` export. Many pages in this repo
// are named exports re-exported through barrel files. `lazyNamed` pulls the
// right export and adapts it to lazy()'s shape without eagerly evaluating the
// module.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyNamed = <T extends ComponentType<any>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loader: () => Promise<Record<string, any>>,
  name: string,
) => lazy(async () => {
  const mod = await loader();
  return { default: mod[name] as T };
});

// ---------------------------------------------------------------------------
// Pages (code-split per route)
// ---------------------------------------------------------------------------
// Dashboard / dev
const DevKPIs = lazy(() => import('./components/Dashboard/DevKPIs'));

// Admin
const UsersPage = lazy(() => import('./components/Admin/UsersPage'));
const RolesPage = lazy(() => import('./components/Admin/RolesPage'));
const ColoresPage = lazy(() => import('./components/Admin/ColoresPage'));
const MedidasPage = lazy(() => import('./components/Admin/MedidasPage'));
const SettingsPage = lazy(() => import('./components/Admin/SettingsPage'));
const FlujoCajaPage = lazy(() => import('./components/Admin/FlujoCaja/FlujoCajaPage'));
const EmpresasPage = lazyNamed(() => import('./components/Admin/EmpresasPage'), 'EmpresasPage');
const SucursalesPage = lazyNamed(() => import('./components/Admin/SucursalesPage'), 'SucursalesPage');
const BalanceAnualPage = lazy(() => import('./components/Admin/BalanceAnual/BalanceAnualPage'));
const BalanceMesPage = lazy(() => import('./components/Admin/BalanceAnual/BalanceMesPage'));
const AmortizacionesPage = lazy(() => import('./components/Admin/Amortizaciones/AmortizacionesPage'));
const AmortizacionMesPage = lazy(() => import('./components/Admin/Amortizaciones/AmortizacionMesPage'));
const ProvisionesPage = lazy(() => import('./components/Admin/Provisiones/ProvisionesPage'));
const ProvisionResumenAnualPage = lazy(() => import('./components/Admin/Provisiones/ProvisionResumenAnualPage'));
const PosicionPatrimonialPage = lazy(() => import('./components/Admin/PosicionPatrimonial/PosicionPatrimonialPage'));
const CajasAhorroListPage = lazy(() => import('./components/Admin/CajasAhorro/CajasAhorroListPage'));
const CajaMovimientosPage = lazy(() => import('./components/Admin/CajasAhorro/CajaMovimientosPage'));
const CajasPesosListPage = lazy(() => import('./components/Admin/CajasPesos/CajasPesosListPage'));
const CajaPesosMovimientosPage = lazy(() => import('./components/Admin/CajasPesos/CajaPesosMovimientosPage'));
const LiquidacionesTarjetaListPage = lazy(() => import('./components/Admin/LiquidacionesTarjeta/LiquidacionesTarjetaListPage'));

// Bancos / cheques
const BancosPage = lazy(() => import('./components/Bancos/BancosPage'));
const CuentasBancariasPage = lazy(() => import('./components/CuentasBancarias/CuentasBancariasPage'));
const ChequesPage = lazy(() => import('./components/Cheques/ChequesPage'));

// Tenant
const TenantSelector = lazyNamed(() => import('./components/Tenant/TenantSelector'), 'TenantSelector');

// Clientes
const ClientesPage = lazy(() => import('./components/Clientes/ClientesPage'));
const ClienteFormPage = lazy(() => import('./components/Clientes/ClienteFormPage'));
const ClienteDetailPage = lazy(() => import('./components/Clientes/ClienteDetailPage'));
const AgendaVisitasPage = lazy(() => import('./components/Clientes/AgendaVisitasPage'));
const CarpetaClientePage = lazy(() => import('./components/Clientes/CarpetaClientePage'));
const CarpetaClienteSelector = lazy(() => import('./components/Clientes/CarpetaClienteSelector'));
const CuentaCorrientePage = lazy(() => import('./components/Clientes/CuentaCorrientePage'));

// Leads
const LeadsTablePage = lazyNamed(() => import('./pages/leads/LeadsTablePage'), 'LeadsTablePage');
const LeadFormPage = lazyNamed(() => import('./pages/leads/LeadFormPage'), 'LeadFormPage');
const LeadDetailPage = lazyNamed(() => import('./pages/leads/LeadDetailPage'), 'LeadDetailPage');
const ConvertLeadPage = lazyNamed(() => import('./pages/leads/ConvertLeadPage'), 'ConvertLeadPage');
const LeadMetricasPage = lazy(() => import('./pages/leads/LeadMetricasPage'));
const GestionGlobalRecordatoriosPage = lazy(() => import('./pages/leads/GestionGlobalRecordatoriosPage'));

// Ventas
const VentasDashboard = lazyNamed(() => import('./pages/ventas/VentasDashboard'), 'VentasDashboard');
const NotasPedidoPage = lazy(() => import('./components/Ventas/NotasPedidoPage'));
const PresupuestosPage = lazy(() => import('./components/Ventas/PresupuestosPage'));
const OpcionesFinanciamientoPage = lazy(() => import('./components/Ventas/OpcionesFinanciamientoPage'));
const ConfiguracionFinanciamiento = lazy(() => import('./components/Ventas/ConfiguracionFinanciamiento'));
const RegistroVentasPage = lazy(() => import('./components/Ventas/RegistroVentasPage'));
const FacturacionPage = lazy(() => import('./components/Ventas/FacturacionPage'));
const InformesVentasPage = lazy(() => import('./components/Ventas/InformesVentasPage'));
const NotasCreditoPage = lazy(() => import('./components/Ventas/NotasCreditoPage'));

// Préstamos / cobranzas
const PrestamosResumenPage = lazyNamed(() => import('./components/Prestamos/PrestamosResumenPage'), 'PrestamosResumenPage');
const PrestamosListPage = lazyNamed(() => import('./components/Prestamos/PrestamosListPage'), 'PrestamosListPage');
const PrestamoDetailPage = lazyNamed(() => import('./components/Prestamos/PrestamoDetailPage'), 'PrestamoDetailPage');
const RefinanciacionPage = lazyNamed(() => import('./components/Prestamos/RefinanciacionPage'), 'RefinanciacionPage');
const CobranzasResumenPage = lazyNamed(() => import('./components/Prestamos/Cobranzas/CobranzasResumenPage'), 'CobranzasResumenPage');
const CobranzasListPage = lazyNamed(() => import('./components/Prestamos/Cobranzas/CobranzasListPage'), 'CobranzasListPage');
const GestionCobranzaDetailPage = lazyNamed(() => import('./components/Prestamos/Cobranzas/GestionCobranzaDetailPage'), 'GestionCobranzaDetailPage');

// Proveedores
const SuppliersPage = lazy(() => import('./components/Proveedores/SuppliersPage'));
const ComprasPedidosPage = lazy(() => import('./components/Proveedores/ComprasPedidosPage'));
const ContactosCondicionesPage = lazy(() => import('./components/Proveedores/ContactosCondicionesPage'));
const HistorialComprasPage = lazy(() => import('./components/Proveedores/HistorialComprasPage'));
const EvaluacionDesempenoPage = lazy(() => import('./components/Proveedores/EvaluacionDesempenoPage'));
const CuentaCorrienteProveedoresPage = lazy(() => import('./components/Proveedores/CuentaCorrienteProveedoresPage'));
const BuscarProveedorPorProductoPage = lazy(() => import('./components/Proveedores/BuscarProveedorPorProductoPage'));

// Garantías
const GarantiasPage = lazy(() => import('./components/Garantia/GarantiasPage'));
const ReclamosGarantiaPage = lazy(() => import('./components/Garantia/ReclamosGarantiaPage'));
const GarantiaReportPage = lazy(() => import('./components/Garantia/GarantiaReportPage'));

// Logística
const StockPage = lazy(() => import('./components/Logistica/StockPage'));
const StockEquiposPage = lazy(() => import('./components/Logistica/StockEquiposPage'));
const InventoryPage = lazy(() => import('./components/Logistica/InventoryPage'));
const RecountTasksPage = lazy(() => import('./components/Logistica/RecountTasksPage'));
const TripsPage = lazy(() => import('./components/Logistica/TripsPage'));
const DeliveriesPage = lazy(() => import('./components/Logistica/DeliveriesPage'));
const EntregasEquiposPage = lazy(() => import('./components/Logistica/EntregasEquiposPage'));
const IncidenciasVehiculoPage = lazy(() => import('./components/Logistica/IncidenciasVehiculoPage'));
const DepositosPage = lazy(() => import('./components/Logistica/Depositos/DepositosPage'));
const InventarioDepositoPage = lazy(() => import('./components/Logistica/Depositos/InventarioDepositoPage'));
const UbicacionEquiposPage = lazy(() => import('./components/Logistica/Depositos/UbicacionEquiposPage'));
const AuditoriaPage = lazy(() => import('./components/Logistica/Depositos/AuditoriaPage'));
const TransferenciasPage = lazy(() => import('./components/Logistica/Depositos/TransferenciasPage'));
const ReconciliacionStockPage = lazy(() => import('./components/Logistica/Depositos/ReconciliacionStockPage'));

// Taller
const TrabajosRealizadosPage = lazy(() => import('./components/Taller/TrabajosRealizadosPage'));
const OrdenesServicioPage = lazy(() => import('./components/Taller/OrdenesServicioPage'));
const ControlMaterialesPage = lazy(() => import('./components/Taller/ControlMaterialesPage'));
const AsignacionTareasPage = lazy(() => import('./components/Taller/AsignacionTareasPage'));
const ConfiguracionTallerPage = lazy(() => import('./components/Taller/ConfiguracionTallerPage'));

// RRHH
const EmpleadosPage = lazy(() => import('./components/RRHH/EmpleadosPage'));
const PuestosPage = lazy(() => import('./components/RRHH/PuestosPage'));
const PuestoDetailPage = lazy(() => import('./components/RRHH/PuestoDetailPage'));
const AsistenciasPage = lazy(() => import('./components/RRHH/AsistenciasPage'));
const LicenciasPage = lazy(() => import('./components/RRHH/LicenciasPage'));
const CapacitacionesPage = lazy(() => import('./components/RRHH/CapacitacionesPage'));
const SueldosPage = lazy(() => import('./components/RRHH/SueldosPage'));
const LegajosPage = lazy(() => import('./components/RRHH/LegajosPage'));

// Fabricación
const RecetasList = lazy(() => import('./components/Fabricacion/RecetasList'));
const RecetaDetail = lazy(() => import('./components/Fabricacion/RecetaDetail'));
const RecetaForm = lazy(() => import('./components/Fabricacion/RecetaForm'));
const EquiposList = lazy(() => import('./components/Fabricacion/EquiposList'));
const EquipoDetail = lazy(() => import('./components/Fabricacion/EquipoDetail'));
const EquipoForm = lazy(() => import('./components/Fabricacion/EquipoForm'));
const DashboardFabricacion = lazy(() => import('./components/Fabricacion/DashboardFabricacion'));
const ReportesEstadosPage = lazy(() => import('./components/Fabricacion/ReportesEstadosPage'));
const StockPlanificacionPage = lazyNamed(() => import('./components/Fabricacion/StockPlanificacion'), 'StockPlanificacionPage');

// ---------------------------------------------------------------------------
// Guards and Suspense fallback
// ---------------------------------------------------------------------------
const CenteredFallback: React.FC<{ label?: string }> = ({ label = 'Cargando...' }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
    <CircularProgress size={32} />
    <Typography color="text.secondary">{label}</Typography>
  </Box>
);

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <CenteredFallback />;
  if (!user) {
    console.warn('⚠️ PrivateRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, esSuperAdmin, loading } = useAuth();
  if (loading) return <CenteredFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!esSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Small helper so each route doesn't repeat `<PrivateRoute>...</PrivateRoute>`.
const priv = (el: React.ReactElement) => <PrivateRoute>{el}</PrivateRoute>;

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <ColoresProvider onlyActive>
        <MedidasProvider onlyActive>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Suspense fallback={<CenteredFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={priv(<Layout />)}>
                  <Route index element={priv(<Dashboard />)} />
                  <Route path="dashboard" element={priv(<Dashboard />)} />
                  <Route path="dashboard/dev-kpis" element={priv(<DevKPIs />)} />

                  {/* ADMIN */}
                  <Route path="admin/users" element={priv(<UsersPage />)} />
                  <Route path="admin/roles" element={priv(<RolesPage />)} />
                  <Route path="admin/colores" element={priv(<ColoresPage />)} />
                  <Route path="admin/medidas" element={priv(<MedidasPage />)} />
                  <Route path="admin/settings" element={priv(<SettingsPage />)} />
                  <Route path="admin/flujo-caja" element={priv(<FlujoCajaPage />)} />
                  <Route path="admin/bancos" element={priv(<BancosPage />)} />
                  <Route path="admin/cuentas-bancarias" element={priv(<CuentasBancariasPage />)} />
                  <Route path="admin/empresas" element={priv(<EmpresasPage />)} />
                  <Route path="admin/sucursales" element={priv(<SucursalesPage />)} />
                  <Route path="admin/tenant-selector" element={<SuperAdminRoute><TenantSelector /></SuperAdminRoute>} />
                  <Route path="admin/balance" element={priv(<BalanceAnualPage />)} />
                  <Route path="admin/balance/:anio/:mes" element={priv(<BalanceMesPage />)} />
                  <Route path="admin/amortizaciones" element={priv(<AmortizacionesPage />)} />
                  <Route path="admin/amortizaciones/:anio/:mes" element={priv(<AmortizacionMesPage />)} />
                  <Route path="admin/provisiones" element={priv(<ProvisionesPage />)} />
                  <Route path="admin/provisiones/:anio/:mes" element={priv(<ProvisionesPage />)} />
                  <Route path="admin/provisiones/resumen/:tipo/:anio" element={priv(<ProvisionResumenAnualPage />)} />
                  <Route path="admin/patrimonio" element={priv(<PosicionPatrimonialPage />)} />
                  <Route path="admin/cajas-ahorro" element={priv(<CajasAhorroListPage />)} />
                  <Route path="admin/cajas-ahorro/:id" element={priv(<CajaMovimientosPage />)} />
                  <Route path="admin/cajas-pesos" element={priv(<CajasPesosListPage />)} />
                  <Route path="admin/cajas-pesos/:id" element={priv(<CajaPesosMovimientosPage />)} />
                  <Route path="admin/liquidaciones-tarjeta" element={priv(<LiquidacionesTarjetaListPage />)} />

                  {/* VENTAS */}
                  <Route path="ventas/dashboard" element={priv(<VentasDashboard />)} />
                  <Route path="ventas/notas-pedido" element={priv(<NotasPedidoPage />)} />
                  <Route path="ventas/presupuestos" element={priv(<PresupuestosPage />)} />
                  <Route path="ventas/opciones-financiamiento" element={priv(<OpcionesFinanciamientoPage />)} />
                  <Route path="ventas/configuracion-financiamiento" element={priv(<ConfiguracionFinanciamiento />)} />
                  <Route path="ventas/registro" element={priv(<RegistroVentasPage />)} />
                  <Route path="ventas/facturacion" element={priv(<FacturacionPage />)} />
                  <Route path="ventas/notas-credito" element={priv(<NotasCreditoPage />)} />
                  <Route path="ventas/informes" element={priv(<InformesVentasPage />)} />
                  <Route path="ventas/cheques" element={priv(<ChequesPage />)} />

                  {/* CLIENTES */}
                  <Route path="clientes/gestion" element={priv(<ClientesPage />)} />
                  <Route path="clientes/nuevo" element={priv(<ClienteFormPage />)} />
                  <Route path="clientes/editar/:id" element={priv(<ClienteFormPage />)} />
                  <Route path="clientes/detalle/:id" element={priv(<ClienteDetailPage />)} />
                  <Route path="clientes/carpeta" element={priv(<CarpetaClienteSelector />)} />
                  <Route path="clientes/carpeta/:id" element={priv(<CarpetaClientePage />)} />
                  <Route path="clientes/agenda" element={priv(<AgendaVisitasPage />)} />
                  <Route path="clientes/cuenta-corriente" element={priv(<CuentaCorrientePage />)} />

                  {/* PRÉSTAMOS */}
                  <Route path="prestamos/resumen" element={priv(<PrestamosResumenPage />)} />
                  <Route path="prestamos/lista" element={priv(<PrestamosListPage />)} />
                  <Route path="prestamos/:id" element={priv(<PrestamoDetailPage />)} />
                  <Route path="prestamos/:id/refinanciar" element={priv(<RefinanciacionPage />)} />

                  {/* COBRANZAS */}
                  <Route path="cobranzas/resumen" element={priv(<CobranzasResumenPage />)} />
                  <Route path="cobranzas/lista" element={priv(<CobranzasListPage />)} />
                  <Route path="cobranzas/:id" element={priv(<GestionCobranzaDetailPage />)} />

                  {/* LEADS */}
                  <Route path="leads" element={priv(<LeadsTablePage />)} />
                  <Route path="leads/metricas" element={priv(<LeadMetricasPage />)} />
                  <Route path="leads/recordatorios" element={priv(<GestionGlobalRecordatoriosPage />)} />
                  <Route path="leads/nuevo" element={priv(<LeadFormPage />)} />
                  <Route path="leads/:id" element={priv(<LeadDetailPage />)} />
                  <Route path="leads/:id/editar" element={priv(<LeadFormPage />)} />
                  <Route path="leads/:id/convertir" element={priv(<ConvertLeadPage />)} />

                  {/* PROVEEDORES */}
                  <Route path="proveedores/gestion" element={priv(<SuppliersPage />)} />
                  <Route path="proveedores/buscar" element={priv(<BuscarProveedorPorProductoPage />)} />
                  <Route path="proveedores/compras" element={priv(<ComprasPedidosPage />)} />
                  <Route path="proveedores/cuenta-corriente" element={priv(<CuentaCorrienteProveedoresPage />)} />
                  <Route path="proveedores/contactos" element={priv(<ContactosCondicionesPage />)} />
                  <Route path="proveedores/historial" element={priv(<HistorialComprasPage />)} />
                  <Route path="proveedores/evaluacion" element={priv(<EvaluacionDesempenoPage />)} />

                  {/* GARANTÍAS */}
                  <Route path="garantias/registro" element={priv(<GarantiasPage />)} />
                  <Route path="garantias/reclamos" element={priv(<ReclamosGarantiaPage />)} />
                  <Route path="garantias/reporte" element={priv(<GarantiaReportPage />)} />

                  {/* RRHH */}
                  <Route path="rrhh/empleados" element={priv(<EmpleadosPage />)} />
                  <Route path="rrhh/puestos" element={priv(<PuestosPage />)} />
                  <Route path="rrhh/puestos/:id" element={priv(<PuestoDetailPage />)} />
                  <Route path="rrhh/asistencia" element={priv(<AsistenciasPage />)} />
                  <Route path="rrhh/licencias" element={priv(<LicenciasPage />)} />
                  <Route path="rrhh/capacitaciones" element={priv(<CapacitacionesPage />)} />
                  <Route path="rrhh/sueldos" element={priv(<SueldosPage />)} />
                  <Route path="rrhh/legajos" element={priv(<LegajosPage />)} />

                  {/* LOGÍSTICA */}
                  <Route path="logistica/stock" element={priv(<StockPage />)} />
                  <Route path="logistica/inventario/depositos" element={priv(<InventarioDepositoPage />)} />
                  <Route path="logistica/inventario/stock-equipos" element={priv(<StockEquiposPage />)} />
                  <Route path="logistica/inventario/ubicaciones" element={priv(<UbicacionEquiposPage />)} />
                  <Route path="logistica/inventario/recuentos" element={priv(<RecountTasksPage />)} />
                  <Route path="logistica/inventario/reconciliacion" element={priv(<ReconciliacionStockPage />)} />
                  <Route path="logistica/inventario/stock-productos" element={priv(<StockPage />)} />
                  <Route path="logistica/distribucion/viajes" element={priv(<TripsPage />)} />
                  <Route path="logistica/distribucion/entregas-productos" element={priv(<DeliveriesPage />)} />
                  <Route path="logistica/distribucion/entregas-equipos" element={priv(<EntregasEquiposPage />)} />
                  <Route path="logistica/vehiculos/incidencias" element={priv(<IncidenciasVehiculoPage />)} />
                  <Route path="logistica/movimientos/transferencias" element={priv(<TransferenciasPage />)} />
                  <Route path="logistica/movimientos/auditoria" element={priv(<AuditoriaPage />)} />
                  <Route path="logistica/configuracion/depositos" element={priv(<DepositosPage />)} />

                  {/* Legacy redirects */}
                  <Route path="logistica/stock-equipos" element={<Navigate to="/logistica/inventario/stock-equipos" replace />} />
                  <Route path="logistica/inventario" element={priv(<InventoryPage />)} />
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

                  {/* TALLER */}
                  <Route path="taller/trabajos" element={priv(<TrabajosRealizadosPage />)} />
                  <Route path="taller/ordenes" element={priv(<OrdenesServicioPage />)} />
                  <Route path="taller/materiales" element={priv(<ControlMaterialesPage />)} />
                  <Route path="taller/tareas" element={priv(<AsignacionTareasPage />)} />
                  <Route path="taller/configuracion" element={priv(<ConfiguracionTallerPage />)} />

                  {/* FABRICACIÓN */}
                  <Route path="fabricacion/dashboard" element={priv(<DashboardFabricacion />)} />
                  <Route path="fabricacion/recetas" element={priv(<RecetasList />)} />
                  <Route path="fabricacion/recetas/:id" element={priv(<RecetaDetail />)} />
                  <Route path="fabricacion/recetas/nueva" element={priv(<RecetaForm />)} />
                  <Route path="fabricacion/recetas/editar/:id" element={priv(<RecetaForm />)} />
                  <Route path="fabricacion/equipos" element={priv(<EquiposList />)} />
                  <Route path="fabricacion/equipos/:id" element={priv(<EquipoDetail />)} />
                  <Route path="fabricacion/equipos/nuevo" element={priv(<EquipoForm />)} />
                  <Route path="fabricacion/equipos/editar/:id" element={priv(<EquipoForm />)} />
                  <Route path="fabricacion/reportes-estados" element={priv(<ReportesEstadosPage />)} />
                  <Route path="fabricacion/stock-planificacion" element={priv(<StockPlanificacionPage />)} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </ThemeProvider>
        </MedidasProvider>
        </ColoresProvider>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
