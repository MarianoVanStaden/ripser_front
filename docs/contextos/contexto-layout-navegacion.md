# Contexto: Layout y Navegacion

## Descripcion General
Modulo de layout principal que define la estructura visual de la aplicacion. Incluye el sidebar de navegacion con 13 secciones filtradas por permisos, una barra superior (AppBar), una paleta de comandos para navegacion rapida, y un boton de scroll-to-top. El layout envuelve todas las rutas protegidas y aplica el contexto de tenant (empresa/sucursal) requerido antes de renderizar el contenido.

## Archivos del Modulo
- Componentes:
  - `src/components/Layout/Layout.tsx` - Wrapper principal con Outlet para rutas anidadas
  - `src/components/Layout/Sidebar.tsx` - Barra lateral de navegacion con 13 secciones
  - `src/components/Layout/ModernSidebar.tsx` - Version alternativa del sidebar (no utilizada actualmente)
  - `src/components/Layout/CommandPalette.tsx` - Paleta de busqueda rapida de paginas
  - `src/components/Layout/ScrollToTopButton.tsx` - Boton flotante para volver arriba
- Hooks:
  - `src/hooks/usePermisos.ts` - Hook de permisos que filtra secciones del sidebar
- Types:
  - `src/types/index.ts` - Tipo `Modulo` y `TipoRol`
- Estilos:
  - `src/components/Layout/Sidebar.css` - Estilos del sidebar

## Rutas
El Layout en si no tiene ruta propia. Se usa como wrapper para todas las rutas protegidas del sistema via `<Outlet />`. No requiere proteccion de modulo especifico; se renderiza siempre dentro de `PrivateRoute`.

## Endpoints API Consumidos
El modulo de layout no consume endpoints directamente. Delega en:
- `useAuth()` de `AuthContext` para datos del usuario y funcion `logout()`
- `usePermisos()` para verificacion de acceso a modulos
- `useTenant()` de `TenantContext` para selector de sucursal

## Tipos Principales
```typescript
// Estructura del sidebar
interface NavigationSection {
  title: string;       // Titulo de la seccion (ej: 'VENTAS')
  modulo: Modulo;      // Modulo para verificar permiso
  items: Array<{
    text: string;      // Texto del item
    icon: ReactNode;   // Icono MUI
    path: string;      // Ruta de navegacion
  }>;
}

// Modulos del sistema
type Modulo =
  | 'DASHBOARD' | 'VENTAS' | 'CLIENTES' | 'PROVEEDORES'
  | 'LOGISTICA' | 'TALLER' | 'PRODUCCION' | 'TRANSPORTE'
  | 'GARANTIAS' | 'RRHH' | 'ADMIN' | 'ADMINISTRACION' | 'PRESTAMOS';

// Nota: 'COBRANZAS' se usa en el sidebar (modulo: 'COBRANZAS') pero NO esta
// en el tipo Modulo. Esto causa que la seccion solo sea visible para ADMIN.

// Roles del sistema
type TipoRol = 'ADMIN' | 'USER' | 'VENDEDOR' | 'TALLER' | 'OFICINA'
  | 'USUARIO' | 'ADMIN_EMPRESA' | 'GERENTE_SUCURSAL';

// Paleta de comandos
interface CommandOption {
  label: string;       // Etiqueta visible
  icon: ReactNode;     // Icono MUI
  path: string;        // Ruta destino
  category: string;    // Categoria para agrupacion
}
```

## Permisos y Roles
El layout no tiene permiso de modulo propio. La logica de permisos se aplica al filtrar las secciones del sidebar:

### Matriz PERMISOS_POR_ROL (en usePermisos.ts)
| Rol | Modulos |
|-----|---------|
| ADMIN | Todos (bypass completo) |
| OFICINA | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, GARANTIAS, PRESTAMOS |
| VENDEDOR | VENTAS, CLIENTES, GARANTIAS |
| TALLER | DASHBOARD, TALLER, GARANTIAS, LOGISTICA |
| USER/USUARIO | DASHBOARD |
| ADMIN_EMPRESA | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, TALLER, PRODUCCION, GARANTIAS, RRHH, ADMINISTRACION, PRESTAMOS |
| GERENTE_SUCURSAL | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, GARANTIAS, RRHH, PRESTAMOS |

### Filtrado del sidebar
1. Se filtran secciones con `navigation.filter(section => tienePermiso(section.modulo))`
2. Para la seccion ADMIN, si el usuario no es SuperAdmin, se oculta el item `/admin/tenant-selector`
3. Secciones sin items visibles se eliminan

