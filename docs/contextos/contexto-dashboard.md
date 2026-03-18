# Contexto: Dashboard

## Descripcion General
El Dashboard principal es el punto de entrada de la aplicacion despues del login. Presenta KPIs de alto nivel (clientes, productos, ventas, stock) y renderiza dashboards especializados segun el rol del usuario. Tambien existe un dashboard de KPIs de desarrollo (`DevKPIs`) que analiza metricas del repositorio Git. Todos los roles tienen acceso al modulo DASHBOARD.

## Archivos del Modulo
- Componentes: `src/components/Dashboard/Dashboard.tsx`, `src/components/Dashboard/AdminDashboard.tsx`, `src/components/Dashboard/VendedorDashboard.tsx`, `src/components/Dashboard/TallerDashboard.tsx`, `src/components/Dashboard/ProduccionDashboard.tsx`, `src/components/Dashboard/DevKPIs.tsx`, `src/components/Dashboard/QuickActions.tsx`, `src/components/Dashboard/RecentActivity.tsx`, `src/components/Dashboard/Dashboard_NEW.tsx`
- API Services: `clientApi`, `productApi`, `documentoApi`, `parametroSistemaApi` (desde `src/api/services`)
- Hooks: `useAuth()`, `useTenant()`
- Types: `DashboardStats`, `TopProduct`, `RecentSale` (definidos localmente en Dashboard.tsx)
- Utils: `testConnection` (desde `src/api/testConnection`)

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| / | Dashboard | PrivateRoute |
| /dashboard | Dashboard | PrivateRoute |
| /dashboard/dev-kpis | DevKPIs | PrivateRoute |

## Endpoints API Consumidos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/clientes` | Total de clientes para KPI |
| GET | `/api/products` | Total de productos y listado |
| GET | `/api/documentos/tipo/FACTURA` | Facturas para calcular ventas |
| GET | `/api/products/low-stock` | Productos con stock bajo |
| GET | `/api/parametros-sistema/clave/META_VENTAS_MENSUALES` | Meta mensual de ventas |
| GET | `/api/test-connection` | Verificacion de conexion al backend |
| GET | `/kpi-report.json` | Reporte de KPIs de desarrollo (DevKPIs, archivo estatico) |

## Tipos Principales

### DashboardStats
```typescript
interface DashboardStats {
  totalClients: number;
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  monthlySalesAmount: number;
  monthlySalesCount: number;
  lowStockProducts: number;
  todaySales: number;
  weekSales: number;
  averageOrderValue: number;
  clientsThisMonth: number;
  productsOutOfStock: number;
  pendingOrders: number;
  completedOrdersToday: number;
  todayTrend: number;
  weekTrend: number;
  monthTrend: number;
}
```

### KpiReport (DevKPIs)
```typescript
interface KpiReport {
  summary: KpiSummary; // totalCommits, commitsPerWeek, featRatio, fixRatio, etc.
  histograms: { byHour: number[]; byDOW: number[] };
  typeDistribution: Record<string, number>;
  authorsTop: AuthorTop[];
  eslint: ESLintMetrics;
  typescript: TSMetrics;
  bundleBytes?: number;
}
```

## Permisos y Roles
- **Modulo**: DASHBOARD
- **Roles con acceso**: Todos (ADMIN, OFICINA, VENDEDOR, TALLER, USER, USUARIO, ADMIN_EMPRESA, GERENTE_SUCURSAL)
- El dashboard renderiza vistas especializadas segun el rol del usuario.

### Dashboards por Rol
| Rol | Dashboard Renderizado |
|-----|----------------------|
| ADMIN | Dashboard general completo con tabs (Resumen, Ventas, Inventario) |
| GERENTE | AdminDashboard (metricas administrativas) |
| VENDEDOR | VendedorDashboard (redirige a `/ventas/dashboard`) |
| PRODUCCION | ProduccionDashboard (ordenes activas, equipos pendientes, completados, materiales bajos) |
| TALLER | TallerDashboard (ordenes activas, pendientes, completadas, eficiencia, materiales) |
| LOGISTICA / RRHH | Placeholder "en construccion" |
| Otros | Dashboard general completo |

## Multi-tenant
- El Dashboard principal consume `empresaId` del `TenantContext` y re-fetcha datos cuando cambia el tenant.
- Los datos de KPIs (clientes, productos, ventas) son filtrados automaticamente por empresa a traves del header `X-Empresa-Id`.
- `RecentActivity` usa `useTenant()` para contextualizar la actividad reciente.

## Dependencias entre Modulos
- Depende de `clientApi` (modulo Clientes), `productApi` (modulo Logistica/Inventario), `documentoApi` (modulo Ventas).
- `QuickActions` proporciona enlaces rapidos a: Nueva Venta (`/ventas/registro`), Nuevo Cliente (`/clientes/gestion`), Presupuesto (`/ventas/presupuestos`), entre otros.
- `VendedorDashboard` redirige directamente a `/ventas/dashboard` (modulo Ventas).

## Patrones Especificos
- **Dashboard con tabs**: El dashboard de ADMIN tiene 3 tabs: Resumen General, Detalle de Ventas, y Inventario.
- **Conexion al backend**: Al montar, verifica la conexion al backend con `testConnection()` y muestra un dialogo de setup si falla.
- **Meta de ventas**: Carga `META_VENTAS_MENSUALES` desde `parametroSistemaApi` para mostrar progreso vs objetivo.
- **Graficos**: `DevKPIs` usa `chart.js` (via `react-chartjs-2`) con graficos `Bar` y `Doughnut` para distribucion de commits, histogramas, etc.
- **Formato monetario**: Las ventas se muestran formateadas en ARS con separadores de miles.
- **Calculo de tendencias**: Se calculan tendencias de venta (hoy, semana, mes) comparando con periodos anteriores.
- **BackendSetupDialog**: Dialogo que aparece si no se puede conectar al backend, guiando la configuracion inicial.
