# Sistema de Control de Acceso Basado en Roles (RBAC)

## Descripción General

Este sistema implementa un control de acceso granular que permite definir qué módulos y funcionalidades puede acceder cada tipo de usuario según sus roles asignados.

## Roles Disponibles

### 1. ADMIN
**Acceso**: Total a todos los módulos
- Dashboard, Ventas, Clientes, Proveedores, Logística, Taller, Producción, Garantías, RRHH

### 2. OFICINA
**Acceso**: Gestión administrativa y comercial
- Dashboard
- Ventas (completo)
- Clientes (completo)
- Proveedores (completo)
- Logística (completo)
- Garantías (completo)

**Restricciones**: No accede a Taller, Producción ni RRHH completo

### 3. VENDEDOR
**Acceso**: Enfocado en ventas y atención al cliente
- Dashboard
- Ventas (completo)
- Clientes (completo)
- Garantías (consulta)

**Restricciones**: NO puede acceder a Proveedores, Compras, RRHH, Taller ni Producción

### 4. TALLER
**Acceso**: Operaciones de taller y servicio técnico
- Dashboard
- Taller (completo)
- Garantías (completo)
- Logística (parcial - solo visualización de stock)

**Restricciones**: No accede a Ventas, Clientes, Proveedores, RRHH ni Producción

### 5. USER / USUARIO
**Acceso**: Mínimo - Solo consulta
- Dashboard (solo visualización)

**Restricciones**: No accede a ningún otro módulo de gestión

## Arquitectura del Sistema

### Backend (Spring Boot)

#### 1. Enum de Roles
```java
// TipoRol.java
public enum TipoRol {
    ADMIN, USER, VENDEDOR, TALLER, OFICINA, USUARIO
}
```

#### 2. Enum de Módulos
```java
// Modulo.java
public enum Modulo {
    DASHBOARD, VENTAS, CLIENTES, PROVEEDORES,
    LOGISTICA, TALLER, PRODUCCION, GARANTIAS, RRHH
}
```

#### 3. Configuración de Permisos
**Ubicación**: `com.ripser_back.config.PermisosConfig`

Esta clase centraliza toda la matriz de permisos y provee métodos para:
- `tienePermiso(Set<TipoRol> roles, Modulo modulo)`: Verifica si un conjunto de roles tiene acceso a un módulo
- `getModulosPermitidos(Set<TipoRol> roles)`: Obtiene todos los módulos permitidos para un conjunto de roles

#### 4. API de Permisos
**Endpoint**: `/api/permisos`

Endpoints disponibles:
- `GET /api/permisos/mis-modulos`: Retorna los módulos permitidos para el usuario autenticado
- `GET /api/permisos/verificar/{modulo}`: Verifica si el usuario tiene permiso para un módulo específico

#### 5. Respuesta de Autenticación
El `AuthResponseDTO` ahora incluye el campo `roles`:

```java
{
  "accessToken": "...",
  "refreshToken": "...",
  "id": 1,
  "username": "usuario",
  "email": "usuario@example.com",
  "roles": ["VENDEDOR"]
}
```

### Frontend (React + TypeScript)

#### 1. Hook de Permisos
**Ubicación**: `src/hooks/usePermisos.ts`

Proporciona:
```typescript
const {
  tienePermiso,      // (modulo: Modulo) => boolean
  modulosPermitidos, // Modulo[]
  tieneRol,          // (...roles: TipoRol[]) => boolean
  esAdmin,           // boolean
  roles              // TipoRol[]
} = usePermisos();
```

**Ejemplo de uso**:
```typescript
const { tienePermiso, esAdmin } = usePermisos();

if (tienePermiso('VENTAS')) {
  // Renderizar contenido de ventas
}

if (esAdmin) {
  // Mostrar opciones de administrador
}
```

#### 2. Componente ProtectedRoute
**Ubicación**: `src/components/Auth/ProtectedRoute.tsx`

Protege rutas completas basándose en permisos.

**Ejemplo de uso**:
```typescript
// Por módulo
<ProtectedRoute requiredModulo="VENTAS">
  <VentasPage />
</ProtectedRoute>

// Por roles específicos
<ProtectedRoute requiredRoles={['ADMIN', 'OFICINA']}>
  <ConfiguracionPage />
</ProtectedRoute>
```

#### 3. Sidebar Dinámico
**Ubicación**: `src/components/Layout/Sidebar.tsx`

El sidebar filtra automáticamente las secciones según los permisos del usuario:
- Si no tiene acceso a un módulo, la sección completa no se muestra
- El filtrado es automático usando el hook `usePermisos`

## Implementación en Rutas

### Ejemplo completo de configuración de rutas:

