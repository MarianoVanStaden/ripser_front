# Fix Aplicado: SuperAdmin Detection

## 🔴 Problema Identificado

El usuario con username `'admin'` tiene asignado el rol `'SUPER_ADMIN'` en la tabla `usuario_empresa`, **PERO** el backend está devolviendo `esSuperAdmin: false` durante el login.

### Evidencia de los Logs:
```javascript
// Login response del backend
AuthContext.tsx:80 🔍 Login response: {
  username: 'admin',
  esSuperAdmin: false,  // ❌ INCORRECTO
  ...
}

// Pero la relación usuario-empresa SÍ tiene el rol correcto
TenantContext.tsx:142 ✅ Relación actual encontrada: {
  rol: 'SUPER_ADMIN',  // ✅ CORRECTO
  ...
}
```

## ✅ Solución Aplicada (Frontend)

Hemos implementado una solución temporal en el frontend que detecta automáticamente si el usuario tiene rol `SUPER_ADMIN` basándose en sus asignaciones de usuario-empresa.

### Cambios Realizados:

#### 1. TenantContext.tsx (líneas 146-155)

Agregamos detección automática cuando se carga la relación usuario-empresa:

```typescript
if (relacionActual.rol === 'SUPER_ADMIN') {
  console.log('🔑 Usuario tiene rol SUPER_ADMIN, actualizando esSuperAdmin a true');
  setEsSuperAdmin(true);
  localStorage.setItem('esSuperAdmin', 'true');
  // Disparar evento para sincronizar con AuthContext
  window.dispatchEvent(new CustomEvent('tenant-context-updated', {
    detail: { empresaId, sucursalId, esSuperAdmin: true }
  }));
}
```

**Qué hace:**
- Detecta si el `rol` de la relación usuario-empresa es `'SUPER_ADMIN'`
- Actualiza el estado local `esSuperAdmin` a `true`
- Guarda en localStorage para persistencia
- Dispara un evento personalizado para sincronizar con AuthContext

#### 2. AuthContext.tsx (líneas 176-190)

Agregamos un listener para el evento del TenantContext:

```typescript
useEffect(() => {
  const handleTenantUpdate = (event: Event) => {
    const customEvent = event as CustomEvent;
    const detail = customEvent.detail;

    if (detail && detail.esSuperAdmin !== undefined) {
      console.log('🔑 AuthContext: Actualizando esSuperAdmin desde TenantContext:', detail.esSuperAdmin);
      setEsSuperAdmin(detail.esSuperAdmin);
    }
  };

  window.addEventListener('tenant-context-updated', handleTenantUpdate);
  return () => window.removeEventListener('tenant-context-updated', handleTenantUpdate);
}, []);
```

**Qué hace:**
- Escucha el evento `'tenant-context-updated'`
- Actualiza el estado `esSuperAdmin` en AuthContext cuando recibe el evento
- Mantiene ambos contextos sincronizados

---

## 🎯 Resultado Esperado

Después de este fix:

1. ✅ Usuario hace login con `username: 'admin'`
2. ✅ Backend devuelve `esSuperAdmin: false` (incorrecto, pero tolerado)
3. ✅ Frontend carga relación usuario-empresa y detecta `rol: 'SUPER_ADMIN'`
4. ✅ Frontend automáticamente actualiza `esSuperAdmin` a `true`
5. ✅ Ambos contextos (AuthContext y TenantContext) se sincronizan
6. ✅ Botón "Nueva Empresa" aparece en `/admin/empresas`
7. ✅ TenantSelector carga TODAS las empresas activas
8. ✅ SuperAdmin puede cambiar contexto entre empresas

---

## 📝 Logs de Verificación

Después del fix, deberías ver estos logs en la consola:

