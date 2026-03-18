# Contexto: Autenticacion y Multi-Tenant

## Descripcion General
El sistema de autenticacion se basa en JWT con access token y refresh token. El access token se almacena en `localStorage` y se adjunta automaticamente a cada request mediante interceptors de Axios. La arquitectura multi-tenant permite que un usuario opere en distintas empresas y sucursales, gestionadas a traves del `TenantContext` que persiste `empresaId` y `sucursalId` en `sessionStorage` para aislamiento por tab del navegador.

## Archivos del Modulo
- Componentes: `src/components/Auth/LoginPage.tsx`, `src/components/Auth/LoginForm.tsx`, `src/components/Auth/ProtectedRoute.tsx`
- API Services: `src/api/authApi.ts`, `src/api/config.ts`
- Hooks: `src/hooks/usePermisos.ts`
- Types: `src/types/index.ts` (TipoRol, Modulo)
- Utils: `src/utils/permissions.ts`
- Contexts: `src/context/AuthContext.tsx`, `src/context/TenantContext.tsx`

## Rutas
| Ruta | Componente | Proteccion |
|------|-----------|------------|
| /login | LoginPage | Publica (redirige a /dashboard si ya autenticado) |
| / | Dashboard | PrivateRoute |
| /dashboard | Dashboard | PrivateRoute |
| /admin/tenant-selector | TenantSelector | SuperAdminRoute |
| Todas las demas | Varios | PrivateRoute |

## Endpoints API Consumidos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login con username/email + password, retorna accessToken, refreshToken, roles, empresaId, sucursalId, esSuperAdmin |
| POST | `/api/auth/validate` | Valida un token existente |
| POST | `/api/auth/refresh` | Renueva el access token usando el refresh token |
| POST | `/api/auth/select-tenant` | Selecciona empresa/sucursal activa, retorna nuevo token con claims actualizados |

## Tipos Principales

### AuthUser
```typescript
interface AuthUser {
  id: number;
  username: string;
  email?: string;
  roles?: TipoRol[];
  esSuperAdmin?: boolean;
  empresaId?: number;
  sucursalId?: number;
  nombre?: string;
}
```

### TipoRol (union de strings)
`'ADMIN' | 'OFICINA' | 'VENDEDOR' | 'TALLER' | 'USER' | 'USUARIO' | 'ADMIN_EMPRESA' | 'GERENTE_SUCURSAL'`

### Modulo (union de strings)
`'DASHBOARD' | 'VENTAS' | 'CLIENTES' | 'PROVEEDORES' | 'LOGISTICA' | 'TALLER' | 'PRODUCCION' | 'GARANTIAS' | 'RRHH' | 'ADMINISTRACION' | 'PRESTAMOS'`

## Permisos y Roles

### Matriz PERMISOS_POR_ROL
| Rol | Modulos con acceso |
|-----|-------------------|
| ADMIN | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, TALLER, PRODUCCION, GARANTIAS, RRHH, PRESTAMOS |
| OFICINA | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, GARANTIAS, PRESTAMOS |
| VENDEDOR | VENTAS, CLIENTES, GARANTIAS |
| TALLER | DASHBOARD, TALLER, GARANTIAS, LOGISTICA |
| USER | DASHBOARD |
| USUARIO | DASHBOARD |
| ADMIN_EMPRESA | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, TALLER, PRODUCCION, GARANTIAS, RRHH, ADMINISTRACION, PRESTAMOS |
| GERENTE_SUCURSAL | DASHBOARD, VENTAS, CLIENTES, PROVEEDORES, LOGISTICA, GARANTIAS, RRHH, PRESTAMOS |

### Roles Multi-Tenant adicionales
- `SUPER_ADMIN`: Rol especial para acceder a multiples empresas, gestionar empresas/sucursales y ver reportes consolidados.
- `SUPERVISOR`, `USUARIO_SUCURSAL`: Roles a nivel de sucursal con permisos limitados.

## Multi-tenant

### Flujo de autenticacion completo
1. El usuario ingresa credenciales en `LoginPage`.
2. `AuthContext.login()` llama a `POST /api/auth/login`.
3. El backend retorna `accessToken`, `refreshToken`, `roles`, `empresaId`, `sucursalId`, `esSuperAdmin`.
4. Se guardan:
   - `auth_token` y `auth_user` en `localStorage` (persistente entre tabs).
   - `empresaId`, `sucursalId`, `esSuperAdmin` en `sessionStorage` (aislado por tab).
   - `auth_refresh_token` en `localStorage`.
5. Se invoca `setAuthToken(token)` para establecer la referencia en memoria en `config.ts`.
6. Se dispara el evento `tenant-context-updated` para sincronizar `TenantContext`.