```typescript
import ProtectedRoute from './components/Auth/ProtectedRoute';

// En tu archivo de rutas (App.tsx o routes.tsx)
<Routes>
  {/* Rutas públicas */}
  <Route path="/login" element={<LoginPage />} />

  {/* Dashboard - todos los autenticados */}
  <Route
    path="/"
    element={
      <ProtectedRoute requiredModulo="DASHBOARD">
        <DashboardPage />
      </ProtectedRoute>
    }
  />

  {/* Ventas - ADMIN, OFICINA, VENDEDOR */}
  <Route
    path="/ventas/*"
    element={
      <ProtectedRoute requiredModulo="VENTAS">
        <VentasRoutes />
      </ProtectedRoute>
    }
  />

  {/* Proveedores - ADMIN, OFICINA (NO VENDEDOR) */}
  <Route
    path="/proveedores/*"
    element={
      <ProtectedRoute requiredModulo="PROVEEDORES">
        <ProveedoresRoutes />
      </ProtectedRoute>
    }
  />

  {/* Taller - ADMIN, TALLER */}
  <Route
    path="/taller/*"
    element={
      <ProtectedRoute requiredModulo="TALLER">
        <TallerRoutes />
      </ProtectedRoute>
    }
  />

  {/* Solo ADMIN */}
  <Route
    path="/admin/*"
    element={
      <ProtectedRoute requiredRoles={['ADMIN']}>
        <AdminRoutes />
      </ProtectedRoute>
    }
  />
</Routes>
```

## Uso en Componentes

### Ocultar elementos condicionalmente

```typescript
import { usePermisos } from '../hooks/usePermisos';

function MiComponente() {
  const { tienePermiso, esAdmin } = usePermisos();

  return (
    <div>
      {tienePermiso('VENTAS') && (
        <Button onClick={crearVenta}>Nueva Venta</Button>
      )}

      {esAdmin && (
        <Button onClick={configurar}>Configuración</Button>
      )}
    </div>
  );
}
```

### Verificar permisos antes de acciones

```typescript
const handleDelete = () => {
  if (!tieneRol('ADMIN', 'OFICINA')) {
    alert('No tienes permisos para eliminar');
    return;
  }
  // Proceder con eliminación
};
```

## Seguridad

### Frontend
- El sidebar se filtra automáticamente
- Las rutas están protegidas con `ProtectedRoute`
- Los elementos de UI se ocultan según permisos
- El token incluye los roles del usuario

### Backend
- La configuración de permisos está centralizada en `PermisosConfig`
- Los endpoints pueden verificar permisos antes de ejecutar acciones
- Los roles están en el JWT y se validan en cada request
- Spring Security maneja la autenticación y autorización

## Testing

### Probar con diferentes roles:

1. **Crear usuarios de prueba con diferentes roles** en la base de datos:

```sql
-- Usuario ADMIN
INSERT INTO usuario_roles (usuario_id, rol) VALUES (1, 'ADMIN');

-- Usuario VENDEDOR
INSERT INTO usuario_roles (usuario_id, rol) VALUES (2, 'VENDEDOR');

-- Usuario OFICINA
INSERT INTO usuario_roles (usuario_id, rol) VALUES (3, 'OFICINA');

-- Usuario TALLER
INSERT INTO usuario_roles (usuario_id, rol) VALUES (4, 'TALLER');
```

2. **Login con cada usuario** y verificar:
   - Qué secciones aparecen en el sidebar
   - Qué rutas pueden acceder
   - Qué elementos de UI se muestran

3. **Intentar acceder a rutas no permitidas**:
   - Login como VENDEDOR
   - Intentar acceder a `/proveedores/gestion`
   - Debe mostrar página de "Acceso Denegado"

## Modificar Permisos

### Para agregar un nuevo módulo:

1. **Backend**: Agregar el módulo al enum `Modulo.java`
2. **Backend**: Actualizar `PermisosConfig.java` con los nuevos permisos
3. **Frontend**: Agregar el módulo al tipo `Modulo` en `usePermisos.ts`
4. **Frontend**: Actualizar la matriz `PERMISOS_POR_ROL`
5. **Frontend**: Agregar la sección al `Sidebar.tsx` con el nuevo módulo

### Para modificar permisos de un rol:

1. **Backend**: Editar `PermisosConfig.java` en la sección del rol
2. **Frontend**: Editar `usePermisos.ts` en la matriz `PERMISOS_POR_ROL`

**Importante**: Los permisos del backend y frontend deben estar sincronizados.

## Mantenimiento

- Mantener sincronizadas las matrices de permisos entre backend y frontend
- Revisar periódicamente los logs de intentos de acceso denegado
- Actualizar la documentación cuando se agreguen nuevos roles o módulos
- Hacer pruebas de regresión cuando se modifiquen permisos

## Contacto y Soporte

Para dudas o modificaciones al sistema de permisos, contactar al equipo de desarrollo.