```javascript
// 1. Login inicial
🔍 Login response: { esSuperAdmin: false, ... }
✅ isSuperAdmin determinado: false

// 2. Carga de relación usuario-empresa
✅ Relación actual encontrada: { rol: 'SUPER_ADMIN', ... }

// 3. Detección automática (NUEVO)
🔑 Usuario tiene rol SUPER_ADMIN, actualizando esSuperAdmin a true

// 4. Sincronización con AuthContext (NUEVO)
🔑 AuthContext: Actualizando esSuperAdmin desde TenantContext: true

// 5. EmpresasPage detecta SuperAdmin
🏢 EmpresasPage mounted: { esSuperAdmin: true, ... }
🔑 SuperAdmin: Showing all 3 empresas

// 6. TenantSelector detecta SuperAdmin
🔍 TenantSelector loadEmpresas: { esSuperAdmin: true, ... }
🔑 Super Admin: Loading ALL empresas...
✅ Loaded 3 empresas for SuperAdmin
```

---

## ⚠️ Nota Importante: Backend Fix Required

**Este es un fix TEMPORAL en el frontend.** El problema real está en el backend.

### Backend debe corregir:

El endpoint `/api/auth/login` debe revisar la lógica que determina `esSuperAdmin`.

**Archivo del backend a revisar** (probablemente):
- `AuthController.java` o `AuthService.java`
- Método que maneja el login

**Lógica correcta del backend:**
```java
// Al hacer login, verificar si el usuario tiene rol SUPER_ADMIN
boolean esSuperAdmin = false;

// Obtener todas las relaciones usuario-empresa del usuario
List<UsuarioEmpresa> relaciones = usuarioEmpresaRepository
    .findByUsuarioId(usuario.getId());

// Verificar si alguna relación tiene rol SUPER_ADMIN
for (UsuarioEmpresa relacion : relaciones) {
    if (relacion.getRol() == RolEmpresa.SUPER_ADMIN) {
        esSuperAdmin = true;
        break;
    }
}

// Incluir en la respuesta del login
LoginResponse response = new LoginResponse();
response.setEsSuperAdmin(esSuperAdmin);
// ...
```

**Alternativa más simple:**
```java
boolean esSuperAdmin = usuarioEmpresaRepository
    .existsByUsuarioIdAndRol(usuario.getId(), RolEmpresa.SUPER_ADMIN);
```

---

## 🧪 Cómo Probar

1. **Limpiar caché**:
```javascript
// En consola del navegador
localStorage.clear();
window.location.reload();
```

2. **Login como admin**:
- Usuario: `admin`
- Password: `000`

3. **Verificar en consola** que aparezcan los logs de detección:
```
🔑 Usuario tiene rol SUPER_ADMIN, actualizando esSuperAdmin a true
🔑 AuthContext: Actualizando esSuperAdmin desde TenantContext: true
```

4. **Navegar a `/admin/empresas`**:
- Debe aparecer el botón "Nueva Empresa"
- Debe listar TODAS las empresas

5. **Navegar a `/admin/tenant-selector`**:
- Debe mostrar badge "SUPER ADMIN"
- Debe listar TODAS las empresas activas
- Debe permitir cambiar entre empresas

---

## 📊 Estado Actual

- ✅ Frontend: **CORREGIDO** (detección automática implementada)
- ⚠️ Backend: **PENDIENTE DE CORRECCIÓN**

El frontend ahora funciona correctamente para SuperAdmin, pero es recomendable corregir el backend para que devuelva el valor correcto desde el inicio.

---

## 🔄 Rollback (si es necesario)

Si necesitas revertir estos cambios:

### TenantContext.tsx
Eliminar líneas 146-155:
```typescript
// 🔥 FIX: Detectar automáticamente si es SuperAdmin...
if (relacionActual.rol === 'SUPER_ADMIN') {
  // ... todo este bloque
}
```

### AuthContext.tsx
Eliminar líneas 176-190:
```typescript
// 🔥 FIX: Escuchar eventos del TenantContext...
useEffect(() => {
  // ... todo este bloque
}, []);
```

---

**Fecha del fix**: 2025-12-18
**Versión**: 1.0 (Temporal - requiere fix del backend)
