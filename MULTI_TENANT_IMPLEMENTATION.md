# Multi-Tenant Implementation Summary

## 📋 Overview

This document summarizes the multi-tenant architecture implementation for the Ripser ERP frontend.

## ✅ Implemented Features

### 1. Type Definitions

**New Files Created:**
- `src/types/auth.types.ts` - Authentication types with multi-tenant support
- `src/types/tenant.types.ts` - Empresa, Sucursal, and UsuarioEmpresa types

**Updated Files:**
- `src/types/index.ts` - Added `empresaId` to main entities:
  - Cliente
  - Empleado (includes `sucursalId`)
  - Vehiculo (includes `sucursalId`)
  - EquipoFabricadoDTO
  - EquipoFabricadoListDTO

### 2. Context & State Management

**New Files:**
- `src/context/TenantContext.tsx` - Manages tenant state (empresa/sucursal)
  - Stores empresaId, sucursalId, esSuperAdmin
  - Provides `cambiarTenant()` function
  - Loads/saves data from localStorage

**Updated Files:**
- `src/context/AuthContext.tsx` - Updated to save multi-tenant data on login/logout

### 3. Services (API Integration)

**New Services Created:**
- `src/services/empresaService.ts` - Empresa CRUD operations
  - getAll(), getActive(), getById()
  - create(), update(), suspend(), reactivate(), delete()

- `src/services/sucursalService.ts` - Sucursal CRUD operations
  - getByEmpresa(), getById()
  - create(), update(), setPrincipal(), delete()

- `src/services/usuarioEmpresaService.ts` - User-empresa assignments
  - getByUsuario(), getByEmpresa(), getById()
  - assign(), update(), deactivate(), reactivate()
  - changeRole(), delete()

**Updated Services:**
- `src/api/authApi.ts` - Added:
  - empresaId, sucursalId, esSuperAdmin to LoginResponse
  - selectTenant() endpoint

### 4. Components

**New Components:**
- `src/components/Tenant/TenantSelector.tsx` + CSS
  - Select empresa/sucursal
  - Apply tenant changes
  - Shows super admin badge

- `src/components/Tenant/TenantInfo.tsx` + CSS
  - Display current empresa/sucursal in navbar
  - Shows super admin badge
  - Compact display for mobile

- `src/components/Admin/EmpresasPage.tsx` + CSS
  - Full CRUD for empresas
  - Suspend/reactivate empresas
  - Modal for create/edit

- `src/components/Admin/SucursalesPage.tsx`
  - Full CRUD for sucursales
  - Filter by empresa
  - Set principal branch

### 5. Utilities

**New Files:**
- `src/utils/permissions.ts` - Permission helper functions:
  - `canAccessMultipleEmpresas()`
  - `canManageEmpresas()`
  - `canManageSucursales()`
  - `canViewConsolidatedReports()`
  - `canManageUsuarios()`
  - `hasAccessToSucursal()`
  - `hasAccessToEmpresa()`
  - `isSuperAdmin()`, `isAdminEmpresa()`, `isGerenteSucursal()`
  - `getRoleDisplayName()`
  - `hasAnyRole()`, `hasAllRoles()`

**Updated Files:**
- `src/components/Auth/ProtectedRoute.tsx` - Added multi-tenant role checks:
  - `requireSuperAdmin` prop
  - `requireAdminEmpresa` prop
  - `requireGerenteSucursal` prop

### 6. App Integration

**Updated Files:**
- `src/App.tsx` - Wrapped app with TenantProvider

## 📂 File Structure

