# 🎯 How to Access Multi-Tenant Features

## ✅ What's Been Added

I've integrated the multi-tenant features into your application. Here's how to access them:

## 📍 Where to Find the Features

### 1. **In the Sidebar Menu**

Look for the **"ADMINISTRACIÓN"** section in your sidebar. You'll now see:

- 🏢 **Empresas** - Manage companies
- 🏦 **Sucursales** - Manage branches
- 🔄 **Cambiar Contexto** - Switch between companies/branches
- 👥 **Usuarios** - Manage users
- ⚙️ **Roles** - Manage roles
- ⚙️ **Configuración** - Settings

### 2. **Direct URLs**

You can also access these pages directly:

- **Manage Companies:** `http://localhost:5173/admin/empresas`
- **Manage Branches:** `http://localhost:5173/admin/sucursales`
- **Switch Context:** `http://localhost:5173/admin/tenant-selector`

## 🚀 Getting Started

### Step 1: Create Your First Empresa

1. Click on **"Empresas"** in the sidebar
2. Click **"Nueva Empresa"** button
3. Fill in the form:
   - Nombre (required)
   - CUIT, Razón Social, Email, etc. (optional)
   - Estado: ACTIVO
4. Click **"Crear"**

### Step 2: Create Sucursales

1. Click on **"Sucursales"** in the sidebar
2. Select your empresa from the dropdown
3. Click **"Nueva Sucursal"** button
4. Fill in the form:
   - Código (required) - e.g., "SUC001"
   - Nombre (required) - e.g., "Sucursal Centro"
   - Address, phone, email (optional)
   - Check "Sucursal Principal" if this is the main branch
   - Estado: ACTIVO
5. Click **"Crear"**

### Step 3: Assign Users to Empresas

This requires backend implementation of the user assignment endpoints, but the UI is ready at:
- The usuarioEmpresaService is implemented
- You can call these endpoints from your code

### Step 4: Switch Between Empresas/Sucursales

1. Click on **"Cambiar Contexto"** in the sidebar
2. Select an empresa from the dropdown
3. Optionally select a sucursal
4. Click **"Aplicar Cambios"**
5. The page will reload with the new tenant context

## 🎨 Optional: Add Tenant Info to Header

To show the current empresa/sucursal in your header/navbar, add the `TenantInfo` component.

### Example Integration:

```tsx
// In your Layout.tsx or Header component
import { TenantInfo } from './components/Tenant';

// Then add it to your toolbar/header:
<Toolbar>
  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
    Ripser ERP
  </Typography>

  {/* Add this line: */}
  <TenantInfo />

  {/* Your other header items (user menu, notifications, etc.) */}
</Toolbar>
```

The TenantInfo component will display:
- 🛡️ **SUPER ADMIN** badge (if applicable)
- 🏢 Current empresa name
- 📍 Current sucursal name (if selected)

## 🔐 Permissions & Roles

The system now supports 5 role levels:

1. **SUPER_ADMIN** - Full system access, all empresas
2. **ADMIN_EMPRESA** - Manages all sucursales within their empresa
3. **GERENTE_SUCURSAL** - Manages specific sucursal only
4. **SUPERVISOR** - Limited permissions within sucursal
5. **USUARIO_SUCURSAL** - Basic user access

### Protected Routes

You can protect routes based on multi-tenant roles:

```tsx
// Require super admin
<Route
  path="/admin/empresas"
  element={
    <ProtectedRoute requireSuperAdmin>
      <EmpresasPage />
    </ProtectedRoute>
  }
/>

// Require empresa admin or higher
<Route
  path="/admin/sucursales"
  element={
    <ProtectedRoute requireAdminEmpresa>
      <SucursalesPage />
    </ProtectedRoute>
  }
/>
```

## 🧪 Testing the Features

1. **Start your backend** (make sure it has multi-tenant support)
2. **Start your frontend:** `npm run dev`
3. **Login** to your application
4. **Navigate to** "Administración" → "Empresas"
5. **Create** a test empresa
6. **Create** test sucursales for that empresa
7. **Try switching** between them using "Cambiar Contexto"

## 📊 What Happens When You Switch Tenant?

When you switch empresa/sucursal:

1. A request is sent to `/api/auth/select-tenant`
2. Backend generates a **new JWT** with updated `empresaId` and `sucursalId`
3. Frontend saves new tokens to localStorage
4. **Page reloads** to refresh all data with new tenant context
5. All subsequent API calls filter data by the new tenant

## 🔧 Troubleshooting

### "Cannot find empresas"
- Make sure your backend is running
- Check that `/api/empresas` endpoint exists
- Verify your auth token is valid

### "Cannot create empresa"
- Check you have SUPER_ADMIN permissions
- Verify backend validation rules
- Check browser console for errors

### "Cannot switch tenant"
- Make sure `/api/auth/select-tenant` endpoint exists
- Verify the empresa/sucursal IDs are valid
- Check that your user has access to that empresa

## 📝 Next Steps

1. **Implement user-empresa assignments** in your backend
2. **Add TenantInfo** to your header/navbar
3. **Test data isolation** - create data in different empresas
4. **Set up role-based permissions** for your users
5. **Add multi-tenant filtering** to existing pages

## 💡 Tips

- The **Empresas** page shows all companies and their status
- The **Sucursales** page filters by empresa - select one first
- **Cambiar Contexto** allows switching without logging out
- All data is **automatically filtered** by tenant in backend
- Use **localStorage** to check current tenant:
  ```js
  console.log({
    empresaId: localStorage.getItem('empresaId'),
    sucursalId: localStorage.getItem('sucursalId'),
    esSuperAdmin: localStorage.getItem('esSuperAdmin')
  });
  ```

---

**Need help?** Check the [MULTI_TENANT_IMPLEMENTATION.md](./MULTI_TENANT_IMPLEMENTATION.md) for full technical details.
