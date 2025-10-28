/**
 * EJEMPLO DE IMPLEMENTACIÓN CON PROTECTEDROUTE
 *
 * Este archivo muestra cómo reemplazar PrivateRoute con ProtectedRoute
 * para implementar control de acceso basado en roles.
 *
 * PASOS PARA IMPLEMENTAR:
 * 1. Reemplazar las importaciones
 * 2. Cambiar todas las instancias de <PrivateRoute> por <ProtectedRoute>
 * 3. Agregar el prop requiredModulo a cada ruta según corresponda
 *
 * IMPORTANTE: Este es solo un ejemplo. No reemplaces App.tsx hasta probar el sistema.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import DevKPIs from './components/Dashboard/DevKPIs';
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./components/Auth/LoginPage";

// IMPORTANTE: Reemplazar PrivateRoute por ProtectedRoute
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Importar todos los componentes de páginas...
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
import OpcionesFinanciamientoPage from './components/Ventas/OpcionesFinanciamientoPage';
import ConfiguracionFinanciamiento from './components/Ventas/ConfiguracionFinanciamiento';
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

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* Layout protegido - requiere autenticación */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredModulo="DASHBOARD">
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* DASHBOARD - Todos los usuarios autenticados */}
              <Route
                index
                element={
                  <ProtectedRoute requiredModulo="DASHBOARD">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute requiredModulo="DASHBOARD">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard/dev-kpis"
                element={
                  <ProtectedRoute requiredModulo="DASHBOARD">
                    <DevKPIs />
                  </ProtectedRoute>
                }
              />

              {/* ADMIN - Solo ADMIN */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/roles"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <RolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* VENTAS - ADMIN, OFICINA, VENDEDOR */}
              <Route
                path="ventas/notasPedido"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <NotasPedidoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas/presupuestos"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <PresupuestosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas/opciones-financiamiento"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <OpcionesFinanciamientoPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas/configuracion-financiamiento"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <ConfiguracionFinanciamiento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas/registro"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <RegistroVentasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas/facturacion"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <FacturacionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ventas/informes"
                element={
                  <ProtectedRoute requiredModulo="VENTAS">
                    <InformesVentasPage />
                  </ProtectedRoute>
                }
              />

              {/* CLIENTES - ADMIN, OFICINA, VENDEDOR */}
              <Route
                path="clientes/gestion"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <ClientesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/nuevo"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <ClienteFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/editar/:id"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <ClienteFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/detalle/:id"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <ClienteDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/carpeta"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <CarpetaClienteSelector />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/carpeta/:id"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <CarpetaClientePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/agenda"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <AgendaVisitasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/cuenta-corriente"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <CuentaCorrientePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/credito"
                element={
                  <ProtectedRoute requiredModulo="CLIENTES">
                    <CreditoPersonalPage />
                  </ProtectedRoute>
                }
              />

              {/* PROVEEDORES - ADMIN, OFICINA (NO VENDEDOR) */}
              <Route
                path="proveedores/gestion"
                element={
                  <ProtectedRoute requiredModulo="PROVEEDORES">
                    <SuppliersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="proveedores/compras"
                element={
                  <ProtectedRoute requiredModulo="PROVEEDORES">
                    <ComprasPedidosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="proveedores/cuenta-corriente"
                element={
                  <ProtectedRoute requiredModulo="PROVEEDORES">
                    <CuentaCorrienteProveedoresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="proveedores/contactos"
                element={
                  <ProtectedRoute requiredModulo="PROVEEDORES">
                    <ContactosCondicionesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="proveedores/historial"
                element={
                  <ProtectedRoute requiredModulo="PROVEEDORES">
                    <HistorialComprasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="proveedores/evaluacion"
                element={
                  <ProtectedRoute requiredModulo="PROVEEDORES">
                    <EvaluacionDesempenoPage />
                  </ProtectedRoute>
                }
              />

              {/* GARANTÍAS - ADMIN, OFICINA, VENDEDOR, TALLER */}
              <Route
                path="garantias/registro"
                element={
                  <ProtectedRoute requiredModulo="GARANTIAS">
                    <GarantiasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="garantias/reclamos"
                element={
                  <ProtectedRoute requiredModulo="GARANTIAS">
                    <ReclamosGarantiaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="garantias/reporte"
                element={
                  <ProtectedRoute requiredModulo="GARANTIAS">
                    <GarantiaReportPage />
                  </ProtectedRoute>
                }
              />

              {/* RRHH - Solo ADMIN */}
              <Route
                path="rrhh/empleados"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <EmpleadosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/usuarios"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <UsuariosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/puestos"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <PuestosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/asistencia"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <AsistenciasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/licencias"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <LicenciasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/capacitaciones"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <CapacitacionesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/sueldos"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <SueldosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="rrhh/legajos"
                element={
                  <ProtectedRoute requiredModulo="RRHH">
                    <LegajosPage />
                  </ProtectedRoute>
                }
              />

              {/* LOGÍSTICA - ADMIN, OFICINA, TALLER */}
              <Route
                path="logistica/stock"
                element={
                  <ProtectedRoute requiredModulo="LOGISTICA">
                    <StockPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="logistica/stock-equipos"
                element={
                  <ProtectedRoute requiredModulo="LOGISTICA">
                    <StockEquiposPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="logistica/viajes"
                element={
                  <ProtectedRoute requiredModulo="LOGISTICA">
                    <TripsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="logistica/inventario"
                element={
                  <ProtectedRoute requiredModulo="LOGISTICA">
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="logistica/recuentos"
                element={
                  <ProtectedRoute requiredModulo="LOGISTICA">
                    <RecountTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="logistica/entregas"
                element={
                  <ProtectedRoute requiredModulo="LOGISTICA">
                    <DeliveriesPage />
                  </ProtectedRoute>
                }
              />

              {/* TALLER - ADMIN, TALLER */}
              <Route
                path="taller/trabajos"
                element={
                  <ProtectedRoute requiredModulo="TALLER">
                    <TrabajosRealizadosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="taller/ordenes"
                element={
                  <ProtectedRoute requiredModulo="TALLER">
                    <OrdenesServicioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="taller/materiales"
                element={
                  <ProtectedRoute requiredModulo="TALLER">
                    <ControlMaterialesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="taller/tareas"
                element={
                  <ProtectedRoute requiredModulo="TALLER">
                    <AsignacionTareasPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="taller/configuracion"
                element={
                  <ProtectedRoute requiredModulo="TALLER">
                    <ConfiguracionTallerPage />
                  </ProtectedRoute>
                }
              />

              {/* FABRICACIÓN/PRODUCCIÓN - Solo ADMIN */}
              <Route
                path="fabricacion/dashboard"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <DashboardFabricacion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/recetas"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <RecetasList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/recetas/:id"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <RecetaDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/recetas/nueva"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <RecetaForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/recetas/editar/:id"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <RecetaForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/equipos"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <EquiposList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/equipos/:id"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <EquipoDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/equipos/nuevo"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <EquipoForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fabricacion/equipos/editar/:id"
                element={
                  <ProtectedRoute requiredModulo="PRODUCCION">
                    <EquipoForm />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