```
src/
├── types/
│   ├── auth.types.ts              [NEW]
│   ├── tenant.types.ts            [NEW]
│   └── index.ts                   [UPDATED]
├── context/
│   ├── TenantContext.tsx          [NEW]
│   └── AuthContext.tsx            [UPDATED]
├── services/
│   ├── empresaService.ts          [NEW]
│   ├── sucursalService.ts         [NEW]
│   └── usuarioEmpresaService.ts   [NEW]
├── components/
│   ├── Tenant/
│   │   ├── TenantSelector.tsx     [NEW]
│   │   ├── TenantSelector.css     [NEW]
│   │   ├── TenantInfo.tsx         [NEW]
│   │   ├── TenantInfo.css         [NEW]
│   │   └── index.ts               [NEW]
│   ├── Admin/
│   │   ├── EmpresasPage.tsx       [NEW]
│   │   ├── EmpresasPage.css       [NEW]
│   │   └── SucursalesPage.tsx     [NEW]
│   └── Auth/
│       └── ProtectedRoute.tsx     [UPDATED]
├── utils/
│   └── permissions.ts             [NEW]
├── api/
│   └── authApi.ts                 [UPDATED]
└── App.tsx                        [UPDATED]
```

## 🔑 Key Features

### Multi-Tenant Roles

1. **SUPER_ADMIN** - Full system access, all empresas
2. **ADMIN_EMPRESA** - Manages all sucursales within empresa
3. **GERENTE_SUCURSAL** - Manages specific sucursal
4. **SUPERVISOR** - Limited permissions within sucursal
5. **USUARIO_SUCURSAL** - Basic user access

### Data Isolation

- All entities now include `empresaId` field
- Some entities also include `sucursalId` (Empleado, Vehiculo)
- Backend automatically filters data by tenant context in JWT

### Tenant Switching

Users can switch between empresas/sucursales:
1. Call `/api/auth/select-tenant` endpoint
2. Receive new JWT with updated tenant context
3. Frontend stores new tokens and tenant info
4. Page reloads to refresh all data

## 🚀 Usage Examples

### Using TenantContext

```tsx
import { useTenant } from '../context/TenantContext';

function MyComponent() {
  const { empresaId, sucursalId, empresaActual, cambiarTenant } = useTenant();

  // Switch tenant
  const handleChange = async () => {
    await cambiarTenant(newEmpresaId, newSucursalId);
  };
}
```

### Using Permission Utilities

```tsx
import { canManageEmpresas, isSuperAdmin } from '../utils/permissions';

function AdminPanel() {
  const user = getAuthUser(); // from context

  if (!canManageEmpresas(user)) {
    return <AccessDenied />;
  }

  return <EmpresasPage />;
}
```

### Protected Routes with Multi-Tenant

```tsx
<Route
  path="/admin/empresas"
  element={
    <ProtectedRoute requireSuperAdmin>
      <EmpresasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/sucursales"
  element={
    <ProtectedRoute requireAdminEmpresa>
      <SucursalesPage />
    </ProtectedRoute>
  }
/>
```

### Display Tenant Info in Navbar

```tsx
import { TenantInfo } from '../components/Tenant';

function Navbar() {
  return (
    <nav>
      <div className="navbar-content">
        {/* Other nav items */}
        <TenantInfo />
      </div>
    </nav>
  );
}
```

## 📝 Next Steps

To complete the multi-tenant integration, you should:

1. **Add routes** for new pages in your routing configuration:
   ```tsx
   <Route path="/admin/empresas" element={<EmpresasPage />} />
   <Route path="/admin/sucursales" element={<SucursalesPage />} />
   ```

2. **Add TenantInfo to your navbar/header component**

3. **Add TenantSelector** where users need to switch empresas/sucursales

4. **Update existing entity creation forms** to include/handle empresaId

5. **Test the multi-tenant flow**:
   - Login with different users
   - Switch between empresas/sucursales
   - Verify data isolation

## ⚠️ Important Notes

- The backend must be running with multi-tenant support
- JWT tokens now include `empresaId` and `sucursalId` claims
- All API calls automatically include tenant context from JWT
- Switching tenants triggers a page reload to refresh all data
- LocalStorage stores: `empresaId`, `sucursalId`, `esSuperAdmin`

## 🔧 Configuration

Make sure your environment variables are set:

```env
VITE_API_URL=http://localhost:8080
```

The default API base URL is `http://localhost:8080/api`

---

**Implementation Date:** November 29, 2025
**Status:** ✅ Complete
**Version:** 2.0 - Multi-Tenant