### Interceptors en config.ts
- **Request interceptor**: Adjunta `Authorization: Bearer {token}` y `X-Empresa-Id: {empresaId}` a cada request. Algunos endpoints estan excluidos del header de tenant (`/api/auth/`, `/api/empresas`, `/api/select-tenant`, etc.).
- **Response interceptor**: Ante un 401 con `error: 'token_expired'`, intenta renovar el token via `/api/auth/refresh`. Si el refresh falla, limpia los tokens de auth pero **preserva** `empresaId`/`sucursalId` en `sessionStorage` para mantener el contexto del SuperAdmin.

### TenantContext
- Gestiona `empresaId`, `sucursalId`, `esSuperAdmin`, `sucursalFiltro`, `sucursales`, `rolActual`, `usuarioEmpresa`.
- `cambiarTenant(empresaId, sucursalId?)`: Llama a `/api/auth/select-tenant`, obtiene nuevo token, recarga la pagina si cambia la empresa.
- `cambiarSucursal(sucursalId)`: Cambia solo la sucursal sin recargar la pagina.
- `sucursalFiltro`: Filtro temporal de sucursal persistido en `sessionStorage`.
- `canSelectSucursal`: `true` para SuperAdmin, ADMIN_EMPRESA y GERENTE_SUCURSAL.
- Migra automaticamente datos de `localStorage` a `sessionStorage` para usuarios existentes.

### ProtectedRoute
El componente `ProtectedRoute` soporta multiples niveles de proteccion:
- `requiredModulo`: Verifica acceso al modulo via `usePermisos().tienePermiso()`.
- `requiredRoles`: Verifica que el usuario tenga al menos uno de los roles.
- `requireSuperAdmin`: Solo permite acceso a SuperAdmin.
- `requireAdminEmpresa`: Solo ADMIN, ADMIN_EMPRESA o SuperAdmin.
- `requireGerenteSucursal`: Solo ADMIN, ADMIN_EMPRESA, GERENTE_SUCURSAL o SuperAdmin.

### PrivateRoute y SuperAdminRoute (en App.tsx)
- `PrivateRoute`: Verifica que exista `user` en el AuthContext; si no, redirige a `/login`.
- `SuperAdminRoute`: Verifica que `user` exista y que `esSuperAdmin === true`; si no, redirige a `/dashboard`.

## Dependencias entre Modulos
- Todos los modulos dependen de `AuthContext` para autenticacion y de `TenantContext` para la seleccion de empresa/sucursal.
- El header `X-Empresa-Id` es requerido por la mayoria de endpoints del backend para filtrar datos por empresa.
- `usePermisos()` es usado por el sidebar y componentes de navegacion para mostrar/ocultar secciones segun el rol.

## Patrones Especificos
- **Referencia en memoria**: `setAuthToken()` en `config.ts` mantiene el token en una variable `let authToken` para evitar leer `localStorage` en cada request.
- **Evento custom**: Se usa `window.dispatchEvent(new CustomEvent('tenant-context-updated'))` para sincronizar datos de tenant entre `AuthContext` y `TenantContext` sin acoplamiento directo.
- **Aislamiento por tab**: Se usa `sessionStorage` (no `localStorage`) para `empresaId`, `sucursalId` y `esSuperAdmin`, permitiendo que cada tab tenga un contexto de tenant independiente.
- **Preservacion de contexto**: Ante errores 401 o fallo de refresh, NO se limpian los datos de tenant para que el SuperAdmin mantenga su seleccion de empresa al re-loguearse.
- **Validacion client-side del JWT**: Se decodifica el payload del JWT para verificar expiracion antes de hacer llamadas al backend.

## Hooks Principales

### useAuth()
Retorna `{ user, token, esSuperAdmin, login, logout, loading }`. Acceso al estado de autenticacion global.

### useTenant()
Retorna `{ empresaId, sucursalId, esSuperAdmin, empresaActual, sucursalActual, cambiarTenant, cambiarSucursal, sucursalFiltro, setSucursalFiltro, sucursales, canSelectSucursal, rolActual, usuarioEmpresa, loading }`.

### usePermisos()
Retorna `{ tienePermiso(modulo), modulosPermitidos, tieneRol(...roles), esAdmin, roles }`. Basado en la matriz `PERMISOS_POR_ROL`.

## Utils de Permisos (permissions.ts)
Funciones utilitarias para verificar permisos a nivel de multi-tenant:
- `canAccessMultipleEmpresas(user)` - Solo SuperAdmin.
- `canManageEmpresas(user)` - Solo SuperAdmin.
- `canManageSucursales(user)` - SuperAdmin, ADMIN_EMPRESA, ADMIN.
- `canViewConsolidatedReports(user)` - SuperAdmin, ADMIN_EMPRESA, ADMIN.
- `canManageUsuarios(user)` - SuperAdmin, ADMIN_EMPRESA, GERENTE_SUCURSAL, ADMIN.
- `hasAccessToSucursal(user, sucursalId)` - Verifica acceso a una sucursal especifica.
- `hasAccessToEmpresa(user, empresaId)` - Verifica acceso a una empresa especifica.
- `getRoleDisplayName(role)` - Nombre legible del rol (ej: 'ADMIN_EMPRESA' -> 'Administrador de Empresa').