### Restricciones especiales
- `superAdminOnlyPaths = ['/admin/tenant-selector']` - Solo visible para SuperAdmin
- Si `esSuperAdmin` es false, el item "Cambiar Contexto" se oculta de la seccion ADMIN

## Multi-tenant
- El Layout integra `TenantRequiredRoute` que verifica que el usuario tenga un contexto de empresa activo antes de renderizar el contenido.
- El Sidebar incluye un `SucursalSelector` condicional: solo aparece si `canSelectSucursal && sucursales.length > 0`.
- El selector de sucursal permite filtrar datos por sucursal a traves de `setSucursalFiltro` y `cambiarSucursal`.
- El usuario SuperAdmin tiene un Chip visual "Super Admin" en rojo en la seccion de perfil.

## Dependencias entre Modulos
- **AuthContext**: Proporciona `user`, `esSuperAdmin`, `logout()`
- **TenantContext**: Proporciona `sucursalFiltro`, `setSucursalFiltro`, `sucursales`, `canSelectSucursal`, `usuarioEmpresa`, `cambiarSucursal`
- **usePermisos**: Proporciona `tienePermiso()` para filtrar secciones
- **Sucursal/SucursalSelector**: Componente integrado para seleccion de sucursal
- **Tenant/TenantRequiredRoute**: Componente que verifica contexto de empresa

## Patrones Especificos

### Layout.tsx
- Usa `<Outlet />` de React Router para renderizar rutas hijas.
- Ancho del sidebar fijo: 240px. El contenido principal se ajusta con `calc(100% - 240px)` cuando el sidebar esta abierto.
- Incluye un `<Fab>` flotante para abrir la paleta de comandos (boton de busqueda en esquina inferior derecha).
- `TenantRequiredRoute` envuelve el `<Outlet />` para forzar seleccion de empresa.

### Sidebar.tsx
- **Responsive**: Usa `useMediaQuery(theme.breakpoints.down('md'))` para determinar si es mobile.
  - Mobile: `Drawer variant="temporary"` (overlay que se cierra al navegar)
  - Desktop: `Drawer variant="persistent"` (se mantiene abierto, debajo del AppBar)
- **13 secciones de navegacion**:
  1. PRINCIPAL (Dashboard) - modulo: DASHBOARD
  2. VENTAS (10 items) - modulo: VENTAS
  3. CLIENTES (8 items) - modulo: CLIENTES
  4. PRESTAMOS (2 items) - modulo: PRESTAMOS
  5. COBRANZAS (2 items) - modulo: COBRANZAS
  6. PROVEEDORES (6 items) - modulo: PROVEEDORES
  7. LOGISTICA (9 items) - modulo: LOGISTICA
  8. TRANSPORTE (4 items) - modulo: TRANSPORTE
  9. TALLER (5 items) - modulo: TALLER
  10. PRODUCCION (5 items) - modulo: PRODUCCION
  11. GARANTIAS (3 items) - modulo: GARANTIAS
  12. RRHH (8 items) - modulo: RRHH
  13. ADMINISTRACION (13 items) - modulo: ADMIN
- **Logout con confirmacion**: Muestra un Dialog de confirmacion antes de cerrar sesion.
- **Perfil de usuario**: Muestra avatar con inicial del username y badge de SuperAdmin si aplica.
- **Tema oscuro**: Fondo `#212A3E`, texto blanco, acento `#00B8A9`.
- **Highlight de ruta activa**: Compara `location.pathname === item.path` para resaltar el item actual.

### CommandPalette.tsx
- Dialog modal con campo de busqueda que filtra 16 comandos predefinidos.
- Busqueda por label o categoria (case-insensitive).
- Categorias: Navegacion, Clientes, Ventas, Proveedores, Logistica, Taller, RRHH, Configuracion.
- Se abre con el FAB flotante del Layout o potencialmente con atajo de teclado.
- Nota: La paleta de comandos NO incluye todas las rutas del sidebar. Es un subconjunto de accesos rapidos.

### ScrollToTopButton.tsx
- `<Fab>` de tamano pequeno que aparece cuando `window.scrollY > 200`.
- Usa transicion `<Fade>` para aparecer/desaparecer.
- Posicion fija: bottom: 125px, right: 32px (por encima del FAB de paleta de comandos).
- Scroll suave con `window.scrollTo({ top: 0, behavior: 'smooth' })`.
